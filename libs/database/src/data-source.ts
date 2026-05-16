import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { Monitor } from './entities/monitor.entity';
import { Incident } from './entities/incident.entity';
import { AlertChannel } from './entities/alert-channel.entity';

// Load environment variables from the root .env file
config({ path: join(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Must be false for production/migrations
  logging: true,
  entities: [User, Project, Monitor, Incident, AlertChannel],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  subscribers: [],
});
