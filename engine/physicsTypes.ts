export type PhysicsDomain =
  | 'electricity'
  | 'magnetism'
  | 'optics'
  | 'mechanics'
  | 'heat'
  | 'waves'
  | 'measurement'
  | 'modern';

export type EquipmentCategory =
  | 'electricity'
  | 'magnetism'
  | 'optics'
  | 'mechanics'
  | 'heat'
  | 'waves'
  | 'measuring-tools'
  | 'modern-physics';

export type TerminalPolarity = 'positive' | 'negative' | 'ground' | 'neutral' | 'input' | 'output' | 'common' | 'none';

export interface EquipmentTerminal {
  id: string;
  name: string;
  name_bn?: string;
  polarity: TerminalPolarity;
  x: number; // percentage or offset within component box (0-100)
  y: number; // percentage or offset within component box (0-100)
}

export interface EquipmentPropertyDef {
  key: string;
  name_en: string;
  name_bn: string;
  type: 'number' | 'boolean' | 'select' | 'string';
  unit?: string;
  unit_bn?: string;
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label_en: string; label_bn: string }[];
}

export interface EquipmentDef {
  id: string;
  name_en: string;
  name_bn: string;
  category: EquipmentCategory;
  domain: PhysicsDomain;
  description_en: string;
  description_bn: string;
  icon: string; // SVG icon identifier or path
  leastCount?: number;
  leastCountUnit?: string;
  leastCountUnit_bn?: string;
  zeroErrorRange?: [number, number];
  ratedMax?: number;
  ratedMaxUnit?: string;
  defaultProperties: Record<string, number | boolean | string>;
  propertySchema: EquipmentPropertyDef[];
  terminals?: EquipmentTerminal[];
  width?: number; // default rendering width on workbench
  height?: number; // default rendering height
}

export interface BenchItem {
  id: string;
  equipmentId: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270 in degrees
  properties: Record<string, number | boolean | string>;
  state: Record<string, any>;
  burnedOut?: boolean;
  locked?: boolean;
}

export interface CircuitWire {
  id: string;
  fromItemId: string;
  fromTerminalId: string;
  toItemId: string;
  toTerminalId: string;
  color: 'red' | 'black' | 'blue' | 'green' | 'yellow';
  resistance?: number; // ohms (default ~0.001)
}

export interface CircuitNodeVoltage {
  nodeId: string;
  voltage: number; // Volts
}

export interface ComponentCircuitResult {
  itemId: string;
  voltageDrop: number; // V
  current: number; // A (branch current)
  power: number; // Watts
  burnedOut: boolean;
  deflection?: number; // for meters (-30 to +30 divs or reading)
  displayReading?: number;
  displayUnit?: string;
  polarityError?: boolean;
}

export interface CircuitSolverResult {
  solved: boolean;
  isOpenCircuit: boolean;
  isShortCircuit: boolean;
  nodeVoltages: Record<string, number>;
  componentResults: Record<string, ComponentCircuitResult>;
  error?: string;
}

export interface RayPoint {
  x: number;
  y: number;
}

export interface OpticalRay {
  points: RayPoint[];
  color: string;
  intensity: number;
  label?: string;
}

export interface OpticalImageResult {
  exists: boolean;
  x: number; // image position along optical axis
  height: number;
  isReal: boolean;
  isErect: boolean;
  magnification: number;
  focalLength: number;
  focalLengthSecondary?: number;
  blurRadius?: number; // on screen at current screen pos
}

export interface OpticsSimulationResult {
  rays: OpticalRay[];
  images: OpticalImageResult[];
  deviationAngle?: number; // for prism
  refractiveIndexCalculated?: number;
  fringeWidthMm?: number; // for Young's double slit
  diffractionAngles?: number[]; // for grating
  screenIntensityProfile?: { position: number; intensity: number }[];
}

export interface MechanicsState {
  time: number;
  running: boolean;
  speedMultiplier: number;
  gravity: number; // m/s^2 (default 9.8)
  friction: number;
  // Pendulum
  pendulumLength: number; // m
  pendulumAngle: number; // rad
  pendulumAngularVelocity: number;
  pendulumMass: number; // kg
  pendulumPeriod: number;
  pendulumOscillations: number;
  // Spring
  springConstant: number; // N/m
  springMass: number; // kg
  springDisplacement: number; // m
  springVelocity: number;
  springPeriod: number;
  // Inclined plane
  inclineAngle: number; // deg
  inclineMass: number; // kg
  inclineFrictionCoeff: number;
  inclinePosition: number; // m along plane
  inclineVelocity: number;
  inclineAcceleration: number;
  // Projectile
  projectileAngle: number; // deg
  projectileInitialVelocity: number; // m/s
  projectileTrajectory: { x: number; y: number; t: number }[];
  projectileRange: number;
  projectileMaxHeight: number;
  projectileFlightTime: number;
  // Atwood
  atwoodM1: number; // kg
  atwoodM2: number; // kg
  atwoodAcceleration: number;
  atwoodTension: number;
  atwoodPos1: number;
  atwoodPos2: number;
}

export interface WaveSimulationState {
  frequency: number; // Hz
  wavelength: number; // m
  amplitude: number;
  waveSpeed: number; // m/s
  // Resonance tube
  tubeWaterLevel: number; // cm
  resonancePoints: number[]; // cm
  isResonating: boolean;
  resonanceIntensity: number;
  // Sonometer
  sonometerLength: number; // m
  sonometerTension: number; // N (M*g)
  sonometerLinearDensity: number; // kg/m
  sonometerResonantFreq: number;
  paperRiderFell: boolean;
  // Oscilloscope
  ch1Waveform: 'sine' | 'square' | 'triangle';
  ch1Frequency: number;
  ch1Amplitude: number;
  ch2Frequency: number;
  ch2Amplitude: number;
  ch2Phase: number; // deg
  timeBaseMs: number; // ms/div
  voltsPerDiv: number;
  isLissajous: boolean;
}

export interface ThermoSimulationState {
  ambientTemp: number; // °C
  calorimeterMaterial: 'copper' | 'aluminum' | 'glass';
  calorimeterMass: number; // g
  waterMass: number; // g
  waterInitialTemp: number; // °C
  sampleMaterial: 'copper' | 'iron' | 'aluminum' | 'lead' | 'brass';
  sampleMass: number; // g
  sampleInitialTemp: number; // °C
  equilibriumTemp: number; // °C
  calculatedSpecificHeat: number;
  heaterWatts: number;
  heaterRunning: boolean;
  jouleCurrent: number; // A
  jouleVoltage: number; // V
  jouleTimeSec: number;
  jouleWaterTemp: number;
  searlesConductivity?: number;
}

export interface ModernSimulationState {
  // Photoelectric effect
  incidentWavelengthNm: number; // nm
  incidentIntensityPercent: number; // %
  targetCathodeMaterial: 'cesium' | 'potassium' | 'sodium' | 'zinc' | 'copper' | 'platinum';
  workFunctionEv: number;
  photonEnergyEv: number;
  retardingVoltage: number; // V
  photoCurrent: number; // microamperes
  stoppingPotential: number; // V
  isEmitting: boolean;
  // GM counter / Radioactive decay
  radioactiveIsotope: 'cobalt-60' | 'cesium-137' | 'strontium-90' | 'radium-226';
  halfLifeSeconds: number;
  sourceDistanceCm: number;
  shieldingMaterial: 'none' | 'paper' | 'aluminum' | 'lead';
  shieldingThicknessMm: number;
  countsPerSecond: number;
  totalCounts: number;
  elapsedSeconds: number;
}

export interface MeasurementReadingResult {
  toolId: 'vernier-caliper' | 'screw-gauge' | 'travelling-microscope' | 'spherometer' | 'stopwatch';
  mainScaleReading: number;
  vernierOrCircularReading: number;
  leastCount: number;
  zeroError: number;
  correctedReading: number;
  unit: string;
  breakdown: string;
  breakdown_bn: string;
}

export interface DataColumnDef {
  key: string;
  label_en: string;
  label_bn: string;
  unit?: string;
  unit_bn?: string;
  decimals?: number;
}

export interface DataRow {
  id: string;
  timestamp: number;
  values: Record<string, number | string>;
  calculatedValue?: number;
  theoreticalValue?: number;
  percentageError?: number;
  note?: string;
}

export interface QuizQuestion {
  id: string;
  question_en: string;
  question_bn: string;
  options: {
    id: string;
    text_en: string;
    text_bn: string;
  }[];
  correctOptionId: string;
  explanation_en: string;
  explanation_bn: string;
}

export interface ProcedureStep {
  stepNumber: number;
  instruction_en: string;
  instruction_bn: string;
  hint_en?: string;
  hint_bn?: string;
  checkType?: 'wire_connected' | 'item_placed' | 'parameter_set' | 'reading_taken' | 'switch_closed' | 'graph_plotted';
  expectedItemId?: string;
  expectedProperty?: string;
  expectedValue?: any;
}

export interface GuidedPhysicsExperiment {
  id: string;
  slug: string;
  title_en: string;
  title_bn: string;
  category: EquipmentCategory;
  domain: PhysicsDomain;
  level: 'class-6-8' | 'class-9-10' | 'class-11-12' | 'honours';
  durationMinutes: number;
  aim_en: string;
  aim_bn: string;
  theory_en: string;
  theory_bn: string;
  formula_latex: string;
  formula_desc_en: string;
  formula_desc_bn: string;
  apparatusRequired: string[]; // equipment IDs
  setup: {
    items: {
      equipmentId: string;
      x: number;
      y: number;
      rotation?: number;
      properties?: Record<string, any>;
    }[];
    wires?: {
      fromItemIndex: number;
      fromTerminalId: string;
      toItemIndex: number;
      toTerminalId: string;
      color?: 'red' | 'black' | 'blue' | 'green' | 'yellow';
    }[];
    domainState?: Record<string, any>;
  };
  procedureSteps: ProcedureStep[];
  precautions_en: string[];
  precautions_bn: string[];
  dataColumns: DataColumnDef[];
  theoreticalTarget: {
    formulaName: string;
    expectedConstant?: number;
    expectedConstantUnit?: string;
    xColumn: string;
    yColumn: string;
    slopeFormula?: string;
  };
  quiz: QuizQuestion[];
}
