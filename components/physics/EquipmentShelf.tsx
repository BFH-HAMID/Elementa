'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { physicsCategories, physicsEquipment } from '@/lib/physicsData';
import type { EquipmentCategory } from '@/engine/physicsTypes';
import { Search, Plus, Zap, Magnet, Sun, Activity, Flame, Music, Scale, Cpu, GripVertical } from 'lucide-react';
import { dropOnBench, hoverBench } from '@/lib/physicsBench';
import { equipmentIcon } from './Equipment/EquipmentRenderer';
import { EquipmentArt } from './Equipment/art';
import { cn } from '@/lib/utils';

export function EquipmentShelf() {
  const { isBangla } = usePhysicsI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const addItem = usePhysicsStore((s) => s.addItem);
  const setMode = usePhysicsStore((s) => s.setMode);
  const setActiveTab = usePhysicsStore((s) => s.setActiveTab);
  const setMeasuringToolModal = usePhysicsStore((s) => s.setMeasuringToolModal);

  // Pointer-based drag (works for mouse, pen and touch — unlike HTML5 drag & drop).
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number; overBench: boolean } | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number; startX: number; startY: number; active: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ensureBenchVisible = () => {
    const state = usePhysicsStore.getState();
    if (state.mode !== 'workbench') setMode('workbench');
    if (state.activeTab !== 'workbench') setActiveTab('workbench');
  };

  const handleAdd = (equipmentId: string) => {
    ensureBenchVisible();
    addItem(equipmentId);
  };

  const startShelfDrag = (e: React.PointerEvent, equipmentId: string, fromHandle: boolean) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // On touch screens only the grip handle starts a drag, so the list still scrolls.
    if (e.pointerType !== 'mouse' && !fromHandle) return;
    if ((e.target as HTMLElement).closest('button:not([data-grip])')) return;
    if (fromHandle) e.preventDefault();
    e.stopPropagation();
    dragRef.current = { id: equipmentId, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, active: false };

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      if (!d.active) {
        if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < 6) return;
        d.active = true;
        ensureBenchVisible();
        document.body.style.userSelect = 'none';
      }
      ev.preventDefault();
      const overBench = hoverBench(ev.clientX, ev.clientY, d.id);
      setGhost({ id: d.id, x: ev.clientX, y: ev.clientY, overBench });
    };
    const onUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = '';
      if (d.active && ev.type === 'pointerup') dropOnBench(d.id, ev.clientX, ev.clientY);
      hoverBench(0, 0, null);
      dragRef.current = null;
      setGhost(null);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const categoryIcons: Record<EquipmentCategory, any> = {
    electricity: Zap,
    magnetism: Magnet,
    optics: Sun,
    mechanics: Activity,
    heat: Flame,
    waves: Music,
    'measuring-tools': Scale,
    'modern-physics': Cpu
  };

  const filteredEquipment = physicsEquipment.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    // Every word of the query must appear somewhere (so “convex lens” finds “Biconvex Converging Lens”).
    const haystack = [item.name_en, item.name_bn, item.description_en, item.description_bn, item.category, item.id]
      .join(' ')
      .toLowerCase();
    const matchesName = q.split(/\s+/).every((word) => haystack.includes(word));

    return matchesCategory && matchesName;
  });

  return (
    <div className="flex h-full flex-col rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-card overflow-hidden">
      {/* Shelf Header & Search */}
      <div className="border-b border-[var(--line)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[var(--ink)]">
            {isBangla ? 'যন্ত্রপাতির তাক (Shelf)' : 'Equipment Shelf'}
          </h3>
          <span className="rounded-full bg-physics-500/10 px-2 py-0.5 text-[11px] font-black text-physics-600 dark:text-physics-300">
            {filteredEquipment.length} {isBangla ? 'যন্ত্র' : filteredEquipment.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBangla ? 'যন্ত্র বা সংকেত খুঁজুন...' : 'Search equipment...'}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-1.5 pl-8 pr-3 text-xs font-bold text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-physics-500"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition',
              selectedCategory === 'all'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            {isBangla ? 'সব' : 'All'}
          </button>
          {physicsCategories.map((cat) => {
            const Icon = categoryIcons[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition',
                  selectedCategory === cat.id
                    ? 'bg-physics-600 text-white shadow-sm'
                    : 'bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)]'
                )}
              >
                {Icon && <Icon size={12} />}
                {isBangla ? cat.bn : cat.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipment List Grid */}
      <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 max-h-80 xl:max-h-[calc(100vh-17rem)]">
        {filteredEquipment.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--muted)]">
            {isBangla ? 'কোনো যন্ত্র পাওয়া যায়নি।' : 'No equipment matched your search.'}
          </div>
        ) : (
          filteredEquipment.map((eq) => {
            const Icon = equipmentIcon(eq.icon) || categoryIcons[eq.category] || Activity;
            return (
              <div
                key={eq.id}
                onPointerDown={(e) => startShelfDrag(e, eq.id, false)}
                className={cn(
                  'group relative flex select-none items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-2.5 transition hover:border-physics-400 hover:shadow-card cursor-grab active:cursor-grabbing',
                  ghost?.id === eq.id && 'opacity-50'
                )}
                title={isBangla ? 'টেনে ওয়ার্কবেঞ্চে আনুন' : 'Drag onto the workbench'}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    data-grip
                    onPointerDown={(e) => startShelfDrag(e, eq.id, true)}
                    style={{ touchAction: 'none' }}
                    className="grid h-9 w-5 shrink-0 cursor-grab place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-physics-600"
                    aria-label={isBangla ? 'টেনে আনুন' : 'Drag handle'}
                  >
                    <GripVertical size={15} />
                  </button>
                  {/* A real preview of the instrument that will land on the bench. */}
                  <div className="instrument-card relative h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] transition group-hover:scale-105">
                    <EquipmentArt
                      equipmentId={eq.id}
                      p={eq.defaultProperties || {}}
                      bn={isBangla}
                      live={false}
                      detailed={false}
                      className="absolute inset-0 p-[3px]"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-[var(--ink)] leading-snug">
                      {isBangla ? eq.name_bn : eq.name_en}
                    </h4>
                    <p className="line-clamp-1 text-[10px] font-bold text-[var(--muted)]">
                      {isBangla ? eq.description_bn : eq.description_en}
                    </p>
                    {eq.leastCount && (
                      <span className="inline-block mt-0.5 rounded-md bg-physics-500/10 px-1.5 py-0.2 font-mono text-[9px] font-bold text-physics-700 dark:text-physics-300">
                        LC: {eq.leastCount} {eq.leastCountUnit || ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add or Inspect Button */}
                <div className="flex items-center gap-1">
                  {eq.id === 'vernier-caliper' || eq.id === 'screw-gauge' ? (
                    <button
                      type="button"
                      onClick={() => setMeasuringToolModal(eq.id as any)}
                      className="rounded-lg bg-physics-100 p-1.5 text-physics-700 hover:bg-physics-200 dark:bg-physics-900/60 dark:text-physics-200"
                      title={isBangla ? 'স্কেল পরিদর্শন' : 'Inspect Scale'}
                    >
                      <Scale size={14} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleAdd(eq.id)}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-physics-600 px-2.5 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-physics-700"
                  >
                    <Plus size={13} />
                    {isBangla ? 'যোগ' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {mounted &&
        ghost &&
        createPortal(
          (() => {
            const eq = physicsEquipment.find((x) => x.id === ghost.id);
            if (!eq) return null;
            void equipmentIcon(eq.icon);
            return (
              <div
                className={cn(
                  'pointer-events-none fixed z-[100] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border-2 bg-[var(--surface)] px-2 py-1.5 text-xs font-black text-[var(--ink)] shadow-float',
                  ghost.overBench ? 'border-emerald-500' : 'border-physics-400'
                )}
                style={{ left: ghost.x, top: ghost.y }}
              >
                <span className="instrument-card relative block h-8 w-10 overflow-hidden rounded-md border border-[var(--line)]">
                  <EquipmentArt
                    equipmentId={eq.id}
                    p={eq.defaultProperties || {}}
                    bn={isBangla}
                    live={false}
                    detailed={false}
                    className="absolute inset-0 p-[2px]"
                  />
                </span>
                {isBangla ? eq.name_bn : eq.name_en}
                <span className={cn('rounded-md px-1.5 py-0.5 text-[10px]', ghost.overBench ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-soft)] text-[var(--muted)]')}>
                  {ghost.overBench ? (isBangla ? 'ছেড়ে দিন' : 'Drop') : isBangla ? 'বেঞ্চে আনুন' : 'To bench'}
                </span>
              </div>
            );
          })(),
          document.body
        )}
    </div>
  );
}
