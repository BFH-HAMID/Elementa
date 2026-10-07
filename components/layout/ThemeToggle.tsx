'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useLabStore, type ThemeMode } from '@/lib/store';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const theme = useLabStore((state) => state.theme);
  const setTheme = useLabStore((state) => state.setTheme);
  const t = useTranslations('common');
  const next: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return <button type="button" onClick={() => setTheme(next[theme])} className="btn-ghost min-h-10 min-w-10 rounded-lg p-2" aria-label={`${t('system')} theme: ${theme}`} title={`${t('system')} · ${theme}`}><Icon size={17} /></button>;
}
