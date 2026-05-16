'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { apiCall } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/skeleton';

interface Incident {
  id: string;
  monitorName: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'resolved';
  startedAt: string;
  resolvedAt: string | null;
}

const severityConfig = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  major: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  minor: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

export default function IncidentsPage() {
  const { selectedProjectId, loading: projectsLoading } = useProjectStore();

  // BUG FIX: Only initialize loading=true if we actually have a project to load for.
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const hasFetchedOnce = useRef(false);

  const abortRef = useRef<AbortController | null>(null);
  const fetchGen = useRef(0);
  const refreshingRef = useRef(false);

  const fetchIncidents = useCallback(async () => {
    // Guard: skip if no project
    if (!selectedProjectId) return;
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    const isFirst = !hasFetchedOnce.current;
    if (isFirst) setLoading(true);
    else setRefreshing(true);

    setError('');
    const gen = ++fetchGen.current;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await apiCall<{ data: Incident[] }>(`/projects/${selectedProjectId}/incidents`, { signal: ac.signal });
      if (gen !== fetchGen.current) return;
      setIncidents(res.data || []);
      hasFetchedOnce.current = true;
      console.log('Fetched incidents for project ' + selectedProjectId, res.data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (gen !== fetchGen.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
      setIncidents([]);
    } finally {
      if (gen === fetchGen.current) {
        setLoading(false);
        setRefreshing(false);
        refreshingRef.current = false;
      }
    }
  }, [selectedProjectId]);

  useEffect(() => {
    // BUG FIX: Reset state when project changes
    setIncidents([]);
    setError('');
    hasFetchedOnce.current = false;

    if (!selectedProjectId) {
      setLoading(false);
      return;
    }

    fetchIncidents();
    const fetchInterval = setInterval(fetchIncidents, 30000);
    return () => {
      clearInterval(fetchInterval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [selectedProjectId, fetchIncidents]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredIncidents = useMemo(() => incidents.filter(i =>
    statusFilter === 'all' || i.status === statusFilter
  ), [incidents, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedIncidents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredIncidents.slice(start, start + pageSize);
  }, [filteredIncidents, safePage]);

  useEffect(() => {
    document.title = 'Incidents — PulseBoard';
  }, []);

  // BUG FIX: Show proper empty state when no project is selected
  if (!projectsLoading && !selectedProjectId) {
    return (
      <ErrorBoundary>
        <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-muted/20 blur-[60px] rounded-full" />
            <div className="relative h-20 w-20 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground">
              <Search className="h-10 w-10 opacity-40" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Project Selected</h1>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Select a project from the sidebar to view its incidents and alerts.
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
            <p className="text-sm text-muted-foreground">Historical and active alerts for your project.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={fetchIncidents}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
          <div className="flex items-center gap-3">
            {refreshing && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Auto-refreshing
              </div>
            )}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/30">
            {['all', 'open', 'resolved'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all active:scale-95",
                  statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="font-bold text-lg">Failed to load incidents</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchIncidents} className="rounded-full">Retry Connection</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <TableSkeleton rows={8} />
      ) : filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {statusFilter === 'all' ? (
              <>
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
                <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-10 w-10" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-green-500/20 blur-[60px] rounded-full" />
                <div className="relative h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </>
            )}
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {statusFilter === 'all' ? 'No Incidents Recorded' : 'All Systems Operational'}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              {statusFilter === 'all'
                ? 'No incidents have been recorded yet. Incidents appear here when a monitor goes down and our AI generates a root cause analysis.'
                : statusFilter === 'open'
                  ? 'There are no active incidents. All monitors are currently operational.'
                  : 'No resolved incidents match your filter.'}
            </p>
          </div>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {paginatedIncidents.map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/incidents/${incident.id}`}>
                  <Card className={cn(
                    "group relative overflow-hidden border-l-4 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer",
                    incident.status === 'open' ? "border-l-destructive shadow-destructive/5" : "border-l-muted-foreground/30 shadow-none"
                  )}>
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          severityConfig[incident.severity]?.bg,
                          severityConfig[incident.severity]?.color
                        )}>
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold truncate group-hover:text-primary transition-colors">{incident.monitorName}</h3>
                            <Badge variant={incident.status === 'open' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold px-2 py-0">
                              {incident.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(incident.startedAt).toLocaleDateString()} at {new Date(incident.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="capitalize px-1.5 py-0.5 rounded-md bg-muted/50 font-medium">
                              {incident.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {incident.resolvedAt && (
                          <div className="hidden md:flex flex-col items-end">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Duration</p>
                            <p className="text-sm font-semibold">
                              {Math.floor((new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()) / 60000)}m
                            </p>
                          </div>
                        )}
                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filteredIncidents.length > pageSize && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-3">
              Page {safePage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
              Next
            </Button>
          </div>
        )}
      </>)}
    </div>
    </ErrorBoundary>
  );
}
