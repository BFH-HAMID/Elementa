/**
 * Circuit Lab simulation engine. Owns the topology cache, the MCU sketch VMs,
 * instrument buffers and burn-out memory, and produces `SimFrame`s for the UI.
 *
 * This module has no React/DOM dependencies: the same class runs inside the
 * Web Worker (simWorker.ts) and as a main-thread fallback.
 */

import { getPart } from '../parts/registry';
import type { CompSimResult, PlacedComponent, PlacedWire, PropValue, SimFrame } from '../types';
import { buildTopology, solveStep, topologySignature, type DriveSpec, type Memory, type StepOutput, type Topology } from './solver';
import { McuVM, type McuHost, type McuOutput } from './mcu';

/** Fixed analogue time step (seconds). 0.2 ms resolves 1 kHz+ timers. */
export const SIM_DT = 2e-4;
const MAX_STEPS_PER_TICK = 160;
const MAX_TICK_MS = 60;
const SCOPE_SAMPLE_EVERY = 4;
const SCOPE_LEN = 320;
/** PWM is modelled as 0/V switching with a 2 ms period (10 steps of SIM_DT). */
const PWM_STEPS = 10;

const REACTIVE_MODELS = new Set(['capacitor', 'inductor', 'timer555', 'logic', 'driver', 'mcu']);

export interface TickRequest {
  components: PlacedComponent[];
  wires: PlacedWire[];
  wallMs: number;
  speed: number;
  running: boolean;
}

export interface TickResult {
  frame: SimFrame;
  serial: string[];
  errors: string[];
  burns: Record<string, string>;
  /** Simulated seconds advanced this tick (for UI timing readouts). */
  advanced: number;
}

function boardInfo(partId: string): { vdd: number; adcMax: number; adcVref: number; pinPrefix: string; led: string } {
  const isS3 = partId.startsWith('esp32');
  if (partId === 'arduino-uno' || partId === 'arduino-nano') return { vdd: 5, adcMax: 1023, adcVref: 5, pinPrefix: 'D', led: 'D13' };
  if (partId === 'nodemcu-esp8266') return { vdd: 3.3, adcMax: 1023, adcVref: 1, pinPrefix: 'D', led: 'D4' };
  if (partId === 'rpi-pico') return { vdd: 3.3, adcMax: 4095, adcVref: 3.3, pinPrefix: 'GP', led: 'GP25' };
  if (partId === 'stm32-bluepill') return { vdd: 3.3, adcMax: 4095, adcVref: 3.3, pinPrefix: 'PA', led: 'C13' };
  if (partId === 'attiny85') return { vdd: 5, adcMax: 1023, adcVref: 5, pinPrefix: 'PB', led: 'PB1' };
  if (isS3) return { vdd: 3.3, adcMax: 4095, adcVref: 3.3, pinPrefix: 'D', led: 'D2' };
  return { vdd: 5, adcMax: 1023, adcVref: 5, pinPrefix: 'D', led: 'D13' };
}

function codeKey(code: string | undefined): string {
  const c = code ?? '';
  let h = 0;
  for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) | 0;
  return `${c.length}:${h}`;
}

export class CircuitEngine {
  private topo: Topology | null = null;
  private topoSig = '';
  private memory: Record<string, Memory> = {};
  private burnt = new Set<string>();
  private burnReasons: Record<string, string> = {};
  private prevV: Float64Array | null = null;
  private t = 0;
  private vms = new Map<string, { vm: McuVM; key: string; errors: string[] }>();
  private lastOut: StepOutput | null = null;
  private lastMcu: Record<string, McuOutput> = {};
  private scope1: number[] = [];
  private scope2: number[] = [];
  private la: number[][] = Array.from({ length: 8 }, () => []);
  private stepCount = 0;
  private lastFrame: SimFrame | null = null;
  private components: PlacedComponent[] = [];
  private pwmPhase = 0;
  /** Glow accumulated over the steps of one tick, so PWM LEDs show average brightness. */
  private glowSum: Record<string, number> = {};
  private glowN: Record<string, number> = {};

  reset() {
    this.memory = {};
    this.burnt = new Set();
    this.burnReasons = {};
    this.prevV = null;
    this.t = 0;
    this.vms.clear();
    this.lastOut = null;
    this.lastMcu = {};
    this.scope1 = [];
    this.scope2 = [];
    this.la = Array.from({ length: 8 }, () => []);
    this.stepCount = 0;
    this.lastFrame = null;
    this.pwmPhase = 0;
    this.glowSum = {};
    this.glowN = {};
  }

  /** Advance the simulation by roughly `wallMs × speed` of simulated time. */
  tick(req: TickRequest): TickResult {
    const sig = topologySignature(req.components, req.wires);
    if (sig !== this.topoSig || !this.topo) {
      this.topo = buildTopology(req.components, req.wires);
      this.topoSig = sig;
    }
    this.components = req.components;
    const topo = this.topo;
    const reactive = req.components.some((c) => {
      const def = getPart(c.partId);
      if (!def) return false;
      if (def.category === 'boards') return true;
      if (def.model.type === 'source' && def.model.ac) return true;
      if (def.model.type === 'meter' && def.model.variant === 'fgen') return true;
      return REACTIVE_MODELS.has(def.model.type);
    });

    const serial: string[] = [];
    const errors: string[] = [];
    const allBurns: Record<string, string> = {};
    this.glowSum = {};
    this.glowN = {};

    // Load / reload sketches when code changed.
    for (const id of topo.boards) {
      const comp = req.components.find((c) => c.id === id);
      if (!comp) continue;
      const key = codeKey(comp.code);
      const entry = this.vms.get(id);
      if (!entry || entry.key !== key) {
        const vm = new McuVM(this.makeHost(id, comp.partId));
        const compileErrors = vm.load(comp.code ?? '');
        this.vms.set(id, { vm, key, errors: compileErrors });
        if (compileErrors.length) errors.push(...compileErrors.map((e) => `${getPart(comp.partId)?.name ?? 'Board'}: ${e}`));
      }
    }
    for (const [id] of this.vms) if (!topo.comps.has(id)) this.vms.delete(id);

    let advanceMs = 0;
    let advanced = 0;
    // Seed the operating point once so supplies and powered flags are known before any sketch runs.
    if (!this.prevV || this.prevV.length === 0) this.stepOnce(req, topo, SIM_DT, false, serial, errors, allBurns);
    if (!req.running) {
      // Static operating point so meters and LEDs reflect the circuit while stopped.
      this.stepOnce(req, topo, SIM_DT * 5, false, serial, errors, allBurns);
      advanced = 0;
    } else {
      advanceMs = Math.min(MAX_TICK_MS, req.wallMs * req.speed);
      const targetSec = advanceMs / 1000;
      const steps = reactive ? Math.min(MAX_STEPS_PER_TICK, Math.max(1, Math.ceil(targetSec / SIM_DT))) : 1;
      const dt = reactive ? SIM_DT : Math.max(1e-3, targetSec);
      for (let i = 0; i < steps; i++) {
        this.stepOnce(req, topo, dt, true, serial, errors, allBurns);
        advanced += dt;
      }
    }

    const frame = this.buildFrame(req.running);
    this.lastFrame = frame;
    return { frame, serial, errors: [...new Set(errors)], burns: allBurns, advanced };
  }

  private makeHost(boardId: string, partId: string): McuHost {
    const info = boardInfo(partId);
    const self = this;
    const board = this.components.find((c) => c.id === boardId);
    const def = board ? getPart(board.partId) : undefined;
    const pinsById = new Map((def?.pins ?? []).map((p) => [p.id, p]));
    const resolve = (p: unknown): string => {
      if (typeof p === 'number') return `${info.pinPrefix}${p}`;
      const s = String(p);
      const bluepill = /^P([A-C]\d+)$/.exec(s);
      if (bluepill && partId === 'stm32-bluepill') return bluepill[1];
      if (/^\d+$/.test(s)) return `${info.pinPrefix}${s}`;
      return s;
    };
    return {
      nowMs: () => self.t * 1000,
      pinNode: (pin: string) => self.topo?.nodeOf.get(`${boardId}|${pin}`) ?? -1,
      readV: (pin: string) => self.lastOut?.pinV(boardId, pin) ?? 0,
      vdd: info.vdd,
      adcMax: info.adcMax,
      adcVref: info.adcVref,
      boardLed: info.led,
      resolvePin: resolve,
      internalPins: new Set(),
      i2cAvailable: () => [...pinsById.values()].some((p) => /SDA/.test(p.func ?? '')),
      attached: (pin, devicePins, defIds) => {
        const topo = self.topo;
        if (!topo) return null;
        // Board-side node(s) we are looking for: a named pin, or any I²C SDA pin for 'I2C'.
        const boardNodes: number[] = [];
        if (pin === 'I2C') {
          for (const p of pinsById.values()) if (/SDA/.test(p.func ?? '')) boardNodes.push(topo.nodeOf.get(`${boardId}|${p.id}`) ?? -2);
        } else {
          boardNodes.push(topo.nodeOf.get(`${boardId}|${pin}`) ?? -2);
        }
        for (const [cid, { def: d }] of topo.comps) {
          if (!defIds.includes(d.id)) continue;
          const dn = devicePins.map((dp) => topo.nodeOf.get(`${cid}|${dp}`) ?? -3);
          const hit = dn.some((n) => boardNodes.includes(n) && n >= -1);
          if (!hit) continue;
          const comp = self.components.find((c) => c.id === cid);
          const powered = Boolean(self.lastOut?.comp[cid]?.powered);
          return { compId: cid, props: { ...(comp?.props ?? {}) } as Record<string, PropValue>, powered };
        }
        return null;
      },
      setMemory: (compId: string, key: string, value: number | string) => {
        self.memory[compId] = { ...(self.memory[compId] ?? {}), [key]: value };
      }
    };
  }

  private stepOnce(
    req: TickRequest,
    topo: Topology,
    dt: number,
    running: boolean,
    serial: string[],
    errors: string[],
    burns: Record<string, string>
  ) {
    const drives: Record<string, Record<string, DriveSpec>> = {};
    if (running) {
      for (const boardId of topo.boards) {
        const entry = this.vms.get(boardId);
        if (!entry) continue;
        const powered = this.lastOut?.comp[boardId]?.powered ?? false;
        if (!powered) {
          // Unpowered boards drive nothing and do not run their sketch.
          this.lastMcu[boardId] = { drives: {}, serial: [], error: null, running: false, text: {}, tones: {}, leds: {}, levels: {} };
          continue;
        }
        const out = entry.vm.advance(this.t * 1000);
        this.lastMcu[boardId] = out;
        // PWM pins switch between 0 and the supply inside each period; the average is what the circuit sees.
        const phase = (this.pwmPhase % PWM_STEPS) / PWM_STEPS;
        const pinDrives: Record<string, DriveSpec> = {};
        for (const [pin, d] of Object.entries(out.drives)) {
          pinDrives[pin] = d.mode === 'out' && d.duty !== undefined ? { mode: 'out', level: phase < d.duty } : d;
        }
        drives[boardId] = pinDrives;
        for (const line of out.serial) serial.push(line);
        if (out.error) errors.push(`Sketch error: ${out.error}`);
      }
    }
    for (const c of req.components) {
      const def = getPart(c.partId);
      if (def?.category === 'boards' && !this.lastMcu[c.id]) this.lastMcu[c.id] = { drives: {}, serial: [], error: null, running: false, text: {}, tones: {}, leds: {}, levels: {} };
    }

    const out = solveStep({
      topo,
      components: req.components,
      t: this.t,
      dt,
      prevV: this.prevV,
      memory: this.memory,
      burnt: this.burnt,
      drives
    });
    this.lastOut = out;
    this.prevV = out.x;
    this.pwmPhase++;
    for (const [id, res] of Object.entries(out.comp)) {
      if (res.glow !== undefined) {
        this.glowSum[id] = (this.glowSum[id] ?? 0) + res.glow;
        this.glowN[id] = (this.glowN[id] ?? 0) + 1;
      }
    }
    this.memory = out.memory;
    for (const [id, reason] of Object.entries(out.newBurns)) {
      if (!this.burnt.has(id)) {
        this.burnt.add(id);
        this.burnReasons[id] = reason;
        burns[id] = reason;
      }
    }
    errors.push(...out.warnings);
    if (running) {
      this.stepCount++;
      this.t += dt;
      if (this.stepCount % SCOPE_SAMPLE_EVERY === 0) this.sampleInstruments(req, out);
    }
  }

  private sampleInstruments(req: TickRequest, out: StepOutput) {
    const scope = req.components.find((c) => c.partId === 'oscilloscope');
    if (scope) {
      const def = getPart(scope.partId);
      const ch1 = def ? out.pinV(scope.id, 'ch1') - out.pinV(scope.id, 'gnd') : 0;
      const ch2 = def ? out.pinV(scope.id, 'ch2') - out.pinV(scope.id, 'gnd') : 0;
      this.scope1.push(ch1);
      this.scope2.push(ch2);
      if (this.scope1.length > SCOPE_LEN) {
        this.scope1.shift();
        this.scope2.shift();
      }
    }
    const la = req.components.find((c) => c.partId === 'logic-analyzer');
    if (la) {
      const names = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'];
      const thr = Number(la.props.threshold ?? 1.65);
      names.forEach((p, i) => {
        const hi = out.pinV(la.id, p) > thr ? 1 : 0;
        this.la[i].push(hi);
        if (this.la[i].length > SCOPE_LEN) this.la[i].shift();
      });
    }
  }

  private buildFrame(running: boolean): SimFrame {
    const out = this.lastOut;
    const comps: Record<string, CompSimResult> = {};
    if (out) {
      for (const [id, res] of Object.entries(out.comp)) {
        const c = this.components.find((x) => x.id === id);
        const def = c ? getPart(c.partId) : undefined;
        const r: CompSimResult = { ...res };
        if (res.glow !== undefined && this.glowN[id]) r.glow = this.glowSum[id] / this.glowN[id];
        if (this.burnt.has(id)) {
          r.burnt = true;
          r.warnings = [this.burnReasons[id] ?? 'burnt'];
        }
        if (def?.id === 'servo-sg90') r.angle = Number(this.memory[id]?.angle ?? c?.props.angle ?? 90);
        if (def?.id === 'dc-motor') {
          const a = res.pinV.a ?? 0;
          const b = res.pinV.b ?? 0;
          r.speed = Math.min(1, Math.abs(a - b) / 6);
        }
        if (def?.id === 'buzzer') {
          r.on = res.current > 0.0005;
          r.speed = r.on ? 1 : 0;
        }
        if (def?.id === 'display-7seg' && res.pinV) r.digit = decodeSeven(res.pinV, def);
        if (def?.id === 'multimeter') r.display = out.displays[id] ?? '—';
        if (def?.id === 'oscilloscope') {
          r.wave = [...this.scope1];
          r.wave2 = [...this.scope2];
        }
        if (def?.id === 'logic-analyzer') r.traces = this.la.map((t) => [...t]);
        if (def?.id === 'multimeter' && out.displays[id]) r.display = out.displays[id];
        if (def?.id === 'oled-ssd1306' || def?.id === 'lcd-16x2' || def?.id === 'lcd-i2c') {
          const text = this.textFor(id);
          if (text !== undefined) r.text = text;
        }
        if (def?.category === 'boards') {
          const mcu = this.lastMcu[id];
          if (mcu) {
            r.leds = {};
            const info = def.art?.onboardLeds ?? [];
            for (const led of info) {
              const drv = mcu.drives[led.pin];
              const level = mcu.levels[led.pin] ?? 0;
              r.leds[led.id] = drv && drv.mode === 'out' ? (drv.duty !== undefined ? drv.duty : level) : level;
            }
          }
        }
        comps[id] = r;
      }
    }
    const nodeVolts: Record<string, number> = {};
    return {
      t: Math.round(this.t * 1e6) / 1e3,
      components: comps,
      nodeVolts,
      sourceCurrents: out ? out.sourceCurrents : {},
      isShortCircuit: Boolean(out?.isShortCircuit),
      isOpenCircuit: Boolean(out?.isOpenCircuit),
      serial: [],
      errors: [],
      running
    };
  }

  /** Display text written by any sketch during this tick (LCD / OLED devices). */
  private textFor(id: string): string | undefined {
    for (const out of Object.values(this.lastMcu)) {
      if (out.text[id] !== undefined) return out.text[id];
    }
    return undefined;
  }

  get frame(): SimFrame | null {
    return this.lastFrame;
  }

  /** Burn reasons, for the Check-circuit panel. */
  get burns(): Record<string, string> {
    return { ...this.burnReasons };
  }
}

/** Decode a 7-segment digit from driven segment pins (segment voltage above the cathode). */
function decodeSeven(pinV: Record<string, number>, def: { pins: { id: string }[] }): string {
  void def;
  const cathode = pinV.k1 ?? 0;
  const lit = (p: string) => (pinV[p] ?? 0) - cathode > 1.4;
  const seg = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(lit).map((v) => (v ? 1 : 0));
  const key = seg.join('');
  const table: Record<string, string> = {
    '1111110': '0',
    '0110000': '1',
    '1101101': '2',
    '1111001': '3',
    '0110011': '4',
    '1011011': '5',
    '1011111': '6',
    '1110000': '7',
    '1111111': '8',
    '1111011': '9',
    '1110111': 'A',
    '0011111': 'B',
    '1001110': 'C',
    '0111101': 'D',
    '1001111': 'E',
    '1000111': 'F'
  };
  return table[key] ?? '';
}
