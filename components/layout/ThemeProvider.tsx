'use client';

import { useEffect, type ReactNode } from 'react';
import { useLabStore } from '@/lib/store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useLabStore((state) => state.theme);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'dark' : 'light';
      root.classList.toggle('dark', dark);
    };
    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  return <>{children}</>;
}
