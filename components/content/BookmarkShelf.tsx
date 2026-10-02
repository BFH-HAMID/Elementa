'use client';

import Link from 'next/link';
import { Bookmark, BookmarkX, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { EquationEntry } from '@/lib/schemas';
import { useLabStore } from '@/lib/store';
import { EquationCard } from './EquationCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function BookmarkShelf({ equations }: { equations: EquationEntry[] }) {
  const locale = useLocale() as 'bn' | 'en'; const t = useTranslations(); const bookmarks = useLabStore((state) => state.bookmarks); const saved = equations.filter((equation) => bookmarks.includes(equation.slug)); const recent = useLabStore((state) => state.recentlyViewed);
  return <div className="space-y-10"><section><div className="mb-5 flex items-center gap-2"><Bookmark size={20} className="text-amber-600" /><h2 className="section-title text-xl">{t('nav.bookmarks')}</h2><span className="pill bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100">{saved.length}</span></div>{saved.length === 0 ? <Card className="grid min-h-56 place-items-center p-8 text-center"><div><BookmarkX size={30} className="mx-auto text-[var(--muted)]" /><p className="mt-3 font-extrabold">{t('common.emptyBookmarks')}</p><Button variant="secondary" className="mt-4" onClick={() => window.location.assign(`/${locale}/equations`)}>{t('common.explore')}</Button></div></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{saved.map((equation) => <EquationCard key={equation.slug} equation={equation} />)}</div>}</section><section><div className="mb-5 flex items-center justify-between"><h2 className="section-title text-xl">{t('home.recent')}</h2><Link href={`/${locale}`} className="text-sm font-bold text-physics-600 dark:text-physics-200">{t('common.back')}</Link></div>{recent.length === 0 ? <p className="text-sm muted">{t('common.emptyBookmarks')}</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{recent.map((item) => <Link key={`${item.kind}-${item.slug}`} href={`/${locale}${item.href}`} className="card card-hover p-4"><div className="flex items-start justify-between gap-2"><p className="text-xs font-bold uppercase tracking-widest muted">{item.kind}</p><ExternalLink size={14} className="muted" /></div><p className="mt-2 line-clamp-2 text-sm font-extrabold">{item.title}</p></Link>)}</div>}</section></div>;
}
