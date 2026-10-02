'use client';

import Fuse from 'fuse.js';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Command, Search, ArrowRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchRecord } from '@/lib/schemas';
import { Badge } from '@/components/ui/Badge';

export function CommandPalette() {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    fetch('/search-index.json').then((response) => response.ok ? response.json() as Promise<SearchRecord[]> : []).then(setRecords).catch(() => setRecords([]));
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 40); else setQuery(''); }, [open]);
  const fuse = useMemo(() => new Fuse(records, { keys: ['title_en', 'title_bn', 'description_en', 'description_bn', 'tags'], threshold: 0.35 }), [records]);
  const results = query.trim() ? fuse.search(query).slice(0, 8).map((item) => item.item) : records.slice(0, 8);
  const openRecord = (record: SearchRecord) => { setOpen(false); router.push(`/${locale}${record.href}`); };

  return (
    <>
      {/* Wide screens get the labelled pill with the shortcut hint; phones get an icon
          button so search is never more than one tap away. */}
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary hidden min-h-9 gap-2 rounded-lg px-3 text-xs sm:inline-flex" aria-label="Open command palette">
        <Search size={15} /><span>{t('search')}</span><kbd className="rounded border border-[var(--line)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary min-h-9 rounded-lg px-2.5 sm:hidden" aria-label={t('search')}>
        <Search size={17} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink-900/50 p-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t('search')}>
          <button type="button" aria-label="Close search" className="absolute inset-0 cursor-default" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-float">
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
              <Search size={20} className="text-[var(--muted)]" />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted)] sm:text-sm" />
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost min-h-8 rounded-lg p-1.5" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 ? <p className="p-8 text-center text-sm muted">{t('noResults')}</p> : results.map((record) => (
                <button key={`${record.kind}-${record.slug}`} type="button" onClick={() => openRecord(record)} className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[var(--surface-soft)]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100"><Command size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{locale === 'bn' ? record.title_bn : record.title_en}</span><span className="block truncate text-xs muted">{locale === 'bn' ? record.description_bn : record.description_en}</span></span>
                  <Badge tone={record.subject === 'physics' ? 'physics' : 'chemistry'}>{record.kind}</Badge><ArrowRight size={16} className="text-[var(--muted)] transition group-hover:translate-x-1" />
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2 text-[11px] muted"><span>↑↓ navigate · Enter open</span><span>Esc close</span></div>
          </div>
        </div>
      )}
    </>
  );
}
