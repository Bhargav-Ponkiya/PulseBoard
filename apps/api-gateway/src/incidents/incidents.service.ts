import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Incident, IncidentStatus, Project } from '@app/database';
import { EXCHANGES, ROUTING_KEYS } from '@app/rabbitmq';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  private async validateOwnership(userId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return project;
  }

  async findAll(
    userId: string,
    projectId: string,
    page?: string,
    limit?: string,
  ) {
    await this.validateOwnership(userId, projectId);

    const p = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit ?? '20', 10) || 1, 1), 100);

    const [data, total] = await this.incidentRepository.findAndCount({
      where: { projectId },
      relations: ['monitor'],
      order: { startedAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });

    return {
      data: data.map((i) => ({
        ...i,
        monitorName: i.monitor?.name ?? 'Unknown',
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  async findOne(userId: string, projectId: string, id: string) {
    await this.validateOwnership(userId, projectId);

    const incident = await this.incidentRepository.findOne({
      where: { id, projectId },
      relations: ['monitor'],
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return {
      ...incident,
      monitorName: incident.monitor?.name ?? 'Unknown',
      monitorUrl: incident.monitor?.url ?? '',
      duration: incident.durationSeconds
        ? `${Math.floor(incident.durationSeconds / 60)}m ${incident.durationSeconds % 60}s`
        : null,
    };
  }

  async resolve(userId: string, projectId: string, id: string) {
    await this.validateOwnership(userId, projectId);

    const incident = await this.incidentRepository.findOne({
      where: { id, projectId, status: IncidentStatus.OPEN },
    });

    if (!incident) {
      throw new NotFoundException('Open incident not found');
    }

    incident.status = IncidentStatus.RESOLVED;
    incident.resolvedAt = new Date();
    incident.durationSeconds = Math.floor(
      (incident.resolvedAt.getTime() - incident.startedAt.getTime()) / 1000,
    );

    await this.incidentRepository.save(incident);

    await this.amqpConnection.publish(
      EXCHANGES.EVENTS,
      ROUTING_KEYS.INCIDENT_RESOLVED,
      {
        type: 'INCIDENT_RESOLVED',
        projectId,
        monitorId: incident.monitorId,
        incidentId: incident.id,
      },
    );

    return this.findOne(userId, projectId, id);
  }
}
