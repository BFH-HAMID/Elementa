'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Beaker, CheckCircle2, FlaskConical, Info, RotateCcw, Save, TriangleAlert, Undo2, Redo2, FolderOpen } from 'lucide-react';
import { useEffect } from 'react';
import { useLabI18n } from '@/lib/i18n';
import { datasetStats } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';

const flashTone = {
  info: 'border-physics-200 bg-physics-50 text-physics-900 dark:border-physics-700 dark:bg-physics-900/60 dark:text-physics-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-100'
} as const;

/** Bench controls: reset, undo/redo, save & load to localStorage, and the toast strip. */
export function LabToolbar() {
  const { t, locale } = useLabI18n();
  const siteLocale = useLocale();
  const reset = useLabStore((state) => state.reset);
  const undo = useLabStore((state) => state.undo);
  const redo = useLabStore((state) => state.redo);
  const save = useLabStore((state) => state.save);
  const load = useLabStore((state) => state.load);
  const history = useLabStore((state) => state.history);
  const future = useLabStore((state) => state.future);
  const savedAt = useLabStore((state) => state.savedAt);
  const flash = useLabStore((state) => state.flash);
  const clearFlash = useLabStore((state) => state.clearFlash);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(clearFlash, 2800);
    return () => window.clearTimeout(timer);
  }, [flash, clearFlash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      } else if (!meta && event.key.toLowerCase() === 'r' && !event.altKey) {
        event.preventDefault();
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, save, reset]);

  return (
    <div className="space-y-2">
      <div className="card flex flex-wrap items-center gap-2 p-2.5">
        <button type="button" onClick={undo} disabled={history.length === 0} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs font-bold" title={t('action.undo')}>
          <Undo2 size={15} /> <span className="hidden sm:inline">{t('action.undo')}</span>
        </button>
        <button type="button" onClick={redo} disabled={future.length === 0} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs font-bold" title={t('action.redo')}>
          <Redo2 size={15} /> <span className="hidden sm:inline">{t('action.redo')}</span>
        </button>
        <span className="mx-0.5 hidden h-5 w-px bg-[var(--line)] sm:block" />
        <button type="button" onClick={save} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs font-bold" title={t('action.save')}>
          <Save size={15} /> <span className="hidden sm:inline">{t('action.save')}</span>
        </button>
        <button type="button" onClick={load} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs font-bold" title={t('action.load')}>
          <FolderOpen size={15} /> <span className="hidden sm:inline">{t('action.load')}</span>
        </button>
        <button type="button" onClick={reset} className="btn-secondary min-h-9 rounded-lg px-2.5 text-xs font-bold text-rose-700 dark:text-rose-300" title={t('action.reset')}>
          <RotateCcw size={15} /> <span className="hidden sm:inline">{t('action.reset')}</span>
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <span className="pill bg-[var(--surface-soft)] font-mono text-[10px]" title={t('misc.offline')}>
            <Beaker size={11} /> {datasetStats.shelfChemicals} · <FlaskConical size={11} /> {datasetStats.apparatus} · {datasetStats.reactions}
          </span>
          <Link href={`/${siteLocale}/lab/experiments`} className="btn-secondary min-h-9 rounded-lg px-2.5 text-xs font-bold">
            {t('experiment.allExperiments')}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="text-[11px] muted">{t('misc.keyboard')}</p>
        {savedAt && (
          <p className="text-[11px] muted">
            ·{' '}
            {locale === 'bn'
              ? `সর্বশেষ সংরক্ষণ ${new Date(savedAt).toLocaleTimeString('bn-BD')}`
              : `Last saved ${new Date(savedAt).toLocaleTimeString('en-GB')}`}
          </p>
        )}
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            role="status"
            className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-card', flashTone[flash.tone])}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {flash.tone === 'success' ? <CheckCircle2 size={15} /> : flash.tone === 'warning' ? <TriangleAlert size={15} /> : <Info size={15} />}
            {locale === 'bn' ? flash.message_bn : flash.message_en}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
