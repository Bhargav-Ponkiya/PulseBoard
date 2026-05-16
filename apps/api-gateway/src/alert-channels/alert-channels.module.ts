import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertChannel, Project } from '@app/database';
import { AlertChannelsController } from './alert-channels.controller';
import { AlertChannelsService } from './alert-channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlertChannel, Project])],
  controllers: [AlertChannelsController],
  providers: [AlertChannelsService],
})
export class AlertChannelsModule {}
