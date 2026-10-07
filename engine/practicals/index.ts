import type { NoiseFn, PracticalContext, PracticalModel, PracticalOutput, PracticalParams, PracticalRow } from './types';
import { electricityModels } from './electricity';
import { mechanicsModels } from './mechanics';
import { opticsModels } from './optics';
import { heatModels } from './heat';
import { wavesModels } from './waves';
import { modernModels } from './modern';
import { withDefaults, zeroNoise } from './helpers';

export * from './types';
export {
  clampToControl,
  choiceLabel,
  defaultParams,
  makeNoise,
  withDefaults,
  zeroNoise
} from './helpers';

export const allPracticalModels: PracticalModel[] = [
  ...electricityModels,
  ...mechanicsModels,
  ...opticsModels,
  ...heatModels,
  ...wavesModels,
  ...modernModels
];

export const practicalModels: Record<string, PracticalModel> = Object.fromEntries(allPracticalModels.map((m) => [m.slug, m]));

export function getPracticalModel(slug: string | null | undefined): PracticalModel | null {
  if (!slug) return null;
  return practicalModels[slug] ?? null;
}

export function hasPracticalModel(slug: string | null | undefined): boolean {
  return !!getPracticalModel(slug);
}

/** Run a model and add the observation number expected by most tables. */
export function runPractical(
  model: PracticalModel,
  params: PracticalParams | undefined,
  options: { noise?: NoiseFn; elapsed?: number; rows?: PracticalRow[] } = {}
): PracticalOutput {
  const ctx: PracticalContext = { elapsed: options.elapsed ?? 0, rows: options.rows ?? [] };
  const out = model.compute(withDefaults(model, params), options.noise ?? zeroNoise, ctx);
  return { ...out, row: { obsNo: ctx.rows.length + 1, ...out.row } };
}

export function expectedResult(model: PracticalModel, params: PracticalParams): number {
  const e = model.result.expected;
  return typeof e === 'function' ? e(withDefaults(model, params)) : e;
}

export interface PracticalResultSummary {
  value: number | null;
  expected: number;
  /** % error, or absolute deviation in absolute mode. */
  error: number | null;
  good: boolean;
}

export function summarizeResult(model: PracticalModel, rows: PracticalRow[], params: PracticalParams): PracticalResultSummary {
  const p = withDefaults(model, params);
  const expected = expectedResult(model, p);
  const value = rows.length ? model.result.compute(rows, p) : null;
  if (value === null || !Number.isFinite(value)) return { value: null, expected, error: null, good: false };
  if (model.result.absolute) {
    const dev = Math.abs(value - expected);
    return { value, expected, error: dev, good: dev <= (model.result.tolerance ?? 0.01) };
  }
  const error = expected !== 0 ? (Math.abs(value - expected) / Math.abs(expected)) * 100 : 0;
  return { value, expected, error, good: error <= 5 };
}
