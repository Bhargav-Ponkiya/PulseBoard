import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Incident, Log } from '@app/database';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectRepository(Incident) private readonly incidentRepository: Repository<Incident>,
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
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

    try {
      await this.incidentRepository.query('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }

    checks.mongodb = this.logModel.db.readyState === 1 ? 'ok' : 'disconnected';

    checks.rabbitmq = this.amqpConnection.connected ? 'ok' : 'error';

    const allOk = Object.values(checks).every((s) => s === 'ok');
    return { status: allOk ? 'ok' : 'degraded', checks };
  }
}
