import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtGuard, CurrentUser } from '@app/common';
import { Project } from '@app/database';
import { LogsService } from './logs.service';

@UseGuards(JwtGuard)
@Controller('projects/:projectId/logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  private async validateOwnership(userId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get()
  async getLogs(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.validateOwnership(user.id, projectId);
    return this.logsService.getLogs(projectId, {
      level,
      search,
      startDate,
      endDate,
      page: page ? Math.max(1, parseInt(page, 10) || 1) : undefined,
      limit: limit ? Math.min(100, Math.max(1, parseInt(limit, 10) || 10)) : undefined,
    });
  }

  @Get('search')
  async searchLogs(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('q') q: string,
  ): Promise<Record<string, unknown>[] | null> {
    await this.validateOwnership(user.id, projectId);
    if (!q || q.trim().length === 0) return null;
    return this.logsService.searchLogs(projectId, q);
  }
}
