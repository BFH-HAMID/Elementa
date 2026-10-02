import type { Metadata } from 'next';
import { SimulationCard } from '@/components/sim/SimulationCard';
import { simulationMetas } from '@/lib/simulations';

export const metadata: Metadata = { title: 'Simulations', description: 'Interactive physics and chemistry simulations with controls, live graphs and data export.' };

export default function SimulationsPage() { const physics = simulationMetas.filter((simulation) => simulation.subject === 'physics'); const chemistry = simulationMetas.filter((simulation) => simulation.subject === 'chemistry'); return <section className="page-shell section-space"><div className="mb-10 max-w-3xl"><p className="eyebrow">PhysChem Lab · Browser lab</p><h1 className="display-title mt-3">সিমুলেশন <span className="text-physics-600 dark:text-physics-200">/ Simulations</span></h1><p className="mt-4 text-base leading-7 muted">Make a prediction, move a control and watch a transparent model respond in real time. Record data and download the evidence.</p></div><SimSection title="Physics lab" items={physics} /><SimSection title="Chemistry lab" items={chemistry} /></section>; }

function SimSection({ title, items }: { title: string; items: typeof simulationMetas }) { return <div className="mb-12"><div className="mb-5 flex items-center gap-3"><h2 className="section-title text-xl">{title}</h2><span className="h-px flex-1 bg-[var(--line)]" /></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((simulation) => <SimulationCard key={simulation.slug} simulation={simulation} />)}</div></div>; }
