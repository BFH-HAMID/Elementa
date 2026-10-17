/**
 * Interactive chemistry practical simulations.
 *
 * Every guided chemistry practical has a small model that turns the student's
 * control settings into
 *   - a live view (what the SVG scene draws: glassware, colours, bubbles, gas volumes…),
 *   - live meter readings,
 *   - the observation-table row that gets recorded,
 *   - and the final result (a concentration, ΔH, a mole ratio, the number of ions
 *     identified correctly…) computed from the recorded rows.
 *
 * Models are pure functions, so they are unit tested without React. They mirror the
 * physics practical models (`engine/practicals`) but carry their own observation-table
 * columns (the chemistry walkthrough data has none), tasks that can set several
 * controls at once, time controls with a play button, and scored "inference" controls
 * for identification practicals (flame tests, anion/cation tests, gas tests…).
 */

export type ChemParams = Record<string, number>;

export type ChemRowValue = number | string;
export type ChemRow = Record<string, ChemRowValue>;

/** Gaussian measurement noise with the given standard deviation (0 when noise is off). */
export type ChemNoiseFn = (sd: number) => number;

export interface ChemChoice {
  value: number;
  en: string;
  bn: string;
}

/**
 * - `condition`: changes the experiment itself; changing it restarts the time control.
 * - `time`: the process clock (stopwatch). Gets a ▶ play button when `play` is set.
 * - `view`: only changes what is looked at (which tube to inspect…); keeps the clock.
 * - `inference`: the student's own conclusion — scored against the right answer.
 */
export type ChemControlKind = 'condition' | 'time' | 'view' | 'inference';

export interface ChemControl {
  key: string;
  en: string;
  bn: string;
  kind?: ChemControlKind;
  /** Slider range (ignored when `options` is given). */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: number;
  /** Discrete choices rendered as segmented buttons. */
  options?: ChemChoice[];
  /** Fine-adjust control (burette tap, thermometer…) — shows ± nudge buttons. */
  fine?: boolean;
  /** Number of decimals shown next to the slider. */
  digits?: number;
  /** Time controls: advance by `rate` units per real second while ▶ is pressed. */
  play?: { rate: number };
}

export type ChemTone = 'good' | 'warn' | 'info' | 'bad';

export interface ChemLiveReading {
  en: string;
  bn: string;
  value: number | string;
  /** Bangla text for string values (colour names, observations…). */
  valueBn?: string;
  unit?: string;
  digits?: number;
  tone?: ChemTone;
}

export interface ChemStatus {
  en: string;
  bn: string;
  tone: ChemTone;
}

export interface ChemContext {
  /** Rows already recorded in the observation table. */
  rows: ChemRow[];
}

/** Arbitrary, scene-specific data for the renderer (colours, levels, gas volumes…). */
export type ChemView = Record<string, unknown>;

/** A solid sitting in a test tube (metal strip, granules, chips, a nail…). */
export interface TubeSolid {
  kind: 'strip' | 'granules' | 'powder' | 'nail' | 'ribbon' | 'chips' | 'crystals';
  color: string;
  /** Coating that grows on the solid (copper deposit, rust…). */
  coat?: string;
  coatAmount?: number;
  /** 0–1: how much of the solid is left. */
  amount?: number;
}

/** One test tube in the rack scene. */
export interface TubeView {
  label: string;
  labelBn?: string;
  sub?: string;
  subBn?: string;
  /** Liquid colour; leave undefined for an empty tube. */
  liquid?: string;
  /** Fill fraction 0–1 (default 0.45). */
  level?: number;
  opacity?: number;
  /** Suspended precipitate / milkiness 0–1. */
  cloud?: number;
  cloudColor?: string;
  /** Settled precipitate height as a fraction of the tube 0–1. */
  ppt?: number;
  pptColor?: string;
  /** Effervescence 0–1. */
  bubbles?: number;
  /** Coloured gas or fumes above the liquid 0–1. */
  fumes?: number;
  fumeColor?: string;
  solid?: TubeSolid;
  /** Thickness (fraction of tube) of an oil layer floating on top. */
  oil?: number;
  plug?: 'cotton' | 'cork';
  /** Anhydrous calcium chloride drying agent at the bottom. */
  drying?: boolean;
  /** Glittering crystals (golden rain) 0–1. */
  crystals?: number;
  crystalColor?: string;
  /** Balloon on the mouth, inflated 0–1 by the gas given off. */
  balloon?: number;
  /** Coloured gas puffing out of the mouth (e.g. NO turning brown in air). */
  mouth?: { color: string; amount: number };
  warm?: boolean;
  active?: boolean;
  mark?: 'good' | 'bad';
}

export interface TubesView {
  tubes: TubeView[];
  /** Dropper over a tube, releasing drops of `color`. */
  dropper?: { tube: number; color: string; label?: string; drops?: number };
  /** A strip of indicator paper held in a tube. */
  paper?: { tube: number; color: string; label?: string; labelBn?: string };
  /** pH meter probe in a tube. */
  meter?: { tube: number; value: number };
  /** Conductivity tester bulb (0–1 brightness). */
  bulb?: { tube: number; brightness: number };
  /** Universal indicator colour chart on the right. */
  chart?: boolean;
  /** Water bath: around one tube (`tube`) or behind the whole rack. */
  bath?: { temp: number; tube?: number };
  /** Stopwatch reading (s) or days counter. */
  clock?: { value: number; unit: 's' | 'min' | 'day' };
  /** Delivery tube carrying gas from one tube into another (e.g. into limewater). */
  delivery?: { from: number; to: number };
  /** Bunsen flame under a tube. */
  burner?: number;
  caption?: string;
  captionBn?: string;
}

export interface ChemOutput {
  /** One value per observation-table column (plus internal `__` keys). */
  row: ChemRow;
  live: ChemLiveReading[];
  view: ChemView;
  /** Guidance shown above the record button. */
  status?: ChemStatus;
  /** False when the current setting is not a valid observation yet. */
  ready?: boolean;
  /** Identification practicals: whether the chosen inference is right. */
  correct?: boolean;
}

export interface ChemColumn {
  key: string;
  en: string;
  bn: string;
  unit?: string;
  digits?: number;
  /** Always show this column in scientific notation. */
  scientific?: boolean;
}

/** A reading the student should take — clicking the chip sets these controls. */
export interface ChemTask {
  en: string;
  bn: string;
  set: ChemParams;
}

export interface ChemResultDef {
  en: string;
  bn: string;
  unit: string;
  digits?: number;
  /** Final quantity from the recorded rows (null when not enough data). */
  compute: (rows: ChemRow[], params: ChemParams) => number | null;
  /** Accepted value — may depend on the chosen conditions. */
  expected: number | ((params: ChemParams) => number);
  /** Compare by absolute deviation (same unit) instead of % error. */
  absolute?: boolean;
  /** Allowed absolute deviation that still counts as a good result (absolute mode). */
  tolerance?: number;
  /** Identification practicals: the value is "correct conclusions out of `expected`". */
  score?: boolean;
  /** Use scientific notation when displaying the result. */
  scientific?: boolean;
  /** % error that still counts as a good result (default 5). */
  goodWithin?: number;
}

export interface ChemGraphDef {
  x: string;
  /** One or more series plotted against `x`. */
  y: string | string[];
  /** 'line' joins the points in x order; 'scatter' only plots them. */
  kind?: 'line' | 'scatter';
}

export type ChemSceneId =
  | 'tubes'
  | 'titration'
  | 'flame'
  | 'gas'
  | 'electrolysis'
  | 'heating'
  | 'calorimeter'
  | 'trough'
  | 'gasJar'
  | 'crossFlask'
  | 'galvanic'
  | 'diffusion'
  | 'chromatography'
  | 'distillation'
  | 'analysisBench';

export interface ChemPracticalModel {
  slug: string;
  scene: ChemSceneId;
  variant?: string;
  howTo_en: string;
  howTo_bn: string;
  /** Short working formula shown with the result (plain text, Unicode sub/superscripts). */
  formula?: string;
  controls: ChemControl[];
  /** Readings to take; a recorded row ticks off the task whose `set` matches. */
  tasks?: ChemTask[];
  /** Observation-table columns (keys of `ChemOutput.row`). */
  columns: ChemColumn[];
  minReadings: number;
  compute: (params: ChemParams, noise: ChemNoiseFn, ctx: ChemContext) => ChemOutput;
  result: ChemResultDef;
  /** Plot of the recorded rows under the table. */
  graph?: ChemGraphDef;
  /**
   * Returns controls adjusted to a valid observation (end point, steady gas volume,
   * the right inference…). Used by the "Show me" hint and by the unit tests.
   */
  solve?: (params: ChemParams, ctx: ChemContext) => ChemParams;
}
