'use client';

import Link from 'next/link';
import { ArrowRight, Atom, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { SimulationMeta } from '@/lib/simulations';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatLevel } from '@/lib/labels';

export function SimulationCard({ simulation }: { simulation: SimulationMeta }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations();
  const title = locale === 'bn' ? simulation.title_bn : simulation.title_en;
  const description = locale === 'bn' ? simulation.description_bn : simulation.description_en;
  return <Link href={`/${locale}/simulations/${simulation.slug}`} className="group block h-full"><Card className="card-hover flex h-full flex-col overflow-hidden"><div className={`relative h-32 overflow-hidden p-5 ${simulation.subject === 'physics' ? 'bg-physics-50 dark:bg-physics-900/60' : 'bg-chemistry-50 dark:bg-chemistry-900/60'}`}><div className="absolute -right-4 -top-8 text-[9rem] font-black leading-none opacity-10">{simulation.symbol}</div><div className="relative flex items-start justify-between"><Badge tone={simulation.subject === 'physics' ? 'physics' : 'chemistry'}>{simulation.subject === 'physics' ? t('simulations.physicsLab') : t('simulations.chemistryLab')}</Badge><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface)]/80 text-physics-600 shadow-sm">{simulation.subject === 'physics' ? <Sparkles size={18} /> : <Atom size={18} />}</span></div></div><div className="flex flex-1 flex-col p-5"><div className="mb-2 flex items-center gap-2 text-xs font-bold muted"><span>{formatLevel(simulation.level, locale)}</span><span>·</span><span>{simulation.formula}</span></div><h2 className="text-xl font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 muted">{description}</p><span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-black text-physics-600 transition group-hover:gap-2 dark:text-physics-200">{t('common.open')} <ArrowRight size={15} /></span></div></Card></Link>;
}
