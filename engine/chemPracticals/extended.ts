import type { ChemPracticalModel, TubeView } from './types';
import {
  CHOOSE,
  MOLAR_VOLUME_ML,
  clamp,
  latestBy,
  mean,
  num,
  opt,
  optionText,
  points,
  round,
  scoreRows,
  slopeThroughOrigin,
  status,
  tick,
  tx
} from './helpers';

const letters = ['A', 'B', 'C', 'D', 'E'];
const indexOf = (value: number, length: number) => clamp(Math.round(value), 0, length - 1);

/* ------------------------------------------------------------------ */
/* Electrical conductivity of solutions                                 */
/* ------------------------------------------------------------------ */

type ConductivityClass = 0 | 1 | 2;
const CONDUCTIVITY_CLASSES = [
  { en: 'Non-conductor / negligible', bn: 'অপরিবাহী / প্রায় নগণ্য' },
  { en: 'Weak conductor', bn: 'দুর্বল পরিবাহী' },
  { en: 'Strong conductor', bn: 'তীব্র পরিবাহী' }
] as const;
const CONDUCTIVITY_CHOICES = [CHOOSE, ...CONDUCTIVITY_CLASSES.map((c, i) => opt(i, c.en, c.bn))];
const CONDUCTIVITY_SAMPLES: {
  en: string;
  bn: string;
  formula: string;
  conductivity: number;
  kind: ConductivityClass;
}[] = [
  { en: 'Distilled water', bn: 'পাতিত পানি', formula: 'H₂O', conductivity: 0.03, kind: 0 },
  { en: 'Sodium chloride solution', bn: 'সোডিয়াম ক্লোরাইড দ্রবণ', formula: 'NaCl', conductivity: 12.6, kind: 2 },
  { en: 'Dilute hydrochloric acid', bn: 'লঘু হাইড্রোক্লোরিক অ্যাসিড', formula: 'HCl', conductivity: 17.8, kind: 2 },
  { en: 'Acetic acid solution', bn: 'অ্যাসিটিক অ্যাসিড দ্রবণ', formula: 'CH₃COOH', conductivity: 2.1, kind: 1 },
  { en: 'Ethanol solution', bn: 'ইথানল দ্রবণ', formula: 'C₂H₅OH', conductivity: 0.02, kind: 0 }
];

const conductivitySolutions: ChemPracticalModel = {
  slug: 'conductivity-solutions',
  scene: 'tubes',
  variant: 'conductivity',
  howTo_en:
    'Rinse both low-voltage conductivity probes with distilled water, then dip them into each solution without letting the probes touch. Compare the bulb brightness or conductance reading for distilled water, NaCl, dilute HCl, weak acetic acid and ethanol. Rinse between samples; strong electrolytes conduct because they contain many mobile ions.',
  howTo_bn:
    'কম-ভোল্টেজ পরিবাহিতা পরীক্ষকের দুই প্রোব পাতিত পানি দিয়ে ধুয়ে প্রতিটি দ্রবণে ডোবাও—প্রোব দুটিকে পরস্পর ছোঁয়াবে না। পাতিত পানি, NaCl, লঘু HCl, দুর্বল অ্যাসিটিক অ্যাসিড ও ইথানলের বাল্বের উজ্জ্বলতা বা পরিবাহিতা তুলনা করো। নমুনার মাঝে প্রোব ধুয়ে নাও; চলনশীল আয়ন বেশি থাকায় তীব্র ইলেক্ট্রোলাইট ভালো বিদ্যুৎ পরিবহন করে।',
  formula: 'electrical conductance ∝ concentration of mobile ions in solution',
  controls: [
    { key: 'sample', en: 'Solution to test', bn: 'যে দ্রবণ পরীক্ষা করবে', default: 0, options: CONDUCTIVITY_SAMPLES.map((_, i) => opt(i, `Solution ${letters[i]}`, `দ্রবণ ${letters[i]}`)) },
    { key: 'classification', en: 'Your conclusion', bn: 'তোমার সিদ্ধান্ত', kind: 'inference', default: -1, options: CONDUCTIVITY_CHOICES }
  ],
  tasks: CONDUCTIVITY_SAMPLES.map((_, i) => ({ en: `Test solution ${letters[i]}`, bn: `${letters[i]} দ্রবণ পরীক্ষা`, set: { sample: i } })),
  columns: [
    { key: 'solution', en: 'Solution', bn: 'দ্রবণ' },
    { key: 'conductivity', en: 'Conductivity', bn: 'পরিবাহিতা', unit: 'mS cm⁻¹', digits: 2 },
    { key: 'observation', en: 'Bulb / observation', bn: 'বাল্ব / পর্যবেক্ষণ' },
    { key: 'conclusion', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: CONDUCTIVITY_SAMPLES.length,
  graph: { x: 'sampleNo', y: 'conductivity', kind: 'scatter' },
  compute: (p, _noise, ctx) => {
    const si = indexOf(p.sample, CONDUCTIVITY_SAMPLES.length);
    const sample = CONDUCTIVITY_SAMPLES[si];
    const selected = p.classification >= 0;
    const correct = selected && p.classification === sample.kind;
    const verdict = optionText(CONDUCTIVITY_CHOICES, p.classification);
    const records = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = CONDUCTIVITY_SAMPLES.map((s, i) => {
      const recorded = records.get(String(i));
      return {
        label: letters[i],
        sub: s.formula,
        liquid: '#d9effb',
        level: 0.42,
        active: i === si,
        mark: recorded ? (num(recorded, '__correct') === 1 ? 'good' : 'bad') : undefined
      };
    });
    const brightness = clamp(Math.pow(sample.conductivity / 18, 0.58), 0.015, 1);
    const visual = sample.kind === 2 ? { en: 'bright bulb', bn: 'উজ্জ্বল বাল্ব' } : sample.kind === 1 ? { en: 'dim bulb', bn: 'মৃদু বাল্ব' } : { en: 'off / almost off', bn: 'নিভে আছে / প্রায় নিভে' };
    return {
      row: {
        ...tx('solution', `Solution ${letters[si]} · ${sample.en}`, `${letters[si]} দ্রবণ · ${sample.bn}`),
        sampleNo: si + 1,
        conductivity: round(sample.conductivity, 2),
        ...tx('observation', visual.en, visual.bn),
        ...tx('conclusion', verdict.en, verdict.bn),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Selected sample', bn: 'নির্বাচিত নমুনা', value: sample.en, valueBn: sample.bn },
        { en: 'Conductivity', bn: 'পরিবাহিতা', value: sample.conductivity, unit: 'mS cm⁻¹', digits: 2, tone: sample.kind === 2 ? 'good' : sample.kind === 1 ? 'warn' : 'info' },
        { en: 'Conductivity tester', bn: 'পরিবাহিতা পরীক্ষক', value: visual.en, valueBn: visual.bn },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: selected ? verdict.en : '—', valueBn: selected ? verdict.bn : '—' }
      ],
      view: {
        tubes,
        bulb: { tube: si, brightness },
        caption: 'Low-voltage conductivity tester · rinse probes between samples',
        captionBn: 'কম-ভোল্টেজ পরিবাহিতা পরীক্ষক · নমুনার মাঝে প্রোব ধুয়ে নাও'
      } as unknown as Record<string, unknown>,
      status: !selected
        ? status('info', 'Compare the bulb, then choose whether this is a strong, weak or negligible conductor.', 'বাল্বের উজ্জ্বলতা তুলনা করে তীব্র, দুর্বল নাকি প্রায় অপরিবাহী—সিদ্ধান্ত বেছে নাও।')
        : correct
          ? status('good', `Correct: ${sample.en} is a ${CONDUCTIVITY_CLASSES[sample.kind].en.toLowerCase()}.`, `সঠিক: ${sample.bn} ${CONDUCTIVITY_CLASSES[sample.kind].bn}।`)
          : status('warn', 'Check the bulb brightness and the mobile ions present in the solution.', 'বাল্বের উজ্জ্বলতা ও দ্রবণে চলনশীল আয়নের উপস্থিতি আবার দেখো।'),
      ready: selected,
      correct
    };
  },
  result: {
    en: 'Solutions classified correctly',
    bn: 'সঠিকভাবে শ্রেণিবদ্ধ দ্রবণ',
    unit: '',
    score: true,
    compute: scoreRows,
    expected: CONDUCTIVITY_SAMPLES.length,
    absolute: true,
    tolerance: 0
  },
  solve: (p) => ({ ...p, classification: CONDUCTIVITY_SAMPLES[indexOf(p.sample, CONDUCTIVITY_SAMPLES.length)].kind })
};

/* ------------------------------------------------------------------ */
/* Paper chromatography                                                  */
/* ------------------------------------------------------------------ */

const CHROMATOGRAPHY_SAMPLES = [
  { en: 'Black ink', bn: 'কালো কালি' },
  { en: 'Leaf extract', bn: 'পাতার নির্যাস' },
  { en: 'Food-colour mixture', bn: 'খাদ্যরঙের মিশ্রণ' }
];
const CHROMATOGRAPHY_SOLVENTS = [
  { en: 'Water', bn: 'পানি' },
  { en: 'Ethanol', bn: 'ইথানল' }
];
const CHROMATOGRAPHY_COMPONENTS = [
  [
    { en: 'yellow dye', bn: 'হলুদ রঞ্জক', color: '#eab308' },
    { en: 'magenta dye', bn: 'ম্যাজেন্টা রঞ্জক', color: '#d9468f' },
    { en: 'blue dye', bn: 'নীল রঞ্জক', color: '#2586c8' }
  ],
  [
    { en: 'carotene', bn: 'ক্যারোটিন', color: '#f59e0b' },
    { en: 'chlorophyll b', bn: 'ক্লোরোফিল b', color: '#84a83d' },
    { en: 'chlorophyll a', bn: 'ক্লোরোফিল a', color: '#16834a' }
  ],
  [
    { en: 'yellow food dye', bn: 'হলুদ খাদ্যরঞ্জক', color: '#f2c230' },
    { en: 'red food dye', bn: 'লাল খাদ্যরঞ্জক', color: '#e44448' },
    { en: 'blue food dye', bn: 'নীল খাদ্যরঞ্জক', color: '#3c63d6' }
  ]
];
const CHROMATOGRAPHY_RF = [
  [[0.26, 0.52, 0.81], [0.17, 0.43, 0.74]],
  [[0.08, 0.15, 0.23], [0.34, 0.66, 0.9]],
  [[0.2, 0.58, 0.86], [0.13, 0.42, 0.77]]
];
const CHROMATOGRAPHY_BANDS = [opt(0, 'Band 1', 'ব্যান্ড ১'), opt(1, 'Band 2', 'ব্যান্ড ২'), opt(2, 'Band 3', 'ব্যান্ড ৩')];
const chromatographyRf = (sample: number, solvent: number, band: number) => CHROMATOGRAPHY_RF[sample][solvent][band];

const paperChromatography: ChemPracticalModel = {
  slug: 'paper-chromatography',
  scene: 'chromatography',
  howTo_en:
    'Draw a pencil baseline about 1 cm from the bottom of chromatography paper and place a tiny ink spot on it. Stand the strip in a covered beaker with a shallow layer of solvent below the baseline. Let the solvent rise, mark its front, measure each separated band and calculate Rf = distance travelled by the dye ÷ distance travelled by the solvent front.',
  howTo_bn:
    'ক্রোমাটোগ্রাফি কাগজের নিচ থেকে প্রায় ১ cm ওপরে পেন্সিলে বেসলাইন টেনে তাতে কালির ছোট ফোঁটা দাও। বীকারে অল্প দ্রাবক নিয়ে কাগজটি এমনভাবে রাখো যেন দ্রাবক বেসলাইনের নিচে থাকে; ঢাকনা দাও। দ্রাবক ওপরে উঠলে ফ্রন্ট চিহ্নিত করো, প্রতিটি আলাদা ব্যান্ডের দূরত্ব মেপে Rf = রঞ্জকের অতিক্রান্ত দূরত্ব ÷ দ্রাবক-ফ্রন্টের দূরত্ব হিসাব করো।',
  formula: 'Rf = distance travelled by pigment ÷ distance travelled by solvent front',
  controls: [
    { key: 'sample', en: 'Mixture on the baseline', bn: 'বেসলাইনের মিশ্রণ', default: 0, options: CHROMATOGRAPHY_SAMPLES.map((s, i) => opt(i, s.en, s.bn)) },
    { key: 'solvent', en: 'Mobile phase', bn: 'চলমান দ্রাবক', default: 0, options: CHROMATOGRAPHY_SOLVENTS.map((s, i) => opt(i, s.en, s.bn)) },
    { key: 'band', en: 'Band to measure', bn: 'যে ব্যান্ড মাপবে', kind: 'view', default: 0, options: CHROMATOGRAPHY_BANDS },
    { key: 't', en: 'Developing time', bn: 'বিকাশের সময়', kind: 'time', min: 0, max: 12, step: 0.5, unit: 'min', default: 0, play: { rate: 0.6 } }
  ],
  tasks: CHROMATOGRAPHY_BANDS.map((band) => ({ en: band.en, bn: band.bn, set: { band: band.value } })),
  columns: [
    { key: 'sample', en: 'Mixture', bn: 'মিশ্রণ' },
    { key: 'solvent', en: 'Solvent', bn: 'দ্রাবক' },
    { key: 'band', en: 'Separated band', bn: 'আলাদা ব্যান্ড' },
    { key: 'pigment', en: 'Likely pigment', bn: 'সম্ভাব্য রঞ্জক' },
    { key: 'distance', en: 'Pigment distance', bn: 'রঞ্জকের দূরত্ব', unit: 'cm', digits: 2 },
    { key: 'front', en: 'Solvent-front distance', bn: 'দ্রাবক-ফ্রন্টের দূরত্ব', unit: 'cm', digits: 2 },
    { key: 'rf', en: 'Rf', bn: 'Rf', digits: 3 }
  ],
  minReadings: 3,
  graph: { x: 'bandNo', y: 'rf', kind: 'scatter' },
  compute: (p, noise) => {
    const sampleIndex = indexOf(p.sample, CHROMATOGRAPHY_SAMPLES.length);
    const solventIndex = indexOf(p.solvent, CHROMATOGRAPHY_SOLVENTS.length);
    const bandIndex = indexOf(p.band, CHROMATOGRAPHY_BANDS.length);
    const t = clamp(p.t, 0, 12);
    const frontDistance = 8.5 * clamp(t / 9, 0, 1);
    const idealRf = chromatographyRf(sampleIndex, solventIndex, bandIndex);
    const component = CHROMATOGRAPHY_COMPONENTS[sampleIndex][bandIndex];
    const distance = frontDistance > 0 ? clamp(idealRf * frontDistance + noise(0.015), 0, frontDistance) : 0;
    const measuredRf = frontDistance > 0 ? distance / frontDistance : 0;
    const allBands = CHROMATOGRAPHY_COMPONENTS[sampleIndex].map((part, i) => ({
      label: part.en,
      labelBn: part.bn,
      color: part.color,
      rf: chromatographyRf(sampleIndex, solventIndex, i)
    }));
    const solvent = CHROMATOGRAPHY_SOLVENTS[solventIndex];
    return {
      row: {
        ...tx('sample', CHROMATOGRAPHY_SAMPLES[sampleIndex].en, CHROMATOGRAPHY_SAMPLES[sampleIndex].bn),
        ...tx('solvent', solvent.en, solvent.bn),
        ...tx('band', `Band ${bandIndex + 1}`, `ব্যান্ড ${bandIndex + 1}`),
        ...tx('pigment', component.en, component.bn),
        bandNo: bandIndex + 1,
        distance: round(distance, 2),
        front: round(frontDistance, 2),
        rf: round(measuredRf, 3)
      },
      live: [
        { en: 'Solvent front', bn: 'দ্রাবক-ফ্রন্ট', value: frontDistance, unit: 'cm', digits: 2 },
        { en: 'Selected band', bn: 'নির্বাচিত ব্যান্ড', value: component.en, valueBn: component.bn },
        { en: 'Pigment distance', bn: 'রঞ্জকের দূরত্ব', value: distance, unit: 'cm', digits: 2 },
        { en: 'Rf', bn: 'Rf', value: measuredRf, digits: 3 }
      ],
      view: {
        sample: CHROMATOGRAPHY_SAMPLES[sampleIndex].en,
        sampleBn: CHROMATOGRAPHY_SAMPLES[sampleIndex].bn,
        solvent: solvent.en,
        solventBn: solvent.bn,
        time: t,
        frontFraction: clamp(frontDistance / 8.5, 0, 1),
        frontDistance,
        selectedBand: bandIndex,
        bands: allBands
      },
      status: t < 0.5
        ? status('info', 'Start the run: the solvent front should rise above the pencil baseline.', 'পরীক্ষা চালু করো: দ্রাবক-ফ্রন্ট পেন্সিলের বেসলাইনের ওপরে উঠবে।')
        : t < 9
          ? status('info', 'The solvent is carrying the dyes up the paper; keep the chamber covered.', 'দ্রাবক রঞ্জকগুলোকে কাগজের ওপরে তুলছে; চেম্বারটি ঢেকে রাখো।')
          : status('good', 'Mark the solvent front, then measure the separated bands and calculate Rf.', 'দ্রাবক-ফ্রন্ট চিহ্নিত করে আলাদা ব্যান্ডগুলো মাপো এবং Rf হিসাব করো।'),
      ready: t >= 9
    };
  },
  result: {
    en: 'Mean Rf of the separated bands',
    bn: 'আলাদা ব্যান্ডগুলোর গড় Rf',
    unit: '',
    digits: 3,
    compute: (rows) => {
      const values = rows.map((row) => num(row, 'rf')).filter((value): value is number => value !== null);
      return mean(values);
    },
    expected: (p) => {
      const sampleIndex = indexOf(p.sample, CHROMATOGRAPHY_SAMPLES.length);
      const solventIndex = indexOf(p.solvent, CHROMATOGRAPHY_SOLVENTS.length);
      return mean(CHROMATOGRAPHY_BANDS.map((band) => chromatographyRf(sampleIndex, solventIndex, band.value))) ?? 0;
    },
    goodWithin: 5
  },
  solve: (p) => ({ ...p, t: Math.max(p.t, 9) })
};

/* ------------------------------------------------------------------ */
/* Calcium carbonate: effect of surface area                            */
/* ------------------------------------------------------------------ */

const CACO3_FORMS = [
  { en: 'Large marble chips', bn: 'মার্বেলের বড় টুকরো', factor: 0.004 },
  { en: 'Small marble chips', bn: 'মার্বেলের ছোট টুকরো', factor: 0.012 },
  { en: 'Powdered marble', bn: 'মার্বেলের গুঁড়া', factor: 0.03 }
];
const CACO3_TIMES = [10, 20, 30];
const CACO3_ACID_MOLARITY = [0.5, 1.0];
const CACO3_MASS_G = 2;
const CACO3_ACID_VOLUME_L = 0.05;
const CACO3_MOLAR_MASS = 100.0869;
const caco3FinalVolume = (acidIndex: number) => {
  const acidMoles = CACO3_ACID_VOLUME_L * CACO3_ACID_MOLARITY[indexOf(acidIndex, CACO3_ACID_MOLARITY.length)];
  const caco3Moles = Math.min(CACO3_MASS_G / CACO3_MOLAR_MASS, acidMoles / 2);
  return caco3Moles * MOLAR_VOLUME_ML;
};
const caco3GasAt = (formIndex: number, acidIndex: number, time: number) => {
  const acidFactor = CACO3_ACID_MOLARITY[indexOf(acidIndex, CACO3_ACID_MOLARITY.length)];
  const k = CACO3_FORMS[indexOf(formIndex, CACO3_FORMS.length)].factor * acidFactor;
  return caco3FinalVolume(acidIndex) * (1 - Math.exp(-k * time));
};
const caco3Slope = (formIndex: number, acidIndex: number) =>
  slopeThroughOrigin(CACO3_TIMES.map((t) => ({ t, gas: caco3GasAt(formIndex, acidIndex, t) })), 't', 'gas');

const calciumCarbonateRate: ChemPracticalModel = {
  slug: 'rate-calcium-carbonate-surface-area',
  scene: 'gas',
  variant: 'calcium-carbonate-rate',
  howTo_en:
    'React equal 2.00 g portions of large chips, small chips and powdered marble with 50 mL of dilute hydrochloric acid. Keep acid concentration and temperature the same. Record the carbon dioxide volume at 10, 20 and 30 seconds for each form. Powder reacts faster because more surface is exposed; equal reactant amounts give the same final gas volume.',
  howTo_bn:
    'মার্বেলের বড় টুকরো, ছোট টুকরো ও গুঁড়ার সমান 2.00 g নমুনা 50 mL লঘু হাইড্রোক্লোরিক অ্যাসিডের সঙ্গে বিক্রিয়া করো। অ্যাসিডের ঘনমাত্রা ও তাপমাত্রা একই রাখো। প্রতিটি অবস্থায় 10, 20 ও 30 সেকেন্ডে CO₂-এর আয়তন লেখো। গুঁড়ায় উন্মুক্ত পৃষ্ঠ বেশি বলে বিক্রিয়া দ্রুত হয়; বিকারকের পরিমাণ সমান হলে শেষ গ্যাসের আয়তন একই থাকে।',
  formula: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑ · greater surface area → faster rate',
  controls: [
    { key: 'form', en: 'Calcium carbonate form', bn: 'ক্যালসিয়াম কার্বনেটের ধরন', default: 0, options: CACO3_FORMS.map((form, i) => opt(i, form.en, form.bn)) },
    { key: 'acid', en: 'Hydrochloric acid (50 mL)', bn: 'হাইড্রোক্লোরিক অ্যাসিড (50 mL)', default: 1, options: CACO3_ACID_MOLARITY.map((value, i) => opt(i, `${value.toFixed(1)} M`, `${value.toFixed(1)} M`)) },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 60, step: 1, unit: 's', default: 0, play: { rate: 3 } }
  ],
  tasks: CACO3_FORMS.flatMap((form, formIndex) => CACO3_TIMES.map((time) => ({
    en: `${form.en} · ${time} s`,
    bn: `${form.bn} · ${time} সে`,
    set: { form: formIndex, t: time }
  }))),
  columns: [
    { key: 'form', en: 'CaCO₃ form', bn: 'CaCO₃-এর ধরন' },
    { key: 'acid', en: 'HCl concentration', bn: 'HCl-এর ঘনমাত্রা', unit: 'M', digits: 1 },
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'gas', en: 'CO₂ collected', bn: 'সংগৃহীত CO₂', unit: 'mL', digits: 1 },
    { key: 'rate', en: 'Instantaneous rate', bn: 'তাৎক্ষণিক হার', unit: 'mL s⁻¹', digits: 2 }
  ],
  minReadings: 9,
  graph: { x: 't', y: 'gas', kind: 'scatter' },
  compute: (p, noise, ctx) => {
    const formIndex = indexOf(p.form, CACO3_FORMS.length);
    const acidIndex = indexOf(p.acid, CACO3_ACID_MOLARITY.length);
    const time = clamp(p.t, 0, 60);
    const form = CACO3_FORMS[formIndex];
    const acid = CACO3_ACID_MOLARITY[acidIndex];
    const finalVolume = caco3FinalVolume(acidIndex);
    const gas = caco3GasAt(formIndex, acidIndex, time);
    const rate = finalVolume * form.factor * acid * Math.exp(-form.factor * acid * time);
    const seen = points(ctx.rows, 't', 'gas');
    return {
      row: {
        ...tx('form', form.en, form.bn),
        formIndex,
        acid,
        t: round(time, 0),
        gas: round(Math.max(0, gas + noise(0.25)), 1),
        rate: round(rate, 2)
      },
      live: [
        { en: 'Form', bn: 'ধরন', value: form.en, valueBn: form.bn },
        { en: 'CO₂ collected', bn: 'সংগৃহীত CO₂', value: gas, unit: 'mL', digits: 1 },
        { en: 'Rate at this moment', bn: 'এই মুহূর্তের হার', value: rate, unit: 'mL s⁻¹', digits: 2 },
        { en: 'Reaction time', bn: 'বিক্রিয়ার সময়', value: time, unit: 's' }
      ],
      view: {
        funnel: 'thistle',
        liquid: '#e8f2fb',
        level: 0.43,
        solid: { kind: 'chips', color: '#f4f2e8', amount: 1, size: formIndex },
        bubbles: clamp(rate / Math.max(finalVolume * 0.04, 1), 0, 1),
        collect: 'syringe',
        volume: gas,
        max: 520,
        clock: time,
        label: 'CaCO₃ + dilute HCl',
        labelBn: 'CaCO₃ + লঘু HCl',
        curve: { pts: seen, cur: { x: time, y: gas }, xMax: 60, yMin: 0, yMax: 520, xLabel: 't / s', yLabel: 'V(CO₂) / mL' }
      },
      status: time === 0
        ? status('info', 'Acid is ready. Start the stopwatch and compare how quickly the gas syringe fills.', 'অ্যাসিড প্রস্তুত। স্টপওয়াচ চালু করে গ্যাস সিরিঞ্জ কত দ্রুত ভরে তুলনা করো।')
        : status('good', `${form.en}: ${gas.toFixed(1)} mL of CO₂ has formed; keep mass, acid and temperature fixed when comparing forms.`, `${form.bn}: ${gas.toFixed(1)} mL CO₂ তৈরি হয়েছে; ধরন তুলনার সময় ভর, অ্যাসিড ও তাপমাত্রা অপরিবর্তিত রাখো।`),
      ready: time > 0
    };
  },
  result: {
    en: 'Powder-to-large-chip initial-rate ratio',
    bn: 'গুঁড়া ও বড় টুকরোর প্রাথমিক হারের অনুপাত',
    unit: '×',
    digits: 2,
    compute: (rows) => {
      const coarse = slopeThroughOrigin(rows.filter((row) => num(row, 'formIndex') === 0), 't', 'gas');
      const powder = slopeThroughOrigin(rows.filter((row) => num(row, 'formIndex') === 2), 't', 'gas');
      return coarse && powder ? powder / coarse : null;
    },
    expected: (p) => {
      const acidIndex = indexOf(p.acid, CACO3_ACID_MOLARITY.length);
      const coarse = caco3Slope(0, acidIndex);
      const powder = caco3Slope(2, acidIndex);
      return coarse && powder ? powder / coarse : 0;
    },
    goodWithin: 4
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* Diffusion of ammonia and hydrogen chloride                          */
/* ------------------------------------------------------------------ */

const DIFFUSION_LENGTH_CM = 100;
const DIFFUSION_RATIO = Math.sqrt(36.46 / 17.031); // Graham's law: r ∝ 1/√M
const DIFFUSION_TOTAL_SPEED = 2.2; // pedagogic front speed, cm s⁻¹ at room temperature
const DIFFUSION_NH3_SPEED = (DIFFUSION_TOTAL_SPEED * DIFFUSION_RATIO) / (1 + DIFFUSION_RATIO);
const DIFFUSION_HCL_SPEED = DIFFUSION_TOTAL_SPEED / (1 + DIFFUSION_RATIO);
const DIFFUSION_RING_CM = (DIFFUSION_LENGTH_CM * DIFFUSION_NH3_SPEED) / DIFFUSION_TOTAL_SPEED;
const DIFFUSION_MEET_TIME = DIFFUSION_LENGTH_CM / DIFFUSION_TOTAL_SPEED;
const DIFFUSION_CHOICES = [
  CHOOSE,
  opt(0, 'Closer to the NH₃ end', 'NH₃ প্রান্তের কাছে'),
  opt(1, 'Closer to the HCl end', 'HCl প্রান্তের কাছে'),
  opt(2, 'At the midpoint', 'মধ্যবিন্দুতে')
];
const diffusionTasks = [46, 55, 64, 73];

const ammoniaHclDiffusion: ChemPracticalModel = {
  slug: 'diffusion-ammonia-hydrogen-chloride',
  scene: 'diffusion',
  howTo_en:
    'In a fume cupboard, place cotton wool soaked with ammonia solution and concentrated hydrochloric acid at opposite ends of a 1 m glass tube at the same time. Start the timer, watch the white ammonium-chloride ring form, and measure its distance from each end. Compare the distance ratio with √(M(HCl)/M(NH₃)) from Graham’s law.',
  howTo_bn:
    'ধোঁয়া-নিষ্কাশন কক্ষে ১ m কাচের নলের দুই প্রান্তে একই সময়ে অ্যামোনিয়া দ্রবণ ও গাঢ় হাইড্রোক্লোরিক অ্যাসিডে ভেজানো তুলা রাখো। সময় চালু করে সাদা অ্যামোনিয়াম ক্লোরাইডের বলয় তৈরি হওয়া দেখো এবং দুই প্রান্ত থেকে দূরত্ব মাপো। দূরত্বের অনুপাত গ্রাহামের সূত্রের √(M(HCl)/M(NH₃)-এর সঙ্গে তুলনা করো।',
  formula: 'NH₃(g) + HCl(g) → NH₄Cl(s) · r(NH₃)/r(HCl) = √(36.46/17.03) ≈ 1.46',
  controls: [
    { key: 't', en: 'Diffusion time', bn: 'ব্যাপন সময়', kind: 'time', min: 0, max: 90, step: 1, unit: 's', default: 0, play: { rate: 3 } },
    { key: 'position', en: 'Where is the white ring?', bn: 'সাদা বলয়টি কোথায়?', kind: 'inference', default: -1, options: DIFFUSION_CHOICES }
  ],
  tasks: diffusionTasks.map((time) => ({ en: `${time} s · measure the ring`, bn: `${time} সে · বলয় মাপো`, set: { t: time } })),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'dNH3', en: 'NH₃ distance', bn: 'NH₃-এর দূরত্ব', unit: 'cm', digits: 1 },
    { key: 'dHCl', en: 'HCl distance', bn: 'HCl-এর দূরত্ব', unit: 'cm', digits: 1 },
    { key: 'ring', en: 'Ring from NH₃ end', bn: 'NH₃ প্রান্ত থেকে বলয়', unit: 'cm', digits: 1 },
    { key: 'ratio', en: 'Distance ratio', bn: 'দূরত্বের অনুপাত', digits: 3 },
    { key: 'conclusion', en: 'Your conclusion', bn: 'তোমার সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  graph: { x: 't', y: ['dNH3', 'dHCl'], kind: 'scatter' },
  compute: (p, noise) => {
    const time = clamp(p.t, 0, 90);
    const nh3Distance = Math.min(DIFFUSION_NH3_SPEED * time, DIFFUSION_RING_CM);
    const hclDistance = Math.min(DIFFUSION_HCL_SPEED * time, DIFFUSION_LENGTH_CM - DIFFUSION_RING_CM);
    const formed = time >= DIFFUSION_MEET_TIME;
    const measuredRing = formed ? clamp(DIFFUSION_RING_CM + noise(0.35), 0, DIFFUSION_LENGTH_CM) : null;
    const chosen = p.position >= 0;
    const correct = chosen && p.position === 1;
    const verdict = optionText(DIFFUSION_CHOICES, p.position);
    return {
      row: {
        t: round(time, 0),
        dNH3: round(nh3Distance, 1),
        dHCl: round(hclDistance, 1),
        ring: measuredRing === null ? 'not formed yet' : round(measuredRing, 1),
        ratio: formed ? round(nh3Distance / hclDistance, 3) : '—',
        ...tx('conclusion', verdict.en, verdict.bn),
        check: tick(correct),
        __key: Math.round(time),
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'NH₃ diffusion front', bn: 'NH₃ ব্যাপন-সীমা', value: nh3Distance, unit: 'cm', digits: 1 },
        { en: 'HCl diffusion front', bn: 'HCl ব্যাপন-সীমা', value: hclDistance, unit: 'cm', digits: 1 },
        { en: 'White NH₄Cl ring', bn: 'সাদা NH₄Cl বলয়', value: measuredRing === null ? 'not formed yet' : measuredRing, valueBn: measuredRing === null ? 'এখনও তৈরি হয়নি' : `${round(measuredRing, 1)} cm`, unit: measuredRing === null ? undefined : 'cm', digits: 1, tone: formed ? 'good' : 'info' },
        { en: 'Distance ratio', bn: 'দূরত্বের অনুপাত', value: formed ? nh3Distance / hclDistance : '—', digits: 3 }
      ],
      view: {
        time,
        frontNH3: nh3Distance,
        frontHCl: hclDistance,
        ringPosition: DIFFUSION_RING_CM,
        ringFormed: formed,
        tubeLength: DIFFUSION_LENGTH_CM,
        speedRatio: DIFFUSION_RATIO
      },
      status: !formed
        ? status('info', 'Both colourless gases are diffusing along the tube; the faster NH₃ front travels farther.', 'দুটি বর্ণহীন গ্যাস নল বরাবর ছড়াচ্ছে; দ্রুত NH₃ আরও দূর যায়।')
        : !chosen
          ? status('good', `A white NH₄Cl ring has formed ${DIFFUSION_RING_CM.toFixed(1)} cm from the NH₃ end — choose which end it is nearer.`, `NH₃ প্রান্ত থেকে ${DIFFUSION_RING_CM.toFixed(1)} cm দূরে সাদা NH₄Cl বলয় তৈরি হয়েছে—কোন প্রান্তের কাছে তা বেছে নাও।`)
          : correct
            ? status('good', 'The ring is nearer the HCl end: faster NH₃ has travelled farther before the gases meet.', 'বলয়টি HCl প্রান্তের কাছে: গ্যাস দুটি মিলিত হওয়ার আগে দ্রুত NH₃ বেশি দূর গেছে।')
            : status('warn', 'Compare the measured distances from both ends; the ring is not at the midpoint.', 'দুই প্রান্ত থেকে মাপা দূরত্ব তুলনা করো; বলয়টি মধ্যবিন্দুতে নয়।'),
      ready: formed && chosen,
      correct
    };
  },
  result: {
    en: 'Mean ring position from the NH₃ end',
    bn: 'NH₃ প্রান্ত থেকে বলয়ের গড় অবস্থান',
    unit: 'cm',
    digits: 1,
    compute: (rows) => {
      const values = rows.map((row) => num(row, 'ring')).filter((value): value is number => value !== null);
      return mean(values);
    },
    expected: DIFFUSION_RING_CM,
    goodWithin: 3
  },
  solve: (p) => ({ ...p, t: Math.max(p.t, Math.ceil(DIFFUSION_MEET_TIME)), position: 1 })
};

/* ------------------------------------------------------------------ */
/* Simple distillation of salt water                                     */
/* ------------------------------------------------------------------ */

const DISTILLATION_HEAT = [0.65, 1, 1.35];
const DISTILLATION_HEAT_CHOICES = [opt(0, 'Low', 'কম'), opt(1, 'Steady', 'মাঝারি'), opt(2, 'High', 'বেশি')];
const DISTILLATION_TIMES = [5, 10, 15, 20, 25, 30];
const DISTILLATION_START_ML = 100;
const distillationAt = (time: number, heatIndex: number, cooling: number) => {
  const heat = DISTILLATION_HEAT[indexOf(heatIndex, DISTILLATION_HEAT.length)];
  const boilTime = 3.8 / heat;
  const evaporated = clamp((time - boilTime) * 2.2 * heat, 0, 72);
  const condensingFraction = cooling === 1 ? 0.96 : 0.06;
  const distillate = evaporated * condensingFraction;
  const temperature = 25 + 75 * clamp(time / boilTime, 0, 1);
  const brine = Math.max(0, DISTILLATION_START_ML - evaporated);
  const conductivity = distillate > 0.1 ? 0.025 + (cooling === 1 ? 0 : 0.16) + Math.max(0, heat - 1) * 0.07 : 0;
  return { heat, boilTime, evaporated, distillate, temperature, brine, conductivity };
};

const simpleDistillation: ChemPracticalModel = {
  slug: 'simple-distillation-salt-water',
  scene: 'distillation',
  howTo_en:
    'Place 100 mL of salt water in a distillation flask. Heat gently with the apparatus open to the air; watch the thermometer reach the boiling point and the water vapour pass through a water-cooled condenser into the receiver. Record distillate volume at each time. Salt is non-volatile and remains in the flask; never heat a sealed system or boil the flask dry.',
  howTo_bn:
    'ডিস্টিলেশন ফ্লাস্কে 100 mL লবণ-পানি নাও। যন্ত্রটি খোলা রেখে ধীরে তাপ দাও; থার্মোমিটার স্ফুটনাঙ্কে পৌঁছানো এবং জলীয় বাষ্প পানি-শীতল কনডেনসার পেরিয়ে গ্রাহক পাত্রে জমা হওয়া দেখো। প্রতিটি সময়ে পাতিত পানির আয়তন লেখো। লবণ উদ্বায়ী নয়, তাই ফ্লাস্কে থেকে যায়; কখনো বন্ধ যন্ত্র গরম করবে না বা ফ্লাস্ক শুকিয়ে ফেলবে না।',
  formula: 'NaCl(aq) stays in the flask · H₂O(l) → H₂O(g) → H₂O(l)',
  controls: [
    { key: 'heat', en: 'Heating rate', bn: 'তাপ দেওয়ার হার', default: 1, options: DISTILLATION_HEAT_CHOICES },
    { key: 'cooling', en: 'Condenser water', bn: 'কনডেনসারের পানি', default: 1, options: [opt(0, 'Off', 'বন্ধ'), opt(1, 'Flowing', 'চলছে')] },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 35, step: 1, unit: 'min', default: 0, play: { rate: 1.5 } }
  ],
  tasks: DISTILLATION_TIMES.map((time) => ({ en: `${time} min · record distillate`, bn: `${time} min · পাতিত পানি লেখ`, set: { t: time } })),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 'min' },
    { key: 'temperature', en: 'Flask temperature', bn: 'ফ্লাস্কের তাপমাত্রা', unit: '°C', digits: 1 },
    { key: 'distillate', en: 'Distillate collected', bn: 'সংগৃহীত পাতিত পানি', unit: 'mL', digits: 1 },
    { key: 'brine', en: 'Liquid left in flask', bn: 'ফ্লাস্কে অবশিষ্ট তরল', unit: 'mL', digits: 1 },
    { key: 'conductivity', en: 'Distillate conductivity', bn: 'পাতিত পানির পরিবাহিতা', unit: 'mS cm⁻¹', digits: 3 }
  ],
  minReadings: 6,
  graph: { x: 't', y: 'distillate', kind: 'line' },
  compute: (p, noise, ctx) => {
    const time = clamp(p.t, 0, 35);
    const heatIndex = indexOf(p.heat, DISTILLATION_HEAT.length);
    const cooling = p.cooling >= 0.5 ? 1 : 0;
    const measurement = distillationAt(time, heatIndex, cooling);
    const coolOn = cooling === 1;
    const pts = points(ctx.rows, 't', 'distillate');
    const volume = Math.max(0, measurement.distillate + noise(0.25));
    return {
      row: {
        t: round(time, 0),
        temperature: round(measurement.temperature, 1),
        distillate: round(volume, 1),
        brine: round(measurement.brine, 1),
        conductivity: round(measurement.conductivity, 3)
      },
      live: [
        { en: 'Flask temperature', bn: 'ফ্লাস্কের তাপমাত্রা', value: measurement.temperature, unit: '°C', digits: 1, tone: measurement.temperature >= 99 ? 'good' : 'info' },
        { en: 'Distillate collected', bn: 'সংগৃহীত পাতিত পানি', value: measurement.distillate, unit: 'mL', digits: 1 },
        { en: 'Brine remaining', bn: 'অবশিষ্ট লবণ-পানি', value: measurement.brine, unit: 'mL', digits: 1 },
        { en: 'Condenser cooling', bn: 'কনডেনসারের শীতলীকরণ', value: coolOn ? 'water flowing' : 'off', valueBn: coolOn ? 'পানি চলছে' : 'বন্ধ', tone: coolOn ? 'good' : 'warn' }
      ],
      view: {
        time,
        temperature: measurement.temperature,
        distillate: measurement.distillate,
        brineFraction: measurement.brine / DISTILLATION_START_ML,
        evaporated: measurement.evaporated,
        vapour: clamp(measurement.evaporated / 72, 0, 1),
        cooling: coolOn,
        coolingFlow: coolOn ? 1 : 0,
        flame: time > 0 ? measurement.heat : 0,
        bubbles: time > measurement.boilTime ? clamp((time - measurement.boilTime) / 8, 0.05, 0.9) : 0,
        conductivity: measurement.conductivity,
        curve: { pts, cur: { x: time, y: measurement.distillate }, xMax: 35, yMin: 0, yMax: 75, xLabel: 't / min', yLabel: 'distillate / mL' }
      },
      status: time === 0
        ? status('info', 'The salt solution is in the flask. Start gentle heating and keep cooling water flowing through the condenser.', 'লবণ-পানি ফ্লাস্কে আছে। ধীরে তাপ দাও এবং কনডেনসারে শীতল পানি চালু রাখো।')
        : !coolOn
          ? status('warn', 'The flask is boiling, but with condenser water off much of the vapour escapes instead of collecting.', 'ফ্লাস্ক ফুটছে, কিন্তু কনডেনসারের পানি বন্ধ থাকায় অধিকাংশ বাষ্প জমার বদলে বেরিয়ে যাচ্ছে।')
          : measurement.temperature < 99
            ? status('info', `Warm-up: ${measurement.temperature.toFixed(1)} °C. Water has not reached its boiling point yet.`, `উষ্ণ হচ্ছে: ${measurement.temperature.toFixed(1)} °C। পানি এখনও স্ফুটনাঙ্কে পৌঁছায়নি।`)
            : status('good', `${measurement.distillate.toFixed(1)} mL of clear distillate is collected; non-volatile salt stays behind in the flask.`, `${measurement.distillate.toFixed(1)} mL স্বচ্ছ পাতিত পানি জমেছে; অবাষ্পীয় লবণ ফ্লাস্কে থেকে যায়।`),
      ready: time > 0
    };
  },
  result: {
    en: 'Distillate collected after 30 minutes',
    bn: '৩০ মিনিটে সংগৃহীত পাতিত পানি',
    unit: 'mL',
    digits: 1,
    compute: (rows) => {
      const values = rows.map((row) => num(row, 'distillate')).filter((value): value is number => value !== null);
      return values.length ? Math.max(...values) : null;
    },
    expected: (p) => distillationAt(30, indexOf(p.heat, DISTILLATION_HEAT.length), p.cooling >= 0.5 ? 1 : 0).distillate,
    goodWithin: 4
  },
  solve: (p) => p
};

export const extendedModels: ChemPracticalModel[] = [
  conductivitySolutions,
  paperChromatography,
  calciumCarbonateRate,
  ammoniaHclDiffusion,
  simpleDistillation
];
