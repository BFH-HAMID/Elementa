import type { PracticalModel } from './types';
import { clamp, columnValues, mean, meanOf, num, round, slopeThroughOrigin } from './helpers';

/* ------------------------------------------------------------------ */
/* Resistors in series / parallel                                      */
/* ------------------------------------------------------------------ */

const reqOf = (combo: number, r1: number, r2: number) => (combo === 0 ? r1 + r2 : (r1 * r2) / (r1 + r2));
const comboName = (combo: number) => (combo === 0 ? 'Series R₁+R₂' : 'Parallel R₁∥R₂');

export const seriesParallel: PracticalModel = {
  slug: 'resistors-series-parallel',
  scene: 'circuit',
  variant: 'seriesParallel',
  howTo_en: 'Pick series or parallel, then change the rheostat (supply voltage) and record V and I for each setting.',
  howTo_bn: 'সিরিজ বা প্যারালাল বাছাই করো, তারপর রিওস্ট্যাট (সাপ্লাই ভোল্টেজ) বদলে প্রতিবার V ও I রেকর্ড করো।',
  controls: [
    {
      key: 'combo',
      en: 'Combination',
      bn: 'সমবায়',
      default: 0,
      options: [
        { value: 0, en: 'Series', bn: 'সিরিজ' },
        { value: 1, en: 'Parallel', bn: 'প্যারালাল' }
      ]
    },
    { key: 'r1', en: 'Resistor R₁', bn: 'রোধ R₁', min: 5, max: 100, step: 5, unit: 'Ω', default: 20 },
    { key: 'r2', en: 'Resistor R₂', bn: 'রোধ R₂', min: 5, max: 100, step: 5, unit: 'Ω', default: 30 },
    { key: 'emf', en: 'Rheostat → supply', bn: 'রিওস্ট্যাট → সাপ্লাই', min: 1, max: 12, step: 0.5, unit: 'V', default: 4 }
  ],
  sweep: { key: 'emf', values: [2, 4, 6, 8, 10] },
  minReadings: 5,
  compute(p, noise) {
    const req = reqOf(p.combo, p.r1, p.r2);
    const current = p.emf / (req + 0.3);
    const voltage = current * req;
    const vm = voltage + noise(0.02);
    const im = current + noise(0.0008);
    const i1 = p.combo === 0 ? current : voltage / p.r1;
    const i2 = p.combo === 0 ? current : voltage / p.r2;
    return {
      row: {
        combination: comboName(p.combo),
        voltage: round(vm, 2),
        current: round(im, 3),
        reqCalc: round(vm / Math.max(im, 1e-6), 2),
        reqTheory: round(req, 2)
      },
      live: [
        { en: 'Voltmeter', bn: 'ভোল্টমিটার', value: voltage, unit: 'V', digits: 2 },
        { en: 'Ammeter', bn: 'অ্যামিটার', value: current * 1000, unit: 'mA', digits: 1 },
        { en: 'Req (theory)', bn: 'Req (তাত্ত্বিক)', value: req, unit: 'Ω', digits: 2, tone: 'info' }
      ],
      view: { combo: p.combo, r1: p.r1, r2: p.r2, emf: p.emf, current, voltage, i1, i2 },
      ready: true
    };
  },
  result: {
    en: 'Equivalent resistance (current combination)',
    bn: 'তুল্য রোধ (বর্তমান সমবায়)',
    unit: 'Ω',
    digits: 2,
    compute(rows, p) {
      const target = round(reqOf(p.combo, p.r1, p.r2), 2);
      const matching = rows.filter((r) => num(r, 'reqTheory') === target);
      return slopeThroughOrigin(matching, 'current', 'voltage');
    },
    expected: (p) => reqOf(p.combo, p.r1, p.r2),
    rowwise: false
  }
};

/* ------------------------------------------------------------------ */
/* Meter bridge                                                         */
/* ------------------------------------------------------------------ */

const X_TRUE = 10;

export const meterBridge: PracticalModel = {
  slug: 'meter-bridge',
  scene: 'wireBoard',
  variant: 'meterBridge',
  howTo_en: 'Choose a resistance R, then slide the jockey along the wire until the galvanometer shows zero deflection. Record, change R and repeat.',
  howTo_bn: 'রোধ বাক্স থেকে R নাও, তারপর জকি তারের উপর সরাও যতক্ষণ না গ্যালভানোমিটারের কাঁটা শূন্যে আসে। রেকর্ড করো, R বদলে আবার করো।',
  controls: [
    { key: 'R', en: 'Resistance box R', bn: 'রোধ বাক্স R', min: 1, max: 30, step: 1, unit: 'Ω', default: 6 },
    { key: 'l', en: 'Jockey position l', bn: 'জকির অবস্থান l', min: 1, max: 99, step: 0.1, unit: 'cm', default: 30, fine: true, digits: 1 }
  ],
  sweep: { key: 'R', values: [4, 6, 8, 12, 15] },
  minReadings: 5,
  compute(p, noise) {
    const l0 = (100 * p.R) / (p.R + X_TRUE);
    const deflection = clamp(130 * (p.l / 100 - p.R / (p.R + X_TRUE)), -30, 30);
    const balanced = Math.abs(p.l - l0) <= 0.25;
    const lm = p.l + noise(0.12);
    return {
      row: {
        resBoxR: p.R,
        lengthL: round(lm, 1),
        length100minusL: round(100 - lm, 1),
        unknownX: round((p.R * (100 - lm)) / lm, 2)
      },
      live: [
        { en: 'Galvanometer', bn: 'গ্যালভানোমিটার', value: deflection, unit: 'div', digits: 1, tone: balanced ? 'good' : 'warn' },
        { en: 'Jockey l', bn: 'জকি l', value: p.l, unit: 'cm', digits: 1 },
        { en: '100 − l', bn: '100 − l', value: 100 - p.l, unit: 'cm', digits: 1 }
      ],
      view: { R: p.R, l: p.l, deflection, balanced: balanced ? 1 : 0, l0 },
      status: balanced
        ? { en: 'Null point found — record this reading.', bn: 'নাল পয়েন্ট পাওয়া গেছে — এখন রেকর্ড করো।', tone: 'good' }
        : {
            en: deflection > 0 ? 'Deflection to the right — move the jockey towards A (left).' : 'Deflection to the left — move the jockey towards C (right).',
            bn: deflection > 0 ? 'কাঁটা ডানে — জকি বাম দিকে (A এর দিকে) সরাও।' : 'কাঁটা বামে — জকি ডান দিকে (C এর দিকে) সরাও।',
            tone: 'warn'
          },
      ready: balanced
    };
  },
  solve: (p) => ({ ...p, l: round((100 * p.R) / (p.R + X_TRUE), 1) }),
  result: {
    en: 'Unknown resistance X',
    bn: 'অজানা রোধ X',
    unit: 'Ω',
    digits: 2,
    compute: (rows) => meanOf(rows, 'unknownX'),
    expected: X_TRUE
  }
};

/* ------------------------------------------------------------------ */
/* Potentiometer                                                        */
/* ------------------------------------------------------------------ */

const DRIVER_EMF = 2.0;
const WIRE_R = 10; // 10 m wire, 1 Ω/m
const WIRE_CM = 1000;
const gradientOf = (rheostat: number) => (DRIVER_EMF * WIRE_R) / (WIRE_R + rheostat + 0.1) / WIRE_CM; // V/cm

const E1 = 1.45;
const E2 = 1.0;

export const potentiometerEmf: PracticalModel = {
  slug: 'potentiometer-emf',
  scene: 'wireBoard',
  variant: 'potEmf',
  howTo_en: 'Find the balancing length l₁ for cell E₁ and l₂ for cell E₂ (both galvanometers at zero). Change the rheostat to get a new set and repeat.',
  howTo_bn: 'E₁ কোষের জন্য l₁ এবং E₂ কোষের জন্য l₂ ব্যালেন্সিং দৈর্ঘ্য খুঁজে বের করো (দুই গ্যালভানোমিটার শূন্য)। রিওস্ট্যাট বদলে নতুন সেট নাও।',
  controls: [
    { key: 'rh', en: 'Rheostat (driver)', bn: 'রিওস্ট্যাট (ড্রাইভার)', min: 0, max: 3, step: 0.25, unit: 'Ω', default: 1 },
    { key: 'l1', en: 'Jockey for E₁ (l₁)', bn: 'E₁ এর জকি (l₁)', min: 0, max: 1000, step: 0.5, unit: 'cm', default: 600, fine: true, digits: 1 },
    { key: 'l2', en: 'Jockey for E₂ (l₂)', bn: 'E₂ এর জকি (l₂)', min: 0, max: 1000, step: 0.5, unit: 'cm', default: 400, fine: true, digits: 1 }
  ],
  sweep: { key: 'rh', values: [0, 0.5, 1, 2, 3] },
  minReadings: 4,
  compute(p, noise) {
    const k = gradientOf(p.rh);
    const d1 = clamp(300 * (k * p.l1 - E1), -30, 30);
    const d2 = clamp(300 * (k * p.l2 - E2), -30, 30);
    const b1 = Math.abs(p.l1 - E1 / k) <= 1.0;
    const b2 = Math.abs(p.l2 - E2 / k) <= 1.0;
    const l1m = p.l1 + noise(0.4);
    const l2m = p.l2 + noise(0.4);
    const both = b1 && b2;
    return {
      row: {
        cell: `Rh ${p.rh} Ω`,
        balancingL: round(l1m, 1),
        balancingL2: round(l2m, 1),
        ratio: round(l1m / Math.max(l2m, 1e-6), 3)
      },
      live: [
        { en: 'Galvanometer G₁ (E₁)', bn: 'গ্যালভানোমিটার G₁ (E₁)', value: d1, unit: 'div', digits: 1, tone: b1 ? 'good' : 'warn' },
        { en: 'Galvanometer G₂ (E₂)', bn: 'গ্যালভানোমিটার G₂ (E₂)', value: d2, unit: 'div', digits: 1, tone: b2 ? 'good' : 'warn' },
        { en: 'Potential gradient', bn: 'বিভব নতিমাত্রা', value: k * 100, unit: 'V/m', digits: 4, tone: 'info' }
      ],
      view: { l1: p.l1, l2: p.l2, d1, d2, b1: b1 ? 1 : 0, b2: b2 ? 1 : 0, rh: p.rh, k },
      status: both
        ? { en: 'Both cells balanced — record l₁ and l₂.', bn: 'দুই কোষই ব্যালেন্সড — l₁ ও l₂ রেকর্ড করো।', tone: 'good' }
        : {
            en: !b1 ? 'Move jockey l₁ until G₁ reads zero.' : 'Now move jockey l₂ until G₂ reads zero.',
            bn: !b1 ? 'G₁ শূন্য না হওয়া পর্যন্ত জকি l₁ সরাও।' : 'এবার G₂ শূন্য না হওয়া পর্যন্ত জকি l₂ সরাও।',
            tone: 'warn'
          },
      ready: both
    };
  },
  solve: (p) => {
    const k = gradientOf(p.rh);
    return { ...p, l1: Math.round((E1 / k) * 2) / 2, l2: Math.round((E2 / k) * 2) / 2 };
  },
  result: {
    en: 'EMF ratio E₁/E₂',
    bn: 'তড়িচ্চালক বলের অনুপাত E₁/E₂',
    unit: '',
    digits: 3,
    compute: (rows) => meanOf(rows, 'ratio'),
    expected: E1 / E2
  }
};

const CELL_E = 1.5;
const CELL_R = 1.2;

export const potentiometerInternal: PracticalModel = {
  slug: 'potentiometer-internal-resistance',
  scene: 'wireBoard',
  variant: 'potInternal',
  howTo_en: 'With the key open, balance the cell (l₁). Close the key with shunt R and balance again (l₂). Repeat for several R.',
  howTo_bn: 'চাবি খোলা রেখে কোষটি ব্যালেন্স করো (l₁)। শান্ট R দিয়ে চাবি বন্ধ করে আবার ব্যালেন্স করো (l₂)। কয়েকটি R এর জন্য পুনরাবৃত্তি করো।',
  controls: [
    { key: 'R', en: 'Shunt resistance R', bn: 'শান্ট রোধ R', min: 1, max: 10, step: 0.5, unit: 'Ω', default: 3 },
    { key: 'l1', en: 'Jockey, key open (l₁)', bn: 'জকি, চাবি খোলা (l₁)', min: 0, max: 1000, step: 0.5, unit: 'cm', default: 700, fine: true, digits: 1 },
    { key: 'l2', en: 'Jockey, key closed (l₂)', bn: 'জকি, চাবি বন্ধ (l₂)', min: 0, max: 1000, step: 0.5, unit: 'cm', default: 450, fine: true, digits: 1 }
  ],
  sweep: { key: 'R', values: [2, 3, 4, 6, 8] },
  minReadings: 5,
  compute(p, noise) {
    const k = gradientOf(0.5);
    const terminal = (CELL_E * p.R) / (p.R + CELL_R);
    const d1 = clamp(300 * (k * p.l1 - CELL_E), -30, 30);
    const d2 = clamp(300 * (k * p.l2 - terminal), -30, 30);
    const b1 = Math.abs(p.l1 - CELL_E / k) <= 0.8;
    const b2 = Math.abs(p.l2 - terminal / k) <= 0.8;
    const l1m = p.l1 + noise(0.3);
    const l2m = p.l2 + noise(0.3);
    const both = b1 && b2;
    return {
      row: {
        shuntR: p.R,
        lengthL1: round(l1m, 1),
        lengthL2: round(l2m, 1),
        internalR: round(p.R * (l1m / Math.max(l2m, 1e-6) - 1), 2)
      },
      live: [
        { en: 'G (key open)', bn: 'G (চাবি খোলা)', value: d1, unit: 'div', digits: 1, tone: b1 ? 'good' : 'warn' },
        { en: 'G (key closed)', bn: 'G (চাবি বন্ধ)', value: d2, unit: 'div', digits: 1, tone: b2 ? 'good' : 'warn' },
        { en: 'Terminal voltage', bn: 'প্রান্তীয় বিভব', value: terminal, unit: 'V', digits: 3, tone: 'info' }
      ],
      view: { l1: p.l1, l2: p.l2, d1, d2, b1: b1 ? 1 : 0, b2: b2 ? 1 : 0, R: p.R, k },
      status: both
        ? { en: 'Both lengths balanced — record.', bn: 'দুই দৈর্ঘ্যই ব্যালেন্সড — রেকর্ড করো।', tone: 'good' }
        : {
            en: !b1 ? 'Balance l₁ first (key open).' : 'Close the key and balance l₂.',
            bn: !b1 ? 'আগে l₁ ব্যালেন্স করো (চাবি খোলা)।' : 'চাবি বন্ধ করে l₂ ব্যালেন্স করো।',
            tone: 'warn'
          },
      ready: both
    };
  },
  solve: (p) => {
    const k = gradientOf(0.5);
    const terminal = (CELL_E * p.R) / (p.R + CELL_R);
    return { ...p, l1: Math.round((CELL_E / k) * 2) / 2, l2: Math.round((terminal / k) * 2) / 2 };
  },
  result: {
    en: 'Internal resistance r',
    bn: 'অভ্যন্তরীণ রোধ r',
    unit: 'Ω',
    digits: 2,
    compute: (rows) => meanOf(rows, 'internalR'),
    expected: CELL_R
  }
};

/* ------------------------------------------------------------------ */
/* Kirchhoff's laws                                                     */
/* ------------------------------------------------------------------ */

export function solveKirchhoff(e1: number, e2: number, r1: number, r2: number, r3: number) {
  const va = (e1 / r1 + e2 / r2) / (1 / r1 + 1 / r2 + 1 / r3);
  return { va, i1: (e1 - va) / r1, i2: (e2 - va) / r2, i3: va / r3 };
}

export const kirchhoff: PracticalModel = {
  slug: 'kirchhoffs-laws',
  scene: 'circuit',
  variant: 'kirchhoff',
  howTo_en: 'Select a check (junction A, loop 1 or loop 2) and record. Change the EMFs or resistors and verify that each sum stays ≈ 0.',
  howTo_bn: 'একটি যাচাই বাছাই করো (সংযোগ A, লুপ ১ বা লুপ ২) এবং রেকর্ড করো। EMF বা রোধ বদলে দেখো প্রতিটি যোগফল ≈ ০ থাকে।',
  controls: [
    {
      key: 'check',
      en: 'Check',
      bn: 'যাচাই',
      default: 0,
      options: [
        { value: 0, en: 'Junction A (KCL)', bn: 'সংযোগ A (KCL)' },
        { value: 1, en: 'Loop 1 (KVL)', bn: 'লুপ ১ (KVL)' },
        { value: 2, en: 'Loop 2 (KVL)', bn: 'লুপ ২ (KVL)' }
      ]
    },
    { key: 'e1', en: 'EMF E₁', bn: 'EMF E₁', min: 2, max: 12, step: 0.5, unit: 'V', default: 6 },
    { key: 'e2', en: 'EMF E₂', bn: 'EMF E₂', min: 2, max: 12, step: 0.5, unit: 'V', default: 3 },
    { key: 'r1', en: 'R₁', bn: 'R₁', min: 10, max: 100, step: 5, unit: 'Ω', default: 20 },
    { key: 'r2', en: 'R₂', bn: 'R₂', min: 10, max: 100, step: 5, unit: 'Ω', default: 30 },
    { key: 'r3', en: 'R₃', bn: 'R₃', min: 10, max: 100, step: 5, unit: 'Ω', default: 40 }
  ],
  sweep: { key: 'check', values: [0, 1, 2] },
  minReadings: 3,
  compute(p, noise) {
    const s = solveKirchhoff(p.e1, p.e2, p.r1, p.r2, p.r3);
    const i1 = s.i1 + noise(0.0004);
    const i2 = s.i2 + noise(0.0004);
    const i3 = s.i3 + noise(0.0004);
    let label = '';
    let val1 = 0;
    let val2 = 0;
    if (p.check === 0) {
      label = 'Junction A: I₁+I₂ | I₃ (A)';
      val1 = i1 + i2;
      val2 = i3;
    } else if (p.check === 1) {
      label = 'Loop 1: E₁ | I₁R₁+I₃R₃ (V)';
      val1 = p.e1;
      val2 = i1 * p.r1 + i3 * p.r3 + noise(0.01);
    } else {
      label = 'Loop 2: E₂ | I₂R₂+I₃R₃ (V)';
      val1 = p.e2;
      val2 = i2 * p.r2 + i3 * p.r3 + noise(0.01);
    }
    const digits = p.check === 0 ? 4 : 3;
    return {
      row: { loopOrNode: label, val1: round(val1, digits), val2: round(val2, digits), sumVal: round(val1 - val2, digits) },
      live: [
        { en: 'I₁ (branch E₁)', bn: 'I₁ (E₁ শাখা)', value: s.i1 * 1000, unit: 'mA', digits: 1 },
        { en: 'I₂ (branch E₂)', bn: 'I₂ (E₂ শাখা)', value: s.i2 * 1000, unit: 'mA', digits: 1 },
        { en: 'I₃ (middle R₃)', bn: 'I₃ (মধ্য R₃)', value: s.i3 * 1000, unit: 'mA', digits: 1 },
        { en: 'Σ (should be 0)', bn: 'Σ (০ হওয়া উচিত)', value: val1 - val2, digits: 4, tone: 'good' }
      ],
      view: { ...s, e1: p.e1, e2: p.e2, r1: p.r1, r2: p.r2, r3: p.r3, check: p.check },
      ready: true
    };
  },
  result: {
    en: 'Mean |Σ| of all checks (ideal 0)',
    bn: 'সব যাচাইয়ের গড় |Σ| (আদর্শ ০)',
    unit: '',
    digits: 4,
    compute(rows) {
      const v = columnValues(rows, 'sumVal').map(Math.abs);
      return mean(v);
    },
    expected: 0,
    absolute: true,
    tolerance: 0.02
  }
};

/* ------------------------------------------------------------------ */
/* Transformer                                                          */
/* ------------------------------------------------------------------ */

export const transformer: PracticalModel = {
  slug: 'transformer-characteristics',
  scene: 'circuit',
  variant: 'transformer',
  howTo_en: 'Choose a secondary coil (turns ratio), vary the primary voltage Vp and record the secondary voltage Vs.',
  howTo_bn: 'একটি সেকেন্ডারি কয়েল (পাক অনুপাত) বাছাই করো, প্রাইমারি ভোল্টেজ Vp বদলাও এবং সেকেন্ডারি ভোল্টেজ Vs রেকর্ড করো।',
  controls: [
    {
      key: 'ratio',
      en: 'Ns/Np (Np = 500)',
      bn: 'Ns/Np (Np = 500)',
      default: 0.2,
      options: [
        { value: 0.2, en: '100 turns (0.2)', bn: '১০০ পাক (0.2)' },
        { value: 0.5, en: '250 turns (0.5)', bn: '২৫০ পাক (0.5)' },
        { value: 2, en: '1000 turns (2)', bn: '১০০০ পাক (2)' }
      ]
    },
    { key: 'vp', en: 'Primary voltage Vp', bn: 'প্রাইমারি ভোল্টেজ Vp', min: 2, max: 24, step: 1, unit: 'V', default: 6 }
  ],
  sweep: { key: 'vp', values: [4, 8, 12, 16, 20] },
  minReadings: 5,
  compute(p, noise) {
    const efficiency = 0.985;
    const vs = p.vp * p.ratio * efficiency;
    const vsm = vs + noise(0.02 * Math.max(1, p.ratio));
    return {
      row: { vpVolts: p.vp, turnsRatio: p.ratio, vsMeasured: round(vsm, 2), vsTheory: round(p.vp * p.ratio, 2) },
      live: [
        { en: 'Primary Vp', bn: 'প্রাইমারি Vp', value: p.vp, unit: 'V', digits: 1 },
        { en: 'Secondary Vs', bn: 'সেকেন্ডারি Vs', value: vs, unit: 'V', digits: 2 },
        { en: 'Type', bn: 'ধরন', value: p.ratio > 1 ? 'Step-up' : 'Step-down', tone: 'info' }
      ],
      view: { vp: p.vp, vs, ratio: p.ratio },
      ready: true
    };
  },
  result: {
    en: 'Voltage ratio Vs/Vp (current coil)',
    bn: 'ভোল্টেজ অনুপাত Vs/Vp (বর্তমান কয়েল)',
    unit: '',
    digits: 3,
    compute(rows, p) {
      const matching = rows.filter((r) => num(r, 'turnsRatio') === p.ratio);
      return slopeThroughOrigin(matching, 'vpVolts', 'vsMeasured');
    },
    expected: (p) => p.ratio,
    rowwise: false
  }
};

/* ------------------------------------------------------------------ */
/* LCR series resonance                                                 */
/* ------------------------------------------------------------------ */

const LCR = { L: 0.1, C: 0.25e-6, R: 100, V: 5 };
export const LCR_FR = 1 / (2 * Math.PI * Math.sqrt(LCR.L * LCR.C));

export const lcrResonance: PracticalModel = {
  slug: 'lcr-series-resonance',
  scene: 'circuit',
  variant: 'lcr',
  howTo_en: 'Sweep the signal-generator frequency and record the current. The frequency with maximum current is the resonant frequency.',
  howTo_bn: 'সিগন্যাল জেনারেটরের কম্পাঙ্ক বদলে বিদ্যুৎপ্রবাহ রেকর্ড করো। যে কম্পাঙ্কে প্রবাহ সর্বোচ্চ সেটিই অনুনাদ কম্পাঙ্ক।',
  controls: [{ key: 'f', en: 'Frequency f', bn: 'কম্পাঙ্ক f', min: 300, max: 2000, step: 10, unit: 'Hz', default: 600, fine: true }],
  sweep: { key: 'f', values: [600, 800, 900, 1000, 1100, 1200, 1500] },
  minReadings: 7,
  compute(p, noise) {
    const w = 2 * Math.PI * p.f;
    const xl = w * LCR.L;
    const xc = 1 / (w * LCR.C);
    const z = Math.sqrt(LCR.R * LCR.R + (xl - xc) * (xl - xc));
    const i = LCR.V / z;
    const im = i * 1000 + noise(0.15);
    return {
      row: { freqHz: p.f, currentMa: round(im, 1), impedanceZ: round((LCR.V / Math.max(im, 0.01)) * 1000, 1) },
      live: [
        { en: 'Current I', bn: 'প্রবাহ I', value: i * 1000, unit: 'mA', digits: 2 },
        { en: 'XL', bn: 'XL', value: xl, unit: 'Ω', digits: 0 },
        { en: 'XC', bn: 'XC', value: xc, unit: 'Ω', digits: 0 },
        { en: 'Impedance Z', bn: 'প্রতিবন্ধকতা Z', value: z, unit: 'Ω', digits: 0, tone: Math.abs(xl - xc) < 30 ? 'good' : 'info' }
      ],
      view: { f: p.f, i, xl, xc, z, phase: Math.atan2(xl - xc, LCR.R) },
      ready: true
    };
  },
  result: {
    en: 'Resonant frequency (max current)',
    bn: 'অনুনাদ কম্পাঙ্ক (সর্বোচ্চ প্রবাহ)',
    unit: 'Hz',
    digits: 0,
    compute(rows) {
      let best: { f: number; i: number } | null = null;
      for (const r of rows) {
        const f = num(r, 'freqHz');
        const i = num(r, 'currentMa');
        if (f === null || i === null) continue;
        if (!best || i > best.i) best = { f, i };
      }
      return best ? best.f : null;
    },
    expected: LCR_FR,
    rowwise: false
  }
};

/* ------------------------------------------------------------------ */
/* Faraday's law                                                        */
/* ------------------------------------------------------------------ */

const DEFLECTION_PER_SPEED = 6;
const motions = [
  { en: 'N-pole pushed in', bn: 'N মেরু ভেতরে', sign: 1, code: 'N → in' },
  { en: 'N-pole pulled out', bn: 'N মেরু বাইরে', sign: -1, code: 'N ← out' },
  { en: 'S-pole pushed in', bn: 'S মেরু ভেতরে', sign: -1, code: 'S → in' },
  { en: 'S-pole pulled out', bn: 'S মেরু বাইরে', sign: 1, code: 'S ← out' },
  { en: 'Magnet at rest', bn: 'চুম্বক স্থির', sign: 0, code: 'rest' }
];

export const faraday: PracticalModel = {
  slug: 'faradays-law-induction',
  scene: 'induction',
  animated: true,
  howTo_en: 'Choose how the magnet moves and how fast. Record the galvanometer deflection — faster motion gives more deflection, reversing gives opposite polarity.',
  howTo_bn: 'চুম্বক কীভাবে ও কত দ্রুত নড়বে বাছাই করো। গ্যালভানোমিটারের বিক্ষেপ রেকর্ড করো — দ্রুত গতিতে বেশি বিক্ষেপ, দিক উল্টালে পোলারিটি উল্টো।',
  controls: [
    { key: 'motion', en: 'Magnet motion', bn: 'চুম্বকের গতি', default: 0, options: motions.map((m, i) => ({ value: i, en: m.en, bn: m.bn })) },
    { key: 'speed', en: 'Speed', bn: 'দ্রুতি', min: 0.5, max: 5, step: 0.5, unit: 'm/s', default: 1 }
  ],
  sweep: { key: 'speed', values: [1, 2, 3, 4, 5] },
  minReadings: 5,
  compute(p, noise) {
    const m = motions[p.motion] || motions[0];
    const speed = m.sign === 0 ? 0 : p.speed;
    const deflection = m.sign * DEFLECTION_PER_SPEED * speed;
    const dm = m.sign === 0 ? 0 : deflection + noise(0.25);
    return {
      row: { motionAction: m.code, speed, deflectionDiv: round(dm, 1), inducedPol: m.sign > 0 ? '+' : m.sign < 0 ? '−' : '0' },
      live: [
        { en: 'Deflection', bn: 'বিক্ষেপ', value: deflection, unit: 'div', digits: 1, tone: deflection === 0 ? 'info' : 'good' },
        { en: 'Induced EMF (rel.)', bn: 'আবিষ্ট EMF (আপেক্ষিক)', value: deflection * 0.5, unit: 'mV', digits: 1 },
        { en: 'Polarity', bn: 'পোলারিটি', value: m.sign > 0 ? '+' : m.sign < 0 ? '−' : '0' }
      ],
      view: { sign: m.sign, speed, deflection, pole: p.motion === 2 || p.motion === 3 ? 'S' : 'N', inward: p.motion === 0 || p.motion === 2 ? 1 : 0 },
      ready: true
    };
  },
  result: {
    en: 'Deflection per unit speed (|θ| ∝ v)',
    bn: 'একক দ্রুতিতে বিক্ষেপ (|θ| ∝ v)',
    unit: 'div/(m/s)',
    digits: 2,
    compute(rows) {
      const abs = rows.map((r) => ({ ...r, absDef: Math.abs(num(r, 'deflectionDiv') ?? 0) }));
      return slopeThroughOrigin(abs, 'speed', 'absDef');
    },
    expected: DEFLECTION_PER_SPEED
  }
};

export const electricityModels: PracticalModel[] = [
  seriesParallel,
  meterBridge,
  potentiometerEmf,
  potentiometerInternal,
  kirchhoff,
  transformer,
  lcrResonance,
  faraday
];
