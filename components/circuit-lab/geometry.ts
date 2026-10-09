/**
 * Pure geometry helpers for the Circuit Lab bench: coordinate transforms,
 * rotation, snapping and wire path building. No React, no DOM — unit-testable.
 */

import { GRID, HOLE, type PinDef, type PlacedComponent, type PlacedWire, type WireEndpoint } from './types';

export interface Point {
  x: number;
  y: number;
}

export const GRID_SNAP = GRID;

/** Snap a world coordinate to the grid. */
export function snapToGrid(value: number, grid = GRID_SNAP): number {
  return Math.round(value / grid) * grid;
}

export function snapPoint(p: Point, grid = GRID_SNAP): Point {
  return { x: snapToGrid(p.x, grid), y: snapToGrid(p.y, grid) };
}

/**
 * Rotate a point around the origin by `rotation` degrees (clockwise, matching
 * the SVG y-down coordinate system) and scale x by `flip` (±1 for mirroring).
 */
export function transformPoint(
  p: Point,
  rotation: 0 | 90 | 180 | 270,
  flipH: boolean,
  w: number,
  h: number
): Point {
  let { x, y } = p;
  if (flipH) x = w - x;
  switch (rotation) {
    case 90:
      return { x: h - y, y: x };
    case 180:
      return { x: w - x, y: h - y };
    case 270:
      return { x: y, y: w - x };
    default:
      return { x, y };
  }
}

/** World position of a pin of a placed component. */
export function pinWorldPos(comp: PlacedComponent, def: { w: number; h: number; pins: PinDef[] }, pin: PinDef): Point {
  const local = transformPoint({ x: pin.x, y: pin.y }, comp.rotation, comp.flipH, def.w, def.h);
  return { x: comp.x + local.x, y: comp.y + local.y };
}

/** All pins of a placed component with their world positions. */
export function pinsWithWorldPos(comp: PlacedComponent, def: { w: number; h: number; pins: PinDef[] }) {
  return def.pins.map((pin) => ({ pin, pos: pinWorldPos(comp, def, pin) }));
}

/** Axis-aligned bounding box of a placed component (pins included). */
export function componentBounds(comp: PlacedComponent, def: { w: number; h: number; pins: PinDef[] }) {
  const pts = pinsWithWorldPos(comp, def).map((p) => p.pos);
  pts.push({ x: comp.x, y: comp.y });
  const rotatedW = comp.rotation % 180 === 0 ? def.w : def.h;
  const rotatedH = comp.rotation % 180 === 0 ? def.h : def.w;
  pts.push({ x: comp.x + rotatedW, y: comp.y + rotatedH });
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys)
  };
}

/** Bounding box of the whole bench content (components + wires). */
export function benchBounds(
  components: PlacedComponent[],
  wires: PlacedWire[],
  defs: Map<string, { w: number; h: number; pins: PinDef[] }>
): { x: number; y: number; w: number; h: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const comp of components) {
    const def = defs.get(comp.partId);
    if (!def) continue;
    const b = componentBounds(comp, def);
    xs.push(b.x, b.x + b.w);
    ys.push(b.y, b.y + b.h);
  }
  for (const wire of wires) {
    for (const wp of wire.waypoints) {
      xs.push(wp.x);
      ys.push(wp.y);
    }
  }
  if (xs.length === 0) return { x: 0, y: 0, w: 100, h: 100 };
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Distance between two points. */
export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ── Wire paths ──────────────────────────────────────────────────────────────

/**
 * Build the SVG path `d` for a wire. With no waypoints the wire is a smooth
 * jumper-wire arc; with waypoints it is a rounded polyline through them.
 */
export function wirePath(from: Point, to: Point, waypoints: Point[]): string {
  const pts = [from, ...waypoints, to];
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    // Single smooth arc, like a real jumper wire.
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const d = Math.hypot(dx, dy);
    const lift = Math.max(18, d * 0.28);
    // Perpendicular direction of the chord.
    const nx = -dy / (d || 1);
    const ny = dx / (d || 1);
    const cx = (from.x + to.x) / 2 + nx * lift;
    const cy = (from.y + to.y) / 2 + ny * lift;
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  }
  // Rounded polyline through waypoints.
  let d = `M ${pts[0].x} ${pts[0].y}`;
  const r = Math.min(10, dist(pts[0], pts[1]) / 2);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const d1 = dist(a, b);
    const d2 = dist(b, c);
    const rr = Math.min(10, d1 / 2, d2 / 2);
    const p1 = { x: b.x + ((a.x - b.x) / d1) * rr, y: b.y + ((a.y - b.y) / d1) * rr };
    const p2 = { x: b.x + ((c.x - b.x) / d2) * rr, y: b.y + ((c.y - b.y) / d2) * rr };
    d += ` L ${p1.x} ${p1.y} Q ${b.x} ${b.y} ${p2.x} ${p2.y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

/** Point on a quadratic bezier (used for waypoint hit-testing & flow dashes). */
export function quadPoint(p0: Point, c: Point, p1: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y
  };
}

/** Split a wire path into segments (quad bezier or line) for length/hit tests. */
export function wireSegments(from: Point, to: Point, waypoints: Point[]): { a: Point; b: Point; c?: Point }[] {
  const pts = [from, ...waypoints, to];
  if (pts.length === 2) {
    const d = dist(from, to);
    const lift = Math.max(18, d * 0.28);
    const nx = -(to.y - from.y) / (d || 1);
    const ny = (to.x - from.x) / (d || 1);
    return [{ a: from, c: { x: (from.x + to.x) / 2 + nx * lift, y: (from.y + to.y) / 2 + ny * lift }, b: to }];
  }
  const segs: { a: Point; b: Point; c?: Point }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (i === 0 || i === pts.length - 2) {
      // End segments are straight lines into the corner rounding; approximate
      // with a line for hit-testing purposes.
      segs.push({ a, b });
    } else {
      segs.push({ a, b });
    }
  }
  return segs;
}

/** Approximate length of a wire path. */
export function wireLength(from: Point, to: Point, waypoints: Point[]): number {
  const pts = [from, ...waypoints, to];
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) len += dist(pts[i], pts[i + 1]);
  if (pts.length === 2) {
    // quadratic arc is a bit longer than the chord
    len *= 1.15;
  }
  return len;
}

/** Distance from point p to a segment (quad bezier sampled). */
export function distToWire(p: Point, from: Point, to: Point, waypoints: Point[]): number {
  let best = Infinity;
  const segs = wireSegments(from, to, waypoints);
  for (const seg of segs) {
    if (seg.c) {
      for (let t = 0; t <= 1; t += 0.05) {
        best = Math.min(best, dist(p, quadPoint(seg.a, seg.c, seg.b, t)));
      }
    } else {
      best = Math.min(best, distToSegment(p, seg.a, seg.b));
    }
  }
  return best;
}

export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Midpoint-ish point of a wire (for labels / waypoint insertion). */
export function wireMidpoint(from: Point, to: Point, waypoints: Point[]): Point {
  if (waypoints.length > 0) return waypoints[Math.floor(waypoints.length / 2)];
  const seg = wireSegments(from, to, waypoints)[0];
  return seg.c ? quadPoint(seg.a, seg.c, seg.b, 0.5) : { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

// ── Viewport ────────────────────────────────────────────────────────────────

export interface Viewport {
  x: number; // world coordinate at the viewport's top-left
  y: number;
  zoom: number; // 1 = 100%
}

export function screenToWorld(vp: Viewport, sx: number, sy: number): Point {
  return { x: vp.x + sx / vp.zoom, y: vp.y + sy / vp.zoom };
}

export function worldToScreen(vp: Viewport, wx: number, wy: number): Point {
  return { x: (wx - vp.x) * vp.zoom, y: (wy - vp.y) * vp.zoom };
}

/** Zoom around a fixed screen point (mouse cursor / pinch center). */
export function zoomAt(vp: Viewport, sx: number, sy: number, factor: number): Viewport {
  const zoom = Math.min(4, Math.max(0.15, vp.zoom * factor));
  const anchor = screenToWorld(vp, sx, sy);
  return { zoom, x: anchor.x - sx / zoom, y: anchor.y - sy / zoom };
}

/** Keep the pan within a generous margin around the origin. */
export function clampViewport(vp: Viewport): Viewport {
  const zoom = Math.min(4, Math.max(0.15, vp.zoom));
  const lim = 4000;
  return {
    zoom,
    x: Math.min(Math.max(vp.x, -lim), lim),
    y: Math.min(Math.max(vp.y, -lim), lim)
  };
}

// ── Endpoints ───────────────────────────────────────────────────────────────

export function endpointKey(ep: WireEndpoint): string {
  return `${ep.compId}:${ep.pinId}`;
}

export function sameEndpoint(a: WireEndpoint | null, b: WireEndpoint | null): boolean {
  if (!a || !b) return false;
  return a.compId === b.compId && a.pinId === b.pinId;
}

/** A free (dangling) wire end renders at this point until attached. */
export const FREE_END_POS = { x: 0, y: 0 };

export function wireEndpoints(
  wire: PlacedWire,
  pinPos: (ep: WireEndpoint) => Point | null,
  fallback: (which: 'from' | 'to') => Point
): { from: Point; to: Point } {
  const from = wire.from ? pinPos(wire.from) ?? fallback('from') : fallback('from');
  const to = wire.to ? pinPos(wire.to) ?? fallback('to') : fallback('to');
  return { from, to };
}

export { HOLE };
