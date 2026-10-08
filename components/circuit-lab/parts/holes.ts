/**
 * Prototyping-surface hole generators and their internal connectivity.
 *
 * Holes are ordinary pins with ids that encode their electrical group, so the
 * solver can union-find them exactly like component pins:
 *   breadboard:  h{col}{row}      row a–e → group c{col}-ae,  f–j → c{col}-fj
 *                rail pins r+{n}  → rail+ (continuous along the board)
 *                rail pins r-{n}  → rail- (continuous)
 *   stripboard:  s{row}_{col}     → strip row {row} (copper strip, continuous)
 *   perfboard:   p{row}_{col}     → isolated pad (its own group)
 */

import type { PinDef } from '../types';

export const BB_COL_PITCH = 10;
const BB_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/** Breadboard hole layout in part-local coordinates. */
export function breadboardPins(cols: number): PinDef[] {
  const pins: PinDef[] = [];
  const left = 20; // x of column 1
  // Top power rails (+ then −), bottom power rails (+ then −).
  const railX = (n: number) => left + (n - 1) * BB_COL_PITCH;
  for (let n = 1; n <= cols; n++) {
    pins.push({ id: `r+${n}`, label: `+${n}`, x: railX(n), y: 10, kind: 'vcc', func: 'Rail + (power)' });
    pins.push({ id: `r-${n}`, label: `−${n}`, x: railX(n), y: 20, kind: 'gnd', func: 'Rail − (ground)' });
  }
  const bodyTop = 50;
  for (let c = 1; c <= cols; c++) {
    for (let r = 0; r < BB_ROWS.length; r++) {
      // gap between row e and f (centre channel for DIP ICs)
      const gap = r >= 5 ? 20 : 0;
      pins.push({
        id: `h${c}${BB_ROWS[r]}`,
        label: `${c}${BB_ROWS[r].toUpperCase()}`,
        x: railX(c),
        y: bodyTop + r * BB_COL_PITCH + gap,
        kind: 'io',
        func: `Hole ${c}${BB_ROWS[r].toUpperCase()}`
      });
    }
  }
  const bottom = bodyTop + 10 * BB_COL_PITCH + 20 + 10;
  for (let n = 1; n <= cols; n++) {
    pins.push({ id: `r+${n}b`, label: `+${n}`, x: railX(n), y: bottom, kind: 'vcc', func: 'Rail + (power)' });
    pins.push({ id: `r-${n}b`, label: `−${n}`, x: railX(n), y: bottom + 10, kind: 'gnd', func: 'Rail − (ground)' });
  }
  return pins;
}

export function breadboardSize(cols: number) {
  return { w: 20 + cols * BB_COL_PITCH + 10, h: 50 + 10 * 10 + 20 + 40 + 10 };
}

/** Stripboard / perfboard grid: rows × cols pads on 10-unit pitch. */
export function gridPins(rows: number, cols: number, prefix: 'p' | 's'): PinDef[] {
  const pins: PinDef[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pins.push({
        id: `${prefix}${r}_${c}`,
        label: `${String.fromCharCode(65 + (r % 26))}${c + 1}`,
        x: 10 + c * 10,
        y: 10 + r * 10,
        kind: 'io',
        func: prefix === 's' ? `Strip row ${r + 1}` : `Pad ${r + 1},${c + 1}`
      });
    }
  }
  return pins;
}

/**
 * Electrical group key for any hole id. Non-hole pins return null so the
 * solver treats them as their own node.
 */
export function holeGroupKey(pinId: string): string | null {
  let m = /^h(\d+)([a-e])$/.exec(pinId);
  if (m) return `bb-c${m[1]}-ae`;
  m = /^h(\d+)([f-j])$/.exec(pinId);
  if (m) return `bb-c${m[1]}-fj`;
  m = /^r([+-])(\d+)b?$/.exec(pinId);
  if (m) return `bb-rail${m[1] === '+' ? 'P' : 'N'}${pinId.endsWith('b') ? 'B' : 'T'}`;
  m = /^s(\d+)_\d+$/.exec(pinId);
  if (m) return `strip-${m[1]}`;
  m = /^p\d+_\d+$/.exec(pinId);
  if (m) return `pad-${pinId}`;
  return null;
}

export function isHolePin(pinId: string): boolean {
  return holeGroupKey(pinId) !== null;
}
