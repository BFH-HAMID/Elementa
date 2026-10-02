'use client';

import Link from 'next/link';
import { Bookmark, Check, Copy, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { EquationEntry } from '@/lib/schemas';
import { useLabStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tex } from './Tex';
import { formatLevel } from '@/lib/labels';
import { cn, titleFor } from '@/lib/utils';

export function EquationCard({ equation, compact = false }: { equation: EquationEntry; compact?: boolean }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const isBookmarked = useLabStore((state) => state.bookmarks.includes(equation.slug));
  const toggleBookmark = useLabStore((state) => state.toggleBookmark);
  const addRecent = useLabStore((state) => state.addRecent);
  const { showToast } = useToast();
  const title = titleFor(locale, equation.title_bn, equation.title_en);
  const copyLatex = async () => {
    await navigator.clipboard?.writeText(equation.latex);
    setCopied(true); showToast(t('copied'));
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <Card className={cn('group relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-float', compact ? 'p-4' : 'p-5')}>
    <div className="mb-3 flex items-start justify-between gap-3"><div className="flex flex-wrap gap-1.5"><Badge tone={equation.subject === 'physics' ? 'physics' : 'chemistry'}>{equation.subject === 'physics' ? t('physics') : t('chemistry')}</Badge><Badge>{formatLevel(equation.level, locale)}</Badge>{equation.derivation_steps.length > 0 && <Badge>{locale === 'bn' ? 'প্রতিপাদনসহ' : 'Derivation'}</Badge>}{equation.interactive && <Badge tone="chemistry">{locale === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}</Badge>}</div><button type="button" aria-label={isBookmarked ? t('bookmarked') : t('bookmark')} aria-pressed={isBookmarked} onClick={() => { toggleBookmark(equation.slug); showToast(isBookmarked ? t('bookmark') : t('bookmarked')); }} className={cn('rounded-lg p-2 transition', isBookmarked ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]')}><Bookmark size={17} fill={isBookmarked ? 'currentColor' : 'none'} /></button></div>
    <Link href={`/${locale}/equations/${equation.slug}`} onClick={() => addRecent({ slug: equation.slug, kind: 'equation', href: `/equations/${equation.slug}`, title, })} className="flex flex-1 flex-col"><h3 className="text-lg font-extrabold leading-snug group-hover:text-physics-600 dark:group-hover:text-physics-200">{title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 muted">{locale === 'bn' ? equation.summary_bn ?? equation.derivation_bn ?? equation.derivation : equation.summary_en ?? equation.derivation}</p><div className="equation-display mt-auto"><Tex latex={equation.latex} /></div></Link>
    <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3"><span className="truncate text-xs font-bold muted">{locale === 'bn' ? equation.chapter_bn ?? equation.chapter : equation.chapter}</span><div className="flex gap-1"><button type="button" onClick={copyLatex} className="btn-ghost min-h-8 rounded-lg px-2 text-xs" aria-label={t('copyLatex')}>{copied ? <Check size={14} /> : <Copy size={14} />}<span className="hidden sm:inline">{copied ? t('copied') : 'LaTeX'}</span></button><Link href={`/${locale}/equations/${equation.slug}`} className="btn-ghost min-h-8 rounded-lg p-2" aria-label={t('open')}><ExternalLink size={14} /></Link></div></div>
  </Card>;
}
