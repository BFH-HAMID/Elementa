/**
 * Shared types for the Elementa Chemistry Lab.
 *
 * Everything here is data-driven: the JSON files under `/data` are parsed into these
 * shapes, and the engine modules stay pure (no React, no DOM) so Vitest can exercise
 * them in plain Node.
 */

export type Locale = 'bn' | 'en';

export type HazardLevel = 'none' | 'caution' | 'danger';

export type ChemicalCategory =
  | 'acid'
  | 'base'
  | 'salt'
  | 'metal'
  | 'gas'
  | 'noble-gas'
  | 'indicator'
  | 'solvent';

export type PhysicalState = 'solid' | 'liquid' | 'gas';

export type Acidity =
  | { kind: 'acid'; strength: 'strong' | 'weak'; protons: number; ka?: number }
  | { kind: 'base'; strength: 'strong' | 'weak'; hydroxides: number; kb?: number }
  | { kind: 'salt'; saltOf?: { acid?: string; base?: string } }
  | { kind: 'neutral' };

export type GasTest = { name_en: string; name_bn: string };

export type Chemical = {
  id: string;
  formula: string;
  name_en: string;
  name_bn: string;
  category: ChemicalCategory;
  state: PhysicalState;
  color: string;
  opacity: number;
  molarMass: number;
  shelf: boolean;
  hazard: HazardLevel;
  soluble: boolean;
  precipitate: boolean;
  amphoteric?: boolean;
  concentrationM?: number;
  acidity?: Acidity;
  activity?: number;
  flameColor?: string;
  indicator?: IndicatorId;
  gasTest?: GasTest;
  notes_en?: string;
  notes_bn?: string;
};

export type IndicatorId = 'litmus' | 'phenolphthalein' | 'methyl-orange' | 'universal';

export type ApparatusKind = 'vessel' | 'heat' | 'support' | 'measure' | 'tool' | 'power';

export type VesselShape =
  | 'tube'
  | 'beaker'
  | 'flask'
  | 'cylinder'
  | 'burette'
  | 'jar'
  | 'dish';

export type Apparatus = {
  id: string;
  shape: VesselShape | 'burner' | 'tripod' | 'thermometer' | 'dropper' | 'spatula' | 'delivery' | 'holder' | 'cell';
  name_en: string;
  name_bn: string;
  kind: ApparatusKind;
  capacityMl: number;
  defaultFillMl: number;
  canHeat: boolean;
  acceptsGas?: boolean;
  icon: string;
  notes_en?: string;
  notes_bn?: string;
};

export type ReactionTrigger = {
  heat: boolean;
  minTempC: number | null;
  spark: boolean;
  electrolysis: boolean;
  light: boolean;
};

export type FlameEffect = { color: string; label_en: string; label_bn: string };

export type PrecipitateEffect = { id: string; color: string; density: number };

export type SmokeEffect = { color: string; density: number };

export type ReactionEffects = {
  colorTo: string | null;
  gas: string | null;
  gasRate: number;
  precipitate: PrecipitateEffect | null;
  smoke: SmokeEffect | null;
  deltaT: number;
  flame: FlameEffect | null;
  glow: boolean;
  sound: string | null;
  dissolve: boolean;
};

export type Stoichiometry = { id: string; coefficient: number };

export type ProductSpec = Stoichiometry & { state?: 's' | 'l' | 'g' | 'aq' };

export type ReactionCategory =
  | 'neutralisation'
  | 'acid-metal'
  | 'acid-carbonate'
  | 'precipitation'
  | 'displacement'
  | 'decomposition'
  | 'combustion'
  | 'gas-test'
  | 'redox'
  | 'complex'
  | 'flame-test'
  | 'electrolysis'
  | 'solution'
  | 'combination'
  | 'oxidation'
  | 'gas-preparation'
  | 'physical'
  | 'safety'
  | 'no-reaction'
  | 'other';

export type Reaction = {
  id: string;
  category: ReactionCategory;
  reactants: Stoichiometry[];
  products: ProductSpec[];
  trigger: ReactionTrigger;
  inert: boolean;
  effects: ReactionEffects;
  equation: string;
  equation_bn: string;
  observation_en: string;
  observation_bn: string;
  hazard: HazardLevel;
  hazard_en?: string;
  hazard_bn?: string;
  priority: number;
  tags: string[];
};

/** A measurable amount of one chemical inside a vessel. */
export type Portion = {
  chemicalId: string;
  /** Volume in mL for liquids; treated as grams for solids. */
  mL: number;
  moles: number;
  addedAt: number;
};

export type Sediment = { chemicalId: string; mL: number; moles: number; color: string };

export type GasVolume = {
  chemicalId: string;
  /** True amount of gas; what the vessel can actually hold is capped for display. */
  moles: number;
  /** Display volume in mL, capped by the vessel's headspace. */
  mL: number;
};

export type Vessel = {
  id: string;
  apparatusId: string;
  labelEn: string | null;
  labelBn: string | null;
  portions: Portion[];
  sediment: Sediment[];
  gases: GasVolume[];
  temperatureC: number;
  heating: boolean;
  thermometer: boolean;
  electrolysis: boolean;
  /** 0 = clear, 1 = fully turbid; relaxes towards the settled state over time. */
  turbidity: number;
  lastReactionId: string | null;
  /** Explicit colour requested by the last reaction's `colorTo`, if any. */
  colorOverride: string | null;
  /** Temperature at which rules were last evaluated, so heating can re-trigger them. */
  lastResolveTempC: number;
};

/** Ambient conditions that can unlock heat / spark / current triggered reactions. */
export type ReactionContext = {
  temperatureC: number;
  heating: boolean;
  spark: boolean;
  electrolysis: boolean;
  light: boolean;
};

export type LabDataset = {
  chemicals: Chemical[];
  reactions: Reaction[];
  apparatus: Apparatus[];
};

export type EffectKind =
  | 'bubbles'
  | 'smoke'
  | 'precipitate'
  | 'flame'
  | 'glow'
  | 'steam'
  | 'flash'
  | 'settle';

export type ActiveEffect = {
  id: string;
  vesselId: string;
  kind: EffectKind;
  color: string;
  intensity: number;
  startedAt: number;
  durationMs: number;
};

export type LogTone = 'info' | 'reaction' | 'warning' | 'danger' | 'success';

export type LogEntry = {
  id: string;
  at: number;
  kind: 'observation' | 'safety' | 'system' | 'equation' | 'heat';
  tone: LogTone;
  reactionId: string | null;
  vesselId: string | null;
  text_en: string;
  text_bn: string;
};

export type ReactionOutcome = {
  reaction: Reaction | null;
  fired: boolean;
  reason_en: string;
  reason_bn: string;
  limitingReagentId: string | null;
  extentMoles: number;
};

export type StepCheck =
  | { type: 'vesselCount'; min: number }
  | { type: 'contains'; vessel: number; chemicalId: string }
  | { type: 'temperature'; vessel: number; min: number }
  | { type: 'phRange'; vessel: number; min?: number; max?: number }
  | { type: 'reactionFired'; reactionId: string }
  | { type: 'heating'; vessel: number }
  | { type: 'electrolysis'; vessel: number }
  | { type: 'spark'; vessel: number };

export type ExperimentStep = {
  order: number;
  text_en: string;
  text_bn: string;
  check: StepCheck;
};

export type ExperimentQuiz = {
  question_en: string;
  question_bn: string;
  options_en: string[];
  options_bn: string[];
  answer: number;
  explain_en: string;
  explain_bn: string;
};

export type ExperimentSetupVessel = {
  apparatusId: string;
  label_en: string;
  label_bn: string;
  portions: { chemicalId: string; mL: number }[];
};

export type GuidedExperiment = {
  order: number;
  slug: string;
  title_en: string;
  title_bn: string;
  aim_en: string;
  aim_bn: string;
  level: 'class-6-8' | 'class-9-10' | 'class-11-12' | 'honours';
  durationMinutes: number;
  apparatus: string[];
  chemicals: string[];
  setup: { vessels: ExperimentSetupVessel[] };
  steps: ExperimentStep[];
  safety: { level: HazardLevel; en?: string; bn?: string };
  expectedReactions: string[];
  quiz: ExperimentQuiz[];
  tags: string[];
};

export type Element = {
  z: number;
  symbol: string;
  name_en: string;
  name_bn: string;
  mass: number;
  category: string;
  category_bn: string;
  group: number | null;
  period: number;
  block: 's' | 'p' | 'd' | 'f';
  state: PhysicalState;
  state_bn: string;
  radioactive: boolean;
};
