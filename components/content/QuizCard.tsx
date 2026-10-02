'use client';

import Link from 'next/link';
import { ArrowRight, BrainCircuit } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Quiz } from '@/lib/schemas';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatLevel } from '@/lib/labels';

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const locale = useLocale() as 'bn' | 'en'; const t = useTranslations();
  return <Link href={`/${locale}/quiz/${quiz.slug}`} className="group block h-full"><Card className="card-hover flex h-full flex-col p-5"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100"><BrainCircuit size={22} /></span><Badge tone={quiz.subject === 'physics' ? 'physics' : 'chemistry'}>{quiz.questions.length} Q</Badge></div><div className="mt-5 flex flex-wrap gap-1.5"><Badge>{formatLevel(quiz.level, locale)}</Badge><Badge>{quiz.subject === 'physics' ? t('common.physics') : t('common.chemistry')}</Badge></div><h2 className="mt-3 text-xl font-extrabold">{locale === 'bn' ? quiz.title_bn : quiz.title_en}</h2><p className="mt-2 flex-1 text-sm leading-6 muted">{locale === 'bn' ? quiz.description_bn : quiz.description_en}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-physics-600 transition group-hover:gap-2 dark:text-physics-200">{t('quiz.start')} <ArrowRight size={15} /></span></Card></Link>;
}
