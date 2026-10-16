'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { labT } from '@/lib/i18n';
import { apparatus, vessels as glassware } from '@/lib/labData';
import { labInstrumentSize } from '@/lib/labInstruments';
import { useLabStore, MAX_VESSELS, type BenchPoint } from '@/store/labStore';
import type { ElementSample, Vessel } from '@/engine/types';
import { ApparatusGlyph } from './Apparatus';
import { BenchEquipmentItem, benchEquipmentSize } from './BenchEquipmentItem';
import { BenchInstrumentItem } from './BenchInstrumentItem';
import { ElementSampleItem } from './ElementSampleItem';
import { VesselStation } from './VesselStation';
import type { DropTargetData } from './dragTypes';
import { Flame, Info, Move, Plus, RotateCcw, Trash2, Copy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const VESSEL_WIDTH = 230;
const VESSEL_HEIGHT = 490;
const MIN_WORLD = { width: 1060, height: 660 };

type PlacementType = 'vessel' | 'equipment' | 'element';
type SelectedPlacement = { type: PlacementType; id: string } | null;
type Gesture = {
  type: PlacementType;
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

function vesselPosition(vessel: Vessel, index: number): BenchPoint {
  return { x: vessel.x ?? 24 + (index % 3) * 266, y: vessel.y ?? 178 + Math.floor(index / 3) * 500 };
}

/** A chemistry worktop canvas shared by movable vessels, loose apparatus and element samples. */
export function Workbench() {
  const locale = useLabStore((state) => state.locale);
  const vessels = useLabStore((state) => state.vessels);
  const benchEquipment = useLabStore((state) => state.benchEquipment);
  const elementSamples = useLabStore((state) => state.elementSamples);
  const selectedVesselId = useLabStore((state) => state.selectedVesselId);
  const burner = useLabStore((state) => state.burner);
  const hint = useLabStore((state) => state.hint);

  const addVessel = useLabStore((state) => state.addVessel);
  const selectVessel = useLabStore((state) => state.selectVessel);
  const moveVessel = useLabStore((state) => state.moveVessel);
  const removeVessel = useLabStore((state) => state.removeVessel);
  const duplicateVessel = useLabStore((state) => state.duplicateVessel);
  const addBenchEquipment = useLabStore((state) => state.addBenchEquipment);
  const moveBenchEquipment = useLabStore((state) => state.moveBenchEquipment);
  const removeBenchEquipment = useLabStore((state) => state.removeBenchEquipment);
  const duplicateBenchEquipment = useLabStore((state) => state.duplicateBenchEquipment);
  const rotateBenchEquipment = useLabStore((state) => state.rotateBenchEquipment);
  const moveElementSample = useLabStore((state) => state.moveElementSample);
  const removeElementSample = useLabStore((state) => state.removeElementSample);
  const duplicateElementSample = useLabStore((state) => state.duplicateElementSample);
  const pushHistory = useLabStore((state) => state.pushHistory);
  const toggleBurner = useLabStore((state) => state.toggleBurner);
  const setBurnerIntensity = useLabStore((state) => state.setBurnerIntensity);
  const attachThermometer = useLabStore((state) => state.attachThermometer);
  const attachElectrolysis = useLabStore((state) => state.attachElectrolysis);

  const [selectedPlacement, setSelectedPlacement] = useState<SelectedPlacement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: 'bench', data: { type: 'bench' } satisfies DropTargetData });
  const setSurfaceRef = useCallback((node: HTMLDivElement | null) => {
    setDroppableNodeRef(node);
    surfaceRef.current = node;
  }, [setDroppableNodeRef]);

  const world = useMemo(() => {
    let width = MIN_WORLD.width;
    let height = MIN_WORLD.height;
    vessels.forEach((vessel, index) => {
      const p = vesselPosition(vessel, index);
      width = Math.max(width, p.x + VESSEL_WIDTH + 48);
      height = Math.max(height, p.y + VESSEL_HEIGHT + 48);
    });
    benchEquipment.forEach((item) => {
      if (item.instrumentId) {
        const size = labInstrumentSize(item.instrumentId);
        width = Math.max(width, item.x + size.width + 48);
        height = Math.max(height, item.y + size.height + 48);
        return;
      }
      const apparatusItem = apparatus.find((entry) => entry.id === item.apparatusId);
      const size = benchEquipmentSize(apparatusItem?.shape ?? 'spatula');
      width = Math.max(width, item.x + size.width + 48);
      height = Math.max(height, item.y + size.height + 48);
    });
    elementSamples.forEach((sample) => {
      width = Math.max(width, sample.x + 112 + 48);
      height = Math.max(height, sample.y + 128 + 48);
    });
    return { width: Math.ceil(width), height: Math.ceil(height) };
  }, [vessels, benchEquipment, elementSamples]);

  const selectedVessel = selectedPlacement?.type === 'vessel'
    ? vessels.find((vessel) => vessel.id === selectedPlacement.id) ?? null
    : null;
  const selectedEquipment = selectedPlacement?.type === 'equipment'
    ? benchEquipment.find((item) => item.id === selectedPlacement.id) ?? null
    : null;
  const isEmpty = vessels.length === 0 && benchEquipment.length === 0 && elementSamples.length === 0;

  const revealAddedItem = useCallback((selector: string) => {
    window.requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      const item = surfaceRef.current?.querySelector<HTMLElement>(selector);
      if (!viewport || !item) return;
      const itemRect = item.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const left = itemRect.left < viewportRect.left ? itemRect.left - viewportRect.left - 24 : itemRect.right > viewportRect.right ? itemRect.right - viewportRect.right + 24 : 0;
      const top = itemRect.top < viewportRect.top ? itemRect.top - viewportRect.top - 24 : itemRect.bottom > viewportRect.bottom ? itemRect.bottom - viewportRect.bottom + 24 : 0;
      if (left || top) viewport.scrollBy({ left, top, behavior: 'smooth' });
    });
  }, []);

  // Keep station-card clicks and the movable-item selection in sync.
  useEffect(() => {
    if (selectedVesselId) setSelectedPlacement({ type: 'vessel', id: selectedVesselId });
  }, [selectedVesselId]);

  const previousVesselCount = useRef(vessels.length);
  useEffect(() => {
    if (vessels.length > previousVesselCount.current) {
      const id = selectedVesselId ?? vessels[vessels.length - 1]?.id;
      if (id) revealAddedItem(`[data-bench-item="vessel:${id}"]`);
    }
    previousVesselCount.current = vessels.length;
  }, [vessels, selectedVesselId, revealAddedItem]);

  // Items added from the shelf or the periodic table become the selected worktop item.
  const previousEquipmentCount = useRef(benchEquipment.length);
  useEffect(() => {
    if (benchEquipment.length > previousEquipmentCount.current) {
      const id = benchEquipment[benchEquipment.length - 1].id;
      selectVessel(null);
      setSelectedPlacement({ type: 'equipment', id });
      revealAddedItem(`[data-bench-item="equipment:${id}"]`);
    }
    previousEquipmentCount.current = benchEquipment.length;
  }, [benchEquipment, selectVessel, revealAddedItem]);

  const previousElementCount = useRef(elementSamples.length);
  useEffect(() => {
    if (elementSamples.length > previousElementCount.current) {
      const id = elementSamples[elementSamples.length - 1].id;
      selectVessel(null);
      setSelectedPlacement({ type: 'element', id });
      revealAddedItem(`[data-bench-item="element:${id}"]`);
    }
    previousElementCount.current = elementSamples.length;
  }, [elementSamples, selectVessel, revealAddedItem]);

  useEffect(() => {
    if (!selectedPlacement) return;
    const exists = selectedPlacement.type === 'vessel'
      ? vessels.some((item) => item.id === selectedPlacement.id)
      : selectedPlacement.type === 'equipment'
        ? benchEquipment.some((item) => item.id === selectedPlacement.id)
        : elementSamples.some((item) => item.id === selectedPlacement.id);
    if (!exists) setSelectedPlacement(null);
  }, [selectedPlacement, vessels, benchEquipment, elementSamples]);

  const handleWindowMove = useCallback((event: PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (!gesture.moved) {
      if (distance < 4) return;
      gesture.moved = true;
      pushHistory();
      setDraggingId(gesture.id);
    }
    const scale = zoomRef.current;
    const x = Math.max(0, Math.min(3000, gesture.originX + (event.clientX - gesture.startX) / scale));
    const y = Math.max(0, Math.min(3000, gesture.originY + (event.clientY - gesture.startY) / scale));
    if (gesture.type === 'vessel') moveVessel(gesture.id, x, y);
    else if (gesture.type === 'equipment') moveBenchEquipment(gesture.id, x, y);
    else moveElementSample(gesture.id, x, y);
  }, [moveVessel, moveBenchEquipment, moveElementSample, pushHistory]);

  const finishGesture = useCallback((event: PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    window.removeEventListener('pointermove', handleWindowMove);
    window.removeEventListener('pointerup', finishGesture);
    window.removeEventListener('pointercancel', finishGesture);
    gestureRef.current = null;
    setDraggingId(null);
  }, [handleWindowMove]);

  const beginGesture = useCallback((event: ReactPointerEvent<HTMLDivElement>, id: string, type: PlacementType) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    event.preventDefault();
    event.stopPropagation();
    const store = useLabStore.getState();
    const vessel = type === 'vessel' ? store.vessels.find((item) => item.id === id) : undefined;
    const equipment = type === 'equipment' ? store.benchEquipment.find((item) => item.id === id) : undefined;
    const sample = type === 'element' ? store.elementSamples.find((item) => item.id === id) : undefined;
    const point = vessel
      ? vesselPosition(vessel, store.vessels.findIndex((item) => item.id === id))
      : equipment ?? sample;
    if (!point) return;
    gestureRef.current = {
      type,
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: point.x,
      originY: point.y,
      moved: false
    };
    if (type === 'vessel') selectVessel(id);
    else {
      selectVessel(null);
      setSelectedPlacement({ type, id });
    }
    window.addEventListener('pointermove', handleWindowMove);
    window.addEventListener('pointerup', finishGesture);
    window.addEventListener('pointercancel', finishGesture);
  }, [finishGesture, handleWindowMove, selectVessel]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', handleWindowMove);
    window.removeEventListener('pointerup', finishGesture);
    window.removeEventListener('pointercancel', finishGesture);
  }, [handleWindowMove, finishGesture]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedPlacement) {
        event.preventDefault();
        if (selectedPlacement.type === 'vessel') removeVessel(selectedPlacement.id);
        else if (selectedPlacement.type === 'equipment') removeBenchEquipment(selectedPlacement.id);
        else removeElementSample(selectedPlacement.id);
        setSelectedPlacement(null);
      } else if (event.key.toLowerCase() === 'r' && selectedPlacement?.type === 'equipment' && !event.metaKey && !event.ctrlKey) {
        rotateBenchEquipment(selectedPlacement.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPlacement, rotateBenchEquipment, removeVessel, removeBenchEquipment, removeElementSample]);

  const removeSelected = useCallback(() => {
    if (!selectedPlacement) return;
    if (selectedPlacement.type === 'vessel') removeVessel(selectedPlacement.id);
    else if (selectedPlacement.type === 'equipment') removeBenchEquipment(selectedPlacement.id);
    else removeElementSample(selectedPlacement.id);
    setSelectedPlacement(null);
  }, [selectedPlacement, removeVessel, removeBenchEquipment, removeElementSample]);

  const selectEquipment = useCallback((id: string) => {
    selectVessel(null);
    setSelectedPlacement({ type: 'equipment', id });
  }, [selectVessel]);
  const selectElement = useCallback((id: string) => {
    selectVessel(null);
    setSelectedPlacement({ type: 'element', id });
  }, [selectVessel]);
  const selectStation = useCallback((id: string) => {
    selectVessel(id);
    setSelectedPlacement({ type: 'vessel', id });
  }, [selectVessel]);

  const clearSelection = () => {
    selectVessel(null);
    setSelectedPlacement(null);
  };

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label={labT(locale, 'bench.title')}>
      <div className="card flex flex-wrap items-center gap-3 p-3">
        <div className="flex min-w-[150px] items-center gap-2">
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl transition', burner.lit ? 'bg-orange-100 text-orange-600 dark:bg-orange-950' : 'bg-[var(--surface-soft)] text-[var(--muted)]')}>
            <Flame size={19} />
          </span>
          <div>
            <p className="text-sm font-extrabold leading-tight">{labT(locale, 'bench.burnerIntensity')}</p>
            <p className="text-[11px] muted">{burner.lit ? labT(locale, 'action.extinguish') : labT(locale, 'action.light')}</p>
          </div>
        </div>
        <button type="button" onClick={toggleBurner} className={cn('btn-secondary min-h-9 rounded-lg px-3 text-xs', burner.lit && 'border-orange-300 text-orange-700 dark:text-orange-200')}>
          {burner.lit ? labT(locale, 'action.extinguish') : labT(locale, 'action.light')}
        </button>
        <label className="flex min-w-[120px] flex-1 items-center gap-2">
          <span className="sr-only">{labT(locale, 'bench.burnerIntensity')}</span>
          <input type="range" min={10} max={100} value={Math.round(burner.intensity * 100)} onChange={(event) => setBurnerIntensity(Number(event.target.value) / 100)} className="w-full accent-orange-500" />
          <span className="font-mono text-xs font-black">{Math.round(burner.intensity * 100)}%</span>
        </label>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1">
          {[0.75, 1, 1.25].map((value) => (
            <button key={value} type="button" onClick={() => setZoom(value)} aria-pressed={zoom === value} className={cn('min-h-8 rounded-lg px-2.5 text-xs font-bold transition', zoom === value ? 'bg-chemistry-600 text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]')}>
              {Math.round(value * 100)}%
            </button>
          ))}
        </div>
        {selectedVessel && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => attachThermometer(selectedVessel.id, !selectedVessel.thermometer)} className={cn('btn-ghost min-h-9 rounded-lg px-2.5 text-xs', selectedVessel.thermometer && 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100')} title={labT(locale, 'bench.thermometer')}>
              🌡 <span className="hidden sm:inline">{labT(locale, 'bench.thermometer')}</span>
            </button>
            <button type="button" onClick={() => attachElectrolysis(selectedVessel.id, !selectedVessel.electrolysis)} className={cn('btn-ghost min-h-9 rounded-lg px-2.5 text-xs', selectedVessel.electrolysis && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100')} title={labT(locale, 'bench.electrolysis')}>
              ⚡ <span className="hidden sm:inline">{labT(locale, 'bench.electrolysis')}</span>
            </button>
          </div>
        )}
        {(selectedVessel || selectedEquipment || selectedPlacement?.type === 'element') && (
          <div className="flex items-center gap-1">
            {selectedVessel && <button type="button" onClick={() => duplicateVessel(selectedVessel.id)} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs" title={labT(locale, 'bench.duplicate')} aria-label={labT(locale, 'bench.duplicate')}><Copy size={14} /></button>}
            {selectedEquipment && <>
              <button type="button" onClick={() => duplicateBenchEquipment(selectedEquipment.id)} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs" title={labT(locale, 'bench.duplicate')} aria-label={labT(locale, 'bench.duplicate')}><Copy size={14} /></button>
              <button type="button" onClick={() => rotateBenchEquipment(selectedEquipment.id)} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs" title={labT(locale, 'bench.rotate')} aria-label={labT(locale, 'bench.rotate')}><RotateCcw size={14} /></button>
            </>}
            {selectedPlacement?.type === 'element' && <button type="button" onClick={() => duplicateElementSample(selectedPlacement.id)} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs" title={labT(locale, 'bench.duplicate')} aria-label={labT(locale, 'bench.duplicate')}><Copy size={14} /></button>}
            <button type="button" onClick={removeSelected} className="btn-ghost min-h-9 rounded-lg px-2.5 text-xs text-rose-700 dark:text-rose-300" title={labT(locale, 'action.remove')} aria-label={labT(locale, 'action.remove')}><Trash2 size={14} /></button>
          </div>
        )}
        <p className="ml-auto hidden text-[10px] font-bold text-[var(--muted)] sm:block">
          {labT(locale, 'bench.itemCount', { vessels: vessels.length, equipment: benchEquipment.length, elements: elementSamples.length })}
        </p>
      </div>

      {hint && (
        <div className="flex items-start gap-2 rounded-xl border border-physics-200 bg-physics-50 px-3 py-2 text-xs font-bold leading-5 text-physics-900 dark:border-physics-700 dark:bg-physics-900/50 dark:text-physics-100">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>{locale === 'bn' ? hint.text_bn : hint.text_en}</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-1 text-[10px] font-semibold leading-4 muted">
        <Move size={13} className="shrink-0" />
        <span>{labT(locale, 'bench.moveHint')}</span>
      </div>

      <div ref={viewportRef} className={cn('max-h-[780px] min-h-[500px] overflow-auto rounded-2xl border-2 bg-[var(--surface-soft)] p-2 shadow-inner transition', isOver ? 'border-chemistry-400 ring-2 ring-chemistry-200 dark:ring-chemistry-800' : 'border-[var(--line)]')}>
        <div style={{ width: world.width * zoom, height: world.height * zoom, position: 'relative' }}>
          <div
            ref={setSurfaceRef}
            data-chemistry-bench-surface="true"
            data-zoom={zoom}
            onClick={(event) => { if (event.target === event.currentTarget) clearSelection(); }}
            style={{
              width: world.width,
              height: world.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              backgroundColor: '#dce3e2',
              backgroundImage: 'linear-gradient(90deg, rgba(101,121,126,.08) 1px, transparent 1px), linear-gradient(0deg, rgba(101,121,126,.08) 1px, transparent 1px), radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.72), transparent 62%), linear-gradient(135deg, #e5e9e5, #cbd5d5 52%, #d7dfde)',
              backgroundSize: '32px 32px, 32px 32px, 100% 100%, 100% 100%'
            }}
            className="relative isolate overflow-hidden rounded-xl border border-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,.95),inset_0_-18px_30px_rgba(71,85,92,.1)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex h-11 items-center justify-between border-b border-white/70 bg-gradient-to-b from-white/85 to-slate-200/55 px-4 text-[9px] font-black uppercase tracking-[.18em] text-slate-500 shadow-sm">
              <span>{labT(locale, 'bench.worktop')} · ELEMENTA WET LAB</span>
              <span className="font-mono tracking-normal">{locale === 'bn' ? 'পরিবেষ্টিত ২৫ °সে' : 'Ambient 25 °C'}</span>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-3 border-t border-white/70 bg-gradient-to-b from-slate-300/80 to-slate-500/20" />

            {isEmpty && (
              <div className="pointer-events-none absolute inset-0 z-[3] grid place-items-center p-6 text-center">
                <div className="pointer-events-auto max-w-md rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,.12)] backdrop-blur-sm">
                  <div className="mx-auto mb-3 flex w-fit items-end gap-3 text-physics-600">
                    {glassware.slice(0, 3).map((item) => <ApparatusGlyph key={item.id} apparatus={item} size={32} />)}
                  </div>
                  <p className="text-base font-extrabold text-slate-800">{labT(locale, 'bench.dropHere')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{labT(locale, 'bench.empty')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {glassware.filter((item) => ['test-tube', 'beaker', 'conical-flask', 'crucible'].includes(item.id)).map((item) => (
                      <button key={item.id} type="button" onClick={() => addVessel(item.id)} className="btn-secondary min-h-9 rounded-lg px-3 text-xs">
                        <Plus size={14} /> {locale === 'bn' ? item.name_bn : item.name_en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {vessels.map((vessel, index) => {
              const position = vesselPosition(vessel, index);
              return (
                <div
                  key={vessel.id}
                  data-bench-item={`vessel:${vessel.id}`}
                  onPointerDown={(event) => beginGesture(event, vessel.id, 'vessel')}
                  style={{ position: 'absolute', left: position.x, top: position.y, width: VESSEL_WIDTH, zIndex: draggingId === vessel.id ? 70 : selectedPlacement?.id === vessel.id ? 28 : 5, touchAction: 'none' }}
                  className={cn('select-none', draggingId === vessel.id && 'opacity-90')}
                >
                  <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 cursor-move rounded-full border border-slate-300 bg-white/95 p-1.5 text-slate-500 shadow-card" title={locale === 'bn' ? 'সরান' : 'Move'}>
                    <Move size={12} />
                  </div>
                  <VesselStation vessel={vessel} index={index} selected={vessel.id === selectedVesselId} onSelect={() => selectStation(vessel.id)} />
                </div>
              );
            })}

            {benchEquipment.map((item) => (
              item.instrumentId ? (
                <BenchInstrumentItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  selected={selectedPlacement?.type === 'equipment' && selectedPlacement.id === item.id}
                  dragging={draggingId === item.id}
                  onPointerDown={(event, id) => beginGesture(event, id, 'equipment')}
                  onSelect={selectEquipment}
                  onRemove={removeBenchEquipment}
                  onDuplicate={duplicateBenchEquipment}
                  onRotate={rotateBenchEquipment}
                />
              ) : (
                <BenchEquipmentItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  selected={selectedPlacement?.type === 'equipment' && selectedPlacement.id === item.id}
                  dragging={draggingId === item.id}
                  vessel={item.linkedVesselId ? vessels.find((vessel) => vessel.id === item.linkedVesselId) ?? null : null}
                  onPointerDown={(event, id) => beginGesture(event, id, 'equipment')}
                  onSelect={selectEquipment}
                  onRemove={removeBenchEquipment}
                  onDuplicate={duplicateBenchEquipment}
                  onRotate={rotateBenchEquipment}
                />
              )
            ))}

            {elementSamples.map((sample: ElementSample) => (
              <ElementSampleItem
                key={sample.id}
                sample={sample}
                locale={locale}
                selected={selectedPlacement?.type === 'element' && selectedPlacement.id === sample.id}
                dragging={draggingId === sample.id}
                onPointerDown={(event, id) => beginGesture(event, id, 'element')}
                onSelect={selectElement}
                onRemove={removeElementSample}
                onDuplicate={duplicateElementSample}
              />
            ))}

            {!isEmpty && vessels.length < MAX_VESSELS && (
              <button
                type="button"
                onClick={() => addVessel('test-tube')}
                style={{ position: 'absolute', left: 24, top: 56 }}
                className="flex h-9 items-center gap-2 rounded-xl border border-slate-400/70 bg-white/70 px-3 text-[10px] font-extrabold text-slate-600 shadow-sm transition hover:bg-white hover:text-chemistry-700"
                aria-label={labT(locale, 'bench.addVessel')}
              >
                <Plus size={14} /> {labT(locale, 'bench.addVessel')}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] muted">
        <span>{labT(locale, 'bench.itemCount', { vessels: vessels.length, equipment: benchEquipment.length, elements: elementSamples.length })}</span>
        <span className="font-mono">{Math.round(zoom * 100)}% · {Math.round(world.width)} × {Math.round(world.height)}</span>
      </div>
    </section>
  );
}
