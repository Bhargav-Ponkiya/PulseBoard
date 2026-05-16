'use client';

import { useState, FormEvent, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Save,
  Shield,
  Camera,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Key,
  Trash2,
  ChevronRight,
  History,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { apiCall } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useProjectStore } from '@/store/project.store';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
    { label: 'Special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;

  if (!password) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500',
              i <= score
                ? score <= 1 ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : score <= 2 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                  : score <= 3 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                  : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className={cn('flex items-center gap-2 text-[10px] font-medium transition-colors', c.pass ? 'text-green-500' : 'text-muted-foreground/60')}>
            <div className={cn('h-1 w-1 rounded-full', c.pass ? 'bg-green-500' : 'bg-muted')} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setAuth, accessToken, logout } = useAuthStore();
  const { projects } = useProjectStore();
  const { toast, success, error: toastError } = useToast();
  
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'danger'>('general');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = 'User Profile — PulseBoard';
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email }),
      });
      setAuth({ ...user!, name, email }, accessToken!);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      success({ title: 'Profile updated', description: 'Your information is now up to date.' });
    } catch (err) {
      toastError({ title: 'Update failed', description: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError({ title: 'Validation Error', description: 'New passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    try {
      await apiCall('/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success({ title: 'Success', description: 'Your password has been securely updated.' });
    } catch (err) {
      toastError({ title: 'Update failed', description: err instanceof Error ? err.message : 'Invalid current password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? You will be logged out and need to contact support to reactivate.')) return;
    
    setIsDeactivating(true);
    try {
      await apiCall('/users/me/deactivate', { method: 'POST' });
      success({ title: 'Account Deactivated', description: 'You are being logged out.' });
      setTimeout(logout, 2000);
    } catch (err) {
      toastError({ title: 'Operation failed', description: err instanceof Error ? err.message : 'Could not deactivate' });
      setIsDeactivating(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmation = prompt('CRITICAL ACTION: This will delete all projects, monitors, and data. Type "DELETE EVERYTHING" to confirm.');
    if (confirmation !== 'DELETE EVERYTHING') return;
    
    setIsDeleting(true);
    try {
      await apiCall('/users/me', { method: 'DELETE' });
      success({ title: 'Account Deleted', description: 'Everything has been wiped. Farewell.' });
      setTimeout(logout, 2000);
    } catch (err) {
      toastError({ title: 'Deletion failed', description: err instanceof Error ? err.message : 'Could not delete account' });
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto pb-20 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">Account <span className="text-primary">Settings</span></h1>
            <p className="text-muted-foreground font-medium">Manage your digital identity and security parameters.</p>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-1.5 rounded-2xl border border-border/40">
            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={User} label="General" />
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Shield} label="Security" />
            <TabButton active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} icon={ShieldAlert} label="Danger" danger />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Info Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <CardContent className="p-8 space-y-8 relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-violet-600 p-1 shadow-2xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <div className="h-full w-full rounded-[22px] bg-card flex items-center justify-center text-3xl font-black text-primary">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-background border border-border shadow-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-95">
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Analytics</span>
                    <span className="text-primary font-bold">Active</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <StatItem label="Projects" value={projects.length.toString()} />
                  </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Account Metadata</h3>
                  <MetaItem icon={Calendar} label="Member Since" value={new Date(user.createdAt || Date.now()).toLocaleDateString()} />
                  <MetaItem icon={History} label="Last Login" value="Just now" />
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <h4 className="text-sm font-bold">Data Privacy</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your data is stored securely in our private microservices mesh. We do not share your metrics or logs with third parties.
              </p>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/40 bg-card/40 backdrop-blur-md h-full">
                    <CardHeader className="pb-8 border-b border-border/40">
                      <CardTitle className="text-xl font-bold">General Profile</CardTitle>
                      <CardDescription className="text-sm font-medium">Update your personal identification and contact details.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUpdateProfile}>
                      <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Full Name</Label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-background/50 border-border/40 focus:ring-4 focus:ring-primary/10 transition-all text-base font-medium"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Email Address</Label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-background/50 border-border/40 focus:ring-4 focus:ring-primary/10 transition-all text-base font-medium"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                          <Button 
                            type="submit" 
                            disabled={loading} 
                            className="h-14 px-10 rounded-2xl gap-3 shadow-xl shadow-primary/25 font-bold text-base transition-all active:scale-95"
                          >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : profileSuccess ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                            {loading ? 'Processing...' : profileSuccess ? 'Changes Saved' : 'Update Profile'}
                          </Button>
                          {profileSuccess && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-green-500">
                              System updated successfully
                            </motion.p>
                          )}
                        </div>
                      </CardContent>
                    </form>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <Card className="border-border/40 bg-card/40 backdrop-blur-md">
                    <CardHeader className="pb-8 border-b border-border/40">
                      <CardTitle className="text-xl font-bold">Security Credentials</CardTitle>
                      <CardDescription className="text-sm font-medium">Protect your account with a high-entropy password.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleChangePassword}>
                      <CardContent className="p-8 space-y-8">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Current Password</Label>
                          <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              type={showCurrent ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="pl-12 h-14 rounded-2xl bg-background/50 border-border/40 focus:ring-4 focus:ring-primary/10 transition-all"
                              required
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">New Password</Label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-background/50 border-border/40 focus:ring-4 focus:ring-primary/10 transition-all"
                                required
                              />
                              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            <PasswordStrength password={newPassword} />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Confirm New Password</Label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={cn(
                                  "pl-12 h-14 rounded-2xl bg-background/50 border-border/40 focus:ring-4 transition-all",
                                  confirmPassword && newPassword !== confirmPassword ? "ring-4 ring-destructive/10 border-destructive/40" : "focus:ring-primary/10"
                                )}
                                required
                              />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                              <p className="text-[10px] font-bold text-destructive uppercase tracking-widest pt-2">Passwords do not match</p>
                            )}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                          className="h-14 px-10 rounded-2xl gap-3 shadow-xl font-bold"
                        >
                          {passwordLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                          Update Security Credentials
                        </Button>
                      </CardContent>
                    </form>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'danger' && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-md overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <ShieldAlert className="h-32 w-32 text-destructive" />
                    </div>
                    <CardHeader className="p-8 border-b border-destructive/20 bg-destructive/5">
                      <CardTitle className="text-xl font-black text-destructive uppercase tracking-tight">Danger Zone</CardTitle>
                      <CardDescription className="text-sm font-bold text-destructive/70">Irreversible actions that affect your entire workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-10 relative">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-destructive/20 bg-background/50">
                        <div className="space-y-1">
                          <h4 className="text-base font-black uppercase tracking-tight">Deactivate Account</h4>
                          <p className="text-xs text-muted-foreground max-w-md">
                            Temporarily disable your account access. Your data will be preserved but monitoring will stop.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="h-12 px-6 rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white font-bold transition-all"
                          onClick={handleDeactivate}
                          disabled={isDeactivating}
                        >
                          {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Deactivate
                        </Button>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-destructive bg-destructive/10">
                        <div className="space-y-1 text-destructive">
                          <h4 className="text-base font-black uppercase tracking-tight">Permanently Delete Workspace</h4>
                          <p className="text-xs text-destructive/70 max-w-md">
                            This will immediately delete all projects, monitors, logs, and incidents. This action cannot be undone.
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          className="h-14 px-8 rounded-2xl gap-3 shadow-2xl shadow-destructive/40 font-black uppercase tracking-widest text-xs"
                          onClick={handleDeleteAll}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                          {isDeleting ? 'Deleting...' : 'Delete Everything'}
                        </Button>
                      </div>

                      <div className="p-4 rounded-xl bg-background/40 border border-destructive/10 flex items-center gap-3">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          Authentication tokens will be revoked upon successful deletion.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function TabButton({ active, onClick, icon: Icon, label, danger }: { active: boolean, onClick: () => void, icon: any, label: string, danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative",
        active 
          ? danger 
            ? "bg-destructive text-white shadow-lg shadow-destructive/30" 
            : "bg-background text-primary shadow-lg shadow-black/5 border border-border/40"
          : danger
            ? "text-destructive/60 hover:text-destructive hover:bg-destructive/10"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "" : "opacity-60")} />
      {label}
      {active && !danger && (
        <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-xl border-2 border-primary/20 pointer-events-none" />
      )}
    </button>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-background/40 flex flex-col items-center justify-center space-y-1 transition-all hover:border-primary/30">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-xl font-black">{value}</span>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-mono font-bold text-foreground/80">{value}</span>
    </div>
  );
}
