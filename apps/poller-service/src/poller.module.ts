import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Redis from 'ioredis';
import { RabbitMQModule } from '@app/rabbitmq';
import { PollerService } from './poller.service';
import { SchedulerService } from './scheduler.service';
import { ConfigConsumer } from './consumers/config.consumer';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RabbitMQModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [
    PollerService,
    SchedulerService,
    ConfigConsumer,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) =>
        new Redis(configService.getOrThrow<string>('REDIS_URL')),
      inject: [ConfigService],
    },
  ],
})
export class PollerModule {}
