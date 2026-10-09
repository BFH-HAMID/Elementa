import { describe, expect, it } from 'vitest';
import { getPart } from '../parts/registry';
import { EXAMPLE_PROJECTS } from '../projects/examples';
import { netlistRows, resolveNets } from '../lib/nets';
import { layoutSchematic, valueText } from '../schematic/layout';
import type { PlacedComponent, PlacedWire } from '../types';

const C = (id: string, partId: string, props: Record<string, number | string | boolean> = {}): PlacedComponent => ({
  id,
  partId,
  x: 0,
  y: 0,
  rotation: 0,
  flipH: false,
  props,
  state: {}
});
const W = (id: string, a: string, b: string): PlacedWire => {
  const [fc, fp] = a.split('.');
  const [tc, tp] = b.split('.');
  return { id, from: { compId: fc, pinId: fp }, to: { compId: tc, pinId: tp }, color: 'blue', waypoints: [] };
};

// Battery → resistor → LED → ground, with the MCU pin D-something driving the resistor too.
function ledCircuit() {
  const comps = [C('bat', 'battery-9v', { volts: 9 }), C('r1', 'resistor', { ohms: 330 }), C('led', 'led-red', { color: 'red' }), C('gnd', 'gnd-symbol')];
  const wires = [W('w1', 'bat.pos', 'r1.a'), W('w2', 'r1.b', 'led.anode'), W('w3', 'led.cathode', 'bat.neg'), W('w4', 'gnd.g', 'bat.neg')];
  return { comps, wires };
}

describe('net naming', () => {
  it('names the supply, the ground and the anonymous middle net', () => {
    const { comps, wires } = ledCircuit();
    const nets = resolveNets(comps, wires);
    expect(nets.byPin.get('r1|a')?.name).toBe('9V');
    expect(nets.byPin.get('r1|a')?.cls).toBe('power');
    expect(nets.byPin.get('led|cathode')?.name).toBe('GND');
    expect(nets.byPin.get('led|cathode')?.cls).toBe('gnd');
    expect(nets.byPin.get('led|anode')?.name).toMatch(/^N\d\d$/);
    expect(nets.byPin.get('led|anode')?.cls).toBe('signal');
  });

  it('names a signal net after the microcontroller pin it reaches', () => {
    const board = getPart('esp32-devkit-30');
    expect(board).toBeDefined();
    const io = board!.pins.find((p) => p.kind === 'io');
    expect(io).toBeDefined();
    const gndPin = board!.pins.find((p) => p.kind === 'gnd');
    expect(gndPin).toBeDefined();
    const comps = [C('mcu', 'esp32-devkit-30'), C('r1', 'resistor'), C('gnd', 'gnd-symbol')];
    const wires = [W('w1', `mcu.${io!.id}`, 'r1.a'), W('w2', 'gnd.g', `mcu.${gndPin!.id}`)];
    const nets = resolveNets(comps, wires);
    expect(nets.byPin.get('r1|a')?.name).toBe(io!.label);
  });

  it('keeps every net name unique, including ground and supplies', () => {
    const { comps, wires } = ledCircuit();
    const names = resolveNets(comps, wires).nets.map((n) => n.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every example project unique net names', () => {
    for (const ex of EXAMPLE_PROJECTS) {
      const names = resolveNets(ex.components, ex.wires).nets.map((n) => n.name);
      expect(new Set(names).size, ex.id).toBe(names.length);
    }
  });
});

describe('netlist rows', () => {
  it('lists the ground net and drops breadboard holes from pin lists', () => {
    const { comps, wires } = ledCircuit();
    const rows = netlistRows(comps, wires);
    const gnd = rows.find((r) => r.net === 'GND');
    expect(gnd).toBeDefined();
    expect(gnd!.pins.length).toBeGreaterThan(0);
    for (const r of rows) for (const p of r.pins) expect(p).not.toMatch(/Breadboard|Perfboard|Stripboard/i);
  });
});

describe('schematic layout', () => {
  it('draws two-terminal parts as symbols and boards as boxes', () => {
    const { comps, wires } = ledCircuit();
    const layout = layoutSchematic(comps, wires);
    const byId = new Map(layout.items.map((i) => [i.compId, i]));
    expect(byId.get('r1')?.kind).toBe('two');
    expect(byId.get('r1')!.ax).toBeLessThan(byId.get('r1')!.bx);
    expect(byId.get('gnd')?.kind).toBe('ground');
    expect(layout.items.length).toBe(4);
  });

  it('skips breadboards and jumper wires, which carry no electrical identity', () => {
    const comps = [C('bb', 'breadboard-half'), C('r1', 'resistor'), C('j1', 'jumper-wire')];
    const layout = layoutSchematic(comps, []);
    expect(layout.items.map((i) => i.compId)).toEqual(['r1']);
  });

  it('puts every item in a cell that does not overlap another', () => {
    for (const ex of EXAMPLE_PROJECTS) {
      const { items } = layoutSchematic(ex.components, ex.wires);
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
          expect(overlap, `${ex.id}: ${a.compId} overlaps ${b.compId}`).toBe(false);
        }
      }
    }
  });

  it('gives each wired pin a net label and leaves unwired pins without one', () => {
    const { comps, wires } = ledCircuit();
    const layout = layoutSchematic(comps, wires);
    const r1 = layout.items.find((i) => i.compId === 'r1')!;
    expect(r1.pins.every((p) => p.net !== null)).toBe(true);
    const lone = layoutSchematic([C('r9', 'resistor')], []).items[0];
    expect(lone.pins.every((p) => p.net === null)).toBe(true);
  });

  it('formats part values with their units', () => {
    expect(valueText(C('r', 'resistor', { ohms: 220 }), getPart('resistor')!)).toBe('220Ω');
    expect(valueText(C('r', 'resistor', { ohms: 4700 }), getPart('resistor')!)).toBe('4.7kΩ');
  });
});
