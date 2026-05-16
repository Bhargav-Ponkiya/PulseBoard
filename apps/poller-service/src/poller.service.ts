import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import Redis from 'ioredis';
import axios, { AxiosError } from 'axios';
import { MetricPayload, IncidentPayload } from '@app/common';
import { EXCHANGES, ROUTING_KEYS } from '@app/rabbitmq';
import { MonitorConfig } from './interfaces/monitor-config.interface';

@Injectable()
export class PollerService {
  private readonly logger = new Logger(PollerService.name);
  private readonly inFlightPings = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly amqpConnection: AmqpConnection,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /** Pings a monitor URL and publishes the metric result to RabbitMQ. */
  async pingMonitor(monitor: MonitorConfig): Promise<void> {
    if (this.inFlightPings.has(monitor.id)) {
      return;
    }

    this.inFlightPings.add(monitor.id);
    this.logger.debug(`Starting ping for monitor ${monitor.id} (${monitor.url})`);

    try {
      const startTime = Date.now();
      let status: 'UP' | 'DOWN';
      let statusCode: number;
      let errorCode: string | undefined;
      let latencyMs: number;

      try {
        const response = await axios.get(monitor.url, {
          timeout: monitor.timeoutMs,
          validateStatus: () => true,
          maxRedirects: 5,
        });

        latencyMs = Date.now() - startTime;
        statusCode = response.status;
        const isUp = response.status === monitor.expectedStatus;
        status = isUp ? 'UP' : 'DOWN';
        if (!isUp) {
          errorCode = 'UNEXPECTED_STATUS';
        }
      } catch (err) {
        const axiosError = err as AxiosError;
        latencyMs = Date.now() - startTime;
        statusCode = 0;
        status = 'DOWN';

        switch (axiosError.code) {
          case 'ECONNABORTED':
            errorCode = 'TIMEOUT';
            break;
          case 'ENOTFOUND':
            errorCode = 'DNS_FAILURE';
            break;
          case 'ECONNREFUSED':
            errorCode = 'CONNECTION_REFUSED';
            break;
          default:
            errorCode = 'UNKNOWN';
        }
      }

      const payload: MetricPayload = {
        monitorId: monitor.id,
        projectId: monitor.projectId,
        status,
        statusCode,
        latencyMs,
        errorCode,
        timestamp: new Date(),
      };

      try {
        await this.amqpConnection.publish(
          EXCHANGES.TELEMETRY,
          ROUTING_KEYS.METRIC_RAW,
          payload,
          { persistent: true },
        );
      } catch (pubErr) {
        this.logger.error(`Failed to publish metric for monitor ${monitor.id}`, pubErr);
      }

      const statusTtl = Math.max(120, monitor.intervalSeconds * 2);
      const currentStatus = await this.redis.get(`monitor:status:${monitor.id}`);

      await this.redis.set(`monitor:status:${monitor.id}`, status, 'EX', statusTtl);

      if (currentStatus !== status) {
        if (status === 'DOWN') {
          await this.handleDownDetected(monitor);
        } else {
          await this.handleUpDetected(monitor);
        }
      }
    } finally {
      this.inFlightPings.delete(monitor.id);
    }
  }

  /** Handles a DOWN status transition and triggers an incident event with debounce. */
  private async handleDownDetected(monitor: MonitorConfig): Promise<void> {
    try {
      const ttl30Days = 2592000;
      const wasSet = await this.redis.set(
        `incident:active:${monitor.id}`,
        '1',
        'EX',
        ttl30Days,
        'NX',
      );

      if (wasSet !== 'OK') {
        await this.redis.expire(`incident:active:${monitor.id}`, ttl30Days);
        return;
      }

      const incidentPayload: IncidentPayload = {
        monitorId: monitor.id,
        projectId: monitor.projectId,
        status: 'trigger',
        startedAt: new Date(),
      };

      await this.amqpConnection.publish(
        EXCHANGES.EVENTS,
        ROUTING_KEYS.INCIDENT_TRIGGER,
        incidentPayload,
        { persistent: true },
      );

      this.logger.warn(
        `Incident triggered for monitor ${monitor.id} (${monitor.url})`,
      );
    } catch (err) {
      this.logger.error(
        `Error in handleDownDetected for monitor ${monitor.id}`,
        err,
      );
    }
  }

  /** Handles an UP status transition and publishes a resolution event. */
  private async handleUpDetected(monitor: MonitorConfig): Promise<void> {
    try {
      const exists = await this.redis.get(`incident:active:${monitor.id}`);

      if (!exists) {
        return;
      }

      await this.redis.del(`incident:active:${monitor.id}`);

      const resolvedPayload = {
        monitorId: monitor.id,
        projectId: monitor.projectId,
        resolvedAt: new Date(),
      };

      await this.amqpConnection.publish(
        EXCHANGES.EVENTS,
        ROUTING_KEYS.INCIDENT_RESOLVED,
        resolvedPayload,
        { persistent: true },
      );

      this.logger.log(
        `Incident resolved for monitor ${monitor.id} (${monitor.url})`,
      );
    } catch (err) {
      this.logger.error(
        `Error in handleUpDetected for monitor ${monitor.id}`,
        err,
      );
    }
  }
}
