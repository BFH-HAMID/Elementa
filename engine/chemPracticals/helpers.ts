import { blendColors } from '../colorMixer';
import { clamp, linearFit, num, round } from '../practicals/helpers';
import type { ChemChoice, ChemControl, ChemParams, ChemPracticalModel, ChemRow, ChemStatus, ChemTone } from './types';

export { clamp, linearFit, mean, meanOf, num, round, sig, slopeThroughOrigin, trialJitter, makeNoise, zeroNoise } from '../practicals/helpers';
export { blendColors, darken, lighten, withAlpha } from '../colorMixer';

/** Molar volume of a gas at room temperature and pressure (mL mol⁻¹). */
export const MOLAR_VOLUME_ML = 24000;
/** Faraday constant (C mol⁻¹). */
export const FARADAY = 96485;
/** Specific heat capacity of water / dilute solutions (J g⁻¹ K⁻¹). */
export const C_WATER = 4.18;

export const COLORLESS = '#eaf3fb';
export const WATER = '#d6ebfa';

/* ------------------------------------------------------------------ */
/* Controls                                                             */
/* ------------------------------------------------------------------ */

export function defaultParams(model: ChemPracticalModel): ChemParams {
  const p: ChemParams = {};
  for (const c of model.controls) p[c.key] = c.default;
  return p;
}

export function withDefaults(model: ChemPracticalModel, params: ChemParams | undefined): ChemParams {
  return { ...defaultParams(model), ...(params || {}) };
}

export function clampToControl(control: ChemControl, value: number): number {
  if (control.options && control.options.length) {
    let best = control.options[0].value;
    for (const o of control.options) if (Math.abs(o.value - value) < Math.abs(best - value)) best = o.value;
    return best;
  }
  const min = control.min ?? -Infinity;
  const max = control.max ?? Infinity;
  let v = clamp(value, min, max);
  if (control.step && Number.isFinite(min)) {
    v = min + Math.round((v - min) / control.step) * control.step;
    v = clamp(v, min, max);
    const decimals = (String(control.step).split('.')[1] || '').length;
    v = round(v, Math.max(decimals, 0) + 2);
  }
  return v;
}

export function choiceLabel(control: ChemControl, value: number, bn: boolean): string {
  const opt = control.options?.find((o) => o.value === value);
  if (!opt) return String(value);
  return bn ? opt.bn : opt.en;
}

export function controlKind(control: ChemControl): NonNullable<ChemControl['kind']> {
  return control.kind ?? 'condition';
}

/** The process clock control (if the practical has one). */
export function timeControl(model: ChemPracticalModel): ChemControl | undefined {
  return model.controls.find((c) => controlKind(c) === 'time');
}

export function inferenceControl(model: ChemPracticalModel): ChemControl | undefined {
  return model.controls.find((c) => controlKind(c) === 'inference');
}

const same = (a: number | undefined, b: number) => a !== undefined && Math.abs(a - b) < 1e-6;

/** Index of the first task whose controls all match `params` (−1 when none). */
export function matchTask(model: ChemPracticalModel, params: ChemParams): number {
  if (!model.tasks) return -1;
  return model.tasks.findIndex((task) => Object.entries(task.set).every(([k, v]) => same(params[k], v)));
}

/* ------------------------------------------------------------------ */
/* Small builders                                                       */
/* ------------------------------------------------------------------ */

export const opt = (value: number, en: string, bn: string): ChemChoice => ({ value, en, bn });

export const status = (tone: ChemTone, en: string, bn: string): ChemStatus => ({ tone, en, bn });

/** Bangla digits for numbers inside Bangla sentences. */
export function bnNum(value: number | string): string {
  const digits = '০১২৩৪৫৬৭৮৯';
  return String(value).replace(/[0-9]/g, (d) => digits[Number(d)]);
}

export function fix(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

/* ------------------------------------------------------------------ */
/* Identification practicals                                            */
/* ------------------------------------------------------------------ */

/**
 * Correct identifications: rows are grouped by their `__key` (the sample) and only
 * the latest reading of each sample counts, so a wrong conclusion can be fixed by
 * recording that sample again.
 */
export function scoreRows(rows: ChemRow[]): number | null {
  if (rows.length === 0) return null;
  const latest = new Map<string, ChemRow>();
  for (const r of rows) {
    const key = r.__key;
    if (key === undefined) continue;
    latest.set(String(key), r);
  }
  let score = 0;
  latest.forEach((r) => {
    if (num(r, '__correct') === 1) score += 1;
  });
  return score;
}

export const tick = (correct: boolean) => (correct ? '✓' : '✗');

/* ------------------------------------------------------------------ */
/* Kinetics & curves                                                    */
/* ------------------------------------------------------------------ */

/** First-order approach to a final value: y = final·(1 − e^(−k·t)) after an optional lag. */
export function rise(final: number, k: number, t: number, lag = 0): number {
  const tt = Math.max(0, t - lag);
  return final * (1 - Math.exp(-k * tt));
}

/** Time for a first-order rise to reach `fraction` of its final value. */
export function riseTime(k: number, fraction = 0.995, lag = 0): number {
  return lag + -Math.log(1 - fraction) / Math.max(k, 1e-9);
}

/** Logistic step from 0 to 1 centred on `x0` with width `w`. */
export function smoothStep(x: number, x0: number, w: number): number {
  return 1 / (1 + Math.exp(-(x - x0) / Math.max(w, 1e-9)));
}

/**
 * Two straight lines through the rising and falling branches of a peaked data set
 * (thermometric titration, continuous variation…). Returns where they cross.
 * Every split point is tried and the one with the smallest residual wins.
 */
export function twoLineIntersection(points: { x: number; y: number }[]): { x: number; y: number } | null {
  const pts = [...points].filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((a, b) => a.x - b.x);
  // drop duplicate x (keep the latest reading)
  const uniq: { x: number; y: number }[] = [];
  for (const p of pts) {
    if (uniq.length && Math.abs(uniq[uniq.length - 1].x - p.x) < 1e-9) uniq[uniq.length - 1] = p;
    else uniq.push(p);
  }
  if (uniq.length < 4) return null;
  let best: { x: number; y: number; err: number } | null = null;
  for (let split = 2; split <= uniq.length - 2; split++) {
    const left = uniq.slice(0, split);
    const right = uniq.slice(split);
    const a = linearFit(left.map((p) => p.x), left.map((p) => p.y));
    const b = linearFit(right.map((p) => p.x), right.map((p) => p.y));
    if (!a || !b || Math.abs(a.slope - b.slope) < 1e-12) continue;
    const x = (b.intercept - a.intercept) / (a.slope - b.slope);
    if (!Number.isFinite(x)) continue;
    const err =
      left.reduce((s, p) => s + (p.y - (a.slope * p.x + a.intercept)) ** 2, 0) +
      right.reduce((s, p) => s + (p.y - (b.slope * p.x + b.intercept)) ** 2, 0);
    // the crossing must sit between (or very near) the two branches
    const lo = left[left.length - 1].x - (uniq[uniq.length - 1].x - uniq[0].x) * 0.25;
    const hi = right[0].x + (uniq[uniq.length - 1].x - uniq[0].x) * 0.25;
    if (x < lo || x > hi) continue;
    if (!best || err < best.err) best = { x, y: a.slope * x + a.intercept, err };
  }
  return best ? { x: best.x, y: best.y } : null;
}

/** Linear interpolation of x where y crosses `target` (data sorted by x). */
export function crossing(points: { x: number; y: number }[], target: number): number | null {
  const pts = [...points].sort((a, b) => a.x - b.x);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if ((a.y - target) * (b.y - target) <= 0 && a.y !== b.y) {
      return a.x + ((target - a.y) * (b.x - a.x)) / (b.y - a.y);
    }
  }
  return null;
}

export function points(rows: ChemRow[], xKey: string, yKey: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const r of rows) {
    const x = num(r, xKey);
    const y = num(r, yKey);
    if (x !== null && y !== null) out.push({ x, y });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Acid–base                                                            */
/* ------------------------------------------------------------------ */

/**
 * pH while a strong base (cb, mol L⁻¹) is added to va mL of an acid (ca) — strong
 * (ka = Infinity) or weak (finite ka) — after vb mL. Exact charge balance, so the
 * curve is smooth through the equivalence point.
 */
export function titrationPh(opts: { va: number; ca: number; vb: number; cb: number; ka?: number }): number {
  const { va, ca, vb, cb } = opts;
  const ka = opts.ka ?? Infinity;
  const vt = Math.max(va + vb, 1e-9) / 1000;
  const cA = (ca * va) / 1000 / vt; // total acid
  const cNa = (cb * vb) / 1000 / vt; // spectator cation from the base
  const kw = 1e-14;
  // charge balance: [H+] + [Na+] = [OH−] + [A−]
  const f = (h: number) => {
    const aMinus = Number.isFinite(ka) ? (cA * ka) / (ka + h) : cA;
    return h + cNa - kw / h - aMinus;
  };
  let lo = 1e-15;
  let hi = 10;
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return -Math.log10(Math.sqrt(lo * hi));
}

/** pH of a weak acid (c, Ka) solved exactly; strong acid when ka is Infinity. */
export function weakAcidPh(c: number, ka: number): number {
  if (!Number.isFinite(ka)) return -Math.log10(c / 2 + Math.sqrt((c * c) / 4 + 1e-14));
  const h = (-ka + Math.sqrt(ka * ka + 4 * ka * c)) / 2;
  return -Math.log10(Math.max(h, 1e-7));
}

/** pH of a weak base (c, Kb). */
export function weakBasePh(c: number, kb: number): number {
  const oh = (-kb + Math.sqrt(kb * kb + 4 * kb * c)) / 2;
  return 14 + Math.log10(Math.max(oh, 1e-7));
}

/** A colour that fades smoothly between stops, e.g. a solution decolourising. */
export function fade(from: string, to: string, amount: number): string {
  return blendColors(from, to, clamp(amount, 0, 1));
}

/* ------------------------------------------------------------------ */
/* Bilingual table cells                                                */
/* ------------------------------------------------------------------ */

/** A bilingual text cell: `key` holds English and `key@bn` Bangla. */
export function tx(key: string, en: string, bn: string): ChemRow {
  return { [key]: en, [`${key}@bn`]: bn };
}

/** Read a (possibly bilingual) cell for display. */
export function cellText(row: ChemRow, key: string, bn: boolean): string | number | undefined {
  if (bn) {
    const b = row[`${key}@bn`];
    if (b !== undefined) return b;
  }
  return row[key];
}

/** The latest recorded row for each value of `key` (e.g. each sample). */
export function latestBy(rows: ChemRow[], key: string): Map<string, ChemRow> {
  const out = new Map<string, ChemRow>();
  for (const r of rows) {
    const k = r[key];
    if (k !== undefined) out.set(String(k), r);
  }
  return out;
}

/** "— choose —" placeholder for inference controls. */
export const CHOOSE: ChemChoice = { value: -1, en: '— choose —', bn: '— বেছে নাও —' };

export function optionText(options: ChemChoice[], value: number): { en: string; bn: string } {
  const o = options.find((x) => x.value === value);
  return o ? { en: o.en, bn: o.bn } : { en: String(value), bn: String(value) };
}

/** Universal-indicator colour names. */
export function universalName(ph: number): { en: string; bn: string } {
  if (ph < 2.5) return { en: 'red', bn: 'লাল' };
  if (ph < 4.5) return { en: 'orange', bn: 'কমলা' };
  if (ph < 6.5) return { en: 'yellow', bn: 'হলুদ' };
  if (ph <= 7.5) return { en: 'green', bn: 'সবুজ' };
  if (ph < 9.5) return { en: 'blue-green', bn: 'নীলাভ সবুজ' };
  if (ph < 11.5) return { en: 'blue', bn: 'নীল' };
  return { en: 'violet', bn: 'বেগুনি' };
}

/** Mean of the largest group of values lying within `tol` of each other (concordant titres). */
export function concordantMean(values: number[], tol: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  let best: number[] = [sorted[0]];
  for (let i = 0; i < sorted.length; i++) {
    const group = sorted.filter((v) => v >= sorted[i] - 1e-9 && v <= sorted[i] + tol + 1e-9);
    if (group.length > best.length) best = group;
  }
  return best.reduce((s, v) => s + v, 0) / best.length;
}
