import type { ChemPracticalModel, ChemRow } from './types';
import { blendColors, clamp, num, opt, points, round, status, tx } from './helpers';

const values = (rows: ChemRow[], key: string) => rows.map((r) => num(r, key)).filter((v): v is number => v !== null);
const meanOf = (vals: number[]): number | null => (vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null);
const minTasks = (times: number[], extra: Record<string, number> = {}) => times.map((t) => ({ en: `${t} min`, bn: `${t} মিনিট`, set: { ...extra, t } }));

/* ------------------------------------------------------------------ */
/* Heating curve and boiling point                                       */
/* ------------------------------------------------------------------ */

const LIQUIDS = [
  { en: 'Distilled water', bn: 'পাতিত পানি', bp: 100.0, color: '#dcefff' },
  { en: 'Salt water (1 mol kg⁻¹ NaCl)', bn: 'লবণ পানি (1 mol kg⁻¹ NaCl)', bp: 101.0, color: '#e3f0f8' },
  { en: 'Sugar solution (1 mol kg⁻¹)', bn: 'চিনির দ্রবণ (1 mol kg⁻¹)', bp: 100.5, color: '#f3f1e2' }
];
const FLAMES = [
  { a: 110, tau: 500 },
  { a: 140, tau: 350 }
];
const heatingTemp = (liquid: number, flame: number, t: number) => Math.min(LIQUIDS[liquid].bp, 25 + FLAMES[flame].a * (1 - Math.exp(-t / FLAMES[flame].tau)));

const heatAndBoiling: ChemPracticalModel = {
  slug: 'heat-and-boiling',
  scene: 'heating',
  variant: 'boil',
  howTo_en:
    'Heat the liquid in a beaker on a tripod and gauze. Press ▶ and record the thermometer every minute: the temperature rises, then stays constant while the liquid boils. Repeat with salt or sugar dissolved in the water — dissolved solutes raise the boiling point.',
  howTo_bn:
    'ত্রিপদী ও তারজালির উপর বিকারে তরল উত্তপ্ত করো। ▶ চেপে প্রতি মিনিটে থার্মোমিটারের পাঠ রেকর্ড করো: তাপমাত্রা বাড়ে, তারপর তরল ফুটতে থাকার সময় স্থির থাকে। পানিতে লবণ বা চিনি দ্রবীভূত করে আবার করো — দ্রবীভূত দ্রব স্ফুটনাঙ্ক বাড়ায়।',
  formula: 'ΔTb = i·Kb·m (Kb of water = 0.512 K kg mol⁻¹)',
  controls: [
    { key: 'liquid', en: 'Liquid', bn: 'তরল', default: 0, options: LIQUIDS.map((l, i) => opt(i, l.en, l.bn)) },
    { key: 'flame', en: 'Bunsen flame', bn: 'বুনসেন শিখা', default: 1, options: [opt(0, 'Low', 'কম'), opt(1, 'High', 'বেশি')] },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 900, step: 10, unit: 's', default: 0, play: { rate: 30 } }
  ],
  tasks: [0, 60, 120, 180, 240, 300, 360, 420, 480, 600].map((t) => ({ en: `${t} s`, bn: `${t} সে`, set: { t } })),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'temp', en: 'Temperature', bn: 'তাপমাত্রা', unit: '°C', digits: 1 },
    { key: 'state', en: 'Observation', bn: 'পর্যবেক্ষণ' }
  ],
  minReadings: 8,
  graph: { x: 't', y: 'temp', kind: 'line' },
  compute: (p, noise, ctx) => {
    const liquid = clamp(Math.round(p.liquid), 0, 2);
    const flame = p.flame === 0 ? 0 : 1;
    const t = clamp(p.t, 0, 900);
    const bp = LIQUIDS[liquid].bp;
    const temp = heatingTemp(liquid, flame, t);
    const boiling = temp >= bp - 1e-6;
    const state = boiling ? { en: 'boiling steadily', bn: 'স্থিরভাবে ফুটছে' } : temp > 75 ? { en: 'tiny bubbles (dissolved air)', bn: 'ছোট বুদবুদ (দ্রবীভূত বায়ু)' } : { en: 'heating', bn: 'উত্তপ্ত হচ্ছে' };
    return {
      row: { t: round(t, 0), temp: round(temp + noise(0.08), 1), ...tx('state', state.en, state.bn) },
      live: [
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: temp, unit: '°C', digits: 1, tone: boiling ? 'good' : 'info' },
        { en: 'State', bn: 'অবস্থা', value: state.en, valueBn: state.bn },
        { en: 'Liquid', bn: 'তরল', value: LIQUIDS[liquid].en, valueBn: LIQUIDS[liquid].bn },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: {
        kind: 'boil',
        flame: flame === 1 ? 1 : 0.55,
        temp,
        liquid: LIQUIDS[liquid].color,
        level: 0.55,
        bubbles: boiling ? 1 : temp > 75 ? (temp - 75) / 40 : 0,
        steam: temp > 85 ? clamp((temp - 85) / 15, 0, 1) : 0,
        clock: t,
        clockUnit: 's',
        curve: { pts: points(ctx.rows, 't', 'temp'), cur: { x: t, y: temp }, xMax: 900, yMin: 20, yMax: 110, xLabel: 't / s', yLabel: 'T / °C' }
      },
      status:
        t === 0
          ? status('info', 'Burner lit — press ▶ and record the temperature every minute.', 'বার্নার জ্বালানো হয়েছে — ▶ চাপো এবং প্রতি মিনিটে তাপমাত্রা রেকর্ড করো।')
          : boiling
            ? status('good', `Boiling: the temperature stays at ${bp.toFixed(1)} °C — the heat now turns liquid into vapour (latent heat).`, `ফুটছে: তাপমাত্রা ${bp.toFixed(1)} °C-এ স্থির — তাপ এখন তরলকে বাষ্পে পরিণত করছে (সুপ্ত তাপ)।`)
            : status('info', 'Temperature rising — keep recording until it stays steady for several readings.', 'তাপমাত্রা বাড়ছে — কয়েকটি পাঠ ধরে স্থির না হওয়া পর্যন্ত রেকর্ড করতে থাকো।'),
      ready: true
    };
  },
  result: {
    en: 'Boiling point (steady temperature)',
    bn: 'স্ফুটনাঙ্ক (স্থির তাপমাত্রা)',
    unit: '°C',
    digits: 1,
    goodWithin: 0.5,
    compute: (rows) => {
      const temps = values(rows, 'temp');
      if (!temps.length) return null;
      const max = Math.max(...temps);
      return meanOf(temps.filter((v) => v >= max - 0.3));
    },
    expected: (p) => LIQUIDS[clamp(Math.round(p.liquid), 0, 2)].bp
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* Sublimation of ammonium chloride (separating NH₄Cl from NaCl)         */
/* ------------------------------------------------------------------ */

const SUB_MIX = 5.0;
const SUB_NH4CL = 2.0;
const SUB_DISH = 30.0;
const SUB_TMAX = [340, 420, 500];

export function sublimationLeft(flame: number, t: number): number {
  const tmax = SUB_TMAX[flame];
  let m = SUB_NH4CL;
  const dt = 5;
  for (let s = 0; s < t; s += dt) {
    const step = Math.min(dt, t - s);
    const temp = 25 + (tmax - 25) * (1 - Math.exp(-(s + step / 2) / 120));
    const k = 0.01 * Math.max(0, temp - 300) / 100;
    m *= Math.exp(-k * step);
  }
  return m;
}

const sublimation: ChemPracticalModel = {
  slug: 'sublimation-nh4cl',
  scene: 'heating',
  variant: 'sublime',
  howTo_en:
    '5.00 g of a mixture of ammonium chloride and common salt is heated in a china dish covered by an inverted funnel with a cotton plug. NH₄Cl sublimes and re-forms as a white crust on the cool funnel; NaCl stays behind. Weigh the dish as you heat until the mass is constant, then work out the percentage of NH₄Cl.',
  howTo_bn:
    'অ্যামোনিয়াম ক্লোরাইড ও খাদ্য লবণের 5.00 g মিশ্রণ চীনামাটির বাটিতে রেখে তুলার ছিপিযুক্ত উল্টানো ফানেল দিয়ে ঢেকে উত্তপ্ত করা হয়। NH₄Cl ঊর্ধ্বপাতিত হয়ে ঠান্ডা ফানেলে সাদা আস্তরণ হিসেবে জমে; NaCl থেকে যায়। ভর স্থির না হওয়া পর্যন্ত উত্তপ্ত করতে করতে বাটি ওজন করো, তারপর NH₄Cl-এর শতকরা পরিমাণ বের করো।',
  formula: 'NH₄Cl(s) ⇌ NH₃(g) + HCl(g) · %NH₄Cl = mass lost ÷ 5.00 g × 100',
  controls: [
    { key: 'flame', en: 'Flame', bn: 'শিখা', default: 1, options: [opt(0, 'Low', 'কম'), opt(1, 'Medium', 'মাঝারি'), opt(2, 'High', 'বেশি')] },
    { key: 'funnel', en: 'Inverted funnel + cotton plug', bn: 'উল্টানো ফানেল + তুলার ছিপি', default: 1, options: [opt(1, 'In place', 'বসানো'), opt(0, 'Not used', 'ব্যবহার হয়নি')] },
    { key: 't', en: 'Heating time', bn: 'উত্তাপের সময়', kind: 'time', min: 0, max: 900, step: 30, unit: 's', default: 0, play: { rate: 30 } }
  ],
  tasks: [0, 120, 240, 360, 480, 600, 750, 900].map((t) => ({ en: `${t} s`, bn: `${t} সে`, set: { flame: 1, funnel: 1, t } })),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'dish', en: 'Dish + contents', bn: 'বাটি + বস্তু', unit: 'g', digits: 2 },
    { key: 'lost', en: 'Mass lost', bn: 'হারানো ভর', unit: 'g', digits: 2 },
    { key: 'crust', en: 'Sublimate on funnel', bn: 'ফানেলে ঊর্ধ্বপাতিত বস্তু', unit: 'g', digits: 2 }
  ],
  minReadings: 7,
  graph: { x: 't', y: 'dish', kind: 'line' },
  compute: (p, noise, ctx) => {
    const flame = clamp(Math.round(p.flame), 0, 2);
    const funnel = p.funnel !== 0;
    const t = clamp(p.t, 0, 900);
    const left = sublimationLeft(flame, t);
    const gone = SUB_NH4CL - left;
    const temp = 25 + (SUB_TMAX[flame] - 25) * (1 - Math.exp(-t / 120));
    const dish = SUB_DISH + SUB_MIX - gone + noise(0.005);
    const crust = funnel ? gone * 0.95 : 0;
    const done = left < 0.005;
    return {
      row: { t: round(t, 0), dish: round(dish, 2), lost: round(SUB_DISH + SUB_MIX - dish, 2), crust: round(crust, 2) },
      live: [
        { en: 'Dish + contents', bn: 'বাটি + বস্তু', value: SUB_DISH + SUB_MIX - gone, unit: 'g', digits: 2, tone: done ? 'good' : 'info' },
        { en: 'NH₄Cl still in dish', bn: 'বাটিতে অবশিষ্ট NH₄Cl', value: left, unit: 'g', digits: 2 },
        { en: 'Dish temperature', bn: 'বাটির তাপমাত্রা', value: temp, unit: '°C', digits: 0 },
        { en: 'Crust on funnel', bn: 'ফানেলে আস্তরণ', value: crust, unit: 'g', digits: 2 }
      ],
      view: {
        kind: 'sublime',
        flame: [0.45, 0.75, 1][flame],
        funnel,
        mixture: clamp((3 + left) / 5, 0, 1),
        fumes: t > 0 && !done && temp > 300 ? clamp((temp - 300) / 150, 0.15, 1) : 0,
        crust: funnel ? clamp(gone / SUB_NH4CL, 0, 1) : 0,
        balance: SUB_DISH + SUB_MIX - gone,
        clock: t,
        clockUnit: 's',
        curve: { pts: points(ctx.rows, 't', 'dish'), cur: { x: t, y: SUB_DISH + SUB_MIX - gone }, xMax: 900, yMin: 32.5, yMax: 35.5, xLabel: 't / s', yLabel: 'm / g' }
      },
      status: !funnel
        ? status('warn', 'Without the funnel the NH₃ and HCl fumes escape into the lab. Put the inverted funnel and cotton plug in place.', 'ফানেল ছাড়া NH₃ ও HCl ধোঁয়া ল্যাবে ছড়িয়ে পড়ে। উল্টানো ফানেল ও তুলার ছিপি বসাও।')
        : t === 0
          ? status('info', 'Weigh the dish, then press ▶ to start heating.', 'বাটি ওজন করো, তারপর ▶ চেপে উত্তাপ শুরু করো।')
          : temp < 300
            ? status('info', 'Warming up… NH₄Cl starts to sublime above about 300 °C.', 'গরম হচ্ছে… প্রায় ৩০০ °C-এর উপরে NH₄Cl ঊর্ধ্বপাতিত হতে শুরু করে।')
            : done
              ? status('good', 'No more white fumes and the mass is constant — only NaCl is left in the dish.', 'আর সাদা ধোঁয়া নেই, ভর স্থির — বাটিতে কেবল NaCl রয়ে গেছে।')
              : status('info', 'White fumes rise and a white crust forms on the cool funnel — keep heating and weighing.', 'সাদা ধোঁয়া উঠছে, ঠান্ডা ফানেলে সাদা আস্তরণ জমছে — উত্তাপ ও ওজন চালিয়ে যাও।'),
      ready: funnel
    };
  },
  result: {
    en: 'Percentage of NH₄Cl in the mixture',
    bn: 'মিশ্রণে NH₄Cl-এর শতকরা পরিমাণ',
    unit: '%',
    digits: 1,
    compute: (rows) => {
      const lost = values(rows, 'lost');
      return lost.length ? (Math.max(...lost) / SUB_MIX) * 100 : null;
    },
    expected: (SUB_NH4CL / SUB_MIX) * 100
  },
  solve: (p) => ({ ...p, funnel: 1 })
};

/* ------------------------------------------------------------------ */
/* The limestone cycle — thermal decomposition of CaCO₃                  */
/* ------------------------------------------------------------------ */

const LIME_M = 2.0;
const LIME_CRUCIBLE = 20.0;
const CO2_FRACTION = 44.01 / 100.09;
const LIME_K = [0, 0.35];

const limestoneMass = (burner: number, t: number) => LIME_M - LIME_M * CO2_FRACTION * (1 - Math.exp(-LIME_K[burner] * Math.max(0, t - 1)));

const LIME_STEPS = [
  opt(0, 'Heat strongly', 'জোরে উত্তপ্ত করো'),
  opt(1, 'Add drops of water', 'কয়েক ফোঁটা পানি দাও'),
  opt(2, 'Add universal indicator', 'ইউনিভার্সাল ইন্ডিকেটর দাও'),
  opt(3, 'Blow CO₂ into the limewater', 'চুনের পানিতে CO₂ ফুঁ দাও')
];

const limestone: ChemPracticalModel = {
  slug: 'limestone-cycle',
  scene: 'heating',
  variant: 'crucible',
  howTo_en:
    'Heat 2.00 g of calcium carbonate in a crucible, weighing it every couple of minutes until the mass is constant — the mass lost is CO₂. Then follow the rest of the cycle: add water to the quicklime, test the limewater with indicator and blow CO₂ through it.',
  howTo_bn:
    'মুচিতে 2.00 g ক্যালসিয়াম কার্বনেট উত্তপ্ত করো এবং ভর স্থির না হওয়া পর্যন্ত কয়েক মিনিট পরপর ওজন করো — হারানো ভরই CO₂। তারপর চক্রের বাকিটা করো: কলিচুনে পানি দাও, চুনের পানি নির্দেশক দিয়ে পরীক্ষা করো এবং এর মধ্যে CO₂ ফুঁ দাও।',
  formula: 'CaCO₃ → CaO + CO₂ · CaO + H₂O → Ca(OH)₂ · Ca(OH)₂ + CO₂ → CaCO₃ + H₂O',
  controls: [
    { key: 'burner', en: 'Heat source', bn: 'তাপের উৎস', default: 1, options: [opt(1, 'Bunsen, roaring (≈ 900 °C)', 'বুনসেন, গর্জনশীল (≈ 900 °C)'), opt(0, 'Spirit lamp (≈ 500 °C)', 'স্পিরিট ল্যাম্প (≈ 500 °C)')] },
    { key: 't', en: 'Heating time', bn: 'উত্তাপের সময়', kind: 'time', min: 0, max: 20, step: 0.5, unit: 'min', default: 0, play: { rate: 1 } },
    { key: 'step', en: 'Stage of the cycle', bn: 'চক্রের ধাপ', kind: 'view', default: 0, options: LIME_STEPS }
  ],
  tasks: minTasks([0, 2, 4, 6, 8, 10, 14, 20], { burner: 1, step: 0 }),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 'min', digits: 1 },
    { key: 'reading', en: 'Crucible + contents', bn: 'মুচি + বস্তু', unit: 'g', digits: 2 },
    { key: 'residue', en: 'Residue', bn: 'অবশেষ', unit: 'g', digits: 2 },
    { key: 'loss', en: 'Mass lost', bn: 'হারানো ভর', unit: '%', digits: 1 }
  ],
  minReadings: 7,
  graph: { x: 't', y: 'residue', kind: 'line' },
  compute: (p, noise) => {
    const burner = p.burner === 0 ? 0 : 1;
    const t = clamp(p.t, 0, 20);
    const step = clamp(Math.round(p.step), 0, 3);
    const residue = limestoneMass(burner, t);
    const reading = LIME_CRUCIBLE + residue + noise(0.005);
    const resR = reading - LIME_CRUCIBLE;
    const f = (LIME_M - residue) / (LIME_M * CO2_FRACTION);
    const done = f >= 0.995;
    const limeMade = f > 0.5;
    const stepStatus = [
      null,
      limeMade
        ? status('info', 'Hissing and steam! The quicklime swells and crumbles as it becomes slaked lime, Ca(OH)₂ — very exothermic.', 'হিস শব্দ ও বাষ্প! কলিচুন ফুলে উঠে ভেঙে কলিচুনে-জল (Ca(OH)₂) হয় — অত্যন্ত তাপোৎপাদী।')
        : status('warn', 'Barely any reaction — most of the solid is still CaCO₃. Heat it longer and hotter first.', 'প্রায় কোনো বিক্রিয়া নেই — কঠিনের বেশিরভাগ এখনও CaCO₃। আগে আরও বেশি সময় ও তাপে উত্তপ্ত করো।'),
      limeMade
        ? status('info', 'Universal indicator turns violet: limewater is alkaline (pH ≈ 12).', 'ইউনিভার্সাল ইন্ডিকেটর বেগুনি হয়: চুনের পানি ক্ষারীয় (pH ≈ ১২)।')
        : status('warn', 'Only a faint colour change — very little Ca(OH)₂ formed.', 'কেবল হালকা রং বদল — খুব সামান্য Ca(OH)₂ তৈরি হয়েছে।'),
      limeMade
        ? status('good', 'The clear limewater turns milky: CaCO₃ forms again — the cycle is complete.', 'স্বচ্ছ চুনের পানি ঘোলা হয়: আবার CaCO₃ তৈরি হয় — চক্র সম্পূর্ণ।')
        : status('warn', 'Hardly any limewater was made — heat the carbonate properly first.', 'প্রায় কোনো চুনের পানি তৈরি হয়নি — আগে কার্বনেট ঠিকমতো উত্তপ্ত করো।')
    ][step];
    return {
      row: { t: round(t, 1), reading: round(reading, 2), residue: round(resR, 2), loss: round(((LIME_M - resR) / LIME_M) * 100, 1) },
      live: [
        { en: 'Balance', bn: 'নিক্তি', value: LIME_CRUCIBLE + residue, unit: 'g', digits: 2, tone: done ? 'good' : 'info' },
        { en: 'Mass lost', bn: 'হারানো ভর', value: ((LIME_M - residue) / LIME_M) * 100, unit: '%', digits: 1 },
        { en: 'Decomposed', bn: 'বিয়োজিত', value: f * 100, unit: '%', digits: 0 },
        { en: 'Crucible', bn: 'মুচি', value: burner ? '≈ 900 °C' : '≈ 500 °C' }
      ],
      view: {
        kind: 'crucible',
        flame: step === 0 && t > 0 ? (burner ? 1 : 0.5) : 0,
        lamp: burner === 0,
        lid: 'off',
        contents: blendColors('#f1f1ec', '#fbfbf6', f),
        glow: step === 0 && t > 0 && burner === 1 ? 0.6 : 0,
        balance: LIME_CRUCIBLE + residue,
        stage: step,
        limeMade,
        clock: t,
        clockUnit: 'min'
      },
      status:
        stepStatus ??
        (burner === 0
          ? status('warn', 'A spirit lamp (≈ 500 °C) is not hot enough — calcium carbonate needs about 900 °C to decompose.', 'স্পিরিট ল্যাম্প (≈ ৫০০ °C) যথেষ্ট গরম নয় — ক্যালসিয়াম কার্বনেট বিয়োজনে প্রায় ৯০০ °C লাগে।')
          : t === 0
            ? status('info', 'Crucible weighed — press ▶ to heat strongly.', 'মুচি ওজন করা হয়েছে — ▶ চেপে জোরে উত্তপ্ত করো।')
            : done
              ? status('good', 'Constant mass — decomposition is complete. The white solid left is quicklime, CaO.', 'ভর স্থির — বিয়োজন সম্পূর্ণ। অবশিষ্ট সাদা কঠিন হলো কলিচুন, CaO।')
              : status('info', 'The crucible glows; CO₂ is driven off — keep heating and weighing.', 'মুচি লাল হয়ে জ্বলছে; CO₂ বেরিয়ে যাচ্ছে — উত্তাপ ও ওজন চালিয়ে যাও।')),
      ready: step === 0
    };
  },
  result: {
    en: 'Mass lost on heating (CO₂)',
    bn: 'উত্তাপে হারানো ভর (CO₂)',
    unit: '%',
    digits: 1,
    compute: (rows) => {
      const losses = values(rows, 'loss');
      return losses.length ? Math.max(...losses) : null;
    },
    expected: CO2_FRACTION * 100
  },
  solve: (p) => ({ ...p, burner: 1, step: 0 })
};

/* ------------------------------------------------------------------ */
/* Burning metals in air — empirical formula of the oxide                */
/* ------------------------------------------------------------------ */

const BMETALS = [
  { sym: 'Mg', en: 'Magnesium ribbon', bn: 'ম্যাগনেসিয়াম ফিতা', ar: 24.31, k: 0.8, oxide: 'MgO', metalColor: '#d8dee6', oxideColor: '#fbfbf8' },
  { sym: 'Cu', en: 'Copper powder', bn: 'কপার গুঁড়া', ar: 63.55, k: 0.5, oxide: 'CuO', metalColor: '#c8763c', oxideColor: '#2b2b30' }
];
const LIDS = [
  { en: 'On, lifted now and then', bn: 'ঢাকা, মাঝে মাঝে তোলা', max: 1, loss: 0 },
  { en: 'Left off', bn: 'খোলা রাখা', max: 1, loss: 0.1 },
  { en: 'Never lifted', bn: 'কখনো তোলা হয়নি', max: 0.3, loss: 0 }
];
const CRUCIBLE_LID = 25.0;
const burnFraction = (metal: number, lid: number, t: number) => LIDS[lid].max * (1 - Math.exp(-BMETALS[metal].k * Math.max(0, t - 1)));
const burnDone = (metal: number) => Math.ceil((1 + Math.log(200) / BMETALS[metal].k) * 2) / 2;

const burningMetals: ChemPracticalModel = {
  slug: 'burning-metals-in-air',
  scene: 'heating',
  variant: 'crucible',
  howTo_en:
    'Weigh a metal in a crucible with its lid, heat strongly and lift the lid now and then to let air in without letting the oxide smoke escape. Heat to constant mass, then weigh: the gain is oxygen. Repeat with other masses and work out the mole ratio O : metal.',
  howTo_bn:
    'ঢাকনাসহ মুচিতে একটি ধাতু ওজন করে জোরে উত্তপ্ত করো এবং মাঝে মাঝে ঢাকনা তুলে বাতাস ঢুকতে দাও, তবে অক্সাইডের ধোঁয়া যেন বেরিয়ে না যায়। স্থির ভর পর্যন্ত উত্তপ্ত করে ওজন করো: বাড়তি ভরই অক্সিজেন। অন্য ভর দিয়ে পুনরাবৃত্তি করে O : ধাতুর মোল অনুপাত বের করো।',
  formula: '2Mg + O₂ → 2MgO · n(O) ÷ n(M) = (m(O) ÷ 16.00) ÷ (m(M) ÷ Ar)',
  controls: [
    { key: 'metal', en: 'Metal', bn: 'ধাতু', default: 0, options: BMETALS.map((m, i) => opt(i, m.en, m.bn)) },
    { key: 'mass', en: 'Mass of metal', bn: 'ধাতুর ভর', min: 0.1, max: 0.4, step: 0.02, unit: 'g', default: 0.24, digits: 2 },
    { key: 'lid', en: 'Crucible lid', bn: 'মুচির ঢাকনা', default: 0, options: LIDS.map((l, i) => opt(i, l.en, l.bn)) },
    { key: 't', en: 'Heating time', bn: 'উত্তাপের সময়', kind: 'time', min: 0, max: 15, step: 0.5, unit: 'min', default: 0, play: { rate: 1 } }
  ],
  tasks: [
    { en: 'Mg 0.12 g', bn: 'Mg 0.12 g', set: { metal: 0, mass: 0.12, lid: 0 } },
    { en: 'Mg 0.24 g', bn: 'Mg 0.24 g', set: { metal: 0, mass: 0.24, lid: 0 } },
    { en: 'Mg 0.36 g', bn: 'Mg 0.36 g', set: { metal: 0, mass: 0.36, lid: 0 } },
    { en: 'Cu 0.30 g', bn: 'Cu 0.30 g', set: { metal: 1, mass: 0.3, lid: 0 } }
  ],
  columns: [
    { key: 'metal', en: 'Metal', bn: 'ধাতু' },
    { key: 'm', en: 'm(metal)', bn: 'm(ধাতু)', unit: 'g', digits: 2 },
    { key: 'oxide', en: 'm(product)', bn: 'm(উৎপাদ)', unit: 'g', digits: 3 },
    { key: 'o', en: 'm(O)', bn: 'm(O)', unit: 'g', digits: 3 },
    { key: 'ratio', en: 'n(O) ÷ n(M)', bn: 'n(O) ÷ n(M)', digits: 2 }
  ],
  minReadings: 4,
  compute: (p, noise) => {
    const metal = p.metal === 1 ? 1 : 0;
    const bm = BMETALS[metal];
    const m = clamp(p.mass, 0.1, 0.4);
    const lid = clamp(Math.round(p.lid), 0, 2);
    const t = clamp(p.t, 0, 15);
    const f = burnFraction(metal, lid, t);
    const oxideFormed = ((m * f) / bm.ar) * (bm.ar + 16.0);
    const lost = metal === 0 ? oxideFormed * LIDS[lid].loss : 0;
    const contents = m * (1 - f) + oxideFormed - lost;
    const reading = CRUCIBLE_LID + contents + noise(0.0008);
    const contentsR = reading - CRUCIBLE_LID;
    const oMass = contentsR - m;
    const ratio = oMass / 16.0 / (m / bm.ar);
    const steady = t >= burnDone(metal);
    const burning = metal === 0 && t > 1 && f < LIDS[lid].max * 0.97;
    return {
      row: { ...tx('metal', bm.sym, bm.sym), m: round(m, 2), oxide: round(contentsR, 3), o: round(oMass, 3), ratio: round(ratio, 2) },
      live: [
        { en: 'Crucible + lid + contents', bn: 'মুচি + ঢাকনা + বস্তু', value: CRUCIBLE_LID + contents, unit: 'g', digits: 3, tone: steady ? 'good' : 'info' },
        { en: 'Metal oxidised', bn: 'জারিত ধাতু', value: f * 100, unit: '%', digits: 0 },
        { en: 'Oxygen gained', bn: 'যুক্ত অক্সিজেন', value: contents - m, unit: 'g', digits: 3 },
        { en: 'Heating time', bn: 'উত্তাপের সময়', value: t, unit: 'min', digits: 1 }
      ],
      view: {
        kind: 'crucible',
        flame: t > 0 ? 1 : 0,
        lid: lid === 1 ? 'off' : lid === 0 && t > 0 ? 'ajar' : 'on',
        contents: blendColors(bm.metalColor, bm.oxideColor, f),
        coil: metal === 0 ? 1 - f : 0,
        glow: burning ? (lid === 2 ? 0.25 : 1) : t > 0 ? 0.3 : 0,
        smoke: metal === 0 && lid === 1 && burning ? 0.8 : 0,
        balance: CRUCIBLE_LID + contents,
        clock: t,
        clockUnit: 'min'
      },
      status:
        lid === 1 && metal === 0 && t > 1
          ? status('warn', 'With the lid off, white MgO smoke escapes — product is lost and the formula will come out wrong.', 'ঢাকনা খোলা থাকায় সাদা MgO ধোঁয়া বেরিয়ে যাচ্ছে — উৎপাদ হারাচ্ছে, সংকেত ভুল আসবে।')
          : lid === 2 && t > 2
            ? status('warn', 'The lid was never lifted: the oxygen inside is used up and the metal stops burning.', 'ঢাকনা কখনো তোলা হয়নি: ভেতরের অক্সিজেন শেষ, ধাতু আর জ্বলছে না।')
            : t === 0
              ? status('info', 'Crucible, lid and metal weighed — press ▶ to heat.', 'মুচি, ঢাকনা ও ধাতু ওজন করা হয়েছে — ▶ চেপে উত্তপ্ত করো।')
              : steady
                ? status('good', `Constant mass: all the ${bm.sym} has become ${bm.oxide}. Record the mass.`, `ভর স্থির: সব ${bm.sym} ${bm.oxide}-এ পরিণত হয়েছে। ভর রেকর্ড করো।`)
                : burning
                  ? status('info', 'Brilliant white light as magnesium burns — lift the lid briefly to let air in.', 'ম্যাগনেসিয়াম জ্বলতে গিয়ে উজ্জ্বল সাদা আলো — বাতাস ঢুকতে ক্ষণিকের জন্য ঢাকনা তোলো।')
                  : status('info', 'Keep heating until the mass no longer changes.', 'ভর আর না বদলানো পর্যন্ত উত্তপ্ত করতে থাকো।'),
      ready: steady
    };
  },
  result: {
    en: 'Mole ratio O : metal (empirical formula MO)',
    bn: 'মোল অনুপাত O : ধাতু (স্থূল সংকেত MO)',
    unit: '',
    digits: 2,
    compute: (rows) => meanOf(values(rows, 'ratio')),
    expected: 1
  },
  solve: (p) => {
    const metal = p.metal === 1 ? 1 : 0;
    return { ...p, lid: 0, t: Math.max(p.t, burnDone(metal)) };
  }
};

/* ------------------------------------------------------------------ */
/* Extra: Water of crystallisation in CuSO₄·xH₂O                         */
/* ------------------------------------------------------------------ */

const M_CUSO4 = 159.61;
const M_HYDRATE = M_CUSO4 + 5 * 18.02;
const WOC_K = [0.6, 1.2];
const wocDone = (flame: number) => Math.ceil((0.5 + Math.log(200) / WOC_K[flame]) * 2) / 2;

const waterOfCrystallisation: ChemPracticalModel = {
  slug: 'water-of-crystallisation',
  scene: 'heating',
  variant: 'crucible',
  howTo_en:
    'Weigh blue copper(II) sulphate crystals in a crucible and heat them gently, stirring, until they turn white and the mass is constant. The mass lost is water. Repeat with other masses and find x in CuSO₄·xH₂O. Add a few drops of water to the white powder to see the reverse reaction.',
  howTo_bn:
    'মুচিতে নীল কপার(II) সালফেট কেলাস ওজন করে নাড়তে নাড়তে ধীরে উত্তপ্ত করো, যতক্ষণ না তা সাদা হয় এবং ভর স্থির হয়। হারানো ভরই পানি। অন্য ভর দিয়ে পুনরাবৃত্তি করে CuSO₄·xH₂O-তে x বের করো। সাদা গুঁড়ায় কয়েক ফোঁটা পানি দিয়ে বিপরীত বিক্রিয়া দেখো।',
  formula: 'CuSO₄·5H₂O (blue) ⇌ CuSO₄ (white) + 5H₂O · x = n(H₂O) ÷ n(CuSO₄)',
  controls: [
    { key: 'mass', en: 'Blue crystals', bn: 'নীল কেলাস', min: 1, max: 3, step: 0.25, unit: 'g', default: 2.5, digits: 2 },
    { key: 'flame', en: 'Heating', bn: 'উত্তাপ', default: 0, options: [opt(0, 'Gentle, stirring', 'মৃদু, নেড়ে নেড়ে'), opt(1, 'Very strong', 'অতি তীব্র')] },
    { key: 't', en: 'Heating time', bn: 'উত্তাপের সময়', kind: 'time', min: 0, max: 15, step: 0.5, unit: 'min', default: 0, play: { rate: 1 } },
    { key: 'water', en: 'Drops of water on the cooled powder', bn: 'ঠান্ডা গুঁড়ায় কয়েক ফোঁটা পানি', kind: 'view', default: 0, options: [opt(0, 'No', 'না'), opt(1, 'Add', 'দাও')] }
  ],
  tasks: [1.5, 2.0, 2.5].map((m) => ({ en: `${m.toFixed(2)} g`, bn: `${m.toFixed(2)} g`, set: { mass: m, flame: 0 } })),
  columns: [
    { key: 'm', en: 'm(hydrated)', bn: 'm(সোদক)', unit: 'g', digits: 2 },
    { key: 'anh', en: 'm(after heating)', bn: 'm(উত্তাপের পর)', unit: 'g', digits: 3 },
    { key: 'w', en: 'm(water)', bn: 'm(পানি)', unit: 'g', digits: 3 },
    { key: 'x', en: 'x', bn: 'x', digits: 2 }
  ],
  minReadings: 3,
  compute: (p, noise) => {
    const m = clamp(p.mass, 1, 3);
    const flame = p.flame === 1 ? 1 : 0;
    const t = clamp(p.t, 0, 15);
    const water = m * ((5 * 18.02) / M_HYDRATE);
    const anhydrous = m - water;
    const f = 1 - Math.exp(-WOC_K[flame] * Math.max(0, t - 0.5));
    // very strong heating then starts to decompose CuSO₄ → CuO + SO₃
    const dec = flame === 1 ? 1 - Math.exp(-0.06 * Math.max(0, t - 5)) : 0;
    const decLoss = anhydrous * (80.06 / M_CUSO4) * dec;
    const after = m - water * f - decLoss;
    const afterR = after + noise(0.0008);
    const w = m - afterR;
    const x = w / 18.02 / (afterR / M_CUSO4);
    const steady = t >= wocDone(flame) && flame === 0;
    const rehydrate = p.water === 1;
    return {
      row: { m: round(m, 2), anh: round(afterR, 3), w: round(w, 3), x: round(x, 2) },
      live: [
        { en: 'Crucible contents', bn: 'মুচির বস্তু', value: after, unit: 'g', digits: 3, tone: steady ? 'good' : flame === 1 && dec > 0.02 ? 'bad' : 'info' },
        { en: 'Water driven off', bn: 'বের হওয়া পানি', value: water * f, unit: 'g', digits: 3 },
        { en: 'Colour', bn: 'রং', value: rehydrate && f > 0.9 ? 'blue again, hot' : dec > 0.05 ? 'blackening' : f > 0.95 ? 'white' : f > 0.3 ? 'pale blue-white' : 'blue', valueBn: rehydrate && f > 0.9 ? 'আবার নীল, গরম' : dec > 0.05 ? 'কালো হচ্ছে' : f > 0.95 ? 'সাদা' : f > 0.3 ? 'ফ্যাকাশে নীলাভ-সাদা' : 'নীল' },
        { en: 'Heating time', bn: 'উত্তাপের সময়', value: t, unit: 'min', digits: 1 }
      ],
      view: {
        kind: 'crucible',
        flame: t > 0 && !rehydrate ? (flame ? 1 : 0.5) : 0,
        lid: 'off',
        contents: rehydrate && f > 0.9 ? '#3b82d6' : blendColors(blendColors('#3b82d6', '#f2f4f5', f), '#2b2b30', dec * 0.9),
        steam: t > 0.5 && f < 0.98 && !rehydrate ? 0.6 : rehydrate && f > 0.9 ? 0.4 : 0,
        balance: after,
        dropper: rehydrate,
        clock: t,
        clockUnit: 'min'
      },
      status: rehydrate
        ? f > 0.9
          ? status('info', 'Water turns the white powder blue again and it gets hot — the reaction is reversible (a test for water).', 'পানি দিতেই সাদা গুঁড়া আবার নীল হয় ও গরম হয় — বিক্রিয়াটি উভমুখী (পানির পরীক্ষা)।')
          : status('info', 'The crystals are still blue — heat them first to drive off the water.', 'কেলাস এখনও নীল — আগে উত্তপ্ত করে পানি বের করো।')
        : flame === 1
          ? status(dec > 0.02 ? 'bad' : 'warn', 'Too strong! Above about 650 °C anhydrous CuSO₄ decomposes to black CuO — the mass loss is no longer just water. Heat gently.', 'অতিরিক্ত তীব্র! প্রায় ৬৫০ °C-এর উপরে অনার্দ্র CuSO₄ ভেঙে কালো CuO হয় — হারানো ভর আর শুধু পানি নয়। মৃদু তাপ দাও।')
          : t === 0
            ? status('info', 'Crucible and crystals weighed — press ▶ to heat gently.', 'মুচি ও কেলাস ওজন করা হয়েছে — ▶ চেপে মৃদু তাপ দাও।')
            : steady
              ? status('good', 'White powder at constant mass — all the water of crystallisation has gone. Record.', 'স্থির ভরে সাদা গুঁড়া — সব কেলাস পানি বেরিয়ে গেছে। রেকর্ড করো।')
              : status('info', 'Steam rises and the blue crystals fade to white — keep heating and weighing.', 'বাষ্প উঠছে, নীল কেলাস সাদা হচ্ছে — উত্তাপ ও ওজন চালিয়ে যাও।'),
      ready: steady && !rehydrate
    };
  },
  result: {
    en: 'x in CuSO₄·xH₂O',
    bn: 'CuSO₄·xH₂O-তে x',
    unit: '',
    digits: 2,
    compute: (rows) => meanOf(values(rows, 'x')),
    expected: 5
  },
  solve: (p) => ({ ...p, flame: 0, water: 0, t: Math.max(p.t, wocDone(0)) })
};

/* ------------------------------------------------------------------ */
/* Extra: Purifying rock salt                                            */
/* ------------------------------------------------------------------ */

const ROCK = 10.0;
const ROCK_NACL = 7.5;
const BASIN = 40.0;
const ROCK_STEPS = [opt(0, '1 · Dissolve & stir', '১ · দ্রবীভূত করে নাড়ো'), opt(1, '2 · Filter', '২ · ছাঁকো'), opt(2, '3 · Evaporate', '৩ · বাষ্পীভূত করো')];

function rockSalt(water: number, flame: number, t: number) {
  const vol = water === 0 ? 15 : 50;
  // NaCl dissolves up to ≈ 36 g per 100 mL; the sand residue is rinsed, so the filtrate keeps all of it
  const dissolved = Math.min(ROCK_NACL, vol * 0.36);
  const filtrateWater = vol;
  const rate = flame === 1 ? 6 : 3; // g of water boiled off per minute
  const waterLeft = Math.max(0, filtrateWater - rate * t);
  const dry = waterLeft <= 0;
  const spit = flame === 1 && dry ? 0.08 : 0;
  const saltIn = dissolved * (1 - spit);
  return { vol, dissolved, filtrateWater, saltIn, waterLeft, dry, mass: BASIN + saltIn + waterLeft };
}

const rockSaltPurification: ChemPracticalModel = {
  slug: 'rock-salt-purification',
  scene: 'heating',
  variant: 'evaporate',
  howTo_en:
    'Grind 10.0 g of rock salt, dissolve it in water and stir; filter off the sand; then evaporate the clear filtrate in a weighed basin. Weigh the basin as the water boils away until the mass is constant. Use enough water, and heat gently near the end so the salt does not spit.',
  howTo_bn:
    '10.0 g খনিজ লবণ গুঁড়া করে পানিতে দ্রবীভূত করে নাড়ো; বালি ছেঁকে আলাদা করো; তারপর স্বচ্ছ পরিস্রুত ওজন করা বাটিতে বাষ্পীভূত করো। পানি শুকানোর সাথে সাথে স্থির ভর না হওয়া পর্যন্ত বাটি ওজন করো। যথেষ্ট পানি নাও এবং শেষে মৃদু তাপ দাও, যাতে লবণ ছিটকে না যায়।',
  formula: '% NaCl = mass of dry salt ÷ mass of rock salt × 100',
  controls: [
    { key: 'water', en: 'Water used to dissolve', bn: 'দ্রবীভূত করতে পানি', default: 1, options: [opt(0, '15 mL', '15 mL'), opt(1, '50 mL', '50 mL')] },
    { key: 'flame', en: 'Evaporating flame', bn: 'বাষ্পীভবনের শিখা', default: 0, options: [opt(0, 'Gentle', 'মৃদু'), opt(1, 'Fierce', 'তীব্র')] },
    { key: 'step', en: 'Step', bn: 'ধাপ', kind: 'view', default: 0, options: ROCK_STEPS },
    { key: 't', en: 'Evaporating time', bn: 'বাষ্পীভবনের সময়', kind: 'time', min: 0, max: 20, step: 1, unit: 'min', default: 0, play: { rate: 1 } }
  ],
  tasks: minTasks([0, 4, 8, 12, 16, 20], { step: 2 }),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 'min' },
    { key: 'mass', en: 'Basin + contents', bn: 'বাটি + বস্তু', unit: 'g', digits: 2 },
    { key: 'state', en: 'Observation', bn: 'পর্যবেক্ষণ' }
  ],
  minReadings: 6,
  graph: { x: 't', y: 'mass', kind: 'line' },
  compute: (p, noise) => {
    const water = p.water === 0 ? 0 : 1;
    const flame = p.flame === 1 ? 1 : 0;
    const step = clamp(Math.round(p.step), 0, 2);
    const t = clamp(p.t, 0, 20);
    const r = rockSalt(water, flame, step === 2 ? t : 0);
    const undissolved = ROCK_NACL - r.dissolved;
    const crystals = r.dry ? 1 : r.waterLeft < 10 ? (10 - r.waterLeft) / 10 : 0;
    const state = r.dry ? { en: 'dry white crystals', bn: 'শুকনো সাদা কেলাস' } : crystals > 0 ? { en: 'crystals forming at the edge', bn: 'কিনারায় কেলাস জমছে' } : { en: 'clear solution boiling', bn: 'স্বচ্ছ দ্রবণ ফুটছে' };
    return {
      row: { t: round(t, 0), mass: round(r.mass + noise(0.005), 2), ...tx('state', state.en, state.bn) },
      live: [
        { en: 'Basin + contents', bn: 'বাটি + বস্তু', value: r.mass, unit: 'g', digits: 2, tone: r.dry && step === 2 ? 'good' : 'info' },
        { en: 'Salt dissolved', bn: 'দ্রবীভূত লবণ', value: r.dissolved, unit: 'g', digits: 2 },
        { en: 'Water left', bn: 'অবশিষ্ট পানি', value: step === 2 ? r.waterLeft : r.filtrateWater, unit: 'g', digits: 1 },
        { en: 'Evaporating time', bn: 'বাষ্পীভবনের সময়', value: t, unit: 'min', digits: 0 }
      ],
      view: {
        kind: 'evaporate',
        step,
        flame: step === 2 && !r.dry ? (flame ? 1 : 0.5) : step === 2 && r.dry ? 0.3 : 0,
        level: step === 2 ? clamp(r.waterLeft / r.filtrateWater, 0, 1) : 1,
        crystals,
        steam: step === 2 && !r.dry ? 0.8 : 0,
        spit: step === 2 && r.dry && flame === 1,
        undissolved: undissolved > 0.05,
        balance: r.mass,
        clock: t,
        clockUnit: 'min'
      },
      status:
        step === 0
          ? undissolved > 0.05
            ? status('warn', `Not all the salt dissolves in only 15 mL (solubility ≈ 36 g per 100 mL) — ${undissolved.toFixed(1)} g will be thrown away with the sand.`, `মাত্র 15 mL পানিতে সব লবণ দ্রবীভূত হয় না (দ্রাব্যতা ≈ প্রতি 100 mL-এ 36 g) — ${undissolved.toFixed(1)} g বালির সাথে ফেলে দেওয়া হবে।`)
            : status('info', 'Stir until all the salt has dissolved; the sand stays undissolved.', 'সব লবণ দ্রবীভূত না হওয়া পর্যন্ত নাড়ো; বালি অদ্রবীভূতই থাকে।')
          : step === 1
            ? status('info', 'The sand stays on the filter paper (residue); the clear salt solution runs through (filtrate).', 'বালি ছাঁকনি কাগজে থেকে যায় (অবশেষ); স্বচ্ছ লবণ দ্রবণ নিচে চলে যায় (পরিস্রুত)।')
            : t === 0
              ? status('info', 'Weighed basin of filtrate on the tripod — press ▶ to evaporate.', 'পরিস্রুতসহ ওজন করা বাটি ত্রিপদীর উপর — ▶ চেপে বাষ্পীভূত করো।')
              : r.dry
                ? flame === 1
                  ? status('warn', 'Dry — but the fierce flame made the salt spit out of the basin, so some is lost. Heat gently near the end.', 'শুকিয়েছে — কিন্তু তীব্র শিখায় লবণ বাটি থেকে ছিটকে গেছে, কিছু হারিয়েছে। শেষে মৃদু তাপ দাও।')
                  : status('good', 'All the water has gone — constant mass. Record the mass of dry salt.', 'সব পানি বাষ্পীভূত — ভর স্থির। শুকনো লবণের ভর রেকর্ড করো।')
                : status('info', 'Water is boiling away; salt crystals appear as the solution becomes saturated.', 'পানি বাষ্পীভূত হচ্ছে; দ্রবণ সম্পৃক্ত হলে লবণের কেলাস দেখা দিচ্ছে।'),
      ready: step === 2
    };
  },
  result: {
    en: 'Percentage of salt in the rock salt',
    bn: 'খনিজ লবণে লবণের শতকরা পরিমাণ',
    unit: '%',
    digits: 1,
    compute: (rows) => {
      const masses = values(rows, 'mass');
      return masses.length ? ((Math.min(...masses) - BASIN) / ROCK) * 100 : null;
    },
    expected: (ROCK_NACL * 100) / ROCK
  },
  solve: (p) => ({ ...p, water: 1, flame: 0, step: 2 })
};

/* ------------------------------------------------------------------ */
/* Extra: Solubility curve of potassium nitrate                          */
/* ------------------------------------------------------------------ */

const KNO3_T = [0, 10, 20, 30, 40, 50, 60, 70, 80];
const KNO3_S = [13.3, 20.9, 31.6, 45.8, 63.9, 85.5, 110, 138, 169];

export function kno3Solubility(t: number): number {
  const tt = clamp(t, 0, 80);
  for (let i = 0; i < KNO3_T.length - 1; i++) {
    if (tt <= KNO3_T[i + 1]) return KNO3_S[i] + ((KNO3_S[i + 1] - KNO3_S[i]) * (tt - KNO3_T[i])) / (KNO3_T[i + 1] - KNO3_T[i]);
  }
  return KNO3_S[KNO3_S.length - 1];
}

export function kno3SaturationTemp(s: number): number {
  for (let i = 0; i < KNO3_S.length - 1; i++) {
    if (s <= KNO3_S[i + 1]) return KNO3_T[i] + ((KNO3_T[i + 1] - KNO3_T[i]) * (s - KNO3_S[i])) / (KNO3_S[i + 1] - KNO3_S[i]);
  }
  return 80;
}

const solubility: ChemPracticalModel = {
  slug: 'solubility-curve-kno3',
  scene: 'heating',
  variant: 'solubility',
  howTo_en:
    'Dissolve a weighed mass of potassium nitrate in 10.0 g of water by warming. Let it cool while stirring with the thermometer and stop at the temperature where the first crystals appear. Repeat for each mass and read the solubility at 40 °C from your curve.',
  howTo_bn:
    '10.0 g পানিতে ওজন করা পটাশিয়াম নাইট্রেট গরম করে দ্রবীভূত করো। থার্মোমিটার দিয়ে নাড়তে নাড়তে ঠান্ডা হতে দাও এবং যে তাপমাত্রায় প্রথম কেলাস দেখা দেয় সেখানে থামো। প্রতিটি ভরের জন্য পুনরাবৃত্তি করো এবং লেখচিত্র থেকে 40 °C-এ দ্রাব্যতা পড়ো।',
  formula: 'solubility (g per 100 g water) = mass of KNO₃ × 100 ÷ 10.0 g',
  controls: [
    { key: 'mass', en: 'KNO₃ in 10.0 g water', bn: '10.0 g পানিতে KNO₃', min: 3, max: 9, step: 1, unit: 'g', default: 5 },
    { key: 'temp', en: 'Temperature (let it cool)', bn: 'তাপমাত্রা (ঠান্ডা হতে দাও)', kind: 'time', min: 10, max: 80, step: 0.5, unit: '°C', default: 80, fine: true, digits: 1 }
  ],
  tasks: [3, 4, 5, 6, 7, 8].map((m) => ({ en: `${m} g`, bn: `${m} g`, set: { mass: m } })),
  columns: [
    { key: 'm', en: 'KNO₃ in 10 g water', bn: '10 g পানিতে KNO₃', unit: 'g' },
    { key: 's', en: 'Solubility', bn: 'দ্রাব্যতা', unit: 'g/100 g', digits: 0 },
    { key: 'temp', en: 'Crystals appear at', bn: 'কেলাস দেখা দেয়', unit: '°C', digits: 1 }
  ],
  minReadings: 5,
  graph: { x: 'temp', y: 's', kind: 'line' },
  compute: (p, noise, ctx) => {
    const m = clamp(Math.round(p.mass), 3, 9);
    const s = m * 10;
    const tSat = kno3SaturationTemp(s);
    const temp = clamp(p.temp, 10, 80);
    const below = tSat - temp;
    const stage = below < 0 ? 'clear' : below <= 1.0 ? 'first' : 'many';
    const crystalMass = below > 0 ? Math.max(0, m - (kno3Solubility(temp) / 100) * 10) : 0;
    return {
      row: { m, s, temp: round(temp + noise(0.3), 1) },
      live: [
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: temp, unit: '°C', digits: 1, tone: stage === 'first' ? 'good' : stage === 'many' ? 'warn' : 'info' },
        { en: 'Solution', bn: 'দ্রবণ', value: stage === 'clear' ? 'clear' : stage === 'first' ? 'first crystals!' : 'many crystals', valueBn: stage === 'clear' ? 'স্বচ্ছ' : stage === 'first' ? 'প্রথম কেলাস!' : 'অনেক কেলাস' },
        { en: 'Solubility tested', bn: 'পরীক্ষিত দ্রাব্যতা', value: s, unit: 'g/100 g' },
        { en: 'Crystals', bn: 'কেলাস', value: crystalMass, unit: 'g', digits: 2 }
      ],
      view: {
        kind: 'solubility',
        flame: 0,
        temp,
        crystals: stage === 'clear' ? 0 : clamp(0.08 + crystalMass / m, 0.08, 1),
        mass: m,
        curve: { pts: points(ctx.rows, 'temp', 's'), cur: { x: temp, y: s }, xMax: 80, yMin: 0, yMax: 100, xLabel: 'T / °C', yLabel: 'S / g' }
      },
      status:
        stage === 'clear'
          ? status('info', 'All the KNO₃ is dissolved — let the solution cool (lower the temperature slowly) and watch for crystals.', 'সব KNO₃ দ্রবীভূত — দ্রবণটি ঠান্ডা হতে দাও (ধীরে তাপমাত্রা কমাও) এবং কেলাস লক্ষ করো।')
          : stage === 'first'
            ? status('good', 'The first crystals appear — the solution is saturated at this temperature. Record it!', 'প্রথম কেলাস দেখা দিল — এই তাপমাত্রায় দ্রবণ সম্পৃক্ত। রেকর্ড করো!')
            : status('warn', 'Lots of crystals — you cooled past the point where they first appeared. Warm it up and cool again slowly.', 'অনেক কেলাস — প্রথম কেলাস দেখা দেওয়ার বিন্দু পেরিয়ে গেছ। আবার গরম করে ধীরে ঠান্ডা করো।'),
      ready: stage === 'first'
    };
  },
  result: {
    en: 'Solubility of KNO₃ at 40 °C (from your curve)',
    bn: '40 °C-এ KNO₃-এর দ্রাব্যতা (তোমার লেখচিত্র থেকে)',
    unit: 'g/100 g',
    digits: 1,
    compute: (rows) => {
      const pts = points(rows, 'temp', 's').sort((a, b) => a.x - b.x);
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i].x <= 40 && pts[i + 1].x >= 40 && pts[i + 1].x > pts[i].x) return pts[i].y + ((pts[i + 1].y - pts[i].y) * (40 - pts[i].x)) / (pts[i + 1].x - pts[i].x);
      }
      return null;
    },
    expected: kno3Solubility(40)
  },
  solve: (p) => {
    const m = clamp(Math.round(p.mass), 3, 9);
    const tSat = kno3SaturationTemp(m * 10);
    return { ...p, temp: Math.floor((tSat - 0.25) * 2) / 2 };
  }
};

export const thermalModels: ChemPracticalModel[] = [heatAndBoiling, sublimation, limestone, burningMetals, waterOfCrystallisation, rockSaltPurification, solubility];
