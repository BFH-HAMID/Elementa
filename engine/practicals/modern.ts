import type { PracticalModel } from './types';
import { fitRows, round } from './helpers';

/* ------------------------------------------------------------------ */
/* Photoelectric effect — Planck's constant                             */
/* ------------------------------------------------------------------ */

const H = 6.62607015e-34;
const C = 2.99792458e8;
const E = 1.602176634e-19;

export const CATHODES = [
  { en: 'Potassium (Φ 2.30 eV)', bn: 'পটাশিয়াম (Φ 2.30 eV)', phi: 2.3 },
  { en: 'Caesium (Φ 2.14 eV)', bn: 'সিজিয়াম (Φ 2.14 eV)', phi: 2.14 },
  { en: 'Sodium (Φ 2.36 eV)', bn: 'সোডিয়াম (Φ 2.36 eV)', phi: 2.36 }
];
export const HG_LINES = [365, 405, 436, 492, 546, 578];

export function stoppingPotential(lambdaNm: number, phi: number) {
  return (H * C) / (lambdaNm * 1e-9 * E) - phi;
}

export function photoCurrent(lambdaNm: number, phi: number, v: number) {
  const v0 = stoppingPotential(lambdaNm, phi);
  if (v0 <= 0 || v >= v0) return 0;
  return 2.5 * Math.pow((v0 - v) / v0, 1.5);
}

export const photoelectric: PracticalModel = {
  slug: 'photoelectric-effect',
  scene: 'photoelectric',
  animated: true,
  howTo_en: 'Choose a filter (wavelength). Increase the retarding voltage until the photocurrent just becomes zero — that is the stopping potential V₀. Record for each filter.',
  howTo_bn: 'একটি ফিল্টার (তরঙ্গদৈর্ঘ্য) বাছাই করো। প্রতিরোধী ভোল্টেজ বাড়াও যতক্ষণ না ফটোকারেন্ট ঠিক শূন্য হয় — সেটি নিবৃত্তি বিভব V₀। প্রতিটি ফিল্টারের জন্য রেকর্ড করো।',
  controls: [
    { key: 'cathode', en: 'Cathode', bn: 'ক্যাথোড', default: 0, options: CATHODES.map((c, i) => ({ value: i, en: c.en, bn: c.bn })) },
    { key: 'lambda', en: 'Filter wavelength', bn: 'ফিল্টারের তরঙ্গদৈর্ঘ্য', default: 436, options: HG_LINES.map((l) => ({ value: l, en: `${l} nm`, bn: `${l} nm` })) },
    { key: 'v', en: 'Retarding voltage', bn: 'প্রতিরোধী ভোল্টেজ', min: 0, max: 2.5, step: 0.01, unit: 'V', default: 0, fine: true, digits: 2 }
  ],
  sweep: { key: 'lambda', values: [365, 405, 436, 492] },
  minReadings: 4,
  compute(p, noise) {
    const cath = CATHODES[p.cathode] || CATHODES[0];
    const v0 = stoppingPotential(p.lambda, cath.phi);
    const I = photoCurrent(p.lambda, cath.phi, p.v);
    const nu = C / (p.lambda * 1e-9);
    const emits = v0 > 0;
    const justStopped = emits && I === 0 && p.v - v0 <= 0.03;
    const vm = p.v + noise(0.004);
    return {
      row: {
        lambdaNm: p.lambda,
        freqNu: round(nu / 1e14, 3),
        stoppingPotV: round(vm, 3),
        hCalc: round(((E * (vm + cath.phi)) / nu) * 1e34, 3)
      },
      live: [
        { en: 'Photocurrent', bn: 'ফটোকারেন্ট', value: I, unit: 'µA', digits: 3, tone: I === 0 ? 'good' : 'info' },
        { en: 'Frequency ν', bn: 'কম্পাঙ্ক ν', value: nu / 1e14, unit: '×10¹⁴ Hz', digits: 3 },
        { en: 'Photon energy', bn: 'ফোটন শক্তি', value: (H * nu) / E, unit: 'eV', digits: 2 }
      ],
      view: { lambda: p.lambda, v: p.v, I, v0, emits: emits ? 1 : 0 },
      status: !emits
        ? { en: 'Photon energy below the work function — no photoelectrons. Choose a shorter wavelength.', bn: 'ফোটনের শক্তি কার্যাপেক্ষকের চেয়ে কম — ফটোইলেকট্রন নেই। ছোট তরঙ্গদৈর্ঘ্য বাছাই করো।', tone: 'warn' }
        : justStopped
          ? { en: 'Current just reached zero — this is V₀. Record!', bn: 'কারেন্ট ঠিক শূন্য হয়েছে — এটিই V₀। রেকর্ড করো!', tone: 'good' }
          : I > 0
            ? { en: 'Current still flowing — increase the retarding voltage.', bn: 'কারেন্ট এখনও চলছে — প্রতিরোধী ভোল্টেজ বাড়াও।', tone: 'info' }
            : { en: 'Too far — reduce the voltage until the current just vanishes.', bn: 'বেশি হয়ে গেছে — ভোল্টেজ কমাও যেন কারেন্ট ঠিক শূন্য হয়।', tone: 'warn' },
      ready: justStopped
    };
  },
  solve: (p) => {
    const cath = CATHODES[p.cathode] || CATHODES[0];
    const v0 = stoppingPotential(p.lambda, cath.phi);
    return { ...p, v: Math.ceil(v0 * 100 + 1e-9) / 100 };
  },
  result: {
    en: "Planck's constant h (slope of V₀–ν × e)",
    bn: 'প্ল্যাঙ্ক ধ্রুবক h (V₀–ν ঢাল × e)',
    unit: '×10⁻³⁴ J·s',
    digits: 3,
    compute(rows) {
      const fit = fitRows(rows, 'freqNu', 'stoppingPotV');
      if (!fit) return null;
      // slope in V per 10¹⁴ Hz → h = e·slope / 10¹⁴, expressed in 10⁻³⁴ J·s
      return E * fit.slope * 1e20;
    },
    expected: H * 1e34
  }
};

/* ------------------------------------------------------------------ */
/* GM counter — inverse square law                                      */
/* ------------------------------------------------------------------ */

const GM = { K: 50000, background: 20 };

export const gmCounter: PracticalModel = {
  slug: 'radioactive-decay-gm-counter',
  scene: 'gmCounter',
  animated: true,
  howTo_en: 'Move the source along the rail and count for one minute at each distance r. Subtract the background (20 cpm) and record. Net count ∝ 1/r².',
  howTo_bn: 'উৎসটি রেলের উপর সরাও এবং প্রতিটি দূরত্ব r এ এক মিনিট গণনা করো। পটভূমি (২০ cpm) বাদ দিয়ে রেকর্ড করো। নিট গণনা ∝ 1/r²।',
  controls: [{ key: 'r', en: 'Source distance r', bn: 'উৎসের দূরত্ব r', min: 4, max: 30, step: 1, unit: 'cm', default: 6, fine: true }],
  sweep: { key: 'r', values: [6, 8, 10, 14, 20] },
  minReadings: 5,
  compute(p, noise) {
    const rate = GM.K / (p.r * p.r) + GM.background;
    const counted = Math.max(0, Math.round(rate + noise(Math.sqrt(rate))));
    return {
      row: { distR: p.r, invRSq: round(1 / (p.r * p.r), 4), netCpm: counted - GM.background },
      live: [
        { en: 'Count rate', bn: 'গণনার হার', value: rate, unit: 'cpm', digits: 0 },
        { en: 'Background', bn: 'পটভূমি', value: GM.background, unit: 'cpm', tone: 'info' },
        { en: '1/r²', bn: '1/r²', value: 1 / (p.r * p.r), unit: 'cm⁻²', digits: 4 }
      ],
      view: { r: p.r, rate },
      ready: true
    };
  },
  result: {
    en: 'Source constant K (net cpm × r²)',
    bn: 'উৎস ধ্রুবক K (নিট cpm × r²)',
    unit: 'cpm·cm²',
    digits: 0,
    compute(rows) {
      let sxy = 0;
      let sxx = 0;
      for (const r of rows) {
        const d = Number(r.distR);
        const n = Number(r.netCpm);
        if (!(d > 0) || !Number.isFinite(n)) continue;
        const x = 1 / (d * d);
        sxy += x * n;
        sxx += x * x;
      }
      return sxx > 0 ? sxy / sxx : null;
    },
    expected: GM.K
  }
};

export const modernModels: PracticalModel[] = [photoelectric, gmCounter];
