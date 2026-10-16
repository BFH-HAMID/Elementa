import type { ChemPracticalModel, ChemRow } from './types';
import { MOLAR_VOLUME_ML, clamp, num, opt, points, rise, riseTime, round, slopeThroughOrigin, status, tx } from './helpers';

const maxOf = (rows: ChemRow[], key: string): number | null => {
  const vals = rows.map((r) => num(r, key)).filter((v): v is number => v !== null);
  return vals.length ? Math.max(...vals) : null;
};
const meanOf = (vals: number[]): number | null => (vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null);
const timeTasks = (times: number[], extra: Record<string, number> = {}) => times.map((t) => ({ en: `${t} s`, bn: `${t} সে`, set: { ...extra, t } }));

/* ------------------------------------------------------------------ */
/* Preparation of hydrogen (collection over water)                       */
/* ------------------------------------------------------------------ */

const ZN_MASS = 0.2;
const H2_FINAL = (ZN_MASS / 65.38) * MOLAR_VOLUME_ML; // 73.4 mL
const H2_CONC = [0.5, 1.0, 2.0];

const prepareHydrogen: ChemPracticalModel = {
  slug: 'prepare-hydrogen',
  scene: 'gas',
  variant: 'hydrogen',
  howTo_en:
    '0.20 g of zinc granules react with dilute HCl added through the thistle funnel. Hydrogen is collected over water in an inverted measuring cylinder. Press ▶ to run the stopwatch, record the volume at the suggested times until the fizzing stops, and test the gas with a burning splint.',
  howTo_bn:
    'থিসল ফানেল দিয়ে দেওয়া লঘু HCl-এর সাথে 0.20 g জিঙ্ক কণা বিক্রিয়া করে। হাইড্রোজেন পানির উপর উল্টানো মাপনী সিলিন্ডারে সংগ্রহ করা হয়। ▶ চেপে স্টপওয়াচ চালাও, বুদবুদ থামা পর্যন্ত প্রস্তাবিত সময়গুলোতে আয়তন রেকর্ড করো এবং জ্বলন্ত কাঠি দিয়ে গ্যাসটি পরীক্ষা করো।',
  formula: 'Zn + 2HCl → ZnCl₂ + H₂↑ · V(H₂) = n(Zn) × 24 000 mL',
  controls: [
    { key: 'conc', en: 'Acid concentration', bn: 'অ্যাসিডের ঘনমাত্রা', default: 1, options: H2_CONC.map((c, i) => opt(i, `${c} M`, `${c} M`)) },
    { key: 'cat', en: 'Drops of CuSO₄ (catalyst)', bn: 'CuSO₄-এর ফোঁটা (প্রভাবক)', default: 0, options: [opt(0, 'None', 'নেই'), opt(1, 'Added', 'দেওয়া হয়েছে')] },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 600, step: 10, unit: 's', default: 0, play: { rate: 20 } },
    { key: 'test', en: 'Test the gas', bn: 'গ্যাস পরীক্ষা', kind: 'view', default: 0, options: [opt(0, 'No test', 'পরীক্ষা নয়'), opt(1, 'Burning splint', 'জ্বলন্ত কাঠি')] }
  ],
  tasks: timeTasks([30, 60, 120, 180, 300, 450, 600]),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'v', en: 'V(H₂)', bn: 'V(H₂)', unit: 'mL', digits: 1 }
  ],
  minReadings: 6,
  graph: { x: 't', y: 'v', kind: 'line' },
  compute: (p, noise, ctx) => {
    const c = H2_CONC[clamp(Math.round(p.conc), 0, 2)];
    const k = 0.012 * c * (p.cat === 1 ? 2.5 : 1);
    const t = clamp(p.t, 0, 600);
    const v = rise(H2_FINAL, k, t);
    const rate = H2_FINAL * k * Math.exp(-k * t);
    const done = v >= H2_FINAL * 0.99;
    const left = ZN_MASS * (1 - v / H2_FINAL);
    const test = p.test === 1;
    return {
      row: { t: round(t, 0), v: round(Math.max(0, v + noise(0.3)), 1) },
      live: [
        { en: 'Hydrogen collected', bn: 'সংগৃহীত হাইড্রোজেন', value: v, unit: 'mL', digits: 1, tone: done ? 'good' : 'info' },
        { en: 'Rate', bn: 'হার', value: rate * 60, unit: 'mL min⁻¹', digits: 1 },
        { en: 'Zinc left', bn: 'অবশিষ্ট জিঙ্ক', value: left, unit: 'g', digits: 3 },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: {
        funnel: 'thistle',
        liquid: '#eaf3fb',
        level: 0.42,
        solid: { kind: 'granules', color: '#b9c2cc', amount: Math.max(0.05, left / ZN_MASS) },
        bubbles: t > 0 ? clamp((rate / (H2_FINAL * 0.03)) * 0.9, 0.05, 1) * (done ? 0.1 : 1) : 0,
        collect: 'overWater',
        volume: v,
        max: 100,
        clock: t,
        test: test ? 'pop' : 'none',
        label: 'Zn + HCl',
        curve: { pts: points(ctx.rows, 't', 'v'), cur: { x: t, y: v }, xMax: 600, yMin: 0, yMax: 80, xLabel: 't / s', yLabel: 'V / mL' }
      },
      status:
        t === 0
          ? status('info', 'Acid added — press ▶ to start the stopwatch and watch the cylinder.', 'অ্যাসিড দেওয়া হয়েছে — ▶ চেপে স্টপওয়াচ চালু করো এবং সিলিন্ডারটি লক্ষ করো।')
          : done
            ? status('good', `Fizzing has stopped: all the zinc has reacted and the volume is steady.${test ? ' The splint gives a squeaky pop — hydrogen!' : ''}`, `বুদবুদ থেমেছে: সব জিঙ্ক বিক্রিয়া করেছে, আয়তন স্থির।${test ? ' কাঠিতে চিঁ শব্দে পপ — হাইড্রোজেন!' : ''}`)
            : status('info', `Fizzing — hydrogen pushes water out of the cylinder.${test ? ' Burning splint: squeaky pop!' : ''}`, `বুদবুদ উঠছে — হাইড্রোজেন সিলিন্ডার থেকে পানি সরিয়ে দিচ্ছে।${test ? ' জ্বলন্ত কাঠি: চিঁ শব্দে পপ!' : ''}`),
      ready: true
    };
  },
  result: {
    en: 'Total hydrogen from 0.20 g of zinc',
    bn: '0.20 g জিঙ্ক থেকে মোট হাইড্রোজেন',
    unit: 'mL',
    digits: 1,
    compute: (rows) => maxOf(rows, 'v'),
    expected: H2_FINAL
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* Preparation of carbon dioxide (mass loss on a balance)                */
/* ------------------------------------------------------------------ */

const CO2_CONC = [1.0, 2.0];
const CO2_K = [0.004, 0.01, 0.03];
const co2Total = (c: number) => ((0.05 * c) / 2) * 44.01; // 50 mL acid, marble in excess

const prepareCo2: ChemPracticalModel = {
  slug: 'prepare-co2',
  scene: 'gas',
  variant: 'co2',
  howTo_en:
    'Marble chips (excess) react with 50 mL of dilute HCl in a flask on a top-pan balance; a cotton-wool plug lets CO₂ escape but keeps the spray in. Run the stopwatch and record the balance reading — the mass lost is the CO₂ given off. Bubble the gas through limewater to identify it.',
  howTo_bn:
    'টপ-প্যান নিক্তির উপর রাখা ফ্লাস্কে মার্বেল টুকরো (অতিরিক্ত) 50 mL লঘু HCl-এর সাথে বিক্রিয়া করে; তুলার ছিপি CO₂ বের হতে দেয় কিন্তু ছিটা আটকায়। স্টপওয়াচ চালিয়ে নিক্তির পাঠ রেকর্ড করো — যে ভর কমে, সেটিই নির্গত CO₂। গ্যাসটি চুনের পানিতে চালনা করে শনাক্ত করো।',
  formula: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑ · m(CO₂) = ½ n(HCl) × 44.0 g',
  controls: [
    { key: 'chips', en: 'Marble', bn: 'মার্বেল', default: 1, options: [opt(0, 'Large chips', 'বড় টুকরো'), opt(1, 'Small chips', 'ছোট টুকরো'), opt(2, 'Powder', 'গুঁড়া')] },
    { key: 'conc', en: 'HCl (50 mL)', bn: 'HCl (50 mL)', default: 0, options: CO2_CONC.map((c, i) => opt(i, `${c} M`, `${c} M`)) },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 600, step: 10, unit: 's', default: 0, play: { rate: 20 } },
    { key: 'test', en: 'Limewater test', bn: 'চুনের পানি পরীক্ষা', kind: 'view', default: 0, options: [opt(0, 'Off', 'না'), opt(1, 'Bubble the gas through', 'গ্যাস চালনা করো')] }
  ],
  tasks: timeTasks([0, 60, 120, 180, 240, 360, 480, 600]),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'mass', en: 'Balance reading', bn: 'নিক্তির পাঠ', unit: 'g', digits: 2 },
    { key: 'loss', en: 'Mass of CO₂ lost', bn: 'হারানো CO₂-এর ভর', unit: 'g', digits: 2 }
  ],
  minReadings: 7,
  graph: { x: 't', y: 'loss', kind: 'line' },
  compute: (p, noise, ctx) => {
    const c = CO2_CONC[p.conc === 1 ? 1 : 0];
    const chips = clamp(Math.round(p.chips), 0, 2);
    const k = CO2_K[chips] * c;
    const t = clamp(p.t, 0, 600);
    const total = co2Total(c);
    const loss = rise(total, k, t);
    const start = 150.0;
    const reading = start - loss + noise(0.005);
    const done = loss >= total * 0.99;
    const test = p.test === 1;
    return {
      row: { t: round(t, 0), mass: round(reading, 2), loss: round(start - reading, 2) },
      live: [
        { en: 'Balance', bn: 'নিক্তি', value: start - loss, unit: 'g', digits: 2, tone: 'info' },
        { en: 'CO₂ lost', bn: 'হারানো CO₂', value: loss, unit: 'g', digits: 3 },
        { en: 'CO₂ given off', bn: 'নির্গত CO₂', value: (loss / 44.01) * MOLAR_VOLUME_ML, unit: 'mL', digits: 0 },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: {
        funnel: 'plug',
        liquid: '#eef3f6',
        level: 0.4,
        solid: { kind: chips === 2 ? 'powder' : 'chips', color: '#f1f1ec', amount: 1 - (loss / total) * 0.35, size: chips },
        bubbles: t > 0 && !done ? clamp(k * 40 * Math.exp(-k * t), 0.06, 1) : 0,
        collect: 'balance',
        balance: start - loss,
        clock: t,
        test: test ? 'milky' : 'none',
        testAmount: clamp(loss / 0.05, 0, 1),
        label: 'CaCO₃ + HCl',
        curve: { pts: points(ctx.rows, 't', 'loss'), cur: { x: t, y: loss }, xMax: 600, yMin: 0, yMax: c === 2 ? 2.4 : 1.2, xLabel: 't / s', yLabel: 'Δm / g' }
      },
      status:
        t === 0
          ? status('info', 'Note the starting mass, then press ▶ — the balance reading falls as CO₂ escapes.', 'শুরুর ভর লিখে ▶ চাপো — CO₂ বেরিয়ে যাওয়ার সাথে সাথে নিক্তির পাঠ কমবে।')
          : done
            ? status('good', 'The acid is used up: the mass is constant. This mass loss is all the CO₂.', 'অ্যাসিড শেষ: ভর এখন স্থির। এই হারানো ভরই মোট CO₂।')
            : status('info', `Effervescence — CO₂ escapes through the cotton wool.${test ? ' Limewater turns milky!' : ''}`, `বুদবুদ — CO₂ তুলার ছিপি দিয়ে বেরিয়ে যাচ্ছে।${test ? ' চুনের পানি ঘোলা হচ্ছে!' : ''}`),
      ready: true
    };
  },
  result: {
    en: 'Mass of CO₂ given off (constant mass)',
    bn: 'নির্গত CO₂-এর ভর (স্থির ভর)',
    unit: 'g',
    digits: 3,
    compute: (rows) => maxOf(rows, 'loss'),
    expected: (p) => co2Total(CO2_CONC[p.conc === 1 ? 1 : 0])
  },
  solve: (p) => p
};

/* ------------------------------------------------------------------ */
/* Preparation of chlorine — mole ratio Cl₂ : KMnO₄                      */
/* ------------------------------------------------------------------ */

const KMNO4_MOL = 0.316 / 158.03;
const CONC_HCL = 11.6; // mol L⁻¹
const cl2Moles = (hclMl: number) => Math.min((5 / 16) * ((hclMl * CONC_HCL) / 1000), 2.5 * KMNO4_MOL);
const CL2_METHODS = [
  { en: 'Upward displacement of air', bn: 'বায়ুর ঊর্ধ্বমুখী অপসারণ', f: 1 },
  { en: 'Over water', bn: 'পানির উপর', f: 0.7 },
  { en: 'Downward displacement of air', bn: 'বায়ুর নিম্নমুখী অপসারণ', f: 0.2 }
];

const prepareChlorine: ChemPracticalModel = {
  slug: 'prepare-chlorine',
  scene: 'gas',
  variant: 'chlorine',
  howTo_en:
    'In the fume cupboard, conc. HCl drips from a dropping funnel onto 0.316 g of KMnO₄ crystals. Collect the greenish-yellow chlorine in a gas jar, run in the acid in steps and record the gas volume each time. When the volume stops rising the KMnO₄ is used up: the plateau gives the mole ratio Cl₂ : KMnO₄.',
  howTo_bn:
    'ফিউম কাপবোর্ডে ড্রপিং ফানেল থেকে গাঢ় HCl 0.316 g KMnO₄ কেলাসের উপর ফোঁটায় পড়ে। সবুজাভ-হলুদ ক্লোরিন গ্যাসজারে সংগ্রহ করো, ধাপে ধাপে অ্যাসিড দাও এবং প্রতিবার গ্যাসের আয়তন রেকর্ড করো। আয়তন আর না বাড়লে KMnO₄ শেষ: সেই স্থির মান থেকে Cl₂ : KMnO₄ মোল অনুপাত পাওয়া যায়।',
  formula: '2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂ + 8H₂O',
  controls: [
    { key: 'method', en: 'Collect by', bn: 'সংগ্রহের পদ্ধতি', default: 1, options: CL2_METHODS.map((m, i) => opt(i, m.en, m.bn)) },
    { key: 'hcl', en: 'Conc. HCl run in', bn: 'যোগ করা গাঢ় HCl', kind: 'time', min: 0, max: 3, step: 0.25, unit: 'mL', default: 0, fine: true, digits: 2 },
    { key: 'test', en: 'Test the gas', bn: 'গ্যাস পরীক্ষা', kind: 'view', default: 0, options: [opt(0, 'No test', 'পরীক্ষা নয়'), opt(1, 'Damp blue litmus', 'ভেজা নীল লিটমাস'), opt(2, 'Starch–iodide paper', 'স্টার্চ-আয়োডাইড কাগজ')] }
  ],
  tasks: [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5].map((v) => ({ en: `${v} mL`, bn: `${v} mL`, set: { method: 0, hcl: v } })),
  columns: [
    { key: 'hcl', en: 'HCl added', bn: 'যোগ করা HCl', unit: 'mL', digits: 2 },
    { key: 'v', en: 'V(Cl₂)', bn: 'V(Cl₂)', unit: 'mL', digits: 1 },
    { key: 'ratio', en: 'n(Cl₂) ÷ n(KMnO₄)', bn: 'n(Cl₂) ÷ n(KMnO₄)', digits: 2 }
  ],
  minReadings: 6,
  graph: { x: 'hcl', y: 'v', kind: 'line' },
  compute: (p, noise, ctx) => {
    const method = clamp(Math.round(p.method), 0, 2);
    const hcl = clamp(p.hcl, 0, 3);
    const n = cl2Moles(hcl);
    const made = n * MOLAR_VOLUME_ML;
    const collected = made * CL2_METHODS[method].f;
    const vRead = Math.max(0, collected + noise(0.6));
    const ratio = vRead / MOLAR_VOLUME_ML / KMNO4_MOL;
    const plateau = n >= 2.5 * KMNO4_MOL - 1e-9;
    const test = clamp(Math.round(p.test), 0, 2);
    const ok = method === 0;
    return {
      row: { hcl: round(hcl, 2), v: round(vRead, 1), ratio: round(ratio, 2) },
      live: [
        { en: 'Chlorine collected', bn: 'সংগৃহীত ক্লোরিন', value: collected, unit: 'mL', digits: 1, tone: ok ? 'info' : 'warn' },
        { en: 'KMnO₄ left', bn: 'অবশিষ্ট KMnO₄', value: Math.max(0, KMNO4_MOL - n / 2.5) * 158.03, unit: 'g', digits: 3 },
        { en: 'n(Cl₂) ÷ n(KMnO₄)', bn: 'n(Cl₂) ÷ n(KMnO₄)', value: collected / MOLAR_VOLUME_ML / KMNO4_MOL, digits: 2 },
        { en: 'HCl added', bn: 'যোগ করা HCl', value: hcl, unit: 'mL', digits: 2 }
      ],
      view: {
        funnel: 'dropping',
        liquid: '#f3eef6',
        level: 0.16,
        solid: { kind: 'crystals', color: '#5b1f86', amount: Math.max(0.05, 1 - n / (2.5 * KMNO4_MOL)) },
        bubbles: hcl > 0 && !plateau ? 0.6 : hcl > 0 ? 0.08 : 0,
        fumes: hcl > 0 ? 0.6 : 0,
        fumeColor: '#cfe06a',
        funnelLevel: 1 - hcl / 3,
        collect: method === 0 ? 'upward' : method === 1 ? 'overWater' : 'downward',
        volume: collected,
        max: 250,
        gasColor: '#cfe06a',
        hood: true,
        test: test === 1 ? 'bleach' : test === 2 ? 'starch' : 'none',
        testAmount: clamp(collected / 40, 0, 1),
        label: 'KMnO₄',
        curve: { pts: points(ctx.rows, 'hcl', 'v'), cur: { x: hcl, y: collected }, xMax: 3, yMin: 0, yMax: 140, xLabel: 'HCl / mL', yLabel: 'V / mL' }
      },
      status: !ok
        ? status('warn', method === 1 ? 'Chlorine dissolves in water — much of it is lost. Collect it by upward displacement of air (it is denser than air).' : 'Chlorine is denser than air, so it pours out of a jar held upside down. Use upward displacement of air.', method === 1 ? 'ক্লোরিন পানিতে দ্রবীভূত হয় — অনেকটা হারিয়ে যায়। বায়ুর ঊর্ধ্বমুখী অপসারণে সংগ্রহ করো (এটি বায়ুর চেয়ে ভারী)।' : 'ক্লোরিন বায়ুর চেয়ে ভারী, তাই উল্টানো জার থেকে বেরিয়ে যায়। বায়ুর ঊর্ধ্বমুখী অপসারণ ব্যবহার করো।')
        : hcl === 0
          ? status('info', 'Open the dropping-funnel tap to run conc. HCl onto the KMnO₄ (use the slider or ±).', 'ড্রপিং ফানেলের ট্যাপ খুলে KMnO₄-এর উপর গাঢ় HCl দাও (স্লাইডার বা ± ব্যবহার করো)।')
          : plateau
            ? status('good', `All the KMnO₄ has reacted — more acid gives no more chlorine.${test === 1 ? ' Damp litmus turns red, then is bleached.' : test === 2 ? ' Starch–iodide paper turns blue-black.' : ''}`, `সব KMnO₄ বিক্রিয়া করেছে — আরও অ্যাসিড দিলেও ক্লোরিন বাড়ে না।${test === 1 ? ' ভেজা লিটমাস লাল হয়ে পরে বিরঞ্জিত হয়।' : test === 2 ? ' স্টার্চ-আয়োডাইড কাগজ নীল-কালো হয়।' : ''}`)
            : status('info', `Greenish-yellow chlorine is forming — the acid is the limiting reagent so far.${test === 1 ? ' Damp litmus is bleached.' : test === 2 ? ' Starch–iodide paper turns blue-black.' : ''}`, `সবুজাভ-হলুদ ক্লোরিন তৈরি হচ্ছে — এখন পর্যন্ত অ্যাসিডই সীমাবদ্ধ বিক্রিয়ক।${test === 1 ? ' ভেজা লিটমাস বিরঞ্জিত হয়।' : test === 2 ? ' স্টার্চ-আয়োডাইড কাগজ নীল-কালো হয়।' : ''}`),
      ready: ok && hcl > 0
    };
  },
  result: {
    en: 'Mole ratio Cl₂ : KMnO₄ (plateau)',
    bn: 'মোল অনুপাত Cl₂ : KMnO₄ (স্থির মান)',
    unit: '',
    digits: 2,
    compute: (rows) => maxOf(rows, 'ratio'),
    expected: 2.5
  },
  solve: (p) => ({ ...p, method: 0, hcl: p.hcl > 0 ? p.hcl : 0.5 })
};

/* ------------------------------------------------------------------ */
/* Aluminium with sodium hydroxide — mol H₂ per mol Al                   */
/* ------------------------------------------------------------------ */

const AL_MASS = [0.018, 0.036, 0.054];
const AL_MEDIA = [
  { en: 'NaOH 2 M', bn: 'NaOH 2 M', lag: 40 },
  { en: 'HCl 2 M', bn: 'HCl 2 M', lag: 60 },
  { en: 'Water', bn: 'পানি', lag: Infinity }
];
const AL_K = 0.015;
const alFinal = (m: number) => (m / 26.98) * 1.5 * MOLAR_VOLUME_ML;
const alDoneTime = (medium: number) => Math.ceil(riseTime(AL_K, 0.996, AL_MEDIA[medium].lag) / 10) * 10;

const aluminiumAlkali: ChemPracticalModel = {
  slug: 'aluminium-alkali',
  scene: 'gas',
  variant: 'aluminium',
  howTo_en:
    'Drop a weighed piece of aluminium foil into the reagent and collect the hydrogen in a gas syringe. Nothing happens at first while the oxide layer dissolves. Run the stopwatch until the volume is steady, record, and repeat with other masses (and with HCl) — compare moles of H₂ with moles of Al.',
  howTo_bn:
    'ওজন করা অ্যালুমিনিয়াম ফয়েলের টুকরো বিকারকে ফেলো এবং হাইড্রোজেন গ্যাস সিরিঞ্জে সংগ্রহ করো। প্রথমে অক্সাইড স্তর দ্রবীভূত হওয়া পর্যন্ত কিছুই ঘটে না। আয়তন স্থির হওয়া পর্যন্ত স্টপওয়াচ চালাও, রেকর্ড করো এবং অন্য ভর (ও HCl) দিয়ে পুনরাবৃত্তি করো — H₂-এর মোলকে Al-এর মোলের সাথে তুলনা করো।',
  formula: '2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑',
  controls: [
    { key: 'medium', en: 'Reagent', bn: 'বিকারক', default: 0, options: AL_MEDIA.map((m, i) => opt(i, m.en, m.bn)) },
    { key: 'mass', en: 'Aluminium foil', bn: 'অ্যালুমিনিয়াম ফয়েল', default: 1, options: AL_MASS.map((m, i) => opt(i, `${m.toFixed(3)} g`, `${m.toFixed(3)} g`)) },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 600, step: 10, unit: 's', default: 0, play: { rate: 20 } }
  ],
  tasks: [
    { en: 'NaOH · 0.018 g', bn: 'NaOH · 0.018 g', set: { medium: 0, mass: 0 } },
    { en: 'NaOH · 0.036 g', bn: 'NaOH · 0.036 g', set: { medium: 0, mass: 1 } },
    { en: 'NaOH · 0.054 g', bn: 'NaOH · 0.054 g', set: { medium: 0, mass: 2 } },
    { en: 'HCl · 0.036 g', bn: 'HCl · 0.036 g', set: { medium: 1, mass: 1 } }
  ],
  columns: [
    { key: 'medium', en: 'Reagent', bn: 'বিকারক' },
    { key: 'm', en: 'm(Al)', bn: 'm(Al)', unit: 'g', digits: 3 },
    { key: 'v', en: 'V(H₂)', bn: 'V(H₂)', unit: 'mL', digits: 1 },
    { key: 'ratio', en: 'n(H₂) ÷ n(Al)', bn: 'n(H₂) ÷ n(Al)', digits: 2 }
  ],
  minReadings: 4,
  graph: { x: 'm', y: 'v', kind: 'scatter' },
  compute: (p, noise) => {
    const medium = clamp(Math.round(p.medium), 0, 2);
    const m = AL_MASS[clamp(Math.round(p.mass), 0, 2)];
    const t = clamp(p.t, 0, 600);
    const vf = alFinal(m);
    const lag = AL_MEDIA[medium].lag;
    const v = Number.isFinite(lag) ? rise(vf, AL_K, t, lag) : 0;
    const done = Number.isFinite(lag) && v >= vf * 0.995;
    const vRead = Math.max(0, v + noise(0.3));
    const ratio = vRead / MOLAR_VOLUME_ML / (m / 26.98);
    const inLag = Number.isFinite(lag) && t < lag;
    return {
      row: { ...tx('medium', AL_MEDIA[medium].en, AL_MEDIA[medium].bn), m, v: round(vRead, 1), ratio: round(ratio, 2) },
      live: [
        { en: 'Gas syringe', bn: 'গ্যাস সিরিঞ্জ', value: v, unit: 'mL', digits: 1, tone: done ? 'good' : 'info' },
        { en: 'Expected maximum', bn: 'প্রত্যাশিত সর্বোচ্চ', value: vf, unit: 'mL', digits: 1 },
        { en: 'n(H₂) ÷ n(Al)', bn: 'n(H₂) ÷ n(Al)', value: v / MOLAR_VOLUME_ML / (m / 26.98), digits: 2 },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: {
        funnel: 'bung',
        liquid: medium === 2 ? '#dcefff' : '#eef3f8',
        level: 0.38,
        solid: { kind: 'foil', color: '#cfd6dd', amount: Number.isFinite(lag) ? Math.max(0.04, 1 - v / vf) : 1 },
        bubbles: Number.isFinite(lag) && t > lag && !done ? clamp(0.25 + 0.75 * Math.exp(-AL_K * (t - lag)), 0, 1) : 0,
        warm: Number.isFinite(lag) && t > lag && !done,
        collect: 'syringe',
        volume: v,
        max: 100,
        clock: t,
        label: `Al + ${AL_MEDIA[medium].en}`,
        labelBn: `Al + ${AL_MEDIA[medium].bn}`
      },
      status: !Number.isFinite(lag)
        ? status('warn', 'No reaction: the thin oxide layer protects aluminium from water. Use NaOH or HCl.', 'বিক্রিয়া নেই: পাতলা অক্সাইড স্তর অ্যালুমিনিয়ামকে পানি থেকে রক্ষা করে। NaOH বা HCl ব্যবহার করো।')
        : t === 0
          ? status('info', 'Foil added — press ▶ to start the stopwatch.', 'ফয়েল দেওয়া হয়েছে — ▶ চেপে স্টপওয়াচ চালু করো।')
          : inLag
            ? status('info', 'No gas yet: the reagent is first dissolving the protective Al₂O₃ layer.', 'এখনও গ্যাস নেই: বিকারক আগে প্রতিরক্ষামূলক Al₂O₃ স্তর দ্রবীভূত করছে।')
            : done
              ? status('good', 'The foil has gone and the syringe is steady — record the volume.', 'ফয়েল শেষ, সিরিঞ্জ স্থির — আয়তন রেকর্ড করো।')
              : status('info', 'Vigorous fizzing, the flask gets warm — keep the stopwatch running until the volume is steady.', 'তীব্র বুদবুদ, ফ্লাস্ক গরম হচ্ছে — আয়তন স্থির না হওয়া পর্যন্ত স্টপওয়াচ চালাও।'),
      ready: done
    };
  },
  result: {
    en: 'Moles of H₂ per mole of Al',
    bn: 'প্রতি মোল Al-এ H₂-এর মোল',
    unit: '',
    digits: 2,
    compute: (rows) => meanOf(rows.map((r) => num(r, 'ratio')).filter((v): v is number => v !== null)),
    expected: 1.5
  },
  solve: (p) => {
    const medium = clamp(Math.round(p.medium), 0, 1);
    return { ...p, medium, t: Math.max(p.t, alDoneTime(medium)) };
  }
};

/* ------------------------------------------------------------------ */
/* Extra: Molar volume of hydrogen                                       */
/* ------------------------------------------------------------------ */

const MV_K = 0.035;
const MV_DONE = Math.ceil(riseTime(MV_K, 0.996) / 5) * 5;

const molarVolume: ChemPracticalModel = {
  slug: 'molar-volume-hydrogen',
  scene: 'gas',
  variant: 'molarVolume',
  howTo_en:
    'Weigh a strip of magnesium ribbon, drop it into excess dilute HCl and collect the hydrogen in a gas syringe until the volume is steady. Repeat with different masses. Volume ÷ moles of Mg gives the molar volume of a gas at room temperature and pressure.',
  howTo_bn:
    'এক টুকরো ম্যাগনেসিয়াম ফিতা ওজন করে অতিরিক্ত লঘু HCl-এ ফেলো এবং আয়তন স্থির না হওয়া পর্যন্ত হাইড্রোজেন গ্যাস সিরিঞ্জে সংগ্রহ করো। ভিন্ন ভিন্ন ভরে পুনরাবৃত্তি করো। আয়তন ÷ Mg-এর মোল = কক্ষ তাপমাত্রা ও চাপে গ্যাসের মোলার আয়তন।',
  formula: 'Mg + 2HCl → MgCl₂ + H₂↑ · Vm = V(H₂) ÷ n(Mg)',
  controls: [
    { key: 'mass', en: 'Magnesium ribbon', bn: 'ম্যাগনেসিয়াম ফিতা', min: 0.01, max: 0.08, step: 0.005, unit: 'g', default: 0.04, digits: 3 },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 240, step: 5, unit: 's', default: 0, play: { rate: 10 } }
  ],
  tasks: [0.02, 0.03, 0.04, 0.05, 0.06].map((m) => ({ en: `${m.toFixed(3)} g`, bn: `${m.toFixed(3)} g`, set: { mass: m } })),
  columns: [
    { key: 'm', en: 'm(Mg)', bn: 'm(Mg)', unit: 'g', digits: 3 },
    { key: 'n', en: 'n(Mg)', bn: 'n(Mg)', unit: 'mol', scientific: true },
    { key: 'v', en: 'V(H₂)', bn: 'V(H₂)', unit: 'mL', digits: 1 },
    { key: 'vm', en: 'Vm', bn: 'Vm', unit: 'L mol⁻¹', digits: 2 }
  ],
  minReadings: 5,
  graph: { x: 'n', y: 'v', kind: 'scatter' },
  compute: (p, noise) => {
    const m = clamp(p.mass, 0.01, 0.08);
    const n = m / 24.31;
    const vf = n * MOLAR_VOLUME_ML;
    const t = clamp(p.t, 0, 240);
    const v = rise(vf, MV_K, t);
    const done = v >= vf * 0.995;
    const vRead = Math.max(0, v + noise(0.3));
    return {
      row: { m: round(m, 3), n: Number(n.toPrecision(4)), v: round(vRead, 1), vm: round(vRead / 1000 / n, 2) },
      live: [
        { en: 'Gas syringe', bn: 'গ্যাস সিরিঞ্জ', value: v, unit: 'mL', digits: 1, tone: done ? 'good' : 'info' },
        { en: 'n(Mg)', bn: 'n(Mg)', value: Number(n.toPrecision(3)), unit: 'mol' },
        { en: 'V ÷ n so far', bn: 'এখন পর্যন্ত V ÷ n', value: v / 1000 / n, unit: 'L mol⁻¹', digits: 1 },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: {
        funnel: 'bung',
        liquid: '#eaf3fb',
        level: 0.4,
        solid: { kind: 'ribbon', color: '#d8dee6', amount: Math.max(0.04, 1 - v / vf) },
        bubbles: t > 0 && !done ? clamp(0.3 + 0.7 * Math.exp(-MV_K * t), 0, 1) : 0,
        collect: 'syringe',
        volume: v,
        max: 100,
        clock: t,
        label: `Mg ${m.toFixed(3)} g + HCl`
      },
      status:
        t === 0
          ? status('info', 'Ribbon added to the acid — press ▶.', 'ফিতাটি অ্যাসিডে দেওয়া হয়েছে — ▶ চাপো।')
          : done
            ? status('good', 'The magnesium has dissolved and the plunger has stopped — record the volume.', 'ম্যাগনেসিয়াম দ্রবীভূত হয়েছে, প্লাঞ্জার থেমে গেছে — আয়তন রেকর্ড করো।')
            : status('info', 'Hydrogen pushes the plunger out — wait until it stops moving.', 'হাইড্রোজেন প্লাঞ্জারকে ঠেলে বের করছে — থেমে যাওয়া পর্যন্ত অপেক্ষা করো।'),
      ready: done
    };
  },
  result: {
    en: 'Molar volume of hydrogen (slope of V against n)',
    bn: 'হাইড্রোজেনের মোলার আয়তন (V বনাম n-এর ঢাল)',
    unit: 'L mol⁻¹',
    digits: 2,
    compute: (rows) => {
      const s = slopeThroughOrigin(rows, 'n', 'v');
      return s === null ? null : s / 1000;
    },
    expected: MOLAR_VOLUME_ML / 1000
  },
  solve: (p) => ({ ...p, t: Math.max(p.t, MV_DONE) })
};

/* ------------------------------------------------------------------ */
/* Extra: Catalytic decomposition of hydrogen peroxide                   */
/* ------------------------------------------------------------------ */

const H2O2_VOL = 10; // mL
const H2O2_CONC = 0.5;
const O2_FINAL = ((H2O2_VOL / 1000) * H2O2_CONC * 0.5) * MOLAR_VOLUME_ML; // 60 mL
const CAT = [
  { en: 'No catalyst', bn: 'প্রভাবক নেই', k: 0.0004, mass: 0 },
  { en: 'MnO₂ 0.1 g', bn: 'MnO₂ 0.1 g', k: 0.02, mass: 0.1 },
  { en: 'MnO₂ 0.5 g', bn: 'MnO₂ 0.5 g', k: 0.06, mass: 0.5 }
];

const peroxide: ChemPracticalModel = {
  slug: 'catalytic-decomposition-h2o2',
  scene: 'gas',
  variant: 'peroxide',
  howTo_en:
    '10.0 mL of hydrogen peroxide decomposes very slowly on its own. Tip in manganese(IV) oxide and collect the oxygen in a gas syringe, recording the volume at the suggested times. The final volume gives the peroxide concentration — and the MnO₂ is recovered unchanged.',
  howTo_bn:
    '10.0 mL হাইড্রোজেন পারক্সাইড নিজে নিজে খুব ধীরে বিয়োজিত হয়। ম্যাঙ্গানিজ(IV) অক্সাইড দিয়ে অক্সিজেন গ্যাস সিরিঞ্জে সংগ্রহ করো এবং প্রস্তাবিত সময়গুলোতে আয়তন রেকর্ড করো। শেষ আয়তন থেকে পারক্সাইডের ঘনমাত্রা পাওয়া যায় — আর MnO₂ অপরিবর্তিত অবস্থায় ফিরে আসে।',
  formula: '2H₂O₂ —MnO₂→ 2H₂O + O₂↑ · c(H₂O₂) = 2·n(O₂) ÷ V',
  controls: [
    { key: 'cat', en: 'Catalyst', bn: 'প্রভাবক', default: 1, options: CAT.map((c, i) => opt(i, c.en, c.bn)) },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 300, step: 5, unit: 's', default: 0, play: { rate: 10 } },
    { key: 'test', en: 'Glowing splint at the outlet', bn: 'নির্গমপথে ধূমায়িত কাঠি', kind: 'view', default: 0, options: [opt(0, 'No', 'না'), opt(1, 'Yes', 'হ্যাঁ')] }
  ],
  tasks: timeTasks([15, 30, 60, 90, 120, 180, 240, 300], { cat: 1 }),
  columns: [
    { key: 'cat', en: 'Catalyst', bn: 'প্রভাবক' },
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'v', en: 'V(O₂)', bn: 'V(O₂)', unit: 'mL', digits: 1 }
  ],
  minReadings: 6,
  graph: { x: 't', y: 'v', kind: 'line' },
  compute: (p, noise, ctx) => {
    const ci = clamp(Math.round(p.cat), 0, 2);
    const cat = CAT[ci];
    const t = clamp(p.t, 0, 300);
    const v = rise(O2_FINAL, cat.k, t);
    const done = v >= O2_FINAL * 0.99;
    const rate = O2_FINAL * cat.k * Math.exp(-cat.k * t);
    return {
      row: { ...tx('cat', cat.en, cat.bn), t: round(t, 0), v: round(Math.max(0, v + noise(0.3)), 1) },
      live: [
        { en: 'Oxygen collected', bn: 'সংগৃহীত অক্সিজেন', value: v, unit: 'mL', digits: 1, tone: done ? 'good' : 'info' },
        { en: 'Rate', bn: 'হার', value: rate * 60, unit: 'mL min⁻¹', digits: 1 },
        { en: 'MnO₂ after filtering', bn: 'ছাঁকার পর MnO₂', value: cat.mass, unit: 'g', digits: 2 },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: {
        funnel: 'bung',
        liquid: '#eef5fb',
        level: 0.3,
        solid: ci > 0 ? { kind: 'powder', color: '#3a3a3f', amount: 1 } : undefined,
        bubbles: t > 0 && !done ? clamp(rate / 2, 0.03, 1) : 0,
        collect: 'syringe',
        volume: v,
        max: 100,
        clock: t,
        test: p.test === 1 ? 'relight' : 'none',
        label: 'H₂O₂ 10 mL',
        curve: { pts: points(ctx.rows, 't', 'v'), cur: { x: t, y: v }, xMax: 300, yMin: 0, yMax: 70, xLabel: 't / s', yLabel: 'V / mL' }
      },
      status:
        ci === 0
          ? status('warn', 'Without a catalyst only a few tiny bubbles appear — the decomposition is extremely slow. Add MnO₂.', 'প্রভাবক ছাড়া কেবল কয়েকটি ছোট বুদবুদ — বিয়োজন অত্যন্ত ধীর। MnO₂ দাও।')
          : t === 0
            ? status('info', 'MnO₂ tipped in — press ▶ to start the stopwatch.', 'MnO₂ দেওয়া হয়েছে — ▶ চেপে স্টপওয়াচ চালু করো।')
            : done
              ? status('good', `Decomposition complete: the volume is steady.${p.test === 1 ? ' The glowing splint relights — oxygen!' : ''}`, `বিয়োজন সম্পূর্ণ: আয়তন স্থির।${p.test === 1 ? ' ধূমায়িত কাঠি জ্বলে উঠল — অক্সিজেন!' : ''}`)
              : status('info', `Rapid fizzing — oxygen fills the syringe.${p.test === 1 ? ' The glowing splint relights!' : ''}`, `দ্রুত বুদবুদ — অক্সিজেন সিরিঞ্জ ভরছে।${p.test === 1 ? ' ধূমায়িত কাঠি জ্বলে উঠল!' : ''}`),
      ready: true
    };
  },
  result: {
    en: 'Concentration of the hydrogen peroxide',
    bn: 'হাইড্রোজেন পারক্সাইডের ঘনমাত্রা',
    unit: 'mol L⁻¹',
    digits: 3,
    compute: (rows) => {
      const v = maxOf(rows, 'v');
      return v === null ? null : (2 * (v / MOLAR_VOLUME_ML)) / (H2O2_VOL / 1000);
    },
    expected: H2O2_CONC
  },
  solve: (p) => (p.cat === 0 ? { ...p, cat: 1 } : p)
};

/* ------------------------------------------------------------------ */
/* Sodium (and Li, K) with water — relative atomic mass from H₂          */
/* ------------------------------------------------------------------ */

const ALKALI = [
  { sym: 'Li', en: 'Lithium', bn: 'লিথিয়াম', ar: 6.94, base: 60 },
  { sym: 'Na', en: 'Sodium', bn: 'সোডিয়াম', ar: 22.99, base: 18 },
  { sym: 'K', en: 'Potassium', bn: 'পটাশিয়াম', ar: 39.1, base: 6 }
];
const reactTime = (metal: number, m: number) => ALKALI[metal].base * Math.pow(m / 0.06, 2 / 3);

const sodiumWater: ChemPracticalModel = {
  slug: 'sodium-water',
  scene: 'trough',
  howTo_en:
    'A weighed piece of alkali metal in a wire-gauze cage is pushed under an inverted measuring cylinder full of water. Run the stopwatch until the metal has gone, record the hydrogen volume, and repeat for the suggested pieces. 2M + 2H₂O → 2MOH + H₂, so Ar = m × 12 000 ÷ V.',
  howTo_bn:
    'তারজালির খাঁচায় রাখা ওজন করা এক টুকরো ক্ষার ধাতু পানিভর্তি উল্টানো মাপনী সিলিন্ডারের নিচে ধরা হয়। ধাতু শেষ না হওয়া পর্যন্ত স্টপওয়াচ চালাও, হাইড্রোজেনের আয়তন রেকর্ড করো এবং প্রস্তাবিত টুকরোগুলোর জন্য পুনরাবৃত্তি করো। 2M + 2H₂O → 2MOH + H₂, তাই Ar = m × 12 000 ÷ V।',
  formula: '2Na + 2H₂O → 2NaOH + H₂↑ · Ar = m × 12 000 ÷ V(H₂ in mL)',
  controls: [
    { key: 'metal', en: 'Metal', bn: 'ধাতু', default: 1, options: ALKALI.map((a, i) => opt(i, a.en, a.bn)) },
    { key: 'mass', en: 'Piece', bn: 'টুকরো', min: 0.02, max: 0.12, step: 0.02, unit: 'g', default: 0.04, digits: 2 },
    { key: 'ind', en: 'Phenolphthalein in the water', bn: 'পানিতে ফেনফথ্যালিন', kind: 'view', default: 1, options: [opt(0, 'No', 'না'), opt(1, 'Yes', 'হ্যাঁ')] },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 120, step: 1, unit: 's', default: 0, play: { rate: 3 } }
  ],
  tasks: [
    { en: 'Na 0.04 g', bn: 'Na 0.04 g', set: { metal: 1, mass: 0.04 } },
    { en: 'Na 0.08 g', bn: 'Na 0.08 g', set: { metal: 1, mass: 0.08 } },
    { en: 'Na 0.12 g', bn: 'Na 0.12 g', set: { metal: 1, mass: 0.12 } },
    { en: 'Li 0.04 g', bn: 'Li 0.04 g', set: { metal: 0, mass: 0.04 } },
    { en: 'K 0.08 g', bn: 'K 0.08 g', set: { metal: 2, mass: 0.08 } }
  ],
  columns: [
    { key: 'metal', en: 'Metal', bn: 'ধাতু' },
    { key: 'm', en: 'Mass', bn: 'ভর', unit: 'g', digits: 2 },
    { key: 'time', en: 'Time to react', bn: 'বিক্রিয়ার সময়', unit: 's', digits: 0 },
    { key: 'v', en: 'V(H₂)', bn: 'V(H₂)', unit: 'mL', digits: 1 },
    { key: 'ar', en: 'Ar (calc.)', bn: 'Ar (হিসাব)', digits: 1 }
  ],
  minReadings: 5,
  compute: (p, noise) => {
    const metal = clamp(Math.round(p.metal), 0, 2);
    const a = ALKALI[metal];
    const m = clamp(p.mass, 0.02, 0.12);
    const tr = reactTime(metal, m);
    const t = clamp(p.t, 0, 120);
    const f = clamp(t / tr, 0, 1);
    const vf = (m / a.ar) * 12000;
    const v = vf * (1 - Math.pow(1 - f, 1.6));
    const done = f >= 1;
    const vRead = Math.max(0.1, v + noise(0.4));
    return {
      row: { ...tx('metal', a.sym, a.sym), m: round(m, 2), time: round(tr, 0), v: round(vRead, 1), ar: round((m * 12000) / vRead, 1), __metal: metal },
      live: [
        { en: 'Hydrogen collected', bn: 'সংগৃহীত হাইড্রোজেন', value: v, unit: 'mL', digits: 1, tone: done ? 'good' : 'info' },
        { en: 'Metal left', bn: 'অবশিষ্ট ধাতু', value: m * (1 - f), unit: 'g', digits: 3 },
        { en: 'Water', bn: 'পানি', value: p.ind === 1 ? (t > 0 ? 'turning pink (alkali)' : 'colourless') : 'no indicator', valueBn: p.ind === 1 ? (t > 0 ? 'গোলাপি হচ্ছে (ক্ষার)' : 'বর্ণহীন') : 'নির্দেশক নেই' },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: { metal, progress: f, size: m / 0.12, pink: p.ind === 1 ? clamp(f * 1.2, 0, 1) : 0, volume: v, max: 250, clock: t, running: t > 0 && !done },
      status:
        t === 0
          ? status('info', `Push the caged ${a.en.toLowerCase()} under the cylinder and press ▶.`, `খাঁচাবন্দি ${a.bn} সিলিন্ডারের নিচে ধরে ▶ চাপো।`)
          : !done
            ? metal === 0
              ? status('info', 'Lithium fizzes steadily but does not melt.', 'লিথিয়াম স্থিরভাবে বুদবুদ ছাড়ে, তবে গলে না।')
              : metal === 1
                ? status('info', 'Sodium melts into a silvery ball and fizzes vigorously — the reaction is exothermic.', 'সোডিয়াম গলে রুপালি বলে পরিণত হয়ে তীব্রভাবে বুদবুদ ছাড়ে — বিক্রিয়াটি তাপোৎপাদী।')
                : status('warn', 'Potassium reacts violently — the hydrogen burns with a lilac flame at the surface!', 'পটাশিয়াম তীব্রভাবে বিক্রিয়া করে — হাইড্রোজেন পৃষ্ঠে বেগুনি শিখায় জ্বলে!')
            : status('good', 'The metal has gone: read the volume of hydrogen and record.', 'ধাতু শেষ: হাইড্রোজেনের আয়তন পড়ে রেকর্ড করো।'),
      ready: done
    };
  },
  result: {
    en: 'Relative atomic mass of sodium (from the Na rows)',
    bn: 'সোডিয়ামের আপেক্ষিক পারমাণবিক ভর (Na সারি থেকে)',
    unit: '',
    digits: 1,
    compute: (rows) => meanOf(rows.filter((r) => num(r, '__metal') === 1).map((r) => num(r, 'ar')).filter((v): v is number => v !== null)),
    expected: 22.99
  },
  solve: (p) => {
    const metal = clamp(Math.round(p.metal), 0, 2);
    return { ...p, t: Math.max(p.t, Math.min(120, Math.ceil(reactTime(metal, clamp(p.mass, 0.02, 0.12))))) };
  }
};

export const gasModels: ChemPracticalModel[] = [prepareHydrogen, prepareCo2, prepareChlorine, aluminiumAlkali, molarVolume, peroxide, sodiumWater];
