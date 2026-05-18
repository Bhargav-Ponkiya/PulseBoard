'use client';

import { Suspense, useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Terminal,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiCall, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const data = await apiCall<{ accessToken: string; user: { id: string; email: string; name: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, rememberMe }),
          signal: ac.signal,
        },
      );
      if (ac.signal.aborted) return;
      setAuth(data.user, data.accessToken);
      const from = searchParams.get('from') ?? '/dashboard';
      const allowedPaths = ['/dashboard', '/dashboard/incidents', '/dashboard/logs', '/dashboard/settings', '/dashboard/profile', '/projects/new'];
      const safePath = allowedPaths.some((p) => from.startsWith(p)) ? from : '/dashboard';
      router.push(safePath);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 mb-2">Welcome Back</h1>
        <p className="text-slate-400 text-sm">Enter your credentials to access your dashboard</p>
      </div>
      
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-violet-950/20 p-8 relative overflow-hidden">
        {/* Glow edge */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-70" />
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2.5">
            <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <Input
              id="login-email"
              placeholder="name@example.com"
              type="email"
              className="h-12 bg-black/40 border-white/10 focus-visible:ring-violet-500/50 placeholder:text-slate-600 rounded-xl px-4"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              autoComplete="email"
            />
          </div>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => toast({ title: 'Coming Soon', description: 'Password reset will be available in a future update.' })} 
                className="text-xs text-violet-400 hover:text-violet-300 font-medium hover:underline bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                className="h-12 bg-black/40 border-white/10 focus-visible:ring-violet-500/50 placeholder:text-slate-600 rounded-xl px-4 pr-12"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pt-1">
            <div className="relative flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer h-4 w-4 shrink-0 rounded-[4px] border border-white/20 bg-black/40 checked:bg-violet-600 checked:border-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all appearance-none cursor-pointer"
              />
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <label htmlFor="remember-me" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
              Remember me
            </label>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-400">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-600/20 mt-6 relative overflow-hidden group active:scale-[0.98]" 
            disabled={loading}
          >
            <span className={cn("flex items-center justify-center transition-all", loading ? "opacity-0" : "opacity-100")}>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            {loading && (
              <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin" />
            )}
          </Button>
        </form>
      </div>
      
      <div className="text-center text-sm text-slate-400 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold text-violet-400 hover:text-violet-300 hover:underline transition-colors">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    document.title = 'Sign In - PulseBoard';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600 blur-[150px]" />
      </div>

      {/* Left Panel: Visual/Branding (Hidden on mobile) */}
      <div className="relative hidden lg:flex w-1/2 flex-col justify-between border-r border-white/5 bg-slate-900/30 p-12 z-10 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5 w-fit group">
          <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 relative">
            <Activity className="h-5 w-5 text-white animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            PulseBoard
          </span>
        </Link>

        <div className="space-y-8 max-w-md">
          <div>
            <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight mb-4">
              Log back into your <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Observability Center.
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              PulseBoard aggregates your logs, monitors your endpoints, and uses Gemini AI to auto-diagnose critical incidents.
            </p>
          </div>
          
          {/* Mockup Card showing system health */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Bot className="h-24 w-24 text-violet-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">System Status</h3>
                <p className="text-[10px] uppercase tracking-wider text-green-400 font-bold">All Systems Operational</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <span className="text-slate-400">Active Monitors</span>
                <span className="font-mono font-bold">12 / 12</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2 pt-1">
                <span className="text-slate-400">Total Pings</span>
                <span className="font-mono font-bold text-violet-400">148,204</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Avg Latency</span>
                <span className="font-mono font-bold text-fuchsia-400">384ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          PulseBoard Platform v1.0.0
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="relative flex w-full flex-col justify-center items-center lg:w-1/2 z-10 p-6">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">PulseBoard</span>
          </Link>
        </div>
        
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
            <p>Loading form...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
