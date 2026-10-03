'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BookOpenCheck, CheckCircle2, Circle, FlaskConical, Lightbulb, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { checkHint, factsFrom, stepSatisfied } from '@/engine/experimentChecks';
import { useLabI18n } from '@/lib/i18n';
import { apparatusName, chemicalsById, chemicalName } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';

/** The guided walk-through that sits beside the bench and ticks each step off. */
export function ExperimentGuidePanel() {
  const { t, locale } = useLabI18n();
  const siteLocale = useLocale();
  const experiment = useLabStore((state) => state.experiment);
  const activeExperiment = useLabStore((state) => state.activeExperiment);
  const vessels = useLabStore((state) => state.vessels);
  const log = useLabStore((state) => state.log);
  const selectedVesselId = useLabStore((state) => state.selectedVesselId);
  const completeStep = useLabStore((state) => state.completeStep);
  const startExperiment = useLabStore((state) => state.startExperiment);
  const stopExperiment = useLabStore((state) => state.stopExperiment);
  const addChemical = useLabStore((state) => state.addChemical);

  const [answers, setAnswers] = useState<Record<number, { answer: number; checked: boolean }>>({});

  const facts = useMemo(() => factsFrom(vessels, log, chemicalsById), [vessels, log]);
  const completed = useMemo(() => activeExperiment?.completed ?? [], [activeExperiment]);

  // Progress is judged by the engine, never by the UI: as soon as the bench satisfies a
  // step's check, that step is ticked off.
  useEffect(() => {
    if (!experiment || !activeExperiment) return;
    for (const step of experiment.steps) {
      if (completed.includes(step.order)) continue;
      if (stepSatisfied(step.check, facts)) completeStep(step.order);
    }
  }, [experiment, activeExperiment, completed, facts, completeStep]);

  useEffect(() => {
    setAnswers({});
  }, [experiment?.slug]);

  if (!experiment || !activeExperiment) return null;

  const done = experiment.steps.filter((step) => completed.includes(step.order)).length;
  const total = experiment.steps.length;
  const currentStep = experiment.steps.find((step) => !completed.includes(step.order)) ?? null;
  const finished = done === total;

  return (
    <section className="card flex min-h-0 flex-col overflow-hidden" aria-label={t('experiment.title')}>
      <header className="flex items-start gap-2 border-b border-[var(--line)] px-4 py-3">
        <BookOpenCheck size={17} className="mt-0.5 shrink-0 text-chemistry-600" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-extrabold leading-tight">{locale === 'bn' ? experiment.title_bn : experiment.title_en}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] muted">
            <span className="pill bg-[var(--surface-soft)]">{t(`experiment.level.${experiment.level}`)}</span>
            <span>{t('experiment.duration', { value: experiment.durationMinutes })}</span>
            <span>· {t('experiment.progress', { done, total })}</span>
          </p>
        </div>
        <button type="button" onClick={stopExperiment} className="btn-ghost min-h-8 rounded-lg p-1.5" aria-label={t('action.close')}>
          <X size={15} />
        </button>
      </header>

      <div className="scrollbar-thin max-h-[520px] min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="eyebrow text-[10px]">{t('experiment.aim')}</p>
          <p className={cn('mt-1 text-xs leading-6', locale === 'bn' && 'font-bengali')}>
            {locale === 'bn' ? experiment.aim_bn : experiment.aim_en}
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
            <span className="muted">{t('experiment.steps')}</span>
            <span className="font-mono">{done}/{total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            />
          </div>
        </div>

        <ol className="space-y-1.5">
          {experiment.steps.map((step) => {
            const isDone = completed.includes(step.order);
            const isCurrent = currentStep?.order === step.order;
            return (
              <li
                key={step.order}
                className={cn(
                  'rounded-xl border p-2.5 transition',
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-900/25'
                    : isCurrent
                      ? 'border-chemistry-300 bg-chemistry-50/70 dark:border-chemistry-700 dark:bg-chemistry-900/25'
                      : 'border-[var(--line)] bg-[var(--surface-soft)]'
                )}
              >
                <div className="flex items-start gap-2">
                  {isDone ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle size={15} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide muted">{t('experiment.step', { index: step.order })}</p>
                    <p className={cn('text-xs leading-5', locale === 'bn' ? 'font-bengali' : 'font-medium')}>
                      {locale === 'bn' ? step.text_bn : step.text_en}
                    </p>
                    {isCurrent && !isDone && (
                      <p className="mt-1 flex items-start gap-1 text-[11px] leading-5 text-chemistry-800 dark:text-chemistry-200">
                        <Lightbulb size={12} className="mt-0.5 shrink-0" />
                        {checkHint(step.check, locale, chemicalsById)}
                      </p>
                    )}
                    {isDone && (
                      <p className="mt-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">{t('experiment.stepDone')}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {finished && (
          <motion.p
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center text-xs font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
          >
            {t('experiment.done')} 🎉
          </motion.p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wide muted">{t('experiment.apparatus')}</p>
            <ul className="flex flex-wrap gap-1">
              {experiment.apparatus.map((id) => (
                <li key={id} className="pill bg-[var(--surface-soft)] text-[10px]">
                  <FlaskConical size={10} /> {apparatusName(id, locale)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wide muted">{t('experiment.chemicals')}</p>
            <ul className="flex flex-wrap gap-1">
              {experiment.chemicals.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    disabled={!selectedVesselId}
                    onClick={() => selectedVesselId && addChemical(selectedVesselId, id)}
                    title={t('action.loadSetup')}
                    className="pill border border-[var(--line)] bg-[var(--surface)] font-mono text-[10px] transition hover:border-chemistry-400 hover:text-chemistry-700 disabled:opacity-40"
                  >
                    {chemicalName(id, locale)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {experiment.quiz.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide muted">{t('experiment.quiz')}</p>
            {experiment.quiz.map((quiz, index) => {
              const state = answers[index];
              const picked = state?.answer ?? null;
              const checked = state?.checked ?? false;
              const correct = picked !== null && picked === quiz.answer;
              return (
                <div key={quiz.question_en} className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                  <p className={cn('text-xs font-bold leading-5', locale === 'bn' && 'font-bengali')}>
                    {locale === 'bn' ? quiz.question_bn : quiz.question_en}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {(locale === 'bn' ? quiz.options_bn : quiz.options_en).map((option, optionIndex) => {
                      const isPicked = picked === optionIndex;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [index]: { answer: optionIndex, checked: false } }))}
                          className={cn(
                            'flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] leading-5 transition',
                            isPicked ? 'border-chemistry-400 bg-chemistry-50 dark:bg-chemistry-900/40' : 'border-[var(--line)] bg-[var(--surface)] hover:border-chemistry-300',
                            checked && isPicked && (correct ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'border-rose-400 bg-rose-50 dark:bg-rose-900/40')
                          )}
                        >
                          <span className="font-mono text-[10px] font-black muted">{String.fromCharCode(97 + optionIndex)}</span>
                          <span className={cn(locale === 'bn' && 'font-bengali')}>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={picked === null}
                      onClick={() => setAnswers((current) => ({ ...current, [index]: { answer: picked as number, checked: true } }))}
                      className="btn-secondary min-h-8 rounded-lg px-3 text-[11px] font-bold"
                    >
                      {t('action.answer')}
                    </button>
                    {checked && (
                      <span className={cn('text-[11px] font-black', correct ? 'text-emerald-600' : 'text-rose-600')}>
                        {correct ? t('experiment.correct') : t('experiment.wrong')}
                      </span>
                    )}
                  </div>
                  {checked && correct && (
                    <p className="mt-2 rounded-lg bg-[var(--surface)] p-2 text-[11px] leading-5">
                      <span className="font-black uppercase muted">{t('experiment.explain')}: </span>
                      {locale === 'bn' ? quiz.explain_bn : quiz.explain_en}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(experiment.safety.en || experiment.safety.bn) && (
          <p
            className={cn(
              'flex items-start gap-2 rounded-xl border p-2.5 text-[11px] leading-5',
              experiment.safety.level === 'danger'
                ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100'
            )}
          >
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-black">{t('experiment.safety')}: </span>
              {(locale === 'bn' ? experiment.safety.bn : experiment.safety.en) ?? experiment.safety.en}
            </span>
          </p>
        )}
      </div>

      <footer className="flex items-center gap-2 border-t border-[var(--line)] px-4 py-3">
        <button type="button" onClick={() => startExperiment(experiment)} className="btn-ghost min-h-9 rounded-lg px-2.5 text-[11px] font-bold">
          <RotateCcw size={14} /> {t('experiment.reset')}
        </button>
        <Link href={`/${siteLocale}/lab/experiments`} className="btn-secondary ml-auto min-h-9 rounded-lg px-3 text-[11px] font-bold">
          {t('experiment.allExperiments')}
        </Link>
      </footer>
    </section>
  );
}
