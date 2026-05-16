import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Metric, Monitor, Incident, IncidentStatus } from '@app/database';

interface AggregationResult {
  totalChecks: number;
  upCount: number;
  avgLatency: number;
  latestTimestamp: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectModel(Metric.name)
    private readonly metricModel: Model<Metric>,
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  /** Get a 24-hour summary of metrics for a project or monitor */
  async getSummary(projectId: string, monitorId?: string) {
    const match: Record<string, unknown> = { projectId };
    if (monitorId) {
      match.monitorId = monitorId;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    match.timestamp = { $gte: twentyFourHoursAgo };

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          totalChecks: { $sum: 1 },
          upCount: {
            $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] },
          },
          avgLatency: { $avg: '$latencyMs' },
          latestTimestamp: { $max: '$timestamp' },
        },
      },
    ];

    this.logger.debug(`Fetching summary for project ${projectId} with match: ${JSON.stringify(match)}`);

    const [result] = (await this.metricModel
      .aggregate(pipeline)
      .exec()) as AggregationResult[];

    const totalMonitors = await this.monitorRepository.count({
      where: { projectId, isActive: true },
    });

    if (!result) {
      this.logger.warn(`No metrics found for project ${projectId} in the last 24h`);
      return {
        uptime24h: 0,
        avgLatency: 0,
        totalChecks: 0,
        currentStatus: 'UNKNOWN',
        activeIncidents: 0,
        totalMonitors,
      };
    }

    this.logger.log(`Metrics summary found for project ${projectId}: ${result.totalChecks} checks, ${result.upCount} up`);

    const uptime24h =
      result.totalChecks > 0
        ? Math.round((result.upCount / result.totalChecks) * 100)
        : 0;

    let currentStatus = 'UNKNOWN';
    if (monitorId) {
      const monitor = await this.monitorRepository.findOne({
        where: { id: monitorId },
        select: ['currentStatus'],
      });
      currentStatus = monitor?.currentStatus ?? 'UNKNOWN';
    }

    const activeIncidents = await this.incidentRepository.count({
      where: { projectId, status: IncidentStatus.OPEN },
    });

    return {
      uptime24h,
      avgLatency: Math.round(result.avgLatency),
      totalChecks: result.totalChecks,
      currentStatus,
      activeIncidents,
      totalMonitors,
    };
  }

  /** Get chart data points for a project or monitor within a time window */
  async getChartData(projectId: string, monitorId?: string, hours = 24) {
    const match: Record<string, unknown> = { projectId };
    if (monitorId) {
      match.monitorId = monitorId;
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    match.timestamp = { $gte: since };

    const data = await this.metricModel
      .find(match)
      .sort({ timestamp: 1 })
      .limit(200)
      .lean()
      .exec();

    return data.map((d) => ({
      timestamp: d.timestamp,
      latencyMs: d.latencyMs,
      status: d.status,
      monitorId: d.monitorId,
    }));
  }

  /** Get current status and 24h uptime for all monitors in a project */
  async getMonitorsStatus(projectId: string) {
    const monitors = await this.monitorRepository.find({
      where: { projectId },
    });

    if (monitors.length === 0) {
      return [];
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          projectId,
          timestamp: { $gte: twentyFourHoursAgo },
        },
      },
      {
        $group: {
          _id: '$monitorId',
          totalChecks: { $sum: 1 },
          upCount: {
            $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] },
          },
          avgLatency: { $avg: '$latencyMs' },
        },
      },
    ];

    const results = await this.metricModel
      .aggregate<{ _id: string; totalChecks: number; upCount: number; avgLatency: number }>(pipeline)
      .exec();

    const summaryMap = new Map(
      results.map((r) => [
        r._id,
        {
          uptime24h: r.totalChecks > 0 ? Math.round((r.upCount / r.totalChecks) * 100) : 0,
          avgLatency: Math.round(r.avgLatency),
          totalChecks: r.totalChecks,
        },
      ]),
    );

    return monitors.map((monitor) => {
      const summary = summaryMap.get(monitor.id);
      return {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        currentStatus: monitor.currentStatus,
        isActive: monitor.isActive,
        lastCheckedAt: monitor.lastCheckedAt,
        uptimePercent: summary?.uptime24h ?? 0,
        avgLatency: summary?.avgLatency ?? 0,
      };
    });
  }
}
