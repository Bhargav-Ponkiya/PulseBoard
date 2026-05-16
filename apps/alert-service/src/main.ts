import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '@app/common';
import { AlertModule } from './alert.module';

async function bootstrap() {
  const app = await NestFactory.create(AlertModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT') || 3004;
  await app.listen(port);

  Logger.log(`Alert Service running on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
