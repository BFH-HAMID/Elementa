/**
 * Snapping helpers: grid snapping of positions, and hole snapping that aligns a
 * part's pins with breadboard / perfboard holes so they are electrically inserted.
 */

import { getPart } from '../parts/registry';
import { holeGroupKey } from '../parts/holes';
import { pinWorldPos, snapToGrid, type Point } from '../geometry';
import { HOLE, type PlacedComponent } from '../types';

/** Pins within this distance (world units) of a hole snap into it. */
export const HOLE_SNAP_RADIUS = 6;

/** World positions of every hole on the bench (breadboards, perfboards, stripboards). */
export function collectHoles(components: PlacedComponent[]): Point[] {
  const out: Point[] = [];
  for (const comp of components) {
    const def = getPart(comp.partId);
    if (!def || def.model.type !== 'prototyping') continue;
    for (const pin of def.pins) {
      if (holeGroupKey(pin.id) === null) continue;
      out.push(pinWorldPos(comp, def, pin));
    }
  }
  return out;
}

/**
 * Offset that moves `comp` so one of its pins lands on the nearest hole, if any
 * pin is within HOLE_SNAP_RADIUS. Prototyping parts never snap themselves.
 */
export function holeSnapOffset(comp: PlacedComponent, holes: Point[]): Point | null {
  const def = getPart(comp.partId);
  if (!def || def.model.type === 'prototyping' || holes.length === 0) return null;
  let best: { d: number; off: Point } | null = null;
  for (const pin of def.pins) {
    const p = pinWorldPos(comp, def, pin);
    for (const h of holes) {
      const dx = h.x - p.x;
      const dy = h.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d <= HOLE_SNAP_RADIUS && (!best || d < best.d)) best = { d, off: { x: dx, y: dy } };
    }
  }
  return best ? best.off : null;
}

/** Snap a whole selection: grid first, then holes (holes win when both apply). */
export function snapPositions(
  comps: PlacedComponent[],
  grid: boolean,
  holeSnap: boolean
): Record<string, { x: number; y: number }> {
  const holes = holeSnap ? collectHoles(comps) : [];
  const out: Record<string, { x: number; y: number }> = {};
  for (const c of comps) {
    let x = grid ? snapToGrid(c.x) : c.x;
    let y = grid ? snapToGrid(c.y) : c.y;
    const off = holeSnapOffset({ ...c, x, y }, holes);
    if (off) {
      x += off.x;
      y += off.y;
    }
    out[c.id] = { x, y };
  }
  return out;
}

export { HOLE };
