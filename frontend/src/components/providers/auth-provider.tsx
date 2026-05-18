'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { API_BASE_URL } from '@/lib/config';

/**
 * AuthProvider — restores session on cold-load via refresh cookie.
 * Skips the restore if in-memory auth is already set (e.g. after a fresh
 * login/register), avoiding a race condition that wiped Zustand state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading, accessToken } = useAuthStore();
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // If we already have an in-memory token (fresh login/register),
    // mark loading done immediately — no need to hit the refresh endpoint.
    if (accessToken) {
      setLoading(false);
      return;
    }

    async function restoreSession() {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          const body = await res.json();
          if (body && body.accessToken && body.user) {
            setAuth(body.user, body.accessToken);
            return;
          }
        }
      } catch {
        // Network error — still resolve loading so the app is usable
      }
      setLoading(false);
    }

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-950"
        role="status"
        aria-label="Restoring session"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-violet-500/60 animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-slate-400 animate-pulse">Restoring session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
