import type { BenchItem, CircuitWire, EquipmentDef, EquipmentTerminal } from '@/engine/physicsTypes';
import { equipmentById } from '@/lib/physicsData';

/**
 * Geometry helpers for the free-form physics workbench.
 *
 * Every tool on the bench exposes "ports". Electrical apparatus use the
 * terminals declared in `data/equipment.json`; every other tool (lenses,
 * pendulums, thermometers …) gets two generic *link* ports on its left and
 * right edges, so any tool can be connected to any other tool. Link
 * connections are drawn as dashed clamps/strings and are ignored by the
 * circuit solver.
 */

export const LINK_PREFIX = 'link';

export const GRID_SIZE = 8;
export const MIN_WORLD_WIDTH = 960;
export const MIN_WORLD_HEIGHT = 560;
export const MAX_COORD = 2600;

const LINK_PORTS: EquipmentTerminal[] = [
  { id: 'linkL', name: '⟷', name_bn: '⟷', polarity: 'none', x: 0, y: 50 },
  { id: 'linkR', name: '⟷', name_bn: '⟷', polarity: 'none', x: 100, y: 50 }
];

export function isLinkPort(terminalId: string): boolean {
  return terminalId.startsWith(LINK_PREFIX);
}

export function isLinkWire(wire: Pick<CircuitWire, 'fromTerminalId' | 'toTerminalId' | 'kind'>): boolean {
  return wire.kind === 'link' || isLinkPort(wire.fromTerminalId) || isLinkPort(wire.toTerminalId);
}

export function getItemSize(def: EquipmentDef | undefined): { w: number; h: number } {
  return { w: def?.width || 120, h: def?.height || 80 };
}

/** Ports of a tool: its electrical terminals, or generic link ports if it has none. */
export function getPorts(def: EquipmentDef | undefined): EquipmentTerminal[] {
  if (!def) return [];
  if (def.terminals && def.terminals.length > 0) return def.terminals;
  return LINK_PORTS;
}

export function findPort(def: EquipmentDef | undefined, terminalId: string): EquipmentTerminal | undefined {
  return getPorts(def).find((port) => port.id === terminalId);
}

/** Absolute world position of a port, taking the item's rotation (about its centre) into account. */
export function portPosition(item: BenchItem, terminalId: string): { x: number; y: number } | null {
  const def = equipmentById.get(item.equipmentId);
  const port = findPort(def, terminalId);
  if (!def || !port) return null;
  const { w, h } = getItemSize(def);
  const tx = (port.x / 100) * w;
  const ty = (port.y / 100) * h;
  const cx = w / 2;
  const cy = h / 2;
  const rad = ((item.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: item.x + cx + (tx - cx) * cos - (ty - cy) * sin,
    y: item.y + cy + (tx - cx) * sin + (ty - cy) * cos
  };
}

/** Axis-aligned bounding box of an item after rotation. */
export function itemBounds(item: BenchItem): { x: number; y: number; w: number; h: number } {
  const { w, h } = getItemSize(equipmentById.get(item.equipmentId));
  const quarter = Math.round(((item.rotation || 0) % 180) / 90) === 1;
  if (!quarter) return { x: item.x, y: item.y, w, h };
  return { x: item.x + w / 2 - h / 2, y: item.y + h / 2 - w / 2, w: h, h: w };
}

export function worldSize(items: BenchItem[]): { width: number; height: number } {
  let width = MIN_WORLD_WIDTH;
  let height = MIN_WORLD_HEIGHT;
  for (const item of items) {
    const b = itemBounds(item);
    width = Math.max(width, b.x + b.w + 120);
    height = Math.max(height, b.y + b.h + 120);
  }
  return { width: Math.ceil(width), height: Math.ceil(height) };
}

export function snap(value: number, enabled = true): number {
  return enabled ? Math.round(value / GRID_SIZE) * GRID_SIZE : Math.round(value);
}

export interface PortRef {
  itemId: string;
  terminalId: string;
}

/**
 * Finds the best port to connect to near a world point: the nearest port
 * within `radius`, otherwise the nearest port of the item under the point.
 */
export function findPortNear(
  items: BenchItem[],
  point: { x: number; y: number },
  exclude: PortRef | null,
  radius = 26
): PortRef | null {
  let best: PortRef | null = null;
  let bestDist = radius;
  for (const item of items) {
    for (const port of getPorts(equipmentById.get(item.equipmentId))) {
      if (exclude && exclude.itemId === item.id && exclude.terminalId === port.id) continue;
      const pos = portPosition(item, port.id);
      if (!pos) continue;
      const d = Math.hypot(pos.x - point.x, pos.y - point.y);
      if (d < bestDist) {
        bestDist = d;
        best = { itemId: item.id, terminalId: port.id };
      }
    }
  }
  if (best) return best;

  // Dropped on a tool's body: connect to the closest free-ish port on that tool.
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (exclude && exclude.itemId === item.id) continue;
    const b = itemBounds(item);
    if (point.x < b.x || point.x > b.x + b.w || point.y < b.y || point.y > b.y + b.h) continue;
    return nearestPortOfItem(item, point, exclude);
  }
  return null;
}

export function nearestPortOfItem(item: BenchItem, point: { x: number; y: number }, exclude: PortRef | null = null): PortRef | null {
  let best: PortRef | null = null;
  let bestDist = Infinity;
  for (const port of getPorts(equipmentById.get(item.equipmentId))) {
    if (exclude && exclude.itemId === item.id && exclude.terminalId === port.id) continue;
    const pos = portPosition(item, port.id);
    if (!pos) continue;
    const d = Math.hypot(pos.x - point.x, pos.y - point.y);
    if (d < bestDist) {
      bestDist = d;
      best = { itemId: item.id, terminalId: port.id };
    }
  }
  return best;
}

/** Cubic bezier path with a gentle cable droop, plus its midpoint. */
export function wirePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const sag = Math.min(60, dist * 0.18);
  const c1 = { x: from.x + dx * 0.3, y: from.y + dy * 0.3 + sag };
  const c2 = { x: from.x + dx * 0.7, y: from.y + dy * 0.7 + sag };
  const mid = {
    x: 0.125 * from.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * to.x,
    y: 0.125 * from.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * to.y
  };
  return {
    d: `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`,
    mid
  };
}

/** Finds a free spot for a new tool so additions never pile up on top of each other. */
export function findFreeSpot(items: BenchItem[], def: EquipmentDef | undefined, maxWidth = 900): { x: number; y: number } {
  const { w, h } = getItemSize(def);
  const margin = 24;
  const boxes = items.map(itemBounds);
  for (let y = 40; y < MAX_COORD; y += 40) {
    for (let x = 40; x + w <= Math.max(maxWidth, w + 80); x += 40) {
      const clash = boxes.some(
        (b) => x < b.x + b.w + margin && x + w + margin > b.x && y < b.y + b.h + margin && y + h + margin > b.y
      );
      if (!clash) return { x, y };
    }
  }
  return { x: 40, y: 40 };
}

/* ── Shelf → bench drag bridge ──────────────────────────────────────────────
 * The shelf and the workbench are sibling components. The shelf uses pointer
 * events (so touch screens work too) and asks the bench, through this tiny
 * bridge, whether a point is over it and to drop a tool there.
 */
interface BenchDropTarget {
  hover: (clientX: number, clientY: number, equipmentId: string | null) => boolean;
  drop: (equipmentId: string, clientX: number, clientY: number) => boolean;
}

let benchTarget: BenchDropTarget | null = null;

export function registerBenchDropTarget(target: BenchDropTarget | null) {
  benchTarget = target;
}

export function hoverBench(clientX: number, clientY: number, equipmentId: string | null): boolean {
  return benchTarget ? benchTarget.hover(clientX, clientY, equipmentId) : false;
}

export function dropOnBench(equipmentId: string, clientX: number, clientY: number): boolean {
  return benchTarget ? benchTarget.drop(equipmentId, clientX, clientY) : false;
}
