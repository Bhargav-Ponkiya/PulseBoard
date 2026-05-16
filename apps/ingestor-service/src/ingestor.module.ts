import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { RabbitMQModule } from '@app/rabbitmq';
import {
  DatabaseModule,
  Project,
  Monitor,
  Metric,
  MetricSchema,
  Log,
  LogSchema,
} from '@app/database';
import { MetricsConsumer } from './consumers/metrics.consumer';
import { LogsConsumer } from './consumers/logs.consumer';
import { IngestController } from './ingest/ingest.controller';
import { ApiKeyGuard } from './ingest/guards/api-key.guard';
import { CacheService } from './cache/cache.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RabbitMQModule,
    MongooseModule.forFeature([
      { name: Metric.name, schema: MetricSchema },
      { name: Log.name, schema: LogSchema },
    ]),
    TypeOrmModule.forFeature([Project, Monitor]),
  ],
  controllers: [IngestController, HealthController],
  providers: [
    MetricsConsumer,
    LogsConsumer,
    CacheService,
    ApiKeyGuard,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) =>
        new Redis(configService.getOrThrow<string>('REDIS_URL')),
      inject: [ConfigService],
    },
  ],
})
export class IngestorModule {}
