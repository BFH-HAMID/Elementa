'use client';

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Lightbulb,
  Minus,
  MousePointer2,
  PartyPopper,
  Plus,
  RotateCcw,
  Sigma,
  Table2,
  Target,
  Timer,
  Trash2,
  TriangleAlert
} from 'lucide-react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { physicsExperimentsBySlug } from '@/lib/physicsData';
import {
  allPracticalModels,
  choiceLabel,
  getPracticalModel,
  runPractical,
  summarizeResult,
  withDefaults,
  type PracticalControl,
  type PracticalLiveReading,
  type PracticalModel,
  type PracticalParams,
  type PracticalRow,
  type PracticalTone
} from '@/engine/practicals';
import type { DataColumnDef } from '@/engine/physicsTypes';
import { cn } from '@/lib/utils';
import { practicalScenes } from './scenes';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function useAnimationClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
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

export function formatValue(v: number | string | undefined, digits?: number, scientific?: boolean): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'string') return v;
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (digits !== undefined && !scientific && abs < 1e-12) return (0).toFixed(digits);
  if (!scientific && digits !== undefined && abs >= 1e-3 && abs < 1e6) return v.toFixed(digits);
  if (scientific || (abs !== 0 && (abs >= 1e6 || abs < 1e-3))) return v.toExponential(3).replace('e+', 'e');
  if (digits !== undefined) return v.toFixed(digits);
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(5)));
}

const toneClass: Record<PracticalTone, string> = {
  good: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200',
  warn: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200',
  info: 'border-physics-200 bg-physics-50 text-physics-800 dark:border-physics-700/60 dark:bg-physics-900/40 dark:text-physics-100',
  bad: 'border-red-300 bg-red-50 text-red-800 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-200'
};

const stepDecimals = (step?: number) => (step ? (String(step).split('.')[1] || '').length : 0);

/* ------------------------------------------------------------------ */
/* Controls                                                             */
/* ------------------------------------------------------------------ */

function ControlRow({ control, value, onChange, bn }: { control: PracticalControl; value: number; onChange: (v: number) => void; bn: boolean }) {
  const label = bn ? control.bn : control.en;
  if (control.options) {
    return (
      <div>
        <div className="mb-1.5 text-[11px] font-black text-[var(--ink)]">{label}</div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
          {control.options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition',
                value === o.value
                  ? 'border-physics-600 bg-physics-600 text-white shadow-sm'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-physics-300 hover:text-[var(--ink)]'
              )}
            >
              {bn ? o.bn : o.en}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const digits = control.digits ?? stepDecimals(control.step);
  const step = control.step ?? 1;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={`pc-${control.key}`} className="text-[11px] font-black text-[var(--ink)]">
          {label}
        </label>
        <span className="rounded-md bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[11px] font-black text-physics-700 dark:text-physics-200">
          {value.toFixed(digits)}
          {control.unit ? ` ${control.unit}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {control.fine && (
          <button
            type="button"
            onClick={() => onChange(value - step)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-physics-300 hover:text-[var(--ink)]"
            aria-label={`${label} −`}
          >
            <Minus size={13} />
          </button>
        )}
        <input
          id={`pc-${control.key}`}
          type="range"
          min={control.min}
          max={control.max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-physics-600"
        />
        {control.fine && (
          <button
            type="button"
            onClick={() => onChange(value + step)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-physics-300 hover:text-[var(--ink)]"
            aria-label={`${label} +`}
          >
            <Plus size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

const ControlsPanel = memo(function ControlsPanel({
  model,
  params,
  setParam,
  bn
}: {
  model: PracticalModel;
  params: PracticalParams;
  setParam: (k: string, v: number) => void;
  bn: boolean;
}) {
  return (
    <div className="space-y-3.5">
      {model.controls.map((c) => (
        <ControlRow key={c.key} control={c} value={params[c.key]} onChange={(v) => setParam(c.key, v)} bn={bn} />
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Readings table                                                       */
/* ------------------------------------------------------------------ */

const ReadingsTable = memo(function ReadingsTable({
  columns,
  rows,
  bn,
  onRemove
}: {
  columns: DataColumnDef[];
  rows: { id: string; values: PracticalRow; percentageError?: number; note?: string }[];
  bn: boolean;
  onRemove: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-center text-xs font-bold text-[var(--muted)]">
        {bn ? 'এখনও কোনো পাঠ নেওয়া হয়নি — সেটআপ ঠিক করে "পাঠ রেকর্ড করো" চাপো।' : 'No readings yet — set up the apparatus and press “Record reading”.'}
      </div>
    );
  }
  const showErr = rows.some((r) => r.percentageError !== undefined);
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="w-full min-w-[520px] text-left text-[11px]">
        <thead className="bg-[var(--surface-soft)] text-[var(--muted)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-2.5 py-2 font-black">
                {bn ? c.label_bn : c.label_en}
              </th>
            ))}
            {showErr && <th className="px-2.5 py-2 font-black">{bn ? '% ত্রুটি' : '% err'}</th>}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[var(--line)] text-[var(--ink)]">
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-2.5 py-1.5 font-mono font-bold">
                  {formatValue(r.values[c.key], c.decimals)}
                </td>
              ))}
              {showErr && (
                <td
                  className={cn(
                    'px-2.5 py-1.5 font-mono font-bold',
                    r.percentageError === undefined ? 'text-[var(--muted)]' : r.percentageError <= 3 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'
                  )}
                >
                  {r.percentageError === undefined ? '—' : `${r.percentageError.toFixed(2)}%`}
                </td>
              )}
              <td className="px-1">
                <button
                  type="button"
                  onClick={() => onRemove(r.id)}
                  className="grid h-6 w-6 place-items-center rounded-md text-[var(--muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  aria-label={bn ? 'পাঠ মুছুন' : 'Delete reading'}
                >
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

function LiveReadings({ live, bn }: { live: PracticalLiveReading[]; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {live.map((r, i) => (
        <div key={i} className={cn('min-w-0 rounded-xl border px-2.5 py-2', r.tone ? toneClass[r.tone] : 'border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)]')}>
          <div className="truncate text-[10px] font-black opacity-80">{bn ? r.bn : r.en}</div>
          <div className="mt-0.5 truncate font-mono text-sm font-black">
            {typeof r.value === 'number' ? formatValue(r.value, r.digits) : r.value}
            {r.unit ? <span className="ml-1 text-[10px] font-bold opacity-70">{r.unit}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export function PracticalSimulator() {
  const { isBangla: bn } = usePhysicsI18n();
  const slug = usePhysicsStore((s) => s.activeExperimentSlug);
  const storedParams = usePhysicsStore((s) => s.practicalParams);
  const clockStart = usePhysicsStore((s) => s.practicalClockStart);
  const dataRows = usePhysicsStore((s) => s.dataRows);
  const noiseEnabled = usePhysicsStore((s) => s.noiseEnabled);
  const setNoiseEnabled = usePhysicsStore((s) => s.setNoiseEnabled);
  const setPracticalParam = usePhysicsStore((s) => s.setPracticalParam);
  const setPracticalParams = usePhysicsStore((s) => s.setPracticalParams);
  const restartPracticalClock = usePhysicsStore((s) => s.restartPracticalClock);
  const resetPracticalParams = usePhysicsStore((s) => s.resetPracticalParams);
  const recordCurrentDataRow = usePhysicsStore((s) => s.recordCurrentDataRow);
  const removeDataRow = usePhysicsStore((s) => s.removeDataRow);
  const clearDataRows = usePhysicsStore((s) => s.clearDataRows);
  const setActiveTab = usePhysicsStore((s) => s.setActiveTab);

  const model = getPracticalModel(slug);
  const exp = slug ? physicsExperimentsBySlug.get(slug) : undefined;
  const t = useAnimationClock();
  const [flash, setFlash] = useState(false);
  const sceneBox = useRef<HTMLDivElement>(null);
  const [hasHandles, setHasHandles] = useState(true);
  useEffect(() => {
    setHasHandles(!!sceneBox.current?.querySelector('[data-drag]'));
  }, [slug]);

  const params = useMemo(() => (model ? withDefaults(model, storedParams) : {}), [model, storedParams]);
  const rows = useMemo(() => dataRows.map((r) => r.values), [dataRows]);

  if (!model || !exp) return null;

  const elapsed = clockStart > 0 ? Math.max(0, (Date.now() - clockStart) / 1000) : 0;
  const out = runPractical(model, params, { elapsed, rows });
  const Scene = practicalScenes[model.scene];
  const summary = summarizeResult(model, rows, params);
  const ready = out.ready !== false;
  const count = dataRows.length;
  const done = count >= model.minReadings;
  const sweepControl = model.sweep ? model.controls.find((c) => c.key === model.sweep!.key) : undefined;
  const sweepDone = new Set(dataRows.map((r) => r.values.__sweep).filter((v): v is number => typeof v === 'number'));
  const columns = exp.dataColumns;
  const index = allPracticalModels.findIndex((m) => m.slug === model.slug) + 1;

  const record = () => {
    recordCurrentDataRow();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 450);
  };

  const showMe = () => {
    if (!model.solve) return;
    let base = params;
    // When this sweep value is already recorded, jump to the next one still missing.
    if (model.sweep && sweepDone.has(params[model.sweep.key])) {
      const next = model.sweep.values.find((v) => !sweepDone.has(v));
      if (next !== undefined) base = { ...params, [model.sweep.key]: next };
    }
    setPracticalParams(model.solve(base, { elapsed, rows }));
  };

  const resultText = summary.value === null ? '—' : formatValue(summary.value, model.result.digits, model.result.scientific);
  const expectedText = formatValue(summary.expected, model.result.digits, model.result.scientific);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-physics-600 text-white shadow-sm">
              <Activity size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-physics-600 dark:text-physics-300">
                {bn ? `ইন্টার‍্যাক্টিভ প্র্যাকটিক্যাল সিমুলেশন · ${index}/${allPracticalModels.length}` : `Interactive practical simulation · ${index}/${allPracticalModels.length}`}
              </p>
              <h2 className="mt-0.5 text-base font-black leading-snug text-[var(--ink)] sm:text-lg">{bn ? exp.title_bn : exp.title_en}</h2>
              <p className="mt-1.5 max-w-3xl text-xs font-bold leading-5 text-[var(--muted)]">{bn ? model.howTo_bn : model.howTo_en}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {model.solve && (
              <button type="button" data-testid="pr-showme" onClick={showMe} className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800 transition hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                <Lightbulb size={14} />
                {bn ? 'দেখিয়ে দাও' : 'Show me'}
              </button>
            )}
            {model.timeScale && (
              <button type="button" onClick={restartPracticalClock} className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-[11px] font-black text-[var(--muted)] transition hover:text-[var(--ink)]">
                <Timer size={14} />
                {bn ? 'প্রক্রিয়া আবার শুরু' : 'Restart process'}
              </button>
            )}
            <button type="button" onClick={resetPracticalParams} className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-[11px] font-black text-[var(--muted)] transition hover:text-[var(--ink)]" title={bn ? 'নিয়ন্ত্রণ রিসেট' : 'Reset controls'}>
              <RotateCcw size={14} />
              {bn ? 'রিসেট' : 'Reset'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Scene */}
        <div className="min-w-0 space-y-2.5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-card">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[var(--muted)]">
              <MousePointer2 size={12} className="text-physics-600" />
              {hasHandles
                ? bn
                  ? 'নীল হাতল টেনে সরাও, অথবা স্লাইডার ব্যবহার করো'
                  : 'Drag the blue handles or use the sliders'
                : bn
                  ? 'স্লাইডার দিয়ে সেটআপ বদলাও — দৃশ্য সাথে সাথে বদলাবে'
                  : 'Change the setup with the sliders — the scene updates live'}
            </span>
            <span className="hidden items-center gap-1 text-[10px] font-black text-[var(--muted)] sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {bn ? 'লাইভ' : 'Live'}
            </span>
          </div>
          <div ref={sceneBox} className={cn('overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/40 transition', flash && 'ring-4 ring-emerald-400/60')}>
            <Scene model={model} view={out.view} params={params} setParam={setPracticalParam} t={t} bn={bn} />
          </div>
          {out.status && (
            <div className={cn('flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-black', toneClass[out.status.tone])} role="status" aria-live="polite">
              {out.status.tone === 'good' ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : out.status.tone === 'warn' ? <TriangleAlert size={15} className="mt-0.5 shrink-0" /> : <CircleDot size={15} className="mt-0.5 shrink-0" />}
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
                <input type="checkbox" checked={noiseEnabled} onChange={(e) => setNoiseEnabled(e.target.checked)} className="accent-physics-600" />
                {bn ? 'পরিমাপ ত্রুটি' : 'Measurement noise'}
              </label>
            </div>
            <ControlsPanel model={model} params={params} setParam={setPracticalParam} bn={bn} />

            {model.sweep && sweepControl && (
              <div className="mt-4 border-t border-[var(--line)] pt-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-[var(--ink)]">
                  <Target size={13} className="text-physics-600" />
                  {bn ? `প্রস্তাবিত পাঠ: ${sweepControl.bn}` : `Suggested readings: ${sweepControl.en}`}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {model.sweep.values.map((v) => {
                    const isDone = sweepDone.has(v);
                    const isCurrent = params[model.sweep!.key] === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPracticalParam(model.sweep!.key, v)}
                        className={cn(
                          'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black transition',
                          isDone
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : isCurrent
                              ? 'border-physics-500 bg-physics-50 text-physics-700 dark:bg-physics-900/50 dark:text-physics-100'
                              : 'border-[var(--line)] text-[var(--muted)] hover:border-physics-300 hover:text-[var(--ink)]'
                        )}
                      >
                        {isDone && <CheckCircle2 size={11} />}
                        {sweepControl.options ? choiceLabel(sweepControl, v, bn) : `${v}${sweepControl.unit ? ` ${sweepControl.unit}` : ''}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              data-testid="pr-record"
              onClick={record}
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
            {!ready && (
              <p className="mt-1.5 text-center text-[10px] font-bold text-[var(--muted)]">
                {bn ? 'সঠিক সেটিংয়ে পৌঁছালে রেকর্ড বোতাম চালু হবে' : 'Record unlocks once the setting is a valid observation'}
              </p>
            )}
          </div>

          {/* Result */}
          <div className={cn('rounded-3xl border p-4 shadow-card', done ? (summary.good ? toneClass.good : toneClass.warn) : 'border-[var(--line)] bg-[var(--surface)]')}>
            <div className="flex items-center gap-2 text-xs font-black">
              {done ? <PartyPopper size={15} /> : <Sigma size={15} className="text-physics-600" />}
              {done ? (bn ? 'প্র্যাকটিক্যাল সম্পন্ন!' : 'Practical complete!') : bn ? 'ফলাফল' : 'Result'}
            </div>
            <div className="mt-1 text-[11px] font-bold opacity-80">{bn ? model.result.bn : model.result.en}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black">{resultText}</span>
              <span className="text-xs font-bold opacity-70">{model.result.unit}</span>
            </div>
            <div className="mt-1 text-[11px] font-bold opacity-80">
              {bn ? 'স্বীকৃত মান' : 'Accepted'}: <span className="font-mono">{expectedText}</span> {model.result.unit}
              {summary.error !== null && (
                <>
                  {' · '}
                  {model.result.absolute
                    ? `${bn ? 'বিচ্যুতি' : 'deviation'} ${formatValue(summary.error, model.result.digits)}`
                    : `${bn ? 'ত্রুটি' : 'error'} ${summary.error.toFixed(2)}%`}
                </>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (count / model.minReadings) * 100)}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setActiveTab('graph')} className="flex items-center gap-1 rounded-lg border border-current/20 px-2.5 py-1.5 text-[11px] font-black opacity-90 hover:opacity-100">
                <BarChart3 size={13} />
                {bn ? 'গ্রাফ' : 'Graph'}
              </button>
              <button type="button" onClick={() => setActiveTab('table')} className="flex items-center gap-1 rounded-lg border border-current/20 px-2.5 py-1.5 text-[11px] font-black opacity-90 hover:opacity-100">
                <Table2 size={13} />
                {bn ? 'ডেটা সারণি' : 'Data table'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Observation table */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">{bn ? 'পর্যবেক্ষণ সারণি' : 'Observation table'}</h3>
          {count > 0 && (
            <button type="button" onClick={clearDataRows} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
              <Trash2 size={12} />
              {bn ? 'সব মুছুন' : 'Clear all'}
            </button>
          )}
        </div>
        <ReadingsTable columns={columns} rows={dataRows} bn={bn} onRemove={removeDataRow} />
      </div>
    </div>
  );
}
