'use client';

import { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  ExternalLink, 
  Settings2, 
  Trash2, 
  Clock, 
  Globe,
  AlertTriangle,
  Loader2,
  Check,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiCall } from '@/lib/api';
import { PulseIndicator } from '@/components/ui/pulse-indicator';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  intervalSeconds: number;
  expectedStatus?: number;
  timeoutMs?: number;
  currentStatus: string;
  lastCheckedAt?: string;
  projectId: string;
}

interface MonitorCardProps {
  monitor: Monitor;
  onUpdate: () => void;
}

export function MonitorCard({ monitor, onUpdate }: MonitorCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editName, setEditName] = useState(monitor.name);
  const [editUrl, setEditUrl] = useState(monitor.url);
  const [editInterval, setEditInterval] = useState(monitor.intervalSeconds);
  const [editExpectedStatus, setEditExpectedStatus] = useState(monitor.expectedStatus ?? 200);
  const [editTimeout, setEditTimeout] = useState(monitor.timeoutMs ?? 10000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditName(monitor.name);
      setEditUrl(monitor.url);
      setEditInterval(monitor.intervalSeconds);
      setEditExpectedStatus(monitor.expectedStatus ?? 200);
      setEditTimeout(monitor.timeoutMs ?? 10000);
    }
  }, [monitor, isEditing]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/projects/' + monitor.projectId + '/monitors/' + monitor.id, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, url: editUrl, intervalSeconds: Number(editInterval), expectedStatus: editExpectedStatus, timeoutMs: editTimeout }),
      });
      setIsEditing(false);
      onUpdate();
      toast({ title: 'Monitor updated', description: 'Changes to ' + editName + ' saved successfully.' });
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiCall('/projects/' + monitor.projectId + '/monitors/' + monitor.id, {
        method: 'DELETE',
      });
      setIsDeleting(false);
      onUpdate();
      toast({ title: 'Monitor deleted', description: monitor.name + ' has been removed.' });
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <PulseIndicator status={monitor.currentStatus} size="md" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{monitor.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">{monitor.url}</p>
                  <a href={monitor.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => setIsDeleting(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Every {monitor.intervalSeconds}s
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary" />
              {monitor.lastCheckedAt 
                ? formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true, includeSeconds: true })
                : 'Not checked'}
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              {monitor.type}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-background/50 border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all"
              onClick={async () => {
                setLoading(true);
                try {
                  await apiCall('/projects/' + monitor.projectId + '/monitors/' + monitor.id + '/check', { method: 'POST' });
                  toast({ title: 'Check Triggered', description: 'Request sent to Poller Service.' });
                  onUpdate();
                } catch (err) {
                  toast({ title: 'Check Failed', description: err instanceof Error ? err.message : 'Could not trigger check', variant: 'destructive' });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
              Check Now
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 rounded-xl border border-border/40 bg-background/50"
              onClick={() => window.open(monitor.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>

          {/* Mini Latency Bar Visualization */}
          <div className="mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
            <motion.div 
              key={monitor.currentStatus + monitor.id}
              initial={{ width: 0 }}
              animate={{ width: monitor.currentStatus === 'UP' ? '100%' : '0%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn("h-full", monitor.currentStatus === 'UP' ? "bg-green-500" : "bg-red-500")} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setIsEditing(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md"
            >
              <Card className="shadow-2xl border-primary/20">
                <form onSubmit={handleUpdate}>
                  <div className="p-6 space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">Monitor Settings</h2>
                      <p className="text-sm text-muted-foreground">Adjust your monitoring parameters.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Monitor Name</Label>
                        <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-url">Target URL</Label>
                        <Input id="edit-url" type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-interval">Interval (sec)</Label>
                          <Input id="edit-interval" type="number" min="10" value={editInterval} onChange={(e) => setEditInterval(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-status">Expected Status</Label>
                          <Input id="edit-status" type="number" min="100" max="599" value={editExpectedStatus} onChange={(e) => setEditExpectedStatus(Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-timeout">Timeout (ms)</Label>
                        <Input id="edit-timeout" type="number" min="1000" step="1000" value={editTimeout} onChange={(e) => setEditTimeout(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t p-6 bg-muted/20">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading} className="gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setIsDeleting(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm"
            >
              <Card className="shadow-2xl border-destructive/20" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title">
                <div className="p-6 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h2 id="delete-dialog-title" className="text-xl font-bold">Delete Monitor?</h2>
                    <p className="text-sm text-muted-foreground">
                      This will permanently stop monitoring <b>{monitor.name}</b> and delete all history.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-6 bg-muted/20 border-t">
                  <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm Deletion
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setIsDeleting(false)} disabled={loading}>Cancel</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
