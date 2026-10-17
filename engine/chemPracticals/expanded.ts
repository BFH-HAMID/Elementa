import expandedData from '@/content/expanded-chemistry-practicals.json';
import { meanOf, sig } from './helpers';
import type { ChemPracticalModel, ChemParams } from './types';

type Relation = 'direct' | 'inverseX' | 'inverseSquare' | 'square' | 'exponential' | 'reciprocalK' | 'offset' | 'intercept';

export interface ExpandedChemConfig {
  relation: Relation;
  expected: number;
  result_en: string;
  result_bn: string;
  result_unit: string;
  x_en: string;
  x_bn: string;
  x_unit: string;
  x_min: number;
  x_max: number;
  x_step: number;
  x_default: number;
  tasks: number[];
  y_en: string;
  y_bn: string;
  y_unit: string;
  scale: number;
  offset: number;
  formula: string;
  apparatus_en: string[];
  apparatus_bn: string[];
  reagents_en: string[];
  reagents_bn: string[];
}

interface ExpandedChemRecord {
  slug: string;
  title_en: string;
  title_bn: string;
  aim_en: string;
  aim_bn: string;
  model: ExpandedChemConfig;
}

export const expandedChemPracticalRecords = expandedData.experiments as ExpandedChemRecord[];

function response(c: ExpandedChemConfig, x: number, calibration = 0) {
  const gain = 1 + calibration / 100;
  let y: number;
  switch (c.relation) {
    case 'inverseX':
      y = (c.expected * c.scale) / Math.max(x, 1e-12);
      break;
    case 'inverseSquare':
      y = (c.expected * c.scale) / Math.max(x * x, 1e-12);
      break;
    case 'square':
      y = c.expected * c.scale * x * x;
      break;
    case 'exponential':
      y = c.offset * Math.exp(-c.expected * x);
      break;
    case 'reciprocalK':
      y = (c.scale * x) / c.expected;
      break;
    case 'offset':
      y = c.offset + c.expected * c.scale * x;
      break;
    case 'intercept':
      y = c.expected + c.scale * x;
      break;
    default:
      y = c.expected * c.scale * x;
  }
  return y * gain;
}

function estimate(c: ExpandedChemConfig, x: number, measured: number) {
  switch (c.relation) {
    case 'inverseX':
      return (measured * x) / c.scale;
    case 'inverseSquare':
      return (measured * x * x) / c.scale;
    case 'square':
      return measured / Math.max(c.scale * x * x, 1e-12);
    case 'exponential':
      return -Math.log(Math.max(measured, 1e-12) / c.offset) / Math.max(x, 1e-12);
    case 'reciprocalK':
      return (c.scale * x) / Math.max(measured, 1e-12);
    case 'offset':
      return (measured - c.offset) / Math.max(c.scale * x, 1e-12);
    case 'intercept':
      return measured - c.scale * x;
    default:
      return measured / Math.max(c.scale * x, 1e-12);
  }
}

function makeExpandedChemModel(record: ExpandedChemRecord): ChemPracticalModel {
  const c = record.model;
  return {
    slug: record.slug,
    scene: 'analysisBench',
    variant: record.slug,
    howTo_en: `${record.aim_en} Prepare the labelled reagents, choose each task chip, read the live instrument, record all five values, inspect the graph and validate the result.`,
    howTo_bn: `${record.aim_bn} labelled reagent প্রস্তুত করুন, প্রতিটি task chip বেছে live instrument পড়ুন, পাঁচটি মান রেকর্ড করুন, graph দেখুন এবং ফল যাচাই করুন।`,
    formula: c.formula,
    controls: [
      {
        key: 'x',
        en: c.x_en,
        bn: c.x_bn,
        min: c.x_min,
        max: c.x_max,
        step: c.x_step,
        unit: c.x_unit,
        default: c.x_default,
        digits: 5,
        fine: true
      },
      {
        key: 'calibration',
        en: 'Blank / zero correction',
        bn: 'blank / zero correction',
        min: -2,
        max: 2,
        step: 0.5,
        unit: '%',
        default: 0,
        digits: 1,
        fine: true,
        kind: 'condition'
      }
    ],
    tasks: c.tasks.map((x) => ({
      en: `Measure at ${x} ${c.x_unit}`,
      bn: `${x} ${c.x_unit}-এ পরিমাপ করুন`,
      set: { x }
    })),
    columns: [
      { key: 'obsNo', en: 'Obs.', bn: 'পাঠ', digits: 0 },
      { key: 'x', en: c.x_en, bn: c.x_bn, unit: c.x_unit, digits: 6 },
      { key: 'y', en: c.y_en, bn: c.y_bn, unit: c.y_unit, digits: 6 },
      { key: 'estimate', en: c.result_en, bn: c.result_bn, unit: c.result_unit, digits: 6, scientific: Math.abs(c.expected) < 0.001 }
    ],
    minReadings: 5,
    compute(params, noise, ctx) {
      const x = params.x;
      const ideal = response(c, x, params.calibration);
      const signalMagnitude = c.relation === 'offset' ? Math.abs(c.expected * c.scale * x) : Math.abs(ideal);
      const measured = ideal + noise(Math.max(signalMagnitude * 0.005, 1e-12));
      const recovered = estimate(c, x, measured);
      const relativeError = Math.abs((recovered - c.expected) / Math.max(Math.abs(c.expected), 1e-12));
      return {
        row: { obsNo: ctx.rows.length + 1, x: sig(x, 7), y: sig(measured, 7), estimate: sig(recovered, 7) },
        live: [
          { en: c.x_en, bn: c.x_bn, value: sig(x, 7), unit: c.x_unit },
          { en: c.y_en, bn: c.y_bn, value: sig(measured, 7), unit: c.y_unit },
          { en: c.result_en, bn: c.result_bn, value: sig(recovered, 7), unit: c.result_unit, tone: relativeError < 0.03 ? 'good' : 'warn' }
        ],
        view: {
          title_en: record.title_en,
          title_bn: record.title_bn,
          formula: c.formula,
          x,
          y: measured,
          expected: c.expected,
          x_en: c.x_en,
          x_bn: c.x_bn,
          x_unit: c.x_unit,
          y_en: c.y_en,
          y_bn: c.y_bn,
          y_unit: c.y_unit,
          apparatus_en: c.apparatus_en,
          apparatus_bn: c.apparatus_bn,
          reagents_en: c.reagents_en,
          reagents_bn: c.reagents_bn,
          signal: Math.min(1, Math.abs(measured) / (Math.abs(ideal) + 1e-12))
        },
        status: {
          tone: Math.abs(params.calibration) <= 0.5 ? 'good' : 'warn',
          en: Math.abs(params.calibration) <= 0.5 ? 'Blank accepted — record this quantitative observation.' : 'Re-zero against the blank before recording.',
          bn: Math.abs(params.calibration) <= 0.5 ? 'blank accepted — quantitative পাঠটি রেকর্ড করুন।' : 'রেকর্ডের আগে blank দিয়ে আবার zero করুন।'
        },
        ready: true
      };
    },
    result: {
      en: c.result_en,
      bn: c.result_bn,
      unit: c.result_unit,
      digits: 6,
      scientific: Math.abs(c.expected) < 0.001 || Math.abs(c.expected) >= 100000,
      compute: (rows) => meanOf(rows, 'estimate'),
      expected: c.expected,
      goodWithin: 5
    },
    graph: { x: 'x', y: 'y', kind: 'line' },
    solve: (params: ChemParams) => ({ ...params, calibration: 0 })
  };
}

export const expandedChemPracticalModels: ChemPracticalModel[] = expandedChemPracticalRecords.map(makeExpandedChemModel);
