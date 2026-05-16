'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiCall } from '@/lib/api';
import { API_BASE_URL as BASE_URL } from '@/lib/config';

export interface MetricEvent {
  monitorId: string;
  latencyMs: number;
  timestamp: string;
  status: string;
  statusCode?: number;
  errorCode?: string;
}

export interface IncidentEvent {
  type: string;
  incidentId: string;
  rootCause: string;
  severity: string;
}

export interface ResolvedEvent {
  type: string;
  monitorId: string;
}

interface SSEHandlers {
  onMetric?: (data: MetricEvent) => void;
  onIncident?: (data: IncidentEvent) => void;
  onResolved?: (data: ResolvedEvent) => void;
}

/** Small startup delay to let auth fully stabilize before opening SSE connection */
const SSE_STARTUP_DELAY_MS = 150;
/** Heartbeat timeout — if no events in 45s, consider connection stale */
const HEARTBEAT_TIMEOUT_MS = 45000;
/** Max reconnect attempts before giving up */
const MAX_RETRY = 20;

export function useSSE(projectId: string | null, handlers: SSEHandlers = {}) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startupDelayRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const handlersRef = useRef(handlers);
  const generationRef = useRef(0);
  const { accessToken } = useAuthStore();

  // Always keep handlers ref up to date without triggering reconnects
  handlersRef.current = handlers;

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback((gen: number) => {
    if (gen !== generationRef.current) return;
    if (retryCountRef.current >= MAX_RETRY) return;
    retryCountRef.current += 1;
    const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 30000) + Math.floor(Math.random() * 500);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (gen === generationRef.current) connect();
    }, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetHeartbeat = useCallback((gen: number, es: EventSource) => {
    clearHeartbeat();
    heartbeatTimeoutRef.current = setTimeout(() => {
      if (gen !== generationRef.current) return;
      es.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
      scheduleReconnect(gen);
    }, HEARTBEAT_TIMEOUT_MS);
  }, [clearHeartbeat, scheduleReconnect]);

  const connect = useCallback(async () => {
    if (!projectId || !accessToken) return;

    const gen = ++generationRef.current;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    clearHeartbeat();

    setStatus('connecting');

    try {
      const { token } = await apiCall<{ token: string }>('/sse/token');
      if (gen !== generationRef.current) return;

      const url = new URL(`${BASE_URL}/sse/live`);
      url.searchParams.append('projectId', projectId);
      url.searchParams.append('token', token);

      const es = new EventSource(url.toString());

      es.addEventListener('connected', () => {
        if (gen !== generationRef.current) { es.close(); return; }
        eventSourceRef.current = es;
        retryCountRef.current = 0;
        setStatus('connected');
        resetHeartbeat(gen, es);
      });

      const makeEventHandler = <T>(parser: (data: T) => void) => (e: MessageEvent) => {
        if (gen !== generationRef.current) return;
        resetHeartbeat(gen, es);
        try {
          const data = JSON.parse(e.data) as T;
          parser(data);
        } catch (err) {
          console.error('[SSE] Failed to parse event', err);
        }
      };

      es.addEventListener('METRIC', makeEventHandler<MetricEvent>((data) => {
        handlersRef.current.onMetric?.(data);
      }));

      es.addEventListener('INCIDENT', makeEventHandler<IncidentEvent>((data) => {
        handlersRef.current.onIncident?.(data);
      }));

      es.addEventListener('RESOLVED', makeEventHandler<ResolvedEvent>((data) => {
        handlersRef.current.onResolved?.(data);
      }));

      es.addEventListener('error', () => {
        if (gen !== generationRef.current) return;
        setStatus('disconnected');
        es.close();
        eventSourceRef.current = null;
        clearHeartbeat();
        scheduleReconnect(gen);
      });
    } catch {
      if (gen !== generationRef.current) return;
      setStatus('disconnected');
      scheduleReconnect(gen);
    }
  }, [projectId, accessToken, clearHeartbeat, scheduleReconnect, resetHeartbeat]);

  useEffect(() => {
    if (!projectId || !accessToken) {
      setStatus('disconnected');
      return;
    }

    // Small startup delay to avoid race with auth initialization
    startupDelayRef.current = setTimeout(() => {
      connect();
    }, SSE_STARTUP_DELAY_MS);

    return () => {
      generationRef.current += 1;
      retryCountRef.current = 0;

      if (startupDelayRef.current) {
        clearTimeout(startupDelayRef.current);
        startupDelayRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      clearHeartbeat();
    };
  }, [connect, projectId, accessToken, clearHeartbeat]);

  return status;
}
