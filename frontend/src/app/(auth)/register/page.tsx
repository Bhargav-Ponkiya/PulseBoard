'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ArrowRight,
  Loader2,
  Terminal,
  Cpu,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiCall, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  useEffect(() => {
    document.title = 'Create Account - PulseBoard';
  }, []);

  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  function getPasswordStrength(pass: string) {
    if (pass.length === 0) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 25;
    if (/\d/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const data = await apiCall<{ accessToken: string; refreshToken?: string; user: { id: string; email: string; name: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
          signal: ac.signal,
        },
      );
      if (ac.signal.aborted) return;
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-200">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20 z-0">
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-400 dark:bg-violet-600 blur-[150px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-400 dark:bg-fuchsia-600 blur-[150px]" />
      </div>

      {/* Left Panel: Register Form */}
      <div className="relative flex w-full flex-col justify-center items-center lg:w-1/2 z-10 p-6 min-h-screen">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PulseBoard</span>
          </Link>
        </div>

        <div className="w-full max-w-md px-6 my-16 lg:my-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Join PulseBoard and start monitoring today</p>
          </div>
          
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-violet-950/5 dark:shadow-violet-950/20 p-8 relative overflow-hidden">
            {/* Glow edge */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-70" />
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <Input
                  id="reg-name"
                  placeholder="John Doe"
                  className="h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus-visible:ring-violet-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl px-4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Email Address
                </label>
                <Input
                  id="reg-email"
                  placeholder="name@example.com"
                  type="email"
                  className="h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus-visible:ring-violet-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl px-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <Input
                  id="reg-password"
                  placeholder="••••••••"
                  type="password"
                  className="h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus-visible:ring-violet-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl px-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex h-1 gap-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          strength < 50 ? "bg-red-500" : strength < 100 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {strength < 50 ? 'Weak' : strength < 100 ? 'Medium' : 'Strong'} — min 8 chars, mixed case & numbers
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <label htmlFor="reg-confirm" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Confirm Password
                </label>
                <Input
                  id="reg-confirm"
                  placeholder="••••••••"
                  type="password"
                  className={cn(
                    "h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 focus-visible:ring-violet-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl px-4",
                    confirmPassword && password !== confirmPassword && "border-red-500/50 focus-visible:ring-red-500/50"
                  )}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 pt-1">Passwords do not match</p>
                )}
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-600/20 mt-6 relative overflow-hidden group active:scale-[0.98]" 
                disabled={loading}
              >
                <span className={cn("flex items-center justify-center transition-all", loading ? "opacity-0" : "opacity-100")}>
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                {loading && (
                  <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin" />
                )}
              </Button>
            </form>
          </div>
          
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel: Value Prop (Hidden on mobile) */}
      <div className="relative hidden lg:flex w-1/2 flex-col justify-center border-l border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/30 p-12 z-10 backdrop-blur-sm">
        <div className="absolute top-12 right-12">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              PulseBoard
            </span>
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 relative ml-2.5">
              <Activity className="h-5 w-5 text-white animate-pulse" />
            </div>
          </Link>
        </div>

        <div className="max-w-md mx-auto space-y-12">
          <div>
            <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight mb-4 text-slate-900 dark:text-white">
              Ready to ship <br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                with confidence?
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              PulseBoard gives you the confidence to deploy anytime, knowing that if anything breaks, you&apos;ll be the first to know and understand exactly why.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-200">Instant Setup</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start monitoring your first URL in under 60 seconds with our streamlined dashboard.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-200">AI Diagnoses</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Automatically pinpoint root causes through Gemini-powered log and commit analysis.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold mb-2 uppercase tracking-wider text-[10px]">
              <CheckCircle2 className="h-4 w-4" />
              <span>Free Local Development</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              PulseBoard runs its entire microservice architecture entirely free locally using Docker. Your data, your rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
