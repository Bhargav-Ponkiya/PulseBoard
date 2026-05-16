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
import { MetricsService } from './metrics.service';

@UseGuards(JwtGuard)
@Controller('projects/:projectId/metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
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

  @Get('summary')
  async getSummary(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('monitorId') monitorId?: string,
  ) {
    await this.validateOwnership(user.id, projectId);
    return this.metricsService.getSummary(projectId, monitorId);
  }

  @Get('chart')
  async getChartData(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('hours') hours?: string,
    @Query('monitorId') monitorId?: string,
  ) {
    await this.validateOwnership(user.id, projectId);
    return this.metricsService.getChartData(
      projectId,
      monitorId,
      hours ? Math.max(1, parseInt(hours, 10) || 1) : 24,
    );
  }

  @Get('monitors-status')
  async getMonitorsStatus(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    await this.validateOwnership(user.id, projectId);
    return this.metricsService.getMonitorsStatus(projectId);
  }
}
