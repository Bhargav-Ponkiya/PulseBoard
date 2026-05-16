import { AppDataSource } from './data-source';
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { Monitor, MonitorType, MonitorStatus } from './entities/monitor.entity';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MetricSchema } from './schemas/metric.schema';
import { LogSchema } from './schemas/log.schema';

async function seed() {
  console.log('🌱 Starting database seeding...');

  // 1. PostgreSQL Seeding
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to PostgreSQL');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Clear data from tables instead of dropping the schema
    await queryRunner.query('TRUNCATE TABLE "users", "projects", "monitors", "incidents", "alert_channels" CASCADE');
    
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    const monitorRepository = AppDataSource.getRepository(Monitor);

    // Create User
    const passwordHash = await bcrypt.hash('password123', 10);
    let user = userRepository.create({
      email: 'demo@pulseboard.io',
      name: 'Demo User',
      passwordHash,
    });
    user = await userRepository.save(user);
    console.log('👤 Created User: demo@pulseboard.io');

    // Create Project
    let project = projectRepository.create({
      userId: user.id,
      name: 'Production Environment',
      slug: 'prod-env',
      apiKey: 'sk_test_1234567890abcdef', // Mock API key
    });
    project = await projectRepository.save(project);
    console.log('📁 Created Project: Production Environment');

    // Create Monitor
    let monitor = monitorRepository.create({
      projectId: project.id,
      name: 'Google Ping',
      url: 'https://google.com',
      type: MonitorType.HTTP,
      intervalSeconds: 60,
      expectedStatus: 200,
      timeoutMs: 5000,
      isActive: true,
      currentStatus: MonitorStatus.UP,
    });
    monitor = await monitorRepository.save(monitor);
    console.log('🔍 Created Monitor: Google Ping');

  } catch (error) {
    console.error('❌ PostgreSQL Seeding Error:', error);
  }

  // 2. MongoDB Seeding
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/pulseboard?authSource=admin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const MetricModel = mongoose.model('Metric', MetricSchema);
    const LogModel = mongoose.model('Log', LogSchema);

    // Clear existing collections
    await MetricModel.deleteMany({});
    await LogModel.deleteMany({});

    // Ensure we have IDs from PG to link to
    const projectRepo = AppDataSource.getRepository(Project);
    const monitorRepo = AppDataSource.getRepository(Monitor);
    const project = await projectRepo.findOne({ where: { slug: 'prod-env' } });
    const monitor = await monitorRepo.findOne({ where: { name: 'Google Ping' } });

    if (project && monitor) {
      // Create Dummy Metrics
      const metricsToInsert = Array.from({ length: 5 }).map((_, i) => ({
        monitorId: monitor.id,
        projectId: project.id,
        status: 'UP',
        statusCode: 200,
        latencyMs: 120 + Math.random() * 50,
        timestamp: new Date(Date.now() - i * 60000), // Last 5 minutes
      }));
      await MetricModel.insertMany(metricsToInsert);
      console.log('📊 Created dummy Metrics');

      // Create Dummy Logs
      const logsToInsert = [
        {
          projectId: project.id,
          level: 'info',
          message: 'Application started successfully',
          metadata: { env: 'production', version: '1.0.0' },
          timestamp: new Date(Date.now() - 300000),
          embedding: Array(768).fill(0.1), // Mock embedding
        },
        {
          projectId: project.id,
          level: 'warn',
          message: 'High memory usage detected',
          metadata: { memoryMb: 1024 },
          timestamp: new Date(Date.now() - 150000),
          embedding: Array(768).fill(0.2),
        }
      ];
      await LogModel.insertMany(logsToInsert);
      console.log('📝 Created dummy Logs');
    }

  } catch (error) {
    console.error('❌ MongoDB Seeding Error:', error);
  } finally {
    await mongoose.disconnect();
    await AppDataSource.destroy();
    console.log('🏁 Seeding finished. Exiting.');
    process.exit(0);
  }
}

seed();
