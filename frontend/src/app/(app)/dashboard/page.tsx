'use client';

import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Plus, 
  RefreshCcw, 
  AlertCircle, 
  ArrowRight, 
  LayoutDashboard, 
  Zap, 
  ShieldCheck, 
  Bell,
  Search,
  Activity,
  Globe,
  TrendingUp,
  Clock,
  ExternalLink,
  Book
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { MonitorGrid } from '@/components/dashboard/MonitorGrid';
import { LiveChart } from '@/components/dashboard/LiveChart';
import { apiCall } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatSkeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DashboardSummary {
  uptime: number;
  avgLatency: number;
  activeIncidents: number;
  totalChecks: number;
  totalMonitors: number;
}

interface MetricsSummaryResponse {
  uptime24h: number;
  avgLatency: number;
  totalChecks: number;
  currentStatus: string;
  activeIncidents: number;
  totalMonitors: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { selectedProjectId, projects, loading: projectsLoading } = useProjectStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSummary = async (projectId: string) => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(false);
    try {
      const metrics = await apiCall<MetricsSummaryResponse>('/projects/' + projectId + '/metrics/summary', { signal: ac.signal });
      if (ac.signal.aborted) return;
      setSummary({
        uptime: metrics.uptime24h,
        avgLatency: metrics.avgLatency,
        activeIncidents: metrics.activeIncidents,
        totalChecks: metrics.totalChecks,
        totalMonitors: metrics.totalMonitors,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Failed to fetch summary:', err);
      setError(true);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchSummary(selectedProjectId);
    } else {
      setSummary(null);
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [selectedProjectId]);

  const handleRefresh = async () => {
    if (!selectedProjectId || isRefreshing) return;
    setIsRefreshing(true);
    await fetchSummary(selectedProjectId);
    setIsRefreshing(false);
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  useEffect(() => {
    document.title = selectedProject ? `${selectedProject.name} - PulseBoard` : 'Dashboard - PulseBoard';
  }, [selectedProject]);

  if (projectsLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (projects.length === 0) {
    return <OnboardingHero />;
  }

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-6"
    >
      {/* Premium Header */}
      <motion.header variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
              Live Monitoring
            </Badge>
            {summary && summary.activeIncidents > 0 && (
              <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                {summary.activeIncidents} Active Incidents
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">{selectedProject?.name}</h1>
            <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Monitoring {selectedProject?.githubRepo || 'External API'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="rounded-xl h-10 border-border/40 bg-card/40 backdrop-blur-md px-4 shadow-sm"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4 transition-all", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>
          <Link href="/dashboard/settings?tab=channels">
            <Button className="rounded-xl h-10 px-4 shadow-sm font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Alert Channel
            </Button>
          </Link>
        </div>
      </motion.header>

      {error && !summary ? (
        <motion.div variants={item}>
          <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-md">
            <CardContent className="p-10 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-black text-2xl uppercase tracking-tight text-destructive">Connection Interrupted</p>
                <p className="text-muted-foreground max-w-sm font-medium">We lost contact with the telemetry engine. Check if your microservices are alive.</p>
              </div>
              <Button variant="outline" onClick={handleRefresh} className="rounded-2xl h-12 px-8 mt-4">Reconnect Dashboard</Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Stats Summary */}
      <motion.div variants={item}>
        {summary ? (
          summary.totalChecks === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-3xl bg-muted/40 flex items-center justify-center relative">
                  <Activity className="h-10 w-10 text-muted-foreground/40" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 animate-pulse border-4 border-background" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight">Listening for Pulses</h3>
                <p className="text-muted-foreground max-w-md mx-auto font-medium">
                  Your monitors are registered. We&apos;re waiting for the first telemetry data from the Poller Service via RabbitMQ.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Awaiting SSE Stream
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.dispatchEvent(new CustomEvent('pulseboard:open-guide'))}
                  className="rounded-xl h-9 px-4 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs gap-2"
                >
                  <Book className="h-3.5 w-3.5" />
                  Quick Start Tour
                </Button>
              </div>
            </div>
          ) : (
            <ErrorBoundary>
              <StatsRow {...summary} />
            </ErrorBoundary>
          )
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-card/40 border border-border/40" />
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Charts Section */}
        <motion.div variants={item} className="xl:col-span-2 space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Telemetry Analytics
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">Latency distribution across all active endpoints.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    Real-time
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <ErrorBoundary>
                <Suspense fallback={<div className="h-[400px] w-full animate-pulse rounded-2xl bg-muted" />}>
                  <LiveChart projectId={selectedProjectId} />
                </Suspense>
              </ErrorBoundary>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar Section */}
        <motion.div variants={item} className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Monitors
              </h2>
              <Badge variant="secondary" className="rounded-lg">
                {summary?.totalMonitors || 0} Endpoints
              </Badge>
            </div>
            <ErrorBoundary>
              <MonitorGrid projectId={selectedProjectId} />
            </ErrorBoundary>
          </div>

          <Card className="border-primary/20 bg-primary/5 overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Zap className="h-5 w-5" />
                <h3 className="font-bold">Pro Tip</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your GitHub repository in settings to enable <span className="font-bold text-foreground">AI Root Cause Analysis</span>. 
                PulseBoard will automatically correlate incidents with recent code changes.
              </p>
              <Link href="/dashboard/handbook" className="p-0 h-auto text-primary text-xs font-bold gap-1 flex items-center hover:underline">
                Read Handbook <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <div className="h-6 w-24 bg-muted rounded-full" />
          <div className="h-12 w-64 bg-muted rounded-xl" />
          <div className="h-6 w-48 bg-muted rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-14 w-32 bg-muted rounded-2xl" />
          <div className="h-14 w-40 bg-muted rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 w-full bg-muted/50 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
        <div className="xl:col-span-2 h-[500px] bg-muted/40 rounded-3xl" />
        <div className="h-[500px] bg-muted/40 rounded-3xl" />
      </div>
    </div>
  );
}

function NoProjectSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-24 lg:py-40 text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
        <div className="relative h-24 w-24 rounded-3xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground/30">
          <Search className="h-12 w-12" />
        </div>
      </motion.div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-black uppercase tracking-tight">No Project Selected</h2>
        <p className="text-muted-foreground font-medium">
          Choose a project from the sidebar to view its performance dashboard and active monitors.
        </p>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        <Clock className="h-3 w-3" />
        System Ready
      </div>
    </div>
  );
}

function OnboardingHero() {
  return (
    <div className="flex flex-col items-center justify-center py-12 lg:py-24 text-center space-y-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 rotate-12">
          <Activity className="h-12 w-12" />
        </div>
      </motion.div>

      <div className="max-w-2xl space-y-4">
        <h1 className="text-5xl font-black tracking-tight lg:text-7xl leading-tight">
          Welcome to <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">PulseBoard</span>
        </h1>
        <p className="text-xl text-muted-foreground font-medium leading-relaxed">
          The AI-powered observability platform for modern microservices. 
          Start monitoring your infrastructure in minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {[
          { icon: LayoutDashboard, title: 'Scope', desc: 'Define your projects and connect GitHub repos.' },
          { icon: Zap, title: 'Monitor', desc: 'Setup intelligent uptime pings and log ingestion.' },
          { icon: Bell, title: 'Alert', desc: 'Get AI-powered root cause reports in Slack or Discord.' },
        ].map((step, i) => (
          <Card key={step.title} className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden group hover:border-primary/40 transition-all duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto group-hover:scale-110 transition-transform">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black uppercase tracking-tight text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{step.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/projects/new">
        <Button size="lg" className="rounded-2xl px-10 h-16 text-lg font-black uppercase tracking-widest group shadow-2xl shadow-primary/30 active:scale-95 transition-all">
          Build Your First Project
          <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
}
