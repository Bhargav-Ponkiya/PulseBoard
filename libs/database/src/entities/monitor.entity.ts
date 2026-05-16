import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Incident } from './incident.entity';

export enum MonitorType {
  HTTP = 'http',
  TCP = 'tcp',
}

export enum MonitorStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  PENDING = 'PENDING',
}

@Entity('monitors')
export class Monitor extends BaseEntity {
  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'enum', enum: MonitorType, default: MonitorType.HTTP })
  type: MonitorType;

  @Column({ type: 'int', default: 60 })
  intervalSeconds: number;

  @Column({ type: 'int', default: 200 })
  expectedStatus: number;

  @Column({ type: 'int', default: 10000 })
  timeoutMs: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.PENDING })
  currentStatus: MonitorStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastCheckedAt: Date | null;

  @ManyToOne(() => Project, (project) => project.monitors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => Incident, (incident) => incident.monitor)
  incidents: Incident[];
}
