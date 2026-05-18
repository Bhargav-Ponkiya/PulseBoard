import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/config';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      document.cookie = "logged_in=true; path=/; max-age=604800; SameSite=Lax";
      if (refreshToken) {
        localStorage.setItem('pulseboard_refresh_token', refreshToken);
      }
    }
    set({ user, accessToken, isLoading: false });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('pulseboard_refresh_token');
    }
    set({ user: null, accessToken: null, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    const { accessToken } = get();
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } catch {
      // ignore — client state is always cleared regardless
    }
    if (typeof window !== 'undefined') {
      document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('pulseboard_refresh_token');
    }
    set({ user: null, accessToken: null, isLoading: false });
  },
}));
