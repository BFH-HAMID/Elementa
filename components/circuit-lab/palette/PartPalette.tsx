'use client';

/**
 * Searchable, categorised part library. Parts can be dragged onto the bench
 * (HTML5 drag-and-drop) or tapped to drop at the centre of the view — the tap
 * path is what touch users rely on.
 */

import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Search, Cpu, Grid3x3, Component, Zap, CircuitBoard, Radio, Battery, Wrench } from 'lucide-react';
import { CATEGORY_ORDER, PARTS } from '../parts/registry';
import { PART_DRAG_MIME } from '../canvas/BenchCanvas';
import { useCircuitStore } from '@/store/circuitStore';
import { useCircuitI18n } from '../lib/i18n';
import { clampViewport } from '../geometry';
import type { PartCategory, PartDef } from '../types';
import { cn } from '@/lib/utils';

const CATEGORY_META: Record<PartCategory, { en: string; bn: string; icon: typeof Cpu }> = {
  boards: { en: 'Boards', bn: 'বোর্ড', icon: Cpu },
  prototyping: { en: 'Prototyping', bn: 'প্রোটোটাইপিং', icon: Grid3x3 },
  passives: { en: 'Passives', bn: 'প্যাসিভ', icon: Component },
  semiconductors: { en: 'Semiconductors', bn: 'সেমিকন্ডাক্টর', icon: Zap },
  ics: { en: 'ICs', bn: 'IC', icon: CircuitBoard },
  sensors: { en: 'Sensors & modules', bn: 'সেন্সর ও মডিউল', icon: Radio },
  power: { en: 'Power & switches', bn: 'পাওয়ার ও সুইচ', icon: Battery },
  tools: { en: 'Instruments', bn: 'যন্ত্র', icon: Wrench }
};

export function PartPalette({ onPick }: { onPick?: () => void }) {
  const { locale, t } = useCircuitI18n();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const fuse = useMemo(
    () => new Fuse(PARTS, { keys: [{ name: 'name', weight: 0.6 }, { name: 'partNumber', weight: 0.3 }, { name: 'description', weight: 0.1 }, { name: 'category', weight: 0.05 }], threshold: 0.35, ignoreLocation: true }),
    []
  );
  const results: PartDef[] | null = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : null;

  const addAtCentre = (def: PartDef) => {
    const st = useCircuitStore.getState();
    const vp = st.viewport;
    const cx = vp.x + 260 / vp.zoom;
    const cy = vp.y + 200 / vp.zoom;
    st.addComponent(def.id, Math.round((cx - def.w / 2) / 5) * 5, Math.round((cy - def.h / 2) / 5) * 5);
    st.setViewport(clampViewport(vp));
    setSelected(def.id);
    onPick?.();
  };

  const renderItem = (def: PartDef) => (
    <button
      key={def.id}
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PART_DRAG_MIME, def.id);
        e.dataTransfer.setData('text/plain', def.name);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => addAtCentre(def)}
      className={cn(
        'group flex w-full cursor-grab items-start gap-2 rounded-xl border border-transparent px-2.5 py-2 text-left text-sm transition hover:border-line hover:bg-surface-soft active:cursor-grabbing',
        selected === def.id && 'border-physics-300 bg-physics-50 dark:bg-physics-900/30'
      )}
      title={def.description}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{def.name}</span>
        <span className="block truncate text-xs text-muted">{def.partNumber}</span>
      </span>
    </button>
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">{t('search')}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          className="input w-full pl-9 text-sm"
          aria-label={t('search')}
        />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1" role="listbox" aria-label={t('library')}>
        {results ? (
          <div className="space-y-1">
            {results.length === 0 ? <p className="px-2 py-4 text-sm text-muted">—</p> : results.map(renderItem)}
          </div>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const items = PARTS.filter((p) => p.category === cat);
            return (
              <details key={cat} open={cat === 'boards' || cat === 'passives' || cat === 'semiconductors'} className="group mb-2">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-surface-soft">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="flex-1">{locale === 'bn' ? meta.bn : meta.en}</span>
                  <span className="rounded-full bg-surface-soft px-1.5 text-[10px]">{items.length}</span>
                </summary>
                <div className="mt-1 space-y-0.5">{items.map(renderItem)}</div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
