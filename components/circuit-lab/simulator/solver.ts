/**
 * Circuit Lab analogue + digital solver (pure TypeScript — no React, no DOM).
 *
 *  • Topology: union-find over pin keys. Wires, breadboard strips and rails,
 *    perfboard strips, same-part ground pins, push-button bridges and
 *    geometric hole insertion all merge pins into electrical nodes.
 *  • Analogue: modified nodal analysis (MNA), dense LU with partial pivoting,
 *    Newton iteration for diodes / LEDs / BJT / op-amp / MOSFET, and backward-
 *    Euler Norton companions for capacitors and inductors, so the same code
 *    handles DC operating points and transients.
 *  • Digital: gates, shift registers, 555 timers, driver ICs and MCU pins are
 *    evaluated once per time step from the previous step's node voltages and
 *    drive the analogue network as a source behind a series output impedance.
 */

import { pinWorldPos } from '../geometry';
import { getPart } from '../parts/registry';
import { holeGroupKey } from '../parts/holes';
import type { CompSimResult, PartDef, PlacedComponent, PlacedWire, PropValue } from '../types';

// ── Public types ────────────────────────────────────────────────────────────

export type DriveSpec = { mode: 'out'; level: boolean; duty?: number } | { mode: 'pullup' } | { mode: 'in' };

export type Memory = Record<string, number | string | boolean>;

export interface Topology {
  key: string;
  /** Number of electrical nodes (ground excluded). */
  nodeCount: number;
  /** "compId|pinId" → node index, −1 = ground. */
  nodeOf: Map<string, number>;
  comps: Map<string, { def: PartDef; comp: PlacedComponent }>;
  boards: string[];
  groundRoot: string | null;
  insertions: number;
}

export interface StepInput {
  topo: Topology;
  components: PlacedComponent[];
  t: number;
  dt: number;
  prevV: Float64Array | null;
  memory: Record<string, Memory>;
  burnt: Set<string>;
  drives: Record<string, Record<string, DriveSpec>>;
}

export interface StepOutput {
  nodeV: Float64Array;
  comp: Record<string, CompSimResult>;
  sourceCurrents: Record<string, number>;
  memory: Record<string, Memory>;
  newBurns: Record<string, string>;
  warnings: string[];
  isShortCircuit: boolean;
  isOpenCircuit: boolean;
  /** Multimeter readings keyed by component id. */
  displays: Record<string, string>;
  /** Node voltage of any pin (0 if unknown). */
  pinV(compId: string, pinId: string): number;
  /** Node voltage vector used for the next step's initial guess. */
  x: Float64Array;
}

// ── Topology ────────────────────────────────────────────────────────────────

/** Pins internally bridged on one part (push-button sides). */
function internalBridges(def: PartDef): [string, string][] {
  if (def.id === 'pushbutton') {
    return [
      ['a1', 'a2'],
      ['b1', 'b2']
    ];
  }
  return [];
}

class DSU {
  private parent = new Map<string, string>();
  find(x: string): string {
    const p = this.parent.get(x);
    if (p === undefined) {
      this.parent.set(x, x);
      return x;
    }
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export function buildTopology(components: PlacedComponent[], wires: PlacedWire[]): Topology {
  const dsu = new DSU();
  const comps = new Map<string, { def: PartDef; comp: PlacedComponent }>();
  const boards: string[] = [];
  const key = (c: string, p: string) => `${c}|${p}`;

  const CELL = 6;
  const cellKey = (x: number, y: number) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
  const holeCells = new Map<string, { k: string; x: number; y: number }[]>();
  const insertPins: { k: string; x: number; y: number }[] = [];

  for (const comp of components) {
    const def = getPart(comp.partId);
    if (!def) continue;
    comps.set(comp.id, { def, comp });
    if (def.category === 'boards') boards.push(comp.id);
    const isProto = def.model.type === 'prototyping';
    for (const pin of def.pins) {
      const k = key(comp.id, pin.id);
      dsu.find(k);
      const pos = pinWorldPos(comp, def, pin);
      const gk = holeGroupKey(pin.id);
      if (isProto && gk) {
        dsu.union(k, `grp|${comp.id}|${gk}`);
        const ck = cellKey(pos.x, pos.y);
        const list = holeCells.get(ck) ?? [];
        list.push({ k, x: pos.x, y: pos.y });
        holeCells.set(ck, list);
      } else if (!isProto) {
        insertPins.push({ k, x: pos.x, y: pos.y });
      }
    }
    const gndPins = def.pins.filter((p) => p.kind === 'gnd');
    for (let i = 1; i < gndPins.length; i++) dsu.union(key(comp.id, gndPins[0].id), key(comp.id, gndPins[i].id));
    for (const [a, b] of internalBridges(def)) dsu.union(key(comp.id, a), key(comp.id, b));
  }

  for (const w of wires) {
    if (!w.from || !w.to) continue;
    if (!comps.has(w.from.compId) || !comps.has(w.to.compId)) continue;
    dsu.union(key(w.from.compId, w.from.pinId), key(w.to.compId, w.to.pinId));
  }

  let insertions = 0;
  for (const pin of insertPins) {
    const cx = Math.floor(pin.x / CELL);
    const cy = Math.floor(pin.y / CELL);
    let joined = false;
    for (let dx = -1; dx <= 1 && !joined; dx++) {
      for (let dy = -1; dy <= 1 && !joined; dy++) {
        for (const h of holeCells.get(`${cx + dx},${cy + dy}`) ?? []) {
          if (Math.abs(h.x - pin.x) <= 2.5 && Math.abs(h.y - pin.y) <= 2.5) {
            dsu.union(pin.k, h.k);
            insertions++;
            joined = true;
            break;
          }
        }
      }
    }
  }

  let groundRoot: string | null = null;
  for (const comp of components) {
    if (comp.partId === 'gnd-symbol') {
      groundRoot = dsu.find(key(comp.id, 'g'));
      break;
    }
  }
  // Fallbacks in order: a source's negative terminal, then any board GND pin,
  // then any ground-kind pin. Without one of these the net floats (GMIN only).
  const fallbacks: ((def: PartDef) => boolean)[] = [
    (def) => def.model.type === 'source',
    (def) => def.category === 'boards',
    () => true
  ];
  for (const accept of fallbacks) {
    if (groundRoot) break;
    for (const comp of components) {
      const def = getPart(comp.partId);
      if (!def || !accept(def)) continue;
      const neg = def.pins.find((p) => p.id === 'neg' || p.id === 'gnd' || p.kind === 'gnd');
      if (neg) {
        groundRoot = dsu.find(key(comp.id, neg.id));
        break;
      }
    }
  }

  // Only nets that something connects to get a solver node. Breadboard hole groups
  // nobody uses (most of a full board) would otherwise inflate the matrix for nothing.
  const occupied = new Set<string>();
  for (const [, { def, comp }] of comps) {
    if (def.model.type === 'prototyping') continue;
    for (const pin of def.pins) occupied.add(dsu.find(key(comp.id, pin.id)));
  }
  for (const w of wires) {
    if (!w.from || !w.to || !comps.has(w.from.compId) || !comps.has(w.to.compId)) continue;
    occupied.add(dsu.find(key(w.from.compId, w.from.pinId)));
    occupied.add(dsu.find(key(w.to.compId, w.to.pinId)));
  }

  const rootIndex = new Map<string, number>();
  const nodeOf = new Map<string, number>();
  let next = 0;
  for (const [, { def, comp }] of comps) {
    for (const pin of def.pins) {
      const k = key(comp.id, pin.id);
      const r = dsu.find(k);
      if (groundRoot !== null && r === groundRoot) {
        nodeOf.set(k, -1);
        continue;
      }
      if (!occupied.has(r)) {
        // Unused hole or unwired pad: no element touches it, so it needs no unknown.
        nodeOf.set(k, -1);
        continue;
      }
      let idx = rootIndex.get(r);
      if (idx === undefined) {
        idx = next++;
        rootIndex.set(r, idx);
      }
      nodeOf.set(k, idx);
    }
  }

  return {
    key: `${components.length}:${wires.length}`,
    nodeCount: next,
    nodeOf,
    comps,
    boards,
    groundRoot,
    insertions
  };
}

/** Signature used to cache topology between steps (positions + wires). */
export function topologySignature(components: PlacedComponent[], wires: PlacedWire[]): string {
  const c = components.map((x) => `${x.id}:${x.partId}:${x.x}:${x.y}:${x.rotation}:${x.flipH ? 1 : 0}`).join('|');
  const w = wires.map((x) => `${x.id}:${x.from ? `${x.from.compId}.${x.from.pinId}` : '-'}:${x.to ? `${x.to.compId}.${x.to.pinId}` : '-'}`).join('|');
  return `${c}#${w}`;
}

// ── Linear algebra ──────────────────────────────────────────────────────────

class MNA {
  readonly n: number;
  readonly nodes: number;
  readonly A: Float64Array;
  readonly z: Float64Array;
  constructor(nodes: number, branches: number) {
    this.nodes = nodes;
    this.n = nodes + branches;
    this.A = new Float64Array(this.n * this.n);
    this.z = new Float64Array(this.n);
  }
  /** Add `v` at matrix position (r, c) when both are real rows/columns. */
  add(r: number, c: number, v: number) {
    if (r < 0 || c < 0) return;
    this.A[r * this.n + c] += v;
  }
  /** Conductance g between nodes a and b. */
  g(a: number, b: number, g: number) {
    this.add(a, a, g);
    this.add(b, b, g);
    this.add(a, b, -g);
    this.add(b, a, -g);
  }
  /** Constant current `i` flowing from node `from` into node `to` through a device. */
  i(from: number, to: number, i: number) {
    if (from >= 0) this.z[from] -= i;
    if (to >= 0) this.z[to] += i;
  }
  /** Ideal voltage source row for branch k: V(a) − V(b) = v. */
  v(a: number, b: number, v: number, k: number) {
    const row = this.nodes + k;
    this.add(a, row, 1);
    this.add(b, row, -1);
    this.add(row, a, 1);
    this.add(row, b, -1);
    this.z[row] = v;
  }
  solve(): Float64Array {
    const n = this.n;
    const A = this.A;
    const z = this.z;
    for (let k = 0; k < n; k++) {
      let p = k;
      let max = Math.abs(A[k * n + k]);
      for (let r = k + 1; r < n; r++) {
        const v = Math.abs(A[r * n + k]);
        if (v > max) {
          max = v;
          p = r;
        }
      }
      if (max < 1e-300) continue;
      if (p !== k) {
        for (let c = k; c < n; c++) {
          const t = A[k * n + c];
          A[k * n + c] = A[p * n + c];
          A[p * n + c] = t;
        }
        const tz = z[k];
        z[k] = z[p];
        z[p] = tz;
      }
      const piv = A[k * n + k];
      for (let r = k + 1; r < n; r++) {
        const f = A[r * n + k] / piv;
        if (f === 0) continue;
        for (let c = k; c < n; c++) A[r * n + c] -= f * A[k * n + c];
        z[r] -= f * z[k];
      }
    }
    const x = new Float64Array(n);
    for (let r = n - 1; r >= 0; r--) {
      let s = z[r];
      for (let c = r + 1; c < n; c++) s -= A[r * n + c] * x[c];
      const d = A[r * n + r];
      x[r] = Math.abs(d) < 1e-300 ? 0 : s / d;
    }
    return x;
  }
}

// ── Device equations ────────────────────────────────────────────────────────

const VT = 0.02585;
const GMIN = 1e-9;

function diodeEval(v: number, Is: number, n: number): { i: number; g: number } {
  const nvt = n * VT;
  const e = Math.exp(Math.min(v / nvt, 60));
  return { i: Is * (e - 1), g: Math.max((Is * e) / nvt, 1e-12) };
}

/** Saturation current giving current `i0` at forward voltage `vf`. */
function isFor(vf: number, i0: number, n: number): number {
  return i0 / Math.exp(vf / (n * VT));
}

function num(v: PropValue | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

function bool(v: PropValue | undefined): boolean {
  return v === true || v === 1 || v === 'true';
}

function resistanceOf(def: PartDef, comp: PlacedComponent): number {
  switch (def.id) {
    case 'ldr': {
      const lux = Math.max(1, num(comp.props.lux, 200));
      return Math.max(100, Math.min(1e6, 500000 / Math.pow(lux, 0.9)));
    }
    case 'thermistor': {
      const T = num(comp.props.celsius, 25) + 273.15;
      return Math.max(10, 10000 * Math.exp(3950 * (1 / T - 1 / 298.15)));
    }
    case 'jumper-wire':
      return 0.05;
    default:
      return Math.max(0.01, num(comp.props.ohms, 1000));
  }
}

// ── Element assembly ────────────────────────────────────────────────────────

interface Element {
  comp: string;
  stamp(M: MNA, x: Float64Array): void;
  post?(x: Float64Array): void;
  /** Re-evaluate operating region from the converged iterate. Returns true if changed. */
  mode?(x: Float64Array): boolean;
}

interface Ctx {
  topo: Topology;
  dt: number;
  t: number;
  prev: Float64Array | null;
  memory: Record<string, Memory>;
  memOut: Record<string, Memory>;
  burnt: Set<string>;
  drives: Record<string, Record<string, DriveSpec>>;
  elements: Element[];
  extra: number;
  branches: number;
  comp: Record<string, CompSimResult>;
  sourceCurrents: Record<string, number>;
  newBurns: Record<string, string>;
  warnings: string[];
  displays: Record<string, string>;
  /** Series current accumulated per component (|I| through its terminals). */
  current: Record<string, number>;
  /** Set when a meter in resistance mode asks for a probe solve. */
  probes: { compId: string; a: number; b: number }[];
  zeroSources: boolean;
  /** Components that are powered (supply pin above 2.5 V relative to ground). */
  powered: Record<string, boolean>;
  /** Total node count (set before the solve) so branch rows can be addressed. */
  nodeTotal: number;
}

function nodeOf(ctx: Ctx, comp: string, pin: string): number {
  const v = ctx.topo.nodeOf.get(`${comp}|${pin}`);
  return v === undefined ? -1 : v;
}

function pv(ctx: Ctx, node: number): number {
  if (node < 0 || !ctx.prev || node >= ctx.prev.length) return 0;
  return ctx.prev[node];
}

function xv(node: number, x: Float64Array): number {
  return node < 0 ? 0 : x[node];
}

function newNode(ctx: Ctx): number {
  return ctx.topo.nodeCount + ctx.extra++;
}

function newBranch(ctx: Ctx): number {
  return ctx.branches++;
}

function memOf(ctx: Ctx, id: string): Memory {
  return ctx.memory[id] ?? {};
}

function mem(ctx: Ctx, id: string, key: string, fallback: number): number {
  const v = memOf(ctx, id)[key];
  return typeof v === 'number' ? v : fallback;
}

function setMem(ctx: Ctx, id: string, values: Memory) {
  ctx.memOut[id] = { ...(ctx.memOut[id] ?? {}), ...values };
}

/** Supply voltage seen by a component: first supply pin minus its ground pin (previous step). */
function supplyVoltage(ctx: Ctx, def: PartDef, comp: PlacedComponent): number {
  const sup = def.pins.find((p) => p.kind === 'vcc' || p.kind === 'vin');
  if (!sup) return 0;
  const gnd = def.pins.find((p) => p.kind === 'gnd');
  const vs = pv(ctx, nodeOf(ctx, comp.id, sup.id));
  const vg = gnd ? pv(ctx, nodeOf(ctx, comp.id, gnd.id)) : 0;
  return vs - vg;
}

function addResistor(ctx: Ctx, compId: string, a: number, b: number, r: number, opts?: { watts?: number }) {
  const g = 1 / Math.max(r, 1e-6);
  ctx.elements.push({
    comp: compId,
    stamp(M) {
      M.g(a, b, g);
    },
    post(x) {
      const i = (xv(a, x) - xv(b, x)) * g;
      ctx.current[compId] = Math.max(ctx.current[compId] ?? 0, Math.abs(i));
      if (opts?.watts !== undefined && i * i * r > opts.watts) ctx.newBurns[compId] = 'overpower';
    }
  });
}

/** Digital output: ideal source behind rOut, with an internal node. */
function addDrive(ctx: Ctx, compId: string, pinNode: number, voltage: number, rOut: number) {
  const inner = newNode(ctx);
  const br = newBranch(ctx);
  ctx.elements.push({
    comp: compId,
    stamp(M) {
      M.v(inner, -1, voltage, br);
      M.g(inner, pinNode, 1 / rOut);
    }
  });
}

function addPullDown(ctx: Ctx, compId: string, node: number, r = 1e7) {
  if (node < 0) return;
  ctx.elements.push({
    comp: compId,
    stamp(M) {
      M.g(node, -1, 1 / r);
    }
  });
}

// ── Component builders ──────────────────────────────────────────────────────

function buildSource(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const posPin = def.pins.find((p) => ['pos', 'vbus', 'out'].includes(p.id))!;
  const negPin = def.pins.find((p) => ['neg', 'gnd'].includes(p.id))!;
  const pos = nodeOf(ctx, comp.id, posPin.id);
  const neg = nodeOf(ctx, comp.id, negPin.id);
  const rint: Record<string, number> = { 'battery-9v': 1.0, 'battery-aa4': 0.6, 'lipo-37': 0.1, 'usb-5v': 0.5, 'bench-supply': 0.01, 'ac-source': 50 };
  const limit: Record<string, number> = { 'battery-9v': 0.5, 'battery-aa4': 2.0, 'lipo-37': 3.0, 'usb-5v': 0.5, 'bench-supply': num(comp.props.limit, 1), 'ac-source': 1e9 };
  const R = rint[def.id] ?? 0.5;
  const isAC = def.id === 'ac-source' || def.id === 'function-generator' || (def.model.type === 'source' && def.model.ac === true);
  const foldback = def.id === 'bench-supply' || def.id === 'usb-5v';
  const setV = num(comp.props.volts, num(comp.props.vout, 5));
  const vEff = foldback ? mem(ctx, comp.id, 'vEff', setV) : setV;
  const inner = newNode(ctx);
  const br = newBranch(ctx);
  const lim = limit[def.id] ?? 1;
  const amp = num(comp.props.amp, 1);
  const freq = num(comp.props.freq, 1000);
  const offset = num(comp.props.offset, 0);
  const vTarget = ctx.zeroSources ? 0 : isAC ? offset + amp * Math.sin(2 * Math.PI * freq * ctx.t) : vEff;
  ctx.elements.push({
    comp: comp.id,
    stamp(M) {
      M.v(inner, neg, vTarget, br);
      M.g(inner, pos, 1 / R);
    },
    post(x) {
      const iDel = (xv(inner, x) - xv(pos, x)) / R;
      ctx.sourceCurrents[comp.id] = iDel;
      ctx.current[comp.id] = Math.abs(iDel);
      setMem(ctx, comp.id, { iDel });
      if (!isAC && Math.abs(iDel) > 5) {
        ctx.warnings.push(`${def.name}: short circuit (${iDel.toFixed(1)} A)`);
        if (!foldback) ctx.newBurns[comp.id] = 'short-circuit';
      } else if (!isAC && Math.abs(iDel) > 2 * lim && !foldback) {
        ctx.warnings.push(`${def.name}: overcurrent (${iDel.toFixed(2)} A)`);
        ctx.newBurns[comp.id] = 'overcurrent';
      }
      if (foldback) {
        // Constant-current fold-back: the output sags while over the limit, recovers slowly.
        const next = Math.abs(iDel) > lim ? Math.max(0, vEff * 0.97) : Math.min(setV, vEff + 0.01);
        setMem(ctx, comp.id, { vEff: next });
        if (Math.abs(iDel) > lim) ctx.warnings.push(`${def.name}: current limit (${lim} A)`);
      }
    }
  });
  ctx.comp[comp.id] = { pinV: {}, current: 0, power: 0 };
}

function buildTwoTerminal(ctx: Ctx, def: PartDef, comp: PlacedComponent, a: number, b: number) {
  void def;
  addResistor(ctx, comp.id, a, b, resistanceOf(def, comp), { watts: def.id === 'resistor' ? num(comp.props.watts, 0.25) * 2 : undefined });
}

function buildCapacitor(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const polar = def.model.type === 'capacitor' && def.model.polarized === true;
  const a = nodeOf(ctx, comp.id, polar ? 'pos' : 'a');
  const b = nodeOf(ctx, comp.id, polar ? 'neg' : 'b');
  const C = Math.max(1e-15, num(comp.props.farads, 1e-7));
  const G = C / ctx.dt;
  const vPrev = mem(ctx, comp.id, 'vPrev', 0);
  ctx.elements.push({
    comp: comp.id,
    stamp(M) {
      M.g(a, b, G);
      M.i(b, a, G * vPrev);
    },
    post(x) {
      const v = xv(a, x) - xv(b, x);
      const i = G * (v - vPrev);
      ctx.current[comp.id] = Math.abs(i);
      setMem(ctx, comp.id, { vPrev: v });
      if (polar && v < -0.5) {
        ctx.newBurns[comp.id] = 'reverse-polarity';
        ctx.warnings.push(`${def.name}: reverse polarity`);
      }
      if (polar && v > num(comp.props.volts, 25) * 1.2) {
        ctx.newBurns[comp.id] = 'overvoltage';
        ctx.warnings.push(`${def.name}: over-voltage`);
      }
    }
  });
}

function buildInductor(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const a = nodeOf(ctx, comp.id, 'a');
  const b = nodeOf(ctx, comp.id, 'b');
  const L = Math.max(1e-12, num(comp.props.henry, 1e-4));
  const G = ctx.dt / L;
  const iPrev = mem(ctx, comp.id, 'iPrev', 0);
  ctx.elements.push({
    comp: comp.id,
    stamp(M) {
      M.g(a, b, G);
      M.i(a, b, iPrev);
    },
    post(x) {
      const i = G * (xv(a, x) - xv(b, x)) + iPrev;
      ctx.current[comp.id] = Math.abs(i);
      setMem(ctx, comp.id, { iPrev: i });
    }
  });
}

/** Diode-like junction with optional zener breakdown. */
function buildJunction(
  ctx: Ctx,
  comp: PlacedComponent,
  def: PartDef,
  a: number,
  c: number,
  vf: number,
  opts: { led?: boolean; zener?: number; imax?: number; name?: string; channel?: 'r' | 'g' | 'b' }
) {
  const Is = opts.led ? isFor(vf, 0.02, 2) : isFor(vf, 0.001, 1.8);
  const n = opts.led ? 2 : 1.8;
  ctx.elements.push({
    comp: comp.id,
    stamp(M, x) {
      const v = xv(a, x) - xv(c, x);
      const { i, g } = diodeEval(v, Is, n);
      M.g(a, c, g);
      M.i(a, c, i - g * v);
      if (opts.zener !== undefined && v < -opts.zener) {
        // Zener breakdown: steep conductance past −Vz.
        const gz = 0.2;
        const iz = gz * (v + opts.zener);
        M.g(a, c, gz);
        M.i(a, c, iz - gz * v);
      }
    },
    post(x) {
      const v = xv(a, x) - xv(c, x);
      const { i } = diodeEval(v, Is, n);
      const iz = opts.zener !== undefined && v < -opts.zener ? 0.2 * (v + opts.zener) : 0;
      const total = i + iz;
      ctx.current[comp.id] = Math.max(ctx.current[comp.id] ?? 0, Math.abs(total));
      if (opts.led) {
        const glow = Math.min(1, Math.max(0, total / 0.015));
        const prev = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
        if (opts.channel) {
          const rgb = { r: prev.rgb?.r ?? 0, g: prev.rgb?.g ?? 0, b: prev.rgb?.b ?? 0 };
          rgb[opts.channel] = glow;
          ctx.comp[comp.id] = { ...prev, rgb, glow: Math.max(rgb.r, rgb.g, rgb.b) };
        } else {
          ctx.comp[comp.id] = { ...prev, glow };
        }
      }
      if (opts.imax !== undefined && total > opts.imax * 3) {
        ctx.newBurns[comp.id] = 'overcurrent';
        ctx.warnings.push(`${def.name}: overcurrent — burnt out`);
      }
      if (opts.led && v < -5) {
        ctx.newBurns[comp.id] = 'reverse-polarity';
        ctx.warnings.push(`${def.name}: reverse voltage — burnt out`);
      }
      if (!opts.led && total > 1.2) {
        ctx.newBurns[comp.id] = 'overcurrent';
        ctx.warnings.push(`${def.name}: over-current`);
      }
    }
  });
}

function buildBJT(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const pnp = def.model.type === 'bjt' && def.model.pnp === true;
  const s = pnp ? -1 : 1;
  const C = nodeOf(ctx, comp.id, 'c');
  const B = nodeOf(ctx, comp.id, 'b');
  const E = nodeOf(ctx, comp.id, 'e');
  const beta = Math.max(5, num(comp.props.beta, 150));
  const Is = 1e-15;
  const SAT_V = 0.2;
  let sat = mem(ctx, comp.id, 'sat', 0) === 1;
  const k = newBranch(ctx);
  // Device-sense base-emitter voltage (positive when forward biased).
  const vdevOf = (x: Float64Array) => s * (xv(B, x) - xv(E, x));
  const branchI = (x: Float64Array) => Math.abs(xv(ctx.nodeTotal + k, x));
  ctx.elements.push({
    comp: comp.id,
    stamp(M, x) {
      const vdev = vdevOf(x);
      const { i: ib, g: gb } = diodeEval(vdev, Is, 1);
      const ieq = ib - gb * vdev;
      // Base-emitter junction (always present).
      M.g(B, E, gb);
      M.i(B, E, s * ieq);
      if (!sat) {
        // Active region: collector current = β·Ib, linearised as a transconductance.
        const gm = beta * gb;
        M.add(C, B, gm);
        M.add(C, E, -gm);
        M.add(E, B, -gm);
        M.add(E, E, gm);
        M.i(C, E, s * beta * ieq);
      } else if (!pnp) {
        M.v(C, E, SAT_V, k);
      } else {
        M.v(E, C, SAT_V, k);
      }
    },
    post(x) {
      const vdev = vdevOf(x);
      const { i: ib } = diodeEval(vdev, Is, 1);
      const ic = sat ? branchI(x) : beta * ib;
      ctx.current[comp.id] = Math.max(ctx.current[comp.id] ?? 0, ic);
      const vce = s * (xv(C, x) - xv(E, x));
      if (ic > 1.0) {
        ctx.newBurns[comp.id] = 'overcurrent';
        ctx.warnings.push(`${def.name}: collector current too high — burnt out`);
      }
      ctx.comp[comp.id] = { ...(ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 }), power: Math.abs(ic * vce) };
    },
    mode(x) {
      const vdev = vdevOf(x);
      const { i: ib } = diodeEval(vdev, Is, 1);
      const vce = s * (xv(C, x) - xv(E, x));
      let next = sat;
      if (!sat && vce < SAT_V && beta * ib > 1e-6) next = true;
      else if (sat && vce > SAT_V && branchI(x) < beta * ib * 0.98) next = false;
      if (next !== sat) {
        sat = next;
        setMem(ctx, comp.id, { sat: next ? 1 : 0 });
        return true;
      }
      return false;
    }
  });
}

function buildMosfet(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const G = nodeOf(ctx, comp.id, 'g');
  const D = nodeOf(ctx, comp.id, 'd');
  const S = nodeOf(ctx, comp.id, 's');
  const rds = Math.max(1e-4, num(comp.props.rdson, 0.05));
  const vth = num(comp.props.vth, 2.5);
  const rating = def.id === 'irf540' ? 30 : 0.5;
  const gOf = (x: Float64Array) => {
    const vgs = xv(G, x) - xv(S, x);
    const f = Math.min(1, Math.max(0, (vgs - vth) / 0.5));
    return f / rds + GMIN;
  };
  ctx.elements.push({
    comp: comp.id,
    stamp(M, x) {
      M.g(D, S, gOf(x));
    },
    post(x) {
      const vds = xv(D, x) - xv(S, x);
      const i = vds * gOf(x);
      ctx.current[comp.id] = Math.abs(i);
      if (Math.abs(i * vds) > rating) {
        ctx.newBurns[comp.id] = 'overpower';
        ctx.warnings.push(`${def.name}: power dissipation exceeded — burnt out`);
      }
    }
  });
}

function buildRegulator(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const IN = nodeOf(ctx, comp.id, 'in');
  const OUT = nodeOf(ctx, comp.id, 'out');
  const gndPin = def.pins.find((p) => p.kind === 'gnd');
  const REF = gndPin ? nodeOf(ctx, comp.id, gndPin.id) : -1;
  const target = num(comp.props.vout, 5);
  const dropout = def.id === 'reg-ams1117' ? 1.1 : 2.0;
  const vin = pv(ctx, IN);
  const vset = ctx.zeroSources ? 0 : Math.max(0, Math.min(target, vin - dropout));
  const inner = newNode(ctx);
  const br = newBranch(ctx);
  const iPrev = mem(ctx, comp.id, 'iOut', 0);
  const RS = 0.1;
  ctx.elements.push({
    comp: comp.id,
    stamp(M) {
      M.v(inner, REF, vset, br);
      M.g(inner, OUT, 1 / RS);
      M.i(IN, REF, iPrev);
    },
    post(x) {
      const iOut = (xv(inner, x) - xv(OUT, x)) / RS;
      ctx.current[comp.id] = Math.abs(iOut);
      setMem(ctx, comp.id, { iOut });
      if (iOut > 1.5) {
        ctx.newBurns[comp.id] = 'overcurrent';
        ctx.warnings.push(`${def.name}: over-current — burnt out`);
      }
      const dissipation = (xv(IN, x) - xv(OUT, x)) * iOut;
      ctx.comp[comp.id] = { ...(ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 }), power: dissipation };
      if (dissipation > 5) {
        ctx.newBurns[comp.id] = 'overheat';
        ctx.warnings.push(`${def.name}: overheating — add a heatsink or lower the input`);
      }
    }
  });
}

function buildOpAmp(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const isLM358 = def.id === 'lm358';
  const pins = isLM358 ? { inv: '2', noninv: '3', out: '1', vneg: '4', vpos: '8' } : { inv: '2', noninv: '3', out: '6', vneg: '4', vpos: '7' };
  const INV = nodeOf(ctx, comp.id, pins.inv);
  const NI = nodeOf(ctx, comp.id, pins.noninv);
  const OUT = nodeOf(ctx, comp.id, pins.out);
  const VN = nodeOf(ctx, comp.id, pins.vneg);
  const VP = nodeOf(ctx, comp.id, pins.vpos);
  const A = 2e5;
  const k = newBranch(ctx);
  let region = mem(ctx, comp.id, 'region', 0); // 0 linear, 1 high, −1 low
  ctx.elements.push({
    comp: comp.id,
    stamp(M) {
      if (region === 0) {
        // OUT − A·(V+ − V−) = 0
        M.add(OUT, M.nodes + k, 1);
        M.add(M.nodes + k, OUT, 1);
        M.add(M.nodes + k, NI, -A);
        M.add(M.nodes + k, INV, A);
        M.z[M.nodes + k] = 0;
      } else if (region === 1) {
        // OUT = V+ − 1 V (high rail)
        M.add(OUT, M.nodes + k, 1);
        M.add(M.nodes + k, OUT, 1);
        M.add(M.nodes + k, VP, -1);
        M.z[M.nodes + k] = -1;
      } else {
        // OUT = V− + 0.2 V (low rail)
        M.add(OUT, M.nodes + k, 1);
        M.add(M.nodes + k, OUT, 1);
        M.add(M.nodes + k, VN, -1);
        M.z[M.nodes + k] = 0.2;
      }
    },
    post() {
      ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
    },
    mode(x) {
      const diff = A * (xv(NI, x) - xv(INV, x));
      const outV = xv(OUT, x);
      let next = region;
      const hi = xv(VP, x) - 1;
      const lo = xv(VN, x) + 0.2;
      if (region === 0) {
        if (outV > hi) next = 1;
        else if (outV < lo) next = -1;
      } else if (region === 1 && diff < hi) next = 0;
      else if (region === -1 && diff > lo) next = 0;
      if (next !== region) {
        region = next;
        setMem(ctx, comp.id, { region: next });
        return true;
      }
      return false;
    }
  });
}

/** Behavioural gates (74HC00/04/08): decided per step from the previous voltages. */
function buildGates(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const vcc = nodeOf(ctx, comp.id, '14');
  const gnd = nodeOf(ctx, comp.id, '7');
  const vdd = pv(ctx, vcc) - pv(ctx, gnd);
  const pairs: { a: string; b?: string; y: string }[] =
    def.model.type === 'logic' && def.model.gate === 'not'
      ? [
          { a: '1', y: '2' },
          { a: '3', y: '4' },
          { a: '5', y: '6' },
          { a: '9', y: '8' },
          { a: '11', y: '10' },
          { a: '13', y: '12' }
        ]
      : [
          { a: '1', b: '2', y: '3' },
          { a: '4', b: '5', y: '6' },
          { a: '9', b: '10', y: '8' },
          { a: '12', b: '13', y: '11' }
        ];
  const gate = def.model.type === 'logic' ? def.model.gate : 'and';
  const high = (node: number) => pv(ctx, node) - pv(ctx, gnd) > 0.5 * Math.max(vdd, 0.1);
  for (const p of pairs) {
    const A = nodeOf(ctx, comp.id, p.a);
    const B = p.b ? nodeOf(ctx, comp.id, p.b) : -1;
    const Y = nodeOf(ctx, comp.id, p.y);
    addPullDown(ctx, comp.id, A);
    if (B >= 0) addPullDown(ctx, comp.id, B);
    if (vdd < 1) continue;
    const a = high(A);
    const b = B >= 0 ? high(B) : false;
    let out: boolean;
    switch (gate) {
      case 'nand':
        out = !(a && b);
        break;
      case 'nor':
        out = !(a || b);
        break;
      case 'or':
        out = a || b;
        break;
      case 'not':
        out = !a;
        break;
      case 'xor':
        out = a !== b;
        break;
      default:
        out = a && b;
    }
    addDrive(ctx, comp.id, Y, out ? vdd : 0, 50);
  }
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

/** 74HC595 shift register with output latch (edge-triggered on SRCLK / RCLK). */
function buildShiftRegister(ctx: Ctx, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  const gnd = n('8');
  const vdd = pv(ctx, n('16')) - pv(ctx, gnd);
  const level = (node: number) => pv(ctx, node) - pv(ctx, gnd) > 0.5 * Math.max(vdd, 0.1);
  let bits = String(memOf(ctx, comp.id).bits ?? '00000000');
  let latch = String(memOf(ctx, comp.id).latch ?? '00000000');
  const prevSck = mem(ctx, comp.id, 'sck', 0);
  const prevRck = mem(ctx, comp.id, 'rck', 0);
  const sck = level(n('11')) ? 1 : 0;
  const rck = level(n('12')) ? 1 : 0;
  const clr = level(n('10')) ? 1 : 0;
  const ser = level(n('14')) ? '1' : '0';
  if (!clr) bits = '00000000';
  else if (sck === 1 && prevSck === 0) bits = ser + bits.slice(0, 7);
  if (rck === 1 && prevRck === 0) latch = bits;
  setMem(ctx, comp.id, { bits, latch, sck, rck });
  const oe = level(n('13'));
  const pinOf = ['15', '1', '2', '3', '4', '5', '6', '7'];
  if (vdd >= 1 && !oe) {
    for (let j = 0; j < 8; j++) addDrive(ctx, comp.id, n(pinOf[j]), latch[j] === '1' ? vdd : 0, 50);
  }
  addDrive(ctx, comp.id, n('9'), bits[7] === '1' ? vdd : 0, 50);
  for (const p of ['11', '12', '14', '10', '13']) addPullDown(ctx, comp.id, n(p));
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

/** NE555 behaviour: comparators + SR latch + discharge transistor. */
function buildTimer555(ctx: Ctx, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  const gnd = n('1');
  const OUT = n('3');
  const RESET = n('4');
  const TRIG = n('2');
  const THR = n('6');
  const DIS = n('7');
  const vcc = pv(ctx, n('8')) - pv(ctx, gnd);
  const v = (node: number) => pv(ctx, node) - pv(ctx, gnd);
  let q = mem(ctx, comp.id, 'q', 0) === 1;
  if (vcc >= 2) {
    if (v(RESET) < 0.7) q = false;
    else if (v(THR) > (2 / 3) * vcc) q = false;
    else if (v(TRIG) < (1 / 3) * vcc) q = true;
  }
  setMem(ctx, comp.id, { q: q ? 1 : 0 });
  if (vcc >= 2) addDrive(ctx, comp.id, OUT, q ? Math.max(0, vcc - 1.7) : 0.05, 10);
  if (!q) {
    // Discharge transistor pulls DIS to ground when the output is low.
    ctx.elements.push({
      comp: comp.id,
      stamp(M) {
        M.g(DIS, -1, 1 / 10);
      }
    });
  }
  addPullDown(ctx, comp.id, TRIG);
  addPullDown(ctx, comp.id, THR);
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

/** Motor drivers: L293D half-bridges and ULN2003 sink array. */
function buildDriver(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  if (def.model.type !== 'driver') return;
  if (def.model.variant === 'l293d') {
    const vm = pv(ctx, n('16')) - pv(ctx, n('4'));
    const vl = pv(ctx, n('8')) - pv(ctx, n('4'));
    const hi = (node: number) => pv(ctx, node) - pv(ctx, n('4')) > 0.5 * Math.max(vl, 0.1);
    const halves = [
      { en: '1', in: '2', out: '3' },
      { en: '1', in: '7', out: '6' },
      { en: '9', in: '10', out: '11' },
      { en: '9', in: '15', out: '14' }
    ];
    for (const h of halves) {
      const enabled = hi(n(h.en));
      const inN = n(h.in);
      const outN = n(h.out);
      addPullDown(ctx, comp.id, inN);
      if (enabled && vl > 1) addDrive(ctx, comp.id, outN, hi(inN) ? vm : 0, 0.5);
    }
  } else if (def.model.variant === 'uln2003') {
    const gnd = n('8');
    const hi = (node: number) => pv(ctx, node) - pv(ctx, gnd) > 1.4;
    for (let k = 1; k <= 7; k++) {
      const inN = n(String(k));
      const outN = n(String(17 - k));
      addPullDown(ctx, comp.id, inN);
      const active = hi(inN);
      ctx.elements.push({
        comp: comp.id,
        stamp(M) {
          M.g(outN, gnd, active ? 1 : GMIN);
        }
      });
    }
  }
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

/** Relay module: coil energised when IN is pulled low; contacts follow the coil. */
function buildRelay(ctx: Ctx, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  const vcc = n('vcc');
  const gnd = n('gnd');
  const IN = n('in');
  const COM = n('com');
  const NO = n('no');
  const NC = n('nc');
  const supply = pv(ctx, vcc) - pv(ctx, gnd);
  const energized = supply > 3.5 && pv(ctx, IN) - pv(ctx, gnd) < 2.5;
  if (energized) addResistor(ctx, comp.id, vcc, gnd, 70);
  ctx.elements.push({
    comp: comp.id,
    stamp(M) {
      M.g(COM, energized ? NO : NC, 0.01);
      M.g(COM, energized ? NC : NO, GMIN);
    }
  });
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
  ctx.comp[comp.id].on = energized;
}

/** Stepper-motor coil bank (28BYJ-48). Loads only — motion is driven by the sketch. */
function buildStepperCoils(ctx: Ctx, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  const vcc = n('vcc');
  const gnd = n('gnd');
  for (const p of ['in1', 'in2', 'in3', 'in4']) {
    const coil = newNode(ctx);
    addResistor(ctx, comp.id, vcc, coil, 50);
    const sink = pv(ctx, n(p)) - pv(ctx, gnd) > 1.4;
    ctx.elements.push({
      comp: comp.id,
      stamp(M) {
        M.g(coil, gnd, sink ? 1 : GMIN);
      }
    });
  }
}

function buildSwitch(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  const pairs: [string, string, boolean][] = [];
  if (def.id === 'switch-spst') pairs.push(['a', 'b', bool(comp.props.closed)]);
  else if (def.id === 'switch-spdt') {
    const toNO = comp.props.position === 'no';
    pairs.push(['com', toNO ? 'no' : 'nc', true]);
  } else if (def.id === 'pushbutton') pairs.push(['a1', 'b1', bool(comp.props.pressed)]);
  else if (def.id === 'dip-switch') {
    for (let i = 1; i <= 4; i++) pairs.push([`s${i}a`, `s${i}b`, bool(comp.props[`sw${i}`])]);
  }
  for (const [p, q, closed] of pairs) {
    if (closed) addResistor(ctx, comp.id, n(p), n(q), 0.01);
  }
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
  ctx.comp[comp.id].on = pairs.some((p) => p[2]);
}

function buildPot(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const cw = nodeOf(ctx, comp.id, 'cw');
  const w = nodeOf(ctx, comp.id, 'wiper');
  const ccw = nodeOf(ctx, comp.id, 'ccw');
  const R = Math.max(10, num(comp.props.ohms, 10000));
  const pos = Math.min(1, Math.max(0, num(comp.props.position, 50) / 100));
  addResistor(ctx, comp.id, cw, w, Math.max(1, R * pos));
  addResistor(ctx, comp.id, w, ccw, Math.max(1, R * (1 - pos)));
  void def;
}

function buildLED(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const vf = num(comp.props.vf, 2.0);
  const imax = num(comp.props.imax, 20);
  if (def.id === 'led-rgb') {
    const K = nodeOf(ctx, comp.id, 'k');
    const chans: [string, number][] = [
      ['r', 2.0],
      ['g', 3.2],
      ['b', 3.2]
    ];
    for (const [p, v] of chans) buildJunction(ctx, comp, def, nodeOf(ctx, comp.id, p), K, v, { led: true, imax: imax / 1000, name: def.name, channel: p as 'r' | 'g' | 'b' });
    ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
    return;
  }
  const A = nodeOf(ctx, comp.id, 'anode');
  const K = nodeOf(ctx, comp.id, 'cathode');
  buildJunction(ctx, comp, def, A, K, vf, { led: true, imax: imax / 1000, name: def.name });
}

function buildSevenSeg(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const K = nodeOf(ctx, comp.id, 'k1');
  for (const seg of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp']) {
    buildJunction(ctx, comp, def, nodeOf(ctx, comp.id, seg), K, 2.0, { led: true, imax: 0.02, name: def.name });
  }
}

function buildMeter(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  if (def.model.type !== 'meter') return;
  if (def.model.variant === 'multimeter') {
    const com = nodeOf(ctx, comp.id, 'com');
    const vma = nodeOf(ctx, comp.id, 'vma');
    const mode = str(comp.props.mode, 'V');
    if (mode === 'A') {
      addResistor(ctx, comp.id, vma, com, 0.001);
      const i = (pv(ctx, vma) - pv(ctx, com)) / 0.001;
      ctx.displays[comp.id] = fmtA(i);
    } else if (mode === 'R') {
      ctx.probes.push({ compId: comp.id, a: vma, b: com });
    } else {
      const v = pv(ctx, vma) - pv(ctx, com);
      ctx.displays[comp.id] = `${v.toFixed(Math.abs(v) < 10 ? 3 : 2)} V`;
    }
  }
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

function str(v: PropValue | undefined, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function fmtA(i: number): string {
  const a = Math.abs(i);
  if (a >= 1) return `${i.toFixed(3)} A`;
  if (a >= 1e-3) return `${(i * 1e3).toFixed(2)} mA`;
  return `${(i * 1e6).toFixed(0)} µA`;
}

/** Sensors / modules: supply draw plus any analogue output network. */
function buildSensor(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const n = (p: string) => nodeOf(ctx, comp.id, p);
  const vcc = def.pins.find((p) => p.kind === 'vcc' || p.id === 'vcc');
  const gnd = def.pins.find((p) => p.kind === 'gnd' || p.id === 'gnd');
  const VCC = vcc ? n(vcc.id) : -1;
  const GND = gnd ? n(gnd.id) : -1;
  const supply = supplyVoltage(ctx, def, comp);
  const ok = supply > 2.0;
  ctx.powered[comp.id] = ok;
  switch (def.id) {
    case 'ldr-module': {
      const AO = n('ao');
      const DO = n('do');
      if (ok) {
        addResistor(ctx, comp.id, VCC, AO, resistanceOf(def, comp));
        addResistor(ctx, comp.id, AO, GND, 10000);
        const high = pv(ctx, AO) - pv(ctx, GND) > supply / 2;
        addDrive(ctx, comp.id, DO, high ? supply : 0, 1000);
      }
      break;
    }
    case 'soil-moisture': {
      const AO = n('ao');
      if (ok) {
        const moisture = Math.max(0, Math.min(100, num(comp.props.moisture, 40)));
        addResistor(ctx, comp.id, VCC, AO, 1000 + (100 - moisture) * 400);
        addResistor(ctx, comp.id, AO, GND, 10000);
      }
      break;
    }
    case 'mq2': {
      const AO = n('ao');
      if (ok) {
        const ppm = Math.max(50, num(comp.props.ppm, 200));
        addResistor(ctx, comp.id, VCC, GND, 33);
        addResistor(ctx, comp.id, VCC, AO, 10000 * Math.sqrt(1000 / ppm));
        addResistor(ctx, comp.id, AO, GND, 10000);
      }
      break;
    }
    case 'pir-hc501': {
      if (ok) {
        addResistor(ctx, comp.id, VCC, GND, 1000);
        const OUT = n('out');
        addDrive(ctx, comp.id, OUT, bool(comp.props.motion) ? supply : 0, 100);
      }
      break;
    }
    case 'touch-ttp223': {
      if (ok) {
        addResistor(ctx, comp.id, VCC, GND, 1000);
        addDrive(ctx, comp.id, n('out'), bool(comp.props.touched) ? supply : 0, 100);
      }
      break;
    }
    case 'ir-receiver': {
      if (ok) {
        addResistor(ctx, comp.id, n('vcc'), n('out'), 10000);
        addResistor(ctx, comp.id, n('gnd'), GND, 1e9);
      }
      break;
    }
    case 'oled-ssd1306':
    case 'lcd-i2c':
    case 'lcd-16x2': {
      if (ok) addResistor(ctx, comp.id, VCC, GND, def.id === 'oled-ssd1306' ? 220 : 1000);
      break;
    }
    default: {
      if (ok && VCC >= 0 && GND >= 0) addResistor(ctx, comp.id, VCC, GND, def.id === 'nrf24l01' ? 3000 : 10000);
      break;
    }
  }
  // Pin inputs of sensors are high impedance.
  for (const p of def.pins) {
    if (p.kind === 'io' || p.kind === 'ain') addPullDown(ctx, comp.id, n(p.id));
  }
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
  ctx.comp[comp.id].powered = ok;
}

function buildServo(ctx: Ctx, comp: PlacedComponent) {
  const vcc = nodeOf(ctx, comp.id, 'red');
  const gnd = nodeOf(ctx, comp.id, 'brown');
  addResistor(ctx, comp.id, vcc, gnd, 150);
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

function buildMotor(ctx: Ctx, comp: PlacedComponent) {
  const a = nodeOf(ctx, comp.id, 'a');
  const b = nodeOf(ctx, comp.id, 'b');
  addResistor(ctx, comp.id, a, b, 6);
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
}

/** Microcontroller boards: power, output drives, input loading, 3V3/5V outputs. */
function buildBoard(ctx: Ctx, def: PartDef, comp: PlacedComponent) {
  const vdd = def.id.startsWith('esp32') || def.id.startsWith('nodemcu') || def.id === 'rpi-pico' || def.id === 'stm32-bluepill' ? 3.3 : 5;
  const gnd = def.pins.find((p) => p.kind === 'gnd');
  const GND = gnd ? nodeOf(ctx, comp.id, gnd.id) : -1;
  const powerPins = def.pins.filter((p) => p.kind === 'vin' || (p.kind === 'vcc' && !/3V3|5V|IOREF/i.test(p.id)));
  const supply = powerPins.reduce((best, p) => Math.max(best, pv(ctx, nodeOf(ctx, comp.id, p.id)) - pv(ctx, GND)), 0);
  // Boards with a USB port are powered from the host computer; others need a supply on VIN / 5V.
  const powered = Boolean(def.art?.usb) || supply > 2.5;
  ctx.powered[comp.id] = powered;
  // Regulated outputs on the board (5V / 3V3 labels).
  for (const p of def.pins) {
    if (p.kind === 'vcc' && /3V3|5V|IOREF/i.test(p.id) && powered) {
      const v = /3V3|3\.3/i.test(p.label) || /3V3/.test(p.id) ? 3.3 : 5;
      addDrive(ctx, comp.id, nodeOf(ctx, comp.id, p.id), Math.min(v, vdd), 0.5);
    }
  }
  const drives = ctx.drives[comp.id] ?? {};
  for (const p of def.pins) {
    if (p.kind !== 'io' && p.kind !== 'pwm' && p.kind !== 'ain') continue;
    const node = nodeOf(ctx, comp.id, p.id);
    const d = drives[p.id];
    if (!powered) {
      addPullDown(ctx, comp.id, node);
      continue;
    }
    if (d && d.mode === 'out') {
      const level = d.duty !== undefined ? d.duty * vdd : d.level ? vdd : 0;
      addDrive(ctx, comp.id, node, level, 25);
    } else if (d && d.mode === 'pullup') {
      addDrive(ctx, comp.id, node, vdd, 45000);
    } else {
      addPullDown(ctx, comp.id, node);
    }
  }
  ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
  ctx.comp[comp.id].powered = powered;
}

/** Dispatch one placed component to its element builder. */
function buildComponent(ctx: Ctx, comp: PlacedComponent, def: PartDef) {
  if (ctx.burnt.has(comp.id)) {
    ctx.comp[comp.id] = { pinV: {}, current: 0, power: 0, burnt: true };
    return;
  }
  const m = def.model;
  switch (m.type) {
    case 'source':
      buildSource(ctx, def, comp);
      return;
    case 'resistor':
      buildTwoTerminal(ctx, def, comp, nodeOf(ctx, comp.id, 'a'), nodeOf(ctx, comp.id, 'b'));
      ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
      return;
    case 'potentiometer':
      buildPot(ctx, def, comp);
      return;
    case 'capacitor':
      buildCapacitor(ctx, def, comp);
      return;
    case 'inductor':
      buildInductor(ctx, def, comp);
      return;
    case 'diode':
      buildJunction(ctx, comp, def, nodeOf(ctx, comp.id, 'anode'), nodeOf(ctx, comp.id, 'cathode'), 0.7, {
        zener: def.id.startsWith('zener') ? num(comp.props.vz, 5.1) : undefined,
        name: def.name
      });
      return;
    case 'led':
      buildLED(ctx, def, comp);
      return;
    case 'bjt':
      buildBJT(ctx, def, comp);
      return;
    case 'mosfet':
      buildMosfet(ctx, def, comp);
      return;
    case 'regulator':
      buildRegulator(ctx, def, comp);
      return;
    case 'optocoupler': {
      const a = nodeOf(ctx, comp.id, 'a');
      const k = nodeOf(ctx, comp.id, 'k');
      const c = nodeOf(ctx, comp.id, 'c');
      const e = nodeOf(ctx, comp.id, 'e');
      const iLed = mem(ctx, comp.id, 'iLed', 0);
      const ctr = num(comp.props.ctr, 200) / 100;
      const Is = isFor(1.2, 0.01, 1.5);
      ctx.elements.push({
        comp: comp.id,
        stamp(M, x) {
          const v = xv(a, x) - xv(k, x);
          const { i, g } = diodeEval(v, Is, 1.5);
          M.g(a, k, g);
          M.i(a, k, i - g * v);
          M.i(c, e, ctr * iLed);
        },
        post(x) {
          const v = xv(a, x) - xv(k, x);
          const { i } = diodeEval(v, Is, 1.5);
          setMem(ctx, comp.id, { iLed: i });
          ctx.current[comp.id] = Math.abs(ctr * i);
        }
      });
      ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
      return;
    }
    case 'opamp':
      buildOpAmp(ctx, def, comp);
      return;
    case 'logic':
      buildGates(ctx, def, comp);
      return;
    case 'timer555':
      buildTimer555(ctx, comp);
      return;
    case 'driver':
      if (m.variant === 'stepper') {
        buildStepperCoils(ctx, comp);
        return;
      }
      buildDriver(ctx, def, comp);
      return;
    case 'relay':
      buildRelay(ctx, comp);
      return;
    case 'buzzer': {
      const pos = nodeOf(ctx, comp.id, 'pos');
      const neg = nodeOf(ctx, comp.id, 'neg');
      addResistor(ctx, comp.id, pos, neg, 150);
      ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
      return;
    }
    case 'motor':
      buildMotor(ctx, comp);
      return;
    case 'servo':
      buildServo(ctx, comp);
      return;
    case 'display':
      if (m.variant === '7seg') buildSevenSeg(ctx, def, comp);
      else buildSensor(ctx, def, comp);
      return;
    case 'sensor':
    case 'wireless':
      buildSensor(ctx, def, comp);
      return;
    case 'switch':
      buildSwitch(ctx, def, comp);
      return;
    case 'meter':
      if (m.variant === 'fgen') buildSource(ctx, def, comp);
      else buildMeter(ctx, def, comp);
      return;
    case 'mcu':
      if (def.category === 'boards') buildBoard(ctx, def, comp);
      else if (comp.partId === 'mcp3008') ctx.comp[comp.id] = { pinV: {}, current: 0, power: 0 };
      return;
    case 'prototyping':
    case 'gnd':
    default:
      if (m.type === 'gnd') ctx.comp[comp.id] = ctx.comp[comp.id] ?? { pinV: {}, current: 0, power: 0 };
      return;
  }
}

// ── Newton loop ─────────────────────────────────────────────────────────────

function runSolve(
  input: StepInput,
  opts: { zeroSources: boolean; probe?: { a: number; b: number; I: number } }
): {
  x: Float64Array;
  ctx: Ctx;
  nodes: number;
} {
  const topo = input.topo;
  const ctx: Ctx = {
    topo,
    dt: input.dt,
    t: input.t,
    prev: input.prevV,
    memory: input.memory,
    memOut: {},
    burnt: input.burnt,
    drives: input.drives,
    elements: [],
    extra: 0,
    branches: 0,
    comp: {},
    sourceCurrents: {},
    newBurns: {},
    warnings: [],
    displays: {},
    current: {},
    probes: [],
    zeroSources: opts.zeroSources,
    powered: {},
    nodeTotal: 0
  };
  for (const comp of input.components) {
    const def = getPart(comp.partId);
    if (!def) continue;
    buildComponent(ctx, comp, def);
  }
  const nodes = topo.nodeCount + ctx.extra;
  const branches = ctx.branches;
  const size = nodes + branches;
  ctx.nodeTotal = nodes;
  let x = new Float64Array(size);
  if (input.prevV) for (let i = 0; i < Math.min(input.prevV.length, size); i++) x[i] = input.prevV[i];

  for (let outer = 0; outer < 6; outer++) {
    let converged = false;
    for (let iter = 0; iter < 80 && !converged; iter++) {
      const M = new MNA(nodes, branches);
      for (let i = 0; i < nodes; i++) M.g(i, -1, GMIN);
      for (const el of ctx.elements) el.stamp(M, x);
      if (opts.probe) {
        // Inject the ohmmeter test current from b into a.
        M.i(opts.probe.b, opts.probe.a, opts.probe.I);
      }
      const xn = M.solve();
      let maxd = 0;
      for (let i = 0; i < nodes; i++) maxd = Math.max(maxd, Math.abs(xn[i] - x[i]));
      const damp = maxd > 1.5 ? 1.5 / maxd : 1;
      for (let i = 0; i < size; i++) x[i] = x[i] + (xn[i] - x[i]) * damp;
      converged = maxd < 1e-7 && iter > 0;
    }
    let changed = false;
    for (const el of ctx.elements) if (el.mode && el.mode(x)) changed = true;
    if (!changed) break;
  }
  for (const el of ctx.elements) el.post?.(x);
  return { x, ctx, nodes };
}

/** Advance the circuit by one time step. */
export function solveStep(input: StepInput): StepOutput {
  const topo = input.topo;
  const main = runSolve(input, { zeroSources: false });
  const { x, ctx } = main;

  // Ohmmeter: unpowered network, 1 mA test current (as on a real bench).
  for (const probe of ctx.probes) {
    const r = runSolve(input, { zeroSources: true, probe: { a: probe.a, b: probe.b, I: 1e-3 } });
    const vab = xv(probe.a, r.x) - xv(probe.b, r.x);
    const ohms = Math.abs(vab) / 1e-3;
    ctx.displays[probe.compId] = ohms > 1e6 ? `${(ohms / 1e6).toFixed(2)} MΩ` : ohms > 1e3 ? `${(ohms / 1e3).toFixed(2)} kΩ` : `${ohms.toFixed(1)} Ω`;
  }

  const comp: Record<string, CompSimResult> = {};
  for (const [id, { def }] of topo.comps) {
    // Breadboards and perfboards only carry connectivity; they have no result to report.
    if (def.model.type === 'prototyping') continue;
    const base = ctx.comp[id] ?? { pinV: {}, current: 0, power: 0 };
    const pinV: Record<string, number> = {};
    for (const p of def.pins) pinV[p.id] = xv(topo.nodeOf.get(`${id}|${p.id}`) ?? -1, x);
    const current = ctx.current[id] ?? base.current ?? 0;
    comp[id] = { ...base, pinV, current, power: base.power ?? 0 };
    if (ctx.powered[id] !== undefined) comp[id].powered = ctx.powered[id];
    if (def.id.startsWith('led') && ctx.memOut[id]?.glowPrev !== undefined) {
      comp[id].glow = Number(ctx.memOut[id].glowPrev);
    }
    const span = Object.values(pinV).length ? Math.max(...Object.values(pinV)) - Math.min(...Object.values(pinV)) : 0;
    comp[id].power = Math.abs(current * span);
  }

  // Keep memory for components with no update this step.
  const memory: Record<string, Memory> = { ...input.memory };
  for (const [id, m] of Object.entries(ctx.memOut)) memory[id] = { ...(memory[id] ?? {}), ...m };

  const isShort = ctx.warnings.some((w) => w.includes('short circuit'));
  const nodeV = new Float64Array(x.subarray(0, topo.nodeCount + ctx.extra));
  return {
    nodeV,
    comp,
    sourceCurrents: ctx.sourceCurrents,
    memory,
    newBurns: ctx.newBurns,
    warnings: ctx.warnings,
    isShortCircuit: isShort,
    isOpenCircuit: topo.nodeCount === 0 || Object.keys(ctx.sourceCurrents).length === 0,
    displays: ctx.displays,
    pinV: (compId: string, pinId: string) => xv(topo.nodeOf.get(`${compId}|${pinId}`) ?? -1, x),
    x
  };
}

