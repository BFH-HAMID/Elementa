import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { allPracticalModels, defaultParams, runPractical, type PracticalModel, type PracticalParams } from '@/engine/practicals';
import { practicalScenes } from '../scenes';

function render(model: PracticalModel, params: PracticalParams, t: number, elapsed: number) {
  const out = runPractical(model, params, { elapsed });
  const Scene = practicalScenes[model.scene];
  return renderToStaticMarkup(<Scene model={model} view={out.view} params={params} setParam={() => {}} t={t} bn={false} />);
}

function badAttributes(svg: string): string[] {
  const issues: string[] = [];
  if (/NaN|Infinity|undefined/.test(svg)) issues.push((svg.match(/.{40}(NaN|Infinity|undefined).{20}/) || ['NaN'])[0]);
  for (const m of svg.matchAll(/\s(width|height|r|rx|ry)="(-[\d.e-]+)"/g)) issues.push(`${m[1]}=${m[2]}`);
  return issues;
}

describe('practical scenes render', () => {
  it('has a scene for every model', () => {
    for (const m of allPracticalModels) expect(practicalScenes[m.scene], m.slug).toBeTruthy();
  });

  for (const model of allPracticalModels) {
    it(`${model.slug} renders cleanly across its control range`, () => {
      const base = defaultParams(model);
      const variants: PracticalParams[] = [base];
      if (model.solve) variants.push(model.solve(base, { elapsed: 0, rows: [] }));
      for (const c of model.controls) {
        const values = c.options ? c.options.map((o) => o.value) : [c.min ?? c.default, c.max ?? c.default];
        for (const v of values) variants.push({ ...base, [c.key]: v });
      }
      for (const p of variants) {
        for (const [t, elapsed] of [
          [0, 0],
          [0.37, 2],
          [3.1, 40],
          [12.9, 600]
        ]) {
          const svg = render(model, p, t, elapsed);
          expect(svg).toContain('<svg');
          expect(badAttributes(svg), `${model.slug} ${JSON.stringify(p)} t=${t}`).toEqual([]);
        }
      }
    });
  }
});
