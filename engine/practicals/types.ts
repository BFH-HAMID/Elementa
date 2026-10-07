/**
 * Interactive practical simulation models.
 *
 * Each guided practical (except Ohm's law, which uses the free workbench) has a
 * small physics model that turns the student's control settings into
 *   - a live view (what the scene draws),
 *   - live meter readings,
 *   - the observation-table row that gets recorded,
 *   - and the final result (g, k, μ, λ, ...) computed from the recorded rows.
 *
 * Models are pure functions so they can be unit tested without React.
 */

export type PracticalParams = Record<string, number>;

export type PracticalRowValue = number | string;
export type PracticalRow = Record<string, PracticalRowValue>;

/** Gaussian measurement noise with the given standard deviation (0 when noise is off). */
export type NoiseFn = (sd: number) => number;

export interface PracticalChoice {
  value: number;
  en: string;
  bn: string;
}

export interface PracticalControl {
  key: string;
  en: string;
  bn: string;
  /** Slider range (ignored when `options` is given). */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: number;
  /** Discrete choices rendered as segmented buttons. */
  options?: PracticalChoice[];
  /** Fine-adjust control (jockey, screen, water level) — shows ± nudge buttons. */
  fine?: boolean;
  /** Number of decimals shown next to the slider. */
  digits?: number;
}

export type PracticalTone = 'good' | 'warn' | 'info' | 'bad';

export interface PracticalLiveReading {
  en: string;
  bn: string;
  value: number | string;
  unit?: string;
  digits?: number;
  tone?: PracticalTone;
}

export interface PracticalStatus {
  en: string;
  bn: string;
  tone: PracticalTone;
}

export interface PracticalContext {
  /** Real seconds since the last parameter change (process clock). */
  elapsed: number;
  /** Rows already recorded in the observation table. */
  rows: PracticalRow[];
}

export interface PracticalOutput {
  /** Values for every dataColumn of the experiment. */
  row: PracticalRow;
  live: PracticalLiveReading[];
  /** Arbitrary props for the scene renderer. */
  view: Record<string, number | string | boolean | undefined>;
  /** Guidance shown above the record button. */
  status?: PracticalStatus;
  /** False when the current setting is not a valid observation (e.g. not balanced yet). */
  ready?: boolean;
}

export interface PracticalResultDef {
  en: string;
  bn: string;
  unit: string;
  digits?: number;
  /** Final quantity from the recorded rows (null when not enough data). */
  compute: (rows: PracticalRow[], params: PracticalParams) => number | null;
  /** Accepted value — may depend on the chosen material / object. */
  expected: number | ((params: PracticalParams) => number);
  /** Compare by absolute deviation (same unit) instead of % error — e.g. expected value 0. */
  absolute?: boolean;
  /** Allowed absolute deviation that still counts as a good result (absolute mode). */
  tolerance?: number;
  /** Set false when a single row is not a meaningful estimate (per-row % error is hidden). */
  rowwise?: boolean;
  /** Use scientific notation when displaying the result. */
  scientific?: boolean;
}

export type PracticalSceneId =
  | 'circuit'
  | 'wireBoard'
  | 'pendulum'
  | 'spring'
  | 'incline'
  | 'projectile'
  | 'trolley'
  | 'atwood'
  | 'flywheel'
  | 'vernier'
  | 'screwGauge'
  | 'opticalBench'
  | 'rays'
  | 'fringes'
  | 'calorimeter'
  | 'conduction'
  | 'densityBottle'
  | 'resonanceTube'
  | 'string'
  | 'torsion'
  | 'capillary'
  | 'photoelectric'
  | 'gmCounter'
  | 'induction'
  | 'searle';

export interface PracticalModel {
  slug: string;
  scene: PracticalSceneId;
  variant?: string;
  /** Scene needs a continuously running animation clock. */
  animated?: boolean;
  /** Time-based process: simulated seconds per real second for `elapsed`. */
  timeScale?: number;
  howTo_en: string;
  howTo_bn: string;
  controls: PracticalControl[];
  /** Suggested values for the sweep variable — one reading per value. */
  sweep?: { key: string; values: number[] };
  minReadings: number;
  compute: (params: PracticalParams, noise: NoiseFn, ctx: PracticalContext) => PracticalOutput;
  result: PracticalResultDef;
  /**
   * Returns parameters adjusted to a valid observation (null point, sharp image,
   * slipping angle…). Used by the "Show me" hint and by the unit tests.
   */
  solve?: (params: PracticalParams, ctx: PracticalContext) => PracticalParams;
}
