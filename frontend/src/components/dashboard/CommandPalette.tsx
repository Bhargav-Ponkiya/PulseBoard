'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  LayoutDashboard,
  AlertTriangle,
  Terminal,
  Settings,
  Plus,
  Activity,
  Github,
  Zap,
  Globe,
  Loader2,
  HelpCircle,
  LucideIcon,
  ChevronRight,
  Book,
  User,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '@/store/project.store';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
  onHelp?: () => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange, onNavigate }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const router = useRouter();
  const { projects, setSelectedProjectId, loading: projectsLoading } = useProjectStore();

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  const runCommand = React.useCallback((command: () => void) => {
    setIsOpen(false);
    onNavigate?.();
    command();
  }, [setIsOpen, onNavigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 sm:p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/40 bg-card/80 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
          >
            <Command className="flex h-full w-full flex-col">
              <div className="flex items-center border-b border-border/40 px-6">
                <Search className="mr-3 h-6 w-6 shrink-0 text-primary animate-pulse" />
                <Command.Input
                  placeholder="Search projects, monitors, logs, or documentation..."
                  className="flex h-16 w-full bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                />
              </div>
              <Command.List className="max-h-[500px] overflow-y-auto overflow-x-hidden p-3 scrollbar-none">
                <Command.Empty className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">No resources matching your search.</p>
                  </div>
                </Command.Empty>
                
                <Command.Group heading="Navigation" className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  <Item icon={LayoutDashboard} onSelect={() => runCommand(() => router.push('/dashboard'))} shortcut="D">Dashboard</Item>
                  <Item icon={AlertTriangle} onSelect={() => runCommand(() => router.push('/dashboard/incidents'))} shortcut="I">Incidents</Item>
                  <Item icon={Terminal} onSelect={() => runCommand(() => router.push('/dashboard/logs'))} shortcut="L">Logs Explorer</Item>
                  <Item icon={Book} onSelect={() => runCommand(() => router.push('/dashboard/handbook'))} shortcut="H">Dev Handbook</Item>
                </Command.Group>

                <Separator />

                <Command.Group heading="Account" className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  <Item icon={User} onSelect={() => runCommand(() => router.push('/dashboard/profile'))} shortcut="P">Profile Settings</Item>
                  <Item icon={Settings} onSelect={() => runCommand(() => router.push('/dashboard/settings'))} shortcut="S">Platform Config</Item>
                </Command.Group>

                <Separator />

                <Command.Group heading="Switch Project" className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-6 gap-3 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Fetching project index...
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                      Initialize a project to unlock full potential.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <Item 
                        key={project.id} 
                        icon={Activity} 
                        onSelect={() => runCommand(() => {
                          setSelectedProjectId(project.id);
                          router.push('/dashboard');
                        })}
                      >
                        {project.name}
                      </Item>
                    ))
                  )}
                  <Item icon={Plus} onSelect={() => runCommand(() => router.push('/projects/new'))} className="text-primary font-bold">New Project Instance</Item>
                </Command.Group>

                <Separator />

                <Command.Group heading="Integration" className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  <Item icon={Github} onSelect={() => runCommand(() => router.push('/dashboard/settings?tab=github'))}>Synchronize GitHub Repository</Item>
                  <Item icon={Zap} onSelect={() => runCommand(() => router.push('/dashboard/settings?tab=channels'))}>Configure Alert Channels</Item>
                  <Item icon={HelpCircle} onSelect={() => runCommand(() => { const e = new CustomEvent('pulseboard:open-guide'); window.dispatchEvent(e); })}>Interactive Platform Guide</Item>
                </Command.Group>
              </Command.List>
            </Command>
            <div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-6">
                <Kbd label="Enter" action="Select" />
                <Kbd label="↑↓" action="Navigate" />
                <Kbd label="Esc" action="Close" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Zap className="h-3 w-3 fill-primary" />
                Lightning Search
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Item({ 
  icon: Icon, 
  children, 
  onSelect,
  shortcut,
  className
}: { 
  icon: LucideIcon, 
  children: React.ReactNode, 
  onSelect: () => void,
  shortcut?: string,
  className?: string
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "group flex cursor-pointer select-none items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium outline-none transition-all aria-selected:bg-primary/10 aria-selected:text-primary hover:bg-primary/5",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-aria-selected:bg-primary/20 group-aria-selected:text-primary transition-all group-aria-selected:scale-110">
          <Icon className="h-5 w-5" />
        </div>
        <span>{children}</span>
      </div>
      <div className="flex items-center gap-3">
        {shortcut && (
          <kbd className="hidden sm:inline-flex h-5 w-5 items-center justify-center rounded bg-muted/50 text-[10px] font-bold text-muted-foreground group-aria-selected:text-primary/70">
            {shortcut}
          </kbd>
        )}
        <ChevronRight className="h-4 w-4 opacity-0 group-aria-selected:opacity-100 -translate-x-2 group-aria-selected:translate-x-0 transition-all" />
      </div>
    </Command.Item>
  );
}

function Separator() {
  return <Command.Separator className="mx-4 my-2 h-px bg-border/40" />;
}

function Kbd({ label, action }: { label: string, action: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded-md border border-border bg-background px-1.5 font-sans text-[10px] font-black uppercase text-muted-foreground shadow-sm">
        {label}
      </kbd>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{action}</span>
    </div>
  );
}
