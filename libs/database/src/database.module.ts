import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { Monitor } from './entities/monitor.entity';
import { Incident } from './entities/incident.entity';
import { AlertChannel } from './entities/alert-channel.entity';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities: [User, Project, Monitor, Incident, AlertChannel],
        migrations: [InitialSchema1700000000000],
        migrationsRun:
          configService.get<string>('RUN_MIGRATIONS', 'false') === 'true',
        synchronize: true,
        logging: ['error', 'warn'],
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule, MongooseModule],
})
export class DatabaseModule {}
