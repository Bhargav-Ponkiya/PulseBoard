'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ShieldAlert, 
  Github, 
  Terminal,
  Activity,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCcw,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { apiCall } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface IncidentDetail {
  id: string;
  monitorName: string;
  monitorUrl: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'resolved';
  startedAt: string;
  resolvedAt: string | null;
  duration: string | null;
  aiReport: string | null;
  rootCause: string | null;
  githubCommits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }> | null;
  affectedLogs: Array<{
    level: string;
    timestamp: string;
    message: string;
  }> | null;
}

const severityConfig: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert },
  major: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  minor: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: ShieldAlert },
};

function parseAiReport(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const { selectedProjectId } = useProjectStore();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const data = await apiCall<IncidentDetail>(
          `/projects/${selectedProjectId}/incidents/${params.id}`,
          { signal: abortController.signal },
        );
        setIncident(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => abortController.abort();
  }, [selectedProjectId, params.id]);

  const [resolving, setResolving] = useState(false);

  const resolveIncident = useCallback(async () => {
    if (!selectedProjectId) return;
    setResolving(true);
    try {
      const updated = await apiCall<IncidentDetail>(
        `/projects/${selectedProjectId}/incidents/${params.id}/resolve`,
        { method: 'PATCH' },
      );
      setIncident(updated);
      toast({ title: 'Incident resolved', description: 'The incident has been marked as resolved.' });
    } catch (err) {
      toast({
        title: 'Resolve failed',
        description: err instanceof Error ? err.message : 'Could not resolve incident',
        variant: 'destructive',
      });
    } finally {
      setResolving(false);
    }
  }, [selectedProjectId, params.id]);

  useEffect(() => {
    document.title = incident ? `Incident: ${incident.monitorName} - PulseBoard` : 'Incident Details - PulseBoard';
  }, [incident]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-8 w-64 rounded-xl" />
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
        <div className="p-4 rounded-full bg-muted/30">
          <Activity className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Project Context Missing</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">Please select a project from the sidebar to view incident details.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Failed to load incident</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">The incident could not be retrieved. It may have been removed or a network error occurred.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/incidents">
            <Button variant="outline" className="rounded-full">Back to Incidents</Button>
          </Link>
          <Button variant="default" className="rounded-full" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const [ongoingDowntime, setOngoingDowntime] = useState<string>('');

  useEffect(() => {
    if (!incident || incident.status !== 'open') {
      setOngoingDowntime('');
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(incident.startedAt).getTime();
      const now = Date.now();
      const diffMs = now - start;
      if (diffMs < 0) return '0s';
      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`;
      }
      if (mins > 0) {
        return `${mins}m ${secs}s`;
      }
      return `${secs}s`;
    };

    setOngoingDowntime(calculateElapsed());

    const timer = setInterval(() => {
      setOngoingDowntime(calculateElapsed());
    }, 1000);

    return () => clearInterval(timer);
  }, [incident]);

  if (!incident) {
    return notFound();
  }

  const report = parseAiReport(incident.aiReport);
  const SevIcon = severityConfig[incident.severity]?.icon || AlertTriangle;

  return (
    <ErrorBoundary>
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/incidents">
            <Button variant="outline" size="sm" className="rounded-xl h-10 border-border/40 bg-card/50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Incidents
            </Button>
          </Link>
          <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block" />
          <h1 className="text-2xl font-bold tracking-tight truncate max-w-[300px] md:max-w-none">
            {incident.monitorName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={incident.status === 'open' ? 'destructive' : 'secondary'} className="rounded-lg px-3 py-1 text-xs font-bold uppercase shadow-sm">
            {incident.status}
          </Badge>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase",
            severityConfig[incident.severity]?.bg,
            severityConfig[incident.severity]?.color
          )}>
            <SevIcon className="h-3.5 w-3.5" />
            {incident.severity}
          </div>
          {incident.status === 'open' && (
            <Button
              variant="default"
              size="sm"
              className="rounded-xl h-10 px-5 gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
              onClick={resolveIncident}
              disabled={resolving}
            >
              {resolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {resolving ? 'Resolving...' : 'Resolve Incident'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3 border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Activity className="h-32 w-32" />
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Monitor URL</span>
                </div>
                <p className="font-semibold text-sm truncate">{incident.monitorUrl}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Started At</span>
                </div>
                <p className="font-semibold text-sm">{new Date(incident.startedAt).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Resolved At</span>
                </div>
                <p className="font-semibold text-sm">
                  {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : <span className="text-destructive animate-pulse">In Progress</span>}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Downtime</span>
                </div>
                <p className="font-semibold text-sm">
                  {incident.status === 'open' ? (
                    <span className="text-destructive font-mono flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
                      {ongoingDowntime || 'Calculating...'}
                    </span>
                  ) : (
                    incident.duration ?? 'N/A'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {report ? (
          <Card className="lg:col-span-2 border-primary/20 bg-primary/[0.02] backdrop-blur-sm">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                  <Cpu className="h-6 w-6" />
                </div>
                AI Root Cause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider mb-3">
                  <ShieldAlert className="h-4 w-4" />
                  Probable Cause
                </h4>
                <p className="text-lg leading-relaxed font-medium">
                  {report.probable_cause ?? incident.rootCause}
                </p>
              </div>

              {report.evidence && report.evidence.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Evidence Identified</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Array.isArray(report.evidence) ? report.evidence : []).map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.immediate_fix && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Immediate Remediation</h4>
                    <pre className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-950/25 border border-blue-500/20 text-xs font-mono whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                      {report.immediate_fix}
                    </pre>
                  </div>
                )}
                {report.prevention && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Future Prevention</h4>
                    <div className="p-4 rounded-xl bg-green-500/5 dark:bg-green-950/25 border border-green-500/20 text-sm text-green-800 dark:text-green-200 leading-relaxed">
                      {report.prevention}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <Cpu className="h-6 w-6" />
                </div>
                AI Root Cause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                <div className="p-4 rounded-full bg-muted/30">
                  <Cpu className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">No AI Analysis Available</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    This incident does not have an AI-generated report. This can happen when AI services are unavailable or the incident was created before the analysis was complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Github className="h-4 w-4 text-muted-foreground" />
                Related Commits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {incident.githubCommits && incident.githubCommits.length > 0 ? (
                <div className="divide-y divide-border/20">
                  {incident.githubCommits.map((commit) => (
                    <div key={commit.sha} className="p-4 hover:bg-primary/5 transition-colors group">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">
                          {commit.sha.slice(0, 7)}
                        </code>
                        <span className="text-[10px] text-muted-foreground">{new Date(commit.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{commit.message}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary">
                          {commit.author.slice(0, 1).toUpperCase()}
                        </div>
                        {commit.author}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Github className="h-8 w-8 mx-auto text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground">No recent commits found during this window.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                Error Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {incident.affectedLogs && incident.affectedLogs.length > 0 ? (
                <div className="divide-y divide-border/20 max-h-[300px] overflow-y-auto">
                  {incident.affectedLogs.map((log, i) => (
                    <div key={i} className="p-4 hover:bg-destructive/5 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={log.level === 'error' ? 'destructive' : 'default'} className="text-[8px] h-4 uppercase">
                          {log.level}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-mono line-clamp-2 text-muted-foreground">{log.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Terminal className="h-8 w-8 mx-auto text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground">No application logs correlated.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
