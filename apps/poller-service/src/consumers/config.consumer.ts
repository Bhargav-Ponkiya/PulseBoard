import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, QUEUES } from '@app/rabbitmq';
import { MonitorConfig } from '../interfaces/monitor-config.interface';
import { SchedulerService } from '../scheduler.service';

interface ConfigMessage {
  type:
    | 'MONITOR_CREATED'
    | 'MONITOR_UPDATED'
    | 'MONITOR_DELETED'
    | 'MONITOR_TOGGLED'
    | 'MONITOR_CHECK_NOW';
  monitor?: MonitorConfig;
  monitorId?: string;
  isActive?: boolean;
}

@Injectable()
export class ConfigConsumer {
  private readonly logger = new Logger(ConfigConsumer.name);

  constructor(private readonly schedulerService: SchedulerService) {}

  @RabbitSubscribe({
    exchange: EXCHANGES.CONFIG,
    queue: QUEUES.POLLER_CONFIG.name,
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      deadLetterExchange: EXCHANGES.DLX,
      deadLetterRoutingKey: 'dlq',
    },
  })
  /** Handles incoming monitor configuration changes from RabbitMQ. */
  handleConfigChange(payload: ConfigMessage): void {
    const { type, monitor, monitorId, isActive } = payload;

    this.logger.log(
      `Config event received: ${type} ${monitor?.id ?? monitorId ?? ''}`,
    );

    switch (type) {
      case 'MONITOR_CREATED':
        if (monitor) {
          this.schedulerService.registerMonitor(monitor);
        }
        break;

      case 'MONITOR_UPDATED':
        if (monitor) {
          if (monitor.isActive) {
            this.schedulerService.updateMonitor(monitor);
          } else {
            this.schedulerService.unregisterMonitor(monitor.id);
          }
        }
        break;

      case 'MONITOR_DELETED':
        if (monitorId) {
          this.schedulerService.unregisterMonitor(monitorId);
        }
        break;

      case 'MONITOR_TOGGLED':
        if (monitor) {
          if (monitor.isActive) {
            this.schedulerService.registerMonitor(monitor);
          } else {
            this.schedulerService.unregisterMonitor(monitor.id);
          }
        }
        break;

      case 'MONITOR_CHECK_NOW':
        if (monitor) {
          this.logger.log(`Manual check triggered for monitor ${monitor.id}`);
          void this.schedulerService.pollerService.pingMonitor(monitor);
        }
        break;

      default:
        this.logger.warn(`Unknown config event type: ${String(type)}`);
    }
  }
}
