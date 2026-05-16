import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import Redis from 'ioredis';
import axios from 'axios';
import { IncidentPayload } from '@app/common';
import { Incident, IncidentStatus, AlertChannel, Log, Metric } from '@app/database';
import { EXCHANGES, QUEUES, ROUTING_KEYS } from '@app/rabbitmq';
import { AiService } from '../ai/ai.service';
import { GithubService, GitCommit } from '../github/github.service';
import { WebhookService } from '../webhooks/webhook.service';

interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
}

interface MonitorResponse {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type: string;
}

interface UserResponse {
  id: string;
  githubAccessToken: string | null;
}

interface ProjectResponse {
  id: string;
  userId: string;
  name: string;
  slug: string;
  githubRepo: string | null;
  user: UserResponse;
}

interface ApiWrapper<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class AlertConsumer {
  private readonly logger = new Logger(AlertConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
    private readonly githubService: GithubService,
    private readonly webhookService: WebhookService,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(AlertChannel)
    private readonly alertChannelRepository: Repository<AlertChannel>,
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
    @InjectModel(Metric.name)
    private readonly metricModel: Model<Metric>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private readonly severityMap: Record<string, 'critical' | 'major' | 'minor'> = {
    low: 'minor',
    medium: 'minor',
    high: 'major',
    critical: 'critical',
  };

  @RabbitSubscribe({
    exchange: EXCHANGES.EVENTS,
    routingKey: ROUTING_KEYS.INCIDENT_TRIGGER,
    queue: QUEUES.ALERTER_INCIDENT.name,
    createQueueIfNotExists: false,
  })
  /** Processes a DOWN incident trigger: fetches context, generates AI report, saves incident, dispatches alerts. */
  async handleIncidentTrigger(payload: IncidentPayload): Promise<void> {
    let incident: Incident;
    let report: Record<string, unknown>;

    try {
      // Atomic NX SET prevents duplicate incidents even under concurrent triggers.
      // If another consumer already holds the cooldown key, this returns null and we bail out.
      const acquiredCooldown = await this.redis.set(
        `incident:cooldown:${payload.monitorId}`,
        '1',
        'EX',
        30,
        'NX',
      );
      if (!acquiredCooldown) {
        this.logger.warn(
          `Incident cooldown active for monitor ${payload.monitorId}, skipping duplicate trigger`,
        );
        return;
      }

      const existingIncident = await this.incidentRepository.findOne({
        where: {
          monitorId: payload.monitorId,
          status: IncidentStatus.OPEN,
        },
      });

      if (existingIncident) {
        this.logger.warn(
          `Open incident already exists for monitor ${payload.monitorId}, skipping duplicate`,
        );
        // Release cooldown so future triggers are not permanently blocked by a stale key
        await this.redis.del(`incident:cooldown:${payload.monitorId}`).catch(() => {});
        return;
      }

      const apiGatewayUrl =
        this.configService.getOrThrow<string>('API_GATEWAY_URL');
      const internalSecret =
        this.configService.getOrThrow<string>('INTERNAL_SECRET');
      const headers = { 'X-Internal-Secret': internalSecret };

      const monitorResp = await axios.get<ApiWrapper<MonitorResponse>>(
        `${apiGatewayUrl}/internal/monitors/${payload.monitorId}`,
        { headers, timeout: 10000 },
      );
      const monitor = monitorResp.data.data;

      const projectResp = await axios.get<ApiWrapper<ProjectResponse>>(
        `${apiGatewayUrl}/internal/projects/${monitor.projectId}`,
        { headers, timeout: 10000 },
      );
      const project = projectResp.data.data;

      const oneHourAgo = new Date(Date.now() - 3600000);
      const errorLogs = await this.logModel
        .find({
          projectId: payload.projectId,
          level: 'error',
          timestamp: { $gte: oneHourAgo },
        })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean()
        .exec();

      const logsSnapshot: LogEntry[] = errorLogs.map((l: LogEntry) => ({
        level: l.level,
        message: l.message,
        timestamp: l.timestamp,
      }));

      const latestMetric = await this.metricModel
        .findOne({ monitorId: payload.monitorId })
        .sort({ timestamp: -1 })
        .lean()
        .exec();
      const actualErrorCode = latestMetric?.errorCode ?? payload.status;

      let commits: GitCommit[] = [];
      if (project.githubRepo && project.user?.githubAccessToken) {
        commits = await this.githubService.getRecentCommits(
          project.githubRepo,
          project.user.githubAccessToken,
        );
      }

      const reportResult = await this.aiService.generateIncidentReport({
        monitor: { name: monitor.name, url: monitor.url },
        errorCode: actualErrorCode,
        commits,
        logs: logsSnapshot,
      });
      report = reportResult as unknown as Record<string, unknown>;

      const startedAt = payload.startedAt ?? new Date();
      const mappedSeverity = this.severityMap[reportResult.severity] || 'major';

      incident = this.incidentRepository.create({
        monitorId: payload.monitorId,
        projectId: payload.projectId,
        status: IncidentStatus.OPEN,
        severity: mappedSeverity,
        startedAt,
        aiReport: JSON.stringify(reportResult),
        rootCause: reportResult.probable_cause,
        githubCommits: commits as unknown as Record<string, unknown>[],
        affectedLogs: logsSnapshot as unknown as Record<string, unknown>[],
      } as Partial<Incident>);

      await this.incidentRepository.save(incident);

      const alertChannels = await this.alertChannelRepository.find({
        where: { projectId: payload.projectId, isActive: true },
      });

      const monitorInfo = { name: monitor.name, url: monitor.url };

      await Promise.allSettled(
        alertChannels.map((channel) =>
          this.webhookService.dispatch(channel, monitorInfo, reportResult),
        ),
      );
    } catch (err) {
      this.logger.error(
        `Failed to process incident trigger for monitor ${payload.monitorId}`,
        err,
      );
      return;
    }

    try {
      await this.redis.publish(
        `live:stream:${payload.projectId}`,
        JSON.stringify({
          type: 'INCIDENT',
          incidentId: incident.id,
          rootCause: report.probable_cause as string,
          severity: report.severity as string,
        }),
      );
    } catch (redisErr) {
      this.logger.error('Failed to publish incident to Redis live stream', redisErr);
    }
  }

  @RabbitSubscribe({
    exchange: EXCHANGES.EVENTS,
    routingKey: ROUTING_KEYS.INCIDENT_RESOLVED,
    queue: QUEUES.ALERTER_RESOLVED.name,
    createQueueIfNotExists: false,
  })
  /** Marks an open incident as resolved and publishes a live stream event. */
  async handleIncidentResolved(payload: {
    monitorId: string;
    projectId: string;
    resolvedAt?: string;
  }): Promise<void> {
    try {
      const incident = await this.incidentRepository.findOne({
        where: {
          monitorId: payload.monitorId,
          status: IncidentStatus.OPEN,
        },
        order: { startedAt: 'DESC' },
      });

      if (!incident) {
        return;
      }

      const resolvedAt = payload.resolvedAt
        ? new Date(payload.resolvedAt)
        : new Date();
      const durationSeconds = Math.floor(
        (resolvedAt.getTime() - incident.startedAt.getTime()) / 1000,
      );

      incident.status = IncidentStatus.RESOLVED;
      incident.resolvedAt = resolvedAt;
      incident.durationSeconds = durationSeconds;
      await this.incidentRepository.save(incident);

      await this.redis.publish(
        `live:stream:${payload.projectId}`,
        JSON.stringify({
          type: 'RESOLVED',
          monitorId: payload.monitorId,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to process incident resolved for monitor ${payload.monitorId}`,
        err,
      );
    }
  }
}
