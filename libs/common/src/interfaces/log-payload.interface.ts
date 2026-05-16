/**
 * Payload structure for log data sent via RabbitMQ or HTTP ingest
 */
export interface LogPayload {
  projectId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
