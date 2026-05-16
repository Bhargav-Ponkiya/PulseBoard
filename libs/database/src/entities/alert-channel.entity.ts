import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

export enum ChannelType {
  DISCORD = 'discord',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

@Entity('alert_channels')
export class AlertChannel extends BaseEntity {
  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ChannelType })
  type: ChannelType;

  @Column({ type: 'text' })
  webhookUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Project, (project) => project.alertChannels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
