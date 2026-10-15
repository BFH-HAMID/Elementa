import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { allChemPracticalModels, clampToControl, defaultParams, runChemPractical, type ChemParams, type ChemPracticalModel, type ChemRow } from '@/engine/chemPracticals';
import { chemScenes } from '@/components/lab/practicals/scenes';

/**
 * Every chemistry practical scene must render across its whole control range (and at
 * several moments of the animation clock) without NaN/Infinity/undefined coordinates
 * or negative sizes. Set `CHEM_SHEET=<dir>` to dump standalone SVGs for eyeballing.
 */
const SHEET = process.env.CHEM_SHEET;

function problems(markup: string): string[] {
  const issues: string[] = [];
  if (/NaN|Infinity|undefined/.test(markup)) issues.push((markup.match(/.{60}(NaN|Infinity|undefined).{20}/) || ['bad value'])[0]);
  for (const m of markup.matchAll(/\s(width|height|r|rx|ry)="(-[\d.e-]+)"/g)) issues.push(`${m[1]}=${m[2]}`);
  return issues;
}

function renderScene(model: ChemPracticalModel, params: ChemParams, rows: ChemRow[], t: number, bn = false) {
  const out = runChemPractical(model, params, { rows });
  const Scene = chemScenes[model.scene];
  return renderToStaticMarkup(<Scene model={model} view={out.view} params={params} setParam={() => undefined} t={t} bn={bn} />);
}

/** Settings worth drawing: defaults, every task (solved), and each control at both ends. */
function settings(model: ChemPracticalModel): ChemParams[] {
  const base = defaultParams(model);
  const list: ChemParams[] = [base];
  for (const task of model.tasks ?? []) list.push(model.solve ? model.solve({ ...base, ...task.set }, { rows: [] }) : { ...base, ...task.set });
  for (const c of model.controls) {
    const values = c.options ? c.options.map((o) => o.value) : [c.min ?? 0, c.max ?? 1, ((c.min ?? 0) + (c.max ?? 1)) / 2];
    for (const v of values) list.push({ ...base, [c.key]: clampToControl(c, v) });
  }
  return list;
}

function collect(model: ChemPracticalModel): ChemRow[] {
  const rows: ChemRow[] = [];
  for (const task of model.tasks ?? []) {
    const p = model.solve ? model.solve({ ...defaultParams(model), ...task.set }, { rows }) : { ...defaultParams(model), ...task.set };
    rows.push(runChemPractical(model, p, { rows }).row);
  }
  return rows;
}

describe('chemistry practical scenes', () => {
  if (SHEET) fs.mkdirSync(SHEET, { recursive: true });

  for (const model of allChemPracticalModels) {
    it(`${model.slug} renders cleanly across its controls`, () => {
      const rows = collect(model);
      for (const p of settings(model)) {
        for (const [t, withRows] of [
          [0, false],
          [0.37, true],
          [3.1, false],
          [12.9, true]
        ] as const) {
          const markup = renderScene(model, p, withRows ? rows : [], t);
          expect(problems(markup), `${model.slug} ${JSON.stringify(p)} t=${t}`).toEqual([]);
        }
      }
      // Bangla labels render too
      expect(problems(renderScene(model, defaultParams(model), rows, 1.5, true))).toEqual([]);
      if (SHEET) {
        const task = model.tasks?.[Math.min(2, (model.tasks?.length ?? 1) - 1)];
        const p = task && model.solve ? model.solve({ ...defaultParams(model), ...task.set }, { rows }) : defaultParams(model);
        const svg = renderScene(model, p, rows, 2.3).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" ');
        fs.writeFileSync(path.join(SHEET, `${model.slug}.svg`), svg);
        const svg0 = renderScene(model, defaultParams(model), [], 1.1, true).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" ');
        fs.writeFileSync(path.join(SHEET, `${model.slug}--start-bn.svg`), svg0);
      }
    });
  }
});
