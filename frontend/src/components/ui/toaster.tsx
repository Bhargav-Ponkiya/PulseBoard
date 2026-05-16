'use client';

import { useToast } from '@/components/ui/use-toast';
import { X, CheckCircle2, AlertCircle, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const icons = {
  default: Info,
  destructive: ShieldAlert,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div 
      className="fixed bottom-0 right-0 z-[200] flex flex-col p-6 gap-3 pointer-events-none sm:max-w-[420px] w-full" 
      role="region" 
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const Icon = icons[t.variant as keyof typeof icons] || icons.default;
          
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={cn(
                "pointer-events-auto relative group overflow-hidden flex w-full items-center gap-4 rounded-[2rem] border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all",
                t.variant === 'destructive'
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-border/40 bg-card/60 text-card-foreground'
              )}
              role="alert"
            >
              {/* Progress bar background */}
              <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full opacity-20" />
              
              <div className={cn(
                "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6",
                t.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'
              )}>
                <Icon className={cn("h-6 w-6", t.variant === 'loading' && "animate-spin")} />
              </div>

              <div className="flex-1 space-y-1">
                {t.title && <p className="text-sm font-black uppercase tracking-tight">{t.title}</p>}
                {t.description && (
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => dismiss(t.id)}
                className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
