'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'careerpilot-theme';

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: Theme = 'system';
    try {
      saved = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    } catch {}

    const updateResolved = (t: Theme) => {
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setResolvedTheme(isDark ? 'dark' : 'light');
      applyTheme(t);
    };

    updateResolved(saved);

    const rafId = requestAnimationFrame(() => {
      setMounted(true);
      setThemeState(saved);
    });

    // Listener for system OS dark/light switch
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      let current: Theme = 'system';
      try {
        current = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
      } catch {}
      if (current === 'system') {
        updateResolved('system');
      }
    };

    if (media.addEventListener) {
      media.addEventListener('change', handleMediaChange);
    } else {
      media.addListener(handleMediaChange);
    }

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        updateResolved(newTheme);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleMediaChange);
      } else {
        media.removeListener(handleMediaChange);
      }
      window.removeEventListener('storage', handleStorage);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
    applyTheme(newTheme);
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setResolvedTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    mounted,
  };
}
