import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Monitor } from './monitor.entity';
import { AlertChannel } from './alert-channel.entity';
import { Incident } from './incident.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'owner/repo format',
  })
  githubRepo: string | null;

  @Column({ type: 'varchar', length: 64, unique: true })
  apiKey: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    unique: true,
    comment: 'SHA-256 hash of apiKey for secure lookup',
  })
  apiKeyHash: string | null;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Monitor, (monitor) => monitor.project)
  monitors: Monitor[];

  @OneToMany(() => AlertChannel, (channel) => channel.project)
  alertChannels: AlertChannel[];

  @OneToMany(() => Incident, (incident) => incident.project)
  incidents: Incident[];
}
