import { Controller, Get, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
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
      if (this.amqpConnection.connected) {
        checks.rabbitmq = 'ok';
      } else {
        checks.rabbitmq = 'disconnected';
      }
    } catch {
      checks.rabbitmq = 'error';
    }

    const allOk = Object.values(checks).every((s) => s === 'ok');
    return {
      status: allOk ? 'ok' : 'degraded',
      checks,
    };
  }
}
