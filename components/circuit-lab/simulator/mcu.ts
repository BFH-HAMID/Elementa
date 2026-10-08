/**
 * MCU sketch runtime.
 *
 * Arduino-style C++ subset → JavaScript transpiler plus a generator-based VM.
 * Blocking calls (delay, delayMicroseconds) yield to the scheduler, so the
 * sketch runs in virtual time that is advanced by the circuit simulator. Every
 * user function becomes a generator, so a delay inside a helper still works.
 *
 * Supported: variables and arrays, #define constants, functions, if/else,
 * for/while/do, switch, Arduino core (pinMode, digitalWrite/Read, analogWrite,
 * analogRead, delay, millis, micros, tone, pulseIn, map, constrain, random),
 * Serial, Servo, DHT, LiquidCrystal (parallel and I²C), Adafruit_SSD1306-style
 * displays, Stepper, ledc (ESP32 PWM) and BMP280 / MPU6050 read helpers.
 *
 * Not supported: raw Wire register I/O, WiFi/BLE stacks, interrupts, pointers.
 */

export interface TranspileResult {
  code: string;
  errors: string[];
}

const TYPE_WORDS = 'int|long|float|double|bool|boolean|byte|char|word|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|uint64_t|size_t|unsigned|signed|short';
const CLASS_NAMES = ['Servo', 'DHT', 'LiquidCrystal_I2C', 'LiquidCrystal', 'Stepper', 'Adafruit_SSD1306', 'Adafruit_BMP280', 'BMP280', 'MPU6050', 'Adafruit_MPU6050'];
const USER_FN_SKIP = new Set(['setup', 'loop', 'if', 'for', 'while', 'switch', 'return', 'sizeof']);

/** Remove // and /* *\/ comments while respecting string and char literals. */
function stripComments(src: string): string {
  let out = '';
  let i = 0;
  let inStr: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') {
        out += n ?? '';
        i += 2;
        continue;
      }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      out += c;
      i++;
      continue;
    }
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Replace `name(...)` calls with `(yield* name(...))`, matching parentheses. */
function wrapYieldCalls(src: string, names: string[]): string {
  if (names.length === 0) return src;
  const pattern = new RegExp(`(?<![\\w.$])(${names.join('|')})\\s*\\(`, 'g');
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/function\*?\s*$/.test(before)) continue; // definition, not a call
    // Find the matching close paren.
    let depth = 0;
    let j = m.index + m[0].length - 1;
    for (; j < src.length; j++) {
      if (src[j] === '(') depth++;
      else if (src[j] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (j >= src.length) continue;
    out += src.slice(last, m.index) + `(yield* ${m[1]}${src.slice(m.index + m[1].length, j + 1)})`;
    last = j + 1;
    pattern.lastIndex = j + 1;
  }
  return out + src.slice(last);
}

/** Convert a C-like sketch to a JavaScript module body that defines setup/loop generators. */
export function transpileSketch(source: string): TranspileResult {
  const errors: string[] = [];
  let s = stripComments(source).replace(/\r\n/g, '\n');

  // Preprocessor.
  const defines: string[] = [];
  s = s
    .split('\n')
    .map((line) => {
      if (/^\s*#include/.test(line)) return '';
      const m = /^\s*#define\s+(\w+)\s+(.+)$/.exec(line);
      if (m) {
        defines.push(m[1]);
        return `const ${m[1]} = ${m[2].trim()};`;
      }
      return line;
    })
    .join('\n');

  // Unsigned combos.
  s = s.replace(/\bunsigned\s+(long|int|char|short)\b/g, '$1');
  s = s.replace(/\bstatic\s+/g, '');
  s = s.replace(/\bvolatile\s+/g, '');

  // Function prototypes → removed.
  s = s.replace(new RegExp(`^\\s*(?:${TYPE_WORDS}|void)\\s+\\w+\\s*\\([^)]*\\)\\s*;\\s*$`, 'gm'), '');

  // Function definitions → generators with untyped parameters.
  s = s.replace(
    new RegExp(`^\\s*(?:void|${TYPE_WORDS})\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`, 'gm'),
    (_m, name: string, params: string) => {
      const clean = params
        .split(',')
        .map((p) => p.replace(new RegExp(`\\b(const|${TYPE_WORDS})\\b`, 'g'), '').replace(/[*&]/g, '').trim())
        .filter(Boolean)
        .join(', ');
      return `function* ${name}(${clean}) {`;
    }
  );

  // Class instantiations: `Servo s;` / `LiquidCrystal lcd(1,2,3,4,5,6);`
  for (const cls of CLASS_NAMES) {
    s = s.replace(new RegExp(`^(\\s*)${cls}\\s+(\\w+)\\s*;`, 'gm'), `$1let $2 = new ${cls}();`);
    s = s.replace(new RegExp(`^(\\s*)${cls}\\s+(\\w+)\\s*\\(([^;]*)\\);`, 'gm'), (_m, ind: string, name: string, args: string) => `${ind}let ${name} = new ${cls}(${args.replace(/&/g, '')});`);
  }

  // Arrays with initialisers.
  s = s.replace(new RegExp(`\\b(?:const\\s+)?(?:${TYPE_WORDS})\\s+(\\w+)\\s*\\[[^\\]]*\\]\\s*=\\s*\\{([^}]*)\\}\\s*;`, 'g'), 'let $1 = [$2];');
  // Uninitialised arrays.
  s = s.replace(new RegExp(`\\b(?:${TYPE_WORDS})\\s+(\\w+)\\s*\\[(\\w+)\\]\\s*;`, 'g'), 'let $1 = new Array($2).fill(0);');

  // Variable declarations.
  s = s.replace(new RegExp(`\\bconst\\s+(?:${TYPE_WORDS})\\s+`, 'g'), 'const ');
  s = s.replace(new RegExp(`\\b(?:${TYPE_WORDS})\\s+(?=[A-Za-z_]\\w*\\s*(?:=|;|,|\\)))`, 'g'), 'let ');
  s = s.replace(new RegExp(`\\b(?:${TYPE_WORDS})\\s+(?=[A-Za-z_]\\w*\\s*\\()`, 'g'), 'function* '); // leftover, unlikely
  // `let` followed by a pointer/reference type is rare; drop address-of.
  s = s.replace(/(?<![&\w])&(?=[A-Za-z_])/g, '');
  s = s.replace(/->/g, '.');

  // Sketch-level helpers: delay and friends are generators, user functions too.
  const userFns: string[] = [];
  const fnDef = /function\*\s+(\w+)\s*\(/g;
  let fm: RegExpExecArray | null;
  while ((fm = fnDef.exec(s))) {
    if (!USER_FN_SKIP.has(fm[1]) && fm[1] !== 'setup' && fm[1] !== 'loop') userFns.push(fm[1]);
  }
  s = wrapYieldCalls(s, ['delay', 'delayMicroseconds', ...userFns]);

  // setup / loop must exist.
  if (!/function\*\s+setup\s*\(/.test(s)) errors.push('setup() is missing — every sketch needs void setup() { … }');
  if (!/function\*\s+loop\s*\(/.test(s)) errors.push('loop() is missing — every sketch needs void loop() { … }');

  // Unbalanced braces: a common student mistake.
  let depth = 0;
  for (const ch of s) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  if (depth !== 0) errors.push(`Unbalanced braces: ${depth > 0 ? 'missing }' : 'extra }'}`);

  void defines;
  return { code: s, errors };
}

// ── VM ──────────────────────────────────────────────────────────────────────

export interface McuHost {
  nowMs(): number;
  pinNode(pin: string): number;
  /** Voltage at a board pin (relative to the board ground). */
  readV(pin: string): number;
  vdd: number;
  adcMax: number;
  adcVref: number;
  /** Lookup of a component attached to the MCU pin (by pin id of the device, e.g. 'orange'). */
  attached(pin: string, devicePins: string[], defIds: string[]): { compId: string; props: Record<string, number | string | boolean>; powered: boolean } | null;
  /** Set a component's runtime memory (angle, text, steps). */
  setMemory(compId: string, key: string, value: number | string): void;
  /** Pin used for on-board LEDs or other internal pins not on the header. */
  internalPins: Set<string>;
  i2cAvailable(): boolean;
  /** Pin id of the board's on-board LED (LED_BUILTIN). */
  boardLed: string;
  resolvePin(p: unknown): string;
}

export interface McuOutput {
  drives: Record<string, { mode: 'out'; level: boolean; duty?: number } | { mode: 'pullup' } | { mode: 'in' }>;
  serial: string[];
  error: string | null;
  running: boolean;
  /** Text buffers for LCD/OLED-like devices keyed by component id. */
  text: Record<string, string>;
  /** Tone state keyed by pin id. */
  tones: Record<string, number>;
  leds: Record<string, number>;
  /** Pin → current output level (for on-board LEDs). */
  levels: Record<string, number>;
}

/**
 * A running sketch. `advance(nowMs)` runs the generator until it blocks on a
 * delay that ends after nowMs. Host calls are synchronous.
 */
export class McuVM {
  private gen: Generator<number, void, unknown> | null = null;
  private wake = 0;
  private modes: Record<string, 'in' | 'out' | 'pullup'> = {};
  private levels: Record<string, boolean> = {};
  private duty: Record<string, number> = {};
  private ledc = new Map<number, string>();
  private serialLines: string[] = [];
  private serialBuf = '';
  private lcdBuf = new Map<string, string[]>();
  private lcdCursor = new Map<string, { x: number; y: number }>();
  private toneUntil: Record<string, number> = {};
  private error: string | null = null;
  private started = false;
  readonly host: McuHost;
  private textOut: Record<string, string> = {};

  constructor(host: McuHost) {
    this.host = host;
  }

  /** Compile the sketch; returns errors (syntax or missing setup/loop). */
  load(source: string): string[] {
    const { code, errors } = transpileSketch(source);
    if (errors.length) return errors;
    try {
      const api = this.buildApi();
      const names = Object.keys(api);
      const values = names.map((k) => api[k]);
      const factory = new Function(...names, `${code}\nreturn { setup, loop };`) as (...args: unknown[]) => { setup: () => Generator<number, void, unknown>; loop: () => Generator<number, void, unknown> };
      const prog = factory(...values);
      const self = this;
      this.gen = (function* () {
        yield* prog.setup();
        for (;;) {
          yield* prog.loop();
          // Loop boundary: each pass costs a little virtual time so tight loops progress.
          yield self.host.nowMs() + 0.02;
        }
      })();
      return [];
    } catch (e) {
      return [`Compile error: ${(e as Error).message}`];
    }
  }

  reset() {
    this.gen = null;
    this.wake = 0;
    this.modes = {};
    this.levels = {};
    this.duty = {};
    this.ledc.clear();
    this.serialLines = [];
    this.serialBuf = '';
    this.lcdBuf.clear();
    this.lcdCursor.clear();
    this.toneUntil = {};
    this.error = null;
    this.started = false;
    this.textOut = {};
  }

  /** Run the sketch up to the current virtual time. */
  advance(nowMs: number): McuOutput {
    if (this.gen && !this.error) {
      let guard = 0;
      while (this.gen && nowMs >= this.wake && guard++ < 2000) {
        try {
          const r = this.gen.next();
          if (r.done) {
            this.gen = null;
            break;
          }
          this.wake = typeof r.value === 'number' ? r.value : nowMs;
        } catch (e) {
          this.error = (e as Error).message;
          this.gen = null;
          break;
        }
      }
      this.started = true;
    }
    if (this.serialBuf) {
      // Flush partial line so students see output promptly.
      this.serialLines.push(this.serialBuf);
      this.serialBuf = '';
    }
    const drives: McuOutput['drives'] = {};
    for (const [pin, mode] of Object.entries(this.modes)) {
      if (mode === 'out') drives[pin] = { mode: 'out', level: this.levels[pin] ?? false, duty: this.duty[pin] };
      else if (mode === 'pullup') drives[pin] = { mode: 'pullup' };
      else drives[pin] = { mode: 'in' };
    }
    const out: McuOutput = {
      drives,
      serial: this.serialLines.splice(0),
      error: this.error,
      running: this.gen !== null,
      text: { ...this.textOut },
      tones: { ...this.toneUntil },
      leds: {},
      levels: Object.fromEntries(Object.entries(this.levels).map(([k, v]) => [k, v ? 1 : 0]))
    };
    return out;
  }

  get isStarted() {
    return this.started;
  }

  private fmt(v: unknown): string {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
    if (typeof v === 'boolean') return v ? '1' : '0';
    return String(v);
  }

  private lcdWrite(id: string, text: string) {
    const lines = this.lcdBuf.get(id) ?? ['', ''];
    const cur = this.lcdCursor.get(id) ?? { x: 0, y: 0 };
    const row = lines[cur.y] ?? '';
    const padded = row.padEnd(cur.x, ' ');
    lines[cur.y] = (padded.slice(0, cur.x) + text + padded.slice(cur.x + text.length)).slice(0, 16);
    cur.x += text.length;
    this.lcdBuf.set(id, lines);
    this.lcdCursor.set(id, cur);
    this.textOut[id] = lines.join('\n');
  }

  private pinOf(p: unknown): string {
    return this.host.resolvePin(p);
  }

  private buildApi(): Record<string, unknown> {
    const host = this.host;
    const self = this;
    const isHigh = (pin: string) => {
      if (this.modes[pin] === 'out') return this.levels[pin] ?? false;
      return host.readV(pin) > host.vdd / 2;
    };
    const api: Record<string, unknown> = {
      HIGH: true,
      LOW: false,
      INPUT: 'in',
      OUTPUT: 'out',
      INPUT_PULLUP: 'pullup',
      LED_BUILTIN: host.boardLed,
      DHT11: 11,
      DHT21: 21,
      DHT22: 22,
      INPUT_PULLDOWN: 'in',
      A0: 'A0',
      A1: 'A1',
      A2: 'A2',
      A3: 'A3',
      A4: 'A4',
      A5: 'A5',
      PI: Math.PI,
      Math,
      min: Math.min,
      max: Math.max,
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow,
      sin: Math.sin,
      cos: Math.cos,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      map: (v: number, a: number, b: number, c: number, d: number) => ((v - a) * (d - c)) / (b - a) + c,
      constrain: (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v)),
      random: (a: number, b?: number) => (b === undefined ? Math.floor(Math.random() * a) : a + Math.floor(Math.random() * (b - a))),
      pinMode: (pin: unknown, mode: string) => {
        const p = self.pinOf(pin);
        self.modes[p] = mode === 'out' ? 'out' : mode === 'pullup' ? 'pullup' : 'in';
        if (mode === 'out') self.levels[p] = self.levels[p] ?? false;
      },
      digitalWrite: (pin: unknown, v: unknown) => {
        const p = self.pinOf(pin);
        self.levels[p] = Boolean(v);
        if (self.modes[p] !== 'out') self.modes[p] = 'out';
        delete self.duty[p];
      },
      digitalRead: (pin: unknown) => {
        const p = self.pinOf(pin);
        return isHigh(p) ? 1 : 0;
      },
      analogWrite: (pin: unknown, v: number) => {
        const p = self.pinOf(pin);
        self.modes[p] = 'out';
        self.duty[p] = Math.max(0, Math.min(255, v)) / 255;
        self.levels[p] = v > 127;
      },
      analogRead: (pin: unknown) => {
        const p = self.pinOf(pin);
        const v = host.readV(p);
        return Math.max(0, Math.min(host.adcMax, Math.round((v / host.adcVref) * host.adcMax)));
      },
      analogReadResolution: () => undefined,
      analogWriteFrequency: () => undefined,
      analogReference: () => undefined,
      ledcSetup: (_ch: number) => undefined,
      ledcAttachPin: (pin: unknown, ch: number) => {
        self.ledc.set(ch, self.pinOf(pin));
      },
      ledcWrite: (ch: number, duty: number) => {
        const p = self.ledc.get(ch);
        if (!p) return;
        self.modes[p] = 'out';
        self.duty[p] = Math.max(0, Math.min(255, duty)) / 255;
        self.levels[p] = duty > 127;
      },
      dacWrite: (pin: unknown, v: number) => {
        const p = self.pinOf(pin);
        self.modes[p] = 'out';
        self.duty[p] = Math.max(0, Math.min(255, v)) / 255;
      },
      tone: (pin: unknown, freq: number, dur?: number) => {
        const p = self.pinOf(pin);
        self.toneUntil[p] = dur ? host.nowMs() + dur : Number.POSITIVE_INFINITY;
        self.modes[p] = 'out';
        self.duty[p] = 0.5;
        self.levels[p] = true;
        void freq;
      },
      noTone: (pin: unknown) => {
        const p = self.pinOf(pin);
        delete self.toneUntil[p];
        delete self.duty[p];
        self.levels[p] = false;
      },
      pulseIn: (pin: unknown) => {
        const p = self.pinOf(pin);
        const dev = host.attached(p, ['echo'], ['hc-sr04']);
        if (!dev || !dev.powered) return 0;
        const cm = Math.max(2, Math.min(400, Number(dev.props.distance ?? 50)));
        return Math.round(cm * 58);
      },
      millis: () => Math.floor(host.nowMs()),
      micros: () => Math.floor(host.nowMs() * 1000),
      Serial: {
        begin: () => undefined,
        end: () => undefined,
        available: () => 0,
        read: () => -1,
        print: (v: unknown) => {
          self.serialBuf += self.fmt(v);
        },
        println: (v?: unknown) => {
          self.serialBuf += (v === undefined ? '' : self.fmt(v)) + '';
          self.serialLines.push(self.serialBuf);
          self.serialBuf = '';
        },
        write: (v: unknown) => {
          self.serialBuf += self.fmt(v);
        }
      },
      /** Blocking delays are generators; the transpiler wraps calls with yield*. */
      delay: function* (ms: number) {
        const until = host.nowMs() + Math.max(0, ms);
        yield until;
      },
      delayMicroseconds: function* (us: number) {
        const until = host.nowMs() + Math.max(0, us) / 1000;
        yield until;
      }
    };
    // ── Devices ──────────────────────────────────────────────────────
    api.Servo = class {
      compId: string | null = null;
      attach(pin: unknown) {
        const p = self.pinOf(pin);
        const dev = host.attached(p, ['orange'], ['servo-sg90']);
        this.compId = dev ? dev.compId : null;
        if (this.compId) host.setMemory(this.compId, 'angle', 90);
      }
      write(angle: number) {
        if (this.compId) host.setMemory(this.compId, 'angle', Math.max(0, Math.min(180, angle)));
      }
      writeMicroseconds(us: number) {
        if (this.compId) host.setMemory(this.compId, 'angle', Math.max(0, Math.min(180, ((us - 1000) / 1000) * 180)));
      }
      detach() {
        this.compId = null;
      }
    };
    api.DHT = class {
      pin: string;
      constructor(pin: unknown) {
        this.pin = self.pinOf(pin);
      }
      begin() {
        return undefined;
      }
      readTemperature() {
        const dev = host.attached(this.pin, ['data'], ['dht11', 'dht22']);
        if (!dev || !dev.powered) return Number.NaN;
        return Number(dev.props.celsius ?? 25);
      }
      readHumidity() {
        const dev = host.attached(this.pin, ['data'], ['dht11', 'dht22']);
        if (!dev || !dev.powered) return Number.NaN;
        return Number(dev.props.humidity ?? 50);
      }
    };
    api.LiquidCrystal = class {
      id: string | null = null;
      constructor(rs: unknown, en: unknown, d4: unknown, d5: unknown, d6: unknown, d7: unknown) {
        void en;
        void d4;
        void d5;
        void d6;
        void d7;
        const dev = host.attached(self.pinOf(rs), ['rs'], ['lcd-16x2']);
        this.id = dev ? dev.compId : null;
      }
      begin() {
        return undefined;
      }
      clear() {
        if (this.id) {
          self.lcdBuf.set(this.id, ['', '']);
          self.lcdCursor.set(this.id, { x: 0, y: 0 });
          self.textOut[this.id] = '\n';
        }
      }
      setCursor(x: number, y: number) {
        if (this.id) self.lcdCursor.set(this.id, { x, y });
      }
      print(v: unknown) {
        if (this.id) self.lcdWrite(this.id, self.fmt(v));
      }
    };
    api.LiquidCrystal_I2C = class {
      id: string | null = null;
      constructor(addr: number, cols?: number, rows?: number) {
        void addr;
        void cols;
        void rows;
        const dev = host.i2cAvailable() ? host.attached('I2C', ['sda'], ['lcd-i2c']) : null;
        this.id = dev ? dev.compId : null;
      }
      init() {
        return undefined;
      }
      begin() {
        return undefined;
      }
      backlight() {
        return undefined;
      }
      clear() {
        if (this.id) {
          self.lcdBuf.set(this.id, ['', '']);
          self.lcdCursor.set(this.id, { x: 0, y: 0 });
          self.textOut[this.id] = '\n';
        }
      }
      setCursor(x: number, y: number) {
        if (this.id) self.lcdCursor.set(this.id, { x, y });
      }
      print(v: unknown) {
        if (this.id) self.lcdWrite(this.id, self.fmt(v));
      }
    };
    api.Stepper = class {
      compId: string | null = null;
      constructor(steps: number, a: unknown, b: unknown, c: unknown, d: unknown) {
        void steps;
        // Bind to the 28BYJ-48 module whose IN1 is wired to the first coil pin.
        const dev = host.attached(self.pinOf(a), ['in1'], ['stepper-28byj']);
        void b;
        void c;
        void d;
        this.compId = dev ? dev.compId : null;
      }
      setSpeed(v: number) {
        void v;
      }
      step(n: number) {
        if (this.compId) host.setMemory(this.compId, 'steps', n);
      }
    };
    api.Adafruit_SSD1306 = class {
      id: string | null = null;
      lines: string[] = [''];
      constructor(w: number, h: number) {
        void w;
        void h;
        const dev = host.i2cAvailable() ? host.attached('I2C', ['sda'], ['oled-ssd1306']) : null;
        this.id = dev ? dev.compId : null;
      }
      begin() {
        return true;
      }
      clearDisplay() {
        this.lines = [''];
        this.flush();
      }
      setTextSize() {
        return undefined;
      }
      setTextColor() {
        return undefined;
      }
      setCursor() {
        return undefined;
      }
      print(v: unknown) {
        this.lines[this.lines.length - 1] += self.fmt(v);
      }
      println(v?: unknown) {
        this.lines[this.lines.length - 1] += v === undefined ? '' : self.fmt(v);
        this.lines.push('');
      }
      display() {
        this.flush();
      }
      flush() {
        if (this.id) self.textOut[this.id] = this.lines.slice(-6).join('\n');
      }
    };
    api.Adafruit_BMP280 = class {
      begin() {
        return true;
      }
      readPressure() {
        const dev = host.i2cAvailable() ? host.attached('I2C', ['sda'], ['bmp280']) : null;
        return dev ? Number(dev.props.hpa ?? 1013) * 100 : 0;
      }
      readTemperature() {
        const dev = host.i2cAvailable() ? host.attached('I2C', ['sda'], ['bmp280']) : null;
        return dev ? Number(dev.props.celsius ?? 25) : Number.NaN;
      }
      readAltitude(seaHpa?: number) {
        const dev = host.i2cAvailable() ? host.attached('I2C', ['sda'], ['bmp280']) : null;
        const p = dev ? Number(dev.props.hpa ?? 1013) : 1013;
        const ref = seaHpa ?? 1013.25;
        return 44330 * (1 - Math.pow(p / ref, 0.1903));
      }
    };
    api.BMP280 = api.Adafruit_BMP280;
    api.Wire = {
      begin: () => undefined,
      setClock: () => undefined
    };
    api.Serial1 = api.Serial;
    return api;
  }
}
