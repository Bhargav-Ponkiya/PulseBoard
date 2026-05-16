import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Metric, Monitor, MonitorStatus } from '@app/database';
import { MetricPayload } from '@app/common';
import { EXCHANGES, QUEUES, ROUTING_KEYS } from '@app/rabbitmq';
import { CacheService } from '../cache/cache.service';

interface BufferEntry {
  doc: Record<string, unknown>;
  projectId: string;
}

@Injectable()
export class MetricsConsumer implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsConsumer.name);
  private buffer: BufferEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 500;

  constructor(
    @InjectModel(Metric.name)
    private readonly metricModel: Model<Metric>,
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    private readonly cacheService: CacheService,
  ) {}

  /** Flushes remaining metrics on shutdown and clears the flush timer. */
  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.buffer.length > 0) {
      await this.flush();
    }
  }

  @RabbitSubscribe({
    exchange: EXCHANGES.TELEMETRY,
    routingKey: ['metric.raw', 'metric.*', 'metric.#'],
    queue: QUEUES.INGESTOR_METRIC.name,
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      deadLetterExchange: EXCHANGES.DLX,
      deadLetterRoutingKey: 'dlq',
    },
  })
  /** Buffers an incoming metric and updates monitor status, flushing when batch threshold is met. */
  async handleMetric(payload: MetricPayload): Promise<void> {
    const doc: Record<string, unknown> = {
      monitorId: payload.monitorId,
      projectId: payload.projectId,
      status: payload.status,
      statusCode: payload.statusCode,
      latencyMs: payload.latencyMs,
      errorCode: payload.errorCode ?? null,
      timestamp: payload.timestamp ?? new Date(),
    };

    this.buffer.push({ doc, projectId: payload.projectId });

    if (payload.status === 'DOWN') {
      try {
        await this.monitorRepository.update(
          { id: payload.monitorId },
          { currentStatus: MonitorStatus.DOWN, lastCheckedAt: new Date() },
        );
      } catch (err) {
        this.logger.error(`Failed to set monitor ${payload.monitorId} status to DOWN`, err);
      }
    } else if (payload.status === 'UP') {
      try {
        await this.monitorRepository.update(
          { id: payload.monitorId },
          { currentStatus: MonitorStatus.UP, lastCheckedAt: new Date() },
        );
      } catch (err) {
        this.logger.error(`Failed to set monitor ${payload.monitorId} status to UP`, err);
      }
    }

    if (this.buffer.length >= this.BATCH_SIZE && !this.flushing) {
      await this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush().catch((err) =>
          this.logger.error('Metrics flush failed', err),
        );
      }, this.FLUSH_INTERVAL_MS);
    }
  }

  @RabbitSubscribe({
    exchange: EXCHANGES.EVENTS,
    routingKey: ROUTING_KEYS.INCIDENT_RESOLVED,
    queue: QUEUES.INGESTOR_RESOLVED.name,
    createQueueIfNotExists: false,
  })
  /** Handles incident resolved events and updates the monitor status to UP. */
  async handleResolved(payload: { monitorId: string }): Promise<void> {
    try {
      await this.monitorRepository
        .createQueryBuilder()
        .update(Monitor)
        .set({ currentStatus: MonitorStatus.UP, lastCheckedAt: new Date() })
        .where('id = :id AND currentStatus IN (:...statuses)', {
          id: payload.monitorId,
          statuses: [MonitorStatus.DOWN, MonitorStatus.PENDING],
        })
        .execute();
    } catch (err) {
      this.logger.error(
        `Failed to update monitor ${payload.monitorId} status to UP`,
        err,
      );
    }
  }

  /** Writes buffered metrics to MongoDB and publishes live stream updates. */
  private async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;

    this.flushing = true;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    let batch: BufferEntry[];
    batch = this.buffer.splice(0, this.BATCH_SIZE);

    const docs = batch.map((entry) => entry.doc);

    let insertedCount = docs.length;
    try {
      const result = await this.metricModel.insertMany(docs, { ordered: false });
      insertedCount = result.length;
    } catch (err) {
      const mongoError = err as { result?: { nInserted?: number } };
      insertedCount = mongoError.result?.nInserted ?? 0;
      if (insertedCount > 0) {
        this.logger.warn(`Partial insert: ${insertedCount}/${docs.length} metrics written`);
      } else {
        this.logger.error('Metric batch insert failed entirely', err);
        this.flushing = false;
        return;
      }
    }

    const projectIds = [...new Set(batch.map((entry) => entry.projectId))];
    for (const projectId of projectIds) {
      const projectDocs = batch.filter((e) => e.projectId === projectId);
      const latestMetric = projectDocs.sort(
        (a, b) => new Date(b.doc.timestamp as any).getTime() - new Date(a.doc.timestamp as any).getTime(),
      )[0];
      if (latestMetric) {
        try {
          await this.cacheService.publish(`live:stream:${projectId}`, {
            type: 'METRIC',
            ...latestMetric.doc,
          });
        } catch (publishErr) {
          this.logger.error(`Failed to publish live metric for project ${projectId}`, publishErr);
        }
      }
    }

    this.flushing = false;
  }
}
