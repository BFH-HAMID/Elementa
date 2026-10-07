import { describe, expect, it } from 'vitest';
import physicsExperiments from '@/data/physicsExperiments.json';
import {
  allPracticalModels,
  clampToControl,
  defaultParams,
  getPracticalModel,
  makeNoise,
  runPractical,
  summarizeResult,
  type PracticalModel,
  type PracticalParams,
  type PracticalRow
} from '@/engine/practicals';

type Exp = { slug: string; dataColumns?: { key: string }[] };
const experiments: Exp[] = (Array.isArray(physicsExperiments) ? physicsExperiments : (physicsExperiments as { experiments: Exp[] }).experiments) as Exp[];

function collectRows(model: PracticalModel, noisy = false) {
  const base = defaultParams(model);
  const values = model.sweep ? model.sweep.values : Array.from({ length: Math.max(model.minReadings, 3) }, () => undefined);
  const rows: PracticalRow[] = [];
  const noise = noisy ? makeNoise(true, 1, mulberry(42)) : undefined;
  let params = base;
  values.forEach((v, i) => {
    params = model.sweep && v !== undefined ? { ...base, [model.sweep.key]: v } : { ...base };
    const elapsed = model.timeScale ? 6 + i * 6 : 30;
    const ctx = { elapsed, rows };
    if (model.solve) params = model.solve(params, ctx);
    const out = runPractical(model, params, { elapsed, rows, noise });
    rows.push(out.row);
  });
  return { rows, params };
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('practical simulation models', () => {
  it('covers every guided practical except the Ohm’s-law workbench', () => {
    const missing = experiments.filter((e) => e.slug !== 'ohms-law' && !getPracticalModel(e.slug)).map((e) => e.slug);
    expect(missing).toEqual([]);
    expect(allPracticalModels.length).toBeGreaterThanOrEqual(44);
  });

  for (const model of allPracticalModels) {
    describe(model.slug, () => {
      const exp = experiments.find((e) => e.slug === model.slug);

      it('has bilingual controls and sensible defaults', () => {
        expect(exp).toBeTruthy();
        expect(model.howTo_en.length).toBeGreaterThan(10);
        expect(model.howTo_bn.length).toBeGreaterThan(10);
        for (const c of model.controls) {
          expect(c.en && c.bn).toBeTruthy();
          if (c.options) expect(c.options.some((o) => o.value === c.default)).toBe(true);
          else {
            expect(c.default).toBeGreaterThanOrEqual(c.min!);
            expect(c.default).toBeLessThanOrEqual(c.max!);
          }
        }
      });

      it('produces a value for every observation-table column', () => {
        const { rows } = collectRows(model);
        for (const col of exp?.dataColumns ?? []) {
          const v = rows[0][col.key];
          expect(v, `${model.slug}.${col.key}`).not.toBeUndefined();
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
        }
      });

      it('solved settings are valid observations', () => {
        const { params } = collectRows(model);
        const out = runPractical(model, params, { elapsed: model.timeScale ? 30 : 30, rows: [] });
        expect(out.ready ?? true).toBe(true);
      });

      it('recovers the accepted result from noise-free readings', () => {
        const { rows, params } = collectRows(model);
        const summary = summarizeResult(model, rows, params);
        expect(summary.value, model.slug).not.toBeNull();
        if (model.result.absolute) expect(summary.error!).toBeLessThanOrEqual(model.result.tolerance ?? 0.01);
        else expect(summary.error!, `${model.slug} ${summary.value} vs ${summary.expected}`).toBeLessThan(3);
      });

      it('stays reasonable with measurement noise', () => {
        const { rows, params } = collectRows(model, true);
        const summary = summarizeResult(model, rows, params);
        expect(summary.value).not.toBeNull();
        if (!model.result.absolute) expect(summary.error!, `${model.slug} ${summary.value}`).toBeLessThan(8);
      });
    });
  }
});

describe('practical "Show me" hints survive slider clamping', () => {
  for (const m of allPracticalModels) {
    if (!m.solve || m.timeScale) continue;
    it(`${m.slug} solve() lands on a recordable setting`, () => {
      let rows: PracticalRow[] = [];
      for (let k = 0; k < m.minReadings; k++) {
        const s = m.solve!(defaultParams(m), { elapsed: 0, rows });
        const clamped: PracticalParams = { ...s };
        for (const c of m.controls) clamped[c.key] = clampToControl(c, s[c.key]);
        const out = runPractical(m, clamped, { elapsed: 0, rows });
        expect(out.ready, `${m.slug} reading ${k + 1}`).not.toBe(false);
        rows = [...rows, out.row];
      }
    });
  }
});
