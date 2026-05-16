'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Activity, 
  Github, 
  Zap, 
  ShieldCheck, 
  Loader2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiCall, ApiError } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';
import { cn } from '@/lib/utils';

export default function NewProjectPage() {
  useEffect(() => {
    document.title = 'New Project - PulseBoard';
  }, []);

  const router = useRouter();
  const { addProject } = useProjectStore();
  const [name, setName] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const project = await apiCall<{ id: string; name: string; slug: string; githubRepo: string | null; createdAt: string }>(
        '/projects',
        {
          method: 'POST',
          body: JSON.stringify({ name, githubRepo: githubRepo || undefined }),
          signal: ac.signal,
        },
      );
      if (ac.signal.aborted) return;
      addProject(project);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-full h-10 w-10 border border-border/40">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-sm text-muted-foreground">Start by defining your application and its ecosystem.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Zap className="h-32 w-32" />
            </div>
            <form onSubmit={handleSubmit}>
              <CardHeader className="border-b border-border/40 pb-6">
                <CardTitle>Project Details</CardTitle>
                <p className="text-sm text-muted-foreground">All fields marked with an asterisk are required.</p>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="E.g. E-commerce API"
                    className="h-12 rounded-xl bg-background/50 border-border/40 focus:bg-background transition-all text-lg font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">This helps you identify your dashboard among others.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubRepo" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    GitHub Repository (Optional)
                  </Label>
                  <div className="relative">
                    <Github className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="githubRepo"
                      placeholder="owner/repository"
                      className="h-12 pl-12 rounded-xl bg-background/50 border-border/40 focus:bg-background transition-all"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/20 mt-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>Used by AI to fetch commits during incidents for correlation.</span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3 text-destructive text-sm font-medium">
                    <ShieldCheck className="h-5 w-5" />
                    {error}
                  </div>
                )}
              </CardContent>
              <div className="p-8 border-t border-border/40 bg-muted/20 flex flex-col gap-3">
                <Button type="submit" size="lg" className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20 group" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />}
                  Create Project
                </Button>
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Instant Deployment — No Cloud Setup Required
                </p>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Why Projects?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { icon: Zap, title: 'Isolated Metrics', desc: 'Each project has its own latency history and logs.' },
                { icon: ShieldCheck, title: 'Unique API Keys', desc: 'Separate keys for different environments.' },
                { icon: Github, title: 'Commit Sync', desc: 'Map specific repos to specific incident streams.' },
              ].map((item, i) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border border-border/40">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted group">
                <Activity className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground italic">
                &quot;PulseBoard changed how we view downtime. We spent 50% less time debugging production pings.&quot;
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
