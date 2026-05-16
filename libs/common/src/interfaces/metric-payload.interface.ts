/**
 * Payload structure for metric data sent via RabbitMQ
 */
export interface MetricPayload {
  monitorId: string;
  projectId: string;
  status: 'UP' | 'DOWN';
  statusCode: number;
  latencyMs: number;
  errorCode?: string;
  timestamp: Date;
}
