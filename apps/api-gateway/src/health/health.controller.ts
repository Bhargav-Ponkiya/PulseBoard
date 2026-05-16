import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Public } from '@app/common';
import { Project } from '@app/database';

@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
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
