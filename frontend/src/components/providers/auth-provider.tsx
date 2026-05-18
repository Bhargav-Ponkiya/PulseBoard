'use client';

import { useEffect, useRef } from 'react';
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
  const restoreRef = useRef(false);

  useEffect(() => {
    // If we already have an in-memory token (fresh login/register),
    // mark loading done immediately — no need to hit the refresh endpoint.
    if (accessToken) {
      setLoading(false);
      return;
    }

    if (restoreRef.current) return;
    restoreRef.current = true;

    async function restoreSession() {
      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('pulseboard_refresh_token') : null;

        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (res.ok) {
          const body = await res.json();
          // The API Gateway wraps all successful responses in a global ResponseInterceptor:
          // { success: true, data: { accessToken, user, refreshToken } }
          const authData = body?.success ? body.data : body;

          if (authData && authData.accessToken && authData.user) {
            setAuth(authData.user, authData.accessToken, authData.refreshToken);
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
