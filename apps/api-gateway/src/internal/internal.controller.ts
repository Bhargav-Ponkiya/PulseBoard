import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalGuard, Public } from '@app/common';
import { Monitor, Project } from '@app/database';

@Public()
@UseGuards(InternalGuard)
@Controller('internal')
export class InternalController {
  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  @Get('monitors/active')
  async getActiveMonitors() {
    const monitors = await this.monitorRepository.find({
      where: { isActive: true },
      select: [
        'id', 'projectId', 'name', 'url', 'type',
        'intervalSeconds', 'expectedStatus', 'timeoutMs', 'isActive',
        'currentStatus',
      ],
    });
    return monitors;
  }

  @Get('monitors/:id')
  async getMonitor(@Param('id') id: string) {
    const monitor = await this.monitorRepository.findOne({
      where: { id },
      select: [
        'id', 'projectId', 'name', 'url', 'type',
        'intervalSeconds', 'expectedStatus', 'timeoutMs', 'isActive',
        'currentStatus',
      ],
    });
    if (!monitor) throw new NotFoundException('Monitor not found');
    return monitor;
  }

  @Get('projects/:id')
  async getProject(@Param('id') id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return {
      id: project.id,
      userId: project.user?.id,
      name: project.name,
      slug: project.slug,
      githubRepo: project.githubRepo,
      user: project.user
        ? { id: project.user.id, githubAccessToken: project.user.githubAccessToken }
        : null,
    };
  }
}
