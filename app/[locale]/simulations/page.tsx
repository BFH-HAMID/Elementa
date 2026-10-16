import type { Metadata } from 'next';
import Link from 'next/link';
import { Atom, Beaker, Cpu, Sparkles, FlaskConical, Layers, ArrowRight } from 'lucide-react';
import { PhetSimulationCatalog } from '@/components/sim/PhetSimulationCatalog';
import { SimulationCard } from '@/components/sim/SimulationCard';
import { simulationMetas } from '@/lib/simulations';
import { allPracticalModels } from '@/engine/practicals';
import { allChemPracticalModels } from '@/engine/chemPracticals';
import { EXAMPLE_PROJECTS } from '@/components/circuit-lab/projects/examples';
import { ADVANCED_PROJECTS } from '@/components/circuit-lab/projects/catalog-advanced';
import { PARTS } from '@/components/circuit-lab/parts/registry';
import { physicsGuidedExperiments } from '@/lib/physicsData';
import { guidedExperiments } from '@/lib/labData';

type LabFilter = 'physics' | 'chemistry' | 'circuit';

export const metadata: Metadata = {
  title: 'Simulations - All Labs Unified',
  description: 'All lab simulations in one place: Physics practicals, Chemistry practicals, Circuit projects, custom sims and PhET HTML5 library. No duplicates, organized by lab.'
};

export default function SimulationsPage({ params, searchParams }: { params: { locale: string }, searchParams?: { subject?: string; lab?: string } }) {
  const locale = params.locale as 'bn' | 'en';
  const bn = locale === 'bn';
  const labFilter = (searchParams?.lab || searchParams?.subject) as LabFilter | undefined;

  const physicsCustom = simulationMetas.filter(s => s.subject === 'physics');
  const chemistryCustom = simulationMetas.filter(s => s.subject === 'chemistry');
  const physicsPracticals = allPracticalModels;
  const chemistryPracticals = allChemPracticalModels;
  const circuitProjects = [...EXAMPLE_PROJECTS, ...ADVANCED_PROJECTS];

  const showPhysics = !labFilter || labFilter === 'physics';
  const showChemistry = !labFilter || labFilter === 'chemistry';
  const showCircuit = !labFilter || labFilter === 'circuit';

  const totalCount = physicsCustom.length + chemistryCustom.length + physicsPracticals.length + chemistryPracticals.length + circuitProjects.length + 81;

  const physicsExpMap = new Map(physicsGuidedExperiments.map(e => [e.slug, e]));
  const chemistryExpMap = new Map(guidedExperiments.map(e => [e.slug, e]));

  return (
    <section className="page-shell section-space">
      <div className="mb-10 max-w-4xl">
        <p className="eyebrow">{bn ? 'Elementa · সব সিমুলেশন এক জায়গায়' : 'Elementa · All Simulations in One Place'}</p>
        <h1 className="display-title mt-3">
          {bn ? 'সিমুলেশন' : 'Simulations'} <span className="text-physics-600 dark:text-physics-200">/ {totalCount}+</span>
        </h1>
        <p className="mt-4 text-base leading-7 muted">
          {bn
            ? 'ফিজিক্স ল্যাব, কেমিস্ট্রি ল্যাব ও সার্কিট ল্যাবের সব সিমুলেশন একসাথে তালিকায় — কোনো ডুপ্লিকেট নেই। প্রতিটি ল্যাব আলাদা বিভাগে সাজানো।'
            : 'All lab simulations in one organized list — Physics Lab, Chemistry Lab and Circuit Lab, no duplicates. Each lab has its own separate section.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/${locale}/simulations`} className={`pill px-4 py-2 text-sm font-black transition ${!labFilter ? 'bg-physics-600 text-white' : 'bg-[var(--surface-soft)] hover:bg-physics-50'}`}>
            <Layers size={14} /> {bn ? `সব (${totalCount})` : `All (${totalCount})`}
          </Link>
          <Link href={`/${locale}/simulations?lab=physics`} className={`pill px-4 py-2 text-sm font-black transition ${labFilter === 'physics' ? 'bg-physics-600 text-white' : 'bg-physics-50 text-physics-800 hover:bg-physics-100 dark:bg-physics-900 dark:text-physics-100'}`}>
            <Atom size={14} /> {bn ? `ফিজিক্স (${physicsCustom.length + physicsPracticals.length})` : `Physics (${physicsCustom.length + physicsPracticals.length})`}
          </Link>
          <Link href={`/${locale}/simulations?lab=chemistry`} className={`pill px-4 py-2 text-sm font-black transition ${labFilter === 'chemistry' ? 'bg-chemistry-600 text-white' : 'bg-chemistry-50 text-chemistry-800 hover:bg-chemistry-100 dark:bg-chemistry-900 dark:text-chemistry-100'}`}>
            <Beaker size={14} /> {bn ? `কেমিস্ট্রি (${chemistryCustom.length + chemistryPracticals.length})` : `Chemistry (${chemistryCustom.length + chemistryPracticals.length})`}
          </Link>
          <Link href={`/${locale}/simulations?lab=circuit`} className={`pill px-4 py-2 text-sm font-black transition ${labFilter === 'circuit' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100'}`}>
            <Cpu size={14} /> {bn ? `সার্কিট (${circuitProjects.length})` : `Circuit (${circuitProjects.length})`}
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-physics-50 p-3 dark:bg-physics-900/30">
            <p className="text-xs font-bold text-physics-700 dark:text-physics-200 flex items-center gap-1"><Atom size={12} /> {bn ? 'ফিজিক্স ল্যাব' : 'Physics Lab'}</p>
            <p className="mt-1 text-[11px] muted">{bn ? `${physicsPracticals.length} প্র্যাকটিক্যাল + ${physicsCustom.length} কাস্টম` : `${physicsPracticals.length} practicals + ${physicsCustom.length} custom`}</p>
          </div>
          <div className="rounded-xl bg-chemistry-50 p-3 dark:bg-chemistry-900/30">
            <p className="text-xs font-bold text-chemistry-700 dark:text-chemistry-200 flex items-center gap-1"><Beaker size={12} /> {bn ? 'কেমিস্ট্রি ল্যাব' : 'Chemistry Lab'}</p>
            <p className="mt-1 text-[11px] muted">{bn ? `${chemistryPracticals.length} প্র্যাকটিক্যাল + ${chemistryCustom.length} কাস্টম` : `${chemistryPracticals.length} practicals + ${chemistryCustom.length} custom`}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Cpu size={12} /> {bn ? 'সার্কিট ল্যাব' : 'Circuit Lab'}</p>
            <p className="mt-1 text-[11px] muted">{bn ? `${PARTS.length} পার্টস, ${circuitProjects.length} প্রজেক্ট` : `${PARTS.length} parts, ${circuitProjects.length} projects`}</p>
          </div>
        </div>
      </div>

      {showPhysics && (
        <>
          <section id="physics-practicals" className="mb-12 scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-physics-600 text-white"><Atom size={18} /></span>
              <div>
                <h2 className="section-title text-xl">{bn ? 'ফিজিক্স ল্যাব প্র্যাকটিক্যাল সিমুলেশন' : 'Physics Lab - Practical Simulations'} <span className="text-sm font-normal muted">({physicsPracticals.length})</span></h2>
                <p className="text-xs muted">{bn ? 'মেকানিক্স, বিদ্যুৎ, আলোকবিজ্ঞান, তাপ, তরঙ্গ, আধুনিক' : 'Mechanics, electricity, optics, heat, waves, modern'}</p>
              </div>
              <span className="h-px flex-1 bg-[var(--line)]" />
              <Link href={`/${locale}/lab/physics`} className="text-xs font-black text-physics-600 flex items-center gap-1">{bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={12} /></Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {physicsPracticals.map((model: any) => {
                const exp = physicsExpMap.get(model.slug) as any;
                return (
                  <Link key={model.slug} href={`/${locale}/lab/physics?experiment=${model.slug}`} className="card card-hover p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="pill bg-physics-50 text-[10px] font-black text-physics-700 dark:bg-physics-900 dark:text-physics-100">{model.scene || 'physics'}</span>
                      <span className="text-[10px] muted">{exp?.level || ''}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold">{bn ? (exp?.title_bn || model.slug) : (exp?.title_en || model.slug)}</h3>
                    <p className="mt-1 line-clamp-2 text-xs muted">{bn ? (exp?.aim_bn || '') : (exp?.aim_en || '')}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-physics-600">{bn ? 'সিমুলেশন চালান' : 'Run simulation'} <ArrowRight size={12} /></span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section id="physics-custom" className="mb-12 scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100"><Sparkles size={18} /></span>
              <h2 className="section-title text-xl">{bn ? 'ফিজিক্স কাস্টম সিমুলেশন' : 'Physics - Custom Sims'} <span className="text-sm font-normal muted">({physicsCustom.length})</span></h2>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {physicsCustom.map((sim) => <SimulationCard key={sim.slug} simulation={sim} />)}
            </div>
          </section>
        </>
      )}

      {showChemistry && (
        <>
          <section id="chemistry-practicals" className="mb-12 scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-chemistry-600 text-white"><Beaker size={18} /></span>
              <div>
                <h2 className="section-title text-xl">{bn ? 'কেমিস্ট্রি ল্যাব প্র্যাকটিক্যাল সিমুলেশন' : 'Chemistry Lab - Practical Simulations'} <span className="text-sm font-normal muted">({chemistryPracticals.length})</span></h2>
                <p className="text-xs muted">{bn ? 'অ্যাসিড-বেস, গ্যাস, তাপ, তড়িৎ রসায়ন' : 'Acid-base, gases, thermal, electrochemistry'}</p>
              </div>
              <span className="h-px flex-1 bg-[var(--line)]" />
              <Link href={`/${locale}/lab/chemistry`} className="text-xs font-black text-chemistry-600 flex items-center gap-1">{bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={12} /></Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {chemistryPracticals.map((model: any) => {
                const exp = chemistryExpMap.get(model.slug) as any;
                return (
                  <Link key={model.slug} href={`/${locale}/lab/chemistry?experiment=${model.slug}`} className="card card-hover p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="pill bg-chemistry-50 text-[10px] font-black text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100">{model.domain || 'chemistry'}</span>
                      <span className="text-[10px] muted">{exp?.level || ''}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold">{bn ? (exp?.title_bn || model.slug) : (exp?.title_en || model.slug)}</h3>
                    <p className="mt-1 line-clamp-2 text-xs muted">{bn ? (exp?.aim_bn || '') : (exp?.aim_en || '')}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-chemistry-600">{bn ? 'সিমুলেশন চালান' : 'Run simulation'} <ArrowRight size={12} /></span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section id="chemistry-custom" className="mb-12 scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100"><FlaskConical size={18} /></span>
              <h2 className="section-title text-xl">{bn ? 'কেমিস্ট্রি কাস্টম সিমুলেশন' : 'Chemistry - Custom Sims'} <span className="text-sm font-normal muted">({chemistryCustom.length})</span></h2>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {chemistryCustom.map((sim) => <SimulationCard key={sim.slug} simulation={sim} />)}
            </div>
          </section>
        </>
      )}

      {showCircuit && (
        <section id="circuit-projects" className="mb-12 scroll-mt-24">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800 text-white"><Cpu size={18} /></span>
            <div>
              <h2 className="section-title text-xl">{bn ? 'সার্কিট ল্যাব প্রজেক্ট সিমুলেশন' : 'Circuit Lab - Project Simulations'} <span className="text-sm font-normal muted">({circuitProjects.length})</span></h2>
              <p className="text-xs muted">{bn ? `${PARTS.length} পার্টস, Arduino, সেন্সর, রোবটিক্স` : `${PARTS.length} parts, Arduino, sensors, robotics`}</p>
            </div>
            <span className="h-px flex-1 bg-[var(--line)]" />
            <Link href={`/${locale}/lab/circuit`} className="text-xs font-black text-slate-700 flex items-center gap-1 dark:text-slate-200">{bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={12} /></Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {circuitProjects.slice(0, 24).map((project) => (
              <Link key={project.id} href={`/${locale}/lab/circuit?project=${project.id}`} className="card card-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="pill bg-slate-100 text-[10px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">circuit</span>
                  <span className="text-[10px] muted">{project.difficulty}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold">{project.title[locale]}</h3>
                <p className="mt-1 line-clamp-2 text-xs muted">{project.summary[locale]}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-slate-700 dark:text-slate-200">{bn ? 'প্রজেক্ট খুলুন' : 'Open project'} <ArrowRight size={12} /></span>
              </Link>
            ))}
          </div>
          {circuitProjects.length > 24 && (
            <p className="mt-4 text-center text-xs muted">{bn ? `আরও ${circuitProjects.length - 24}টি প্রজেক্ট সার্কিট ল্যাবে` : `+${circuitProjects.length - 24} more projects in Circuit Lab`}</p>
          )}
        </section>
      )}

      <PhetSimulationCatalog initialSubject={labFilter === 'circuit' ? 'all' : (labFilter as any) ?? 'all'} />
    </section>
  );
}
