'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { apiCall, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: ShieldCheck,
    title: 'Secure Account',
    description: 'Bcrypt hashing and JWT-based session management.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Start monitoring your first URL in under 60 seconds.',
  },
  {
    icon: Bell,
    title: 'Configure Alerts',
    description: 'Connect Discord, Slack, or Webhooks for notifications.',
  },
];

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
      const data = await apiCall<{ accessToken: string; user: { id: string; email: string; name: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
          signal: ac.signal,
        },
      );
      if (ac.signal.aborted) return;
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Left Panel: Register Form */}
      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">PulseBoard</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md px-4"
        >
          <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
              <p className="text-sm text-muted-foreground">
                Join PulseBoard and start monitoring today
              </p>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reg-name" className="text-sm font-medium leading-none">Full Name</label>
                  <Input
                    id="reg-name"
                    placeholder="John Doe"
                    className="bg-background/50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reg-email" className="text-sm font-medium leading-none">Email</label>
                  <Input
                    id="reg-email"
                    placeholder="name@example.com"
                    type="email"
                    className="bg-background/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reg-password" className="text-sm font-medium leading-none">Password</label>
                  <Input
                    id="reg-password"
                    placeholder="••••••••"
                    type="password"
                    className="bg-background/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex h-1 gap-1 overflow-hidden rounded-full bg-muted">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            strength < 50 ? "bg-red-500" : strength < 100 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${strength}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {strength < 50 ? 'Weak' : strength < 100 ? 'Medium' : 'Strong'} — min 8 chars, mixed case, numbers & symbols.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="reg-confirm" className="text-sm font-medium leading-none">Confirm Password</label>
                  <Input
                    id="reg-confirm"
                    placeholder="••••••••"
                    type="password"
                    className={cn("bg-background/50", confirmPassword && password !== confirmPassword && "border-destructive")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
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
                    Sign Up
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  {loading && (
                    <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin" />
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>

      {/* Right Panel: Value Prop */}
      <div className="relative hidden w-1/2 flex-col justify-center border-l border-border/40 bg-card/20 p-12 lg:flex">
        <div className="max-w-md mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold tracking-tight">
              Ready to ship <br />
              <span className="text-primary text-5xl">faster?</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              PulseBoard gives you the confidence to deploy anytime, knowing that if anything breaks, you&apos;ll be the first to know and understand why.
            </p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="rounded-2xl bg-primary/5 p-6 border border-primary/10"
          >
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
              <CheckCircle2 className="h-5 w-5" />
              <span>Free Local Development</span>
            </div>
            <p className="text-sm text-muted-foreground">
              PulseBoard is free for local development. Deploy our infrastructure in seconds using Docker Compose.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
