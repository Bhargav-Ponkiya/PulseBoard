import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Request } from 'express';
import { EXCHANGES, ROUTING_KEYS } from '@app/rabbitmq';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CacheService } from '../cache/cache.service';
import { IngestLogDto } from './dto/ingest-log.dto';
import { IngestMetricDto } from './dto/ingest-metric.dto';

@UseGuards(ApiKeyGuard)
@Controller('ingest')
export class IngestController {
  private readonly RATE_LIMIT_MAX = 1000;
  private readonly RATE_LIMIT_WINDOW = 60;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly cacheService: CacheService,
  ) {}

  @Post('logs')
  @HttpCode(202)
  /** Accepts a log entry and publishes it to RabbitMQ for ingestion. */
  async ingestLog(
    @Body() dto: IngestLogDto,
    @Req() req: Request & { projectId?: string },
  ) {
    const projectId = req.projectId;

    await this.checkRateLimit(`rate:ingest:logs:${projectId}`);

    await this.amqpConnection.publish(
      EXCHANGES.TELEMETRY,
      ROUTING_KEYS.LOG_RAW,
      {
        projectId,
        level: dto.level,
        message: dto.message,
        metadata: dto.metadata ?? {},
        timestamp: new Date(),
      },
    );

    return { accepted: true };
  }

  @Post('metrics')
  @HttpCode(202)
  /** Accepts a metric entry and publishes it to RabbitMQ for ingestion. */
  async ingestMetric(
    @Body() dto: IngestMetricDto,
    @Req() req: Request & { projectId?: string },
  ) {
    const projectId = req.projectId;

    await this.checkRateLimit(`rate:ingest:metrics:${projectId}`);

    await this.amqpConnection.publish(
      EXCHANGES.TELEMETRY,
      ROUTING_KEYS.METRIC_RAW,
      {
        monitorId: dto.monitorId,
        projectId,
        status: dto.status,
        statusCode: dto.statusCode ?? 0,
        latencyMs: dto.latencyMs,
        errorCode: dto.errorCode ?? null,
        timestamp: new Date(),
      },
    );

    return { accepted: true };
  }

  /** Checks the request rate limit for the given key and throws if exceeded. */
  private async checkRateLimit(key: string): Promise<void> {
    const count = await this.cacheService.incr(key, this.RATE_LIMIT_WINDOW);

    if (count > this.RATE_LIMIT_MAX) {
      throw new HttpException(
        `Rate limit exceeded. Max ${this.RATE_LIMIT_MAX} requests per ${this.RATE_LIMIT_WINDOW} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
