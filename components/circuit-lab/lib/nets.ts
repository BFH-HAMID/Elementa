/**
 * Net resolution: turns the solver's node indices into named electrical nets.
 * Shared by the netlist panel and the schematic view so both always agree on
 * what a net is called. Pure functions; no DOM, no simulation state.
 *
 * Naming rules, in priority order:
 *   1. Ground net → `GND`.
 *   2. A supply pin (VCC/VIN/+ terminal) → its label, e.g. `5V`, `VBUS`, `3V3`.
 *      Single-character terminals (a battery's `+`) are named from the
 *      source's voltage, e.g. `9V`.
 *   3. A signal pin (IO/PWM/analog) → its label, e.g. `D13`, `GPIO21`.
 *   4. Otherwise `N01`, `N02`, … in discovery order.
 * Duplicate names get a numeric suffix so every net name is unique.
 */

import { getPart } from '../parts/registry';
import { buildTopology } from '../simulator/solver';
import type { PartDef, PlacedComponent, PlacedWire } from '../types';

export type NetClass = 'gnd' | 'power' | 'signal';

export interface NetPin {
  compId: string;
  pinId: string;
  partName: string;
  pinLabel: string;
  func: string;
}

export interface NetInfo {
  name: string;
  cls: NetClass;
  pins: NetPin[];
}

export interface ResolvedNets {
  nets: NetInfo[];
  /** "compId|pinId" → net. Pins not wired to anything are absent. */
  byPin: Map<string, NetInfo>;
}

/**
 * Categories whose signal pins have meaningful names (D13, GPIO21, SDA, TRIG…).
 * Discrete parts use numbered leads (“1”, “2”), which make poor net names.
 */
const NAMED_SIGNAL_CATEGORIES = new Set(['boards', 'sensors', 'ics']);

/** Parts that only provide connectivity (breadboards, labels) and have no electrical identity. */
export function isElectricalPart(def: PartDef): boolean {
  return def.model.type !== 'prototyping' && def.family !== 'jumper';
}

const pinKey = (compId: string, pinId: string) => `${compId}|${pinId}`;

export function resolveNets(components: PlacedComponent[], wires: PlacedWire[]): ResolvedNets {
  const topo = buildTopology(components, wires);
  const byPin = new Map<string, NetInfo>();
  const nets: NetInfo[] = [];
  const used = new Set<string>();

  const makePin = (compId: string, pinId: string): NetPin | null => {
    const entry = topo.comps.get(compId);
    if (!entry) return null;
    const pin = entry.def.pins.find((p) => p.id === pinId);
    return {
      compId,
      pinId,
      partName: entry.def.name,
      pinLabel: pin?.label ?? pinId,
      func: pin?.func ?? pin?.label ?? pinId
    };
  };

  // Ground first, so its name is reserved.
  const groundPins: NetPin[] = [];
  for (const k of topo.groundKeys) {
    const [compId, pinId] = k.split('|');
    if (!topo.comps.get(compId)) continue;
    const pin = makePin(compId, pinId);
    if (pin) groundPins.push(pin);
  }
  if (groundPins.length > 0) {
    const ground: NetInfo = { name: 'GND', cls: 'gnd', pins: groundPins };
    used.add('GND');
    nets.push(ground);
    for (const p of groundPins) byPin.set(pinKey(p.compId, p.pinId), ground);
  }

  // Group the remaining pins by node index, in component order.
  const byNode = new Map<number, NetPin[]>();
  for (const { comp, def } of topo.comps.values()) {
    for (const pin of def.pins) {
      const node = topo.nodeOf.get(pinKey(comp.id, pin.id));
      if (node === undefined || node < 0) continue;
      const p = makePin(comp.id, pin.id);
      if (!p) continue;
      const list = byNode.get(node) ?? [];
      list.push(p);
      byNode.set(node, list);
    }
  }

  const uniqueName = (base: string): string => {
    let name = base;
    for (let k = 2; used.has(name); k++) name = `${base}_${k}`;
    used.add(name);
    return name;
  };

  let counter = 1;
  for (const node of [...byNode.keys()].sort((a, b) => a - b)) {
    const pins = byNode.get(node) ?? [];
    // The solver gives every pin of a placed part a node, even when nothing is wired to it.
    // A net needs at least two pins on it; a lone pin is simply unconnected.
    if (pins.length < 2) continue;
    const supply = pins.find((p) => {
      const kind = topo.comps.get(p.compId)?.def.pins.find((x) => x.id === p.pinId)?.kind;
      return kind === 'vcc' || kind === 'vin';
    });
    const signal = pins.find((p) => {
      const entry = topo.comps.get(p.compId);
      const kind = entry?.def.pins.find((x) => x.id === p.pinId)?.kind;
      return (kind === 'io' || kind === 'pwm' || kind === 'ain') && !!entry && NAMED_SIGNAL_CATEGORIES.has(entry.def.category) && /[A-Za-z]/.test(p.pinLabel) && p.pinLabel.length >= 2;
    });
    let base: string | null = null;
    let cls: NetClass = 'signal';
    if (supply) {
      cls = 'power';
      if (supply.pinLabel.length >= 2) {
        base = supply.pinLabel;
      } else {
        const volts = topo.comps.get(supply.compId)?.comp.props.volts;
        base = typeof volts === 'number' ? `${volts}V` : 'VCC';
      }
    } else if (signal) {
      base = signal.pinLabel;
    }
    if (!base) base = `N${String(counter++).padStart(2, '0')}`;
    const net: NetInfo = { name: uniqueName(base), cls, pins };
    nets.push(net);
    for (const p of pins) byPin.set(pinKey(p.compId, p.pinId), net);
  }

  return { nets, byPin };
}

/** Netlist rows for the BOM & netlist panel: nets with at least two electrical pins. */
export function netlistRows(components: PlacedComponent[], wires: PlacedWire[]): { net: string; pins: string[] }[] {
  const { nets } = resolveNets(components, wires);
  const rows: { net: string; pins: string[] }[] = [];
  for (const net of nets) {
    const pins = net.pins
      .filter((p) => {
        const comp = components.find((c) => c.id === p.compId);
        const def = comp ? getPart(comp.partId) : undefined;
        return def ? isElectricalPart(def) : false;
      })
      .map((p) => `${p.partName} · ${p.func}`);
    if (net.cls === 'gnd') {
      if (pins.length > 0) rows.push({ net: net.name, pins });
    } else if (pins.length >= 2) {
      rows.push({ net: net.name, pins });
    }
  }
  return rows;
}
