'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Sigma } from 'lucide-react';
import { useState } from 'react';
import { chemicalName } from '@/lib/labData';
import { useLabI18n } from '@/lib/i18n';
import { useLabStore } from '@/store/labStore';

const categoryLabels = {
  en: {
    neutralisation: 'Neutralisation',
    'acid-metal': 'Acid + metal',
    'acid-carbonate': 'Acid + carbonate',
    precipitation: 'Precipitation',
    displacement: 'Displacement',
    decomposition: 'Thermal decomposition',
    combustion: 'Combustion',
    'gas-test': 'Gas test',
    redox: 'Redox',
    complex: 'Complex formation',
    'flame-test': 'Flame test',
    electrolysis: 'Electrolysis',
    solution: 'Dissolving',
    combination: 'Combination',
    oxidation: 'Oxidation',
    'gas-preparation': 'Gas preparation',
    physical: 'Physical change',
    safety: 'Hazard',
    'no-reaction': 'No reaction',
    other: 'Reaction'
  },
  bn: {
    neutralisation: 'প্রশমন',
    'acid-metal': 'অ্যাসিড + ধাতু',
    'acid-carbonate': 'অ্যাসিড + কার্বনেট',
    precipitation: 'অধঃক্ষেপণ',
    displacement: 'প্রতিস্থাপন',
    decomposition: 'তাপীয় বিয়োজন',
    combustion: 'দহন',
    'gas-test': 'গ্যাস পরীক্ষা',
    redox: 'জারণ-বিজারণ',
    complex: 'জটিল যৌগ গঠন',
    'flame-test': 'শিখা পরীক্ষা',
    electrolysis: 'তড়িৎ বিশ্লেষণ',
    solution: 'দ্রবীভবন',
    combination: 'সংযোগ',
    oxidation: 'জারণ',
    'gas-preparation': 'গ্যাস প্রস্তুতি',
    physical: 'ভৌত পরিবর্তন',
    safety: 'বিপদ',
    'no-reaction': 'বিক্রিয়া নেই',
    other: 'বিক্রিয়া'
  }
} as const;

/** The balanced equation for whatever just happened, with the limiting reagent. */
export function EquationBox() {
  const { t, locale } = useLabI18n();
  const lastOutcome = useLabStore((state) => state.lastOutcome);
  const [copied, setCopied] = useState(false);
  const reaction = lastOutcome?.reaction ?? null;

  const copy = async () => {
    if (!reaction) return;
    const text = `${reaction.equation}\n${reaction.equation_bn}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="card overflow-hidden" aria-label={t('equation.title')}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Sigma size={16} className="text-physics-600" />
          {t('equation.title')}
        </h2>
        {reaction && (
          <button type="button" onClick={copy} className="btn-ghost min-h-8 rounded-lg px-2 text-[11px] font-bold">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? t('action.copied') : t('action.copy')}
          </button>
        )}
      </header>

      <div className="p-4">
        {!reaction ? (
          <p className="text-xs leading-6 muted">{t('equation.empty')}</p>
        ) : (
          <motion.div key={reaction.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="pill bg-chemistry-100 text-chemistry-800 dark:bg-chemistry-900 dark:text-chemistry-100">
                {categoryLabels[locale][reaction.category as keyof (typeof categoryLabels)['en']] ?? (locale === 'bn' ? 'বিক্রিয়া' : 'Reaction')}
              </span>
              <span className="pill bg-[var(--surface-soft)] font-mono text-[10px]">{reaction.id}</span>
            </div>

            <p className="scrollbar-thin overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 font-mono text-sm font-bold leading-6">
              {locale === 'bn' ? reaction.equation_bn : reaction.equation}
            </p>
            <p className="scrollbar-thin mt-1.5 overflow-x-auto px-1 font-mono text-[11px] leading-5 muted">
              {locale === 'bn' ? reaction.equation : reaction.equation_bn}
            </p>

            <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
              {lastOutcome?.limitingReagentId && (
                <div className="rounded-lg bg-[var(--surface-soft)] p-2">
                  <dt className="font-bold uppercase tracking-wide muted">{t('equation.category')}</dt>
                  <dd className="mt-0.5 font-mono text-xs font-black">{t('equation.limiting', { name: chemicalName(lastOutcome.limitingReagentId, locale) })}</dd>
                </div>
              )}
              {lastOutcome && lastOutcome.extentMoles > 0 && (
                <div className="rounded-lg bg-[var(--surface-soft)] p-2">
                  <dt className="font-bold uppercase tracking-wide muted">{t('equation.category')}</dt>
                  <dd className="mt-0.5 font-mono text-xs font-black">{t('equation.extent', { value: lastOutcome.extentMoles.toExponential(2) })}</dd>
                </div>
              )}
            </dl>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export { categoryLabels };
