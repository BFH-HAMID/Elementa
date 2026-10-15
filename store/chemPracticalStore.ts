import { create } from 'zustand';
import { CHEM_PRACTICAL_STORAGE_KEY } from '@/lib/chemPracticalProgress';
import {
  clampToControl,
  controlKind,
  getChemPracticalModel,
  inferenceControl,
  makeNoise,
  runChemPractical,
  tasksDone,
  timeControl,
  withDefaults,
  type ChemParams,
  type ChemPracticalModel,
  type ChemRow
} from '@/engine/chemPracticals';

/**
 * State for the interactive chemistry practical simulations.
 *
 * Kept apart from the drag-and-drop bench (`labStore`): each practical has its own
 * control settings and observation table, remembered per practical in localStorage
 * so a learner can come back and finish later.
 */

export { CHEM_PRACTICAL_STORAGE_KEY, readChemPracticalProgress } from '@/lib/chemPracticalProgress';

export interface ChemDataRow {
  id: string;
  values: ChemRow;
  at: number;
}

interface Session {
  params: ChemParams;
  rows: ChemDataRow[];
}

interface Persisted {
  sessions: Record<string, Session>;
  noiseEnabled: boolean;
}

export interface ChemPracticalState {
  slug: string | null;
  params: ChemParams;
  rows: ChemDataRow[];
  noiseEnabled: boolean;
  playing: boolean;
  sessions: Record<string, Session>;
  hydrated: boolean;
  open: (slug: string) => void;
  setParam: (key: string, value: number) => void;
  setParams: (next: ChemParams) => void;
  resetParams: () => void;
  record: () => ChemDataRow | null;
  removeRow: (id: string) => void;
  clearRows: () => void;
  setNoiseEnabled: (enabled: boolean) => void;
  setPlaying: (playing: boolean) => void;
  /** Advance the time control by `dt` real seconds (× its play rate). */
  tickPlay: (dt: number) => void;
}

let rowCounter = 0;
const newId = () => `cp-${Date.now().toString(36)}-${(rowCounter++).toString(36)}`;

function readStorage(): Persisted | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CHEM_PRACTICAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {}, noiseEnabled: parsed.noiseEnabled !== false };
  } catch {
    return null;
  }
}

function writeStorage(state: Pick<ChemPracticalState, 'sessions' | 'noiseEnabled' | 'slug' | 'params' | 'rows'>) {
  if (typeof window === 'undefined') return;
  try {
    const sessions = { ...state.sessions };
    if (state.slug) sessions[state.slug] = { params: state.params, rows: state.rows };
    window.localStorage.setItem(CHEM_PRACTICAL_STORAGE_KEY, JSON.stringify({ sessions, noiseEnabled: state.noiseEnabled } satisfies Persisted));
  } catch {
    // storage full or blocked — the simulation keeps working in memory
  }
}

function cleanParams(model: ChemPracticalModel, params: ChemParams | undefined): ChemParams {
  const p = withDefaults(model, params);
  const out: ChemParams = {};
  for (const c of model.controls) out[c.key] = clampToControl(c, Number.isFinite(p[c.key]) ? p[c.key] : c.default);
  return out;
}

const same = (a: number | undefined, b: number | undefined) => a !== undefined && b !== undefined && Math.abs(a - b) < 1e-9;

export const useChemPracticalStore = create<ChemPracticalState>((set, get) => ({
  slug: null,
  params: {},
  rows: [],
  noiseEnabled: true,
  playing: false,
  sessions: {},
  hydrated: false,

  open: (slug) => {
    const model = getChemPracticalModel(slug);
    if (!model) return;
    const state = get();
    let sessions = state.sessions;
    let noiseEnabled = state.noiseEnabled;
    if (!state.hydrated) {
      const stored = readStorage();
      if (stored) {
        sessions = stored.sessions;
        noiseEnabled = stored.noiseEnabled;
      }
    }
    if (state.slug && state.slug !== slug) sessions = { ...sessions, [state.slug]: { params: state.params, rows: state.rows } };
    if (state.slug === slug && state.hydrated) return;
    const saved = sessions[slug];
    const rows = Array.isArray(saved?.rows) ? saved.rows.filter((r) => r && typeof r === 'object' && r.values) : [];
    set({ slug, params: cleanParams(model, saved?.params), rows, sessions, noiseEnabled, playing: false, hydrated: true });
    if (state.hydrated) writeStorage(get());
  },

  setParam: (key, value) => {
    const { slug, params } = get();
    const model = getChemPracticalModel(slug);
    if (!model) return;
    const control = model.controls.find((c) => c.key === key);
    if (!control) return;
    const kind = controlKind(control);
    const next = { ...params, [key]: clampToControl(control, value) };
    let playing = get().playing;
    if (kind === 'condition') {
      const tc = timeControl(model);
      if (tc && !same(params[key], next[key])) {
        next[tc.key] = tc.default;
        playing = false;
      }
    }
    if (kind === 'condition' || kind === 'view') {
      const inf = inferenceControl(model);
      if (inf && !same(params[key], next[key])) next[inf.key] = inf.default;
    }
    set({ params: next, playing });
  },

  setParams: (incoming) => {
    const { slug, params } = get();
    const model = getChemPracticalModel(slug);
    if (!model) return;
    const next: ChemParams = { ...params };
    let conditionChanged = false;
    let anyChanged = false;
    for (const c of model.controls) {
      if (incoming[c.key] === undefined) continue;
      const v = clampToControl(c, incoming[c.key]);
      if (!same(params[c.key], v)) {
        anyChanged = true;
        if (controlKind(c) === 'condition') conditionChanged = true;
      }
      next[c.key] = v;
    }
    const tc = timeControl(model);
    if (tc && conditionChanged && incoming[tc.key] === undefined) next[tc.key] = tc.default;
    const inf = inferenceControl(model);
    if (inf && anyChanged && incoming[inf.key] === undefined) next[inf.key] = inf.default;
    set({ params: next, playing: conditionChanged ? false : get().playing });
  },

  resetParams: () => {
    const { slug } = get();
    const model = getChemPracticalModel(slug);
    if (!model) return;
    set({ params: cleanParams(model, undefined), playing: false });
    writeStorage(get());
  },

  record: () => {
    const { slug, params, rows, noiseEnabled } = get();
    const model = getChemPracticalModel(slug);
    if (!model) return null;
    const values = rows.map((r) => r.values);
    const preview = runChemPractical(model, params, { rows: values });
    if (preview.ready === false) return null;
    const out = runChemPractical(model, params, { rows: values, noise: makeNoise(noiseEnabled, 1) });
    const row: ChemDataRow = { id: newId(), values: out.row, at: Date.now() };
    set({ rows: [...rows, row] });
    writeStorage(get());
    return row;
  },

  removeRow: (id) => {
    set({ rows: get().rows.filter((r) => r.id !== id) });
    writeStorage(get());
  },

  clearRows: () => {
    set({ rows: [] });
    writeStorage(get());
  },

  setNoiseEnabled: (enabled) => {
    set({ noiseEnabled: enabled });
    writeStorage(get());
  },

  setPlaying: (playing) => {
    const { slug, params } = get();
    const model = getChemPracticalModel(slug);
    const tc = model ? timeControl(model) : undefined;
    if (!model || !tc?.play) return set({ playing: false });
    // pressing ▶ at the end of the clock starts it again from zero
    if (playing && params[tc.key] >= (tc.max ?? Infinity) - 1e-9) set({ params: { ...params, [tc.key]: tc.default } });
    set({ playing });
  },

  tickPlay: (dt) => {
    const { slug, params, rows, playing } = get();
    if (!playing) return;
    const model = getChemPracticalModel(slug);
    const tc = model ? timeControl(model) : undefined;
    if (!model || !tc?.play) return set({ playing: false });
    const cur = params[tc.key] ?? tc.default;
    const max = tc.max ?? Infinity;
    let next = Math.min(max, cur + tc.play.rate * Math.max(0, dt));
    let stop = next >= max - 1e-9;
    // pause exactly on the next suggested reading time that is still missing
    const done = tasksDone(rows.map((r) => r.values));
    for (const [i, task] of (model.tasks ?? []).entries()) {
      const target = task.set[tc.key];
      if (target === undefined || done.has(i) || target <= cur + 1e-9 || target > next + 1e-9) continue;
      const matches = Object.entries(task.set).every(([k, v]) => {
        if (k === tc.key) return true;
        const c = model.controls.find((x) => x.key === k);
        return (c && controlKind(c) === 'view') || same(params[k], v);
      });
      if (matches) {
        next = target;
        stop = true;
      }
    }
    set({ params: { ...params, [tc.key]: next }, playing: !stop });
  }
}));
