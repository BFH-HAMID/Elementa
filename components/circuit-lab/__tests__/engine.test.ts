import { describe, expect, it } from 'vitest';
import { CircuitEngine } from '../simulator/engine';
import { EXAMPLE_PROJECTS } from '../projects/examples';
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

function runOnce(components: PlacedComponent[], wires: PlacedWire[], steps = 1) {
  const engine = new CircuitEngine();
  let res = engine.tick({ components, wires, wallMs: 16, speed: 1, running: false });
  for (let i = 1; i < steps; i++) res = engine.tick({ components, wires, wallMs: 16, speed: 1, running: true });
  return res.frame;
}

describe('circuit solver — DC', () => {
  it('splits a 9 V battery across two equal resistors', () => {
    const comps = [
      C('bat', 'battery-9v', { volts: 9 }),
      C('r1', 'resistor', { ohms: 1000 }),
      C('r2', 'resistor', { ohms: 1000 }),
      C('gnd', 'gnd-symbol')
    ];
    const wires = [W('w1', 'bat.pos', 'r1.a'), W('w2', 'r1.b', 'r2.a'), W('w3', 'r2.b', 'bat.neg'), W('w4', 'gnd.g', 'bat.neg')];
    const f = runOnce(comps, wires);
    const mid = f.components.r1.pinV.b;
    expect(mid).toBeGreaterThan(4.3);
    expect(mid).toBeLessThan(4.7);
  });

  it('LED with a 220 Ω resistor on 5 V carries roughly 13–15 mA and glows', () => {
    const comps = [
      C('bat', 'usb-5v', { volts: 5 }),
      C('r1', 'resistor', { ohms: 220 }),
      C('led', 'led-red', { color: 'red', vf: 2.0, imax: 20 })
    ];
    const wires = [W('w1', 'bat.vbus', 'r1.a'), W('w2', 'r1.b', 'led.anode'), W('w3', 'led.cathode', 'bat.gnd')];
    const f = runOnce(comps, wires);
    const i = f.components.led.current;
    expect(i).toBeGreaterThan(0.010);
    expect(i).toBeLessThan(0.016);
    expect(f.components.led.glow ?? 0).toBeGreaterThan(0.5);
  });

  it('reverse-connected LED is not lit', () => {
    const comps = [C('bat', 'battery-9v', { volts: 9 }), C('r1', 'resistor', { ohms: 220 }), C('led', 'led-red', { color: 'red' })];
    const wires = [W('w1', 'bat.pos', 'r1.a'), W('w2', 'r1.b', 'led.cathode'), W('w3', 'led.anode', 'bat.neg')];
    const f = runOnce(comps, wires);
    expect(f.components.led.current).toBeLessThan(1e-6);
  });
});

describe('circuit solver — transient', () => {
  it('RC charges toward the supply (τ = RC = 10 ms)', () => {
    const comps = [C('bat', 'battery-9v', { volts: 9 }), C('r1', 'resistor', { ohms: 10000 }), C('c1', 'ceramic-cap', { farads: 1e-6 })];
    const wires = [W('w1', 'bat.pos', 'r1.a'), W('w2', 'r1.b', 'c1.a'), W('w3', 'c1.b', 'bat.neg')];
    const engine = new CircuitEngine();
    engine.tick({ components: comps, wires, wallMs: 16, speed: 1, running: false });
    // Run ~10 ms of simulated time: at t = τ the cap should be near 63 % of 9 V.
    let f = engine.tick({ components: comps, wires, wallMs: 10, speed: 1, running: true });
    expect(f.frame.components.c1.pinV.a).toBeGreaterThan(4.5);
    expect(f.frame.components.c1.pinV.a).toBeLessThan(7.5);
  });
});

describe('MCU runtime', () => {
  it('toggles the blink pin and reports serial output', () => {
    const code = `void setup(){ pinMode(13, OUTPUT); Serial.println("hi"); }\nvoid loop(){ digitalWrite(13, HIGH); delay(100); digitalWrite(13, LOW); delay(100); }`;
    const comps = [C('uno', 'arduino-uno'), C('r1', 'resistor', { ohms: 220 }), C('led', 'led-red')];
    comps[0].code = code;
    const wires = [W('w1', 'uno.D13', 'r1.a'), W('w2', 'r1.b', 'led.anode'), W('w3', 'led.cathode', 'uno.GND_T')];
    const engine = new CircuitEngine();
    engine.tick({ components: comps, wires, wallMs: 16, speed: 1, running: false });
    const first = engine.tick({ components: comps, wires, wallMs: 16, speed: 1, running: true });
    expect(first.serial).toContain('hi');
    let saw = { on: false, off: false };
    for (let i = 0; i < 80; i++) {
      const f = engine.tick({ components: comps, wires, wallMs: 16, speed: 1, running: true });
      const g = f.frame.components.led.glow ?? 0;
      if (g > 0.3) saw.on = true;
      if (g < 0.05) saw.off = true;
    }
    expect(saw.on && saw.off).toBe(true);
  });

  it('reports a syntax problem instead of crashing', () => {
    const comps = [C('uno', 'arduino-uno')];
    comps[0].code = 'void setup() { pinMode(13, OUTPUT);';
    const engine = new CircuitEngine();
    const res = engine.tick({ components: comps, wires: [], wallMs: 16, speed: 1, running: false });
    expect(res.errors.join(' ')).toMatch(/Unbalanced|braces/i);
  });
});

describe('example projects', () => {
  it('there are at least 10 examples', () => {
    expect(EXAMPLE_PROJECTS.length).toBeGreaterThanOrEqual(10);
  });
  for (const ex of EXAMPLE_PROJECTS) {
    it(`${ex.id} simulates without NaN`, () => {
      const engine = new CircuitEngine();
      engine.tick({ components: ex.components, wires: ex.wires, wallMs: 16, speed: 1, running: false });
      let last = engine.tick({ components: ex.components, wires: ex.wires, wallMs: 16, speed: 1, running: true });
      for (let i = 0; i < 30; i++) last = engine.tick({ components: ex.components, wires: ex.wires, wallMs: 16, speed: 1, running: true });
      for (const c of Object.values(last.frame.components)) {
        for (const v of Object.values(c.pinV)) expect(Number.isFinite(v)).toBe(true);
        expect(Number.isFinite(c.current)).toBe(true);
      }
    });
  }
});
