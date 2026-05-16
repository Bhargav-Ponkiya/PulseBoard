'use client';

import { useState, useCallback, useEffect, useMemo, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Slack,
  Globe,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Github,
  Key,
  Bell,
  BellRing,
  AlertTriangle,
  Info,
  ShieldCheck,
  Zap,
  Loader2,
  Terminal,
  Settings,
  PenBox,
  Save,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { apiCall } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';

interface AlertChannel {
  id: string;
  name: string;
  type: 'discord' | 'slack' | 'webhook';
  webhookUrl: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const allowedTabs = ['general', 'channels', 'apikey', 'github', 'danger'];
  const rawTab = searchParams.get('tab') || 'general';
  const initialTab = allowedTabs.includes(rawTab) ? rawTab : 'general';
  const [tab, setTab] = useState(initialTab);
  const { selectedProjectId, projects } = useProjectStore();

  const currentProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
    [projects, selectedProjectId]
  );

  useEffect(() => {
    document.title = 'Settings - PulseBoard';
  }, []);

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
        <div className="p-4 rounded-full bg-muted/30">
          <Settings className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No Project Selected</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">Select a project from the sidebar to manage its settings.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-sm text-muted-foreground">Manage {currentProject?.name}&apos;s configuration and integrations.</p>
      </header>

        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          <div className="border-b border-border/40 pb-px overflow-x-auto no-scrollbar -mx-1 px-1">
            <TabsList className="bg-transparent h-auto p-0 gap-4 sm:gap-8 w-max min-w-full">
              {[
                { value: 'general', label: 'General', icon: PenBox },
                { value: 'channels', label: 'Alert Channels', icon: Bell },
                { value: 'apikey', label: 'API Access', icon: Key },
                { value: 'github', label: 'GitHub Sync', icon: Github },
                { value: 'danger', label: 'Danger Zone', icon: AlertTriangle },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="relative bg-transparent h-10 px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all font-semibold text-sm gap-2"
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="general" className="mt-0">
              <GeneralTab projectId={selectedProjectId} />
            </TabsContent>
            <TabsContent value="channels" className="mt-0">
              <AlertChannelsTab projectId={selectedProjectId} />
            </TabsContent>
            <TabsContent value="apikey" className="mt-0">
              <ApiKeyTab projectId={selectedProjectId} />
            </TabsContent>
            <TabsContent value="github" className="mt-0">
              <GithubTab />
            </TabsContent>
            <TabsContent value="danger" className="mt-0">
              <DangerZoneTab projectId={selectedProjectId} />
            </TabsContent>
          </motion.div>
        </Tabs>
    </div>
    </ErrorBoundary>
  );
}

function GeneralTab({ projectId }: { projectId: string }) {
  const { projects } = useProjectStore();
  const project = projects.find(p => p.id === projectId);
  const [name, setName] = useState(project?.name ?? '');
  const [githubRepo, setGithubRepo] = useState(project?.githubRepo ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (githubRepo && !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo.trim())) {
      toast({ title: 'Invalid GitHub repo', description: 'Use the format owner/repository (e.g. my-org/my-app).', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await apiCall('/projects/' + projectId, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), githubRepo: githubRepo.trim() || null }),
      });
      toast({ title: 'Project updated', description: 'Your project settings have been saved.' });
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader className="border-b border-border/40 pb-6">
        <CardTitle className="flex items-center gap-2">
          <PenBox className="h-5 w-5 text-primary" />
          Project Settings
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project Name</Label>
            <Input id="proj-name" className="h-11 rounded-xl text-lg font-medium" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-repo">GitHub Repository</Label>
            <div className="relative">
              <Github className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input id="proj-repo" className="pl-10 h-11 rounded-xl" placeholder="owner/repository" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Format: <code className="text-primary">owner/repository</code>. Used by AI to correlate commits during incidents. Example: <code className="text-primary">my-org/my-app</code>.</p>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={saving} className="rounded-xl h-11 px-8 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

const channelConfig = {
  discord: { icon: MessageCircle, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  slack: { icon: Slack, color: 'text-green-400', bg: 'bg-green-400/10' },
  webhook: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
};

function maskWebhookUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const masked = parts.map((p, i) =>
      i === parts.length - 1 || i === parts.length - 2
        ? p.slice(0, 2) + '•'.repeat(Math.max(4, p.length - 4))
        : p,
    );
    return u.origin + masked.join('/');
  } catch {
    return url.slice(0, 20) + '...';
  }
}

function AlertChannelsTab({ projectId }: { projectId: string }) {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', type: 'webhook', webhookUrl: '' });
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const abortRef_ = useRef<AbortController | null>(null);

  const loadChannels = useCallback(async () => {
    if (abortRef_.current) abortRef_.current.abort();
    const ac = new AbortController();
    abortRef_.current = ac;

    setLoading(true);
    setFetchError(false);
    try {
      const data = await apiCall<AlertChannel[]>('/projects/' + projectId + '/alert-channels', { signal: ac.signal });
      if (!ac.signal.aborted) setChannels(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setFetchError(true);
      setChannels([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChannels();
    return () => {
      if (abortRef_.current) abortRef_.current.abort();
    };
  }, [loadChannels]);

  const toggleChannel = async (id: string, isActive: boolean) => {
    try {
      await apiCall('/projects/' + projectId + '/alert-channels/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      setChannels(prev => prev.map(c => c.id === id ? { ...c, isActive } : c));
      toast({ title: isActive ? 'Channel activated' : 'Channel paused', description: 'Notification settings updated.' });
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      await apiCall('/projects/' + projectId + '/alert-channels/' + id, { method: 'DELETE' });
      setChannels(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Channel deleted', description: 'Alert channel removed successfully.' });
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  const addChannel = async () => {
    if (!newChannel.name || !newChannel.webhookUrl) return;
    try {
      const created = await apiCall<AlertChannel>('/projects/' + projectId + '/alert-channels', {
        method: 'POST',
        body: JSON.stringify(newChannel),
      });
      setChannels(prev => [...prev, created]);
      setSheetOpen(false);
      setNewChannel({ name: '', type: 'webhook', webhookUrl: '' });
      toast({ title: 'Channel added', description: newChannel.name + ' will receive incident alerts.' });
    } catch (err) {
      toast({ title: 'Create failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  const testChannel = async () => {
    if (!newChannel.webhookUrl) return;
    setTestLoading(true);
    try {
      await apiCall('/projects/' + projectId + '/alert-channels/test', {
        method: 'POST',
        body: JSON.stringify(newChannel),
      });
      toast({ title: 'Test sent!', description: 'Check your ' + newChannel.type + ' channel for the test notification.' });
    } catch (err) {
      toast({ title: 'Test failed', description: err instanceof Error ? err.message : 'Could not reach the webhook URL.', variant: 'destructive' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6">
        <div className="space-y-1">
          <CardTitle>Alert Channels</CardTitle>
          <p className="text-sm text-muted-foreground">Get notified when monitors go down or incidents are resolved.</p>
        </div>
        <Button size="sm" onClick={() => setSheetOpen(true)} className="rounded-xl shadow-lg shadow-primary/10">
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <p className="text-sm font-bold text-destructive">Failed to load alert channels</p>
            <p className="text-xs text-muted-foreground max-w-xs">The server could not be reached. Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={loadChannels} className="rounded-xl">Retry</Button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/30">
              <Bell className="h-10 w-10" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">No channels configured. Add one to start receiving alerts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {channels.map((ch) => {
              const config = channelConfig[ch.type] || channelConfig.webhook;
              const Icon = config.icon;
              return (
                <div key={ch.id} className="group relative flex items-center gap-5 rounded-[1.25rem] border border-border/40 bg-card/20 p-5 transition-all duration-300 hover:bg-card/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
                  <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110", config.bg, config.color)}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base tracking-tight">{ch.name}</p>
                      <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-black uppercase tracking-tighter opacity-70">
                        {ch.type}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground/60 font-mono tracking-tight" title={ch.webhookUrl}>
                      {maskWebhookUrl(ch.webhookUrl)}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", ch.isActive ? "text-primary" : "text-muted-foreground/40")}>
                        {ch.isActive ? 'Active' : 'Paused'}
                      </span>
                      <Switch checked={ch.isActive} onCheckedChange={(val) => toggleChannel(ch.id, val)} />
                    </div>
                    <AlertDialog
                      title="Delete Alert Channel?"
                      description={`Are you sure you want to remove ${ch.name}? This action cannot be undone.`}
                      confirmLabel="Delete"
                      cancelLabel="Cancel"
                      variant="destructive"
                      onConfirm={() => deleteChannel(ch.id)}
                    >
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Add Channel">
        <div className="space-y-8 py-2">
          <SheetHeader className="mb-0">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
              <BellRing className="h-6 w-6" />
            </div>
            <SheetTitle className="text-2xl font-black tracking-tight mb-2">Configure Alerts</SheetTitle>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Bridge PulseBoard with your team&apos;s workflow. 
              Select a provider and provide a secure webhook URL.
            </p>
          </SheetHeader>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                Select Provider
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {(['discord', 'slack', 'webhook'] as const).map((type) => {
                  const cfg = channelConfig[type];
                  const Icon = cfg.icon;
                  const isActive = newChannel.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewChannel(p => ({ ...p, type }))}
                      className={cn(
                        "group relative flex flex-col items-center justify-center gap-3 p-4 rounded-[1.5rem] border-2 transition-all duration-300",
                        isActive 
                          ? "border-primary bg-primary/5 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                          : "border-border/40 hover:border-border/80 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500",
                        isActive ? cfg.bg + " scale-110 shadow-lg shadow-black/5" : "bg-muted/50"
                      )}>
                        <Icon className={cn("h-5 w-5", isActive ? cfg.color : "text-muted-foreground")} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                      {isActive && (
                        <motion.div layoutId="active-pill" className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                          <Check className="h-2 w-2 text-primary-foreground" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ch-name" className="text-[10px] font-black uppercase tracking-widest ml-1">Friendly Name</Label>
                <Input 
                  id="ch-name" 
                  placeholder="Engineering Alerts" 
                  className="h-12 rounded-xl bg-muted/20 border-border/40 font-bold focus:ring-primary/20" 
                  value={newChannel.name} 
                  onChange={(e) => setNewChannel(p => ({ ...p, name: e.target.value }))} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ch-url" className="text-[10px] font-black uppercase tracking-widest ml-1">Webhook Endpoint</Label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary/50 transition-colors" />
                  <Input 
                    id="ch-url" 
                    placeholder="https://hooks..." 
                    className="pl-12 h-12 rounded-xl bg-muted/20 border-border/40 font-mono text-[11px] focus:ring-primary/20" 
                    value={newChannel.webhookUrl} 
                    onChange={(e) => setNewChannel(p => ({ ...p, webhookUrl: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Setup Instructions</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  {newChannel.type === 'discord' && <p>Create a webhook in <strong className="text-foreground">Discord &rarr; Channel Settings &rarr; Integrations</strong>.</p>}
                  {newChannel.type === 'slack' && <p>Install <strong className="text-foreground">Incoming Webhooks</strong> in your Slack workspace apps.</p>}
                  {newChannel.type === 'webhook' && <p>Point to any endpoint that accepts <strong className="text-foreground">POST</strong> requests.</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={addChannel} 
                disabled={!newChannel.name || !newChannel.webhookUrl} 
                className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all"
              >
                Create Channel
              </Button>
              <Button 
                variant="ghost" 
                onClick={testChannel} 
                disabled={testLoading || !newChannel.webhookUrl} 
                className="w-full h-12 rounded-xl border border-border/40 bg-transparent hover:bg-muted/50 font-bold gap-2 text-xs"
              >
                {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />}
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </Sheet>
    </Card>
  );
}

const CURL_SNIPPET = 'curl -X POST http://localhost:3003/ingest/logs \\\n  -H "X-API-Key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"level":"error","message":"..."}\'';

function ApiKeyTab({ projectId }: { projectId: string }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  const keyAbortRef = useRef<AbortController | null>(null);

  const loadKey = useCallback(async () => {
    if (keyAbortRef.current) keyAbortRef.current.abort();
    const ac = new AbortController();
    keyAbortRef.current = ac;

    setLoading(true);
    try {
      const data = await apiCall<{ apiKeyMasked: string }>('/projects/' + projectId, { signal: ac.signal });
      if (!ac.signal.aborted) setApiKey(data.apiKeyMasked);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadKey();
    return () => {
      if (keyAbortRef.current) keyAbortRef.current.abort();
    };
  }, [loadKey]);

  const revealKey = async () => {
    setRevealLoading(true);
    try {
      const data = await apiCall<{ apiKey: string }>('/projects/' + projectId + '/reveal-key', { method: 'POST' });
      setApiKey(data.apiKey);
      setShowKey(true);
    } catch (err) {
      toast({ title: 'Reveal failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setRevealLoading(false);
    }
  };

  const regenKey = async () => {
    try {
      const data = await apiCall<{ apiKey: string }>('/projects/' + projectId + '/regenerate-key', { method: 'POST' });
      setApiKey(data.apiKey);
      setShowKey(true);
      toast({ title: 'API key regenerated', description: 'The old key has been revoked. Update any services using it.' });
    } catch (err) {
      toast({ title: 'Regenerate failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  const hideKey = () => {
    setShowKey(false);
    loadKey();
  };

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>API Access</CardTitle>
        <p className="text-sm text-muted-foreground">Authentication for log ingestion and external monitoring. The full key is never shown by default — reveal it only when needed.</p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : !apiKey ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <p className="text-sm font-bold text-destructive">Failed to load API key</p>
            <p className="text-xs text-muted-foreground max-w-xs">Could not retrieve your project API key. Try refreshing the page or contact support.</p>
            <Button variant="outline" size="sm" onClick={loadKey} className="rounded-xl">Retry</Button>
          </div>
        ) : (
          <>
          <div className="space-y-4">
            <Label>Project API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <pre className="h-11 flex items-center px-4 rounded-xl border border-border/40 bg-background/50 font-mono text-sm tracking-widest overflow-hidden select-none">
                  {showKey ? apiKey : '•'.repeat(32)}
                </pre>
                <div className="absolute right-2 top-1.5 flex gap-1">
                  {showKey ? (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={hideKey}>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={copyKey}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={revealKey} disabled={revealLoading}>
                      {revealLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
              <AlertDialog
                title="Regenerate API Key?"
                description="The old key will stop working immediately. This cannot be undone."
                confirmLabel="Regenerate"
                cancelLabel="Cancel"
                onConfirm={regenKey}
              >
                <Button variant="outline" className="rounded-xl h-11 border-border/40">Regenerate</Button>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
              <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
                <Terminal className="h-4 w-4" />
                Log Ingestion
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use this key in the <code>X-API-Key</code> header when sending logs to our ingestor at <code>POST /ingest/logs</code>.
              </p>
              <pre className="p-3 rounded-lg bg-background/50 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                {CURL_SNIPPET}
              </pre>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
              <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                Security Policy
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Never share your API key in client-side code. This key provides full log ingestion access.
                The key is hashed with SHA-256 at rest — we never store the raw key.
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500/70">
                <AlertTriangle className="h-3 w-3" />
                DO NOT EXPOSE IN BROWSER
              </div>
            </div>
          </div>
        </>)}
      </CardContent>
    </Card>
  );
}

function GithubTab() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const githubAbortRef = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    if (githubAbortRef.current) githubAbortRef.current.abort();
    const ac = new AbortController();
    githubAbortRef.current = ac;

    setLoading(true);
    setStatusError(null);
    try {
      const data = await apiCall<{ connected: boolean }>('/github/status', { signal: ac.signal });
      if (!ac.signal.aborted) {
        setConnected(data.connected);
        setStatusError(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setConnected(false);
      setStatusError('Failed to check GitHub connection.');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    return () => {
      if (githubAbortRef.current) githubAbortRef.current.abort();
    };
  }, [checkConnection]);

  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveToken = async () => {
    const trimmedToken = token.trim();
    setValidating(true);
    setError(null);
    try {
      // 1. Validate
      await apiCall('/github/validate', {
        method: 'POST',
        body: JSON.stringify({ token: trimmedToken }),
      });

      // 2. Save
      await apiCall('/github/token', {
        method: 'POST',
        body: JSON.stringify({ token: trimmedToken }),
      });
      setConnected(true);
      setToken('');
      toast({ title: 'GitHub connected', description: 'Your token has been saved and encrypted. AI will now correlate commits during incidents.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate or save token';
      setError(message);
    } finally {
      setValidating(false);
    }
  };

  const clearToken = async () => {
    try {
      await apiCall('/github/token', { method: 'DELETE' });
      toast({ title: 'GitHub disconnected', description: 'Your token has been removed.' });
      setConnected(false);
    } catch (err) {
      toast({ title: 'Disconnect failed', description: err instanceof Error ? err.message : 'Could not remove token.', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>GitHub Integration</CardTitle>
        <p className="text-sm text-muted-foreground">Correlate system outages with recent code changes.</p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {loading ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/20">
          <div className="flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", connected ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
              <Github className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-sm">{connected ? 'Connected to GitHub' : 'Disconnected'}</p>
              <p className="text-xs text-muted-foreground">{connected ? 'PulseBoard can fetch commits for root cause analysis.' : 'Connect to enable AI commit-correlation.'}</p>
            </div>
          </div>
          {connected && (
            <Button variant="ghost" size="sm" onClick={clearToken} className="text-destructive hover:bg-destructive/10">Disconnect</Button>
          )}
        </div>
        )}
        {statusError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {statusError}
            <Button variant="ghost" size="sm" onClick={checkConnection} className="ml-auto h-7 text-xs">Retry</Button>
          </div>
        )}

        {!connected && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Personal Access Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Input 
                    type={showToken ? 'text' : 'password'} 
                    placeholder="ghp_..." 
                    value={token} 
                    onChange={e => setToken(e.target.value)} 
                    className="pr-10 h-11 rounded-xl"
                  />
                  <button type="button" className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground" onClick={() => setShowToken(!showToken)} aria-label={showToken ? 'Hide token' : 'Show token'}>
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={saveToken} disabled={!token || validating} className="h-11 rounded-xl px-8 min-w-[140px]">
                  {validating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {validating ? 'Validating...' : 'Save Token'}
                </Button>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}
            </div>
            
            <div className="rounded-2xl bg-muted/20 border border-border/40 p-6 space-y-4">
              <h4 className="flex items-center gap-2 font-bold text-sm">
                <Info className="h-4 w-4 text-primary" />
                Token Requirements
              </h4>
              <ul className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> <span>repo scope (full)</span></li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> <span>read:user scope</span></li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> <span>Encrypted at rest</span></li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> <span>Local-only processing</span></li>
              </ul>
              <Separator className="bg-border/20" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tokens are only used at the moment of an incident. Our AI pulls the last 3 commits from your configured repository to see if a recent deploy caused the outage.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DangerZoneTab({ projectId }: { projectId: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const removeProject = useProjectStore((s) => s.removeProject);
  const { projects } = useProjectStore();
  const project = projects.find(p => p.id === projectId);

  const handleDelete = async () => {
    if (confirmText !== project?.name) return;
    setLoading(true);
    try {
      await apiCall('/projects/' + projectId, { method: 'DELETE' });
      removeProject(projectId);
      toast({ title: 'Project Purged', description: 'Monitoring data and historical logs have been deleted.', variant: 'destructive' });
      router.push('/dashboard');
    } catch (err) {
      toast({ title: 'Purge Failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-md overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <ShieldAlert className="h-40 w-40 text-destructive" />
      </div>
      <CardHeader className="p-8 border-b border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive flex items-center justify-center text-white shadow-lg shadow-destructive/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-destructive uppercase tracking-tight">Critical Actions</CardTitle>
            <CardDescription className="text-sm font-bold text-destructive/70">Proceed with extreme caution. These actions are irreversible.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 rounded-3xl border border-destructive/30 bg-background/50 shadow-2xl shadow-destructive/5">
          <div className="space-y-2">
            <h4 className="text-lg font-black uppercase tracking-tight text-destructive">Destroy Project</h4>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              This will permanently delete the <span className="font-bold text-foreground underline decoration-destructive/30">{project?.name}</span> workspace, 
              including all monitors, historical metrics, AI incident reports, and ingested logs. 
              API keys associated with this project will be immediately revoked.
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            className="h-14 px-10 rounded-2xl gap-3 shadow-2xl shadow-destructive/40 font-black uppercase tracking-widest text-xs transition-all active:scale-95 shrink-0"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-5 w-5" />
            Delete Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-border/40 bg-muted/20 flex gap-4">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">Data Retention</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Deletion triggers an immediate purge of MongoDB documents and PostgreSQL records. 
                S3 stored assets (if any) are deleted within 24 hours.
              </p>
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-border/40 bg-muted/20 flex gap-4">
            <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">Audit Logging</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                A permanent audit record of this deletion will be stored in your account history for compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive">
              <Trash2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-destructive">Purge Confirmation</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                You are about to delete <span className="font-bold text-foreground">{project?.name}</span>. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type project name to confirm</Label>
              <Input 
                placeholder={project?.name} 
                className="h-14 rounded-2xl border-destructive/30 focus:ring-destructive/10 text-center font-bold text-lg"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>

            <Button 
              variant="destructive" 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-destructive/20"
              disabled={confirmText !== project?.name || loading}
              onClick={handleDelete}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Trash2 className="h-5 w-5 mr-2" />}
              {loading ? 'Deleting...' : 'I Understand, Delete Project'}
            </Button>
          </div>
        </div>
      </Sheet>
    </Card>
  );
}


