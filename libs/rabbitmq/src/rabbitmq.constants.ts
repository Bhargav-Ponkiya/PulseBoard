export const EXCHANGES = {
  CONFIG: 'pulse.config',
  TELEMETRY: 'pulse.telemetry',
  EVENTS: 'pulse.events',
  DLX: 'pulse.dlx',
} as const;

export const QUEUES = {
  POLLER_CONFIG: {
    name: 'poller.config.q',
    maxRetries: 3,
  },
  INGESTOR_METRIC: {
    name: 'ingestor.metric.q',
    maxRetries: 3,
  },
  INGESTOR_LOG: {
    name: 'ingestor.log.q',
    maxRetries: 3,
  },
  INGESTOR_RESOLVED: {
    name: 'ingestor.incident.resolved.q',
    maxRetries: 3,
  },
  ALERTER_INCIDENT: {
    name: 'alerter.incident.q',
    maxRetries: 3,
  },
  ALERTER_RESOLVED: {
    name: 'alerter.resolved.q',
    maxRetries: 3,
  },
  DLQ: {
    name: 'dlq.general',
    maxRetries: 0,
  },
} as const;

export const ROUTING_KEYS = {
  METRIC_RAW: 'metric.raw',
  LOG_RAW: 'log.raw',
  INCIDENT_TRIGGER: 'incident.trigger',
  INCIDENT_RESOLVED: 'incident.resolved',
  MONITOR_CONFIG: 'monitor.config',
} as const;
