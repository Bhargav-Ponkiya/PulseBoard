'use client';

import * as React from 'react';
import {
  X,
  Activity,
  Zap,
  Cpu,
  ArrowRight,
  ArrowLeft,
  BellRing,
  Terminal,
  BarChart3,
  Check,
  ExternalLink,
  Book,
  Github,
  Globe,
  Sparkles,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Step {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  gradient: string;
  lightGradient: string;
  tips: string[];
  action?: { label: string; href: string };
}

const steps: Step[] = [
  {
    title: 'Welcome to PulseBoard',
    subtitle: 'AI-Powered Observability',
    description: 'PulseBoard is a real-time observability platform for microservices. It pings your endpoints at configurable intervals, measures latency, and streams results to your dashboard via SSE — no refreshes needed. When something breaks, AI generates a root cause analysis automatically.',
    icon: Activity,
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-400/10',
    gradient: 'from-violet-600 to-purple-700',
    lightGradient: 'from-violet-500 to-purple-600',
    tips: [
      'Create a project from the sidebar to get started',
      'Projects scope your monitors, logs, and incidents',
      'Each project gets a unique API key for log ingestion',
    ],
    action: { label: 'Create First Project', href: '/projects/new' },
  },
  {
    title: 'Live Dashboard & Metrics',
    subtitle: 'Real-Time Monitoring',
    description: 'Your dashboard shows live uptime %, average latency, active incidents, and total health checks. The latency chart updates in real-time via Server-Sent Events — you see every ping result the moment it lands, without polling.',
    icon: BarChart3,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    gradient: 'from-blue-600 to-indigo-700',
    lightGradient: 'from-blue-500 to-indigo-600',
    tips: [
      'Use the filter buttons above the chart to isolate a monitor',
      'Hover chart data points to see exact latency values',
      'The SSE indicator in the header shows connection health',
    ],
  },
  {
    title: 'AI Root Cause Analysis',
    subtitle: 'Gemini 2.5 Flash Powered',
    description: 'When a monitor goes DOWN, PulseBoard automatically fetches the last 5 error logs from your project and the last 3 GitHub commits from your repo. Gemini 2.5 Flash analyzes them and generates a structured JSON report with a probable cause, evidence, and remediation steps.',
    icon: Cpu,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-400/10',
    gradient: 'from-purple-600 to-pink-700',
    lightGradient: 'from-purple-500 to-pink-600',
    tips: [
      'Connect your GitHub repo in Settings → GitHub Sync',
      'Send application logs via the API key in Settings → API Access',
      'AI reports appear on each Incident detail page',
    ],
    action: { label: 'View Settings', href: '/dashboard/settings?tab=github' },
  },
  {
    title: 'Smart Alert Channels',
    subtitle: 'Discord · Slack · Webhooks',
    description: 'Configure Discord, Slack, or generic webhook channels. PulseBoard uses Redis SETNX debouncing so you only get ONE alert when a monitor first goes down — not a flood. When it recovers, a resolution notification is sent automatically.',
    icon: BellRing,
    color: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10 dark:bg-orange-400/10',
    gradient: 'from-orange-600 to-red-700',
    lightGradient: 'from-orange-500 to-red-600',
    tips: [
      'Add channels in Settings → Alert Channels',
      'Use "Send Test Notification" to verify before going live',
      'Toggle channels active/inactive without deleting them',
    ],
    action: { label: 'Add Alert Channel', href: '/dashboard/settings?tab=channels' },
  },
  {
    title: 'Developer Handbook',
    subtitle: 'Engineering Excellence',
    description: 'Our comprehensive Dev Handbook provides deep dives into the platform architecture, API specifications, and best practices for high-availability monitoring. Learn how to integrate the PulseBoard log ingestor into any tech stack.',
    icon: Book,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    gradient: 'from-emerald-600 to-teal-700',
    lightGradient: 'from-emerald-500 to-teal-600',
    tips: [
      'Check the Quick Start for curl examples',
      'Explore the Technical Specs for backend details',
      'Learn about AES-256-GCM encryption standards',
    ],
    action: { label: 'Open Handbook', href: '/dashboard/handbook' },
  },
];

export function Guide({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const prevOpenRef = React.useRef(open);

  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setCurrentStep(0);
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(s => s + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(s => s - 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, currentStep]);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-[3rem] border border-border/40 bg-card shadow-[0_0_100px_rgba(0,0,0,0.1)] flex flex-col md:flex-row h-[600px]"
          >
            {/* Left Sidebar - Dynamic Gradient */}
            <div className={cn(
              "relative md:w-[320px] flex flex-col justify-between p-10 overflow-hidden transition-all duration-1000 ease-in-out",
              "dark:" + step.gradient,
              "bg-gradient-to-br " + step.lightGradient
            )}>
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent)]" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="h-16 w-16 rounded-[2rem] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2">PulseBoard</h4>
                  <h2 className="text-3xl font-black text-white leading-tight">Elite Platform Guide</h2>
                </div>
              </div>

              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer" onClick={() => {
                      setDirection(i > currentStep ? 1 : -1);
                      setCurrentStep(i);
                    }}>
                      <div className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        i === currentStep ? "w-10 bg-white" : "w-3 bg-white/30 group-hover:bg-white/50"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                        i === currentStep ? "text-white opacity-100 translate-x-0" : "text-white/40 opacity-0 -translate-x-2"
                      )}>
                        {s.subtitle}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                    Operational Phase {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>

              {/* Background Decoration */}
              <motion.div 
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 0.2, scale: 1, rotate: 0 }}
                className="absolute -bottom-10 -right-10 pointer-events-none"
              >
                <step.icon className="h-64 w-64 text-white" />
              </motion.div>
            </div>

            {/* Right Content */}
            <div className="flex-1 bg-card flex flex-col relative overflow-hidden">
              {/* Progress Bar Top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/30 z-20">
                <motion.div 
                  className={cn("h-full bg-gradient-to-r", step.lightGradient)} 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                />
              </div>

              <div className="flex justify-between items-center p-8 pb-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Live</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute inset-0 p-12 pt-6 flex flex-col"
                  >
                    <div className="flex items-center gap-6 mb-8">
                      <div className={cn(
                        "h-20 w-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-transform duration-700 hover:rotate-6 border border-border/40",
                        step.bg, step.color
                      )}>
                        <step.icon className="h-10 w-10" />
                      </div>
                      <div className="space-y-1">
                        <div className={cn("px-0 font-black uppercase tracking-[0.3em] text-[10px]", step.color)}>
                          {step.subtitle}
                        </div>
                        <h3 className="text-4xl font-black tracking-tight text-foreground">{step.title}</h3>
                      </div>
                    </div>

                    <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10 max-w-xl">
                      {step.description}
                    </p>

                    <div className="space-y-4 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Expert Protocols</p>
                      <div className="grid grid-cols-1 gap-4">
                        {step.tips.map((tip, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="group flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/20 hover:border-primary/20 hover:bg-muted/40 transition-all cursor-default"
                          >
                            <div className={cn("h-6 w-6 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", step.bg)}>
                              <Check className={cn("h-3.5 w-3.5", step.color)} />
                            </div>
                            <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{tip}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {step.action && (
                      <div className="mt-8">
                        <Link
                          href={step.action.href}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-2xl active:scale-95 group text-white",
                            "bg-gradient-to-r " + step.lightGradient
                          )}
                        >
                          {step.action.label}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-8 border-t border-border/40 flex items-center justify-between bg-muted/10 backdrop-blur-md">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="h-14 px-8 rounded-2xl font-bold gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-0 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="h-14 px-6 rounded-2xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleNext}
                    className={cn(
                      "h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs gap-4 shadow-2xl transition-all active:scale-95 text-white",
                      "bg-gradient-to-r " + step.lightGradient
                    )}
                  >
                    {isLast ? (
                      <>Launch Dashboard <Rocket className="h-4 w-4" /></>
                    ) : (
                      <>Continue Protocol <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
