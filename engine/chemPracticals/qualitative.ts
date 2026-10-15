import type { ChemPracticalModel, ChemRow, TubesView, TubeView } from './types';
import { CHOOSE, COLORLESS, blendColors, clamp, latestBy, num, opt, optionText, round, scoreRows, status, tick, tx } from './helpers';

const markOf = (row: ChemRow | undefined): TubeView['mark'] => (row ? (num(row, '__correct') === 1 ? 'good' : 'bad') : undefined);
const idx = (v: number, n: number) => clamp(Math.round(v), 0, n - 1);
const identifyResult = (n: number, en: string, bn: string) => ({ en, bn, unit: '', score: true, compute: scoreRows, expected: n, absolute: true, tolerance: 0 });
const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ------------------------------------------------------------------ */
/* Flame test                                                           */
/* ------------------------------------------------------------------ */

const FLAME_IONS = [
  { ion: 'Na⁺', flame: '#ffb020', en: 'golden yellow', bn: 'সোনালি হলুদ', nm: '589 nm', cobalt: null as string | null },
  { ion: 'K⁺', flame: '#c07cff', en: 'lilac', bn: 'হালকা বেগুনি (লাইলাক)', nm: '766 + 404 nm', cobalt: '#c0399f' },
  { ion: 'Ca²⁺', flame: '#e8552f', en: 'brick red', bn: 'ইটের মতো লাল', nm: '622 nm', cobalt: '#a8d86a' },
  { ion: 'Cu²⁺', flame: '#2fd3a6', en: 'blue-green', bn: 'নীলাভ সবুজ', nm: '515 nm', cobalt: '#4f9bd8' },
  { ion: 'Ba²⁺', flame: '#a6e05a', en: 'apple green', bn: 'আপেল সবুজ', nm: '554 nm', cobalt: '#6fc0a0' }
];
/** Salt A–E → ion index (shuffled so the letters don't give the answer away). */
const FLAME_SAMPLES = [
  { ion: 2, salt: 'CaCl₂', solid: '#f4f6f8' },
  { ion: 0, salt: 'NaCl', solid: '#f6f7f9' },
  { ion: 3, salt: 'CuSO₄', solid: '#3b82d6' },
  { ion: 1, salt: 'KCl', solid: '#f4f6f8' },
  { ion: 4, salt: 'BaCl₂', solid: '#f3f5f7' }
];
const ION_CHOICES = [CHOOSE, ...FLAME_IONS.map((f, i) => opt(i, f.ion, f.ion))];

const flameTest: ChemPracticalModel = {
  slug: 'flame-test',
  scene: 'flame',
  howTo_en:
    'Open the air hole for a hot non-luminous flame and clean the nichrome wire in conc. HCl until it gives no colour. Dip the loop in salt A–E, hold it at the edge of the flame, note the colour and name the metal ion. Look through cobalt-blue glass if a yellow tinge hides the colour.',
  howTo_bn:
    'বায়ুছিদ্র খুলে উত্তপ্ত অদীপ্ত শিখা নাও এবং নাইক্রোম তারটি গাঢ় HCl-এ পরিষ্কার করো যতক্ষণ না শিখায় কোনো রং দেখা যায়। লুপটি লবণ A–E-তে ডুবিয়ে শিখার কিনারায় ধরো, রং লক্ষ করো এবং ধাতব আয়নটির নাম বলো। হলুদ আভা রং ঢেকে দিলে কোবাল্ট-নীল কাচের মধ্য দিয়ে দেখো।',
  formula: 'heat → electrons excited → fall back → light of a characteristic colour',
  controls: [
    { key: 'sample', en: 'Salt on the wire loop', bn: 'তারের লুপে লবণ', default: 0, options: FLAME_SAMPLES.map((_, i) => opt(i, `Salt ${letters[i]}`, `লবণ ${letters[i]}`)) },
    { key: 'air', en: 'Air hole', bn: 'বায়ুছিদ্র', default: 0, options: [opt(0, 'Closed (luminous)', 'বন্ধ (দীপ্ত)'), opt(1, 'Open (blue flame)', 'খোলা (নীল শিখা)')] },
    { key: 'clean', en: 'Wire cleaned in conc. HCl', bn: 'গাঢ় HCl-এ তার পরিষ্কার', default: 0, options: [opt(0, 'Not yet', 'এখনও না'), opt(1, 'Cleaned', 'পরিষ্কার করা হয়েছে')] },
    { key: 'cobalt', en: 'Cobalt-blue glass', bn: 'কোবাল্ট-নীল কাচ', kind: 'view', default: 0, options: [opt(0, 'No', 'না'), opt(1, 'Look through it', 'এর মধ্য দিয়ে দেখো')] },
    { key: 'ion', en: 'Your conclusion: the metal ion is…', bn: 'তোমার সিদ্ধান্ত: ধাতব আয়নটি…', kind: 'inference', default: -1, options: ION_CHOICES }
  ],
  tasks: FLAME_SAMPLES.map((_, i) => ({ en: `Salt ${letters[i]}`, bn: `লবণ ${letters[i]}`, set: { sample: i, air: 1, clean: 1 } })),
  columns: [
    { key: 'salt', en: 'Salt', bn: 'লবণ' },
    { key: 'flame', en: 'Flame colour', bn: 'শিখার রং' },
    { key: 'ion', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'actual', en: 'Actually', bn: 'আসলে' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 5,
  compute: (p, _noise, ctx) => {
    const si = idx(p.sample, FLAME_SAMPLES.length);
    const sample = FLAME_SAMPLES[si];
    const ion = FLAME_IONS[sample.ion];
    const open = p.air === 1;
    const clean = p.clean === 1;
    const cobalt = p.cobalt === 1;
    let color = ion.flame;
    let nameEn = ion.en;
    let nameBn = ion.bn;
    if (!open) {
      color = blendColors('#ffcf4d', ion.flame, 0.22);
      nameEn = 'hidden by the yellow luminous flame';
      nameBn = 'হলুদ দীপ্ত শিখায় ঢাকা পড়েছে';
    } else if (!clean && sample.ion !== 0) {
      color = blendColors(ion.flame, '#ffb020', 0.6);
      nameEn = `${ion.en}, masked by yellow`;
      nameBn = `${ion.bn}, হলুদে ঢাকা`;
    }
    if (cobalt && open) {
      if (sample.ion === 0) {
        color = '#5b6fb8';
        nameEn = 'no colour (yellow absorbed by the blue glass)';
        nameBn = 'রং নেই (নীল কাচ হলুদ শোষণ করে)';
      } else {
        color = ion.cobalt ?? color;
        nameEn = `${ion.en} (crimson-tinted through cobalt glass)`;
        nameBn = `${ion.bn} (কোবাল্ট কাচে লালচে)`;
        if (sample.ion !== 1) {
          nameEn = `${ion.en} (seen through blue glass)`;
          nameBn = `${ion.bn} (নীল কাচের মধ্য দিয়ে)`;
        }
      }
    }
    const chosen = p.ion >= 0;
    const correct = chosen && p.ion === sample.ion;
    const verdict = optionText(ION_CHOICES, p.ion);
    const latest = latestBy(ctx.rows, '__key');
    const valid = open && clean;
    return {
      row: {
        ...tx('salt', `Salt ${letters[si]}`, `লবণ ${letters[si]}`),
        ...tx('flame', nameEn, nameBn),
        ...tx('ion', verdict.en, verdict.bn),
        ...tx('actual', `${sample.salt} (${ion.ion})`, `${sample.salt} (${ion.ion})`),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Flame colour', bn: 'শিখার রং', value: nameEn, valueBn: nameBn, tone: valid ? 'info' : 'warn' },
        { en: 'Emission', bn: 'নিঃসরণ', value: valid ? ion.nm : '—' },
        { en: 'Flame', bn: 'শিখা', value: open ? 'non-luminous, ~1000 °C' : 'luminous, sooty', valueBn: open ? 'অদীপ্ত, ~1000 °C' : 'দীপ্ত, ভুসাযুক্ত' },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—' }
      ],
      view: {
        open,
        clean,
        cobalt,
        flameColor: color,
        sample: si,
        salts: FLAME_SAMPLES.map((s, i) => ({ label: letters[i], color: s.solid, mark: markOf(latest.get(String(i))) }))
      },
      status: !open
        ? status('warn', 'The air hole is closed: the yellow luminous flame hides the colour. Open the air hole.', 'বায়ুছিদ্র বন্ধ: হলুদ দীপ্ত শিখা রং ঢেকে দিচ্ছে। বায়ুছিদ্র খোলো।')
        : !clean
          ? status('warn', 'Dirty wire: traces of sodium give a yellow flame that masks other colours. Clean it in conc. HCl first.', 'ময়লা তার: সোডিয়ামের চিহ্ন হলুদ শিখা দেয়, যা অন্য রং ঢেকে দেয়। আগে গাঢ় HCl-এ পরিষ্কার করো।')
          : chosen
            ? status('info', `Flame: ${nameEn}. Your conclusion: ${verdict.en} — record it.`, `শিখা: ${nameBn}। তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `The flame turns ${nameEn}. Which metal ion gives this colour?`, `শিখার রং ${nameBn}। কোন ধাতব আয়ন এই রং দেয়?`),
      ready: valid && chosen,
      correct
    };
  },
  result: identifyResult(5, 'Metal ions identified correctly', 'সঠিকভাবে শনাক্ত ধাতব আয়ন'),
  solve: (p) => ({ ...p, air: 1, clean: 1, ion: FLAME_SAMPLES[idx(p.sample, FLAME_SAMPLES.length)].ion })
};

/* ------------------------------------------------------------------ */
/* Halide test with silver nitrate                                       */
/* ------------------------------------------------------------------ */

const HALIDES = [
  { ion: 'Cl⁻', ppt: '#f7f8fa', en: 'white', bn: 'সাদা', dilute: 1, conc: 1 },
  { ion: 'Br⁻', ppt: '#efe1b0', en: 'cream', bn: 'ক্রিম (হালকা হলুদ)', dilute: 0.25, conc: 1 },
  { ion: 'I⁻', ppt: '#f0d64f', en: 'yellow', bn: 'হলুদ', dilute: 0, conc: 0 }
];
const HALIDE_SAMPLES = [
  { salt: 'NaBr', ion: 1 },
  { salt: 'NaCl', ion: 0 },
  { salt: 'NaNO₃', ion: 3 },
  { salt: 'KI', ion: 2 }
];
const HALIDE_CHOICES = [CHOOSE, opt(0, 'Cl⁻', 'Cl⁻'), opt(1, 'Br⁻', 'Br⁻'), opt(2, 'I⁻', 'I⁻'), opt(3, 'No halide', 'হ্যালাইড নেই')];

const halideTest: ChemPracticalModel = {
  slug: 'precipitate-agcl',
  scene: 'tubes',
  variant: 'halide',
  howTo_en:
    'Acidify each unknown solution with dilute nitric acid, add silver nitrate drop by drop and look at the colour of the precipitate. Then add ammonia solution: AgCl dissolves in dilute ammonia, AgBr only in concentrated ammonia, AgI not at all.',
  howTo_bn:
    'প্রতিটি অজানা দ্রবণকে লঘু নাইট্রিক অ্যাসিড দিয়ে অম্লীয় করো, ফোঁটায় ফোঁটায় সিলভার নাইট্রেট দাও এবং অধঃক্ষেপের রং দেখো। তারপর অ্যামোনিয়া দ্রবণ দাও: AgCl লঘু অ্যামোনিয়ায় দ্রবীভূত হয়, AgBr কেবল গাঢ় অ্যামোনিয়ায়, AgI একেবারেই নয়।',
  formula: 'Ag⁺ + X⁻ → AgX↓ · AgCl + 2NH₃ → [Ag(NH₃)₂]⁺ + Cl⁻',
  controls: [
    { key: 'sample', en: 'Unknown solution', bn: 'অজানা দ্রবণ', default: 0, options: HALIDE_SAMPLES.map((_, i) => opt(i, `Solution ${letters[i]}`, `দ্রবণ ${letters[i]}`)) },
    { key: 'hno3', en: 'Dilute HNO₃', bn: 'লঘু HNO₃', default: 0, options: [opt(0, 'Not added', 'দেওয়া হয়নি'), opt(1, 'Acidified', 'অম্লীয় করা হয়েছে')] },
    { key: 'drops', en: 'AgNO₃ solution', bn: 'AgNO₃ দ্রবণ', min: 0, max: 10, step: 1, unit: 'drops', default: 0 },
    { key: 'nh3', en: 'Then add ammonia', bn: 'তারপর অ্যামোনিয়া', default: 0, options: [opt(0, 'None', 'না'), opt(1, 'Dilute NH₃', 'লঘু NH₃'), opt(2, 'Conc. NH₃', 'গাঢ় NH₃')] },
    { key: 'ion', en: 'Your conclusion: the solution contains…', bn: 'তোমার সিদ্ধান্ত: দ্রবণে আছে…', kind: 'inference', default: -1, options: HALIDE_CHOICES }
  ],
  tasks: HALIDE_SAMPLES.map((_, i) => ({ en: `Solution ${letters[i]}`, bn: `দ্রবণ ${letters[i]}`, set: { sample: i, hno3: 1 } })),
  columns: [
    { key: 'sample', en: 'Solution', bn: 'দ্রবণ' },
    { key: 'ppt', en: 'With AgNO₃', bn: 'AgNO₃ দিলে' },
    { key: 'nh3', en: 'With NH₃', bn: 'NH₃ দিলে' },
    { key: 'ion', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'actual', en: 'Actually', bn: 'আসলে' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  compute: (p, _noise, ctx) => {
    const si = idx(p.sample, HALIDE_SAMPLES.length);
    const s = HALIDE_SAMPLES[si];
    const hal = s.ion < 3 ? HALIDES[s.ion] : null;
    const drops = clamp(Math.round(p.drops), 0, 10);
    const amount = hal ? clamp(drops / 5, 0, 1) : 0;
    const nh3 = idx(p.nh3, 3);
    const dissolved = hal && nh3 > 0 ? (nh3 === 1 ? hal.dilute : hal.conc) : 0;
    const left = amount * (1 - dissolved);
    const acid = p.hno3 === 1;
    const pptText = drops === 0 ? { en: 'not added', bn: 'দেওয়া হয়নি' } : hal ? { en: `${hal.en} precipitate`, bn: `${hal.bn} অধঃক্ষেপ` } : { en: 'no precipitate', bn: 'অধঃক্ষেপ নেই' };
    const nh3Text =
      nh3 === 0 || !hal || drops === 0
        ? { en: nh3 === 0 ? 'not tested' : '—', bn: nh3 === 0 ? 'পরীক্ষা হয়নি' : '—' }
        : dissolved >= 0.99
          ? { en: `dissolves in ${nh3 === 1 ? 'dilute' : 'conc.'} NH₃`, bn: `${nh3 === 1 ? 'লঘু' : 'গাঢ়'} NH₃-এ দ্রবীভূত` }
          : dissolved > 0
            ? { en: 'only slightly soluble', bn: 'সামান্য দ্রবীভূত' }
            : { en: 'insoluble', bn: 'অদ্রবণীয়' };
    const chosen = p.ion >= 0;
    const correct = chosen && p.ion === s.ion;
    const verdict = optionText(HALIDE_CHOICES, p.ion);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = HALIDE_SAMPLES.map((smp, i) => {
      const active = i === si;
      const rec = latest.get(String(i));
      const h = smp.ion < 3 ? HALIDES[smp.ion] : null;
      if (active)
        return {
          label: letters[i],
          liquid: COLORLESS,
          level: 0.36 + drops * 0.008 + (nh3 ? 0.06 : 0),
          cloud: left * 0.85,
          cloudColor: hal?.ppt,
          ppt: left * 0.12,
          pptColor: hal?.ppt,
          active
        };
      const recLeft = rec ? num(rec, '__left') ?? 0 : 0;
      return { label: letters[i], liquid: COLORLESS, level: 0.36, ppt: recLeft * 0.12, pptColor: h?.ppt, cloud: recLeft * 0.3, cloudColor: h?.ppt, mark: markOf(rec) };
    });
    const view: TubesView = { tubes, dropper: { tube: si, color: nh3 ? '#eef4f9' : '#f2f6fa', label: nh3 ? 'NH₃' : 'AgNO₃' } };
    const valid = acid && drops >= 3;
    return {
      row: {
        ...tx('sample', `Solution ${letters[si]}`, `দ্রবণ ${letters[si]}`),
        ...tx('ppt', pptText.en, pptText.bn),
        ...tx('nh3', nh3Text.en, nh3Text.bn),
        ...tx('ion', verdict.en, verdict.bn),
        ...tx('actual', s.salt, s.salt),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0,
        __left: round(left, 3)
      },
      live: [
        { en: 'With AgNO₃', bn: 'AgNO₃ দিলে', value: pptText.en, valueBn: pptText.bn, tone: 'info' },
        { en: 'With NH₃', bn: 'NH₃ দিলে', value: nh3Text.en, valueBn: nh3Text.bn },
        { en: 'AgNO₃ added', bn: 'যোগ করা AgNO₃', value: drops, unit: 'drops' },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—', valueBn: chosen ? verdict.bn : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status: !acid
        ? status('warn', 'Acidify with dilute HNO₃ first — carbonate or hydroxide ions would also precipitate with Ag⁺.', 'আগে লঘু HNO₃ দিয়ে অম্লীয় করো — নইলে কার্বনেট বা হাইড্রোক্সাইড আয়নও Ag⁺-এর সাথে অধঃক্ষেপ দেবে।')
        : drops < 3
          ? status('info', 'Add silver nitrate solution drop by drop (at least 3 drops).', 'ফোঁটায় ফোঁটায় সিলভার নাইট্রেট দ্রবণ দাও (অন্তত ৩ ফোঁটা)।')
          : !chosen
            ? status('info', `${pptText.en[0].toUpperCase()}${pptText.en.slice(1)}${nh3 ? `; with ammonia: ${nh3Text.en}` : ' — add ammonia to tell Cl⁻, Br⁻ and I⁻ apart'}. Choose your conclusion.`, `${pptText.bn}${nh3 ? `; অ্যামোনিয়ায়: ${nh3Text.bn}` : ' — Cl⁻, Br⁻ ও I⁻ আলাদা করতে অ্যামোনিয়া দাও'}। এবার সিদ্ধান্ত বেছে নাও।`)
            : status('info', `Your conclusion: ${verdict.en} — record it.`, `তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`),
      ready: valid && chosen,
      correct
    };
  },
  result: identifyResult(4, 'Solutions identified correctly', 'সঠিকভাবে শনাক্ত দ্রবণ'),
  solve: (p) => ({ ...p, hno3: 1, drops: Math.max(5, p.drops), nh3: 1, ion: HALIDE_SAMPLES[idx(p.sample, HALIDE_SAMPLES.length)].ion })
};

/* ------------------------------------------------------------------ */
/* Sulphate test with barium chloride                                    */
/* ------------------------------------------------------------------ */

const SULPHATE_SAMPLES = [
  { salt: 'Na₂CO₃', kind: 1 },
  { salt: 'Na₂SO₄', kind: 0 },
  { salt: 'NaCl', kind: 2 },
  { salt: 'ZnSO₄', kind: 0 }
];
const SULPHATE_CHOICES = [CHOOSE, opt(0, 'SO₄²⁻ (sulphate)', 'SO₄²⁻ (সালফেট)'), opt(1, 'CO₃²⁻ (carbonate)', 'CO₃²⁻ (কার্বনেট)'), opt(2, 'Neither', 'কোনোটিই নয়')];

const sulphateTest: ChemPracticalModel = {
  slug: 'precipitate-baso4',
  scene: 'tubes',
  variant: 'sulphate',
  howTo_en:
    'Acidify each solution with dilute HCl (watch for fizzing), then add barium chloride. A white precipitate that stays in acid is BaSO₄ — the sulphate test. Try it without the acid too: carbonates give a white BaCO₃ precipitate that fools you.',
  howTo_bn:
    'প্রতিটি দ্রবণ লঘু HCl দিয়ে অম্লীয় করো (বুদবুদ ওঠে কি না দেখো), তারপর বেরিয়াম ক্লোরাইড দাও। অ্যাসিডেও যে সাদা অধঃক্ষেপ থেকে যায় সেটি BaSO₄ — সালফেটের পরীক্ষা। অ্যাসিড ছাড়াও চেষ্টা করো: কার্বনেট সাদা BaCO₃ অধঃক্ষেপ দিয়ে বিভ্রান্ত করে।',
  formula: 'Ba²⁺ + SO₄²⁻ → BaSO₄↓ (insoluble in HCl)',
  controls: [
    { key: 'sample', en: 'Unknown solution', bn: 'অজানা দ্রবণ', default: 0, options: SULPHATE_SAMPLES.map((_, i) => opt(i, `Solution ${letters[i]}`, `দ্রবণ ${letters[i]}`)) },
    { key: 'hcl', en: 'Dilute HCl first', bn: 'আগে লঘু HCl', default: 0, options: [opt(0, 'Not added', 'দেওয়া হয়নি'), opt(1, 'Acidified', 'অম্লীয় করা হয়েছে')] },
    { key: 'drops', en: 'BaCl₂ solution', bn: 'BaCl₂ দ্রবণ', min: 0, max: 10, step: 1, unit: 'drops', default: 0 },
    { key: 'ion', en: 'Your conclusion: the solution contains…', bn: 'তোমার সিদ্ধান্ত: দ্রবণে আছে…', kind: 'inference', default: -1, options: SULPHATE_CHOICES }
  ],
  tasks: SULPHATE_SAMPLES.map((_, i) => ({ en: `Solution ${letters[i]}`, bn: `দ্রবণ ${letters[i]}`, set: { sample: i, hcl: 1 } })),
  columns: [
    { key: 'sample', en: 'Solution', bn: 'দ্রবণ' },
    { key: 'acid', en: 'With HCl', bn: 'HCl দিলে' },
    { key: 'ppt', en: 'With BaCl₂', bn: 'BaCl₂ দিলে' },
    { key: 'ion', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'actual', en: 'Actually', bn: 'আসলে' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 4,
  compute: (p, _noise, ctx) => {
    const si = idx(p.sample, SULPHATE_SAMPLES.length);
    const s = SULPHATE_SAMPLES[si];
    const acid = p.hcl === 1;
    const drops = clamp(Math.round(p.drops), 0, 10);
    const forms = s.kind === 0 || (s.kind === 1 && !acid);
    const amount = forms ? clamp(drops / 5, 0, 1) : 0;
    const fizz = acid && s.kind === 1;
    const acidText = !acid ? { en: 'not acidified', bn: 'অম্লীয় করা হয়নি' } : fizz ? { en: 'fizzes (CO₂)', bn: 'বুদবুদ ওঠে (CO₂)' } : { en: 'no change', bn: 'পরিবর্তন নেই' };
    const pptText = drops === 0 ? { en: 'not added', bn: 'দেওয়া হয়নি' } : amount > 0 ? { en: 'white precipitate', bn: 'সাদা অধঃক্ষেপ' } : { en: 'no precipitate', bn: 'অধঃক্ষেপ নেই' };
    const chosen = p.ion >= 0;
    const correct = chosen && p.ion === s.kind;
    const verdict = optionText(SULPHATE_CHOICES, p.ion);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = SULPHATE_SAMPLES.map((smp, i) => {
      const rec = latest.get(String(i));
      if (i === si) return { label: letters[i], liquid: COLORLESS, level: 0.36 + drops * 0.008 + (acid ? 0.04 : 0), cloud: amount * 0.75, cloudColor: '#fbfcfd', ppt: amount * 0.12, pptColor: '#fbfcfd', bubbles: fizz ? 0.55 : 0, active: true };
      const recAmount = rec ? num(rec, '__amount') ?? 0 : 0;
      return { label: letters[i], liquid: COLORLESS, level: 0.36, ppt: recAmount * 0.12, pptColor: '#fbfcfd', cloud: recAmount * 0.25, cloudColor: '#fbfcfd', mark: markOf(rec) };
    });
    const view: TubesView = { tubes, dropper: { tube: si, color: '#eff5f9', label: drops > 0 ? 'BaCl₂' : 'HCl' } };
    const valid = acid && drops >= 3;
    return {
      row: {
        ...tx('sample', `Solution ${letters[si]}`, `দ্রবণ ${letters[si]}`),
        ...tx('acid', acidText.en, acidText.bn),
        ...tx('ppt', pptText.en, pptText.bn),
        ...tx('ion', verdict.en, verdict.bn),
        ...tx('actual', s.salt, s.salt),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0,
        __amount: round(amount, 3)
      },
      live: [
        { en: 'With HCl', bn: 'HCl দিলে', value: acidText.en, valueBn: acidText.bn },
        { en: 'With BaCl₂', bn: 'BaCl₂ দিলে', value: pptText.en, valueBn: pptText.bn, tone: 'info' },
        { en: 'BaCl₂ added', bn: 'যোগ করা BaCl₂', value: drops, unit: 'drops' },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—', valueBn: chosen ? verdict.bn : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status: !acid
        ? drops >= 3 && s.kind === 1
          ? status('warn', 'White precipitate — but without acid this could be BaCO₃! Acidify with dilute HCl and test again.', 'সাদা অধঃক্ষেপ — কিন্তু অ্যাসিড ছাড়া এটি BaCO₃-ও হতে পারে! লঘু HCl দিয়ে অম্লীয় করে আবার পরীক্ষা করো।')
          : status('warn', 'Acidify with dilute HCl first, so carbonate cannot give a false white precipitate.', 'আগে লঘু HCl দিয়ে অম্লীয় করো, যাতে কার্বনেট ভুল সাদা অধঃক্ষেপ দিতে না পারে।')
        : drops < 3
          ? status('info', fizz ? 'Fizzing on adding acid — CO₂ from a carbonate! Now add BaCl₂.' : 'Now add barium chloride drop by drop (at least 3 drops).', fizz ? 'অ্যাসিড দিতেই বুদবুদ — কার্বনেট থেকে CO₂! এবার BaCl₂ দাও।' : 'এবার ফোঁটায় ফোঁটায় বেরিয়াম ক্লোরাইড দাও (অন্তত ৩ ফোঁটা)।')
          : chosen
            ? status('info', `Your conclusion: ${verdict.en} — record it.`, `তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `With HCl: ${acidText.en}; with BaCl₂: ${pptText.en}. Choose your conclusion.`, `HCl দিলে: ${acidText.bn}; BaCl₂ দিলে: ${pptText.bn}। সিদ্ধান্ত বেছে নাও।`),
      ready: valid && chosen,
      correct
    };
  },
  result: identifyResult(4, 'Solutions identified correctly', 'সঠিকভাবে শনাক্ত দ্রবণ'),
  solve: (p) => ({ ...p, hcl: 1, drops: Math.max(5, p.drops), ion: SULPHATE_SAMPLES[idx(p.sample, SULPHATE_SAMPLES.length)].kind })
};

/* ------------------------------------------------------------------ */
/* Cation tests with sodium hydroxide                                    */
/* ------------------------------------------------------------------ */

const CATIONS = [
  { ion: 'Cu²⁺', ppt: '#4a9fe0', en: 'pale blue', bn: 'হালকা নীল', soluble: false },
  { ion: 'Fe²⁺', ppt: '#6f9e6a', en: 'dirty green', bn: 'ময়লা সবুজ', soluble: false },
  { ion: 'Fe³⁺', ppt: '#a34a1f', en: 'red-brown', bn: 'লালচে বাদামি', soluble: false },
  { ion: 'Zn²⁺', ppt: '#f5f8fa', en: 'white', bn: 'সাদা', soluble: true },
  { ion: 'Mg²⁺', ppt: '#f2f5f8', en: 'white', bn: 'সাদা', soluble: false }
];
const CATION_SAMPLES = [
  { salt: 'FeSO₄', ion: 1, liquid: '#c9e6cf' },
  { salt: 'CuSO₄', ion: 0, liquid: '#5d9fe0' },
  { salt: 'ZnSO₄', ion: 3, liquid: '#eef4f9' },
  { salt: 'FeCl₃', ion: 2, liquid: '#d9a441' },
  { salt: 'MgSO₄', ion: 4, liquid: '#f0f6fa' }
];
const CATION_CHOICES = [CHOOSE, ...CATIONS.map((c, i) => opt(i, c.ion, c.ion))];

const cationTest: ChemPracticalModel = {
  slug: 'metal-hydroxide-precipitates',
  scene: 'tubes',
  variant: 'cation',
  howTo_en:
    'Add sodium hydroxide to each unknown solution a drop at a time: note the colour of the hydroxide precipitate, then keep adding until NaOH is in excess (12+ drops) and see whether it dissolves. Colour plus solubility in excess names the cation.',
  howTo_bn:
    'প্রতিটি অজানা দ্রবণে এক ফোঁটা করে সোডিয়াম হাইড্রোক্সাইড দাও: হাইড্রোক্সাইড অধঃক্ষেপের রং লক্ষ করো, তারপর NaOH বেশি (১২+ ফোঁটা) না হওয়া পর্যন্ত দিতে থাকো এবং দেখো অধঃক্ষেপ দ্রবীভূত হয় কি না। রং আর অতিরিক্তে দ্রাব্যতা মিলিয়ে ক্যাটায়নের নাম বলো।',
  formula: 'Mⁿ⁺ + n OH⁻ → M(OH)ₙ↓ · Zn(OH)₂ + 2OH⁻ → ZnO₂²⁻ + 2H₂O',
  controls: [
    { key: 'sample', en: 'Unknown solution', bn: 'অজানা দ্রবণ', default: 0, options: CATION_SAMPLES.map((_, i) => opt(i, `Solution ${letters[i]}`, `দ্রবণ ${letters[i]}`)) },
    { key: 'drops', en: 'NaOH solution', bn: 'NaOH দ্রবণ', min: 0, max: 20, step: 1, unit: 'drops', default: 0 },
    { key: 'ion', en: 'Your conclusion: the cation is…', bn: 'তোমার সিদ্ধান্ত: ক্যাটায়নটি…', kind: 'inference', default: -1, options: CATION_CHOICES }
  ],
  tasks: CATION_SAMPLES.map((_, i) => ({ en: `Solution ${letters[i]}`, bn: `দ্রবণ ${letters[i]}`, set: { sample: i } })),
  columns: [
    { key: 'sample', en: 'Solution', bn: 'দ্রবণ' },
    { key: 'few', en: 'A few drops of NaOH', bn: 'কয়েক ফোঁটা NaOH' },
    { key: 'excess', en: 'Excess NaOH', bn: 'অতিরিক্ত NaOH' },
    { key: 'ion', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'actual', en: 'Actually', bn: 'আসলে' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 5,
  compute: (p, _noise, ctx) => {
    const si = idx(p.sample, CATION_SAMPLES.length);
    const s = CATION_SAMPLES[si];
    const cat = CATIONS[s.ion];
    const drops = clamp(Math.round(p.drops), 0, 20);
    const formed = clamp(drops / 6, 0, 1);
    const redissolved = cat.soluble ? clamp((drops - 10) / 5, 0, 1) : 0;
    const amount = formed * (1 - redissolved);
    const excess = drops >= 12;
    const fewText = drops === 0 ? { en: 'not added', bn: 'দেওয়া হয়নি' } : { en: `${cat.en} precipitate`, bn: `${cat.bn} অধঃক্ষেপ` };
    const excessText = !excess
      ? { en: 'not tested yet', bn: 'এখনও পরীক্ষা হয়নি' }
      : cat.soluble
        ? { en: 'dissolves — colourless solution', bn: 'দ্রবীভূত হয় — বর্ণহীন দ্রবণ' }
        : s.ion === 1
          ? { en: 'insoluble; turns brown at the surface', bn: 'অদ্রবণীয়; উপরিভাগ বাদামি হয়' }
          : { en: 'insoluble', bn: 'অদ্রবণীয়' };
    const chosen = p.ion >= 0;
    const correct = chosen && p.ion === s.ion;
    const verdict = optionText(CATION_CHOICES, p.ion);
    const latest = latestBy(ctx.rows, '__key');
    const pptColor = s.ion === 1 && excess ? blendColors(cat.ppt, '#8a5a2b', 0.35) : cat.ppt;
    const tubes: TubeView[] = CATION_SAMPLES.map((smp, i) => {
      const rec = latest.get(String(i));
      if (i === si) {
        const liquid = s.ion === 0 || s.ion === 2 ? blendColors(smp.liquid, '#eef4f9', formed * 0.8) : smp.liquid;
        return { label: letters[i], liquid, level: 0.34 + drops * 0.007, cloud: amount * 0.8, cloudColor: pptColor, ppt: amount * 0.1, pptColor, active: true };
      }
      if (!rec) return { label: letters[i], liquid: smp.liquid, level: 0.34 };
      const recAmount = num(rec, '__amount') ?? 0;
      const c = CATIONS[smp.ion];
      return { label: letters[i], liquid: '#eef4f9', level: 0.42, ppt: recAmount * 0.12, pptColor: c.ppt, cloud: recAmount * 0.3, cloudColor: c.ppt, mark: markOf(rec) };
    });
    const view: TubesView = { tubes, dropper: { tube: si, color: '#eef5ff', label: 'NaOH' } };
    return {
      row: {
        ...tx('sample', `Solution ${letters[si]}`, `দ্রবণ ${letters[si]}`),
        ...tx('few', fewText.en, fewText.bn),
        ...tx('excess', excessText.en, excessText.bn),
        ...tx('ion', verdict.en, verdict.bn),
        ...tx('actual', s.salt, s.salt),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0,
        __amount: round(amount, 3)
      },
      live: [
        { en: 'Precipitate', bn: 'অধঃক্ষেপ', value: drops ? cat.en : '—', valueBn: drops ? cat.bn : '—', tone: 'info' },
        { en: 'In excess', bn: 'অতিরিক্তে', value: excessText.en, valueBn: excessText.bn },
        { en: 'NaOH added', bn: 'যোগ করা NaOH', value: drops, unit: 'drops' },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        drops === 0
          ? status('info', 'Add NaOH drop by drop and watch the colour of the precipitate.', 'ফোঁটায় ফোঁটায় NaOH দাও এবং অধঃক্ষেপের রং লক্ষ করো।')
          : !excess
            ? status('info', `${cat.en[0].toUpperCase()}${cat.en.slice(1)} precipitate. Keep adding NaOH until it is in excess (12+ drops) — does it dissolve?`, `${cat.bn} অধঃক্ষেপ। NaOH অতিরিক্ত (১২+ ফোঁটা) না হওয়া পর্যন্ত দিতে থাকো — অধঃক্ষেপ কি দ্রবীভূত হয়?`)
            : chosen
              ? status('info', `Your conclusion: ${verdict.en} — record it.`, `তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
              : status('info', `${cat.en[0].toUpperCase()}${cat.en.slice(1)} precipitate, ${excessText.en} in excess. Which cation is it?`, `${cat.bn} অধঃক্ষেপ, অতিরিক্তে ${excessText.bn}। ক্যাটায়নটি কী?`),
      ready: excess && chosen,
      correct
    };
  },
  result: identifyResult(5, 'Cations identified correctly', 'সঠিকভাবে শনাক্ত ক্যাটায়ন'),
  solve: (p) => ({ ...p, drops: Math.max(14, p.drops), ion: CATION_SAMPLES[idx(p.sample, CATION_SAMPLES.length)].ion })
};

/* ------------------------------------------------------------------ */
/* Carbonate / hydrogencarbonate                                         */
/* ------------------------------------------------------------------ */

const CARB_SAMPLES = [
  { salt: 'NaHCO₃', kind: 1, solid: '#f8f9f7' },
  { salt: 'NaCl', kind: 2, solid: '#f3f6f8' },
  { salt: 'Na₂CO₃', kind: 0, solid: '#f1f7fb' },
  { salt: 'CaCO₃', kind: 0, solid: '#f6f7f4' }
];
const CARB_CHOICES = [CHOOSE, opt(0, 'CO₃²⁻ (carbonate)', 'CO₃²⁻ (কার্বনেট)'), opt(1, 'HCO₃⁻ (hydrogencarbonate)', 'HCO₃⁻ (হাইড্রোজেন কার্বনেট)'), opt(2, 'Neither', 'কোনোটিই নয়')];
const CARB_TESTS = [
  opt(0, 'Add dilute HCl', 'লঘু HCl দাও'),
  opt(1, 'Heat the dry solid', 'শুষ্ক কঠিন উত্তপ্ত করো'),
  opt(2, 'Add MgSO₄ (cold)', 'MgSO₄ দাও (ঠান্ডায়)')
];

type CarbObs = { fizz: number; milky: number; ppt: number; drops: boolean; en: string; bn: string };
function carbonateObservation(salt: string, test: number): CarbObs {
  const none = { fizz: 0, milky: 0, ppt: 0, drops: false };
  if (test === 0) {
    if (salt === 'NaCl') return { ...none, en: 'no fizzing; limewater stays clear', bn: 'বুদবুদ নেই; চুনের পানি স্বচ্ছ' };
    return { ...none, fizz: salt === 'CaCO₃' ? 0.6 : 0.9, milky: 1, en: 'brisk fizzing; gas turns limewater milky (CO₂)', bn: 'তীব্র বুদবুদ; গ্যাস চুনের পানি ঘোলা করে (CO₂)' };
  }
  if (test === 1) {
    if (salt === 'NaHCO₃') return { ...none, fizz: 0.25, milky: 1, drops: true, en: 'CO₂ given off (limewater milky); water droplets at the cool mouth', bn: 'CO₂ বের হয় (চুনের পানি ঘোলা); ঠান্ডা মুখে পানির ফোঁটা' };
    if (salt === 'NaCl') return { ...none, en: 'crackles (decrepitation); no gas', bn: 'চটচট শব্দ (ডিক্রেপিটেশন); গ্যাস নেই' };
    if (salt === 'CaCO₃') return { ...none, en: 'no change in a Bunsen-heated test tube (needs > 800 °C)', bn: 'বুনসেন-উত্তপ্ত টেস্টটিউবে পরিবর্তন নেই (৮০০ °C-এর বেশি লাগে)' };
    return { ...none, en: 'no change — sodium carbonate is stable to heat', bn: 'পরিবর্তন নেই — সোডিয়াম কার্বনেট তাপে স্থিতিশীল' };
  }
  if (salt === 'Na₂CO₃') return { ...none, ppt: 1, en: 'white precipitate (MgCO₃) in the cold', bn: 'ঠান্ডায় সাদা অধঃক্ষেপ (MgCO₃)' };
  if (salt === 'NaHCO₃') return { ...none, en: 'no precipitate in the cold (forms only on boiling)', bn: 'ঠান্ডায় অধঃক্ষেপ নেই (কেবল ফুটালে হয়)' };
  if (salt === 'CaCO₃') return { ...none, en: 'insoluble solid — no change', bn: 'অদ্রবণীয় কঠিন — পরিবর্তন নেই' };
  return { ...none, en: 'no precipitate', bn: 'অধঃক্ষেপ নেই' };
}

function carbCaption(latest: Map<string, ChemRow>, bn: boolean): string {
  return CARB_SAMPLES.map((_, i) => {
    const rec = latest.get(String(i));
    const mark = rec ? (num(rec, '__correct') === 1 ? ' ✓' : ' ✗') : '';
    return `${bn ? 'কঠিন' : 'Solid'} ${letters[i]}${mark}`;
  }).join('   ');
}

const carbonateTest: ChemPracticalModel = {
  slug: 'carbonate-test',
  scene: 'tubes',
  variant: 'carbonate',
  howTo_en:
    'Test each solid with dilute acid (does the gas turn limewater milky?), by heating the dry solid, and with cold magnesium sulphate solution. Acid alone cannot separate carbonate from hydrogencarbonate — combine at least two tests before you decide.',
  howTo_bn:
    'প্রতিটি কঠিন পদার্থ লঘু অ্যাসিড দিয়ে (গ্যাসটি কি চুনের পানি ঘোলা করে?), শুষ্ক অবস্থায় উত্তপ্ত করে এবং ঠান্ডা ম্যাগনেসিয়াম সালফেট দ্রবণ দিয়ে পরীক্ষা করো। শুধু অ্যাসিড দিয়ে কার্বনেট আর হাইড্রোজেন কার্বনেট আলাদা করা যায় না — সিদ্ধান্তের আগে অন্তত দুটি পরীক্ষা মেলাও।',
  formula: '2NaHCO₃ —Δ→ Na₂CO₃ + H₂O + CO₂ · CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O',
  controls: [
    { key: 'sample', en: 'Solid', bn: 'কঠিন পদার্থ', default: 0, options: CARB_SAMPLES.map((_, i) => opt(i, `Solid ${letters[i]}`, `কঠিন ${letters[i]}`)) },
    { key: 'test', en: 'Test', bn: 'পরীক্ষা', default: 0, options: CARB_TESTS },
    { key: 'ion', en: 'Your conclusion: the solid contains…', bn: 'তোমার সিদ্ধান্ত: কঠিনে আছে…', kind: 'inference', default: -1, options: CARB_CHOICES }
  ],
  tasks: [
    { en: 'A · HCl', bn: 'A · HCl', set: { sample: 0, test: 0 } },
    { en: 'A · heat', bn: 'A · তাপ', set: { sample: 0, test: 1 } },
    { en: 'B · HCl', bn: 'B · HCl', set: { sample: 1, test: 0 } },
    { en: 'C · HCl', bn: 'C · HCl', set: { sample: 2, test: 0 } },
    { en: 'C · heat', bn: 'C · তাপ', set: { sample: 2, test: 1 } },
    { en: 'D · HCl', bn: 'D · HCl', set: { sample: 3, test: 0 } }
  ],
  columns: [
    { key: 'sample', en: 'Solid', bn: 'কঠিন' },
    { key: 'test', en: 'Test', bn: 'পরীক্ষা' },
    { key: 'obs', en: 'Observation', bn: 'পর্যবেক্ষণ' },
    { key: 'ion', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'actual', en: 'Actually', bn: 'আসলে' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 6,
  compute: (p, _noise, ctx) => {
    const si = idx(p.sample, CARB_SAMPLES.length);
    const s = CARB_SAMPLES[si];
    const test = idx(p.test, 3);
    const obs = carbonateObservation(s.salt, test);
    const chosen = p.ion >= 0;
    const correct = chosen && p.ion === s.kind;
    const verdict = optionText(CARB_CHOICES, p.ion);
    const testText = optionText(CARB_TESTS, test);
    const sampleTube: TubeView =
      test === 2
        ? { label: letters[si], sub: '+ MgSO₄', liquid: '#eef4f9', level: 0.42, cloud: obs.ppt * 0.7, cloudColor: '#fbfcfd', ppt: obs.ppt * 0.1, pptColor: '#fbfcfd', solid: s.salt === 'CaCO₃' ? { kind: 'chips', color: s.solid } : undefined, active: true }
        : test === 1
          ? { label: letters[si], sub: 'Δ', level: 0, solid: { kind: 'powder', color: s.solid }, bubbles: 0, fumes: obs.drops ? 0.25 : 0, fumeColor: '#e8f3fb', warm: true, active: true }
          : { label: letters[si], sub: '+ HCl', liquid: '#eef4f9', level: 0.36, bubbles: obs.fizz, solid: { kind: s.salt === 'CaCO₃' ? 'chips' : 'powder', color: s.solid, amount: obs.fizz ? 0.6 : 1 }, active: true };
    const tubes: TubeView[] = [sampleTube];
    if (test !== 2) tubes.push({ label: 'Ca(OH)₂', labelBn: 'চুনের পানি', liquid: '#e9f1f6', level: 0.45, cloud: obs.milky * 0.85, cloudColor: '#fbfcfd', bubbles: obs.milky ? 0.35 : 0 });
    const latest = latestBy(ctx.rows, '__key');
    const view: TubesView = {
      tubes,
      delivery: test !== 2 ? { from: 0, to: 1 } : undefined,
      burner: test === 1 ? 0 : undefined,
      dropper: test === 1 ? undefined : { tube: 0, color: '#eef4f9', label: test === 0 ? 'HCl' : 'MgSO₄' },
      caption: carbCaption(latest, false),
      captionBn: carbCaption(latest, true)
    };
    return {
      row: {
        ...tx('sample', `Solid ${letters[si]}`, `কঠিন ${letters[si]}`),
        ...tx('test', testText.en, testText.bn),
        ...tx('obs', obs.en, obs.bn),
        ...tx('ion', verdict.en, verdict.bn),
        ...tx('actual', s.salt, s.salt),
        check: tick(correct),
        __key: si,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Observation', bn: 'পর্যবেক্ষণ', value: obs.en, valueBn: obs.bn, tone: 'info' },
        { en: 'Limewater', bn: 'চুনের পানি', value: test === 2 ? '—' : obs.milky ? 'milky' : 'clear', valueBn: test === 2 ? '—' : obs.milky ? 'ঘোলা' : 'স্বচ্ছ' },
        { en: 'Test', bn: 'পরীক্ষা', value: testText.en, valueBn: testText.bn },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—', valueBn: chosen ? verdict.bn : '—' }
      ],
      view: view as unknown as Record<string, unknown>,
      status: chosen
        ? status('info', `${obs.en[0].toUpperCase()}${obs.en.slice(1)}. Your conclusion: ${verdict.en} — record it.`, `${obs.bn}। তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
        : status('info', `${obs.en[0].toUpperCase()}${obs.en.slice(1)}. Enough evidence? If not, try another test before deciding.`, `${obs.bn}। প্রমাণ কি যথেষ্ট? না হলে সিদ্ধান্তের আগে আরেকটি পরীক্ষা করো।`),
      ready: chosen,
      correct
    };
  },
  result: identifyResult(4, 'Solids identified correctly', 'সঠিকভাবে শনাক্ত কঠিন'),
  solve: (p) => ({ ...p, ion: CARB_SAMPLES[idx(p.sample, CARB_SAMPLES.length)].kind })
};

/* ------------------------------------------------------------------ */
/* Gas identification                                                    */
/* ------------------------------------------------------------------ */

const GASES = [
  { gas: 'H₂', tint: '#eef7ff' },
  { gas: 'O₂', tint: '#eaf6ff' },
  { gas: 'CO₂', tint: '#eef2f5' },
  { gas: 'NH₃', tint: '#f1f8f4' },
  { gas: 'Cl₂', tint: '#d9e889' }
];
const JARS = [2, 0, 4, 1, 3];
const GAS_TESTS = [
  opt(0, 'Burning splint', 'জ্বলন্ত কাঠি'),
  opt(1, 'Glowing splint', 'ধূমায়িত (শিখাহীন) কাঠি'),
  opt(2, 'Limewater (shake)', 'চুনের পানি (ঝাঁকাও)'),
  opt(3, 'Damp red litmus', 'ভেজা লাল লিটমাস'),
  opt(4, 'Damp blue litmus', 'ভেজা নীল লিটমাস')
];
const GAS_CHOICES = [CHOOSE, ...GASES.map((g, i) => opt(i, g.gas, g.gas))];

type GasResult = { kind: 'pop' | 'bright' | 'relight' | 'out' | 'milky' | 'blue' | 'red' | 'bleach' | 'none'; en: string; bn: string };
const NONE: GasResult = { kind: 'none', en: 'no change', bn: 'কোনো পরিবর্তন নেই' };
export function gasTestResult(gas: number, test: number): GasResult {
  const table: GasResult[][] = [
    [
      { kind: 'pop', en: 'burns with a squeaky pop', bn: 'চিঁ শব্দে পপ করে জ্বলে' },
      { kind: 'out', en: 'glow goes out (no relight)', bn: 'আভা নিভে যায় (জ্বলে ওঠে না)' },
      NONE,
      NONE,
      NONE
    ],
    [
      { kind: 'bright', en: 'splint burns more brightly', bn: 'কাঠি আরও উজ্জ্বল হয়ে জ্বলে' },
      { kind: 'relight', en: 'glowing splint relights', bn: 'ধূমায়িত কাঠি আবার জ্বলে ওঠে' },
      NONE,
      NONE,
      NONE
    ],
    [
      { kind: 'out', en: 'flame goes out', bn: 'শিখা নিভে যায়' },
      { kind: 'out', en: 'glow goes out', bn: 'আভা নিভে যায়' },
      { kind: 'milky', en: 'limewater turns milky', bn: 'চুনের পানি ঘোলা হয়' },
      NONE,
      { kind: 'red', en: 'turns faintly red', bn: 'হালকা লাল হয়' }
    ],
    [
      { kind: 'out', en: 'flame goes out', bn: 'শিখা নিভে যায়' },
      { kind: 'out', en: 'glow goes out', bn: 'আভা নিভে যায়' },
      NONE,
      { kind: 'blue', en: 'red litmus turns blue (pungent smell)', bn: 'লাল লিটমাস নীল হয় (ঝাঁঝালো গন্ধ)' },
      NONE
    ],
    [
      { kind: 'out', en: 'flame goes out', bn: 'শিখা নিভে যায়' },
      { kind: 'out', en: 'glow goes out', bn: 'আভা নিভে যায়' },
      NONE,
      { kind: 'bleach', en: 'litmus is bleached white', bn: 'লিটমাস বিরঞ্জিত হয়ে সাদা হয়' },
      { kind: 'bleach', en: 'turns red, then bleached white', bn: 'প্রথমে লাল, তারপর বিরঞ্জিত হয়ে সাদা' }
    ]
  ];
  return table[gas][test];
}

const gasIdentification: ChemPracticalModel = {
  slug: 'gas-identification',
  scene: 'gasJar',
  howTo_en:
    'Five gas jars A–E hold hydrogen, oxygen, carbon dioxide, ammonia and chlorine — in some order. Choose a jar and a test, watch what happens, and name the gas. Use as many tests as you need; only your latest conclusion for each jar counts.',
  howTo_bn:
    'পাঁচটি গ্যাসজার A–E-তে হাইড্রোজেন, অক্সিজেন, কার্বন ডাই-অক্সাইড, অ্যামোনিয়া ও ক্লোরিন আছে — কোনো এক ক্রমে। একটি জার ও একটি পরীক্ষা বেছে নাও, কী ঘটে দেখো এবং গ্যাসটির নাম বলো। যত খুশি পরীক্ষা করো; প্রতিটি জারের শেষ সিদ্ধান্তটিই গণনা হবে।',
  formula: 'H₂: pop · O₂: relights · CO₂: limewater milky · NH₃: red litmus → blue · Cl₂: bleaches',
  controls: [
    { key: 'jar', en: 'Gas jar', bn: 'গ্যাসজার', default: 0, options: JARS.map((_, i) => opt(i, `Jar ${letters[i]}`, `জার ${letters[i]}`)) },
    { key: 'test', en: 'Test', bn: 'পরীক্ষা', default: 0, options: GAS_TESTS },
    { key: 'gas', en: 'Your conclusion: the gas is…', bn: 'তোমার সিদ্ধান্ত: গ্যাসটি…', kind: 'inference', default: -1, options: GAS_CHOICES }
  ],
  tasks: JARS.map((_, i) => ({ en: `Jar ${letters[i]}`, bn: `জার ${letters[i]}`, set: { jar: i } })),
  columns: [
    { key: 'jar', en: 'Jar', bn: 'জার' },
    { key: 'test', en: 'Test', bn: 'পরীক্ষা' },
    { key: 'obs', en: 'Observation', bn: 'পর্যবেক্ষণ' },
    { key: 'gas', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'actual', en: 'Actually', bn: 'আসলে' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 5,
  compute: (p, _noise, ctx) => {
    const ji = idx(p.jar, JARS.length);
    const gas = JARS[ji];
    const test = idx(p.test, GAS_TESTS.length);
    const res = gasTestResult(gas, test);
    const chosen = p.gas >= 0;
    const correct = chosen && p.gas === gas;
    const verdict = optionText(GAS_CHOICES, p.gas);
    const testText = optionText(GAS_TESTS, test);
    const latest = latestBy(ctx.rows, '__key');
    return {
      row: {
        ...tx('jar', `Jar ${letters[ji]}`, `জার ${letters[ji]}`),
        ...tx('test', testText.en, testText.bn),
        ...tx('obs', res.en, res.bn),
        ...tx('gas', verdict.en, verdict.bn),
        ...tx('actual', GASES[gas].gas, GASES[gas].gas),
        check: tick(correct),
        __key: ji,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Observation', bn: 'পর্যবেক্ষণ', value: res.en, valueBn: res.bn, tone: 'info' },
        { en: 'Test', bn: 'পরীক্ষা', value: testText.en, valueBn: testText.bn },
        { en: 'Jar', bn: 'জার', value: letters[ji] },
        { en: 'Conclusion', bn: 'সিদ্ধান্ত', value: chosen ? verdict.en : '—' }
      ],
      view: {
        jar: ji,
        test,
        result: res.kind,
        jars: JARS.map((g, i) => ({ label: letters[i], tint: GASES[g].tint, mark: markOf(latest.get(String(i))) }))
      },
      status: chosen
        ? status('info', `${testText.en}: ${res.en}. Your conclusion: ${verdict.en} — record it.`, `${testText.bn}: ${res.bn}। তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
        : status('info', `${testText.en}: ${res.en}. Which gas is it? Run another test if you are unsure.`, `${testText.bn}: ${res.bn}। গ্যাসটি কোনটি? নিশ্চিত না হলে আরেকটি পরীক্ষা করো।`),
      ready: chosen,
      correct
    };
  },
  result: identifyResult(5, 'Gases identified correctly', 'সঠিকভাবে শনাক্ত গ্যাস'),
  solve: (p) => {
    // each gas has one decisive test, listed in the same order as the gases
    const gas = JARS[idx(p.jar, JARS.length)];
    return { ...p, test: gas, gas };
  }
};

/* ------------------------------------------------------------------ */
/* Extra: Le Chatelier — iron(III) thiocyanate                           */
/* ------------------------------------------------------------------ */

const EQ_A = 0.002;
const EQ_B = 0.002;
const EQ_CHANGES = [
  { en: 'Reference', bn: 'তুলনার নল', a: EQ_A, b: EQ_B, k: 140, shift: -1 },
  { en: '+ FeCl₃', bn: '+ FeCl₃', a: EQ_A + 0.004, b: EQ_B, k: 140, shift: 0 },
  { en: '+ KSCN', bn: '+ KSCN', a: EQ_A, b: EQ_B + 0.004, k: 140, shift: 0 },
  { en: '+ NaOH', bn: '+ NaOH', a: EQ_A * 0.25, b: EQ_B, k: 140, shift: 1 },
  { en: 'Hot bath', bn: 'গরম পানিতে', a: EQ_A, b: EQ_B, k: 60, shift: 1 },
  { en: 'Ice bath', bn: 'বরফ-পানিতে', a: EQ_A, b: EQ_B, k: 230, shift: 0 }
];
const SHIFT_CHOICES = [CHOOSE, opt(0, 'Shifts right (deeper red)', 'ডানে সরে (গাঢ় লাল)'), opt(1, 'Shifts left (paler)', 'বামে সরে (হালকা)'), opt(2, 'No shift', 'সরে না')];

export function thiocyanateEquilibrium(a: number, b: number, k: number): number {
  const s = k * (a + b) + 1;
  return (s - Math.sqrt(s * s - 4 * k * k * a * b)) / (2 * k);
}
const complexColour = (x: number) => blendColors('#f3e3b8', '#8e0f12', clamp(Math.pow(x / 9e-4, 0.75), 0, 1));

const ironThiocyanate: ChemPracticalModel = {
  slug: 'iron-thiocyanate-equilibrium',
  scene: 'tubes',
  variant: 'equilibrium',
  howTo_en:
    'A pale blood-red solution of Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ is shared between six tubes. Change one condition in each of tubes 2–6, compare the colour with the reference tube and decide which way the equilibrium shifted.',
  howTo_bn:
    'Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ এর হালকা রক্ত-লাল দ্রবণ ছয়টি নলে ভাগ করা হয়েছে। ২–৬ নম্বর নলের প্রতিটিতে একটি শর্ত বদলাও, তুলনার নলের সাথে রং মিলাও এবং ঠিক করো সাম্যাবস্থা কোন দিকে সরল।',
  formula: 'Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ (blood red) · ΔH < 0',
  controls: [
    { key: 'tube', en: 'Tube', bn: 'নল', default: 1, options: EQ_CHANGES.map((c, i) => opt(i, `${i + 1}: ${c.en}`, `${i + 1}: ${c.bn}`)) },
    { key: 'shift', en: 'Your conclusion: the equilibrium…', bn: 'তোমার সিদ্ধান্ত: সাম্যাবস্থা…', kind: 'inference', default: -1, options: SHIFT_CHOICES }
  ],
  tasks: EQ_CHANGES.slice(1).map((c, i) => ({ en: c.en, bn: c.bn, set: { tube: i + 1 } })),
  columns: [
    { key: 'change', en: 'Change', bn: 'পরিবর্তন' },
    { key: 'colour', en: 'Colour vs reference', bn: 'তুলনার নলের তুলনায় রং' },
    { key: 'x', en: '[Fe(SCN)]²⁺', bn: '[Fe(SCN)]²⁺', unit: 'mM', digits: 3 },
    { key: 'shift', en: 'Conclusion', bn: 'সিদ্ধান্ত' },
    { key: 'check', en: 'Check', bn: 'যাচাই' }
  ],
  minReadings: 5,
  compute: (p, noise, ctx) => {
    const ti = idx(p.tube, EQ_CHANGES.length);
    const ch = EQ_CHANGES[ti];
    const x = thiocyanateEquilibrium(ch.a, ch.b, ch.k);
    const ref = thiocyanateEquilibrium(EQ_A, EQ_B, 140);
    const kc = x / ((ch.a - x) * (ch.b - x));
    const deeper = x > ref * 1.05;
    const paler = x < ref * 0.95;
    const colourText = ti === 0 ? { en: 'reference', bn: 'তুলনার রং' } : deeper ? { en: 'deeper red', bn: 'গাঢ় লাল' } : paler ? { en: 'paler', bn: 'হালকা' } : { en: 'unchanged', bn: 'অপরিবর্তিত' };
    const chosen = p.shift >= 0;
    const correct = ti > 0 && chosen && p.shift === ch.shift;
    const verdict = optionText(SHIFT_CHOICES, p.shift);
    const latest = latestBy(ctx.rows, '__key');
    const tubes: TubeView[] = EQ_CHANGES.map((c, i) => {
      const xi = thiocyanateEquilibrium(c.a, c.b, c.k);
      return {
        label: String(i + 1),
        sub: i === 0 ? 'ref' : c.en.replace(' bath', ''),
        subBn: i === 0 ? 'তুলনা' : c.bn.replace('-পানিতে', '').replace(' পানিতে', ''),
        liquid: complexColour(xi),
        level: 0.44,
        ppt: i === 3 ? 0.05 : 0,
        pptColor: '#a34a1f',
        cloud: i === 3 ? 0.12 : 0,
        cloudColor: '#a34a1f',
        warm: i === 4,
        active: i === ti,
        mark: markOf(latest.get(String(i)))
      };
    });
    const view: TubesView = { tubes, bath: ti === 4 ? { temp: 60, tube: 4 } : ti === 5 ? { temp: 2, tube: 5 } : undefined, dropper: ti >= 1 && ti <= 3 ? { tube: ti, color: ti === 1 ? '#c47a20' : '#eef4f9', label: ch.en.replace('+ ', '') } : undefined };
    return {
      row: {
        ...tx('change', ch.en, ch.bn),
        ...tx('colour', colourText.en, colourText.bn),
        x: round(x * 1000 + noise(0.002), 3),
        ...tx('shift', verdict.en, verdict.bn),
        check: tick(correct),
        __key: ti,
        __correct: correct ? 1 : 0
      },
      live: [
        { en: 'Colour', bn: 'রং', value: colourText.en, valueBn: colourText.bn, tone: 'info' },
        { en: '[Fe(SCN)]²⁺', bn: '[Fe(SCN)]²⁺', value: x * 1000, unit: 'mM', digits: 3 },
        { en: 'Kc', bn: 'Kc', value: kc, unit: 'L mol⁻¹', digits: 0 },
        { en: 'Temperature', bn: 'তাপমাত্রা', value: ti === 4 ? 60 : ti === 5 ? 2 : 25, unit: '°C' }
      ],
      view: view as unknown as Record<string, unknown>,
      status:
        ti === 0
          ? status('info', 'This is the reference tube — compare every other tube with it.', 'এটি তুলনার নল — অন্য প্রতিটি নল এর সাথে মিলিয়ে দেখো।')
          : chosen
            ? status('info', `The colour is ${colourText.en}. Your conclusion: ${verdict.en.toLowerCase()} — record it.`, `রং ${colourText.bn}। তোমার সিদ্ধান্ত: ${verdict.bn} — রেকর্ড করো।`)
            : status('info', `The colour is ${colourText.en} than the reference. Which way did the equilibrium shift? (Kc changes only with temperature.)`, `রং তুলনার নলের চেয়ে ${colourText.bn}। সাম্যাবস্থা কোন দিকে সরল? (Kc কেবল তাপমাত্রায় বদলায়।)`),
      ready: ti > 0 && chosen,
      correct
    };
  },
  result: identifyResult(5, 'Shifts predicted correctly', 'সঠিকভাবে নির্ণীত সাম্যাবস্থার সরণ'),
  solve: (p) => {
    const ti = Math.max(1, idx(p.tube, EQ_CHANGES.length));
    return { ...p, tube: ti, shift: EQ_CHANGES[ti].shift };
  }
};

export const qualitativeModels: ChemPracticalModel[] = [flameTest, halideTest, sulphateTest, cationTest, carbonateTest, gasIdentification, ironThiocyanate];
