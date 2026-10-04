'use client';

import Link from 'next/link';
import { ArrowLeft, Beaker, ChevronRight, ClipboardCheck, NotebookPen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ExperimentEntry } from '@/lib/schemas';
import { formatLevel } from '@/lib/labels';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { ApparatusList, ExperimentSteps } from './ExperimentSteps';
import { MathText } from './MathText';
import { VivaAccordion } from './VivaAccordion';
import { ViewTracker } from './ViewTracker';

export function ExperimentDetail({ experiment, quizSlug, quizCount }: { experiment: ExperimentEntry; quizSlug?: string; quizCount?: number }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations();
  const title = locale === 'bn' ? experiment.title_bn : experiment.title_en;
  const choose = (en: string, bn?: string) => locale === 'bn' ? bn ?? en : en;
  const keyPoints = locale === 'bn' ? experiment.key_points_bn ?? experiment.key_points : experiment.key_points;
  const reportPoints = locale === 'bn' ? experiment.report_bn ?? experiment.report : experiment.report;
  const tabs = [
    { id: 'aim', label: t('experiments.aim'), content: <p className="text-sm leading-7 muted"><MathText text={choose(experiment.aim, experiment.aim_bn)} /></p> },
    { id: 'theory', label: t('experiments.theory'), content: <p className="text-sm leading-7 muted"><MathText text={choose(experiment.theory, experiment.theory_bn)} /></p> },
    { id: 'apparatus', label: t('experiments.apparatus'), content: <ApparatusList items={locale === 'bn' ? experiment.apparatus_bn ?? experiment.apparatus : experiment.apparatus} /> },
    { id: 'procedure', label: t('experiments.procedure'), content: <ExperimentSteps steps={locale === 'bn' ? experiment.procedure_bn ?? experiment.procedure : experiment.procedure} /> },
    { id: 'observation', label: t('experiments.observation'), content: <ObservationTable headers={locale === 'bn' ? experiment.observation_table.headers_bn ?? experiment.observation_table.headers : experiment.observation_table.headers} rows={experiment.observation_table.rows} /> },
    { id: 'calculation', label: t('experiments.calculation'), content: <p className="text-sm leading-7 muted"><MathText text={choose(experiment.calculation, experiment.calculation_bn)} /></p> },
    { id: 'viva', label: t('experiments.viva'), content: <VivaAccordion items={experiment.viva} locale={locale} /> }
  ];
  return (
    <section className="page-shell section-space">
      <ViewTracker item={{ slug: experiment.slug, kind: 'experiment', href: `/experiments/${experiment.slug}`, title }} />
      <div className="mb-6 flex items-center gap-2 text-sm font-bold muted">
        <Link href={`/${locale}/experiments`} className="inline-flex items-center gap-1 hover:text-physics-600"><ArrowLeft size={15} />{t('nav.experiments')}</Link>
        <ChevronRight size={15} />{title}
      </div>

      <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone={experiment.subject === 'physics' ? 'physics' : 'chemistry'}>{experiment.subject === 'physics' ? t('common.physics') : t('common.chemistry')}</Badge>
            <Badge>{formatLevel(experiment.level, locale)}</Badge>
          </div>
          <h1 className="display-title max-w-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 muted"><MathText text={choose(experiment.aim, experiment.aim_bn)} /></p>
        </div>
        {(experiment.simulation || quizSlug) && (
          <div className="flex flex-wrap gap-2">
            {experiment.simulation && <LinkButton href={`/${locale}/simulations/${experiment.simulation}`} icon={<Beaker size={17} />}>{t('experiments.tryVirtual')}</LinkButton>}
            {quizSlug && <LinkButton href={`/${locale}/quiz/${quizSlug}`} icon={<ClipboardCheck size={17} />}>{locale === 'bn' ? `ব্যাখ্যাসহ কুইজ (${quizCount ?? 0})` : `Practice quiz (${quizCount ?? 0})`}</LinkButton>}
          </div>
        )}
      </div>

      {keyPoints.length > 0 && (
        <Card className="mb-5 overflow-hidden">
          <CardHeader className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t('experiments.keyPoints')}</CardTitle>
              <Badge>{locale === 'bn' ? `${keyPoints.length}টি পয়েন্ট` : `${keyPoints.length} points`}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 muted">{t('experiments.keyPointsHint')}</p>
          </CardHeader>
          <CardBody>
            <ol className="grid gap-x-6 gap-y-2 md:grid-cols-2">
              {keyPoints.map((point, index) => (
                <li key={`${experiment.slug}-point-${index}`} className="flex gap-2.5 text-sm leading-6 muted">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--surface-soft)] font-mono text-[10px] font-black text-physics-700 dark:text-physics-200">
                    {index + 1}
                  </span>
                  <MathText text={point} className="min-w-0 flex-1" />
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-physics-600">
              <ClipboardCheck size={17} />{t('experiments.labGuide')}
            </div>
          </CardHeader>
          <CardBody className="pt-0"><Tabs items={tabs} /></CardBody>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-24">
          {reportPoints.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <NotebookPen size={17} className="text-chemistry-600" />
                  <CardTitle>{t('experiments.report')}</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2 text-sm leading-6 muted">
                  {reportPoints.map((item, index) => (
                    <li key={`${experiment.slug}-report-${index}`} className="flex gap-2">
                      <span className="text-chemistry-600">•</span>
                      <MathText text={item} className="min-w-0 flex-1" />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>{t('experiments.precautions')}</CardTitle></CardHeader>
            <CardBody>
              <ul className="space-y-2 text-sm leading-6 muted">
                {(locale === 'bn' ? experiment.precautions_bn ?? experiment.precautions : experiment.precautions).map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-sun">•</span><MathText text={item} className="min-w-0 flex-1" /></li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('experiments.errors')}</CardTitle></CardHeader>
            <CardBody>
              <ul className="space-y-2 text-sm leading-6 muted">
                {(locale === 'bn' ? experiment.sources_of_error_bn ?? experiment.sources_of_error : experiment.sources_of_error).map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-coral">•</span><MathText text={item} className="min-w-0 flex-1" /></li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ObservationTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line)]">
            {headers.map((header) => <th key={header} className="px-3 py-3 text-xs font-black uppercase tracking-wider muted">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--line)] last:border-0">
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-3 py-3 font-mono text-xs">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
