import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '@app/database';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Project]),
  ],
  providers: [KeepAliveService],
})
export class KeepAliveModule {}
