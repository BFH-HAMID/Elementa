import type { Metadata } from 'next';
import { ExperimentCard } from '@/components/content/ExperimentCard';
import { PracticalCatalog } from '@/components/content/PracticalCatalog';
import { getExperimentEntries } from '@/lib/content';

type SubjectFilter = 'physics' | 'chemistry';

export const metadata: Metadata = {
  title: 'Experiments',
  description: 'Bilingual practical physics and chemistry experiments, with a searchable school and HSC lab index.'
};

export default function ExperimentsPage({ searchParams }: { searchParams?: { subject?: string } }) {
  const selectedSubject = searchParams?.subject === 'physics' || searchParams?.subject === 'chemistry'
    ? searchParams.subject as SubjectFilter
    : undefined;
  const experiments = getExperimentEntries().filter((experiment) => !selectedSubject || experiment.subject === selectedSubject);

  return (
    <section className="page-shell section-space">
      <div className="max-w-3xl">
        <p className="eyebrow">PhysChem Lab · Practical</p>
        <h1 className="display-title mt-3">পরীক্ষা <span className="text-chemistry-600 dark:text-chemistry-200">/ Experiments</span></h1>
        <p className="mt-4 text-base leading-7 muted">
          Find the practicals in your school or HSC syllabus, review the key measurements and relationships, then use a full lab guide where one is available.
        </p>
      </div>

      <PracticalCatalog initialSubject={selectedSubject ?? 'all'} />

      <div className="mt-16">
        <div className="mb-6 max-w-3xl">
          <p className="eyebrow">Step-by-step notebook</p>
          <h2 className="section-title mt-2">Detailed practical guides <span className="muted">/ বিস্তারিত ব্যবহারিক নির্দেশিকা</span></h2>
          <p className="mt-2 text-sm leading-6 muted">
            Each guide includes an aim, theory, apparatus, procedure, observation table, calculation, precautions and viva prompts.
          </p>
        </div>
        {experiments.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {experiments.map((experiment) => <ExperimentCard key={experiment.slug} experiment={experiment} />)}
          </div>
        ) : (
          <p className="card p-6 text-sm muted">No detailed guides have been added for this subject yet.</p>
        )}
      </div>
    </section>
  );
}
