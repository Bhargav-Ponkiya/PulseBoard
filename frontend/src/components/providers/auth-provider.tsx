'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { API_BASE_URL } from '@/lib/config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading } = useAuthStore();
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/refresh`,
          {
            method: 'POST',
            credentials: 'include',
          },
        );

        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            setAuth(body.data.user, body.data.accessToken);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    }

    restoreSession();
  }, [setAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Restoring session">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Restoring session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
