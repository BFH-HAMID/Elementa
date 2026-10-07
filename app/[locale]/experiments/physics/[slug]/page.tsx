import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Atom, ChevronRight, Clock, ListChecks, Play, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { getPhysicsExperiment, physicsGuidedExperiments } from '@/lib/physicsData';
import { physicsT } from '@/lib/i18n';
import { isLocale, locales } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    physicsGuidedExperiments.map((experiment) => ({ locale, slug: experiment.slug }))
  );
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const experiment = getPhysicsExperiment(params.slug);
  if (!experiment) return { title: 'Physics Experiment' };
  const locale = isLocale(params.locale) ? params.locale : 'en';
  return {
    title: locale === 'bn' ? experiment.title_bn : experiment.title_en,
    description: locale === 'bn' ? experiment.aim_bn : experiment.aim_en,
    alternates: { canonical: `/experiments/physics/${experiment.slug}` }
  };
}

const levelTone: Record<string, string> = {
  'class-6-8': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  'class-9-10': 'bg-physics-100 text-physics-800 dark:bg-physics-900 dark:text-physics-100',
  'class-11-12': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-100',
  honours: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-100'
};

export default function PhysicsExperimentDetailPage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) notFound();
  const experiment = getPhysicsExperiment(params.slug);
  if (!experiment) notFound();

  const locale = params.locale;
  const title = locale === 'bn' ? experiment.title_bn : experiment.title_en;
  const aim = locale === 'bn' ? experiment.aim_bn : experiment.aim_en;
  const theory = locale === 'bn' ? experiment.theory_bn : experiment.theory_en;

  return (
    <section className="page-shell section-space pb-16">
      {/* Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--muted)]">
        <Link href={`/${locale}/lab/physics`} className="inline-flex items-center gap-1 hover:text-physics-600">
          <ArrowLeft size={15} /> {physicsT(locale, 'brand.title')}
        </Link>
        <ChevronRight size={15} />
        <span className="truncate text-[var(--ink)]">{title}</span>
      </div>

      {/* Header & Launch CTA */}
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={cn('rounded-full px-3 py-0.5 text-[11px] font-black', levelTone[experiment.level] ?? '')}>
              {experiment.level.toUpperCase()}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-3 py-0.5 text-[11px] font-bold text-[var(--muted)]">
              <Clock size={11} /> {experiment.durationMinutes} min
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-3 py-0.5 text-[11px] font-bold text-[var(--muted)]">
              <ListChecks size={11} /> {experiment.procedureSteps.length} {locale === 'bn' ? 'ধাপ' : 'steps'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[var(--ink)] sm:text-3xl lg:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">{aim}</p>
        </div>

        <Link
          href={`/${locale}/lab/physics?experiment=${experiment.slug}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-physics-600 px-6 py-3.5 text-sm font-black text-white shadow-float transition hover:bg-physics-700 hover:scale-105"
        >
          <Play size={17} className="fill-white" />
          {locale === 'bn' ? 'ভার্চুয়াল ল্যাবে চালু করুন' : 'Launch in Physics Lab'}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Theory & Formula (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <BookOpen size={18} className="text-physics-600" />
              <h2 className="text-base font-black text-[var(--ink)]">
                {locale === 'bn' ? 'তত্ত্ব ও সমীকরণ' : 'Scientific Theory & Governing Formula'}
              </h2>
            </div>
            <p className="text-sm font-bold text-[var(--ink)] leading-relaxed">{theory}</p>
            <div className="rounded-2xl border border-physics-300 bg-physics-500/10 p-4 font-mono">
              <p className="text-base font-black text-physics-900 dark:text-physics-100">{experiment.formula_latex}</p>
              <p className="mt-1 text-xs text-[var(--muted)] font-bold">
                {locale === 'bn' ? experiment.formula_desc_bn : experiment.formula_desc_en}
              </p>
            </div>
          </div>

          {/* Procedure Steps */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card space-y-4">
            <h2 className="text-base font-black text-[var(--ink)] border-b border-[var(--line)] pb-3">
              {locale === 'bn' ? 'পরীক্ষার কার্যপদ্ধতি' : 'Step-by-Step Practical Procedure'}
            </h2>
            <div className="space-y-3">
              {experiment.procedureSteps.map((step) => (
                <div key={step.stepNumber} className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-physics-600 text-xs font-black text-white">
                    {step.stepNumber}
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[var(--ink)] leading-relaxed">
                      {locale === 'bn' ? step.instruction_bn : step.instruction_en}
                    </p>
                    {step.hint_en && (
                      <p className="text-[11px] font-bold text-physics-600 dark:text-physics-300">
                        💡 {locale === 'bn' ? step.hint_bn : step.hint_en}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Precautions & Apparatus */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card space-y-3">
            <h3 className="text-sm font-black text-[var(--ink)] border-b border-[var(--line)] pb-2.5">
              {locale === 'bn' ? 'প্রয়োজনীয় যন্ত্রপাতি' : 'Required Apparatus'}
            </h3>
            <ul className="space-y-2">
              {experiment.apparatusRequired.map((id) => (
                <li key={id} className="flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] p-2.5 font-mono text-xs font-bold text-[var(--ink)]">
                  <Atom size={14} className="text-physics-600" />
                  <span>{id}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <ShieldAlert size={16} className="text-amber-500" />
              <h3 className="text-sm font-black text-[var(--ink)]">
                {locale === 'bn' ? 'সতর্কতা' : 'Precautions'}
              </h3>
            </div>
            <ul className="space-y-2">
              {(locale === 'bn' ? experiment.precautions_bn : experiment.precautions_en).map((p, idx) => (
                <li key={idx} className="text-xs font-bold text-[var(--muted)] leading-relaxed">
                  • {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
