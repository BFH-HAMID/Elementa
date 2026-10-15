import type { ChemPracticalModel, TubesView, TubeView } from './types';
import { clamp, latestBy, linearFit, num, opt, points, round, status, twoLineIntersection } from './helpers';

const R = 8.314;
const EA = 50000; // J mol⁻¹
const THIO_STOCK = 0.15;
const TOTAL_ML = 55; // 50 mL thiosulfate + water, then 5 mL HCl
const T_REF = 298.15;
const K_TIME = 20 * ((THIO_STOCK * 50) / TOTAL_ML); // t × c at 25 °C (s mol L⁻¹)

export function crossTime(c: number, celsius: number): number {
  const T = celsius + 273.15;
  return (K_TIME / c) * Math.exp((EA / R) * (1 / T - 1 / T_REF));
}

function crossStage(t: number, tDis: number) {
  if (t < tDis) return 'visible' as const;
  if (t <= tDis + 2) return 'gone' as const;
  return 'late' as const;
}

/* ------------------------------------------------------------------ */
/* Extra: disappearing cross — effect of concentration                   */
/* ------------------------------------------------------------------ */

const rateConcentration: ChemPracticalModel = {
  slug: 'rate-thiosulfate-concentration',
  scene: 'crossFlask',
  variant: 'concentration',
  howTo_en:
    'Make up sodium thiosulfate solution to 50 mL with water in a flask standing on a paper cross, add 5 mL of 2 M HCl and start the stopwatch (▶). Sulfur clouds the solution — stop the clock the moment the cross can no longer be seen from above. Repeat for each volume; the slope of log(1/t) against log c is the order of reaction.',
  howTo_bn:
    'কাগজে আঁকা ক্রসের উপর রাখা ফ্লাস্কে সোডিয়াম থায়োসালফেট দ্রবণে পানি মিশিয়ে 50 mL করো, 5 mL 2 M HCl দিয়ে স্টপওয়াচ চালু করো (▶)। সালফারে দ্রবণ ঘোলা হয় — উপর থেকে ক্রস আর দেখা না যাওয়ার মুহূর্তে ঘড়ি থামাও। প্রতিটি আয়তনে পুনরাবৃত্তি করো; log(1/t) বনাম log c-এর ঢালই বিক্রিয়ার ক্রম।',
  formula: 'Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂ + H₂O · rate ∝ 1/t ∝ [S₂O₃²⁻]ⁿ',
  controls: [
    { key: 'vthio', en: 'Na₂S₂O₃ (0.15 M), made up to 50 mL', bn: 'Na₂S₂O₃ (0.15 M), পানি মিশিয়ে 50 mL', min: 10, max: 50, step: 5, unit: 'mL', default: 50 },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 150, step: 0.5, unit: 's', default: 0, fine: true, digits: 1, play: { rate: 3 } }
  ],
  tasks: [10, 20, 30, 40, 50].map((v) => ({ en: `${v} mL`, bn: `${v} mL`, set: { vthio: v } })),
  columns: [
    { key: 'v', en: 'V(Na₂S₂O₃)', bn: 'V(Na₂S₂O₃)', unit: 'mL' },
    { key: 'water', en: 'V(water)', bn: 'V(পানি)', unit: 'mL' },
    { key: 'c', en: '[S₂O₃²⁻]', bn: '[S₂O₃²⁻]', unit: 'M', digits: 4 },
    { key: 't', en: 'Time', bn: 'সময়', unit: 's', digits: 1 },
    { key: 'rate', en: '1/t', bn: '1/t', unit: 's⁻¹', digits: 4 }
  ],
  minReadings: 5,
  graph: { x: 'c', y: 'rate', kind: 'scatter' },
  compute: (p, noise) => {
    const v = clamp(Math.round(p.vthio / 5) * 5, 10, 50);
    const c = (THIO_STOCK * v) / TOTAL_ML;
    const tDis = crossTime(c, 25);
    const t = clamp(p.t, 0, 150);
    const stage = crossStage(t, tDis);
    const tRead = Math.max(0.5, t + noise(0.3));
    return {
      row: { v, water: 50 - v, c: round(c, 4), t: round(tRead, 1), rate: round(1 / tRead, 4) },
      live: [
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 1, tone: stage === 'gone' ? 'good' : stage === 'late' ? 'warn' : 'info' },
        { en: 'Cross', bn: 'ক্রস', value: stage === 'visible' ? 'still visible' : 'cannot be seen', valueBn: stage === 'visible' ? 'এখনও দেখা যায়' : 'দেখা যায় না' },
        { en: '[S₂O₃²⁻]', bn: '[S₂O₃²⁻]', value: c, unit: 'M', digits: 4 },
        { en: 'Temperature', bn: 'তাপমাত্রা', value: 25, unit: '°C' }
      ],
      view: { cloud: clamp(t / tDis, 0, 1.3), clock: t, temp: 25, vthio: v, running: t > 0 && stage === 'visible' },
      status:
        t === 0
          ? status('info', 'Acid added — press ▶ and watch the cross from above.', 'অ্যাসিড দেওয়া হয়েছে — ▶ চাপো এবং উপর থেকে ক্রসটি লক্ষ করো।')
          : stage === 'visible'
            ? status('info', 'The solution is turning cloudy yellow with sulfur… the cross is still visible.', 'সালফারে দ্রবণ ঘোলাটে হলুদ হচ্ছে… ক্রস এখনও দেখা যাচ্ছে।')
            : stage === 'gone'
              ? status('good', 'The cross has just disappeared — stop the clock and record the time!', 'ক্রস এইমাত্র অদৃশ্য হলো — ঘড়ি থামিয়ে সময় রেকর্ড করো!')
              : status('warn', 'The cross vanished a while ago — you are late. Step the stopwatch back (−) to the moment it disappeared.', 'ক্রস অনেক আগেই অদৃশ্য হয়েছে — দেরি হয়ে গেছে। স্টপওয়াচ পিছিয়ে (−) অদৃশ্য হওয়ার মুহূর্তে আনো।'),
      ready: stage === 'gone'
    };
  },
  result: {
    en: 'Order of reaction with respect to thiosulfate',
    bn: 'থায়োসালফেটের সাপেক্ষে বিক্রিয়ার ক্রম',
    unit: '',
    digits: 2,
    compute: (rows) => {
      const pts = points(rows, 'c', 'rate').filter((q) => q.x > 0 && q.y > 0);
      const fit = linearFit(pts.map((q) => Math.log10(q.x)), pts.map((q) => Math.log10(q.y)));
      return fit ? fit.slope : null;
    },
    expected: 1
  },
  solve: (p) => {
    const v = clamp(Math.round(p.vthio / 5) * 5, 10, 50);
    const tDis = crossTime((THIO_STOCK * v) / TOTAL_ML, 25);
    return { ...p, vthio: v, t: Math.ceil((tDis + 0.2) * 2) / 2 };
  }
};

/* ------------------------------------------------------------------ */
/* Extra: disappearing cross — effect of temperature                     */
/* ------------------------------------------------------------------ */

const TEMP_C = (THIO_STOCK * 10) / TOTAL_ML;

const rateTemperature: ChemPracticalModel = {
  slug: 'rate-thiosulfate-temperature',
  scene: 'crossFlask',
  variant: 'temperature',
  howTo_en:
    'Warm 10 mL of sodium thiosulfate + 40 mL of water to the chosen temperature in a water bath, add 5 mL of 2 M HCl and time how long the cross takes to disappear. Repeat from 20 °C to 60 °C. An Arrhenius plot of ln(1/t) against 1/T gives the activation energy.',
  howTo_bn:
    'পানির গামলায় 10 mL সোডিয়াম থায়োসালফেট + 40 mL পানি নির্বাচিত তাপমাত্রায় গরম করো, 5 mL 2 M HCl দাও এবং ক্রস অদৃশ্য হতে কত সময় লাগে মাপো। 20 °C থেকে 60 °C পর্যন্ত পুনরাবৃত্তি করো। ln(1/t) বনাম 1/T-এর আরহেনিয়াস লেখ থেকে সক্রিয়ন শক্তি পাওয়া যায়।',
  formula: 'ln(1/t) = ln A − Ea ÷ (R·T) · Ea = −slope × R',
  controls: [
    { key: 'temp', en: 'Water-bath temperature', bn: 'পানির গামলার তাপমাত্রা', min: 20, max: 60, step: 5, unit: '°C', default: 30 },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 200, step: 0.5, unit: 's', default: 0, fine: true, digits: 1, play: { rate: 3 } }
  ],
  tasks: [20, 30, 40, 50, 60].map((v) => ({ en: `${v} °C`, bn: `${v} °C`, set: { temp: v } })),
  columns: [
    { key: 'theta', en: 'θ', bn: 'θ', unit: '°C' },
    { key: 'T', en: 'T', bn: 'T', unit: 'K', digits: 2 },
    { key: 't', en: 'Time', bn: 'সময়', unit: 's', digits: 1 },
    { key: 'invT', en: '1/T', bn: '1/T', unit: 'K⁻¹', scientific: true },
    { key: 'lnRate', en: 'ln(1/t)', bn: 'ln(1/t)', digits: 3 }
  ],
  minReadings: 5,
  graph: { x: 'invT', y: 'lnRate', kind: 'scatter' },
  compute: (p, noise) => {
    const theta = clamp(Math.round(p.temp / 5) * 5, 20, 60);
    const tDis = crossTime(TEMP_C, theta);
    const t = clamp(p.t, 0, 200);
    const stage = crossStage(t, tDis);
    const tRead = Math.max(0.5, t + noise(0.3));
    const T = theta + 273.15;
    return {
      row: { theta, T: round(T, 2), t: round(tRead, 1), invT: Number((1 / T).toPrecision(4)), lnRate: round(Math.log(1 / tRead), 3) },
      live: [
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 1, tone: stage === 'gone' ? 'good' : stage === 'late' ? 'warn' : 'info' },
        { en: 'Cross', bn: 'ক্রস', value: stage === 'visible' ? 'still visible' : 'cannot be seen', valueBn: stage === 'visible' ? 'এখনও দেখা যায়' : 'দেখা যায় না' },
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: theta, unit: '°C' },
        { en: '[S₂O₃²⁻]', bn: '[S₂O₃²⁻]', value: TEMP_C, unit: 'M', digits: 4 }
      ],
      view: { cloud: clamp(t / tDis, 0, 1.3), clock: t, temp: theta, vthio: 10, bath: true, running: t > 0 && stage === 'visible' },
      status:
        t === 0
          ? status('info', `Mixture at ${theta} °C, acid added — press ▶ and watch the cross.`, `মিশ্রণ ${theta} °C-এ, অ্যাসিড দেওয়া হয়েছে — ▶ চাপো এবং ক্রস লক্ষ করো।`)
          : stage === 'visible'
            ? status('info', 'Cloudiness is building up… the cross is still visible.', 'ঘোলাটে ভাব বাড়ছে… ক্রস এখনও দেখা যাচ্ছে।')
            : stage === 'gone'
              ? status('good', 'The cross has just disappeared — stop the clock and record!', 'ক্রস এইমাত্র অদৃশ্য হলো — ঘড়ি থামিয়ে রেকর্ড করো!')
              : status('warn', 'Too late — step the stopwatch back (−) to the moment the cross vanished.', 'দেরি হয়ে গেছে — স্টপওয়াচ পিছিয়ে (−) ক্রস অদৃশ্য হওয়ার মুহূর্তে আনো।'),
      ready: stage === 'gone'
    };
  },
  result: {
    en: 'Activation energy (Arrhenius plot)',
    bn: 'সক্রিয়ন শক্তি (আরহেনিয়াস লেখ)',
    unit: 'kJ mol⁻¹',
    digits: 1,
    compute: (rows) => {
      const pts = points(rows, 'T', 't').filter((q) => q.x > 0 && q.y > 0);
      const fit = linearFit(pts.map((q) => 1 / q.x), pts.map((q) => Math.log(1 / q.y)));
      return fit ? (-fit.slope * R) / 1000 : null;
    },
    expected: EA / 1000
  },
  solve: (p) => {
    const theta = clamp(Math.round(p.temp / 5) * 5, 20, 60);
    const tDis = crossTime(TEMP_C, theta);
    return { ...p, temp: theta, t: Math.ceil((tDis + 0.2) * 2) / 2 };
  }
};

/* ------------------------------------------------------------------ */
/* Golden rain — continuous variation (Job's method) for PbI₂            */
/* ------------------------------------------------------------------ */

const PB_C = 0.2;
const KI_C = 0.2;
const pbi2 = (vpb: number) => Math.min(PB_C * vpb, (KI_C * (10 - vpb)) / 2); // mmol
const heightOf = (vpb: number) => 45 * pbi2(vpb); // mm of settled precipitate
const GOLD_DEMO = [opt(0, 'Measure the precipitate', 'অধঃক্ষেপ মাপো'), opt(1, 'Heat to dissolve', 'উত্তপ্ত করে দ্রবীভূত করো'), opt(2, 'Cool slowly', 'ধীরে ঠান্ডা করো')];

const goldenRain: ChemPracticalModel = {
  slug: 'golden-rain',
  scene: 'tubes',
  variant: 'golden',
  howTo_en:
    'Mix x mL of 0.2 M Pb(NO₃)₂ with (10 − x) mL of 0.2 M KI in each tube, let the yellow PbI₂ settle and measure its height. The tallest precipitate marks the reacting ratio — two straight lines through your points meet at KI : Pb²⁺ = 2 : 1. Then heat a tube and cool it slowly for the golden rain.',
  howTo_bn:
    'প্রতিটি নলে x mL 0.2 M Pb(NO₃)₂ এর সাথে (10 − x) mL 0.2 M KI মেশাও, হলুদ PbI₂ থিতাতে দাও এবং এর উচ্চতা মাপো। সবচেয়ে উঁচু অধঃক্ষেপই বিক্রিয়ার অনুপাত নির্দেশ করে — বিন্দুগুলোর মধ্য দিয়ে দুটি সরলরেখা KI : Pb²⁺ = 2 : 1-এ মিলিত হয়। তারপর একটি নল উত্তপ্ত করে ধীরে ঠান্ডা করলে সোনালি বৃষ্টি দেখা যায়।',
  formula: 'Pb²⁺ + 2I⁻ → PbI₂↓ (yellow) · ratio at the peak = V(KI) ÷ V(Pb²⁺)',
  controls: [
    { key: 'vpb', en: 'Pb(NO₃)₂ in the tube (rest KI, 10 mL total)', bn: 'নলে Pb(NO₃)₂ (বাকি KI, মোট 10 mL)', min: 1, max: 9, step: 1, unit: 'mL', default: 3 },
    { key: 't', en: 'Settling time', bn: 'থিতানোর সময়', kind: 'time', min: 0, max: 10, step: 0.5, unit: 'min', default: 0, play: { rate: 1 } },
    { key: 'demo', en: 'Golden rain', bn: 'সোনালি বৃষ্টি', kind: 'view', default: 0, options: GOLD_DEMO }
  ],
  tasks: [1, 2, 3, 4, 5, 6, 7, 8].map((v) => ({ en: `${v} : ${10 - v}`, bn: `${v} : ${10 - v}`, set: { vpb: v, demo: 0 } })),
  columns: [
    { key: 'vpb', en: 'V(Pb²⁺)', bn: 'V(Pb²⁺)', unit: 'mL' },
    { key: 'vki', en: 'V(I⁻)', bn: 'V(I⁻)', unit: 'mL' },
    { key: 'h', en: 'Precipitate height', bn: 'অধঃক্ষেপের উচ্চতা', unit: 'mm', digits: 1 }
  ],
  minReadings: 6,
  graph: { x: 'vpb', y: 'h', kind: 'line' },
  compute: (p, noise, ctx) => {
    const vpb = clamp(Math.round(p.vpb), 1, 9);
    const t = clamp(p.t, 0, 10);
    const demo = clamp(Math.round(p.demo), 0, 2);
    const h = heightOf(vpb);
    const settled = 1 - Math.exp(-t / 1.6);
    const ready = t >= 5 && demo === 0;
    const latest = latestBy(ctx.rows, 'vpb');
    const tubes: TubeView[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => {
      const active = v === vpb;
      const rec = latest.get(String(v));
      const hh = active ? h : rec ? num(rec, 'h') ?? 0 : 0;
      const frac = hh / 100; // tube ≈ 100 mm tall
      if (active && demo === 1) return { label: `${v}`, sub: `${10 - v}`, liquid: '#f8f3d8', level: 0.42, warm: true, active };
      if (active && demo === 2) return { label: `${v}`, sub: `${10 - v}`, liquid: '#f6f1d6', level: 0.42, crystals: clamp(h / 30, 0.25, 1), crystalColor: '#f6c81f', active };
      return {
        label: `${v}`,
        sub: `${10 - v}`,
        liquid: active || rec ? '#f5efcf' : undefined,
        level: active || rec ? 0.42 : 0,
        ppt: active ? frac * settled : frac,
        pptColor: '#f2c21b',
        cloud: active ? (1 - settled) * clamp(h / 30, 0, 1) * 0.9 : 0,
        cloudColor: '#f6c81f',
        active
      };
    });
    const view: TubesView = { tubes, clock: { value: t, unit: 'min' }, caption: 'V(Pb²⁺) : V(I⁻) / mL', captionBn: 'V(Pb²⁺) : V(I⁻) / mL' };
    return {
      row: { vpb, vki: 10 - vpb, h: round(Math.max(0, h + noise(0.4)), 1) },
      live: [
        { en: 'Precipitate height', bn: 'অধঃক্ষেপের উচ্চতা', value: ready ? h : h * settled, unit: 'mm', digits: 1, tone: ready ? 'good' : 'info' },
        { en: 'PbI₂ formed', bn: 'উৎপন্ন PbI₂', value: pbi2(vpb), unit: 'mmol', digits: 3 },
        { en: 'Limiting reagent', bn: 'সীমাবদ্ধ বিক্রিয়ক', value: PB_C * vpb < (KI_C * (10 - vpb)) / 2 ? 'Pb²⁺' : 'I⁻' },
        { en: 'Settling time', bn: 'থিতানোর সময়', value: t, unit: 'min', digits: 1 }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        demo === 1
          ? status('info', 'On heating, the yellow PbI₂ dissolves in the hot water to give a colourless solution.', 'উত্তপ্ত করলে হলুদ PbI₂ গরম পানিতে দ্রবীভূত হয়ে বর্ণহীন দ্রবণ দেয়।')
          : demo === 2
            ? status('good', 'As it cools slowly, glittering golden plates of PbI₂ float down — golden rain!', 'ধীরে ঠান্ডা হলে PbI₂-এর ঝিকমিকে সোনালি পাত ভেসে নামে — সোনালি বৃষ্টি!')
            : t < 5
              ? status('info', t === 0 ? 'Yellow precipitate forms at once — press ▶ and let it settle.' : 'The yellow precipitate is settling… wait 5 minutes before measuring.', t === 0 ? 'সাথে সাথে হলুদ অধঃক্ষেপ তৈরি হয় — ▶ চেপে থিতাতে দাও।' : 'হলুদ অধঃক্ষেপ থিতিয়ে পড়ছে… মাপার আগে ৫ মিনিট অপেক্ষা করো।')
              : status('good', 'Settled — measure the height of the precipitate and record.', 'থিতিয়েছে — অধঃক্ষেপের উচ্চতা মেপে রেকর্ড করো।'),
      ready
    };
  },
  result: {
    en: 'Reacting ratio KI : Pb(NO₃)₂ (where the two lines meet)',
    bn: 'বিক্রিয়ার অনুপাত KI : Pb(NO₃)₂ (দুই রেখার মিলনবিন্দু)',
    unit: '',
    digits: 2,
    compute: (rows) => {
      const x = twoLineIntersection(points(rows, 'vpb', 'h'));
      return x && x.x > 0 && x.x < 10 ? (10 - x.x) / x.x : null;
    },
    expected: 2
  },
  solve: (p) => ({ ...p, demo: 0, t: Math.max(p.t, 5) })
};

export const kineticsModels: ChemPracticalModel[] = [rateConcentration, rateTemperature, goldenRain];
