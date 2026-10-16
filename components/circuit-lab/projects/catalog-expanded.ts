/**
 * Thirty quantitative circuit practicals. Each project is a real, fully wired
 * engine simulation and carries a worksheet definition consumed by the Practical
 * tab (control sweep, live reading, observation table, graph and result check).
 */

import type { CircuitPractical, ExampleProject } from './examples';
import { C, W } from './builders';

type Topology = 'series' | 'divider' | 'parallel';

type Spec = {
  id: string;
  en: string;
  bn: string;
  topology: Topology;
  r1: number;
  r2: number;
  focusEn: string;
  focusBn: string;
};

const SPECS: Spec[] = [
  { id: 'series-equivalent-resistance', en: 'Series equivalent resistance', bn: 'সিরিজ সমতুল্য রোধ', topology: 'series', r1: 1000, r2: 2200, focusEn: 'verify that series resistances add', focusBn: 'সিরিজ রোধ যোগ হয় তা যাচাই' },
  { id: 'series-kvl-voltage-sweep', en: 'Kirchhoff voltage law sweep', bn: 'Kirchhoff voltage সূত্র sweep', topology: 'series', r1: 1500, r2: 3300, focusEn: 'test KVL at five supply voltages', focusBn: 'পাঁচটি supply voltage-এ KVL পরীক্ষা' },
  { id: 'series-current-proportionality', en: 'Current–voltage proportionality', bn: 'প্রবাহ–ভোল্টেজ সমানুপাত', topology: 'series', r1: 680, r2: 1200, focusEn: 'plot current against applied voltage', focusBn: 'applied voltage-এর বিপরীতে প্রবাহ plot' },
  { id: 'series-resistor-tolerance', en: 'Resistor tolerance by V–I data', bn: 'V–I data দিয়ে resistor tolerance', topology: 'series', r1: 4700, r2: 1000, focusEn: 'recover resistance from repeated V–I readings', focusBn: 'বারবার V–I পাঠ থেকে রোধ নির্ণয়' },
  { id: 'series-sensor-lead-resistance', en: 'Sensor lead resistance', bn: 'sensor lead resistance', topology: 'series', r1: 220, r2: 1800, focusEn: 'measure a sensor plus lead resistance', focusBn: 'sensor ও lead-এর মোট রোধ মাপা' },
  { id: 'series-heater-model', en: 'Low-power heater model', bn: 'low-power heater model', topology: 'series', r1: 330, r2: 470, focusEn: 'relate heater current to source voltage safely', focusBn: 'নিরাপদে heater current ও source voltage সম্পর্ক' },
  { id: 'series-cable-drop-model', en: 'Cable resistance and voltage drop', bn: 'cable resistance ও voltage drop', topology: 'series', r1: 100, r2: 1000, focusEn: 'quantify cable resistance in a load loop', focusBn: 'load loop-এ cable resistance নির্ণয়' },
  { id: 'series-protection-resistor', en: 'Protection resistor sizing', bn: 'protection resistor sizing', topology: 'series', r1: 560, r2: 2200, focusEn: 'validate a current-limiting resistance', focusBn: 'current-limiting resistance যাচাই' },
  { id: 'series-unknown-resistor', en: 'Unknown resistor by volt–ampere method', bn: 'volt–ampere পদ্ধতিতে অজানা রোধ', topology: 'series', r1: 2700, r2: 3900, focusEn: 'find an unknown from a straight-line graph', focusBn: 'straight-line graph থেকে অজানা রোধ নির্ণয়' },
  { id: 'series-meter-loading', en: 'High-resistance measurement loop', bn: 'উচ্চ রোধ measurement loop', topology: 'series', r1: 10000, r2: 15000, focusEn: 'observe small current in a high-resistance loop', focusBn: 'উচ্চ রোধ loop-এ ক্ষুদ্র প্রবাহ পর্যবেক্ষণ' },

  { id: 'divider-ratio-verification', en: 'Voltage-divider ratio verification', bn: 'voltage-divider অনুপাত যাচাই', topology: 'divider', r1: 10000, r2: 10000, focusEn: 'verify a one-half divider ratio', focusBn: 'অর্ধেক divider ratio যাচাই' },
  { id: 'divider-three-volt-reference', en: 'Three-volt reference divider', bn: 'তিন-ভোল্ট reference divider', topology: 'divider', r1: 20000, r2: 10000, focusEn: 'design a one-third reference', focusBn: 'এক-তৃতীয়াংশ reference তৈরি' },
  { id: 'divider-adc-input-scaling', en: 'ADC input scaling', bn: 'ADC input scaling', topology: 'divider', r1: 15000, r2: 10000, focusEn: 'scale a sensor voltage for an ADC', focusBn: 'ADC-এর জন্য sensor voltage scale' },
  { id: 'divider-battery-monitor', en: 'Battery-monitor attenuator', bn: 'battery-monitor attenuator', topology: 'divider', r1: 47000, r2: 10000, focusEn: 'attenuate a battery voltage safely', focusBn: 'battery voltage নিরাপদে attenuate' },
  { id: 'divider-transistor-bias', en: 'Transistor-bias reference', bn: 'transistor-bias reference', topology: 'divider', r1: 33000, r2: 12000, focusEn: 'establish a stable bias fraction', focusBn: 'স্থিতিশীল bias fraction স্থাপন' },
  { id: 'divider-comparator-threshold', en: 'Comparator threshold divider', bn: 'comparator threshold divider', topology: 'divider', r1: 6800, r2: 3300, focusEn: 'set and validate a comparator threshold', focusBn: 'comparator threshold সেট ও যাচাই' },
  { id: 'divider-audio-attenuator', en: 'Audio signal attenuator', bn: 'audio signal attenuator', topology: 'divider', r1: 22000, r2: 4700, focusEn: 'measure a passive attenuation ratio', focusBn: 'passive attenuation ratio মাপা' },
  { id: 'divider-midrail-reference', en: 'Mid-rail virtual reference', bn: 'mid-rail virtual reference', topology: 'divider', r1: 4700, r2: 4700, focusEn: 'generate a half-supply reference', focusBn: 'half-supply reference তৈরি' },
  { id: 'divider-calibration-chain', en: 'Calibration voltage chain', bn: 'calibration voltage chain', topology: 'divider', r1: 8200, r2: 2200, focusEn: 'calibrate a fixed fractional output', focusBn: 'fixed fractional output calibrate' },
  { id: 'divider-level-translator', en: 'Passive level translator', bn: 'passive level translator', topology: 'divider', r1: 18000, r2: 12000, focusEn: 'translate one logic level into a safer level', focusBn: 'logic level-কে নিরাপদ level-এ নামানো' },

  { id: 'parallel-equivalent-resistance', en: 'Parallel equivalent resistance', bn: 'প্যারালাল সমতুল্য রোধ', topology: 'parallel', r1: 1000, r2: 1000, focusEn: 'verify the equivalent of two equal branches', focusBn: 'দুটি সমান branch-এর equivalent যাচাই' },
  { id: 'parallel-kcl-current-sum', en: 'Kirchhoff current law', bn: 'Kirchhoff current সূত্র', topology: 'parallel', r1: 1000, r2: 2200, focusEn: 'validate the total branch current with KCL', focusBn: 'KCL দিয়ে মোট branch current যাচাই' },
  { id: 'parallel-load-sharing', en: 'Unequal load sharing', bn: 'অসম load sharing', topology: 'parallel', r1: 1500, r2: 4700, focusEn: 'compare conductance of unequal loads', focusBn: 'অসম load-এর conductance তুলনা' },
  { id: 'parallel-conductance-addition', en: 'Conductance addition', bn: 'conductance যোগ', topology: 'parallel', r1: 3300, r2: 6800, focusEn: 'show that parallel conductances add', focusBn: 'parallel conductance যোগ হয় তা দেখানো' },
  { id: 'parallel-dual-sensor-load', en: 'Dual sensor load model', bn: 'dual sensor load model', topology: 'parallel', r1: 10000, r2: 15000, focusEn: 'measure two sensor loads on one source', focusBn: 'এক উৎসে দুটি sensor load মাপা' },
  { id: 'parallel-pull-resistors', en: 'Combined pull-resistor network', bn: 'সম্মিলিত pull-resistor network', topology: 'parallel', r1: 4700, r2: 10000, focusEn: 'find the effective pull resistance', focusBn: 'effective pull resistance নির্ণয়' },
  { id: 'parallel-heater-elements', en: 'Parallel heater elements', bn: 'প্যারালাল heater element', topology: 'parallel', r1: 680, r2: 820, focusEn: 'validate total current in dual heaters', focusBn: 'dual heater-এর মোট প্রবাহ যাচাই' },
  { id: 'parallel-redundant-load', en: 'Redundant load branches', bn: 'redundant load branch', topology: 'parallel', r1: 2200, r2: 2200, focusEn: 'study equal redundant branches', focusBn: 'সমান redundant branch অধ্যয়ন' },
  { id: 'parallel-bleeder-network', en: 'Bleeder resistance network', bn: 'bleeder resistance network', topology: 'parallel', r1: 47000, r2: 100000, focusEn: 'measure a high-value parallel bleeder', focusBn: 'high-value parallel bleeder মাপা' },
  { id: 'parallel-calibration-load', en: 'Calibration load bank', bn: 'calibration load bank', topology: 'parallel', r1: 2700, r2: 5600, focusEn: 'recover a load-bank equivalent from a V–I graph', focusBn: 'V–I graph থেকে load-bank equivalent নির্ণয়' }
];

function practicalFor(spec: Spec): CircuitPractical {
  const expected = spec.topology === 'series'
    ? spec.r1 + spec.r2
    : spec.topology === 'parallel'
      ? (spec.r1 * spec.r2) / (spec.r1 + spec.r2)
      : spec.r2 / (spec.r1 + spec.r2);
  const ratio = spec.topology === 'divider';
  return {
    control: {
      en: 'Supply voltage',
      bn: 'উৎস ভোল্টেজ',
      componentId: 'source',
      prop: 'volts',
      unit: 'V',
      min: 3,
      max: 11,
      step: 2,
      values: [3, 5, 7, 9, 11]
    },
    reading: ratio
      ? { en: 'Output voltage', bn: 'output ভোল্টেজ', kind: 'nodeVoltage', componentId: 'r1', pinId: 'b', unit: 'V', scale: 1 }
      : { en: 'Source current', bn: 'উৎস প্রবাহ', kind: 'sourceCurrent', componentId: 'source', unit: 'mA', scale: 1000 },
    result: {
      en: ratio ? 'Measured divider ratio' : 'Measured equivalent resistance',
      bn: ratio ? 'পরিমাপিত divider ratio' : 'পরিমাপিত সমতুল্য রোধ',
      mode: ratio ? 'ratio' : 'resistance',
      expected,
      unit: ratio ? '' : 'Ω',
      tolerancePercent: 3
    },
    formula: ratio ? 'Vout/Vin = R₂/(R₁ + R₂)' : 'Rₑq = V/I'
  };
}

function makeProject(spec: Spec): ExampleProject {
  const practical = practicalFor(spec);
  const ratio = spec.topology === 'divider';
  const isParallel = spec.topology === 'parallel';
  const topologyEn = isParallel ? 'parallel branches' : ratio ? 'divider chain' : 'series loop';
  const topologyBn = isParallel ? 'প্যারালাল branch' : ratio ? 'divider chain' : 'সিরিজ loop';
  const components = [
    C('source', 'battery-9v', 38, 132, { volts: 9 }),
    C('r1', 'resistor', 250, 75, { ohms: spec.r1 }),
    C('r2', 'resistor', 250, isParallel ? 205 : 165, { ohms: spec.r2 }),
    C('meter', 'multimeter', 455, 118, { mode: 'V' }),
    C('gnd', 'gnd-symbol', 55, 270)
  ];
  const wires = isParallel
    ? [
        W('w1', 'source.pos', 'r1.a', 'red'),
        W('w2', 'source.pos', 'r2.a', 'red'),
        W('w3', 'r1.b', 'source.neg', 'black'),
        W('w4', 'r2.b', 'source.neg', 'black'),
        W('w5', 'meter.vma', 'source.pos', 'yellow'),
        W('w6', 'meter.com', 'source.neg', 'black'),
        W('w7', 'gnd.g', 'source.neg', 'black')
      ]
    : [
        W('w1', 'source.pos', 'r1.a', 'red'),
        W('w2', 'r1.b', 'r2.a', 'yellow'),
        W('w3', 'r2.b', 'source.neg', 'black'),
        W('w4', 'meter.vma', ratio ? 'r1.b' : 'source.pos', 'yellow'),
        W('w5', 'meter.com', 'source.neg', 'black'),
        W('w6', 'gnd.g', 'source.neg', 'black')
      ];
  return {
    id: `practical-${spec.id}`,
    name: spec.en,
    title: { en: spec.en, bn: spec.bn },
    summary: {
      en: `A full five-point ${topologyEn} practical to ${spec.focusEn}, with live meter data and automatic result validation.`,
      bn: `live meter data ও automatic result validation-সহ পাঁচ-পাঠের ${topologyBn} practical—${spec.focusBn}।`
    },
    difficulty: spec.topology === 'series' ? 'beginner' : 'intermediate',
    steps: [
      {
        en: `Inspect the wired ${topologyEn}: R₁ = ${spec.r1} Ω and R₂ = ${spec.r2} Ω.`,
        bn: `wired ${topologyBn} পরীক্ষা করুন: R₁ = ${spec.r1} Ω এবং R₂ = ${spec.r2} Ω।`
      },
      {
        en: 'Open the Practical tab, press Run, and set each suggested supply voltage.',
        bn: 'Practical tab খুলে Run চাপুন এবং প্রতিটি প্রস্তাবিত supply voltage সেট করুন।'
      },
      {
        en: `Capture five live ${ratio ? 'output-voltage' : 'source-current'} readings and inspect the plotted graph.`,
        bn: `পাঁচটি live ${ratio ? 'output-voltage' : 'source-current'} পাঠ capture করে graph দেখুন।`
      },
      {
        en: `Calculate ${practical.result.en.toLowerCase()} with ${practical.formula} and validate it against the accepted value.`,
        bn: `${practical.formula} দিয়ে ${practical.result.bn} হিসাব করে accepted মানের সঙ্গে যাচাই করুন।`
      }
    ],
    explanation: {
      en: `${spec.en} uses Ohm’s and Kirchhoff’s laws to ${spec.focusEn}. The editable resistors and source are actual engine components; the Practical worksheet samples the simulated ${ratio ? 'node voltage' : 'source current'}, not a scripted answer.`,
      bn: `${spec.bn}-এ Ohm ও Kirchhoff-এর সূত্র দিয়ে ${spec.focusBn} করা হয়। editable resistor ও source বাস্তব engine component; Practical worksheet scripted answer নয়, simulated ${ratio ? 'node voltage' : 'source current'} sample করে।`
    },
    practical,
    components,
    wires
  };
}

export const EXPANDED_CIRCUIT_PROJECTS: ExampleProject[] = SPECS.map(makeProject);

if (EXPANDED_CIRCUIT_PROJECTS.length !== 30) {
  throw new Error(`Expanded circuit practical catalog must contain 30 projects, found ${EXPANDED_CIRCUIT_PROJECTS.length}.`);
}
