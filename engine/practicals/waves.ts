import type { PracticalModel } from './types';
import { G, lorentz, meanOf, round, sig } from './helpers';
import { waterDensity } from './heat';

/* ------------------------------------------------------------------ */
/* Resonance tube — speed of sound                                      */
/* ------------------------------------------------------------------ */

export const soundSpeed = (T: number) => 331.3 * Math.sqrt(1 + T / 273.15);
const TUBE_D = 4; // cm
const END_CORR = 0.3 * TUBE_D;
const FORKS = [256, 288, 320, 384, 426.7, 480, 512];

export function resonanceLengths(f: number, T: number) {
  const lambda = (soundSpeed(T) / f) * 100; // cm
  return { lambda, l1: lambda / 4 - END_CORR, l2: (3 * lambda) / 4 - END_CORR };
}

function loudness(L: number, lambda: number) {
  let best = 0;
  for (let n = 1; n <= 4; n++) best = Math.max(best, lorentz(L + END_CORR - ((2 * n - 1) * lambda) / 4, 0.7));
  return best;
}

export const resonanceTube: PracticalModel = {
  slug: 'speed-of-sound-resonance-tube',
  scene: 'resonanceTube',
  howTo_en: 'Strike the fork and lower the water level until the sound is loudest — that is l₁. Find the second resonance l₂ the same way, record, then change the fork.',
  howTo_bn: 'সুরশলাকা বাজিয়ে পানির তল নামাও যতক্ষণ না শব্দ সবচেয়ে জোরালো হয় — সেটি l₁। একইভাবে দ্বিতীয় অনুনাদ l₂ খুঁজে রেকর্ড করো, তারপর সুরশলাকা বদলাও।',
  controls: [
    { key: 'f', en: 'Tuning fork', bn: 'সুরশলাকা', default: 512, options: FORKS.map((f) => ({ value: f, en: `${f} Hz`, bn: `${f} Hz` })) },
    { key: 'T', en: 'Room temperature', bn: 'কক্ষ তাপমাত্রা', min: 15, max: 35, step: 1, unit: '°C', default: 22 },
    { key: 'L1', en: 'Air column 1 (l₁)', bn: 'বায়ুস্তম্ভ ১ (l₁)', min: 5, max: 60, step: 0.1, unit: 'cm', default: 10, fine: true, digits: 1 },
    { key: 'L2', en: 'Air column 2 (l₂)', bn: 'বায়ুস্তম্ভ ২ (l₂)', min: 20, max: 110, step: 0.1, unit: 'cm', default: 40, fine: true, digits: 1 }
  ],
  sweep: { key: 'f', values: [256, 320, 384, 480, 512] },
  minReadings: 5,
  compute(p, noise) {
    const { lambda, l1, l2 } = resonanceLengths(p.f, p.T);
    const a1 = loudness(p.L1, lambda);
    const a2 = loudness(p.L2, lambda);
    const b1 = Math.abs(p.L1 - l1) <= 0.35;
    const b2 = Math.abs(p.L2 - l2) <= 0.35;
    const l1m = p.L1 + noise(0.15);
    const l2m = p.L2 + noise(0.15);
    return {
      row: {
        forkFreqHz: p.f,
        resLengthL1: round(l1m, 1),
        resLengthL2: round(l2m, 1),
        diffL2minusL1: round(l2m - l1m, 1),
        soundSpeedMps: round((2 * p.f * (l2m - l1m)) / 100, 1)
      },
      live: [
        { en: 'Loudness at l₁', bn: 'l₁ এ শব্দের তীব্রতা', value: Math.round(a1 * 100), unit: '%', tone: b1 ? 'good' : 'warn' },
        { en: 'Loudness at l₂', bn: 'l₂ এ শব্দের তীব্রতা', value: Math.round(a2 * 100), unit: '%', tone: b2 ? 'good' : 'warn' },
        { en: 'End correction', bn: 'প্রান্ত সংশোধন', value: END_CORR, unit: 'cm', digits: 1, tone: 'info' }
      ],
      view: { f: p.f, L1: p.L1, L2: p.L2, a1, a2, b1: b1 ? 1 : 0, b2: b2 ? 1 : 0, lambda },
      status:
        b1 && b2
          ? { en: 'Both resonances found — record l₁ and l₂.', bn: 'দুটি অনুনাদই পাওয়া গেছে — l₁ ও l₂ রেকর্ড করো।', tone: 'good' }
          : {
              en: !b1 ? 'Adjust air column 1 until the sound is loudest (first resonance).' : 'Now find the second (louder-again) position for air column 2.',
              bn: !b1 ? 'বায়ুস্তম্ভ ১ সমন্বয় করো যতক্ষণ না শব্দ সবচেয়ে জোরালো হয় (প্রথম অনুনাদ)।' : 'এবার বায়ুস্তম্ভ ২ এর দ্বিতীয় অনুনাদ অবস্থান খুঁজে বের করো।',
              tone: 'warn'
            },
      ready: b1 && b2
    };
  },
  solve: (p) => {
    const { l1, l2 } = resonanceLengths(p.f, p.T);
    return { ...p, L1: round(l1, 1), L2: round(l2, 1) };
  },
  result: {
    en: 'Speed of sound v',
    bn: 'শব্দের বেগ v',
    unit: 'm/s',
    digits: 1,
    compute: (rows) => meanOf(rows, 'soundSpeedMps'),
    expected: (p) => soundSpeed(p.T)
  }
};

/* ------------------------------------------------------------------ */
/* Sonometer                                                            */
/* ------------------------------------------------------------------ */

const SONO = { T: 5 * G, mu: 0.00154 };
export const SONO_C = 0.5 * Math.sqrt(SONO.T / SONO.mu);

export const sonometer: PracticalModel = {
  slug: 'sonometer-laws',
  scene: 'string',
  variant: 'sonometer',
  animated: true,
  howTo_en: 'Place the vibrating fork on the box and slide the bridge until the paper rider flies off (resonance). Record the length and repeat for each fork.',
  howTo_bn: 'কম্পমান সুরশলাকা বাক্সে রাখো এবং ব্রিজ সরাও যতক্ষণ না কাগজের রাইডার পড়ে যায় (অনুনাদ)। দৈর্ঘ্য রেকর্ড করে প্রতিটি সুরশলাকার জন্য আবার করো।',
  controls: [
    { key: 'f', en: 'Tuning fork', bn: 'সুরশলাকা', default: 256, options: FORKS.map((f) => ({ value: f, en: `${f} Hz`, bn: `${f} Hz` })) },
    { key: 'L', en: 'Bridge distance L', bn: 'ব্রিজের দূরত্ব L', min: 0.1, max: 0.9, step: 0.001, unit: 'm', default: 0.5, fine: true, digits: 3 }
  ],
  sweep: { key: 'f', values: [256, 288, 320, 384, 512] },
  minReadings: 5,
  compute(p, noise) {
    const fs = SONO_C / p.L;
    const amp = lorentz((fs - p.f) / p.f, 0.004);
    const resonant = Math.abs(p.L - SONO_C / p.f) <= 0.0015;
    const Lm = p.L + noise(0.0008);
    return {
      row: { forkFreqHz: p.f, resLengthL: round(Lm, 3), productFL: round(p.f * Lm, 1) },
      live: [
        { en: 'String frequency', bn: 'তারের কম্পাঙ্ক', value: fs, unit: 'Hz', digits: 1 },
        { en: 'Fork frequency', bn: 'সুরশলাকার কম্পাঙ্ক', value: p.f, unit: 'Hz', digits: 1 },
        { en: 'Rider', bn: 'রাইডার', value: resonant ? 'Thrown off!' : 'On the wire', tone: resonant ? 'good' : 'info' }
      ],
      view: { L: p.L, f: p.f, fs, amp, resonant: resonant ? 1 : 0 },
      status: resonant
        ? { en: 'Resonance — the rider flies off. Record L.', bn: 'অনুনাদ — রাইডার পড়ে গেছে। L রেকর্ড করো।', tone: 'good' }
        : {
            en: fs > p.f ? 'String pitch too high — increase L.' : 'String pitch too low — decrease L.',
            bn: fs > p.f ? 'তারের কম্পাঙ্ক বেশি — L বাড়াও।' : 'তারের কম্পাঙ্ক কম — L কমাও।',
            tone: 'warn'
          },
      ready: resonant
    };
  },
  solve: (p) => ({ ...p, L: round(SONO_C / p.f, 3) }),
  result: {
    en: 'f × L (constant)',
    bn: 'f × L (ধ্রুবক)',
    unit: 'Hz·m',
    digits: 1,
    compute: (rows) => meanOf(rows, 'productFL'),
    expected: SONO_C
  }
};

/* ------------------------------------------------------------------ */
/* Melde's experiment                                                    */
/* ------------------------------------------------------------------ */

const MELDE = { f: 256, mu: 0.0015 };

export function meldeLoops(massKg: number, L: number) {
  const v = Math.sqrt((massKg * G) / MELDE.mu);
  return (2 * L * MELDE.f) / v;
}

export const melde: PracticalModel = {
  slug: 'meldes-frequency',
  scene: 'string',
  variant: 'melde',
  animated: true,
  howTo_en: 'Adjust the tension (pan mass) or the thread length until clear, steady loops form. Count the loops p and record. f = (p/2L)√(T/μ).',
  howTo_bn: 'টান (প্যানের ভর) বা সুতার দৈর্ঘ্য সমন্বয় করো যতক্ষণ না স্পষ্ট ও স্থির লুপ তৈরি হয়। লুপ সংখ্যা p গুনে রেকর্ড করো। f = (p/2L)√(T/μ)।',
  controls: [
    { key: 'm', en: 'Pan mass (tension)', bn: 'প্যানের ভর (টান)', min: 0.05, max: 1.0, step: 0.005, unit: 'kg', default: 0.3, fine: true, digits: 3 },
    { key: 'L', en: 'Thread length L', bn: 'সুতার দৈর্ঘ্য L', min: 0.3, max: 1.5, step: 0.01, unit: 'm', default: 0.5, digits: 2 }
  ],
  minReadings: 4,
  compute(p, noise) {
    const pr = meldeLoops(p.m, p.L);
    const loops = Math.max(1, Math.round(pr));
    const amp = lorentz(pr - loops, 0.05);
    const resonant = Math.abs(pr - loops) <= 0.06;
    const T = p.m * G;
    const Tm = T * (1 + noise(0.002));
    return {
      row: {
        tensionN: round(Tm, 3),
        lengthM: round(p.L, 3),
        loops,
        linearDensity: MELDE.mu,
        frequencyHz: round((loops / (2 * p.L)) * Math.sqrt(Tm / MELDE.mu), 1)
      },
      live: [
        { en: 'Tension T', bn: 'টান T', value: T, unit: 'N', digits: 3 },
        { en: 'Loops', bn: 'লুপ', value: resonant ? loops : '—', tone: resonant ? 'good' : 'warn' },
        { en: 'Wave speed', bn: 'তরঙ্গ বেগ', value: Math.sqrt(T / MELDE.mu), unit: 'm/s', digits: 1 }
      ],
      view: { m: p.m, L: p.L, loops, amp, resonant: resonant ? 1 : 0, pr },
      status: resonant
        ? { en: `Steady ${loops} loops — record.`, bn: `স্থির ${loops}টি লুপ — রেকর্ড করো।`, tone: 'good' }
        : { en: 'Loops are unsteady — fine-adjust the pan mass.', bn: 'লুপ অস্থির — প্যানের ভর সূক্ষ্মভাবে সমন্বয় করো।', tone: 'warn' },
      ready: resonant
    };
  },
  solve: (p, ctx) => {
    // T = (2 L f / p)² μ — pick the next loop count whose pan mass is within range.
    const massFor = (loops: number) => (Math.pow((2 * p.L * MELDE.f) / loops, 2) * MELDE.mu) / G;
    const options = [3, 4, 5, 6, 7, 8, 2].filter((n) => massFor(n) >= 0.05 && massFor(n) <= 1);
    const loops = options.length ? options[ctx.rows.length % options.length] : Math.max(1, Math.round(meldeLoops(p.m, p.L)));
    return { ...p, m: round(massFor(loops), 3) };
  },
  result: {
    en: 'Fork frequency f',
    bn: 'সুরশলাকার কম্পাঙ্ক f',
    unit: 'Hz',
    digits: 1,
    compute: (rows) => meanOf(rows, 'frequencyHz'),
    expected: MELDE.f
  }
};

/* ------------------------------------------------------------------ */
/* Surface tension — capillary rise (water) & depression (mercury)      */
/* ------------------------------------------------------------------ */

export const waterSurfaceTension = (T: number) => 0.07564 - 0.00014 * T;

export const capillaryWater: PracticalModel = {
  slug: 'surface-tension-water-capillary',
  scene: 'capillary',
  variant: 'water',
  howTo_en: 'Dip a clean capillary tube in water and read the rise h with the travelling microscope. Record for tubes of different radius. γ = rhρg/2.',
  howTo_bn: 'পরিষ্কার কৈশিক নল পানিতে ডুবিয়ে চলমান অণুবীক্ষণ দিয়ে উত্থান h পড়ো। ভিন্ন ব্যাসার্ধের নলের জন্য রেকর্ড করো। γ = rhρg/2।',
  controls: [
    {
      key: 'r',
      en: 'Tube radius',
      bn: 'নলের ব্যাসার্ধ',
      default: 0.25,
      options: [0.2, 0.25, 0.3, 0.4, 0.5].map((v) => ({ value: v, en: `${v.toFixed(2)} mm`, bn: `${v.toFixed(2)} মিমি` }))
    },
    { key: 'T', en: 'Water temperature', bn: 'পানির তাপমাত্রা', min: 10, max: 60, step: 1, unit: '°C', default: 25 }
  ],
  sweep: { key: 'r', values: [0.2, 0.25, 0.3, 0.4, 0.5] },
  minReadings: 5,
  compute(p, noise) {
    const r = p.r / 1000;
    const rho = waterDensity(p.T);
    const gamma = waterSurfaceTension(p.T);
    const h = (2 * gamma) / (r * rho * G);
    const hm = h + noise(0.00015);
    return {
      row: { radiusM: r, riseM: round(hm, 5), temperatureC: p.T, surfaceTension: round((r * hm * rho * G) / 2, 4) },
      live: [
        { en: 'Capillary rise h', bn: 'কৈশিক উত্থান h', value: h * 100, unit: 'cm', digits: 2 },
        { en: 'Water density', bn: 'পানির ঘনত্ব', value: rho, unit: 'kg/m³', digits: 1 },
        { en: 'Contact angle', bn: 'স্পর্শ কোণ', value: 0, unit: '°', tone: 'info' }
      ],
      view: { r: p.r, h, liquid: 'water', T: p.T },
      ready: true
    };
  },
  result: {
    en: 'Surface tension of water γ',
    bn: 'পানির পৃষ্ঠটান γ',
    unit: 'N/m',
    digits: 4,
    compute: (rows) => meanOf(rows, 'surfaceTension'),
    expected: (p) => waterSurfaceTension(p.T)
  }
};

const HG = { gamma: 0.485, theta: 140, rho: 13534 };

export const capillaryMercury: PracticalModel = {
  slug: 'surface-tension-mercury-quincke',
  scene: 'capillary',
  variant: 'mercury',
  howTo_en: 'Mercury is depressed in a glass capillary (contact angle ≈ 140°). Measure the depression for tubes of different radius and record. γ = rhρg / (2|cos θ|).',
  howTo_bn: 'কাচের কৈশিক নলে পারদ নিচে নামে (স্পর্শ কোণ ≈ ১৪০°)। ভিন্ন ব্যাসার্ধের নলে অবনমন মেপে রেকর্ড করো। γ = rhρg / (2|cos θ|)।',
  controls: [
    {
      key: 'r',
      en: 'Tube radius',
      bn: 'নলের ব্যাসার্ধ',
      default: 1,
      options: [0.5, 0.75, 1, 1.25, 1.5].map((v) => ({ value: v, en: `${v.toFixed(2)} mm`, bn: `${v.toFixed(2)} মিমি` }))
    }
  ],
  sweep: { key: 'r', values: [0.5, 0.75, 1, 1.25, 1.5] },
  minReadings: 5,
  compute(p, noise) {
    const r = p.r / 1000;
    const cos = Math.abs(Math.cos((HG.theta * Math.PI) / 180));
    const h = (2 * HG.gamma * cos) / (r * HG.rho * G);
    const hm = h + noise(0.00004);
    return {
      row: { radiusM: r, depressionM: sig(hm, 4), contactAngleDeg: HG.theta, surfaceTension: round((r * hm * HG.rho * G) / (2 * cos), 4) },
      live: [
        { en: 'Depression h', bn: 'অবনমন h', value: h * 1000, unit: 'mm', digits: 2 },
        { en: 'Contact angle θ', bn: 'স্পর্শ কোণ θ', value: HG.theta, unit: '°' },
        { en: 'Mercury density', bn: 'পারদের ঘনত্ব', value: HG.rho, unit: 'kg/m³', tone: 'info' }
      ],
      view: { r: p.r, h, liquid: 'mercury' },
      ready: true
    };
  },
  result: {
    en: 'Surface tension of mercury γ',
    bn: 'পারদের পৃষ্ঠটান γ',
    unit: 'N/m',
    digits: 3,
    compute: (rows) => meanOf(rows, 'surfaceTension'),
    expected: HG.gamma
  }
};

export const wavesModels: PracticalModel[] = [resonanceTube, sonometer, melde, capillaryWater, capillaryMercury];
