import type { Metadata } from 'next';
import { PhetSimulationCatalog } from '@/components/sim/PhetSimulationCatalog';
import { SimulationCard } from '@/components/sim/SimulationCard';
import { simulationMetas } from '@/lib/simulations';

type SubjectFilter = 'physics' | 'chemistry';

export const metadata: Metadata = {
  title: 'Simulations',
  description: 'Interactive physics and chemistry simulations, including an embedded PhET HTML5 library.'
};

export default function SimulationsPage({ searchParams }: { searchParams?: { subject?: string } }) {
  const selectedSubject = searchParams?.subject === 'physics' || searchParams?.subject === 'chemistry'
    ? searchParams.subject as SubjectFilter
    : undefined;
  const physics = selectedSubject && selectedSubject !== 'physics'
    ? []
    : simulationMetas.filter((simulation) => simulation.subject === 'physics');
  const chemistry = selectedSubject && selectedSubject !== 'chemistry'
    ? []
    : simulationMetas.filter((simulation) => simulation.subject === 'chemistry');

  return (
    <section className="page-shell section-space">
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow">PhysChem Lab · Browser lab</p>
        <h1 className="display-title mt-3">সিমুলেশন <span className="text-physics-600 dark:text-physics-200">/ Simulations</span></h1>
        <p className="mt-4 text-base leading-7 muted">
          Try the original PhysChem Lab simulations, then browse the official PhET HTML5 library below. Open any PhET sim to run it directly from PhET.
        </p>
      </div>
      {physics.length > 0 && <SimSection id="physics-simulations" title="Physics lab · PhysChem Lab" items={physics} />}
      {chemistry.length > 0 && <SimSection id="chemistry-simulations" title="Chemistry lab · PhysChem Lab" items={chemistry} />}
      <PhetSimulationCatalog initialSubject={selectedSubject ?? 'all'} />
    </section>
  );
}

function SimSection({ id, title, items }: { id: string; title: string; items: typeof simulationMetas }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24" aria-labelledby={`${id}-title`}>
      <div className="mb-5 flex items-center gap-3">
        <h2 id={`${id}-title`} className="section-title text-xl">{title}</h2>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((simulation) => <SimulationCard key={simulation.slug} simulation={simulation} />)}
      </div>
    </section>
  );
}
