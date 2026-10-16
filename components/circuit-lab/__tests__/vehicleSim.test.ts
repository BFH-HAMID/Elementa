import { describe, expect, it } from 'vitest';
import { getAdvancedProject, type AdvancedProject } from '../projects/catalog-advanced';
import { initialMission, packCapacityWh, stepMission, type BenchObservation, type MissionControls } from '../simulator/vehicleSim';

const project = (id: string): AdvancedProject => {
  const p = getAdvancedProject(id);
  if (!p) throw new Error(id);
  return p;
};
const controls: MissionControls = { throttle: 70, steering: 0, forward: 70, wind: 0, gpsBlocked: false, obstacle: false, linkEnabled: true, holdAltitude: 6 };
const bench: BenchObservation = { power: true, actuator: 0.72, sourceCurrent: 9, gpsPowered: true, sonarPowered: true, receiverLinked: true, cameraReady: true };

describe('linked educational mission model', () => {
  it('flies a quad and drains battery at a finite, measured-current-dependent rate', () => {
    const p = project('drone-fpv-gps');
    let state = initialMission(p);
    expect(state.batteryWh).toBeCloseTo(0.6 * packCapacityWh(p));
    for (let i = 0; i < 100; i++) state = stepMission(state, p, controls, bench, 0.1);
    expect(state.t).toBeCloseTo(10);
    expect(state.z).toBeGreaterThan(0);
    expect(state.x).toBeGreaterThan(0);
    expect(state.speed).toBeGreaterThan(0);
    expect(state.batteryWh).toBeLessThan(initialMission(p).batteryWh);
    expect(state.gpsFix).toBe(true);
    expect(state.cameraFeed).toBe(true);
    expect(state.track.length).toBeGreaterThan(1);
  });
  it('loses the camera feed if video stops; cannot navigate on a stale GPS fix', () => {
    const p = project('gps-survey-boat');
    let s = stepMission(initialMission(p), p, controls, { ...bench, cameraReady: false }, 0.1);
    expect(s.cameraFeed).toBe(false);
    s = stepMission(s, p, { ...controls, gpsBlocked: true }, bench, 0.1);
    expect(s.gpsFix).toBe(false);
    expect(s.status).toBe('gps-lost');
  });
  it('enters return-to-home on radio loss with GPS; lands instead without a fix', () => {
    const p = project('drone-rth-failsafe');
    const away = { ...initialMission(p), x: 20, z: 6 };
    const lost = { ...bench, receiverLinked: false };
    expect(stepMission(away,p,controls,lost,0.1).status).toBe('returning');
    expect(stepMission(away,p,{ ...controls, gpsBlocked: true },lost,0.1).status).toBe('landing');
    expect(stepMission(away,p,controls,{ ...lost, actuator: 0 },0.1).status).toBe('landing');
  });
  it('stops a rover on link loss or low battery regardless of a stale motor observation', () => {
    const p = project('rc-camera-car');
    const moving = { ...initialMission(p), speed: 1, x: 5 };
    const lost = stepMission(moving,p,controls,{ ...bench, receiverLinked: false },0.1);
    expect(lost.status).toBe('link-lost');
    expect(lost.speed).toBeLessThan(moving.speed);
    const empty = stepMission({ ...moving, batteryWh: packCapacityWh(p) * 0.08 },p,controls,bench,0.1);
    expect(empty.status).toBe('low-battery');
  });
  it('uses a powered sonar to divert, and stops at an unobserved collision', () => {
    const p = project('collision-avoid-car');
    const approach = { ...initialMission(p), x: 11, y: 0, speed: 1 };
    const sensed = stepMission(approach,p,{ ...controls, obstacle: true },bench,0.1);
    expect(sensed.status).toBe('avoiding');
    const near = { ...approach, x: 16 };
    const blind = stepMission(near,p,{ ...controls, obstacle: true },{ ...bench, sonarPowered: false },0.1);
    expect(blind.status).toBe('collision');
    expect(blind.x).toBe(near.x);
    const late = stepMission(near,p,{ ...controls, obstacle: true },{ ...bench, sonarPowered: true },0.1);
    expect(late.status).toBe('collision'); // sonar cannot make a physical obstacle intangible
  });
  it('handles missing power and aggressive inputs without NaN or negative charge', () => {
    const p = project('drone-fpv-gps');
    let s = initialMission(p);
    for (let i = 0; i < 100; i++) s = stepMission(s,p,{ ...controls, wind: 1e5, throttle: -50 },{ ...bench, power: false, sourceCurrent: Number.NaN },0.5);
    expect(s.status).toBe('no-power');
    expect(s.z).toBe(0);
    expect(s.current).toBe(0);
    expect(s.batteryWh).toBeGreaterThanOrEqual(0);
    for (const value of [s.x,s.y,s.z,s.speed,s.voltage,s.gpsLat,s.gpsLng,s.heading]) expect(Number.isFinite(value)).toBe(true);
  });
});
