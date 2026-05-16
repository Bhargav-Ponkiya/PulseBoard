import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get('NODE_ENV') === 'development';
        return {
          pinoHttp: {
            level: 'info',
            formatters: {
              level: (label) => ({ level: label }),
            },
            serializers: {
              req: (req: {
                method: string;
                url: string;
                headers: Record<string, string | string[] | undefined>;
              }) => {
                const safeHeaders = { ...req.headers };
                delete safeHeaders.authorization;
                delete safeHeaders.cookie;
                delete safeHeaders['x-internal-secret'];
                delete safeHeaders['x-api-key'];
                delete safeHeaders['set-cookie'];
                return {
                  method: req.method,
                  url: req.url,
                  headers: safeHeaders,
                };
              },
              res: (res: { statusCode: number }) => ({
                statusCode: res.statusCode,
              }),
            },
            autoLogging: false,
            genReqId: () => randomUUID(),
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                }
              : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
