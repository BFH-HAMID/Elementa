'use client';

import type { ReactNode } from 'react';
import { Camera, Maximize2, Pause, Play, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export function SimToolbar({ running, onToggle, onReset, onRecord, onScreenshot, onFullscreen }: { running: boolean; onToggle: () => void; onReset: () => void; onRecord: () => void; onScreenshot: () => void; onFullscreen: () => void }) {
  const t = useTranslations('common');
  return <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-4"><Button onClick={onToggle} icon={running ? <Pause size={16} /> : <Play size={16} />}>{running ? t('pause') : t('resume')}</Button><Button variant="secondary" onClick={onReset} icon={<RotateCcw size={15} />}>{t('reset')}</Button><Button variant="secondary" onClick={onRecord}>＋ {t('record')}</Button><span className="flex-1" /><Button variant="ghost" onClick={onScreenshot} icon={<Camera size={16} />}>{t('screenshot')}</Button><Button variant="ghost" onClick={onFullscreen} icon={<Maximize2 size={16} />}>{t('fullscreen')}</Button></div>;
}

export function FormulaPanel({ formula }: { formula: string }) {
  const t = useTranslations('common');
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40"><p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">{t('formula')}</p><p className="font-mono text-lg font-bold text-amber-950 dark:text-amber-100">{formula}</p></div>;
}

export function SimLayout({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
