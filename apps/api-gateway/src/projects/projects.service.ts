import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import Redis from 'ioredis';
import { Project } from '@app/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private hashKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  /** Create a new project for the given user */
  async create(userId: string, dto: CreateProjectDto) {
    const slug = this.generateSlug(dto.name);
    const apiKey = randomBytes(32).toString('hex');
    const apiKeyHash = this.hashKey(apiKey);

    const project = this.projectRepository.create({
      userId,
      name: dto.name,
      slug,
      apiKey,
      apiKeyHash,
      githubRepo: dto.githubRepo ?? null,
    });

    await this.projectRepository.save(project);

    return this.maskProject(project);
  }

  /** Find all projects for the given user */
  findAll(userId: string) {
    return this.projectRepository.find({
      where: { userId },
      select: [
        'id',
        'userId',
        'name',
        'slug',
        'githubRepo',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /** Find a single project by id, verifying user ownership */
  async findOne(userId: string, id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      select: [
        'id',
        'userId',
        'name',
        'slug',
        'apiKey',
        'apiKeyHash',
        'githubRepo',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.maskProject(project);
  }

  /** Reveal the full API key (requires explicit user action) */
  async revealApiKey(userId: string, id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      select: [
        'id',
        'userId',
        'apiKey',
      ],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return { apiKey: project.apiKey };
  }

  /** Update an existing project */
  async update(userId: string, id: string, dto: UpdateProjectDto) {
    const project = await this.projectRepository.findOne({
      where: { id },
      select: ['id', 'userId'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    await this.projectRepository.update(id, dto);

    return this.projectRepository.findOne({
      where: { id },
      select: [
        'id',
        'userId',
        'name',
        'slug',
        'githubRepo',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  /** Delete a project by id */
  async delete(userId: string, id: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id },
      select: ['id', 'userId'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');
    await this.projectRepository.delete(id);
  }

  /** Regenerate the API key for a project */
  async regenerateApiKey(userId: string, id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      select: ['id', 'userId', 'apiKey'],
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    // Invalidate old cached key
    const oldHash = this.hashKey(project.apiKey);
    await this.redis.del(`apikey:valid:${oldHash}`);

    const apiKey = randomBytes(32).toString('hex');
    const apiKeyHash = this.hashKey(apiKey);
    await this.projectRepository.update(id, { apiKey, apiKeyHash });

    return { apiKey };
  }

  private maskProject(project: Project) {
    const masked = project.apiKey
      ? `${project.apiKey.slice(0, 8)}...${project.apiKey.slice(-4)}`
      : null;
    return {
      ...project,
      apiKey: undefined,
      apiKeyHash: undefined,
      apiKeyMasked: masked,
    };
  }

  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const suffix = randomBytes(2).toString('hex');
    return `${slug}-${suffix}`;
  }
}
