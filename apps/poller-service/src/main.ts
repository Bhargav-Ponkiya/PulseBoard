import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '@app/common';
import { PollerModule } from './poller.module';

async function bootstrap() {
  const app = await NestFactory.create(PollerModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT') || 3002;
  await app.listen(port);

  Logger.log(`Poller Service running on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
