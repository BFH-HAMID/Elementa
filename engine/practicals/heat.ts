import type { PracticalModel } from './types';
import { meanOf, num, round, sig } from './helpers';

const SW = 4186; // water J/(kg K)
const CAL_W = 0.085 * 385; // copper calorimeter heat capacity J/K
const ROOM = 25;

const settle = (from: number, to: number, t: number, tau: number) => to + (from - to) * Math.exp(-t / tau);

export const SOLIDS = [
  { en: 'Copper', bn: 'তামা', s: 385 },
  { en: 'Aluminium', bn: 'অ্যালুমিনিয়াম', s: 900 },
  { en: 'Iron', bn: 'লোহা', s: 450 },
  { en: 'Brass', bn: 'পিতল', s: 380 },
  { en: 'Lead', bn: 'সিসা', s: 128 }
];
const solidOptions = SOLIDS.map((m, i) => ({ value: i, en: m.en, bn: m.bn }));

function mixTemperature(ms: number, s: number, ts: number, mw: number, tw: number) {
  const cw = mw * SW + CAL_W;
  return (ms * s * ts + cw * tw) / (ms * s + cw);
}

/* ------------------------------------------------------------------ */
/* Specific heat by method of mixtures                                  */
/* ------------------------------------------------------------------ */

export const specificHeatMixtures: PracticalModel = {
  slug: 'specific-heat-calorimeter',
  scene: 'calorimeter',
  variant: 'mixtures',
  animated: true,
  howTo_en: 'The hot sample is dropped into the calorimeter. Stir and wait until the thermometer settles at the final temperature, then record. Change the sample mass and repeat.',
  howTo_bn: 'গরম নমুনাটি ক্যালরিমিটারে ফেলা হয়। নাড়ো এবং থার্মোমিটার চূড়ান্ত তাপমাত্রায় স্থির হলে রেকর্ড করো। নমুনার ভর বদলে আবার করো।',
  controls: [
    { key: 'metal', en: 'Sample metal', bn: 'নমুনা ধাতু', default: 0, options: solidOptions },
    { key: 'm', en: 'Sample mass', bn: 'নমুনার ভর', min: 50, max: 200, step: 10, unit: 'g', default: 100 },
    { key: 'mw', en: 'Water mass', bn: 'পানির ভর', min: 100, max: 250, step: 10, unit: 'g', default: 150 },
    { key: 't1', en: 'Sample temperature T₁', bn: 'নমুনার তাপমাত্রা T₁', min: 80, max: 100, step: 1, unit: '°C', default: 100 }
  ],
  sweep: { key: 'm', values: [60, 80, 100, 120, 150] },
  minReadings: 4,
  compute(p, noise, ctx) {
    const metal = SOLIDS[p.metal] || SOLIDS[0];
    const ms = p.m / 1000;
    const mw = p.mw / 1000;
    const tf = mixTemperature(ms, metal.s, p.t1, mw, ROOM);
    const tWater = settle(ROOM, tf, ctx.elapsed, 1.4);
    const tSample = settle(p.t1, tf, ctx.elapsed, 0.9);
    const settled = ctx.elapsed > 5;
    const tfm = tWater + noise(0.04);
    const s = ((mw * SW + CAL_W) * (tfm - ROOM)) / (ms * (p.t1 - tfm));
    return {
      row: { sampleMassG: p.m, hotTempT1: p.t1, coldTempT2: ROOM, finalTempTf: round(tfm, 2), specHeatCalc: round(s, 1) },
      live: [
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: tWater, unit: '°C', digits: 2, tone: settled ? 'good' : 'warn' },
        { en: 'Sample', bn: 'নমুনা', value: tSample, unit: '°C', digits: 1 },
        { en: 'Water + calorimeter C', bn: 'পানি + ক্যালরিমিটার C', value: mw * SW + CAL_W, unit: 'J/K', digits: 0, tone: 'info' }
      ],
      view: { tWater, tSample, t1: p.t1, tf, mass: p.m, mw: p.mw, elapsed: ctx.elapsed, settled: settled ? 1 : 0, metal: p.metal },
      status: settled
        ? { en: 'Temperature steady — record the final temperature.', bn: 'তাপমাত্রা স্থির — চূড়ান্ত তাপমাত্রা রেকর্ড করো।', tone: 'good' }
        : { en: 'Stirring… the temperature is still rising.', bn: 'নাড়া হচ্ছে… তাপমাত্রা এখনও বাড়ছে।', tone: 'warn' },
      ready: settled
    };
  },
  result: {
    en: 'Specific heat of sample',
    bn: 'নমুনার আপেক্ষিক তাপ',
    unit: 'J/(kg·K)',
    digits: 0,
    compute: (rows) => meanOf(rows, 'specHeatCalc'),
    expected: (p) => (SOLIDS[p.metal] || SOLIDS[0]).s
  }
};

export const specificHeatSolid: PracticalModel = {
  slug: 'specific-heat-solid-radiation',
  scene: 'calorimeter',
  variant: 'mixtures',
  animated: true,
  howTo_en: 'Transfer the heated solid quickly into the calorimeter water, stir and record the steady final temperature. Repeat with different masses.',
  howTo_bn: 'উত্তপ্ত কঠিন বস্তুটি দ্রুত ক্যালরিমিটারের পানিতে স্থানান্তর করো, নাড়ো এবং স্থির চূড়ান্ত তাপমাত্রা রেকর্ড করো। ভিন্ন ভরে আবার করো।',
  controls: [
    { key: 'metal', en: 'Solid', bn: 'কঠিন বস্তু', default: 0, options: solidOptions },
    { key: 'm', en: 'Solid mass', bn: 'কঠিনের ভর', min: 0.05, max: 0.2, step: 0.01, unit: 'kg', default: 0.08, digits: 2 },
    { key: 'mw', en: 'Water mass', bn: 'পানির ভর', min: 0.1, max: 0.3, step: 0.01, unit: 'kg', default: 0.2, digits: 2 },
    { key: 't1', en: 'Solid temperature', bn: 'কঠিনের তাপমাত্রা', min: 80, max: 100, step: 1, unit: '°C', default: 95 }
  ],
  sweep: { key: 'm', values: [0.06, 0.08, 0.1, 0.12, 0.15] },
  minReadings: 4,
  compute(p, noise, ctx) {
    const metal = SOLIDS[p.metal] || SOLIDS[0];
    const tf = mixTemperature(p.m, metal.s, p.t1, p.mw, ROOM);
    const tWater = settle(ROOM, tf, ctx.elapsed, 1.4);
    const tSample = settle(p.t1, tf, ctx.elapsed, 0.9);
    const settled = ctx.elapsed > 5;
    const tfm = tWater + noise(0.04);
    const s = ((p.mw * SW + CAL_W) * (tfm - ROOM)) / (p.m * (p.t1 - tfm));
    return {
      row: {
        solidMassKg: round(p.m, 3),
        waterMassKg: round(p.mw, 3),
        solidTempC: p.t1,
        waterTempC: ROOM,
        finalTempC: round(tfm, 2),
        specificHeat: round(s, 1)
      },
      live: [
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: tWater, unit: '°C', digits: 2, tone: settled ? 'good' : 'warn' },
        { en: 'Solid', bn: 'কঠিন বস্তু', value: tSample, unit: '°C', digits: 1 },
        { en: 'Rise ΔT', bn: 'বৃদ্ধি ΔT', value: tWater - ROOM, unit: '°C', digits: 2 }
      ],
      view: { tWater, tSample, t1: p.t1, tf, mass: p.m * 1000, mw: p.mw * 1000, elapsed: ctx.elapsed, settled: settled ? 1 : 0, metal: p.metal },
      status: settled
        ? { en: 'Steady final temperature — record.', bn: 'চূড়ান্ত তাপমাত্রা স্থির — রেকর্ড করো।', tone: 'good' }
        : { en: 'Stirring… wait for the reading to settle.', bn: 'নাড়া হচ্ছে… পাঠ স্থির হতে দাও।', tone: 'warn' },
      ready: settled
    };
  },
  result: {
    en: 'Specific heat of solid',
    bn: 'কঠিনের আপেক্ষিক তাপ',
    unit: 'J/(kg·K)',
    digits: 0,
    compute: (rows) => meanOf(rows, 'specificHeat'),
    expected: (p) => (SOLIDS[p.metal] || SOLIDS[0]).s
  }
};

/* ------------------------------------------------------------------ */
/* Joule heating — electrical equivalent & mechanical equivalent J      */
/* ------------------------------------------------------------------ */

const LOSS_K = 0.02; // W/K
const heatingTemp = (power: number, C: number, t: number) => ROOM + (power / LOSS_K) * (1 - Math.exp((-LOSS_K * t) / C));

export const jouleElectrical: PracticalModel = {
  slug: 'joules-law-electrical-equivalent',
  scene: 'calorimeter',
  variant: 'joule',
  animated: true,
  timeScale: 30,
  howTo_en: 'The heater is on (clock runs 30× faster). Record the temperature every minute or so. Compare electrical work VIt with heat gained mcΔT.',
  howTo_bn: 'হিটার চালু (ঘড়ি ৩০× দ্রুত চলছে)। প্রায় প্রতি মিনিটে তাপমাত্রা রেকর্ড করো। বৈদ্যুতিক কাজ VIt এর সাথে গৃহীত তাপ mcΔT তুলনা করো।',
  controls: [{ key: 'v', en: 'Heater voltage', bn: 'হিটারের ভোল্টেজ', min: 3, max: 12, step: 0.5, unit: 'V', default: 6 }],
  minReadings: 5,
  compute(p, noise, ctx) {
    const R = 4;
    const I = p.v / R;
    const C = 0.15 * SW + CAL_W;
    const t = Math.round(ctx.elapsed * 30);
    const T = heatingTemp(p.v * I, C, t);
    const Tm = T + noise(0.04);
    const ok = t >= 30;
    return {
      row: { timeSec: t, tempC: round(Tm, 1), elecWorkJ: round(p.v * I * t, 0), heatQJoules: round(C * (Tm - ROOM), 0) },
      live: [
        { en: 'Clock', bn: 'ঘড়ি', value: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, tone: 'info' },
        { en: 'Temperature', bn: 'তাপমাত্রা', value: T, unit: '°C', digits: 2 },
        { en: 'Current I', bn: 'প্রবাহ I', value: I, unit: 'A', digits: 2 },
        { en: 'Power VI', bn: 'ক্ষমতা VI', value: p.v * I, unit: 'W', digits: 2 }
      ],
      view: { tWater: T, t, v: p.v, i: I, heating: 1 },
      status: ok
        ? { en: 'Heating — record a reading, then wait ~1 min (sim time) for the next.', bn: 'উত্তপ্ত হচ্ছে — একটি পাঠ নাও, পরেরটির জন্য ~১ মিনিট (সিম সময়) অপেক্ষা করো।', tone: 'good' }
        : { en: 'Heater just switched on — wait a little.', bn: 'হিটার সবে চালু হয়েছে — একটু অপেক্ষা করো।', tone: 'info' },
      ready: ok
    };
  },
  result: {
    en: 'Ratio W / H (electrical work ÷ heat)',
    bn: 'অনুপাত W / H (বৈদ্যুতিক কাজ ÷ তাপ)',
    unit: '',
    digits: 3,
    compute(rows) {
      const ratios: number[] = [];
      for (const r of rows) {
        const w = num(r, 'elecWorkJ');
        const h = num(r, 'heatQJoules');
        if (w !== null && h !== null && h > 50) ratios.push(w / h);
      }
      return ratios.length ? ratios.reduce((s, v) => s + v, 0) / ratios.length : null;
    },
    expected: 1
  }
};

export const mechanicalEquivalent: PracticalModel = {
  slug: 'mechanical-equivalent-heat-radiation',
  scene: 'calorimeter',
  variant: 'joule',
  animated: true,
  timeScale: 30,
  howTo_en: 'Pass a steady current through the heater coil (clock 30× faster). Record the temperature rise at intervals. J = VIt / H (H in calories).',
  howTo_bn: 'হিটার কয়েলে স্থির প্রবাহ চালাও (ঘড়ি ৩০× দ্রুত)। নির্দিষ্ট বিরতিতে তাপমাত্রা বৃদ্ধি রেকর্ড করো। J = VIt / H (H ক্যালরিতে)।',
  controls: [{ key: 'v', en: 'Voltage V', bn: 'ভোল্টেজ V', min: 3, max: 12, step: 0.5, unit: 'V', default: 6 }],
  minReadings: 5,
  compute(p, noise, ctx) {
    const R = 6;
    const I = p.v / R;
    const mw = 0.2;
    const C = mw * SW + CAL_W;
    const waterEqG = (CAL_W / SW) * 1000;
    const t = Math.round(ctx.elapsed * 30);
    const T = heatingTemp(p.v * I, C, t);
    const dT = T - ROOM + noise(0.03);
    const H = (mw * 1000 + waterEqG) * dT;
    const ok = t >= 60;
    return {
      row: { voltageV: p.v, currentA: round(I, 3), timeS: t, deltaTC: round(dT, 2), JCalc: round((p.v * I * t) / Math.max(H, 1e-6), 3) },
      live: [
        { en: 'Clock', bn: 'ঘড়ি', value: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, tone: 'info' },
        { en: 'Rise ΔT', bn: 'বৃদ্ধি ΔT', value: T - ROOM, unit: '°C', digits: 2 },
        { en: 'Current I', bn: 'প্রবাহ I', value: I, unit: 'A', digits: 2 },
        { en: 'Water equivalent', bn: 'পানি সমতুল', value: waterEqG, unit: 'g', digits: 1 }
      ],
      view: { tWater: T, t, v: p.v, i: I, heating: 1 },
      status: ok
        ? { en: 'Record readings at regular intervals.', bn: 'নির্দিষ্ট বিরতিতে পাঠ রেকর্ড করো।', tone: 'good' }
        : { en: 'Let the temperature rise at least 1 minute first.', bn: 'আগে অন্তত ১ মিনিট তাপমাত্রা বাড়তে দাও।', tone: 'info' },
      ready: ok
    };
  },
  result: {
    en: 'Mechanical equivalent of heat J',
    bn: 'তাপের যান্ত্রিক সমতা J',
    unit: 'J/cal',
    digits: 3,
    compute: (rows) => meanOf(rows.filter((r) => (num(r, 'deltaTC') ?? 0) > 0.5), 'JCalc'),
    expected: 4.186
  }
};

/* ------------------------------------------------------------------ */
/* Latent heat of fusion of ice                                         */
/* ------------------------------------------------------------------ */

const L_FUSION = 334000;

export const latentHeat: PracticalModel = {
  slug: 'latent-heat-fusion-radiation',
  scene: 'calorimeter',
  variant: 'ice',
  animated: true,
  howTo_en: 'Add dried ice pieces to the warm water and stir until all the ice melts. Record the lowest steady temperature. Repeat with different ice masses.',
  howTo_bn: 'গরম পানিতে শুকনো বরফ টুকরো দাও এবং সব বরফ গলা পর্যন্ত নাড়ো। সর্বনিম্ন স্থির তাপমাত্রা রেকর্ড করো। ভিন্ন বরফের ভরে আবার করো।',
  controls: [
    { key: 'mi', en: 'Ice mass', bn: 'বরফের ভর', min: 0.01, max: 0.05, step: 0.005, unit: 'kg', default: 0.02, digits: 3 },
    { key: 'mw', en: 'Water mass', bn: 'পানির ভর', min: 0.15, max: 0.3, step: 0.01, unit: 'kg', default: 0.2, digits: 2 },
    { key: 'ti', en: 'Initial water temp.', bn: 'পানির প্রাথমিক তাপমাত্রা', min: 30, max: 45, step: 1, unit: '°C', default: 35 }
  ],
  sweep: { key: 'mi', values: [0.01, 0.02, 0.03, 0.04, 0.05] },
  minReadings: 4,
  compute(p, noise, ctx) {
    const C = p.mw * SW + CAL_W;
    const tf = (C * p.ti - p.mi * L_FUSION) / (C + p.mi * SW);
    const allMelt = tf > 0;
    const finalT = allMelt ? tf : 0;
    const melted = Math.min(1, ctx.elapsed / 4.5);
    const tNow = settle(p.ti, finalT, ctx.elapsed, 1.5);
    const settled = ctx.elapsed > 6;
    const tfm = tNow + noise(0.04);
    const L = (C * (p.ti - tfm) - p.mi * SW * tfm) / p.mi;
    return {
      row: { waterMassKg: round(p.mw, 3), iceMassKg: round(p.mi, 3), initialTempC: p.ti, finalTempC: round(tfm, 2), latentHeat: Math.round(L) },
      live: [
        { en: 'Thermometer', bn: 'থার্মোমিটার', value: tNow, unit: '°C', digits: 2, tone: settled ? 'good' : 'warn' },
        { en: 'Ice melted', bn: 'বরফ গলেছে', value: Math.round(melted * 100), unit: '%' },
        { en: 'Water + calorimeter C', bn: 'পানি + ক্যালরিমিটার C', value: C, unit: 'J/K', digits: 0, tone: 'info' }
      ],
      view: { tWater: tNow, melted, mi: p.mi, elapsed: ctx.elapsed, settled: settled ? 1 : 0 },
      status: !allMelt
        ? { en: 'Too much ice — not all of it can melt. Use less ice or warmer water.', bn: 'বরফ বেশি — সব গলবে না। কম বরফ বা বেশি গরম পানি নাও।', tone: 'warn' }
        : settled
          ? { en: 'All ice melted, temperature steady — record.', bn: 'সব বরফ গলেছে, তাপমাত্রা স্থির — রেকর্ড করো।', tone: 'good' }
          : { en: 'Ice melting… keep stirring.', bn: 'বরফ গলছে… নাড়তে থাকো।', tone: 'warn' },
      ready: allMelt && settled
    };
  },
  result: {
    en: 'Latent heat of fusion L',
    bn: 'গলনের সুপ্ত তাপ L',
    unit: 'J/kg',
    digits: 0,
    compute: (rows) => meanOf(rows, 'latentHeat'),
    expected: L_FUSION
  }
};

/* ------------------------------------------------------------------ */
/* Specific heat of a liquid by cooling                                 */
/* ------------------------------------------------------------------ */

export const LIQUIDS = [
  { en: 'Kerosene', bn: 'কেরোসিন', s: 2100, rho: 0.8 },
  { en: 'Turpentine', bn: 'তারপিন', s: 1760, rho: 0.87 },
  { en: 'Glycerine', bn: 'গ্লিসারিন', s: 2430, rho: 1.26 },
  { en: 'Olive oil', bn: 'জলপাই তেল', s: 1970, rho: 0.92 }
];
const COOL_HA = 0.25;
const VOL_KG = 0.15; // 150 cm³ of water

export function coolingTimes(liquidIndex: number, start: number) {
  const liq = LIQUIDS[liquidIndex] || LIQUIDS[0];
  const ml = VOL_KG * liq.rho;
  const cw = VOL_KG * SW + CAL_W;
  const cl = ml * liq.s + CAL_W;
  const lnr = Math.log((start - ROOM) / (start - 10 - ROOM));
  return { ml, cw, cl, tw: (cw / COOL_HA) * lnr, tl: (cl / COOL_HA) * lnr, tauW: cw / COOL_HA, tauL: cl / COOL_HA };
}

export const liquidCooling: PracticalModel = {
  slug: 'specific-heat-liquid-cooling',
  scene: 'calorimeter',
  variant: 'cooling',
  animated: true,
  timeScale: 60,
  howTo_en: 'Equal volumes of water and the liquid cool side by side (clock 60× faster). When both have cooled through the 10 °C range, record the cooling rates.',
  howTo_bn: 'সমান আয়তনের পানি ও তরল পাশাপাশি ঠান্ডা হচ্ছে (ঘড়ি ৬০× দ্রুত)। দুটোই ১০ °C পরিসর পেরোলে শীতলীকরণের হার রেকর্ড করো।',
  controls: [
    { key: 'liq', en: 'Liquid', bn: 'তরল', default: 0, options: LIQUIDS.map((l, i) => ({ value: i, en: l.en, bn: l.bn })) },
    {
      key: 'start',
      en: 'Cooling range',
      bn: 'শীতলীকরণ পরিসর',
      default: 70,
      options: [
        { value: 70, en: '70→60 °C', bn: '৭০→৬০ °C' },
        { value: 65, en: '65→55 °C', bn: '৬৫→৫৫ °C' },
        { value: 60, en: '60→50 °C', bn: '৬০→৫০ °C' },
        { value: 55, en: '55→45 °C', bn: '৫৫→৪৫ °C' }
      ]
    }
  ],
  sweep: { key: 'start', values: [70, 65, 60, 55] },
  minReadings: 4,
  compute(p, noise, ctx) {
    const c = coolingTimes(p.liq, p.start);
    const simT = ctx.elapsed * 60;
    const T0 = p.start + 2;
    const pre = c.tauW * Math.log((T0 - ROOM) / (p.start - ROOM));
    const preL = c.tauL * Math.log((T0 - ROOM) / (p.start - ROOM));
    const tWater = ROOM + (T0 - ROOM) * Math.exp(-simT / c.tauW);
    const tLiquid = ROOM + (T0 - ROOM) * Math.exp(-simT / c.tauL);
    const done = simT >= pre + c.tw;
    const twm = c.tw + noise(1);
    const tlm = c.tl + noise(1);
    const rw = 10 / twm;
    const rl = 10 / tlm;
    const s = (c.cw * (rw / rl) - CAL_W) / c.ml;
    return {
      row: {
        massLiquidKg: round(c.ml, 3),
        rangeC: `${p.start}→${p.start - 10}`,
        rateLiquid: round(rl, 5),
        rateWater: round(rw, 5),
        specificHeat: Math.round(s)
      },
      live: [
        { en: 'Water', bn: 'পানি', value: tWater, unit: '°C', digits: 1 },
        { en: 'Liquid', bn: 'তরল', value: tLiquid, unit: '°C', digits: 1 },
        { en: 'Clock', bn: 'ঘড়ি', value: `${Math.floor(simT / 60)} min`, tone: 'info' }
      ],
      view: { tWater, tLiquid, simT, tauW: c.tauW, tauL: c.tauL, T0, start: p.start, preW: pre, preL, done: done ? 1 : 0, liq: p.liq },
      status: done
        ? { en: 'Both cooled through the range — record the rates.', bn: 'দুটোই পরিসর পেরিয়েছে — হার রেকর্ড করো।', tone: 'good' }
        : { en: 'Cooling… wait until the water has also fallen 10 °C.', bn: 'ঠান্ডা হচ্ছে… পানিও ১০ °C নামা পর্যন্ত অপেক্ষা করো।', tone: 'warn' },
      ready: done
    };
  },
  result: {
    en: 'Specific heat of liquid',
    bn: 'তরলের আপেক্ষিক তাপ',
    unit: 'J/(kg·K)',
    digits: 0,
    compute: (rows) => meanOf(rows, 'specificHeat'),
    expected: (p) => (LIQUIDS[p.liq] || LIQUIDS[0]).s
  }
};

/* ------------------------------------------------------------------ */
/* Thermal conductivity — Searle's bar (good conductor)                 */
/* ------------------------------------------------------------------ */

const SEARLE_BAR = { k: 390, r: 0.02, d: 0.1, Rh: 0.15, Rc: 0.1, tin: 25, collect: 120 };

export function searleSteady(flowGPerMin: number) {
  const A = Math.PI * SEARLE_BAR.r * SEARLE_BAR.r;
  const Rbar = SEARLE_BAR.d / (SEARLE_BAR.k * A);
  const mdot = flowGPerMin / 1000 / 60;
  const Rt = SEARLE_BAR.Rh + Rbar + SEARLE_BAR.Rc;
  const Q = (100 - SEARLE_BAR.tin) / (Rt + 1 / (2 * mdot * SW));
  const t1 = 100 - Q * SEARLE_BAR.Rh;
  const t2 = t1 - Q * Rbar;
  const tout = SEARLE_BAR.tin + Q / (mdot * SW);
  return { A, Q, t1, t2, tout, mdot };
}

export const searleConductivity: PracticalModel = {
  slug: 'thermal-conductivity-searle',
  scene: 'conduction',
  variant: 'searle',
  animated: true,
  howTo_en: 'Steam heats one end of the copper bar while water flows through the coil. Wait for steady state, then record the four temperatures and the water collected in 2 min.',
  howTo_bn: 'বাষ্প তামার দণ্ডের এক প্রান্ত গরম করছে আর কয়েলে পানি বইছে। স্থির অবস্থা পর্যন্ত অপেক্ষা করো, তারপর চারটি তাপমাত্রা ও ২ মিনিটে সংগৃহীত পানি রেকর্ড করো।',
  controls: [{ key: 'flow', en: 'Water flow rate', bn: 'পানির প্রবাহ হার', min: 30, max: 150, step: 10, unit: 'g/min', default: 60 }],
  sweep: { key: 'flow', values: [40, 60, 80, 100, 120] },
  minReadings: 4,
  compute(p, noise, ctx) {
    const s = searleSteady(p.flow);
    const f = 1 - Math.exp(-ctx.elapsed / 1.6);
    const t1 = ROOM + (s.t1 - ROOM) * f;
    const t2 = ROOM + (s.t2 - ROOM) * f;
    const tout = ROOM + (s.tout - ROOM) * f;
    const steady = ctx.elapsed > 6;
    const m = s.mdot * SEARLE_BAR.collect;
    const t1m = t1 + noise(0.05);
    const t2m = t2 + noise(0.05);
    const toutm = tout + noise(0.05);
    const k = (m * SW * (toutm - SEARLE_BAR.tin) * SEARLE_BAR.d) / (s.A * (t1m - t2m) * SEARLE_BAR.collect);
    return {
      row: {
        waterMassKg: round(m, 3),
        timeS: SEARLE_BAR.collect,
        hotTempC: round(t1m, 1),
        coldTempC: round(t2m, 1),
        waterInC: SEARLE_BAR.tin,
        waterOutC: round(toutm, 1),
        conductivity: Math.round(k)
      },
      live: [
        { en: 'θ₁ (hot)', bn: 'θ₁ (গরম)', value: t1, unit: '°C', digits: 1 },
        { en: 'θ₂ (cold)', bn: 'θ₂ (ঠান্ডা)', value: t2, unit: '°C', digits: 1 },
        { en: 'Water out θ₄', bn: 'নির্গত পানি θ₄', value: tout, unit: '°C', digits: 1 },
        { en: 'State', bn: 'অবস্থা', value: steady ? 'Steady' : 'Warming up', tone: steady ? 'good' : 'warn' }
      ],
      view: { t1, t2, tout, tin: SEARLE_BAR.tin, flow: p.flow, steady: steady ? 1 : 0 },
      status: steady
        ? { en: 'Steady state reached — record.', bn: 'স্থির অবস্থা — রেকর্ড করো।', tone: 'good' }
        : { en: 'Temperatures still changing — wait for steady state.', bn: 'তাপমাত্রা এখনও বদলাচ্ছে — স্থির অবস্থার জন্য অপেক্ষা করো।', tone: 'warn' },
      ready: steady
    };
  },
  result: {
    en: 'Thermal conductivity k',
    bn: 'তাপ পরিবাহকত্ব k',
    unit: 'W/(m·K)',
    digits: 0,
    compute: (rows) => meanOf(rows, 'conductivity'),
    expected: SEARLE_BAR.k
  }
};

/* ------------------------------------------------------------------ */
/* Thermal conductivity — Lee's disc (bad conductor)                    */
/* ------------------------------------------------------------------ */

export const SPECIMENS = [
  { en: 'Cardboard', bn: 'কার্ডবোর্ড', k: 0.2 },
  { en: 'Ebonite', bn: 'এবোনাইট', k: 0.17 },
  { en: 'Glass', bn: 'কাচ', k: 0.8 }
];
const LEE = { M: 0.85, s: 380, r: 0.05, h: 0.25, t1: 98.5 };

export function leeSteady(k: number, dMm: number) {
  const A = Math.PI * LEE.r * LEE.r;
  const d = dMm / 1000;
  const g = (k * A) / d;
  const t2 = (g * LEE.t1 + LEE.h * ROOM) / (g + LEE.h);
  const rate = (LEE.h * (t2 - ROOM)) / (LEE.M * LEE.s);
  return { A, d, t2, rate };
}

export const leeDisc: PracticalModel = {
  slug: 'thermal-conductivity-lee-disc',
  scene: 'conduction',
  variant: 'lee',
  animated: true,
  howTo_en: 'Steam heats the upper disc. At steady state note θ₁ and θ₂, then find the cooling rate of the lower disc at θ₂. Record for different specimen thicknesses.',
  howTo_bn: 'বাষ্প উপরের চাকতি গরম করছে। স্থির অবস্থায় θ₁ ও θ₂ নাও, তারপর θ₂ তে নিচের চাকতির শীতলীকরণ হার বের করো। ভিন্ন পুরুত্বের নমুনায় রেকর্ড করো।',
  controls: [
    { key: 'spec', en: 'Specimen', bn: 'নমুনা', default: 0, options: SPECIMENS.map((s, i) => ({ value: i, en: s.en, bn: s.bn })) },
    {
      key: 'd',
      en: 'Thickness',
      bn: 'পুরুত্ব',
      default: 3,
      options: [2, 3, 4, 5, 6].map((v) => ({ value: v, en: `${v} mm`, bn: `${v} মিমি` }))
    }
  ],
  sweep: { key: 'd', values: [2, 3, 4, 5, 6] },
  minReadings: 4,
  compute(p, noise, ctx) {
    const spec = SPECIMENS[p.spec] || SPECIMENS[0];
    const s = leeSteady(spec.k, p.d);
    const f = 1 - Math.exp(-ctx.elapsed / 1.6);
    const t1 = ROOM + (LEE.t1 - ROOM) * f;
    const t2 = ROOM + (s.t2 - ROOM) * f;
    const steady = ctx.elapsed > 6;
    const t1m = t1 + noise(0.05);
    const t2m = t2 + noise(0.05);
    const ratem = s.rate * (1 + noise(0.006));
    const k = (LEE.M * LEE.s * ratem * s.d) / (s.A * (t1m - t2m));
    return {
      row: {
        discMassKg: LEE.M,
        thicknessM: s.d,
        areaM2: sig(s.A, 4),
        hotTempC: round(t1m, 1),
        coldTempC: round(t2m, 1),
        coolingRate: sig(ratem, 4),
        conductivity: round(k, 3)
      },
      live: [
        { en: 'θ₁ (steam side)', bn: 'θ₁ (বাষ্পের দিক)', value: t1, unit: '°C', digits: 1 },
        { en: 'θ₂ (lower disc)', bn: 'θ₂ (নিচের চাকতি)', value: t2, unit: '°C', digits: 1 },
        { en: 'Cooling rate at θ₂', bn: 'θ₂ তে শীতলীকরণ হার', value: s.rate * 1000, unit: 'mK/s', digits: 1 },
        { en: 'State', bn: 'অবস্থা', value: steady ? 'Steady' : 'Warming up', tone: steady ? 'good' : 'warn' }
      ],
      view: { t1, t2, d: p.d, spec: p.spec, steady: steady ? 1 : 0 },
      status: steady
        ? { en: 'Steady state — record θ₁, θ₂ and the cooling rate.', bn: 'স্থির অবস্থা — θ₁, θ₂ ও শীতলীকরণ হার রেকর্ড করো।', tone: 'good' }
        : { en: 'Warming up — wait for steady temperatures.', bn: 'গরম হচ্ছে — তাপমাত্রা স্থির হওয়ার অপেক্ষা করো।', tone: 'warn' },
      ready: steady
    };
  },
  result: {
    en: 'Thermal conductivity of specimen',
    bn: 'নমুনার তাপ পরিবাহকত্ব',
    unit: 'W/(m·K)',
    digits: 3,
    compute: (rows) => meanOf(rows, 'conductivity'),
    expected: (p) => (SPECIMENS[p.spec] || SPECIMENS[0]).k
  }
};

/* ------------------------------------------------------------------ */
/* Density of water vs temperature (density bottle)                     */
/* ------------------------------------------------------------------ */

/** Kell (1975) density of air-free water, kg/m³. */
export function waterDensity(T: number) {
  return 1000 * (1 - ((T + 288.9414) / (508929.2 * (T + 68.12963))) * (T - 3.9863) * (T - 3.9863));
}
const BOTTLE = { empty: 0.025, V: 5e-5 };

export const densityWater: PracticalModel = {
  slug: 'density-water-temperature',
  scene: 'densityBottle',
  howTo_en: 'Set the water-bath temperature, fill the density bottle and weigh it. Record ρ = (m₂ − m₁)/V for several temperatures — note the maximum near 4 °C.',
  howTo_bn: 'পানির পাত্রের তাপমাত্রা ঠিক করো, ঘনত্ব বোতল ভরে ওজন নাও। কয়েকটি তাপমাত্রায় ρ = (m₂ − m₁)/V রেকর্ড করো — ৪ °C এর কাছে সর্বোচ্চ ঘনত্ব লক্ষ করো।',
  controls: [{ key: 'T', en: 'Water temperature', bn: 'পানির তাপমাত্রা', min: 1, max: 70, step: 1, unit: '°C', default: 10 }],
  sweep: { key: 'T', values: [2, 4, 10, 25, 40, 60] },
  minReadings: 5,
  compute(p, noise) {
    const rho = waterDensity(p.T);
    const filled = BOTTLE.empty + rho * BOTTLE.V + noise(2e-7);
    const dens = (filled - BOTTLE.empty) / BOTTLE.V;
    return {
      row: {
        temperatureC: p.T,
        emptyMassKg: BOTTLE.empty,
        filledMassKg: round(filled, 6),
        volumeM3: BOTTLE.V,
        density: round(dens, 2)
      },
      live: [
        { en: 'Balance reading', bn: 'তুলাযন্ত্রের পাঠ', value: (BOTTLE.empty + rho * BOTTLE.V) * 1000, unit: 'g', digits: 3 },
        { en: 'Density ρ', bn: 'ঘনত্ব ρ', value: rho, unit: 'kg/m³', digits: 2 },
        { en: 'Bottle volume', bn: 'বোতলের আয়তন', value: BOTTLE.V * 1e6, unit: 'cm³', digits: 0, tone: 'info' }
      ],
      view: { T: p.T, rho, mass: (BOTTLE.empty + rho * BOTTLE.V) * 1000 },
      ready: true
    };
  },
  result: {
    en: 'Temperature of maximum density',
    bn: 'সর্বোচ্চ ঘনত্বের তাপমাত্রা',
    unit: '°C',
    digits: 1,
    compute(rows) {
      let best: { T: number; rho: number } | null = null;
      for (const r of rows) {
        const T = num(r, 'temperatureC');
        const rho = num(r, 'density');
        if (T === null || rho === null) continue;
        if (!best || rho > best.rho) best = { T, rho };
      }
      return best ? best.T : null;
    },
    expected: 4,
    absolute: true,
    tolerance: 1
  }
};

export const heatModels: PracticalModel[] = [
  specificHeatMixtures,
  specificHeatSolid,
  jouleElectrical,
  mechanicalEquivalent,
  latentHeat,
  liquidCooling,
  searleConductivity,
  leeDisc,
  densityWater
];
