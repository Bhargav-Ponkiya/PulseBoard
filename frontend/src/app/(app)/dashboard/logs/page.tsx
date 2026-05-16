'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  Terminal,
  Info,
  Loader2,
  X,
  Copy,
  Check,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiCall } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';
import { INGESTOR_BASE_URL } from '@/lib/config';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Log {
  _id: string;
  projectId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

interface LogsResponse {
  data: Log[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const levelConfig = {
  error: { variant: 'destructive' as const, className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  warn: { variant: 'default' as const, className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  info: { variant: 'secondary' as const, className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  debug: { variant: 'secondary' as const, className: 'text-muted-foreground bg-muted/30 border-border/20' },
};

export default function LogsPage() {
  const { selectedProjectId, loading: projectsLoading } = useProjectStore();

  // BUG FIX: Start with loading=false. Only set true when a real fetch begins.
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [showInfo, setShowInfo] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.title = 'Logs — PulseBoard';
  }, []);

  const fetchLogs = useCallback(async (
    searchTerm: string,
    levelFilter: string,
    pageNum: number,
    signal?: AbortSignal,
  ) => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (levelFilter !== 'all') query.append('level', levelFilter);
      query.append('page', String(pageNum));
      query.append('limit', '25');

      const res = await apiCall<LogsResponse>('/projects/' + selectedProjectId + '/logs?' + query.toString(), { signal });
      if (signal?.aborted) return;
      setLogs(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
      setHasFetched(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      setLogs([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [selectedProjectId]);

  // BUG FIX: Restructured effect to properly handle abort without aborting itself.
  // Previous pattern aborted the controller it just created in the cleanup.
  useEffect(() => {
    // Reset state when project changes
    if (!selectedProjectId) {
      setLogs([]);
      setError('');
      setHasFetched(false);
      setLoading(false);
      return;
    }

    // Clear any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();

    // Create fresh controller for this fetch
    const ac = new AbortController();
    abortRef.current = ac;

    debounceRef.current = setTimeout(() => {
      fetchLogs(search, level, page, ac.signal);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Only abort if this is the current controller (prevents aborting next request's controller)
      if (abortRef.current === ac) {
        ac.abort();
        abortRef.current = null;
      }
    };
  }, [search, level, page, selectedProjectId, fetchLogs]);

  const handleManualRefresh = () => {
    if (!selectedProjectId) return;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPage(1);
    fetchLogs(search, level, 1, ac.signal);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs-' + new Date().toISOString() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySnippet = () => {
    const snippet = `curl -X POST ${INGESTOR_BASE_URL}/ingest/logs \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "level": "error", "message": "...", "metadata": {} }'`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // BUG FIX: Proper empty state when no project is selected
  if (!projectsLoading && !selectedProjectId) {
    return (
      <ErrorBoundary>
        <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="h-20 w-20 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground">
              <Terminal className="h-10 w-10 opacity-40" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Project Selected</h1>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Select a project from the sidebar to explore its application logs.
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Logs Explorer</h1>
          <p className="text-sm text-muted-foreground">Search and analyze application logs in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {!showInfo && (
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowInfo(true)}>
              <Info className="mr-2 h-4 w-4" />
              Show Guide
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl border-border/40" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 bg-primary/5 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Info className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">How to send logs to PulseBoard?</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setShowInfo(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Send logs to our ingestor endpoint via HTTP POST. Use your Project API Key (Settings → API Access) for authentication.
                      Logs are automatically embedded for AI-powered incident correlation.
                    </p>
                    <div className="relative group">
                      <pre className="p-4 rounded-xl bg-card border border-border/40 text-xs font-mono overflow-x-auto text-primary/80 leading-relaxed">
                        <code>{`curl -X POST ${INGESTOR_BASE_URL}/ingest/logs \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "level": "error", "message": "...", "metadata": {} }'`}</code>
                      </pre>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={copySnippet}
                      >
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by message or metadata..."
                className="pl-9 bg-background/50 border-border/40 focus:bg-background transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/40 bg-background/50">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={level}
                  onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <Button onClick={handleManualRefresh} disabled={loading} className="gap-2 px-5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">Failed to load logs</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setPage(1); handleManualRefresh(); }} className="rounded-full">
                  Retry
                </Button>
              </div>
            ) : loading && !hasFetched ? (
              <TableSkeleton rows={8} />
            ) : logs.length === 0 && hasFetched && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="p-4 rounded-full bg-muted/30">
                  <Terminal className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">
                    {search
                      ? `No results for "${search}"`
                      : level !== 'all'
                        ? `No ${level} logs found`
                        : 'No logs found'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {search
                      ? 'Try a different search term or clear the search.'
                      : 'Send logs to the ingestor endpoint to see them here.'}
                  </p>
                </div>
              </div>
            ) : loading && hasFetched ? (
              /* Overlay loading while refreshing — show existing logs with opacity */
              <div className="relative">
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-start justify-center pt-8">
                  <div className="flex items-center gap-2 bg-card border border-border/40 rounded-full px-4 py-2 shadow-lg text-xs font-medium text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Refreshing...
                  </div>
                </div>
                <LogTable logs={logs} />
              </div>
            ) : (
              <LogTable logs={logs} />
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-xl h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}

function LogTable({ logs }: { logs: Log[] }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead className="sticky top-0 z-10 bg-card border-b border-border/40">
        <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <th className="px-6 py-4 w-[90px]">Level</th>
          <th className="px-6 py-4 w-[180px]">Timestamp</th>
          <th className="px-6 py-4 min-w-[200px]">Message</th>
          <th className="px-6 py-4 w-[200px] hidden md:table-cell">Metadata</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/20">
        <AnimatePresence>
          {logs.map((log, i) => {
            const cfg = levelConfig[log.level] || levelConfig.info;
            return (
              <motion.tr
                key={log._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.15 }}
                className="group hover:bg-primary/5 transition-colors"
              >
                <td className="px-6 py-3.5">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize",
                    cfg.className
                  )}>
                    {log.level}
                  </span>
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-3.5 text-sm font-medium group-hover:text-primary transition-colors">
                  <code className="bg-transparent break-all">{log.message}</code>
                </td>
                <td className="px-6 py-3.5 hidden md:table-cell">
                  <div className="flex gap-1 flex-wrap max-w-[180px]">
                    {Object.entries(log.metadata).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="px-1.5 py-0.5 rounded bg-muted/30 text-[10px] text-muted-foreground truncate border border-border/20">
                        {k}: {String(v)}
                      </span>
                    ))}
                    {Object.keys(log.metadata).length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{Object.keys(log.metadata).length - 3}</span>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
    </table>
  );
}
