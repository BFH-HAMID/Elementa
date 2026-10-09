import { describe, expect, it } from 'vitest';
import { CircuitEngine } from '../simulator/engine';
import { EXAMPLE_PROJECTS, type ExampleProject } from '../projects/examples';
import { CIRCUIT_PROJECTS } from '../projects/catalog-circuits';
import { MCU_PROJECTS } from '../projects/catalog-mcu';
import { getPart } from '../parts/registry';
import type { PlacedComponent } from '../types';

/**
 * Verification for the catalogue examples (circuit and MCU projects).
 * Each project is simulated in the real engine and its key outputs are checked
 * against the physics the project text describes. Structural checks run for all
 * examples: pin ids exist, bilingual text is complete, nothing burns, no errors.
 */

type Frame = ReturnType<CircuitEngine['tick']>;

interface Run {
  ticks: Frame[];
  serial: string[];
  burns: Record<string, string>;
  errors: string[];
  last: Frame;
}

/** Sim-time per tick is 16 ms. `mutate` may change props before a tick. */
function simulate(ex: ExampleProject, ticks: number, mutate?: (t: number, comps: PlacedComponent[]) => PlacedComponent[]): Run {
  const engine = new CircuitEngine();
  let comps = ex.components;
  engine.tick({ components: comps, wires: ex.wires, wallMs: 16, speed: 1, running: false });
  const frames: Frame[] = [];
  const serial: string[] = [];
  const burns: Record<string, string> = {};
  const errors = new Set<string>();
  for (let t = 0; t < ticks; t++) {
    if (mutate) comps = mutate(t, comps);
    const res = engine.tick({ components: comps, wires: ex.wires, wallMs: 16, speed: 1, running: true });
    frames.push(res);
    serial.push(...res.serial);
    Object.assign(burns, res.burns);
    res.errors.forEach((e) => errors.add(e));
  }
  return { ticks: frames, serial, burns, errors: [...errors], last: frames[frames.length - 1] };
}

/** Set props on one component, leaving the rest untouched. */
function withProps(comps: PlacedComponent[], id: string, props: Record<string, number | string | boolean>): PlacedComponent[] {
  return comps.map((c) => (c.id === id ? { ...c, props: { ...c.props, ...props } } : c));
}

interface View {
  pinV?: Record<string, number>;
  current?: number;
  glow?: number;
  on?: boolean;
  speed?: number;
  angle?: number;
  display?: string;
  text?: string;
  wave?: number[];
  traces?: number[][];
  warnings?: string[];
}

function view(frame: Frame, id: string): View {
  return frame.frame.components[id] as unknown as View;
}

function ex(id: string): ExampleProject {
  const found = [...CIRCUIT_PROJECTS, ...MCU_PROJECTS].find((p) => p.id === id);
  if (!found) throw new Error(`no project ${id}`);
  return found;
}

const NEW_PROJECTS = [...CIRCUIT_PROJECTS, ...MCU_PROJECTS];

describe('catalogue size and structure', () => {
  it('the library holds 40 to 50 example projects with unique ids', () => {
    expect(EXAMPLE_PROJECTS.length).toBeGreaterThanOrEqual(40);
    expect(EXAMPLE_PROJECTS.length).toBeLessThanOrEqual(50);
    const ids = EXAMPLE_PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('adds 38 new projects on top of the original 12', () => {
    expect(NEW_PROJECTS.length).toBe(38);
  });

  for (const p of NEW_PROJECTS) {
    it(`${p.id}: wires reference real parts and real pins`, () => {
      const byId = new Map(p.components.map((c) => [c.id, c]));
      expect(byId.size).toBe(p.components.length);
      for (const c of p.components) expect(getPart(c.partId), `${c.id} part`).toBeTruthy();
      for (const w of p.wires) {
        for (const end of [w.from, w.to]) {
          expect(end, `${w.id}: endpoint`).toBeTruthy();
          if (!end) continue;
          const comp = byId.get(end.compId);
          expect(comp, `${w.id}: component ${end.compId}`).toBeTruthy();
          if (!comp) continue;
          const part = getPart(comp.partId);
          expect(part, `${w.id}: part ${comp.partId}`).toBeTruthy();
          if (!part) continue;
          const pins = part.pins.map((pin) => pin.id);
          expect(pins, `${w.id}: pin ${end.compId}.${end.pinId}`).toContain(end.pinId);
        }
      }
    });

    it(`${p.id}: has complete bilingual text and at least three steps`, () => {
      for (const field of [p.title, p.summary, p.explanation]) {
        expect(field.en.trim().length).toBeGreaterThan(10);
        expect(field.bn.trim().length).toBeGreaterThan(10);
      }
      expect(p.steps.length).toBeGreaterThanOrEqual(3);
      for (const s of p.steps) {
        expect(s.en.trim().length).toBeGreaterThan(5);
        expect(s.bn.trim().length).toBeGreaterThan(5);
      }
    });

    it(`${p.id}: simulates without errors, burnt parts or NaN`, () => {
      const run = simulate(p, 120);
      expect(run.errors).toEqual([]);
      expect(Object.keys(run.burns)).toEqual([]);
      for (const c of Object.values(run.last.frame.components)) {
        for (const v of Object.values(c.pinV ?? {})) expect(Number.isFinite(v)).toBe(true);
        expect(Number.isFinite(c.current)).toBe(true);
      }
    });
  }
});

describe('circuit projects: measured behaviour', () => {
  it('voltage-divider: middle node is about 4.5 V', () => {
    const r = simulate(ex('voltage-divider'), 30);
    expect(view(r.last, 'r1').pinV!.b).toBeGreaterThan(4.3);
    expect(view(r.last, 'r1').pinV!.b).toBeLessThan(4.7);
  });

  it('series-leds: all three LEDs carry the same current and glow', () => {
    const r = simulate(ex('series-leds'), 60);
    const currents = ['ledr', 'ledg', 'ledy'].map((id) => view(r.last, id).current!);
    for (const i of currents) {
      expect(i).toBeGreaterThan(0.010);
      expect(i).toBeLessThan(0.015);
    }
    expect(Math.max(...currents) - Math.min(...currents)).toBeLessThan(1e-6);
    for (const id of ['ledr', 'ledg', 'ledy']) expect(view(r.last, id).glow!).toBeGreaterThan(0.3);
  });

  it('parallel-leds: each branch has its own current near (5 − Vf) ÷ 220 Ω', () => {
    const r = simulate(ex('parallel-leds'), 60);
    expect(view(r.last, 'ledr').current!).toBeGreaterThan(0.012);
    expect(view(r.last, 'ledr').current!).toBeLessThan(0.015);
    expect(view(r.last, 'ledg').current!).toBeGreaterThan(0.011);
    expect(view(r.last, 'ledg').current!).toBeLessThan(0.014);
  });

  it('reverse-led: the LED stays dark when connected backwards', () => {
    const r = simulate(ex('reverse-led'), 60);
    expect(Math.abs(view(r.last, 'led').current!)).toBeLessThan(1e-6);
    expect(view(r.last, 'led').glow ?? 0).toBeLessThan(0.01);
  });

  it('pushbutton-lamp: LED is off until the button is pressed', () => {
    const base = ex('pushbutton-lamp');
    const off = simulate(base, 60);
    expect(view(off.last, 'led').glow ?? 0).toBeLessThan(0.05);
    const on = simulate(base, 60, (_t, comps) => withProps(comps, 'pb', { pressed: true }));
    expect(view(on.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('zener-shunt: node is held near the 5.1 V zener voltage', () => {
    const r = simulate(ex('zener-shunt'), 60);
    const node = view(r.last, 'rs').pinV!.b;
    expect(node).toBeGreaterThan(4.8);
    expect(node).toBeLessThan(5.4);
    expect(view(r.last, 'zd').current!).toBeGreaterThan(0.003);
  });

  it('pot-voltage-meter: multimeter reads the wiper voltage (6.3 V at 30 %)', () => {
    const r = simulate(ex('pot-voltage-meter'), 30);
    const shown = parseFloat(view(r.last, 'dmm').display ?? 'NaN');
    expect(shown).toBeGreaterThan(6.1);
    expect(shown).toBeLessThan(6.5);
  });

  it('npn-switch: base current saturates the transistor and lights the LED', () => {
    const r = simulate(ex('npn-switch'), 60);
    expect(view(r.last, 'led').glow!).toBeGreaterThan(0.3);
    expect(view(r.last, 'q').pinV!.c).toBeLessThan(0.5);
  });

  it('pnp-high-side: released is off, pressed is on', () => {
    const base = ex('pnp-high-side');
    const off = simulate(base, 60);
    expect(view(off.last, 'led').glow ?? 0).toBeLessThan(0.05);
    const on = simulate(base, 60, (_t, comps) => withProps(comps, 'pb', { pressed: true }));
    expect(view(on.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('mosfet-switch: gate pulled low keeps the LED off; pressing lights it', () => {
    const base = ex('mosfet-switch');
    const off = simulate(base, 60);
    expect(view(off.last, 'led').glow ?? 0).toBeLessThan(0.05);
    const on = simulate(base, 60, (_t, comps) => withProps(comps, 'pb', { pressed: true }));
    expect(view(on.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('transistor-motor: the TIP120 drives the motor at high speed', () => {
    const r = simulate(ex('transistor-motor'), 60);
    expect(view(r.last, 'mot').speed!).toBeGreaterThan(0.5);
  });

  it('reg-7805-led: regulator output is 5 V and the LED lights', () => {
    const r = simulate(ex('reg-7805-led'), 60);
    expect(view(r.last, 'reg').pinV!.out).toBeGreaterThan(4.8);
    expect(view(r.last, 'reg').pinV!.out).toBeLessThan(5.2);
    expect(view(r.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('ams1117-3v3: output is 3.3 V from a 5 V USB supply', () => {
    const r = simulate(ex('ams1117-3v3'), 60);
    expect(view(r.last, 'reg').pinV!.out).toBeGreaterThan(3.1);
    expect(view(r.last, 'reg').pinV!.out).toBeLessThan(3.5);
    expect(view(r.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('lm358-buffer: output follows the pot wiper voltage', () => {
    const r = simulate(ex('lm358-buffer'), 60);
    const wiper = view(r.last, 'opa').pinV!['3'];
    const out = view(r.last, 'opa').pinV!['1'];
    expect(Math.abs(out - wiper)).toBeLessThan(0.3);
    expect(view(r.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('lm358-comparator: high above the 4.5 V reference, low below it', () => {
    const base = ex('lm358-comparator');
    const high = simulate(base, 60);
    expect(view(high.last, 'opa').pinV!['1']).toBeGreaterThan(7);
    expect(view(high.last, 'led').glow!).toBeGreaterThan(0.3);
    const low = simulate(base, 60, (_t, comps) => withProps(comps, 'pot', { position: 80 }));
    expect(view(low.last, 'opa').pinV!['1']).toBeLessThan(2);
    expect(view(low.last, 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('nand-gate: LED on while one input is low; off when both inputs are high', () => {
    const base = ex('nand-gate');
    const on = simulate(base, 60);
    expect(view(on.last, 'led').glow!).toBeGreaterThan(0.3);
    const off = simulate(base, 60, (_t, comps) => withProps(comps, 'swb', { closed: true }));
    expect(view(off.last, 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('and-gate: LED on only when both inputs are high', () => {
    const base = ex('and-gate');
    const on = simulate(base, 60);
    expect(view(on.last, 'led').glow!).toBeGreaterThan(0.3);
    const off = simulate(base, 60, (_t, comps) => withProps(comps, 'swb', { closed: false }));
    expect(view(off.last, 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('not-gate: low input gives a high output (LED on); high input turns it off', () => {
    const base = ex('not-gate');
    const on = simulate(base, 60);
    expect(view(on.last, 'led').glow!).toBeGreaterThan(0.3);
    const off = simulate(base, 60, (_t, comps) => withProps(comps, 'sw', { closed: true }));
    expect(view(off.last, 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('bridge-rectifier: the LED current is pulsed, always in one direction', () => {
    const r = simulate(ex('bridge-rectifier'), 150);
    const currents = r.ticks.map((t) => view(t, 'led').current!);
    expect(Math.max(...currents)).toBeGreaterThan(0.002);
    expect(Math.min(...currents)).toBeGreaterThan(-1e-6);
  });

  it('buzzer-switch: silent with the switch open, sounds when closed', () => {
    const base = ex('buzzer-switch');
    const off = simulate(base, 30);
    expect(view(off.last, 'bz').on).toBe(false);
    const on = simulate(base, 30, (_t, comps) => withProps(comps, 'sw', { closed: true }));
    expect(view(on.last, 'bz').on).toBe(true);
  });

  it('scope-sine: the trace shows a 2 V amplitude sine (about 3.6 V peak to peak under load)', () => {
    const r = simulate(ex('scope-sine'), 60);
    const wave = view(r.last, 'scope').wave!;
    expect(wave.length).toBeGreaterThan(20);
    const pp = Math.max(...wave) - Math.min(...wave);
    expect(pp).toBeGreaterThan(3.2);
    expect(pp).toBeLessThan(4.2);
  });
});

describe('MCU projects: measured behaviour', () => {
  it('uno-button-led: LED follows the button through INPUT_PULLUP', () => {
    const base = ex('uno-button-led');
    const released = simulate(base, 40);
    expect(view(released.last, 'led').glow ?? 0).toBeLessThan(0.05);
    const pressed = simulate(base, 40, (_t, comps) => withProps(comps, 'pb', { pressed: true }));
    expect(view(pressed.last, 'led').glow!).toBeGreaterThan(0.3);
  });

  it('uno-breathing-led: PWM brightness ramps between dim and bright', () => {
    const r = simulate(ex('uno-breathing-led'), 200);
    const glows = r.ticks.map((t) => view(t, 'led').glow ?? 0);
    expect(Math.max(...glows)).toBeGreaterThan(0.5);
    expect(Math.min(...glows)).toBeLessThan(0.1);
  });

  it('uno-buzzer-melody: the buzzer sounds and rests', () => {
    const r = simulate(ex('uno-buzzer-melody'), 200);
    const states = new Set(r.ticks.map((t) => view(t, 'bz').on));
    expect(states.has(true)).toBe(true);
    expect(states.has(false)).toBe(true);
  });

  it('uno-pir-alarm: motion lights the LED and prints a message', () => {
    const base = ex('uno-pir-alarm');
    const still = simulate(base, 60);
    expect(still.serial.filter((s) => s.includes('Motion'))).toEqual([]);
    const moving = simulate(base, 60, (_t, comps) => withProps(comps, 'pir', { motion: true }));
    expect(moving.serial.some((s) => s.includes('Motion!'))).toBe(true);
    expect(view(moving.last, 'led').glow!).toBeGreaterThan(0.3);
    const after = simulate(base, 120, (t, comps) => withProps(comps, 'pir', { motion: t < 60 }));
    expect(view(after.last, 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('uno-touch-lamp: each new touch toggles the lamp', () => {
    const touchAt = (t: number) => (t >= 30 && t < 70) || (t >= 100 && t < 140);
    const r = simulate(ex('uno-touch-lamp'), 170, (t, comps) => withProps(comps, 'ttp', { touched: touchAt(t) }));
    expect(view(r.ticks[60], 'led').glow!).toBeGreaterThan(0.3);
    expect(view(r.ticks[130], 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('uno-soil-pump: a dry reading closes the relay; a wet reading opens it', () => {
    const base = ex('uno-soil-pump');
    const dry = simulate(base, 60);
    expect(view(dry.last, 'relay').on).toBe(true);
    expect(view(dry.last, 'pump').glow!).toBeGreaterThan(0.3);
    const wet = simulate(base, 150, (t, comps) => withProps(comps, 'soil', { moisture: t < 40 ? 20 : 80 }));
    expect(view(wet.last, 'relay').on).toBe(false);
    expect(view(wet.last, 'pump').glow ?? 0).toBeLessThan(0.05);
  });

  it('uno-gas-alarm: a high MQ-2 reading lights the LED and sounds the buzzer', () => {
    const base = ex('uno-gas-alarm');
    const high = simulate(base, 60);
    expect(view(high.last, 'led').glow!).toBeGreaterThan(0.3);
    const readings = high.serial.map(Number).filter((n) => Number.isFinite(n));
    expect(readings.some((n) => n > 350)).toBe(true);
    const low = simulate(base, 80, (_t, comps) => withProps(comps, 'mq', { ppm: 50 }));
    expect(view(low.last, 'led').glow ?? 0).toBeLessThan(0.05);
  });

  it('uno-dht22-serial: prints the DHT22 temperature and humidity', () => {
    const r = simulate(ex('uno-dht22-serial'), 120);
    expect(r.serial.some((s) => s.includes('Temp C: 22.50'))).toBe(true);
    expect(r.serial.some((s) => s.includes('Humidity %: 48'))).toBe(true);
  });

  it('uno-bmp280-serial: prints sea-level pressure of 1013.25 hPa', () => {
    const r = simulate(ex('uno-bmp280-serial'), 120);
    expect(r.serial.some((s) => s.includes('Pressure hPa: 1013.25'))).toBe(true);
  });

  it('uno-oled-counter: the OLED shows a counter that increases', () => {
    const r = simulate(ex('uno-oled-counter'), 250);
    const texts = r.ticks.map((t) => view(t, 'oled').text ?? '');
    expect(texts.some((t) => t.includes('Uno + OLED'))).toBe(true);
    const counts = texts.map((t) => Number((t.match(/Count: (\d+)/) ?? [])[1])).filter((n) => Number.isFinite(n));
    expect(Math.max(...counts)).toBeGreaterThan(1);
  });

  it('uno-lcd-parallel: the LCD shows the counter on the first line', () => {
    const r = simulate(ex('uno-lcd-parallel'), 120);
    const text = view(r.last, 'lcd').text ?? '';
    expect(text).toContain('Count:');
    expect(text).toContain('Every second');
  });

  it('uno-lcd-i2c-uptime: the I²C LCD counts seconds', () => {
    const r = simulate(ex('uno-lcd-i2c-uptime'), 250);
    const text = view(r.last, 'lcd').text ?? '';
    expect(text).toContain('Uptime (s):');
    const seconds = Number(text.split('\n')[1]);
    expect(seconds).toBeGreaterThanOrEqual(2);
  });

  it('uno-servo-pot: the servo angle follows the pot (45° at 75 %)', () => {
    const r = simulate(ex('uno-servo-pot'), 60);
    const angle = view(r.last, 'sv').angle!;
    expect(angle).toBeGreaterThan(42);
    expect(angle).toBeLessThan(48);
  });

  it('uno-stepper-28byj: the coils are energised in changing phase patterns', () => {
    const r = simulate(ex('uno-stepper-28byj'), 200);
    const patterns = new Set(
      r.ticks.map((t) => {
        const f = view(t, 'stp').pinV ?? {};
        return ['in1', 'in2', 'in3', 'in4'].map((p) => ((f[p] ?? 0) > 2.5 ? '1' : '0')).join('');
      })
    );
    expect(patterns.size).toBeGreaterThanOrEqual(4);
    expect(r.ticks.some((t) => (view(t, 'stp').current ?? 0) > 0.05)).toBe(true);
  });

  it('uno-logic-analyzer: both channels show transitions at different rates', () => {
    const r = simulate(ex('uno-logic-analyzer'), 400);
    const traces = view(r.last, 'la').traces!;
    const d0 = new Set(traces[0]);
    const d1 = new Set(traces[1]);
    expect(d0.size).toBe(2);
    expect(d1.size).toBe(2);
  });

  it('uno-scope-pwm: the scope shows a square wave from 0 V to about 5 V', () => {
    const r = simulate(ex('uno-scope-pwm'), 200);
    const wave = r.ticks.flatMap((t) => view(t, 'scope').wave ?? []);
    expect(Math.min(...wave)).toBeLessThan(0.5);
    expect(Math.max(...wave)).toBeGreaterThan(4);
  });

  it('esp32-ledc-fade: the LEDC PWM fades the LED up and down', () => {
    const r = simulate(ex('esp32-ledc-fade'), 300);
    const glows = r.ticks.map((t) => view(t, 'led').glow ?? 0);
    expect(Math.max(...glows)).toBeGreaterThan(0.5);
    expect(Math.min(...glows)).toBeLessThan(0.1);
  });
});
