'use client';

import React, { useRef, useState } from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { EquipmentRenderer } from './Equipment/EquipmentRenderer';
import { CircuitCanvas } from './CircuitCanvas';
import { OpticsBench } from './OpticsBench';
import { MechanicsStage } from './MechanicsStage';
import { PracticalStation } from './PracticalStation';
import { MeasuringModal } from './Equipment/MeasuringModals';
import {
  RotateCcw,
  Trash2,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Sliders,
  Zap,
  Sun,
  Activity,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Workbench() {
  const { isBangla } = usePhysicsI18n();
  const workbenchRef = useRef<HTMLDivElement>(null);

  const mode = usePhysicsStore((s) => s.mode);
  const setMode = usePhysicsStore((s) => s.setMode);
  const items = usePhysicsStore((s) => s.items);
  const wires = usePhysicsStore((s) => s.wires);
  const selectedItemId = usePhysicsStore((s) => s.selectedItemId);
  const selectItem = usePhysicsStore((s) => s.selectItem);
  const updateItem = usePhysicsStore((s) => s.updateItem);
  const clearBench = usePhysicsStore((s) => s.clearBench);
  const resetExperiment = usePhysicsStore((s) => s.resetExperiment);
  const circuitResult = usePhysicsStore((s) => s.circuitResult);
  const undo = usePhysicsStore((s) => s.undo);
  const redo = usePhysicsStore((s) => s.redo);
  const saveToLocalStorage = usePhysicsStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = usePhysicsStore((s) => s.loadFromLocalStorage);
  const addItem = usePhysicsStore((s) => s.addItem);
  const measuringToolModal = usePhysicsStore((s) => s.measuringToolModal);
  const setMeasuringToolModal = usePhysicsStore((s) => s.setMeasuringToolModal);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Dragging placed item on canvas
  const handleItemMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    selectItem(itemId);
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    setDraggingItemId(itemId);
    setDragOffset({
      x: e.clientX - item.x,
      y: e.clientY - item.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingItemId) return;
    const item = items.find((it) => it.id === draggingItemId);
    if (!item) return;

    const newX = Math.max(10, Math.min(800, e.clientX - dragOffset.x));
    const newY = Math.max(10, Math.min(500, e.clientY - dragOffset.y));

    updateItem(draggingItemId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggingItemId(null);
  };

  // Drop equipment from shelf onto canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const equipmentId = e.dataTransfer.getData('text/plain');
    if (!equipmentId) return;

    const rect = workbenchRef.current?.getBoundingClientRect();
    const x = rect ? Math.max(20, Math.min(750, e.clientX - rect.left - 60)) : 100;
    const y = rect ? Math.max(20, Math.min(450, e.clientY - rect.top - 40)) : 100;

    addItem(equipmentId, x, y);
  };

  const handleSave = () => {
    const success = saveToLocalStorage();
    setSaveToast(success ? (isBangla ? 'ল্যাব সংরক্ষিত হয়েছে!' : 'Lab Saved!') : 'Save Failed');
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleLoad = () => {
    const success = loadFromLocalStorage();
    setSaveToast(success ? (isBangla ? 'সংরক্ষিত ল্যাব লোড হয়েছে!' : 'Lab Loaded!') : 'No Save Found');
    setTimeout(() => setSaveToast(null), 2500);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Workbench Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-card">
        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('workbench')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition',
              mode === 'workbench' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Zap size={14} />
            {isBangla ? 'সার্কিট ও ওয়ার্কবেঞ্চ' : 'Circuits & Bench'}
          </button>
          <button
            type="button"
            onClick={() => setMode('optics')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition',
              mode === 'optics' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Sun size={14} />
            {isBangla ? 'অপটিক্স রেল' : 'Optics Rail'}
          </button>
          <button
            type="button"
            onClick={() => setMode('mechanics')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition',
              mode === 'mechanics' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Activity size={14} />
            {isBangla ? 'বলবিদ্যা স্টেজ' : 'Mechanics Stage'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            title="Save Lab"
          >
            <Save size={16} />
          </button>
          <button
            type="button"
            onClick={handleLoad}
            className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            title="Load Lab"
          >
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMeasuringToolModal('vernier-caliper')}
            className="btn-ghost flex items-center gap-1 rounded-xl border border-[var(--line)] px-2.5 py-1.5 text-xs font-bold text-physics-600"
            title="Inspect Vernier / Screw Gauge"
          >
            <Sliders size={14} />
            {isBangla ? 'ভার্নিয়ার' : 'Vernier'}
          </button>
          <button
            type="button"
            onClick={resetExperiment}
            className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            title="Reset Experiment"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={clearBench}
            className="btn-ghost rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Clear Workbench"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {saveToast}
        </div>
      )}

      {/* Mode Renderers */}
      {mode === 'optics' && <OpticsBench />}
      {mode === 'mechanics' && <MechanicsStage />}
      {(mode === 'waves' || mode === 'thermo' || mode === 'modern') && <PracticalStation />}

      {mode === 'workbench' && (
        <div
          ref={workbenchRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => selectItem(null)}
          className="relative min-h-[520px] w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card overflow-hidden"
        >
          {/* Subtle Canvas Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Short Circuit Warning Alert Banner */}
          {circuitResult.isShortCircuit && (
            <div className="absolute top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-red-500 bg-red-600 px-5 py-2 text-xs font-black text-white shadow-float animate-bounce">
              <AlertTriangle size={16} />
              <span>{isBangla ? 'সতর্কতা: শর্ট সার্কিট! বিপজ্জনক অতিরিক্ত কারেন্ট প্রবাহিত হচ্ছে।' : 'Warning: Short Circuit Detected! Unsafe High Current.'}</span>
            </div>
          )}

          {/* Empty Bench Helper Hint */}
          {items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[var(--muted)]">
              <Sparkles size={40} className="mb-2 opacity-30 text-physics-600" />
              <h4 className="text-sm font-black text-[var(--ink)]">
                {isBangla ? 'ওয়ার্কবেঞ্চ খালি' : 'Workbench is Empty'}
              </h4>
              <p className="mt-1 max-w-sm text-xs font-bold">
                {isBangla
                  ? 'বামের শেলফ থেকে যন্ত্র টেনে আনুন, অথবা ডানপাশের নির্দেশিকা থেকে একটি সিলেবাসের পরীক্ষা লোড করুন।'
                  : 'Drag instruments from the shelf onto the canvas, or load a guided practical from the observation panel.'}
              </p>
            </div>
          )}

          {/* Circuit Canvas Wire Overlay */}
          <CircuitCanvas items={items} wires={wires} isLive={!circuitResult.isOpenCircuit} />

          {/* Render All Bench Items */}
          {items.map((item) => (
            <div
              key={item.id}
              onMouseDown={(e) => handleItemMouseDown(e, item.id)}
            >
              <EquipmentRenderer
                item={item}
                circuitResult={circuitResult.componentResults[item.id]}
                isSelected={selectedItemId === item.id}
                onSelect={() => selectItem(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Measuring Tool Modal */}
      {measuringToolModal && (
        <MeasuringModal
          tool={measuringToolModal}
          onClose={() => setMeasuringToolModal(null)}
        />
      )}
    </div>
  );
}
