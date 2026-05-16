'use client';

/** Reads the stored theme from localStorage. Returns null if not set. */
export function getStoredTheme(): 'light' | 'dark' | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('pulseboard_theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return null;
}

/** Returns the system preferred theme. */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Returns the resolved theme (stored override or system preference). */
export function getResolvedTheme(): 'light' | 'dark' {
  return getStoredTheme() ?? 'light';
}

/** Applies a theme to the <html> element and persists it. */
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  try {
    localStorage.setItem('pulseboard_theme', theme);
  } catch {
    // ignore
  }
}

/** Toggles the current theme and returns the new theme. */
export function toggleTheme(): 'light' | 'dark' {
  const current = getResolvedTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
