import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Beaker, ChevronRight, Clock, FlaskConical, ListChecks, ShieldAlert, Sparkles } from 'lucide-react';
import { checkHint } from '@/engine/experimentChecks';
import { equationFor, observationFor } from '@/engine/reactionEngine';
import { labT } from '@/lib/i18n';
import { apparatusName, chemicalName, chemicalsById, experimentHref, getExperiment, guidedExperiments, reactionsById } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { isLocale, locales } from '@/i18n/routing';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => guidedExperiments.map((experiment) => ({ locale, slug: experiment.slug })));
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const experiment = getExperiment(params.slug);
  if (!experiment) return { title: 'Guided experiment' };
  const locale = isLocale(params.locale) ? params.locale : 'en';
  return {
    title: locale === 'bn' ? experiment.title_bn : experiment.title_en,
    description: locale === 'bn' ? experiment.aim_bn : experiment.aim_en,
    alternates: { canonical: `/lab/experiments/${experiment.slug}` }
  };
}

const levelTone: Record<string, string> = {
  'class-6-8': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  'class-9-10': 'bg-physics-100 text-physics-800 dark:bg-physics-900 dark:text-physics-100',
  'class-11-12': 'bg-chemistry-100 text-chemistry-800 dark:bg-chemistry-900 dark:text-chemistry-100',
  honours: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-100'
};

export default function LabExperimentDetailPage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) notFound();
  const experiment = getExperiment(params.slug);
  if (!experiment) notFound();

  const locale = params.locale;
  const title = locale === 'bn' ? experiment.title_bn : experiment.title_en;
  const aim = locale === 'bn' ? experiment.aim_bn : experiment.aim_en;
  const safety = (locale === 'bn' ? experiment.safety.bn : experiment.safety.en) ?? experiment.safety.en;

  return (
    <section className="page-shell section-space">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold muted">
        <Link href={`/${locale}/lab/experiments`} className="inline-flex items-center gap-1 hover:text-chemistry-600">
          <ArrowLeft size={15} /> {labT(locale, 'experiment.title')}
        </Link>
        <ChevronRight size={15} />
        <span className="truncate text-[var(--ink)]">{title}</span>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={cn('pill text-[11px] font-black', levelTone[experiment.level] ?? '')}>
              {labT(locale, `experiment.level.${experiment.level}`)}
            </span>
            <span className="pill bg-[var(--surface-soft)] text-[11px] font-bold">
              <Clock size={11} /> {labT(locale, 'experiment.duration', { value: experiment.durationMinutes })}
            </span>
            <span className="pill bg-[var(--surface-soft)] text-[11px] font-bold">
              <ListChecks size={11} /> {experiment.steps.length} {labT(locale, 'experiment.steps')}
            </span>
          </div>
          <h1 className={cn('display-title', locale === 'bn' && 'font-bengali')}>{title}</h1>
          <p className={cn('mt-4 text-base leading-7 muted', locale === 'bn' && 'font-bengali')}>
            <span className="font-black text-[var(--ink)]">{labT(locale, 'experiment.aim')}: </span>
            {aim}
          </p>
        </div>
        <Link href={`/${locale}/lab/chemistry?experiment=${experiment.slug}`} className="btn-primary shrink-0">
          <Beaker size={17} /> {labT(locale, 'action.openInLab')}
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="section-title text-lg">{labT(locale, 'experiment.steps')}</h2>
            <ol className="mt-4 space-y-3">
              {experiment.steps.map((step) => (
                <li key={step.order} className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-chemistry-600 font-mono text-xs font-black text-white">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <p className={cn('text-sm leading-6', locale === 'bn' ? 'font-bengali' : 'font-medium')}>
                      {locale === 'bn' ? step.text_bn : step.text_en}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-chemistry-700 dark:text-chemistry-200">
                      {locale === 'bn' ? 'ল্যাব যা দেখে: ' : 'The lab checks: '}
                      {checkHint(step.check, locale, chemicalsById)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {experiment.expectedReactions.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title text-lg">
                <Sparkles size={17} className="mr-1.5 inline text-chemistry-600" />
                {locale === 'bn' ? 'প্রত্যাশিত বিক্রিয়া' : 'Expected reactions'}
              </h2>
              <ul className="mt-4 space-y-3">
                {experiment.expectedReactions.map((id) => {
                  const reaction = reactionsById.get(id);
                  if (!reaction) return null;
                  return (
                    <li key={id} className="rounded-xl border border-[var(--line)] p-3">
                      <p className="scrollbar-thin overflow-x-auto font-mono text-sm font-bold leading-6">{equationFor(reaction, locale)}</p>
                      <p className="mt-1 scrollbar-thin overflow-x-auto font-mono text-[11px] leading-5 muted">
                        {equationFor(reaction, locale === 'bn' ? 'en' : 'bn')}
                      </p>
                      <p className={cn('mt-2 text-xs leading-5 muted', locale === 'bn' && 'font-bengali')}>{observationFor(reaction, locale)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {experiment.quiz.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title text-lg">{labT(locale, 'experiment.quiz')}</h2>
              <div className="mt-4 space-y-4">
                {experiment.quiz.map((quiz, index) => (
                  <div key={quiz.question_en} className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <p className={cn('text-sm font-bold leading-6', locale === 'bn' && 'font-bengali')}>
                      {index + 1}. {locale === 'bn' ? quiz.question_bn : quiz.question_en}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {(locale === 'bn' ? quiz.options_bn : quiz.options_en).map((option, optionIndex) => (
                        <li key={option} className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs leading-5">
                          <span className="font-mono text-[10px] font-black muted">{String.fromCharCode(97 + optionIndex)}</span>
                          <span className={cn(locale === 'bn' && 'font-bengali')}>{option}</span>
                        </li>
                      ))}
                    </ul>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[11px] font-black text-physics-700 dark:text-physics-200">
                        {locale === 'bn' ? 'উত্তর ও ব্যাখ্যা দেখুন' : 'Show answer and explanation'}
                      </summary>
                      <p className={cn('mt-2 rounded-lg bg-[var(--surface)] p-3 text-xs leading-5', locale === 'bn' && 'font-bengali')}>
                        <span className="font-black">
                          {locale === 'bn' ? 'উত্তর' : 'Answer'}: {String.fromCharCode(97 + quiz.answer)}.{' '}
                          {(locale === 'bn' ? quiz.options_bn : quiz.options_en)[quiz.answer]} ·{' '}
                        </span>
                        {locale === 'bn' ? quiz.explain_bn : quiz.explain_en}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-extrabold">{labT(locale, 'action.loadSetup')}</h2>
            <ul className="mt-3 space-y-2">
              {experiment.setup.vessels.map((setup, index) => (
                <li key={`${setup.apparatusId}-${index}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold">
                    <FlaskConical size={13} className="text-physics-600" />
                    {locale === 'bn' ? setup.label_bn : setup.label_en}
                  </p>
                  <p className="mt-0.5 text-[11px] muted">{apparatusName(setup.apparatusId, locale)}</p>
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {setup.portions.map((portion) => (
                      <li key={portion.chemicalId} className="pill border border-[var(--line)] bg-[var(--surface)] font-mono text-[10px]">
                        {chemicalName(portion.chemicalId, locale)} {portion.mL} {labT(locale, 'unit.mL')}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <Link href={`/${locale}/lab/chemistry?experiment=${experiment.slug}`} className="btn-secondary mt-4 w-full justify-center">
              {labT(locale, 'action.openInLab')}
            </Link>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-extrabold">{labT(locale, 'experiment.apparatus')}</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {experiment.apparatus.map((id) => (
                <li key={id} className="pill bg-[var(--surface-soft)] text-[11px]">{apparatusName(id, locale)}</li>
              ))}
            </ul>
            <h2 className="mt-5 text-sm font-extrabold">{labT(locale, 'experiment.chemicals')}</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {experiment.chemicals.map((id) => (
                <li key={id} className="pill border border-[var(--line)] bg-[var(--surface)] font-mono text-[11px]">
                  {chemicalName(id, locale)}
                </li>
              ))}
            </ul>
          </div>

          {safety && (
            <div
              className={cn(
                'rounded-2xl border p-4 text-xs leading-6',
                experiment.safety.level === 'danger'
                  ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100'
              )}
            >
              <p className="flex items-center gap-1.5 text-sm font-extrabold">
                <ShieldAlert size={16} /> {labT(locale, 'experiment.safety')}
              </p>
              <p className={cn('mt-2', locale === 'bn' && 'font-bengali')}>{safety}</p>
              <p className="mt-3 border-t border-current/20 pt-2 text-[11px] opacity-80">{labT(locale, 'safety.simulated')}</p>
            </div>
          )}
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: experiment.title_en,
            alternateName: experiment.title_bn,
            description: experiment.aim_en,
            learningResourceType: 'virtual laboratory experiment',
            educationalLevel: experiment.level,
            timeRequired: `PT${experiment.durationMinutes}M`,
            isAccessibleForFree: true,
            inLanguage: ['bn', 'en']
          })
        }}
      />
    </section>
  );
}
