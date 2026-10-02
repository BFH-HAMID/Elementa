import type { Metadata } from 'next';
import { ExperimentCard } from '@/components/content/ExperimentCard';
import { getExperimentEntries } from '@/lib/content';

export const metadata: Metadata = { title: 'Experiments', description: 'Bilingual practical physics and chemistry experiments with virtual labs.' };

export default function ExperimentsPage() {
  const experiments = getExperimentEntries();
  return <section className="page-shell section-space"><div className="mb-8 max-w-3xl"><p className="eyebrow">PhysChem Lab · Practical</p><h1 className="display-title mt-3">পরীক্ষা <span className="text-chemistry-600 dark:text-chemistry-200">/ Experiments</span></h1><p className="mt-4 text-base leading-7 muted">Plan, observe and explain practical work before you enter the lab. Every guide includes a virtual route for safe rehearsal.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{experiments.map((experiment) => <ExperimentCard key={experiment.slug} experiment={experiment} />)}</div></section>;
}
