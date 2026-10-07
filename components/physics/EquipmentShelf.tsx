'use client';

import React, { useState } from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { physicsCategories, physicsEquipment } from '@/lib/physicsData';
import type { EquipmentCategory } from '@/engine/physicsTypes';
import { Search, Plus, Zap, Magnet, Sun, Activity, Flame, Music, Scale, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EquipmentShelf() {
  const { isBangla } = usePhysicsI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const addItem = usePhysicsStore((s) => s.addItem);
  const setMeasuringToolModal = usePhysicsStore((s) => s.setMeasuringToolModal);

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

    const matchesName =
      item.name_en.toLowerCase().includes(q) ||
      item.name_bn.toLowerCase().includes(q) ||
      item.description_en.toLowerCase().includes(q) ||
      item.description_bn.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

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
          <span className="rounded-full bg-physics-500/10 px-2 py-0.5 font-mono text-[11px] font-black text-physics-600 dark:text-physics-300">
            {filteredEquipment.length} {isBangla ? 'যন্ত্র' : 'items'}
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-22rem)]">
        {filteredEquipment.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--muted)]">
            {isBangla ? 'কোনো যন্ত্র পাওয়া যায়নি।' : 'No equipment matched your search.'}
          </div>
        ) : (
          filteredEquipment.map((eq) => {
            const Icon = categoryIcons[eq.category] || Activity;
            return (
              <div
                key={eq.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', eq.id);
                }}
                className="group relative flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 transition hover:border-physics-400 hover:shadow-card cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-physics-600 shadow-sm border border-[var(--line)] group-hover:scale-105 transition">
                    <Icon size={18} />
                  </div>
                  <div>
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
                    onClick={() => addItem(eq.id)}
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
    </div>
  );
}
