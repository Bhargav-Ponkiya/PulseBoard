import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Project, Monitor, MonitorType } from '@app/database';
import { EXCHANGES, ROUTING_KEYS } from '@app/rabbitmq';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Injectable()
export class MonitorsService {
  private readonly logger = new Logger(MonitorsService.name);

  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  /** Validate that the given user owns the specified project */
  private async validateProjectOwnership(userId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  /** Create a new monitor for a project */
  async create(userId: string, projectId: string, dto: CreateMonitorDto) {
    await this.validateProjectOwnership(userId, projectId);

    const monitor = this.monitorRepository.create({
      projectId,
      name: dto.name,
      url: dto.url,
      type: dto.type ?? MonitorType.HTTP,
      intervalSeconds: dto.intervalSeconds ?? 60,
      expectedStatus: dto.expectedStatus ?? 200,
      timeoutMs: dto.timeoutMs ?? 10000,
    });

    await this.monitorRepository.save(monitor);

    try {
      await this.amqpConnection.publish(
        EXCHANGES.CONFIG,
        ROUTING_KEYS.MONITOR_CONFIG,
        {
          type: 'MONITOR_CREATED',
          monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            type: monitor.type,
            intervalSeconds: monitor.intervalSeconds,
            expectedStatus: monitor.expectedStatus,
            timeoutMs: monitor.timeoutMs,
            projectId: monitor.projectId,
            isActive: monitor.isActive,
            currentStatus: monitor.currentStatus,
          },
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish MONITOR_CREATED event for ${monitor.id}`,
        err,
      );
    }

    return monitor;
  }

  /** Find all monitors for a project */
  async findAll(projectId: string, userId: string) {
    await this.validateProjectOwnership(userId, projectId);

    return this.monitorRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Find a single monitor by id within a project */
  async findOne(projectId: string, monitorId: string, userId: string) {
    await this.validateProjectOwnership(userId, projectId);

    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId, projectId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    return monitor;
  }

  /** Update an existing monitor and broadcast the change */
  async update(
    userId: string,
    projectId: string,
    monitorId: string,
    dto: UpdateMonitorDto,
  ) {
    await this.findOne(projectId, monitorId, userId);

    await this.monitorRepository.update(monitorId, dto);

    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found after update');
    }

    try {
      await this.amqpConnection.publish(
        EXCHANGES.CONFIG,
        ROUTING_KEYS.MONITOR_CONFIG,
        {
          type: 'MONITOR_UPDATED',
          monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            type: monitor.type,
            intervalSeconds: monitor.intervalSeconds,
            expectedStatus: monitor.expectedStatus,
            timeoutMs: monitor.timeoutMs,
            projectId: monitor.projectId,
            isActive: monitor.isActive,
            currentStatus: monitor.currentStatus,
          },
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish MONITOR_UPDATED event for ${monitor.id}`,
        err,
      );
    }

    return monitor;
  }

  /** Toggle a monitor between active and inactive */
  async toggle(userId: string, projectId: string, monitorId: string) {
    const monitor = await this.findOne(projectId, monitorId, userId);

    const isActive = !monitor.isActive;
    await this.monitorRepository.update(monitorId, { isActive });

    const updated = await this.monitorRepository.findOne({
      where: { id: monitorId },
    });

    if (!updated) {
      throw new NotFoundException('Monitor not found after toggle');
    }

    try {
      await this.amqpConnection.publish(
        EXCHANGES.CONFIG,
        ROUTING_KEYS.MONITOR_CONFIG,
        {
          type: 'MONITOR_TOGGLED',
          monitor: {
            id: updated.id,
            name: updated.name,
            url: updated.url,
            type: updated.type,
            intervalSeconds: updated.intervalSeconds,
            expectedStatus: updated.expectedStatus,
            timeoutMs: updated.timeoutMs,
            projectId: updated.projectId,
            isActive: updated.isActive,
            currentStatus: updated.currentStatus,
          },
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish MONITOR_TOGGLED event for ${updated.id}`,
        err,
      );
    }

    return updated;
  }

  /** Delete a monitor by id */
  async delete(userId: string, projectId: string, monitorId: string) {
    await this.findOne(projectId, monitorId, userId);
    await this.monitorRepository.delete(monitorId);

    try {
      await this.amqpConnection.publish(
        EXCHANGES.CONFIG,
        ROUTING_KEYS.MONITOR_CONFIG,
        {
          type: 'MONITOR_DELETED',
          monitorId,
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish MONITOR_DELETED event for ${monitorId}`,
        err,
      );
    }
  }

  /** Manually trigger a check for a monitor */
  async triggerCheck(userId: string, projectId: string, monitorId: string) {
    const monitor = await this.findOne(projectId, monitorId, userId);

    try {
      await this.amqpConnection.publish(
        EXCHANGES.CONFIG,
        ROUTING_KEYS.MONITOR_CONFIG,
        {
          type: 'MONITOR_CHECK_NOW',
          monitor: {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            type: monitor.type,
            intervalSeconds: monitor.intervalSeconds,
            expectedStatus: monitor.expectedStatus,
            timeoutMs: monitor.timeoutMs,
            projectId: monitor.projectId,
            isActive: monitor.isActive,
            currentStatus: monitor.currentStatus,
          },
        },
      );
      return { success: true, message: 'Check triggered' };
    } catch (err) {
      this.logger.error(
        `Failed to publish MONITOR_CHECK_NOW event for ${monitorId}`,
        err,
      );
      throw err;
    }
  }
}
