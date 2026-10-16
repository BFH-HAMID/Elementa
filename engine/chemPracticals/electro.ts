import type { ChemPracticalModel } from './types';
import { FARADAY, MOLAR_VOLUME_ML, blendColors, clamp, num, opt, points, round, slopeThroughOrigin, status, tx } from './helpers';

const gasMl = (q: number, electrons: number) => (q / (electrons * FARADAY)) * MOLAR_VOLUME_ML;

/* ------------------------------------------------------------------ */
/* Electrolysis of acidified water (Hofmann voltameter)                  */
/* ------------------------------------------------------------------ */

const LIMB = 60; // mL capacity of each limb

const electrolysisWater: ChemPracticalModel = {
  slug: 'electrolysis-water',
  scene: 'electrolysis',
  variant: 'hofmann',
  howTo_en:
    'Fill the Hofmann voltameter with water acidified with a little dilute H₂SO₄ and switch on the supply. Run the stopwatch and read both gas columns at the suggested times. Hydrogen collects at the cathode (−), oxygen at the anode (+) — compare their volumes and test each gas.',
  howTo_bn:
    'অল্প লঘু H₂SO₄ মিশিয়ে অম্লীয় করা পানি দিয়ে হফম্যান ভোল্টামিটার ভরো এবং বিদ্যুৎ চালু করো। স্টপওয়াচ চালিয়ে প্রস্তাবিত সময়গুলোতে দুই নলের গ্যাসের আয়তন পড়ো। ক্যাথোডে (−) হাইড্রোজেন, অ্যানোডে (+) অক্সিজেন জমে — দুটির আয়তন তুলনা করো এবং প্রতিটি গ্যাস পরীক্ষা করো।',
  formula: '2H₂O → 2H₂ + O₂ · cathode: 4H⁺ + 4e⁻ → 2H₂ · anode: 2H₂O → O₂ + 4H⁺ + 4e⁻',
  controls: [
    { key: 'acid', en: 'Electrolyte', bn: 'তড়িৎবিশ্লেষ্য', default: 1, options: [opt(1, 'Water + dilute H₂SO₄', 'পানি + লঘু H₂SO₄'), opt(0, 'Pure water', 'বিশুদ্ধ পানি')] },
    { key: 'current', en: 'Current', bn: 'তড়িৎপ্রবাহ', min: 0.1, max: 0.8, step: 0.05, unit: 'A', default: 0.5, digits: 2 },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 600, step: 10, unit: 's', default: 0, play: { rate: 20 } },
    { key: 'test', en: 'Test a gas', bn: 'গ্যাস পরীক্ষা', kind: 'view', default: 0, options: [opt(0, 'No test', 'পরীক্ষা নয়'), opt(1, 'Burning splint at the cathode tap', 'ক্যাথোডের ট্যাপে জ্বলন্ত কাঠি'), opt(2, 'Glowing splint at the anode tap', 'অ্যানোডের ট্যাপে ধূমায়িত কাঠি')] }
  ],
  tasks: [120, 240, 360, 480, 600].map((t) => ({ en: `${t} s`, bn: `${t} সে`, set: { acid: 1, current: 0.5, t } })),
  columns: [
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'i', en: 'Current', bn: 'প্রবাহ', unit: 'A', digits: 2 },
    { key: 'vh', en: 'V(H₂) at cathode', bn: 'ক্যাথোডে V(H₂)', unit: 'mL', digits: 1 },
    { key: 'vo', en: 'V(O₂) at anode', bn: 'অ্যানোডে V(O₂)', unit: 'mL', digits: 1 },
    { key: 'ratio', en: 'V(H₂) ÷ V(O₂)', bn: 'V(H₂) ÷ V(O₂)', digits: 2 }
  ],
  minReadings: 5,
  graph: { x: 't', y: ['vh', 'vo'], kind: 'line' },
  compute: (p, noise) => {
    const acid = p.acid !== 0;
    const current = acid ? clamp(p.current, 0.1, 0.8) : 0.002;
    const t = clamp(p.t, 0, 600);
    const q = current * t;
    const vh = Math.min(LIMB, gasMl(q, 2));
    const vo = Math.min(LIMB, gasMl(q, 4));
    const vhR = Math.max(0, vh + noise(0.2));
    const voR = Math.max(0, vo + noise(0.2));
    const full = gasMl(q, 2) >= LIMB;
    return {
      row: { t: round(t, 0), i: round(current, 2), vh: round(vhR, 1), vo: round(voR, 1), ratio: voR > 0 ? round(vhR / voR, 2) : '—' },
      live: [
        { en: 'Cathode (H₂)', bn: 'ক্যাথোড (H₂)', value: vh, unit: 'mL', digits: 1, tone: 'info' },
        { en: 'Anode (O₂)', bn: 'অ্যানোড (O₂)', value: vo, unit: 'mL', digits: 1, tone: 'info' },
        { en: 'Ammeter', bn: 'অ্যামিটার', value: current, unit: 'A', digits: current < 0.01 ? 3 : 2 },
        { en: 'Charge passed', bn: 'প্রবাহিত আধান', value: q, unit: 'C', digits: 0 }
      ],
      view: {
        kind: 'hofmann',
        current,
        on: true,
        cathodeVol: vh,
        anodeVol: vo,
        maxVol: LIMB,
        anodeGas: 'O₂',
        liquid: '#dcefff',
        bubbles: acid ? clamp(current / 0.8, 0.15, 1) : 0.02,
        clock: t,
        test: p.test === 1 ? 'pop' : p.test === 2 ? 'relight' : 'none'
      },
      status: !acid
        ? status('warn', 'Pure water hardly conducts — almost no current and no gas. Add a little dilute sulphuric acid.', 'বিশুদ্ধ পানি প্রায় বিদ্যুৎ পরিবহন করে না — প্রবাহ ও গ্যাস প্রায় নেই। একটু লঘু সালফিউরিক অ্যাসিড দাও।')
        : full
          ? status('warn', 'The cathode limb is full — record now, or open the taps and start again.', 'ক্যাথোডের নল ভরে গেছে — এখনই রেকর্ড করো, অথবা ট্যাপ খুলে আবার শুরু করো।')
          : t < 60
            ? status('info', t === 0 ? 'Supply on — press ▶ to run the stopwatch.' : 'Bubbles rise from both electrodes… wait until there is enough gas to read.', t === 0 ? 'বিদ্যুৎ চালু — ▶ চেপে স্টপওয়াচ চালাও।' : 'দুই তড়িৎদ্বার থেকেই বুদবুদ উঠছে… পড়ার মতো গ্যাস জমা পর্যন্ত অপেক্ষা করো।')
            : status(
                'info',
                `About twice as much gas at the cathode as at the anode.${p.test === 1 ? ' Burning splint: squeaky pop — hydrogen.' : p.test === 2 ? ' Glowing splint relights — oxygen.' : ''}`,
                `অ্যানোডের তুলনায় ক্যাথোডে প্রায় দ্বিগুণ গ্যাস।${p.test === 1 ? ' জ্বলন্ত কাঠি: চিঁ শব্দে পপ — হাইড্রোজেন।' : p.test === 2 ? ' ধূমায়িত কাঠি জ্বলে ওঠে — অক্সিজেন।' : ''}`
              ),
      ready: acid && t >= 60
    };
  },
  result: {
    en: 'Volume ratio H₂ : O₂',
    bn: 'আয়তন অনুপাত H₂ : O₂',
    unit: '',
    digits: 2,
    compute: (rows) => slopeThroughOrigin(rows, 'vo', 'vh'),
    expected: 2
  },
  solve: (p) => ({ ...p, acid: 1, t: Math.max(p.t, 120) })
};

/* ------------------------------------------------------------------ */
/* Electrolysis of brine — Faraday constant from hydrogen                */
/* ------------------------------------------------------------------ */

const BRINES = [
  { en: 'Concentrated (≈ 5 M)', bn: 'গাঢ় (≈ 5 M)', short: 'conc.', shortBn: 'গাঢ়' },
  { en: 'Dilute (0.05 M)', bn: 'লঘু (0.05 M)', short: 'dilute', shortBn: 'লঘু' }
];

const electrolysisBrine: ChemPracticalModel = {
  slug: 'electrolysis-brine',
  scene: 'electrolysis',
  variant: 'brine',
  howTo_en:
    'Electrolyse sodium chloride solution between graphite electrodes and collect the gases. Record the hydrogen volume at the cathode for each time and current — Faraday’s law turns it into the Faraday constant. Compare the anode gas from concentrated and dilute brine, and watch phenolphthalein near the cathode.',
  howTo_bn:
    'গ্রাফাইট তড়িৎদ্বারের মধ্যে সোডিয়াম ক্লোরাইড দ্রবণ তড়িৎবিশ্লেষণ করো এবং গ্যাস সংগ্রহ করো। প্রতিটি সময় ও প্রবাহে ক্যাথোডের হাইড্রোজেনের আয়তন রেকর্ড করো — ফ্যারাডের সূত্রে তা থেকে ফ্যারাডে ধ্রুবক পাওয়া যায়। গাঢ় ও লঘু লবণ পানির অ্যানোড গ্যাস তুলনা করো এবং ক্যাথোডের কাছে ফেনফথ্যালিন লক্ষ করো।',
  formula: 'cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻ · anode: 2Cl⁻ → Cl₂ + 2e⁻ · F = I·t ÷ (2·n(H₂))',
  controls: [
    { key: 'conc', en: 'Brine', bn: 'লবণ পানি', default: 0, options: BRINES.map((b, i) => opt(i, b.en, b.bn)) },
    { key: 'current', en: 'Current', bn: 'তড়িৎপ্রবাহ', min: 0.1, max: 0.8, step: 0.05, unit: 'A', default: 0.5, digits: 2 },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 600, step: 10, unit: 's', default: 0, play: { rate: 20 } },
    { key: 'ind', en: 'Phenolphthalein near the cathode', bn: 'ক্যাথোডের কাছে ফেনফথ্যালিন', kind: 'view', default: 1, options: [opt(1, 'Yes', 'হ্যাঁ'), opt(0, 'No', 'না')] },
    { key: 'test', en: 'Test a gas', bn: 'গ্যাস পরীক্ষা', kind: 'view', default: 0, options: [opt(0, 'No test', 'পরীক্ষা নয়'), opt(1, 'Damp litmus at the anode', 'অ্যানোডে ভেজা লিটমাস'), opt(2, 'Burning splint at the cathode', 'ক্যাথোডে জ্বলন্ত কাঠি')] }
  ],
  tasks: [
    ...[150, 300, 450, 600].map((t) => ({ en: `conc. · ${t} s`, bn: `গাঢ় · ${t} সে`, set: { conc: 0, current: 0.5, t } })),
    { en: 'dilute · 300 s', bn: 'লঘু · 300 সে', set: { conc: 1, current: 0.5, t: 300 } }
  ],
  columns: [
    { key: 'brine', en: 'Brine', bn: 'লবণ পানি' },
    { key: 'q', en: 'Q = I·t', bn: 'Q = I·t', unit: 'C', digits: 0 },
    { key: 'vh', en: 'V(H₂)', bn: 'V(H₂)', unit: 'mL', digits: 1 },
    { key: 'anode', en: 'Anode gas', bn: 'অ্যানোড গ্যাস' },
    { key: 'va', en: 'V(anode)', bn: 'V(অ্যানোড)', unit: 'mL', digits: 1 },
    { key: 'f', en: 'F (calc.)', bn: 'F (হিসাব)', unit: 'C mol⁻¹', digits: 0 }
  ],
  minReadings: 5,
  graph: { x: 'q', y: 'vh', kind: 'scatter' },
  compute: (p, noise) => {
    const conc = p.conc === 1 ? 1 : 0;
    const current = clamp(p.current, 0.1, 0.8);
    const t = clamp(p.t, 0, 600);
    const q = current * t;
    const vh = gasMl(q, 2);
    const vCl = Math.max(0, gasMl(q, 2) - 6 * (1 - Math.exp(-t / 200)));
    const va = conc === 0 ? vCl : gasMl(q, 4) * 0.85 + gasMl(q, 2) * 0.15 * 0.5;
    const vhR = Math.max(0.1, vh + noise(0.2));
    const anodeGas = conc === 0 ? { en: 'Cl₂ (greenish-yellow)', bn: 'Cl₂ (সবুজাভ-হলুদ)' } : { en: 'mainly O₂', bn: 'প্রধানত O₂' };
    const ph = 7 + Math.min(6, Math.log10(1 + (q / FARADAY) * 2000));
    return {
      row: {
        ...tx('brine', BRINES[conc].short, BRINES[conc].shortBn),
        q: round(q, 0),
        vh: round(vhR, 1),
        ...tx('anode', anodeGas.en, anodeGas.bn),
        va: round(Math.max(0, va + noise(0.2)), 1),
        f: t > 0 ? round((q * MOLAR_VOLUME_ML) / (2 * vhR), 0) : '—',
        __t: t
      },
      live: [
        { en: 'Cathode (H₂)', bn: 'ক্যাথোড (H₂)', value: vh, unit: 'mL', digits: 1, tone: 'info' },
        { en: `Anode (${conc === 0 ? 'Cl₂' : 'O₂'})`, bn: `অ্যানোড (${conc === 0 ? 'Cl₂' : 'O₂'})`, value: va, unit: 'mL', digits: 1 },
        { en: 'Charge passed', bn: 'প্রবাহিত আধান', value: q, unit: 'C', digits: 0 },
        { en: 'pH near cathode', bn: 'ক্যাথোডের কাছে pH', value: t > 0 ? ph : 7, digits: 1 }
      ],
      view: {
        kind: 'brine',
        current,
        on: true,
        cathodeVol: Math.min(LIMB, vh),
        anodeVol: Math.min(LIMB, va),
        maxVol: LIMB,
        anodeGas: conc === 0 ? 'Cl₂' : 'O₂',
        liquid: '#e8f2f9',
        pink: p.ind === 1 ? clamp(t / 200, 0, 1) : 0,
        bubbles: clamp(current / 0.8, 0.15, 1),
        clock: t,
        test: p.test === 1 ? (conc === 0 ? 'bleach' : 'none') : p.test === 2 ? 'pop' : 'none'
      },
      status:
        t < 60
          ? status('info', t === 0 ? 'Supply on — press ▶ to run the stopwatch.' : 'Gas is collecting at both electrodes…', t === 0 ? 'বিদ্যুৎ চালু — ▶ চেপে স্টপওয়াচ চালাও।' : 'দুই তড়িৎদ্বারেই গ্যাস জমছে…')
          : conc === 0
            ? status('info', `Chlorine at the anode${p.test === 1 ? ' bleaches the damp litmus' : ''}; hydrogen at the cathode${p.test === 2 ? ' pops' : ''}. Little Cl₂ appears at first because it dissolves.${p.ind === 1 ? ' Pink near the cathode: NaOH is forming.' : ''}`, `অ্যানোডে ক্লোরিন${p.test === 1 ? ' ভেজা লিটমাস বিরঞ্জিত করে' : ''}; ক্যাথোডে হাইড্রোজেন${p.test === 2 ? ' পপ শব্দ করে' : ''}। শুরুতে Cl₂ কম দেখা যায় কারণ তা দ্রবীভূত হয়।${p.ind === 1 ? ' ক্যাথোডের কাছে গোলাপি: NaOH তৈরি হচ্ছে।' : ''}`)
            : status('info', 'Dilute brine: water is oxidised instead of Cl⁻, so mainly oxygen forms at the anode.', 'লঘু লবণ পানি: Cl⁻ এর বদলে পানি জারিত হয়, তাই অ্যানোডে প্রধানত অক্সিজেন তৈরি হয়।'),
      ready: t >= 60
    };
  },
  result: {
    en: 'Faraday constant (mean of your readings)',
    bn: 'ফ্যারাডে ধ্রুবক (তোমার পাঠগুলোর গড়)',
    unit: 'C mol⁻¹',
    digits: 0,
    compute: (rows) => {
      const vals = rows.map((r) => num(r, 'f')).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    },
    expected: FARADAY
  },
  solve: (p) => ({ ...p, t: Math.max(p.t, 150) })
};

/* ------------------------------------------------------------------ */
/* Extra: Electrolysis of CuSO₄ — Faraday's first law                    */
/* ------------------------------------------------------------------ */

const CATHODE0 = 5.0;
const M_CU = 63.55;

const copperFaraday: ChemPracticalModel = {
  slug: 'copper-electrolysis-faraday',
  scene: 'electrolysis',
  variant: 'copper',
  howTo_en:
    'Two weighed copper plates dip into copper(II) sulphate solution. Pass a steady current, stop the stopwatch at the suggested times, then wash, dry and weigh the cathode. The mass of copper deposited is proportional to the charge passed — its slope gives the Faraday constant.',
  howTo_bn:
    'ওজন করা দুটি কপার পাত কপার(II) সালফেট দ্রবণে ডুবানো। স্থির তড়িৎপ্রবাহ চালাও, প্রস্তাবিত সময়ে স্টপওয়াচ থামাও, তারপর ক্যাথোড ধুয়ে, শুকিয়ে ওজন করো। জমা কপারের ভর প্রবাহিত আধানের সমানুপাতিক — এর ঢাল থেকে ফ্যারাডে ধ্রুবক পাওয়া যায়।',
  formula: 'Cu²⁺ + 2e⁻ → Cu · m = M·I·t ÷ (2F)',
  controls: [
    { key: 'current', en: 'Current', bn: 'তড়িৎপ্রবাহ', min: 0.2, max: 1.0, step: 0.05, unit: 'A', default: 0.5, digits: 2 },
    { key: 'anode', en: 'Anode', bn: 'অ্যানোড', default: 0, options: [opt(0, 'Copper', 'কপার'), opt(1, 'Graphite (inert)', 'গ্রাফাইট (নিষ্ক্রিয়)')] },
    { key: 't', en: 'Stopwatch', bn: 'স্টপওয়াচ', kind: 'time', min: 0, max: 1800, step: 30, unit: 's', default: 0, play: { rate: 60 } }
  ],
  tasks: [300, 600, 900, 1200, 1500, 1800].map((t) => ({ en: `${t / 60} min`, bn: `${t / 60} মিনিট`, set: { current: 0.5, t } })),
  columns: [
    { key: 'i', en: 'Current', bn: 'প্রবাহ', unit: 'A', digits: 2 },
    { key: 't', en: 'Time', bn: 'সময়', unit: 's' },
    { key: 'q', en: 'Q = I·t', bn: 'Q = I·t', unit: 'C', digits: 0 },
    { key: 'mass', en: 'Cathode mass', bn: 'ক্যাথোডের ভর', unit: 'g', digits: 3 },
    { key: 'dm', en: 'Copper deposited', bn: 'জমা কপার', unit: 'g', digits: 3 }
  ],
  minReadings: 6,
  graph: { x: 'q', y: 'dm', kind: 'scatter' },
  compute: (p, noise, ctx) => {
    const current = clamp(p.current, 0.2, 1.0);
    const t = clamp(p.t, 0, 1800);
    const q = current * t;
    const dm = (M_CU * q) / (2 * FARADAY);
    const mass = CATHODE0 + dm + noise(0.0008);
    const graphite = p.anode === 1;
    const fade = graphite ? clamp(q / (2 * FARADAY) / 0.05, 0, 1) : 0;
    return {
      row: { i: round(current, 2), t: round(t, 0), q: round(q, 0), mass: round(mass, 3), dm: round(mass - CATHODE0, 3) },
      live: [
        { en: 'Cathode gain', bn: 'ক্যাথোডের ভর বৃদ্ধি', value: dm, unit: 'g', digits: 4, tone: 'info' },
        { en: 'Anode', bn: 'অ্যানোড', value: graphite ? 'O₂ bubbles' : `−${dm.toFixed(4)} g`, valueBn: graphite ? 'O₂ বুদবুদ' : `−${dm.toFixed(4)} g` },
        { en: 'Charge passed', bn: 'প্রবাহিত আধান', value: q, unit: 'C', digits: 0 },
        { en: 'Ammeter', bn: 'অ্যামিটার', value: current, unit: 'A', digits: 2 }
      ],
      view: {
        kind: 'copper',
        current,
        on: true,
        deposit: clamp(dm / 0.5, 0, 1),
        anodeLoss: graphite ? 0 : clamp(dm / 0.5, 0, 1),
        anode: graphite ? 'graphite' : 'copper',
        liquid: blendColors('#4a90dc', '#dcebf7', fade * 0.6),
        bubbles: graphite ? clamp(current, 0.2, 1) : 0,
        clock: t,
        curve: { pts: points(ctx.rows, 'q', 'dm'), cur: { x: q, y: dm }, xMax: 1800, yMin: 0, yMax: 0.6, xLabel: 'Q / C', yLabel: 'Δm / g' }
      },
      status:
        t < 60
          ? status('info', t === 0 ? 'Plates cleaned and weighed — press ▶ to pass the current.' : 'A pink-brown copper layer is starting to form on the cathode…', t === 0 ? 'পাত পরিষ্কার ও ওজন করা হয়েছে — ▶ চেপে প্রবাহ চালাও।' : 'ক্যাথোডে গোলাপি-বাদামি কপারের স্তর জমতে শুরু করেছে…')
          : graphite
            ? status('info', 'Graphite anode: oxygen bubbles off and the blue colour slowly fades as Cu²⁺ is used up.', 'গ্রাফাইট অ্যানোড: অক্সিজেন বুদবুদ ওঠে এবং Cu²⁺ খরচ হওয়ায় নীল রং ধীরে ফিকে হয়।')
            : status('info', 'Copper anode: it dissolves as fast as copper plates the cathode, so the blue colour stays the same.', 'কপার অ্যানোড: ক্যাথোডে যত কপার জমে, অ্যানোড ততটাই দ্রবীভূত হয় — তাই নীল রং একই থাকে।'),
      ready: t >= 60
    };
  },
  result: {
    en: 'Faraday constant from the slope of Δm against Q',
    bn: 'Δm বনাম Q-এর ঢাল থেকে ফ্যারাডে ধ্রুবক',
    unit: 'C mol⁻¹',
    digits: 0,
    compute: (rows) => {
      const s = slopeThroughOrigin(rows, 'q', 'dm');
      return s && s > 0 ? M_CU / (2 * s) : null;
    },
    expected: FARADAY
  },
  solve: (p) => ({ ...p, t: Math.max(p.t, 300) })
};

export const electroModels: ChemPracticalModel[] = [electrolysisWater, electrolysisBrine, copperFaraday];
