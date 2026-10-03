'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { labT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';

const tone = {
  danger: {
    ring: 'border-rose-500/70',
    glow: 'shadow-[0_0_0_1px_rgba(244,63,94,.35),0_24px_60px_-20px_rgba(244,63,94,.65)]',
    icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
    text: 'text-rose-800 dark:text-rose-100'
  },
  warning: {
    ring: 'border-amber-500/70',
    glow: 'shadow-[0_0_0_1px_rgba(245,158,11,.3),0_24px_60px_-20px_rgba(245,158,11,.55)]',
    icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    text: 'text-amber-800 dark:text-amber-100'
  }
} as const;

/**
 * The safety layer. Dangerous combinations interrupt the bench with an animation and a
 * plain-language warning — never a recipe, never quantities that would help anyone make
 * something hazardous in real life.
 */
export function SafetyOverlay() {
  const hazard = useLabStore((state) => state.hazard);
  const dismissHazard = useLabStore((state) => state.dismissHazard);
  const locale = useLabStore((state) => state.locale);

  const level = hazard && hazard.level === 'danger' ? 'danger' : 'warning';

  // A caution fades on its own; a danger waits for the student to acknowledge it.
  useEffect(() => {
    if (!hazard || level !== 'warning') return;
    const timer = window.setTimeout(dismissHazard, 7000);
    return () => window.clearTimeout(timer);
  }, [hazard, level, dismissHazard]);

  useEffect(() => {
    if (!hazard) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && level === 'warning') dismissHazard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hazard, level, dismissHazard]);

  return (
    <AnimatePresence>
      {hazard && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#0b1020]/55 backdrop-blur-[3px]"
            onClick={level === 'warning' ? dismissHazard : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {level === 'danger' && (
            <motion.span
              className="pointer-events-none absolute inset-0 border-[10px] border-rose-500/70"
              animate={{ opacity: [0.15, 0.75, 0.15] }}
              transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <motion.div
            role="alertdialog"
            aria-modal={level === 'danger'}
            aria-labelledby="lab-hazard-title"
            className={cn('card relative w-full max-w-md border-2 p-5', tone[level].ring, tone[level].glow)}
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <div className="flex items-start gap-3">
              <motion.span
                className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tone[level].icon)}
                animate={level === 'danger' ? { rotate: [0, -7, 7, -4, 0] } : { scale: [1, 1.12, 1] }}
                transition={{ duration: level === 'danger' ? 0.7 : 0.9, repeat: level === 'danger' ? Infinity : 2 }}
              >
                {level === 'danger' ? <ShieldAlert size={22} /> : <TriangleAlert size={22} />}
              </motion.span>
              <div className="min-w-0">
                <p className="eyebrow text-[10px]">{labT(locale, 'safety.banner')}</p>
                <h2 id="lab-hazard-title" className={cn('text-lg font-black leading-tight', tone[level].text)}>
                  {level === 'danger' ? labT(locale, 'safety.danger') : labT(locale, 'safety.caution')}
                </h2>
              </div>
            </div>

            <p className={cn('mt-3 text-sm font-bold leading-6', locale === 'bn' && 'font-bengali')}>
              {locale === 'bn' ? hazard.bn : hazard.en}
            </p>
            <p className="mt-1.5 text-xs leading-5 muted">{locale === 'bn' ? hazard.en : hazard.bn}</p>

            <p className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-[11px] leading-5 muted">
              {labT(locale, 'safety.simulated')}
            </p>

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={dismissHazard} className={cn('btn min-h-10 rounded-xl px-4 text-sm font-bold', level === 'danger' ? 'btn-primary' : 'btn-secondary')}>
                {labT(locale, 'safety.dismiss')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
