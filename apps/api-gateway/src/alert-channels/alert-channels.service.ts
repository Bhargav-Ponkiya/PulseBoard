import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertChannel, ChannelType, Project } from '@app/database';
import { CreateAlertChannelDto } from './dto/create-alert-channel.dto';
import { UpdateAlertChannelDto } from './dto/update-alert-channel.dto';

@Injectable()
export class AlertChannelsService {
  private readonly logger = new Logger(AlertChannelsService.name);

  constructor(
    @InjectRepository(AlertChannel)
    private readonly channelRepository: Repository<AlertChannel>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) { }

  /** Verify that the user owns the given project */
  private async validateOwnership(userId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return project;
  }

  /** Find all alert channels for a project */
  async findAll(userId: string, projectId: string) {
    await this.validateOwnership(userId, projectId);
    return this.channelRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Create a new alert channel for a project */
  async create(userId: string, projectId: string, dto: CreateAlertChannelDto) {
    await this.validateOwnership(userId, projectId);
    const channel = this.channelRepository.create({
      projectId,
      name: dto.name,
      type: dto.type as ChannelType,
      webhookUrl: dto.webhookUrl,
    });
    return this.channelRepository.save(channel);
  }

  /** Update an existing alert channel */
  async update(
    userId: string,
    projectId: string,
    id: string,
    dto: UpdateAlertChannelDto,
  ) {
    await this.validateOwnership(userId, projectId);
    const channel = await this.channelRepository.findOne({
      where: { id, projectId },
    });
    if (!channel) throw new NotFoundException('Alert channel not found');
    await this.channelRepository.update(id, dto as Partial<AlertChannel>);
    return this.channelRepository.findOne({ where: { id } });
  }

  /** Remove an alert channel by id */
  async remove(userId: string, projectId: string, id: string) {
    await this.validateOwnership(userId, projectId);
    const channel = await this.channelRepository.findOne({
      where: { id, projectId },
    });
    if (!channel) throw new NotFoundException('Alert channel not found');
    await this.channelRepository.delete(id);
    return { success: true };
  }

  /** Test a webhook URL by sending a provider-specific test message */
  async test(userId: string, projectId: string, dto: CreateAlertChannelDto) {
    await this.validateOwnership(userId, projectId);

    let body: Record<string, unknown> = { content: 'PulseBoard test message — your webhook is working!' }; // Default (Discord)

    if (dto.type === 'slack') {
      body = { text: 'PulseBoard test message — your Slack webhook is working!' };
    } else if (dto.type === 'webhook') {
      body = {
        event: 'pulseboard.test',
        message: 'PulseBoard test message — your webhook is working!',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(dto.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with ${response.status}`);
      }
      return { success: true };
    } catch (err) {
      this.logger.error(`Webhook test failed for ${dto.webhookUrl}`, err);
      throw new BadRequestException(`Webhook test failed: ${err.message}`);
    }
  }
}
