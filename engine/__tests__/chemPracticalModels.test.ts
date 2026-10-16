import { describe, expect, it } from 'vitest';
import { guidedExperiments } from '@/lib/labData';
import {
  allChemPracticalModels,
  clampToControl,
  controlKind,
  defaultParams,
  getChemPracticalModel,
  makeNoise,
  runChemPractical,
  summarizeChemResult,
  tasksDone,
  type ChemParams,
  type ChemPracticalModel,
  type ChemRow
} from '@/engine/chemPracticals';

type Exp = { slug: string };
const experiments = guidedExperiments as Exp[];

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

/** Play the practical like a careful student: every suggested task, then "Show me", then record. */
function collectRows(model: ChemPracticalModel, noisy = false) {
  const base = defaultParams(model);
  const rows: ChemRow[] = [];
  const noise = noisy ? makeNoise(true, 1, mulberry(42)) : undefined;
  const readiness: boolean[] = [];
  const tasks = model.tasks ?? [];
  let params: ChemParams = base;
  for (const task of tasks) {
    params = { ...base, ...task.set };
    if (model.solve) params = model.solve(params, { rows });
    const out = runChemPractical(model, params, { rows, noise });
    readiness.push(out.ready !== false);
    rows.push(out.row);
  }
  return { rows, params, readiness };
}

const isNumericColumn = (model: ChemPracticalModel, key: string) => model.columns.find((c) => c.key === key)?.digits !== undefined;

describe('chemistry practical simulation models', () => {
  it('covers every guided chemistry experiment', () => {
    const missing = experiments.filter((e) => !getChemPracticalModel(e.slug)).map((e) => e.slug);
    expect(missing).toEqual([]);
    expect(experiments.length).toBeGreaterThanOrEqual(46);
    expect(allChemPracticalModels).toHaveLength(experiments.length);
  });

  it('has a guided walkthrough for every simulation and unique slugs', () => {
    const slugs = allChemPracticalModels.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const orphan = slugs.filter((s) => !experiments.some((e) => e.slug === s));
    expect(orphan).toEqual([]);
  });

  for (const model of allChemPracticalModels) {
    describe(model.slug, () => {
      it('has bilingual text, sensible controls and tasks', () => {
        expect(model.howTo_en.length).toBeGreaterThan(40);
        expect(model.howTo_bn.length).toBeGreaterThan(40);
        expect(model.result.en && model.result.bn).toBeTruthy();
        expect(model.columns.length).toBeGreaterThan(1);
        for (const col of model.columns) expect(col.en && col.bn, `${model.slug}.${col.key}`).toBeTruthy();
        const keys = new Set<string>();
        for (const c of model.controls) {
          expect(keys.has(c.key), `duplicate control ${c.key}`).toBe(false);
          keys.add(c.key);
          expect(c.en && c.bn).toBeTruthy();
          if (c.options) {
            expect(c.options.some((o) => o.value === c.default), `${model.slug}.${c.key} default`).toBe(true);
            for (const o of c.options) expect(o.en && o.bn).toBeTruthy();
          } else {
            expect(c.default).toBeGreaterThanOrEqual(c.min!);
            expect(c.default).toBeLessThanOrEqual(c.max!);
            expect(c.step).toBeGreaterThan(0);
          }
          if (c.play) expect(controlKind(c)).toBe('time');
        }
        expect(model.controls.filter((c) => controlKind(c) === 'time').length).toBeLessThanOrEqual(1);
        expect(model.controls.filter((c) => controlKind(c) === 'inference').length).toBeLessThanOrEqual(1);
        expect(model.tasks?.length ?? 0).toBeGreaterThanOrEqual(model.minReadings);
        for (const task of model.tasks ?? []) {
          expect(task.en && task.bn).toBeTruthy();
          for (const [k, v] of Object.entries(task.set)) {
            const control = model.controls.find((c) => c.key === k);
            expect(control, `${model.slug} task sets unknown control ${k}`).toBeTruthy();
            expect(clampToControl(control!, v)).toBeCloseTo(v, 9);
          }
        }
      });

      it('fills every observation-table column with finite values', () => {
        const out = runChemPractical(model, defaultParams(model));
        expect(out.row.obsNo).toBe(1);
        for (const col of model.columns) {
          const v = out.row[col.key];
          expect(v, `${model.slug}.${col.key}`).not.toBeUndefined();
          if (typeof v === 'number') expect(Number.isFinite(v), `${model.slug}.${col.key}`).toBe(true);
        }
        for (const r of out.live) {
          expect(r.en && r.bn).toBeTruthy();
          if (typeof r.value === 'number') expect(Number.isFinite(r.value), `${model.slug} live ${r.en}`).toBe(true);
        }
        expect(out.status?.en && out.status?.bn).toBeTruthy();
      });

      it('"Show me" gives a recordable reading for every task, and each task is ticked off', () => {
        const { rows, readiness } = collectRows(model);
        expect(readiness.every(Boolean), `${model.slug} readiness ${readiness}`).toBe(true);
        const done = tasksDone(rows);
        expect(done.size).toBe(model.tasks!.length);
      });

      it('recovers the accepted result from clean readings', () => {
        const { rows, params } = collectRows(model);
        const s = summarizeChemResult(model, rows, params);
        expect(s.value, `${model.slug} result`).not.toBeNull();
        if (model.result.absolute) expect(s.error!).toBeLessThanOrEqual(model.result.tolerance ?? 0.01);
        else expect(s.error!, `${model.slug}: got ${s.value}, expected ${s.expected}`).toBeLessThan(Math.min(3, model.result.goodWithin ?? 3));
        expect(s.good).toBe(true);
      });

      it('stays close with measurement noise', () => {
        const { rows, params } = collectRows(model, true);
        const s = summarizeChemResult(model, rows, params);
        expect(s.value).not.toBeNull();
        if (model.result.absolute) expect(s.good).toBe(true);
        else expect(s.error!, `${model.slug}: got ${s.value}, expected ${s.expected}`).toBeLessThan(8);
        for (const r of rows) for (const col of model.columns) if (isNumericColumn(model, col.key) && typeof r[col.key] === 'number') expect(Number.isFinite(r[col.key] as number)).toBe(true);
      });

      it('keeps "Show me" settings recordable after slider rounding', () => {
        const rows: ChemRow[] = [];
        const tasks = model.tasks ?? [];
        for (const task of tasks.slice(0, 3)) {
          const solved = model.solve ? model.solve({ ...defaultParams(model), ...task.set }, { rows }) : { ...defaultParams(model), ...task.set };
          const clamped: ChemParams = {};
          for (const c of model.controls) clamped[c.key] = clampToControl(c, solved[c.key] ?? c.default);
          const out = runChemPractical(model, clamped, { rows });
          expect(out.ready !== false, `${model.slug} ${task.en}`).toBe(true);
          rows.push(out.row);
        }
      });

      if (model.controls.some((c) => controlKind(c) === 'inference')) {
        it('scores a wrong conclusion as wrong', () => {
          const inf = model.controls.find((c) => controlKind(c) === 'inference')!;
          const task = model.tasks![0];
          const solved = model.solve!({ ...defaultParams(model), ...task.set }, { rows: [] });
          const wrong = inf.options!.find((o) => o.value >= 0 && o.value !== solved[inf.key])!;
          const out = runChemPractical(model, { ...solved, [inf.key]: wrong.value });
          expect(out.correct).toBe(false);
          expect(out.row.__correct).toBe(0);
          const undecided = runChemPractical(model, { ...solved, [inf.key]: -1 });
          expect(undecided.ready).toBe(false);
        });
      }
    });
  }
});
