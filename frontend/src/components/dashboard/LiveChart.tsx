'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { apiCall } from '@/lib/api';
import { useSSE } from '@/lib/use-sse';
import { format } from 'date-fns';
import { Activity, Zap, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChartPoint {
  timestamp: string;
  latencyMs: number;
  status: string;
  monitorId: string;
}

interface MonitorMeta {
  id: string;
  name: string;
}

export const LiveChart = memo(function LiveChart({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMonitorId, setActiveMonitorId] = useState<string | 'all'>('all');
  const [monitors, setMonitors] = useState<MonitorMeta[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [chartData, monitorsRes] = await Promise.all([
        apiCall<ChartPoint[]>('/projects/' + projectId + '/metrics/chart'),
        apiCall<MonitorMeta[]>('/projects/' + projectId + '/monitors'),
      ]);
      setData(chartData);
      setMonitors(monitorsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSSE(projectId, {
    onMetric: (metric) => {
      setData((prev) => [...prev.slice(-99), { timestamp: metric.timestamp, latencyMs: metric.latencyMs, status: metric.status, monitorId: metric.monitorId }]);
    },
  });

  const filteredData = useMemo(() => {
    const raw = activeMonitorId === 'all'
      ? data
      : data.filter((m) => m.monitorId === activeMonitorId);
    return raw.map(m => ({
      ...m,
      time: format(new Date(m.timestamp), 'HH:mm:ss'),
    }));
  }, [data, activeMonitorId]);

  if (loading && data.length === 0) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Initializing data stream...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && data.length === 0) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="flex h-[400px] flex-col items-center justify-center gap-4">
          <div className="p-4 rounded-full bg-destructive/10">
            <Activity className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-bold">Failed to load chart</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="rounded-full gap-2">
            <RefreshCcw className="h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">Latency (ms)</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveMonitorId('all')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 transition-transform",
               activeMonitorId === 'all' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            All Monitors
          </button>
          {monitors.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMonitorId(m.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 transition-transform whitespace-nowrap",
                 activeMonitorId === m.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="pt-6">
        {filteredData.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 rounded-full bg-muted/30">
              <Activity className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-bold">No Metrics Yet</p>
              <p className="text-xs text-muted-foreground max-w-[240px]">Wait for the next check interval or ensure your monitors are active.</p>
            </div>
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--background) / 0.9)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload as ChartPoint & { time: string };
                      return (
                        <div className="rounded-xl border border-border/50 bg-background/90 p-3 shadow-xl backdrop-blur-md">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{dataPoint.time}</p>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", dataPoint.status === 'UP' ? "bg-green-500" : "bg-red-500")} />
                            <span className="text-sm font-bold">{dataPoint.latencyMs}ms</span>
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase", dataPoint.status === 'UP' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                              {dataPoint.status}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={1000} stroke="hsl(var(--destructive) / 0.5)" strokeDasharray="5 5" label={{ value: 'Warning', position: 'right', fill: 'hsl(var(--destructive) / 0.5)', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="latencyMs"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
