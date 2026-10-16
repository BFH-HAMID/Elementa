/**
 * Deterministic, time-stepped EDUCATIONAL vehicle model for the guided builds.
 * The bench's MNA circuit supplies motor/supply observations. This model adds
 * bounded 2-D motion, a first-order vertical response for quads, a simple
 * energy budget, obstacle/range checks and fail-safe states. It is NOT an
 * aerodynamic solver, GNSS/RF emulator, autopilot or flight-safety assessment.
 * No DOM/React dependencies: fast to test and safe to run in the browser.
 */
import type { AdvancedProject } from '../projects/catalog-advanced';

export type MissionStatus = 'ready' | 'moving' | 'hovering' | 'holding' | 'avoiding' | 'returning' | 'landing' | 'gps-lost' | 'link-lost' | 'low-battery' | 'collision' | 'arrived' | 'no-power';
export interface MissionState {
  t: number; x: number; y: number; z: number; heading: number;
  speed: number; vz: number; batteryWh: number; batteryPercent: number;
  voltage: number; current: number; gpsLat: number; gpsLng: number;
  gpsFix: boolean; linkQuality: number; cameraFeed: boolean;
  status: MissionStatus; track: { x: number; y: number }[];
}
export interface MissionControls {
  throttle: number; // 0…100 receiver training channel
  steering: number; // -100…100 receiver steering channel
  forward: number; // -100…100 drone pitch, system-level only
  wind: number; // m/s, signed eastward drift; deliberately simplified
  gpsBlocked: boolean;
  obstacle: boolean;
  linkEnabled: boolean;
  holdAltitude: number;
}
export interface BenchObservation {
  power: boolean; // verified PDB/BMS + voltage, not USB-powered MCU alone
  /** 0…1, measured from connected ESC→motor or H-bridge→DC motor. */
  actuator: number;
  sourceCurrent: number; // measured pack current (A), may omit regulator input losses
  gpsPowered: boolean;
  sonarPowered: boolean;
  receiverLinked: boolean;
  cameraReady: boolean;
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : 0));
const rad = (deg: number) => deg * Math.PI / 180;
const wrap = (deg: number) => ((deg + 540) % 360) - 180;
export const HOME = { lat: 23.8103, lng: 90.4125 }; // illustrative Dhaka coordinates, no actual GNSS request
export const OBSTACLE = { x: 18, y: 0, radius: 3 };

/** Battery energy is estimated at nominal voltage, starting at ~60 % SoC to
 * match the nominal (rather than fully charged) voltage drawn on the bench. */
export function packCapacityWh(project: AdvancedProject, mah = 2200): number {
  const cells = project.kind === 'drone' ? 3 : project.kind === 'bench' ? 1 : 2;
  return cells * 3.7 * mah / 1000;
}
export function initialMission(project: AdvancedProject, mah = 2200): MissionState {
  const cells = project.kind === 'drone' ? 3 : project.kind === 'bench' ? 1 : 2;
  return {
    t: 0, x: 0, y: 0, z: 0, heading: 0, speed: 0, vz: 0,
    batteryWh: packCapacityWh(project, mah) * 0.6, batteryPercent: 60,
    voltage: cells * 3.75, current: 0,
    gpsLat: HOME.lat, gpsLng: HOME.lng, gpsFix: false,
    linkQuality: 100, cameraFeed: false, status: 'ready', track: [{ x: 0, y: 0 }]
  };
}

export function stepMission(
  state: MissionState, project: AdvancedProject, controls: MissionControls,
  measured: BenchObservation, dtSeconds: number, mah = 2200
): MissionState {
  const dt = clamp(dtSeconds, 0, 0.25);
  if (dt === 0 || project.kind === 'bench') return state;
  const t = state.t + dt;
  const capacity = packCapacityWh(project, mah);
  const cells = project.kind === 'drone' ? 3 : 2;
  const pct = clamp(state.batteryWh / capacity, 0, 1);
  const distance = Math.hypot(state.x, state.y);
  const linkQuality = project.radioRange > 0 ? clamp(100 * Math.pow(Math.max(0, 1 - distance / project.radioRange), 1.4), 0, 100) : 0;
  const linked = measured.receiverLinked && controls.linkEnabled && linkQuality > 2;
  const gpsFix = project.features.includes('gps') && measured.gpsPowered && !controls.gpsBlocked;
  const lowBattery = pct <= 0.12 || state.voltage <= cells * 3.25;
  const safeActuator = measured.power ? clamp(measured.actuator, 0, 1) : 0;
  let status: MissionStatus = 'moving';
  if (!measured.power) status = 'no-power';
  else if (lowBattery) status = project.kind === 'drone' ? 'landing' : 'low-battery';
  // A GPS fix alone cannot bring a powerless quad home. The circuit must
  // maintain motor drive via its explicitly enabled *training* link-loss mode.
  else if (!linked) status = project.kind === 'drone' ? (gpsFix && safeActuator > 0.25 ? 'returning' : 'landing') : 'link-lost';
  else if ((project.mode === 'waypoint' || project.mode === 'geofence' || project.mode === 'return') && !gpsFix) status = 'gps-lost';
  else if (project.mode === 'hold') status = 'holding';

  let heading = state.heading;
  let steer = clamp(controls.steering / 100, -1, 1);
  const target = status === 'returning' ? { x: 0, y: 0 } : project.target;
  const toTarget = Math.hypot(target.x - state.x, target.y - state.y);
  const wantsRoute = status === 'returning' || (status === 'moving' && project.mode === 'waypoint');
  const boundary = project.kind === 'drone' ? 70 : 27;
  const fenced = project.mode === 'geofence' && distance >= boundary && gpsFix;
  if (fenced) status = 'returning';
  if ((wantsRoute || fenced) && gpsFix) {
    const direction = Math.atan2(target.y - state.y, target.x - state.x) * 180 / Math.PI;
    steer = clamp(wrap(direction - heading) / 35, -1, 1);
  }
  if ((wantsRoute || fenced) && toTarget < 2.5 && !fenced) status = 'arrived';

  // Forward ray against a single circular obstacle in local map coordinates.
  // Sonar is deliberately treated as a limited forward-looking sensor.
  const dx = OBSTACLE.x - state.x;
  const dy = OBSTACLE.y - state.y;
  const front = dx * Math.cos(rad(heading)) + dy * Math.sin(rad(heading));
  const side = Math.abs(-dx * Math.sin(rad(heading)) + dy * Math.cos(rad(heading)));
  const nearObstacle = controls.obstacle && front > 0 && front < 9 && side < OBSTACLE.radius + 1.5;
  if (nearObstacle && measured.sonarPowered && project.features.includes('sonar') && status !== 'landing') {
    status = 'avoiding';
    steer = state.y >= OBSTACLE.y ? 1 : -1;
  }
  const collision = controls.obstacle && Math.hypot(dx, dy) < OBSTACLE.radius && state.z < 2;
  // Sonar makes avoidance possible, not collision impossible; a bad approach
  // must never let the drawn vehicle pass through a physical map obstacle.
  if (collision) status = 'collision';

  const turnRate = project.kind === 'drone' ? 80 : project.kind === 'boat' ? 45 : 110;
  heading = (heading + steer * turnRate * dt + 360) % 360;
  const halt = ['no-power','low-battery','gps-lost','link-lost','collision','arrived'].includes(status);
  let targetSpeed = halt ? 0 : project.maxSpeed * safeActuator;
  if (project.kind === 'drone') {
    const forward = (project.mode === 'manual' || project.mode === 'hold') && status !== 'returning' ? Math.abs(clamp(controls.forward / 100, -1, 1)) : 0.65;
    targetSpeed *= state.z > 0.3 ? forward : 0;
  }
  if (status === 'avoiding') targetSpeed *= 0.5;
  if (status === 'returning') targetSpeed *= 0.7;
  const response = project.kind === 'boat' ? 0.7 : 2;
  const speed = Math.max(0, state.speed + (targetSpeed - state.speed) * clamp(response * dt, 0, 1));

  let z = state.z;
  let vz = state.vz;
  if (project.kind === 'drone') {
    let wantVZ = clamp((safeActuator - 0.5) * 4, -1.2, 1.4);
    if (status === 'holding' && safeActuator > 0.25) wantVZ = clamp((controls.holdAltitude - z) * 0.65, -1.2, 1.2);
    if (status === 'returning' && safeActuator > 0.25) wantVZ = clamp((6 - z) * 0.5, -1, 1);
    if (status === 'landing' || !measured.power) wantVZ = -1;
    if (status === 'arrived') wantVZ = -0.6;
    vz += (wantVZ - vz) * clamp(dt * 2.4, 0, 1);
    z = Math.max(0, z + vz * dt);
    if (z === 0 && vz < 0) vz = 0;
  }
  let x = state.x + Math.cos(rad(heading)) * speed * dt;
  let y = state.y + Math.sin(rad(heading)) * speed * dt;
  if (project.kind === 'drone' && z > 0.1) x += clamp(controls.wind, -12, 12) * 0.12 * dt;
  if (status === 'collision') { x = state.x; y = state.y; }
  if (status === 'moving' && project.kind === 'drone' && z > 0.1 && speed < 0.1) status = 'hovering';
  else if (status === 'moving' && speed < 0.05 && z < 0.1 && safeActuator < 0.02) status = 'ready';

  // Bench source current is measured, but the BEC input current is not fully
  // modelled by MNA. Include a conservative electronics/propulsion estimate.
  const estimateA = project.kind === 'drone' ? 0.35 + 21 * safeActuator * safeActuator : 0.24 + 2.1 * safeActuator * safeActuator;
  const current = measured.power ? clamp(Math.max(Math.abs(measured.sourceCurrent), estimateA), 0, 35) : 0;
  const voltage = measured.power ? Math.max(cells * 3, cells * (3.3 + 0.75 * pct) - current * (project.kind === 'drone' ? 0.055 : 0.08)) : 0;
  const batteryWh = Math.max(0, state.batteryWh - voltage * current * dt / 3600);
  const batteryPercent = clamp(batteryWh / capacity * 100, 0, 100);
  // A deterministic ±~2 m perturbation, no global location permission needed.
  const noise = gpsFix ? 1.8 : 0;
  const gpsLat = HOME.lat + (y + noise * Math.sin(t * 0.9)) / 111320;
  const gpsLng = HOME.lng + (x + noise * Math.sin(t * 0.65 + 1)) / (111320 * Math.cos(rad(HOME.lat)));
  const track = [...state.track];
  if (Math.hypot(x - track[track.length - 1].x, y - track[track.length - 1].y) > 0.45) {
    track.push({ x, y });
    if (track.length > 160) track.shift();
  }
  return { t, x, y, z, heading, speed, vz, batteryWh, batteryPercent, voltage, current,
    gpsLat, gpsLng, gpsFix, linkQuality, cameraFeed: project.features.includes('camera') && measured.cameraReady && linked,
    status, track };
}
