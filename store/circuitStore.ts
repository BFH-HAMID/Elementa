'use client';

/**
 * Circuit Lab state. Components, wires and UI state live here; the canvas,
 * inspector and palette are presentational. Mutations that should be undoable
 * call `pushHistory()` first (the same pattern as labStore / physicsStore).
 * Autosave to localStorage happens inside this module, never in components.
 */

import { create } from 'zustand';
import type { CircuitProject, PlacedComponent, PlacedWire, PropValue, SimFrame, WireColor, WireEndpoint, WireWaypoint } from '@/components/circuit-lab/types';
import type { Viewport } from '@/components/circuit-lab/geometry';
import { getPart } from '@/components/circuit-lab/parts/registry';
import { EXAMPLE_PROJECTS } from '@/components/circuit-lab/projects/examples';

export const CIRCUIT_STORAGE_KEY = 'elementa-circuit-lab:v1';
const HISTORY_LIMIT = 40;

interface Snapshot {
  components: PlacedComponent[];
  wires: PlacedWire[];
}

export type ToolMode = 'select' | 'wire' | 'pan';
export type ViewMode = 'breadboard' | 'schematic' | 'pcb';

export interface CircuitState {
  projectName: string;
  components: PlacedComponent[];
  wires: PlacedWire[];
  selectedComps: string[];
  selectedWires: string[];
  viewport: Viewport;
  tool: ToolMode;
  view: ViewMode;
  snap: boolean;
  showFlow: boolean;
  running: boolean;
  frame: SimFrame | null;
  simSpeed: number;
  activeExampleId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  /** Id of the component the code editor is bound to (MCU boards). */
  codeTargetId: string | null;
  idCounter: number;
  /** Serial monitor history (newest last, capped). */
  serial: string[];
  /** Simulator and sketch messages shown in the bottom panel. */
  simErrors: string[];
  showHelp: boolean;
  bottomTab: 'serial' | 'examples' | 'analysis' | 'check' | 'guide';
  /** Compact bench summary for the status line. */
  status: string;

  // history
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // selection
  select: (compIds: string[], wireIds?: string[]) => void;
  toggleSelect: (id: string, kind: 'comp' | 'wire', additive: boolean) => void;
  clearSelection: () => void;

  // components
  addComponent: (partId: string, x: number, y: number, props?: Record<string, PropValue>) => string;
  moveComponents: (ids: string[], dx: number, dy: number) => void;
  setComponentPos: (id: string, x: number, y: number) => void;
  setPositions: (updates: Record<string, { x: number; y: number }>) => void;
  rotateSelection: (dir?: 1 | -1) => void;
  flipSelection: () => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;
  setProp: (id: string, key: string, value: PropValue) => void;
  setCode: (id: string, code: string) => void;
  setCodeTarget: (id: string | null) => void;

  // wires
  addWire: (from: WireEndpoint | null, to: WireEndpoint | null, color?: WireColor, waypoints?: WireWaypoint[]) => string;
  updateWireEnd: (id: string, which: 'from' | 'to', ep: WireEndpoint | null) => void;
  setWireColor: (id: string, color: WireColor) => void;
  addWaypoint: (id: string, index: number, p: WireWaypoint) => void;
  moveWaypoint: (id: string, index: number, p: WireWaypoint) => void;
  removeWaypoint: (id: string, index: number) => void;
  deleteWire: (id: string) => void;

  // view & sim
  setViewport: (vp: Viewport) => void;
  setTool: (tool: ToolMode) => void;
  setView: (view: ViewMode) => void;
  setSnap: (on: boolean) => void;
  setShowFlow: (on: boolean) => void;
  setRunning: (on: boolean) => void;
  setFrame: (frame: SimFrame | null) => void;
  setSimSpeed: (speed: number) => void;
  resetSim: () => void;

  // projects
  loadProject: (project: CircuitProject, exampleId?: string | null) => void;
  loadExample: (id: string) => void;
  newProject: () => void;
  toProject: () => CircuitProject;
  setProjectName: (name: string) => void;

  appendSerial: (lines: string[]) => void;
  clearSerial: () => void;
  setSimErrors: (errors: string[]) => void;
  setShowHelp: (on: boolean) => void;
  setBottomTab: (tab: CircuitState['bottomTab']) => void;
  setStatus: (text: string) => void;
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Re-number ids so pasted/duplicated items never collide. */
function nextId(prefix: string, counter: number) {
  return `${prefix}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function isValidProject(p: unknown): p is CircuitProject {
  if (!p || typeof p !== 'object') return false;
  const o = p as CircuitProject;
  return o.version === 1 && Array.isArray(o.components) && Array.isArray(o.wires) && o.components.every((c) => !!getPart(c.partId));
}

export function loadSavedProject(): CircuitProject | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CIRCUIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidProject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Decode a project from a share link (?circuit=<base64url JSON>). */
export function decodeShared(encoded: string): CircuitProject | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = typeof window === 'undefined' ? Buffer.from(b64 + pad, 'base64').toString('utf8') : decodeURIComponent(escape(window.atob(b64 + pad)));
    const parsed = JSON.parse(json) as unknown;
    return isValidProject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function encodeShared(project: CircuitProject): string {
  const json = JSON.stringify(project);
  const b64 = typeof window === 'undefined' ? Buffer.from(json, 'utf8').toString('base64') : window.btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const starter = EXAMPLE_PROJECTS[0];

export const useCircuitStore = create<CircuitState>()((set, get) => ({
  projectName: starter.name,
  components: clone(starter.components),
  wires: clone(starter.wires),
  selectedComps: [],
  selectedWires: [],
  viewport: { x: -60, y: -40, zoom: 1 },
  tool: 'select',
  view: 'breadboard',
  snap: true,
  showFlow: true,
  running: false,
  frame: null,
  simSpeed: 1,
  activeExampleId: starter.id,
  past: [],
  future: [],
  codeTargetId: null,
  idCounter: 1,
  serial: [],
  simErrors: [],
  showHelp: false,
  bottomTab: 'serial',
  status: '',

  appendSerial: (lines) => {
    if (lines.length === 0) return;
    set((s) => ({ serial: [...s.serial, ...lines].slice(-400) }));
  },
  clearSerial: () => set({ serial: [] }),
  setSimErrors: (errors) => set((s) => (sameList(s.simErrors, errors) ? s : { simErrors: errors })),
  setShowHelp: (showHelp) => set({ showHelp }),
  setBottomTab: (bottomTab) => set({ bottomTab }),
  setStatus: (status) => set({ status }),

  pushHistory: () => {
    const { components, wires, past } = get();
    const snap: Snapshot = { components: clone(components), wires: clone(wires) };
    set({ past: [...past.slice(-(HISTORY_LIMIT - 1)), snap], future: [] });
  },

  undo: () => {
    const { past, future, components, wires } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...future, { components: clone(components), wires: clone(wires) }],
      components: prev.components,
      wires: prev.wires,
      selectedComps: [],
      selectedWires: []
    });
  },

  redo: () => {
    const { past, future, components, wires } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      future: future.slice(0, -1),
      past: [...past, { components: clone(components), wires: clone(wires) }],
      components: next.components,
      wires: next.wires,
      selectedComps: [],
      selectedWires: []
    });
  },

  select: (compIds, wireIds = []) => set({ selectedComps: compIds, selectedWires: wireIds }),

  toggleSelect: (id, kind, additive) => {
    const { selectedComps, selectedWires } = get();
    if (kind === 'comp') {
      const has = selectedComps.includes(id);
      const next = additive ? (has ? selectedComps.filter((x) => x !== id) : [...selectedComps, id]) : [id];
      set({ selectedComps: next, selectedWires: additive ? selectedWires : [] });
    } else {
      const has = selectedWires.includes(id);
      const next = additive ? (has ? selectedWires.filter((x) => x !== id) : [...selectedWires, id]) : [id];
      set({ selectedWires: next, selectedComps: additive ? selectedComps : [] });
    }
  },

  clearSelection: () => set({ selectedComps: [], selectedWires: [] }),

  addComponent: (partId, x, y, props) => {
    const part = getPart(partId);
    if (!part) return '';
    get().pushHistory();
    const id = nextId('c', get().idCounter);
    const comp: PlacedComponent = {
      id,
      partId,
      x,
      y,
      rotation: 0,
      flipH: false,
      props: { ...part.defaults, ...(props ?? {}) },
      state: {}
    };
    set((s) => ({
      components: [...s.components, comp],
      selectedComps: [id],
      selectedWires: [],
      idCounter: s.idCounter + 1
    }));
    return id;
  },

  moveComponents: (ids, dx, dy) =>
    set((s) => ({
      components: s.components.map((c) => (ids.includes(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c))
    })),

  setComponentPos: (id, x, y) =>
    set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, x, y } : c)) })),

  setPositions: (updates) =>
    set((s) => ({
      components: s.components.map((c) => (updates[c.id] ? { ...c, x: updates[c.id].x, y: updates[c.id].y } : c))
    })),

  rotateSelection: (dir = 1) => {
    const { selectedComps } = get();
    if (selectedComps.length === 0) return;
    get().pushHistory();
    set((s) => ({
      components: s.components.map((c) => {
        if (!selectedComps.includes(c.id)) return c;
        const steps = dir === 1 ? 90 : 270;
        const rotation = (((c.rotation + steps) % 360) as 0 | 90 | 180 | 270);
        return { ...c, rotation };
      })
    }));
  },

  flipSelection: () => {
    const { selectedComps } = get();
    if (selectedComps.length === 0) return;
    get().pushHistory();
    set((s) => ({ components: s.components.map((c) => (selectedComps.includes(c.id) ? { ...c, flipH: !c.flipH } : c)) }));
  },

  duplicateSelection: () => {
    const { selectedComps, components, wires } = get();
    if (selectedComps.length === 0) return;
    get().pushHistory();
    const idMap = new Map<string, string>();
    let counter = get().idCounter;
    const copies: PlacedComponent[] = [];
    for (const c of components) {
      if (!selectedComps.includes(c.id)) continue;
      const id = nextId('c', counter++);
      idMap.set(c.id, id);
      copies.push({ ...clone(c), id, x: c.x + 20, y: c.y + 20 });
    }
    // Wires whose both ends are inside the selection are duplicated too.
    const wireCopies: PlacedWire[] = [];
    for (const w of wires) {
      if (w.from && w.to && idMap.has(w.from.compId) && idMap.has(w.to.compId)) {
        wireCopies.push({
          ...clone(w),
          id: nextId('w', counter++),
          from: { compId: idMap.get(w.from.compId)!, pinId: w.from.pinId },
          to: { compId: idMap.get(w.to.compId)!, pinId: w.to.pinId },
          waypoints: w.waypoints.map((p) => ({ x: p.x + 20, y: p.y + 20 }))
        });
      }
    }
    set((s) => ({
      components: [...s.components, ...copies],
      wires: [...s.wires, ...wireCopies],
      selectedComps: copies.map((c) => c.id),
      selectedWires: [],
      idCounter: counter
    }));
  },

  deleteSelection: () => {
    const { selectedComps, selectedWires } = get();
    if (selectedComps.length === 0 && selectedWires.length === 0) return;
    get().pushHistory();
    set((s) => ({
      components: s.components.filter((c) => !selectedComps.includes(c.id)),
      wires: s.wires.filter(
        (w) =>
          !selectedWires.includes(w.id) &&
          !(w.from && selectedComps.includes(w.from.compId)) &&
          !(w.to && selectedComps.includes(w.to.compId))
      ),
      selectedComps: [],
      selectedWires: []
    }));
  },

  setProp: (id, key, value) => {
    get().pushHistory();
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? { ...c, props: { ...c.props, [key]: value } } : c))
    }));
  },

  setCode: (id, code) =>
    set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, code } : c)) })),

  setCodeTarget: (id) => set({ codeTargetId: id }),

  addWire: (from, to, color = 'blue', waypoints = []) => {
    get().pushHistory();
    const id = nextId('w', get().idCounter);
    const wire: PlacedWire = { id, from, to, color, waypoints };
    set((s) => ({ wires: [...s.wires, wire], selectedWires: [id], selectedComps: [], idCounter: s.idCounter + 1 }));
    return id;
  },

  updateWireEnd: (id, which, ep) =>
    set((s) => ({ wires: s.wires.map((w) => (w.id === id ? { ...w, [which]: ep } : w)) })),

  setWireColor: (id, color) => {
    get().pushHistory();
    set((s) => ({ wires: s.wires.map((w) => (w.id === id ? { ...w, color } : w)) }));
  },

  addWaypoint: (id, index, p) => {
    get().pushHistory();
    set((s) => ({
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const wp = [...w.waypoints];
        wp.splice(index, 0, p);
        return { ...w, waypoints: wp };
      })
    }));
  },

  moveWaypoint: (id, index, p) =>
    set((s) => ({
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const wp = [...w.waypoints];
        wp[index] = p;
        return { ...w, waypoints: wp };
      })
    })),

  removeWaypoint: (id, index) => {
    get().pushHistory();
    set((s) => ({
      wires: s.wires.map((w) => (w.id === id ? { ...w, waypoints: w.waypoints.filter((_, i) => i !== index) } : w))
    }));
  },

  deleteWire: (id) => {
    get().pushHistory();
    set((s) => ({ wires: s.wires.filter((w) => w.id !== id), selectedWires: s.selectedWires.filter((x) => x !== id) }));
  },

  setViewport: (viewport) => set({ viewport }),
  setTool: (tool) => set({ tool }),
  setView: (view) => set({ view }),
  setSnap: (snap) => set({ snap }),
  setShowFlow: (showFlow) => set({ showFlow }),
  setRunning: (running) => set({ running }),
  setFrame: (frame) => set({ frame }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  resetSim: () =>
    set((s) => ({
      running: false,
      frame: null,
      serial: [],
      simErrors: [],
      components: s.components.map((c) => ({ ...c, state: {} }))
    })),

  loadProject: (project, exampleId = null) => {
    get().pushHistory();
    set({
      projectName: project.name,
      components: clone(project.components),
      wires: clone(project.wires),
      selectedComps: [],
      selectedWires: [],
      running: false,
      frame: null,
      activeExampleId: exampleId,
      codeTargetId: null
    });
  },

  loadExample: (id) => {
    const ex = EXAMPLE_PROJECTS.find((e) => e.id === id);
    if (!ex) return;
    get().loadProject({ version: 1, name: ex.name, components: ex.components, wires: ex.wires }, id);
  },

  newProject: () => {
    get().pushHistory();
    set({
      projectName: 'Untitled',
      components: [],
      wires: [],
      selectedComps: [],
      selectedWires: [],
      running: false,
      frame: null,
      activeExampleId: null,
      codeTargetId: null
    });
  },

  toProject: () => {
    const { projectName, components, wires } = get();
    return { version: 1, name: projectName, components: clone(components), wires: clone(wires) };
  },

  setProjectName: (name) => set({ projectName: name })
}));

/** Autosave the project (not UI state) to localStorage, debounced. */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
if (typeof window !== 'undefined') {
  useCircuitStore.subscribe((state, prev) => {
    if (state.components === prev.components && state.wires === prev.wires && state.projectName === prev.projectName) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const project: CircuitProject = { version: 1, name: state.projectName, components: state.components, wires: state.wires };
        window.localStorage.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify(project));
      } catch {
        // quota or private mode — autosave is best-effort
      }
    }, 400);
  });
}
