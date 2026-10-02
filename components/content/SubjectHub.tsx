'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Atom, Beaker, BookOpen, CircleHelp, FlaskConical, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { SubjectResourceCounts } from '@/lib/subject-content';
import type { Subject } from '@/lib/schemas';

const resources = [
  { key: 'equations', icon: BookOpen, href: '/equations' },
  { key: 'experiments', icon: FlaskConical, href: '/experiments' },
  { key: 'simulations', icon: Sparkles, href: '/simulations' },
  { key: 'quizzes', icon: CircleHelp, href: '/quiz' }
] as const;

export function SubjectHub({ subject, counts }: { subject: Subject; counts: SubjectResourceCounts }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations('subjects');
  const isPhysics = subject === 'physics';
  const name = t(isPhysics ? 'physics.name' : 'chemistry.name');
  const focus = t(isPhysics ? 'physics.focus' : 'chemistry.focus');
  const hubEyebrow = t(isPhysics ? 'physics.hubEyebrow' : 'chemistry.hubEyebrow');
  const hubTitle = t(isPhysics ? 'physics.hubTitle' : 'chemistry.hubTitle');
  const hubDescription = t(isPhysics ? 'physics.hubDescription' : 'chemistry.hubDescription');
  const totals = {
    equations: t('equationCount', { count: counts.equations }),
    experiments: t('experimentCounts', { guides: counts.experimentGuides, topics: counts.practicalTopics }),
    simulations: t('simulationCounts', { custom: counts.simulations, phet: counts.phetSimulations }),
    quizzes: t('quizCount', { count: counts.quizzes })
  };
  const hrefFor = (path: string) => `/${locale}${path}?subject=${subject}`;
  const Icon = isPhysics ? Atom : Beaker;

  return (
    <section className="page-shell section-space">
      <div className={`relative isolate overflow-hidden rounded-3xl border p-6 sm:p-9 ${isPhysics ? 'border-physics-200 bg-gradient-to-br from-physics-50 via-[var(--surface)] to-sky-50 dark:border-physics-800 dark:from-physics-950/70 dark:via-[var(--surface)] dark:to-slate-900' : 'border-chemistry-200 bg-gradient-to-br from-chemistry-50 via-[var(--surface)] to-amber-50 dark:border-chemistry-800 dark:from-chemistry-950/70 dark:via-[var(--surface)] dark:to-slate-900'}`}>
        <span aria-hidden="true" className={`pointer-events-none absolute -right-6 -top-12 text-[12rem] font-black leading-none opacity-[0.06] ${isPhysics ? 'text-physics-700' : 'text-chemistry-700'}`}>{isPhysics ? 'F' : 'pH'}</span>
        <div className="relative max-w-3xl">
          <p className="eyebrow">{hubEyebrow}</p>
          <div className="mt-4 flex items-start gap-4">
            <span className={`hidden h-14 w-14 shrink-0 place-items-center rounded-2xl sm:grid ${isPhysics ? 'bg-physics-600 text-white' : 'bg-chemistry-600 text-white'}`}><Icon size={28} /></span>
            <div>
              <h1 className="display-title">{hubTitle}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 muted">{hubDescription}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone={subject}>{name}</Badge>
            <Badge>{focus}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-5 max-w-3xl">
          <p className="eyebrow">{t('resourceEyebrow')}</p>
          <h2 className="section-title mt-2">{t('resourceTitle')}</h2>
          <p className="mt-2 text-sm leading-6 muted">{t('resourceDescription')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resources.map(({ key, icon: ResourceIcon, href }) => (
            <Link key={key} href={hrefFor(href)} className="group block h-full">
              <Card className={`card-hover flex h-full flex-col border-t-4 p-5 ${isPhysics ? 'border-t-physics-500' : 'border-t-chemistry-500'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${isPhysics ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100'}`}><ResourceIcon size={21} /></span>
                  <Badge tone={subject}>{name}</Badge>
                </div>
                <h3 className="mt-5 text-lg font-extrabold">{t(`resources.${key}.title`)}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 muted">{t(`resources.${key}.description`)}</p>
                <p className="mt-4 text-xs font-black text-[var(--ink)]">{totals[key]}</p>
                <span className={`mt-5 inline-flex items-center gap-1 text-sm font-black transition group-hover:gap-2 ${isPhysics ? 'text-physics-700 dark:text-physics-200' : 'text-chemistry-700 dark:text-chemistry-200'}`}>
                  {t('openResource')} <ArrowRight size={15} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
