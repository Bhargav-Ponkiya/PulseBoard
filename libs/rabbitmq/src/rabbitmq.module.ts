import { Module, Global } from '@nestjs/common';
import { RabbitMQModule as NestRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { EXCHANGES, QUEUES, ROUTING_KEYS } from './rabbitmq.constants';

@Global()
@Module({
  imports: [
    NestRabbitMQModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('RABBITMQ_URL'),
        /**
         * Wait for a healthy connection before continuing bootstrap.
         * Increases timeout to 30s and enables auto-reconnect so the service
         * survives transient network blips and slow Docker starts.
         */
        connectionInitOptions: {
          wait: true,
          timeout: 30000,
          reject: false,
        },
        /**
         * amqp-connection-manager options: heartbeat prevents idle connections
         * from being dropped by firewalls; reconnectTimeInSeconds controls
         * retry interval on connection loss.
         */
        connectionManagerOptions: {
          heartbeatIntervalInSeconds: 60,
          reconnectTimeInSeconds: 5,
        },
        exchanges: [
          { name: EXCHANGES.CONFIG, type: 'fanout', durable: true },
          { name: EXCHANGES.TELEMETRY, type: 'topic', durable: true },
          { name: EXCHANGES.EVENTS, type: 'topic', durable: true },
          { name: EXCHANGES.DLX, type: 'topic', durable: true },
        ],
        queues: [
          {
            name: QUEUES.POLLER_CONFIG.name,
            options: {
              durable: true,
              deadLetterExchange: EXCHANGES.DLX,
              deadLetterRoutingKey: 'dlq',
            },
          },
          {
            name: QUEUES.INGESTOR_METRIC.name,
            options: {
              durable: true,
              deadLetterExchange: EXCHANGES.DLX,
              deadLetterRoutingKey: 'dlq',
            },
          },
          {
            name: QUEUES.INGESTOR_LOG.name,
            options: {
              durable: true,
              deadLetterExchange: EXCHANGES.DLX,
              deadLetterRoutingKey: 'dlq',
            },
          },
          {
            name: QUEUES.INGESTOR_RESOLVED.name,
            options: {
              durable: true,
              deadLetterExchange: EXCHANGES.DLX,
              deadLetterRoutingKey: 'dlq',
            },
          },
          {
            name: QUEUES.ALERTER_INCIDENT.name,
            options: {
              durable: true,
              deadLetterExchange: EXCHANGES.DLX,
              deadLetterRoutingKey: 'dlq',
            },
          },
          {
            name: QUEUES.ALERTER_RESOLVED.name,
            options: {
              durable: true,
              deadLetterExchange: EXCHANGES.DLX,
              deadLetterRoutingKey: 'dlq',
            },
          },
          {
            name: QUEUES.DLQ.name,
            options: { durable: true },
          },
        ],
        bindings: [
          {
            exchange: EXCHANGES.CONFIG,
            queue: QUEUES.POLLER_CONFIG.name,
            routingKey: '',
          },
          {
            exchange: EXCHANGES.TELEMETRY,
            queue: QUEUES.INGESTOR_METRIC.name,
            routingKey: ROUTING_KEYS.METRIC_RAW,
          },
          {
            exchange: EXCHANGES.TELEMETRY,
            queue: QUEUES.INGESTOR_LOG.name,
            routingKey: ROUTING_KEYS.LOG_RAW,
          },
          {
            exchange: EXCHANGES.EVENTS,
            queue: QUEUES.INGESTOR_RESOLVED.name,
            routingKey: ROUTING_KEYS.INCIDENT_RESOLVED,
          },
          {
            exchange: EXCHANGES.EVENTS,
            queue: QUEUES.ALERTER_INCIDENT.name,
            routingKey: ROUTING_KEYS.INCIDENT_TRIGGER,
          },
          {
            exchange: EXCHANGES.EVENTS,
            queue: QUEUES.ALERTER_RESOLVED.name,
            routingKey: ROUTING_KEYS.INCIDENT_RESOLVED,
          },
          {
            exchange: EXCHANGES.DLX,
            queue: QUEUES.DLQ.name,
            routingKey: 'dlq',
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [NestRabbitMQModule],
})
export class RabbitMQModule {}
