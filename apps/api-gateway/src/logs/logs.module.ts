import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log, LogSchema, Project } from '@app/database';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { AiService } from '../ai/ai.service';
import { CacheService } from '../cache/cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [LogsController],
  providers: [LogsService, AiService, CacheService],
})
export class LogsModule {}
