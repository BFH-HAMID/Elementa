/**
 * Bench analysis: bill of materials, netlist and the "Check circuit" validator.
 * Pure functions over the placed components, wires and the solver topology.
 */

import { getPart } from '../parts/registry';
import { buildTopology } from '../simulator/solver';
import { netlistRows } from './nets';
import type { PlacedComponent, PlacedWire } from '../types';

export interface BomLine {
  partId: string;
  name: string;
  partNumber: string;
  count: number;
  ids: string[];
}

export function billOfMaterials(components: PlacedComponent[]): BomLine[] {
  const map = new Map<string, BomLine>();
  for (const c of components) {
    const def = getPart(c.partId);
    if (!def) continue;
    const line = map.get(c.partId) ?? { partId: c.partId, name: def.name, partNumber: def.partNumber, count: 0, ids: [] };
    line.count++;
    line.ids.push(c.id);
    map.set(c.partId, line);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Netlist: each electrical net with the component pins that sit on it. Names match the schematic view. */
export function netlist(components: PlacedComponent[], wires: PlacedWire[]): { net: string; pins: string[] }[] {
  return netlistRows(components, wires);
}

export interface CheckIssue {
  level: 'error' | 'warning' | 'info';
  text: { en: string; bn: string };
}

/** Rule-based validator. Runs without simulating so it is instant. */
export function checkCircuit(components: PlacedComponent[], wires: PlacedWire[]): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const topo = buildTopology(components, wires);
  const hasGround = topo.groundRoot !== null;
  if (components.length === 0) return [{ level: 'info', text: { en: 'The bench is empty.', bn: 'বেঞ্চ খালি।' } }];
  const sources = components.filter((c) => getPart(c.partId)?.model.type === 'source');
  if (sources.length === 0 && topo.boards.length === 0) {
    issues.push({ level: 'warning', text: { en: 'No power source. Add a battery, USB supply or bench supply.', bn: 'কোনো বিদ্যুৎ উৎস নেই। ব্যাটারি, USB বা বেঞ্চ সাপ্লাই যোগ করুন।' } });
  }
  if (!hasGround && (sources.length > 0 || topo.boards.length > 0)) {
    issues.push({ level: 'error', text: { en: 'No ground reference. Connect the battery −, the board GND, or a GND symbol to the circuit.', bn: 'গ্রাউন্ড রেফারেন্স নেই। ব্যাটারি −, বোর্ড GND বা GND সিম্বল যোগ করুন।' } });
  }
  for (const boardId of topo.boards) {
    const comp = components.find((c) => c.id === boardId);
    if (!comp) continue;
    const def = getPart(comp.partId)!;
    const gndPins = def.pins.filter((p) => p.kind === 'gnd');
    const gndNet = gndPins.map((p) => topo.nodeOf.get(`${boardId}|${p.id}`) ?? -2);
    if (hasGround && !gndNet.some((n) => n === -1)) {
      issues.push({ level: 'error', text: { en: `${def.name}: GND is not connected to the common ground.`, bn: `${def.name}: GND সাধারণ গ্রাউন্ডের সাথে যুক্ত নয়।` } });
    }
    if (!def.art?.usb) {
      const powerPins = def.pins.filter((p) => p.kind === 'vin' || p.kind === 'vcc');
      const powered = powerPins.some((p) => {
        const n = topo.nodeOf.get(`${boardId}|${p.id}`) ?? -2;
        return n >= 0 && wires.some((w) => (w.from?.compId === boardId && w.from.pinId === p.id) || (w.to?.compId === boardId && w.to.pinId === p.id));
      });
      if (!powered) issues.push({ level: 'error', text: { en: `${def.name} has no supply on VIN or 5V.`, bn: `${def.name}-এর VIN বা 5V-তে কোনো সরবরাহ নেই।` } });
    }
    if (!comp.code || !comp.code.trim()) {
      issues.push({ level: 'warning', text: { en: `${def.name} has an empty sketch.`, bn: `${def.name}-এর স্কেচ খালি।` } });
    }
  }
  // LEDs with no series resistor between a supply and ground.
  for (const comp of components) {
    const def = getPart(comp.partId);
    if (!def || def.model.type !== 'led') continue;
    const a = topo.nodeOf.get(`${comp.id}|anode`) ?? -2;
    const k = topo.nodeOf.get(`${comp.id}|cathode`) ?? -2;
    const aNeighbours = components.filter((c) => {
      const d = getPart(c.partId);
      return d && (d.model.type === 'resistor' || d.id === 'jumper-wire') && d.pins.some((p) => topo.nodeOf.get(`${c.id}|${p.id}`) === a);
    });
    if (a >= 0 && a === k) continue;
    if (aNeighbours.length === 0 && a !== -2) {
      issues.push({ level: 'warning', text: { en: `${def.name} has no series resistor on its anode — it may burn out.`, bn: `${def.name}-এর অ্যানোডে কোনো সিরিজ রোধক নেই — এটি পুড়ে যেতে পারে।` } });
    }
  }
  // A part wired on its signal/supply pins but not on its GND pin is almost always a mistake.
  for (const comp of components) {
    const def = getPart(comp.partId);
    if (!def || def.model.type === 'prototyping' || def.model.type === 'gnd' || def.model.type === 'meter') continue;
    const gndPins = def.pins.filter((p) => p.kind === 'gnd');
    if (gndPins.length === 0) continue;
    const wiredOn = (pinId: string) => wires.some((w) => (w.from?.compId === comp.id && w.from.pinId === pinId) || (w.to?.compId === comp.id && w.to.pinId === pinId));
    const otherWired = def.pins.some((p) => p.kind !== 'gnd' && wiredOn(p.id));
    if (otherWired && !gndPins.some((p) => wiredOn(p.id))) {
      issues.push({ level: 'error', text: { en: `${def.name}: its GND pin is not connected, so it has no return path.`, bn: `${def.name}: এর GND পিন যুক্ত নয়, তাই ফিরতি পথ নেই।` } });
    }
  }
  // Floating boards / parts with no connections.
  for (const comp of components) {
    const def = getPart(comp.partId);
    if (!def || def.model.type === 'prototyping' || def.model.type === 'gnd') continue;
    const connected = def.pins.some((p) => wires.some((w) => (w.from?.compId === comp.id && w.from.pinId === p.id) || (w.to?.compId === comp.id && w.to.pinId === p.id)));
    if (!connected && def.category !== 'tools') {
      issues.push({ level: 'info', text: { en: `${def.name} is not wired to anything.`, bn: `${def.name} কোনো কিছুর সাথে যুক্ত নয়।` } });
    }
  }
  return issues;
}
