/**
 * Circuit Lab — core data model.
 *
 * Everything on the bench is data: a `PlacedComponent` references a `PartDef`
 * in the registry and carries its own position, rotation and property values.
 * The simulator consumes exactly these types, so the registry, the renderer and
 * the solver never disagree about what a part is.
 *
 * World units: 10 units = 2.54 mm = one breadboard hole pitch. Keeping the
 * grid at 10 units means every 2.54 mm-spaced pin header lands on the grid.
 */

export const HOLE = 10; // one hole pitch (2.54 mm) in world units
export const GRID = 5; // snap grid in world units

/** Where a pin sits electrically. */
export type PinKind = 'gnd' | 'vcc' | 'vin' | 'io' | 'ain' | 'pwm' | 'nc';

export interface PinDef {
  /** Stable id, unique inside the part, e.g. 'D13', 'GPIO21', 'h12r3'. */
  id: string;
  /** Silkscreen label printed next to the pin, e.g. 'D13'. */
  label: string;
  /** Function line shown in tooltips, e.g. 'GPIO21 / SDA'. */
  func?: string;
  /** Position relative to the part's top-left corner, unrotated, world units. */
  x: number;
  y: number;
  kind: PinKind;
  /** Arduino-style pin number used by sketches (digitalWrite(13, …)). */
  io?: number;
}

export type PropValue = number | string | boolean;

export interface PropDef {
  key: string;
  label: string;
  type: 'number' | 'select' | 'color' | 'boolean' | 'text';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
}

export type PartCategory =
  | 'boards'
  | 'prototyping'
  | 'passives'
  | 'semiconductors'
  | 'ics'
  | 'sensors'
  | 'power'
  | 'tools';

/** Renderer family — which SVG artist draws this part. */
export type PartFamily =
  | 'board' // microcontroller boards (ESP32, Uno, Pico, …)
  | 'breadboard'
  | 'perfboard'
  | 'resistor'
  | 'capacitor-ceramic'
  | 'capacitor-electrolytic'
  | 'inductor'
  | 'potentiometer'
  | 'trimmer'
  | 'thermistor'
  | 'ldr'
  | 'led'
  | 'diode'
  | 'transistor'
  | 'mosfet'
  | 'regulator'
  | 'optocoupler'
  | 'ic-dip'
  | 'module' // sensor / display / wireless modules (blue PCB + pins)
  | 'battery-9v'
  | 'battery-pack'
  | 'usb-power'
  | 'bench-supply'
  | 'switch'
  | 'pushbutton'
  | 'dip-switch'
  | 'instrument' // multimeter / oscilloscope / logic analyzer / generator
  | 'symbol' // ground / vcc symbols
  | 'jumper' // colored jumper wire (zero-ohm link with two ends)
  | 'breadboard-half';

/** Electrical model the solver understands. */
export type SimModel =
  | { type: 'resistor' }
  | { type: 'source'; ac?: boolean }
  | { type: 'gnd' }
  | { type: 'switch' }
  | { type: 'diode'; vf?: number }
  | { type: 'led' }
  | { type: 'capacitor'; polarized?: boolean }
  | { type: 'inductor' }
  | { type: 'potentiometer' }
  | { type: 'mcu' }
  | { type: 'logic'; gate: 'not' | 'and' | 'or' | 'nand' | 'nor' | 'xor' | 'buffer' }
  | { type: 'timer555' }
  | { type: 'opamp' }
  | { type: 'bjt'; pnp?: boolean }
  | { type: 'mosfet'; pChannel?: boolean }
  | { type: 'relay' }
  | { type: 'buzzer' }
  | { type: 'motor' }
  | { type: 'servo' }
  | { type: 'display'; variant: 'lcd16x2' | 'lcd16x2-i2c' | 'oled' | '7seg' }
  | { type: 'sensor'; variant: 'dht' | 'hcsr04' | 'pir' | 'ir' | 'mpu6050' | 'bmp280' | 'soil' | 'touch' | 'mq' | 'ldr-module' }
  | { type: 'wireless'; variant: 'nrf24' | 'hc05' | 'rfid' | 'gps' }
  | { type: 'driver'; variant: 'l293d' | 'l298n' | 'uln2003' | 'stepper' }
  | { type: 'meter'; variant: 'multimeter' | 'scope' | 'la' | 'fgen' }
  | { type: 'optocoupler' }
  | { type: 'regulator' }
  | { type: 'prototyping' }; // breadboard / perfboard / pcb: connectivity only

export interface PartDef {
  id: string;
  category: PartCategory;
  family: PartFamily;
  name: string;
  partNumber: string;
  /** Body size in world units (10 = 2.54 mm). */
  w: number;
  h: number;
  pins: PinDef[];
  props: PropDef[];
  defaults: Record<string, PropValue>;
  model: SimModel;
  /** Short datasheet-style summary shown in the info card. */
  description: string;
  /** Absolute-maximum style rating lines. */
  ratings: string[];
  /** Extra artwork hints for the board/module renderer. */
  art?: {
    bodyColor?: string;
    usb?: boolean;
    /** Pin ids of tactile buttons on the board (e.g. EN / BOOT). */
    buttons?: { id: string; label: string; pin?: string }[];
    /** Board-level LEDs and the pin that drives them. */
    onboardLeds?: { id: string; label: string; pin: string; color: string }[];
    chipLabel?: string;
    screen?: 'oled' | 'lcd';
    antenna?: boolean;
  };
}

/** Groups of pins that are connected inside the part (breadboard columns…). */
export type PinGroup = string[];

export interface PlacedComponent {
  /** Instance id, unique on the bench. */
  id: string;
  partId: string;
  /** Top-left corner in world units. */
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  props: Record<string, PropValue>;
  /** Runtime flags owned by the simulator (burnt, …). Reset on Run. */
  state?: Record<string, PropValue>;
  /** Sketch source for MCU boards. */
  code?: string;
}

export type WireColor = 'red' | 'black' | 'blue' | 'green' | 'yellow' | 'white' | 'orange' | 'purple';

export interface WireEndpoint {
  compId: string;
  pinId: string;
}

export interface WireWaypoint {
  x: number;
  y: number;
}

export interface PlacedWire {
  id: string;
  from: WireEndpoint | null;
  to: WireEndpoint | null;
  color: WireColor;
  waypoints: WireWaypoint[];
}

// ── Simulation results ──────────────────────────────────────────────────────

export interface CompSimResult {
  /** Voltage at each pin's node, keyed by pin id. */
  pinV: Record<string, number>;
  /** Branch current through the part (A), positive = into pin A / anode. */
  current: number;
  power: number;
  /** 0..1 LED brightness. */
  glow?: number;
  /** RGB LED per-die brightness 0..1. */
  rgb?: { r: number; g: number; b: number };
  /** Generic on/off flag (buzzer, relay, …). */
  on?: boolean;
  /** 0..1 motor speed / buzzer activity. */
  speed?: number;
  /** Servo angle in degrees. */
  angle?: number;
  /** Text rendered on LCD/OLED/serial. */
  text?: string;
  /** 7-segment value. */
  digit?: string;
  /** DMM / instrument readout. */
  display?: string;
  /** Waveform samples for the oscilloscope (volts). */
  wave?: number[];
  /** Logic-analyzer channel levels 0/1. */
  channels?: number[];
  burnt?: boolean;
  /** Supply present (sensors, boards). */
  powered?: boolean;
  /** Board on-board LED levels keyed by LED id (0..1). */
  leds?: Record<string, number>;
  /** Logic-analyzer / scope traces. */
  traces?: number[][];
  /** Second scope channel waveform. */
  wave2?: number[];
  warnings?: string[];
}

export interface SimFrame {
  /** Virtual milliseconds since Run. */
  t: number;
  components: Record<string, CompSimResult>;
  /** Node voltages keyed by `${compId}:${pinId}` (sampled, for probes). */
  nodeVolts: Record<string, number>;
  /** Battery / source currents keyed by component id. */
  sourceCurrents: Record<string, number>;
  isShortCircuit: boolean;
  isOpenCircuit: boolean;
  /** Serial monitor lines produced since the last frame. */
  serial: string[];
  /** Fatal sketch errors. */
  errors: string[];
  /** True while the simulation is running (vs. static operating point). */
  running?: boolean;
}

// ── Persistence ─────────────────────────────────────────────────────────────

export interface CircuitProject {
  version: 1;
  name: string;
  components: PlacedComponent[];
  wires: PlacedWire[];
}
