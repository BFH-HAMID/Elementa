'use client';

import Fuse from 'fuse.js';
import { Grid2X2, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { EquationEntry } from '@/lib/schemas';
import { EquationCard } from './EquationCard';
import { MathText } from './MathText';
import { Tex } from './Tex';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatLevel } from '@/lib/labels';
import { topicFor, topicGroups, topicLabel } from '@/lib/topics';
import { cn, titleFor } from '@/lib/utils';

type SubjectFilter = 'all' | 'physics' | 'chemistry';

export function EquationLibrary({ equations, initialSubject = 'all' }: { equations: EquationEntry[]; initialSubject?: SubjectFilter }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<SubjectFilter>(initialSubject);
  useEffect(() => setSubject(initialSubject), [initialSubject]);
  const updateSubject = (value: SubjectFilter) => {
    setSubject(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') params.delete('subject');
    else params.set('subject', value);
    const queryString = params.toString();
    router.replace(`${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`, { scroll: false });
  };
  const [topic, setTopic] = useState('all');
  const [chapter, setChapter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<'az' | 'level'>('az');
  const chapters = useMemo(() => Array.from(new Set(equations.map((equation) => locale === 'bn' ? equation.chapter_bn ?? equation.chapter : equation.chapter))).sort((a, b) => a.localeCompare(b)), [equations, locale]);
  const fuse = useMemo(() => new Fuse(equations, { keys: ['title_en', 'title_bn', 'chapter', 'chapter_bn', 'tags', 'summary_en', 'summary_bn', 'derivation', 'derivation_bn', 'derivation_steps.step_en', 'derivation_steps.step_bn', 'reference_formulas.label_en', 'reference_formulas.label_bn', 'reference_formulas.note_en', 'reference_formulas.note_bn'], threshold: 0.35 }), [equations]);
  const filtered = useMemo(() => {
    let source = query.trim() ? fuse.search(query).map((result) => result.item) : equations;
    source = source.filter((equation) => subject === 'all' || equation.subject === subject).filter((equation) => topic === 'all' || topicFor(equation) === topic).filter((equation) => chapter === 'all' || (locale === 'bn' ? equation.chapter_bn ?? equation.chapter : equation.chapter) === chapter);
    return [...source].sort((a, b) => sort === 'az' ? titleFor(locale, a.title_bn, a.title_en).localeCompare(titleFor(locale, b.title_bn, b.title_en)) : a.level.localeCompare(b.level));
  }, [chapter, equations, fuse, topic, locale, query, sort, subject]);
  const clear = () => { setQuery(''); updateSubject('all'); setTopic('all'); setChapter('all'); };
  const activeFilters = subject !== 'all' || topic !== 'all' || chapter !== 'all' || query.length > 0;
  return <div className="space-y-6"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} /><input className="input pl-10 pr-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.searchPlaceholder')} aria-label={t('common.search')} />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted)]" aria-label={t('common.clear')}><X size={15} /></button>}</label><div className="flex flex-wrap gap-2"><select value={subject} onChange={(event) => updateSubject(event.target.value as SubjectFilter)} className="input min-w-[7.5rem] flex-1 sm:flex-none" aria-label={t('common.physics')}><option value="all">{t('common.all')} · {t('equations.title')}</option><option value="physics">{t('common.physics')}</option><option value="chemistry">{t('common.chemistry')}</option></select><select value={topic} onChange={(event) => setTopic(event.target.value)} className="input min-w-[9rem] flex-1 sm:flex-none" aria-label={locale === 'bn' ? 'টপিক বাছাই' : 'Filter by topic'}><option value="all">{locale === 'bn' ? 'সব টপিক' : 'All topics'}</option>{topicGroups.map((group) => <option key={group.id} value={group.id}>{topicLabel(group.id, locale)}</option>)}</select></div></div><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><SlidersHorizontal size={15} className="muted" /><select value={chapter} onChange={(event) => setChapter(event.target.value)} className="input h-9 min-h-9 w-auto max-w-full text-xs"><option value="all">{t('common.chapter')}</option>{chapters.map((item) => <option key={item} value={item}>{item}</option>)}</select>{activeFilters && <Button variant="ghost" className="min-h-9 px-2 text-xs" onClick={clear}>{t('common.clear')}</Button>}</div><div className="flex items-center gap-2"><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="input h-9 min-h-9 w-auto text-xs"><option value="az">{t('equations.az')}</option><option value="level">{t('equations.levelAsc')}</option></select><div className="flex rounded-lg border border-[var(--line)] p-0.5"><button type="button" onClick={() => setView('grid')} className={cn('rounded-md p-1.5', view === 'grid' ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'muted')} aria-label={t('equations.grid')}><Grid2X2 size={15} /></button><button type="button" onClick={() => setView('list')} className={cn('rounded-md p-1.5', view === 'list' ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'muted')} aria-label={t('equations.list')}><List size={15} /></button></div></div></div><p className="text-sm font-bold muted">{filtered.length} {t('equations.equationCount')}</p>{filtered.length === 0 ? <div className="card grid min-h-64 place-items-center p-8 text-center"><div><p className="text-lg font-extrabold">{t('common.noResults')}</p><p className="mt-2 text-sm muted">Try a chapter, subject or different keyword.</p><Button variant="secondary" className="mt-4" onClick={clear}>{t('common.clear')}</Button></div></div> : view === 'grid' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((equation) => <EquationCard key={equation.slug} equation={equation} />)}</div> : <div className="grid gap-3">{filtered.map((equation) => <div key={equation.slug} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap gap-1.5"><Badge tone={equation.subject === 'physics' ? 'physics' : 'chemistry'}>{equation.subject === 'physics' ? t('common.physics') : t('common.chemistry')}</Badge><Badge>{formatLevel(equation.level, locale)}</Badge></div><h3 className="font-extrabold">{titleFor(locale, equation.title_bn, equation.title_en)}</h3><p className="mt-1 text-sm muted"><MathText text={(locale === 'bn' ? equation.summary_bn ?? equation.derivation_bn : equation.summary_en ?? equation.derivation) ?? ''} /></p></div><div className="equation-display min-w-[180px] sm:max-w-[280px]"><Tex latex={equation.latex} /></div><a href={`/${locale}/equations/${equation.slug}`} className="btn-secondary min-h-9 shrink-0 px-3 text-xs">{t('common.open')}</a></div>)}</div>}</div>;
}
