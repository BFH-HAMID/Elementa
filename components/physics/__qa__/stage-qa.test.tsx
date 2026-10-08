import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NextIntlClientProvider } from 'next-intl';
import { InstrumentDefs } from '@/components/physics/Equipment/art/materials';
import { MechanicsStage, type MechanicsTab } from '@/components/physics/MechanicsStage';
import { OpticsBench, type OpticsMode } from '@/components/physics/OpticsBench';
import { allPracticalModels, defaultParams, runPractical, type PracticalSceneId } from '@/engine/practicals';
import { practicalScenes } from '@/components/physics/practicals/scenes';

/**
 * Regression guard for the three physics-bench surfaces (mechanics stage, optics
 * bench, practical stations): every scene must render across its control range
 * without blowing up into NaN/Infinity/undefined coordinates.
 *
 * Set `STAGE_SHEET=<dir>` to also dump the scenes as standalone SVG files, which
 * is how the artwork gets eyeballed (rasterise with sharp/librsvg).
 */
const SHEET = process.env.STAGE_SHEET;

function render(node: React.ReactElement) {
  return renderToStaticMarkup(<NextIntlClientProvider locale="en" messages={{}}>{node}</NextIntlClientProvider>);
}

function problems(markup: string): string[] {
  const issues: string[] = [];
  if (/NaN|Infinity|undefined/.test(markup)) issues.push((markup.match(/.{40}(NaN|Infinity|undefined).{20}/) || ['bad value'])[0]);
  for (const m of markup.matchAll(/\s(width|height|r|rx|ry)="(-[\d.e-]+)"/g)) issues.push(`${m[1]}=${m[2]}`);
  return issues;
}

function extractSvg(html: string, viewBox: string): string {
  const start = html.indexOf(`viewBox="${viewBox}"`);
  if (start < 0) throw new Error('no svg ' + viewBox);
  const open = html.lastIndexOf('<svg', start);
  const close = html.indexOf('</svg>', start);
  return html.slice(open, close + 6);
}

/** Wrap a scene in a standalone SVG with the shared paint servers inlined. */
function standalone(inner: string) {
  const defs = renderToStaticMarkup(<InstrumentDefs />)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
  const body = inner.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const vb = inner.match(/viewBox="([^"]+)"/)![1];
  // theme variables so the scenes look in QA exactly as they do on the page
  const theme = '--surface:#ffffff;--surface-soft:#f1f6fb;--ink:#14283d;--muted:#59718e;--line:#dbe6f0';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="${vb}" style="${theme}"><defs>${defs}</defs><rect width="100%" height="100%" fill="#eef3f8" />${body}</svg>`;
}

describe('physics bench scenes', () => {
  const tabs: MechanicsTab[] = ['pendulum', 'spring', 'incline', 'projectile', 'atwood'];
  const modes: OpticsMode[] = ['lens', 'mirror', 'prism', 'interference'];

  for (const tab of tabs) {
    it(`mechanics stage renders “${tab}” cleanly`, () => {
      const html = render(<MechanicsStage initialTab={tab} />);
      expect(problems(html)).toEqual([]);
      if (SHEET) {
        fs.mkdirSync(SHEET, { recursive: true });
        fs.writeFileSync(path.join(SHEET, `mech-${tab}.svg`), standalone(extractSvg(html, '0 0 800 360')));
      }
    });
  }

  for (const mode of modes) {
    it(`optics bench renders “${mode}” cleanly`, () => {
      const html = render(<OpticsBench initialMode={mode} />);
      expect(problems(html)).toEqual([]);
      if (SHEET) {
        fs.mkdirSync(SHEET, { recursive: true });
        fs.writeFileSync(path.join(SHEET, `optics-${mode}.svg`), standalone(extractSvg(html, '0 0 920 320')));
      }
    });
  }

  it('renders one representative scene for each practical station', () => {
    const seen = new Set<string>();
    const dir = SHEET ?? path.join(os.tmpdir(), 'elementa-stage-qa');
    for (const model of allPracticalModels) {
      if (seen.has(model.scene)) continue;
      seen.add(model.scene);
      const params = defaultParams(model);
      const out = runPractical(model, params, { elapsed: 2 });
      const Scene = practicalScenes[model.scene as PracticalSceneId];
      for (const t of [0, 0.37, 3.1]) {
        const html = render(<Scene model={model} view={out.view} params={params} setParam={() => {}} t={t} bn={false} />);
        expect(problems(html), `${model.scene} t=${t}`).toEqual([]);
        if (SHEET && t === 0.37) fs.writeFileSync(path.join(dir, `prac-${model.scene}.svg`), standalone(html));
      }
    }
    expect(seen.size).toBeGreaterThan(10);
  });
});
