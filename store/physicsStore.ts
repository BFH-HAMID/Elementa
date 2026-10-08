import { create } from 'zustand';
import type {
  BenchItem,
  CircuitWire,
  CircuitSolverResult,
  DataRow,
  EquipmentCategory,
  MechanicsState,
  ModernSimulationState,
  OpticsSimulationResult,
  PhysicsDomain,
  ThermoSimulationState,
  WaveSimulationState
} from '@/engine/physicsTypes';
import { solveCircuit } from '@/engine/circuitSolver';
import {
  calculateLensImage,
  calculateMirrorImage,
  calculateDoubleSlitPattern,
  calculatePrismRefraction,
  calculateScreenBlur
} from '@/engine/opticsEngine';
import {
  calculatePendulumStep,
  calculateSpringStep,
  calculateInclinedPlaneStep,
  calculateProjectileMotion,
  calculateAtwoodMachine
} from '@/engine/mechanicsEngine';
import {
  calculateResonanceTube,
  calculateSonometer
} from '@/engine/waveEngine';
import {
  calculateMethodOfMixtures,
  calculateJouleHeatingStep
} from '@/engine/thermoEngine';
import {
  calculatePhotoelectricEffect,
  calculateGmCounter
} from '@/engine/emEngine';
import { applyMeasurementNoise, calculatePercentageError } from '@/engine/measurement';
import { equipmentById, physicsExperimentsBySlug } from '@/lib/physicsData';
import { findFreeSpot, isLinkPort } from '@/lib/physicsBench';
import {
  clampToControl,
  defaultParams,
  getPracticalModel,
  makeNoise,
  runPractical,
  summarizeResult,
  type PracticalParams
} from '@/engine/practicals';

export type PhysicsBenchMode =
  | 'workbench'
  | 'optics'
  | 'mechanics'
  | 'waves'
  | 'thermo'
  | 'modern'
  | 'practical';

export type PhysicsTab = 'workbench' | 'graph' | 'table' | 'theory' | 'quiz';

export interface PhysicsStoreState {
  mode: PhysicsBenchMode;
  activeTab: PhysicsTab;
  items: BenchItem[];
  wires: CircuitWire[];
  selectedItemId: string | null;
  selectedWireId: string | null;
  connectingWireFrom: { itemId: string; terminalId: string } | null;
  measuringToolModal: 'vernier-caliper' | 'screw-gauge' | 'travelling-microscope' | null;

  // Domain simulation states
  circuitResult: CircuitSolverResult;
  opticsResult: OpticsSimulationResult;
  mechanicsState: MechanicsState;
  waveState: WaveSimulationState;
  thermoState: ThermoSimulationState;
  modernState: ModernSimulationState;

  // Guided Experiments & Notebook
  activeExperimentSlug: string | null;
  completedSteps: number[];
  quizAnswers: Record<string, string>;
  quizSubmitted: boolean;

  // Data recording & Noise
  noiseEnabled: boolean;
  noiseLevel: number;
  dataRows: DataRow[];

  // Interactive practical simulation (mode 'practical')
  practicalParams: PracticalParams;
  /** Date.now() when the current practical process (heating, mixing, settling…) started. */
  practicalClockStart: number;

  // History
  historyPast: { items: BenchItem[]; wires: CircuitWire[] }[];
  historyFuture: { items: BenchItem[]; wires: CircuitWire[] }[];

  // Actions
  setMode: (mode: PhysicsBenchMode) => void;
  setActiveTab: (tab: PhysicsTab) => void;
  addItem: (equipmentId: string, x?: number, y?: number) => string;
  updateItem: (id: string, partial: Partial<BenchItem>) => void;
  /** Moves an item without re-solving physics (positions don't change the circuit). */
  moveItem: (id: string, x: number, y: number) => void;
  duplicateItem: (id: string) => string;
  /** Snapshot the bench so the next change can be undone (used at the start of a drag). */
  pushHistory: () => void;
  updateItemProperties: (id: string, properties: Record<string, any>) => void;
  removeItem: (id: string) => void;
  rotateItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  clearBench: () => void;

  startConnectingWire: (itemId: string, terminalId: string) => void;
  finishConnectingWire: (itemId: string, terminalId: string, color?: CircuitWire['color']) => void;
  cancelConnectingWire: () => void;
  removeWire: (wireId: string) => void;
  connectPorts: (
    from: { itemId: string; terminalId: string },
    to: { itemId: string; terminalId: string },
    color?: CircuitWire['color']
  ) => string | null;
  selectWire: (wireId: string | null) => void;
  updateWire: (wireId: string, partial: Partial<Pick<CircuitWire, 'color'>>) => void;

  setMeasuringToolModal: (tool: 'vernier-caliper' | 'screw-gauge' | 'travelling-microscope' | null) => void;
  setNoiseEnabled: (enabled: boolean) => void;
  setNoiseLevel: (level: number) => void;

  loadExperiment: (slug: string) => void;
  resetExperiment: () => void;
  toggleStepComplete: (stepNumber: number) => void;
  setQuizAnswer: (questionId: string, optionId: string) => void;
  submitQuiz: () => void;
  resetQuiz: () => void;

  recordCurrentDataRow: (note?: string) => void;
  addDataRow: (values: Record<string, number | string>, note?: string) => void;
  removeDataRow: (id: string) => void;
  clearDataRows: () => void;

  setPracticalParam: (key: string, value: number) => void;
  setPracticalParams: (params: PracticalParams) => void;
  restartPracticalClock: () => void;
  resetPracticalParams: () => void;
  /** Seconds since the current practical process started. */
  getPracticalElapsed: () => number;

  recomputeSimulation: () => void;
  stepMechanics: (dt?: number) => void;
  toggleMechanicsRunning: () => void;
  resetMechanics: () => void;
  /** Change the parameters of the live mechanics bench (lengths, angles, masses…). */
  updateMechanics: (partial: Partial<MechanicsState>) => void;

  saveToLocalStorage: () => boolean;
  loadFromLocalStorage: () => boolean;
  undo: () => void;
  redo: () => void;
}

const initialMechanicsState: MechanicsState = {
  time: 0,
  running: true,
  speedMultiplier: 1.0,
  gravity: 9.80665,
  friction: 0.35,
  pendulumLength: 1.0,
  pendulumAngle: 0.08,
  pendulumAngularVelocity: 0,
  pendulumMass: 0.05,
  pendulumPeriod: 2.006,
  pendulumOscillations: 0,
  springConstant: 25,
  springMass: 0.1,
  springDisplacement: 0.03,
  springVelocity: 0,
  springPeriod: 0.397,
  inclineAngle: 30,
  inclineMass: 0.5,
  inclineFrictionCoeff: 0.35,
  inclinePosition: 0,
  inclineVelocity: 0,
  inclineAcceleration: 0,
  projectileAngle: 45,
  projectileInitialVelocity: 10,
  projectileTrajectory: [],
  projectileRange: 10.197,
  projectileMaxHeight: 2.549,
  projectileFlightTime: 1.442,
  atwoodM1: 0.22,
  atwoodM2: 0.20,
  atwoodAcceleration: 0.467,
  atwoodTension: 2.055,
  atwoodPos1: 1.0,
  atwoodPos2: 0.2
};

const initialWaveState: WaveSimulationState = {
  frequency: 512,
  wavelength: 0.672,
  amplitude: 1.0,
  waveSpeed: 344.0,
  tubeWaterLevel: 15.9,
  resonancePoints: [15.9, 49.5],
  isResonating: true,
  resonanceIntensity: 90,
  sonometerLength: 0.35,
  sonometerTension: 24.52,
  sonometerLinearDensity: 0.00153,
  sonometerResonantFreq: 256,
  paperRiderFell: true,
  ch1Waveform: 'sine',
  ch1Frequency: 1000,
  ch1Amplitude: 5.0,
  ch2Frequency: 1000,
  ch2Amplitude: 5.0,
  ch2Phase: 0,
  timeBaseMs: 1.0,
  voltsPerDiv: 1.0,
  isLissajous: false
};

const initialThermoState: ThermoSimulationState = {
  ambientTemp: 22,
  calorimeterMaterial: 'copper',
  calorimeterMass: 85,
  waterMass: 150,
  waterInitialTemp: 22,
  sampleMaterial: 'copper',
  sampleMass: 100,
  sampleInitialTemp: 100,
  equilibriumTemp: 26.2,
  calculatedSpecificHeat: 385,
  heaterWatts: 50,
  heaterRunning: false,
  jouleCurrent: 2.0,
  jouleVoltage: 12.0,
  jouleTimeSec: 0,
  jouleWaterTemp: 22
};

const initialModernState: ModernSimulationState = {
  incidentWavelengthNm: 365,
  incidentIntensityPercent: 80,
  targetCathodeMaterial: 'potassium',
  workFunctionEv: 2.30,
  photonEnergyEv: 3.40,
  retardingVoltage: 0,
  photoCurrent: 12.0,
  stoppingPotential: 1.10,
  isEmitting: true,
  radioactiveIsotope: 'cobalt-60',
  halfLifeSeconds: 1.66e8,
  sourceDistanceCm: 10,
  shieldingMaterial: 'none',
  shieldingThicknessMm: 0,
  countsPerSecond: 20.4,
  totalCounts: 0,
  elapsedSeconds: 0
};

export const usePhysicsStore = create<PhysicsStoreState>((set, get) => ({
  mode: 'workbench',
  activeTab: 'workbench',
  items: [],
  wires: [],
  selectedItemId: null,
  selectedWireId: null,
  connectingWireFrom: null,
  measuringToolModal: null,

  circuitResult: {
    solved: true,
    isOpenCircuit: true,
    isShortCircuit: false,
    nodeVoltages: {},
    componentResults: {}
  },

  opticsResult: {
    rays: [],
    images: []
  },

  mechanicsState: initialMechanicsState,
  waveState: initialWaveState,
  thermoState: initialThermoState,
  modernState: initialModernState,

  activeExperimentSlug: null,
  completedSteps: [],
  quizAnswers: {},
  quizSubmitted: false,

  noiseEnabled: true,
  noiseLevel: 1.0,
  dataRows: [],

  practicalParams: {},
  practicalClockStart: 0,

  historyPast: [],
  historyFuture: [],

  setMode: (mode) => {
    if (mode === 'practical' && !getPracticalModel(get().activeExperimentSlug)) return;
    set(mode === 'practical' ? { mode, practicalClockStart: Date.now() } : { mode });
    get().recomputeSimulation();
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  addItem: (equipmentId, xIn, yIn) => {
    const def = equipmentById.get(equipmentId);
    if (!def) return '';

    const { items, wires, historyPast } = get();
    const spot = xIn === undefined || yIn === undefined ? findFreeSpot(items, def) : null;
    const x = xIn ?? spot!.x;
    const y = yIn ?? spot!.y;
    // Save history
    const newPast = [...historyPast.slice(-29), { items: [...items], wires: [...wires] }];

    const id = `${equipmentId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem: BenchItem = {
      id,
      equipmentId,
      x,
      y,
      rotation: 0,
      properties: { ...def.defaultProperties },
      state: {}
    };

    const nextItems = [...items, newItem];
    set({ items: nextItems, historyPast: newPast, historyFuture: [], selectedItemId: id, selectedWireId: null });
    get().recomputeSimulation();
    return id;
  },

  updateItem: (id, partial) => {
    const { items } = get();
    const nextItems = items.map((it) => (it.id === id ? { ...it, ...partial } : it));
    set({ items: nextItems });
    get().recomputeSimulation();
  },

  moveItem: (id, x, y) => {
    set({ items: get().items.map((it) => (it.id === id ? { ...it, x, y } : it)) });
  },

  duplicateItem: (id) => {
    const source = get().items.find((it) => it.id === id);
    if (!source) return '';
    const newId = get().addItem(source.equipmentId, source.x + 32, source.y + 32);
    if (!newId) return '';
    set({
      items: get().items.map((it) =>
        it.id === newId ? { ...it, rotation: source.rotation, properties: { ...source.properties } } : it
      )
    });
    get().recomputeSimulation();
    return newId;
  },

  pushHistory: () => {
    const { items, wires, historyPast } = get();
    set({ historyPast: [...historyPast.slice(-29), { items: [...items], wires: [...wires] }], historyFuture: [] });
  },

  updateItemProperties: (id, properties) => {
    const { items } = get();
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, properties: { ...it.properties, ...properties } } : it
    );
    set({ items: nextItems });
    get().recomputeSimulation();
  },

  removeItem: (id) => {
    const { items, wires, historyPast } = get();
    const newPast = [...historyPast.slice(-29), { items: [...items], wires: [...wires] }];
    const nextItems = items.filter((it) => it.id !== id);
    const nextWires = wires.filter((w) => w.fromItemId !== id && w.toItemId !== id);
    set({
      items: nextItems,
      wires: nextWires,
      selectedItemId: null,
      selectedWireId: null,
      historyPast: newPast,
      historyFuture: []
    });
    get().recomputeSimulation();
  },

  rotateItem: (id) => {
    get().pushHistory();
    const { items } = get();
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, rotation: (it.rotation + 90) % 360 } : it
    );
    set({ items: nextItems });
    get().recomputeSimulation();
  },

  selectItem: (id) => set({ selectedItemId: id, selectedWireId: id ? null : get().selectedWireId }),

  clearBench: () => {
    const { items, wires, historyPast } = get();
    if (items.length === 0 && wires.length === 0) return;
    const newPast = [...historyPast.slice(-29), { items: [...items], wires: [...wires] }];
    set({
      items: [],
      wires: [],
      selectedItemId: null,
      selectedWireId: null,
      connectingWireFrom: null,
      historyPast: newPast,
      historyFuture: []
    });
    get().recomputeSimulation();
  },

  startConnectingWire: (itemId, terminalId) => {
    const current = get().connectingWireFrom;
    if (current && current.itemId === itemId && current.terminalId === terminalId) {
      set({ connectingWireFrom: null });
      return;
    }
    set({ connectingWireFrom: { itemId, terminalId } });
  },

  finishConnectingWire: (toItemId, toTerminalId, color) => {
    const from = get().connectingWireFrom;
    if (!from) return;
    set({ connectingWireFrom: null });
    get().connectPorts(from, { itemId: toItemId, terminalId: toTerminalId }, color);
  },

  connectPorts: (from, to, color) => {
    if (from.itemId === to.itemId && from.terminalId === to.terminalId) return null;
    const { wires, items, historyPast } = get();
    if (!items.some((it) => it.id === from.itemId) || !items.some((it) => it.id === to.itemId)) return null;

    // Never stack two identical wires between the same pair of ports.
    const duplicate = wires.find(
      (w) =>
        (w.fromItemId === from.itemId && w.fromTerminalId === from.terminalId && w.toItemId === to.itemId && w.toTerminalId === to.terminalId) ||
        (w.fromItemId === to.itemId && w.fromTerminalId === to.terminalId && w.toItemId === from.itemId && w.toTerminalId === from.terminalId)
    );
    if (duplicate) {
      set({ selectedWireId: duplicate.id, selectedItemId: null, connectingWireFrom: null });
      return duplicate.id;
    }

    const newPast = [...historyPast.slice(-29), { items: [...items], wires: [...wires] }];
    const kind: CircuitWire['kind'] = isLinkPort(from.terminalId) || isLinkPort(to.terminalId) ? 'link' : 'wire';

    // Auto assign wire colour based on terminal if not specified
    let wireColor: CircuitWire['color'] = color || 'blue';
    if (!color) {
      const ids = [from.terminalId, to.terminalId];
      if (kind === 'link') wireColor = 'green';
      else if (ids.some((t) => t === 'pos' || t === 'red' || t === 'anode' || t === 'live')) wireColor = 'red';
      else if (ids.some((t) => t === 'neg' || t === 'gnd' || t === 'black' || t === 'cathode' || t === 'neutral')) wireColor = 'black';
    }

    const wireId = `wire-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newWire: CircuitWire = {
      id: wireId,
      fromItemId: from.itemId,
      fromTerminalId: from.terminalId,
      toItemId: to.itemId,
      toTerminalId: to.terminalId,
      color: wireColor,
      kind
    };

    set({
      wires: [...wires, newWire],
      connectingWireFrom: null,
      historyPast: newPast,
      historyFuture: []
    });
    get().recomputeSimulation();
    return wireId;
  },

  selectWire: (wireId) => set({ selectedWireId: wireId, selectedItemId: wireId ? null : get().selectedItemId }),

  updateWire: (wireId, partial) => {
    get().pushHistory();
    set({ wires: get().wires.map((w) => (w.id === wireId ? { ...w, ...partial } : w)) });
  },

  cancelConnectingWire: () => set({ connectingWireFrom: null }),

  removeWire: (wireId) => {
    const { wires, items, historyPast } = get();
    const newPast = [...historyPast.slice(-29), { items: [...items], wires: [...wires] }];
    set({
      wires: wires.filter((w) => w.id !== wireId),
      selectedWireId: get().selectedWireId === wireId ? null : get().selectedWireId,
      historyPast: newPast,
      historyFuture: []
    });
    get().recomputeSimulation();
  },

  setMeasuringToolModal: (tool) => set({ measuringToolModal: tool }),
  setNoiseEnabled: (enabled) => {
    set({ noiseEnabled: enabled });
    get().recomputeSimulation();
  },
  setNoiseLevel: (level) => {
    set({ noiseLevel: level });
    get().recomputeSimulation();
  },

  loadExperiment: (slug) => {
    const exp = physicsExperimentsBySlug.get(slug);
    if (!exp) return;

    // Convert setup items & wires
    const items: BenchItem[] = exp.setup.items.map((it, idx) => ({
      id: `exp-${it.equipmentId}-${idx}`,
      equipmentId: it.equipmentId,
      x: it.x,
      y: it.y,
      rotation: it.rotation || 0,
      properties: {
        ...(equipmentById.get(it.equipmentId)?.defaultProperties || {}),
        ...(it.properties || {})
      },
      state: {}
    }));

    const wires: CircuitWire[] = (exp.setup.wires || []).map((w, idx) => ({
      id: `exp-wire-${idx}`,
      fromItemId: items[w.fromItemIndex]?.id || '',
      fromTerminalId: w.fromTerminalId,
      toItemId: items[w.toItemIndex]?.id || '',
      toTerminalId: w.toTerminalId,
      color: w.color || 'blue'
    }));

    let targetMode: PhysicsBenchMode = 'workbench';
    if (exp.category === 'optics') targetMode = 'optics';
    else if (exp.category === 'mechanics') targetMode = 'mechanics';
    else if (exp.category === 'waves') targetMode = 'waves';
    else if (exp.category === 'heat') targetMode = 'thermo';
    else if (exp.category === 'modern-physics') targetMode = 'modern';
    const practicalModel = getPracticalModel(slug);
    if (practicalModel) targetMode = 'practical';

    set({
      activeExperimentSlug: slug,
      items,
      wires,
      mode: targetMode,
      completedSteps: [],
      quizAnswers: {},
      quizSubmitted: false,
      dataRows: [],
      practicalParams: practicalModel ? defaultParams(practicalModel) : {},
      practicalClockStart: Date.now(),
      activeTab: 'workbench',
      selectedItemId: null,
      selectedWireId: null,
      connectingWireFrom: null
    });

    get().recomputeSimulation();
  },

  resetExperiment: () => {
    const { activeExperimentSlug } = get();
    if (activeExperimentSlug) {
      get().loadExperiment(activeExperimentSlug);
    }
  },

  toggleStepComplete: (stepNumber) => {
    const { completedSteps } = get();
    const nextSteps = completedSteps.includes(stepNumber)
      ? completedSteps.filter((s) => s !== stepNumber)
      : [...completedSteps, stepNumber];
    set({ completedSteps: nextSteps });
  },

  setQuizAnswer: (questionId, optionId) => {
    const { quizAnswers } = get();
    set({ quizAnswers: { ...quizAnswers, [questionId]: optionId } });
  },

  submitQuiz: () => set({ quizSubmitted: true }),
  resetQuiz: () => set({ quizAnswers: {}, quizSubmitted: false }),

  recordCurrentDataRow: (note) => {
    const { mode, circuitResult, opticsResult, mechanicsState, waveState, thermoState, modernState, noiseEnabled, noiseLevel, activeExperimentSlug, dataRows } = get();
    const exp = activeExperimentSlug ? physicsExperimentsBySlug.get(activeExperimentSlug) : null;
    const values: Record<string, number | string> = {};

    values.obsNo = dataRows.length + 1;

    const practical = mode === 'practical' ? getPracticalModel(activeExperimentSlug) : null;

    // Grab values based on current active domain / experiment
    if (practical) {
      const rows = dataRows.map((r) => r.values);
      const out = runPractical(practical, get().practicalParams, {
        noise: makeNoise(noiseEnabled, noiseLevel),
        elapsed: get().getPracticalElapsed(),
        rows
      });
      Object.assign(values, out.row);
      values.obsNo = dataRows.length + 1;
      // Hidden marker (not a table column) so the simulator can tick suggested settings.
      if (practical.sweep) values.__sweep = get().practicalParams[practical.sweep.key];
      const summary = practical.result.absolute || practical.result.rowwise === false
        ? null
        : summarizeResult(practical, [values], get().practicalParams);
      const newRow: DataRow = {
        id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        values,
        calculatedValue: summary?.value ?? undefined,
        theoreticalValue: summary?.expected,
        percentageError: summary?.error ?? undefined,
        note: note ?? (out.ready === false ? 'not at a valid setting' : undefined)
      };
      const nextRows = [...dataRows, newRow];
      // Tick procedure steps as the student progresses through the readings.
      const steps = exp?.procedureSteps ?? [];
      const done = Math.ceil(steps.length * Math.min(1, nextRows.length / Math.max(1, practical.minReadings)));
      const completedSteps = Array.from(new Set([...get().completedSteps, ...steps.slice(0, done).map((st) => st.stepNumber)])).sort((a, b) => a - b);
      set({ dataRows: nextRows, completedSteps });
      return;
    } else if (exp?.id === 'ohms-law') {
      const vResult = Object.values(circuitResult.componentResults).find((r) => r.itemId.includes('voltmeter') || r.itemId.includes('resistor'));
      const iResult = Object.values(circuitResult.componentResults).find((r) => r.itemId.includes('ammeter') || r.itemId.includes('resistor'));
      const volt = applyMeasurementNoise(vResult?.voltageDrop || 2.0, 0.05, noiseEnabled, noiseLevel);
      const curr = applyMeasurementNoise(iResult?.current || 0.2, 0.005, noiseEnabled, noiseLevel);
      values.voltage = Number(volt.toFixed(2));
      values.current = Number(curr.toFixed(3));
      values.resistanceCalc = curr > 0 ? Number((volt / curr).toFixed(2)) : 0;
    } else if (exp?.id === 'simple-pendulum') {
      const L = mechanicsState.pendulumLength;
      const T = applyMeasurementNoise(mechanicsState.pendulumPeriod, 0.02, noiseEnabled, noiseLevel);
      values.lengthL = Number(L.toFixed(3));
      values.time20 = Number((T * 20).toFixed(2));
      values.periodT = Number(T.toFixed(3));
      values.periodTSq = Number((T * T).toFixed(3));
      values.gCalc = Number(((4 * Math.PI * Math.PI * L) / (T * T)).toFixed(3));
    } else if (exp?.id === 'spring-constant') {
      const m = mechanicsState.springMass;
      const F = m * mechanicsState.gravity;
      const x = applyMeasurementNoise((F / mechanicsState.springConstant), 0.001, noiseEnabled, noiseLevel);
      values.massKg = Number(m.toFixed(3));
      values.forceN = Number(F.toFixed(3));
      values.extensionM = Number(x.toFixed(4));
      values.kStatic = x > 0 ? Number((F / x).toFixed(2)) : 0;
    } else if (exp?.id === 'focal-length-convex-lens') {
      const u = 40;
      const f = 15;
      const v = applyMeasurementNoise((u * f) / (u - f), 0.1, noiseEnabled, noiseLevel);
      values.uCm = u;
      values.vCm = Number(v.toFixed(1));
      values.invU = Number((1 / u).toFixed(4));
      values.invV = Number((1 / v).toFixed(4));
      values.fCalc = Number(((u * v) / (u + v)).toFixed(2));
    } else if (exp?.id === 'speed-of-sound-resonance-tube') {
      const tube = calculateResonanceTube(waveState.frequency, waveState.tubeWaterLevel);
      const l1 = applyMeasurementNoise(tube.firstResonanceLengthCm, 0.1, noiseEnabled, noiseLevel);
      const l2 = applyMeasurementNoise(tube.secondResonanceLengthCm, 0.1, noiseEnabled, noiseLevel);
      values.forkFreqHz = waveState.frequency;
      values.resLengthL1 = Number(l1.toFixed(1));
      values.resLengthL2 = Number(l2.toFixed(1));
      values.diffL2minusL1 = Number((l2 - l1).toFixed(1));
      values.soundSpeedMps = Number((2 * waveState.frequency * ((l2 - l1) / 100)).toFixed(1));
    } else if (exp?.id === 'photoelectric-effect') {
      const pe = calculatePhotoelectricEffect(modernState.incidentWavelengthNm, 0, modernState.targetCathodeMaterial);
      const v0 = applyMeasurementNoise(pe.stoppingPotentialVolts, 0.01, noiseEnabled, noiseLevel);
      values.lambdaNm = modernState.incidentWavelengthNm;
      values.freqNu = Number(((3e8 / (modernState.incidentWavelengthNm * 1e-9)) / 1e14).toFixed(3));
      values.stoppingPotV = Number(v0.toFixed(3));
      values.hCalc = Number((((v0 * 1.602e-19 + 2.30 * 1.602e-19) / (values.freqNu as number * 1e14)) * 1e34).toFixed(3));
    } else if (exp?.modelReadings) {
      // Practical stations expose a clearly labelled model reading so the table,
      // CSV export and graph are useful even when no continuous simulator exists.
      Object.entries(exp.modelReadings).forEach(([key, value]) => {
        values[key] = value;
      });
    } else {
      // Free-play defaults
      values.x = dataRows.length + 1;
      values.y = Number((Math.random() * 10 + 2).toFixed(2));
    }

    let calculatedValue: number | undefined;
    let theoreticalValue: number | undefined;
    let percentageError: number | undefined;

    if (exp?.theoreticalTarget?.expectedConstant) {
      theoreticalValue = exp.theoreticalTarget.expectedConstant;
      const targetCol = exp.theoreticalTarget.yColumn;
      if (typeof values[targetCol] === 'number') {
        calculatedValue = values[targetCol] as number;
        percentageError = calculatePercentageError(calculatedValue, theoreticalValue).percentError;
      }
    }

    const newRow: DataRow = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      values,
      calculatedValue,
      theoreticalValue,
      percentageError,
      note
    };

    set({ dataRows: [...dataRows, newRow] });
  },

  addDataRow: (values, note) => {
    const { dataRows } = get();
    const newRow: DataRow = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      values,
      note
    };
    set({ dataRows: [...dataRows, newRow] });
  },

  removeDataRow: (id) => {
    const { dataRows } = get();
    set({ dataRows: dataRows.filter((r) => r.id !== id) });
  },

  clearDataRows: () => set({ dataRows: [] }),

  setPracticalParam: (key, value) => {
    const model = getPracticalModel(get().activeExperimentSlug);
    if (!model) return;
    const control = model.controls.find((c) => c.key === key);
    if (!control) return;
    const v = clampToControl(control, value);
    const current = get().practicalParams;
    if (current[key] === v) return;
    set({ practicalParams: { ...defaultParams(model), ...current, [key]: v }, practicalClockStart: Date.now() });
  },

  setPracticalParams: (params) => {
    const model = getPracticalModel(get().activeExperimentSlug);
    if (!model) return;
    const next: PracticalParams = { ...defaultParams(model), ...get().practicalParams };
    for (const c of model.controls) if (params[c.key] !== undefined) next[c.key] = clampToControl(c, params[c.key]);
    set({ practicalParams: next, practicalClockStart: Date.now() });
  },

  restartPracticalClock: () => set({ practicalClockStart: Date.now() }),

  resetPracticalParams: () => {
    const model = getPracticalModel(get().activeExperimentSlug);
    if (!model) return;
    set({ practicalParams: defaultParams(model), practicalClockStart: Date.now() });
  },

  getPracticalElapsed: () => {
    const start = get().practicalClockStart;
    return start > 0 ? Math.max(0, (Date.now() - start) / 1000) : 0;
  },

  recomputeSimulation: () => {
    const { items, wires, mode, activeExperimentSlug } = get();

    // 1. Circuit Solver
    const circuitResult = solveCircuit(items, wires);

    // 2. Optics simulation
    let opticsResult: OpticsSimulationResult = { rays: [], images: [] };
    const lensItem = items.find((it) => it.equipmentId === 'lens-convex' || it.equipmentId === 'lens-concave');
    const mirrorItem = items.find((it) => it.equipmentId === 'mirror-convex' || it.equipmentId === 'mirror-concave');
    const prismItem = items.find((it) => it.equipmentId === 'triangular-prism');
    const slitItem = items.find((it) => it.equipmentId === 'double-slit-slide');

    if (lensItem) {
      const f = Number(lensItem.properties.focalLengthCm ?? 15);
      const pos = Number(lensItem.properties.positionCm ?? 50);
      const img = calculateLensImage(pos, f, 2.0, pos);
      opticsResult.images.push(img);
    } else if (mirrorItem) {
      const f = Number(mirrorItem.properties.focalLengthCm ?? 20);
      const pos = Number(mirrorItem.properties.positionCm ?? 80);
      const img = calculateMirrorImage(pos, f, 2.0, pos);
      opticsResult.images.push(img);
    }

    if (prismItem) {
      const prism = calculatePrismRefraction(48.59, 60, Number(prismItem.properties.refractiveIndex ?? 1.517));
      opticsResult.deviationAngle = prism.minimumDeviationDeg;
      opticsResult.refractiveIndexCalculated = 1.517;
    }

    if (slitItem) {
      const d = Number(slitItem.properties.slitSeparationMm ?? 0.25);
      const ds = calculateDoubleSlitPattern(632.8, d, 1.0);
      opticsResult.fringeWidthMm = ds.fringeWidthMm;
    }

    // 3. Projectile trajectory if item exists
    const projItem = items.find((it) => it.equipmentId === 'projectile-launcher');
    let mechanicsState = { ...get().mechanicsState };
    if (projItem) {
      const angle = Number(projItem.properties.launchAngleDeg ?? 45);
      const v0 = Number(projItem.properties.muzzleVelocity ?? 10);
      const res = calculateProjectileMotion(v0, angle);
      mechanicsState = {
        ...mechanicsState,
        projectileAngle: angle,
        projectileInitialVelocity: v0,
        projectileRange: res.rangeM,
        projectileMaxHeight: res.maxHeightM,
        projectileFlightTime: res.flightTimeS,
        projectileTrajectory: res.trajectory
      };
    }

    set({
      circuitResult,
      opticsResult,
      mechanicsState
    });
  },

  stepMechanics: (dt = 0.02) => {
    const { mechanicsState } = get();
    if (!mechanicsState.running) return;

    // Step simple pendulum
    const pend = calculatePendulumStep(
      mechanicsState.pendulumLength,
      mechanicsState.pendulumMass,
      mechanicsState.pendulumAngle,
      mechanicsState.pendulumAngularVelocity,
      dt * mechanicsState.speedMultiplier,
      mechanicsState.gravity,
      mechanicsState.friction * 0.01
    );

    // Step spring
    const spring = calculateSpringStep(
      mechanicsState.springConstant,
      mechanicsState.springMass,
      mechanicsState.springDisplacement,
      mechanicsState.springVelocity,
      dt * mechanicsState.speedMultiplier,
      mechanicsState.gravity
    );

    set({
      mechanicsState: {
        ...mechanicsState,
        time: mechanicsState.time + dt * mechanicsState.speedMultiplier,
        pendulumAngle: pend.angleRad,
        pendulumAngularVelocity: pend.angularVelocity,
        pendulumPeriod: pend.periodTheoretical,
        springDisplacement: spring.displacementM,
        springVelocity: spring.velocity,
        springPeriod: spring.periodTheoretical
      }
    });
  },

  updateMechanics: (partial) => {
    set({ mechanicsState: { ...get().mechanicsState, ...partial } });
  },

  toggleMechanicsRunning: () => {
    const { mechanicsState } = get();
    set({ mechanicsState: { ...mechanicsState, running: !mechanicsState.running } });
  },

  resetMechanics: () => {
    // Keep the user's chosen parameters; rewind the clock so the incline,
    // projectile and Atwood scenes restart from rest.
    const { mechanicsState } = get();
    set({
      mechanicsState: {
        ...mechanicsState,
        time: 0,
        pendulumAngle: mechanicsState.pendulumAngle > 0 ? mechanicsState.pendulumAngle : initialMechanicsState.pendulumAngle,
        pendulumAngularVelocity: 0,
        springDisplacement: initialMechanicsState.springDisplacement,
        springVelocity: 0,
        projectileTrajectory: []
      }
    });
  },

  saveToLocalStorage: () => {
    if (typeof window === 'undefined') return false;
    try {
      const { items, wires, mode, activeExperimentSlug, dataRows, completedSteps, practicalParams } = get();
      const payload = JSON.stringify({ items, wires, mode, activeExperimentSlug, dataRows, completedSteps, practicalParams });
      window.localStorage.setItem('elementa_physics_lab_save', payload);
      return true;
    } catch {
      return false;
    }
  },

  loadFromLocalStorage: () => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem('elementa_physics_lab_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      set({
        items: data.items || [],
        wires: data.wires || [],
        mode: data.mode === 'practical' && !getPracticalModel(data.activeExperimentSlug) ? 'workbench' : data.mode || 'workbench',
        activeExperimentSlug: data.activeExperimentSlug || null,
        practicalParams: data.practicalParams || (getPracticalModel(data.activeExperimentSlug) ? defaultParams(getPracticalModel(data.activeExperimentSlug)!) : {}),
        practicalClockStart: Date.now(),
        dataRows: data.dataRows || [],
        completedSteps: data.completedSteps || [],
        selectedItemId: null,
        selectedWireId: null,
        connectingWireFrom: null
      });
      get().recomputeSimulation();
      return true;
    } catch {
      return false;
    }
  },

  undo: () => {
    const { historyPast, historyFuture, items, wires } = get();
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);
    const newFuture = [{ items: [...items], wires: [...wires] }, ...historyFuture];
    set({ items: previous.items, wires: previous.wires, historyPast: newPast, historyFuture: newFuture, selectedWireId: null, connectingWireFrom: null });
    get().recomputeSimulation();
  },

  redo: () => {
    const { historyPast, historyFuture, items, wires } = get();
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    const newPast = [...historyPast, { items: [...items], wires: [...wires] }];
    set({ items: next.items, wires: next.wires, historyPast: newPast, historyFuture: newFuture, selectedWireId: null, connectingWireFrom: null });
    get().recomputeSimulation();
  }
}));
