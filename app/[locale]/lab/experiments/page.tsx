import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Beaker, Clock, FlaskConical, Layers, ListChecks } from 'lucide-react';
import { labT } from '@/lib/i18n';
import { apparatusName, chemicalName, experimentHref, guidedExperiments } from '@/lib/labData';
import { isLocale } from '@/i18n/routing';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) return { title: 'Guided experiments' };
  return {
    title: labT(params.locale, 'experiment.title'),
    description: labT(params.locale, 'experiment.subtitle'),
    alternates: { canonical: '/lab/experiments' }
  };
}

const levelTone: Record<string, string> = {
  'class-6-8': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  'class-9-10': 'bg-physics-100 text-physics-800 dark:bg-physics-900 dark:text-physics-100',
  'class-11-12': 'bg-chemistry-100 text-chemistry-800 dark:bg-chemistry-900 dark:text-chemistry-100',
  honours: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-100'
};

export default function LabExperimentsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;

  return (
    <section className="page-shell section-space">
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow">{labT(locale, 'brand.badge')}</p>
        <h1 className="display-title mt-3">{labT(locale, 'experiment.title')}</h1>
        <p className={`mt-4 text-base leading-7 muted ${locale === 'bn' ? 'font-bengali' : ''}`}>{labT(locale, 'experiment.subtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/${locale}/lab/chemistry`} className="btn-primary">
            <Beaker size={17} /> {labT(locale, 'brand.title')}
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {guidedExperiments.map((experiment) => (
          <article key={experiment.slug} className="card card-hover flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100">
                <FlaskConical size={21} />
              </span>
              <span className={`pill text-[10px] font-black ${levelTone[experiment.level] ?? ''}`}>
                {labT(locale, `experiment.level.${experiment.level}`)}
              </span>
            </div>

            <h2 className={`mt-4 text-lg font-extrabold leading-tight ${locale === 'bn' ? 'font-bengali' : ''}`}>
              <Link href={`/${locale}${experimentHref(experiment.slug)}`} className="hover:text-chemistry-700 dark:hover:text-chemistry-200">
                {locale === 'bn' ? experiment.title_bn : experiment.title_en}
              </Link>
            </h2>
            <p className={`mt-2 line-clamp-3 text-sm leading-6 muted ${locale === 'bn' ? 'font-bengali' : ''}`}>
              {locale === 'bn' ? experiment.aim_bn : experiment.aim_en}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold muted">
              <li className="pill bg-[var(--surface-soft)]">
                <Clock size={11} /> {labT(locale, 'experiment.duration', { value: experiment.durationMinutes })}
              </li>
              <li className="pill bg-[var(--surface-soft)]">
                <ListChecks size={11} /> {experiment.steps.length} {labT(locale, 'experiment.steps')}
              </li>
              <li className="pill bg-[var(--surface-soft)]">
                <Layers size={11} /> {experiment.apparatus.length}
              </li>
            </ul>

            <div className="mt-4">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide muted">{labT(locale, 'experiment.chemicals')}</p>
              <ul className="flex flex-wrap gap-1">
                {experiment.chemicals.slice(0, 6).map((id) => (
                  <li key={id} className="pill border border-[var(--line)] bg-[var(--surface)] font-mono text-[10px]">
                    {chemicalName(id, locale)}
                  </li>
                ))}
                {experiment.chemicals.length > 6 && <li className="pill bg-[var(--surface-soft)] text-[10px]">+{experiment.chemicals.length - 6}</li>}
              </ul>
              <p className="mt-2 text-[11px] muted">
                {experiment.apparatus.slice(0, 4).map((id) => apparatusName(id, locale)).join(' · ')}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Link href={`/${locale}${experimentHref(experiment.slug)}`} className="btn-secondary min-h-9 rounded-lg px-3 text-xs font-bold">
                {locale === 'bn' ? 'বিস্তারিত' : 'Details'} <ArrowRight size={14} />
              </Link>
              <Link href={`/${locale}/lab/chemistry?experiment=${experiment.slug}`} className="btn-primary min-h-9 rounded-lg px-3 text-xs font-bold">
                {labT(locale, 'action.openInLab')}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-xs leading-6 muted">
        {labT(locale, 'safety.simulated')}
      </p>
    </section>
  );
}
