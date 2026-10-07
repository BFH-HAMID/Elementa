'use client';

import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { physicsExperimentsBySlug } from '@/lib/physicsData';
import { Activity, BookOpen, CheckCircle2, ClipboardList, FlaskConical, Thermometer, Waves } from 'lucide-react';

const stationNames = {
  waves: { en: 'Waves & oscillations station', bn: 'তরঙ্গ ও দোলন স্টেশন', icon: Waves },
  heat: { en: 'Heat & thermodynamics station', bn: 'তাপ ও তাপগতিবিদ্যা স্টেশন', icon: Thermometer },
  modern: { en: 'Modern physics station', bn: 'আধুনিক পদার্থবিজ্ঞান স্টেশন', icon: Activity },
  measurement: { en: 'Measurement station', bn: 'পরিমাপ স্টেশন', icon: FlaskConical }
} as const;

/**
 * A calm centre workspace for practicals whose apparatus is real-world rather
 * than a continuous canvas simulation. It keeps the loaded practical useful
 * instead of leaving the workbench blank, while the guide and data tabs handle
 * the full report workflow.
 */
export function PracticalStation() {
  const { isBangla } = usePhysicsI18n();
  const activeExperimentSlug = usePhysicsStore((state) => state.activeExperimentSlug);
  const setActiveTab = usePhysicsStore((state) => state.setActiveTab);
  const exp = activeExperimentSlug ? physicsExperimentsBySlug.get(activeExperimentSlug) : null;

  if (!exp) return null;

  const station = stationNames[exp.domain as keyof typeof stationNames] ?? stationNames.measurement;
  const Icon = station.icon;
  const columns = exp.dataColumns.filter((column) => column.key !== 'obsNo').slice(0, 4);
  const firstStep = exp.procedureSteps[0];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100">
              <Icon size={24} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-physics-600 dark:text-physics-300">
                {isBangla ? station.bn : station.en}
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--ink)] sm:text-xl">
                {isBangla ? exp.title_bn : exp.title_en}
              </h2>
              <p className="mt-2 max-w-2xl text-xs font-bold leading-6 text-[var(--muted)]">
                {isBangla ? exp.aim_bn : exp.aim_en}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
            {isBangla ? 'গাইডেড প্র্যাকটিক্যাল' : 'Guided practical'}
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-physics-200 bg-physics-50/70 p-4 dark:border-physics-900/60 dark:bg-physics-900/20">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-physics-700 dark:text-physics-300">
            <BookOpen size={14} />
            {isBangla ? 'কাজের সূত্র' : 'Working relation'}
          </div>
          <p className="mt-2 overflow-x-auto font-mono text-base font-black text-physics-950 dark:text-physics-100">
            {exp.formula_latex}
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-[var(--muted)]">
            {isBangla ? exp.formula_desc_bn : exp.formula_desc_en}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3 text-sm font-black text-[var(--ink)]">
            <ClipboardList size={17} className="text-physics-600" />
            {isBangla ? 'প্রথম ধাপ' : 'First checkpoint'}
          </div>
          {firstStep && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--surface-soft)] p-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-physics-600 text-xs font-black text-white">1</span>
              <p className="text-xs font-bold leading-6 text-[var(--ink)]">
                {isBangla ? firstStep.instruction_bn : firstStep.instruction_en}
              </p>
            </div>
          )}
          <button type="button" onClick={() => setActiveTab('theory')} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line)] px-3 text-xs font-black text-[var(--ink)] transition hover:border-physics-400 hover:bg-[var(--surface-soft)]">
            <BookOpen size={15} />
            {isBangla ? 'তত্ত্ব দেখুন' : 'Open theory'}
          </button>
        </div>

        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3 text-sm font-black text-[var(--ink)]">
            <CheckCircle2 size={17} className="text-emerald-600" />
            {isBangla ? 'পর্যবেক্ষণ রেকর্ড' : 'Observation record'}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {columns.map((column) => (
              <div key={column.key} className="rounded-xl bg-[var(--surface-soft)] p-2.5">
                <p className="truncate text-[10px] font-bold text-[var(--muted)]">{isBangla ? column.label_bn : column.label_en}</p>
                <p className="mt-1 font-mono text-xs font-black text-[var(--ink)]">{column.unit || '—'}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setActiveTab('table')} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-physics-600 px-3 text-xs font-black text-white shadow-sm transition hover:bg-physics-700">
            <ClipboardList size={15} />
            {isBangla ? 'ডেটা টেবিল খুলুন' : 'Open data table'}
          </button>
        </div>
      </div>
    </div>
  );
}
