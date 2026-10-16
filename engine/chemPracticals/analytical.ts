/**
 * Analytical chemistry simulations — the volumetric-titration family.
 *
 * These practicals all share one shape: a pipetted sample in a conical flask, a
 * burette of the standard reagent, an end point marked by a colour change, and a
 * concentration that follows from the titre. `buretteModel()` builds that shape so
 * each practical only has to describe its own chemistry; the special cases
 * (two end points, conductance and potentiometric curves) are written out in full.
 */
import { endPointStatus } from './acidBase';
import type { ChemLiveReading, ChemParams, ChemPracticalModel, ChemRow } from './types';
import { bnNum, clamp, concordantMean, num, opt, round, status, tx } from './helpers';

/* ------------------------------------------------------------------ */
/* Shared burette-titration builder                                    */
/* ------------------------------------------------------------------ */

export interface BuretteSpec {
  slug: string;
  variant: string;
  howTo_en: string;
  howTo_bn: string;
  formula: string;
  /** What is in the burette. */
  titrantEn: string;
  titrantBn: string;
  /** Titrant concentration (mol L⁻¹). */
  titrantConc: number;
  /** What is in the flask. */
  flaskEn: string;
  flaskBn: string;
  /** Pipetted sample volume (mL). */
  flaskVol: number;
  /** Titrant volume at the end point (mL). */
  veq: number;
  /** Largest volume the burette can deliver (mL). */
  max: number;
  /** mol titrant consumed per mol of the unknown. */
  nRatio: number;
  /** Solution colour and message before the end point. */
  pre?: { color: string; en: string; bn: string };
  /** Colour and message at the end point. */
  at?: { color: string; en: string; bn: string };
  /** Colour and message past the end point. */
  over?: { color: string; en: string; bn: string };
  /** Result wording. */
  resultEn: string;
  resultBn: string;
  resultUnit: string;
  resultDigits?: number;
  /** Accepted value of the result. */
  expected: number;
  /** Custom result from the mean titre (defaults to the unknown concentration). */
  computeResult?: (meanTitre: number) => number;
  /** Starch indicator tag in the scene. */
  starch?: boolean;
  /** Suspended precipitate (0–1). */
  cloud?: number;
  /** Number of titration trials. */
  trials?: number;
  /** Burette reading at the start of each trial. */
  initials?: number[];
  /** Custom colour/message as a function of the signed excess titrant (mL). */
  custom?: (excess: number, stage: 'far' | 'near' | 'end' | 'over') => { color: string; en: string; bn: string };
}

/** Mean of the titres already recorded (used for the live summary). */
function meanTitre(rows: ChemRow[]): number | null {
  const titres = rows.map((r) => num(r, 'titre')).filter((v): v is number => v !== null);
  if (!titres.length) return null;
  return concordantMean(titres, 0.2);
}

export function buretteModel(spec: BuretteSpec): ChemPracticalModel {
  const trials = spec.trials ?? 3;
  const initials = spec.initials ?? [0, 0, 0];
  const max = spec.max;

  const look = (excess: number, stage: 'far' | 'near' | 'end' | 'over') => {
    if (spec.custom) return spec.custom(excess, stage);
    if (stage === 'end' && spec.at) return spec.at;
    if (stage === 'over' && spec.over) return spec.over;
    return spec.pre ?? { color: '#eef4fa', en: 'Colourless', bn: 'বর্ণহীন' };
  };

  return {
    slug: spec.slug,
    scene: 'titration',
    variant: spec.variant,
    howTo_en: spec.howTo_en,
    howTo_bn: spec.howTo_bn,
    formula: spec.formula,
    controls: [
      {
        key: 'trial',
        en: 'Titration',
        bn: 'টাইট্রেশন',
        default: 1,
        options: Array.from({ length: trials }, (_, i) => opt(i + 1, `Trial ${i + 1}`, `ট্রায়াল ${bnNum(i + 1)}`))
      },
      {
        key: 'vol',
        en: 'Titrant run in from the burette',
        bn: 'বুরেট থেকে যোগ করা টাইট্রেন্ট',
        kind: 'time',
        min: 0,
        max,
        step: 0.05,
        unit: 'mL',
        default: 0,
        fine: true,
        digits: 2
      }
    ],
    tasks: Array.from({ length: trials }, (_, i) => ({ en: `Trial ${i + 1}`, bn: `ট্রায়াল ${bnNum(i + 1)}`, set: { trial: i + 1 } })),
    columns: [
      { key: 'trial', en: 'Trial', bn: 'ট্রায়াল' },
      { key: 'initial', en: 'Initial reading', bn: 'প্রাথমিক পাঠ', unit: 'mL', digits: 2 },
      { key: 'final', en: 'Final reading', bn: 'চূড়ান্ত পাঠ', unit: 'mL', digits: 2 },
      { key: 'titre', en: 'Titre', bn: 'টাইটার', unit: 'mL', digits: 2 },
      { key: 'obs', en: 'Observation', bn: 'পর্যবেক্ষণ' }
    ],
    minReadings: 3,
    compute: (p: ChemParams, noise, ctx) => {
      const trial = clamp(Math.round(p.trial), 1, trials);
      const vol = clamp(p.vol, 0, max);
      const initial = initials[trial - 1] ?? 0;
      const excess = vol - spec.veq;
      const stage = endPointStatus(excess);
      const look0 = look(excess, stage);
      const err = noise(0.03);
      const titre = round(vol + err, 2);
      const mean = meanTitre(ctx.rows);
      const live: ChemLiveReading[] = [
        { en: 'Burette reading', bn: 'বুরেট পাঠ', value: round(initial + vol, 2), unit: 'mL', digits: 2 },
        { en: 'Titre so far', bn: 'এখন পর্যন্ত টাইটার', value: round(vol, 2), unit: 'mL', digits: 2 },
        { en: 'Flask colour', bn: 'ফ্লাস্কের রং', value: look0.en, valueBn: look0.bn, tone: stage === 'end' ? 'good' : stage === 'over' ? 'bad' : undefined },
        { en: 'Trial', bn: 'ট্রায়াল', value: trial }
      ];
      if (mean !== null) {
        live.push({
          en: 'Mean titre so far',
          bn: 'এখন পর্যন্ত গড় টাইটার',
          value: round(mean, 2),
          unit: 'mL',
          digits: 2,
          tone: 'info'
        });
      }
      return {
        row: {
          trial,
          initial: round(initial, 2),
          final: round(initial + titre, 2),
          titre,
          ...tx('obs', look0.en, look0.bn)
        },
        live,
        view: {
          vessel: 'flask',
          liquid: look0.color,
          level: clamp((spec.flaskVol + vol) / 90, 0.12, 0.95),
          cloud: spec.cloud ?? 0,
          burette: { reading: round(initial + vol, 2), max, color: '#eef5ff', label: spec.titrantEn },
          flaskLabel: spec.flaskEn,
          endpoint: stage === 'end',
          starch: spec.starch
        },
        status:
          stage === 'end'
            ? status('good', `${spec.at?.en ?? 'End point reached'} Record this reading.`, `${spec.at?.bn ?? 'শেষ বিন্দু পৌঁছেছে'} এই পাঠটি রেকর্ড করো।`)
            : stage === 'over'
              ? status('bad', `${spec.over?.en ?? 'Past the end point'} You have gone past the end point.`, `${spec.over?.bn ?? 'শেষ বিন্দু ছাড়িয়ে গেছ'} তুমি শেষ বিন্দু ছাড়িয়ে গেছ।`)
              : stage === 'near'
                ? status('info', 'Almost there — one more drop and the end point will show.', 'প্রায় হয়ে এসেছে — আরেকটি ফোঁটা দিলেই শেষ বিন্দু দেখা যাবে।')
                : status('info', `${spec.pre?.en ?? 'Keep titrating.'} Keep titrating.`, `${spec.pre?.bn ?? 'টাইট্রেশন চালিয়ে যাও।'} টাইট্রেশন চালিয়ে যাও।`),
        ready: true
      };
    },
    result: {
      en: spec.resultEn,
      bn: spec.resultBn,
      unit: spec.resultUnit,
      digits: spec.resultDigits ?? 4,
      compute: (rows) => {
        const mean = meanTitre(rows);
        if (mean === null) return null;
        return spec.computeResult ? spec.computeResult(mean) : (spec.titrantConc * mean) / (spec.nRatio * spec.flaskVol);
      },
      expected: spec.expected,
      goodWithin: 2
    },
    solve: (p) => ({ ...p, vol: spec.veq })
  };
}

/* ------------------------------------------------------------------ */
/* 1. Mohr — chloride by silver nitrate with chromate indicator       */
/* ------------------------------------------------------------------ */

const mohr = buretteModel({
  slug: 'mohr-chloride-titration',
  variant: 'mohr',
  howTo_en:
    'Pipette 25.0 mL of the chloride solution into a conical flask, add the potassium chromate indicator and a little nitric acid, and titrate with 0.100 M silver nitrate. A white AgCl precipitate forms first; the end point is the first permanent brick-red Ag₂CrO₄ that stays in the supernatant after swirling.',
  howTo_bn:
    'ক্লোরাইড দ্রবণের 25.0 mL পিপেট করে কোনিক্যাল ফ্লাস্কে নাও, পটাসিয়াম ক্রোমেট নির্দেশক ও সামান্য নাইট্রিক অ্যাসিড যোগ করো, তারপর 0.100 M সিলভার নাইট্রেট দিয়ে টাইট্রেট করো। প্রথমে সাদা AgCl অধক্ষেপ পড়ে; শেষ বিন্দু হলো ঘুরিয়ে ফেলার পরও অবশিষ্ট তরলে থেকে যাওয়া প্রথম স্থায়ী ইট-লাল Ag₂CrO₄।',
  formula: 'Ag⁺ + Cl⁻ → AgCl(s) · 2Ag⁺ + CrO₄²⁻ → Ag₂CrO₄(s) · C(Cl⁻) = C(AgNO₃) × V(AgNO₃) ÷ V(sample)',
  titrantEn: 'AgNO₃ 0.100 M',
  titrantBn: 'AgNO₃ 0.100 M',
  titrantConc: 0.1,
  flaskEn: 'Cl⁻ sample 25.0 mL + K₂CrO₄',
  flaskBn: 'Cl⁻ নমুনা 25.0 mL + K₂CrO₄',
  flaskVol: 25,
  veq: 25,
  max: 30,
  nRatio: 1,
  cloud: 0.85,
  pre: { color: '#f3efd0', en: 'White AgCl precipitate; the supernatant stays yellow', bn: 'সাদা AgCl অধক্ষেপ; উপরের তরল হলুদ' },
  at: { color: '#b0502c', en: 'A faint permanent brick-red Ag₂CrO₄ appears in the supernatant', bn: 'উপরের তরলে স্থায়ী ঈষৎ ইট-লাল Ag₂CrO₄ দেখা দিল' },
  over: { color: '#8e2f18', en: 'Heavy brick-red precipitate of Ag₂CrO₄', bn: 'ভারী ইট-লাল Ag₂CrO₄ অধক্ষেপ' },
  resultEn: 'Concentration of the chloride solution',
  resultBn: 'ক্লোরাইড দ্রবণের ঘনত্ব',
  resultUnit: 'mol L⁻¹',
  expected: 0.1
});

/* ------------------------------------------------------------------ */
/* 2. Volhard — chloride by back-titration with thiocyanate           */
/* ------------------------------------------------------------------ */

const volhard = buretteModel({
  slug: 'volhard-back-titration',
  variant: 'volhard',
  howTo_en:
    'Add 50.0 mL of 0.100 M silver nitrate to 25.0 mL of the chloride solution so that silver is in excess, filter off the silver chloride and titrate the excess silver ions with 0.100 M potassium thiocyanate using the iron(III) salt as indicator. The end point is the first permanent blood-red FeSCN²⁺ colour.',
  howTo_bn:
    'ক্লোরাইড দ্রবণের 25.0 mL-এ 0.100 M সিলভার নাইট্রেটের 50.0 mL যোগ করো যাতে সিলভার অতিরিক্ত থাকে, সিলভার ক্লোরাইড ফিল্টার করে ফেলে ধারিত অতিরিক্ত সিলভার আয়নকে আয়রন(III) লবণ নির্দেশক দিয়ে 0.100 M পটাসিয়াম থায়োসায়ানেট দিয়ে ব্যাক-টাইট্রেট করো। শেষ বিন্দু হলো প্রথম স্থায়ী রক্ত-লাল FeSCN²⁺ রং।',
  formula: 'Ag⁺ + Cl⁻ → AgCl(s) · Ag⁺ + SCN⁻ → AgSCN(s) · n(Cl⁻) = n(Ag⁺ added) − n(SCN⁻ used)',
  titrantEn: 'KSCN 0.100 M',
  titrantBn: 'KSCN 0.100 M',
  titrantConc: 0.1,
  flaskEn: 'Cl⁻ sample 25.0 mL + excess AgNO₃',
  flaskBn: 'Cl⁻ নমুনা 25.0 mL + অতিরিক্ত AgNO₃',
  flaskVol: 25,
  veq: 25,
  max: 35,
  nRatio: 1,
  cloud: 0.55,
  custom: (excess, stage) => {
    if (stage === 'end') return { color: '#8e1b2a', en: 'The first permanent blood-red FeSCN²⁺ colour appears', bn: 'প্রথম স্থায়ী রক্ত-লাল FeSCN²⁺ রং দেখা দিল' };
    if (stage === 'over') return { color: '#5e0f1c', en: 'Deep blood-red colour — excess thiocyanate', bn: 'গাঢ় রক্ত-লাল রং — থায়োসায়ানেট অতিরিক্ত' };
    if (excess > -0.5) return { color: '#b8344a', en: 'Faint pink FeSCN²⁺ — almost at the end point', bn: 'হালকা গোলাপি FeSCN²⁺ — শেষ বিন্দুর কাছাকাছি' };
    return { color: '#eef3f7', en: 'Colourless; the white AgCl precipitate is settling', bn: 'বর্ণহীন; সাদা AgCl অধক্ষেপ জমছে' };
  },
  resultEn: 'Concentration of the chloride solution',
  resultBn: 'ক্লোরাইড দ্রবণের ঘনত্ব',
  resultUnit: 'mol L⁻¹',
  expected: 0.1,
  computeResult: (mean) => (0.1 * 50 - 0.1 * mean) / 25
});

/* ------------------------------------------------------------------ */
/* 3. EDTA — hardness of water by complexometry                        */
/* ------------------------------------------------------------------ */

const edta = buretteModel({
  slug: 'edta-water-hardness',
  variant: 'edta',
  howTo_en:
    'Take 50.0 mL of the hard water, add the pH 10 buffer and a pinch of Eriochrome Black T, and titrate with 0.0100 M EDTA. The wine-red metal–indicator complex turns pure blue at the end point; the volume used gives the total hardness as CaCO₃.',
  howTo_bn:
    'কঠিন পানির 50.0 mL নাও, pH 10 বাফার ও এরিওক্রোম ব্ল্যাক টি সামান্য যোগ করো, তারপর 0.0100 M EDTA দিয়ে টাইট্রেট করো। ওয়াইন-লাল ধাতু-নির্দেশক জটিল স্থায়ী নীরে বদলায়; ব্যবহৃত আয়তন থেকে CaCO₃ হিসেবে মোট কঠিনতা পাওয়া যায়।',
  formula: 'Ca²⁺ + EDTA²⁻ → CaEDTA²⁻ (1:1) · Hardness (mg L⁻¹) = C(Ca²⁺) × 100.09 × 1000',
  titrantEn: 'EDTA 0.0100 M',
  titrantBn: 'EDTA 0.0100 M',
  titrantConc: 0.01,
  flaskEn: 'Hard water 50.0 mL + buffer + EBT',
  flaskBn: 'কঠিন পানি 50.0 mL + বাফার + EBT',
  flaskVol: 50,
  veq: 25,
  max: 35,
  nRatio: 1,
  pre: { color: '#8e2743', en: 'Wine-red Ca–EBT complex', bn: 'ওয়াইন-লাল Ca–EBT জটিল' },
  at: { color: '#1b6fd4', en: 'The wine-red complex turns pure blue', bn: 'ওয়াইন-লাল জটিল বিশুদ্ধ নীরে বদলাল' },
  over: { color: '#0f4f9e', en: 'Deep blue — excess EDTA', bn: 'গাঢ় নীল — EDTA অতিরিক্ত' },
  resultEn: 'Total hardness of the water (as CaCO₃)',
  resultBn: 'পানির মোট কঠিনতা (CaCO₃ হিসেবে)',
  resultUnit: 'mg L⁻¹',
  resultDigits: 0,
  expected: 500,
  computeResult: (mean) => ((0.01 * mean) / 50) * 100.09 * 1000
});

/* ------------------------------------------------------------------ */
/* 4. Standardising hydrochloric acid with sodium carbonate            */
/* ------------------------------------------------------------------ */

const standardiseHcl = buretteModel({
  slug: 'standardise-hcl-carbonate',
  variant: 'standardise',
  howTo_en:
    'Dissolve 0.5300 g of dried sodium carbonate in water and make up to 250.0 mL. Pipette 25.0 mL of this primary standard into a flask, add methyl orange and titrate with the hydrochloric acid from the burette. The acid titre gives the molarity of the HCl.',
  howTo_bn:
    'শুকানো সোডিয়াম কার্বোনেটের 0.5300 g পানিতে গলিয়ে 250.0 mL করো। এই প্রাথমিক মানকের 25.0 mL পিপেট করে ফ্লাস্কে নাও, মিথাইল অরেঞ্জ যোগ করে বুরেট থেকে হাইড্রোক্লোরিক অ্যাসিড দিয়ে টাইট্রেট করো। টাইটার থেকে HCl-এর মোলারিটি পাওয়া যায়।',
  formula: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂ · C(HCl) = 2 × C(Na₂CO₃) × V(Na₂CO₃) ÷ V(HCl)',
  titrantEn: 'HCl (unknown)',
  titrantBn: 'HCl (অজানা)',
  titrantConc: 0.1,
  flaskEn: 'Na₂CO₃ standard 25.0 mL (0.0200 M)',
  flaskBn: 'Na₂CO₃ মানক 25.0 mL (0.0200 M)',
  flaskVol: 25,
  veq: 10,
  max: 20,
  nRatio: 2,
  pre: { color: '#f7d44a', en: 'Yellow methyl orange; CO₂ bubbles escape', bn: 'হলুদ মিথাইল অরেঞ্জ; CO₂ বুদবুদ বের হচ্ছে' },
  at: { color: '#f2913c', en: 'The yellow turns orange and stays orange', bn: 'হলুদ কমলা হয়ে স্থায়ী কমলা' },
  over: { color: '#e2453c', en: 'Red — too much acid has been added', bn: 'লাল — অতিরিক্ত অ্যাসিড যোগ হয়েছে' },
  resultEn: 'Molarity of the hydrochloric acid',
  resultBn: 'হাইড্রোক্লোরিক অ্যাসিডের মোলারিটি',
  resultUnit: 'mol L⁻¹',
  expected: 0.1,
  computeResult: (mean) => (2 * 0.02 * 25) / mean
});

/* ------------------------------------------------------------------ */
/* 5. Standardising sodium hydroxide with oxalic acid                */
/* ------------------------------------------------------------------ */

const standardiseNaoh = buretteModel({
  slug: 'standardise-naoh-oxalic',
  variant: 'standardise',
  howTo_en:
    'Pipette 25.0 mL of the 0.0500 M oxalic acid primary standard into a conical flask, add two drops of phenolphthalein and titrate with the sodium hydroxide from the burette until the first permanent pale pink appears. The titre gives the molarity of the NaOH.',
  howTo_bn:
    '0.0500 M অক্সালিক অ্যাসিড প্রাথমিক মানকের 25.0 mL পিপেট করে কোনিক্যাল ফ্লাস্কে নাও, দুই ফোঁটা ফেনফথ্যালিন দাও এবং বুরেট থেকে সোডিয়াম হাইড্রোক্সাইড দিয়ে প্রথম স্থায়ী হালকা গোলাপি রং পাওয়া পর্যন্ত টাইট্রেট করো। টাইটার থেকে NaOH-এর মোলারিটি পাওয়া যায়।',
  formula: 'H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O · C(NaOH) = 2 × C(oxalic) × V(oxalic) ÷ V(NaOH)',
  titrantEn: 'NaOH (unknown)',
  titrantBn: 'NaOH (অজানা)',
  titrantConc: 0.1,
  flaskEn: 'Oxalic acid standard 25.0 mL (0.0500 M)',
  flaskBn: 'অক্সালিক অ্যাসিড মানক 25.0 mL (0.0500 M)',
  flaskVol: 25,
  veq: 25,
  max: 35,
  nRatio: 2,
  pre: { color: '#eef3f7', en: 'Colourless — the oxalic acid is still unneutralised', bn: 'বর্ণহীন — অক্সালিক অ্যাসিড এখনও প্রশমিত হয়নি' },
  at: { color: '#f9c9de', en: 'The first permanent pale pink appears', bn: 'প্রথম স্থায়ী হালকা গোলাপি রং দেখা দিল' },
  over: { color: '#f39ac4', en: 'Deep pink — excess sodium hydroxide', bn: 'গাঢ় গোলাপি — NaOH অতিরিক্ত' },
  resultEn: 'Molarity of the sodium hydroxide',
  resultBn: 'সোডিয়াম হাইড্রোক্সাইডের মোলারিটি',
  resultUnit: 'mol L⁻¹',
  expected: 0.1,
  computeResult: (mean) => (2 * 0.05 * 25) / mean
});

/* ------------------------------------------------------------------ */
/* 6. Copper by iodometry (thiosulphate)                              */
/* ------------------------------------------------------------------ */

const copperIodometry = buretteModel({
  slug: 'copper-iodometry',
  variant: 'iodometry',
  howTo_en:
    'To 25.0 mL of the copper(II) solution add potassium iodide in excess: copper(II) is reduced to copper(I) iodide and iodine is liberated. Titrate the iodine with 0.0500 M sodium thiosulphate, adding starch near the end point; the blue-black colour must just disappear.',
  howTo_bn:
    'কপার(II) দ্রবণের 25.0 mL-এ অতিরিক্ত পটাসিয়াম আয়োডাইড যোগ করো: কপার(II) কপার(I) আয়োডাইডে রিডিউস হয় ও আয়োডিন মুক্ত হয়। 0.0500 M সোডিয়াম থায়োসালফেট দিয়ে আয়োডিন টাইট্রেট করো, শেষের দিকে স্টার্চ যোগ করো; নীল-কালো রং ঠিক অদৃশ্য হতেই হবে।',
  formula: '2Cu²⁺ + 4I⁻ → 2CuI(s) + I₂ · I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻ · C(Cu²⁺) = C(thio) × V(thio) ÷ V(sample)',
  titrantEn: 'Na₂S₂O₃ 0.0500 M',
  titrantBn: 'Na₂S₂O₃ 0.0500 M',
  titrantConc: 0.05,
  flaskEn: 'CuSO₄ 25.0 mL + excess KI',
  flaskBn: 'CuSO₄ 25.0 mL + অতিরিক্ত KI',
  flaskVol: 25,
  veq: 25,
  max: 35,
  nRatio: 1,
  cloud: 0.8,
  starch: true,
  custom: (excess, stage) => {
    if (stage === 'end') return { color: '#e8dcb4', en: 'The blue-black starch colour just disappears', bn: 'নীল-কালো স্টার্চ রং ঠিক অদৃশ্য হলো' };
    if (stage === 'over') return { color: '#f0e6c0', en: 'Pale straw — the iodine has all been used up', bn: 'হালকা খোলস — সব আয়োডিন শেষ' };
    if (excess > -0.6) return { color: '#3a2a66', en: 'Deep blue-black starch–iodine colour', bn: 'গাঢ় নীল-কালো স্টার্চ–আয়োডিন রং' };
    return { color: '#7a4a1e', en: 'Brown iodine in solution', bn: 'দ্রবণে বাদামি আয়োডিন' };
  },
  resultEn: 'Concentration of the copper(II) solution',
  resultBn: 'কপার(II) দ্রবণের ঘনত্ব',
  resultUnit: 'mol L⁻¹',
  expected: 0.05
});

/* ------------------------------------------------------------------ */
/* 7. Vitamin C by iodimetry                                          */
/* ------------------------------------------------------------------ */

const vitaminC = buretteModel({
  slug: 'vitamin-c-iodometry',
  variant: 'iodimetry',
  howTo_en:
    'Pipette 10.0 mL of the vitamin C solution into a flask, add a little starch solution and titrate with 0.0500 M iodine in potassium iodide. The end point is the first permanent blue-black colour. Iodine oxidises ascorbic acid one to one, so the titre gives the vitamin C content.',
  howTo_bn:
    'ভিটামিন সি দ্রবণের 10.0 mL ফ্লাস্কে পিপেট করো, অল্প স্টার্চ দ্রবণ যোগ করে পটাসিয়াম আয়োডাইডে দ্রবীভূত 0.0500 M আয়োডিন দিয়ে টাইট্রেট করো। শেষ বিন্দু হলো প্রথম স্থায়ী নীল-কালো রং। আয়োডিন অ্যাসকরবিক অ্যাসিডকে ১:১ অনুপাতে অক্সিডাইজ করে, তাই টাইটার থেকে ভিটামিন সির পরিমাণ পাওয়া যায়।',
  formula: 'C₆H₈O₆ + I₂ → C₆H₆O₆ + 2HI (1:1) · mg mL⁻¹ = C(I₂) × V(I₂) ÷ V(sample) × 176.12 ÷ 1000',
  titrantEn: 'I₂ 0.0500 M in KI',
  titrantBn: 'KI-তে I₂ 0.0500 M',
  titrantConc: 0.05,
  flaskEn: 'Vitamin C 10.0 mL + starch',
  flaskBn: 'ভিটামিন সি 10.0 mL + স্টার্চ',
  flaskVol: 10,
  veq: 10,
  max: 20,
  nRatio: 1,
  starch: true,
  pre: { color: '#f2f6f8', en: 'Colourless — the ascorbic acid is reducing the iodine', bn: 'বর্ণহীন — অ্যাসকরবিক অ্যাসিড আয়োডিনকে বিপাক করছে' },
  at: { color: '#2b2060', en: 'The first permanent blue-black starch colour appears', bn: 'প্রথম স্থায়ী নীল-কালো স্টার্চ রং দেখা দিল' },
  over: { color: '#1a1240', en: 'Deep blue — excess iodine', bn: 'গাঢ় নীল — আয়োডিন অতিরিক্ত' },
  resultEn: 'Vitamin C (ascorbic acid) in the sample',
  resultBn: 'নমুনায় ভিটামিন সি (অ্যাসকরবিক অ্যাসিড)',
  resultUnit: 'mg mL⁻¹',
  resultDigits: 2,
  expected: 8.81,
  computeResult: (mean) => ((0.05 * mean) / 10) * 176.12
});

/* ------------------------------------------------------------------ */
/* 8. Winkler — dissolved oxygen by iodometry                          */
/* ------------------------------------------------------------------ */

const winkler = buretteModel({
  slug: 'winkler-dissolved-oxygen',
  variant: 'winkler',
  howTo_en:
    'The water sample is fixed with alkaline manganese(II) and iodine in a stoppered bottle, then acidified so that the brown manganese oxide liberates iodine. Titrate the iodine with 0.0200 M sodium thiosulphate, adding starch near the end point, and use the titre to calculate the dissolved oxygen in mg L⁻¹.',
  howTo_bn:
    'পানির নমুনাকে ক্ষারীয় ম্যাঙ্গানিজ(II) ও আয়োডিন দিয়ে স্থির করো, তারপর অ্যাসিড করো যাতে বাদামি ম্যাঙ্গানিজ অক্সাইড আয়োডিন মুক্ত করে। আয়োডিনকে 0.0200 M সোডিয়াম থায়োসালফেট দিয়ে টাইট্রেট করো, শেষের দিকে স্টার্চ যোগ করো, এবং টাইটার থেকে mg L⁻¹-এ দ্রবীভূত অক্সিজেন হিসাব করো।',
  formula: 'MnO₄⁻ + 2Mn²⁺ + 4OH⁻ → MnO₂(s) + 4H₂O · MnO₂(s) + 4H⁺ + 2I⁻ → Mn²⁺ + I₂ + 2H₂O · DO (mg L⁻¹) = V(S₂O₃) × N × 8 × 1000 ÷ V(sample)',
  titrantEn: 'Na₂S₂O₃ 0.0200 M',
  titrantBn: 'Na₂S₂O₃ 0.0200 M',
  titrantConc: 0.02,
  flaskEn: 'Water sample 300 mL (fixed + acidified)',
  flaskBn: 'পানির নমুনা 300 mL (স্থির + অ্যাসিডীভূত)',
  flaskVol: 300,
  veq: 15,
  max: 25,
  nRatio: 1,
  starch: true,
  custom: (excess, stage) => {
    if (stage === 'end') return { color: '#f0f3f6', en: 'The blue starch colour just disappears', bn: 'নীল স্টার্চ রং ঠিক অদৃশ্য হলো' };
    if (stage === 'over') return { color: '#f0f3f6', en: 'Colourless — a drop of thiosulphate too many', bn: 'বর্ণহীন — এক ফোঁটা থায়োসালফেট বেশি' };
    if (excess > -0.5) return { color: '#332a63', en: 'Blue-black starch–iodine colour', bn: 'নীল-কালো স্টার্চ–আয়োডিন রং' };
    return { color: '#c9a227', en: 'Yellow-brown iodine in the acidified sample', bn: 'অ্যাসিডীভূত নমুনায় হলুদ-বাদামি আয়োডিন' };
  },
  resultEn: 'Dissolved oxygen in the sample',
  resultBn: 'নমুনায় দ্রবীভূত অক্সিজেন',
  resultUnit: 'mg L⁻¹',
  resultDigits: 2,
  expected: 8,
  computeResult: (mean) => (0.02 * mean * 32 * 1000) / (4 * 300)
});

export const analyticalModels: ChemPracticalModel[] = [
  mohr,
  volhard,
  edta,
  standardiseHcl,
  standardiseNaoh,
  copperIodometry,
  vitaminC,
  winkler
];
