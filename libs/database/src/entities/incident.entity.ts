import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Monitor } from './monitor.entity';
import { Project } from './project.entity';

export enum IncidentStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum IncidentSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
}

@Entity('incidents')
export class Incident extends BaseEntity {
  @Column({ type: 'uuid' })
  monitorId: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MAJOR,
  })
  severity: IncidentSeverity;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'text', nullable: true })
  aiReport: string | null;

  @Column({ type: 'text', nullable: true })
  rootCause: string | null;

  @Column({ type: 'jsonb', nullable: true })
  githubCommits: Record<string, unknown>[] | null;

  @Column({ type: 'jsonb', nullable: true })
  affectedLogs: Record<string, unknown>[] | null;

  @ManyToOne(() => Monitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitorId' })
  monitor: Monitor;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
