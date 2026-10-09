/**
 * Schematic layout: converts the bench into netlist-style schematic symbols.
 *
 * Wires are not drawn. Every pin that is wired carries a *net label* (the name
 * from `resolveNets`), and pins that share a name are electrically connected —
 * the usual convention for net-labelled schematics. Because the layout is
 * derived from the same netlist as the simulator, the schematic is always in
 * sync with the bench: wiring, values and live voltages update automatically.
 *
 * Pure functions only (no DOM, no React) so the layout can be unit-tested.
 * Coordinates are in schematic units (≈ px at 100 %). Each item's geometry is
 * normalised so its top-left corner is (0, 0).
 */

import { getPart } from '../parts/registry';
import { formatSI } from '../parts/renderers';
import { isElectricalPart, resolveNets, type NetInfo, type ResolvedNets } from '../lib/nets';
import type { PartCategory, PartDef, PlacedComponent, PlacedWire, PropValue, SimModel } from '../types';

export type SymbolKind = 'two' | 'ground' | 'box';

export interface SchemPin {
  id: string;
  label: string;
  func: string;
  /** Pin tip (where a wire would attach), item-local. */
  x: number;
  y: number;
  /** Which side the stub leaves the symbol on. */
  side: 'left' | 'right' | 'top';
  net: NetInfo | null;
  /** Net label anchor, item-local. */
  netX: number;
  netY: number;
  netAnchor: 'start' | 'end' | 'middle';
  /** Pin-name anchor for two-terminal symbols (above the stub). */
  labelX: number;
  labelY: number;
}

export interface SchemItem {
  compId: string;
  partId: string;
  category: PartCategory;
  name: string;
  partNumber: string;
  value: string;
  kind: SymbolKind;
  model: SimModel['type'];
  /** AC source (sine glyph) and polarised capacitor (curved plate) variants. */
  ac: boolean;
  polarized: boolean;
  /** Top-left of the item in layout space. */
  x: number;
  y: number;
  w: number;
  h: number;
  pins: SchemPin[];
  /** Title line (name) and part number, item-local. */
  titleX: number;
  titleY: number;
  partY: number;
  valueX: number;
  valueY: number;
  /** Symbol geometry: two-terminal leads run from ax to bx at cy; box body rect. */
  ax: number;
  bx: number;
  cy: number;
  body: { x: number; y: number; w: number; h: number } | null;
}

export interface SchemLayout {
  items: SchemItem[];
  width: number;
  height: number;
  nets: ResolvedNets;
}

// Layout constants (schematic units).
const CHAR = 0.6; // average glyph width in em
const NET_FONT = 10;
const PIN_FONT = 9;
const TITLE_FONT = 11;
export const STUB = 14;
const SPAN = 84;
const CY = 36; // two-terminal lead line, below the title
const ROW = 16;
const TITLE_H = 34;
const PAD = 14;
const MAX_ROW = 1000;
const GAP_X = 56;
const GAP_Y = 52;

const CATEGORY_ORDER: PartCategory[] = ['boards', 'power', 'ics', 'sensors', 'semiconductors', 'passives', 'tools', 'prototyping'];
const TWO_TERMINAL_MODELS = new Set<SimModel['type']>(['resistor', 'capacitor', 'inductor', 'diode', 'led', 'switch', 'source', 'buzzer', 'motor', 'regulator']);

export const textWidth = (s: string, size: number) => Math.ceil(s.length * size * CHAR) + 2;

/** Electrical value of a part as shown in the schematic ("220 Ω", "10 µF", "Red"). */
export function valueText(comp: PlacedComponent, def: PartDef): string {
  for (const p of def.props) {
    const v: PropValue | undefined = comp.props[p.key] ?? def.defaults[p.key];
    if (v === undefined) continue;
    if (p.type === 'number' && p.unit) return formatSI(Number(v), p.unit);
    if (p.type === 'select') {
      const opt = p.options?.find((o) => o.value === String(v));
      if (opt) return opt.label;
    }
  }
  return '';
}

/** Net-label width including the net name, used to reserve horizontal room. */
function netLabelWidth(net: NetInfo | null): number {
  return net ? textWidth(net.name, NET_FONT) : 0;
}

function buildTwoTerminal(comp: PlacedComponent, def: PartDef, nets: ResolvedNets): Built {
  const [a, b] = def.pins;
  const netA = nets.byPin.get(`${comp.id}|${a.id}`) ?? null;
  const netB = nets.byPin.get(`${comp.id}|${b.id}`) ?? null;
  const name = def.name;
  const value = valueText(comp, def);

  // Horizontal room: net label beside each end, then the lead span.
  const leftM = (netA ? netLabelWidth(netA) + 6 : 0) + PAD;
  const ax = leftM;
  const bx = ax + SPAN;
  const rightM = (netB ? netLabelWidth(netB) + 6 : 0) + PAD;
  const midX = (ax + bx) / 2;
  const titleW = textWidth(name, TITLE_FONT);
  const valueW = textWidth(value, TITLE_FONT);
  // Keep the title and value inside the item even when they are wider than the symbol.
  const halfNeed = Math.max(titleW, valueW) / 2 + 4;
  const extraL = Math.max(0, halfNeed - midX);
  const extraR = Math.max(0, halfNeed - (bx - midX));
  const dx = extraL;
  const w = bx + dx + rightM + extraR;

  const pins: SchemPin[] = [
    {
      id: a.id,
      label: a.label,
      func: a.func ?? a.label,
      x: ax + dx,
      y: CY,
      side: 'left',
      net: netA,
      netX: ax + dx - 4,
      netY: CY + 3,
      netAnchor: 'end',
      labelX: ax + dx,
      labelY: CY - 7
    },
    {
      id: b.id,
      label: b.label,
      func: b.func ?? b.label,
      x: bx + dx,
      y: CY,
      side: 'right',
      net: netB,
      netX: bx + dx + 4,
      netY: CY + 3,
      netAnchor: 'start',
      labelX: bx + dx,
      labelY: CY - 7
    }
  ];

  const h = CY + 26 + (value ? 14 : 0);
  return {
    compId: comp.id,
    partId: comp.partId,
    name,
    partNumber: def.partNumber,
    value,
    kind: 'two',
    model: def.model.type,
    w,
    h,
    pins,
    titleX: midX + dx,
    titleY: 13,
    partY: 25,
    valueX: midX + dx,
    valueY: CY + 26,
    ax: ax + dx,
    bx: bx + dx,
    cy: CY,
    body: null
  };
}

function buildGround(comp: PlacedComponent, def: PartDef, nets: ResolvedNets): Omit<SchemItem, 'category' | 'x' | 'y' | 'ac' | 'polarized'> {
  const cx = 16;
  return {
    compId: comp.id,
    partId: comp.partId,
    name: def.name,
    partNumber: def.partNumber,
    value: '',
    kind: 'ground',
    model: def.model.type,
    w: 32,
    h: 34,
    pins: [
      {
        id: def.pins[0].id,
        label: 'GND',
        func: def.pins[0].func ?? 'GND',
        x: cx,
        y: 0,
        side: 'top',
        net: nets.byPin.get(`${comp.id}|${def.pins[0].id}`) ?? null,
        netX: cx,
        netY: 0,
        netAnchor: 'middle',
        labelX: cx,
        labelY: 0
      }
    ],
    titleX: cx,
    titleY: 30,
    partY: 30,
    valueX: cx,
    valueY: 30,
    ax: cx,
    bx: cx,
    cy: 0,
    body: null
  };
}

function buildBox(comp: PlacedComponent, def: PartDef, nets: ResolvedNets): Built {
  const byY = (p: { y: number; x: number }, q: { y: number; x: number }) => p.y - q.y || p.x - q.x;
  const left = def.pins.filter((p) => p.x < def.w / 2).sort(byY);
  const right = def.pins.filter((p) => p.x >= def.w / 2).sort(byY);
  const rows = Math.max(left.length, right.length, 1);
  const value = valueText(comp, def);

  const leftNetW = Math.max(0, ...left.map((p) => netLabelWidth(nets.byPin.get(`${comp.id}|${p.id}`) ?? null)));
  const rightNetW = Math.max(0, ...right.map((p) => netLabelWidth(nets.byPin.get(`${comp.id}|${p.id}`) ?? null)));
  const leftLabelW = Math.max(0, ...left.map((p) => textWidth(p.label, PIN_FONT)));
  const rightLabelW = Math.max(0, ...right.map((p) => textWidth(p.label, PIN_FONT)));
  const leftMargin = leftNetW ? leftNetW + 6 : 0;
  const rightMargin = rightNetW ? rightNetW + 6 : 0;
  const bodyW = Math.max(110, leftLabelW + rightLabelW + 36, textWidth(def.name, TITLE_FONT) + 16);
  const bodyX = PAD + leftMargin + STUB;
  const bodyY = TITLE_H;
  const bodyH = rows * ROW + 14;
  const bodyRight = bodyX + bodyW;
  const pins: SchemPin[] = [];

  const place = (list: typeof def.pins, side: 'left' | 'right') => {
    list.forEach((p, i) => {
      const y = bodyY + 14 + i * ROW;
      const net = nets.byPin.get(`${comp.id}|${p.id}`) ?? null;
      const tipX = side === 'left' ? PAD + leftMargin : bodyRight + STUB;
      pins.push({
        id: p.id,
        label: p.label,
        func: p.func ?? p.label,
        x: tipX,
        y,
        side,
        net,
        netX: side === 'left' ? tipX - 4 : tipX + 4,
        netY: y + 3,
        netAnchor: side === 'left' ? 'end' : 'start',
        labelX: side === 'left' ? bodyX + 5 : bodyRight - 5,
        labelY: y + 3
      });
    });
  };
  place(left, 'left');
  place(right, 'right');

  const w = bodyRight + STUB + rightMargin + PAD;
  const h = bodyY + bodyH + (value ? 26 : 12);
  return {
    compId: comp.id,
    partId: comp.partId,
    name: def.name,
    partNumber: def.partNumber,
    value,
    kind: 'box',
    model: def.model.type,
    w,
    h,
    pins,
    titleX: bodyX + bodyW / 2,
    titleY: 13,
    partY: 26,
    valueX: bodyX + bodyW / 2,
    valueY: bodyY + bodyH + 16,
    ax: bodyX,
    bx: bodyRight,
    cy: bodyY + bodyH / 2,
    body: { x: bodyX, y: bodyY, w: bodyW, h: bodyH }
  };
}

type Built = Omit<SchemItem, 'category' | 'x' | 'y' | 'ac' | 'polarized'>;

function buildItem(comp: PlacedComponent, def: PartDef, nets: ResolvedNets): Built {
  if (def.model.type === 'gnd') return buildGround(comp, def, nets);
  if (def.pins.length === 2 && TWO_TERMINAL_MODELS.has(def.model.type)) return buildTwoTerminal(comp, def, nets);
  return buildBox(comp, def, nets);
}

/** Lay out every electrical part on the bench as a schematic symbol, grouped by category. */
export function layoutSchematic(components: PlacedComponent[], wires: PlacedWire[]): SchemLayout {
  const nets = resolveNets(components, wires);
  const candidates: { comp: PlacedComponent; def: PartDef; order: number }[] = [];
  components.forEach((comp, order) => {
    const def = getPart(comp.partId);
    if (!def || !isElectricalPart(def)) return;
    candidates.push({ comp, def, order });
  });
  candidates.sort((p, q) => {
    const rp = CATEGORY_ORDER.indexOf(p.def.category);
    const rq = CATEGORY_ORDER.indexOf(q.def.category);
    return (rp < 0 ? 99 : rp) - (rq < 0 ? 99 : rq) || p.order - q.order;
  });

  const items: SchemItem[] = [];
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  let width = 0;
  for (const { comp, def } of candidates) {
    const built = buildItem(comp, def, nets);
    if (cx > 0 && cx + built.w > MAX_ROW) {
      cx = 0;
      cy += rowH + GAP_Y;
      rowH = 0;
    }
    const model = def.model;
    items.push({
      ...built,
      category: def.category,
      ac: model.type === 'source' && !!model.ac,
      polarized: model.type === 'capacitor' && !!model.polarized,
      x: cx,
      y: cy
    });
    cx += built.w + GAP_X;
    rowH = Math.max(rowH, built.h);
    width = Math.max(width, cx - GAP_X);
  }
  const height = items.length ? cy + rowH : 0;
  return { items, width, height, nets };
}
