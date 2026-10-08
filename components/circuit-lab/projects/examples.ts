/**
 * Ready-made example projects. Each one is plain data: placed components with
 * their property values, wires between pin ids, an MCU sketch where needed,
 * and bilingual guidance (summary, step-by-step, explanation).
 *
 * Wires use "partId.pinId" endpoints: `uno.D13`, `r1.a`, `bb.h5a`. Breadboard
 * holes are referenced as `h{column}{row}` and rails as `r+{n}` / `r-{n}`.
 */

import { getPart } from '../parts/registry';
import type { PlacedComponent, PlacedWire, WireColor, PropValue } from '../types';

export interface Bilingual {
  en: string;
  bn: string;
}

export interface ExampleProject {
  id: string;
  /** English name (also used as the project name when loaded). */
  name: string;
  title: Bilingual;
  summary: Bilingual;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Ordered build steps. */
  steps: Bilingual[];
  /** How the circuit works. */
  explanation: Bilingual;
  components: PlacedComponent[];
  wires: PlacedWire[];
}

// ── Breadboard geometry (matches parts/holes.ts) ───────────────────────────

const BB = { x: 300, y: 80 };
const ROW_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9 };
/** World position of breadboard hole (column 1-based, row letter). */
function holeAt(col: number, row: string): { x: number; y: number } {
  const r = ROW_INDEX[row];
  const gap = r >= 5 ? 20 : 0;
  return { x: BB.x + 20 + (col - 1) * 10, y: BB.y + 50 + r * 10 + gap };
}

/** Origin for a part (rotation 0) so that `pinId` sits exactly on hole (col,row). */
function placeOnHole(partId: string, pinId: string, col: number, row: string): { x: number; y: number } {
  const def = getPart(partId);
  if (!def) throw new Error(`Unknown part ${partId}`);
  const pin = def.pins.find((p) => p.id === pinId);
  if (!pin) throw new Error(`Unknown pin ${partId}.${pinId}`);
  const h = holeAt(col, row);
  return { x: h.x - pin.x, y: h.y - pin.y };
}

// ── Builders ────────────────────────────────────────────────────────────────

function C(id: string, partId: string, x: number, y: number, props: Record<string, PropValue> = {}, code?: string): PlacedComponent {
  const def = getPart(partId);
  if (!def) throw new Error(`Unknown part ${partId}`);
  return { id, partId, x, y, rotation: 0, flipH: false, props: { ...def.defaults, ...props }, state: {}, ...(code ? { code } : {}) };
}

function W(id: string, from: string, to: string, color: WireColor = 'blue'): PlacedWire {
  const [fc, fp] = from.split('.');
  const [tc, tp] = to.split('.');
  return { id, from: { compId: fc, pinId: fp }, to: { compId: tc, pinId: tp }, color, waypoints: [] };
}

// ── Sketches ────────────────────────────────────────────────────────────────

const SKETCH_BLINK = `// LED blink — the "hello world" of microcontrollers.
// Pin 13 drives the LED through a 220 Ω resistor.
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("LED blink started");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
`;

const SKETCH_TRAFFIC = `// Traffic light: red 3 s, yellow 1 s, green 3 s, yellow 1 s.
const int RED = 12;
const int YELLOW = 11;
const int GREEN = 10;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
}

void setLights(bool r, bool y, bool g) {
  digitalWrite(RED, r);
  digitalWrite(YELLOW, y);
  digitalWrite(GREEN, g);
}

void loop() {
  setLights(HIGH, LOW, LOW);
  delay(3000);
  setLights(HIGH, HIGH, LOW);
  delay(1000);
  setLights(LOW, LOW, HIGH);
  delay(3000);
  setLights(LOW, HIGH, LOW);
  delay(1000);
}
`;

const SKETCH_MOTOR_PWM = `// Transistor switch: ramp a DC motor up and down with PWM on the base.
const int BASE_PIN = 9;

void setup() {
  pinMode(BASE_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int duty = 0; duty <= 255; duty += 5) {
    analogWrite(BASE_PIN, duty);
    delay(40);
  }
  for (int duty = 255; duty >= 0; duty -= 5) {
    analogWrite(BASE_PIN, duty);
    delay(40);
  }
  Serial.println("cycle done");
}
`;

const SKETCH_ULTRASONIC = `// Ultrasonic distance meter (HC-SR04). Prints cm to Serial and lights D13 when close.
const int TRIG = 9;
const int ECHO = 10;
const int LED = 13;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

float readDistanceCm() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long duration = pulseIn(ECHO, HIGH);
  return duration / 58.0;
}

void loop() {
  float cm = readDistanceCm();
  Serial.print("Distance: ");
  Serial.print(cm);
  Serial.println(" cm");
  digitalWrite(LED, cm < 20 ? HIGH : LOW);
  delay(250);
}
`;

const SKETCH_DHT = `// Weather display: DHT11 on D2, I²C LCD 16x2 on A4/A5.
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  dht.begin();
  lcd.init();
  lcd.backlight();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(t);
  lcd.setCursor(0, 1);
  lcd.print("Humid: ");
  lcd.print(h);
  delay(2000);
}
`;

const SKETCH_ESP32_OLED = `// ESP32 + SSD1306 OLED on I²C (SDA = GPIO21, SCL = GPIO22).
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
int counter = 0;

void setup() {
  Serial.begin(115200);
  display.begin();
  display.clearDisplay();
}

void loop() {
  display.clearDisplay();
  display.println("Hello ESP32!");
  display.print("Count: ");
  display.println(counter);
  display.display();
  Serial.println(counter);
  counter++;
  delay(1000);
}
`;

const SKETCH_MOTOR_DRIVER = `// L293D driver: spin the motor forward 2 s, stop 1 s, reverse 2 s, stop 1 s.
const int IN1 = 8;
const int IN2 = 9;

void setup() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
}

void forward() { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); }
void backward() { digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH); }
void stopMotor() { digitalWrite(IN1, LOW); digitalWrite(IN2, LOW); }

void loop() {
  forward();
  delay(2000);
  stopMotor();
  delay(1000);
  backward();
  delay(2000);
  stopMotor();
  delay(1000);
}
`;

const SKETCH_SERVO = `// Servo sweep: 0° → 180° → 0° on pin 9.
#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
}

void loop() {
  for (int angle = 0; angle <= 180; angle += 2) {
    myServo.write(angle);
    delay(15);
  }
  for (int angle = 180; angle >= 0; angle -= 2) {
    myServo.write(angle);
    delay(15);
  }
}
`;

const SKETCH_POT = `// Potentiometer dimmer: A0 sets the brightness of the LED on PWM pin 9.
void setup() {
  pinMode(9, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  int brightness = map(raw, 0, 1023, 0, 255);
  analogWrite(9, brightness);
  Serial.print("raw=");
  Serial.print(raw);
  Serial.print(" pwm=");
  Serial.println(brightness);
  delay(100);
}
`;

const SKETCH_LDR = `// Night light: LED on D13 turns on when the LDR divider reads dark.
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(A0);
  if (light < 400) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
  Serial.println(light);
  delay(200);
}
`;

// ── Example list ────────────────────────────────────────────────────────────

const blink: ExampleProject = {
  id: 'led-blink',
  name: 'LED blink (Uno)',
  title: { en: 'LED blink with Arduino Uno', bn: 'Arduino Uno দিয়ে LED ব্লিঙ্ক' },
  summary: {
    en: 'Blink an LED on a breadboard from pin 13 — the first program every maker writes.',
    bn: 'ব্রেডবোর্ডে একটি LED ১৩ নম্বর পিন থেকে জ্বালিয়ে-নিভিয়ে ব্লিঙ্ক করান।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place the Arduino Uno to the left and the breadboard to the right.', bn: 'বাম দিকে Arduino Uno এবং ডান দিকে ব্রেডবোর্ড রাখুন।' },
    { en: 'Insert the 220 Ω resistor across the centre channel (columns 5 and 9).', bn: 'মাঝের ফাঁক জুড়ে ৫ ও ৯ নম্বর কলামে ২২০ Ω রোধক বসান।' },
    { en: 'Insert the LED so its anode (+) shares column 9 with the resistor, and its cathode (−) sits in column 10.', bn: 'LED-এর অ্যানোড (+) ৯ নম্বর কলামে ও ক্যাথোড (−) ১০ নম্বর কলামে বসান।' },
    { en: 'Wire D13 to column 5, and the cathode and GND to the blue (−) rail.', bn: 'D13 পিন ৫ নম্বর কলামে, এবং LED-এর ক্যাথোড ও GND নীল (−) রেলে যোগ করুন।' },
    { en: 'Press Run. The LED blinks once per second.', bn: 'Run চাপুন। LED প্রতি সেকেন্ডে একবার জ্বলবে-নিভবে।' }
  ],
  explanation: {
    en: 'When the pin is HIGH (5 V) current flows through the resistor and LED to GND; the resistor limits the current to about (5 − 2) / 220 ≈ 14 mA. LOW turns it off. The sketch repeats every 500 ms + 500 ms.',
    bn: 'পিন HIGH (৫ V) হলে রোধক ও LED দিয়ে GND-তে কারেন্ট যায়; রোধক কারেন্ট প্রায় (৫ − ২) / ২২০ ≈ ১৪ mA-তে সীমিত রাখে। LOW হলে LED নিভে যায়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_BLINK),
    C('bb', 'breadboard-full', BB.x, BB.y),
    C('r1', 'resistor', placeOnHole('resistor', 'a', 5, 'b').x, placeOnHole('resistor', 'a', 5, 'b').y, { ohms: 220 }),
    C('led1', 'led-red', placeOnHole('led-red', 'anode', 9, 'a').x, placeOnHole('led-red', 'anode', 9, 'a').y, { color: 'red' })
  ],
  wires: [W('w1', 'uno.D13', 'bb.h5a', 'yellow'), W('w2', 'uno.GND_T', 'bb.r-1', 'black'), W('w3', 'led1.cathode', 'bb.r-1', 'black')]
};

const traffic: ExampleProject = {
  id: 'traffic-light',
  name: 'Traffic light (Uno)',
  title: { en: 'Traffic light controller', bn: 'ট্রাফিক সিগন্যাল কন্ট্রোলার' },
  summary: {
    en: 'Three LEDs (red, yellow, green) cycle like a real junction, controlled by functions and delay().',
    bn: 'লাল, হলুদ, সবুজ — তিনটি LED ফাংশন ও delay() দিয়ে আসল সিগন্যালের মতো চক্রাকারে জ্বলে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place three LEDs with 220 Ω resistors on the bench.', bn: 'বেঞ্চে তিনটি LED ও প্রতিটির সাথে ২২০ Ω রোধক রাখুন।' },
    { en: 'Connect D12 → resistor → red LED anode; D11 → yellow; D10 → green.', bn: 'D12 → রোধক → লাল LED; D11 → হলুদ; D10 → সবুজ।' },
    { en: 'Connect every LED cathode to the Uno GND pin.', bn: 'সব LED-এর ক্যাথোড Uno-এর GND-তে যোগ করুন।' },
    { en: 'Run the sketch and watch the 3-1-3-1 second cycle.', bn: 'Run করে ৩-১-৩-১ সেকেন্ডের চক্র দেখুন।' }
  ],
  explanation: {
    en: 'Each light is a digital output. setLights() takes three booleans, so the loop reads like the traffic plan. Every delay() advances the simulated clock — the same way real firmware waits.',
    bn: 'প্রতিটি বাতি একটি ডিজিটাল আউটপুট। setLights() তিনটি true/false নেয়, তাই loop() পড়তে সহজ। প্রতিটি delay() সিমুলেটেড সময় এগিয়ে নেয়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_TRAFFIC),
    C('rr', 'resistor', 360, 60, { ohms: 220 }),
    C('ry', 'resistor', 360, 140, { ohms: 220 }),
    C('rg', 'resistor', 360, 220, { ohms: 220 }),
    C('ledr', 'led-red', 460, 40, { color: 'red' }),
    C('ledy', 'led-yellow', 460, 120, { color: 'yellow' }),
    C('ledg', 'led-green', 460, 200, { color: 'green' })
  ],
  wires: [
    W('w2', 'uno.D12', 'rr.a', 'red'),
    W('w3', 'rr.b', 'ledr.anode', 'red'),
    W('w4', 'uno.D11', 'ry.a', 'yellow'),
    W('w5', 'ry.b', 'ledy.anode', 'yellow'),
    W('w6', 'uno.D10', 'rg.a', 'green'),
    W('w7', 'rg.b', 'ledg.anode', 'green'),
    W('w8', 'ledr.cathode', 'uno.GND_T', 'black'),
    W('w9', 'ledy.cathode', 'uno.GND_T', 'black'),
    W('w10', 'ledg.cathode', 'uno.GND_T', 'black')
  ]
};

const astable: ExampleProject = {
  id: 'ne555-astable',
  name: '555 astable oscillator',
  title: { en: '555 timer as a blinking oscillator', bn: '৫৫৫ টাইমার দিয়ে অসিলেটর' },
  summary: {
    en: 'A classic NE555 in astable mode blinks an LED at about 1.5 Hz. No microcontroller needed.',
    bn: 'NE555 অ্যাস্টেবল মোডে প্রায় ১.৫ Hz-এ LED জ্বালায়। কোনো মাইক্রোকন্ট্রোলার লাগে না।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place the 555, a 9 V battery, R1 = 1 kΩ, R2 = 47 kΩ, C = 10 µF, and the LED with 330 Ω.', bn: '৫৫৫, ৯ V ব্যাটারি, R1 = ১ kΩ, R2 = ৪৭ kΩ, C = ১০ µF, এবং LED + ৩৩০ Ω রাখুন।' },
    { en: 'Tie pins 4 (RESET) and 8 (VCC) to the battery +; pin 1 (GND) to the battery −.', bn: 'পিন ৪ (RESET) ও ৮ (VCC) ব্যাটারি +-এ, পিন ১ (GND) ব্যাটারি −-এ।' },
    { en: 'Wire R1 from + to pin 7; R2 from pin 7 to pins 2 and 6; C from pins 2/6 to GND.', bn: 'R1: + থেকে ৭ নম্বরে; R2: ৭ থেকে ২ ও ৬ নম্বরে; C: ২/৬ থেকে GND-তে।' },
    { en: 'Pin 3 (OUT) drives the LED through 330 Ω to GND. Press Run.', bn: 'পিন ৩ (OUT) → ৩৩০ Ω → LED → GND। Run চাপুন।' }
  ],
  explanation: {
    en: 'C charges through R1 + R2 to 2/3 Vcc, then discharges through R2 to 1/3 Vcc. f = 1.44 / ((R1 + 2·R2)·C) ≈ 1.44 / (95 kΩ × 10 µF) ≈ 1.5 Hz. The simulator solves the RC charging curve in time steps, so the blink follows the real exponential.',
    bn: 'C, R1 + R2 দিয়ে ২/৩ Vcc পর্যন্ত চার্জ হয়, তারপর R2 দিয়ে ১/৩ Vcc পর্যন্ত ডিসচার্জ। f = 1.44 / ((R1 + 2·R2)·C) ≈ ১.৫ Hz।'
  },
  components: [
    C('ic', 'ne555', 420, 140),
    C('bat', 'battery-9v', 80, 40, { volts: 9 }),
    C('r1', 'resistor', 220, 60, { ohms: 1000 }),
    C('r2', 'resistor', 220, 130, { ohms: 47000 }),
    C('c1', 'electrolytic-cap', 200, 220, { farads: 10e-6, volts: 16 }),
    C('rl', 'resistor', 600, 220, { ohms: 330 }),
    C('led', 'led-green', 600, 140, { color: 'green' })
  ],
  wires: [
    W('w1', 'bat.pos', 'ic.8', 'red'),
    W('w2', 'bat.pos', 'ic.4', 'red'),
    W('w3', 'bat.pos', 'r1.a', 'red'),
    W('w4', 'bat.neg', 'ic.1', 'black'),
    W('w5', 'r1.b', 'ic.7', 'blue'),
    W('w6', 'r2.a', 'ic.7', 'blue'),
    W('w7', 'r2.b', 'ic.2', 'green'),
    W('w8', 'ic.2', 'ic.6', 'green'),
    W('w9', 'c1.pos', 'ic.2', 'yellow'),
    W('w10', 'c1.neg', 'bat.neg', 'black'),
    W('w11', 'ic.3', 'rl.a', 'orange'),
    W('w12', 'rl.b', 'led.anode', 'orange'),
    W('w13', 'led.cathode', 'bat.neg', 'black')
  ]
};

const rcFilter: ExampleProject = {
  id: 'rc-lowpass',
  name: 'RC low-pass filter',
  title: { en: 'RC low-pass filter with oscilloscope', bn: 'RC লো-পাস ফিল্টার ও অসিলোস্কোপ' },
  summary: {
    en: 'A 200 Hz square-ish sine passes through an RC filter: watch the output shrink and lag on the scope.',
    bn: '২০০ Hz সাইন সংকেত RC ফিল্টারে গেলে স্ক্রিনে আউটপুট কমে ও পিছিয়ে যায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place the function generator (2 V peak, 200 Hz) and a 10 kΩ resistor on the breadboard.', bn: 'ফাংশন জেনারেটর (২ V পিক, ২০০ Hz) ও ১০ kΩ রোধক রাখুন।' },
    { en: 'Put the 100 nF capacitor across the output and GND.', bn: '১০০ nF ক্যাপাসিটর আউটপুট ও GND-র মাঝে বসান।' },
    { en: 'Connect the scope CH1 to the junction between R and C, CH2 to the generator output.', bn: 'অসিলোস্কোপের CH1 R-C সংযোগবিন্দুতে, CH2 জেনারেটর আউটপুটে।' },
    { en: 'Run and compare the two traces.', bn: 'Run করে দুটি তরঙ্গরূপ তুলনা করুন।' }
  ],
  explanation: {
    en: 'The cut-off frequency is fc = 1 / (2πRC) = 1 / (2π · 10 kΩ · 100 nF) ≈ 159 Hz. At 200 Hz the output is attenuated to about 0.6 of the input and phase-shifted. Below fc, the signal passes almost unchanged.',
    bn: 'কাট-অফ ফ্রিকোয়েন্সি fc = 1 / (2πRC) ≈ ১৫৯ Hz। ২০০ Hz-এ আউটপুট প্রায় ০.৬ গুণ হয় ও ফেজ পিছিয়ে যায়।'
  },
  components: [
    C('fg', 'ac-source', 60, 120, { freq: 200, amp: 2, offset: 0 }),
    C('r1', 'resistor', 260, 80, { ohms: 10000 }),
    C('c1', 'ceramic-cap', 400, 170, { farads: 100e-9 }),
    C('scope', 'oscilloscope', 520, 40, { div: 0.002 })
  ],
  wires: [
    W('w1', 'fg.out', 'r1.a', 'yellow'),
    W('w2', 'r1.b', 'c1.a', 'green'),
    W('w3', 'c1.b', 'fg.gnd', 'black'),
    W('w4', 'scope.ch1', 'r1.b', 'blue'),
    W('w5', 'scope.ch2', 'fg.out', 'orange'),
    W('w6', 'scope.gnd', 'fg.gnd', 'black')
  ]
};

const transistor: ExampleProject = {
  id: 'transistor-switch',
  name: 'Transistor switch (PWM motor)',
  title: { en: 'Transistor as a switch for a motor', bn: 'ট্রানজিস্টর দিয়ে মোটর সুইচ' },
  summary: {
    en: 'A BC547 lets a 3 V pin control a 6 V motor. PWM on the base sets the speed.',
    bn: 'BC547 ট্রানজিস্টর দিয়ে ৩/৫ V পিন দিয়ে ৬ V মোটর চালানো যায়। বেসে PWM গতি ঠিক করে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Connect the 6 V AA pack + to the motor terminal M+, and the motor M− to the BC547 collector.', bn: '৬ V AA প্যাক + থেকে মোটর M+, এবং M− থেকে BC547-এর কালেক্টরে।' },
    { en: 'Connect the emitter to GND, and the AA pack − to GND too (common ground).', bn: 'এমিটার GND-তে, এবং AA প্যাক − ও GND-তে (কমন গ্রাউন্ড)।' },
    { en: 'D9 → 1 kΩ → base. Put the 1N4007 flyback diode across the motor (cathode to M+).', bn: 'D9 → ১ kΩ → বেস। মোটরের উপর 1N4007 ফ্লাইব্যাক ডায়োড (ক্যাথোড M+-এ)।' },
    { en: 'Run: the motor speeds up and slows down with the PWM ramp.', bn: 'Run করুন: PWM র‍্যাম্পে মোটরের গতি ওঠানামা করবে।' }
  ],
  explanation: {
    en: 'The BC547 is an NPN switch: about 1 kΩ base resistor sets Ib ≈ (3.3 − 0.7)/1 kΩ ≈ 2.6 mA, which saturates the transistor so the motor sees almost the full 6 V. The diode absorbs the motor’s inductive spike when the transistor turns off.',
    bn: 'BC547 একটি NPN সুইচ। ১ kΩ বেস রোধক Ib ≈ ২.৬ mA দেয়, যা ট্রানজিস্টরকে সম্পৃক্ত করে। ডায়োড মোটরের ইনডাক্টিভ স্পাইক শোষণ করে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_MOTOR_PWM),
    C('bat', 'battery-aa4', 80, 300, { volts: 6 }),
    C('rb', 'resistor', 280, 120, { ohms: 1000 }),
    C('q1', 'bc547', 380, 150, { beta: 200 }),
    C('m1', 'dc-motor', 420, 280, { rpm: 150 }),
    C('d1', 'diode-1n4007', 520, 240)
  ],
  wires: [
    W('w1', 'uno.D9', 'rb.a', 'yellow'),
    W('w2', 'rb.b', 'q1.b', 'yellow'),
    W('w3', 'q1.c', 'm1.b', 'orange'),
    W('w4', 'bat.pos', 'm1.a', 'red'),
    W('w5', 'q1.e', 'uno.GND_T', 'black'),
    W('w6', 'bat.neg', 'uno.GND_T', 'black'),
    W('w7', 'd1.cathode', 'm1.a', 'red'),
    W('w8', 'd1.anode', 'm1.b', 'black')
  ]
};

const ultrasonic: ExampleProject = {
  id: 'ultrasonic-distance',
  name: 'Ultrasonic distance meter',
  title: { en: 'Ultrasonic distance meter (HC-SR04)', bn: 'আল্ট্রাসনিক দূরত্ব মাপক (HC-SR04)' },
  summary: {
    en: 'Measure distance with sound: the sketch times the echo and prints centimetres to the serial monitor.',
    bn: 'শব্দ দিয়ে দূরত্ব মাপুন: স্কেচ প্রতিধ্বনির সময় মেপে সেন্টিমিটার প্রিন্ট করে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place the HC-SR04. Connect VCC to 5 V, GND to GND.', bn: 'HC-SR04 বসান। VCC → 5 V, GND → GND।' },
    { en: 'TRIG → D9 and ECHO → D10.', bn: 'TRIG → D9 এবং ECHO → D10।' },
    { en: 'Put an LED on D13 (with resistor) to show "close".', bn: 'কাছে এলে দেখাতে D13-এ LED (রোধকসহ) যোগ করুন।' },
    { en: 'Open the Serial monitor, press Run, and set the object distance in the inspector.', bn: 'Serial মনিটর খুলুন, Run চাপুন এবং ইন্সপেক্টরে বস্তুর দূরত্ব বদলান।' }
  ],
  explanation: {
    en: 'TRIG sends a 10 µs pulse; the module emits eight 40 kHz bursts and raises ECHO for the round-trip time. Sound travels ~58 µs per cm round-trip, so distance (cm) = duration (µs) / 58.',
    bn: 'TRIG-এ ১০ µs পালস যায়; মডিউল ECHO-কে সময়ের জন্য HIGH রাখে। শব্দ প্রতি সেমি (যাওয়া-আসা) প্রায় ৫৮ µs নেয়, তাই দূরত্ব = সময়(µs)/৫৮।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_ULTRASONIC),
    C('hc', 'hc-sr04', 380, 60, { distance: 50 }),
    C('rl', 'resistor', 380, 220, { ohms: 220 }),
    C('led', 'led-red', 470, 220, { color: 'red' })
  ],
  wires: [
    W('w1', 'hc.vcc', 'uno.5V', 'red'),
    W('w2', 'hc.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'hc.trig', 'uno.D9', 'yellow'),
    W('w4', 'hc.echo', 'uno.D10', 'green'),
    W('w5', 'uno.D13', 'rl.a', 'blue'),
    W('w6', 'rl.b', 'led.anode', 'blue'),
    W('w7', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

const dht: ExampleProject = {
  id: 'dht11-weather',
  name: 'DHT11 weather display (LCD I²C)',
  title: { en: 'Weather station: DHT11 + LCD', bn: 'আবহাওয়া প্রদর্শক: DHT11 + LCD' },
  summary: {
    en: 'Read temperature and humidity every two seconds and show them on a 16×2 I²C LCD.',
    bn: 'প্রতি দুই সেকেন্ডে তাপমাত্রা ও আর্দ্রতা পড়ে I²C LCD-তে দেখায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place the DHT11, the I²C LCD, and a 10 kΩ pull-up between DATA and 5 V.', bn: 'DHT11, I²C LCD ও DATA-এবং 5 V-র মাঝে ১০ kΩ পুল-আপ বসান।' },
    { en: 'DHT DATA → D2. LCD SDA → A4, SCL → A5, VCC → 5 V, GND → GND.', bn: 'DHT DATA → D2। LCD SDA → A4, SCL → A5, VCC → 5 V, GND → GND।' },
    { en: 'Run. Change temperature/humidity in the inspector to see the LCD update.', bn: 'Run করুন। ইন্সপেক্টরে তাপমাত্রা/আর্দ্রতা বদলালে LCD আপডেট হবে।' }
  ],
  explanation: {
    en: 'DHT11 uses a single-wire protocol; the pull-up keeps DATA high when idle. The I²C backpack reduces the LCD to two wires plus power: the Wire library handles addressing (0x27).',
    bn: 'DHT11 এক-তারের প্রটোকল ব্যবহার করে; পুল-আপ নিষ্ক্রিয় অবস্থায় DATA-কে HIGH রাখে। I²C ব্যাকপ্যাক LCD-কে দুই তারে নামিয়ে আনে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_DHT),
    C('dht', 'dht11', 420, 60, { celsius: 27, humidity: 62 }),
    C('pu', 'resistor', 420, 170, { ohms: 10000 }),
    C('lcd', 'lcd-i2c', 420, 240, { line1: 'Temp: 27.0', line2: 'Humid: 62' })
  ],
  wires: [
    W('w1', 'dht.vcc', 'uno.5V', 'red'),
    W('w2', 'dht.gnd', 'uno.GND_B1', 'black'),
    W('w3', 'dht.data', 'uno.D2', 'yellow'),
    W('w4', 'pu.a', 'uno.5V', 'red'),
    W('w5', 'pu.b', 'dht.data', 'yellow'),
    W('w6', 'lcd.sda', 'uno.A4', 'green'),
    W('w7', 'lcd.scl', 'uno.A5', 'white'),
    W('w8', 'lcd.vcc', 'uno.5V', 'red'),
    W('w9', 'lcd.gnd', 'uno.GND_B2', 'black')
  ]
};

const esp32Oled: ExampleProject = {
  id: 'esp32-oled',
  name: 'ESP32 + OLED display',
  title: { en: 'ESP32 with an OLED screen', bn: 'ESP32 ও OLED স্ক্রিন' },
  summary: {
    en: 'A 3.3 V ESP32 drives a 128×64 SSD1306 OLED over I²C and prints a live counter.',
    bn: '৩.৩ V ESP32 I²C-এর মাধ্যমে SSD1306 OLED চালিয়ে লাইভ কাউন্টার দেখায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place the ESP32 DevKit (30-pin) and the SSD1306 OLED.', bn: 'ESP32 DevKit (৩০-পিন) ও SSD1306 OLED বসান।' },
    { en: 'OLED VCC → 3V3, GND → GND. Do not use 5 V: the ESP32 is 3.3 V logic.', bn: 'OLED VCC → 3V3, GND → GND। ৫ V ব্যবহার করবেন না — ESP32 ৩.৩ V লজিক।' },
    { en: 'OLED SDA → GPIO21 (D21), SCL → GPIO22 (D22).', bn: 'OLED SDA → GPIO21 (D21), SCL → GPIO22 (D22)।' },
    { en: 'Run. The counter increments every second on the OLED and in the serial monitor.', bn: 'Run করুন। কাউন্টার OLED ও সিরিয়াল মনিটরে প্রতি সেকেন্ডে বাড়বে।' }
  ],
  explanation: {
    en: 'I²C is a shared bus: SDA carries data, SCL the clock, and both need pull-ups (most breakout boards include them). The ESP32’s default I²C pins are 21 and 22. Every write goes to the OLED at address 0x3C.',
    bn: 'I²C একটি শেয়ার্ড বাস: SDA ডেটা, SCL ক্লক। দুটিতেই পুল-আপ লাগে (অধিকাংশ ব্রেকআউটে থাকে)। ESP32-এর ডিফল্ট I²C পিন ২১ ও ২২।'
  },
  components: [
    C('esp', 'esp32-devkit-30', 20, 60, {}, SKETCH_ESP32_OLED),
    C('oled', 'oled-ssd1306', 380, 80, { text: '' })
  ],
  wires: [
    W('w1', 'oled.vcc', 'esp.3V3', 'red'),
    W('w2', 'oled.gnd', 'esp.GND', 'black'),
    W('w3', 'oled.sda', 'esp.D21', 'green'),
    W('w4', 'oled.scl', 'esp.D22', 'white')
  ]
};

const motorDriver: ExampleProject = {
  id: 'l293d-motor',
  name: 'L293D motor driver',
  title: { en: 'Motor driver with L293D H-bridge', bn: 'L293D H-ব্রিজ দিয়ে মোটর ড্রাইভার' },
  summary: {
    en: 'Reverse a DC motor with two logic pins and an H-bridge. The bridge carries the motor current, not the Uno.',
    bn: 'দুটি লজিক পিন ও H-ব্রিজ দিয়ে DC মোটর ঘোরান। মোটরের কারেন্ট Uno বহন করে না, ব্রিজ করে।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place the L293D (16-pin) across the centre channel. Pin 8 (VCC2) and pin 1 (EN1) to 5 V.', bn: 'L293D (১৬-পিন) মাঝের ফাঁক জুড়ে রাখুন। পিন ৮ (VCC2) ও পিন ১ (EN1) → 5 V।' },
    { en: 'Pin 16 (VCC1) to the 6 V pack +, pins 4 and 5 to GND, the pack − to GND.', bn: 'পিন ১৬ (VCC1) → ৬ V প্যাক +, পিন ৪ ও ৫ → GND, প্যাক − → GND।' },
    { en: 'IN1 (pin 2) → D8, IN2 (pin 7) → D9. OUT1 (pin 3) and OUT2 (pin 6) go to the motor.', bn: 'IN1 (পিন ২) → D8, IN2 (পিন ৭) → D9। OUT1 (পিন ৩) ও OUT2 (পিন ৬) মোটরে।' },
    { en: 'Run. The motor spins forward, stops, reverses, and stops.', bn: 'Run করুন। মোটর সামনে, থামা, পেছনে, থামা — এভাবে ঘুরবে।' }
  ],
  explanation: {
    en: 'The H-bridge connects the motor between OUT1 and OUT2. Driving IN1 high and IN2 low sends current one way; swapping reverses it. The motor’s coil stores energy, so the L293D needs flyback diodes internally (the simulator omits them for clarity).',
    bn: 'H-ব্রিজ মোটরকে OUT1 ও OUT2-এর মাঝে যোগ করে। IN1 HIGH ও IN2 LOW করলে এক দিকে কারেন্ট যায়; বদলালে উল্টো দিকে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_MOTOR_DRIVER),
    C('drv', 'l293d', 360, 60),
    C('m1', 'dc-motor', 640, 120, { rpm: 150 }),
    C('bat', 'battery-aa4', 80, 320, { volts: 6 })
  ],
  wires: [
    W('w1', 'drv.1', 'uno.5V', 'red'),
    W('w2', 'drv.8', 'uno.5V', 'red'),
    W('w3', 'drv.2', 'uno.D8', 'yellow'),
    W('w4', 'drv.7', 'uno.D9', 'green'),
    W('w5', 'drv.3', 'm1.a', 'orange'),
    W('w6', 'drv.6', 'm1.b', 'orange'),
    W('w7', 'drv.16', 'bat.pos', 'red'),
    W('w8', 'drv.4', 'uno.GND_T', 'black'),
    W('w9', 'drv.5', 'uno.GND_T', 'black'),
    W('w10', 'bat.neg', 'uno.GND_T', 'black')
  ]
};

const servo: ExampleProject = {
  id: 'servo-sweep',
  name: 'Servo sweep (SG90)',
  title: { en: 'Servo sweep', bn: 'সার্ভো সুইপ (SG90)' },
  summary: {
    en: 'Sweep a micro servo from 0° to 180° and back using the Servo library.',
    bn: 'Servo লাইব্রেরি দিয়ে SG90 সার্ভো ০° থেকে ১৮০° এবং ফিরে আনুন।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place the SG90. Red → 5 V, brown → GND, orange (signal) → D9.', bn: 'SG90 বসান। লাল → 5 V, বাদামী → GND, কমলা (সিগন্যাল) → D9।' },
    { en: 'Run. Watch the arm sweep; the readout shows the current angle.', bn: 'Run করুন। আর্ম সুইপ করবে; রিডআউটে বর্তমান কোণ দেখাবে।' }
  ],
  explanation: {
    en: 'The servo expects a 50 Hz signal with a 1–2 ms pulse. The Servo library generates it for you; write(90) means 1.5 ms (centre). The sketch’s loop covers 0→180 with delays so the motion is smooth.',
    bn: 'সার্ভো ৫০ Hz-এ ১–২ ms পালস চায়। Servo লাইব্রেরি এটি তৈরি করে; write(90) মানে ১.৫ ms (মাঝামাঝি)।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_SERVO),
    C('sv', 'servo-sg90', 380, 80, { angle: 90 })
  ],
  wires: [
    W('w1', 'sv.red', 'uno.5V', 'red'),
    W('w2', 'sv.brown', 'uno.GND_B1', 'black'),
    W('w3', 'sv.orange', 'uno.D9', 'orange')
  ]
};

const pot: ExampleProject = {
  id: 'pot-dimmer',
  name: 'Potentiometer dimmer',
  title: { en: 'Potentiometer dimmer with PWM', bn: 'পটেনশিওমিটার দিয়ে ডিমার (PWM)' },
  summary: {
    en: 'Turn a 10 kΩ pot to set the LED brightness: analogRead on A0 becomes analogWrite on pin 9.',
    bn: '১০ kΩ পট ঘুরিয়ে LED-এর উজ্জ্বলতা বদলান: A0-তে analogRead, পিন ৯-এ analogWrite।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place the 10 kΩ pot. CW end → 5 V, CCW end → GND, wiper → A0.', bn: '১০ kΩ পট। CW → 5 V, CCW → GND, মধ্য পিন → A0।' },
    { en: 'LED anode → 220 Ω → D9, cathode → GND.', bn: 'LED অ্যানোড → ২২০ Ω → D9, ক্যাথোড → GND।' },
    { en: 'Run and turn the pot in the inspector. Brightness follows.', bn: 'Run করুন ও ইন্সপেক্টরে পট বদলান। উজ্জ্বলতা অনুসরণ করবে।' }
  ],
  explanation: {
    en: 'analogRead returns 0–1023 for 0–5 V. map() rescales that to 0–255 for analogWrite, which sets a PWM duty cycle. The LED’s average current — and so its brightness — tracks the wiper.',
    bn: 'analogRead ০–৫ V-কে ০–১০২৩ করে। map() সেটিকে ০–২৫৫-এ আনে, যা PWM ডিউটি সাইকেল ঠিক করে।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_POT),
    C('pot', 'potentiometer', 380, 60, { ohms: 10000, position: 50 }),
    C('rl', 'resistor', 380, 200, { ohms: 220 }),
    C('led', 'led-white', 480, 200, { color: 'white' })
  ],
  wires: [
    W('w1', 'pot.cw', 'uno.5V', 'red'),
    W('w2', 'pot.ccw', 'uno.GND_B1', 'black'),
    W('w3', 'pot.wiper', 'uno.A0', 'green'),
    W('w4', 'uno.D9', 'rl.a', 'yellow'),
    W('w5', 'rl.b', 'led.anode', 'yellow'),
    W('w6', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

const ldr: ExampleProject = {
  id: 'ldr-nightlight',
  name: 'LDR night light',
  title: { en: 'Automatic night light (LDR)', bn: 'স্বয়ংক্রিয় রাতের বাতি (LDR)' },
  summary: {
    en: 'A light-dependent resistor in a voltage divider turns on an LED when it gets dark.',
    bn: 'আলো-নির্ভর রোধক (LDR) ভোল্টেজ ডিভাইডারে থেকে অন্ধকার হলে LED জ্বালায়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place the LDR and a 10 kΩ resistor as a divider between 5 V and GND.', bn: 'LDR ও ১০ kΩ রোধক দিয়ে ৫ V ও GND-র মাঝে ডিভাইডার বানান।' },
    { en: 'Tap the middle node into A0.', bn: 'মাঝের সংযোগ A0-তে।' },
    { en: 'LED on D13 (with its resistor). Set the LDR light level to 20 lux in the inspector and run.', bn: 'D13-এ LED (রোধকসহ)। ইন্সপেক্টরে LDR আলো ২০ lux করে Run করুন।' }
  ],
  explanation: {
    en: 'In the dark the LDR is ~30 kΩ, so A0 sits near 1.1 V (about 230 counts). Under bright light its resistance drops and A0 rises above the 400-count threshold, switching the LED off.',
    bn: 'অন্ধকারে LDR প্রায় ৩০ kΩ, তাই A0 প্রায় ১.১ V (২৩০ কাউন্ট)। উজ্জ্বল আলোতে ৪০০-এর উপরে গেলে LED নিভে যায়।'
  },
  components: [
    C('uno', 'arduino-uno', 20, 60, {}, SKETCH_LDR),
    C('ldr', 'ldr', 380, 60, { lux: 20 }),
    C('rd', 'resistor', 380, 160, { ohms: 10000 }),
    C('rl', 'resistor', 500, 240, { ohms: 220 }),
    C('led', 'led-yellow', 600, 240, { color: 'yellow' })
  ],
  wires: [
    W('w1', 'ldr.a', 'uno.5V', 'red'),
    W('w2', 'ldr.b', 'uno.A0', 'green'),
    W('w3', 'rd.a', 'uno.A0', 'green'),
    W('w4', 'rd.b', 'uno.GND_B1', 'black'),
    W('w5', 'uno.D13', 'rl.a', 'yellow'),
    W('w6', 'rl.b', 'led.anode', 'yellow'),
    W('w7', 'led.cathode', 'uno.GND_B2', 'black')
  ]
};

export const EXAMPLE_PROJECTS: ExampleProject[] = [blink, traffic, astable, rcFilter, transistor, ultrasonic, dht, esp32Oled, motorDriver, servo, pot, ldr];

export function getExample(id: string): ExampleProject | undefined {
  return EXAMPLE_PROJECTS.find((e) => e.id === id);
}
