'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Terminal,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Plus,
  Command,
  Search,
  Globe,
  HelpCircle,
  User,
  Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useProjectStore } from '@/store/project.store';
import { useSSE } from '@/lib/use-sse';
import { apiCall } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PulseIndicator } from '@/components/ui/pulse-indicator';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Guide } from '@/components/dashboard/Guide';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProjectSelector } from '@/components/layout/ProjectSelector';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, accessToken, isLoading: authLoading } = useAuthStore();
  const { projects, selectedProjectId, setSelectedProjectId, fetchProjects, error: projectsError } = useProjectStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const incidentsAbortRef = useRef<AbortController | null>(null);
  const fetchCalledRef = useRef(false);

  // BUG FIX: Only fetch projects after auth has fully resolved.
  // Previously this fired while authLoading was true, causing premature
  // redirects and cancelled API calls.
  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.push('/login');
      return;
    }
    if (!fetchCalledRef.current) {
      fetchCalledRef.current = true;
      fetchProjects();
    }
  }, [authLoading, accessToken, router, fetchProjects]);

  // Reset fetch guard when access token changes (e.g., new login)
  useEffect(() => {
    fetchCalledRef.current = false;
  }, [accessToken]);

  const fetchIncidentsCount = useCallback(async () => {
    if (!selectedProjectId) return;
    if (incidentsAbortRef.current) incidentsAbortRef.current.abort();
    const ac = new AbortController();
    incidentsAbortRef.current = ac;
    try {
      const res = await apiCall<{ activeIncidents: number }>('/projects/' + selectedProjectId + '/metrics/summary', { signal: ac.signal });
      if (!ac.signal.aborted) setIncidentsCount(res.activeIncidents ?? 0);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchIncidentsCount();
    return () => {
      if (incidentsAbortRef.current) incidentsAbortRef.current.abort();
    };
  }, [fetchIncidentsCount]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setIsGuideOpen(true);
    window.addEventListener('pulseboard:open-guide', handler);
    return () => window.removeEventListener('pulseboard:open-guide', handler);
  }, []);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sseStatus = useSSE(selectedProjectId, {
    onIncident: () => setIncidentsCount(prev => prev + 1),
    onResolved: () => setIncidentsCount(prev => Math.max(0, prev - 1)),
  });

  const navigateAndClose = useCallback((href: string) => {
    setSidebarOpen(false);
    router.push(href);
  }, [router]);

  const openCommandPalette = useCallback(() => {
    setIsCommandOpen(true);
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Incidents',
      href: '/dashboard/incidents',
      icon: AlertTriangle,
      badge: incidentsCount > 0 ? incidentsCount : undefined
    },
    { label: 'Logs', href: '/dashboard/logs', icon: Terminal },
    { label: 'Handbook', href: '/dashboard/handbook', icon: Book },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary/60" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (projectsError && projects.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold">Connection Error</p>
            <p className="text-sm text-muted-foreground">
              Could not load your projects. Make sure the API server is running at{' '}
              <code className="text-primary text-xs">localhost:3001</code>.
            </p>
          </div>
          <button
            onClick={fetchProjects}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!accessToken) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0",
          !sidebarOpen && "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border/50 shrink-0">
          <button onClick={() => navigateAndClose('/dashboard')} className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight">PulseBoard</span>
          </button>
          <div className="flex items-center gap-1.5">
            {selectedProjectId && (
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  sseStatus === 'connected' ? "bg-green-500 animate-pulse" :
                  sseStatus === 'connecting' ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground/40"
                )}
                title={`Real-time: ${sseStatus}`}
              />
            )}
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-5 p-4 overflow-y-auto">
          {/* Project Selector */}
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Project
            </p>
            <ProjectSelector />
            <button onClick={() => navigateAndClose('/projects/new')} className="w-full text-left">
              <div className="flex items-center gap-2 h-9 px-2 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors w-full">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="space-y-0.5">
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Navigation
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block w-full text-left no-underline"
                >
                  <div
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-4.5 w-4.5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1.5">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 w-0.5 h-5 bg-primary rounded-r-full"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* SSE Status Mini Card — only show when project selected */}
          {selectedProject && (
            <div className="mt-auto pt-4">
              <div className={cn(
                "rounded-2xl border p-4 relative overflow-hidden group transition-all duration-300",
                sseStatus === 'connected' ? "border-green-500/20 bg-green-500/5" :
                sseStatus === 'connecting' ? "border-yellow-500/20 bg-yellow-500/5" :
                "border-border/30 bg-muted/20"
              )}>
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Globe className="h-12 w-12 text-primary" />
                </div>
                <div className="relative space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Health</p>
                  <div className="flex items-center gap-2.5">
                    <PulseIndicator
                      status={sseStatus === 'connected' ? 'UP' : sseStatus === 'connecting' ? 'PENDING' : 'DOWN'}
                      size="sm"
                    />
                    <span className="text-sm font-semibold">
                      {sseStatus === 'connected' ? 'Operational' : sseStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {sseStatus === 'connected'
                      ? 'Real-time SSE active.'
                      : sseStatus === 'connecting'
                        ? 'Establishing connection...'
                        : 'Reconnecting automatically.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-border/50 bg-card/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigateAndClose('/dashboard/profile')} className="flex items-center gap-3 min-w-0 group flex-1 text-left">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-violet-400 p-px shadow-md shadow-primary/20">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-card text-xs font-bold text-primary">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PB'}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => navigateAndClose('/dashboard/profile')}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title="Profile settings"
              >
                <User className="h-4 w-4" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main aria-label="Main content" className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/50 bg-background/60 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-muted-foreground text-xs font-medium cursor-pointer hover:bg-muted/50 transition-colors" onClick={openCommandPalette}>
              <Command className="h-3 w-3" />
              <span>K</span>
              <span className="mx-0.5 text-muted-foreground/40">·</span>
              <span>Search</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={openCommandPalette}
              className="relative hidden sm:flex items-center group"
              aria-label="Open command palette"
            >
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <div className="pl-9 pr-3 h-9 w-56 flex items-center bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-border/60 focus:bg-background transition-all rounded-xl text-xs text-muted-foreground text-left cursor-pointer select-none">
                Search resources...
              </div>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Guide */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setIsGuideOpen(true)}
              aria-label="Open guide"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border/50 mx-1" />

            {/* SSE Status Badge */}
            {selectedProjectId ? (
              <div className={cn(
                "flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-colors",
                sseStatus === 'connected'
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border/30 bg-muted/20"
              )}>
                <PulseIndicator status={sseStatus} size="sm" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:block">
                  {sseStatus === 'connected' ? 'Live' : 'Syncing'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-muted/20 px-2.5 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:block">No Project</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 relative scroll-smooth">
          <div className="mx-auto max-w-7xl w-full">
            <Breadcrumbs />
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>

      <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} onNavigate={() => setSidebarOpen(false)} />
      <Guide open={isGuideOpen} onOpenChange={setIsGuideOpen} />
    </div>
  );
}
