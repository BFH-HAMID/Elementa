/**
 * 20 guided advanced builds. Each preset opens a REAL wired bench project;
 * the companion mission scene is a separate, explicitly simplified educational
 * vehicle model. No live radio, GNSS, video or flight-controller firmware.
 */
import type { Bilingual, ExampleProject } from './examples';
import type { PlacedComponent, PlacedWire } from '../types';
import { C, W } from './builders';

export type VehicleKind = 'drone' | 'rover' | 'boat' | 'bench';
export type MissionMode = 'manual' | 'waypoint' | 'hold' | 'avoid' | 'geofence' | 'return' | 'bench';
export type Feature = 'gps' | 'camera' | 'telemetry' | 'sonar' | 'barometer' | 'gimbal' | 'display' | 'imu';
export interface AdvancedProject extends ExampleProject {
  kind: VehicleKind;
  mode: MissionMode;
  features: Feature[];
  /** Required direct harness connections used to gate the mission scene. */
  essentialWires: { from: string; to: string }[];
  safety: Bilingual;
  expected: Bilingual;
  maxSpeed: number; // m/s; illustrative, not a performance guarantee
  radioRange: number; // m, unobstructed training environment
  target: { x: number; y: number };
}
const bi = (en: string, bn: string): Bilingual => ({ en, bn });

/** Trainer sketch: a differential-drive mixer. GPS and avoidance belong to
 * the mission model; this sketch ONLY reads RC voltages and drives the H-bridge.
 * GPIO34/35 are inputs; GPIO25/26 are PWM; 18/19/27/14/23 are digital. */
export const ROVER_SKETCH = `// ESP32 differential-drive trainer. No GPS/autonomy firmware is emulated.
// RX CH2 -> GPIO34, CH1 -> GPIO35; all grounds MUST be common.
void setup() {
  pinMode(27, OUTPUT); pinMode(14, OUTPUT);
  pinMode(18, OUTPUT); pinMode(19, OUTPUT);
  pinMode(23, OUTPUT);
  digitalWrite(27, HIGH); digitalWrite(14, LOW);
  digitalWrite(18, HIGH); digitalWrite(19, LOW);
  digitalWrite(23, HIGH); // release TB6612 standby
  Serial.begin(115200);
  Serial.println("RC differential drive ready");
}
void loop() {
  int throttle = analogRead(34);
  int steering = analogRead(35);
  if (throttle < 60) { // receiver failsafe -> both motors off
    analogWrite(25, 0); analogWrite(26, 0);
  } else {
    int duty = map(throttle, 0, 4095, 0, 255);
    int turn = map(steering, 0, 4095, -85, 85);
    analogWrite(25, constrain(duty - turn, 0, 255));
    analogWrite(26, constrain(duty + turn, 0, 255));
  }
  delay(40);
}
`;

interface Build {
  components: PlacedComponent[];
  wires: PlacedWire[];
  essentialWires: AdvancedProject['essentialWires'];
}
function harness() {
  const components: PlacedComponent[] = [];
  const wires: PlacedWire[] = [];
  const essentialWires: Build['essentialWires'] = [];
  let index = 0;
  return {
    components, wires, essentialWires,
    part(id: string, type: string, x: number, y: number, props?: Record<string, number | string | boolean>, code?: string) {
      components.push(C(id, type, x, y, props, code));
    },
    join(from: string, to: string, color: import('../types').WireColor = 'blue', essential = false) {
      wires.push(W(`w${++index}`, from, to, color));
      if (essential) essentialWires.push({ from, to });
    },
    done(): Build { return { components, wires, essentialWires }; }
  };
}

function drone(features: Feature[]): Build {
  const h = harness();
  h.part('bat', 'lipo-3s', 10, 300);
  h.part('pdb', 'pdb-5v', 170, 290);
  h.part('fc', 'flight-controller-f4', 200, 30, { assistedRth: features.includes('gps') });
  h.part('rx', 'rc-receiver', 10, 40);
  h.part('imu', 'mpu6050', 40, 180);
  h.join('bat.pos', 'pdb.batp', 'red', true);
  h.join('bat.neg', 'pdb.batn', 'black', true);
  h.join('pdb.v5', 'fc.vcc', 'red', true);
  h.join('pdb.gnd5', 'fc.gnd', 'black', true);
  h.join('pdb.v5', 'rx.vcc', 'red');
  h.join('pdb.gnd5', 'rx.gnd', 'black');
  h.join('rx.ch2', 'fc.rc', 'green', true);
  h.join('pdb.v5', 'imu.vcc', 'red');
  h.join('pdb.gnd5', 'imu.gnd', 'black');
  h.join('fc.scl', 'imu.scl', 'blue');
  h.join('fc.sda', 'imu.sda', 'green');
  for (let i = 1; i <= 4; i++) {
    const esc = `esc${i}`;
    const motor = `motor${i}`;
    h.part(esc, 'esc-30a', 390, 150 + (i - 1) * 120);
    h.part(motor, 'brushless-2205', 550, 140 + (i - 1) * 120);
    h.join(`pdb.esc${i}p`, `${esc}.vbat`, 'red', true);
    h.join(`pdb.gnd${i}`, `${esc}.gnd`, 'black');
    h.join(`fc.esc${i}`, `${esc}.sig`, 'yellow', true);
    for (const phase of ['u', 'v', 'w']) h.join(`${esc}.${phase}`, `${motor}.${phase}`, 'orange', true);
  }
  if (features.includes('gps')) {
    h.part('gps', 'gps-neo6m', 370, 20);
    h.join('pdb.v5', 'gps.vcc', 'red');
    h.join('pdb.gnd5', 'gps.gnd', 'black');
    h.join('gps.txd', 'fc.gpsrx', 'blue', true);
    h.join('fc.gpstx', 'gps.rxd', 'green');
  }
  if (features.includes('camera')) {
    h.part('cam', 'fpv-camera', 20, 470);
    h.part('vtx', 'vtx-58', 160, 480);
    h.join('pdb.v5', 'cam.vcc', 'red');
    h.join('pdb.gnd5', 'cam.gnd', 'black');
    h.join('pdb.v5', 'vtx.vcc', 'red');
    h.join('pdb.gnd5', 'vtx.gnd', 'black');
    h.join('cam.video', 'vtx.video', 'yellow', true);
  }
  if (features.includes('telemetry')) {
    h.part('tel', 'telemetry-sik', 570, 20);
    h.join('pdb.v5', 'tel.vcc', 'red');
    h.join('pdb.gnd5', 'tel.gnd', 'black');
    h.join('fc.teletx', 'tel.rx', 'green', true);
    h.join('tel.tx', 'fc.telerx', 'blue');
  }
  if (features.includes('barometer') || features.includes('display')) {
    h.part('ldo', 'reg-ams1117', 700, 110);
    h.part('decouple', 'electrolytic-cap', 790, 110, { farads: 10e-6, volts: 10 });
    h.join('pdb.v5', 'ldo.in', 'red');
    h.join('pdb.gnd5', 'ldo.gnd', 'black');
    h.join('ldo.out', 'decouple.pos', 'orange');
    h.join('decouple.neg', 'pdb.gnd5', 'black');
  }
  if (features.includes('barometer')) {
    h.part('baro', 'bmp280', 710, 35);
    h.join('ldo.out', 'baro.vcc', 'orange', true);
    h.join('pdb.gnd5', 'baro.gnd', 'black');
    h.join('fc.scl', 'baro.scl', 'blue');
    h.join('fc.sda', 'baro.sda', 'green');
  }
  if (features.includes('sonar')) {
    h.part('sonar', 'hc-sr04', 710, 170);
    h.part('ra', 'resistor', 720, 270, { ohms: 10000 });
    h.part('rb', 'resistor', 810, 270, { ohms: 20000 });
    h.join('pdb.v5', 'sonar.vcc', 'red');
    h.join('pdb.gnd5', 'sonar.gnd', 'black');
    h.join('fc.aux1', 'sonar.trig', 'yellow');
    h.join('sonar.echo', 'ra.a', 'blue');
    h.join('ra.b', 'fc.aux2', 'green', true);
    h.join('ra.b', 'rb.a', 'green');
    h.join('rb.b', 'pdb.gnd5', 'black'); // 5 V echo → 3.3 V input divider
  }
  if (features.includes('gimbal')) {
    h.part('gimbal', 'servo-sg90', 710, 405);
    h.join('pdb.v5', 'gimbal.red', 'red');
    h.join('pdb.gnd5', 'gimbal.brown', 'black');
    h.join('fc.aux3', 'gimbal.orange', 'yellow');
  }
  if (features.includes('display')) {
    h.part('oled', 'oled-ssd1306', 710, 480);
    h.join('ldo.out', 'oled.vcc', 'orange');
    h.join('pdb.gnd5', 'oled.gnd', 'black');
    h.join('fc.scl', 'oled.scl', 'blue');
    h.join('fc.sda', 'oled.sda', 'green');
  }
  return h.done();
}

function rover(features: Feature[], boat = false): Build {
  const h = harness();
  h.part('bat', 'lipo-2s', 10, 130);
  h.part('pdb', 'pdb-5v', 160, 130);
  h.part('brain', 'esp32-devkit-30', 340, 70, {}, ROVER_SKETCH);
  h.part('driver', 'motor-driver-tb6612fng', 565, 80);
  h.part('left', boat ? 'dc-motor-fan' : 'dc-motor', 775, 30);
  h.part('right', boat ? 'dc-motor-fan' : 'dc-motor', 775, 170);
  h.part('rx', 'rc-receiver', 15, 275);
  h.join('bat.pos', 'pdb.batp', 'red', true);
  h.join('bat.neg', 'pdb.batn', 'black', true);
  h.join('pdb.v5', 'brain.VIN', 'red', true);
  h.join('pdb.gnd5', 'brain.GND', 'black', true);
  h.join('pdb.v5', 'driver.vm', 'red', true); // regulated 5 V for 6 V-class TT motors
  h.join('brain.3V3', 'driver.vcc', 'orange'); // 3.3 V logic
  h.join('pdb.gnd5', 'driver.gnd', 'black');
  h.join('pdb.v5', 'rx.vcc', 'red');
  h.join('pdb.gnd5', 'rx.gnd', 'black');
  h.join('rx.ch2', 'brain.D34', 'green', true);
  h.join('rx.ch1', 'brain.D35', 'blue');
  const drives = [['D25','pwma'],['D26','pwmb'],['D27','ain1'],['D14','ain2'],['D18','bin1'],['D19','bin2'],['D23','stby']] as const;
  for (const [pin, port] of drives) h.join(`brain.${pin}`, `driver.${port}`, 'yellow', port === 'stby' || port === 'pwma');
  h.join('driver.ao1', 'left.a', 'orange', true);
  h.join('driver.ao2', 'left.b', 'orange', true);
  h.join('driver.bo1', 'right.a', 'orange', true);
  h.join('driver.bo2', 'right.b', 'orange', true);
  if (features.includes('camera')) {
    h.part('cam', 'fpv-camera', 20, 445);
    h.part('vtx', 'vtx-58', 155, 445);
    h.join('pdb.v5', 'cam.vcc', 'red'); h.join('pdb.gnd5', 'cam.gnd', 'black');
    h.join('pdb.v5', 'vtx.vcc', 'red'); h.join('pdb.gnd5', 'vtx.gnd', 'black');
    h.join('cam.video', 'vtx.video', 'yellow', true);
  }
  if (features.includes('gps')) {
    h.part('gps', 'gps-neo6m', 340, 335);
    h.join('pdb.v5', 'gps.vcc', 'red'); h.join('pdb.gnd5', 'gps.gnd', 'black');
    h.join('gps.txd', 'brain.RX2', 'blue', true);
    h.join('brain.TX2', 'gps.rxd', 'green');
  }
  if (features.includes('telemetry')) {
    h.part('tel', 'telemetry-sik', 520, 335);
    h.join('pdb.v5', 'tel.vcc', 'red'); h.join('pdb.gnd5', 'tel.gnd', 'black');
    h.join('brain.TX0', 'tel.rx', 'green', true);
    h.join('tel.tx', 'brain.RX0', 'blue');
  }
  if (features.includes('sonar')) {
    h.part('sonar', 'hc-sr04', 760, 330);
    h.part('ra', 'resistor', 700, 445, { ohms: 10000 });
    h.part('rb', 'resistor', 780, 445, { ohms: 20000 });
    h.join('pdb.v5', 'sonar.vcc', 'red'); h.join('pdb.gnd5', 'sonar.gnd', 'black');
    h.join('brain.D32', 'sonar.trig', 'yellow');
    h.join('sonar.echo', 'ra.a', 'blue');
    h.join('ra.b', 'brain.D33', 'green', true);
    h.join('ra.b', 'rb.a', 'green'); h.join('rb.b', 'pdb.gnd5', 'black');
  }
  if (features.includes('imu')) {
    h.part('imu', 'mpu6050', 510, 490);
    h.join('pdb.v5', 'imu.vcc', 'red'); h.join('pdb.gnd5', 'imu.gnd', 'black');
    h.join('brain.D22', 'imu.scl', 'blue'); h.join('brain.D21', 'imu.sda', 'green');
  }
  if (features.includes('display')) {
    h.part('oled', 'oled-ssd1306', 340, 505);
    h.join('brain.3V3', 'oled.vcc', 'orange'); h.join('pdb.gnd5', 'oled.gnd', 'black');
    h.join('brain.D22', 'oled.scl', 'blue'); h.join('brain.D21', 'oled.sda', 'green');
  }
  return h.done();
}

function bmsBench(): Build {
  const h = harness();
  h.part('bat', 'lipo-37', 20, 120);
  h.part('pcm', 'bms-1s', 190, 115);
  h.part('r', 'resistor', 360, 95, { ohms: 330 });
  h.part('led', 'led-red', 470, 95);
  h.join('bat.pos', 'pcm.bpos', 'red', true);
  h.join('bat.neg', 'pcm.bneg', 'black', true);
  h.join('pcm.outpos', 'r.a', 'red', true);
  h.join('r.b', 'led.anode', 'yellow');
  h.join('led.cathode', 'pcm.outneg', 'black', true);
  return h.done();
}

interface Recipe {
  id: string; name: string; title: Bilingual; summary: Bilingual;
  kind: VehicleKind; mode: MissionMode; features: Feature[];
  focus: Bilingual[]; explanation: Bilingual; safety: Bilingual; expected: Bilingual;
  maxSpeed?: number; radioRange?: number;
}
const recipes: Recipe[] = [
  {
    id: 'drone-fpv-gps', name: 'FPV GPS quadcopter', title: bi('FPV quadcopter with GPS & telemetry', 'GPS ও টেলিমেট্রিসহ FPV কোয়াডকপ্টার'),
    summary: bi('Wire the complete flight stack: four ESCs, IMU, radio receiver, GPS, FPV camera/VTX and telemetry.', 'চারটি ESC, IMU, রেডিও রিসিভার, GPS, FPV ক্যামেরা/VTX ও টেলিমেট্রি দিয়ে সম্পূর্ণ ফ্লাইট স্ট্যাক সংযোগ করুন।'),
    kind: 'drone', mode: 'manual', features: ['gps','camera','telemetry'],
    focus: [bi('Solder the ESC power pairs to four RAW VBAT/GND pads. Connect each ESC U/V/W to one brushless motor; swap two phases ONLY on a real disarmed motor to reverse direction.', 'চারটি RAW VBAT/GND প্যাডে ESC-এর পাওয়ার জোড়া লাগান। প্রতিটি ESC-এর U/V/W একটি ব্রাশলেস মোটরে দিন; বাস্তবে মোটর বন্ধ থাকলেই কেবল দিক পাল্টাতে দুটি ফেজ অদলবদল করুন।'), bi('Supply the camera, VTX, GPS and controller only from the regulated 5 V rail; camera VIDEO → VTX VIDEO, GPS TX → FC RX, telemetry TX ↔ FC RX.', 'ক্যামেরা, VTX, GPS ও কন্ট্রোলারে শুধু নিয়ন্ত্রিত ৫ V দিন; ক্যামেরা VIDEO → VTX VIDEO, GPS TX → FC RX, টেলিমেট্রি TX ↔ FC RX যুক্ত করুন।')],
    explanation: bi('The LiPo feeds four ESC branches through the PDB. A separate 5 V rail runs the flight electronics. The training controller forwards the RC throttle while armed; the mission view estimates motion, battery sag and link quality—not closed-loop flight stabilization.', 'LiPo থেকে PDB-এর চার শাখায় ESC চলে; আলাদা ৫ V রেলে ফ্লাইট ইলেকট্রনিক্স চলে। ট্রেনিং কন্ট্রোলার আর্ম অবস্থায় RC থ্রটল পাঠায়; মিশন দৃশ্যে গতি, ব্যাটারি ও লিংক অনুমান করে—ফ্লাইট স্ট্যাবিলাইজেশন নয়।'),
    safety: bi('REMOVE ALL PROPELLERS before checking polarity or arming. Verify each PDB pad and 5 V rail with a meter; use a 3S balance charger and matched 5.8 GHz antenna.', 'পোলারিটি যাচাই বা আর্ম করার আগে সব প্রপেলার খুলুন। মিটার দিয়ে PDB প্যাড ও ৫ V রেল যাচাই করুন; 3S ব্যালান্স চার্জার ও সঠিক ৫.৮ GHz অ্যান্টেনা ব্যবহার করুন।'),
    expected: bi('In the simulator, increasing RC throttle raises all four ESC speeds and pack current; disconnect VIDEO and the VTX status drops.', 'সিমুলেশনে RC থ্রটল বাড়ালে চার ESC-এর গতি ও ব্যাটারি কারেন্ট বাড়ে; VIDEO বিচ্ছিন্ন করলে VTX স্ট্যাটাস বন্ধ হয়।')
  },
  {
    id: 'drone-waypoint', name: 'GPS waypoint quad', title: bi('GPS waypoint navigation quad', 'GPS ওয়েপয়েন্ট নেভিগেশন ড্রোন'),
    summary: bi('A GPS + telemetry stack with a plotted target and radio-range failsafe.', 'GPS ও টেলিমেট্রি স্ট্যাকে নির্ধারিত লক্ষ্যবিন্দু ও রেডিও রেঞ্জ ফেইলসেফ।'),
    kind: 'drone', mode: 'waypoint', features: ['gps','telemetry'],
    focus: [bi('Cross the UART pair: GPS TXD → FC GPS RX and FC GPS TX → GPS RXD. Keep the GNSS antenna clear of the motor leads.', 'UART ক্রস করে GPS TXD → FC GPS RX এবং FC GPS TX → GPS RXD দিন। GNSS অ্যান্টেনা মোটরের তার থেকে দূরে রাখুন।'), bi('Set a waypoint in the mission view. Switch GPS visibility off to see the navigation hold instead of inventing a position.', 'মিশন দৃশ্যে ওয়েপয়েন্ট সেট করুন। GPS দৃশ্যমানতা বন্ধ করলে কল্পিত অবস্থান না দেখিয়ে নেভিগেশন থামতে দেখুন।')],
    explanation: bi('The scene computes heading error and steers toward a local X/Y waypoint only while a GNSS fix is available. The bench does not run a waypoint/autopilot firmware or parse NMEA.', 'GNSS ফিক্স থাকলেই দৃশ্যটি স্থানীয় X/Y লক্ষ্যবিন্দুর দিকে দিক সংশোধন করে। বেঞ্চে ওয়েপয়েন্ট ফার্মওয়্যার বা NMEA পার্সিং চলে না।'),
    safety: bi('Confirm GNSS lock outdoors in a legal, open flying area; configure an independent real-controller failsafe before any flight.', 'বৈধ খোলা এলাকায় GNSS লক নিশ্চিত করুন; উড্ডয়নের আগে প্রকৃত কন্ট্রোলারে আলাদা ফেইলসেফ সেট করুন।'),
    expected: bi('Position converges on the target with GPS; loss of GPS interrupts automatic navigation.', 'GPS থাকলে অবস্থান লক্ষ্যের দিকে যায়; GPS হারালে স্বয়ংক্রিয় নেভিগেশন থামে।')
  },
  {
    id: 'drone-altitude-hold', name: 'Barometric hover quad', title: bi('Barometric altitude-hold quad', 'ব্যারোমেট্রিক উচ্চতা ধরে রাখা ড্রোন'),
    summary: bi('Compare a barometer and IMU with a simplified altitude-hold response.', 'বারোমিটার ও IMU দিয়ে সহজ উচ্চতা-ধরে-রাখা প্রতিক্রিয়া তুলনা করুন।'),
    kind: 'drone', mode: 'hold', features: ['barometer','gps'],
    focus: [bi('Connect the BMP280 SDA/SCL in parallel with the IMU I²C bus. Feed a bare BMP280 only from the drawn 3.3 V LDO with decoupling; level-shift its I²C bus if another board pulls the lines to 5 V.', 'IMU-এর I²C বাসের সমান্তরালে BMP280 SDA/SCL দিন। খালি BMP280-এ আঁকা ৩.৩ V LDO ও ডিকাপলিং দিন; অন্য বোর্ডে I²C লাইন ৫ V হলে লেভেল শিফটার লাগান।'), bi('Increase throttle to climb, then engage Hold in the scene and introduce wind to observe the damped altitude response.', 'থ্রটল বাড়িয়ে উঠুন, তারপর দৃশ্যে Hold চালু করে বাতাসে উচ্চতার পরিবর্তন দেখুন।')],
    explanation: bi('The bench shows the editable BMP280 pressure sample; the separate scene uses a first-order vertical response toward a target altitude and does NOT fuse pressure data. It is not a tuned FC PID and cannot stabilize an aircraft.', 'বেঞ্চে বদলানো যায় এমন BMP280 চাপের নমুনা দেখায়; পৃথক দৃশ্যে সরল উল্লম্ব গতি লক্ষ্যের দিকে যায়, কিন্তু চাপের ডেটা ফিউজ করে না। এটি টিউন করা FC PID নয়, বাস্তব বিমান স্থিতিশীল করে না।'),
    safety: bi('Do not connect raw 5 V to an unregulated BMP280; confirm breakout regulator/level shifting before soldering.', 'নিয়ন্ত্রকবিহীন BMP280-এ সরাসরি ৫ V দেবেন না; সোল্ডার করার আগে ব্রেকআউটের নিয়ন্ত্রক/লেভেল শিফটিং যাচাই করুন।'),
    expected: bi('Altitude settles near the hold setpoint instead of climbing indefinitely; a low battery forces a landing.', 'উচ্চতা ক্রমাগত না বেড়ে নির্ধারিত মানের কাছে স্থির হয়; কম ব্যাটারিতে অবতরণ করে।')
  },
  {
    id: 'drone-racing-fpv', name: 'FPV racing quad', title: bi('Lightweight FPV racing quad', 'হালকা FPV রেসিং ড্রোন'),
    summary: bi('Prioritize RC response and camera field-of-view with a lighter, faster model.', 'হালকা দ্রুতগতির মডেলে RC প্রতিক্রিয়া ও ক্যামেরার দৃশ্যক্ষেত্র পরীক্ষা করুন।'),
    kind: 'drone', mode: 'manual', features: ['camera'], maxSpeed: 18, radioRange: 250,
    focus: [bi('Route the camera VIDEO line away from ESC power wires and give camera/VTX a filtered 5 V rail.', 'ESC পাওয়ার তার থেকে ক্যামেরার VIDEO তার দূরে রাখুন এবং ক্যামেরা/VTX-কে ফিল্টারযুক্ত ৫ V দিন।'), bi('Change steering and forward controls in the mission view; compare the camera wedge with the vehicle heading.', 'মিশন দৃশ্যে স্টিয়ারিং ও সামনে চলা বদলে ক্যামেরার দৃষ্টিকোণ ও গাড়ির দিক তুলনা করুন।')],
    explanation: bi('Throttle changes average ESC load and battery sag, while the visual mission model illustrates a higher-speed airframe and narrow camera view. RF latency and real aerodynamic drag are not computed.', 'থ্রটলে ESC লোড ও ব্যাটারি ভোল্টেজ কমা বদলায়; মিশন মডেলে দ্রুত ফ্রেম ও ক্যামেরার সরু দৃশ্য দেখায়। RF লেটেন্সি বা প্রকৃত বায়ু প্রতিরোধ গণনা হয় না।'),
    safety: bi('Never power a VTX without its matched antenna; race only at a permitted site with a spotter.', 'সঠিক অ্যান্টেনা ছাড়া VTX চালু করবেন না; অনুমোদিত স্থানে পর্যবেক্ষকসহ উড়ান।'),
    expected: bi('The FPV wedge rotates with yaw; higher throttle drains the pack faster.', 'ইয়াও-এর সঙ্গে FPV দৃশ্য ঘোরে; বেশি থ্রটলে ব্যাটারি দ্রুত কমে।')
  },
  {
    id: 'drone-survey-gimbal', name: 'Camera survey quad', title: bi('GPS camera-survey drone with gimbal', 'জিম্বলসহ GPS ক্যামেরা সার্ভে ড্রোন'),
    summary: bi('Add a servo gimbal, GNSS, camera and telemetry to a four-motor survey platform.', 'চার মোটরের সার্ভে প্ল্যাটফর্মে সার্ভো জিম্বল, GNSS, ক্যামেরা ও টেলিমেট্রি যোগ করুন।'),
    kind: 'drone', mode: 'waypoint', features: ['gps','camera','telemetry','gimbal'], maxSpeed: 8,
    focus: [bi('Wire the servo RED/BROWN to 5 V/GND and SIGNAL to FC AUX3; reserve enough BEC current for its peak draw.', 'সার্ভো RED/BROWN-এ ৫ V/GND ও SIGNAL-এ FC AUX3 দিন; সার্ভোর সর্বোচ্চ কারেন্টের জন্য BEC-তে যথেষ্ট ক্ষমতা রাখুন।'), bi('In the scene, align the camera field-of-view toward the survey waypoint and monitor radio quality.', 'দৃশ্যে ক্যামেরার দৃষ্টিকোণ সার্ভে লক্ষ্যের দিকে নিন এবং রেডিও মান দেখুন।')],
    explanation: bi('A wide, slow survey route is modelled with GNSS-derived position and a drawn camera footprint. The training FC does not generate servo control pulses or record images.', 'GNSS অবস্থান ও আঁকা ক্যামেরা দৃষ্টিক্ষেত্র দিয়ে ধীর সার্ভে রুট দেখায়। ট্রেনিং FC সার্ভো পালস তৈরি বা ছবি ধারণ করে না।'),
    safety: bi('Check 5 V BEC headroom for the servo stall current, not just its no-load draw; respect privacy and airspace rules.', 'শুধু সার্ভোর অব্যবহৃত কারেন্ট নয়, স্টল কারেন্টের জন্যও ৫ V BEC-তে পর্যাপ্ত ক্ষমতা রাখুন; গোপনীয়তা ও আকাশসীমার নিয়ম মানুন।'),
    expected: bi('The scene approaches the target slowly and shows a moving camera footprint; camera power loss removes the view.', 'দৃশ্যটি ধীরে লক্ষ্যের কাছে যায় ও ক্যামেরার পরিবর্তনশীল ক্ষেত্র দেখায়; ক্যামেরায় বিদ্যুৎ না থাকলে দৃশ্য বন্ধ হয়।')
  },
  {
    id: 'drone-obstacle-avoid', name: 'Ultrasonic avoidance quad', title: bi('Obstacle-aware quad with ultrasonic sensor', 'আল্ট্রাসোনিক বাধা শনাক্তকারী ড্রোন'),
    summary: bi('Use a sonar range reading and a 5 V→3.3 V echo divider in a guided obstacle scenario.', 'সোনার দূরত্ব ও ৫ V→৩.৩ V ECHO ডিভাইডার দিয়ে বাধা এড়ানোর দৃশ্য।'),
    kind: 'drone', mode: 'avoid', features: ['gps','sonar','telemetry'],
    focus: [bi('Build a 10 kΩ + 20 kΩ divider between the 5 V ECHO and GND; connect its midpoint to FC AUX2, and FC AUX1 to TRIG.', '৫ V ECHO ও GND-এর মাঝে ১০ kΩ + ২০ kΩ ডিভাইডার দিয়ে মধ্যবিন্দু FC AUX2-এ এবং FC AUX1 TRIG-এ দিন।'), bi('Place the obstacle on the route; compare behavior with the sonar powered versus removed.', 'রুটে বাধা রাখুন; সোনার চালু ও খুলে ফেলার অবস্থায় আচরণ তুলনা করুন।')],
    explanation: bi('The mission scene casts a forward-looking ray against a circular obstacle and steers away inside its range. HC-SR04 is unreliable for soft/angled surfaces or outdoors; no real obstacle-avoidance firmware is supplied.', 'মিশন দৃশ্যে সামনের দিকে রশ্মি দিয়ে বৃত্তাকার বাধা শনাক্ত করে দূরে সরে। নরম/কোণাকৃতি বস্তু বা বাইরে HC-SR04 নির্ভরযোগ্য নয়; বাস্তব এড়ানো ফার্মওয়্যার এখানে নেই।'),
    safety: bi('5 V ECHO will damage a 3.3 V input without the divider. Do not rely on one sonar sensor as a flight safety device.', 'ডিভাইডার ছাড়া ৫ V ECHO দিলে ৩.৩ V ইনপুট ক্ষতিগ্রস্ত হবে। একটি সোনারের ওপর উড্ডয়নের নিরাপত্তা নির্ভর করাবেন না।'),
    expected: bi('With sonar, the mapped vehicle diverts around an obstacle; without it the model stops at a collision.', 'সোনার থাকলে ম্যাপে যান বাধা ঘুরে যায়; না থাকলে সংঘর্ষে মডেল থামে।')
  },
  {
    id: 'drone-rth-failsafe', name: 'Return-home safety quad', title: bi('GPS return-home & radio failsafe', 'GPS রিটার্ন-হোম ও রেডিও ফেইলসেফ'),
    summary: bi('Explore what happens after an RC link loss or low pack voltage.', 'RC লিংক হারালে বা ব্যাটারি কমে গেলে কী হয় তা পরীক্ষা করুন।'),
    kind: 'drone', mode: 'return', features: ['gps','telemetry','camera'], radioRange: 90,
    focus: [bi('Cross GPS TX/RX and telemetry TX/RX and set the receiver link initially ON. Check every module shares ground.', 'GPS ও টেলিমেট্রি TX/RX ক্রস করুন, রিসিভার লিংক প্রথমে চালু রাখুন এবং সব মডিউলের GND এক রাখুন।'), bi('In the scene, disable RC link; with a GPS fix it seeks HOME, while no fix commands a descent rather than a blind return.', 'দৃশ্যে RC লিংক বন্ধ করুন; GPS ফিক্স থাকলে HOME-এ ফিরবে, ফিক্স না থাকলে অন্ধভাবে না ফিরে নামবে।')],
    explanation: bi('Loss of signal triggers a simplified return-to-home if GPS is available, otherwise a controlled descent. Real failsafe must be configured and tested independently on the receiver and actual flight firmware.', 'লিংক হারালে GPS থাকলে সহজ রিটার্ন-হোম, না থাকলে নিয়ন্ত্রিত নামা দেখানো হয়। বাস্তবে রিসিভার ও ফ্লাইট ফার্মওয়্যারে আলাদাভাবে ফেইলসেফ সেট ও পরীক্ষা জরুরি।'),
    safety: bi('Test real failsafe with propellers removed. A simulator return is NOT proof that real RTL or geofencing works.', 'প্রপেলার খুলে বাস্তব ফেইলসেফ পরীক্ষা করুন। সিমুলেশনে ফিরে আসা মানে বাস্তব RTL বা জিওফেন্স কাজ করবে—এমন প্রমাণ নয়।'),
    expected: bi('A radio loss changes the status to return/land; at low battery it lands even if control is restored.', 'রেডিও হারালে স্ট্যাটাস রিটার্ন/ল্যান্ড হয়; ব্যাটারি কমে গেলে লিংক ফিরলেও অবতরণ করে।')
  },
  {
    id: 'drone-precision-landing', name: 'Ranging landing quad', title: bi('GPS + range-assisted landing quad', 'GPS ও রেঞ্জ সেন্সর দিয়ে অবতরণ'),
    summary: bi('Combine an ultrasonic near-ground reading with GPS and camera framing.', 'মাটির কাছাকাছি সোনার দূরত্বের সাথে GPS ও ক্যামেরা দৃশ্য মিলিয়ে দেখুন।'),
    kind: 'drone', mode: 'hold', features: ['gps','sonar','camera'], maxSpeed: 6,
    focus: [bi('Use the echo divider and check the camera/VTX signal path; set the scene altitude target low for approach.', 'ECHO ডিভাইডার ও ক্যামেরা/VTX সংযোগ যাচাই করে দৃশ্যে লক্ষ্য উচ্চতা কম রাখুন।'), bi('Compare the displayed distance and height while switching the sonar availability.', 'সোনার চালু ও বন্ধ করে প্রদর্শিত দূরত্ব ও উচ্চতা তুলনা করুন।')],
    explanation: bi('The scene demonstrates height-limited descent and an illustrative camera footprint, not real visual landing detection, terrain sensing or PX4 precision-landing control.', 'এখানে সীমিত উচ্চতায় নামা ও কল্পিত ক্যামেরা ক্ষেত্র দেখানো হয়; বাস্তব ভিজ্যুয়াল ল্যান্ডিং, ভূমি সনাক্তকরণ বা PX4 নিয়ন্ত্রণ নয়।'),
    safety: bi('HC-SR04 has a minimum range and can misread grass, water or sloped ground; manually supervise every real landing.', 'HC-SR04-এর ন্যূনতম দূরত্ব আছে, ঘাস/পানি/ঢালু মাটিতে ভুল দেখাতে পারে; বাস্তব অবতরণে সবসময় মানুষ পর্যবেক্ষণ করুন।'),
    expected: bi('Altitude approaches the setpoint; removing the sonar reduces confidence in near-ground ranging.', 'উচ্চতা লক্ষ্যমাত্রায় আসে; সোনার খুললে মাটির কাছের দূরত্বে আস্থা কমে।')
  },
  {
    id: 'drone-power-monitor', name: 'Power & telemetry quad', title: bi('Quadcopter power-budget monitor', 'কোয়াডকপ্টারের পাওয়ার বাজেট পর্যবেক্ষণ'),
    summary: bi('Compare four-ESC current draw with telemetry and a shared I²C display.', 'চার ESC-এর কারেন্টের সাথে টেলিমেট্রি ও একই I²C ডিসপ্লে তুলনা করুন।'),
    kind: 'drone', mode: 'manual', features: ['gps','telemetry','display'],
    focus: [bi('Wire the OLED in parallel on SDA/SCL and power it from the correct rail; the FC firmware would need an actual display driver.', 'OLED-কে SDA/SCL-এ সমান্তরালে দিন এবং সঠিক রেলে বিদ্যুৎ দিন; বাস্তব FC ফার্মওয়্যারে ডিসপ্লে ড্রাইভার লাগবে।'), bi('Increase throttle while watching source current in the bench inspector and the estimated battery time in the mission HUD.', 'থ্রটল বাড়িয়ে বেঞ্চের সোর্স কারেন্ট ও মিশন HUD-এর আনুমানিক ব্যাটারি সময় দেখুন।')],
    explanation: bi('Four averaged ESC loads share a sagging 3S pack; the scene integrates current to estimate remaining energy. The OLED is wired but the training FC does not run an OLED library.', 'চার ESC-এর আনুমানিক লোড 3S ব্যাটারি ভাগ করে; দৃশ্যে কারেন্ট সমাকলন করে অবশিষ্ট শক্তি হিসাব করে। OLED-এর তার আছে, কিন্তু ট্রেনিং FC OLED লাইব্রেরি চালায় না।'),
    safety: bi('Size wires, connectors and fuse for peak, not just average, ESC current. This model is not a thermal certification.', 'শুধু গড় নয়, সর্বোচ্চ ESC কারেন্ট অনুযায়ী তার, কানেক্টর ও ফিউজ নিন। এই মডেল তাপীয় অনুমোদন নয়।'),
    expected: bi('Source current rises non-linearly as throttle rises; estimated flight time decreases.', 'থ্রটল বাড়লে সোর্স কারেন্ট অরৈখিকভাবে বাড়ে; আনুমানিক উড্ডয়ন সময় কমে।')
  },
  {
    id: 'rc-camera-car', name: 'Camera remote-control car', title: bi('Remote-control toy car with FPV camera', 'FPV ক্যামেরাসহ রিমোট-কন্ট্রোল টয় কার'),
    summary: bi('An ESP32, dual H-bridge, RC receiver and camera/VTX on a fused 2S/5 V power tree.', 'ESP32, ডুয়াল H-ব্রিজ, RC রিসিভার ও ক্যামেরা/VTX দিয়ে 2S/৫ V টয় কার।'),
    kind: 'rover', mode: 'manual', features: ['camera'],
    focus: [bi('Connect RC CH2 → ESP32 GPIO34 and CH1 → GPIO35; connect PWM/direction/STBY to the TB6612, then each motor to an OUT pair.', 'RC CH2 → ESP32 GPIO34 এবং CH1 → GPIO35 দিন; PWM/দিক/STBY TB6612-এ ও প্রতিটি মোটর এক জোড়া OUT-এ দিন।'), bi('Power the motors from regulated 5 V and logic from ESP32 3.3 V; cross camera VIDEO into VTX and attach its antenna.', 'মোটরে নিয়ন্ত্রিত ৫ V ও লজিকে ESP32-এর ৩.৩ V দিন; ক্যামেরার VIDEO VTX-এ লাগিয়ে অ্যান্টেনা যুক্ত করুন।')],
    explanation: bi('The included Arduino-style trainer sketch reads two analogue RC channels and mixes left/right PWM with a zero-throttle failsafe. The scene animates the observed motor speeds, not real camera frames or radio packets.', 'সংযুক্ত Arduino-ধরনের স্কেচ দুই RC চ্যানেল পড়ে বাঁ/ডান মোটরের PWM মেশায় ও থ্রটল শূন্যে বন্ধ করে। দৃশ্যে মোটরের গতি দেখায়, বাস্তব ক্যামেরা ফ্রেম বা রেডিও প্যাকেট নয়।'),
    safety: bi('Mount a fuse, keep fingers away from wheels and never drive near roads or people. The 5 V BEC must handle both motors and video loads.', 'ফিউজ লাগান, চাকা থেকে আঙুল দূরে রাখুন, রাস্তা বা মানুষের কাছে চালাবেন না। ৫ V BEC-তে দুই মোটর ও ভিডিওর লোড ধরুন।'),
    expected: bi('Throttle moves both wheels, steering changes their relative speeds, and link loss stops them.', 'থ্রটলে দুই চাকা চলে, স্টিয়ারিংয়ে দুই চাকার গতি ভিন্ন হয়, লিংক হারালে থামে।')
  },
  {
    id: 'gps-route-car', name: 'GPS route rover', title: bi('GPS route-following RC rover', 'GPS রুট অনুসরণকারী RC রোভার'),
    summary: bi('Map a local target with GNSS and telemetry on a two-wheel ESP32 rover.', 'দুই চাকার ESP32 রোভারে GNSS ও টেলিমেট্রি দিয়ে স্থানীয় লক্ষ্য ম্যাপে দেখুন।'),
    kind: 'rover', mode: 'waypoint', features: ['gps','telemetry'],
    focus: [bi('Route GPS TXD to ESP32 RX2, GPS RXD to TX2; power it from 5 V and share the common ground.', 'GPS TXD থেকে ESP32 RX2, GPS RXD থেকে TX2 দিন; ৫ V দিয়ে একই GND রাখুন।'), bi('In the scene, enable route mode and block GPS to see the autonomous controller stop rather than navigate from stale fixes.', 'দৃশ্যে রুট মোড চালু করে GPS ব্লক করলে পুরোনো অবস্থান ধরে না চলে থামতে দেখুন।')],
    explanation: bi('The route steering is implemented in the mission model, NOT the included RC mixer sketch. Real waypoint driving needs GNSS parsing, coordinate planning, speed feedback and emergency stop firmware.', 'রুটের স্টিয়ারিং মিশন মডেলে হয়, দেওয়া RC মিক্সার স্কেচে নয়। বাস্তবে ওয়েপয়েন্ট চালাতে GNSS পার্সিং, রুট পরিকল্পনা, গতি ফিডব্যাক ও জরুরি থামার কোড লাগে।'),
    safety: bi('GNSS can be off by several metres; keep the test area fenced and put a physical emergency-stop within reach.', 'GNSS কয়েক মিটার ভুল হতে পারে; ঘেরা এলাকায় পরীক্ষা করুন এবং হাতে পৌঁছায় এমন জরুরি থামার সুইচ রাখুন।'),
    expected: bi('The plotted rover turns toward its target with a fix; without GPS it enters hold.', 'ফিক্স থাকলে রোভার লক্ষ্যপানে ঘোরে; GPS না থাকলে থামে।')
  },
  {
    id: 'collision-avoid-car', name: 'Obstacle avoidance car', title: bi('Ultrasonic obstacle-avoiding toy car', 'আল্ট্রাসোনিক বাধা এড়ানো টয় কার'),
    summary: bi('A forward HC-SR04, protected ECHO input and dual-motor turning experiment.', 'সামনের HC-SR04, সুরক্ষিত ECHO ইনপুট ও দুই মোটরে বাঁক নেওয়ার পরীক্ষা।'),
    kind: 'rover', mode: 'avoid', features: ['sonar'],
    focus: [bi('Wire a 10 kΩ top + 20 kΩ bottom divider on the 5 V ECHO line so the midpoint stays about 3.3 V at ESP32 GPIO33.', '৫ V ECHO-তে উপরে ১০ kΩ ও নিচে ২০ kΩ দিয়ে মধ্যবিন্দু ESP32 GPIO33-এ প্রায় ৩.৩ V রাখুন।'), bi('Move an obstacle in front of the car; compare a powered sensor with an unplugged one.', 'গাড়ির সামনে বাধা রাখুন; সেন্সর চালু ও সংযোগহীন দুই অবস্থায় তুলনা করুন।')],
    explanation: bi('A local range ray and turning heuristic run in the scene. The RC mixer sketch does not read the sonar; port this logic into real firmware before trying a physical obstacle run.', 'দৃশ্যে স্থানীয় দূরত্ব-রশ্মি ও বাঁক নেওয়ার নিয়ম চলে। RC মিক্সার স্কেচ সোনার পড়ে না; বাস্তবে চালানোর আগে এই যুক্তি ফার্মওয়্যারে লিখুন।'),
    safety: bi('HC-SR04 ECHO is 5 V; a 3.3 V ESP32 pin needs a divider or logic shifter. Test at walking speed in a clear area.', 'HC-SR04 ECHO ৫ V; ESP32-র ৩.৩ V পিনে ডিভাইডার বা লেভেল শিফটার লাগবে। ফাঁকা জায়গায় ধীরে পরীক্ষা করুন।'),
    expected: bi('With sonar, the model steers around the obstacle; without sonar it stops when it reaches it.', 'সোনারে মডেল বাধা ঘুরে যায়; সোনার না থাকলে বাধায় পৌঁছে থেমে যায়।')
  },
  {
    id: 'fpv-night-rover', name: 'FPV inspection rover', title: bi('Low-speed FPV inspection rover', 'ধীরগতির FPV পরিদর্শন রোভার'),
    summary: bi('Pair a camera/VTX with obstacle sensing for a simulated indoor inspection run.', 'ক্যামেরা/VTX ও বাধা সেন্সর দিয়ে ঘরের ভেতরে পরিদর্শনের দৃশ্য।'),
    kind: 'rover', mode: 'avoid', features: ['camera','sonar'], maxSpeed: 0.8,
    focus: [bi('Separate video and motor wiring on the chassis; tie the camera, VTX, sonar and ESP32 grounds at the PDB.', 'চ্যাসিসে ভিডিও ও মোটর তার আলাদা রাখুন; ক্যামেরা, VTX, সোনার ও ESP32-র GND PDB-তে মিলান।'), bi('Watch the synthetic camera cone while the local obstacle heuristic turns the rover.', 'স্থানীয় বাধা এড়ানো নিয়মে রোভার বাঁক নিলে কল্পিত ক্যামেরা ক্ষেত্র দেখুন।')],
    explanation: bi('The scene draws a field-of-view cone and models a short sonar range. It does not model darkness, actual exposure, line-of-sight RF reflections or digital video encoding.', 'দৃশ্যে ক্যামেরার দৃষ্টিকোণ ও স্বল্প সোনার পাল্লা আঁকা হয়। অন্ধকার, এক্সপোজার, RF প্রতিফলন বা ভিডিও এনকোডিং মডেল করা হয় না।'),
    safety: bi('Check radio permissions, ventilation around the VTX and privacy consent before recording in a real building.', 'বাস্তব ভবনে ধারণের আগে রেডিও অনুমতি, VTX-এর বাতাস চলাচল ও গোপনীয়তার সম্মতি যাচাই করুন।'),
    expected: bi('The camera view disappears without its VIDEO wire; the vehicle slows near the drawn obstacle.', 'VIDEO তার বিচ্ছিন্ন হলে ক্যামেরার দৃশ্য নেই; আঁকা বাধার কাছে যান ধীরে চলে।')
  },
  {
    id: 'geo-fence-car', name: 'Geofenced field car', title: bi('Geofenced GPS field car', 'জিওফেন্সযুক্ত GPS ফিল্ড কার'),
    summary: bi('Demonstrate a soft distance boundary and return-to-home when GPS is healthy.', 'GPS সচল থাকলে দূরত্ব সীমা পেরিয়ে স্বয়ংক্রিয় বাড়ি-ফেরা দেখুন।'),
    kind: 'rover', mode: 'geofence', features: ['gps','telemetry'], radioRange: 95,
    focus: [bi('Wire GPS on RX2/TX2 and telemetry on RX0/TX0; mark the home point before testing the boundary.', 'GPS-কে RX2/TX2 ও টেলিমেট্রি RX0/TX0-এ দিন; দূরত্ব সীমা পরীক্ষার আগে হোম পয়েন্ট ঠিক করুন।'), bi('Increase throttle and watch the range ring. Disable GPS and observe that the model stops rather than attempting blind return.', 'থ্রটল বাড়িয়ে সীমার বৃত্ত দেখুন। GPS বন্ধ করলে অন্ধভাবে ফিরে না এসে মডেল থামে।')],
    explanation: bi('The scene compares distance to a radius and turns back toward home using a synthetic GPS fix. Real geofences require calibrated location, emergency stop and obstacle-aware route planning.', 'দৃশ্যে দূরত্বকে একটি ব্যাসার্ধের সঙ্গে তুলনা করে কল্পিত GPS ফিক্সে বাড়ি ফেরে। বাস্তবে জিওফেন্সের জন্য নির্ভুল অবস্থান, জরুরি থামা ও বাধা-সচেতন পথ পরিকল্পনা দরকার।'),
    safety: bi('Never rely on GNSS geofencing as the sole barrier near a road or water; always add a physical perimeter.', 'রাস্তা বা পানির কাছে শুধু GNSS জিওফেন্সের ওপর ভরসা করবেন না; শারীরিক সীমানাও রাখুন।'),
    expected: bi('At the boundary the *scene* enters return state; with no fix it pauses the map. The included RC sketch does not stop its motors on GPS loss.', 'সীমায় কল্পিত দৃশ্যে return দেখায়; ফিক্স না থাকলে ম্যাপ থামে। GPS হারালে দেওয়া RC স্কেচ মোটর থামায় না।')
  },
  {
    id: 'delivery-rover', name: 'GPS camera delivery rover', title: bi('GPS / camera delivery rover', 'GPS ও ক্যামেরাসহ ডেলিভারি রোভার'),
    summary: bi('Combine RC, GPS, sonar, FPV and telemetry in a route with obstacle and battery checks.', 'RC, GPS, সোনার, FPV ও টেলিমেট্রি দিয়ে বাধা ও ব্যাটারি যাচাইসহ রুট।'),
    kind: 'rover', mode: 'waypoint', features: ['gps','camera','sonar','telemetry'], maxSpeed: 1.1,
    focus: [bi('Allocate space for a payload away from the RF antenna and motor wiring; verify that the 5 V BEC covers all add-on current.', 'RF অ্যান্টেনা ও মোটর তার থেকে দূরে পে-লোড রাখুন; সব অতিরিক্ত লোডের জন্য ৫ V BEC যথেষ্ট কি না দেখুন।'), bi('Check GPS TX/RX, VIDEO to VTX and the sonar echo divider before tracing the route.', 'রুট চালানোর আগে GPS TX/RX, VTX-এ VIDEO ও সোনারের ECHO ডিভাইডার যাচাই করুন।')],
    explanation: bi('The scene estimates a delivery route, forward obstacle and remaining energy. The embedded sketch is manual RC-only: cargo release, routing and obstacle handling need separate real firmware.', 'দৃশ্যে ডেলিভারি পথ, সামনের বাধা ও অবশিষ্ট শক্তি অনুমান করা হয়। দেওয়া স্কেচ কেবল RC; বাস্তবে পণ্য ছাড়া, পথ ও বাধা এড়ানোর জন্য আলাদা কোড লাগবে।'),
    safety: bi('Do not test autonomous delivery on public paths. Add a real watchdog, physical stop and a supervised low-speed trial.', 'জনসাধারণের পথে স্বয়ংক্রিয় ডেলিভারি পরীক্ষা করবেন না। বাস্তব ওয়াচডগ, জরুরি থামা ও তত্ত্বাবধানে ধীরগতির পরীক্ষা করুন।'),
    expected: bi('The target, camera wedge, obstacle range and battery gauge respond to changes; unplugging GPS pauses the route.', 'লক্ষ্য, ক্যামেরা ক্ষেত্র, বাধা ও ব্যাটারি গেজ বদলায়; GPS খুললে রুট থামে।')
  },
  {
    id: 'imu-stability-rover', name: 'IMU stability rover', title: bi('IMU-monitored rough-terrain rover', 'IMU-পর্যবেক্ষিত দুর্গমপথ রোভার'),
    summary: bi('Monitor 3-axis tilt while steering a dual-motor platform.', 'দুই মোটরের প্ল্যাটফর্মে বাঁক নেওয়ার সময় তিন অক্ষের ঢাল পর্যবেক্ষণ।'),
    kind: 'rover', mode: 'manual', features: ['imu','telemetry'],
    focus: [bi('Share ESP32 GPIO21 (SDA)/GPIO22 (SCL) with the MPU-6050 and power its regulated breakout correctly.', 'ESP32 GPIO21 (SDA)/GPIO22 (SCL)-এ MPU-6050 দিন এবং নিয়ন্ত্রিত ব্রেকআউটে সঠিক বিদ্যুৎ দিন।'), bi('Edit MPU-6050 accel X/Y/Z in the inspector and compare the reported tilt with the scene trace.', 'ইন্সপেক্টরে MPU-6050-এর accel X/Y/Z বদলে দৃশ্যের ঢাল তুলনা করুন।')],
    explanation: bi('The lab exposes editable IMU axes and a cosmetic tilt readout; the differential-drive sketch does not close a traction control loop. Hardware needs wheel encoders and a tuned controller.', 'ল্যাবে IMU অক্ষ পরিবর্তন ও ঢালের পাঠ দেখানো হয়; ডিফারেনশিয়াল-ড্রাইভ স্কেচ ট্র্যাকশন কন্ট্রোল করে না। বাস্তবে হুইল এনকোডার ও টিউন করা কন্ট্রোলার দরকার।'),
    safety: bi('Secure the battery and heavy payload low on the chassis; keep a manual stop in reach on slopes.', 'ব্যাটারি ও ভারী জিনিস চ্যাসিসের নিচে শক্ত করে রাখুন; ঢালে হাতে জরুরি থামার ব্যবস্থা রাখুন।'),
    expected: bi('Tilt reading follows the inspector values, while motor behavior still follows the RC receiver.', 'ঢালের পাঠ ইন্সপেক্টরের মান অনুযায়ী বদলায়; মোটর RC রিসিভার অনুযায়ীই চলে।')
  },
  {
    id: 'speed-logging-rover', name: 'GPS speed logger', title: bi('GPS speed-logging rover with OLED', 'OLED-সহ GPS গতিমাপক রোভার'),
    summary: bi('Compare ground speed on a route with telemetry and a shared I²C display connection.', 'টেলিমেট্রি ও I²C ডিসপ্লে সংযোগে রুটের ভূমি-গতি তুলনা করুন।'),
    kind: 'rover', mode: 'waypoint', features: ['gps','display','telemetry'],
    focus: [bi('Connect OLED SDA/SCL on ESP32 GPIO21/22, share GND, and supply its board from 3.3 V.', 'OLED SDA/SCL-কে ESP32 GPIO21/22-এ, একই GND-তে ও ৩.৩ V-এ দিন।'), bi('Raise the receiver throttle and compare GPS-derived speed on the mission HUD with the two motor speed readings on the bench.', 'রিসিভারের থ্রটল বাড়িয়ে মিশন HUD-এর GPS গতি ও বেঞ্চের দুই মোটরের গতি তুলনা করুন।')],
    explanation: bi('The scene differentiates its local position to produce an illustrative ground-speed trace. The OLED is wired, but the provided trainer sketch does not implement the GNSS parser or display driver.', 'দৃশ্যে স্থানীয় অবস্থানের পরিবর্তন থেকে আনুমানিক ভূমি-গতি দেখানো হয়। OLED-এর তার আছে, কিন্তু দেওয়া স্কেচে GNSS পার্সার বা ডিসপ্লে ড্রাইভার নেই।'),
    safety: bi('A GPS speed readout lags during a poor fix; never use it as a collision-safe speed controller.', 'দুর্বল GPS ফিক্সে গতি দেখাতে দেরি হয়; সংঘর্ষরোধী গতি-নিয়ন্ত্রক হিসেবে একে ব্যবহার করবেন না।'),
    expected: bi('Higher receiver input raises speed; a blocked GNSS fix disables route guidance.', 'রিসিভার ইনপুট বাড়লে গতি বাড়ে; GNSS ব্লক হলে রুট নির্দেশনা বন্ধ হয়।')
  },
  {
    id: 'gps-survey-boat', name: 'GPS survey boat', title: bi('GPS + camera survey boat', 'GPS ও ক্যামেরাসহ সার্ভে নৌকা'),
    summary: bi('Two motor-driven thrusters with an RC receiver, GPS, FPV and telemetry.', 'RC রিসিভার, GPS, FPV ও টেলিমেট্রিসহ দুই মোটরের থ্রাস্টার।'),
    kind: 'boat', mode: 'waypoint', features: ['gps','camera','telemetry'], maxSpeed: 1.0, radioRange: 120,
    focus: [bi('Mount motors above the waterline for the bench demonstration; a real boat needs sealed thrusters, flotation and corrosion-safe connectors.', 'বেঞ্চে মোটর পানির ওপর রাখুন; বাস্তব নৌকায় জলরোধী থ্রাস্টার, ভাসমান ব্যবস্থা ও ক্ষয়-রোধী কানেক্টর দরকার।'), bi('Route GPS TX to ESP32 RX2 and video to VTX; compare heading and battery time during a simulated transect.', 'GPS TX থেকে ESP32 RX2 ও ভিডিও VTX-এ দিন; কল্পিত সার্ভে পথে দিক ও ব্যাটারি সময় দেখুন।')],
    explanation: bi('The scene uses slower, more heavily damped horizontal motion for a hull. It does not compute currents, wave forces, waterproofing or real propeller thrust.', 'দৃশ্যে নৌকার জন্য ধীর ও বেশি প্রতিরোধযুক্ত অনুভূমিক গতি দেখায়। জলস্রোত, ঢেউ, জলরোধ বা বাস্তব থ্রাস্ট গণনা হয় না।'),
    safety: bi('LiPo packs and unsealed electronics must stay dry; test flotation, recovery line and RF fail-safe before water trials.', 'LiPo ও খোলা ইলেকট্রনিক্স শুকনো রাখুন; পানিতে নামানোর আগে ভেসে থাকা, উদ্ধার দড়ি ও RF ফেইলসেফ পরীক্ষা করুন।'),
    expected: bi('The boat follows the route more slowly than a rover; radio/GPS loss enters hold.', 'নৌকা রোভারের চেয়ে ধীরে রুট অনুসরণ করে; রেডিও/GPS হারালে থামে।')
  },
  {
    id: 'rc-camera-boat', name: 'FPV RC boat', title: bi('Camera-equipped RC mini boat', 'ক্যামেরাসহ RC মিনি নৌকা'),
    summary: bi('Try differential thrust steering, camera view and an RC link-loss stop.', 'ডিফারেনশিয়াল থ্রাস্টে বাঁক, ক্যামেরার দৃষ্টিকোণ ও RC লিংক হারালে থামা পরীক্ষা করুন।'),
    kind: 'boat', mode: 'manual', features: ['camera'], maxSpeed: 1.3, radioRange: 100,
    focus: [bi('Keep the camera above spray and install a matched antenna before applying power to the 5 V VTX.', 'ক্যামেরা পানির ছিটা থেকে ওপরে রাখুন; ৫ V VTX চালু করার আগে সঠিক অ্যান্টেনা লাগান।'), bi('Steer left/right with the receiver and watch the two motor outputs differ in the circuit inspector.', 'রিসিভার দিয়ে বাঁ/ডান ঘোরান; ইন্সপেক্টরে দুই মোটরের আউটপুটের পার্থক্য দেখুন।')],
    explanation: bi('An ESP32 RC mixer varies the two propulsor speeds. The scene shows a damped hull and illustrative video coverage, not hydrodynamics or a streaming feed.', 'ESP32 RC মিক্সার দুই প্রপালসারের গতি বদলায়। দৃশ্যে প্রতিরোধসহ নৌকা ও কল্পিত ভিডিও ক্ষেত্র দেখায়, জলগতিবিদ্যা বা লাইভ স্ট্রিম নয়।'),
    safety: bi('Use waterproof enclosures and a recovery tether; never test an unfused LiPo near water.', 'জলরোধী বাক্স ও উদ্ধার দড়ি ব্যবহার করুন; পানির কাছে ফিউজবিহীন LiPo পরীক্ষা করবেন না।'),
    expected: bi('Turning changes heading, power use grows with throttle and link loss stops propulsion.', 'বাঁক নিলে দিক বদলায়, থ্রটলে শক্তি খরচ বাড়ে এবং লিংক হারালে চালনা থামে।')
  },
  {
    id: 'bms-safety-bench', name: '1S protection bench', title: bi('1S battery protection test bench', '1S ব্যাটারি সুরক্ষা টেস্ট বেঞ্চ'),
    summary: bi('Trace protected OUT+/OUT− with a 1S cell and a current-limited LED, then trip the protection.', '1S সেল ও রোধকসহ LED দিয়ে সুরক্ষিত OUT+/OUT− যাচাই করে সুরক্ষা ট্রিপ করুন।'),
    kind: 'bench', mode: 'bench', features: [], maxSpeed: 0, radioRange: 0,
    focus: [bi('Wire cell +/− ONLY to B+/B−. Wire LED and 330 Ω resistor ONLY to protected OUT+/OUT−; keep B− and OUT− separate in the harness.', 'সেলের +/− শুধু B+/B−-এ দিন। LED ও ৩৩০ Ω রোধক কেবল সুরক্ষিত OUT+/OUT−-এ দিন; B− ও OUT− আলাদা রাখুন।'), bi('Set the battery to 3.7 V, inspect LED current, then lower it below 3.0 V or tick Protection trip; the LED must turn off.', 'ব্যাটারি ৩.৭ V করে LED কারেন্ট দেখুন; তারপর ৩.০ V-এর নিচে নামান বা Protection trip দিন—LED নিভে যাবে।')],
    explanation: bi('The protection board opens both output paths outside its 1S voltage window. The bench models a switch and series loss, not a charger, thermal protection IC or multi-cell balancer.', '1S ভোল্টেজ সীমার বাইরে সুরক্ষা বোর্ড দুই আউটপুট পথ বন্ধ করে। বেঞ্চে সুইচ ও সামান্য ক্ষতি দেখায়; চার্জার, তাপ সুরক্ষা IC বা বহু-সেল ব্যালান্সার নয়।'),
    safety: bi('Never put this 1S module in a 2S/3S drone power path. Use a certified 1S charger; do not charge or short real cells on the bench.', 'এই 1S মডিউল কখনো 2S/3S ড্রোন পাওয়ার পথে লাগাবেন না। অনুমোদিত 1S চার্জার নিন; বেঞ্চে বাস্তব সেল চার্জ বা শর্ট করবেন না।'),
    expected: bi('LED is lit at 3.7 V and extinguishes at 2.9 V or when Fault is enabled.', '৩.৭ V-এ LED জ্বলে; ২.৯ V-এ বা Fault চালু করলে নিভে যায়।')
  }
];

function baseSteps(kind: VehicleKind): Bilingual[] {
  if (kind === 'bench') return [
    bi('Open the wired bench and identify the 1S cell, PCM input B+/B− and separate protected OUT+/OUT−.', 'ওয়্যার করা বেঞ্চ খুলে 1S সেল, PCM ইনপুট B+/B− এবং পৃথক সুরক্ষিত OUT+/OUT− শনাক্ত করুন।'),
    bi('Check polarity with the multimeter; do not use a multi-cell pack or a charger in this test.', 'মাল্টিমিটার দিয়ে পোলারিটি যাচাই করুন; এই পরীক্ষায় বহু-সেল প্যাক বা চার্জার ব্যবহার করবেন না।')
  ];
  if (kind === 'drone') return [
    bi('Fit the flight controller and IMU to the frame. REMOVE PROPELLERS; disconnect the LiPo while checking all wiring.', 'ফ্রেমে ফ্লাইট কন্ট্রোলার ও IMU বসান। প্রপেলার খুলুন; তার যাচাইয়ের সময় LiPo বিচ্ছিন্ন রাখুন।'),
    bi('Battery +/− → PDB BAT+/BAT−. Raw PDB ESC pads feed the four ESCs; ONLY regulated PDB 5 V feeds the flight controller and receiver. Share GND.', 'ব্যাটারি +/− → PDB BAT+/BAT−। RAW ESC প্যাডে চার ESC; শুধু নিয়ন্ত্রিত PDB ৫ V-এ ফ্লাইট কন্ট্রোলার ও রিসিভার। সবার GND এক রাখুন।')
  ];
  return [
    bi('Mount the two motors and ESP32 securely; disconnect the LiPo and lift the wheels/thrusters for bench tests.', 'দুই মোটর ও ESP32 শক্ত করে বসান; বেঞ্চ পরীক্ষায় LiPo বিচ্ছিন্ন ও চাকা/থ্রাস্টার মাটি থেকে ওপরে রাখুন।'),
    bi('Connect 2S LiPo → PDB; regulated 5 V → ESP32 VIN and motor VM, ESP32 3V3 → TB6612 VCC. Join grounds; never send 5 V to an ESP32 GPIO.', '2S LiPo → PDB; নিয়ন্ত্রিত ৫ V → ESP32 VIN ও মোটর VM, ESP32 3V3 → TB6612 VCC। GND এক রাখুন; ESP32 GPIO-তে ৫ V দেবেন না।')
  ];
}

export const ADVANCED_PROJECTS: AdvancedProject[] = recipes.map((r) => {
  const build = r.kind === 'drone' ? drone(r.features) : r.kind === 'bench' ? bmsBench() : rover(r.features, r.kind === 'boat');
  const finish = r.kind === 'bench'
    ? bi('Press Run; change battery voltage or Protection trip in the inspector and watch the LED and output status.', 'Run চাপুন; ইন্সপেক্টরে ব্যাটারি ভোল্টেজ বা Protection trip বদলে LED ও আউটপুট দেখুন।')
    : bi('In the browser, open the mission scene; verify wiring/power, then start the demo and vary RC throttle, steering, GPS/link and battery conditions. On hardware, validate with a fuse and a person supervising.', 'ব্রাউজারে মিশন দৃশ্য খুলে তার/পাওয়ার যাচাই করুন, তারপর ডেমো চালিয়ে RC থ্রটল, স্টিয়ারিং, GPS/লিংক ও ব্যাটারি পরীক্ষা করুন। বাস্তবে ফিউজ ও তত্ত্বাবধানে যাচাই করুন।');
  return {
    id: r.id, name: r.name, title: r.title, summary: r.summary, difficulty: 'advanced',
    steps: [...baseSteps(r.kind), ...r.focus, finish], explanation: r.explanation,
    components: build.components, wires: build.wires, essentialWires: build.essentialWires,
    kind: r.kind, mode: r.mode, features: r.features, safety: r.safety, expected: r.expected,
    maxSpeed: r.maxSpeed ?? (r.kind === 'drone' ? 11 : r.kind === 'boat' ? 1.2 : 1.6),
    radioRange: r.radioRange ?? (r.kind === 'drone' ? 300 : r.kind === 'boat' ? 110 : 80),
    target: { x: r.kind === 'drone' ? 55 : r.kind === 'boat' ? 35 : 23, y: r.kind === 'drone' ? 20 : 10 }
  };
});

export function getAdvancedProject(id: string): AdvancedProject | undefined {
  return ADVANCED_PROJECTS.find((project) => project.id === id);
}
