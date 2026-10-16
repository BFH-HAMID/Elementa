/**
 * Curve-based chemistry simulations.
 *
 * These practicals are read from a plot rather than from a single colour change:
 * the carbonate double-indicator titration (two end points), the conductometric
 * titration (a V-shaped conductance curve) and the potentiometric redox titration
 * (a potential jump around the equivalence point).
 */
import type { ChemParams, ChemPracticalModel, ChemRow } from './types';
import { clamp, num, opt, points, round, status, tx, twoLineIntersection } from './helpers';

/* ------------------------------------------------------------------ */
/* 1. Double indicator titration of carbonate                           */
/* ------------------------------------------------------------------ */

const CARBONATE_VA = 25;
const CARBONATE_C = 0.1;
const CARBONATE_V1 = 12.5; // phenolphthalein end point (half the carbonate)
const CARBONATE_V2 = 25; // methyl orange end point (all the carbonate)

/** pH of the carbonate solution while HCl is run in. */
function carbonatePh(vb: number): number {
  if (vb <= CARBONATE_V1) return 8.3 + (CARBONATE_V1 - vb) * 0.28;
  return Math.max(2.2, 8.3 - (vb - CARBONATE_V1) * 0.32);
}

const doubleIndicator: ChemPracticalModel = {
  slug: 'double-indicator-carbonate',
  scene: 'titration',
  variant: 'doubleIndicator',
  howTo_en:
    'Titrate 25.0 mL of the carbonate solution with 0.100 M hydrochloric acid. First add phenolphthalein: the pink colour disappears at the first end point where the carbonate has become hydrogen carbonate. Then add methyl orange and continue until the yellow turns orange — the second end point. The two volumes tell you how much carbonate and bicarbonate were present.',
  howTo_bn:
    'কার্বোনেট দ্রবণের 25.0 mL-কে 0.100 M হাইড্রোক্লোরিক অ্যাসিড দিয়ে টাইট্রেট করো। প্রথমে ফেনফথ্যালিন দাও: গোলাপি রং চলে যায় প্রথম শেষ বিন্দুতে, যেখানে কার্বোনেট হাইড্রোজেন কার্বোনেটে পরিণত হয়। তারপর মিথাইল অরেঞ্জ যোগ করে চালিয়ে যাও যতক্ষণ না হলুদ কমলা হয় — দ্বিতীয় শেষ বিন্দু। দুটি আয়তন থেকে কার্বোনেট ও হাইড্রোজেন কার্বোনেটের পরিমাণ পাওয়া যায়।',
  formula: 'CO₃²⁻ + H⁺ → HCO₃⁻ · HCO₃⁻ + H⁺ → H₂CO₃ → H₂O + CO₂ · C(CO₃²⁻) = C(HCl) × V(2nd end point) ÷ V(sample)',
  controls: [
    {
      key: 'ind',
      en: 'Indicator in the flask',
      bn: 'ফ্লাস্কের নির্দেশক',
      kind: 'view',
      default: 0,
      options: [opt(0, 'Phenolphthalein', 'ফেনফথ্যালিন'), opt(1, 'Methyl orange', 'মিথাইল অরেঞ্জ')]
    },
    {
      key: 'vol',
      en: 'HCl run in from the burette',
      bn: 'বুরেট থেকে যোগ করা HCl',
      kind: 'time',
      min: 0,
      max: 30,
      step: 0.05,
      unit: 'mL',
      default: 0,
      fine: true,
      digits: 2
    }
  ],
  tasks: [
    { en: 'Phenolphthalein end point', bn: 'ফেনফথ্যালিন শেষ বিন্দু', set: { ind: 0, vol: CARBONATE_V1 } },
    { en: 'Methyl orange end point', bn: 'মিথাইল অরেঞ্জ শেষ বিন্দু', set: { ind: 1, vol: CARBONATE_V2 } }
  ],
  columns: [
    { key: 'ind', en: 'Indicator', bn: 'নির্দেশক' },
    { key: 'vol', en: 'HCl added', bn: 'যোগ করা HCl', unit: 'mL', digits: 2 },
    { key: 'colour', en: 'Colour', bn: 'রং' },
    { key: 'ph', en: 'pH', bn: 'pH', digits: 2 }
  ],
  minReadings: 2,
  compute: (p: ChemParams, noise) => {
    const ind = clamp(Math.round(p.ind), 0, 1);
    const vol = clamp(p.vol, 0, 30);
    const ph = carbonatePh(vol) + noise(0.03);
    let color = '#eef3f7';
    let text = { en: 'Colourless', bn: 'বর্ণহীন' };
    if (ind === 0) {
      if (vol < CARBONATE_V1) {
        color = '#f9c9de';
        text = { en: 'Pink — carbonate is still changing to hydrogen carbonate', bn: 'গোলাপি — কার্বোনেট এখনও হাইড্রোজেন কার্বোনেটে পরিণত হচ্ছে' };
      } else {
        color = '#eef3f7';
        text = { en: 'Colourless — the phenolphthalein end point is passed', bn: 'বর্ণহীন — ফেনফথ্যালিন শেষ বিন্দু পেরিয়ে গেছে' };
      }
    } else if (vol < CARBONATE_V2) {
      color = '#f7d44a';
      text = { en: 'Yellow — hydrogen carbonate is still being neutralised', bn: 'হলুদ — হাইড্রোজেন কার্বোনেট এখনও প্রশমিত হচ্ছে' };
    } else if (vol < CARBONATE_V2 + 0.4) {
      color = '#f2913c';
      text = { en: 'Orange — the methyl orange end point', bn: 'কমলা — মিথাইল অরেঞ্জ শেষ বিন্দু' };
    } else {
      color = '#e2453c';
      text = { en: 'Red — too much acid', bn: 'লাল — অতিরিক্ত অ্যাসিড' };
    }
    return {
      row: {
        ...tx('ind', ind === 0 ? 'Phenolphthalein' : 'Methyl orange', ind === 0 ? 'ফেনফথ্যালিন' : 'মিথাইল অরেঞ্জ'),
        vol: round(vol + noise(0.03), 2),
        ...tx('colour', text.en, text.bn),
        ph: round(ph, 2),
        __ind: ind
      },
      live: [
        { en: 'HCl added', bn: 'যোগ করা HCl', value: round(vol, 2), unit: 'mL', digits: 2 },
        { en: 'pH meter', bn: 'pH মিটার', value: ph, digits: 2, tone: ph < 6.5 ? 'info' : ph > 7.5 ? 'warn' : 'good' },
        { en: 'Indicator colour', bn: 'নির্দেশকের রং', value: text.en, valueBn: text.bn },
        { en: 'Indicator', bn: 'নির্দেশক', value: ind === 0 ? 'Phenolphthalein' : 'Methyl orange', valueBn: ind === 0 ? 'ফেনফথ্যালিন' : 'মিথাইল অরেঞ্জ' }
      ],
      view: {
        vessel: 'flask',
        liquid: color,
        level: clamp((CARBONATE_VA + vol) / 90, 0.12, 0.95),
        bubbles: vol < CARBONATE_V2 ? 0.35 : 0.05,
        burette: { reading: round(vol, 2), max: 30, color: '#eef5ff', label: 'HCl 0.100 M' },
        flaskLabel: 'Na₂CO₃ 25.0 mL',
        meter: ph,
        endpoint: (ind === 0 && vol >= CARBONATE_V1) || (ind === 1 && vol >= CARBONATE_V2 && vol < CARBONATE_V2 + 0.4)
      },
      status:
        ind === 0 && vol < CARBONATE_V1
          ? status('info', 'Pink: keep adding acid until the pink just vanishes.', 'গোলাপি: গোলাপি ঠিক মিলিয়ে যাওয়া পর্যন্ত অ্যাসিড যোগ করতে থাকো।')
          : ind === 0
            ? status('good', 'Colourless — the phenolphthalein end point is reached. Record it.', 'বর্ণহীন — ফেনফথ্যালিন শেষ বিন্দু পৌঁছেছে। রেকর্ড করো।')
            : vol < CARBONATE_V2
              ? status('info', 'Yellow: the second stage is still running.', 'হলুদ: দ্বিতীয় ধাপ এখনও চলছে।')
              : status('good', 'Orange — the methyl orange end point is reached. Record it.', 'কমলা — মিথাইল অরেঞ্জ শেষ বিন্দু পৌঁছেছে। রেকর্ড করো।'),
      ready: true
    };
  },
  result: {
    en: 'Concentration of the carbonate solution',
    bn: 'কার্বোনেট দ্রবণের ঘনত্ব',
    unit: 'mol L⁻¹',
    digits: 4,
    compute: (rows: ChemRow[]) => {
      const mo = [...rows].reverse().find((r) => num(r, '__ind') === 1);
      const vol = mo ? num(mo, 'vol') : null;
      if (vol === null) return null;
      return (CARBONATE_C * vol) / CARBONATE_VA;
    },
    expected: 0.1,
    goodWithin: 2
  },
  solve: (p) => ({ ...p, vol: Math.round(p.ind) === 0 ? CARBONATE_V1 : CARBONATE_V2 })
};

/* ------------------------------------------------------------------ */
/* 2. Conductometric titration of a strong acid                        */
/* ------------------------------------------------------------------ */

const COND_VA = 25;
const COND_C = 0.05;
const COND_VEQ = 25;

/** Conductance (mS cm⁻¹) while NaOH is run into HCl. */
function conductanceAt(vb: number): number {
  if (vb <= COND_VEQ) return 17.48 - 0.6 * vb;
  return 2.48 + 0.396 * (vb - COND_VEQ);
}

const conductometric: ChemPracticalModel = {
  slug: 'conductometric-titration',
  scene: 'titration',
  variant: 'conductometric',
  howTo_en:
    'A conductivity cell is dipped into 25.0 mL of 0.0500 M hydrochloric acid and 0.0500 M sodium hydroxide is run in from the burette. Read the conductance at each volume and plot it: the conductance falls while the acid is neutralised and rises again once sodium hydroxide is in excess, so the break in the curve is the equivalence point.',
  howTo_bn:
    'পরিবাহিতা সেল 0.0500 M হাইড্রোক্লোরিক অ্যাসিডের 25.0 mL-এ ডুবিয়ে বুরেট থেকে 0.0500 M সোডিয়াম হাইড্রোক্সাইড যোগ করো। প্রতিটি আয়তনে পরিবাহিতা পড়ে লেখচিত্র আঁকো: অ্যাসিড প্রশম হওয়ার আগে পরিবাহিতা কমে এবং NaOH বেশি হলে আবার বাড়ে, তাই লেখচিত্রের ভাঙা জায়গাটিই সমতুল্যবিন্দু।',
  formula: 'G = κ · cell constant · A / l · equivalence point = the break in the G–V curve',
  controls: [
    {
      key: 'vol',
      en: 'NaOH run in from the burette',
      bn: 'বুরেট থেকে যোগ করা NaOH',
      kind: 'time',
      min: 0,
      max: 50,
      step: 0.05,
      unit: 'mL',
      default: 0,
      fine: true,
      digits: 2
    }
  ],
  tasks: [0, 5, 10, 15, 20, 23, 24, 25, 26, 28, 32, 40, 50].map((v) => ({ en: `${v} mL of NaOH`, bn: `NaOH ${v} mL`, set: { vol: v } })),
  columns: [
    { key: 'vol', en: 'V(NaOH)', bn: 'V(NaOH)', unit: 'mL', digits: 1 },
    { key: 'kappa', en: 'Conductance', bn: 'পরিবাহিতা', unit: 'mS cm⁻¹', digits: 3 },
    { key: 'ph', en: 'pH', bn: 'pH', digits: 2 }
  ],
  minReadings: 8,
  graph: { x: 'vol', y: 'kappa', kind: 'line' },
  compute: (p: ChemParams, noise, ctx) => {
    const vol = clamp(p.vol, 0, 50);
    const kappa = conductanceAt(vol) + noise(0.05);
    const ph = 1.3 + (vol >= COND_VEQ ? Math.min(1.6, (vol - COND_VEQ) * 0.12) : 0);
    const pts = points(ctx.rows, 'vol', 'kappa');
    return {
      row: { vol: round(vol, 1), kappa: round(kappa, 3), ph: round(ph, 2) },
      live: [
        { en: 'NaOH added', bn: 'যোগ করা NaOH', value: round(vol, 2), unit: 'mL', digits: 2 },
        { en: 'Conductance', bn: 'পরিবাহিতা', value: round(kappa, 3), unit: 'mS cm⁻¹', digits: 3, tone: vol < COND_VEQ ? 'info' : 'warn' },
        { en: 'pH', bn: 'pH', value: round(ph, 2), digits: 2 },
        {
          en: 'Trend',
          bn: 'পরিবর্তন',
          value: vol < COND_VEQ ? 'falling' : 'rising',
          valueBn: vol < COND_VEQ ? 'কমছে' : 'বাড়ছে',
          tone: vol < COND_VEQ ? 'info' : 'warn'
        }
      ],
      view: {
        vessel: 'flask',
        liquid: vol < COND_VEQ ? '#e7f2fb' : '#eef3f8',
        level: clamp((COND_VA + vol) / 90, 0.12, 0.95),
        burette: { reading: round(vol, 2), max: 50, color: '#eef5ff', label: 'NaOH 0.0500 M' },
        flaskLabel: 'HCl 0.0500 M 25.0 mL + cell',
        meter: kappa,
        meterLabel: 'conductance meter',
        meterUnit: 'mS',
        meterDigits: 2,
        curve: { pts, cur: { x: vol, y: kappa }, xMax: 50, yMin: 0, yMax: 20, xLabel: 'V / mL', yLabel: 'G' }
      },
      status:
        vol < COND_VEQ
          ? status('info', 'The conductance is falling — the fast H⁺ ions are being replaced by slow Na⁺ ions.', 'পরিবাহিতা কমছে — দ্রুত H⁺ আয়নের বদলে ধীর Na⁺ আয়ন আসছে।')
          : status('good', 'The conductance is rising again — the break in the curve is the equivalence point.', 'পরিবাহিতা আবার বাড়ছে — লেখচিত্রের ভাঙা জায়গাই সমতুল্যবিন্দু।'),
      ready: true
    };
  },
  result: {
    en: 'Equivalence volume from the conductance curve',
    bn: 'পরিবাহিতা লেখচিত্র থেকে সমতুল্যবিন্দুর আয়তন',
    unit: 'mL',
    digits: 2,
    compute: (rows: ChemRow[]) => {
      const hit = twoLineIntersection(points(rows, 'vol', 'kappa'));
      return hit ? hit.x : null;
    },
    expected: COND_VEQ,
    absolute: true,
    tolerance: 0.8
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 3. Potentiometric titration of iron(II) with cerium(IV)            */
/* ------------------------------------------------------------------ */

const POT_VA = 25;
const POT_VEQ = 25;
const E_FE = 0.68; // V, Fe³⁺/Fe²⁺ in 1 M H₂SO₄
const E_CE = 1.44; // V, Ce⁴⁺/Ce³⁺ in 1 M H₂SO₄

/** Potential of the platinum electrode (V) while Ce(IV) titrates Fe(II). */
function potentialAt(vb: number): number {
  const before = clamp(E_FE + 0.0592 * Math.log10(Math.max(vb, 0.02) / Math.max(POT_VEQ - vb, 0.02)), 0.3, 1.3);
  const after = clamp(E_CE + 0.0592 * Math.log10(Math.max(vb - POT_VEQ, 0.02) / POT_VEQ), 0.95, 1.6);
  const w = 1 / (1 + Math.exp((vb - POT_VEQ) / 0.4));
  return w * before + (1 - w) * after;
}

const potentiometric: ChemPracticalModel = {
  slug: 'potentiometric-redox-titration',
  scene: 'titration',
  variant: 'potentiometric',
  howTo_en:
    'A platinum electrode is dipped into 25.0 mL of the iron(II) solution and 0.0200 M cerium(IV) is run in from the burette. Record the cell potential at each volume: the potential stays low while Fe²⁺ is left, then jumps sharply around the equivalence point and levels off again when Ce⁴⁺ is in excess.',
  howTo_bn:
    'আয়রন(II) দ্রবণের 25.0 mL-এ একটি প্লাটিনাম ইলেকট্রোড ডোবানো হয় এবং বুরেট থেকে 0.0200 M সেরিয়াম(IV) যোগ করা হয়। প্রতিটি আয়তনে কোষের বিভব লিখে রাখো: Fe²⁺ থাকা অবস্থায় বিভব কম থাকে, সমতুল্যবিন্দুর আশেপাশে তীব্রভাবে বাড়ে এবং Ce⁴⁺ বেশি হলে আবার স্থির হয়।',
  formula: 'E = E° + 0.059 log([oxidised] ÷ [reduced]) · equivalence point = the steepest part of the E–V curve',
  controls: [
    {
      key: 'vol',
      en: 'Ce(IV) run in from the burette',
      bn: 'বুরেট থেকে যোগ করা Ce(IV)',
      kind: 'time',
      min: 0,
      max: 40,
      step: 0.05,
      unit: 'mL',
      default: 0,
      fine: true,
      digits: 2
    }
  ],
  tasks: [0, 5, 10, 15, 20, 23, 24, 25, 26, 27, 30, 35, 40].map((v) => ({ en: `${v} mL of Ce(IV)`, bn: `Ce(IV) ${v} mL`, set: { vol: v } })),
  columns: [
    { key: 'vol', en: 'V(Ce⁴⁺)', bn: 'V(Ce⁴⁺)', unit: 'mL', digits: 1 },
    { key: 'e', en: 'Cell potential', bn: 'কোষের বিভব', unit: 'V', digits: 3 },
    { key: 'jump', en: 'Region', bn: 'অঞ্চল' }
  ],
  minReadings: 8,
  graph: { x: 'vol', y: 'e', kind: 'line' },
  compute: (p: ChemParams, noise, ctx) => {
    const vol = clamp(p.vol, 0, 40);
    const e = potentialAt(vol) + noise(0.004);
    const pts = points(ctx.rows, 'vol', 'e');
    const region = Math.abs(vol - POT_VEQ) < 1.5 ? 'jump' : vol < POT_VEQ ? 'Fe²⁺ left' : 'Ce⁴⁺ excess';
    return {
      row: {
        vol: round(vol, 1),
        e: round(e, 3),
        ...tx('jump', region === 'jump' ? 'potential jump' : region === 'Fe²⁺ left' ? 'Fe²⁺ still present' : 'Ce⁴⁺ in excess', region === 'jump' ? 'বিভবের চাপ' : region === 'Fe²⁺ left' ? 'Fe²⁺ এখনও আছে' : 'Ce⁴⁺ অতিরিক্ত')
      },
      live: [
        { en: 'Ce(IV) added', bn: 'যোগ করা Ce(IV)', value: round(vol, 2), unit: 'mL', digits: 2 },
        { en: 'Cell potential', bn: 'কোষের বিভব', value: round(e, 3), unit: 'V', digits: 3, tone: Math.abs(vol - POT_VEQ) < 1 ? 'good' : 'info' },
        { en: 'Indicator', bn: 'নির্দেশক', value: 'Pt electrode', valueBn: 'Pt ইলেকট্রোড' }
      ],
      view: {
        vessel: 'flask',
        liquid: vol < POT_VEQ ? '#cfe4f2' : '#e4dcef',
        level: clamp((POT_VA + vol) / 90, 0.12, 0.95),
        burette: { reading: round(vol, 2), max: 40, color: '#f0e6fa', label: 'Ce(IV) 0.0200 M' },
        flaskLabel: 'Fe²⁺ 25.0 mL + Pt electrode',
        meter: e,
        meterLabel: 'potentiometer',
        meterUnit: 'V',
        meterDigits: 3,
        curve: { pts, cur: { x: vol, y: e }, xMax: 40, yMin: 0, yMax: 1.7, xLabel: 'V / mL', yLabel: 'E / V' }
      },
      status:
        Math.abs(vol - POT_VEQ) < 1
          ? status('good', 'The potential is jumping steeply — the equivalence point is here.', 'বিভব তীব্রভাবে বাড়ছে — সমতুল্যবিন্দু এখানেই।')
          : vol < POT_VEQ
            ? status('info', 'Fe²⁺ is still being oxidised to Fe³⁺.', 'Fe²⁺ এখনও Fe³⁺-এ অক্সিডাইজ হচ্ছে।')
            : status('info', 'Ce⁴⁺ is now in excess.', 'Ce⁴⁺ এখন অতিরিক্ত।'),
      ready: true
    };
  },
  result: {
    en: 'Equivalence volume from the potential curve',
    bn: 'বিভব লেখচিত্র থেকে সমতুল্যবিন্দুর আয়তন',
    unit: 'mL',
    digits: 2,
    compute: (rows: ChemRow[]) => {
      const pts = points(rows, 'vol', 'e').sort((a, b) => a.x - b.x);
      let best: { x: number; slope: number } | null = null;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        if (dx <= 0) continue;
        const slope = (pts[i].y - pts[i - 1].y) / dx;
        if (!best || slope > best.slope) best = { x: (pts[i].x + pts[i - 1].x) / 2, slope };
      }
      return best ? best.x : null;
    },
    expected: POT_VEQ,
    absolute: true,
    tolerance: 0.9
  },
  solve: (p) => p
};

export const curveModels: ChemPracticalModel[] = [doubleIndicator, conductometric, potentiometric];
