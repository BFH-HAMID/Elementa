import type { ChemContext, ChemNoiseFn, ChemOutput, ChemParams, ChemPracticalModel, ChemRow } from './types';
import { acidBaseModels } from './acidBase';
import { qualitativeModels } from './qualitative';
import { gasModels } from './gases';
import { redoxModels } from './redox';
import { electroModels } from './electro';
import { thermalModels } from './thermal';
import { kineticsModels } from './kinetics';
import { matchTask, withDefaults, zeroNoise } from './helpers';

export * from './types';
export {
  cellText,
  choiceLabel,
  clampToControl,
  controlKind,
  defaultParams,
  inferenceControl,
  makeNoise,
  matchTask,
  timeControl,
  withDefaults,
  zeroNoise
} from './helpers';

export const allChemPracticalModels: ChemPracticalModel[] = [
  ...acidBaseModels,
  ...qualitativeModels,
  ...gasModels,
  ...redoxModels,
  ...electroModels,
  ...thermalModels,
  ...kineticsModels
];

export const chemPracticalModels: Record<string, ChemPracticalModel> = Object.fromEntries(allChemPracticalModels.map((m) => [m.slug, m]));

export function getChemPracticalModel(slug: string | null | undefined): ChemPracticalModel | null {
  if (!slug) return null;
  return chemPracticalModels[slug] ?? null;
}

export function hasChemPracticalModel(slug: string | null | undefined): boolean {
  return !!getChemPracticalModel(slug);
}

/**
 * Run a model with defaults filled in. The row gets the observation number and the
 * index of the suggested task it ticks off (`__task`, −1 when none matches).
 */
export function runChemPractical(model: ChemPracticalModel, params: ChemParams | undefined, options: { noise?: ChemNoiseFn; rows?: ChemRow[] } = {}): ChemOutput {
  const ctx: ChemContext = { rows: options.rows ?? [] };
  const p = withDefaults(model, params);
  const out = model.compute(p, options.noise ?? zeroNoise, ctx);
  return { ...out, row: { obsNo: ctx.rows.length + 1, __task: matchTask(model, p), ...out.row } };
}

export function expectedChemResult(model: ChemPracticalModel, params: ChemParams): number {
  const e = model.result.expected;
  return typeof e === 'function' ? e(withDefaults(model, params)) : e;
}

export interface ChemResultSummary {
  value: number | null;
  expected: number;
  /** % error, or absolute deviation in absolute mode. */
  error: number | null;
  good: boolean;
}

export function summarizeChemResult(model: ChemPracticalModel, rows: ChemRow[], params: ChemParams): ChemResultSummary {
  const p = withDefaults(model, params);
  const expected = expectedChemResult(model, p);
  const value = rows.length ? model.result.compute(rows, p) : null;
  if (value === null || !Number.isFinite(value)) return { value: null, expected, error: null, good: false };
  if (model.result.absolute) {
    const dev = Math.abs(value - expected);
    return { value, expected, error: dev, good: dev <= (model.result.tolerance ?? 0.01) + 1e-9 };
  }
  const error = expected !== 0 ? (Math.abs(value - expected) / Math.abs(expected)) * 100 : 0;
  return { value, expected, error, good: error <= (model.result.goodWithin ?? 5) };
}

/** Indices of the suggested tasks already recorded. */
export function tasksDone(rows: ChemRow[]): Set<number> {
  const done = new Set<number>();
  for (const r of rows) {
    const t = r.__task;
    if (typeof t === 'number' && t >= 0) done.add(t);
  }
  return done;
}
