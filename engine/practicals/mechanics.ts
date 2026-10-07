import type { PracticalModel } from './types';
import { DEG, G, meanOf, round, sig, slopeThroughOrigin, trialJitter } from './helpers';

const FOUR_PI2 = 4 * Math.PI * Math.PI;

/* ------------------------------------------------------------------ */
/* Simple pendulum                                                      */
/* ------------------------------------------------------------------ */

export const simplePendulum: PracticalModel = {
  slug: 'simple-pendulum',
  scene: 'pendulum',
  variant: 'simple',
  animated: true,
  howTo_en: 'Set the effective length L, keep the amplitude small (< 5°), time 20 oscillations and record. Repeat for different lengths.',
  howTo_bn: 'কার্যকর দৈর্ঘ্য L ঠিক করো, বিস্তার ছোট রাখো (< ৫°), ২০টি দোলনের সময় নিয়ে রেকর্ড করো। ভিন্ন দৈর্ঘ্যে পুনরাবৃত্তি করো।',
  controls: [
    { key: 'L', en: 'Effective length L', bn: 'কার্যকর দৈর্ঘ্য L', min: 0.2, max: 1.5, step: 0.05, unit: 'm', default: 0.5, digits: 2 },
    { key: 'amp', en: 'Amplitude', bn: 'বিস্তার', min: 2, max: 20, step: 1, unit: '°', default: 4 }
  ],
  sweep: { key: 'L', values: [0.4, 0.6, 0.8, 1.0, 1.2] },
  minReadings: 5,
  compute(p, noise) {
    const t0 = 2 * Math.PI * Math.sqrt(p.L / G);
    const th = p.amp * DEG;
    const T = t0 * (1 + (th * th) / 16);
    const t20 = 20 * T + noise(0.06);
    const Tm = t20 / 20;
    const big = p.amp > 6;
    return {
      row: {
        lengthL: round(p.L, 3),
        time20: round(t20, 2),
        periodT: round(Tm, 3),
        periodTSq: round(Tm * Tm, 3),
        gCalc: round((FOUR_PI2 * p.L) / (Tm * Tm), 3)
      },
      live: [
        { en: 'Period T', bn: 'দোলনকাল T', value: T, unit: 's', digits: 3 },
        { en: 'Time for 20 osc.', bn: '২০ দোলনের সময়', value: 20 * T, unit: 's', digits: 2 },
        { en: 'T²', bn: 'T²', value: T * T, unit: 's²', digits: 3 }
      ],
      view: { L: p.L, amp: p.amp, T },
      status: big
        ? { en: 'Amplitude too large — SHM formula needs θ < 5°.', bn: 'বিস্তার বেশি — সরল দোলনের সূত্রের জন্য θ < ৫° রাখো।', tone: 'warn' }
        : { en: 'Small oscillations — good. Record the time for 20 oscillations.', bn: 'ছোট দোলন — ঠিক আছে। ২০ দোলনের সময় রেকর্ড করো।', tone: 'good' },
      ready: true
    };
  },
  result: {
    en: 'Acceleration due to gravity g (from L–T² slope)',
    bn: 'অভিকর্ষজ ত্বরণ g (L–T² ঢাল থেকে)',
    unit: 'm/s²',
    digits: 3,
    compute(rows) {
      const s = slopeThroughOrigin(rows, 'periodTSq', 'lengthL');
      return s === null ? null : FOUR_PI2 * s;
    },
    expected: G
  }
};

/* ------------------------------------------------------------------ */
/* Spring constant (Hooke's law)                                        */
/* ------------------------------------------------------------------ */

const K_SPRING = 25;

export const springConstant: PracticalModel = {
  slug: 'spring-constant',
  scene: 'spring',
  variant: 'hooke',
  animated: true,
  howTo_en: 'Hang slotted masses on the spring, wait for it to settle, read the extension on the scale and record. Add mass and repeat.',
  howTo_bn: 'স্প্রিংয়ে স্লটেড ভর ঝোলাও, স্থির হলে স্কেলে প্রসারণ পড়ে রেকর্ড করো। ভর বাড়িয়ে আবার করো।',
  controls: [{ key: 'm', en: 'Hanging mass', bn: 'ঝোলানো ভর', min: 0.05, max: 0.5, step: 0.05, unit: 'kg', default: 0.05, digits: 2 }],
  sweep: { key: 'm', values: [0.05, 0.1, 0.15, 0.2, 0.25] },
  minReadings: 5,
  compute(p, noise, ctx) {
    const F = p.m * G;
    const x = F / K_SPRING;
    const settled = ctx.elapsed > 1.6;
    const xm = x + noise(0.0005);
    return {
      row: { massKg: round(p.m, 3), forceN: round(F, 3), extensionM: round(xm, 4), kStatic: round(F / xm, 2) },
      live: [
        { en: 'Load F = mg', bn: 'বল F = mg', value: F, unit: 'N', digits: 3 },
        { en: 'Extension x', bn: 'প্রসারণ x', value: x * 100, unit: 'cm', digits: 2 }
      ],
      view: { m: p.m, x, elapsed: ctx.elapsed },
      status: settled
        ? { en: 'Pointer steady — read the scale.', bn: 'পয়েন্টার স্থির — স্কেল পড়ো।', tone: 'good' }
        : { en: 'Spring still oscillating… wait for it to settle.', bn: 'স্প্রিং এখনও দুলছে… স্থির হতে দাও।', tone: 'warn' },
      ready: settled
    };
  },
  result: {
    en: 'Spring constant k (F–x slope)',
    bn: 'স্প্রিং ধ্রুবক k (F–x ঢাল)',
    unit: 'N/m',
    digits: 2,
    compute: (rows) => slopeThroughOrigin(rows, 'extensionM', 'forceN'),
    expected: K_SPRING
  }
};

/* ------------------------------------------------------------------ */
/* Inclined plane — limiting friction                                   */
/* ------------------------------------------------------------------ */

const MU_S = 0.364;
const THETA_C = Math.atan(MU_S) / DEG;

export function inclineCriticalAngle(trial: number) {
  return THETA_C + trialJitter(trial) * 0.5;
}

export const inclinedPlane: PracticalModel = {
  slug: 'inclined-plane',
  scene: 'incline',
  animated: true,
  howTo_en: 'Raise the plane slowly. The moment the block just starts to slide, record the angle. Each trial the surface behaves slightly differently.',
  howTo_bn: 'তলটি ধীরে ধীরে উঁচু করো। ব্লকটি ঠিক পিছলাতে শুরু করলেই কোণ রেকর্ড করো। প্রতি ট্রায়ালে তল সামান্য ভিন্ন আচরণ করে।',
  controls: [{ key: 'angle', en: 'Plane angle θ', bn: 'তলের কোণ θ', min: 0, max: 40, step: 0.2, unit: '°', default: 10, fine: true, digits: 1 }],
  minReadings: 5,
  compute(p, noise, ctx) {
    const trial = ctx.rows.length + 1;
    const crit = inclineCriticalAngle(trial);
    const sliding = p.angle >= crit;
    const overshoot = p.angle > crit + 1.2;
    const am = p.angle + noise(0.1);
    const muK = 0.3;
    const accel = sliding ? Math.max(0, G * (Math.sin(p.angle * DEG) - muK * Math.cos(p.angle * DEG))) : 0;
    return {
      row: { trial, angleDeg: round(am, 1), tanTheta: round(Math.tan(am * DEG), 3) },
      live: [
        { en: 'Angle θ', bn: 'কোণ θ', value: p.angle, unit: '°', digits: 1 },
        { en: 'tan θ', bn: 'tan θ', value: Math.tan(p.angle * DEG), digits: 3 },
        { en: 'Block', bn: 'ব্লক', value: sliding ? 'Sliding' : 'At rest', tone: sliding ? (overshoot ? 'warn' : 'good') : 'info' }
      ],
      view: { angle: p.angle, sliding: sliding ? 1 : 0, accel, elapsed: ctx.elapsed },
      status: !sliding
        ? { en: `Trial ${trial}: block at rest — increase the angle slowly.`, bn: `ট্রায়াল ${trial}: ব্লক স্থির — কোণ ধীরে বাড়াও।`, tone: 'info' }
        : overshoot
          ? { en: 'Overshot — lower the angle and approach the slipping point slowly.', bn: 'বেশি হয়ে গেছে — কোণ কমিয়ে ধীরে পিছলানোর বিন্দুর কাছে যাও।', tone: 'warn' }
          : { en: 'Block just started to slide — record this angle!', bn: 'ব্লক ঠিক পিছলাতে শুরু করেছে — এই কোণ রেকর্ড করো!', tone: 'good' },
      ready: sliding && !overshoot
    };
  },
  solve: (p, ctx) => ({ ...p, angle: round(Math.ceil(inclineCriticalAngle(ctx.rows.length + 1) / 0.2 + 1e-9) * 0.2, 1) }),
  result: {
    en: 'Coefficient of static friction μ = tan θ',
    bn: 'স্থিতি ঘর্ষণ গুণাঙ্ক μ = tan θ',
    unit: '',
    digits: 3,
    compute: (rows) => meanOf(rows, 'tanTheta'),
    expected: MU_S
  }
};

/* ------------------------------------------------------------------ */
/* Projectile motion                                                    */
/* ------------------------------------------------------------------ */

export const projectile: PracticalModel = {
  slug: 'projectile-motion',
  scene: 'projectile',
  animated: true,
  howTo_en: 'Keep the launch speed fixed, change the launch angle and record the horizontal range. Range ∝ sin 2θ.',
  howTo_bn: 'উৎক্ষেপণ বেগ স্থির রেখে কোণ বদলাও এবং অনুভূমিক পাল্লা রেকর্ড করো। পাল্লা ∝ sin 2θ।',
  controls: [
    { key: 'v0', en: 'Launch speed v₀', bn: 'উৎক্ষেপণ বেগ v₀', min: 5, max: 15, step: 0.5, unit: 'm/s', default: 10 },
    { key: 'angle', en: 'Launch angle θ', bn: 'উৎক্ষেপণ কোণ θ', min: 10, max: 80, step: 5, unit: '°', default: 30 }
  ],
  sweep: { key: 'angle', values: [15, 30, 45, 60, 75] },
  minReadings: 5,
  compute(p, noise) {
    const s2 = Math.sin(2 * p.angle * DEG);
    const R = (p.v0 * p.v0 * s2) / G;
    const H = (p.v0 * p.v0 * Math.pow(Math.sin(p.angle * DEG), 2)) / (2 * G);
    const tf = (2 * p.v0 * Math.sin(p.angle * DEG)) / G;
    return {
      row: { angleDeg: p.angle, sin2Theta: round(s2, 3), rangeM: round(R + noise(0.03), 2), theoryRangeM: round(R, 2) },
      live: [
        { en: 'Range R', bn: 'পাল্লা R', value: R, unit: 'm', digits: 2 },
        { en: 'Max height H', bn: 'সর্বোচ্চ উচ্চতা H', value: H, unit: 'm', digits: 2 },
        { en: 'Time of flight', bn: 'উড্ডয়নকাল', value: tf, unit: 's', digits: 2 }
      ],
      view: { v0: p.v0, angle: p.angle, R, H, tf },
      ready: true
    };
  },
  result: {
    en: 'v₀²/g from R–sin 2θ slope',
    bn: 'R–sin 2θ ঢাল থেকে v₀²/g',
    unit: 'm',
    digits: 2,
    compute: (rows) => slopeThroughOrigin(rows, 'sin2Theta', 'rangeM'),
    expected: (p) => (p.v0 * p.v0) / G
  }
};

/* ------------------------------------------------------------------ */
/* Newton's second law (trolley)                                        */
/* ------------------------------------------------------------------ */

const TROLLEY_TOTAL = 0.55;
const TRACK_S = 1.0;

export const newtonSecond: PracticalModel = {
  slug: 'newtons-second-law',
  scene: 'trolley',
  animated: true,
  howTo_en: 'Move slotted masses from the trolley to the hanger (total mass stays 0.55 kg). Time the 1 m run and record. Force ∝ acceleration.',
  howTo_bn: 'ট্রলি থেকে হ্যাঙ্গারে ভর সরাও (মোট ভর 0.55 kg থাকে)। ১ মিটার যাওয়ার সময় মেপে রেকর্ড করো। বল ∝ ত্বরণ।',
  controls: [{ key: 'm', en: 'Hanging mass', bn: 'ঝোলানো ভর', min: 0.01, max: 0.1, step: 0.01, unit: 'kg', default: 0.02, digits: 2 }],
  sweep: { key: 'm', values: [0.02, 0.04, 0.06, 0.08, 0.1] },
  minReadings: 5,
  compute(p, noise) {
    const F = p.m * G;
    const a = F / TROLLEY_TOTAL;
    const t = Math.sqrt((2 * TRACK_S) / a);
    const tm = t + noise(0.01);
    return {
      row: { hangingMassKg: round(p.m, 3), forceN: round(F, 3), timeSec: round(tm, 2), accelMps2: round((2 * TRACK_S) / (tm * tm), 3) },
      live: [
        { en: 'Pulling force F', bn: 'টান বল F', value: F, unit: 'N', digits: 3 },
        { en: 'Acceleration a', bn: 'ত্বরণ a', value: a, unit: 'm/s²', digits: 3 },
        { en: 'Time for 1 m', bn: '১ মিটারের সময়', value: t, unit: 's', digits: 2 }
      ],
      view: { m: p.m, a, t },
      ready: true
    };
  },
  result: {
    en: 'Total mass M (F–a slope)',
    bn: 'মোট ভর M (F–a ঢাল)',
    unit: 'kg',
    digits: 3,
    compute: (rows) => slopeThroughOrigin(rows, 'accelMps2', 'forceN'),
    expected: TROLLEY_TOTAL
  }
};

/* ------------------------------------------------------------------ */
/* Atwood machine                                                       */
/* ------------------------------------------------------------------ */

const ATWOOD_H = 1.0;
const PULLEY_EQUIV_G = 4; // pulley inertia as equivalent grams

export const atwood: PracticalModel = {
  slug: 'atwood-machine-g',
  scene: 'atwood',
  animated: true,
  howTo_en: 'Make m₁ heavier than m₂, release from rest and time the 1 m fall. Record and repeat with a different mass difference.',
  howTo_bn: 'm₁ কে m₂ এর চেয়ে ভারী করো, স্থির অবস্থা থেকে ছেড়ে ১ মিটার পড়ার সময় মাপো। রেকর্ড করে ভিন্ন ভর-পার্থক্যে আবার করো।',
  controls: [
    { key: 'm1', en: 'Mass m₁', bn: 'ভর m₁', min: 150, max: 300, step: 5, unit: 'g', default: 220 },
    { key: 'm2', en: 'Mass m₂', bn: 'ভর m₂', min: 150, max: 300, step: 5, unit: 'g', default: 200 }
  ],
  sweep: { key: 'm1', values: [210, 220, 230, 240, 250] },
  minReadings: 5,
  compute(p, noise) {
    const diff = p.m1 - p.m2;
    if (diff <= 0) {
      return {
        row: { massDiff: diff, timeT: 0, accelMps2: 0, theoryA: 0 },
        live: [{ en: 'Acceleration', bn: 'ত্বরণ', value: 0, unit: 'm/s²', digits: 3, tone: 'warn' }],
        view: { m1: p.m1, m2: p.m2, a: 0, t: 0 },
        status: { en: 'm₁ must be heavier than m₂ for m₁ to fall.', bn: 'm₁ পড়ার জন্য m₁ কে m₂ এর চেয়ে ভারী হতে হবে।', tone: 'warn' },
        ready: false
      };
    }
    const ideal = (diff / (p.m1 + p.m2)) * G;
    const a = (diff / (p.m1 + p.m2 + PULLEY_EQUIV_G)) * G;
    const t = Math.sqrt((2 * ATWOOD_H) / a);
    const tm = t + noise(0.015);
    return {
      row: { massDiff: diff, timeT: round(tm, 2), accelMps2: round((2 * ATWOOD_H) / (tm * tm), 3), theoryA: round(ideal, 3) },
      live: [
        { en: 'Acceleration a', bn: 'ত্বরণ a', value: a, unit: 'm/s²', digits: 3 },
        { en: 'Fall time (1 m)', bn: 'পতনের সময় (১ মি)', value: t, unit: 's', digits: 2 },
        { en: 'Tension', bn: 'টান', value: (p.m2 / 1000) * (G + a), unit: 'N', digits: 3 }
      ],
      view: { m1: p.m1, m2: p.m2, a, t },
      ready: true
    };
  },
  result: {
    en: 'g = a(m₁+m₂)/(m₁−m₂)',
    bn: 'g = a(m₁+m₂)/(m₁−m₂)',
    unit: 'm/s²',
    digits: 3,
    compute(rows) {
      const gs: number[] = [];
      for (const r of rows) {
        const a = Number(r.accelMps2);
        const at = Number(r.theoryA);
        if (a > 0 && at > 0) gs.push((a / at) * G);
      }
      return gs.length ? gs.reduce((s, v) => s + v, 0) / gs.length : null;
    },
    expected: G
  }
};

/* ------------------------------------------------------------------ */
/* Flywheel moment of inertia                                           */
/* ------------------------------------------------------------------ */

const FLY_I = 0.0016;

export const flywheel: PracticalModel = {
  slug: 'flywheel-moment-inertia',
  scene: 'flywheel',
  animated: true,
  howTo_en: 'Wind the cord on the axle, release the mass from height h and time its fall. I = m r²(g t²/2h − 1).',
  howTo_bn: 'অক্ষে সুতা পেঁচিয়ে h উচ্চতা থেকে ভর ছাড়ো এবং পতনের সময় মাপো। I = m r²(g t²/2h − 1)।',
  controls: [
    { key: 'm', en: 'Hanging mass m', bn: 'ঝোলানো ভর m', min: 0.05, max: 0.3, step: 0.05, unit: 'kg', default: 0.1, digits: 2 },
    { key: 'h', en: 'Drop height h', bn: 'পতনের উচ্চতা h', min: 0.4, max: 1.0, step: 0.1, unit: 'm', default: 0.8, digits: 1 },
    {
      key: 'r',
      en: 'Axle radius r',
      bn: 'অক্ষের ব্যাসার্ধ r',
      default: 0.02,
      options: [
        { value: 0.015, en: '1.5 cm', bn: '১.৫ সেমি' },
        { value: 0.02, en: '2.0 cm', bn: '২.০ সেমি' },
        { value: 0.025, en: '2.5 cm', bn: '২.৫ সেমি' }
      ]
    }
  ],
  sweep: { key: 'm', values: [0.05, 0.1, 0.15, 0.2, 0.25] },
  minReadings: 5,
  compute(p, noise) {
    const a = (p.m * G * p.r * p.r) / (FLY_I + p.m * p.r * p.r);
    const t = Math.sqrt((2 * p.h) / a);
    const tm = t + noise(0.02);
    const am = (2 * p.h) / (tm * tm);
    return {
      row: {
        massKg: round(p.m, 3),
        axleRadiusM: p.r,
        heightM: round(p.h, 2),
        timeS: round(tm, 2),
        acceleration: round(am, 4),
        inertia: sig(p.m * p.r * p.r * (G / am - 1), 4)
      },
      live: [
        { en: 'Acceleration a', bn: 'ত্বরণ a', value: a, unit: 'm/s²', digits: 4 },
        { en: 'Fall time t', bn: 'পতনের সময় t', value: t, unit: 's', digits: 2 },
        { en: 'Angular accel.', bn: 'কৌণিক ত্বরণ', value: a / p.r, unit: 'rad/s²', digits: 2 }
      ],
      view: { m: p.m, h: p.h, r: p.r, a, t },
      ready: true
    };
  },
  result: {
    en: 'Moment of inertia I',
    bn: 'জড়তার ভ্রামক I',
    unit: 'kg·m²',
    digits: 5,
    compute: (rows) => meanOf(rows, 'inertia'),
    expected: FLY_I
  }
};

/* ------------------------------------------------------------------ */
/* Compound (bar) pendulum                                              */
/* ------------------------------------------------------------------ */

const BAR_L = 1.0;
const BAR_K2 = (BAR_L * BAR_L) / 12;

export const compoundPendulum: PracticalModel = {
  slug: 'compound-pendulum-gravity',
  scene: 'pendulum',
  variant: 'compound',
  animated: true,
  howTo_en: 'Hang the bar from holes at different distances d from its centre of gravity. Time 20 oscillations for each and record.',
  howTo_bn: 'দণ্ডটিকে ভারকেন্দ্র থেকে ভিন্ন দূরত্ব d এর ছিদ্রে ঝোলাও। প্রতিবার ২০ দোলনের সময় মেপে রেকর্ড করো।',
  controls: [{ key: 'd', en: 'Pivot distance d from CG', bn: 'ভারকেন্দ্র থেকে ঝুলন বিন্দুর দূরত্ব d', min: 0.05, max: 0.45, step: 0.05, unit: 'm', default: 0.1, digits: 2 }],
  sweep: { key: 'd', values: [0.1, 0.15, 0.2, 0.3, 0.4] },
  minReadings: 5,
  compute(p, noise) {
    const T = 2 * Math.PI * Math.sqrt((BAR_K2 + p.d * p.d) / (G * p.d));
    const t20 = 20 * T + noise(0.06);
    const Tm = t20 / 20;
    return {
      row: {
        pivotDistanceM: round(p.d, 3),
        oscillations: 20,
        timeS: round(t20, 2),
        periodS: round(Tm, 3),
        gCalc: round((FOUR_PI2 * (BAR_K2 + p.d * p.d)) / (p.d * Tm * Tm), 3)
      },
      live: [
        { en: 'Period T', bn: 'দোলনকাল T', value: T, unit: 's', digits: 3 },
        { en: 'Equivalent length', bn: 'সমতুল্য দৈর্ঘ্য', value: (BAR_K2 + p.d * p.d) / p.d, unit: 'm', digits: 3 },
        { en: 'Radius of gyration k', bn: 'চক্রগতির ব্যাসার্ধ k', value: Math.sqrt(BAR_K2), unit: 'm', digits: 3, tone: 'info' }
      ],
      view: { d: p.d, T, barL: BAR_L },
      ready: true
    };
  },
  result: {
    en: 'Acceleration due to gravity g',
    bn: 'অভিকর্ষজ ত্বরণ g',
    unit: 'm/s²',
    digits: 3,
    compute: (rows) => meanOf(rows, 'gCalc'),
    expected: G
  }
};

/* ------------------------------------------------------------------ */
/* Kater's reversible pendulum                                          */
/* ------------------------------------------------------------------ */

const KATER = { edgeA: 0.1, edgeB: 1.094, rodM: 1.0, rodL: 1.2, bobM: 2.0, bobY: 1.17, movM: 0.4 };
export const KATER_L = KATER.edgeB - KATER.edgeA;

export function katerPeriods(posM: number) {
  const parts = [
    { m: KATER.rodM, y: KATER.rodL / 2, icm: (KATER.rodM * KATER.rodL * KATER.rodL) / 12 },
    { m: KATER.bobM, y: KATER.bobY, icm: 0.0008 },
    { m: KATER.movM, y: posM, icm: 0.0003 }
  ];
  const M = parts.reduce((s, x) => s + x.m, 0);
  const yc = parts.reduce((s, x) => s + x.m * x.y, 0) / M;
  const period = (edge: number) => {
    const I = parts.reduce((s, x) => s + x.icm + x.m * (x.y - edge) * (x.y - edge), 0);
    return 2 * Math.PI * Math.sqrt(I / (M * G * Math.abs(yc - edge)));
  };
  return { TA: period(KATER.edgeA), TB: period(KATER.edgeB), cg: yc };
}

/** Position (m) of the movable mass where TA = TB (the useful, non-symmetric crossing). */
export function katerCrossing() {
  let lo = 0.9;
  let hi = 1.06;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const { TA, TB } = katerPeriods(mid);
    if (TA - TB > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const katersPendulum: PracticalModel = {
  slug: 'katers-pendulum-gravity',
  scene: 'pendulum',
  variant: 'kater',
  animated: true,
  howTo_en: 'Slide the movable mass until the periods about knife-edges A and B become equal (TA ≈ TB). Then g = 4π²l/T². Take readings near the crossing.',
  howTo_bn: 'চলমান ভরটি সরাও যতক্ষণ না ছুরি-ধার A ও B এর সাপেক্ষে দোলনকাল সমান হয় (TA ≈ TB)। তখন g = 4π²l/T²। সমান বিন্দুর কাছে কয়েকটি পাঠ নাও।',
  controls: [
    { key: 'pos', en: 'Movable mass position', bn: 'চলমান ভরের অবস্থান', min: 60, max: 106, step: 0.2, unit: 'cm', default: 85, fine: true, digits: 1 },
    {
      key: 'edge',
      en: 'Suspended from',
      bn: 'ঝোলানো হয়েছে',
      default: 0,
      options: [
        { value: 0, en: 'Knife-edge A', bn: 'ছুরি-ধার A' },
        { value: 1, en: 'Knife-edge B (inverted)', bn: 'ছুরি-ধার B (উল্টো)' }
      ]
    }
  ],
  minReadings: 3,
  compute(p, noise) {
    const { TA, TB } = katerPeriods(p.pos / 100);
    const tA = 20 * TA + noise(0.02);
    const tB = 20 * TB + noise(0.02);
    const Tm = (tA + tB) / 40;
    const diff = Math.abs(TA - TB);
    const close = diff < 0.0015;
    return {
      row: {
        lengthM: round(KATER_L, 3),
        timeA: round(tA, 2),
        timeB: round(tB, 2),
        periodS: round(Tm, 4),
        gCalc: round((FOUR_PI2 * KATER_L) / (Tm * Tm), 3)
      },
      live: [
        { en: 'TA (edge A)', bn: 'TA (ধার A)', value: TA, unit: 's', digits: 4 },
        { en: 'TB (edge B)', bn: 'TB (ধার B)', value: TB, unit: 's', digits: 4 },
        { en: '|TA − TB|', bn: '|TA − TB|', value: diff * 1000, unit: 'ms', digits: 1, tone: close ? 'good' : 'warn' }
      ],
      view: { pos: p.pos, edge: p.edge, TA, TB, T: p.edge === 0 ? TA : TB },
      status: close
        ? { en: 'TA ≈ TB — the edge distance l equals the equivalent length. Record!', bn: 'TA ≈ TB — ধার-দূরত্ব l এখন সমতুল্য দৈর্ঘ্য। রেকর্ড করো!', tone: 'good' }
        : {
            en: TA > TB ? 'TA > TB — move the mass further down (towards B).' : 'TB > TA — move the mass up (towards A).',
            bn: TA > TB ? 'TA > TB — ভর আরও নিচে (B এর দিকে) সরাও।' : 'TB > TA — ভর উপরে (A এর দিকে) সরাও।',
            tone: 'warn'
          },
      ready: close
    };
  },
  solve: (p) => ({ ...p, pos: round(katerCrossing() * 100, 1) }),
  result: {
    en: 'Acceleration due to gravity g',
    bn: 'অভিকর্ষজ ত্বরণ g',
    unit: 'm/s²',
    digits: 3,
    compute: (rows) => meanOf(rows, 'gCalc'),
    expected: G
  }
};

/* ------------------------------------------------------------------ */
/* Torsion: static & dynamic rigidity modulus                           */
/* ------------------------------------------------------------------ */

const ETA = 8e10;
const STATIC = { L: 0.5, r: 2.5e-3, arm: 0.1 };

export const rigidityStatic: PracticalModel = {
  slug: 'rigidity-modulus-static',
  scene: 'torsion',
  variant: 'static',
  howTo_en: 'Add load to the pans to apply a torque on the rod. Read the angle of twist on the circular scale and record for each load.',
  howTo_bn: 'প্যানে ভার যোগ করে দণ্ডে টর্ক দাও। বৃত্তাকার স্কেলে মোচড় কোণ পড়ে প্রতি ভারের জন্য রেকর্ড করো।',
  controls: [{ key: 'm', en: 'Load on pan', bn: 'প্যানে ভার', min: 0.1, max: 1.0, step: 0.1, unit: 'kg', default: 0.2, digits: 1 }],
  sweep: { key: 'm', values: [0.2, 0.4, 0.6, 0.8, 1.0] },
  minReadings: 5,
  compute(p, noise) {
    const torque = p.m * G * STATIC.arm;
    const phi = (2 * torque * STATIC.L) / (Math.PI * ETA * Math.pow(STATIC.r, 4));
    const phim = phi + noise(0.0004);
    return {
      row: {
        loadKg: round(p.m, 2),
        torqueNm: round(torque, 4),
        twistRad: round(phim, 4),
        rigidityPa: sig((2 * torque * STATIC.L) / (Math.PI * Math.pow(STATIC.r, 4) * phim), 4)
      },
      live: [
        { en: 'Torque τ', bn: 'টর্ক τ', value: torque, unit: 'N·m', digits: 3 },
        { en: 'Twist φ', bn: 'মোচড় φ', value: phi / DEG, unit: '°', digits: 2 },
        { en: 'Twist φ', bn: 'মোচড় φ', value: phi, unit: 'rad', digits: 4 }
      ],
      view: { m: p.m, phi },
      ready: true
    };
  },
  result: {
    en: 'Modulus of rigidity η',
    bn: 'দৃঢ়তা গুণাঙ্ক η',
    unit: 'Pa',
    scientific: true,
    compute(rows) {
      const s = slopeThroughOrigin(rows, 'twistRad', 'torqueNm');
      return s === null ? null : (2 * s * STATIC.L) / (Math.PI * Math.pow(STATIC.r, 4));
    },
    expected: ETA
  }
};

const DYN_I = 6.45e-4;

export const rigidityDynamic: PracticalModel = {
  slug: 'rigidity-modulus-dynamic',
  scene: 'torsion',
  variant: 'dynamic',
  animated: true,
  howTo_en: 'Twist the disc slightly and release. Time 20 torsional oscillations for different wire lengths and record. η = 8πIL/(T²r⁴).',
  howTo_bn: 'চাকতি সামান্য মোচড় দিয়ে ছাড়ো। ভিন্ন তারের দৈর্ঘ্যে ২০টি ব্যাবর্ত দোলনের সময় মেপে রেকর্ড করো। η = 8πIL/(T²r⁴)।',
  controls: [
    { key: 'L', en: 'Wire length L', bn: 'তারের দৈর্ঘ্য L', min: 0.3, max: 1.2, step: 0.1, unit: 'm', default: 0.6, digits: 1 },
    {
      key: 'r',
      en: 'Wire radius r',
      bn: 'তারের ব্যাসার্ধ r',
      default: 0.5,
      options: [
        { value: 0.4, en: '0.40 mm', bn: '০.৪০ মিমি' },
        { value: 0.5, en: '0.50 mm', bn: '০.৫০ মিমি' },
        { value: 0.6, en: '0.60 mm', bn: '০.৬০ মিমি' }
      ]
    }
  ],
  sweep: { key: 'L', values: [0.4, 0.6, 0.8, 1.0, 1.2] },
  minReadings: 5,
  compute(p, noise) {
    const r = p.r / 1000;
    const C = (Math.PI * ETA * Math.pow(r, 4)) / (2 * p.L);
    const T = 2 * Math.PI * Math.sqrt(DYN_I / C);
    const t20 = 20 * T + noise(0.08);
    const Tm = t20 / 20;
    return {
      row: {
        wireLengthM: round(p.L, 2),
        radiusM: r,
        oscillations: 20,
        timeS: round(t20, 2),
        periodS: round(Tm, 3),
        rigidityPa: sig((8 * Math.PI * DYN_I * p.L) / (Tm * Tm * Math.pow(r, 4)), 4)
      },
      live: [
        { en: 'Period T', bn: 'দোলনকাল T', value: T, unit: 's', digits: 3 },
        { en: 'Torsion constant C', bn: 'ব্যাবর্ত ধ্রুবক C', value: C * 1000, unit: 'mN·m/rad', digits: 3 },
        { en: 'Disc inertia I', bn: 'চাকতির জড়তা I', value: DYN_I * 1e4, unit: '×10⁻⁴ kg·m²', digits: 2, tone: 'info' }
      ],
      view: { L: p.L, r: p.r, T },
      ready: true
    };
  },
  result: {
    en: 'Modulus of rigidity η',
    bn: 'দৃঢ়তা গুণাঙ্ক η',
    unit: 'Pa',
    scientific: true,
    compute: (rows) => meanOf(rows, 'rigidityPa'),
    expected: ETA
  }
};

/* ------------------------------------------------------------------ */
/* Searle's Young's modulus                                             */
/* ------------------------------------------------------------------ */

const SEARLE = { L: 1.0, r: 0.5e-3, Y: 2e11 };

export const searleYoung: PracticalModel = {
  slug: 'searles-young-modulus',
  scene: 'searle',
  howTo_en: 'Add load to the experimental wire, re-level the spirit level with the micrometer and read the extension. Record for each load.',
  howTo_bn: 'পরীক্ষণীয় তারে ভার যোগ করো, মাইক্রোমিটার ঘুরিয়ে স্পিরিট লেভেল সমতল করো এবং প্রসারণ পড়ো। প্রতি ভারের জন্য রেকর্ড করো।',
  controls: [{ key: 'm', en: 'Load', bn: 'ভার', min: 0.5, max: 5, step: 0.5, unit: 'kg', default: 1, digits: 1 }],
  sweep: { key: 'm', values: [1, 2, 3, 4, 5] },
  minReadings: 5,
  compute(p, noise) {
    const F = p.m * G;
    const A = Math.PI * SEARLE.r * SEARLE.r;
    const e = (F * SEARLE.L) / (A * SEARLE.Y);
    const em = e + noise(1e-6);
    return {
      row: {
        loadKg: round(p.m, 2),
        forceN: round(F, 3),
        extensionM: sig(em, 4),
        youngPa: sig((F * SEARLE.L) / (A * em), 4)
      },
      live: [
        { en: 'Load F', bn: 'বল F', value: F, unit: 'N', digits: 2 },
        { en: 'Extension e', bn: 'প্রসারণ e', value: e * 1000, unit: 'mm', digits: 3 },
        { en: 'Stress', bn: 'পীড়ন', value: F / A / 1e6, unit: 'MPa', digits: 1, tone: 'info' }
      ],
      view: { m: p.m, e },
      ready: true
    };
  },
  result: {
    en: "Young's modulus Y",
    bn: 'ইয়ং গুণাঙ্ক Y',
    unit: 'Pa',
    scientific: true,
    compute(rows) {
      const s = slopeThroughOrigin(rows, 'extensionM', 'forceN');
      return s === null ? null : (s * SEARLE.L) / (Math.PI * SEARLE.r * SEARLE.r);
    },
    expected: SEARLE.Y
  }
};

export const mechanicsModels: PracticalModel[] = [
  simplePendulum,
  springConstant,
  inclinedPlane,
  projectile,
  newtonSecond,
  atwood,
  flywheel,
  compoundPendulum,
  katersPendulum,
  rigidityStatic,
  rigidityDynamic,
  searleYoung
];
