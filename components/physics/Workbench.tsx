'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePhysicsStore, type PhysicsBenchMode } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { equipmentById, physicsExperimentsBySlug } from '@/lib/physicsData';
import {
  MAX_COORD,
  findPortNear,
  getItemSize,
  getPorts,
  isLinkPort,
  isLinkWire,
  itemBounds,
  nearestPortOfItem,
  portPosition,
  registerBenchDropTarget,
  snap,
  wirePath,
  worldSize,
  type PortRef
} from '@/lib/physicsBench';
import type { CircuitWire } from '@/engine/physicsTypes';
import { EquipmentRenderer } from './Equipment/EquipmentRenderer';
import { OpticsBench } from './OpticsBench';
import { MechanicsStage } from './MechanicsStage';
import { PracticalStation } from './PracticalStation';
import { MeasuringModal } from './Equipment/MeasuringModals';
import { BenchInspector } from './BenchInspector';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Copy,
  FolderOpen,
  Hand,
  Link2,
  Minus,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Scan,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WIRE_HEX: Record<CircuitWire['color'], string> = {
  red: '#dc2626',
  black: '#1e293b',
  blue: '#2563eb',
  green: '#059669',
  yellow: '#d97706'
};

const WIRE_COLORS: CircuitWire['color'][] = ['red', 'black', 'blue', 'green', 'yellow'];

type Gesture =
  | {
      type: 'item';
      id: string;
      pointerId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      moved: boolean;
    }
  | {
      type: 'wire';
      from: PortRef;
      pointerId: number;
      startX: number;
      startY: number;
      moved: boolean;
    };

const samePort = (a: PortRef | null, b: PortRef | null) =>
  !!a && !!b && a.itemId === b.itemId && a.terminalId === b.terminalId;

export function Workbench() {
  const { isBangla } = usePhysicsI18n();

  const mode = usePhysicsStore((s) => s.mode);
  const setMode = usePhysicsStore((s) => s.setMode);
  const items = usePhysicsStore((s) => s.items);
  const wires = usePhysicsStore((s) => s.wires);
  const selectedItemId = usePhysicsStore((s) => s.selectedItemId);
  const selectedWireId = usePhysicsStore((s) => s.selectedWireId);
  const connectingWireFrom = usePhysicsStore((s) => s.connectingWireFrom);
  const circuitResult = usePhysicsStore((s) => s.circuitResult);
  const activeExperimentSlug = usePhysicsStore((s) => s.activeExperimentSlug);
  const historyPast = usePhysicsStore((s) => s.historyPast);
  const historyFuture = usePhysicsStore((s) => s.historyFuture);
  const measuringToolModal = usePhysicsStore((s) => s.measuringToolModal);

  const selectItem = usePhysicsStore((s) => s.selectItem);
  const selectWire = usePhysicsStore((s) => s.selectWire);
  const clearBench = usePhysicsStore((s) => s.clearBench);
  const resetExperiment = usePhysicsStore((s) => s.resetExperiment);
  const undo = usePhysicsStore((s) => s.undo);
  const redo = usePhysicsStore((s) => s.redo);
  const saveToLocalStorage = usePhysicsStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = usePhysicsStore((s) => s.loadFromLocalStorage);
  const addItem = usePhysicsStore((s) => s.addItem);
  const removeItem = usePhysicsStore((s) => s.removeItem);
  const rotateItem = usePhysicsStore((s) => s.rotateItem);
  const duplicateItem = usePhysicsStore((s) => s.duplicateItem);
  const removeWire = usePhysicsStore((s) => s.removeWire);
  const updateWire = usePhysicsStore((s) => s.updateWire);
  const setMeasuringToolModal = usePhysicsStore((s) => s.setMeasuringToolModal);

  const scrollRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState<'fit' | number>('fit');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pointerWorld, setPointerWorld] = useState<{ x: number; y: number } | null>(null);
  const [hoverPort, setHoverPort] = useState<PortRef | null>(null);
  const [shelfHover, setShelfHover] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ── World size & zoom ─────────────────────────────────────────────── */
  const liveWorld = useMemo(() => worldSize(items), [items]);
  // While dragging, never shrink the world (prevents the canvas jumping under the pointer).
  const frozenWorld = useRef(liveWorld);
  if (!draggingId) frozenWorld.current = liveWorld;
  const world = draggingId
    ? {
        width: Math.max(frozenWorld.current.width, liveWorld.width),
        height: Math.max(frozenWorld.current.height, liveWorld.height)
      }
    : liveWorld;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [mode]);

  const fitScale = containerWidth > 0 ? Math.max(0.45, Math.min(1, (containerWidth - 2) / world.width)) : 1;
  const fitScaleRef = useRef(fitScale);
  if (!draggingId) fitScaleRef.current = fitScale;
  const scale = zoom === 'fit' ? fitScaleRef.current : zoom;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Let the bench fill the visible area even when the tools occupy less of it.
  const canvasWidth = Math.max(world.width, containerWidth > 0 ? Math.floor((containerWidth - 2) / scale) : 0);

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = worldRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / scaleRef.current, y: (clientY - rect.top) / scaleRef.current };
  }, []);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  /* ── Shelf → bench drag bridge ─────────────────────────────────────── */
  useEffect(() => {
    if (mode !== 'workbench') return;
    const inside = (clientX: number, clientY: number) => {
      const rect = scrollRef.current?.getBoundingClientRect();
      return !!rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    };
    registerBenchDropTarget({
      hover: (clientX, clientY, equipmentId) => {
        const over = equipmentId !== null && inside(clientX, clientY);
        setShelfHover(over);
        return over;
      },
      drop: (equipmentId, clientX, clientY) => {
        setShelfHover(false);
        if (!inside(clientX, clientY)) return false;
        const { w, h } = getItemSize(equipmentById.get(equipmentId));
        const p = toWorld(clientX, clientY);
        addItem(
          equipmentId,
          Math.max(0, Math.min(MAX_COORD, snap(p.x - w / 2))),
          Math.max(0, Math.min(MAX_COORD, snap(p.y - h / 2)))
        );
        return true;
      }
    });
    return () => registerBenchDropTarget(null);
  }, [mode, addItem, toWorld]);

  // Bring newly added tools into view (e.g. after pressing "Add" on the shelf).
  const prevCount = useRef(items.length);
  useEffect(() => {
    if (items.length > prevCount.current && selectedItemId) {
      const el = worldRef.current?.querySelector(`[data-bench-item="${CSS.escape(selectedItemId)}"]`);
      const scroller = scrollRef.current;
      if (el && scroller) {
        const r = el.getBoundingClientRect();
        const s = scroller.getBoundingClientRect();
        if (r.right > s.right || r.left < s.left || r.bottom > s.bottom || r.top < s.top) {
          scroller.scrollBy({ left: r.left - s.left - 40, top: r.top - s.top - 40, behavior: 'smooth' });
        }
      }
    }
    prevCount.current = items.length;
  }, [items.length, selectedItemId]);

  /* ── Pointer gestures ──────────────────────────────────────────────── */
  const endGesture = useCallback(() => {
    gestureRef.current = null;
    setDraggingId(null);
  }, []);

  const handleWindowMove = useCallback(
    (e: PointerEvent) => {
      const g = gestureRef.current;
      if (!g || e.pointerId !== g.pointerId) return;
      const state = usePhysicsStore.getState();
      const distance = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);

      if (g.type === 'item') {
        if (!g.moved) {
          if (distance < 4) return;
          g.moved = true;
          state.pushHistory();
          setDraggingId(g.id);
        }
        const s = scaleRef.current;
        const nx = snap(g.originX + (e.clientX - g.startX) / s, !e.altKey);
        const ny = snap(g.originY + (e.clientY - g.startY) / s, !e.altKey);
        state.moveItem(g.id, Math.max(0, Math.min(MAX_COORD, nx)), Math.max(0, Math.min(MAX_COORD, ny)));
        return;
      }

      // Wire gesture: stretch a rubber-band cable to the pointer and look for a port to snap to.
      if (!g.moved) {
        if (distance < 5) return;
        g.moved = true;
      }
      const p = toWorld(e.clientX, e.clientY);
      setPointerWorld(p);
      setHoverPort(findPortNear(state.items, p, g.from, 30));
    },
    [toWorld]
  );

  const handleWindowUp = useCallback(
    (e: PointerEvent) => {
      const g = gestureRef.current;
      if (!g || e.pointerId !== g.pointerId) return;
      window.removeEventListener('pointermove', handleWindowMove);
      window.removeEventListener('pointerup', handleWindowUp);
      window.removeEventListener('pointercancel', handleWindowUp);

      if (g.type === 'wire' && g.moved) {
        const state = usePhysicsStore.getState();
        const target = findPortNear(state.items, toWorld(e.clientX, e.clientY), g.from, 30);
        if (target) {
          state.connectPorts(g.from, target);
        } else {
          flash(isBangla ? 'সংযোগ বাতিল — অন্য যন্ত্রের উপর ছাড়ুন' : 'Not connected — release on another tool');
        }
        state.cancelConnectingWire();
        setPointerWorld(null);
        setHoverPort(null);
      }
      endGesture();
    },
    [endGesture, flash, handleWindowMove, isBangla, toWorld]
  );

  const beginGesture = (g: Gesture) => {
    gestureRef.current = g;
    window.addEventListener('pointermove', handleWindowMove);
    window.addEventListener('pointerup', handleWindowUp);
    window.addEventListener('pointercancel', handleWindowUp);
  };

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handleWindowMove);
      window.removeEventListener('pointerup', handleWindowUp);
      window.removeEventListener('pointercancel', handleWindowUp);
    },
    [handleWindowMove, handleWindowUp]
  );

  const onItemPointerDown = (e: React.PointerEvent, itemId: string) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    e.stopPropagation();
    e.preventDefault();

    const state = usePhysicsStore.getState();
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;

    // A connection is waiting: tapping another tool connects to its nearest port.
    const pending = state.connectingWireFrom;
    if (pending && pending.itemId !== itemId) {
      const target = nearestPortOfItem(item, toWorld(e.clientX, e.clientY), pending);
      if (target) state.connectPorts(pending, target);
      state.cancelConnectingWire();
      setPointerWorld(null);
      setHoverPort(null);
      return;
    }
    if (pending) state.cancelConnectingWire();

    selectItem(itemId);
    beginGesture({
      type: 'item',
      id: itemId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: item.x,
      originY: item.y,
      moved: false
    });
  };

  const onPortPointerDown = (e: React.PointerEvent, ref: PortRef) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const state = usePhysicsStore.getState();
    const pending = state.connectingWireFrom;

    if (pending && samePort(pending, ref)) {
      state.cancelConnectingWire();
      setPointerWorld(null);
      setHoverPort(null);
      return;
    }
    if (pending) {
      state.connectPorts(pending, ref);
      state.cancelConnectingWire();
      setPointerWorld(null);
      setHoverPort(null);
      return;
    }

    state.startConnectingWire(ref.itemId, ref.terminalId);
    const item = state.items.find((it) => it.id === ref.itemId);
    setPointerWorld(item ? portPosition(item, ref.terminalId) : null);
    beginGesture({ type: 'wire', from: ref, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false });
  };

  const onWorldPointerDown = () => {
    const state = usePhysicsStore.getState();
    if (state.connectingWireFrom) state.cancelConnectingWire();
    setPointerWorld(null);
    setHoverPort(null);
    selectItem(null);
    selectWire(null);
  };

  // Tap-to-connect mode: the cable follows the mouse until a second port/tool is tapped.
  const onWorldPointerMove = (e: React.PointerEvent) => {
    if (gestureRef.current || !connectingWireFrom) return;
    const p = toWorld(e.clientX, e.clientY);
    setPointerWorld(p);
    setHoverPort(findPortNear(items, p, connectingWireFrom, 30));
  };

  /* ── Keyboard shortcuts ────────────────────────────────────────────── */
  useEffect(() => {
    if (mode !== 'workbench') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('input, textarea, select, [contenteditable="true"]') || target.isContentEditable)) return;
      const state = usePhysicsStore.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        state.cancelConnectingWire();
        setPointerWorld(null);
        setHoverPort(null);
        state.selectItem(null);
        state.selectWire(null);
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        state.redo();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && (state.selectedItemId || state.selectedWireId)) {
        e.preventDefault();
        if (state.selectedWireId) state.removeWire(state.selectedWireId);
        else if (state.selectedItemId) state.removeItem(state.selectedItemId);
        return;
      }
      const id = state.selectedItemId;
      if (!id) return;
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        state.duplicateItem(id);
        return;
      }
      if (!mod && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        state.rotateItem(id);
        return;
      }
      const step = e.shiftKey ? 40 : 8;
      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step]
      };
      const delta = deltas[e.key];
      if (delta) {
        e.preventDefault();
        const item = state.items.find((it) => it.id === id);
        if (!item) return;
        if (!e.repeat) state.pushHistory();
        state.moveItem(
          id,
          Math.max(0, Math.min(MAX_COORD, item.x + delta[0])),
          Math.max(0, Math.min(MAX_COORD, item.y + delta[1]))
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  /* ── Toolbar actions ───────────────────────────────────────────────── */
  const handleSave = () => {
    const ok = saveToLocalStorage();
    flash(ok ? (isBangla ? 'ল্যাব সংরক্ষিত হয়েছে!' : 'Lab saved!') : isBangla ? 'সংরক্ষণ ব্যর্থ' : 'Save failed');
  };
  const handleLoad = () => {
    const ok = loadFromLocalStorage();
    flash(ok ? (isBangla ? 'সংরক্ষিত ল্যাব লোড হয়েছে!' : 'Lab loaded!') : isBangla ? 'কোনো সংরক্ষণ নেই' : 'No save found');
  };
  const zoomBy = (factor: number) => {
    const next = Math.max(0.4, Math.min(1.6, Math.round(scale * factor * 100) / 100));
    setZoom(next);
  };

  /* ── Derived render data ───────────────────────────────────────────── */
  const itemById = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
  const connectedPorts = useMemo(() => {
    const set = new Set<string>();
    for (const w of wires) {
      set.add(`${w.fromItemId}:${w.fromTerminalId}`);
      set.add(`${w.toItemId}:${w.toTerminalId}`);
    }
    return set;
  }, [wires]);

  const sourcePos = (() => {
    if (!connectingWireFrom) return null;
    const item = itemById.get(connectingWireFrom.itemId);
    return item ? portPosition(item, connectingWireFrom.terminalId) : null;
  })();
  const hoverPos = (() => {
    if (!hoverPort) return null;
    const item = itemById.get(hoverPort.itemId);
    return item ? portPosition(item, hoverPort.terminalId) : null;
  })();
  const bandEnd = hoverPos ?? pointerWorld;

  // Port hit-areas grow when zoomed out so they stay finger-sized.
  const portHit = Math.max(24, Math.min(56, 30 / scale));
  const selectedItem = selectedItemId ? itemById.get(selectedItemId) : undefined;
  const selectedWire = selectedWireId ? wires.find((w) => w.id === selectedWireId) : undefined;

  const modeButtons: { id: PhysicsBenchMode; en: string; bn: string; icon: typeof Zap }[] = [
    { id: 'workbench', en: 'Free Workbench', bn: 'মুক্ত ওয়ার্কবেঞ্চ', icon: Zap },
    { id: 'optics', en: 'Optics Rail', bn: 'অপটিক্স রেল', icon: Sun },
    { id: 'mechanics', en: 'Mechanics Stage', bn: 'বলবিদ্যা স্টেজ', icon: Activity }
  ];
  const stationMode = mode === 'waves' || mode === 'thermo' || mode === 'modern';
  const activeExp = activeExperimentSlug ? physicsExperimentsBySlug.get(activeExperimentSlug) : undefined;
  const practicalMode: PhysicsBenchMode | null =
    activeExp?.category === 'waves'
      ? 'waves'
      : activeExp?.category === 'heat'
      ? 'thermo'
      : activeExp?.category === 'modern-physics'
      ? 'modern'
      : null;

  const iconBtn =
    'grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="flex flex-col gap-3">
      {/* ── Top toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-card">
        <div className="flex flex-wrap items-center gap-1">
          {modeButtons.map(({ id, en, bn, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition',
                mode === id ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]'
              )}
            >
              <Icon size={14} />
              {isBangla ? bn : en}
            </button>
          ))}
          {practicalMode && (
            <button
              type="button"
              onClick={() => setMode(practicalMode)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition',
                stationMode ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]'
              )}
              title={isBangla ? 'গাইডেড প্র্যাকটিক্যালের সেটআপ' : 'Guided practical setup'}
            >
              <ClipboardList size={14} />
              {isBangla ? 'প্র্যাকটিক্যাল' : 'Practical'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-0.5">
          <button type="button" onClick={undo} disabled={historyPast.length === 0} className={iconBtn} title={isBangla ? 'পূর্বাবস্থা (Ctrl+Z)' : 'Undo (Ctrl+Z)'}>
            <Undo2 size={16} />
          </button>
          <button type="button" onClick={redo} disabled={historyFuture.length === 0} className={iconBtn} title={isBangla ? 'পুনরায় (Ctrl+Y)' : 'Redo (Ctrl+Y)'}>
            <Redo2 size={16} />
          </button>
          <span className="mx-1 h-5 w-px bg-[var(--line)]" />
          <button type="button" onClick={handleSave} className={iconBtn} title={isBangla ? 'সংরক্ষণ' : 'Save lab'}>
            <Save size={16} />
          </button>
          <button type="button" onClick={handleLoad} className={iconBtn} title={isBangla ? 'লোড' : 'Load lab'}>
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMeasuringToolModal('vernier-caliper')}
            className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-black text-physics-600 transition hover:bg-[var(--surface-soft)] dark:text-physics-300"
            title="Vernier / Screw gauge"
          >
            <Sliders size={14} />
            {isBangla ? 'ভার্নিয়ার' : 'Vernier'}
          </button>
          {activeExperimentSlug && (
            <button type="button" onClick={resetExperiment} className={iconBtn} title={isBangla ? 'পরীক্ষা রিসেট' : 'Reset experiment'}>
              <RotateCcw size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={clearBench}
            disabled={items.length === 0}
            className={cn(iconBtn, 'text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40')}
            title={isBangla ? 'ওয়ার্কবেঞ্চ খালি করুন' : 'Clear workbench'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>


      {mode === 'optics' && <OpticsBench />}
      {mode === 'mechanics' && <MechanicsStage />}
      {stationMode && <PracticalStation />}

      {mode === 'workbench' && (
        <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-card">
          {/* Canvas header: how-to chips + zoom */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--muted)]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2 py-1">
                <Hand size={12} className="text-physics-600" />
                {isBangla ? 'যন্ত্র ধরে টেনে সরান' : 'Drag any tool to move it'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2 py-1">
                <Link2 size={12} className="text-emerald-600" />
                {isBangla ? 'বিন্দু (●) থেকে টেনে অন্য যন্ত্রে ছাড়ুন = সংযোগ' : 'Drag from a dot (●) onto another tool to connect'}
              </span>
              <span className="hidden items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2 py-1 md:inline-flex">
                {isBangla ? 'তার ক্লিক = রং / মুছুন' : 'Click a wire to recolour / delete'}
              </span>
            </div>
            <div className="flex items-center gap-0.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-0.5">
              <button type="button" onClick={() => zoomBy(1 / 1.15)} className="grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]" title="Zoom out">
                <Minus size={14} />
              </button>
              <span className="w-11 text-center font-mono text-[11px] font-black text-[var(--ink)]">{Math.round(scale * 100)}%</span>
              <button type="button" onClick={() => zoomBy(1.15)} className="grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]" title="Zoom in">
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom('fit')}
                className={cn(
                  'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-black',
                  zoom === 'fit' ? 'bg-physics-600 text-white' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
                )}
                title={isBangla ? 'পর্দায় মানানসই' : 'Fit to screen'}
              >
                <Scan size={12} />
                {isBangla ? 'ফিট' : 'Fit'}
              </button>
            </div>
          </div>

          {/* Scrollable, zoomable canvas. Banners float above it so the layout never shifts mid-gesture. */}
          <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-2 z-[60] flex flex-col items-center gap-1.5 px-3">
            {circuitResult.isShortCircuit && (
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-red-400 bg-red-600 px-4 py-1.5 text-xs font-black text-white shadow-float">
                <AlertTriangle size={14} />
                {isBangla ? 'সতর্কতা: শর্ট সার্কিট! বিপজ্জনক অতিরিক্ত কারেন্ট।' : 'Warning: short circuit — unsafe high current.'}
              </div>
            )}
            {connectingWireFrom && (
              <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50/95 py-1 pl-3 pr-1 text-xs font-bold text-emerald-800 shadow-float backdrop-blur dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200">
                <Link2 size={14} className="shrink-0" />
                <span className="truncate">
                  {isBangla
                    ? 'অন্য যন্ত্রের বিন্দু বা যন্ত্রের উপর ছাড়ুন / ট্যাপ করুন · Esc = বাতিল'
                    : 'Release or tap on another tool’s dot (or the tool itself) · Esc to cancel'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    usePhysicsStore.getState().cancelConnectingWire();
                    setPointerWorld(null);
                    setHoverPort(null);
                  }}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900"
                  aria-label="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {toast && (
              <div className="rounded-full border border-physics-200 bg-[var(--surface)] px-4 py-1.5 text-xs font-bold text-[var(--ink)] shadow-float dark:border-physics-800" role="status">
                {toast}
              </div>
            )}
          </div>
          <div
            ref={scrollRef}
            className={cn(
              'relative max-h-[78vh] overflow-auto overscroll-contain transition-colors',
              shelfHover && 'bg-physics-50/70 dark:bg-physics-900/20'
            )}
          >
            <div style={{ width: canvasWidth * scale, height: world.height * scale }} className="relative">
              <div
                ref={worldRef}
                onPointerDown={onWorldPointerDown}
                onPointerMove={onWorldPointerMove}
                style={{
                  width: canvasWidth,
                  height: world.height,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                  backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.35) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
                className={cn('absolute left-0 top-0', connectingWireFrom && 'cursor-crosshair')}
              >
                {/* Drop hint while dragging from shelf */}
                {shelfHover && (
                  <div className="pointer-events-none absolute inset-3 z-0 rounded-2xl border-2 border-dashed border-physics-400" />
                )}

                {/* Empty bench helper */}
                {items.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[var(--muted)]">
                    <Sparkles size={40} className="mb-2 text-physics-600 opacity-40" />
                    <h4 className="text-base font-black text-[var(--ink)]">{isBangla ? 'ওয়ার্কবেঞ্চ খালি' : 'Workbench is empty'}</h4>
                    <p className="mt-1 max-w-md text-sm font-bold leading-6">
                      {isBangla
                        ? 'বামের তাক থেকে যেকোনো যন্ত্র টেনে এখানে আনুন (বা “যোগ” চাপুন)। তারপর যন্ত্রের রঙিন বিন্দু থেকে টেনে অন্য যন্ত্রে ছেড়ে দিলেই সংযোগ হবে।'
                        : 'Drag any tool here from the shelf (or press “Add”). Then drag from a coloured dot on one tool and release it on another tool to connect them.'}
                    </p>
                  </div>
                )}

                {/* Tools */}
                {items.map((item) => {
                  const def = equipmentById.get(item.equipmentId);
                  if (!def) return null;
                  return (
                    <EquipmentRenderer
                      key={item.id}
                      item={item}
                      def={def}
                      circuitResult={circuitResult.componentResults[item.id]}
                      isSelected={selectedItemId === item.id}
                      isDragging={draggingId === item.id}
                      isConnectTarget={!!connectingWireFrom && hoverPort?.itemId === item.id}
                      onPointerDown={(e) => onItemPointerDown(e, item.id)}
                    />
                  );
                })}

                {/* Wires & links */}
                <svg
                  className="pointer-events-none absolute left-0 top-0 z-[5] overflow-visible"
                  width={canvasWidth}
                  height={world.height}
                >
                  {wires.map((wire) => {
                    const a = itemById.get(wire.fromItemId);
                    const b = itemById.get(wire.toItemId);
                    const from = a ? portPosition(a, wire.fromTerminalId) : null;
                    const to = b ? portPosition(b, wire.toTerminalId) : null;
                    if (!from || !to) return null;
                    const { d } = wirePath(from, to);
                    const link = isLinkWire(wire);
                    const hex = WIRE_HEX[wire.color] || WIRE_HEX.blue;
                    const selected = selectedWireId === wire.id;
                    return (
                      <g key={wire.id} className="group">
                        <path
                          d={d}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={Math.max(14, 18 / scale)}
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            if (usePhysicsStore.getState().connectingWireFrom) return;
                            selectWire(wire.id);
                          }}
                        />
                        {selected && <path d={d} fill="none" stroke="#38bdf8" strokeOpacity={0.45} strokeWidth={11} strokeLinecap="round" />}
                        {link ? (
                          <path
                            d={d}
                            fill="none"
                            stroke={hex}
                            strokeWidth={selected ? 4 : 3}
                            strokeDasharray="7 5"
                            strokeLinecap="round"
                            className="transition-[stroke-width] group-hover:[stroke-width:4.5px]"
                          />
                        ) : (
                          <>
                            {/* Soft outline keeps dark wires visible on the dark theme. */}
                            <path d={d} fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth={selected ? 8 : 6.5} strokeLinecap="round" />
                            <path
                              d={d}
                              fill="none"
                              stroke={hex}
                              strokeWidth={selected ? 5.5 : 4}
                              strokeLinecap="round"
                              className="transition-[stroke-width] group-hover:[stroke-width:5.5px]"
                            />
                            {!circuitResult.isOpenCircuit && (
                              <path d={d} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeDasharray="3 9" opacity={0.85} className="wire-flow" />
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Rubber-band cable while connecting */}
                  {sourcePos && bandEnd && (
                    <g>
                      <path
                        d={wirePath(sourcePos, bandEnd).d}
                        fill="none"
                        stroke={hoverPort ? '#059669' : '#1677d2'}
                        strokeWidth={3.5}
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                        opacity={0.9}
                      />
                      <circle cx={bandEnd.x} cy={bandEnd.y} r={hoverPort ? 9 : 5} fill={hoverPort ? '#059669' : '#1677d2'} opacity={0.35} />
                    </g>
                  )}
                </svg>

                {/* Ports (above wires so they're always grabbable) */}
                {items.map((item) => {
                  const def = equipmentById.get(item.equipmentId);
                  return getPorts(def).map((port) => {
                    const pos = portPosition(item, port.id);
                    if (!pos) return null;
                    const ref = { itemId: item.id, terminalId: port.id };
                    const isSource = samePort(connectingWireFrom, ref);
                    const isHover = samePort(hoverPort, ref);
                    const link = isLinkPort(port.id);
                    const connected = connectedPorts.has(`${item.id}:${port.id}`);
                    const showAll = !!connectingWireFrom;
                    const label = port.name.length <= 2 ? port.name : '';
                    return (
                      <button
                        key={`${item.id}:${port.id}`}
                        type="button"
                        onPointerDown={(e) => onPortPointerDown(e, ref)}
                        title={`${isBangla ? def?.name_bn : def?.name_en} · ${link ? (isBangla ? 'সংযোগ বিন্দু' : 'link point') : port.name}`}
                        aria-label={`${def?.name_en} ${port.name}`}
                        style={{
                          left: pos.x,
                          top: pos.y,
                          width: portHit,
                          height: portHit,
                          marginLeft: -portHit / 2,
                          marginTop: -portHit / 2,
                          touchAction: 'none'
                        }}
                        className="group/port absolute z-40 grid cursor-crosshair place-items-center rounded-full"
                      >
                        <span
                          className={cn(
                            'grid place-items-center rounded-full border-2 font-black leading-none text-white shadow-md transition-transform duration-150',
                            link
                              ? 'h-3.5 w-3.5 border-emerald-600 bg-white dark:bg-neutral-900'
                              : port.polarity === 'positive'
                              ? 'h-4 w-4 border-white bg-red-600'
                              : port.polarity === 'negative' || port.polarity === 'ground'
                              ? 'h-4 w-4 border-white bg-neutral-900'
                              : 'h-4 w-4 border-white bg-amber-500',
                            link && connected && 'bg-emerald-500 dark:bg-emerald-500',
                            'group-hover/port:scale-[1.45]',
                            showAll && !isSource && 'scale-125 ring-2 ring-emerald-400/50',
                            isHover && 'scale-[1.7] ring-4 ring-emerald-500/70',
                            isSource && 'scale-150 ring-4 ring-physics-400 animate-pulse'
                          )}
                          style={{ fontSize: 7 }}
                        >
                          {!link && label}
                        </span>
                      </button>
                    );
                  });
                })}

                {/* Floating toolbar for the selected tool */}
                {selectedItem && !draggingId && (() => {
                  const b = itemBounds(selectedItem);
                  const above = b.y > 46;
                  // Narrow tools carry a caption underneath; keep the toolbar clear of it.
                  const captionGap = (equipmentById.get(selectedItem.equipmentId)?.width || 120) < 96 ? 30 : 0;
                  return (
                    <div
                      data-no-drag
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        left: b.x + b.w / 2,
                        top: above ? b.y - 10 : b.y + b.h + 10 + captionGap,
                        transform: `translate(-50%, ${above ? '-100%' : '0'}) scale(${1 / Math.max(scale, 0.75)})`,
                        transformOrigin: above ? 'bottom center' : 'top center'
                      }}
                      className="absolute z-50 flex items-center gap-0.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-float"
                    >
                      <button type="button" onClick={() => rotateItem(selectedItem.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]" title={isBangla ? 'ঘোরান (R)' : 'Rotate 90° (R)'}>
                        <RotateCw size={15} />
                      </button>
                      <button type="button" onClick={() => duplicateItem(selectedItem.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]" title={isBangla ? 'অনুলিপি (Ctrl+D)' : 'Duplicate (Ctrl+D)'}>
                        <Copy size={15} />
                      </button>
                      <button type="button" onClick={() => removeItem(selectedItem.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" title={isBangla ? 'মুছুন (Delete)' : 'Delete (Del)'}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })()}

                {/* Floating toolbar for the selected wire */}
                {selectedWire && (() => {
                  const a = itemById.get(selectedWire.fromItemId);
                  const b = itemById.get(selectedWire.toItemId);
                  const from = a ? portPosition(a, selectedWire.fromTerminalId) : null;
                  const to = b ? portPosition(b, selectedWire.toTerminalId) : null;
                  if (!from || !to) return null;
                  const { mid } = wirePath(from, to);
                  return (
                    <div
                      data-no-drag
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ left: mid.x, top: mid.y - 14, transform: `translate(-50%, -100%) scale(${1 / Math.max(scale, 0.75)})`, transformOrigin: 'bottom center' }}
                      className="absolute z-50 flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-float"
                    >
                      {WIRE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateWire(selectedWire.id, { color: c })}
                          className={cn('h-6 w-6 rounded-full border-2 transition hover:scale-110', selectedWire.color === c ? 'border-physics-400 ring-2 ring-physics-300' : 'border-white dark:border-slate-400')}
                          style={{ background: WIRE_HEX[c] }}
                          aria-label={`Wire colour ${c}`}
                        />
                      ))}
                      <span className="mx-0.5 h-5 w-px bg-[var(--line)]" />
                      <button type="button" onClick={() => removeWire(selectedWire.id)} className="grid h-7 w-7 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" title={isBangla ? 'তার মুছুন' : 'Delete wire'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          </div>

          <BenchInspector />
        </div>
      )}

      {/* Measuring Tool Modal */}
      {measuringToolModal && <MeasuringModal tool={measuringToolModal} onClose={() => setMeasuringToolModal(null)} />}
    </div>
  );
}
