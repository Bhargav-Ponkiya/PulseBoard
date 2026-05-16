import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Metric } from '@app/database';
import { Project } from '@app/database';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectModel(Metric.name) private readonly metricModel: Model<Metric>,
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    checks.mongodb = this.metricModel.db.readyState === 1 ? 'ok' : 'disconnected';

    try {
      await this.projectRepository.query('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }

    checks.rabbitmq = this.amqpConnection.connected ? 'ok' : 'error';

    const allOk = Object.values(checks).every((s) => s === 'ok');
    return { status: allOk ? 'ok' : 'degraded', checks };
  }
}
