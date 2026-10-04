'use client';

import Link from 'next/link';
import { ArrowRight, Beaker, Bookmark } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ExperimentEntry } from '@/lib/schemas';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatLevel } from '@/lib/labels';
import { MathText } from './MathText';

export function ExperimentCard({ experiment }: { experiment: ExperimentEntry }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations();
  const title = locale === 'bn' ? experiment.title_bn : experiment.title_en;
  return <Link href={`/${locale}/experiments/${experiment.slug}`} className="group block h-full"><Card className="card-hover flex h-full flex-col overflow-hidden"><div className={`h-2 ${experiment.subject === 'physics' ? 'bg-physics-500' : 'bg-chemistry-500'}`} /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${experiment.subject === 'physics' ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100'}`}><Beaker size={21} /></span><Bookmark size={17} className="text-[var(--muted)]" /></div><div className="mt-5 flex flex-wrap gap-1.5"><Badge tone={experiment.subject === 'physics' ? 'physics' : 'chemistry'}>{experiment.subject === 'physics' ? t('common.physics') : t('common.chemistry')}</Badge><Badge>{formatLevel(experiment.level, locale)}</Badge></div><h2 className="mt-3 text-xl font-extrabold">{title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 muted"><MathText text={locale === 'bn' ? experiment.aim_bn ?? experiment.aim : experiment.aim} /></p><span className="mt-auto pt-6 inline-flex items-center gap-1 text-sm font-black text-physics-600 transition group-hover:gap-2 dark:text-physics-200">{t('common.learnMore')} <ArrowRight size={15} /></span></div></Card></Link>;
}
