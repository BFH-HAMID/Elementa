import { describe, expect, it } from 'vitest';
import {
  blendColors,
  composeLiquidColor,
  darken,
  hexToRgb,
  lighten,
  luminance,
  mixColors,
  readableOn,
  rgbToHex,
  withAlpha
} from '../colorMixer';
import { makePortion } from '../reactionEngine';
import { chemicalsById, chemical, makeVessel } from './helpers';

describe('hex helpers', () => {
  it('round-trips a hex colour', () => {
    expect(rgbToHex(hexToRgb('#2f7fd6'))).toBe('#2f7fd6');
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('produces rgba strings and readable text colours', () => {
    expect(withAlpha('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.500)');
    expect(readableOn('#ffffff')).toBe('#14283d');
    expect(readableOn('#14283d')).toBe('#f7fbff');
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('lightens and darkens', () => {
    expect(lighten('#808080', 1)).toBe('#ffffff');
    expect(darken('#808080', 1)).toBe('#000000');
    expect(blendColors('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('mixColors', () => {
  it('falls back when there is nothing to mix', () => {
    expect(mixColors([], '#e7f2fb')).toBe('#e7f2fb');
    expect(mixColors([{ color: '#fff', weight: 0 }], '#123456')).toBe('#123456');
  });

  it('ignores malformed colours', () => {
    expect(mixColors([{ color: 'not-a-colour', weight: 5 }], '#abcdef')).toBe('#abcdef');
  });

  it('weights by volume', () => {
    const mostly = mixColors([
      { color: '#ffffff', weight: 90 },
      { color: '#000000', weight: 10 }
    ]);
    const half = mixColors([
      { color: '#ffffff', weight: 50 },
      { color: '#000000', weight: 50 }
    ]);
    expect(luminance(mostly)).toBeGreaterThan(luminance(half));
  });

  it('returns a single sample unchanged', () => {
    expect(mixColors([{ color: '#7a2fa8', weight: 3 }])).toBe('#7a2fa8');
  });
});

describe('composeLiquidColor', () => {
  it('keeps water pale and copper sulphate blue', () => {
    const water = composeLiquidColor([makePortion(chemical('H2O'), 20)], [], chemicalsById);
    const copper = composeLiquidColor([makePortion(chemical('CuSO4'), 20)], [], chemicalsById);
    expect(luminance(water.color)).toBeGreaterThan(luminance(copper.color));
    expect(copper.totalMl).toBe(20);
  });

  it('does not let a metal chunk tint the liquid', () => {
    const vessel = makeVessel([{ id: 'CuSO4', mL: 20 }]);
    vessel.portions.push(makePortion(chemical('Fe'), 2));
    const composed = composeLiquidColor(vessel.portions, vessel.sediment, chemicalsById);
    const withoutIron = composeLiquidColor([makePortion(chemical('CuSO4'), 20)], [], chemicalsById);
    expect(composed.color).toBe(withoutIron.color);
  });

  it('lets an explicit reaction colour win', () => {
    const composed = composeLiquidColor([makePortion(chemical('CuSO4'), 20)], [], chemicalsById, { override: '#9fc9ae' });
    expect(composed.color).toBe('#9fc9ae');
  });

  it('turns turbid while a precipitate is still suspended', () => {
    const clear = composeLiquidColor([makePortion(chemical('NaCl'), 20)], [], chemicalsById);
    const cloudy = composeLiquidColor(
      [makePortion(chemical('NaCl'), 20)],
      [{ chemicalId: 'AgCl', mL: 1, moles: 0.007, color: '#f7f8f9' }],
      chemicalsById,
      { turbidity: 1 }
    );
    expect(cloudy.sedimentColor).toBe('#f7f8f9');
    expect(cloudy.color).not.toBe(clear.color);
  });
});
