import type { PracticalModel } from './types';
import { DEG, meanOf, num, round } from './helpers';

/* ------------------------------------------------------------------ */
/* Vernier caliper                                                      */
/* ------------------------------------------------------------------ */

export const VERNIER_OBJECTS = [
  { en: 'Cylinder length', bn: 'সিলিন্ডারের দৈর্ঘ্য', size: 24.6 },
  { en: 'Cylinder diameter', bn: 'সিলিন্ডারের ব্যাস', size: 18.3 },
  { en: 'Sphere diameter', bn: 'গোলকের ব্যাস', size: 15.4 },
  { en: 'Block width', bn: 'ব্লকের প্রস্থ', size: 31.7 }
];
const VERNIER_LC = 0.1;

/** Small position-to-position variation so repeated readings are realistic. */
const sizeAt = (base: number, trial: number, amp: number) => base + (trial % 3 === 1 ? amp : trial % 3 === 2 ? -amp : 0);

export const vernier: PracticalModel = {
  slug: 'vernier-caliper-measurement',
  scene: 'vernier',
  howTo_en: 'Drag the sliding jaw until it just touches the object, read MSR and the coinciding vernier division, then record. Take readings at different places.',
  howTo_bn: 'চলমান চোয়াল টেনে বস্তুকে ঠিক স্পর্শ করাও, প্রধান স্কেল পাঠ (MSR) ও মিলে যাওয়া ভার্নিয়ার ঘর পড়ে রেকর্ড করো। ভিন্ন জায়গায় পাঠ নাও।',
  controls: [
    { key: 'obj', en: 'Object / dimension', bn: 'বস্তু / মাপ', default: 0, options: VERNIER_OBJECTS.map((o, i) => ({ value: i, en: o.en, bn: o.bn })) },
    {
      key: 'zero',
      en: 'Zero error',
      bn: 'শূন্য ত্রুটি',
      default: 0,
      options: [
        { value: 0, en: 'None', bn: 'নেই' },
        { value: 0.2, en: '+0.2 mm', bn: '+0.2 মিমি' },
        { value: -0.1, en: '−0.1 mm', bn: '−0.1 মিমি' }
      ]
    },
    { key: 'jaw', en: 'Jaw opening', bn: 'চোয়ালের ফাঁক', min: 0, max: 45, step: 0.05, unit: 'mm', default: 40, fine: true, digits: 2 }
  ],
  minReadings: 3,
  compute(p, _noise, ctx) {
    const obj = VERNIER_OBJECTS[p.obj] || VERNIER_OBJECTS[0];
    const trial = ctx.rows.length + 1;
    const size = round(sizeAt(obj.size, trial, 0.1), 2);
    const gap = Math.max(p.jaw, size);
    const touching = gap - size < 0.06;
    const scaleReading = gap + p.zero;
    const tenths = Math.round(scaleReading / VERNIER_LC);
    const msr = Math.floor(tenths / 10);
    const vsr = tenths - msr * 10;
    const total = msr + vsr * VERNIER_LC - p.zero;
    return {
      row: { dimension: obj.en, msrMm: msr, vsrDiv: vsr, totalMm: round(total, 2) },
      live: [
        { en: 'Main scale (MSR)', bn: 'প্রধান স্কেল (MSR)', value: msr, unit: 'mm', digits: 0 },
        { en: 'Vernier division', bn: 'ভার্নিয়ার ঘর', value: vsr, digits: 0 },
        { en: 'Least count', bn: 'লঘিষ্ঠ গণন', value: VERNIER_LC, unit: 'mm', digits: 2, tone: 'info' },
        { en: 'Corrected reading', bn: 'সংশোধিত পাঠ', value: total, unit: 'mm', digits: 2, tone: touching ? 'good' : 'warn' }
      ],
      view: { gap, size, zero: p.zero, msr, vsr, touching: touching ? 1 : 0, obj: p.obj },
      status: touching
        ? { en: 'Jaws touching the object — read the scales and record.', bn: 'চোয়াল বস্তু স্পর্শ করেছে — স্কেল পড়ে রেকর্ড করো।', tone: 'good' }
        : { en: 'Jaws not touching yet — close the sliding jaw on the object.', bn: 'চোয়াল এখনও স্পর্শ করেনি — চলমান চোয়াল বস্তুর উপর বন্ধ করো।', tone: 'warn' },
      ready: touching
    };
  },
  solve: (p, ctx) => {
    const obj = VERNIER_OBJECTS[p.obj] || VERNIER_OBJECTS[0];
    return { ...p, jaw: round(sizeAt(obj.size, ctx.rows.length + 1, 0.1), 2) };
  },
  result: {
    en: 'Mean measured length',
    bn: 'গড় পরিমাপিত দৈর্ঘ্য',
    unit: 'mm',
    digits: 2,
    compute: (rows) => meanOf(rows, 'totalMm'),
    expected: (p) => (VERNIER_OBJECTS[p.obj] || VERNIER_OBJECTS[0]).size
  }
};

/* ------------------------------------------------------------------ */
/* Screw gauge                                                          */
/* ------------------------------------------------------------------ */

const WIRE_D = 3.74;
const SG_LC = 0.01;

export const screwGauge: PracticalModel = {
  slug: 'screw-gauge-measurement',
  scene: 'screwGauge',
  howTo_en: 'Turn the thimble (use the ratchet) until the spindle just grips the wire. Read the pitch scale and circular scale, then record at different positions.',
  howTo_bn: 'থিম্বল ঘোরাও (র‍্যাচেট ব্যবহার করো) যতক্ষণ না স্পিন্ডল তারটি আলতো করে ধরে। রৈখিক ও বৃত্তাকার স্কেল পড়ে ভিন্ন জায়গায় রেকর্ড করো।',
  controls: [
    {
      key: 'zero',
      en: 'Zero error',
      bn: 'শূন্য ত্রুটি',
      default: 0,
      options: [
        { value: 0, en: 'None', bn: 'নেই' },
        { value: 0.03, en: '+0.03 mm', bn: '+0.03 মিমি' },
        { value: -0.02, en: '−0.02 mm', bn: '−0.02 মিমি' }
      ]
    },
    { key: 'gap', en: 'Spindle gap', bn: 'স্পিন্ডল ফাঁক', min: 0, max: 8, step: 0.01, unit: 'mm', default: 6, fine: true, digits: 2 }
  ],
  minReadings: 3,
  compute(p, _noise, ctx) {
    const trial = ctx.rows.length + 1;
    const d = round(sizeAt(WIRE_D, trial, 0.01), 3);
    const gap = Math.max(p.gap, d);
    const touching = gap - d < 0.015;
    const reading = gap + p.zero;
    const hundredths = Math.round(reading / SG_LC);
    const psr = Math.floor(hundredths / 100);
    const csr = hundredths - psr * 100;
    const total = psr + csr * SG_LC - p.zero;
    return {
      row: { position: `P${trial}`, psrMm: psr, csrDiv: csr, diameterMm: round(total, 3) },
      live: [
        { en: 'Pitch scale (PSR)', bn: 'রৈখিক স্কেল (PSR)', value: psr, unit: 'mm', digits: 0 },
        { en: 'Circular scale (CSR)', bn: 'বৃত্তাকার স্কেল (CSR)', value: csr, digits: 0 },
        { en: 'Least count', bn: 'লঘিষ্ঠ গণন', value: SG_LC, unit: 'mm', digits: 2, tone: 'info' },
        { en: 'Corrected diameter', bn: 'সংশোধিত ব্যাস', value: total, unit: 'mm', digits: 2, tone: touching ? 'good' : 'warn' }
      ],
      view: { gap, d, zero: p.zero, psr, csr, touching: touching ? 1 : 0 },
      status: touching
        ? { en: 'Ratchet clicks — wire gripped. Record the reading.', bn: 'র‍্যাচেট ক্লিক করছে — তার ধরা হয়েছে। পাঠ রেকর্ড করো।', tone: 'good' }
        : { en: 'Spindle not touching — turn the thimble to close the gap.', bn: 'স্পিন্ডল স্পর্শ করেনি — থিম্বল ঘুরিয়ে ফাঁক বন্ধ করো।', tone: 'warn' },
      ready: touching
    };
  },
  solve: (p, ctx) => ({ ...p, gap: round(sizeAt(WIRE_D, ctx.rows.length + 1, 0.01), 3) }),
  result: {
    en: 'Mean wire diameter',
    bn: 'তারের গড় ব্যাস',
    unit: 'mm',
    digits: 3,
    compute: (rows) => meanOf(rows, 'diameterMm'),
    expected: WIRE_D
  }
};

/* ------------------------------------------------------------------ */
/* Convex lens & concave mirror (optical bench)                          */
/* ------------------------------------------------------------------ */

function benchModel(kind: 'lens' | 'mirror', f: number): PracticalModel {
  const isLens = kind === 'lens';
  return {
    slug: isLens ? 'focal-length-convex-lens' : 'focal-length-concave-mirror',
    scene: 'opticalBench',
    variant: kind,
    howTo_en: isLens
      ? 'Place the object at distance u, then slide the screen until the image is sharpest. Record u and v and repeat for other u.'
      : 'Place the object pin at distance u in front of the mirror, then slide the screen until the image is sharpest. Record u and v.',
    howTo_bn: isLens
      ? 'বস্তুকে u দূরত্বে রাখো, তারপর পর্দা সরাও যতক্ষণ না প্রতিবিম্ব সবচেয়ে স্পষ্ট হয়। u ও v রেকর্ড করে অন্য u এর জন্য আবার করো।'
      : 'দর্পণের সামনে u দূরত্বে বস্তু রাখো, তারপর পর্দা সরাও যতক্ষণ না প্রতিবিম্ব সবচেয়ে স্পষ্ট হয়। u ও v রেকর্ড করো।',
    controls: [
      { key: 'u', en: 'Object distance u', bn: 'বস্তু দূরত্ব u', min: Math.round(f * 1.2), max: Math.round(f * 3.5), step: 1, unit: 'cm', default: 2 * f + 10 },
      { key: 'v', en: 'Screen distance v', bn: 'পর্দার দূরত্ব v', min: Math.round(f * 0.9), max: Math.round(f * 6.5), step: 0.5, unit: 'cm', default: Math.round(f * 1.4), fine: true, digits: 1 }
    ],
    sweep: { key: 'u', values: isLens ? [20, 25, 30, 40, 50] : [25, 30, 40, 50, 60] },
    minReadings: 5,
    compute(p, noise) {
      const vTrue = (p.u * f) / (p.u - f);
      const defocus = Math.abs(p.v - vTrue);
      const tolerance = Math.max(0.6, vTrue * 0.012);
      const sharp = defocus <= tolerance;
      const blur = Math.min(1, defocus / (vTrue * 0.25));
      const mag = vTrue / p.u;
      const vm = p.v + noise(0.15);
      const row: Record<string, number | string> = {
        uCm: p.u,
        vCm: round(vm, 1),
        fCalc: round((p.u * vm) / (p.u + vm), 2)
      };
      if (isLens) {
        row.invU = round(1 / p.u, 4);
        row.invV = round(1 / vm, 4);
      }
      return {
        row,
        live: [
          { en: 'Image sharpness', bn: 'প্রতিবিম্বের স্পষ্টতা', value: Math.round((1 - blur) * 100), unit: '%', tone: sharp ? 'good' : 'warn' },
          { en: 'Magnification', bn: 'বিবর্ধন', value: mag, unit: '×', digits: 2 },
          { en: 'Image', bn: 'প্রতিবিম্ব', value: 'Real, inverted', tone: 'info' }
        ],
        view: { u: p.u, v: p.v, vTrue, blur, f, mag, sharp: sharp ? 1 : 0 },
        status: sharp
          ? { en: 'Sharp image on the screen — record u and v.', bn: 'পর্দায় স্পষ্ট প্রতিবিম্ব — u ও v রেকর্ড করো।', tone: 'good' }
          : {
              en: p.v < vTrue ? 'Blurred — move the screen farther away.' : 'Blurred — move the screen closer.',
              bn: p.v < vTrue ? 'ঝাপসা — পর্দা আরও দূরে সরাও।' : 'ঝাপসা — পর্দা কাছে আনো।',
              tone: 'warn'
            },
        ready: sharp
      };
    },
    solve: (p) => ({ ...p, v: Math.round(((p.u * f) / (p.u - f)) * 2) / 2 }),
    result: {
      en: 'Focal length f',
      bn: 'ফোকাস দূরত্ব f',
      unit: 'cm',
      digits: 2,
      compute: (rows) => meanOf(rows, 'fCalc'),
      expected: f
    }
  };
}

export const convexLens = benchModel('lens', 15);
export const concaveMirror = benchModel('mirror', 20);

/* ------------------------------------------------------------------ */
/* Snell's law (glass slab)                                             */
/* ------------------------------------------------------------------ */

const MU_GLASS = 1.52;

export const snell: PracticalModel = {
  slug: 'snells-law-verification',
  scene: 'rays',
  variant: 'slab',
  howTo_en: 'Change the angle of incidence i, trace the refracted ray and measure r. Record for several angles — sin i / sin r stays constant.',
  howTo_bn: 'আপতন কোণ i বদলাও, প্রতিসৃত রশ্মি এঁকে r মাপো। কয়েকটি কোণের জন্য রেকর্ড করো — sin i / sin r ধ্রুব থাকে।',
  controls: [{ key: 'i', en: 'Angle of incidence i', bn: 'আপতন কোণ i', min: 10, max: 80, step: 1, unit: '°', default: 20 }],
  sweep: { key: 'i', values: [20, 30, 40, 50, 60] },
  minReadings: 5,
  compute(p, noise) {
    const r = Math.asin(Math.sin(p.i * DEG) / MU_GLASS) / DEG;
    const rm = r + noise(0.25);
    const si = Math.sin(p.i * DEG);
    const sr = Math.sin(rm * DEG);
    return {
      row: { angleI: p.i, angleR: round(rm, 1), sinI: round(si, 4), sinR: round(sr, 4), muCalc: round(si / sr, 3) },
      live: [
        { en: 'Angle i', bn: 'কোণ i', value: p.i, unit: '°', digits: 0 },
        { en: 'Angle r', bn: 'কোণ r', value: r, unit: '°', digits: 1 },
        { en: 'sin i / sin r', bn: 'sin i / sin r', value: si / Math.sin(r * DEG), digits: 3, tone: 'info' }
      ],
      view: { i: p.i, r, mu: MU_GLASS },
      ready: true
    };
  },
  result: {
    en: 'Refractive index μ (sin i – sin r slope)',
    bn: 'প্রতিসরাঙ্ক μ (sin i – sin r ঢাল)',
    unit: '',
    digits: 3,
    compute: (rows) => meanOf(rows, 'muCalc'),
    expected: MU_GLASS
  }
};

/* ------------------------------------------------------------------ */
/* Prism — angle of minimum deviation                                    */
/* ------------------------------------------------------------------ */

const PRISM_A = 60;
const MU_PRISM = 1.517;

export function prismDeviation(i: number) {
  const r1 = Math.asin(Math.sin(i * DEG) / MU_PRISM) / DEG;
  const r2 = PRISM_A - r1;
  const s = MU_PRISM * Math.sin(r2 * DEG);
  if (s >= 1) return null;
  const e = Math.asin(s) / DEG;
  return { r1, r2, e, delta: i + e - PRISM_A };
}

export const prism: PracticalModel = {
  slug: 'refractive-index-prism',
  scene: 'rays',
  variant: 'prism',
  howTo_en: 'Vary the angle of incidence and record the angle of deviation δ. Find the minimum deviation δm from your readings — μ = sin((A+δm)/2)/sin(A/2).',
  howTo_bn: 'আপতন কোণ বদলে বিচ্যুতি কোণ δ রেকর্ড করো। পাঠগুলো থেকে ন্যূনতম বিচ্যুতি δm বের করো — μ = sin((A+δm)/2)/sin(A/2)।',
  controls: [{ key: 'i', en: 'Angle of incidence i', bn: 'আপতন কোণ i', min: 30, max: 75, step: 1, unit: '°', default: 35 }],
  sweep: { key: 'i', values: [35, 40, 45, 49, 55, 60] },
  minReadings: 6,
  compute(p, noise) {
    const d = prismDeviation(p.i);
    if (!d) {
      return {
        row: { angleI: p.i, angleE: 0, deviationDelta: 0, muVal: 0 },
        live: [{ en: 'Emergent ray', bn: 'নির্গত রশ্মি', value: 'Total internal reflection', tone: 'warn' }],
        view: { i: p.i, tir: 1, A: PRISM_A, mu: MU_PRISM },
        status: { en: 'No emergent ray (total internal reflection) — increase i.', bn: 'নির্গত রশ্মি নেই (পূর্ণ অভ্যন্তরীণ প্রতিফলন) — i বাড়াও।', tone: 'warn' },
        ready: false
      };
    }
    const dm = d.delta + noise(0.15);
    const em = d.e + noise(0.15);
    return {
      row: {
        angleI: p.i,
        angleE: round(em, 1),
        deviationDelta: round(dm, 1),
        muVal: round(Math.sin(((PRISM_A + dm) / 2) * DEG) / Math.sin((PRISM_A / 2) * DEG), 3)
      },
      live: [
        { en: 'Emergence e', bn: 'নির্গমন কোণ e', value: d.e, unit: '°', digits: 1 },
        { en: 'Deviation δ', bn: 'বিচ্যুতি δ', value: d.delta, unit: '°', digits: 2 },
        { en: 'r₁ / r₂', bn: 'r₁ / r₂', value: `${d.r1.toFixed(1)}° / ${d.r2.toFixed(1)}°`, tone: Math.abs(d.r1 - d.r2) < 1 ? 'good' : 'info' }
      ],
      view: { i: p.i, e: d.e, delta: d.delta, r1: d.r1, r2: d.r2, A: PRISM_A, mu: MU_PRISM, tir: 0 },
      status:
        Math.abs(d.r1 - d.r2) < 1
          ? { en: 'Near minimum deviation — ray passes symmetrically (r₁ ≈ r₂).', bn: 'ন্যূনতম বিচ্যুতির কাছে — রশ্মি প্রতিসমভাবে যাচ্ছে (r₁ ≈ r₂)।', tone: 'good' }
          : undefined,
      ready: true
    };
  },
  result: {
    en: 'μ from minimum deviation δm',
    bn: 'ন্যূনতম বিচ্যুতি δm থেকে μ',
    unit: '',
    digits: 3,
    compute(rows) {
      let min: number | null = null;
      for (const r of rows) {
        const d = num(r, 'deviationDelta');
        if (d !== null && d > 0 && (min === null || d < min)) min = d;
      }
      if (min === null) return null;
      return Math.sin(((PRISM_A + min) / 2) * DEG) / Math.sin((PRISM_A / 2) * DEG);
    },
    expected: MU_PRISM
  }
};

/* ------------------------------------------------------------------ */
/* Young's double slit & diffraction grating                            */
/* ------------------------------------------------------------------ */

const LAMBDA = 632.8e-9;

export const youngDoubleSlit: PracticalModel = {
  slug: 'youngs-double-slit',
  scene: 'fringes',
  variant: 'ydse',
  howTo_en: 'Choose the slit separation d and screen distance D. Measure the fringe width β with the micrometer eyepiece and record. λ = βd/D.',
  howTo_bn: 'চিড়ের ব্যবধান d ও পর্দার দূরত্ব D বাছাই করো। মাইক্রোমিটার আইপিস দিয়ে ডোরা প্রস্থ β মেপে রেকর্ড করো। λ = βd/D।',
  controls: [
    { key: 'D', en: 'Screen distance D', bn: 'পর্দার দূরত্ব D', min: 0.5, max: 2, step: 0.1, unit: 'm', default: 1, digits: 1 },
    {
      key: 'd',
      en: 'Slit separation d',
      bn: 'চিড়ের ব্যবধান d',
      default: 0.25,
      options: [
        { value: 0.2, en: '0.20 mm', bn: '০.২০ মিমি' },
        { value: 0.25, en: '0.25 mm', bn: '০.২৫ মিমি' },
        { value: 0.5, en: '0.50 mm', bn: '০.৫০ মিমি' }
      ]
    }
  ],
  sweep: { key: 'D', values: [0.6, 0.8, 1.0, 1.2, 1.5] },
  minReadings: 5,
  compute(p, noise) {
    const beta = (LAMBDA * p.D) / (p.d * 1e-3) * 1000; // mm
    const bm = beta + noise(0.012);
    return {
      row: { screenDistD: round(p.D, 2), slitSepD: p.d, fringeWidthBeta: round(bm, 3), lambdaNm: round(((bm * p.d) / p.D) * 1e3, 1) },
      live: [
        { en: 'Fringe width β', bn: 'ডোরা প্রস্থ β', value: beta, unit: 'mm', digits: 3 },
        { en: '10 fringes', bn: '১০টি ডোরা', value: beta * 10, unit: 'mm', digits: 2 },
        { en: 'Source', bn: 'উৎস', value: 'He–Ne laser', tone: 'info' }
      ],
      view: { D: p.D, d: p.d, beta },
      ready: true
    };
  },
  result: {
    en: 'Wavelength λ',
    bn: 'তরঙ্গদৈর্ঘ্য λ',
    unit: 'nm',
    digits: 1,
    compute: (rows) => meanOf(rows, 'lambdaNm'),
    expected: 632.8
  }
};

export const diffractionGrating: PracticalModel = {
  slug: 'diffraction-grating',
  scene: 'fringes',
  variant: 'grating',
  howTo_en: 'Shine the laser through the grating. Measure the distance y of the n-th order spot from the centre for different screen distances and record.',
  howTo_bn: 'লেজার গ্রেটিংয়ের মধ্য দিয়ে ফেলো। কেন্দ্র থেকে n-তম ক্রমের বিন্দুর দূরত্ব y ভিন্ন পর্দা-দূরত্বে মেপে রেকর্ড করো।',
  controls: [
    {
      key: 'N',
      en: 'Grating (lines/mm)',
      bn: 'গ্রেটিং (রেখা/মিমি)',
      default: 300,
      options: [
        { value: 100, en: '100 /mm', bn: '১০০ /মিমি' },
        { value: 300, en: '300 /mm', bn: '৩০০ /মিমি' },
        { value: 600, en: '600 /mm', bn: '৬০০ /মিমি' }
      ]
    },
    {
      key: 'n',
      en: 'Order n',
      bn: 'ক্রম n',
      default: 1,
      options: [
        { value: 1, en: '1st', bn: '১ম' },
        { value: 2, en: '2nd', bn: '২য়' }
      ]
    },
    { key: 'D', en: 'Screen distance D', bn: 'পর্দার দূরত্ব D', min: 0.3, max: 1, step: 0.05, unit: 'm', default: 0.5, digits: 2 }
  ],
  sweep: { key: 'D', values: [0.3, 0.4, 0.5, 0.6, 0.8] },
  minReadings: 5,
  compute(p, noise) {
    const sinT = p.n * LAMBDA * p.N * 1000;
    if (sinT >= 1) {
      return {
        row: { orderN: p.n, spotDistY: 0, sinTheta: 0, lambdaNm: 0 },
        live: [{ en: 'Order', bn: 'ক্রম', value: 'Not visible (sin θ > 1)', tone: 'warn' }],
        view: { N: p.N, n: p.n, D: p.D, y: 0, visible: 0 },
        status: { en: 'This order does not exist for this grating — choose a lower order.', bn: 'এই গ্রেটিংয়ে এই ক্রম নেই — ছোট ক্রম বাছাই করো।', tone: 'warn' },
        ready: false
      };
    }
    const theta = Math.asin(sinT);
    const y = p.D * Math.tan(theta) * 100; // cm
    const ym = y + noise(0.08);
    const sm = ym / Math.sqrt(ym * ym + p.D * p.D * 1e4);
    return {
      row: { orderN: p.n, spotDistY: round(ym, 1), sinTheta: round(sm, 4), lambdaNm: round((sm / (p.n * p.N * 1000)) * 1e9, 1) },
      live: [
        { en: 'Spot distance y', bn: 'বিন্দুর দূরত্ব y', value: y, unit: 'cm', digits: 1 },
        { en: 'Diffraction angle θ', bn: 'অপবর্তন কোণ θ', value: theta / DEG, unit: '°', digits: 1 },
        { en: 'sin θ', bn: 'sin θ', value: sinT, digits: 4 }
      ],
      view: { N: p.N, n: p.n, D: p.D, y, theta, visible: 1 },
      ready: true
    };
  },
  result: {
    en: 'Wavelength λ',
    bn: 'তরঙ্গদৈর্ঘ্য λ',
    unit: 'nm',
    digits: 1,
    compute: (rows) => meanOf(rows.filter((r) => (num(r, 'lambdaNm') ?? 0) > 0), 'lambdaNm'),
    expected: 632.8
  }
};

export const opticsModels: PracticalModel[] = [vernier, screwGauge, convexLens, concaveMirror, snell, prism, youngDoubleSlit, diffractionGrating];
