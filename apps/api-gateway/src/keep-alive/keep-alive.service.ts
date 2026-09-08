import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Project } from '@app/database';

/**
 * KeepAliveService
 *
 * Proactively pings all free-tier external services on a schedule to prevent
 * them from being deleted due to inactivity.
 *
 * Free-tier deletion thresholds:
 *   - Upstash Redis  : 14 days without any commands
 *   - CloudAMQP      : ~30 days without connections
 *   - Render services: 15 minutes without HTTP traffic (handled by cron-job.org)
 *
 * This cron runs every 7 days — well within all thresholds.
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly amqpConnection: AmqpConnection,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /** Fires once on startup to immediately warm all connections. */
  async onModuleInit(): Promise<void> {
    await this.pingAllServices();
  }

  /**
   * Runs every 7 days at 00:00 UTC.
   * Pings Redis, RabbitMQ, and PostgreSQL to keep free-tier instances alive.
   */
  @Cron('0 0 */7 * *', { name: 'keep-alive', timeZone: 'UTC' })
  async pingAllServices(): Promise<void> {
    this.logger.log('🏓 Keep-alive ping started...');
    await Promise.allSettled([
      this.pingRedis(),
      this.pingRabbitMQ(),
      this.pingPostgres(),
    ]);
    this.logger.log('✅ Keep-alive ping finished.');
  }

  private async pingRedis(): Promise<void> {
    try {
      const pong = await this.redis.ping();
      this.logger.log(`Redis: ${pong}`);
    } catch (err) {
      this.logger.error(
        'Redis keep-alive failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private pingRabbitMQ(): void {
    try {
      const connected = this.amqpConnection.connected;
      this.logger.log(`RabbitMQ: ${connected ? 'connected' : 'disconnected'}`);
    } catch (err) {
      this.logger.error(
        'RabbitMQ keep-alive check failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async pingPostgres(): Promise<void> {
    try {
      await this.projectRepository.query('SELECT 1');
      this.logger.log('PostgreSQL: ok');
    } catch (err) {
      this.logger.error(
        'PostgreSQL keep-alive failed',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
