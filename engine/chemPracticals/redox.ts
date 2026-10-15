import type { ChemPracticalModel, ChemRow, TubesView, TubeView } from './types';
import { endPointStatus } from './acidBase';
import { CHOOSE, COLORLESS, bnNum, blendColors, clamp, concordantMean, latestBy, num, opt, optionText, round, scoreRows, status, tick, tx } from './helpers';

const markOf = (row: ChemRow | undefined): TubeView['mark'] => (row ? (num(row, '__correct') === 1 ? 'good' : 'bad') : undefined);
const idx = (v: number, n: number) => clamp(Math.round(v), 0, n - 1);
const identifyResult = (n: number, en: string, bn: string) => ({ en, bn, unit: '', score: true, compute: scoreRows, expected: n, absolute: true, tolerance: 0 });

/* ------------------------------------------------------------------ */
/* Redox titrations: KMnO₄ and K₂Cr₂O₇ against Fe²⁺                      */
/* ------------------------------------------------------------------ */

const FE_V = 20.0;
const FE_C = 0.1;
const OXIDANTS = [
  { name: 'KMnO₄', c: 0.02, n: 5, color: '#7a2fa8', label: 'KMnO₄ 0.0200 M' },
  { name: 'K₂Cr₂O₇', c: 0.1 / 6, n: 6, color: '#e8811f', label: 'K₂Cr₂O₇ 0.0167 M' }
];
const REDOX_INITIAL = [0, 0.3, 0.65];
const redoxVeq = (ox: number) => ((FE_V * FE_C) / (OXIDANTS[ox].n * OXIDANTS[ox].c));

const oxidisingAgents: ChemPracticalModel = {
  slug: 'oxidising-agents',
  scene: 'titration',
  variant: 'redox',
  howTo_en:
    '20.0 mL of 0.100 M Fe²⁺ (Mohr’s salt) is acidified with dilute H₂SO₄. Titrate with KMnO₄ (self-indicating: the first permanent pink) or with K₂Cr₂O₇ using diphenylamine indicator (green → violet-blue). Read the top of the meniscus for dark KMnO₄. Do two trials with each oxidant.',
  howTo_bn:
    '20.0 mL 0.100 M Fe²⁺ (মোর লবণ) লঘু H₂SO₄ দিয়ে অম্লীয় করা হয়েছে। KMnO₄ দিয়ে টাইট্রেশন করো (নিজেই নির্দেশক: প্রথম স্থায়ী গোলাপি) অথবা ডাইফিনাইলঅ্যামিন নির্দেশকসহ K₂Cr₂O₇ দিয়ে (সবুজ → বেগুনি-নীল)। গাঢ় KMnO₄-এর ক্ষেত্রে মেনিস্কাসের উপরের প্রান্ত পড়ো। প্রতিটি জারক দিয়ে দুটি করে ট্রায়াল করো।',
  formula: 'MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O · Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O',
  controls: [
    { key: 'ox', en: 'Oxidant in the burette', bn: 'বুরেটে জারক', default: 0, options: OXIDANTS.map((o, i) => opt(i, o.label, o.label)) },
    { key: 'acid', en: 'Dilute H₂SO₄ in the flask', bn: 'ফ্লাস্কে লঘু H₂SO₄', default: 1, options: [opt(1, 'Added', 'দেওয়া হয়েছে'), opt(0, 'Forgotten', 'দেওয়া হয়নি')] },
    { key: 'trial', en: 'Titration', bn: 'টাইট্রেশন', default: 1, options: [opt(1, 'Trial 1', 'ট্রায়াল ১'), opt(2, 'Trial 2', 'ট্রায়াল ২'), opt(3, 'Trial 3', 'ট্রায়াল ৩')] },
    { key: 'vol', en: 'Oxidant run in', bn: 'যোগ করা জারক', kind: 'time', min: 0, max: 30, step: 0.05, unit: 'mL', default: 0, fine: true, digits: 2 }
  ],
  tasks: [
    { en: 'KMnO₄ · 1', bn: 'KMnO₄ · ১', set: { ox: 0, acid: 1, trial: 1 } },
    { en: 'KMnO₄ · 2', bn: 'KMnO₄ · ২', set: { ox: 0, acid: 1, trial: 2 } },
    { en: 'K₂Cr₂O₇ · 1', bn: 'K₂Cr₂O₇ · ১', set: { ox: 1, acid: 1, trial: 1 } },
    { en: 'K₂Cr₂O₇ · 2', bn: 'K₂Cr₂O₇ · ২', set: { ox: 1, acid: 1, trial: 2 } }
  ],
  columns: [
    { key: 'ox', en: 'Oxidant', bn: 'জারক' },
    { key: 'trial', en: 'Trial', bn: 'ট্রায়াল' },
    { key: 'initial', en: 'Initial', bn: 'প্রাথমিক', unit: 'mL', digits: 2 },
    { key: 'final', en: 'Final', bn: 'চূড়ান্ত', unit: 'mL', digits: 2 },
    { key: 'titre', en: 'Titre', bn: 'টাইটার', unit: 'mL', digits: 2 },
    { key: 'conc', en: '[Fe²⁺]', bn: '[Fe²⁺]', unit: 'M', digits: 4 }
  ],
  minReadings: 4,
  compute: (p, noise) => {
    const ox = p.ox === 1 ? 1 : 0;
    const o = OXIDANTS[ox];
    const acid = p.acid !== 0;
    const trial = clamp(Math.round(p.trial), 1, 3);
    const vol = clamp(p.vol, 0, 30);
    const veq = redoxVeq(ox);
    const progress = clamp(vol / veq, 0, 1);
    const stage = endPointStatus(vol - veq);
    const initial = REDOX_INITIAL[trial - 1];
    let color: string;
    let name: { en: string; bn: string };
    let cloud = 0;
    if (!acid && vol > 0 && ox === 0) {
      color = blendColors('#efe7d6', '#8a5a2b', clamp(vol / 4, 0.2, 0.8));
      cloud = clamp(vol / 6, 0.2, 0.8);
      name = { en: 'brown MnO₂ forms', bn: 'বাদামি MnO₂ তৈরি হয়' };
    } else if (ox === 0) {
      color =
        stage === 'end' ? '#f2c4e2' : stage === 'over' ? blendColors('#e7a6d8', '#8f3fb8', clamp((vol - veq) / 1.5, 0, 1)) : blendColors('#f0f5e6', '#f3ebc6', progress);
      name = stage === 'end' ? { en: 'first permanent pale pink', bn: 'প্রথম স্থায়ী হালকা গোলাপি' } : stage === 'over' ? { en: 'purple', bn: 'বেগুনি' } : { en: 'pale yellow (Fe³⁺)', bn: 'হালকা হলুদ (Fe³⁺)' };
    } else {
      color =
        !acid && vol > 0
          ? blendColors('#f0f5e6', '#d7a05a', clamp(vol / 20, 0, 0.6))
          : stage === 'end'
            ? '#6a4fc0'
            : stage === 'over'
              ? blendColors('#5a44b0', '#3a2780', clamp((vol - veq) / 1.5, 0, 1))
              : blendColors('#eef4ea', '#6aa874', progress * 0.75);
      name = !acid && vol > 0 ? { en: 'muddy — no sharp change', bn: 'ঘোলাটে — স্পষ্ট পরিবর্তন নেই' } : stage === 'end' ? { en: 'violet-blue', bn: 'বেগুনি-নীল' } : stage === 'over' ? { en: 'deep violet', bn: 'গাঢ় বেগুনি' } : { en: 'green (Cr³⁺)', bn: 'সবুজ (Cr³⁺)' };
    }
    const titre = round(vol + noise(0.03), 2);
    const conc = (o.n * o.c * titre) / FE_V;
    const valid = acid && stage === 'end';
    return {
      row: { ...tx('ox', o.name, o.name), trial, initial: round(initial, 2), final: round(initial + titre, 2), titre, conc: round(conc, 4) },
      live: [
        { en: 'Burette reading', bn: 'বুরেট পাঠ', value: initial + vol, unit: 'mL', digits: 2 },
        { en: 'Titre so far', bn: 'এখন পর্যন্ত টাইটার', value: vol, unit: 'mL', digits: 2 },
        { en: 'Flask colour', bn: 'ফ্লাস্কের রং', value: name.en, valueBn: name.bn, tone: valid ? 'good' : stage === 'over' || (!acid && vol > 0) ? 'bad' : undefined },
        { en: 'Fe²⁺ left', bn: 'অবশিষ্ট Fe²⁺', value: (1 - progress) * FE_V * FE_C, unit: 'mmol', digits: 2 }
      ],
      view: {
        vessel: 'conical',
        liquid: color,
        cloud,
        level: (FE_V + 10 + vol) / 110,
        burette: { reading: initial + vol, max: 50, color: o.color, label: o.label, dark: ox === 0 },
        tile: true,
        flash: acid && stage === 'near' ? (ox === 0 ? '#e7a6d8' : '#7a64c8') : undefined,
        flaskLabel: 'Fe²⁺ 20.0 mL + H₂SO₄',
        endpoint: valid
      },
      status: !acid
        ? vol > 0
          ? status('bad', ox === 0 ? 'Brown MnO₂ is forming: without acid, MnO₄⁻ is only reduced to MnO₂. Add dilute H₂SO₄ and start again.' : 'Without acid dichromate cannot oxidise Fe²⁺ properly — no sharp end point. Add dilute H₂SO₄.', ox === 0 ? 'বাদামি MnO₂ তৈরি হচ্ছে: অ্যাসিড ছাড়া MnO₄⁻ কেবল MnO₂-তে বিজারিত হয়। লঘু H₂SO₄ দিয়ে আবার শুরু করো।' : 'অ্যাসিড ছাড়া ডাইক্রোমেট Fe²⁺-কে ঠিকমতো জারিত করতে পারে না — স্পষ্ট শেষ বিন্দু নেই। লঘু H₂SO₄ দাও।')
          : status('warn', 'The flask has no acid: redox titrations with MnO₄⁻ / Cr₂O₇²⁻ need H⁺ ions.', 'ফ্লাস্কে অ্যাসিড নেই: MnO₄⁻ / Cr₂O₇²⁻ দিয়ে রেডক্স টাইট্রেশনে H⁺ আয়ন লাগে।')
        : stage === 'far'
          ? status('info', ox === 0 ? 'Each drop of purple KMnO₄ is decolourised at once — keep swirling.' : 'The solution turns greener as Cr³⁺ forms — keep adding.', ox === 0 ? 'বেগুনি KMnO₄-এর প্রতিটি ফোঁটা সাথে সাথে বর্ণহীন হচ্ছে — ঝাঁকাতে থাকো।' : 'Cr³⁺ তৈরি হওয়ায় দ্রবণ আরও সবুজ হচ্ছে — যোগ করতে থাকো।')
          : stage === 'near'
            ? status('warn', 'Colour lingers a little longer — the end point is close. Add dropwise (±).', 'রং একটু বেশি সময় থাকছে — শেষ বিন্দু কাছে। ফোঁটায় ফোঁটায় দাও (±)।')
            : stage === 'end'
              ? status('good', ox === 0 ? 'First permanent pale pink — end point! Record (top of meniscus).' : 'Sharp change to violet-blue — end point! Record.', ox === 0 ? 'প্রথম স্থায়ী হালকা গোলাপি — শেষ বিন্দু! রেকর্ড করো (মেনিস্কাসের উপরের প্রান্ত)।' : 'হঠাৎ বেগুনি-নীল — শেষ বিন্দু! রেকর্ড করো।')
              : status('bad', 'Overshot — the colour is far too deep. Go back to the first permanent colour.', 'পেরিয়ে গেছ — রং অনেক গাঢ়। প্রথম স্থায়ী রঙে ফিরে যাও।'),
      ready: valid
    };
  },
  result: {
    en: 'Concentration of Fe²⁺ in the Mohr’s salt solution',
    bn: 'মোর লবণ দ্রবণে Fe²⁺-এর ঘনমাত্রা',
    unit: 'mol L⁻¹',
    digits: 4,
    compute: (rows) => concordantMean(rows.map((r) => num(r, 'conc')).filter((v): v is number => v !== null), 0.0006),
    expected: FE_C
  },
  solve: (p) => {
    const ox = p.ox === 1 ? 1 : 0;
    return { ...p, acid: 1, vol: Math.round((redoxVeq(ox) + 0.05) / 0.05) * 0.05 };
  }
};

/* ------------------------------------------------------------------ */
/* Iodine liberation and iodometric titration                            */
/* ------------------------------------------------------------------ */

const IOD_V = 20.0;
const IOD_FE = 0.05;
const THIO = 0.1;
const IOD_VEQ = (IOD_V * IOD_FE) / THIO; // 10.00 mL
const IOD_INITIAL = [0, 0.4, 0.85];

const iodineLiberation: ChemPracticalModel = {
  slug: 'iodine-liberation',
  scene: 'titration',
  variant: 'iodometry',
  howTo_en:
    'Fe³⁺ oxidises excess KI to brown iodine. Titrate the liberated iodine with 0.100 M sodium thiosulfate: the brown fades to straw-yellow — then add starch (blue-black) and continue dropwise until the blue just disappears. Repeat for three trials to find [Fe³⁺].',
  howTo_bn:
    'Fe³⁺ অতিরিক্ত KI-কে জারিত করে বাদামি আয়োডিন মুক্ত করে। মুক্ত আয়োডিনকে 0.100 M সোডিয়াম থায়োসালফেট দিয়ে টাইট্রেশন করো: বাদামি রং ফিকে খড়-হলুদ হলে স্টার্চ দাও (নীল-কালো), তারপর ফোঁটায় ফোঁটায় দাও যতক্ষণ না নীল রং ঠিক মিলিয়ে যায়। [Fe³⁺] বের করতে তিনটি ট্রায়াল করো।',
  formula: '2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂ · I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻',
  controls: [
    { key: 'trial', en: 'Titration', bn: 'টাইট্রেশন', default: 1, options: [opt(1, 'Trial 1', 'ট্রায়াল ১'), opt(2, 'Trial 2', 'ট্রায়াল ২'), opt(3, 'Trial 3', 'ট্রায়াল ৩')] },
    { key: 'starch', en: 'Starch indicator', bn: 'স্টার্চ নির্দেশক', kind: 'view', default: 0, options: [opt(0, 'Not yet', 'এখনও না'), opt(1, 'Added', 'দেওয়া হয়েছে')] },
    { key: 'vol', en: 'Thiosulfate run in', bn: 'যোগ করা থায়োসালফেট', kind: 'time', min: 0, max: 20, step: 0.05, unit: 'mL', default: 0, fine: true, digits: 2 }
  ],
  tasks: [1, 2, 3].map((k) => ({ en: `Trial ${k}`, bn: `ট্রায়াল ${bnNum(k)}`, set: { trial: k } })),
  columns: [
    { key: 'trial', en: 'Trial', bn: 'ট্রায়াল' },
    { key: 'initial', en: 'Initial', bn: 'প্রাথমিক', unit: 'mL', digits: 2 },
    { key: 'final', en: 'Final', bn: 'চূড়ান্ত', unit: 'mL', digits: 2 },
    { key: 'titre', en: 'Titre', bn: 'টাইটার', unit: 'mL', digits: 2 }
  ],
  minReadings: 3,
  compute: (p, noise) => {
    const trial = clamp(Math.round(p.trial), 1, 3);
    const vol = clamp(p.vol, 0, 20);
    const starch = p.starch === 1;
    const f = clamp(1 - vol / IOD_VEQ, 0, 1);
    const excess = vol - IOD_VEQ;
    const stage = excess < -1 ? 'far' : excess < -1e-9 ? 'near' : excess <= 0.1 + 1e-9 ? 'end' : 'over';
    const color = starch ? (f > 0 ? blendColors('#c9d3ff', '#1b2466', clamp(f * 8, 0, 1)) : '#eef3e6') : blendColors('#eef3e6', '#8a4b12', Math.pow(f, 0.6));
    const name = starch
      ? f > 0
        ? { en: 'blue-black', bn: 'নীল-কালো' }
        : { en: 'colourless', bn: 'বর্ণহীন' }
      : f > 0.45
        ? { en: 'brown', bn: 'বাদামি' }
        : f > 0
          ? { en: 'straw yellow', bn: 'খড়-হলুদ' }
          : { en: 'colourless', bn: 'বর্ণহীন' };
    const initial = IOD_INITIAL[trial - 1];
    const titre = round(vol + noise(0.03), 2);
    const early = starch && vol < IOD_VEQ * 0.5;
    return {
      row: { trial, initial: round(initial, 2), final: round(initial + titre, 2), titre },
      live: [
        { en: 'Burette reading', bn: 'বুরেট পাঠ', value: initial + vol, unit: 'mL', digits: 2 },
        { en: 'Titre so far', bn: 'এখন পর্যন্ত টাইটার', value: vol, unit: 'mL', digits: 2 },
        { en: 'Flask colour', bn: 'ফ্লাস্কের রং', value: name.en, valueBn: name.bn, tone: stage === 'end' && starch ? 'good' : undefined },
        { en: 'Iodine left', bn: 'অবশিষ্ট আয়োডিন', value: f * IOD_VEQ * THIO * 0.5, unit: 'mmol', digits: 3 }
      ],
      view: {
        vessel: 'conical',
        liquid: color,
        level: (IOD_V + 10 + vol) / 110,
        burette: { reading: initial + vol, max: 50, color: COLORLESS, label: 'Na₂S₂O₃ 0.100 M' },
        tile: true,
        flaskLabel: 'Fe³⁺ + KI → I₂',
        starch,
        endpoint: stage === 'end' && starch
      },
      status:
        stage === 'far'
          ? early
            ? status('warn', 'Starch added too early can trap iodine and blur the end point — add it when the colour is pale yellow.', 'স্টার্চ খুব আগে দিলে আয়োডিন আটকে শেষ বিন্দু অস্পষ্ট হয় — রং হালকা হলুদ হলে দাও।')
            : status('info', 'Brown iodine fades as thiosulfate runs in. Keep swirling.', 'থায়োসালফেট যোগ করতেই বাদামি আয়োডিন ফিকে হচ্ছে। ঝাঁকাতে থাকো।')
          : stage === 'near'
            ? starch
              ? status('warn', 'Blue-black — add thiosulfate one drop at a time until the blue just disappears.', 'নীল-কালো — নীল রং ঠিক মিলিয়ে না যাওয়া পর্যন্ত এক ফোঁটা করে থায়োসালফেট দাও।')
              : status('warn', 'Straw yellow — the end point is near. Add starch now for a sharp colour change.', 'খড়-হলুদ — শেষ বিন্দু কাছে। স্পষ্ট রং বদলের জন্য এখনই স্টার্চ দাও।')
            : stage === 'end'
              ? starch
                ? status('good', 'The blue colour has just disappeared — end point! Record the reading.', 'নীল রং এইমাত্র মিলিয়ে গেল — শেষ বিন্দু! পাঠ রেকর্ড করো।')
                : status('warn', 'Colourless — but without starch you cannot be sure where the end point was. Add starch.', 'বর্ণহীন — কিন্তু স্টার্চ ছাড়া শেষ বিন্দু কোথায় ছিল নিশ্চিত হওয়া যায় না। স্টার্চ দাও।')
              : status('bad', 'Colourless for a while — you have run in more than needed. Go back to where the blue first vanished.', 'কিছুক্ষণ ধরে বর্ণহীন — প্রয়োজনের চেয়ে বেশি দিয়ে ফেলেছ। যেখানে নীল প্রথম মিলিয়েছিল সেখানে ফিরে যাও।'),
      ready: stage === 'end' && starch
    };
  },
  result: {
    en: 'Concentration of Fe³⁺',
    bn: 'Fe³⁺-এর ঘনমাত্রা',
    unit: 'mol L⁻¹',
    digits: 4,
    compute: (rows) => {
      const v = concordantMean(rows.map((r) => num(r, 'titre')).filter((x): x is number => x !== null), 0.1);
      return v === null ? null : (THIO * v) / IOD_V;
    },
    expected: IOD_FE
  },
  solve: (p) => ({ ...p, starch: 1, vol: IOD_VEQ + 0.05 })
};

/* ------------------------------------------------------------------ */
/* Copper and zinc with nitric acid                                      */
/* ------------------------------------------------------------------ */

const NITRIC = [
  { metal: 0, acid: 0, gas: 0, tube: '#b4622a', tubeAmt: 0.85, mouth: 0.6, sol: '#3f9f74', solEn: 'green, turning blue', solBn: 'সবুজ, পরে নীল' },
  { metal: 0, acid: 1, gas: 1, tube: '#e8eef2', tubeAmt: 0.25, mouth: 0.55, sol: '#3f8fd0', solEn: 'blue', solBn: 'নীল' },
  { metal: 1, acid: 0, gas: 0, tube: '#b4622a', tubeAmt: 0.8, mouth: 0.6, sol: '#eef4f9', solEn: 'colourless', solBn: 'বর্ণহীন' },
  { metal: 1, acid: 1, gas: 1, tube: '#e8eef2', tubeAmt: 0.2, mouth: 0.5, sol: '#eef4f9', solEn: 'colourless', solBn: 'বর্ণহীন' }
];
const NITRIC_METALS = [opt(0, 'Copper', 'কপার'), opt(1, 'Zinc', 'জিঙ্ক')];
const NITRIC_ACIDS = [opt(0, 'Concentrated', 'গাঢ়'), opt(1, 'Dilute (≈ 4 M)', 'লঘু (≈ 4 M)')];
const NITRIC_CHOICES = [CHOOSE, opt(0, 'NO₂ (brown)', 'NO₂ (বাদামি)'), opt(1, 'NO (colourless, browns in air)', 'NO (বর্ণহীন, বাতাসে বাদামি)'), opt(2, 'H₂', 'H₂')];

const copperNitric: ChemPracticalModel = {
  slug: 'copper-nitric-acid',
  scene: 'tubes',
  variant: 'nitric',
  howTo_en:
    'In the fume cupboard, add copper or zinc to concentrated or dilute nitric acid and run the stopwatch. Look at the gas inside the tube and at the mouth, and at the solution colour. Nitric acid is an oxidising acid — decide which gas is evolved in each case.',
  howTo_bn:
    'ফিউম কাপবোর্ডে কপার বা জিঙ্ক গাঢ় অথবা লঘু নাইট্রিক অ্যাসিডে দাও এবং স্টপওয়াচ চালাও। নলের ভেতরের ও মুখের গ্যাস এবং দ্রবণের রং লক্ষ করো। নাইট্রিক অ্যাসিড জারক অ্যাসিড — প্রতিটি ক্ষেত্রে কোন গ্যাস বের হয় তা ঠিক করো।',
  formula: 'Cu + 4HNO₃(conc) → Cu(NO₃)₂ + 2NO₂ + 2H₂O · 3Cu + 8HNO₃(dil) → 3Cu(NO₃)₂ + 2NO + 4H₂O',
  controls: [
    { key: 'metal', en: 'Metal', bn: 'ধাতু', default: 0, options: NITRIC_METALS },
    { key: 'acid', en: 'Nitric acid', bn: 'নাইট্রিক অ্যাসিড', default: 0, options: NITRIC_ACIDS },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 60, step: 1, unit: 's', default: 0, play: { rate: 4 } },
    { key: 'gas', en: 'Your conclusion: the gas is…', bn: 'তোমার সিদ্ধান্ত: গ্যাসটি…', kind: 'inference', default: -1, options: NITRIC_CHOICES }
  ],
  tasks: NITRIC.map((c) => ({ en: `${c.metal ? 'Zn' : 'Cu'} · ${c.acid ? 'dil.' : 'conc.'}`, bn: `${c.metal ? 'Zn' : 'Cu'} · ${c.acid ? 'লঘু' : 'গাঢ়'}`, set: { metal: c.metal, acid: c.acid, t: 20 } })),
  columns: [
    { key: 'combo', en: 'Metal + acid', bn: 'ধাতু + অ্যাসিড' },
    { key: 'inside', en: 'Gas in the tube', bn: 'নলের ভেতরের গ্যাস' },
    { key: 'mouth', en: 'At the mouth', bn: 'মুখে' },
    { key: 'solution', en: 'Solution', bn: 'দ্রবণ' },
    { key: 'gas', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  compute: (p, _noise, ctx) => {
    const metal = p.metal === 1 ? 1 : 0;
    const acid = p.acid === 1 ? 1 : 0;
    const ci = metal * 2 + acid;
    const c = NITRIC[ci];
    const t = clamp(p.t, 0, 60);
    const prog = clamp(t / 15, 0, 1);
    const chosen = p.gas >= 0;
    const correct = chosen && p.gas === c.gas;
    const verdict = optionText(NITRIC_CHOICES, p.gas);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = NITRIC.map((n, i) => {
      const active = i === ci;
      const rec = latest.get(String(i));
      const pr = active ? prog : rec ? 1 : 0;
      return {
        label: `${n.metal ? 'Zn' : 'Cu'}`,
        sub: n.acid ? 'dil.' : 'conc.',
        subBn: n.acid ? 'লঘু' : 'গাঢ়',
        liquid: blendColors('#f6f1df', n.sol, pr * 0.9),
        level: 0.34,
        bubbles: active && t > 0 ? (n.acid ? 0.45 : 0.9) : 0,
        fumes: pr * n.tubeAmt,
        fumeColor: n.tube,
        mouth: { color: '#b4622a', amount: pr * n.mouth * (active ? 1 : 0.6) },
        solid: { kind: n.metal ? 'granules' : 'chips', color: n.metal ? '#b9c2cc' : '#c8763c', amount: 1 - pr * 0.4 },
        active,
        mark: markOf(rec)
      };
    });
    const insideText = c.gas === 0 ? { en: 'brown gas', bn: 'বাদামি গ্যাস' } : { en: 'colourless gas', bn: 'বর্ণহীন গ্যাস' };
    const mouthText = { en: 'brown fumes', bn: 'বাদামি ধোঁয়া' };
    const view: TubesView = { tubes, clock: { value: t, unit: 's' } };
    return {
      row: {
        ...tx('combo', `${metal ? 'Zn' : 'Cu'} + ${acid ? 'dilute' : 'conc.'} HNO₃`, `${metal ? 'Zn' : 'Cu'} + ${acid ? 'লঘু' : 'গাঢ়'} HNO₃`),
        ...tx('inside', insideText.en, insideText.bn),
        ...tx('mouth', mouthText.en, mouthText.bn),
        ...tx('solution', c.solEn, c.solBn),
        ...tx('gas', verdict.en, verdict.bn),
        check: tick(correct),
        __key: ci,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Gas in the tube', bn: 'নলের ভেতরের গ্যাস', value: t > 3 ? insideText.en : '—', valueBn: t > 3 ? insideText.bn : '—', tone: 'info' },
        { en: 'At the mouth', bn: 'মুখে', value: t > 3 ? mouthText.en : '—', valueBn: t > 3 ? mouthText.bn : '—' },
        { en: 'Solution', bn: 'দ্রবণ', value: t > 3 ? c.solEn : '—', valueBn: t > 3 ? c.solBn : '—' },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        t < 10
          ? status('info', t === 0 ? 'Metal added — press ▶ and watch for at least 10 s.' : 'Reaction starting… keep watching the gas.', t === 0 ? 'ধাতু দেওয়া হয়েছে — ▶ চাপো এবং অন্তত ১০ সেকেন্ড লক্ষ করো।' : 'বিক্রিয়া শুরু হচ্ছে… গ্যাসটি লক্ষ করতে থাকো।')
          : chosen
            ? status('info', `Your conclusion: ${verdict.en} — record it.`, `তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', c.gas === 0 ? 'Dense brown gas fills the tube. Which gas is it?' : 'The gas in the tube is colourless but turns brown where it meets air at the mouth. Which gas?', c.gas === 0 ? 'ঘন বাদামি গ্যাসে নল ভরে যাচ্ছে। এটি কোন গ্যাস?' : 'নলের ভেতরে গ্যাস বর্ণহীন, কিন্তু মুখে বাতাসের সংস্পর্শে বাদামি হয়ে যায়। কোন গ্যাস?'),
      ready: t >= 10 && chosen,
      correct
    };
  },
  result: identifyResult(4, 'Gases identified correctly', 'সঠিকভাবে শনাক্ত গ্যাস'),
  solve: (p) => {
    const ci = (p.metal === 1 ? 2 : 0) + (p.acid === 1 ? 1 : 0);
    return { ...p, t: Math.max(p.t, 20), gas: NITRIC[ci].gas };
  }
};

/* ------------------------------------------------------------------ */
/* Oxidation of alcohols                                                 */
/* ------------------------------------------------------------------ */

const ALCOHOLS = [
  { en: 'Ethanol (1°)', bn: 'ইথানল (১°)', short: 'Ethanol', shortBn: 'ইথানল', kWarm: 0.04, productEn: 'ethanoic acid (vinegar smell)', productBn: 'ইথানোইক অ্যাসিড (ভিনেগারের গন্ধ)' },
  { en: 'Propan-2-ol (2°)', bn: 'প্রোপান-২-অল (২°)', short: 'Propan-2-ol', shortBn: 'প্রোপান-২-অল', kWarm: 0.03, productEn: 'propanone', productBn: 'প্রোপানোন' },
  { en: '2-Methylpropan-2-ol (3°)', bn: '২-মিথাইলপ্রোপান-২-অল (৩°)', short: '3° alcohol', shortBn: '৩° অ্যালকোহল', kWarm: 0, productEn: 'no reaction', productBn: 'বিক্রিয়া নেই' },
  { en: 'Water (blank)', bn: 'পানি (ব্ল্যাংক)', short: 'Water', shortBn: 'পানি', kWarm: 0, productEn: 'no reaction', productBn: 'বিক্রিয়া নেই' }
];
const OX_COLOURS = [
  { from: '#e8811f', to: '#3f8f5a', en: 'orange → green', bn: 'কমলা → সবুজ', fromEn: 'orange', fromBn: 'কমলা' },
  { from: '#7a2fa8', to: '#f2eef4', en: 'purple → colourless', bn: 'বেগুনি → বর্ণহীন', fromEn: 'purple', fromBn: 'বেগুনি' }
];
const OXIDISED_CHOICES = [CHOOSE, opt(0, 'Oxidised', 'জারিত হয়েছে'), opt(1, 'Not oxidised', 'জারিত হয়নি')];

const oxidationEthanol: ChemPracticalModel = {
  slug: 'oxidation-ethanol',
  scene: 'tubes',
  variant: 'alcohols',
  howTo_en:
    'Four tubes of acidified oxidant stand in a water bath: ethanol, propan-2-ol, 2-methylpropan-2-ol and a water blank. Warm them, run the stopwatch and watch the colours. Decide for each tube whether the alcohol was oxidised.',
  howTo_bn:
    'পানির গামলায় অম্লীয় জারকের চারটি নল: ইথানল, প্রোপান-২-অল, ২-মিথাইলপ্রোপান-২-অল আর পানি (ব্ল্যাংক)। গরম করো, স্টপওয়াচ চালাও এবং রং লক্ষ করো। প্রতিটি নলের জন্য ঠিক করো অ্যালকোহলটি জারিত হয়েছে কি না।',
  formula: 'CH₃CH₂OH + 2[O] → CH₃COOH + H₂O · Cr₂O₇²⁻ (orange) → Cr³⁺ (green)',
  controls: [
    { key: 'alcohol', en: 'Tube to record', bn: 'যে নল রেকর্ড করবে', kind: 'view', default: 0, options: ALCOHOLS.map((a, i) => opt(i, a.short, a.shortBn)) },
    { key: 'oxidant', en: 'Acidified oxidant', bn: 'অম্লীয় জারক', default: 0, options: [opt(0, 'K₂Cr₂O₇', 'K₂Cr₂O₇'), opt(1, 'KMnO₄', 'KMnO₄')] },
    { key: 'warm', en: 'Water bath', bn: 'পানির গামলা', default: 1, options: [opt(0, 'Room temperature', 'কক্ষ তাপমাত্রা'), opt(1, 'Warm (60 °C)', 'গরম (60 °C)')] },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 180, step: 5, unit: 's', default: 0, play: { rate: 8 } },
    { key: 'ox', en: 'Your conclusion: the alcohol is…', bn: 'তোমার সিদ্ধান্ত: অ্যালকোহলটি…', kind: 'inference', default: -1, options: OXIDISED_CHOICES }
  ],
  tasks: ALCOHOLS.map((a, i) => ({ en: a.short, bn: a.shortBn, set: { alcohol: i, oxidant: 0, warm: 1, t: 90 } })),
  columns: [
    { key: 'alcohol', en: 'Tube', bn: 'নল' },
    { key: 'change', en: 'Colour change', bn: 'রঙের পরিবর্তন' },
    { key: 'ox', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'product', en: 'Product', bn: 'উৎপাদ' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  compute: (p, _noise, ctx) => {
    const ai = idx(p.alcohol, ALCOHOLS.length);
    const oc = OX_COLOURS[p.oxidant === 1 ? 1 : 0];
    const warm = p.warm === 1;
    const t = clamp(p.t, 0, 180);
    const progress = (i: number) => {
      const k = ALCOHOLS[i].kWarm * (warm ? 1 : 0.2);
      return 1 - Math.exp(-k * t);
    };
    const f = progress(ai);
    const truth = ALCOHOLS[ai].kWarm > 0 ? 0 : 1;
    const chosen = p.ox >= 0;
    const correct = chosen && p.ox === truth;
    const verdict = optionText(OXIDISED_CHOICES, p.ox);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = ALCOHOLS.map((a, i) => ({
      label: a.short,
      labelBn: a.shortBn,
      liquid: blendColors(oc.from, oc.to, progress(i)),
      level: 0.4,
      warm,
      active: i === ai,
      mark: markOf(latest.get(String(i)))
    }));
    const changed = f > 0.25;
    const change = changed ? { en: oc.en, bn: oc.bn } : { en: `stays ${oc.fromEn}`, bn: `${oc.fromBn}ই থাকে` };
    const view: TubesView = { tubes, bath: warm ? { temp: 60 } : undefined, clock: { value: t, unit: 's' } };
    return {
      row: {
        ...tx('alcohol', ALCOHOLS[ai].en, ALCOHOLS[ai].bn),
        ...tx('change', change.en, change.bn),
        ...tx('ox', verdict.en, verdict.bn),
        ...tx('product', ALCOHOLS[ai].productEn, ALCOHOLS[ai].productBn),
        check: tick(correct),
        __key: ai,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Colour', bn: 'রং', value: change.en, valueBn: change.bn, tone: 'info' },
        { en: 'Oxidant reduced', bn: 'বিজারিত জারক', value: f * 100, unit: '%', digits: 0 },
        { en: 'Bath', bn: 'গামলা', value: warm ? 60 : 25, unit: '°C' },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        t < 60
          ? status('info', t === 0 ? 'Press ▶ and watch all four tubes for at least a minute.' : 'Watching… give the tubes at least 60 s.', t === 0 ? '▶ চাপো এবং চারটি নলই অন্তত এক মিনিট লক্ষ করো।' : 'লক্ষ করছ… নলগুলোকে অন্তত ৬০ সেকেন্ড সময় দাও।')
          : chosen
            ? status('info', `Your conclusion: ${verdict.en.toLowerCase()} — record it.`, `তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `${ALCOHOLS[ai].en}: ${change.en}. Was it oxidised?${warm ? '' : ' (Warming speeds the reaction up.)'}`, `${ALCOHOLS[ai].bn}: ${change.bn}। এটি কি জারিত হয়েছে?${warm ? '' : ' (গরম করলে বিক্রিয়া দ্রুত হয়।)'}`),
      ready: t >= 60 && chosen,
      correct
    };
  },
  result: identifyResult(4, 'Tubes judged correctly', 'সঠিকভাবে বিচার করা নল'),
  solve: (p) => {
    const ai = idx(p.alcohol, ALCOHOLS.length);
    return { ...p, warm: 1, t: Math.max(p.t, 90), ox: ALCOHOLS[ai].kWarm > 0 ? 0 : 1 };
  }
};

/* ------------------------------------------------------------------ */
/* Metal displacement                                                    */
/* ------------------------------------------------------------------ */

const DMETALS = [
  { sym: 'Mg', strip: '#d8dee6', deposit: '#c9ced6', salt: 'MgSO₄', sol: '#eef4f9', r: 4 },
  { sym: 'Zn', strip: '#b9c2cc', deposit: '#7f8792', salt: 'ZnSO₄', sol: '#eef4f9', r: 3 },
  { sym: 'Fe', strip: '#8b8f96', deposit: '#3f4349', salt: 'FeSO₄', sol: '#c9e6cf', r: 2 },
  { sym: 'Cu', strip: '#c8763c', deposit: '#a5502a', salt: 'CuSO₄', sol: '#3f88d8', r: 1 }
];
const DISPLACE_CHOICES = [CHOOSE, opt(0, 'Displacement happens', 'প্রতিস্থাপন ঘটে'), opt(1, 'No reaction', 'বিক্রিয়া নেই')];
const DISPLACE_TASKS: [number, number][] = [
  [1, 3],
  [2, 3],
  [3, 1],
  [1, 2],
  [2, 1],
  [0, 1]
];

function displacement(metal: number, salt: number, t: number) {
  const diff = DMETALS[metal].r - DMETALS[salt].r;
  const k = diff > 0 ? 0.004 * diff : 0;
  return { reacts: diff > 0, f: 1 - Math.exp(-k * t) };
}

function displacementTube(metal: number, salt: number, t: number, active: boolean, mark?: TubeView['mark']): TubeView {
  const { reacts, f } = displacement(metal, salt, t);
  const m = DMETALS[metal];
  const s = DMETALS[salt];
  return {
    label: m.sym,
    sub: s.salt,
    liquid: reacts ? blendColors(s.sol, m.sol, f * 0.9) : s.sol,
    level: 0.46,
    solid: { kind: 'strip', color: m.strip, coat: s.deposit, coatAmount: reacts ? f : 0 },
    ppt: reacts ? f * 0.05 : 0,
    pptColor: s.deposit,
    active,
    mark
  };
}

const metalDisplacement: ChemPracticalModel = {
  slug: 'metal-displacement',
  scene: 'tubes',
  variant: 'displacement',
  howTo_en:
    'Put a clean strip of metal into a salt solution of another metal and run the stopwatch for a few minutes. A coating of the other metal and a fading colour mean displacement. Test the suggested pairs, decide each time, and build the reactivity series Mg > Zn > Fe > Cu.',
  howTo_bn:
    'অন্য ধাতুর লবণের দ্রবণে একটি পরিষ্কার ধাতব পাত রাখো এবং কয়েক মিনিট স্টপওয়াচ চালাও। পাতে অন্য ধাতুর আস্তরণ ও দ্রবণের রং ফিকে হওয়া মানে প্রতিস্থাপন। প্রস্তাবিত জোড়াগুলো পরীক্ষা করো, প্রতিবার সিদ্ধান্ত নাও এবং সক্রিয়তা সিরিজ Mg > Zn > Fe > Cu গড়ে তোলো।',
  formula: 'Zn + CuSO₄ → ZnSO₄ + Cu · a more reactive metal displaces a less reactive one',
  controls: [
    { key: 'metal', en: 'Metal strip', bn: 'ধাতব পাত', default: 1, options: DMETALS.map((m, i) => opt(i, m.sym, m.sym)) },
    { key: 'salt', en: 'Salt solution', bn: 'লবণের দ্রবণ', default: 3, options: DMETALS.map((m, i) => opt(i, m.salt, m.salt)) },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 600, step: 20, unit: 's', default: 0, play: { rate: 30 } },
    { key: 'res', en: 'Your conclusion', bn: 'তোমার সিদ্ধান্ত', kind: 'inference', default: -1, options: DISPLACE_CHOICES }
  ],
  tasks: DISPLACE_TASKS.map(([m, s]) => ({ en: `${DMETALS[m].sym} | ${DMETALS[s].salt}`, bn: `${DMETALS[m].sym} | ${DMETALS[s].salt}`, set: { metal: m, salt: s } })),
  columns: [
    { key: 'pair', en: 'Metal | solution', bn: 'ধাতু | দ্রবণ' },
    { key: 'obs', en: 'Observation', bn: 'পর্যবেক্ষণ' },
    { key: 'res', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 6,
  compute: (p, _noise, ctx) => {
    const metal = idx(p.metal, 4);
    const salt = idx(p.salt, 4);
    const t = clamp(p.t, 0, 600);
    const { reacts, f } = displacement(metal, salt, t);
    const m = DMETALS[metal];
    const s = DMETALS[salt];
    const same = metal === salt;
    const truth = reacts ? 0 : 1;
    const chosen = p.res >= 0;
    const correct = chosen && p.res === truth;
    const verdict = optionText(DISPLACE_CHOICES, p.res);
    const latest = latestBy(ctx.rows, '__key');
    const key = metal * 4 + salt;
    const tubes: TubeView[] = DISPLACE_TASKS.map(([tm, ts]) => {
      const k = tm * 4 + ts;
      const active = k === key;
      const rec = latest.get(String(k));
      return displacementTube(tm, ts, active ? t : rec ? 600 : 0, active, markOf(rec));
    });
    if (!DISPLACE_TASKS.some(([tm, ts]) => tm === metal && ts === salt)) tubes.push(displacementTube(metal, salt, t, true, markOf(latest.get(String(key)))));
    const obs = reacts
      ? {
          en: `${m.sym} gets coated with ${s.sym === 'Cu' ? 'brown copper' : `grey ${s.sym}`}; ${s.salt === 'CuSO₄' ? 'blue colour fades' : s.salt === 'FeSO₄' ? 'pale green fades' : 'solution stays colourless'}`,
          bn: `${m.sym}-এর উপর ${s.sym === 'Cu' ? 'বাদামি কপারের' : `ধূসর ${s.sym}-এর`} আস্তরণ; ${s.salt === 'CuSO₄' ? 'নীল রং ফিকে হয়' : s.salt === 'FeSO₄' ? 'হালকা সবুজ রং ফিকে হয়' : 'দ্রবণ বর্ণহীনই থাকে'}`
        }
      : { en: 'no change on the strip or in the solution', bn: 'পাতে বা দ্রবণে কোনো পরিবর্তন নেই' };
    const view: TubesView = { tubes, clock: { value: t, unit: 's' } };
    return {
      row: {
        ...tx('pair', `${m.sym} | ${s.salt}`, `${m.sym} | ${s.salt}`),
        ...tx('obs', obs.en, obs.bn),
        ...tx('res', verdict.en, verdict.bn),
        check: tick(correct),
        __key: key,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Observation', bn: 'পর্যবেক্ষণ', value: t >= 60 ? obs.en : 'watching…', valueBn: t >= 60 ? obs.bn : 'লক্ষ করছ…', tone: 'info' },
        { en: 'Temperature rise', bn: 'তাপমাত্রা বৃদ্ধি', value: reacts ? 0.9 * f * (m.r - s.r) : 0, unit: '°C', digits: 1 },
        { en: 'Solution', bn: 'দ্রবণ', value: s.salt, valueBn: s.salt },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 }
      ],
      view: view as unknown as Record<string, unknown>,
      status: same
        ? status('warn', 'A metal in a solution of its own salt cannot displace anything — choose a different pair.', 'নিজের লবণের দ্রবণে কোনো ধাতু কিছু প্রতিস্থাপন করতে পারে না — অন্য জোড়া বেছে নাও।')
        : t < 120
          ? status('info', t === 0 ? 'Strip in the solution — press ▶ and watch for a couple of minutes.' : 'Watching the strip… give it at least 2 minutes.', t === 0 ? 'পাতটি দ্রবণে — ▶ চাপো এবং কয়েক মিনিট লক্ষ করো।' : 'পাতটি লক্ষ করছ… অন্তত ২ মিনিট সময় দাও।')
          : chosen
            ? status('info', `Your conclusion: ${verdict.en.toLowerCase()} — record it.`, `তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `${obs.en[0].toUpperCase()}${obs.en.slice(1)}. Did displacement happen?`, `${obs.bn}। প্রতিস্থাপন কি ঘটেছে?`),
      ready: !same && t >= 120 && chosen,
      correct
    };
  },
  result: identifyResult(6, 'Pairs judged correctly', 'সঠিকভাবে বিচার করা জোড়া'),
  solve: (p) => {
    let metal = idx(p.metal, 4);
    let salt = idx(p.salt, 4);
    if (metal === salt) [metal, salt] = [1, 3];
    return { ...p, metal, salt, t: Math.max(p.t, 200), res: displacement(metal, salt, 1).reacts ? 0 : 1 };
  }
};

/* ------------------------------------------------------------------ */
/* Reactivity of metals with acid (balloons)                             */
/* ------------------------------------------------------------------ */

const AMETALS = [
  { sym: 'Mg', en: 'Magnesium', bn: 'ম্যাগনেসিয়াম', vmax: (0.1 / 24.31) * 24000, k: 0.03, kind: 'ribbon' as const, color: '#d8dee6', truth: 0 },
  { sym: 'Zn', en: 'Zinc', bn: 'জিঙ্ক', vmax: (0.1 / 65.38) * 24000, k: 0.012, kind: 'granules' as const, color: '#b9c2cc', truth: 1 },
  { sym: 'Fe', en: 'Iron', bn: 'আয়রন', vmax: (0.1 / 55.85) * 24000, k: 0.002, kind: 'powder' as const, color: '#8b8f96', truth: 2 },
  { sym: 'Cu', en: 'Copper', bn: 'কপার', vmax: 0, k: 0, kind: 'chips' as const, color: '#c8763c', truth: 3 }
];
const RATE_CHOICES = [CHOOSE, opt(0, 'Vigorous', 'তীব্র'), opt(1, 'Moderate', 'মাঝারি'), opt(2, 'Slow', 'ধীর'), opt(3, 'No reaction', 'বিক্রিয়া নেই')];

const metalAcid: ChemPracticalModel = {
  slug: 'metal-acid-reactivity',
  scene: 'tubes',
  variant: 'metalAcid',
  howTo_en:
    '0.10 g each of magnesium, zinc, iron and copper drop into 1 M HCl at the same moment; a balloon on each tube catches the hydrogen. Run the stopwatch, compare the bubbling and the balloons after a minute and classify each reaction.',
  howTo_bn:
    'একই মুহূর্তে 0.10 g করে ম্যাগনেসিয়াম, জিঙ্ক, আয়রন ও কপার 1 M HCl-এ ফেলা হলো; প্রতিটি নলের বেলুনে হাইড্রোজেন জমা হয়। স্টপওয়াচ চালাও, এক মিনিট পর বুদবুদ ও বেলুন তুলনা করো এবং প্রতিটি বিক্রিয়ার শ্রেণি ঠিক করো।',
  formula: 'M + 2HCl → MCl₂ + H₂↑ · Mg > Zn > Fe > (H) > Cu',
  controls: [
    { key: 'metal', en: 'Tube to record', bn: 'যে নল রেকর্ড করবে', kind: 'view', default: 0, options: AMETALS.map((m, i) => opt(i, m.sym, m.sym)) },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 120, step: 2, unit: 's', default: 0, play: { rate: 4 } },
    { key: 'rate', en: 'Your conclusion: the reaction is…', bn: 'তোমার সিদ্ধান্ত: বিক্রিয়াটি…', kind: 'inference', default: -1, options: RATE_CHOICES }
  ],
  tasks: AMETALS.map((m, i) => ({ en: m.sym, bn: m.sym, set: { metal: i, t: 60 } })),
  columns: [
    { key: 'metal', en: 'Metal', bn: 'ধাতু' },
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'v', en: 'H₂ in balloon', bn: 'বেলুনে H₂', unit: 'mL', digits: 1 },
    { key: 'rate', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  compute: (p, noise, ctx) => {
    const mi = idx(p.metal, 4);
    const m = AMETALS[mi];
    const t = clamp(p.t, 0, 120);
    const vol = (i: number) => AMETALS[i].vmax * (1 - Math.exp(-AMETALS[i].k * t));
    const v = vol(mi);
    const chosen = p.rate >= 0;
    const correct = chosen && p.rate === m.truth;
    const verdict = optionText(RATE_CHOICES, p.rate);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = AMETALS.map((x, i) => ({
      label: x.sym,
      liquid: '#eaf3fb',
      level: 0.4,
      bubbles: t > 0 ? clamp(x.k * x.vmax * Math.exp(-x.k * t) / 2.5, 0, 1) : 0,
      solid: { kind: x.kind, color: x.color, amount: x.vmax ? 1 - vol(i) / x.vmax : 1 },
      balloon: clamp(vol(i) / 100, 0, 1),
      warm: i === 0 && t > 0 && t < 90,
      active: i === mi,
      mark: markOf(latest.get(String(i)))
    }));
    const view: TubesView = { tubes, clock: { value: t, unit: 's' } };
    return {
      row: { ...tx('metal', m.sym, m.sym), t: round(t, 0), v: round(Math.max(0, v + (v > 0 ? noise(0.3) : 0)), 1), ...tx('rate', verdict.en, verdict.bn), check: tick(correct), __key: mi, __correct: correct ? 1 : 0 },
      live: [
        { en: `${m.sym} balloon`, bn: `${m.sym} বেলুন`, value: v, unit: 'mL', digits: 1, tone: 'info' },
        { en: 'Average rate', bn: 'গড় হার', value: t > 0 ? (v / t) * 60 : 0, unit: 'mL min⁻¹', digits: 1 },
        { en: 'Stopwatch', bn: 'স্টপওয়াচ', value: t, unit: 's', digits: 0 },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—', valueBn: chosen ? verdict.bn : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        t < 30
          ? status('info', t === 0 ? 'Metals added together — press ▶ and compare the tubes.' : 'Compare the bubbling… wait at least 30 s.', t === 0 ? 'ধাতুগুলো একসাথে দেওয়া হয়েছে — ▶ চাপো এবং নলগুলো তুলনা করো।' : 'বুদবুদ তুলনা করো… অন্তত ৩০ সেকেন্ড অপেক্ষা করো।')
          : chosen
            ? status('info', `${m.en}: ${verdict.en.toLowerCase()} — record it.`, `${m.bn}: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `${m.en} has filled its balloon with ${v.toFixed(0)} mL of hydrogen. How would you describe the reaction?`, `${m.bn} বেলুনে ${v.toFixed(0)} mL হাইড্রোজেন জমিয়েছে। বিক্রিয়াটি কেমন বলবে?`),
      ready: t >= 30 && chosen,
      correct
    };
  },
  result: identifyResult(4, 'Reactions classified correctly', 'সঠিকভাবে শ্রেণিবদ্ধ বিক্রিয়া'),
  solve: (p) => ({ ...p, t: Math.max(p.t, 60), rate: AMETALS[idx(p.metal, 4)].truth })
};

/* ------------------------------------------------------------------ */
/* Conditions for rusting                                                */
/* ------------------------------------------------------------------ */

const RUST_TUBES = [
  { en: 'Water + air', bn: 'পানি + বায়ু', k: 0.35, rusts: true },
  { en: 'Boiled water + oil layer (no air)', bn: 'ফুটানো পানি + তেলের স্তর (বায়ু নেই)', k: 0, rusts: false },
  { en: 'Dry air (anhydrous CaCl₂)', bn: 'শুষ্ক বায়ু (অনার্দ্র CaCl₂)', k: 0, rusts: false },
  { en: 'Salt water + air', bn: 'লবণ পানি + বায়ু', k: 0.8, rusts: true },
  { en: 'Greased nail in water', bn: 'গ্রিজ মাখানো পেরেক পানিতে', k: 0, rusts: false }
];
const RUST_CHOICES = [CHOOSE, opt(0, 'Rusts', 'মরিচা ধরে'), opt(1, 'Does not rust', 'মরিচা ধরে না')];
const rustAmount = (i: number, day: number) => 1 - Math.exp(-RUST_TUBES[i].k * day);

const rusting: ChemPracticalModel = {
  slug: 'rusting-conditions',
  scene: 'tubes',
  variant: 'rusting',
  howTo_en:
    'Five iron nails are set up in different conditions. Press ▶ to let the days pass, inspect each tube and decide whether the nail rusts. Iron needs both water and oxygen to rust — salt speeds it up, oil or grease keeps them away.',
  howTo_bn:
    'পাঁচটি লোহার পেরেক ভিন্ন ভিন্ন অবস্থায় রাখা হয়েছে। ▶ চেপে দিন পার হতে দাও, প্রতিটি নল পরীক্ষা করো এবং ঠিক করো পেরেকে মরিচা ধরে কি না। মরিচা ধরতে লোহার পানি ও অক্সিজেন দুটোই লাগে — লবণ তা দ্রুত করে, তেল বা গ্রিজ এদের দূরে রাখে।',
  formula: '4Fe + 3O₂ + 2xH₂O → 2Fe₂O₃·xH₂O (rust)',
  controls: [
    { key: 'tube', en: 'Inspect tube', bn: 'যে নল দেখবে', kind: 'view', default: 0, options: RUST_TUBES.map((_, i) => opt(i, 'ABCDE'[i], 'ABCDE'[i])) },
    { key: 'day', en: 'Days passed', bn: 'কত দিন পার হলো', kind: 'time', min: 0, max: 7, step: 0.5, unit: 'days', default: 0, play: { rate: 0.5 } },
    { key: 'rust', en: 'Your conclusion: the nail…', bn: 'তোমার সিদ্ধান্ত: পেরেকটিতে…', kind: 'inference', default: -1, options: RUST_CHOICES }
  ],
  tasks: RUST_TUBES.map((_, i) => ({ en: `Tube ${'ABCDE'[i]}`, bn: `নল ${'ABCDE'[i]}`, set: { tube: i } })),
  columns: [
    { key: 'tube', en: 'Tube', bn: 'নল' },
    { key: 'cond', en: 'Conditions', bn: 'অবস্থা' },
    { key: 'day', en: 'Days', bn: 'দিন', digits: 1 },
    { key: 'rustPct', en: 'Surface rusted', bn: 'মরিচা ধরা পৃষ্ঠ', unit: '%', digits: 0 },
    { key: 'rust', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 5,
  compute: (p, _noise, ctx) => {
    const ti = idx(p.tube, RUST_TUBES.length);
    const day = clamp(p.day, 0, 7);
    const r = rustAmount(ti, day);
    const truth = RUST_TUBES[ti].rusts ? 0 : 1;
    const chosen = p.rust >= 0;
    const correct = chosen && p.rust === truth;
    const verdict = optionText(RUST_CHOICES, p.rust);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = RUST_TUBES.map((rt, i) => {
      const ri = rustAmount(i, day);
      const base: TubeView = {
        label: 'ABCDE'[i],
        solid: { kind: 'nail', color: i === 4 ? '#7d8a96' : '#8b8f96', coat: '#9a4a22', coatAmount: ri },
        active: i === ti,
        mark: markOf(latest.get(String(i)))
      };
      if (i === 0) return { ...base, liquid: '#dcefff', level: 0.42, cloud: ri * 0.35, cloudColor: '#c0703a', sub: 'H₂O' };
      if (i === 1) return { ...base, liquid: '#dcefff', level: 0.55, oil: 0.08, plug: 'cork', sub: 'oil', subBn: 'তেল' };
      if (i === 2) return { ...base, drying: true, plug: 'cork', sub: 'CaCl₂' };
      if (i === 3) return { ...base, liquid: '#e6f1f8', level: 0.42, cloud: ri * 0.5, cloudColor: '#c0703a', sub: 'NaCl' };
      return { ...base, liquid: '#dcefff', level: 0.42, sub: 'grease', subBn: 'গ্রিজ' };
    });
    const view: TubesView = { tubes, clock: { value: day, unit: 'day' } };
    return {
      row: {
        ...tx('tube', 'ABCDE'[ti], 'ABCDE'[ti]),
        ...tx('cond', RUST_TUBES[ti].en, RUST_TUBES[ti].bn),
        day: round(day, 1),
        rustPct: round(r * 100, 0),
        ...tx('rust', verdict.en, verdict.bn),
        check: tick(correct),
        __key: ti,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Rusted surface', bn: 'মরিচা ধরা পৃষ্ঠ', value: r * 100, unit: '%', digits: 0, tone: r > 0.05 ? 'warn' : 'good' },
        { en: 'Conditions', bn: 'অবস্থা', value: RUST_TUBES[ti].en, valueBn: RUST_TUBES[ti].bn },
        { en: 'Days', bn: 'দিন', value: day, digits: 1 },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—', valueBn: chosen ? verdict.bn : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        day < 3
          ? status('info', day === 0 ? 'Day 0 — press ▶ to let the days pass.' : 'Rust takes time to show — wait at least 3 days.', day === 0 ? 'দিন ০ — ▶ চেপে দিন পার হতে দাও।' : 'মরিচা দেখা দিতে সময় লাগে — অন্তত ৩ দিন অপেক্ষা করো।')
          : chosen
            ? status('info', `Tube ${'ABCDE'[ti]}: ${verdict.en.toLowerCase()} — record it.`, `নল ${'ABCDE'[ti]}: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `Tube ${'ABCDE'[ti]} (${RUST_TUBES[ti].en}): ${Math.round(r * 100)}% of the nail is rusty. Does it rust?`, `নল ${'ABCDE'[ti]} (${RUST_TUBES[ti].bn}): পেরেকের ${Math.round(r * 100)}% মরিচাযুক্ত। মরিচা ধরে কি?`),
      ready: day >= 3 && chosen,
      correct
    };
  },
  result: identifyResult(5, 'Tubes judged correctly', 'সঠিকভাবে বিচার করা নল'),
  solve: (p) => ({ ...p, day: Math.max(p.day, 5), rust: RUST_TUBES[idx(p.tube, RUST_TUBES.length)].rusts ? 0 : 1 })
};

/* ------------------------------------------------------------------ */
/* Extra: Daniell cell and electrode potentials                          */
/* ------------------------------------------------------------------ */

const ANODES = [
  { sym: 'Mg', e: -2.37, sol: '#eef4f9', strip: '#d8dee6', salt: 'MgSO₄' },
  { sym: 'Zn', e: -0.76, sol: '#eef4f9', strip: '#b9c2cc', salt: 'ZnSO₄' },
  { sym: 'Fe', e: -0.44, sol: '#cfe8d5', strip: '#8b8f96', salt: 'FeSO₄' },
  { sym: 'Pb', e: -0.13, sol: '#eef4f9', strip: '#7d8590', salt: 'Pb(NO₃)₂' }
];
const CATHODES = [
  { sym: 'Cu', e: 0.34, sol: '#3f88d8', strip: '#c8763c', salt: 'CuSO₄', ions: 1 },
  { sym: 'Ag', e: 0.8, sol: '#eef4f9', strip: '#d9dee3', salt: 'AgNO₃', ions: 2 }
];
const CELL_CONC = [1.0, 0.1, 0.01];

export function cellEmf(anode: number, cathode: number, c: number): { e0: number; e: number } {
  const a = ANODES[anode];
  const k = CATHODES[cathode];
  const e0 = k.e - a.e;
  // n = 2 for every cell here; Q = [M²⁺]/[Cu²⁺] (= 1/c) or [M²⁺]/[Ag⁺]² (= 1/c²)
  const q = 1 / Math.pow(c, k.ions);
  return { e0, e: e0 - (0.0592 / 2) * Math.log10(q) };
}

const electrochemicalCell: ChemPracticalModel = {
  slug: 'electrochemical-cell',
  scene: 'galvanic',
  howTo_en:
    'Build a cell from a metal in its own salt solution (1 M) and copper in copper(II) sulphate, joined by a salt bridge. Read the high-resistance voltmeter, then dilute the Cu²⁺ solution and try other metals. Correct each reading with the Nernst equation to get the standard EMF.',
  howTo_bn:
    'নিজের লবণ দ্রবণে (1 M) একটি ধাতু আর কপার(II) সালফেটে কপার নিয়ে লবণ সেতু দিয়ে যুক্ত করে একটি কোষ তৈরি করো। উচ্চ রোধের ভোল্টমিটার পড়ো, তারপর Cu²⁺ দ্রবণ লঘু করো এবং অন্য ধাতু দিয়ে চেষ্টা করো। প্রতিটি পাঠ নার্নস্ট সমীকরণ দিয়ে সংশোধন করে প্রমাণ EMF বের করো।',
  formula: 'E = E° − (0.0592 ÷ n) log Q · E°cell = E°(cathode) − E°(anode)',
  controls: [
    { key: 'anode', en: 'Left electrode (in its 1 M salt)', bn: 'বাম তড়িৎদ্বার (নিজের 1 M লবণে)', default: 1, options: ANODES.map((a, i) => opt(i, a.sym, a.sym)) },
    { key: 'cathode', en: 'Right electrode', bn: 'ডান তড়িৎদ্বার', default: 0, options: CATHODES.map((c, i) => opt(i, `${c.sym} | ${c.salt}`, `${c.sym} | ${c.salt}`)) },
    { key: 'conc', en: 'Concentration of the right-hand ions', bn: 'ডান পাশের আয়নের ঘনমাত্রা', default: 0, options: CELL_CONC.map((c, i) => opt(i, `${c} M`, `${c} M`)) },
    { key: 'bridge', en: 'Salt bridge (KNO₃)', bn: 'লবণ সেতু (KNO₃)', default: 1, options: [opt(1, 'In place', 'লাগানো'), opt(0, 'Removed', 'সরানো')] }
  ],
  tasks: [
    { en: 'Zn|Cu 1 M', bn: 'Zn|Cu 1 M', set: { anode: 1, cathode: 0, conc: 0, bridge: 1 } },
    { en: 'Zn|Cu 0.1 M', bn: 'Zn|Cu 0.1 M', set: { anode: 1, cathode: 0, conc: 1, bridge: 1 } },
    { en: 'Zn|Cu 0.01 M', bn: 'Zn|Cu 0.01 M', set: { anode: 1, cathode: 0, conc: 2, bridge: 1 } },
    { en: 'Mg|Cu', bn: 'Mg|Cu', set: { anode: 0, cathode: 0, conc: 0, bridge: 1 } },
    { en: 'Fe|Cu', bn: 'Fe|Cu', set: { anode: 2, cathode: 0, conc: 0, bridge: 1 } },
    { en: 'Pb|Cu', bn: 'Pb|Cu', set: { anode: 3, cathode: 0, conc: 0, bridge: 1 } }
  ],
  columns: [
    { key: 'cell', en: 'Cell', bn: 'কোষ' },
    { key: 'c', en: 'c(right)', bn: 'c(ডান)', unit: 'M' },
    { key: 'e', en: 'E measured', bn: 'পরিমাপিত E', unit: 'V', digits: 3 },
    { key: 'e0', en: 'E° (Nernst-corrected)', bn: 'E° (নার্নস্ট সংশোধিত)', unit: 'V', digits: 3 }
  ],
  minReadings: 6,
  compute: (p, noise, ctx) => {
    const anode = idx(p.anode, ANODES.length);
    const cathode = idx(p.cathode, CATHODES.length);
    const c = CELL_CONC[idx(p.conc, 3)];
    const bridge = p.bridge !== 0;
    const { e0, e } = cellEmf(anode, cathode, c);
    const reading = bridge ? e + noise(0.002) : 0;
    const q = 1 / Math.pow(c, CATHODES[cathode].ions);
    const corrected = reading + (0.0592 / 2) * Math.log10(q);
    const a = ANODES[anode];
    const k = CATHODES[cathode];
    const cellName = `${a.sym}|${a.sym}²⁺‖${k.ions === 2 ? 'Ag⁺' : 'Cu²⁺'}|${k.sym}`;
    // E°(M²⁺/M) = E°(Cu²⁺/Cu) − E°cell, from every Cu-cell reading so far
    const bySym = new Map<string, number[]>();
    for (const r of ctx.rows) {
      if (num(r, '__cathode') !== 0) continue;
      const sym = String(r.__anode ?? '');
      bySym.set(sym, [...(bySym.get(sym) ?? []), 0.34 - (num(r, 'e0') ?? 0)]);
    }
    const series = [...bySym.entries()].map(([sym, es]) => ({ sym, e: es.reduce((a, b) => a + b, 0) / es.length }));
    return {
      row: { ...tx('cell', cellName, cellName), c, e: round(reading, 3), e0: round(corrected, 3), __anode: a.sym, __cathode: cathode, __zn: anode === 1 && cathode === 0 ? 1 : 0 },
      live: [
        { en: 'Voltmeter', bn: 'ভোল্টমিটার', value: bridge ? e : 0, unit: 'V', digits: 3, tone: bridge ? 'info' : 'warn' },
        { en: 'Standard EMF', bn: 'প্রমাণ EMF', value: e0, unit: 'V', digits: 2 },
        { en: 'Anode (−)', bn: 'অ্যানোড (−)', value: `${a.sym} → ${a.sym}²⁺ + 2e⁻`, valueBn: `${a.sym} → ${a.sym}²⁺ + 2e⁻` },
        { en: 'Cathode (+)', bn: 'ক্যাথোড (+)', value: k.ions === 2 ? 'Ag⁺ + e⁻ → Ag' : 'Cu²⁺ + 2e⁻ → Cu', valueBn: k.ions === 2 ? 'Ag⁺ + e⁻ → Ag' : 'Cu²⁺ + 2e⁻ → Cu' }
      ],
      view: {
        left: { sym: a.sym, sol: a.sol, strip: a.strip, salt: a.salt },
        right: { sym: k.sym, sol: k.ions === 1 ? blendColors('#eef4f9', k.sol, 0.35 + 0.65 * Math.sqrt(c)) : k.sol, strip: k.strip, salt: k.salt },
        volts: bridge ? e : 0,
        bridge,
        conc: c,
        series
      },
      status: !bridge
        ? status('warn', 'No salt bridge: the circuit is incomplete, so the voltmeter reads 0 V. Put the bridge back.', 'লবণ সেতু নেই: বর্তনী অসম্পূর্ণ, তাই ভোল্টমিটার 0 V দেখায়। সেতু আবার লাগাও।')
        : status('info', `${a.sym} is the negative electrode (it is more reactive and loses electrons); electrons flow through the wire to ${k.sym}.${c < 1 ? ' Diluting the cathode solution lowers the EMF (Nernst).' : ''}`, `${a.sym} ঋণাত্মক তড়িৎদ্বার (বেশি সক্রিয়, ইলেকট্রন ছাড়ে); ইলেকট্রন তার দিয়ে ${k.sym}-এর দিকে যায়।${c < 1 ? ' ক্যাথোড দ্রবণ লঘু করলে EMF কমে (নার্নস্ট)।' : ''}`),
      ready: bridge
    };
  },
  result: {
    en: 'Standard EMF of the Daniell cell (Zn|Cu rows)',
    bn: 'ড্যানিয়েল কোষের প্রমাণ EMF (Zn|Cu সারি)',
    unit: 'V',
    digits: 3,
    compute: (rows) => {
      const vals = rows.filter((r) => num(r, '__zn') === 1).map((r) => num(r, 'e0')).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    },
    expected: 1.1
  },
  solve: (p) => ({ ...p, bridge: 1 })
};

export const redoxModels: ChemPracticalModel[] = [oxidisingAgents, iodineLiberation, copperNitric, oxidationEthanol, metalDisplacement, metalAcid, rusting, electrochemicalCell];
