'use client';

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  FlaskConical,
  Lightbulb,
  ListChecks,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sigma,
  Table2,
  Target,
  Trash2,
  TriangleAlert,
  Trophy
} from 'lucide-react';
import { useLabI18n } from '@/lib/i18n';
import { getExperiment, guidedExperiments } from '@/lib/labData';
import {
  cellText,
  controlKind,
  getChemPracticalModel,
  runChemPractical,
  summarizeChemResult,
  tasksDone,
  withDefaults,
  type ChemColumn,
  type ChemControl,
  type ChemLiveReading,
  type ChemPracticalModel,
  type ChemTone
} from '@/engine/chemPracticals';
import { useChemPracticalStore, type ChemDataRow } from '@/store/chemPracticalStore';
import { cn, prefersReducedMotion } from '@/lib/utils';
import { chemScenes } from './scenes';
import { ChemDataPlot } from './ChemDataPlot';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function useAnimationClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    // Bubbles, flames and fumes stay still for learners who prefer reduced motion;
    // the ▶ stopwatch still runs because the learner starts it on purpose.
    if (prefersReducedMotion()) {
      setT(1.3);
      return;
    }
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = (now: number) => {
      if (now - last > 33) {
        last = now;
        setT(Math.max(0, (now - start) / 1000));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/** Drives the ▶ time control while `playing` is true. */
function usePlayLoop(playing: boolean, tick: (dt: number) => void) {
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - prev) / 1000);
      if (dt >= 0.05) {
        prev = now;
        tick(dt);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, tick]);
}

export function formatChemValue(v: number | string | undefined, digits?: number, scientific?: boolean): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'string') return v;
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (scientific) return abs === 0 ? '0' : v.toExponential(2).replace('e+', 'e');
  if (digits !== undefined && abs < 0.5 * Math.pow(10, -digits)) return (0).toFixed(digits);
  if (digits !== undefined && abs >= 1e-3 && abs < 1e7) return v.toFixed(digits);
  if (abs !== 0 && (abs >= 1e7 || abs < 1e-3)) return v.toExponential(3).replace('e+', 'e');
  if (digits !== undefined) return v.toFixed(digits);
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(5)));
}

const toneClass: Record<ChemTone, string> = {
  good: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200',
  warn: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200',
  info: 'border-chemistry-200 bg-chemistry-50 text-chemistry-800 dark:border-chemistry-700/60 dark:bg-chemistry-900/40 dark:text-chemistry-100',
  bad: 'border-red-300 bg-red-50 text-red-800 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-200'
};

const stepDecimals = (step?: number) => (step ? (String(step).split('.')[1] || '').length : 0);

const levelLabel: Record<string, { en: string; bn: string }> = {
  'class-6-8': { en: 'Class 6–8', bn: '৬ষ্ঠ–৮ম শ্রেণি' },
  'class-9-10': { en: 'Class 9–10 (SSC)', bn: '৯ম–১০ম শ্রেণি (এসএসসি)' },
  'class-11-12': { en: 'Class 11–12 (HSC)', bn: '১১শ–১২শ শ্রেণি (এইচএসসি)' },
  honours: { en: 'Honours', bn: 'অনার্স' }
};

/* ------------------------------------------------------------------ */
/* Controls                                                             */
/* ------------------------------------------------------------------ */

function OptionButtons({ control, value, onChange, bn }: { control: ChemControl; value: number; onChange: (v: number) => void; bn: boolean }) {
  const label = bn ? control.bn : control.en;
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-black text-[var(--ink)]">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {(control.options ?? []).map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition',
              value === o.value
                ? 'border-chemistry-600 bg-chemistry-600 text-white shadow-sm'
                : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-chemistry-300 hover:text-[var(--ink)]'
            )}
          >
            {bn ? o.bn : o.en}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({
  control,
  value,
  onChange,
  bn,
  playing,
  onPlay,
  onRewind
}: {
  control: ChemControl;
  value: number;
  onChange: (v: number) => void;
  bn: boolean;
  playing?: boolean;
  onPlay?: () => void;
  onRewind?: () => void;
}) {
  const label = bn ? control.bn : control.en;
  const digits = control.digits ?? stepDecimals(control.step);
  const step = control.step ?? 1;
  const isTime = !!control.play;
  return (
    <div className={cn(isTime && 'rounded-2xl border border-chemistry-200 bg-chemistry-50/60 p-2.5 dark:border-chemistry-800 dark:bg-chemistry-950/30')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={`cp-${control.key}`} className="text-[11px] font-black text-[var(--ink)]">
          {label}
        </label>
        <span className="rounded-md bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[11px] font-black text-chemistry-700 dark:text-chemistry-200">
          {formatChemValue(value, digits)}
          {control.unit ? ` ${control.unit}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {isTime && (
          <>
            <button
              type="button"
              data-testid="cp-play"
              onClick={onPlay}
              className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm transition', playing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-chemistry-600 hover:bg-chemistry-700')}
              aria-label={playing ? (bn ? 'থামাও' : 'Pause') : bn ? 'চালাও' : 'Play'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button type="button" onClick={onRewind} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]" aria-label={bn ? 'শুরুতে ফেরো' : 'Back to start'}>
              <RotateCcw size={12} />
            </button>
          </>
        )}
        {control.fine && (
          <button type="button" onClick={() => onChange(value - step)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-chemistry-300 hover:text-[var(--ink)]" aria-label={`${label} −`}>
            <Minus size={13} />
          </button>
        )}
        <input
          id={`cp-${control.key}`}
          type="range"
          min={control.min}
          max={control.max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-chemistry-600"
        />
        {control.fine && (
          <button type="button" onClick={() => onChange(value + step)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-chemistry-300 hover:text-[var(--ink)]" aria-label={`${label} +`}>
            <Plus size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function InferenceBox({ control, value, onChange, bn }: { control: ChemControl; value: number; onChange: (v: number) => void; bn: boolean }) {
  const choices = (control.options ?? []).filter((o) => o.value >= 0);
  return (
    <div className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/70 p-3 dark:border-violet-700/60 dark:bg-violet-950/30">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-violet-800 dark:text-violet-200">
        <Target size={13} />
        {bn ? control.bn : control.en}
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={bn ? control.bn : control.en}>
        {choices.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            data-testid="cp-inference"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition',
              value === o.value ? 'border-violet-600 bg-violet-600 text-white shadow-sm' : 'border-violet-200 bg-[var(--surface)] text-[var(--ink)] hover:border-violet-400 dark:border-violet-800'
            )}
          >
            {bn ? o.bn : o.en}
          </button>
        ))}
      </div>
      {value < 0 && <p className="mt-2 text-[10px] font-bold text-violet-700/80 dark:text-violet-300/80">{bn ? 'পর্যবেক্ষণ দেখে তোমার সিদ্ধান্ত বেছে নাও — রেকর্ডের পর যাচাই হবে।' : 'Decide from what you observe — it is checked once you record.'}</p>}
    </div>
  );
}

const ControlsPanel = memo(function ControlsPanel({
  model,
  params,
  setParam,
  bn,
  playing,
  onPlay
}: {
  model: ChemPracticalModel;
  params: Record<string, number>;
  setParam: (k: string, v: number) => void;
  bn: boolean;
  playing: boolean;
  onPlay: () => void;
}) {
  const regular = model.controls.filter((c) => controlKind(c) !== 'inference' && controlKind(c) !== 'time');
  const time = model.controls.find((c) => controlKind(c) === 'time');
  const inference = model.controls.find((c) => controlKind(c) === 'inference');
  return (
    <div className="space-y-3.5">
      {regular.map((c) =>
        c.options ? (
          <OptionButtons key={c.key} control={c} value={params[c.key]} onChange={(v) => setParam(c.key, v)} bn={bn} />
        ) : (
          <SliderRow key={c.key} control={c} value={params[c.key]} onChange={(v) => setParam(c.key, v)} bn={bn} />
        )
      )}
      {time && <SliderRow control={time} value={params[time.key]} onChange={(v) => setParam(time.key, v)} bn={bn} playing={playing} onPlay={onPlay} onRewind={() => setParam(time.key, time.default)} />}
      {inference && <InferenceBox control={inference} value={params[inference.key]} onChange={(v) => setParam(inference.key, v)} bn={bn} />}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Table                                                                */
/* ------------------------------------------------------------------ */

function cellClass(value: unknown) {
  if (value === '✓') return 'text-emerald-600 dark:text-emerald-300';
  if (value === '✗') return 'text-red-600 dark:text-red-300';
  return '';
}

const ReadingsTable = memo(function ReadingsTable({ columns, rows, bn, onRemove }: { columns: ChemColumn[]; rows: ChemDataRow[]; bn: boolean; onRemove: (id: string) => void }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-center text-xs font-bold text-[var(--muted)]">
        {bn ? 'এখনও কোনো পাঠ নেওয়া হয়নি — সেটআপ ঠিক করে "পাঠ রেকর্ড করো" চাপো।' : 'No readings yet — set up the apparatus and press “Record reading”.'}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="w-full min-w-[520px] text-left text-[11px]">
        <thead className="bg-[var(--surface-soft)] text-[var(--muted)]">
          <tr>
            <th className="px-2.5 py-2 font-black">#</th>
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-2.5 py-2 font-black">
                {bn ? c.bn : c.en}
                {c.unit ? <span className="ml-1 font-bold opacity-70">({c.unit})</span> : null}
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[var(--line)] text-[var(--ink)]">
              <td className="px-2.5 py-1.5 font-mono font-bold text-[var(--muted)]">{i + 1}</td>
              {columns.map((c) => {
                const v = cellText(r.values, c.key, bn);
                return (
                  <td key={c.key} className={cn('whitespace-nowrap px-2.5 py-1.5 font-bold', typeof v === 'number' ? 'font-mono' : '', cellClass(v))}>
                    {formatChemValue(v, c.digits, c.scientific)}
                  </td>
                );
              })}
              <td className="px-1">
                <button type="button" onClick={() => onRemove(r.id)} className="grid h-6 w-6 place-items-center rounded-md text-[var(--muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label={bn ? 'পাঠ মুছুন' : 'Delete reading'}>
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

function LiveReadings({ live, bn }: { live: ChemLiveReading[]; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {live.map((r, i) => {
        const value = typeof r.value === 'number' ? formatChemValue(r.value, r.digits) : bn && r.valueBn ? r.valueBn : r.value;
        return (
          <div key={i} className={cn('min-w-0 rounded-xl border px-2.5 py-2', r.tone ? toneClass[r.tone] : 'border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)]')}>
            <div className="truncate text-[10px] font-black opacity-80">{bn ? r.bn : r.en}</div>
            <div className={cn('mt-0.5 text-sm font-black leading-snug', typeof r.value === 'number' ? 'truncate font-mono' : 'line-clamp-2 text-[12px]')} title={String(value)}>
              {value}
              {r.unit ? <span className="ml-1 text-[10px] font-bold opacity-70">{r.unit}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function downloadCsv(model: ChemPracticalModel, rows: ChemDataRow[], bn: boolean, title: string) {
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['#', ...model.columns.map((c) => `${bn ? c.bn : c.en}${c.unit ? ` (${c.unit})` : ''}`)];
  const lines = rows.map((r, i) => [i + 1, ...model.columns.map((c) => cellText(r.values, c.key, bn))].map(esc).join(','));
  const csv = `\uFEFF${[`# ${title}`, header.map(esc).join(','), ...lines].join('\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${model.slug}-readings.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export function ChemPracticalSimulator({ slug, onNavigate, onOpenBench }: { slug: string; onNavigate?: (slug: string) => void; onOpenBench?: () => void }) {
  const { locale } = useLabI18n();
  const bn = locale === 'bn';
  const model = getChemPracticalModel(slug);
  const experiment = getExperiment(slug);

  const open = useChemPracticalStore((s) => s.open);
  const storeSlug = useChemPracticalStore((s) => s.slug);
  const storedParams = useChemPracticalStore((s) => s.params);
  const dataRows = useChemPracticalStore((s) => s.rows);
  const noiseEnabled = useChemPracticalStore((s) => s.noiseEnabled);
  const playing = useChemPracticalStore((s) => s.playing);
  const setParam = useChemPracticalStore((s) => s.setParam);
  const setParams = useChemPracticalStore((s) => s.setParams);
  const resetParams = useChemPracticalStore((s) => s.resetParams);
  const record = useChemPracticalStore((s) => s.record);
  const removeRow = useChemPracticalStore((s) => s.removeRow);
  const clearRows = useChemPracticalStore((s) => s.clearRows);
  const setNoiseEnabled = useChemPracticalStore((s) => s.setNoiseEnabled);
  const setPlaying = useChemPracticalStore((s) => s.setPlaying);
  const tickPlay = useChemPracticalStore((s) => s.tickPlay);

  useEffect(() => {
    open(slug);
  }, [open, slug]);

  const t = useAnimationClock();
  usePlayLoop(playing, tickPlay);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  const active = storeSlug === slug;
  const params = useMemo(() => (model ? withDefaults(model, active ? storedParams : undefined) : {}), [model, storedParams, active]);
  const rowsList = useMemo(() => (active ? dataRows : []), [dataRows, active]);
  const rows = useMemo(() => rowsList.map((r) => r.values), [rowsList]);

  const ordered = useMemo(() => guidedExperiments.filter((e) => getChemPracticalModel(e.slug)), []);

  if (!model || !experiment) return null;

  const out = runChemPractical(model, params, { rows });
  const Scene = chemScenes[model.scene];
  const summary = summarizeChemResult(model, rows, params);
  const ready = out.ready !== false;
  const count = rowsList.length;
  const done = tasksDone(rows);
  const taskCount = model.tasks?.length ?? 0;
  const complete = count >= model.minReadings && (taskCount === 0 || done.size >= Math.min(taskCount, model.minReadings));
  const index = ordered.findIndex((e) => e.slug === slug);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;
  const title = bn ? experiment.title_bn : experiment.title_en;
  const level = levelLabel[experiment.level] ?? { en: experiment.level, bn: experiment.level };
  const safety = bn ? experiment.safety?.bn : experiment.safety?.en;

  const doRecord = () => {
    const row = record();
    if (!row) return;
    setFlash(true);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 450);
  };

  const showMe = () => {
    if (!model.solve) return;
    let base = params;
    const current = out.row.__task;
    // when this setting is already recorded, jump to the next suggested reading still missing
    if (model.tasks && (typeof current !== 'number' || current < 0 || done.has(current))) {
      const nextTask = model.tasks.findIndex((_, i) => !done.has(i));
      if (nextTask >= 0) base = { ...withDefaults(model, undefined), ...params, ...model.tasks[nextTask].set };
    }
    setPlaying(false);
    setParams(model.solve(base, { rows }));
  };

  const resultText =
    summary.value === null ? '—' : model.result.score ? `${Math.round(summary.value)} / ${Math.round(summary.expected)}` : formatChemValue(summary.value, model.result.digits, model.result.scientific);
  const expectedText = model.result.score ? `${Math.round(summary.expected)}` : formatChemValue(summary.expected, model.result.digits, model.result.scientific);

  return (
    <div className="space-y-3" data-testid="chem-practical-simulator">
      {/* Header */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-chemistry-600 text-white shadow-sm">
              <FlaskConical size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-chemistry-600 dark:text-chemistry-300">
                {bn ? `ইন্টার‍্যাক্টিভ প্র্যাকটিক্যাল সিমুলেশন · ${index + 1}/${ordered.length}` : `Interactive practical simulation · ${index + 1}/${ordered.length}`}
                <span className="ml-2 rounded-full bg-chemistry-500/10 px-2 py-0.5 normal-case tracking-normal">{bn ? level.bn : level.en}</span>
              </p>
              <h2 className={cn('mt-0.5 text-base font-black leading-snug text-[var(--ink)] sm:text-lg', bn && 'font-bengali')}>{title}</h2>
              <p className={cn('mt-1.5 max-w-3xl text-xs font-bold leading-5 text-[var(--muted)]', bn && 'font-bengali')}>{bn ? model.howTo_bn : model.howTo_en}</p>
              {model.formula && <p className="mt-2 inline-block rounded-lg bg-[var(--surface-soft)] px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--ink)]">{model.formula}</p>}
              {safety && (
                <p className={cn('mt-2 flex items-start gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300', bn && 'font-bengali')}>
                  <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                  {safety}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
            <div className="flex items-center gap-1">
              <button type="button" disabled={!prev} onClick={() => prev && onNavigate?.(prev.slug)} className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] transition hover:text-[var(--ink)] disabled:opacity-40" aria-label={bn ? 'আগের প্র্যাকটিক্যাল' : 'Previous practical'}>
                <ChevronLeft size={16} />
              </button>
              <select
                value={slug}
                onChange={(e) => onNavigate?.(e.target.value)}
                className="h-9 max-w-[220px] rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 text-[11px] font-bold text-[var(--ink)]"
                aria-label={bn ? 'প্র্যাকটিক্যাল বেছে নাও' : 'Choose a practical'}
              >
                {(['class-6-8', 'class-9-10', 'class-11-12', 'honours'] as const).map((lv) => {
                  const items = ordered.filter((e) => e.level === lv);
                  if (!items.length) return null;
                  return (
                    <optgroup key={lv} label={bn ? levelLabel[lv].bn : levelLabel[lv].en}>
                      {items.map((e) => (
                        <option key={e.slug} value={e.slug}>
                          {bn ? e.title_bn : e.title_en}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <button type="button" disabled={!next} onClick={() => next && onNavigate?.(next.slug)} className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] transition hover:text-[var(--ink)] disabled:opacity-40" aria-label={bn ? 'পরের প্র্যাকটিক্যাল' : 'Next practical'}>
                <ChevronRight size={16} />
              </button>
            </div>
            {model.solve && (
              <button type="button" data-testid="cp-showme" onClick={showMe} className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800 transition hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                <Lightbulb size={14} />
                {bn ? 'দেখিয়ে দাও' : 'Show me'}
              </button>
            )}
            <button type="button" onClick={resetParams} className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-[11px] font-black text-[var(--muted)] transition hover:text-[var(--ink)]" title={bn ? 'নিয়ন্ত্রণ রিসেট' : 'Reset controls'}>
              <RotateCcw size={14} />
              {bn ? 'রিসেট' : 'Reset'}
            </button>
            {onOpenBench && (
              <button type="button" onClick={onOpenBench} className="flex items-center gap-1.5 rounded-xl border border-chemistry-300 px-3 py-2 text-[11px] font-black text-chemistry-700 transition hover:bg-chemistry-50 dark:border-chemistry-700 dark:text-chemistry-200 dark:hover:bg-chemistry-900/40">
                <ListChecks size={14} />
                {bn ? 'ভার্চুয়াল বেঞ্চে করো' : 'Do it on the bench'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Scene */}
        <div className="min-w-0 space-y-2.5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-card">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[var(--muted)]">
              <CircleDot size={12} className="text-chemistry-600" />
              {bn ? 'নিয়ন্ত্রণ বদলাও — দৃশ্য, মিটার ও পর্যবেক্ষণ সাথে সাথে বদলাবে' : 'Change the controls — the apparatus, meters and observations update live'}
            </span>
            <span className="hidden items-center gap-1 text-[10px] font-black text-[var(--muted)] sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {bn ? 'লাইভ' : 'Live'}
            </span>
          </div>
          <div className={cn('overflow-hidden rounded-2xl border border-[var(--line)] transition', flash && 'ring-4 ring-emerald-400/60')}>
            <Scene model={model} view={out.view} params={params} setParam={setParam} t={t} bn={bn} />
          </div>
          {out.status && (
            <div className={cn('flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-black', toneClass[out.status.tone], bn && 'font-bengali')} role="status" aria-live="polite">
              {out.status.tone === 'good' ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : out.status.tone === 'warn' || out.status.tone === 'bad' ? <TriangleAlert size={15} className="mt-0.5 shrink-0" /> : <CircleDot size={15} className="mt-0.5 shrink-0" />}
              <span>{bn ? out.status.bn : out.status.en}</span>
            </div>
          )}
          <LiveReadings live={out.live} bn={bn} />
        </div>

        {/* Controls + record + result */}
        <div className="min-w-0 space-y-3">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">{bn ? 'নিয়ন্ত্রণ' : 'Controls'}</h3>
              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-black text-[var(--muted)]">
                <input type="checkbox" checked={noiseEnabled} onChange={(e) => setNoiseEnabled(e.target.checked)} className="accent-chemistry-600" />
                {bn ? 'পরিমাপ ত্রুটি' : 'Measurement noise'}
              </label>
            </div>
            <ControlsPanel model={model} params={params} setParam={setParam} bn={bn} playing={playing} onPlay={() => setPlaying(!playing)} />

            {model.tasks && model.tasks.length > 0 && (
              <div className="mt-4 border-t border-[var(--line)] pt-3">
                <div className="mb-1.5 flex items-center justify-between gap-1.5 text-[11px] font-black text-[var(--ink)]">
                  <span className="flex items-center gap-1.5">
                    <ListChecks size={13} className="text-chemistry-600" />
                    {bn ? 'যে পাঠগুলো নিতে হবে' : 'Readings to take'}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    {done.size}/{model.tasks.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {model.tasks.map((task, i) => {
                    const isDone = done.has(i);
                    const isCurrent = out.row.__task === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        data-testid="cp-task"
                        onClick={() => {
                          setPlaying(false);
                          setParams(task.set);
                        }}
                        className={cn(
                          'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black transition',
                          isDone
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : isCurrent
                              ? 'border-chemistry-500 bg-chemistry-50 text-chemistry-700 dark:bg-chemistry-900/50 dark:text-chemistry-100'
                              : 'border-[var(--line)] text-[var(--muted)] hover:border-chemistry-300 hover:text-[var(--ink)]'
                        )}
                      >
                        {isDone && <CheckCircle2 size={11} />}
                        {bn ? task.bn : task.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              data-testid="cp-record"
              onClick={doRecord}
              disabled={!ready}
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition',
                ready ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'cursor-not-allowed bg-[var(--surface-soft)] text-[var(--muted)]'
              )}
            >
              <Plus size={16} />
              {bn ? 'পাঠ রেকর্ড করো' : 'Record reading'}
              <span className={cn('rounded-full px-2 py-0.5 text-[10px]', ready ? 'bg-white/20' : 'bg-[var(--surface)]')}>
                {count}/{model.minReadings}
              </span>
            </button>
            {!ready && <p className="mt-1.5 text-center text-[10px] font-bold text-[var(--muted)]">{bn ? 'সঠিক পর্যবেক্ষণে পৌঁছালে রেকর্ড বোতাম চালু হবে' : 'Record unlocks once the setting is a valid observation'}</p>}
          </div>

          {/* Result */}
          <div className={cn('rounded-3xl border p-4 shadow-card', complete ? (summary.good ? toneClass.good : toneClass.warn) : 'border-[var(--line)] bg-[var(--surface)]')} data-testid="cp-result">
            <div className="flex items-center gap-2 text-xs font-black">
              {complete ? <Trophy size={15} /> : <Sigma size={15} className="text-chemistry-600" />}
              {complete ? (summary.good ? (bn ? 'প্র্যাকটিক্যাল সম্পন্ন!' : 'Practical complete!') : bn ? 'সম্পন্ন — তবে ফলাফল আরেকবার দেখো' : 'Complete — but check your result') : bn ? 'ফলাফল' : 'Result'}
            </div>
            <div className={cn('mt-1 text-[11px] font-bold opacity-80', bn && 'font-bengali')}>{bn ? model.result.bn : model.result.en}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black">{resultText}</span>
              {!model.result.score && <span className="text-xs font-bold opacity-70">{model.result.unit}</span>}
            </div>
            <div className="mt-1 text-[11px] font-bold opacity-80">
              {model.result.score ? (
                <>
                  {bn ? 'সঠিক সিদ্ধান্ত' : 'Correct conclusions'}: {summary.value === null ? '—' : `${Math.round(summary.value)} / ${expectedText}`}
                </>
              ) : (
                <>
                  {bn ? 'স্বীকৃত মান' : 'Accepted'}: <span className="font-mono">{expectedText}</span> {model.result.unit}
                  {summary.error !== null && (
                    <>
                      {' · '}
                      {model.result.absolute ? `${bn ? 'বিচ্যুতি' : 'deviation'} ${formatChemValue(summary.error, model.result.digits)}` : `${bn ? 'ত্রুটি' : 'error'} ${summary.error.toFixed(2)}%`}
                    </>
                  )}
                </>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (Math.min(count, model.minReadings) / model.minReadings) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Observation table + graph */}
      <div className={cn('grid gap-3', model.graph && 'xl:grid-cols-[minmax(0,1fr)_420px]')}>
        <div className="min-w-0 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              <Table2 size={13} />
              {bn ? 'পর্যবেক্ষণ সারণি' : 'Observation table'}
            </h3>
            {count > 0 && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => downloadCsv(model, rowsList, bn, title)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black text-chemistry-700 hover:bg-chemistry-50 dark:text-chemistry-200 dark:hover:bg-chemistry-900/40">
                  <Download size={12} />
                  CSV
                </button>
                <button type="button" onClick={clearRows} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                  <Trash2 size={12} />
                  {bn ? 'সব মুছুন' : 'Clear all'}
                </button>
              </div>
            )}
          </div>
          <ReadingsTable columns={model.columns} rows={rowsList} bn={bn} onRemove={removeRow} />
        </div>
        {model.graph && (
          <div className="min-w-0 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              <BarChart3 size={13} />
              {bn ? 'লেখচিত্র' : 'Graph'}
            </h3>
            <ChemDataPlot graph={model.graph} columns={model.columns} rows={rows} bn={bn} />
          </div>
        )}
      </div>
    </div>
  );
}
