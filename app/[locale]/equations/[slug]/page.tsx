import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Beaker, Calculator as CalculatorIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calculator } from '@/components/content/Calculator';
import { MdxArticle } from '@/components/content/MdxArticle';
import { Tex } from '@/components/content/Tex';
import { ViewTracker } from '@/components/content/ViewTracker';
import { formatLevel, getEquationBySlug, getEquationEntries, getExperimentBySlug } from '@/lib/content';
import { getSimulationMeta } from '@/lib/simulations';
import { isLocale, locales, type Locale } from '@/i18n/routing';
import { titleFor } from '@/lib/utils';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => getEquationEntries().map((equation) => ({ locale, slug: equation.slug })));
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const equation = getEquationBySlug(params.slug);
  if (!equation) return {};
  const title = params.locale === 'bn' ? equation.title_bn : equation.title_en;
  return { title, description: equation.summary_en ?? equation.derivation };
}

export default function EquationDetailPage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const equation = getEquationBySlug(params.slug);
  if (!equation) notFound();

  const title = titleFor(locale, equation.title_bn, equation.title_en);
  const isReference = equation.reference_formulas.length > 0;
  const related = equation.related.map((slug) => getEquationBySlug(slug)).filter((item) => item !== undefined).slice(0, 3);
  const simulation = equation.simulation ? getSimulationMeta(equation.simulation) : undefined;
  const experiment = equation.experiment ? getExperimentBySlug(equation.experiment) : undefined;
  const hasCalculator = equation.interactive;
  const hasSidebar = hasCalculator || Boolean(simulation) || Boolean(experiment);

  return (
    <section className="page-shell section-space">
      <ViewTracker item={{ slug: equation.slug, kind: 'equation', href: `/equations/${equation.slug}`, title }} />
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold muted">
        <Link href={`/${locale}/equations`} className="inline-flex items-center gap-1 hover:text-physics-600">
          <ArrowLeft size={15} />Equations
        </Link>
        <ChevronRight size={15} />{title}
      </div>

      <div className={`grid gap-5 ${hasSidebar ? 'lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start' : ''}`}>
        <div className="space-y-5 lg:col-start-1 lg:row-start-1">
          <Card className="overflow-hidden">
            <CardHeader className="bg-[var(--surface-soft)]">
              <div className="flex flex-wrap gap-2">
                <Badge tone={equation.subject === 'physics' ? 'physics' : 'chemistry'}>{equation.subject === 'physics' ? 'Physics' : 'Chemistry'}</Badge>
                <Badge>{formatLevel(equation.level, locale)}</Badge>
                <Badge>{locale === 'bn' ? equation.chapter_bn ?? equation.chapter : equation.chapter}</Badge>
                {equation.derivation_steps.length > 0 && <Badge>{locale === 'bn' ? 'প্রতিপাদনসহ' : 'Step-by-step derivation'}</Badge>}
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
              <p className="text-sm leading-6 muted">
                {locale === 'bn' ? equation.summary_bn ?? equation.derivation_bn : equation.summary_en ?? equation.derivation}
              </p>
              <div className="equation-display rounded-2xl bg-[var(--surface)] px-4 py-5">
                <Tex latex={equation.latex} />
              </div>
            </CardHeader>
            <CardBody className="pt-6">
              <h2 className="mb-3 text-lg font-extrabold">
                {locale === 'bn'
                  ? isReference ? 'প্রধান সূত্রের চলক' : 'চলকগুলো'
                  : isReference ? 'Variables in the featured relation' : 'Variables'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider muted">
                      <th className="px-2 py-2">Symbol</th>
                      <th className="px-2 py-2">{locale === 'bn' ? 'নাম' : 'Name'}</th>
                      <th className="px-2 py-2">Unit</th>
                      <th className="px-2 py-2">SI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equation.variables.map((variable) => (
                      <tr key={variable.symbol} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-2 py-3 font-mono font-bold text-physics-600">{variable.symbol}</td>
                        <td className="px-2 py-3">{locale === 'bn' ? variable.name_bn ?? variable.name : variable.name}</td>
                        <td className="px-2 py-3 muted">{variable.unit}</td>
                        <td className="px-2 py-3 muted">{variable.si_unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {hasSidebar && (
          <aside className="space-y-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            {hasCalculator && <Calculator equation={equation} />}
            {simulation && (
              <Link href={`/${locale}/simulations/${simulation.slug}`} className="group block rounded-2xl border border-chemistry-200 bg-chemistry-50 p-4 transition hover:-translate-y-0.5 dark:border-chemistry-700 dark:bg-chemistry-900/50">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-chemistry-600 text-white"><Beaker size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black uppercase tracking-widest text-chemistry-700 dark:text-chemistry-200">{locale === 'bn' ? 'সিমুলেশন চালান' : 'Try the simulation'}</span>
                    <span className="mt-1 block truncate font-extrabold">{locale === 'bn' ? simulation.title_bn : simulation.title_en}</span>
                  </span>
                  <ChevronRight size={18} className="text-chemistry-600 transition group-hover:translate-x-1" />
                </div>
              </Link>
            )}
            {experiment && (
              <Link href={`/${locale}/experiments/${experiment.slug}`} className="group block rounded-2xl border border-physics-200 bg-physics-50 p-4 transition hover:-translate-y-0.5 dark:border-physics-700 dark:bg-physics-900/50">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-physics-600 text-white"><Beaker size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black uppercase tracking-widest text-physics-700 dark:text-physics-200">{locale === 'bn' ? 'সম্পর্কিত পরীক্ষা' : 'Related experiment'}</span>
                    <span className="mt-1 block truncate font-extrabold">{locale === 'bn' ? experiment.title_bn : experiment.title_en}</span>
                  </span>
                  <ChevronRight size={18} className="text-physics-600 transition group-hover:translate-x-1" />
                </div>
              </Link>
            )}
          </aside>
        )}

        <div className="space-y-5 lg:col-start-1 lg:row-start-2">
          {isReference && (
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'bn' ? 'সূত্রসমূহ' : 'Formula collection'}</CardTitle>
                <p className="text-sm leading-6 muted">
                  {locale === 'bn' ? 'প্রতিটি সূত্রের শর্ত ও ব্যবহার সংক্ষেপে দেওয়া আছে।' : 'Each relation includes a short note about when and how to use it.'}
                </p>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {equation.reference_formulas.map((formula, index) => (
                    <article key={`${formula.label_en}-${index}`} className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                      <h3 className="font-extrabold">{locale === 'bn' ? formula.label_bn : formula.label_en}</h3>
                      <div className="equation-display rounded-xl bg-[var(--surface)] px-3 py-2">
                        <Tex latex={formula.latex} />
                      </div>
                      {(locale === 'bn' ? formula.note_bn ?? formula.note_en : formula.note_en) && (
                        <p className="text-sm leading-6 muted">{locale === 'bn' ? formula.note_bn ?? formula.note_en : formula.note_en}</p>
                      )}
                    </article>
                  ))}
                </div>
                {(locale === 'bn' ? equation.reference_note_bn ?? equation.reference_note_en : equation.reference_note_en) && (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                    <strong>{locale === 'bn' ? 'শর্ত ও সতর্কতা: ' : 'Assumptions & cautions: '}</strong>
                    {locale === 'bn' ? equation.reference_note_bn ?? equation.reference_note_en : equation.reference_note_en}
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{locale === 'bn' ? 'প্রতিপাদন ও ধারণা' : 'Derivation & intuition'}</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm leading-7 muted">{locale === 'bn' ? equation.derivation_bn ?? equation.derivation : equation.derivation}</p>
              {equation.derivation_steps.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-physics-600 dark:text-physics-200">
                    {locale === 'bn' ? 'ধাপে ধাপে গাণিতিক প্রতিপাদন' : 'Step-by-step mathematical derivation'}
                  </h3>
                  <ol className="space-y-3">
                    {equation.derivation_steps.map((step, index) => (
                      <li key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-physics-600 text-xs font-black text-white">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-sm font-medium leading-6">
                              {locale === 'bn' ? step.step_bn : step.step_en}
                            </p>
                            {step.latex && (
                              <div className="equation-display rounded-xl bg-[var(--surface)] px-3 py-2">
                                <Tex latex={step.latex} />
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {equation.body && <MdxArticle source={equation.body} />}
            </CardBody>
          </Card>
        </div>

      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <CalculatorIcon size={18} className="text-physics-600" />
            <h2 className="section-title text-xl">{locale === 'bn' ? 'সম্পর্কিত সমীকরণ' : 'Keep exploring'}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/${locale}/equations/${item.slug}`} className="card card-hover p-4">
                <p className="text-sm font-extrabold">{titleFor(locale, item.title_bn, item.title_en)}</p>
                <div className="equation-display"><Tex latex={item.latex} /></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: title,
        learningResourceType: isReference ? 'equation reference sheet' : 'equation',
        educationalLevel: formatLevel(equation.level, 'en'),
        isAccessibleForFree: true,
        inLanguage: ['bn', 'en'],
        url: `https://physchem-lab.vercel.app/${locale}/equations/${equation.slug}`
      }) }} />
    </section>
  );
}
