import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import equipment from '../../../../../data/equipment.json';
import { EQUIPMENT_ART } from '../index';
import { InstrumentDefs } from '../materials';
import type { ArtCtx } from '../parts';

const defs = equipment.equipment as unknown as Array<{
  id: string;
  name_en: string;
  name_bn: string;
  defaultProperties: Record<string, number | boolean | string>;
}>;

const baseCtx: ArtCtx = { p: {}, bn: false, live: false, detailed: true };

/** Nothing may leak NaN/Infinity into an SVG attribute. */
function badAttributes(svg: string): string[] {
  const issues: string[] = [];
  if (/NaN|Infinity|undefined/.test(svg)) issues.push((svg.match(/.{40}(NaN|Infinity|undefined).{25}/) || ['NaN'])[0]);
  return issues;
}

describe('instrument artwork', () => {
  it('draws every tool in data/equipment.json', () => {
    const missing = defs.filter((d) => !EQUIPMENT_ART[d.id]).map((d) => d.id);
    expect(missing).toEqual([]);
  });

  for (const def of defs) {
    it(`${def.id} renders cleanly in every state`, () => {
      const entry = EQUIPMENT_ART[def.id];
      const variants: ArtCtx[] = [
        { ...baseCtx, p: def.defaultProperties, bn: true, live: true },
        { ...baseCtx, p: def.defaultProperties, bn: false, live: false },
        { ...baseCtx, p: {}, bn: false, live: true, detailed: false },
        // an over-driven tool: burned out, an off-scale solver reading
        {
          ...baseCtx,
          p: { ...def.defaultProperties, closed: true, lit: true, on: false, sliderPosition: 88, riderPositionMg: 7 },
          burned: true,
          live: true,
          res: { itemId: 'x', voltageDrop: 12, current: 3.5, power: 42, burnedOut: true, deflection: 28, displayReading: 12.5, displayUnit: 'V', polarityError: true }
        }
      ];
      for (const ctx of variants) {
        const svg = renderToStaticMarkup(
          <svg viewBox={entry.vb} xmlns="http://www.w3.org/2000/svg">
            <entry.Comp {...ctx} />
          </svg>
        );
        expect(svg).toContain('<svg');
        expect(badAttributes(svg), `${def.id} ${JSON.stringify(ctx.p)}`).toEqual([]);
      }
    });
  }
});

/**
 * Visual QA hook: `ART_SHEET=/some/dir npx vitest run art` writes a contact
 * sheet of every instrument so the artwork can be eyeballed as a whole.
 */
describe('artwork contact sheet', () => {
  it('can dump every instrument side by side', () => {
    const dir = process.env.ART_SHEET;
    if (!dir) return;
    const cols = 7;
    const cellW = 190;
    const cellH = 150;
    const rows = Math.ceil(defs.length / cols);
    const width = cols * cellW;
    const height = rows * cellH + 30;
    const defsMarkup = renderToStaticMarkup(<InstrumentDefs />).replace(/^<svg[^>]*>|<\/svg>$/g, '');
    const cells = defs
      .map((def, i) => {
        const entry = EQUIPMENT_ART[def.id];
        const cx = (i % cols) * cellW;
        const cy = Math.floor(i / cols) * cellH + 26;
        const body = renderToStaticMarkup(<entry.Comp {...baseCtx} p={def.defaultProperties} bn={false} live={false} detailed />);
        return `<g transform="translate(${cx} ${cy})">
          <rect x="4" y="0" width="${cellW - 10}" height="${cellH - 12}" rx="8" fill="#ffffff" stroke="#dbe6f0" />
          <text x="10" y="12" font-size="10" font-weight="700" fill="#334155" font-family="Arial">${def.id}</text>
          <svg x="8" y="16" width="${cellW - 26}" height="${cellH - 40}" viewBox="${entry.vb}">${body}</svg>
        </g>`;
      })
      .join('\n');
    const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${defsMarkup}
      <rect width="${width}" height="${height}" fill="#e8eef4" />
      ${cells}
    </svg>`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'art-sheet.svg'), sheet);
    expect(sheet).toContain('<svg');
  });
});
