/**
 * Circuit example projects (no microcontroller): dividers, LEDs, switches,
 * transistors, MOSFETs, regulators, op-amps, logic gates, rectifiers and an
 * oscilloscope. Each entry is plain data, like the entries in `examples.ts`.
 */

import type { ExampleProject } from './examples';
import { C, W } from './builders';

const voltageDivider: ExampleProject = {
  id: 'voltage-divider',
  name: 'Voltage divider',
  title: { en: 'Voltage divider', bn: 'ভোল্টেজ ডিভাইডার' },
  summary: {
    en: 'Two equal resistors split 9 V in half, so the middle node sits at about 4.5 V.',
    bn: 'দুটি সমান রোধক ৯ V-কে অর্ধেক করে, তাই মাঝের বিন্দু প্রায় ৪.৫ V।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 9 V battery, two 10 kΩ resistors and a GND symbol.', bn: '৯ V ব্যাটারি, দুটি ১০ kΩ রোধক ও একটি GND চিহ্ন বসান।' },
    { en: 'Wire + → R1 → middle node → R2 → −. Connect the GND symbol to −.', bn: '+ → R1 → মাঝের বিন্দু → R2 → −। GND চিহ্নটি − এর সাথে যুক্ত করুন।' },
    { en: 'Run. Select R1 and read the voltage on pin b in the inspector.', bn: 'Run করুন। R1 বাছাই করে ইন্সপেক্টরে pin b-এর ভোল্টেজ দেখুন।' }
  ],
  explanation: {
    en: 'The same current flows through R1 and R2. Each resistor takes a share of the 9 V in proportion to its resistance: V_mid = 9 V × R2 ÷ (R1 + R2) = 4.5 V. Dividers give a reference level for sensors, but they waste power, so they are not used to drive loads.',
    bn: 'R1 ও R2-এর মধ্য দিয়ে একই কারেন্ট যায়। প্রতিটি রোধক তার রোধের অনুপাতে ৯ V-এর একটি অংশ নেয়: V_mid = ৯ V × R2 ÷ (R1 + R2) = ৪.৫ V। সেন্সরের রেফারেন্স ভোল্টেজ বানাতে ডিভাইডার কাজে আসে, কিন্তু এতে শক্তি নষ্ট হয়, তাই লোড চালাতে এটি ব্যবহার হয় না।'
  },
  components: [
    C('bat', 'battery-9v', 40, 80, { volts: 9 }),
    C('r1', 'resistor', 260, 60, { ohms: 10000 }),
    C('r2', 'resistor', 260, 160, { ohms: 10000 }),
    C('gnd', 'gnd-symbol', 40, 200)
  ],
  wires: [
    W('w1', 'bat.pos', 'r1.a', 'red'),
    W('w2', 'r1.b', 'r2.a', 'yellow'),
    W('w3', 'r2.b', 'bat.neg', 'black'),
    W('w4', 'gnd.g', 'bat.neg', 'black')
  ]
};

const seriesLeds: ExampleProject = {
  id: 'series-leds',
  name: 'Three LEDs in series',
  title: { en: 'Three LEDs in series', bn: 'সিরিজে তিনটি LED' },
  summary: {
    en: 'Three LEDs share one current path. One resistor sets the current for all of them.',
    bn: 'তিনটি LED একই কারেন্ট পথে থাকে। একটি রোধকই সবার কারেন্ট ঠিক করে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 9 V battery, a 220 Ω resistor, a red, a green and a yellow LED.', bn: '৯ V ব্যাটারি, ২২০ Ω রোধক, একটি লাল, একটি সবুজ ও একটি হলুদ LED বসান।' },
    { en: 'Chain them: + → R → red anode → red cathode → green anode → green cathode → yellow anode → yellow cathode → −.', bn: 'একের পর এক যুক্ত করুন: + → R → লাল অ্যানোড → লাল ক্যাথোড → সবুজ অ্যানোড → সবুজ ক্যাথোড → হলুদ অ্যানোড → হলুদ ক্যাথোড → −।' },
    { en: 'Run and check the current in each LED. All three should match.', bn: 'Run করে প্রতিটি LED-এর কারেন্ট দেখুন। তিনটিই একই হওয়া উচিত।' }
  ],
  explanation: {
    en: 'In series the current is the same everywhere. The LEDs drop about 2.0, 2.2 and 2.1 V, so the resistor gets the rest: (9 − 6.3) ÷ 220 Ω ≈ 12 mA. A 9 V battery is just enough for three LEDs; with a 5 V supply the chain would not light.',
    bn: 'সিরিজে কারেন্ট সব জায়গায় সমান। LED তিনটি প্রায় ২.০, ২.২ ও ২.১ V নেয়, বাকিটা রোধক পায়: (৯ − ৬.৩) ÷ ২২০ Ω ≈ ১২ mA। ৫ V-তে এই শিকল জ্বলত না।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('r', 'resistor', 220, 60, { ohms: 220 }),
    C('ledr', 'led-red', 380, 60, { color: 'red', vf: 2.0 }),
    C('ledg', 'led-green', 380, 140, { color: 'green', vf: 2.2 }),
    C('ledy', 'led-yellow', 380, 220, { color: 'yellow', vf: 2.1 }),
    C('gnd', 'gnd-symbol', 40, 220)
  ],
  wires: [
    W('w1', 'bat.pos', 'r.a', 'red'),
    W('w2', 'r.b', 'ledr.anode', 'red'),
    W('w3', 'ledr.cathode', 'ledg.anode', 'green'),
    W('w4', 'ledg.cathode', 'ledy.anode', 'yellow'),
    W('w5', 'ledy.cathode', 'bat.neg', 'black'),
    W('w6', 'gnd.g', 'bat.neg', 'black')
  ]
};

const parallelLeds: ExampleProject = {
  id: 'parallel-leds',
  name: 'Two LEDs in parallel',
  title: { en: 'Two LEDs on separate branches', bn: 'আলাদা শাখায় দুটি LED' },
  summary: {
    en: 'Each LED gets its own resistor, so one LED failing does not change the other one’s current.',
    bn: 'প্রতিটি LED-এর নিজস্ব রোধক আছে, তাই একটি LED নষ্ট হলেও অন্যটির কারেন্ট বদলায় না।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 5 V USB supply, two 220 Ω resistors, a red and a green LED.', bn: '৫ V USB সাপ্লাই, দুটি ২২০ Ω রোধক, একটি লাল ও একটি সবুজ LED বসান।' },
    { en: 'Branch 1: VBUS → R1 → red anode, red cathode → GND. Branch 2: VBUS → R2 → green anode, green cathode → GND.', bn: 'শাখা ১: VBUS → R1 → লাল অ্যানোড, লাল ক্যাথোড → GND। শাখা ২: VBUS → R2 → সবুজ অ্যানোড, সবুজ ক্যাথোড → GND।' },
    { en: 'Run and compare the two LED currents.', bn: 'Run করে দুটি LED-এর কারেন্ট তুলনা করুন।' }
  ],
  explanation: {
    en: 'Parallel branches share the same voltage but carry separate currents. Each branch is (5 − Vf) ÷ 220 Ω: about 13.6 mA for red and 12.7 mA for green. Each LED needs its own resistor because LED forward voltages differ and they would otherwise hog the current.',
    bn: 'প্যারালাল শাখায় ভোল্টেজ একই, কিন্তু কারেন্ট আলাদা। প্রতিটি শাখায় (৫ − Vf) ÷ ২২০ Ω: লালে প্রায় ১৩.৬ mA, সবুজে প্রায় ১২.৭ mA। প্রতিটি LED-এর আলাদা রোধক লাগে, কারণ Vf আলাদা হয়।'
  },
  components: [
    C('usb', 'usb-5v', 40, 120, { volts: 5 }),
    C('r1', 'resistor', 240, 60, { ohms: 220 }),
    C('r2', 'resistor', 240, 180, { ohms: 220 }),
    C('ledr', 'led-red', 400, 60, { color: 'red', vf: 2.0 }),
    C('ledg', 'led-green', 400, 180, { color: 'green', vf: 2.2 })
  ],
  wires: [
    W('w1', 'usb.vbus', 'r1.a', 'red'),
    W('w2', 'r1.b', 'ledr.anode', 'red'),
    W('w3', 'ledr.cathode', 'usb.gnd', 'black'),
    W('w4', 'usb.vbus', 'r2.a', 'red'),
    W('w5', 'r2.b', 'ledg.anode', 'green'),
    W('w6', 'ledg.cathode', 'usb.gnd', 'black')
  ]
};

const reverseLed: ExampleProject = {
  id: 'reverse-led',
  name: 'Reverse-connected LED',
  title: { en: 'Reverse-biased LED (diode check)', bn: 'উল্টো সংযোগে LED (ডায়োড পরীক্ষা)' },
  summary: {
    en: 'The same LED circuit, wired backwards. Nothing lights, because a LED only passes current anode → cathode.',
    bn: 'একই LED সার্কিট, উল্টো করে যুক্ত। কিছুই জ্বলে না, কারণ LED শুধু অ্যানোড → ক্যাথোড দিকে কারেন্ট দেয়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 9 V battery, a 220 Ω resistor and a red LED.', bn: '৯ V ব্যাটারি, ২২০ Ω রোধক ও একটি লাল LED বসান।' },
    { en: 'Wire + → R → LED cathode, and LED anode → −. This is backwards on purpose.', bn: '+ → R → LED ক্যাথোড, LED অ্যানোড → −। ইচ্ছা করেই উল্টো করা হয়েছে।' },
    { en: 'Run and confirm the current is zero. Then swap the LED to fix it.', bn: 'Run করে কারেন্ট শূন্য দেখুন। তারপর LED ঘুরিয়ে ঠিক করুন।' }
  ],
  explanation: {
    en: 'A diode conducts only when the anode is more positive than the cathode by its forward voltage. Reversed, the LED behaves like a very high resistance (here a leakage of only nanoamps), so the current is essentially zero and the LED stays dark. The fix is always to check polarity first.',
    bn: 'ডায়োড তখনই কারেন্ট দেয় যখন অ্যানোড ক্যাথোডের চেয়ে Vf পরিমাণ বেশি পজিটিভ। উল্টো থাকলে LED-এর রোধ খুব বেশি হয় (এখানে কয়েক ন্যানোঅ্যাম্পিয়ার ফুটো), তাই কারেন্ট প্রায় শূন্য। মেরু আগে যাচাই করুন।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('r', 'resistor', 220, 60, { ohms: 220 }),
    C('led', 'led-red', 380, 60, { color: 'red' }),
    C('gnd', 'gnd-symbol', 40, 220)
  ],
  wires: [
    W('w1', 'bat.pos', 'r.a', 'red'),
    W('w2', 'r.b', 'led.cathode', 'red'),
    W('w3', 'led.anode', 'bat.neg', 'black'),
    W('w4', 'gnd.g', 'bat.neg', 'black')
  ]
};

const pushbuttonLamp: ExampleProject = {
  id: 'pushbutton-lamp',
  name: 'Push-button lamp',
  title: { en: 'Push-button lamp', bn: 'পুশবাটন দিয়ে বাতি' },
  summary: {
    en: 'A push-button closes the circuit only while it is held. The LED follows the button.',
    bn: 'পুশবাটন চাপা থাকা পর্যন্তই সার্কিট বন্ধ থাকে। LED বাটনের সাথে জ্বলে-নেভে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 9 V battery, a push-button, a 470 Ω resistor and a red LED.', bn: '৯ V ব্যাটারি, একটি পুশবাটন, ৪৭০ Ω রোধক ও একটি লাল LED বসান।' },
    { en: 'Wire + → button (a1), button (b1) → R → LED anode, LED cathode → −.', bn: '+ → বাটন (a1), বাটন (b1) → R → LED অ্যানোড, LED ক্যাথোড → −।' },
    { en: 'Run. Press the button in the inspector (pressed) and watch the LED.', bn: 'Run করুন। ইন্সপেক্টরে (pressed) বাটন চাপুন ও LED দেখুন।' }
  ],
  explanation: {
    en: 'A push-button is a normally open switch: a1 and b1 connect only while pressed. With the switch open there is no path and no current. Pressing it closes the loop, and (9 − 2) ÷ 470 Ω ≈ 15 mA flows through the LED.',
    bn: 'পুশবাটন সাধারণত খোলা সুইচ: চাপলে a1 ও b1 যুক্ত হয়। খোলা থাকলে কোনো পথ থাকে না, তাই কারেন্ট নেই। চাপলে লুপ বন্ধ হয় এবং (৯ − ২) ÷ ৪৭০ Ω ≈ ১৫ mA যায়।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('pb', 'pushbutton', 200, 60, { pressed: false }),
    C('r', 'resistor', 340, 60, { ohms: 470 }),
    C('led', 'led-red', 460, 60, { color: 'red' }),
    C('gnd', 'gnd-symbol', 40, 220)
  ],
  wires: [
    W('w1', 'bat.pos', 'pb.a1', 'red'),
    W('w2', 'pb.b1', 'r.a', 'red'),
    W('w3', 'r.b', 'led.anode', 'red'),
    W('w4', 'led.cathode', 'bat.neg', 'black'),
    W('w5', 'gnd.g', 'bat.neg', 'black')
  ]
};

const zenerShunt: ExampleProject = {
  id: 'zener-shunt',
  name: 'Zener shunt regulator',
  title: { en: 'Zener shunt regulator (5.1 V)', bn: 'জেনার শান্ট রেগুলেটর (৫.১ V)' },
  summary: {
    en: 'A 5.1 V zener diode in reverse breakdown holds the load voltage near 5.1 V while the battery sags.',
    bn: 'উল্টো দিকে জেনার ডায়োড (৫.১ V) লোডের ভোল্টেজ প্রায় ৫.১ V-তে ধরে রাখে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 9 V battery, a 330 Ω series resistor, a 5.1 V zener and a 1 kΩ load.', bn: '৯ V ব্যাটারি, ৩৩০ Ω সিরিজ রোধক, ৫.১ V জেনার ও ১ kΩ লোড বসান।' },
    { en: 'Wire + → 330 Ω → node. From the node: zener cathode and the 1 kΩ load. Zener anode and load return → −.', bn: '+ → ৩৩০ Ω → একটি বিন্দু (node)। সেখান থেকে জেনার ক্যাথোড ও ১ kΩ লোড। জেনার অ্যানোড ও লোডের অন্য প্রান্ত → −।' },
    { en: 'Run and read the node voltage on the series resistor (pin b).', bn: 'Run করে সিরিজ রোধকের pin b-এর ভোল্টেজ দেখুন।' }
  ],
  explanation: {
    en: 'The zener is reverse-biased. Once the node reaches its breakdown voltage (5.1 V) the zener conducts whatever current the series resistor delivers beyond the load, so the node is clamped. The 330 Ω resistor must still pass enough current (around 5 mA) to keep the zener in breakdown.',
    bn: 'জেনার উল্টো বায়াসে থাকে। নোড ৫.১ V-তে পৌঁছালে জেনার ব্রেকডাউনে গিয়ে বাড়তি কারেন্ট টেনে নেয়, ফলে নোড ৫.১ V-তে আটকে থাকে। জেনারকে ব্রেকডাউনে রাখতে ৩৩০ Ω দিয়ে প্রায় ৫ mA যেতে হয়।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('rs', 'resistor', 220, 60, { ohms: 330 }),
    C('zd', 'zener-5v1', 340, 160, { vz: 5.1 }),
    C('rl', 'resistor', 440, 160, { ohms: 1000 }),
    C('gnd', 'gnd-symbol', 40, 220)
  ],
  wires: [
    W('w1', 'bat.pos', 'rs.a', 'red'),
    W('w2', 'rs.b', 'zd.cathode', 'red'),
    W('w3', 'rs.b', 'rl.a', 'red'),
    W('w4', 'rl.b', 'bat.neg', 'black'),
    W('w5', 'zd.anode', 'bat.neg', 'black'),
    W('w6', 'gnd.g', 'bat.neg', 'black')
  ]
};

const potMeter: ExampleProject = {
  id: 'pot-voltage-meter',
  name: 'Potentiometer and voltmeter',
  title: { en: 'Potentiometer as a voltage divider, read with a multimeter', bn: 'পটেনশিওমিটার ভোল্টেজ ডিভাইডার, মাল্টিমিটারে পড়া' },
  summary: {
    en: 'A 10 kΩ pot divides 9 V. The multimeter on the wiper reads the set voltage.',
    bn: 'একটি ১০ kΩ পট ৯ V ভাগ করে। উইপারে লাগানো মাল্টিমিটার সেট ভোল্টেজ দেখায়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 9 V battery, a 10 kΩ pot and a multimeter set to V.', bn: '৯ V ব্যাটারি, ১০ kΩ পট ও V মোডে মাল্টিমিটার বসান।' },
    { en: 'Pot CW → + , pot CCW → −. Wiper → multimeter VΩmA lead, multimeter COM → −.', bn: 'পট CW → +, পট CCW → −। উইপার → মাল্টিমিটারের VΩmA, মাল্টিমিটারের COM → −।' },
    { en: 'Run, then change the pot position in the inspector. The reading follows.', bn: 'Run করুন, তারপর ইন্সপেক্টরে পট পজিশন বদলান। রিডিং সাথে সাথে বদলাবে।' }
  ],
  explanation: {
    en: 'The wiper splits the 10 kΩ track. With the pot at 30 %, the wiper voltage is 9 V × (1 − 0.30) ≈ 6.3 V. The multimeter draws almost no current, so it reads the true divider voltage without loading it.',
    bn: 'উইপার ১০ kΩ ট্র্যাককে ভাগ করে। পট ৩০% থাকলে উইপারের ভোল্টেজ ৯ V × (১ − ০.৩০) ≈ ৬.৩ V। মাল্টিমিটার প্রায় কোনো কারেন্ট নেয় না, তাই ডিভাইডারের আসল ভোল্টেজ পড়ে।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('pot', 'potentiometer', 240, 80, { ohms: 10000, position: 30 }),
    C('dmm', 'multimeter', 440, 80, { mode: 'V' }),
    C('gnd', 'gnd-symbol', 40, 220)
  ],
  wires: [
    W('w1', 'bat.pos', 'pot.cw', 'red'),
    W('w2', 'pot.ccw', 'bat.neg', 'black'),
    W('w3', 'pot.wiper', 'dmm.vma', 'yellow'),
    W('w4', 'dmm.com', 'bat.neg', 'black'),
    W('w5', 'gnd.g', 'bat.neg', 'black')
  ]
};

const npnSwitch: ExampleProject = {
  id: 'npn-switch',
  name: 'NPN transistor switch',
  title: { en: 'NPN transistor switch (BC547)', bn: 'NPN ট্রানজিস্টর সুইচ (BC547)' },
  summary: {
    en: 'A small base current switches a larger LED current through a BC547 transistor.',
    bn: 'ছোট বেস কারেন্ট দিয়ে BC547 ট্রানজিস্টরের মাধ্যমে বড় LED কারেন্ট চালু হয়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 9 V battery, a 470 Ω resistor, a red LED, a BC547 and a 10 kΩ base resistor.', bn: '৯ V ব্যাটারি, ৪৭০ Ω রোধক, একটি লাল LED, BC547 ও ১০ kΩ বেস রোধক বসান।' },
    { en: 'Load: + → 470 Ω → LED anode, LED cathode → collector (C). Emitter (E) → −.', bn: 'লোড: + → ৪৭০ Ω → LED অ্যানোড, LED ক্যাথোড → কালেক্টর (C)। এমিটার (E) → −।' },
    { en: 'Control: + → 10 kΩ → base (B). Emitter and GND → −. Run and watch the LED.', bn: 'নিয়ন্ত্রণ: + → ১০ kΩ → বেস (B)। এমিটার ও GND → −। Run করে LED দেখুন।' }
  ],
  explanation: {
    en: 'The base current, about (9 − 0.7) ÷ 10 kΩ ≈ 0.8 mA, lets the collector current flow. The transistor multiplies the base current by its gain β (200 here), so the transistor saturates and acts like a closed switch. The LED current is set by the 470 Ω collector resistor, about 15 mA.',
    bn: 'বেস কারেন্ট প্রায় (৯ − ০.৭) ÷ ১০ kΩ ≈ ০.৮ mA। ট্রানজিস্টর এটিকে β (এখানে ২০০) গুণ করে কালেক্টর কারেন্ট দেয়। এতে ট্রানজিস্টর সম্পৃক্ত (saturation) হয় এবং বন্ধ সুইচের মতো কাজ করে।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('rc', 'resistor', 240, 40, { ohms: 470 }),
    C('led', 'led-red', 340, 40, { color: 'red' }),
    C('q', 'bc547', 300, 200, { beta: 200 }),
    C('rb', 'resistor', 160, 200, { ohms: 10000 }),
    C('gnd', 'gnd-symbol', 40, 240)
  ],
  wires: [
    W('w1', 'bat.pos', 'rc.a', 'red'),
    W('w2', 'rc.b', 'led.anode', 'red'),
    W('w3', 'led.cathode', 'q.c', 'yellow'),
    W('w4', 'q.e', 'bat.neg', 'black'),
    W('w5', 'bat.pos', 'rb.a', 'red'),
    W('w6', 'rb.b', 'q.b', 'green'),
    W('w7', 'gnd.g', 'bat.neg', 'black')
  ]
};

const pnpHighSide: ExampleProject = {
  id: 'pnp-high-side',
  name: 'PNP high-side switch',
  title: { en: 'PNP high-side switch (BC557)', bn: 'PNP হাই-সাইড সুইচ (BC557)' },
  summary: {
    en: 'A PNP transistor connects the load to + . A push-button pulls its base low to turn it on.',
    bn: 'PNP ট্রানজিস্টর লোডকে + এর সাথে যুক্ত করে। বাটন বেসকে নিচে টানলে তা চালু হয়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 9 V battery, a BC557, a 470 Ω resistor, a red LED, two 10 kΩ resistors (pull-up and base) and a push-button.', bn: '৯ V ব্যাটারি, BC557, ৪৭০ Ω রোধক, লাল LED, দুটি ১০ kΩ রোধক (পুল-আপ ও বেস) ও একটি পুশবাটন বসান।' },
    { en: 'Emitter (E) → +. Collector (C) → 470 Ω → LED anode, LED cathode → −. Pull-up: base (B) → 10 kΩ → +.', bn: 'এমিটার (E) → +। কালেক্টর (C) → ৪৭০ Ω → LED অ্যানোড, LED ক্যাথোড → −। পুল-আপ: বেস (B) → ১০ kΩ → +।' },
    { en: 'Base (B) → 10 kΩ → push-button (a1), button (b1) → −. Press the button in the inspector.', bn: 'বেস (B) → ১০ kΩ → পুশবাটন (a1), বাটন (b1) → −। ইন্সপেক্টরে বাটন চাপুন।' }
  ],
  explanation: {
    en: 'A PNP switches on when its base is pulled below the emitter by about 0.7 V. Released, the 10 kΩ resistor holds the base at + so the transistor is off. Pressing the button pulls the base to −. The base resistor limits the base current to about 0.4 mA. With β = 200 that is more than enough to saturate the transistor for the 14 mA LED, and it keeps the collector current far below the device limit while the circuit settles. A much smaller base resistor (1 kΩ) would drive the collector current past the model’s 1 A limit during start-up and burn the LED. This is the high-side arrangement, useful when the load must stay on the ground side.',
    bn: 'PNP চালু হয় যখন বেস এমিটারের চেয়ে প্রায় ০.৭ V নিচে নামে। বাটন ছাড়া থাকলে ১০ kΩ বেসকে + এ রাখে, ট্রানজিস্টর বন্ধ। বাটন চাপলে বেস − এ নামে। বেস রোধক বেস কারেন্ট প্রায় ০.৪ mA-তে সীমিত রাখে। β = ২০০ হওয়ায় ১৪ mA LED-এর জন্য ট্রানজিস্টর সম্পৃক্ত করতে এটি যথেষ্ট, আর সার্কিট স্থির হওয়ার সময় কালেক্টর কারেন্ট ডিভাইসের সীমার অনেক নিচে থাকে। ১ kΩ হলে স্টার্ট-আপে কালেক্টর কারেন্ট ১ A ছাড়িয়ে LED পুড়ে যেত।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('q', 'bc557', 300, 160, { beta: 200 }),
    C('rc', 'resistor', 420, 100, { ohms: 470 }),
    C('led', 'led-red', 420, 200, { color: 'red' }),
    C('rb', 'resistor', 180, 240, { ohms: 10000 }),
    C('rs', 'resistor', 180, 300, { ohms: 10000 }),
    C('pb', 'pushbutton', 180, 360, { pressed: false }),
    C('gnd', 'gnd-symbol', 40, 360)
  ],
  wires: [
    W('w1', 'bat.pos', 'q.e', 'red'),
    W('w2', 'q.c', 'rc.a', 'yellow'),
    W('w3', 'rc.b', 'led.anode', 'yellow'),
    W('w4', 'led.cathode', 'bat.neg', 'black'),
    W('w5', 'q.b', 'rb.a', 'green'),
    W('w6', 'rb.b', 'bat.pos', 'red'),
    W('w7', 'q.b', 'rs.a', 'green'),
    W('w8', 'rs.b', 'pb.a1', 'green'),
    W('w9', 'pb.b1', 'bat.neg', 'black'),
    W('w10', 'gnd.g', 'bat.neg', 'black')
  ]
};

const mosfetSwitch: ExampleProject = {
  id: 'mosfet-switch',
  name: 'MOSFET switch with pull-down',
  title: { en: 'MOSFET switch with pull-down (2N7000)', bn: 'পুল-ডাউনসহ MOSFET সুইচ (2N7000)' },
  summary: {
    en: 'A logic-level button switches an LED through a 2N7000 MOSFET. The gate draws almost no current.',
    bn: 'একটি বাটন 2N7000 MOSFET দিয়ে LED চালু করে। গেট প্রায় কোনো কারেন্ট নেয় না।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 9 V battery, a push-button, a 10 kΩ pull-down resistor, a 2N7000 MOSFET, a 470 Ω resistor and a red LED.', bn: '৯ V ব্যাটারি, পুশবাটন, ১০ kΩ পুল-ডাউন রোধক, 2N7000 MOSFET, ৪৭০ Ω রোধক ও লাল LED বসান।' },
    { en: 'Gate: + → button (a1), button (b1) → gate (G) → 10 kΩ → −.', bn: 'গেট: + → বাটন (a1), বাটন (b1) → গেট (G) → ১০ kΩ → −।' },
    { en: 'Load: + → 470 Ω → LED anode, LED cathode → drain (D). Source (S) → −. Press the button in the inspector.', bn: 'লোড: + → ৪৭০ Ω → LED অ্যানোড, LED ক্যাথোড → ড্রেন (D)। সোর্স (S) → −। ইন্সপেক্টরে বাটন চাপুন।' }
  ],
  explanation: {
    en: 'The MOSFET is voltage-controlled. When the button is open the 10 kΩ resistor holds the gate at 0 V and the channel is off. Pressing the button raises the gate to 9 V, above the 2.1 V threshold, so the drain–source path conducts and the LED lights. The gate is insulated, so the resistor only has to keep the gate defined.',
    bn: 'MOSFET ভোল্টেজ দিয়ে নিয়ন্ত্রিত হয়। বাটন খোলা থাকলে ১০ kΩ গেটকে ০ V-এ রাখে, চ্যানেল বন্ধ। বাটন চাপলে গেট ৯ V হয়, যা ২.১ V থ্রেশহোল্ড ছাড়িয়ে যায়, তাই ড্রেন-সোর্স পথ খোলে।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('pb', 'pushbutton', 180, 60, { pressed: false }),
    C('rd', 'resistor', 180, 200, { ohms: 10000 }),
    C('q', '2n7000', 320, 160),
    C('rl', 'resistor', 320, 40, { ohms: 470 }),
    C('led', 'led-red', 440, 40, { color: 'red' }),
    C('gnd', 'gnd-symbol', 40, 240)
  ],
  wires: [
    W('w1', 'bat.pos', 'pb.a1', 'red'),
    W('w2', 'pb.b1', 'q.g', 'green'),
    W('w3', 'q.g', 'rd.a', 'green'),
    W('w4', 'rd.b', 'bat.neg', 'black'),
    W('w5', 'bat.pos', 'rl.a', 'red'),
    W('w6', 'rl.b', 'led.anode', 'red'),
    W('w7', 'led.cathode', 'q.d', 'yellow'),
    W('w8', 'q.s', 'bat.neg', 'black'),
    W('w9', 'gnd.g', 'bat.neg', 'black')
  ]
};

const darlingtonMotor: ExampleProject = {
  id: 'transistor-motor',
  name: 'Transistor motor driver with flyback diode',
  title: { en: 'Transistor motor driver with flyback diode', bn: 'ট্রানজিস্টর মোটর ড্রাইভার ও ফ্লাইব্যাক ডায়োড' },
  summary: {
    en: 'A TIP120 Darlington transistor drives a DC motor from a 6 V battery pack. A diode protects against the motor’s back-EMF spike.',
    bn: 'TIP120 ডার্লিংটন ট্রানজিস্টর ৬ V ব্যাটারি প্যাক থেকে DC মোটর চালায়। ডায়োড মোটরের back-EMF স্পাইক থেকে সুরক্ষা দেয়।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place a 6 V battery pack (4 × AA), a DC motor, a TIP120, a 1 kΩ base resistor and a 1N4007 flyback diode.', bn: '৬ V ব্যাটারি প্যাক (৪ × AA), DC মোটর, TIP120, ১ kΩ বেস রোধক ও 1N4007 ফ্লাইব্যাক ডায়োড বসান।' },
    { en: 'Motor M+ → +, motor M− → TIP120 collector (C). TIP120 emitter (E) → −.', bn: 'মোটর M+ → +, মোটর M− → TIP120 কালেক্টর (C)। TIP120 এমিটার (E) → −।' },
    { en: 'Base (B) → 1 kΩ → +. Diode cathode → + side of the motor, anode → M− side. Run and read the motor speed. Use a 6 V pack: a 9 V battery is rated for 0.5 A, which this motor would overload.', bn: 'বেস (B) → ১ kΩ → +। ডায়োডের ক্যাথোড → মোটরের + দিক, অ্যানোড → M− দিক। Run করে মোটরের গতি দেখুন। ৯ V ব্যাটারি ০.৫ A-র বেশি দিতে পারে না, তাই ৬ V প্যাক নিন।' }
  ],
  explanation: {
    en: 'The TIP120 is a Darlington pair with a gain of about 1000, so a few milliamps of base current can switch the motor current. When the transistor turns off, the motor coil pushes a voltage spike back the other way. The reverse-biased flyback diode gives that current a safe loop so it cannot damage the transistor.',
    bn: 'TIP120 ডার্লিংটন জোড়া, যার গেইন প্রায় ১০০০। তাই কয়েক mA বেস কারেন্ট মোটরের বড় কারেন্ট চালায়। ট্রানজিস্টর বন্ধ হলে মোটরের কয়েল উল্টো স্পাইক দেয়; ফ্লাইব্যাক ডায়োড সেই কারেন্টকে নিরাপদ পথ দেয়।'
  },
  components: [
    C('bat', 'battery-aa4', 40, 120, { volts: 6 }),
    C('mot', 'dc-motor', 300, 60, { rpm: 150 }),
    C('q', 'tip120', 300, 200, { beta: 1000 }),
    C('rb', 'resistor', 160, 200, { ohms: 1000 }),
    C('fd', 'diode-1n4007', 440, 80),
    C('gnd', 'gnd-symbol', 40, 240)
  ],
  wires: [
    W('w1', 'bat.pos', 'mot.a', 'red'),
    W('w2', 'mot.b', 'q.c', 'yellow'),
    W('w3', 'q.e', 'bat.neg', 'black'),
    W('w4', 'bat.pos', 'rb.a', 'red'),
    W('w5', 'rb.b', 'q.b', 'green'),
    W('w6', 'fd.cathode', 'mot.a', 'red'),
    W('w7', 'fd.anode', 'mot.b', 'yellow'),
    W('w8', 'gnd.g', 'bat.neg', 'black')
  ]
};

const reg7805: ExampleProject = {
  id: 'reg-7805-led',
  name: '7805 regulator powering an LED',
  title: { en: '7805 regulator: 9 V down to 5 V', bn: '7805 রেগুলেটর: ৯ V থেকে ৫ V' },
  summary: {
    en: 'A linear 7805 turns a 9 V battery into a steady 5 V rail for an LED.',
    bn: 'একটি লিনিয়ার 7805 ৯ V ব্যাটারিকে LED-এর জন্য স্থির ৫ V রেলে রূপান্তর করে।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 9 V battery, a 7805 regulator, a 220 Ω resistor and a green LED.', bn: '৯ V ব্যাটারি, 7805 রেগুলেটর, ২২০ Ω রোধক ও সবুজ LED বসান।' },
    { en: 'Battery + → 7805 IN. 7805 GND → battery −. 7805 OUT → 220 Ω → LED anode, LED cathode → −.', bn: 'ব্যাটারি + → 7805 IN। 7805 GND → ব্যাটারি −। 7805 OUT → ২২০ Ω → LED অ্যানোড, LED ক্যাথোড → −।' },
    { en: 'Run and check the OUT pin voltage on the regulator in the inspector.', bn: 'Run করে ইন্সপেক্টরে রেগুলেটরের OUT পিনের ভোল্টেজ দেখুন।' }
  ],
  explanation: {
    en: 'The 7805 keeps OUT at 5 V as long as IN is at least about 7 V. The extra 4 V is dropped inside the regulator as heat, which is why linear regulators are inefficient at large voltage differences. The LED then sees (5 − 2.2) ÷ 220 Ω ≈ 13 mA.',
    bn: '7805 IN অন্তত প্রায় ৭ V থাকলে OUT ৫ V-তে ধরে রাখে। বাড়তি ৪ V রেগুলেটরের ভেতরে তাপ হয়ে যায়; তাই বড় ভোল্টেজ পার্থক্যে লিনিয়ার রেগুলেটর কম দক্ষ। LED পায় (৫ − ২.২) ÷ ২২০ Ω ≈ ১৩ mA।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('reg', 'reg-7805', 200, 80, { vout: 5 }),
    C('r', 'resistor', 380, 80, { ohms: 220 }),
    C('led', 'led-green', 500, 80, { color: 'green', vf: 2.2 }),
    C('gnd', 'gnd-symbol', 40, 240)
  ],
  wires: [
    W('w1', 'bat.pos', 'reg.in', 'red'),
    W('w2', 'reg.gnd', 'bat.neg', 'black'),
    W('w3', 'reg.out', 'r.a', 'red'),
    W('w4', 'r.b', 'led.anode', 'green'),
    W('w5', 'led.cathode', 'bat.neg', 'black'),
    W('w6', 'gnd.g', 'bat.neg', 'black')
  ]
};

const ams1117: ExampleProject = {
  id: 'ams1117-3v3',
  name: 'AMS1117 3.3 V rail from USB',
  title: { en: 'AMS1117 3.3 V rail from USB', bn: 'USB থেকে AMS1117 ৩.৩ V রেল' },
  summary: {
    en: 'A USB 5 V supply feeds an AMS1117-3.3 regulator. The 3.3 V output lights a red LED for a 3.3 V device.',
    bn: 'USB ৫ V সাপ্লাই AMS1117-3.3 রেগুলেটরে যায়। ৩.৩ V আউটপুট একটি লাল LED জ্বালায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 5 V USB supply, an AMS1117 (3.3 V), a 100 Ω resistor and a red LED.', bn: '৫ V USB সাপ্লাই, AMS1117 (৩.৩ V), ১০০ Ω রোধক ও লাল LED বসান।' },
    { en: 'VBUS → AMS1117 VIN. GND → AMS1117 GND. VOUT → 100 Ω → LED anode, LED cathode → GND.', bn: 'VBUS → AMS1117 VIN। GND → AMS1117 GND। VOUT → ১০০ Ω → LED অ্যানোড, LED ক্যাথোড → GND।' },
    { en: 'Run and check the VOUT voltage in the inspector.', bn: 'Run করে ইন্সপেক্টরে VOUT ভোল্টেজ দেখুন।' }
  ],
  explanation: {
    en: 'The AMS1117 is a low-dropout regulator. It holds VOUT at 3.3 V even though the input is 5 V. The LED receives (3.3 − 2.0) ÷ 100 Ω ≈ 13 mA. A 3.3 V microcontroller or sensor would be wired the same way.',
    bn: 'AMS1117 লো-ড্রপআউট রেগুলেটর। ইনপুট ৫ V হলেও VOUT ৩.৩ V-তে থাকে। LED পায় (৩.৩ − ২.০) ÷ ১০০ Ω ≈ ১৩ mA। ৩.৩ V মাইক্রোকন্ট্রোলার বা সেন্সরও একইভাবে যুক্ত হয়।'
  },
  components: [
    C('usb', 'usb-5v', 40, 120, { volts: 5 }),
    C('reg', 'reg-ams1117', 200, 80, { vout: 3.3 }),
    C('r', 'resistor', 380, 80, { ohms: 100 }),
    C('led', 'led-red', 500, 80, { color: 'red' })
  ],
  wires: [
    W('w1', 'usb.vbus', 'reg.in', 'red'),
    W('w2', 'reg.gnd', 'usb.gnd', 'black'),
    W('w3', 'reg.out', 'r.a', 'red'),
    W('w4', 'r.b', 'led.anode', 'red'),
    W('w5', 'led.cathode', 'usb.gnd', 'black')
  ]
};

const lm358Buffer: ExampleProject = {
  id: 'lm358-buffer',
  name: 'Op-amp voltage follower',
  title: { en: 'Op-amp voltage follower (LM358)', bn: 'অপ-অ্যাম্প ভোল্টেজ ফলোয়ার (LM358)' },
  summary: {
    en: 'An LM358 copies the pot voltage to its output without loading the divider, then drives an LED.',
    bn: 'LM358 পটের ভোল্টেজ আউটপুটে কপি করে, ডিভাইডারের উপর চাপ না দিয়ে, তারপর LED চালায়।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place a 9 V battery, a 10 kΩ pot at 30 %, an LM358 (set vcc to 9 V), a 330 Ω resistor and a green LED.', bn: '৯ V ব্যাটারি, ৩০%-এ ১০ kΩ পট, LM358 (vcc ৯ V), ৩৩০ Ω রোধক ও সবুজ LED বসান।' },
    { en: 'Pot CW → +, CCW → −, wiper → LM358 pin 3 (IN+). LM358 pin 8 → +, pin 4 → −.', bn: 'পট CW → +, CCW → −, উইপার → LM358 পিন ৩ (IN+)। LM358 পিন ৮ → +, পিন ৪ → −।' },
    { en: 'Feedback: pin 1 (OUT) → pin 2 (IN−). Output: pin 1 → 330 Ω → LED → −. Run.', bn: 'ফিডব্যাক: পিন ১ (OUT) → পিন ২ (IN−)। আউটপুট: পিন ১ → ৩৩০ Ω → LED → −। Run করুন।' }
  ],
  explanation: {
    en: 'With the output wired back to IN−, the op-amp drives its output until IN− equals IN+. The input draws almost no current, so the pot’s wiper voltage (about 6.3 V) appears at the output, but now it can supply the LED current without the pot having to. That separation of a high-impedance input and a low-impedance output is the point of a buffer.',
    bn: 'আউটপুট IN− এ ফিরলে অপ-অ্যাম্প IN− কে IN+-এর সমান রাখে। ইনপুট প্রায় কারেন্ট নেয় না, তাই উইপারের (প্রায় ৬.৩ V) ভোল্টেজ আউটপুটে আসে এবং পটের বদলে অপ-অ্যাম্প LED-এর কারেন্ট দেয়।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('pot', 'potentiometer', 200, 60, { ohms: 10000, position: 30 }),
    C('opa', 'lm358', 380, 100, { vcc: 9 }),
    C('r', 'resistor', 560, 80, { ohms: 330 }),
    C('led', 'led-green', 660, 80, { color: 'green', vf: 2.2 }),
    C('gnd', 'gnd-symbol', 40, 240)
  ],
  wires: [
    W('w1', 'bat.pos', 'pot.cw', 'red'),
    W('w2', 'pot.ccw', 'bat.neg', 'black'),
    W('w3', 'pot.wiper', 'opa.3', 'yellow'),
    W('w4', 'opa.8', 'bat.pos', 'red'),
    W('w5', 'opa.4', 'bat.neg', 'black'),
    W('w6', 'opa.1', 'opa.2', 'green'),
    W('w7', 'opa.1', 'r.a', 'yellow'),
    W('w8', 'r.b', 'led.anode', 'yellow'),
    W('w9', 'led.cathode', 'bat.neg', 'black'),
    W('w10', 'gnd.g', 'bat.neg', 'black')
  ]
};

const lm358Comparator: ExampleProject = {
  id: 'lm358-comparator',
  name: 'Op-amp comparator with MOSFET output',
  title: { en: 'Op-amp comparator with a threshold', bn: 'থ্রেশহোল্ডসহ অপ-অ্যাম্প তুলনাকারী (comparator)' },
  summary: {
    en: 'The op-amp output goes high when the pot voltage is above a 4.5 V reference. A MOSFET then switches the LED.',
    bn: 'পটের ভোল্টেজ ৪.৫ V রেফারেন্সের উপরে গেলে অপ-অ্যাম্প আউটপুট উঁচু হয়। একটি MOSFET তখন LED জ্বালায়।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place a 9 V battery, a 10 kΩ pot, two 10 kΩ resistors (the reference divider), an LM358 (vcc 9 V), a 10 kΩ gate resistor, a 2N7000 MOSFET, a 470 Ω resistor and a green LED.', bn: '৯ V ব্যাটারি, ১০ kΩ পট, দুটি ১০ kΩ রোধক (রেফারেন্স ডিভাইডার), LM358 (vcc ৯ V), ১০ kΩ গেট রোধক, 2N7000 MOSFET, ৪৭০ Ω রোধক ও সবুজ LED বসান।' },
    { en: 'Pot wiper → pin 3 (IN+). Reference: + → 10 kΩ → pin 2 (IN−) → 10 kΩ → −. Pin 8 → +, pin 4 → −.', bn: 'পট উইপার → পিন ৩ (IN+)। রেফারেন্স: + → ১০ kΩ → পিন ২ (IN−) → ১০ kΩ → −। পিন ৮ → +, পিন ৪ → −।' },
    { en: 'Output: pin 1 → 10 kΩ → MOSFET gate (G). Load: + → 470 Ω → LED anode, LED cathode → drain (D), source (S) → −. Run, then set the pot to 80 % in the inspector.', bn: 'আউটপুট: পিন ১ → ১০ kΩ → MOSFET গেট (G)। লোড: + → ৪৭০ Ω → LED অ্যানোড, LED ক্যাথোড → ড্রেন (D), সোর্স (S) → −। Run করে ইন্সপেক্টরে পট ৮০%-এ নিন।' }
  ],
  explanation: {
    en: 'The op-amp has no feedback, so it works as a comparator: if IN+ is above IN−, the output goes to its positive rail; otherwise to its negative rail. At 20 % the pot gives 7.2 V, above the 4.5 V reference, so the output goes high and the MOSFET lights the LED. At 80 % the pot gives 1.8 V and the LED goes out. The MOSFET is there because an op-amp output is meant for small signal currents; the gate takes almost none, so the op-amp is never asked to drive the LED.',
    bn: 'এখানে কোনো ফিডব্যাক নেই, তাই অপ-অ্যাম্প তুলনাকারী: IN+ যদি IN−-এর উপরে হয়, আউটপুট পজিটিভ রেলে যায়। ২০%-এ পট ৭.২ V (রেফারেন্স ৪.৫ V-এর উপরে) দেয়, আউটপুট উঁচু হয় এবং MOSFET LED জ্বালায়। ৮০%-এ ১.৮ V, LED নেভে। অপ-অ্যাম্প আউটপুট ছোট সিগন্যাল কারেন্টের জন্য; গেট প্রায় কারেন্ট নেয় না, তাই অপ-অ্যাম্প সরাসরি LED চালায় না।'
  },
  components: [
    C('bat', 'battery-9v', 40, 120, { volts: 9 }),
    C('pot', 'potentiometer', 200, 40, { ohms: 10000, position: 20 }),
    C('ra', 'resistor', 320, 200, { ohms: 10000 }),
    C('rb', 'resistor', 320, 280, { ohms: 10000 }),
    C('opa', 'lm358', 420, 120, { vcc: 9 }),
    C('rg', 'resistor', 560, 200, { ohms: 10000 }),
    C('q', '2n7000', 680, 200),
    C('r', 'resistor', 600, 60, { ohms: 470 }),
    C('led', 'led-green', 740, 60, { color: 'green', vf: 2.2 }),
    C('gnd', 'gnd-symbol', 40, 280)
  ],
  wires: [
    W('w1', 'bat.pos', 'pot.cw', 'red'),
    W('w2', 'pot.ccw', 'bat.neg', 'black'),
    W('w3', 'pot.wiper', 'opa.3', 'yellow'),
    W('w4', 'bat.pos', 'ra.a', 'red'),
    W('w5', 'ra.b', 'opa.2', 'green'),
    W('w6', 'opa.2', 'rb.a', 'green'),
    W('w7', 'rb.b', 'bat.neg', 'black'),
    W('w8', 'opa.8', 'bat.pos', 'red'),
    W('w9', 'opa.4', 'bat.neg', 'black'),
    W('w10', 'opa.1', 'rg.a', 'yellow'),
    W('w11', 'rg.b', 'q.g', 'yellow'),
    W('w12', 'bat.pos', 'r.a', 'red'),
    W('w13', 'r.b', 'led.anode', 'yellow'),
    W('w14', 'led.cathode', 'q.d', 'yellow'),
    W('w15', 'q.s', 'bat.neg', 'black'),
    W('w16', 'gnd.g', 'bat.neg', 'black')
  ]
};

const nandGate: ExampleProject = {
  id: 'nand-gate',
  name: 'NAND gate (74HC00)',
  title: { en: 'NAND gate with two switches', bn: 'দুই সুইচসহ NAND গেট (74HC00)' },
  summary: {
    en: 'A 74HC00 NAND gate lights an LED unless both inputs are high.',
    bn: 'একটি 74HC00 NAND গেট দুই ইনপুট দুটোই উঁচু না হলে LED জ্বালায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Place a 5 V USB supply, a 74HC00, two switches, two 10 kΩ pull-down resistors, a 220 Ω resistor and a red LED.', bn: '৫ V USB সাপ্লাই, 74HC00, দুটি সুইচ, দুটি ১০ kΩ পুল-ডাউন রোধক, ২২০ Ω রোধক ও লাল LED বসান।' },
    { en: 'Pin 14 → VBUS, pin 7 → GND. Switch A: VBUS → pin 1; pin 1 → 10 kΩ → GND. Switch B: VBUS → pin 2; pin 2 → 10 kΩ → GND.', bn: 'পিন ১৪ → VBUS, পিন ৭ → GND। সুইচ A: VBUS → পিন ১; পিন ১ → ১০ kΩ → GND। সুইচ B: VBUS → পিন ২; পিন ২ → ১০ kΩ → GND।' },
    { en: 'Pin 3 (output) → 220 Ω → LED → GND. Run. Set switch B closed in the inspector and the LED goes out.', bn: 'পিন ৩ (আউটপুট) → ২২০ Ω → LED → GND। Run করুন। ইন্সপেক্টরে সুইচ B বন্ধ করলে LED নিভবে।' }
  ],
  explanation: {
    en: 'The gate output is low only when both inputs are high. With switch B open, input 2 is pulled low and the output is high, so the LED lights. Closing both switches makes both inputs high and the output low. The pull-down resistors give the open inputs a defined low level.',
    bn: 'NAND-এর আউটপুট শুধু তখনই নিচু যখন দুই ইনপুটই উঁচু। সুইচ B খোলা থাকলে ইনপুট ২ নিচু, তাই আউটপুট উঁচু এবং LED জ্বলে। দুটি সুইচ বন্ধ করলে আউটপুট নিচু হয়। পুল-ডাউন রোধক খোলা ইনপুটকে নির্দিষ্ট নিচু স্তরে রাখে।'
  },
  components: [
    C('usb', 'usb-5v', 40, 120, { volts: 5 }),
    C('ic', '74hc00', 300, 160),
    C('swa', 'switch-spst', 140, 60, { closed: true }),
    C('swb', 'switch-spst', 140, 220, { closed: false }),
    C('pda', 'resistor', 200, 60, { ohms: 10000 }),
    C('pdb', 'resistor', 200, 220, { ohms: 10000 }),
    C('r', 'resistor', 480, 120, { ohms: 220 }),
    C('led', 'led-red', 580, 120, { color: 'red' })
  ],
  wires: [
    W('w1', 'usb.vbus', 'swa.a', 'red'),
    W('w2', 'swa.b', 'ic.1', 'yellow'),
    W('w3', 'ic.1', 'pda.a', 'yellow'),
    W('w4', 'pda.b', 'usb.gnd', 'black'),
    W('w5', 'usb.vbus', 'swb.a', 'red'),
    W('w6', 'swb.b', 'ic.2', 'green'),
    W('w7', 'ic.2', 'pdb.a', 'green'),
    W('w8', 'pdb.b', 'usb.gnd', 'black'),
    W('w9', 'usb.vbus', 'ic.14', 'red'),
    W('w10', 'ic.7', 'usb.gnd', 'black'),
    W('w11', 'ic.3', 'r.a', 'yellow'),
    W('w12', 'r.b', 'led.anode', 'yellow'),
    W('w13', 'led.cathode', 'usb.gnd', 'black')
  ]
};

const andGate: ExampleProject = {
  id: 'and-gate',
  name: 'AND gate (74HC08)',
  title: { en: 'AND gate with two switches', bn: 'দুই সুইচসহ AND গেট (74HC08)' },
  summary: {
    en: 'A 74HC08 AND gate lights an LED only when both inputs are high.',
    bn: 'একটি 74HC08 AND গেট দুই ইনপুটই উঁচু হলে LED জ্বালায়।'
  },
  difficulty: 'intermediate',
  steps: [
    { en: 'Use the same parts as the NAND gate, but with a 74HC08 in place of the 74HC00.', bn: 'NAND গেটের মতো একই যন্ত্রাংশ, শুধু 74HC00-এর বদলে 74HC08 নিন।' },
    { en: 'Wire pins exactly as in the NAND example: pin 14 → VBUS, pin 7 → GND, inputs on pins 1 and 2, output on pin 3.', bn: 'NAND উদাহরণের মতো যুক্ত করুন: পিন ১৪ → VBUS, পিন ৭ → GND, ইনপুট পিন ১ ও ২, আউটপুট পিন ৩।' },
    { en: 'Run with both switches closed (LED on). Open switch B in the inspector and the LED goes out.', bn: 'দুটি সুইচ বন্ধ করে Run করুন (LED জ্বলবে)। ইন্সপেক্টরে সুইচ B খুললে LED নিভবে।' }
  ],
  explanation: {
    en: 'AND is high only when both inputs are high. With both switches closed, both inputs are at 5 V and the output is 5 V. Opening either switch pulls that input low through its resistor, and the output drops low. Compare with the NAND gate, which is the same circuit with the output inverted.',
    bn: 'AND-এর আউটপুট শুধু তখনই উঁচু যখন দুই ইনপুটই উঁচু। দুটি সুইচ বন্ধ থাকলে আউটপুট ৫ V। যেকোনো একটি খুললে সেই ইনপুট নিচু হয়ে আউটপুট নিচু হয়। NAND-এর সাথে তুলনা করুন: একই সার্কিট, শুধু আউটপুট উল্টানো।'
  },
  components: [
    C('usb', 'usb-5v', 40, 120, { volts: 5 }),
    C('ic', '74hc08', 300, 160),
    C('swa', 'switch-spst', 140, 60, { closed: true }),
    C('swb', 'switch-spst', 140, 220, { closed: true }),
    C('pda', 'resistor', 200, 60, { ohms: 10000 }),
    C('pdb', 'resistor', 200, 220, { ohms: 10000 }),
    C('r', 'resistor', 480, 120, { ohms: 220 }),
    C('led', 'led-red', 580, 120, { color: 'red' })
  ],
  wires: [
    W('w1', 'usb.vbus', 'swa.a', 'red'),
    W('w2', 'swa.b', 'ic.1', 'yellow'),
    W('w3', 'ic.1', 'pda.a', 'yellow'),
    W('w4', 'pda.b', 'usb.gnd', 'black'),
    W('w5', 'usb.vbus', 'swb.a', 'red'),
    W('w6', 'swb.b', 'ic.2', 'green'),
    W('w7', 'ic.2', 'pdb.a', 'green'),
    W('w8', 'pdb.b', 'usb.gnd', 'black'),
    W('w9', 'usb.vbus', 'ic.14', 'red'),
    W('w10', 'ic.7', 'usb.gnd', 'black'),
    W('w11', 'ic.3', 'r.a', 'yellow'),
    W('w12', 'r.b', 'led.anode', 'yellow'),
    W('w13', 'led.cathode', 'usb.gnd', 'black')
  ]
};

const notGate: ExampleProject = {
  id: 'not-gate',
  name: 'NOT gate (74HC04)',
  title: { en: 'NOT gate (inverter)', bn: 'NOT গেট (ইনভার্টার)' },
  summary: {
    en: 'A 74HC04 inverter drives an LED. A low input gives a high output, so the LED is on until the input goes high.',
    bn: 'একটি 74HC04 ইনভার্টার LED চালায়। নিচু ইনপুটে উঁচু আউটপুট, তাই ইনপুট উঁচু না হওয়া পর্যন্ত LED জ্বলে।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 5 V USB supply, a 74HC04, a switch, a 10 kΩ pull-down resistor, a 220 Ω resistor and a red LED.', bn: '৫ V USB সাপ্লাই, 74HC04, একটি সুইচ, ১০ kΩ পুল-ডাউন রোধক, ২২০ Ω রোধক ও লাল LED বসান।' },
    { en: 'Pin 14 → VBUS, pin 7 → GND. Switch: VBUS → pin 1 (1A). Pin 1 → 10 kΩ → GND.', bn: 'পিন ১৪ → VBUS, পিন ৭ → GND। সুইচ: VBUS → পিন ১ (1A)। পিন ১ → ১০ kΩ → GND।' },
    { en: 'Pin 2 (1Y) → 220 Ω → LED → GND. Run with the switch open (LED on), then close it in the inspector (LED off).', bn: 'পিন ২ (1Y) → ২২০ Ω → LED → GND। সুইচ খোলা রেখে Run করুন (LED জ্বলবে), তারপর ইন্সপেক্টরে বন্ধ করুন (LED নিভবে)।' }
  ],
  explanation: {
    en: 'The inverter output is the opposite of its input. Open switch: input low, output high, LED on. Closed switch: input high, output low, LED off. Inverters are used to clean up slow or noisy signals and to make active-low signals.',
    bn: 'ইনভার্টারের আউটপুট ইনপুটের উল্টো। সুইচ খোলা: ইনপুট নিচু, আউটপুট উঁচু, LED জ্বলে। সুইচ বন্ধ: ইনপুট উঁচু, আউটপুট নিচু, LED নেভে।'
  },
  components: [
    C('usb', 'usb-5v', 40, 120, { volts: 5 }),
    C('ic', '74hc04', 300, 160),
    C('sw', 'switch-spst', 140, 60, { closed: false }),
    C('pd', 'resistor', 200, 60, { ohms: 10000 }),
    C('r', 'resistor', 480, 120, { ohms: 220 }),
    C('led', 'led-red', 580, 120, { color: 'red' })
  ],
  wires: [
    W('w1', 'usb.vbus', 'sw.a', 'red'),
    W('w2', 'sw.b', 'ic.1', 'yellow'),
    W('w3', 'ic.1', 'pd.a', 'yellow'),
    W('w4', 'pd.b', 'usb.gnd', 'black'),
    W('w5', 'usb.vbus', 'ic.14', 'red'),
    W('w6', 'ic.7', 'usb.gnd', 'black'),
    W('w7', 'ic.2', 'r.a', 'yellow'),
    W('w8', 'r.b', 'led.anode', 'yellow'),
    W('w9', 'led.cathode', 'usb.gnd', 'black')
  ]
};

const bridgeRectifier: ExampleProject = {
  id: 'bridge-rectifier',
  name: 'Full-wave bridge rectifier',
  title: { en: 'Full-wave bridge rectifier', bn: 'ফুল-ওয়েভ ব্রিজ রেকটিফায়ার' },
  summary: {
    en: 'Four diodes turn a 5 V AC source into a pulsing DC voltage that lights an LED.',
    bn: 'চারটি ডায়োড ৫ V AC উৎসকে স্পন্দনশীল DC বানায়, যা LED জ্বালায়।'
  },
  difficulty: 'advanced',
  steps: [
    { en: 'Place an AC source (amplitude 5 V), four 1N4007 diodes, a 220 Ω resistor, a red LED and a GND symbol.', bn: 'AC উৎস (অ্যামপ্লিচিউড ৫ V), চারটি 1N4007 ডায়োড, ২২০ Ω রোধক, লাল LED ও একটি GND চিহ্ন বসান।' },
    { en: 'Bridge: AC OUT → D1 anode, AC GND → D2 anode, D1 and D2 cathodes → resistor (DC +). D3 anode and D4 anode → GND (DC −), D3 cathode → AC OUT, D4 cathode → AC GND.', bn: 'ব্রিজ: AC OUT → D1 অ্যানোড, AC GND → D2 অ্যানোড, D1 ও D2 ক্যাথোড → রোধক (DC +)। D3 ও D4 অ্যানোড → GND (DC −), D3 ক্যাথোড → AC OUT, D4 ক্যাথোড → AC GND।' },
    { en: 'Resistor → LED anode, LED cathode → GND. Run and watch the LED current.', bn: 'রোধক → LED অ্যানোড, LED ক্যাথোড → GND। Run করে LED-এর কারেন্ট দেখুন।' }
  ],
  explanation: {
    en: 'On each half-cycle, two diagonal diodes conduct and push current through the load in the same direction. The output is always positive but pulses twice per input cycle, which is why the bridge is called full-wave. Each diode drops about 0.7 V, so the peak output is at most about 5 − 1.4 = 3.6 V, and in practice a little less.',
    bn: 'প্রতি অর্ধচক্রে দুটি তির্যক ডায়োড কারেন্ট চালায়, আর লোডে কারেন্ট একই দিকে যায়। আউটপুট সবসময় পজিটিভ, কিন্তু প্রতি ইনপুট চক্রে দুবার স্পন্দিত হয়, তাই এটি ফুল-ওয়েভ। প্রতি ডায়োডে প্রায় ০.৭ V যায়, তাই শীর্ষ আউটপুট সর্বোচ্চ প্রায় ৫ − ১.৪ = ৩.৬ V, বাস্তবে একটু কম।'
  },
  components: [
    C('ac', 'ac-source', 40, 120, { freq: 1000, amp: 5, offset: 0 }),
    C('d1', 'diode-1n4007', 200, 40),
    C('d2', 'diode-1n4007', 200, 200),
    C('d3', 'diode-1n4007', 320, 200),
    C('d4', 'diode-1n4007', 320, 40),
    C('r', 'resistor', 440, 120, { ohms: 220 }),
    C('led', 'led-red', 540, 120, { color: 'red' }),
    C('gnd', 'gnd-symbol', 440, 260)
  ],
  wires: [
    W('w1', 'ac.out', 'd1.anode', 'red'),
    W('w2', 'd1.cathode', 'r.a', 'red'),
    W('w3', 'ac.gnd', 'd2.anode', 'black'),
    W('w4', 'd2.cathode', 'r.a', 'red'),
    W('w5', 'd3.anode', 'gnd.g', 'black'),
    W('w6', 'd3.cathode', 'ac.out', 'yellow'),
    W('w7', 'd4.anode', 'gnd.g', 'black'),
    W('w8', 'd4.cathode', 'ac.gnd', 'black'),
    W('w9', 'r.b', 'led.anode', 'red'),
    W('w10', 'led.cathode', 'gnd.g', 'black')
  ]
};

const buzzerSwitch: ExampleProject = {
  id: 'buzzer-switch',
  name: 'Buzzer with a switch',
  title: { en: 'Buzzer with a switch', bn: 'সুইচসহ বাজার (buzzer)' },
  summary: {
    en: 'Close the switch to sound the buzzer. The buzzer only needs its supply connected, not a PWM signal.',
    bn: 'সুইচ বন্ধ করলে বাজার বাজে। বাজারের জন্য PWM লাগে না, শুধু সাপ্লাই যুক্ত থাকলেই হয়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place a 5 V USB supply, a switch and a buzzer.', bn: '৫ V USB সাপ্লাই, একটি সুইচ ও একটি বাজার বসান।' },
    { en: 'VBUS → switch (a), switch (b) → buzzer (+), buzzer (−) → GND.', bn: 'VBUS → সুইচ (a), সুইচ (b) → বাজার (+), বাজার (−) → GND।' },
    { en: 'Run with the switch open (silent). Close it in the inspector and the buzzer sounds.', bn: 'সুইচ খোলা রেখে Run করুন (নীরব)। ইন্সপেক্টরে সুইচ বন্ধ করলে বাজার বাজবে।' }
  ],
  explanation: {
    en: 'A passive piezo buzzer has a small internal resistance in this model (150 Ω). Closing the switch lets about 33 mA flow from 5 V, and the buzzer converts that electrical energy into sound. A melody needs tone() on an MCU pin; a plain DC supply gives one steady tone.',
    bn: 'এই মডেলে বাজারের ভেতরের রোধ ১৫০ Ω। সুইচ বন্ধ হলে ৫ V থেকে প্রায় ৩৩ mA যায়, যা শব্দে রূপান্তরিত হয়। সুর বাজাতে MCU-র পিনে tone() দরকার; সাধারণ DC সাপ্লাই একটানা একটি শব্দ দেয়।'
  },
  components: [
    C('usb', 'usb-5v', 40, 120, { volts: 5 }),
    C('sw', 'switch-spst', 200, 60, { closed: false }),
    C('bz', 'buzzer', 360, 120, { freq: 2000 })
  ],
  wires: [
    W('w1', 'usb.vbus', 'sw.a', 'red'),
    W('w2', 'sw.b', 'bz.pos', 'red'),
    W('w3', 'bz.neg', 'usb.gnd', 'black')
  ]
};

const scopeSine: ExampleProject = {
  id: 'scope-sine',
  name: 'Oscilloscope on a sine source',
  title: { en: 'Oscilloscope: viewing a sine wave', bn: 'অসিলোস্কোপ: সাইন ওয়েভ দেখা' },
  summary: {
    en: 'An AC source with a 1 kΩ load is probed by an oscilloscope on channel 1. You see the sine wave.',
    bn: '১ kΩ লোডসহ AC উৎসের সাইন ওয়েভ অসিলোস্কোপের চ্যানেল ১-এ দেখা যায়।'
  },
  difficulty: 'beginner',
  steps: [
    { en: 'Place an AC source (1 kHz, 2 V amplitude), a 1 kΩ resistor and an oscilloscope.', bn: 'AC উৎস (১ kHz, ২ V অ্যামপ্লিচিউড), ১ kΩ রোধক ও একটি অসিলোস্কোপ বসান।' },
    { en: 'AC OUT → resistor → AC GND. Scope CH1 → AC OUT. Scope GND → AC GND.', bn: 'AC OUT → রোধক → AC GND। স্কোপ CH1 → AC OUT। স্কোপ GND → AC GND।' },
    { en: 'Run. The trace shows about 3.6 V peak to peak; the source resistance and the load take a little off the 4 V ideal.', bn: 'Run করুন। স্কোপে প্রায় ৩.৬ V পিক-টু-পিক ট্রেস দেখা যাবে; সোর্সের রোধ ও লোড আদর্শ ৪ V থেকে সামান্য কমায়।' }
  ],
  explanation: {
    en: 'The scope measures the voltage between its CH1 probe and its GND clip, and plots it against time. A 2 V amplitude sine has a peak-to-peak of 4 V. Frequency is read from the period on the time axis: one cycle at 1 kHz lasts 1 ms.',
    bn: 'স্কোপ CH1 প্রোব ও GND ক্লিপের মধ্যের ভোল্টেজ মেপে সময়ের বিপরীতে আঁকে। ২ V অ্যামপ্লিচিউডের সাইনের পিক-টু-পিক ৪ V। ১ kHz-এর এক চক্র ১ ms, সময়-অক্ষ থেকে পর্যায়কাল পড়ে ফ্রিকোয়েন্সি বের করা যায়।'
  },
  components: [
    C('ac', 'ac-source', 40, 120, { freq: 1000, amp: 2, offset: 0 }),
    C('rl', 'resistor', 200, 60, { ohms: 1000 }),
    C('scope', 'oscilloscope', 340, 120)
  ],
  wires: [
    W('w1', 'ac.out', 'rl.a', 'yellow'),
    W('w2', 'rl.b', 'ac.gnd', 'black'),
    W('w3', 'ac.out', 'scope.ch1', 'green'),
    W('w4', 'scope.gnd', 'ac.gnd', 'black')
  ]
};

export const CIRCUIT_PROJECTS: ExampleProject[] = [
  voltageDivider,
  seriesLeds,
  parallelLeds,
  reverseLed,
  pushbuttonLamp,
  zenerShunt,
  potMeter,
  npnSwitch,
  pnpHighSide,
  mosfetSwitch,
  darlingtonMotor,
  reg7805,
  ams1117,
  lm358Buffer,
  lm358Comparator,
  nandGate,
  andGate,
  notGate,
  bridgeRectifier,
  buzzerSwitch,
  scopeSine
];
