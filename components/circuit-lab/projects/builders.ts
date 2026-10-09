/**
 * Small builders shared by the example project catalogues. Kept in their own
 * module so each catalogue file can import them without a circular dependency
 * on `examples.ts`.
 */

import { getPart } from '../parts/registry';
import type { PlacedComponent, PlacedWire, WireColor, PropValue } from '../types';

/** Place a part with its registry defaults overridden by `props`. */
export function C(id: string, partId: string, x: number, y: number, props: Record<string, PropValue> = {}, code?: string): PlacedComponent {
  const def = getPart(partId);
  if (!def) throw new Error(`Unknown part ${partId}`);
  return { id, partId, x, y, rotation: 0, flipH: false, props: { ...def.defaults, ...props }, state: {}, ...(code ? { code } : {}) };
}

/** Wire between two "partId.pinId" endpoints. */
export function W(id: string, from: string, to: string, color: WireColor = 'blue'): PlacedWire {
  const [fc, fp] = from.split('.');
  const [tc, tp] = to.split('.');
  return { id, from: { compId: fc, pinId: fp }, to: { compId: tc, pinId: tp }, color, waypoints: [] };
}
