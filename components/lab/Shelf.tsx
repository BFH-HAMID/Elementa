'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FlaskConical, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Apparatus, Chemical, ChemicalHazard } from '@/engine/types';
import { labT, useLabI18n, type LabKey } from '@/lib/i18n';
import { apparatus, chemicalsInCategory, shelfCategories, shelfChemicals } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';
import { ApparatusGlyph } from './Apparatus';
import { ElementReference } from './ElementReference';
import { dragId, type DragPayload } from './dragTypes';

const hazardTone: Record<ChemicalHazard, string> = {
  none: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  irritant: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  corrosive: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  toxic: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  flammable: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  oxidiser: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  dangerous: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
};

type TabId = 'all' | 'apparatus' | 'elements' | string;

export function Shelf() {
  const { t, locale } = useLabI18n();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const pourMl = useLabStore((state) => state.pourMl);
  const setPourMl = useLabStore((state) => state.setPourMl);
  const addChemical = useLabStore((state) => state.addChemical);
  const addVessel = useLabStore((state) => state.addVessel);

  // Tap is the mobile fallback for dragging: with no station selected, drop a test tube
  // on the bench first so a single tap always does something useful.
  const quickAdd = (chemicalId: string) => {
    const target = useLabStore.getState().selectedVesselId ?? addVessel('test-tube');
    if (target) addChemical(target, chemicalId);
  };

  const needle = query.trim().toLowerCase();
  const matches = (chemical: Chemical) =>
    !needle ||
    chemical.id.toLowerCase().includes(needle) ||
    chemical.formula.toLowerCase().includes(needle) ||
    chemical.name_en.toLowerCase().includes(needle) ||
    chemical.name_bn.includes(query.trim());

  const chemicals = useMemo(() => {
    if (tab === 'all') return shelfChemicals.filter(matches);
    if (tab === 'apparatus' || tab === 'elements') return [];
    return chemicalsInCategory(tab as Chemical['category']).filter(matches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, needle]);

  const apparatusMatches = useMemo(
    () =>
      apparatus.filter(
        (item) =>
          !needle ||
          item.id.includes(needle) ||
          item.name_en.toLowerCase().includes(needle) ||
          item.name_bn.includes(query.trim())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [needle]
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: t('shelf.all') },
    ...shelfCategories.map((category) => ({ id: category.id, label: locale === 'bn' ? category.bn : category.en })),
    { id: 'apparatus', label: t('shelf.apparatus') },
    { id: 'elements', label: t('shelf.elements') }
  ];

  const showApparatus = tab === 'apparatus' || (needle.length > 0 && apparatusMatches.length > 0);

  return (
    <section className="card flex h-full flex-col overflow-hidden" aria-label={t('shelf.title')}>
      <header className="border-b border-[var(--line)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="eyebrow">Elementa</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">{t('shelf.title')}</h2>
          </div>
          <span className="pill bg-chemistry-100 text-chemistry-800 dark:bg-chemistry-900 dark:text-chemistry-100">
            {shelfChemicals.length}+{apparatus.length}
          </span>
        </div>

        <div className="relative mt-3">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('shelf.searchPlaceholder')}
            aria-label={t('shelf.search')}
            className="input pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={labT(locale, 'action.clear')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="pour-amount" className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {t('shelf.pourAmount')}
            </label>
            <span className="font-mono text-sm font-black">
              {pourMl} {t('unit.mL')}
            </span>
          </div>
          <input
            id="pour-amount"
            type="range"
            min={1}
            max={50}
            step={1}
            value={pourMl}
            onChange={(event) => setPourMl(Number(event.target.value))}
            className="mt-2 w-full accent-physics-600"
          />
          <p className="mt-1 text-[11px] leading-4 muted">{t('shelf.unitHint')}</p>
        </div>
      </header>

      <nav className="scrollbar-thin flex gap-1.5 overflow-x-auto border-b border-[var(--line)] px-3 py-2" aria-label={t('shelf.subtitle')}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? 'true' : undefined}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition',
              tab === item.id
                ? 'bg-chemistry-600 text-white shadow-sm'
                : 'bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'elements' ? (
          <ElementReference />
        ) : (
          <>
            {chemicals.length === 0 && !showApparatus && (
              <p className="p-6 text-center text-sm muted">{t('shelf.noResults', { query })}</p>
            )}

            {chemicals.length > 0 && (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                {chemicals.map((chemical) => (
                  <ChemicalChip
                    key={chemical.id}
                    chemical={chemical}
                    onQuickAdd={() => quickAdd(chemical.id)}
                  />
                ))}
              </ul>
            )}

            {showApparatus && (
              <div className="mt-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  <FlaskConical size={14} /> {t('shelf.apparatus')}
                </h3>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                  {apparatusMatches.map((item) => (
                    <ApparatusChip
                      key={item.id}
                      apparatus={item}
                      onQuickUse={() => {
                        if (item.kind === 'vessel') addVessel(item.id);
                      }}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2.5 text-[11px] leading-4 muted">
        {t('shelf.dragHint')}
      </footer>
    </section>
  );
}

function ChemicalChip({ chemical, onQuickAdd }: { chemical: Chemical; onQuickAdd: () => void }) {
  const { t, locale } = useLabI18n();
  const payload: DragPayload = {
    kind: 'chemical',
    chemicalId: chemical.id,
    name: locale === 'bn' ? chemical.name_bn : chemical.name_en,
    formula: chemical.formula,
    color: chemical.color,
    state: chemical.state
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId(payload), data: payload });

  return (
    <li>
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        type="button"
        onClick={onQuickAdd}
        title={t('shelf.dragHint')}
        style={{ transform: CSS.Translate.toString(transform) }}
        className={cn(
          'group flex w-full touch-manipulation items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 text-left transition select-none',
          'hover:border-chemistry-300 hover:shadow-card active:scale-[.97]',
          isDragging && 'opacity-35'
        )}
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-black/5 font-mono text-[10px] font-black shadow-inner"
          style={{ background: chemical.color, color: chemical.opacity > 0.7 ? '#f7fbff' : '#14283d' }}
          aria-hidden="true"
        >
          {chemical.formula.replace(/[₀-₉()·\s]/g, '').slice(0, 4)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold">{locale === 'bn' ? chemical.name_bn : chemical.name_en}</span>
          <span className="mt-0.5 flex items-center gap-1">
            <span className="font-mono text-[10px] font-bold text-[var(--muted)]">{chemical.formula}</span>
            {chemical.hazard !== 'none' && (
              <span className={cn('rounded px-1 py-px text-[9px] font-black uppercase', hazardTone[chemical.hazard])}>
                {t(`shelf.hazard.${chemical.hazard}` as LabKey)}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

function ApparatusChip({ apparatus, onQuickUse }: { apparatus: Apparatus; onQuickUse: () => void }) {
  const { t, locale } = useLabI18n();
  const payload: DragPayload = {
    kind: 'apparatus',
    apparatusId: apparatus.id,
    apparatusKind: apparatus.kind,
    shape: apparatus.shape,
    name: locale === 'bn' ? apparatus.name_bn : apparatus.name_en
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId(payload), data: payload });

  return (
    <li>
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        type="button"
        onClick={onQuickUse}
        style={{ transform: CSS.Translate.toString(transform) }}
        className={cn(
          'flex w-full touch-manipulation items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 text-left transition select-none',
          'hover:border-physics-300 hover:shadow-card active:scale-[.97]',
          isDragging && 'opacity-35'
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-physics-700 dark:text-physics-200">
          <ApparatusGlyph apparatus={apparatus} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold">{locale === 'bn' ? apparatus.name_bn : apparatus.name_en}</span>
          <span className="block truncate font-mono text-[10px] font-bold text-[var(--muted)]">
            {apparatus.capacityMl > 0 ? `${apparatus.capacityMl} ${t('unit.mL')}` : apparatus.kind}
          </span>
        </span>
      </button>
    </li>
  );
}
