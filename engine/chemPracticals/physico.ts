/**
 * Physico-chemical simulations.
 *
 * These practicals are about *measuring* a physical property from a chemical
 * system: absorbance and the Beer–Lambert law, adsorption on charcoal, partition
 * between two liquids, surface tension, relative viscosity, freezing-point
 * depression, the constant of a conductivity cell, first-order ester hydrolysis,
 * the percentage yield of a synthesis and the Nernst equation.
 */
import type { ChemParams, ChemPracticalModel, ChemRow, TubeView } from './types';
import { CHOOSE, clamp, linearFit, mean, num, opt, points, round, scoreRows, status, tick, tx } from './helpers';

/* ------------------------------------------------------------------ */
/* 1. Beer–Lambert law                                                */
/* ------------------------------------------------------------------ */

const BL_EPSILON = 2400; // L mol⁻¹ cm⁻¹
const BL_B = 1.0; // cm
const BL_STANDARDS = [0, 0.2e-3, 0.4e-3, 0.6e-3, 0.8e-3, 1.0e-3];
const BL_LABELS = [
  { en: 'Blank', bn: 'ফাঁকা', c: 0 },
  { en: '0.20 × 10⁻³ M', bn: '0.20 × 10⁻³ M', c: 0.2e-3 },
  { en: '0.40 × 10⁻³ M', bn: '0.40 × 10⁻³ M', c: 0.4e-3 },
  { en: '0.60 × 10⁻³ M', bn: '0.60 × 10⁻³ M', c: 0.6e-3 },
  { en: '0.80 × 10⁻³ M', bn: '0.80 × 10⁻³ M', c: 0.8e-3 },
  { en: '0.80 × 10⁻³ M', bn: '0.80 × 10⁻³ M', c: 0.8e-3 }
];
/** The unknown has an absorbance of 1.20, so its concentration is 5.00 × 10⁻⁴ M. */
const BL_UNKNOWN_A = 1.2;
const BL_UNKNOWN_C = BL_UNKNOWN_A / (BL_EPSILON * BL_B);

const beerLambert: ChemPracticalModel = {
  slug: 'beer-lambert-absorbance',
  scene: 'tubes',
  variant: 'spectrophotometer',
  howTo_en:
    'Fill six cuvettes with the blank and five known concentrations of the coloured solution, then the unknown. Switch the cell in the colorimeter and record the absorbance of each. Plot absorbance against concentration: the line through the origin has slope εb, so the molar absorptivity follows. Finally read the unknown and use the line to find its concentration.',
  howTo_bn:
    'ছয়টি কিউভেটে ফাঁকা দ্রবণ, পাঁচটি পরিচিত ঘনমাত্রার রঙিন দ্রবণ এবং অজানা নমুনা নাও। কালারিমিটারে সেল বদলে প্রতিটির শোষণ রং পড়ো। শোষণ রং বনাম ঘনত্বের লেখচিত্র আঁকো: মূলবিন্দুর মধ্য দিয়ে যাওয়া রেখার ঢাল εb, তাই মোলার শোষণী গ্রহণযোগ্যতা পাওয়া যায়। শেষে অজানা নমুনার শোষণ রং পড়ে লেখচিত্র থেকে তার ঘনত্ব বের করো।',
  formula: 'A = ε · b · c · ε = slope of the A–c line ÷ b',
  controls: [
    {
      key: 'std',
      en: 'Cell in the colorimeter',
      bn: 'কালারিমিটারে সেল',
      kind: 'view',
      default: 0,
      options: [
        opt(0, 'Blank', 'ফাঁকা'),
        opt(1, 'Standard 1 (0.20 × 10⁻³ M)', 'মানক ১ (0.20 × 10⁻³ M)'),
        opt(2, 'Standard 2 (0.40 × 10⁻³ M)', 'মানক ২ (0.40 × 10⁻³ M)'),
        opt(3, 'Standard 3 (0.60 × 10⁻³ M)', 'মানক ৩ (0.60 × 10⁻³ M)'),
        opt(4, 'Standard 4 (0.80 × 10⁻³ M)', 'মানক ৪ (0.80 × 10⁻³ M)'),
        opt(5, 'Unknown sample', 'অজানা নমুনা')
      ]
    }
  ],
  tasks: [0, 1, 2, 3, 4, 5].map((i) => ({ en: BL_LABELS[i].en, bn: BL_LABELS[i].bn, set: { std: i } })),
  columns: [
    { key: 'std', en: 'Sample', bn: 'নমুনা' },
    { key: 'c', en: 'Concentration', bn: 'ঘনত্ব', unit: 'mol L⁻¹', digits: 6, scientific: true },
    { key: 'a', en: 'Absorbance', bn: 'শোষণ রং', digits: 3 }
  ],
  minReadings: 6,
  graph: { x: 'c', y: 'a', kind: 'line' },
  compute: (p: ChemParams, noise, ctx) => {
    const std = clamp(Math.round(p.std), 0, 5);
    const c = std === 5 ? BL_UNKNOWN_C : BL_STANDARDS[std];
    const a = (std === 5 ? BL_UNKNOWN_A : BL_EPSILON * BL_B * c) + noise(0.01);
    const pts = points(ctx.rows, 'c', 'a');
    const tubes: TubeView[] = BL_STANDARDS.map((s, i) => {
      const conc = i === 5 ? BL_UNKNOWN_C : s;
      const shade = Math.round(255 - 190 * (conc / 1.0e-3));
      return {
        label: i === 5 ? 'Unknown' : `S${i}`,
        labelBn: i === 5 ? 'অজানা' : `S${i}`,
        liquid: `rgb(${shade},${Math.round(shade * 0.35)},${Math.round(shade * 0.75)})`,
        level: 0.45,
        active: i === std
      };
    });
    return {
      row: {
        ...tx('std', BL_LABELS[std].en, BL_LABELS[std].bn),
        c: round(c, 6),
        a: round(a, 3),
        __std: std
      },
      live: [
        { en: 'Sample', bn: 'নমুনা', value: BL_LABELS[std].en, valueBn: BL_LABELS[std].bn },
        { en: 'Absorbance', bn: 'শোষণ রং', value: round(a, 3), digits: 3, tone: 'info' },
        { en: 'Concentration', bn: 'ঘনত্ব', value: c, unit: 'mol L⁻¹', digits: 6 },
        { en: 'Beer–Lambert', bn: 'বিয়ার–ল্যাম্বার্ট', value: `A = ${round(a, 3)}`, valueBn: `A = ${round(a, 3)}` }
      ],
      view: {
        tubes,
        meter: { tube: std, value: a },
        meterLabel: 'colorimeter',
        meterUnit: 'A',
        meterDigits: 3,
        clock: { value: 0, unit: 's' },
        caption: 'Colour deepens as the concentration rises — absorbance is proportional to it.'
      },
      status:
        std === 5
          ? status('good', 'Unknown sample in the cell — read the absorbance and find its concentration on your line.', 'অজানা নমুনা সেলে — শোষণ রং পড়ে তোমার লেখচিত্র থেকে ঘনত্ব বের করো।')
          : status('info', 'Record this absorbance, then move to the next solution.', 'এই শোষণ রং রেকর্ড করে পরের দ্রবণে যাও।'),
      ready: true
    };
  },
  result: {
    en: 'Concentration of the unknown solution',
    bn: 'অজানা দ্রবণের ঘনত্ব',
    unit: 'mol L⁻¹',
    digits: 6,
    scientific: true,
    compute: (rows: ChemRow[]) => {
      const unknown = [...rows].reverse().find((r) => num(r, '__std') === 5);
      if (!unknown) return null;
      const a = num(unknown, 'a');
      return a === null ? null : a / (BL_EPSILON * BL_B);
    },
    expected: BL_UNKNOWN_C,
    goodWithin: 4
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 2. Adsorption of acetic acid on charcoal                           */
/* ------------------------------------------------------------------ */

const AD_QM = 150; // mg g⁻¹
const AD_B = 8; // L mol⁻¹
const AD_MASS = 5; // g of charcoal
const AD_VOL = 50; // mL of solution
const AD_M = 60.05; // mg mmol⁻¹ (acetic acid)

/** Equilibrium concentration when the adsorption follows the Langmuir isotherm. */
function adsorbedEquilibrium(c0: number): { ce: number; q: number } {
  const capacity = (c: number) => (AD_QM * AD_B * c) / (1 + AD_B * c);
  let lo = 0;
  let hi = c0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const q = ((c0 - mid) * AD_VOL * AD_M) / AD_MASS;
    if (q > capacity(mid)) lo = mid;
    else hi = mid;
  }
  const ce = (lo + hi) / 2;
  const q = ((c0 - ce) * AD_VOL * AD_M) / AD_MASS;
  return { ce, q };
}

const adsorption: ChemPracticalModel = {
  slug: 'charcoal-adsorption-isotherm',
  scene: 'tubes',
  variant: 'adsorption',
  howTo_en:
    'Shake 50.0 mL of acetic acid with 5.00 g of activated charcoal, filter, and titrate the filtrate to find the concentration left in solution. The difference gives the mass adsorbed and the capacity q of the charcoal. Repeat with different starting concentrations and plot 1/q against 1/C: the intercept is 1/qm, the saturation capacity.',
  howTo_bn:
    '50.0 mL অ্যাসিটিক অ্যাসিডের সঙ্গে 5.00 g সক্রিয় কয়লা ঝাঁকিয়ে ফিল্টার করো এবং ফিলট্রেট টাইট্রেট করে দ্রবণে কতটুকু অ্যাসিড বাকি আছে বের করো। পার্থক্য থেকে শোষিত পরিমাণ ও কয়লার ধারণক্ষমতা q পাওয়া যায়। বিভিন্ন প্রাথমিক ঘনত্বে পুনরাবৃত্তি করে 1/q বনাম 1/C লেখচিত্র আঁকো: ইন্টারসেপ্ট 1/qm, অর্থাৎ সম্পৃক্তির ধারণক্ষমতা।',
  formula: 'q = (C₀ − C) × V × M ÷ m(charcoal) · Langmuir: 1/q = 1/qm + 1/(qm·b·C)',
  controls: [
    {
      key: 'c0',
      en: 'Starting concentration of acetic acid',
      bn: 'অ্যাসিটিক অ্যাসিডের প্রাথমিক ঘনত্ব',
      kind: 'condition',
      min: 0.02,
      max: 0.2,
      step: 0.01,
      unit: 'mol L⁻¹',
      default: 0.1,
      digits: 3
    }
  ],
  tasks: [0.05, 0.08, 0.11, 0.14, 0.17, 0.2].map((v) => ({ en: `${v.toFixed(2)} mol L⁻¹`, bn: `${v.toFixed(2)} mol L⁻¹`, set: { c0: v } })),
  columns: [
    { key: 'c0', en: 'C₀', bn: 'C₀', unit: 'mol L⁻¹', digits: 3 },
    { key: 'ce', en: 'C (equilibrium)', bn: 'C (সমতুল্য)', unit: 'mol L⁻¹', digits: 4 },
    { key: 'q', en: 'Adsorption q', bn: 'শোষণ q', unit: 'mg g⁻¹', digits: 2 }
  ],
  minReadings: 3,
  graph: { x: 'ce', y: 'q', kind: 'scatter' },
  compute: (p: ChemParams, noise) => {
    const c0 = clamp(p.c0, 0.02, 0.2);
    const { ce, q } = adsorbedEquilibrium(c0);
    const qm = q + noise(0.2);
    return {
      row: { c0: round(c0, 3), ce: round(ce, 4), q: round(qm, 2) },
      live: [
        { en: 'Starting concentration', bn: 'প্রাথমিক ঘনত্ব', value: round(c0, 3), unit: 'mol L⁻¹', digits: 3 },
        { en: 'Concentration left', bn: 'অবশিষ্ট ঘনত্ব', value: round(ce, 4), unit: 'mol L⁻¹', digits: 4 },
        { en: 'Mass adsorbed', bn: 'শোষিত ভর', value: round((c0 - ce) * AD_VOL * AD_M, 1), unit: 'mg', digits: 1 },
        { en: 'Adsorption capacity', bn: 'শোষণ ধারণক্ষমতা', value: round(qm, 2), unit: 'mg g⁻¹', digits: 2, tone: 'info' }
      ],
      view: {
        tubes: [
          { label: 'Before', labelBn: 'শোষণের আগে', liquid: '#c98a3c', level: 0.45, warm: true },
          { label: 'After', labelBn: 'শোষণের পরে', liquid: '#e6c48a', level: 0.45, solid: { kind: 'powder', color: '#2f2a26', amount: 0.8 } }
        ],
        caption: 'The charcoal pulls the acid out of solution — the filtrate is much paler.'
      },
      status: status('info', 'Filter and titrate the filtrate, then record C and q.', 'ফিল্টার করে ফিলট্রেট টাইট্রেট করে C ও q রেকর্ড করো।'),
      ready: true
    };
  },
  result: {
    en: 'Saturation capacity of the charcoal (qm)',
    bn: 'কয়লার সম্পৃক্তি ধারণক্ষমতা (qm)',
    unit: 'mg g⁻¹',
    digits: 1,
    compute: (rows: ChemRow[]) => {
      const fit = linearFit(
        rows.map((r) => 1 / (num(r, 'ce') ?? 1)),
        rows.map((r) => 1 / (num(r, 'q') ?? 1))
      );
      if (!fit || !Number.isFinite(fit.intercept) || fit.intercept <= 0) return null;
      return 1 / fit.intercept;
    },
    expected: AD_QM,
    goodWithin: 12
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 3. Partition of iodine between water and carbon tetrachloride      */
/* ------------------------------------------------------------------ */

const PART_K = 85; // c(CCl₄) ÷ c(water)
const PART_V = 10; // mL of each layer
const PART_M = 253.8; // g mol⁻¹ (iodine)

const partition: ChemPracticalModel = {
  slug: 'partition-coefficient',
  scene: 'tubes',
  variant: 'partition',
  howTo_en:
    'Shake a measured amount of iodine with 10.0 mL of water and 10.0 mL of carbon tetrachloride. The iodine splits between the two layers: the violet organic layer holds most of it. Take a sample of each layer, find their concentrations and work out the partition coefficient K = c(organic) ÷ c(aqueous).',
  howTo_bn:
    'নির্দিষ্ট পরিমাণ আয়োডিনের সঙ্গে 10.0 mL পানি ও 10.0 mL কার্বন টেট্রাক্লোরাইড ঝাঁকাও। আয়োডিন দুই স্তরে ভাগ হয়: বেগুনি জৈব স্তরে এর বেশিরভাগ থাকে। প্রতিটি স্তর থেকে নমুনা নিয়ে ঘনত্ব বের করে পার্টিশন গুণাঙ্ক K = c(জৈব) ÷ c(জলীয়) বের করো।',
  formula: 'K = c(CCl₄) ÷ c(water) · n(total) = c(aq)·V(aq) + c(org)·V(org)',
  controls: [
    {
      key: 'mass',
      en: 'Iodine added',
      bn: 'যোগ করা আয়োডিন',
      kind: 'condition',
      min: 0.2,
      max: 2,
      step: 0.1,
      unit: 'mg',
      default: 1,
      digits: 1
    }
  ],
  tasks: [0.4, 0.8, 1.2, 1.6, 2].map((v) => ({ en: `${v.toFixed(1)} mg of iodine`, bn: `${v.toFixed(1)} mg আয়োডিন`, set: { mass: v } })),
  columns: [
    { key: 'mass', en: 'Iodine added', bn: 'যোগ করা আয়োডিন', unit: 'mg', digits: 1 },
    { key: 'caq', en: 'c (water layer)', bn: 'c (জলীয় স্তর)', unit: 'mol L⁻¹', digits: 6, scientific: true },
    { key: 'corg', en: 'c (CCl₄ layer)', bn: 'c (CCl₄ স্তর)', unit: 'mol L⁻¹', digits: 6, scientific: true }
  ],
  minReadings: 3,
  compute: (p: ChemParams, noise) => {
    const mass = clamp(p.mass, 0.2, 2);
    const n = (mass / 1000 / PART_M) * 1000; // mol (mass in mg → g)
    const caq = n / (PART_K * (PART_V / 1000) + PART_V / 1000);
    const corg = PART_K * caq;
    const caqN = caq * (1 + noise(0.02));
    const corgN = corg * (1 + noise(0.02));
    return {
      row: { mass: round(mass, 1), caq: round(caqN, 6), corg: round(corgN, 6) },
      live: [
        { en: 'Iodine added', bn: 'যোগ করা আয়োডিন', value: round(mass, 1), unit: 'mg', digits: 1 },
        { en: 'Water layer', bn: 'জলীয় স্তর', value: round(caqN * 1000, 3), unit: '× 10⁻³ mol L⁻¹', digits: 3 },
        { en: 'CCl₄ layer', bn: 'CCl₄ স্তর', value: round(corgN * 1000, 3), unit: '× 10⁻³ mol L⁻¹', digits: 3, tone: 'info' },
        { en: 'Partition ratio', bn: 'পার্টিশন অনুপাত', value: round(corgN / caqN, 1), digits: 1 }
      ],
      view: {
        tubes: [
          { label: 'Water layer', labelBn: 'জলীয় স্তর', liquid: '#b07a3a', level: 0.42, sub: 'c = ' + round(caqN * 1000, 3) + ' ×10⁻³ M' },
          { label: 'CCl₄ layer', labelBn: 'CCl₄ স্তর', liquid: '#6b3fa0', level: 0.42, sub: 'c = ' + round(corgN * 1000, 3) + ' ×10⁻³ M' }
        ],
        caption: 'The violet CCl₄ layer holds most of the iodine.'
      },
      status: status('info', 'Take a sample of each layer and work out the ratio.', 'প্রতিটি স্তর থেকে নমুনা নিয়ে অনুপাত বের করো।'),
      ready: true
    };
  },
  result: {
    en: 'Partition coefficient K',
    bn: 'পার্টিশন গুণাঙ্ক K',
    unit: '',
    digits: 1,
    compute: (rows: ChemRow[]) => {
      const last = rows[rows.length - 1];
      if (!last) return null;
      const caq = num(last, 'caq');
      const corg = num(last, 'corg');
      if (!caq || !corg) return null;
      return corg / caq;
    },
    expected: PART_K,
    goodWithin: 6
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 4. Surface tension by the drop-weight method                        */
/* ------------------------------------------------------------------ */

const ST_VOLUME = 2.0; // mL in the stalagmometer
const ST_RADIUS = 2.14e-3; // m
const ST_G = 9.8; // m s⁻²
const ST_DROPS = 20;

/** Surface tension (N m⁻¹) for a given number of drops. */
function surfaceTension(drops: number): number {
  const massKg = (ST_VOLUME / 1000) * (drops > 0 ? 1 / drops : 0); // kg per drop
  return (massKg * ST_G) / (2 * Math.PI * ST_RADIUS);
}

const stalagmometer: ChemPracticalModel = {
  slug: 'stalagmometer-surface-tension',
  scene: 'tubes',
  variant: 'stalagmometer',
  howTo_en:
    'Fill the stalagmometer with 2.0 mL of the liquid and let the drops fall into the watch glass, counting them. Each drop has a mass ρV/n and detaches when its weight balances the surface tension around the capillary rim, so γ = ρVg ÷ (2πrn). Count the drops to the very end of the bulb — that is the number that gives the true surface tension.',
  howTo_bn:
    'স্ট্যালাগমোমিটারে 2.0 mL তরল নিয়ে ওয়াচ গ্লাসে ফোঁটা ফোঁটা ফেলে ফোঁটা গুনে রাখো। প্রতিটি ফোঁটার ভর ρV/n, আর ফোঁটা তখনই খসে পড়ে যখন তার ওজন ক্যাপিলারিরিমের চারপাশের পৃষ্ঠত্বণ সমান হয়, তাই γ = ρVg ÷ (2πrn)। বাল্বের একদম শেষ পর্যন্ত ফোঁটা গোনো — ওই সংখ্যটাই সত্য পৃষ্ঠত্বণণ দেয়।',
  formula: 'γ = ρ · V · g ÷ (2 · π · r · n)',
  controls: [
    {
      key: 'drops',
      en: 'Drops counted',
      bn: 'গোনা ফোঁটার সংখ্যা',
      kind: 'condition',
      min: 10,
      max: 30,
      step: 1,
      unit: 'drops',
      default: ST_DROPS,
      digits: 0
    }
  ],
  tasks: [{ en: 'Count every drop to the end', bn: 'বাল্বের শেষ পর্যন্ত সব ফোঁটা গোনো', set: { drops: ST_DROPS } }],
  columns: [
    { key: 'drops', en: 'Drops counted', bn: 'গোনা ফোঁটা', digits: 0 },
    { key: 'gamma', en: 'Surface tension', bn: 'পৃষ্ঠত্বণ', unit: 'mN m⁻¹', digits: 1 },
    { key: 'left', en: 'Volume left in the bulb', bn: 'বাল্বে অবশিষ্ট আয়তন', unit: 'mL', digits: 2 }
  ],
  minReadings: 1,
  compute: (p: ChemParams, noise) => {
    const drops = clamp(Math.round(p.drops), 10, 30);
    const left = Math.max(0, ST_VOLUME - (drops - 1) * (ST_VOLUME / ST_DROPS));
    const gamma = surfaceTension(drops) * 1000 + noise(0.4);
    return {
      row: { drops, gamma: round(gamma, 1), left: round(left, 2) },
      live: [
        { en: 'Drops counted', bn: 'গোনা ফোঁটা', value: drops, digits: 0 },
        { en: 'Volume left in the bulb', bn: 'বাল্বে অবশিষ্ট আয়তন', value: round(left, 2), unit: 'mL', digits: 2, tone: left > 0.05 ? 'info' : 'good' },
        { en: 'Surface tension', bn: 'পৃষ্ঠত্বণ', value: round(gamma, 1), unit: 'mN m⁻¹', digits: 1 },
        { en: 'For comparison', bn: 'তুলনার জন্য', value: 'water ≈ 72.8 mN m⁻¹', valueBn: 'পানি ≈ 72.8 mN m⁻¹' }
      ],
      view: {
        tubes: [
          { label: 'Watch glass', labelBn: 'ওয়াচ গ্লাস', liquid: '#dff0fb', level: 0.12, sub: `${drops} drops` }
        ],
        dropper: { tube: 0, color: '#dff0fb', label: 'stalagmometer' },
        caption: left > 0.05 ? 'The bulb still holds liquid — keep counting.' : 'The bulb is empty — that is the drop count you need.'
      },
      status:
        left > 0.05
          ? status('info', 'The bulb still holds liquid, so the drop count is not complete.', 'বাল্বে তরল আছে, তাই ফোঁটা গোনা শেষ হয়নি।')
          : status('good', 'The bulb is empty — record this drop count.', 'বাল্ব খালি — এই ফোঁটার সংখ্যাটি রেকর্ড করো।'),
      ready: true
    };
  },
  result: {
    en: 'Surface tension of the liquid',
    bn: 'তরলের পৃষ্ঠত্বণ',
    unit: 'mN m⁻¹',
    digits: 1,
    compute: (rows: ChemRow[]) => {
      const last = rows[rows.length - 1];
      const d = last ? num(last, 'drops') : null;
      return d === null ? null : surfaceTension(d) * 1000;
    },
    expected: surfaceTension(ST_DROPS) * 1000,
    absolute: true,
    tolerance: 2
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 5. Relative viscosity with an Ostwald viscometer                   */
/* ------------------------------------------------------------------ */

const VIS_TWATER = 92; // s
const VIS_TSOLUTION = 110.4; // s
const VIS_RATIO = VIS_TSOLUTION / VIS_TWATER;

const viscometer: ChemPracticalModel = {
  slug: 'ostwald-viscometer-viscosity',
  scene: 'tubes',
  variant: 'viscometer',
  howTo_en:
    'Clean the Ostwald viscometer, fill it with distilled water and time the efflux between the two marks — repeat three times. Then fill it with the solution and time it in the same way. Since the Ostwald equation gives η/η₀ = (ρt)/(ρ₀t₀), and the densities are nearly equal for a dilute solution, the relative viscosity is simply the ratio of the two efflux times.',
  howTo_bn:
    'ওস্টওয়াল্ড ভিসকোমিটার পরিষ্কার করে তারপর আলাদা জল দিয়ে দুই চিহ্নের মধ্যে প্রবাহের সময় মাপো — তিনবার। তারপর একই নিয়মে দ্রবণ দিয়ে সময় মাপো। ওস্টওয়াল্ড সমীকরণ অনুযায়ী η/η₀ = (ρt)/(ρ₀t₀), আর লঘু দ্রবণে ঘনত্ব প্রায় সমান, তাই আপেক্ষিক সান্দ্রতা হলো দুটি প্রবাহকালের অনুপাত।',
  formula: 'η_rel = η/η₀ ≈ t(solution) ÷ t(water)',
  controls: [
    {
      key: 'liquid',
      en: 'Liquid in the viscometer',
      bn: 'ভিসকোমিটারে তরল',
      kind: 'condition',
      default: 0,
      options: [opt(0, 'Distilled water', 'বিশুদ্ধ পানি'), opt(1, 'Test solution', 'পরীক্ষার দ্রবণ')]
    },
    {
      key: 'time',
      en: 'Stopwatch — efflux time',
      bn: 'স্টপওয়াচ — প্রবাহকাল',
      kind: 'time',
      min: 0,
      max: 200,
      step: 0.1,
      unit: 's',
      default: 0,
      digits: 1,
      play: { rate: 12 }
    }
  ],
  tasks: [
    { en: 'Time the distilled water', bn: 'বিশুদ্ধ পানির সময় মাপো', set: { liquid: 0, time: VIS_TWATER } },
    { en: 'Time the test solution', bn: 'পরীক্ষার দ্রবণের সময় মাপো', set: { liquid: 1, time: VIS_TSOLUTION } }
  ],
  columns: [
    { key: 'liquid', en: 'Liquid', bn: 'তরল' },
    { key: 'time', en: 'Efflux time', bn: 'প্রবাহকাল', unit: 's', digits: 1 }
  ],
  minReadings: 2,
  compute: (p: ChemParams, noise, ctx) => {
    const liquid = clamp(Math.round(p.liquid), 0, 1);
    const t = clamp(p.time, 0, 200);
    const truth = liquid === 0 ? VIS_TWATER : VIS_TSOLUTION;
    const level = clamp(1 - t / truth, 0, 1);
    const rows = ctx.rows;
    const waterTimes = rows.filter((r) => num(r, '__liquid') === 0).map((r) => num(r, 'time')).filter((v): v is number => v !== null);
    const solTimes = rows.filter((r) => num(r, '__liquid') === 1).map((r) => num(r, 'time')).filter((v): v is number => v !== null);
    const water = waterTimes.length ? (mean(waterTimes) ?? VIS_TWATER) : VIS_TWATER;
    const sol = solTimes.length ? (mean(solTimes) ?? null) : null;
    return {
      row: {
        ...tx('liquid', liquid === 0 ? 'Distilled water' : 'Test solution', liquid === 0 ? 'বিশুদ্ধ পানি' : 'পরীক্ষার দ্রবণ'),
        time: round(t + noise(0.2), 1),
        __liquid: liquid
      },
      live: [
        { en: 'Liquid', bn: 'তরল', value: liquid === 0 ? 'Distilled water' : 'Test solution', valueBn: liquid === 0 ? 'বিশুদ্ধ পানি' : 'পরীক্ষার দ্রবণ' },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: round(t, 1), unit: 's', digits: 1, tone: t >= truth - 0.5 ? 'good' : 'info' },
        { en: 'Level in the bulb', bn: 'বাল্বের উচ্চতা', value: round(level * 100, 0), unit: '%', digits: 0 },
        ...(sol !== null
          ? [{ en: 'Relative viscosity so far', bn: 'আপেক্ষিক সান্দ্রতা', value: round(sol / water, 3), digits: 3, tone: 'info' as const }]
          : [])
      ],
      view: {
        tubes: [
          { label: 'Water', labelBn: 'পানি', liquid: '#e6f3fb', level: 0.2 + 0.55 * level, active: liquid === 0 },
          { label: 'Solution', labelBn: 'দ্রবণ', liquid: '#dfeaf6', level: 0.2 + 0.55 * level, active: liquid === 1 }
        ],
        clock: { value: t, unit: 's' },
        caption: 'Time the fall of the liquid from the upper mark to the lower one.'
      },
      status:
        t >= truth - 0.5
          ? status('good', 'The liquid has passed the lower mark — record the time.', 'তরল নিচের চিহ্ন পেরিয়ে গেছে — সময় রেকর্ড করো।')
          : status('info', 'Start the stopwatch as the liquid leaves the upper mark.', 'উপরের চিহ্ন থেকে তরল নামার সঙ্গে সঙ্গে স্টপওয়াচ চালু করো।'),
      ready: true
    };
  },
  result: {
    en: 'Relative viscosity of the solution',
    bn: 'দ্রবণের আপেক্ষিক সান্দ্রতা',
    unit: '',
    digits: 3,
    compute: (rows: ChemRow[]) => {
      const waterTimes = rows.filter((r) => num(r, '__liquid') === 0).map((r) => num(r, 'time')).filter((v): v is number => v !== null);
      const solTimes = rows.filter((r) => num(r, '__liquid') === 1).map((r) => num(r, 'time')).filter((v): v is number => v !== null);
      if (!solTimes.length) return null;
      const water = waterTimes.length ? (mean(waterTimes) ?? VIS_TWATER) : VIS_TWATER;
      return (mean(solTimes) ?? 0) / water;
    },
    expected: VIS_RATIO,
    goodWithin: 3
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 6. Freezing-point depression and the van 't Hoff factor            */
/* ------------------------------------------------------------------ */

const KF = 1.86; // K kg mol⁻¹
const SOLUTES = [
  { en: 'Glucose', bn: 'গ্লুকোজ', i: 1, formula: 'C₆H₁₂O₆' },
  { en: 'Sodium chloride', bn: 'সোডিয়াম ক্লোরাইড', i: 2, formula: 'NaCl' },
  { en: 'Calcium chloride', bn: 'ক্যালসিয়াম ক্লোরাইড', i: 3, formula: 'CaCl₂' }
];

const freezingPoint: ChemPracticalModel = {
  slug: 'freezing-point-depression',
  scene: 'tubes',
  variant: 'freezing',
  howTo_en:
    'Cool a solution of known molality in a freezing bath until ice just starts to appear, and read the temperature. The depression ΔTf = Kf · i · m gives the van ’t Hoff factor i — the number of particles the solute produces. Do it for glucose, sodium chloride and calcium chloride and compare the three values.',
  howTo_bn:
    'জানা মোলালিটির দ্রবণকে ফ্রিজিং বাথে ঠান্ডা করে যখন বরফ প্রথম দেখা দেয় তখন তাপমাত্রা পড়ো। অবনমন ΔTf = Kf · i · m থেকে ভ্যান ’ট হোফ ফ্যাক্টর i পাওয়া যায় — অর্থাৎ দ্রাব্য কতগুলো কণা তৈরি করে। গ্লুকোজ, সোডিয়াম ক্লোরাইড ও ক্যালসিয়াম ক্লোরাইডের জন্য আলাদা আলাদা করে এটি করে তিনটি মান তুলনা করো।',
  formula: 'ΔTf = Kf · i · m · Kf(water) = 1.86 K kg mol⁻¹',
  controls: [
    {
      key: 'solute',
      en: 'Solute in the solution',
      bn: 'দ্রবণে দ্রাব্য',
      kind: 'condition',
      default: 1,
      options: SOLUTES.map((s, i) => opt(i, s.en, s.bn))
    },
    {
      key: 'm',
      en: 'Molality of the solution',
      bn: 'দ্রবণের মোলালিটি',
      kind: 'condition',
      min: 0.2,
      max: 1,
      step: 0.1,
      unit: 'mol kg⁻¹',
      default: 0.5,
      digits: 2
    },
    {
      key: 'i',
      en: 'Your conclusion: the van ’t Hoff factor i is…',
      bn: 'তোমার সিদ্ধান্ত: ভ্যান ’ট হোফ ফ্যাক্টর i…',
      kind: 'inference',
      default: -1,
      options: [CHOOSE, opt(1, '1 — no dissociation', '1 — বিচ্ছিন্ন নয়'), opt(2, '2 — two ions', '2 — দুটি আয়ন'), opt(3, '3 — three ions', '3 — তিনটি আয়ন')]
    }
  ],
  tasks: SOLUTES.map((_, i) => ({ en: SOLUTES[i].en, bn: SOLUTES[i].bn, set: { solute: i } })),
  columns: [
    { key: 'solute', en: 'Solute', bn: 'দ্রাব্য' },
    { key: 'm', en: 'Molality', bn: 'মোলালিটি', unit: 'mol kg⁻¹', digits: 2 },
    { key: 'tf', en: 'Freezing point', bn: 'ফ্রিজিং পয়েন্ট', unit: '°C', digits: 2 },
    { key: 'i', en: 'Your i', bn: 'তোমার i' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 3,
  compute: (p: ChemParams, noise) => {
    const si = clamp(Math.round(p.solute), 0, SOLUTES.length - 1);
    const s = SOLUTES[si];
    const m = clamp(p.m, 0.2, 1);
    const tf = -KF * s.i * m + noise(0.03);
    const chosen = p.i > 0;
    const correct = chosen && Math.round(p.i) === s.i;
    return {
      row: {
        ...tx('solute', s.en, s.bn),
        m: round(m, 2),
        tf: round(tf, 2),
        ...tx('i', chosen ? `i = ${Math.round(p.i)}` : '—', chosen ? `i = ${bnDigits(Math.round(p.i))}` : '—'),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Solute', bn: 'দ্রাব্য', value: `${s.en} (${s.formula})`, valueBn: `${s.bn} (${s.formula})` },
        { en: 'Molality', bn: 'মোলালিটি', value: round(m, 2), unit: 'mol kg⁻¹', digits: 2 },
        { en: 'Freezing point', bn: 'ফ্রিজিং পয়েন্ট', value: round(tf, 2), unit: '°C', digits: 2, tone: 'info' },
        { en: 'Depression ΔTf', bn: 'অবনমন ΔTf', value: round(Math.abs(tf), 2), unit: 'K', digits: 2 }
      ],
      view: {
        tubes: [
          { label: 'Solution', labelBn: 'দ্রবণ', liquid: '#dbe9f4', level: 0.45, active: true, sub: `${s.formula} ${m.toFixed(1)} m` }
        ],
        bath: { temp: round(tf, 1), tube: 0 },
        caption: 'Ice appears in the tube as the solution reaches its freezing point.'
      },
      status: chosen
        ? correct
          ? status('good', `Correct — ${s.en} gives ${s.i} particle${s.i > 1 ? 's' : ''} per formula unit.`, `ঠিক — ${s.bn} প্রতি সূত্র এককে ${bnDigits(s.i)}টি কণা দেয়।`)
          : status('bad', `Not quite — think about how ${s.en} splits up in water.`, `ঠিক নয় — জলে ${s.bn} কীভাবে ভেঙে যায় তা ভাবো।`)
        : status('info', 'The freezing point is read. Now decide the van ’t Hoff factor.', 'ফ্রিজিং পয়েন্ট পড়া হয়েছে। এবার ভ্যান ’ট হোফ ফ্যাক্টর ঠিক করো।'),
      ready: chosen,
      correct
    };
  },
  result: {
    en: 'van ’t Hoff factors identified correctly',
    bn: 'সঠিকভাবে শনাক্ত করা ভ্যান ’ট হোফ ফ্যাক্টর',
    unit: '',
    score: true,
    compute: scoreRows,
    expected: 3,
    absolute: true,
    tolerance: 0
  },
  solve: (p) => ({ ...p, i: SOLUTES[clamp(Math.round(p.solute), 0, SOLUTES.length - 1)].i })
};

function bnDigits(value: number): string {
  const digits = '০১২৩৪৫৬৭৮৯';
  return String(value).replace(/[0-9]/g, (d) => digits[Number(d)]);
}

/* ------------------------------------------------------------------ */
/* 7. Cell constant of a conductivity cell                             */
/* ------------------------------------------------------------------ */

const CELL_CONSTANT = 1.0; // cm⁻¹
const KCL_STANDARDS = [
  { en: '0.001 M KCl', bn: '0.001 M KCl', kappa: 0.1412 },
  { en: '0.01 M KCl', bn: '0.01 M KCl', kappa: 1.412 },
  { en: '0.1 M KCl', bn: '0.1 M KCl', kappa: 12.88 }
];

const cellConstant: ChemPracticalModel = {
  slug: 'conductance-cell-constant',
  scene: 'tubes',
  variant: 'conductance',
  howTo_en:
    'Fill the conductivity cell with a standard potassium chloride solution of known conductivity and read the resistance. The conductance G = 1/R and the cell constant = κ/G, so the constant of the cell follows from the standard. Try all three standards and check that the same constant comes out each time.',
  howTo_bn:
    'পরিবাহিতা সেলে পরিচিত পরিবাহিতার KCl মানক দ্রবণ নিয়ে প্রতিরোধ পড়ো। পরিবাহিতা G = 1/R এবং সেল ধ্রুববই = κ/G, তাই মানক থেকেই সেলের ধ্রুববই পাওয়া যায়। তিনটি মানকই দিয়ে দেখো প্রতিবার একই ধ্রুববই আসে কিনা।',
  formula: 'G = 1/R · cell constant = κ ÷ G',
  controls: [
    {
      key: 'std',
      en: 'Standard KCl solution in the cell',
      bn: 'সেলে KCl মানক দ্রবণ',
      kind: 'condition',
      default: 1,
      options: KCL_STANDARDS.map((s, i) => opt(i, s.en, s.bn))
    }
  ],
  tasks: KCL_STANDARDS.map((_, i) => ({ en: KCL_STANDARDS[i].en, bn: KCL_STANDARDS[i].bn, set: { std: i } })),
  columns: [
    { key: 'std', en: 'Standard', bn: 'মানক' },
    { key: 'res', en: 'Resistance R', bn: 'প্রতিরোধ R', unit: 'kΩ', digits: 3 },
    { key: 'g', en: 'Conductance G', bn: 'পরিবাহিতা G', unit: 'mS', digits: 4 },
    { key: 'cc', en: 'Cell constant', bn: 'সেল ধ্রুববই', unit: 'cm⁻¹', digits: 3 }
  ],
  minReadings: 3,
  compute: (p: ChemParams, noise) => {
    const si = clamp(Math.round(p.std), 0, KCL_STANDARDS.length - 1);
    const s = KCL_STANDARDS[si];
    const res = CELL_CONSTANT / s.kappa * (1 + noise(0.004));
    const g = 1 / res;
    const cc = s.kappa * res;
    return {
      row: {
        ...tx('std', s.en, s.bn),
        res: round(res, 3),
        g: round(g, 4),
        cc: round(cc, 3),
        __std: si
      },
      live: [
        { en: 'Standard', bn: 'মানক', value: s.en, valueBn: s.bn },
        { en: 'Resistance', bn: 'প্রতিরোধ', value: round(res, 3), unit: 'kΩ', digits: 3 },
        { en: 'Conductance', bn: 'পরিবাহিতা', value: round(g, 4), unit: 'mS', digits: 4 },
        { en: 'Cell constant', bn: 'সেল ধ্রুববই', value: round(cc, 3), unit: 'cm⁻¹', digits: 3, tone: 'good' }
      ],
      view: {
        tubes: [
          { label: 'KCl standard', labelBn: 'KCl মানক', liquid: '#eef4fa', level: 0.5, active: true, sub: s.en }
        ],
        bulb: { tube: 0, brightness: clamp(s.kappa / 12.88, 0.08, 1) },
        caption: 'The brighter the bulb, the better the solution conducts.'
      },
      status: status('info', 'Record the resistance, then work out the cell constant.', 'প্রতিরোধ রেকর্ড করে সেল ধ্রুববই বের করো।'),
      ready: true
    };
  },
  result: {
    en: 'Cell constant of the conductivity cell',
    bn: 'পরিবাহিতা সেলের ধ্রুববই',
    unit: 'cm⁻¹',
    digits: 3,
    compute: (rows: ChemRow[]) => {
      const values = rows
        .map((r) => {
          const si = num(r, '__std');
          const res = num(r, 'res');
          if (si === null || res === null) return null;
          return KCL_STANDARDS[si].kappa * res;
        })
        .filter((v): v is number => v !== null);
      if (!values.length) return null;
      return mean(values);
    },
    expected: CELL_CONSTANT,
    absolute: true,
    tolerance: 0.05
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 8. First-order hydrolysis of an ester                               */
/* ------------------------------------------------------------------ */

const ESTER_C0 = 0.05; // mol L⁻¹ of ester
const ESTER_K = 0.0523; // min⁻¹
const ESTER_TEMP = 40;

const esterKinetics: ChemPracticalModel = {
  slug: 'ester-hydrolysis-kinetics',
  scene: 'tubes',
  variant: 'kinetics',
  howTo_en:
    'Hydrolyse methyl acetate in acid at 40 °C. Every few minutes withdraw a sample and titrate it with standard alkali to find the acid formed. Plot ln[ester] against time: the gradient of the straight line is the first-order rate constant.',
  howTo_bn:
    'অ্যাসিডে মিথাইল অ্যাসিটেট হাইড্রোলাইস করো 40 °C-এ। কয়েক মিনিট পরপর একটি নমুনা নিয়ে মানক ক্ষার দিয়ে টাইট্রেট করে তৈরি অ্যাসিড বের করো। ln[এস্টার] বনাম সময়ের লেখচিত্র আঁকো: সরল রেখার ঢালই প্রথম-ক্রম বিক্রিয়ার বিক্রিয়া ধ্রুববই।',
  formula: 'ln[ester] = ln[ester]₀ − kt · slope of the ln[ester]–t line = −k',
  controls: [
    {
      key: 'time',
      en: 'Time since the acid was added',
      bn: 'অ্যাসিড যোগের পর কেটে যাওয়া সময়',
      kind: 'time',
      min: 0,
      max: 90,
      step: 1,
      unit: 'min',
      default: 0,
      digits: 0,
      play: { rate: 3 }
    }
  ],
  tasks: [0, 10, 20, 30, 45, 60, 90].map((v) => ({ en: `${v} min`, bn: `${v} মিনিট`, set: { time: v } })),
  columns: [
    { key: 'time', en: 'Time', bn: 'সময়', unit: 'min', digits: 0 },
    { key: 'acid', en: 'Acid formed', bn: 'তৈরি অ্যাসিড', unit: 'mol L⁻¹', digits: 4 },
    { key: 'ester', en: '[ester]', bn: '[এস্টার]', unit: 'mol L⁻¹', digits: 4 },
    { key: 'ln', en: 'ln[ester]', bn: 'ln[এস্টার]', digits: 3 }
  ],
  minReadings: 5,
  graph: { x: 'time', y: 'ln', kind: 'line' },
  compute: (p: ChemParams, noise, ctx) => {
    const t = clamp(p.time, 0, 90);
    const acid = ESTER_C0 * (1 - Math.exp(-ESTER_K * t));
    const ester = Math.max(1e-4, ESTER_C0 - acid);
    const ln = Math.log(ester);
    const pts = points(ctx.rows, 'time', 'ln');
    return {
      row: { time: round(t, 0), acid: round(acid, 4), ester: round(ester, 4), ln: round(ln + noise(0.01), 3) },
      live: [
        { en: 'Time', bn: 'সময়', value: round(t, 0), unit: 'min', digits: 0 },
        { en: 'Acid formed', bn: 'তৈরি অ্যাসিড', value: round(acid, 4), unit: 'mol L⁻¹', digits: 4, tone: 'info' },
        { en: 'Ester left', bn: 'বাকি এস্টার', value: round(ester, 4), unit: 'mol L⁻¹', digits: 4 },
        { en: 'ln[ester]', bn: 'ln[এস্টার]', value: round(ln, 3), digits: 3 }
      ],
      view: {
        tubes: [
          { label: 'Ester + acid', labelBn: 'এস্টার + অ্যাসিড', liquid: '#e8f2f8', level: 0.5, active: true, sub: `${round(t, 0)} min at ${ESTER_TEMP} °C` }
        ],
        bath: { temp: ESTER_TEMP, tube: 0 },
        clock: { value: t, unit: 'min' },
        caption: 'The bath keeps the mixture at 40 °C.'
      },
      status: status('info', 'Withdraw a sample, titrate it and record the reading.', 'একটি নমুনা নিয়ে টাইট্রেট করে পাঠ রেকর্ড করো।'),
      ready: true
    };
  },
  result: {
    en: 'First-order rate constant k',
    bn: 'প্রথম-ক্রম বিক্রিয়া ধ্রুববই k',
    unit: 'min⁻¹',
    digits: 4,
    compute: (rows: ChemRow[]) => {
      const fit = linearFit(
        rows.map((r) => num(r, 'time') ?? 0),
        rows.map((r) => num(r, 'ln') ?? 0)
      );
      if (!fit) return null;
      return -fit.slope;
    },
    expected: ESTER_K,
    goodWithin: 8
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 9. Synthesis of aspirin — percentage yield                         */
/* ------------------------------------------------------------------ */

const ASP_SAL = 138.12; // g mol⁻¹ (salicylic acid)
const ASP_ASA = 180.16; // g mol⁻¹ (aspirin)
const ASP_YIELD = 78.5; // %

const aspirin: ChemPracticalModel = {
  slug: 'aspirin-synthesis',
  scene: 'heating',
  variant: 'synthesis',
  howTo_en:
    'Heat salicylic acid with acetic anhydride and a drop of sulphuric acid in a water bath, then cool the mixture, add water, filter off the aspirin and dry it to constant mass. Work out the theoretical mass of aspirin from the stoichiometry and compare it with the mass you actually obtained to get the percentage yield.',
  howTo_bn:
    'স্যালিসিলিক অ্যাসিড ও অ্যাসিটিক অ্যানহাইড্রাইডের সঙ্গে এক ফোঁটা সালফিউরিক অ্যাসিড দিয়ে পানির বাথে উত্তাপ করো, তারপর মিশ্রণ ঠান্ডা করে পানি যোগ করো, অ্যাসপিরিন ছেঁকে নিয়ে ধ্রুববই ওজন পর্যন্ত শুকাও। স্টোইকিওমেট্রি থেকে অ্যাসপিরিনের তাত্ত্বিক ভর বের করে প্রাপ্ত ভরের সঙ্গে তুলনা করে শতকরা প্রাপ্তি বের করো।',
  formula: 'theoretical aspirin = (mass salicylic acid ÷ 138.12) × 180.16 · % yield = (mass obtained ÷ theoretical) × 100',
  controls: [
    {
      key: 'mass',
      en: 'Salicylic acid used',
      bn: 'ব্যবহৃত স্যালিসিলিক অ্যাসিড',
      kind: 'condition',
      min: 1,
      max: 5,
      step: 0.1,
      unit: 'g',
      default: 2,
      digits: 2
    },
    {
      key: 'theory',
      en: 'Your calculated theoretical mass of aspirin',
      bn: 'তোমার হিসাব করা অ্যাসপিরিনের তাত্ত্বিক ভর',
      kind: 'condition',
      min: 0,
      max: 6,
      step: 0.05,
      unit: 'g',
      default: 0,
      digits: 2
    }
  ],
  tasks: [{ en: 'Weigh 2.0 g of salicylic acid', bn: '2.0 g স্যালিসিলিক অ্যাসিড ওজন করো', set: { mass: 2 } }],
  columns: [
    { key: 'mass', en: 'Salicylic acid', bn: 'স্যালিসিলিক অ্যাসিড', unit: 'g', digits: 2 },
    { key: 'crystals', en: 'Dried aspirin', bn: 'শুকানো অ্যাসপিরিন', unit: 'g', digits: 2 },
    { key: 'theory', en: 'Theoretical mass', bn: 'তাত্ত্বিক ভর', unit: 'g', digits: 2 },
    { key: 'yield', en: '% yield', bn: '% প্রাপ্তি', digits: 1 }
  ],
  minReadings: 1,
  compute: (p: ChemParams, noise) => {
    const mass = clamp(p.mass, 1, 5);
    const theory = (mass / ASP_SAL) * ASP_ASA;
    const crystals = (theory * ASP_YIELD) / 100 * (1 + noise(0.004));
    const entered = p.theory > 0;
    return {
      row: {
        mass: round(mass, 2),
        crystals: round(crystals, 2),
        theory: entered ? round(p.theory, 2) : round(theory, 2),
        yield: round((crystals / theory) * 100, 1)
      },
      live: [
        { en: 'Salicylic acid', bn: 'স্যালিসিলিক অ্যাসিড', value: round(mass, 2), unit: 'g', digits: 2 },
        { en: 'Dried aspirin', bn: 'শুকানো অ্যাসপিরিন', value: round(crystals, 2), unit: 'g', digits: 2, tone: 'info' },
        { en: 'Theoretical mass', bn: 'তাত্ত্বিক ভর', value: round(theory, 3), unit: 'g', digits: 3 },
        { en: '% yield', bn: '% প্রাপ্তি', value: round((crystals / theory) * 100, 1), unit: '%', digits: 1 }
      ],
      view: {
        kind: 'boil',
        liquid: '#efe4d2',
        level: 0.55,
        temp: 85,
        bubbles: 0.25,
        steam: 0.35,
        flame: 0.4,
        clock: 25,
        clockUnit: 'min',
        curve: { pts: [], cur: { x: 25, y: 85 }, xMax: 30, yMin: 20, yMax: 100, xLabel: 't / min', yLabel: 'T / °C' },
        balance: round(crystals, 2)
      },
      status: entered
        ? status('info', 'Your theoretical mass is recorded — compare it with the mass obtained.', 'তোমার তাত্ত্বিক ভর রেকর্ড হয়েছে — প্রাপ্ত ভরের সঙ্গে তুলনা করো।')
        : status('info', 'Weigh the dried crystals, then calculate the theoretical mass of aspirin.', 'শুকানো স্ফটিক ওজন করো, তারপর অ্যাসপিরিনের তাত্ত্বিক ভর হিসাব করো।'),
      ready: true
    };
  },
  result: {
    en: 'Theoretical mass of aspirin from the salicylic acid',
    bn: 'স্যালিসিলিক অ্যাসিড থেকে অ্যাসপিরিনের তাত্ত্বিক ভর',
    unit: 'g',
    digits: 2,
    compute: (rows: ChemRow[]) => {
      const last = rows[rows.length - 1];
      if (!last) return null;
      const t = num(last, 'theory');
      return t;
    },
    expected: (p) => (clamp(p.mass, 1, 5) / ASP_SAL) * ASP_ASA,
    absolute: true,
    tolerance: 0.08
  },
  solve: (p) => ({ ...p, mass: 2, theory: (2 / ASP_SAL) * ASP_ASA })
};

/* ------------------------------------------------------------------ */
/* 10. Nernst equation — concentration cell                            */
/* ------------------------------------------------------------------ */

const NERNST_C1 = 0.01;
const NERNST_C2 = [0.02, 0.05, 0.1, 0.2];
const NERNST_E = NERNST_C2.map((c) => 0.0296 * Math.log10(c / NERNST_C1));

const nernst: ChemPracticalModel = {
  slug: 'nernst-concentration-cell',
  scene: 'galvanic',
  variant: 'nernst',
  howTo_en:
    'A copper concentration cell has two half-cells filled with copper(II) sulfate of different concentrations, joined by a salt bridge. For copper, E = (0.0591 ÷ 2) log(c₂ ÷ c₁). Work out the EMF of each pair first, then compare it with what the voltmeter shows.',
  howTo_bn:
    'কপার ঘনত্ব কোষে দুটি আলাদা ঘনত্বের কপার(II) সালফেট দ্রবণ দিয়ে দুটি অর্ধ-কোষ ও লবণ সেতু দিয়ে যুক্ত। কপারের জন্য E = (0.0591 ÷ 2) log(c₂ ÷ c₁)। প্রতিটি জোড়ার EMF আগে হিসাব করো, তারপর ভোল্টমিটারের পড়াশোনার সঙ্গে মিলিয়ে দেখো।',
  formula: 'E = (0.0591 ÷ n) log(c₂ ÷ c₁) · n = 2 for Cu²⁺/Cu',
  controls: [
    {
      key: 'c1',
      en: 'Concentration in the left half-cell',
      bn: 'বাম অর্ধ-কোষের ঘনত্ব',
      kind: 'condition',
      default: 0,
      options: [opt(0, '0.0100 M CuSO₄', '0.0100 M CuSO₄'), opt(1, '0.0500 M CuSO₄', '0.0500 M CuSO₄')]
    },
    {
      key: 'c2',
      en: 'Concentration in the right half-cell',
      bn: 'ডান অর্ধ-কোষের ঘনত্ব',
      kind: 'condition',
      default: 0,
      options: NERNST_C2.map((c, i) => opt(i, `${c.toFixed(4)} M CuSO₄`, `${c.toFixed(4)} M CuSO₄`))
    },
    {
      key: 'predict',
      en: 'Your predicted EMF',
      bn: 'তোমার অনুমান করা EMF',
      kind: 'inference',
      default: -1,
      options: [
        CHOOSE,
        opt(0, '0.0089 V', '0.0089 V'),
        opt(1, '0.0207 V', '0.0207 V'),
        opt(2, '0.0296 V', '0.0296 V'),
        opt(3, '0.0385 V', '0.0385 V')
      ]
    }
  ],
  tasks: NERNST_C2.map((c, i) => ({ en: `c₁ = 0.0100 M, c₂ = ${c.toFixed(4)} M`, bn: `c₁ = 0.0100 M, c₂ = ${c.toFixed(4)} M`, set: { c1: 0, c2: i } })),
  columns: [
    { key: 'c1', en: 'c₁', bn: 'c₁', unit: 'mol L⁻¹', digits: 4 },
    { key: 'c2', en: 'c₂', bn: 'c₂', unit: 'mol L⁻¹', digits: 4 },
    { key: 'e', en: 'Cell EMF', bn: 'কোষের EMF', unit: 'V', digits: 4 },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  compute: (p: ChemParams, noise) => {
    const c1i = clamp(Math.round(p.c1), 0, 1);
    const c2i = clamp(Math.round(p.c2), 0, NERNST_C2.length - 1);
    const c1 = c1i === 0 ? 0.01 : 0.05;
    const c2 = NERNST_C2[c2i];
    const e = 0.0296 * Math.log10(c2 / c1);
    const predicted = p.predict >= 0;
    const truth = c2i;
    const correct = predicted && Math.round(p.predict) === truth;
    const shade = (c: number) => {
      const k = Math.min(1, c / 0.2);
      const r = Math.round(120 - 60 * k);
      const g = Math.round(170 - 40 * k);
      const b = Math.round(235 - 30 * k);
      return `rgb(${r},${g},${b})`;
    };
    return {
      row: {
        c1: round(c1, 4),
        c2: round(c2, 4),
        e: round(e, 4),
        check: tick(correct),
        __key: c2i,
        __correct: correct ? 1 : 0
      },
      live: predicted
        ? [
            { en: 'Left half-cell', bn: 'বাম অর্ধ-কোষ', value: `${c1.toFixed(4)} M`, valueBn: `${c1.toFixed(4)} M` },
            { en: 'Right half-cell', bn: 'ডান অর্ধ-কোষ', value: `${c2.toFixed(4)} M`, valueBn: `${c2.toFixed(4)} M` },
            { en: 'Voltmeter', bn: 'ভোল্টমিটার', value: round(e, 4), unit: 'V', digits: 4, tone: 'good' },
            { en: 'Your prediction', bn: 'তোমার অনুমান', value: correct ? 'correct' : 'not yet', valueBn: correct ? 'ঠিক' : 'এখনও নয়' }
          ]
        : [
            { en: 'Left half-cell', bn: 'বাম অর্ধ-কোষ', value: `${c1.toFixed(4)} M`, valueBn: `${c1.toFixed(4)} M` },
            { en: 'Right half-cell', bn: 'ডান অর্ধ-কোষ', value: `${c2.toFixed(4)} M`, valueBn: `${c2.toFixed(4)} M` },
            { en: 'Voltmeter', bn: 'ভোল্টমিটার', value: 'predict first', valueBn: 'আগে অনুমান করো' }
          ],
      view: {
        left: { sym: 'Cu', sol: shade(c1), strip: '#c8763c', salt: `CuSO₄ ${c1.toFixed(4)} M` },
        right: { sym: 'Cu', sol: shade(c2), strip: '#c8763c', salt: `CuSO₄ ${c2.toFixed(4)} M` },
        volts: predicted ? e + noise(0.0008) : 0,
        bridge: true,
        conc: c2
      },
      status: predicted
        ? correct
          ? status('good', `Correct — the Nernst equation gives ${(e * 1000).toFixed(1)} mV.`, `ঠিক — নার্নস্ট সমীকরণ অনুযায়ী ${(e * 1000).toFixed(1)} mV।`)
          : status('bad', 'Not quite — check n = 2 and the direction of the ratio.', 'ঠিক নয় — n = 2 ও অনুপাতের দিক দেখো।')
        : status('info', 'Work out the EMF with the Nernst equation, choose your prediction and then read the voltmeter.', 'নার্নস্ট সমীকরণ দিয়ে EMF বের করো, অনুমান বেছে নাও, তারপর ভোল্টমিটার পড়ো।'),
      ready: predicted,
      correct
    };
  },
  result: {
    en: 'EMF predictions correct',
    bn: 'সঠিক EMF অনুমান',
    unit: '',
    score: true,
    compute: scoreRows,
    expected: 4,
    absolute: true,
    tolerance: 0
  },
  solve: (p) => ({ ...p, predict: clamp(Math.round(p.c2), 0, NERNST_E.length - 1) })
};

export const physicoModels: ChemPracticalModel[] = [
  beerLambert,
  adsorption,
  partition,
  stalagmometer,
  viscometer,
  freezingPoint,
  cellConstant,
  esterKinetics,
  aspirin,
  nernst
];
