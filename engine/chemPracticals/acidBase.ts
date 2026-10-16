import { indicatorColor } from '../phCalc';
import type { ChemPracticalModel, ChemRow, TubesView, TubeView } from './types';
import {
  CHOOSE,
  bnNum,
  COLORLESS,
  blendColors,
  clamp,
  concordantMean,
  crossing,
  latestBy,
  num,
  opt,
  optionText,
  points,
  round,
  scoreRows,
  status,
  tick,
  titrationPh,
  tx,
  universalName,
  weakAcidPh,
  weakBasePh
} from './helpers';

const NATURES = [CHOOSE, opt(0, 'Acidic', 'অম্লীয়'), opt(1, 'Neutral', 'প্রশম'), opt(2, 'Alkaline', 'ক্ষারীয়')];
const natureOf = (ph: number) => (ph < 6.5 ? 0 : ph <= 7.5 ? 1 : 2);

const markOf = (row: ChemRow | undefined): TubeView['mark'] => (row ? (num(row, '__correct') === 1 ? 'good' : 'bad') : undefined);

/* ------------------------------------------------------------------ */
/* 1. Litmus and indicator test                                         */
/* ------------------------------------------------------------------ */

const LITMUS_SAMPLES = [
  { short: 'HCl', shortBn: 'HCl', en: 'Dilute hydrochloric acid', bn: 'লঘু হাইড্রোক্লোরিক অ্যাসিড', ph: 1.0, color: '#e9f3ff' },
  { short: 'NaOH', shortBn: 'NaOH', en: 'Sodium hydroxide solution', bn: 'সোডিয়াম হাইড্রোক্সাইড দ্রবণ', ph: 12.7, color: '#eef5ff' },
  { short: 'H₂O', shortBn: 'H₂O', en: 'Distilled water', bn: 'পাতিত পানি', ph: 7.0, color: '#dcefff' },
  { short: 'Vinegar', shortBn: 'ভিনেগার', en: 'Vinegar', bn: 'ভিনেগার (সিরকা)', ph: 2.9, color: '#f5f1e2' },
  { short: 'Limewater', shortBn: 'চুনের পানি', en: 'Limewater', bn: 'চুনের পানি', ph: 12.3, color: '#e9f1f6' },
  { short: 'NaCl', shortBn: 'NaCl', en: 'Salt water', bn: 'লবণ পানি', ph: 7.0, color: '#f0f6fb' }
];

const INDICATORS = [
  { en: 'Blue litmus paper', bn: 'নীল লিটমাস কাগজ', short: 'blue litmus', shortBn: 'নীল লিটমাস', paper: true, drop: '#2f6fd0' },
  { en: 'Red litmus paper', bn: 'লাল লিটমাস কাগজ', short: 'red litmus', shortBn: 'লাল লিটমাস', paper: true, drop: '#d9403c' },
  { en: 'Phenolphthalein', bn: 'ফেনফথ্যালিন', short: 'phenolphthalein', shortBn: 'ফেনফথ্যালিন', paper: false, drop: '#f7f9fc' },
  { en: 'Methyl orange', bn: 'মিথাইল অরেঞ্জ', short: 'methyl orange', shortBn: 'মিথাইল অরেঞ্জ', paper: false, drop: '#f2913c' },
  { en: 'Universal indicator', bn: 'ইউনিভার্সাল ইন্ডিকেটর', short: 'universal', shortBn: 'ইউনিভার্সাল', paper: false, drop: '#7cc24a' }
];

interface IndicatorObs {
  color: string;
  en: string;
  bn: string;
  hintEn: string;
  hintBn: string;
}

export function observeIndicator(indicator: number, ph: number): IndicatorObs {
  switch (indicator) {
    case 0:
      return ph < 5
        ? { color: '#d9403c', en: 'Blue litmus turns red', bn: 'নীল লিটমাস লাল হলো', hintEn: 'Blue litmus turns red only in acids.', hintBn: 'নীল লিটমাস কেবল অ্যাসিডে লাল হয়।' }
        : {
            color: '#2f6fd0',
            en: 'Blue litmus stays blue',
            bn: 'নীল লিটমাস নীলই রইল',
            hintEn: 'Not acidic — but neutral or alkaline? Test with red litmus too.',
            hintBn: 'অম্লীয় নয় — তবে প্রশম না ক্ষারীয়? লাল লিটমাস দিয়েও পরীক্ষা করো।'
          };
    case 1:
      return ph > 8
        ? { color: '#2f6fd0', en: 'Red litmus turns blue', bn: 'লাল লিটমাস নীল হলো', hintEn: 'Red litmus turns blue only in alkalis.', hintBn: 'লাল লিটমাস কেবল ক্ষারে নীল হয়।' }
        : {
            color: '#d9403c',
            en: 'Red litmus stays red',
            bn: 'লাল লিটমাস লালই রইল',
            hintEn: 'Not alkaline — but acidic or neutral? Test with blue litmus too.',
            hintBn: 'ক্ষারীয় নয় — তবে অম্লীয় না প্রশম? নীল লিটমাস দিয়েও পরীক্ষা করো।'
          };
    case 2:
      return ph >= 8.2
        ? { color: indicatorColor('phenolphthalein', Math.min(ph, 12.9)), en: 'Turns pink', bn: 'গোলাপি হলো', hintEn: 'Phenolphthalein is pink only in alkalis.', hintBn: 'ফেনফথ্যালিন কেবল ক্ষারে গোলাপি হয়।' }
        : {
            color: COLORLESS,
            en: 'Stays colourless',
            bn: 'বর্ণহীনই রইল',
            hintEn: 'Acidic OR neutral — phenolphthalein cannot tell these two apart.',
            hintBn: 'অম্লীয় অথবা প্রশম — ফেনফথ্যালিন এ দুটিকে আলাদা করতে পারে না।'
          };
    case 3:
      if (ph < 3.1) return { color: '#e2453c', en: 'Turns red', bn: 'লাল হলো', hintEn: 'Methyl orange is red in acids.', hintBn: 'মিথাইল অরেঞ্জ অ্যাসিডে লাল হয়।' };
      if (ph < 4.4) return { color: '#f5943b', en: 'Turns orange', bn: 'কমলা হলো', hintEn: 'Orange-red: acidic.', hintBn: 'কমলা-লাল: অম্লীয়।' };
      return {
        color: '#f7d44a',
        en: 'Turns yellow',
        bn: 'হলুদ হলো',
        hintEn: 'Neutral OR alkaline — methyl orange cannot tell these two apart.',
        hintBn: 'প্রশম অথবা ক্ষারীয় — মিথাইল অরেঞ্জ এ দুটিকে আলাদা করতে পারে না।'
      };
    default: {
      const name = universalName(ph);
      return {
        color: indicatorColor('universal', ph),
        en: `Turns ${name.en} (pH ≈ ${Math.round(ph)})`,
        bn: `${name.bn} হলো (pH ≈ ${Math.round(ph)})`,
        hintEn: 'Compare the colour with the chart.',
        hintBn: 'রংটি চার্টের সাথে মিলিয়ে দেখো।'
      };
    }
  }
}

const litmusTest: ChemPracticalModel = {
  slug: 'litmus-test',
  scene: 'tubes',
  variant: 'indicator',
  howTo_en:
    'Pick a sample and an indicator. Blue/red litmus paper is dipped in; liquid indicators are added drop by drop. Read the colour, decide whether the sample is acidic, neutral or alkaline, then record. Some indicators cannot separate two natures — test again with another one.',
  howTo_bn:
    'একটি নমুনা ও একটি নির্দেশক বেছে নাও। নীল/লাল লিটমাস কাগজ ডুবানো হয়, তরল নির্দেশক ফোঁটায় ফোঁটায় দেওয়া হয়। রং দেখে ঠিক করো নমুনাটি অম্লীয়, প্রশম না ক্ষারীয়, তারপর রেকর্ড করো। কিছু নির্দেশক দুই ধরনকে আলাদা করতে পারে না — তখন অন্য নির্দেশক দিয়ে আবার পরীক্ষা করো।',
  formula: 'acid: pH < 7 · neutral: pH = 7 · alkali: pH > 7',
  controls: [
    { key: 'sample', en: 'Sample', bn: 'নমুনা', default: 0, options: LITMUS_SAMPLES.map((s, i) => opt(i, s.short, s.shortBn)) },
    { key: 'indicator', en: 'Indicator', bn: 'নির্দেশক', default: 0, options: INDICATORS.map((d, i) => opt(i, d.en, d.bn)) },
    { key: 'nature', en: 'Your conclusion: the sample is…', bn: 'তোমার সিদ্ধান্ত: নমুনাটি…', kind: 'inference', default: -1, options: NATURES }
  ],
  tasks: LITMUS_SAMPLES.map((s, i) => ({ en: s.short, bn: s.shortBn, set: { sample: i } })),
  columns: [
    { key: 'sample', en: 'Sample', bn: 'নমুনা' },
    { key: 'indicator', en: 'Indicator', bn: 'নির্দেশক' },
    { key: 'obs', en: 'Observation', bn: 'পর্যবেক্ষণ' },
    { key: 'nature', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 6,
  compute: (p, _noise, ctx) => {
    const si = clamp(Math.round(p.sample), 0, LITMUS_SAMPLES.length - 1);
    const ii = clamp(Math.round(p.indicator), 0, INDICATORS.length - 1);
    const s = LITMUS_SAMPLES[si];
    const ind = INDICATORS[ii];
    const obs = observeIndicator(ii, s.ph);
    const truth = natureOf(s.ph);
    const chosen = p.nature >= 0;
    const correct = chosen && p.nature === truth;
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = LITMUS_SAMPLES.map((smp, i) => {
      const active = i === si;
      const rec = latest.get(String(i));
      let liquid = smp.color;
      if (active && !ind.paper) liquid = blendColors(smp.color, obs.color, 0.88);
      else if (!active && rec && num(rec, '__paper') !== 1 && typeof rec.__color === 'string') liquid = blendColors(smp.color, rec.__color, 0.88);
      return { label: smp.short, labelBn: smp.shortBn, liquid, level: 0.42, active, mark: markOf(rec) };
    });
    const view: TubesView = {
      tubes,
      dropper: ind.paper ? undefined : { tube: si, color: ind.drop, label: ind.short },
      paper: ind.paper ? { tube: si, color: obs.color, label: ind.short, labelBn: ind.shortBn } : undefined,
      chart: ii === 4
    };
    const verdict = optionText(NATURES, p.nature);
    return {
      row: {
        ...tx('sample', s.en, s.bn),
        ...tx('indicator', ind.en, ind.bn),
        ...tx('obs', obs.en, obs.bn),
        ...tx('nature', verdict.en, verdict.bn),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0,
        __color: obs.color,
        __paper: ind.paper ? 1 : 0
      },
      live: [
        { en: 'Sample', bn: 'নমুনা', value: s.en, valueBn: s.bn },
        { en: 'Indicator', bn: 'নির্দেশক', value: ind.en, valueBn: ind.bn },
        { en: 'Observation', bn: 'পর্যবেক্ষণ', value: obs.en, valueBn: obs.bn, tone: 'info' },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—', valueBn: chosen ? verdict.bn : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status: chosen
        ? status('info', `${obs.en}. Your conclusion: ${verdict.en.toLowerCase()} — record it.`, `${obs.bn}। তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
        : status('info', `${obs.en}. ${obs.hintEn} Now choose your conclusion.`, `${obs.bn}। ${obs.hintBn} এবার তোমার সিদ্ধান্ত বেছে নাও।`),
      ready: chosen,
      correct
    };
  },
  result: { en: 'Samples classified correctly', bn: 'সঠিকভাবে শ্রেণিবদ্ধ নমুনা', unit: '', score: true, compute: scoreRows, expected: 6, absolute: true, tolerance: 0 },
  solve: (p) => ({ ...p, indicator: 4, nature: natureOf(LITMUS_SAMPLES[clamp(Math.round(p.sample), 0, LITMUS_SAMPLES.length - 1)].ph) })
};

/* ------------------------------------------------------------------ */
/* 2. Neutralisation curve (universal indicator + pH meter)             */
/* ------------------------------------------------------------------ */

const NEUT_VA = 25;
const NEUT_C = 1.0;
const DH_NEUT = 57100; // J mol⁻¹ released

const neutralisation: ChemPracticalModel = {
  slug: 'acid-base-neutralisation',
  scene: 'titration',
  variant: 'neutralisation',
  howTo_en:
    '25.0 mL of 1.0 M HCl with universal indicator sits under a burette of 1.0 M NaOH. Run in NaOH, watch the colour, the pH meter and the thermometer, and record a reading at each suggested volume. The pH-7 crossing of your curve gives the neutralisation volume.',
  howTo_bn:
    'বুরেটের নিচে ইউনিভার্সাল ইন্ডিকেটরসহ 25.0 mL 1.0 M HCl রাখা আছে, বুরেটে 1.0 M NaOH। NaOH যোগ করো, রং, pH মিটার ও থার্মোমিটার লক্ষ করো এবং প্রতিটি প্রস্তাবিত আয়তনে পাঠ রেকর্ড করো। লেখচিত্রে যেখানে pH 7 অতিক্রম করে, সেটিই প্রশমন আয়তন।',
  formula: 'HCl + NaOH → NaCl + H₂O · V(NaOH) = C(HCl)·V(HCl) ÷ C(NaOH)',
  controls: [{ key: 'vb', en: 'NaOH run in', bn: 'যোগ করা NaOH', kind: 'time', min: 0, max: 40, step: 0.5, unit: 'mL', default: 0, fine: true, digits: 1 }],
  tasks: [0, 10, 20, 24, 25, 26, 30, 40].map((v) => ({ en: `${v} mL`, bn: `${v} mL`, set: { vb: v } })),
  columns: [
    { key: 'vb', en: 'V(NaOH)', bn: 'V(NaOH)', unit: 'mL', digits: 1 },
    { key: 'ph', en: 'pH', bn: 'pH', digits: 2 },
    { key: 'colour', en: 'Colour', bn: 'রং' },
    { key: 'temp', en: 'Temperature', bn: 'তাপমাত্রা', unit: '°C', digits: 1 }
  ],
  minReadings: 8,
  graph: { x: 'vb', y: 'ph', kind: 'line' },
  compute: (p, noise, ctx) => {
    const vb = clamp(p.vb, 0, 40);
    const ph = titrationPh({ va: NEUT_VA, ca: NEUT_C, vb, cb: NEUT_C });
    const nReact = Math.min((NEUT_VA * NEUT_C) / 1000, (vb * NEUT_C) / 1000);
    const temp = 25 + (DH_NEUT * nReact) / ((NEUT_VA + vb) * 4.18);
    const color = indicatorColor('universal', ph);
    const name = universalName(ph);
    const pts = points(ctx.rows, 'vb', 'ph');
    const tone = ph < 6.5 ? 'info' : ph <= 7.5 ? 'good' : 'warn';
    return {
      row: { vb: round(vb, 1), ph: round(ph + noise(0.03), 2), ...tx('colour', name.en, name.bn), temp: round(temp + noise(0.05), 1) },
      live: [
        { en: 'NaOH added', bn: 'যোগ করা NaOH', value: vb, unit: 'mL', digits: 1 },
        { en: 'pH meter', bn: 'pH মিটার', value: ph, digits: 2, tone },
        { en: 'Indicator colour', bn: 'নির্দেশকের রং', value: name.en, valueBn: name.bn },
        { en: 'Temperature', bn: 'তাপমাত্রা', value: temp, unit: '°C', digits: 1 }
      ],
      view: {
        vessel: 'beaker',
        liquid: color,
        level: (NEUT_VA + vb) / 80,
        burette: { reading: vb, max: 50, color: '#eef5ff', label: 'NaOH 1.0 M' },
        meter: ph,
        thermo: temp,
        flaskLabel: 'HCl 25.0 mL + UI',
        curve: { pts, cur: { x: vb, y: ph }, xMax: 40, yMin: 0, yMax: 14, xLabel: 'V / mL', yLabel: 'pH' }
      },
      status:
        ph < 6.5
          ? status('info', 'Still acidic (red–orange–yellow). Keep adding NaOH and take the next reading.', 'এখনও অম্লীয় (লাল–কমলা–হলুদ)। আরও NaOH যোগ করো এবং পরের পাঠ নাও।')
          : ph <= 7.5
            ? status('good', 'Green — neutral! The acid has just been neutralised. Record this reading.', 'সবুজ — প্রশম! অ্যাসিডটি এইমাত্র প্রশমিত হলো। এই পাঠটি রেকর্ড করো।')
            : status('warn', 'Blue–violet: excess NaOH, the solution is now alkaline. The temperature stops rising.', 'নীল–বেগুনি: NaOH বেশি হয়ে গেছে, দ্রবণ এখন ক্ষারীয়। তাপমাত্রা আর বাড়ছে না।'),
      ready: true
    };
  },
  result: {
    en: 'Neutralisation volume (pH 7 on your curve)',
    bn: 'প্রশমন আয়তন (লেখচিত্রে pH 7)',
    unit: 'mL',
    digits: 2,
    compute: (rows) => crossing(points(rows, 'vb', 'ph'), 7),
    expected: 25
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 3. Acid–base titration with a burette                                */
/* ------------------------------------------------------------------ */

const TIT_VA = 20.0;
const TIT_CB = 0.1;
const TIT_CA = 0.125;
const TIT_VEQ = (TIT_VA * TIT_CA) / TIT_CB; // 25.00 mL
const TIT_INITIAL = [0, 0.5, 1.2];

/** Shared end-point logic for the colour-change titrations. */
export function endPointStatus(excess: number, nearMl = 1, window = 0.1) {
  if (excess <= -nearMl) return 'far' as const;
  if (excess <= 1e-9) return 'near' as const;
  if (excess <= window + 1e-9) return 'end' as const;
  return 'over' as const;
}

const titration: ChemPracticalModel = {
  slug: 'titration-burette',
  scene: 'titration',
  variant: 'acidBase',
  howTo_en:
    'Pipette 20.0 mL of the HCl into the flask with two drops of phenolphthalein. Run in 0.100 M NaOH from the burette (use ± for single drops) until a faint pink colour stays. Record the burette readings, then repeat for trials 2 and 3 — concordant titres give the acid concentration.',
  howTo_bn:
    'পিপেট দিয়ে 20.0 mL HCl ফ্লাস্কে নাও, দুই ফোঁটা ফেনফথ্যালিন দাও। বুরেট থেকে 0.100 M NaOH যোগ করো (এক ফোঁটার জন্য ± চাপো), যতক্ষণ না হালকা গোলাপি রং স্থায়ী হয়। বুরেট পাঠ রেকর্ড করো, তারপর ট্রায়াল ২ ও ৩ করো — মিলে যাওয়া টাইটার থেকে অ্যাসিডের ঘনমাত্রা বের হবে।',
  formula: 'C(HCl) = C(NaOH) × V(NaOH) ÷ V(HCl)',
  controls: [
    { key: 'trial', en: 'Titration', bn: 'টাইট্রেশন', default: 1, options: [opt(1, 'Trial 1', 'ট্রায়াল ১'), opt(2, 'Trial 2', 'ট্রায়াল ২'), opt(3, 'Trial 3', 'ট্রায়াল ৩')] },
    { key: 'vol', en: 'NaOH run in from the burette', bn: 'বুরেট থেকে যোগ করা NaOH', kind: 'time', min: 0, max: 35, step: 0.05, unit: 'mL', default: 0, fine: true, digits: 2 }
  ],
  tasks: [1, 2, 3].map((k) => ({ en: `Trial ${k}`, bn: `ট্রায়াল ${bnNum(k)}`, set: { trial: k } })),
  columns: [
    { key: 'trial', en: 'Trial', bn: 'ট্রায়াল' },
    { key: 'initial', en: 'Initial reading', bn: 'প্রাথমিক পাঠ', unit: 'mL', digits: 2 },
    { key: 'final', en: 'Final reading', bn: 'চূড়ান্ত পাঠ', unit: 'mL', digits: 2 },
    { key: 'titre', en: 'Titre', bn: 'টাইটার', unit: 'mL', digits: 2 }
  ],
  minReadings: 3,
  compute: (p, noise) => {
    const trial = clamp(Math.round(p.trial), 1, 3);
    const vol = clamp(p.vol, 0, 35);
    const initial = TIT_INITIAL[trial - 1];
    const excess = vol - TIT_VEQ;
    const stage = endPointStatus(excess);
    const color = stage === 'end' ? '#f9c9de' : stage === 'over' ? blendColors('#f39ac4', '#d92f86', clamp(excess / 1.5, 0, 1)) : COLORLESS;
    const err = noise(0.03);
    const titre = round(vol + err, 2);
    const colourName =
      stage === 'end'
        ? { en: 'faint permanent pink', bn: 'হালকা স্থায়ী গোলাপি' }
        : stage === 'over'
          ? { en: 'deep pink', bn: 'গাঢ় গোলাপি' }
          : { en: 'colourless', bn: 'বর্ণহীন' };
    return {
      row: { trial, initial: round(initial, 2), final: round(initial + titre, 2), titre },
      live: [
        { en: 'Burette reading', bn: 'বুরেট পাঠ', value: initial + vol, unit: 'mL', digits: 2 },
        { en: 'Titre so far', bn: 'এখন পর্যন্ত টাইটার', value: vol, unit: 'mL', digits: 2 },
        { en: 'Flask colour', bn: 'ফ্লাস্কের রং', value: colourName.en, valueBn: colourName.bn, tone: stage === 'end' ? 'good' : stage === 'over' ? 'bad' : undefined },
        { en: 'Trial', bn: 'ট্রায়াল', value: trial }
      ],
      view: {
        vessel: 'conical',
        liquid: color,
        level: (TIT_VA + vol) / 110,
        burette: { reading: initial + vol, max: 50, color: '#eef5ff', label: 'NaOH 0.100 M' },
        tile: true,
        flash: stage === 'near' ? '#f6a8cc' : undefined,
        flaskLabel: 'HCl 20.0 mL',
        endpoint: stage === 'end'
      },
      status:
        stage === 'far'
          ? status('info', 'Colourless. Open the tap and swirl the flask while NaOH runs in.', 'বর্ণহীন। ট্যাপ খুলে NaOH যোগ করতে করতে ফ্লাস্কটি ঘোরাও।')
          : stage === 'near'
            ? status('warn', 'Pink flashes where the drops land, then fades — the end point is close. Add one drop at a time (±).', 'ফোঁটা পড়ার জায়গায় গোলাপি ঝলক দেখা দিয়ে মিলিয়ে যাচ্ছে — শেষ বিন্দু কাছে। এক ফোঁটা করে যোগ করো (±)।')
            : stage === 'end'
              ? status('good', 'A faint pink colour stays — end point! Read the burette at eye level and record.', 'হালকা গোলাপি রং স্থায়ী হলো — শেষ বিন্দু! চোখের সমতলে বুরেট পড়ে রেকর্ড করো।')
              : status('bad', 'Deep pink — you overshot the end point. Lower the volume to the first permanent pink.', 'গাঢ় গোলাপি — শেষ বিন্দু পেরিয়ে গেছ। প্রথম স্থায়ী গোলাপিতে আয়তন কমিয়ে আনো।'),
      ready: stage === 'end'
    };
  },
  result: {
    en: 'Concentration of the hydrochloric acid',
    bn: 'হাইড্রোক্লোরিক অ্যাসিডের ঘনমাত্রা',
    unit: 'mol L⁻¹',
    digits: 4,
    compute: (rows) => {
      const titres = rows.map((r) => num(r, 'titre')).filter((v): v is number => v !== null);
      const v = concordantMean(titres, 0.1);
      return v === null ? null : (TIT_CB * v) / TIT_VA;
    },
    expected: TIT_CA
  },
  solve: (p) => ({ ...p, vol: TIT_VEQ + 0.05 })
};

/* ------------------------------------------------------------------ */
/* 4. pH of salt solutions (hydrolysis)                                 */
/* ------------------------------------------------------------------ */

const SALTS = [
  { f: 'NaCl', en: 'Sodium chloride', bn: 'সোডিয়াম ক্লোরাইড', color: '#f0f6fb', parentEn: 'strong acid + strong base', parentBn: 'তীব্র অ্যাসিড + তীব্র ক্ষার', ph: () => 7.0 },
  { f: 'Na₂CO₃', en: 'Sodium carbonate', bn: 'সোডিয়াম কার্বনেট', color: '#f1f7fb', parentEn: 'weak acid + strong base', parentBn: 'দুর্বল অ্যাসিড + তীব্র ক্ষার', ph: (c: number) => weakBasePh(c, 2.1e-4) },
  { f: 'NH₄Cl', en: 'Ammonium chloride', bn: 'অ্যামোনিয়াম ক্লোরাইড', color: '#f7f8f6', parentEn: 'strong acid + weak base', parentBn: 'তীব্র অ্যাসিড + দুর্বল ক্ষার', ph: (c: number) => weakAcidPh(c, 5.6e-10) },
  { f: 'CH₃COONa', en: 'Sodium acetate', bn: 'সোডিয়াম অ্যাসিটেট', color: '#f2f7f8', parentEn: 'weak acid + strong base', parentBn: 'দুর্বল অ্যাসিড + তীব্র ক্ষার', ph: (c: number) => weakBasePh(c, 5.6e-10) },
  { f: 'CuSO₄', en: 'Copper(II) sulphate', bn: 'কপার(II) সালফেট', color: '#2f7fd6', parentEn: 'strong acid + weak base', parentBn: 'তীব্র অ্যাসিড + দুর্বল ক্ষার', ph: (c: number) => weakAcidPh(c, 1.0e-8) },
  { f: 'KNO₃', en: 'Potassium nitrate', bn: 'পটাশিয়াম নাইট্রেট', color: '#f1f6fa', parentEn: 'strong acid + strong base', parentBn: 'তীব্র অ্যাসিড + তীব্র ক্ষার', ph: () => 7.0 }
];
const SALT_CONC = [0.01, 0.1, 1.0];

const saltPh: ChemPracticalModel = {
  slug: 'salt-solution-ph',
  scene: 'tubes',
  variant: 'saltPh',
  howTo_en:
    'Dissolve each salt in distilled water, add universal indicator and dip the pH meter. Decide whether the solution is acidic, neutral or alkaline and record. A salt of a weak acid or weak base reacts with water (hydrolysis), so not every salt solution is neutral.',
  howTo_bn:
    'প্রতিটি লবণ পাতিত পানিতে দ্রবীভূত করো, ইউনিভার্সাল ইন্ডিকেটর দাও এবং pH মিটার ডুবাও। দ্রবণটি অম্লীয়, প্রশম না ক্ষারীয় তা ঠিক করে রেকর্ড করো। দুর্বল অ্যাসিড বা দুর্বল ক্ষারের লবণ পানির সাথে বিক্রিয়া করে (আর্দ্রবিশ্লেষণ), তাই সব লবণের দ্রবণ প্রশম নয়।',
  formula: 'CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻ · NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺',
  controls: [
    { key: 'salt', en: 'Salt', bn: 'লবণ', default: 0, options: SALTS.map((s, i) => opt(i, s.f, s.f)) },
    { key: 'conc', en: 'Concentration', bn: 'ঘনমাত্রা', default: 1, options: SALT_CONC.map((c, i) => opt(i, `${c} M`, `${c} M`)) },
    { key: 'nature', en: 'Your conclusion: the solution is…', bn: 'তোমার সিদ্ধান্ত: দ্রবণটি…', kind: 'inference', default: -1, options: NATURES }
  ],
  tasks: SALTS.map((s, i) => ({ en: s.f, bn: s.f, set: { salt: i, conc: 1 } })),
  columns: [
    { key: 'salt', en: 'Salt', bn: 'লবণ' },
    { key: 'c', en: 'c', bn: 'c', unit: 'M' },
    { key: 'ph', en: 'pH', bn: 'pH', digits: 2 },
    { key: 'colour', en: 'Indicator', bn: 'নির্দেশক' },
    { key: 'nature', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 6,
  compute: (p, noise, ctx) => {
    const si = clamp(Math.round(p.salt), 0, SALTS.length - 1);
    const s = SALTS[si];
    const c = SALT_CONC[clamp(Math.round(p.conc), 0, 2)];
    const ph = s.ph(c);
    const truth = natureOf(ph);
    const chosen = p.nature >= 0;
    const correct = chosen && p.nature === truth;
    const ui = indicatorColor('universal', ph);
    const name = universalName(ph);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = SALTS.map((salt, i) => {
      const rec = latest.get(String(i));
      const active = i === si;
      const tested = active || rec;
      const shown = active ? ui : rec && typeof rec.__color === 'string' ? rec.__color : salt.color;
      return { label: salt.f, liquid: tested ? blendColors(salt.color, shown, salt.f === 'CuSO₄' ? 0.55 : 0.88) : salt.color, level: 0.42, active, mark: markOf(rec) };
    });
    const verdict = optionText(NATURES, p.nature);
    const view: TubesView = { tubes, meter: { tube: si, value: ph }, dropper: { tube: si, color: '#7cc24a', label: 'UI' }, chart: true };
    const masked = s.f === 'CuSO₄';
    return {
      row: {
        ...tx('salt', s.f, s.f),
        c,
        ph: round(ph + noise(0.02), 2),
        ...tx('colour', name.en, name.bn),
        ...tx('nature', verdict.en, verdict.bn),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0,
        __color: ui
      },
      live: [
        { en: 'pH meter', bn: 'pH মিটার', value: ph, digits: 2, tone: 'info' },
        { en: 'Universal indicator', bn: 'ইউনিভার্সাল ইন্ডিকেটর', value: name.en, valueBn: name.bn },
        { en: 'Salt', bn: 'লবণ', value: s.en, valueBn: s.bn },
        { en: 'Concentration', bn: 'ঘনমাত্রা', value: c, unit: 'M' }
      ],
      view: view as unknown as Record<string, unknown>,
      status: masked
        ? status('warn', 'The blue colour of Cu²⁺ masks the indicator — trust the pH meter here.', 'Cu²⁺-এর নীল রং নির্দেশকের রং ঢেকে দেয় — এখানে pH মিটারের পাঠ বিশ্বাস করো।')
        : chosen
          ? status('info', `pH ${ph.toFixed(1)} — your conclusion: ${verdict.en.toLowerCase()}. Record it.`, `pH ${ph.toFixed(1)} — তোমার সিদ্ধান্ত: ${verdict.bn}। রেকর্ড করো।`)
          : status('info', `The meter reads pH ${ph.toFixed(1)}. Is the solution acidic, neutral or alkaline?`, `মিটারে pH ${ph.toFixed(1)}। দ্রবণটি অম্লীয়, প্রশম না ক্ষারীয়?`),
      ready: chosen,
      correct
    };
  },
  result: { en: 'Salt solutions classified correctly', bn: 'সঠিকভাবে শ্রেণিবদ্ধ লবণ-দ্রবণ', unit: '', score: true, compute: scoreRows, expected: 6, absolute: true, tolerance: 0 },
  solve: (p) => {
    const s = SALTS[clamp(Math.round(p.salt), 0, SALTS.length - 1)];
    return { ...p, nature: natureOf(s.ph(SALT_CONC[clamp(Math.round(p.conc), 0, 2)])) };
  }
};

/* ------------------------------------------------------------------ */
/* 5. Strong vs weak acid — pKa of ethanoic acid                        */
/* ------------------------------------------------------------------ */

const KA_ETHANOIC = 1.8e-5;
const ACID_CONC = [1.0, 0.1, 0.01];

function acidPh(acid: number, c: number): number {
  return acid === 0 ? weakAcidPh(c, Infinity) : weakAcidPh(c, KA_ETHANOIC);
}

const acidStrength: ChemPracticalModel = {
  slug: 'acid-strength-comparison',
  scene: 'tubes',
  variant: 'acidStrength',
  howTo_en:
    'Hydrochloric acid and ethanoic acid of the same concentration stand side by side with a magnesium ribbon in each. Choose the acid to probe with the pH meter and conductivity tester, record every suggested concentration, and work out how much of the weak acid ionises.',
  howTo_bn:
    'একই ঘনমাত্রার হাইড্রোক্লোরিক অ্যাসিড ও ইথানোইক অ্যাসিড পাশাপাশি রাখা, প্রতিটিতে একটি ম্যাগনেসিয়াম ফিতা। pH মিটার ও পরিবাহিতা পরীক্ষকের জন্য অ্যাসিড বেছে নাও, প্রতিটি প্রস্তাবিত ঘনমাত্রায় পাঠ রেকর্ড করো এবং দুর্বল অ্যাসিডের কতটুকু আয়নিত হয় তা বের করো।',
  formula: 'Ka = [H⁺]² ÷ (c − [H⁺]) · pKa = −log Ka',
  controls: [
    { key: 'acid', en: 'Probe in', bn: 'প্রোব কোথায়', kind: 'view', default: 1, options: [opt(0, 'HCl (strong)', 'HCl (তীব্র)'), opt(1, 'CH₃COOH (weak)', 'CH₃COOH (দুর্বল)')] },
    { key: 'conc', en: 'Concentration of both acids', bn: 'দুই অ্যাসিডের ঘনমাত্রা', default: 1, options: ACID_CONC.map((c, i) => opt(i, `${c} M`, `${c} M`)) }
  ],
  tasks: [
    ...ACID_CONC.map((c, i) => ({ en: `CH₃COOH ${c} M`, bn: `CH₃COOH ${c} M`, set: { acid: 1, conc: i } })),
    ...ACID_CONC.map((c, i) => ({ en: `HCl ${c} M`, bn: `HCl ${c} M`, set: { acid: 0, conc: i } }))
  ],
  columns: [
    { key: 'acid', en: 'Acid', bn: 'অ্যাসিড' },
    { key: 'c', en: 'c', bn: 'c', unit: 'M' },
    { key: 'ph', en: 'pH', bn: 'pH', digits: 2 },
    { key: 'h', en: '[H⁺]', bn: '[H⁺]', unit: 'M', scientific: true },
    { key: 'alpha', en: 'Ionised', bn: 'আয়নিত', unit: '%', digits: 2 },
    { key: 'pka', en: 'pKa', bn: 'pKa', digits: 2 }
  ],
  minReadings: 6,
  graph: { x: 'c', y: 'alpha', kind: 'scatter' },
  compute: (p, noise) => {
    const acid = p.acid === 0 ? 0 : 1;
    const c = ACID_CONC[clamp(Math.round(p.conc), 0, 2)];
    const ph = acidPh(acid, c);
    const phRead = ph + noise(0.02);
    const h = Math.pow(10, -phRead);
    const alpha = Math.min(100, (h / c) * 100);
    const pka = acid === 1 && c - h > 0 ? -Math.log10((h * h) / (c - h)) : null;
    const hTrue = (a: number) => Math.pow(10, -acidPh(a, c));
    // κ (mS cm⁻¹) = Λ (S cm² mol⁻¹) × c(ions) (mol L⁻¹)
    const kappa = (a: number) => (a === 0 ? 426 * c : 390 * hTrue(1));
    const tubes: TubeView[] = [0, 1].map((a) => ({
      label: a === 0 ? 'HCl' : 'CH₃COOH',
      sub: `${c} M`,
      liquid: '#eaf3fb',
      level: 0.46,
      bubbles: clamp(Math.pow(hTrue(a) / 1, 0.45) * 1.1, 0.04, 1),
      solid: { kind: 'ribbon', color: '#d8dee6', amount: 1 },
      active: a === acid
    }));
    const k = kappa(acid);
    const view: TubesView = { tubes, meter: { tube: acid, value: ph }, bulb: { tube: acid, brightness: clamp(0.15 + Math.log10(1 + k) / 2.8, 0.08, 1) } };
    return {
      row: {
        ...tx('acid', acid === 0 ? 'HCl' : 'CH₃COOH', acid === 0 ? 'HCl' : 'CH₃COOH'),
        c,
        ph: round(phRead, 2),
        h: Number(h.toPrecision(3)),
        alpha: round(alpha, 2),
        pka: pka === null ? '—' : round(pka, 2),
        __acid: acid
      },
      live: [
        { en: 'pH', bn: 'pH', value: ph, digits: 2, tone: 'info' },
        { en: '[H⁺]', bn: '[H⁺]', value: Number(Math.pow(10, -ph).toPrecision(3)), unit: 'M' },
        { en: 'Conductivity', bn: 'পরিবাহিতা', value: k, unit: 'mS cm⁻¹', digits: k < 10 ? 2 : 1 },
        { en: 'Ionised', bn: 'আয়নিত', value: Math.min(100, (Math.pow(10, -ph) / c) * 100), unit: '%', digits: 2 }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        acid === 0
          ? status('info', 'HCl ionises completely: [H⁺] = c, the bulb glows brightly and Mg fizzes fast.', 'HCl সম্পূর্ণ আয়নিত হয়: [H⁺] = c, বাতি উজ্জ্বল জ্বলে, Mg দ্রুত বুদবুদ ছাড়ে।')
          : status('info', 'Ethanoic acid ionises only slightly: higher pH, dim bulb, slow fizzing — the same total gas comes off eventually.', 'ইথানোইক অ্যাসিড সামান্যই আয়নিত হয়: pH বেশি, বাতি নিভু নিভু, বুদবুদ ধীরে — তবে শেষে মোট গ্যাস সমানই বের হয়।'),
      ready: true
    };
  },
  result: {
    en: 'pKa of ethanoic acid',
    bn: 'ইথানোইক অ্যাসিডের pKa',
    unit: '',
    digits: 2,
    compute: (rows) => {
      const vals = rows.filter((r) => num(r, '__acid') === 1).map((r) => num(r, 'pka')).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    },
    expected: -Math.log10(KA_ETHANOIC)
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* 6. Enthalpy of neutralisation (thermometric titration)               */
/* ------------------------------------------------------------------ */

const HN_VA = 25;
const HN_DH = [57.1, 55.9]; // kJ mol⁻¹ released: HCl, CH3COOH

const heatNeutralisation: ChemPracticalModel = {
  slug: 'heat-of-neutralisation',
  scene: 'calorimeter',
  howTo_en:
    '25.0 mL of 1.0 M acid sits in a polystyrene cup. Add 1.0 M NaOH in 5 mL portions, stir and record the highest temperature after each addition. The temperature peaks when the acid is exactly neutralised; ΔH = −m·c·ΔT ÷ n(H₂O).',
  howTo_bn:
    'পলিস্টাইরিন কাপে 25.0 mL 1.0 M অ্যাসিড আছে। 5 mL করে 1.0 M NaOH যোগ করো, নাড়ো এবং প্রতিবার সর্বোচ্চ তাপমাত্রা রেকর্ড করো। অ্যাসিড ঠিক প্রশমিত হলে তাপমাত্রা সর্বোচ্চ হয়; ΔH = −m·c·ΔT ÷ n(H₂O)।',
  formula: 'ΔH = −(m × 4.18 × ΔT) ÷ n(H₂O)',
  controls: [
    { key: 'acid', en: 'Acid in the cup', bn: 'কাপের অ্যাসিড', default: 0, options: [opt(0, 'HCl (strong)', 'HCl (তীব্র)'), opt(1, 'CH₃COOH (weak)', 'CH₃COOH (দুর্বল)')] },
    { key: 'lid', en: 'Lid', bn: 'ঢাকনা', default: 1, options: [opt(1, 'Lid on', 'ঢাকনা আছে'), opt(0, 'No lid', 'ঢাকনা নেই')] },
    { key: 'vb', en: 'NaOH added', bn: 'যোগ করা NaOH', kind: 'time', min: 0, max: 50, step: 5, unit: 'mL', default: 0 }
  ],
  tasks: [0, 5, 10, 15, 20, 25, 30, 40].map((v) => ({ en: `${v} mL`, bn: `${v} mL`, set: { vb: v } })),
  columns: [
    { key: 'vb', en: 'V(NaOH)', bn: 'V(NaOH)', unit: 'mL' },
    { key: 'temp', en: 'Highest T', bn: 'সর্বোচ্চ T', unit: '°C', digits: 1 },
    { key: 'dt', en: 'ΔT', bn: 'ΔT', unit: '°C', digits: 1 },
    { key: 'dh', en: 'ΔH', bn: 'ΔH', unit: 'kJ mol⁻¹', digits: 1 }
  ],
  minReadings: 8,
  graph: { x: 'vb', y: 'temp', kind: 'line' },
  compute: (p, noise, ctx) => {
    const acid = p.acid === 1 ? 1 : 0;
    const lid = p.lid !== 0;
    const vb = clamp(p.vb, 0, 50);
    const n = Math.min(HN_VA / 1000, vb / 1000);
    const loss = lid ? 0.01 : 0.12;
    const mass = HN_VA + vb;
    const dT = (HN_DH[acid] * 1000 * n * (1 - loss)) / (mass * 4.18);
    const tRead = 25 + dT + noise(0.05);
    const dtRead = tRead - 25;
    const dh = n > 0 ? -(mass * 4.18 * dtRead) / (n * 1000) : null;
    return {
      row: { vb: round(vb, 0), temp: round(tRead, 1), dt: round(dtRead, 1), dh: dh === null ? '—' : round(dh, 1), __acid: acid },
      live: [
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: 25 + dT, unit: '°C', digits: 1, tone: 'info' },
        { en: 'Rise ΔT', bn: 'বৃদ্ধি ΔT', value: dT, unit: '°C', digits: 2 },
        { en: 'Water formed', bn: 'উৎপন্ন পানি', value: n * 1000, unit: 'mmol', digits: 1 },
        { en: 'Total volume', bn: 'মোট আয়তন', value: mass, unit: 'mL', digits: 0 }
      ],
      view: {
        temp: 25 + dT,
        vb,
        lid,
        acidLabel: acid === 0 ? 'HCl 1.0 M' : 'CH₃COOH 1.0 M',
        level: mass / 100,
        curve: { pts: points(ctx.rows, 'vb', 'temp'), cur: { x: vb, y: 25 + dT }, xMax: 50, yMin: 24, yMax: 33, xLabel: 'V(NaOH) / mL', yLabel: 'T / °C' }
      },
      status: !lid
        ? status('warn', 'No lid: heat escapes to the air, so ΔT (and ΔH) will come out too small. Put the lid on.', 'ঢাকনা নেই: তাপ বাতাসে চলে যাচ্ছে, তাই ΔT (এবং ΔH) কম আসবে। ঢাকনা লাগাও।')
        : vb < HN_VA
          ? status('info', 'Temperature rising — acid still in excess. Add the next 5 mL portion.', 'তাপমাত্রা বাড়ছে — অ্যাসিড এখনও বেশি। পরের 5 mL যোগ করো।')
          : vb === HN_VA
            ? status('good', 'Peak temperature: the acid is exactly neutralised.', 'সর্বোচ্চ তাপমাত্রা: অ্যাসিড ঠিক প্রশমিত হয়েছে।')
            : status('info', 'Excess NaOH only dilutes and cools the mixture — the temperature falls slowly.', 'বাড়তি NaOH শুধু মিশ্রণকে লঘু ও ঠান্ডা করে — তাপমাত্রা ধীরে কমছে।'),
      ready: true
    };
  },
  result: {
    en: 'Enthalpy of neutralisation (three warmest readings)',
    bn: 'প্রশমন এনথালপি (সবচেয়ে উষ্ণ তিনটি পাঠ থেকে)',
    unit: 'kJ mol⁻¹',
    digits: 1,
    compute: (rows) => {
      const rs = rows
        .filter((r) => (num(r, 'vb') ?? 0) > 0 && num(r, 'dh') !== null)
        .sort((a, b) => (num(b, 'dt') ?? 0) - (num(a, 'dt') ?? 0))
        .slice(0, 3);
      if (!rs.length) return null;
      return rs.reduce((s, r) => s + (num(r, 'dh') ?? 0), 0) / rs.length;
    },
    expected: (p) => -HN_DH[p.acid === 1 ? 1 : 0]
  },
  solve: (p) => ({ ...p, lid: 1 })
};

export const acidBaseModels: ChemPracticalModel[] = [litmusTest, neutralisation, titration, saltPh, acidStrength, heatNeutralisation];
