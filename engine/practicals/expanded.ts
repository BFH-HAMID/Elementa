import expandedData from '@/content/expanded-physics-practicals.json';
import { meanOf, sig } from './helpers';
import type { PracticalModel, PracticalParams } from './types';

type Relation = 'direct' | 'inverseX' | 'inverseSquare' | 'square' | 'exponential' | 'reciprocalK' | 'offset' | 'intercept';

export interface ExpandedPhysicsConfig {
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
  sweep: number[];
  y_en: string;
  y_bn: string;
  y_unit: string;
  scale: number;
  offset: number;
  formula: string;
  apparatus_en: string[];
  apparatus_bn: string[];
}

export interface ExpandedPhysicsRecord {
  slug: string;
  title_en: string;
  title_bn: string;
  aim_en: string;
  aim_bn: string;
  model: ExpandedPhysicsConfig;
}

export const expandedPhysicsPracticalRecords = expandedData.experiments as ExpandedPhysicsRecord[];

function response(c: ExpandedPhysicsConfig, x: number, calibration = 0) {
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

function estimate(c: ExpandedPhysicsConfig, x: number, measured: number) {
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

function makeExpandedPhysicsModel(record: ExpandedPhysicsRecord): PracticalModel {
  const c = record.model;
  return {
    slug: record.slug,
    scene: 'instrumentRig',
    variant: record.slug,
    howTo_en: `${record.aim_en} Set ${c.x_en.toLowerCase()} to each suggested value, record the live ${c.y_en.toLowerCase()}, inspect the graph, and validate ${c.result_en.toLowerCase()}.`,
    howTo_bn: `${record.aim_bn} ${c.x_bn} প্রতিটি প্রস্তাবিত মানে সেট করুন, live ${c.y_bn} রেকর্ড করুন, graph দেখুন এবং ${c.result_bn} যাচাই করুন।`,
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
        en: 'Instrument zero correction',
        bn: 'যন্ত্রের zero correction',
        min: -2,
        max: 2,
        step: 0.5,
        unit: '%',
        default: 0,
        digits: 1,
        fine: true
      }
    ],
    sweep: { key: 'x', values: c.sweep },
    minReadings: 5,
    compute(params, noise, ctx) {
      const p = { x: c.x_default, calibration: 0, ...params };
      const x = p.x;
      const ideal = response(c, x, p.calibration);
      const signalMagnitude = c.relation === 'offset' ? Math.abs(c.expected * c.scale * x) : Math.abs(ideal);
      const measured = ideal + noise(Math.max(signalMagnitude * 0.006, 1e-12));
      const recovered = estimate(c, x, measured);
      return {
        row: { obsNo: ctx.rows.length + 1, x: sig(x, 7), y: sig(measured, 7), estimate: sig(recovered, 7) },
        live: [
          { en: c.x_en, bn: c.x_bn, value: sig(x, 7), unit: c.x_unit },
          { en: c.y_en, bn: c.y_bn, value: sig(measured, 7), unit: c.y_unit },
          { en: c.result_en, bn: c.result_bn, value: sig(recovered, 7), unit: c.result_unit, tone: Math.abs((recovered - c.expected) / c.expected) < 0.03 ? 'good' : 'warn' }
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
          apparatus1_en: c.apparatus_en[0],
          apparatus2_en: c.apparatus_en[1],
          apparatus3_en: c.apparatus_en[2],
          apparatus1_bn: c.apparatus_bn[0],
          apparatus2_bn: c.apparatus_bn[1],
          apparatus3_bn: c.apparatus_bn[2]
        },
        status: {
          tone: Math.abs(p.calibration) <= 0.5 ? 'good' : 'warn',
          en: Math.abs(p.calibration) <= 0.5 ? 'Rig zeroed — record this observation.' : 'Apply the zero correction before recording.',
          bn: Math.abs(p.calibration) <= 0.5 ? 'rig zero করা — এই পাঠটি রেকর্ড করুন।' : 'রেকর্ডের আগে zero correction প্রয়োগ করুন।'
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
      expected: c.expected
    },
    solve: (params: PracticalParams) => ({ ...params, calibration: 0 })
  };
}

export const expandedPhysicsPracticalModels: PracticalModel[] = expandedPhysicsPracticalRecords.map(makeExpandedPhysicsModel);
