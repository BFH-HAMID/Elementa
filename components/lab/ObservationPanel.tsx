'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, NotebookPen, ShieldAlert, Trash2 } from 'lucide-react';
import type { LogEntry, LogTone } from '@/engine/types';
import { useLabI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';

const toneStyles: Record<LogTone, string> = {
  info: 'border-[var(--line)] bg-[var(--surface-soft)]',
  reaction: 'border-chemistry-200 bg-chemistry-50 dark:border-chemistry-800 dark:bg-chemistry-900/30',
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30',
  danger: 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30'
};

const toneDot: Record<LogTone, string> = {
  info: 'bg-[var(--muted)]',
  reaction: 'bg-chemistry-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500'
};

/** The notebook: every observation, in Bangla and English at the same time. */
export function ObservationPanel() {
  const { t, locale } = useLabI18n();
  const log = useLabStore((state) => state.log);
  const set = useLabStore.setState;

  const clear = () => set((state) => ({ log: [], hint: null }));
  const clock = (entry: LogEntry) =>
    new Date(entry.at).toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <section className="card flex min-h-0 flex-col overflow-hidden" aria-label={t('observation.title')}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <NotebookPen size={16} className="text-chemistry-600" />
          {t('observation.title')}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold muted">{t('observation.entries', { count: log.length })}</span>
          {log.length > 0 && (
            <button type="button" onClick={clear} className="btn-ghost min-h-8 rounded-lg p-1.5" aria-label={t('observation.clear')}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="scrollbar-thin max-h-[420px] min-h-[120px] flex-1 space-y-2 overflow-y-auto p-3">
        {log.length === 0 && <p className="p-4 text-center text-xs leading-6 muted">{t('observation.empty')}</p>}
        <AnimatePresence initial={false}>
          {log.map((entry) => (
            <motion.article
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className={cn('rounded-xl border p-2.5', toneStyles[entry.tone])}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', toneDot[entry.tone])} />
                <span className="font-mono text-[10px] font-bold text-[var(--muted)]">{clock(entry)}</span>
                {entry.kind === 'safety' && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-700 dark:text-rose-300">
                    {entry.tone === 'danger' ? <ShieldAlert size={12} /> : <AlertTriangle size={12} />}
                    {t('safety.title')}
                  </span>
                )}
                {entry.kind === 'system' && <span className="ml-auto text-[10px] font-black uppercase muted">{t('observation.system')}</span>}
              </div>
              <p className={cn('text-xs leading-5', locale === 'bn' ? 'font-bengali' : 'font-medium')}>
                {locale === 'bn' ? entry.text_bn : entry.text_en}
              </p>
              <p className="mt-1 text-[11px] leading-5 muted">{locale === 'bn' ? entry.text_en : entry.text_bn}</p>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
