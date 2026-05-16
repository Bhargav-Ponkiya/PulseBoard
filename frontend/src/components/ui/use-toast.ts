'use client';

import { useState, useCallback, useEffect } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastListener = (toast: Toast) => void;

let toastListeners: ToastListener[] = [];
let toastCount = 0;

/**
 * Global toast function to trigger a notification from anywhere.
 */
export function toast(options: ToastOptions): string {
  const id = String(++toastCount);
  const newToast: Toast = { id, ...options };
  toastListeners.forEach((listener) => listener(newToast));
  return id;
}

/**
 * Hook to manage and display toast notifications.
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    
    if (t.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration || 5000);
    }
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { 
    toasts, 
    toast, 
    dismiss,
    // Helper methods for common toast types
    success: (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'success' }),
    error: (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'destructive' }),
    loading: (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'loading', duration: 0 }),
  };
}
