import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Log } from '@app/database';
import { LogPayload } from '@app/common';
import { EXCHANGES, QUEUES } from '@app/rabbitmq';

@Injectable()
export class LogsConsumer {
  private readonly logger = new Logger(LogsConsumer.name);
  private readonly googleProvider;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.googleProvider = createGoogleGenerativeAI({ apiKey });
    }
  }

  @RabbitSubscribe({
    exchange: EXCHANGES.TELEMETRY,
    routingKey: ['log.raw', 'log.*', 'log.#'],
    queue: QUEUES.INGESTOR_LOG.name,
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      deadLetterExchange: EXCHANGES.DLX,
      deadLetterRoutingKey: 'dlq',
    },
  })
  /** Saves an incoming log to MongoDB and triggers asynchronous embedding generation. */
  async handleLog(payload: LogPayload): Promise<void> {
    const logDoc = {
      projectId: payload.projectId,
      level: payload.level,
      message: payload.message,
      metadata: payload.metadata ?? {},
      timestamp: payload.timestamp ?? new Date(),
    };

    let saved;
    try {
      saved = await this.logModel.create(logDoc);
    } catch (err) {
      this.logger.error('Failed to save log to MongoDB', err);
      return;
    }

    if (this.googleProvider && payload.message?.length > 2) {
      void this.generateAndSaveEmbedding(String(saved._id), payload.message);
    }
  }

  /** Generates a text embedding for the log message and persists it to MongoDB. */
  private async generateAndSaveEmbedding(
    logId: string,
    message: string,
  ): Promise<void> {
    try {
      if (!this.googleProvider) return;

      const { embedding } = await embed({
        model: this.googleProvider.embedding('text-embedding-004'),
        value: message,
      });

      await this.logModel.updateOne({ _id: logId }, { $set: { embedding } });
    } catch (err) {
      const message_preview = message.length > 20 ? message.slice(0, 20) + '...' : message;
      this.logger.warn(`Embedding generation failed for log ${logId} ("${message_preview}"): ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}
