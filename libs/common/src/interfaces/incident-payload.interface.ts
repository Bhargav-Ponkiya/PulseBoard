/**
 * Payload structure for incident events sent via RabbitMQ
 */
export interface IncidentPayload {
  monitorId: string;
  projectId: string;
  status: 'trigger' | 'resolved';
  startedAt?: Date;
  resolvedAt?: Date;
  aiReport?: Record<string, unknown>;
  rootCause?: string;
  githubCommits?: Record<string, unknown>[];
  affectedLogs?: Record<string, unknown>[];
}
