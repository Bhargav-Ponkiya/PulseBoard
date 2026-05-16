import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { RabbitMQModule } from '@app/rabbitmq';
import {
  DatabaseModule,
  Incident,
  AlertChannel,
  Log,
  LogSchema,
  Metric,
  MetricSchema,
} from '@app/database';
import { CryptoService } from './crypto/crypto.service';
import { GithubService } from './github/github.service';
import { AiService } from './ai/ai.service';
import { WebhookService } from './webhooks/webhook.service';
import { AlertConsumer } from './alert/alert.consumer';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RabbitMQModule,
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: Metric.name, schema: MetricSchema },
    ]),
    TypeOrmModule.forFeature([Incident, AlertChannel]),
  ],
  controllers: [HealthController],
  providers: [
    CryptoService,
    GithubService,
    AiService,
    WebhookService,
    AlertConsumer,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) =>
        new Redis(configService.getOrThrow<string>('REDIS_URL')),
      inject: [ConfigService],
    },
  ],
})
export class AlertModule {}
