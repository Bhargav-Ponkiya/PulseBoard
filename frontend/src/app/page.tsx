import Link from 'next/link';
import { Activity, ShieldAlert, Cpu, GitMerge, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500/30">
      
      {/* Background Gradients (Adapts to light/dark) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-200 dark:bg-violet-900/30 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-200 dark:bg-indigo-900/30 blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">PulseBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white rounded-full px-6 shadow-md shadow-violet-600/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center min-h-[calc(100vh-64px)]">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-8 border border-violet-200 dark:border-violet-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          Next-Gen Microservice Observability
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Monitor your services. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
            Diagnose with AI.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          PulseBoard provides real-time latency monitoring, log aggregation, and automated Gemini-powered incident diagnoses for modern microservice architectures.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-14 px-8 text-base rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xl font-bold transition-transform active:scale-95 group">
              Start Monitoring
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 font-semibold transition-transform active:scale-95">
              Access Dashboard
            </Button>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-24 text-left">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-6">
              <ShieldAlert className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Real-Time Pings</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Ensure high availability with continuous latency checks and instantaneous downtime alerts dispatched to your team.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-500/10 flex items-center justify-center mb-6">
              <Cpu className="h-6 w-6 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Incident Reports</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              When an outage occurs, PulseBoard uses Gemini to cross-reference your latest errors and generate actionable root-cause analysis.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
              <GitMerge className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Commit Integration</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Seamlessly link incidents to the exact GitHub commits that caused them, minimizing debugging time and maximizing uptime.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
