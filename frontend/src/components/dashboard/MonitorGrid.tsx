'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Zap,
  Loader2,
  Check,
  AlertCircle,
  RefreshCcw,
  X,
  Globe,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MonitorCard } from './MonitorCard';
import { apiCall } from '@/lib/api';
import { useSSE } from '@/lib/use-sse';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  intervalSeconds: number;
  currentStatus: string;
  lastCheckedAt?: string;
  projectId: string;
}

export function MonitorGrid({ projectId }: { projectId: string }) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // BUG FIX: isAdding must be declared at the top level, not inside a conditional branch.
  // Previously the modal was inside the main return block which was only reached
  // when monitors.length > 0 — so the empty-state "Add first monitor" button
  // called setIsAdding(true) but the modal never rendered.
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newInterval, setNewInterval] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const fetchRef = useRef(0);

  const fetchMonitors = useCallback(async () => {
    const gen = ++fetchRef.current;
    setLoading(true);
    setError('');
    try {
      const data = await apiCall<Monitor[]>('/projects/' + projectId + '/monitors');
      if (gen === fetchRef.current) setMonitors(data);
    } catch (err) {
      if (gen === fetchRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load monitors');
      }
    } finally {
      if (gen === fetchRef.current) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  useSSE(projectId, {
    onMetric: (data) => {
      setMonitors((prev) =>
        prev.map((m) =>
          m.id === data.monitorId
            ? { ...m, currentStatus: data.status }
            : m,
        ),
      );
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall('/projects/' + projectId + '/monitors', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          url: newUrl,
          intervalSeconds: newInterval,
        }),
      });
      setNewName('');
      setNewUrl('');
      setNewInterval(60);
      setIsAdding(false);
      await fetchMonitors();
      toast({ title: '✓ Monitor created', description: newName + ' is now being monitored every ' + newInterval + 's.' });
    } catch (err) {
      toast({ title: 'Create failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setNewName('');
    setNewUrl('');
    setNewInterval(60);
    setIsAdding(true);
  };

  // BUG FIX: Single unified return — no more early returns.
  // The <AnimatePresence> modal is always in the render tree.
  // Content varies by state (loading / error / empty / list) via conditionals.
  return (
    <div className="space-y-4">
      {/* State: Loading */}
      {loading && monitors.length === 0 && (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-muted/50 border border-border/20" />
          ))}
        </div>
      )}

      {/* State: Error */}
      {!loading && error && monitors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="p-3 rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm">Failed to load monitors</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMonitors} className="rounded-full gap-2">
            <RefreshCcw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {/* State: Empty — no monitors yet */}
      {!loading && !error && monitors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-4 rounded-xl border border-dashed border-border/50 bg-muted/10 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-[30px] rounded-full" />
            <div className="relative p-4 rounded-full bg-muted/30">
              <Zap className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-base">No monitors yet</p>
            <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
              Add an HTTP endpoint to start tracking uptime and latency.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
            onClick={openModal}
          >
            <Plus className="h-4 w-4" />
            Add Your First Monitor
          </Button>
        </div>
      )}

      {/* State: Monitor list */}
      {monitors.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {monitors.map((monitor, i) => (
              <motion.div
                key={monitor.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <MonitorCard monitor={monitor} onUpdate={fetchMonitors} />
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            className="h-20 w-full flex-col gap-2 rounded-xl border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300"
            onClick={openModal}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold">Add New Monitor</span>
          </Button>
        </div>
      )}

      {/* ============================================================
          Modal — ALWAYS rendered (outside all conditional branches).
          This is the critical fix: previously this was inside the
          monitors.length > 0 branch, so it never appeared for empty state.
          ============================================================ */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => !submitting && setIsAdding(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg"
            >
              <Card className="shadow-2xl border-border/60 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">New Monitor</h2>
                      <p className="text-xs text-muted-foreground">HTTP/HTTPS health check endpoint</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => !submitting && setIsAdding(false)}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate}>
                  <div className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="mon-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Monitor Name *
                      </Label>
                      <Input
                        id="mon-name"
                        placeholder="E.g. API Gateway, Frontend, Database"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                        autoFocus
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mon-url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Endpoint URL *
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mon-url"
                          type="url"
                          placeholder="https://api.myapp.com/health"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="h-11 pl-10 rounded-xl"
                          required
                          disabled={submitting}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Must return a 2xx status code to be considered UP.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mon-interval" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Check Interval
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Clock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="mon-interval"
                            type="number"
                            min="30"
                            max="3600"
                            value={newInterval}
                            onChange={(e) => setNewInterval(Number(e.target.value))}
                            className="h-11 pl-10 rounded-xl"
                            required
                            disabled={submitting}
                          />
                        </div>
                        <div className="flex gap-1">
                          {[30, 60, 300].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setNewInterval(s)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                                newInterval === s
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {s < 60 ? `${s}s` : `${s / 60}m`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {[
                        { icon: Check, text: 'HTTP/HTTPS support' },
                        { icon: Check, text: 'Real-time SSE updates' },
                        { icon: Check, text: 'AI root cause analysis' },
                        { icon: Check, text: 'Custom intervals (30s+)' },
                      ].map((f) => (
                        <div key={f.text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <f.icon className="h-3 w-3 text-primary shrink-0" />
                          {f.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/20 border-t border-border/40">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsAdding(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !newName || !newUrl}
                      className="gap-2 px-6 shadow-lg shadow-primary/20"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {submitting ? 'Creating...' : 'Create Monitor'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
