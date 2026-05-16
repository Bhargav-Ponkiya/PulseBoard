import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { MonitorConfig } from './interfaces/monitor-config.interface';
import { PollerService } from './poller.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly monitors = new Map<string, MonitorConfig>();
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    public readonly pollerService: PollerService,
  ) {}

  /** Loads all active monitors from the API Gateway on startup. */
  async onModuleInit(): Promise<void> {
    await this.loadAllMonitors();
  }

  /** Fetches active monitors from the API Gateway with retry logic and registers them. */
  private async loadAllMonitors(): Promise<void> {
    const apiGatewayUrl =
      this.configService.getOrThrow<string>('API_GATEWAY_URL');
    const internalSecret =
      this.configService.getOrThrow<string>('INTERNAL_SECRET');

    const maxRetries = 10;
    const retryDelayMs = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get<{ success: boolean; data: MonitorConfig[] }>(
          `${apiGatewayUrl}/internal/monitors/active`,
          {
            headers: { 'X-Internal-Secret': internalSecret },
            timeout: 5000,
          },
        );

        const monitors = response.data?.data ?? [];

        for (const monitor of monitors) {
          this.registerMonitor(monitor);
        }

        this.logger.log(`Loaded ${monitors.length} monitors, starting polling`);
        return;
      } catch (err) {
        if (attempt < maxRetries) {
          this.logger.warn(
            `Failed to load monitors (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        } else {
          this.logger.error(
            'Failed to load monitors from API Gateway after all retries. Poller will wait for config events.',
            err instanceof Error ? err.message : err,
          );

          this.retryTimer = setInterval(() => {
            this.loadAllMonitors();
          }, 60000);
        }
      }
    }
  }

  /** Registers a monitor's polling interval in the scheduler. */
  registerMonitor(monitor: MonitorConfig): void {
    if (this.monitors.has(monitor.id)) {
      return;
    }

    if (!monitor.isActive) {
      this.logger.warn(`Monitor ${monitor.id} is inactive, skipping registration`);
      return;
    }

    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }

    void this.pollerService.pingMonitor(monitor).catch((err) =>
      this.logger.error(`Initial ping failed for monitor ${monitor.id}`, err),
    );

    const interval = setInterval(() => {
      this.pollerService.pingMonitor(monitor).catch((err) =>
        this.logger.error(`Ping failed for monitor ${monitor.id}`, err),
      );
    }, monitor.intervalSeconds * 1000);

    this.schedulerRegistry.addInterval(`monitor:${monitor.id}`, interval);
    this.monitors.set(monitor.id, monitor);

    this.logger.log(`Registered monitor ${monitor.id} (${monitor.url})`);
  }

  /** Removes a monitor's polling interval from the scheduler. */
  unregisterMonitor(monitorId: string): void {
    if (!this.monitors.has(monitorId)) {
      return;
    }

    try {
      this.schedulerRegistry.deleteInterval(`monitor:${monitorId}`);
    } catch {
      this.logger.warn(`Interval for monitor ${monitorId} already removed`);
    }
    this.monitors.delete(monitorId);

    this.logger.log(`Unregistered monitor ${monitorId}`);
  }

  /** Replaces an existing monitor's schedule with updated configuration. */
  updateMonitor(monitor: MonitorConfig): void {
    this.unregisterMonitor(monitor.id);
    this.registerMonitor(monitor);
  }

  onModuleDestroy(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
