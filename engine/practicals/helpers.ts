import type { NoiseFn, PracticalControl, PracticalModel, PracticalParams, PracticalRow } from './types';

export const G = 9.80665;
export const DEG = Math.PI / 180;

export const zeroNoise: NoiseFn = () => 0;

/** Box–Muller gaussian noise generator scaled by a noise level. */
export function makeNoise(enabled: boolean, level = 1, random: () => number = Math.random): NoiseFn {
  if (!enabled || level <= 0) return zeroNoise;
  return (sd: number) => {
    const u = Math.max(1e-12, random());
    const v = random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * sd * level;
  };
}

export function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}

/** Round to significant figures (useful for 2.03e11 style values). */
export function sig(value: number, figures = 4): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  return Number(value.toPrecision(figures));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function num(row: PracticalRow, key: string): number | null {
  const v = row[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function columnValues(rows: PracticalRow[], key: string): number[] {
  return rows.map((r) => num(r, key)).filter((v): v is number => v !== null);
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function meanOf(rows: PracticalRow[], key: string): number | null {
  return mean(columnValues(rows, key));
}

/** Least-squares slope of y = m·x (line forced through the origin). */
export function slopeThroughOrigin(rows: PracticalRow[], xKey: string, yKey: string): number | null {
  let sxy = 0;
  let sxx = 0;
  let n = 0;
  for (const r of rows) {
    const x = num(r, xKey);
    const y = num(r, yKey);
    if (x === null || y === null) continue;
    sxy += x * y;
    sxx += x * x;
    n += 1;
  }
  if (n === 0 || sxx === 0) return null;
  return sxy / sxx;
}

/** Ordinary least squares y = m·x + c. */
export function linearFit(xs: number[], ys: number[]): { slope: number; intercept: number } | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    sxy += xs[i] * ys[i];
  }
  const d = n * sxx - sx * sx;
  if (d === 0) return null;
  const slope = (n * sxy - sx * sy) / d;
  return { slope, intercept: (sy - slope * sx) / n };
}

export function fitRows(rows: PracticalRow[], xKey: string, yKey: string) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const r of rows) {
    const x = num(r, xKey);
    const y = num(r, yKey);
    if (x === null || y === null) continue;
    xs.push(x);
    ys.push(y);
  }
  return linearFit(xs, ys);
}

/** Simple deterministic pseudo random in [-1, 1] for repeatable "trial" variation. */
export function trialJitter(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

export function defaultParams(model: PracticalModel): PracticalParams {
  const p: PracticalParams = {};
  for (const c of model.controls) p[c.key] = c.default;
  return p;
}

export function withDefaults(model: PracticalModel, params: PracticalParams | undefined): PracticalParams {
  return { ...defaultParams(model), ...(params || {}) };
}

export function clampToControl(control: PracticalControl, value: number): number {
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

export function choiceLabel(control: PracticalControl, value: number, bn: boolean): string {
  const opt = control.options?.find((o) => o.value === value);
  if (!opt) return String(value);
  return bn ? opt.bn : opt.en;
}

/** Resonance-style response peaking at 1 when `delta` is 0. */
export function lorentz(delta: number, width: number): number {
  return 1 / (1 + (delta / width) * (delta / width));
}
