import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Monitor, Project } from '@app/database';
import { InternalController } from './internal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Monitor, Project])],
  controllers: [InternalController],
})
export class InternalModule {}
