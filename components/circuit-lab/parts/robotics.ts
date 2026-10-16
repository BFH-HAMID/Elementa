/**
 * Drone / robotics training modules. Pin names describe *connectors*, not a
 * particular manufacturer's pad order: always check the actual board's
 * datasheet before wiring hardware. The electrical models are documented in
 * simulator/solver.ts; video, RF and three-phase commutation are not emulated.
 */
import type { PartDef, PinDef, PinKind, PropDef } from '../types';

function pin(id: string, label: string, x: number, y: number, kind: PinKind, func: string): PinDef {
  return { id, label, x, y, kind, func };
}
function number(key: string, label: string, min: number, max: number, step: number, unit: string): PropDef {
  return { key, label, type: 'number', min, max, step, unit };
}

export const ROBOTICS_PARTS: PartDef[] = [
  {
    id: 'flight-controller-f4', category: 'robotics', family: 'robotics',
    name: 'F4 flight controller (training)', partNumber: 'F405-FC-TRAIN', w: 120, h: 100,
    pins: [
      pin('vcc', '5V', 0, 20, 'vcc', 'Regulated 5 V input; NOT raw LiPo'),
      pin('gnd', 'GND', 0, 35, 'gnd', 'Common ground'),
      pin('rc', 'RC', 0, 50, 'ain', 'Training receiver throttle, 0–3.3 V (not decoded SBUS)'),
      pin('scl', 'SCL', 0, 65, 'io', 'I²C clock for IMU'),
      pin('sda', 'SDA', 0, 80, 'io', 'I²C data for IMU'),
      pin('aux1', 'AUX1', 20, 0, 'io', 'Accessory trigger (training only)'),
      pin('aux2', 'AUX2', 60, 0, 'ain', 'Accessory input; 3.3 V MAX'),
      pin('aux3', 'AUX3', 100, 0, 'pwm', 'Gimbal control (training only)'),
      pin('esc1', 'M1', 120, 15, 'pwm', 'ESC 1 control (abstracted command)'),
      pin('esc2', 'M2', 120, 35, 'pwm', 'ESC 2 control'),
      pin('esc3', 'M3', 120, 55, 'pwm', 'ESC 3 control'),
      pin('esc4', 'M4', 120, 75, 'pwm', 'ESC 4 control'),
      pin('gpsrx', 'GPS RX', 20, 100, 'io', 'UART RX ← GPS TX'),
      pin('gpstx', 'GPS TX', 45, 100, 'io', 'UART TX → GPS RX'),
      pin('teletx', 'TEL TX', 75, 100, 'io', 'UART TX → telemetry RX'),
      pin('telerx', 'TEL RX', 100, 100, 'io', 'UART RX ← telemetry TX')
    ],
    props: [
      { key: 'armed', label: 'Armed (remove propellers on bench)', type: 'boolean' },
      { key: 'assistedRth', label: 'Assisted link-loss throttle (TRAINING ONLY)', type: 'boolean' },
      number('throttle', 'Manual throttle (no RC)', 0, 100, 1, '%')
    ],
    defaults: { armed: false, assistedRth: false, throttle: 0 }, model: { type: 'robotics', variant: 'flight-controller' },
    description: 'Educational F4 flight-controller *interface*. Powered and armed, it forwards receiver throttle to four ESC command pins. If enabled, assisted link-loss mode supplies a training hover command ONLY with a powered wired GPS; the separate 2-D mission trainer then demonstrates a route home. It is NOT actual flight firmware, stabilization, PID, SBUS or a real failsafe.',
    ratings: ['Input 5 V regulated; never connect raw 2S/3S LiPo', '3.3 V logic / ESC signal', 'Assisted RTH is synthetic; independently test actual firmware and GPS lock', 'Remove propellers for every bench power-on'],
    art: { chipLabel: 'STM32 F4', bodyColor: '#184f78' }
  },
  {
    id: 'esc-30a', category: 'robotics', family: 'robotics', name: 'Brushless ESC (30 A class)', partNumber: 'BLHELI-30A-TRAIN', w: 100, h: 70,
    pins: [
      pin('vbat', 'VBAT', 0, 15, 'vin', 'Raw 2S–4S LiPo positive from PDB'),
      pin('gnd', 'GND', 0, 35, 'gnd', 'Battery negative / signal ground'),
      pin('sig', 'SIG', 0, 55, 'ain', 'ESC control, 3.3 V-compatible training input'),
      pin('u', 'U', 100, 15, 'io', 'Brushless motor phase U'),
      pin('v', 'V', 100, 35, 'io', 'Brushless motor phase V'),
      pin('w', 'W', 100, 55, 'io', 'Brushless motor phase W')
    ],
    props: [], defaults: {}, model: { type: 'robotics', variant: 'esc' },
    description: '2S–4S brushless ESC. The bench models arming, supply sag, an averaged current load and commanded speed. U/V/W show *illustrative* phase voltages, not actual BLHeli commutation or a validated 30 A thermal model.',
    ratings: ['Battery 2S–4S (7.4–16.8 V nominal range)', '30 A class; real current rating depends on cooling', 'No integrated 5 V BEC in this model', 'Never test with a fitted propeller indoors'],
    art: { chipLabel: 'ESC 30A', bodyColor: '#182c40' }
  },
  {
    id: 'pdb-5v', category: 'robotics', family: 'robotics', name: 'Power distribution board + 5 V BEC', partNumber: 'PDB-4WAY-5V', w: 130, h: 105,
    pins: [
      pin('batp', 'BAT+', 0, 35, 'vin', '2S–4S LiPo positive input'),
      pin('batn', 'BAT−', 0, 65, 'gnd', 'Battery negative input'),
      pin('esc1p', 'ESC1+', 130, 15, 'vin', 'Raw VBAT out to ESC 1'),
      pin('esc2p', 'ESC2+', 130, 35, 'vin', 'Raw VBAT out to ESC 2'),
      pin('esc3p', 'ESC3+', 130, 55, 'vin', 'Raw VBAT out to ESC 3'),
      pin('esc4p', 'ESC4+', 130, 75, 'vin', 'Raw VBAT out to ESC 4'),
      pin('v5', '5V', 130, 95, 'vcc', 'Regulated 5 V; 2 A total, never raw VBAT'),
      pin('gnd1', 'G1', 15, 105, 'gnd', 'ESC 1 return'),
      pin('gnd2', 'G2', 40, 105, 'gnd', 'ESC 2 return'),
      pin('gnd3', 'G3', 65, 105, 'gnd', 'ESC 3 return'),
      pin('gnd4', 'G4', 90, 105, 'gnd', 'ESC 4 return'),
      pin('gnd5', 'G5', 115, 105, 'gnd', '5 V return')
    ],
    props: [], defaults: {}, model: { type: 'robotics', variant: 'pdb' },
    description: 'Four raw VBAT outputs and an isolated-from-VBAT 5 V regulator. Copper paths have a small simulated resistance; the 5 V rail only turns on above 6 V. Use an appropriately rated fuse in a real build.',
    ratings: ['VBAT 2S–4S', '5 V BEC up to 2 A (training estimate)', 'Raw ESC pads are NOT 5 V', 'Choose a real PDB/fuse to match motor current'],
    art: { chipLabel: 'PDB · 5V', bodyColor: '#174966' }
  },
  {
    id: 'bms-1s', category: 'robotics', family: 'robotics', name: '1S Li-ion protection board', partNumber: 'PCM-1S-2A', w: 95, h: 65,
    pins: [
      pin('bpos', 'B+', 0, 15, 'vin', '1S cell positive, 3.0–4.2 V'),
      pin('bneg', 'B−', 0, 45, 'io', 'Cell negative (separate from protected OUT−)'),
      pin('outpos', 'OUT+', 95, 15, 'vcc', 'Protected load positive'),
      pin('outneg', 'OUT−', 95, 45, 'gnd', 'Protected load negative')
    ],
    props: [{ key: 'fault', label: 'Protection trip (simulate fault)', type: 'boolean' }], defaults: { fault: false },
    model: { type: 'robotics', variant: 'bms' },
    description: 'Single-cell protection switch: disconnects both output paths if the cell is below 3.0 V, above 4.25 V or a fault is set. This is NOT a charger, and is NOT suitable for powering a multi-cell high-current drone.',
    ratings: ['1S only, 3.0–4.2 V', 'Training load ≤ 2 A', 'Use a certified charger separately', 'Never place in the 3S ESC current path'],
    art: { chipLabel: '1S PCM', bodyColor: '#135761' }
  },
  {
    id: 'rc-receiver', category: 'robotics', family: 'robotics', name: '2.4 GHz RC receiver (trainer)', partNumber: 'RX-2CH-SBUS', w: 90, h: 75,
    pins: [
      pin('vcc', '5V', 0, 20, 'vcc', 'Receiver 5 V supply'), pin('gnd', 'GND', 0, 40, 'gnd', 'Common ground'),
      pin('ch1', 'CH1', 90, 15, 'io', 'Training steering channel, analogue 0–3.3 V'),
      pin('ch2', 'CH2', 90, 35, 'io', 'Training throttle channel, analogue 0–3.3 V'),
      pin('sbus', 'SBUS', 90, 55, 'io', 'SBUS connection shown only; NOT decoded by the simulator')
    ],
    props: [{ key: 'link', label: 'Radio link', type: 'boolean' }, number('throttle', 'Throttle channel', 0, 100, 1, '%'), number('steering', 'Steering channel', -100, 100, 1, '%')],
    defaults: { link: true, throttle: 0, steering: 0 }, model: { type: 'robotics', variant: 'receiver' },
    description: 'Virtual RC receiver and handset controls. CH1/CH2 produce 0–3.3 V analogue training signals when linked; with link lost they go to zero. Real receivers often output PWM/SBUS instead: do NOT wire these abstracted pins as if they were real receiver pads.',
    ratings: ['Supply 5 V', 'Training CH1/CH2 0–3.3 V analogue', 'Actual SBUS is serial, not modelled', 'Always configure receiver failsafe on real hardware'],
    art: { chipLabel: 'RX · 2.4G', bodyColor: '#1c5363', antenna: true }
  },
  {
    id: 'fpv-camera', category: 'robotics', family: 'robotics', name: 'FPV camera module', partNumber: 'FPV-CAM-5V', w: 90, h: 75,
    pins: [pin('vcc', '5V', 0, 20, 'vcc', 'Regulated 5 V'), pin('gnd', 'GND', 0, 45, 'gnd', 'Common ground'), pin('video', 'VIDEO', 90, 35, 'io', 'Analogue video to VTX input (signal presence only)')],
    props: [], defaults: {}, model: { type: 'robotics', variant: 'fpv-camera' },
    description: 'Analogue FPV camera. The bench represents power and composite signal presence; the mission view draws a synthetic camera field-of-view, NOT real video from a camera or a network stream.',
    ratings: ['Supply 5 V regulated', 'Composite video ~1 Vpp (signal presence only)', 'Observe local privacy and recording rules'],
    art: { chipLabel: 'CAM', bodyColor: '#1b394e' }
  },
  {
    id: 'vtx-58', category: 'robotics', family: 'robotics', name: '5.8 GHz FPV video transmitter', partNumber: 'VTX-5V-5G8', w: 100, h: 70,
    pins: [pin('vcc', '5V', 0, 15, 'vcc', 'Filtered, regulated 5 V'), pin('gnd', 'GND', 0, 35, 'gnd', 'Common ground'), pin('video', 'VIDEO', 0, 55, 'ain', 'Composite video from FPV camera')],
    props: [], defaults: {}, model: { type: 'robotics', variant: 'vtx' },
    description: '5.8 GHz analogue video transmitter representation. The antenna is depicted as installed. The simulator checks power and a video signal; it does NOT emit RF, tune channels or transmit actual video.',
    ratings: ['Supply 5 V filtered', 'Install matched antenna before any real power-on', 'Follow local radio and privacy regulations', 'Keep RF device cool'],
    art: { chipLabel: '5.8G VTX', bodyColor: '#20426b', antenna: true }
  },
  {
    id: 'telemetry-sik', category: 'robotics', family: 'robotics', name: 'SiK telemetry radio', partNumber: 'SIK-UART-5V', w: 100, h: 70,
    pins: [pin('vcc', '5V', 0, 15, 'vcc', 'Regulated 5 V'), pin('gnd', 'GND', 0, 35, 'gnd', 'Common ground'), pin('rx', 'RX', 0, 55, 'io', 'UART RX ← FC TX'), pin('tx', 'TX', 100, 55, 'io', 'UART TX → FC RX')],
    props: [], defaults: {}, model: { type: 'robotics', variant: 'telemetry' },
    description: 'UART telemetry interface. TX crosses to the controller RX, RX to TX, all grounds shared. Mission metrics are computed locally in the browser; no radio link or remote base station is created.',
    ratings: ['Supply 5 V on this training carrier', '3.3 V UART logic', 'Verify local radio frequency and permitted transmit power'],
    art: { chipLabel: 'SiK', bodyColor: '#193d62', antenna: true }
  },
  {
    id: 'brushless-2205', category: 'robotics', family: 'robotics', name: '2205 brushless motor + propeller', partNumber: 'BLDC-2205-2300KV', w: 100, h: 90,
    pins: [pin('u', 'U', 0, 20, 'io', 'Phase U ← ESC U'), pin('v', 'V', 0, 40, 'io', 'Phase V ← ESC V'), pin('w', 'W', 0, 60, 'io', 'Phase W ← ESC W')],
    props: [number('kv', 'Motor KV', 900, 2600, 100, 'RPM/V')], defaults: { kv: 2300 },
    model: { type: 'robotics', variant: 'brushless' },
    description: 'Three-phase brushless motor. It spins only when U/V/W are wired to one powered ESC. The ESC owns the averaged load; no rotor inertia, back-EMF or phase commutation is solved in the circuit bench. Propeller is visual only.',
    ratings: ['Matched ESC and suitable propeller required', 'KV is unloaded RPM per volt (approximate)', 'Remove propellers for electrical testing'],
    art: { chipLabel: '2205', bodyColor: '#324452' }
  },
  {
    id: 'lipo-2s', category: 'power', family: 'battery-pack', name: 'LiPo battery 2S (7.4 V)', partNumber: 'LIPO-2S-2200', w: 90, h: 60,
    pins: [pin('pos', '+', 10, 60, 'vcc', 'Battery positive; fused lead recommended'), pin('neg', '−', 80, 60, 'gnd', 'Battery negative')],
    props: [number('volts', 'Open-circuit voltage', 6.0, 8.4, 0.01, 'V'), number('mah', 'Capacity', 500, 5000, 50, 'mAh')],
    defaults: { volts: 7.4, mah: 2200 }, model: { type: 'source' },
    description: 'Two-cell LiPo: ~6.0–8.4 V pack range. The circuit solver includes pack internal resistance; the mission model estimates discharge. Use a 2S balance charger, not the 1S protection module.',
    ratings: ['2S nominal 7.4 V; full 8.4 V', 'Stop near 3.0–3.3 V per cell under load', 'Use a fused lead and 2S balance charger']
  },
  {
    id: 'lipo-3s', category: 'power', family: 'battery-pack', name: 'LiPo battery 3S (11.1 V)', partNumber: 'LIPO-3S-2200', w: 90, h: 60,
    pins: [pin('pos', '+', 10, 60, 'vcc', 'Battery positive; fused lead recommended'), pin('neg', '−', 80, 60, 'gnd', 'Battery negative')],
    props: [number('volts', 'Open-circuit voltage', 9.0, 12.6, 0.01, 'V'), number('mah', 'Capacity', 500, 5000, 50, 'mAh')],
    defaults: { volts: 11.1, mah: 2200 }, model: { type: 'source' },
    description: 'Three-cell LiPo with balance lead. Powers the PDB/ESC pads, NEVER the FC, GPS or camera 5 V pads directly. A separate 3S balance charger is mandatory.',
    ratings: ['3S nominal 11.1 V; full 12.6 V', 'Stop near 3.0–3.3 V per cell under load', 'Use a fused lead and 3S balance charger']
  }
];
