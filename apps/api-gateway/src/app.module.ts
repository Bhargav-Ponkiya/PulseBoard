import { Module, ValidationPipe, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DatabaseModule, Project } from '@app/database';
import { LoggerModule } from '@app/logger';
import { RabbitMQModule } from '@app/rabbitmq';
import {
  JwtGuard,
  HttpExceptionFilter,
  ResponseInterceptor,
} from '@app/common';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { MonitorsModule } from './monitors/monitors.module';
import { InternalModule } from './internal/internal.module';
import { HealthController } from './health/health.controller';
import { MetricsModule } from './metrics/metrics.module';
import { LogsModule } from './logs/logs.module';
import { SseModule } from './sse/sse.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AlertChannelsModule } from './alert-channels/alert-channels.module';
import { GithubModule } from './github/github.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([Project]),
    LoggerModule,
    RabbitMQModule,
    AuthModule,
    ProjectsModule,
    MonitorsModule,
    InternalModule,
    MetricsModule,
    LogsModule,
    SseModule,
    IncidentsModule,
    AlertChannelsModule,
    GithubModule,
    UsersModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) =>
        new Redis(configService.getOrThrow<string>('REDIS_URL')),
      inject: [ConfigService],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
