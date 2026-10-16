import { describe, expect, it } from 'vitest';
import { ADVANCED_PROJECTS, getAdvancedProject, type AdvancedProject } from '../projects/catalog-advanced';
import { inspectAdvancedBuild } from '../projects/validateAdvanced';
import { getPart } from '../parts/registry';
import { CircuitEngine } from '../simulator/engine';
import type { PlacedComponent, PlacedWire } from '../types';
import { useCircuitStore } from '@/store/circuitStore';

const get = (id: string): AdvancedProject => {
  const project = getAdvancedProject(id);
  if (!project) throw new Error(id);
  return project;
};
function run(project: AdvancedProject, update?: (comps: PlacedComponent[]) => PlacedComponent[], removeWire?: (wire: PlacedWire) => boolean, steps = 5) {
  const engine = new CircuitEngine();
  const components = update ? update(project.components) : project.components;
  const wires = removeWire ? project.wires.filter((w) => !removeWire(w)) : project.wires;
  let result = engine.tick({ components, wires, wallMs: 16, speed: 1, running: false });
  for (let i = 1; i < steps; i++) result = engine.tick({ components, wires, wallMs: 16, speed: 1, running: false });
  return result;
}
function props(comps: PlacedComponent[], id: string, changes: Record<string, number | string | boolean>) {
  return comps.map((c) => c.id === id ? { ...c, props: { ...c.props, ...changes } } : c);
}

describe('guided advanced builds', () => {
  it('ships exactly 20 unique bilingual builds with a distinct bench harness, steps and safety', () => {
    expect(ADVANCED_PROJECTS).toHaveLength(20);
    expect(new Set(ADVANCED_PROJECTS.map((p) => p.id)).size).toBe(20);
    expect(new Set(ADVANCED_PROJECTS.map((p) => p.kind))).toEqual(new Set(['drone','rover','boat','bench']));
    for (const p of ADVANCED_PROJECTS) {
      expect(p.difficulty).toBe('advanced');
      expect(p.components.length).toBeGreaterThanOrEqual(4);
      expect(p.wires.length).toBeGreaterThanOrEqual(4);
      expect(p.essentialWires.length).toBeGreaterThanOrEqual(3);
      expect(p.steps.length).toBeGreaterThanOrEqual(5);
      for (const field of [p.title, p.summary, p.explanation, p.safety, p.expected, ...p.steps]) {
        expect(field.en.trim().length).toBeGreaterThan(12);
        expect(field.bn.trim().length).toBeGreaterThan(12);
      }
    }
  });

  it('contains all referenced drone boards plus the existing GPS, IMU and motor drivers', () => {
    for (const id of ['flight-controller-f4','esc-30a','pdb-5v','bms-1s','motor-driver-tb6612fng','gps-neo6m','rc-receiver','mpu6050','fpv-camera','vtx-58','telemetry-sik','brushless-2205','lipo-2s','lipo-3s']) {
      const part = getPart(id);
      expect(part, id).toBeDefined();
      expect(part?.ratings.length, id).toBeGreaterThan(1);
      expect(new Set(part?.pins.map((p) => p.id)).size, id).toBe(part?.pins.length);
    }
  });

  for (const p of ADVANCED_PROJECTS) {
    it(`${p.id}: all wires reference real pins; intact harness passes its checklist`, () => {
      const instances = new Map(p.components.map((c) => [c.id, c]));
      expect(instances.size).toBe(p.components.length);
      expect(new Set(p.wires.map((w) => w.id)).size).toBe(p.wires.length);
      for (const w of p.wires) for (const end of [w.from,w.to]) {
        expect(end).not.toBeNull();
        const instance = instances.get(end!.compId);
        expect(instance, `${p.id}:${w.id}`).toBeDefined();
        expect(getPart(instance!.partId)?.pins.some((pin) => pin.id === end!.pinId), `${p.id}:${w.id}:${end!.pinId}`).toBe(true);
      }
      expect(inspectAdvancedBuild(p, p.components, p.wires, null)).toEqual([]);
    });

    it(`${p.id}: has a stable, non-burning idle operating point`, () => {
      const res = run(p);
      expect(res.errors, p.id).toEqual([]);
      expect(res.burns, p.id).toEqual({});
      for (const component of Object.values(res.frame.components)) {
        expect(Number.isFinite(component.current)).toBe(true);
        for (const voltage of Object.values(component.pinV)) expect(Number.isFinite(voltage)).toBe(true);
      }
    });
  }
});

describe('workbench integration', () => {
  it('loads all 20 wired builds through the normal toolbar/store entry and exports them', () => {
    for (const project of ADVANCED_PROJECTS) {
      useCircuitStore.getState().loadExample(project.id);
      const state = useCircuitStore.getState();
      expect(state.activeExampleId).toBe(project.id);
      expect(state.running).toBe(false);
      expect(state.components).toHaveLength(project.components.length);
      expect(state.wires).toHaveLength(project.wires.length);
      expect(state.toProject().components).toHaveLength(project.components.length);
      expect(state.toProject().wires).toHaveLength(project.wires.length);
    }
  });
});

describe('drone/rover circuit behaviour, not just catalogue text', () => {
  const quad = get('drone-fpv-gps');
  it('3S → PDB regulated 5 V powers FC, receiver, GPS and FPV, while raw VBAT feeds ESC', () => {
    const f = run(quad).frame;
    expect(f.components.pdb.powered).toBe(true);
    expect(f.components.fc.powered).toBe(true);
    expect(f.components.rx.on).toBe(true);
    expect(f.components.gps.powered).toBe(true);
    expect(f.components.vtx.on).toBe(true);
    expect(f.components.fc.pinV.vcc).toBeGreaterThan(4.5);
    expect(f.components.fc.pinV.vcc).toBeLessThan(5.6);
    expect(f.components.esc1.pinV.vbat).toBeGreaterThan(9);
    expect(f.components.motor1.speed).toBe(0); // safe default: disarmed
  });
  it('arming + receiver throttle drives four correctly wired ESC motors and raises pack draw', () => {
    const idle = run(quad).frame.sourceCurrents.bat;
    const active = run(quad, (cs) => props(props(cs, 'fc', { armed: true }), 'rx', { throttle: 70 }), undefined, 9);
    expect(active.errors).toEqual([]);
    for (let i = 1; i <= 4; i++) {
      expect(active.frame.components[`esc${i}`].speed ?? 0).toBeGreaterThan(0.4);
      expect(active.frame.components[`motor${i}`].speed ?? 0).toBeGreaterThan(0.4);
    }
    expect(active.frame.sourceCurrents.bat).toBeGreaterThan(idle + 1);
    expect(active.burns).toEqual({});
  });
  it('a missing motor phase prevents apparent motor rotation; a broken video wire kills the VTX signal', () => {
    const phase = run(quad, (cs) => props(props(cs,'fc',{armed:true}),'rx',{throttle:70}), (w) => w.from?.compId === 'esc1' && w.from.pinId === 'v', 9);
    expect(phase.frame.components.esc1.speed ?? 0).toBeGreaterThan(0.2);
    expect(phase.frame.components.motor1.speed).toBe(0);
    const video = run(quad, undefined, (w) => w.from?.compId === 'cam' && w.from.pinId === 'video');
    expect(video.frame.components.cam.powered).toBe(true);
    expect(video.frame.components.vtx.on).toBe(false);
    const missing = inspectAdvancedBuild(quad, quad.components, quad.wires.filter((w) => w.from?.compId !== 'cam' || w.from.pinId !== 'video'), null);
    expect(missing.some((issue) => issue.en.includes('VIDEO') || issue.en.includes('video'))).toBe(true);
  });
  it('RC loss uses assisted throttle only with an enabled FC and a connected, powered GPS', () => {
    const lost = run(quad, (cs) => props(props(cs, 'fc', { armed: true }), 'rx', { throttle: 80, link: false }), undefined, 9);
    expect(lost.frame.components.rx.on).toBe(false);
    expect(lost.frame.components.motor1.speed ?? 0).toBeGreaterThan(0.5);
    expect(lost.burns).toEqual({});
    const disabled = run(quad, (cs) => props(props(cs, 'fc', { armed: true, assistedRth: false }), 'rx', { throttle: 80, link: false }), undefined, 9);
    expect(disabled.frame.components.motor1.speed).toBe(0);
    const noGps = run(quad, (cs) => props(props(cs, 'fc', { armed: true }), 'rx', { throttle: 80, link: false }), (w) => w.from?.compId === 'pdb' && w.to?.compId === 'gps' && w.to.pinId === 'vcc', 9);
    expect(noGps.frame.components.motor1.speed).toBe(0);
    const racing = get('drone-racing-fpv');
    const noAssistance = run(racing, (cs) => props(props(cs, 'fc', { armed: true }), 'rx', { throttle: 80, link: false }), undefined, 9);
    expect(noAssistance.frame.components.motor1.speed).toBe(0);
  });
  it('1S protection passes current at 3.7 V, opens under 3.0 V or when tripped', () => {
    const bench = get('bms-safety-bench');
    const normal = run(bench).frame;
    expect(normal.components.pcm.on).toBe(true);
    expect(normal.components.led.current).toBeGreaterThan(0.002);
    const low = run(bench, (cs) => props(cs,'bat',{volts:2.9}), undefined, 7).frame;
    expect(low.components.pcm.on).toBe(false);
    expect(low.components.led.current).toBeLessThan(1e-4);
    const fault = run(bench, (cs) => props(cs,'pcm',{fault:true})).frame;
    expect(fault.components.led.current).toBeLessThan(1e-4);
  });
  it('rover sketch drives two motors from receiver channels and cuts drive on link loss', () => {
    const car = get('rc-camera-car');
    const moved = run(car, (cs) => props(cs,'rx',{throttle:65}), undefined, 5);
    expect(moved.errors).toEqual([]);
    // MCU sketch advances only while running, after its USB/PDB supply settles.
    const engine = new CircuitEngine();
    const cs = props(car.components, 'rx', { throttle: 65 });
    for (let i = 0; i < 3; i++) engine.tick({ components: cs, wires: car.wires, wallMs: 16, speed: 1, running: false });
    let result = engine.tick({ components: cs, wires: car.wires, wallMs: 16, speed: 1, running: true });
    for (let i = 0; i < 8; i++) result = engine.tick({ components: cs, wires: car.wires, wallMs: 16, speed: 1, running: true });
    expect(result.errors).toEqual([]);
    expect(result.frame.components.left.speed ?? 0).toBeGreaterThan(0.05);
    expect(result.frame.components.right.speed ?? 0).toBeGreaterThan(0.05);
    const lost = props(cs, 'rx', { link: false });
    for (let i = 0; i < 8; i++) result = engine.tick({ components: lost, wires: car.wires, wallMs: 16, speed: 1, running: true });
    expect(result.frame.components.rx.on).toBe(false);
    expect(result.frame.components.left.speed ?? 0).toBeLessThan(0.05);
  });
});
