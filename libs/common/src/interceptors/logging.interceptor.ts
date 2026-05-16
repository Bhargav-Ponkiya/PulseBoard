import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string; user?: { id: string } }>();
    const { method, url } = request;
    const userId = request.user?.id ?? 'anonymous';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.info(
          { method, url, userId, duration: Date.now() - now },
          'request completed',
        );
      }),
    );
  }
}
