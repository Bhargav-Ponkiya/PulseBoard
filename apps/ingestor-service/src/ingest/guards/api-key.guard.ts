import { createHash } from 'crypto';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@app/database';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly cacheService: CacheService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /** Validates the API key from request headers and attaches the project ID. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let apiKey = request.headers?.['x-api-key'];

    if (!apiKey) {
      const authHeader = request.headers?.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.slice(7);
      }
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing or invalid API key. Provide via X-API-Key header or Authorization: Bearer <key>.');
    }

    if (apiKey.length < 10 || apiKey.length > 128) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const cacheKey = `apikey:valid:${keyHash}`;

    let projectId = await this.cacheService.get<string>(cacheKey);

    if (!projectId) {
      const project = await this.projectRepository.findOne({
        where: { apiKeyHash: keyHash },
        select: ['id'],
      });

      if (!project) {
        throw new UnauthorizedException('Invalid API key');
      }

      projectId = project.id;
      await this.cacheService.set(cacheKey, projectId, 300);
    }

    request.projectId = projectId;
    return true;
  }
}
