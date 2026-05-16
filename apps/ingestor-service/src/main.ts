import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '@app/common';
import { IngestorModule } from './ingestor.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(IngestorModule);

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ limit: '1mb', extended: true }));

  app.enableCors();

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT') || 3003;
  await app.listen(port);

  Logger.log(
    `Ingestor Service running on http://localhost:${port}`,
    'Bootstrap',
  );
}
void bootstrap();
