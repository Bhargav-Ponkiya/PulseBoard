'use client';

import { Suspense, useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Bell, 
  Cpu, 
  ArrowRight,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { apiCall, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const features = [
  {
    icon: Activity,
    title: 'Monitor Everything',
    description: 'HTTP pings every 10s for mission-critical apps.',
    color: 'text-blue-500',
  },
  {
    icon: Cpu,
    title: 'AI Root Cause',
    description: 'Gemini 2.5 Flash analyzes logs & commits automatically.',
    color: 'text-purple-500',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Discord, Slack, and Webhooks. No noise, just signal.',
    color: 'text-green-500',
  },
  {
    icon: Zap,
    title: 'SSE Real-time',
    description: 'Live latency charts and incident updates instantly.',
    color: 'text-amber-500',
  },
];

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-md px-4"
    >
      <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                id="login-email"
                placeholder="name@example.com"
                type="email"
                className="bg-background/50"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <button type="button" onClick={() => toast({ title: 'Coming Soon', description: 'Password reset will be available in a future update.' })} className="text-xs text-primary hover:underline bg-transparent border-none cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  className="bg-background/50 pr-10"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="text-sm font-medium leading-none cursor-pointer select-none">
                Remember me
              </label>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm font-medium text-destructive"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full relative overflow-hidden group" disabled={loading}>
              <span className={cn("flex items-center justify-center transition-all", loading ? "opacity-0" : "opacity-100")}>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              {loading && (
                <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin" />
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    document.title = 'Sign In - PulseBoard';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Left Panel: Branding & Features */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-border/40 bg-card/20 p-12 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">PulseBoard</span>
        </motion.div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Observability <br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-xl text-muted-foreground">
              Stop guessing why your services are down. PulseBoard monitors your infrastructure and provides instant, AI-generated root cause analysis.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="space-y-3"
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm border border-border/40", feature.color)}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-sm text-muted-foreground"
        >
          © {new Date().getFullYear()} PulseBoard — Built for microservices.
        </motion.div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">PulseBoard</span>
        </div>
        
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}>
          <LoginForm />
        </Suspense>
      </div>
    </motion.div>
  );
}
