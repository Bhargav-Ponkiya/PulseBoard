import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard that validates the X-Internal-Secret header for internal service-to-service communication
 */
@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const internalSecret = request.headers['x-internal-secret'];

    if (!internalSecret) {
      throw new UnauthorizedException('Missing internal secret header');
    }

    const expectedSecret =
      this.configService.getOrThrow<string>('INTERNAL_SECRET');

    if (internalSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
