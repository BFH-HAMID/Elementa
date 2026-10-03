'use client';

import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Element } from '@/engine/types';
import { useLabI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const categoryTone: Record<string, string> = {
  'alkali-metal': 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
  'alkaline-earth': 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
  'transition-metal': 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  'post-transition': 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  metalloid: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100',
  nonmetal: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  halogen: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100',
  'noble-gas': 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100',
  lanthanide: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-100',
  actinide: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-100'
};

/**
 * The 118-element reference from `data/elements.json`. The JSON is imported on demand
 * so it never lands in the lab's initial bundle.
 */
export function ElementReference() {
  const { t, locale } = useLabI18n();
  const [elements, setElements] = useState<Element[] | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Element | null>(null);

  useEffect(() => {
    let active = true;
    import('@/data/elements.json')
      .then((module) => {
        if (active) setElements((module.default as { elements: Element[] }).elements);
      })
      .catch(() => {
        if (active) setElements([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!elements) return [];
    if (!needle) return elements;
    return elements.filter(
      (element) =>
        element.symbol.toLowerCase().includes(needle) ||
        element.name_en.toLowerCase().includes(needle) ||
        element.name_bn.includes(query.trim()) ||
        String(element.z) === needle
    );
  }, [elements, query]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-extrabold">{t('elements.title')}</h3>
        <p className="mt-1 text-[11px] leading-4 muted">{t('elements.subtitle')}</p>
      </div>

      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`${t('elements.search')} · H, He, সোডিয়াম, 26`}
          aria-label={t('elements.search')}
          className="input min-h-10 pl-9 text-xs"
        />
      </div>

      {!elements ? (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {Array.from({ length: 24 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-[var(--surface-soft)]" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {filtered.map((element) => (
            <li key={element.z}>
              <button
                type="button"
                onClick={() => setSelected(element)}
                className={cn(
                  'flex h-full w-full flex-col items-start rounded-lg p-1.5 text-left transition hover:-translate-y-0.5 hover:shadow-card',
                  categoryTone[element.category] ?? 'bg-[var(--surface-soft)]'
                )}
                aria-label={`${element.name_en} (${element.symbol})`}
              >
                <span className="text-[9px] font-bold opacity-70">{element.z}</span>
                <span className="text-sm font-black leading-none">{element.symbol}</span>
                <span className="mt-0.5 line-clamp-1 text-[9px] font-bold opacity-80">
                  {locale === 'bn' ? element.name_bn : element.name_en}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="col-span-full p-4 text-center text-xs muted">{t('shelf.noResults', { query })}</li>}
        </ul>
      )}

      {selected && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-black">
                {selected.symbol} · {locale === 'bn' ? selected.name_bn : selected.name_en}
              </p>
              <p className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-black', categoryTone[selected.category])}>
                {locale === 'bn' ? selected.category_bn : selected.category}
              </p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="btn-ghost min-h-8 rounded-lg px-2 py-1 text-xs">
              {t('elements.close')}
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              [t('elements.atomicNumber'), selected.z],
              [t('elements.mass'), selected.mass],
              [t('elements.group'), selected.group ?? '—'],
              [t('elements.period'), selected.period],
              [t('elements.block'), selected.block.toUpperCase()],
              [t('elements.state'), locale === 'bn' ? selected.state_bn : selected.state]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-[var(--surface)] p-2">
                <dt className="text-[10px] font-bold uppercase tracking-wide muted">{label}</dt>
                <dd className="mt-0.5 font-mono text-sm font-black">{value}</dd>
              </div>
            ))}
          </dl>
          {selected.radioactive && (
            <p className="mt-2 rounded-lg bg-rose-50 p-2 text-[11px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-100">
              {t('elements.radioactive')} ☢
            </p>
          )}
        </div>
      )}
    </div>
  );
}
