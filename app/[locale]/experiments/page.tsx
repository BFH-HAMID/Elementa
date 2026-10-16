import type { Metadata } from 'next';
import Link from 'next/link';
import { Atom, Beaker, Cpu, FlaskConical, ArrowRight, Layers } from 'lucide-react';
import { ExperimentCard } from '@/components/content/ExperimentCard';
import { PracticalCatalog } from '@/components/content/PracticalCatalog';
import { getExperimentEntries } from '@/lib/content';
import { physicsGuidedExperiments } from '@/lib/physicsData';
import { guidedExperiments } from '@/lib/labData';
import { allPracticalModels } from '@/engine/practicals';
import { allChemPracticalModels } from '@/engine/chemPracticals';

type SubjectFilter = 'physics' | 'chemistry';

export const metadata: Metadata = {
  title: 'Experiments - Separate Labs',
  description: 'Physics, Chemistry and Circuit experiments in separate organized lists. No duplicates, clean system.'
};

export default function ExperimentsPage({ params, searchParams }: { params: { locale: string }, searchParams?: { subject?: string } }) {
  const locale = params.locale as 'bn' | 'en';
  const bn = locale === 'bn';
  const selectedSubject = searchParams?.subject === 'physics' || searchParams?.subject === 'chemistry'
    ? searchParams.subject as SubjectFilter
    : undefined;
  const experiments = getExperimentEntries().filter((experiment) => !selectedSubject || experiment.subject === selectedSubject);

  const physicsExperiments = getExperimentEntries().filter(e => e.subject === 'physics');
  const chemistryExperiments = getExperimentEntries().filter(e => e.subject === 'chemistry');

  return (
    <section className="page-shell section-space">
      <div className="max-w-4xl">
        <p className="eyebrow">{bn ? 'Elementa · সব পরীক্ষা আলাদা আলাদা' : 'Elementa · All Experiments Separated'}</p>
        <h1 className="display-title mt-3">
          {bn ? 'পরীক্ষা' : 'Experiments'} <span className="text-chemistry-600 dark:text-chemistry-200">/ {physicsGuidedExperiments.length + guidedExperiments.length + experiments.length}</span>
        </h1>
        <p className="mt-4 text-base leading-7 muted">
          {bn
            ? 'ফিজিক্স ল্যাব, কেমিস্ট্রি ল্যাব ও সার্কিট ল্যাবের সব পরীক্ষা আলাদা আলাদা তালিকায় — কোনো ডুপ্লিকেট নেই।'
            : 'All Physics, Chemistry and Circuit experiments in separate organized lists — no duplicates, clean system.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/${locale}/experiments`} className={`pill px-4 py-2 text-sm font-black ${!selectedSubject ? 'bg-slate-800 text-white' : 'bg-[var(--surface-soft)]'}`}>
            <Layers size={14} /> {bn ? 'সব' : 'All'}
          </Link>
          <Link href={`/${locale}/experiments?subject=physics`} className={`pill px-4 py-2 text-sm font-black ${selectedSubject === 'physics' ? 'bg-physics-600 text-white' : 'bg-physics-50 text-physics-800'}`}>
            <Atom size={14} /> {bn ? `ফিজিক্স (${physicsGuidedExperiments.length + physicsExperiments.length})` : `Physics (${physicsGuidedExperiments.length + physicsExperiments.length})`}
          </Link>
          <Link href={`/${locale}/experiments?subject=chemistry`} className={`pill px-4 py-2 text-sm font-black ${selectedSubject === 'chemistry' ? 'bg-chemistry-600 text-white' : 'bg-chemistry-50 text-chemistry-800'}`}>
            <Beaker size={14} /> {bn ? `কেমিস্ট্রি (${guidedExperiments.length + chemistryExperiments.length})` : `Chemistry (${guidedExperiments.length + chemistryExperiments.length})`}
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-physics-50 p-3 dark:bg-physics-900/20">
            <p className="text-xs font-bold text-physics-700 flex items-center gap-1"><Atom size={12} /> {bn ? 'ফিজিক্স ল্যাব' : 'Physics Lab'}</p>
            <p className="mt-1 text-[11px] muted">{bn ? `${allPracticalModels.length} প্র্যাকটিক্যাল সিম` : `${allPracticalModels.length} practical sims`} · {physicsGuidedExperiments.length} guides</p>
            <Link href={`/${locale}/lab/physics`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-physics-600">{bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={10} /></Link>
          </div>
          <div className="rounded-xl bg-chemistry-50 p-3 dark:bg-chemistry-900/20">
            <p className="text-xs font-bold text-chemistry-700 flex items-center gap-1"><Beaker size={12} /> {bn ? 'কেমিস্ট্রি ল্যাব' : 'Chemistry Lab'}</p>
            <p className="mt-1 text-[11px] muted">{bn ? `${allChemPracticalModels.length} প্র্যাকটিক্যাল সিম` : `${allChemPracticalModels.length} practical sims`} · {guidedExperiments.length} guides</p>
            <Link href={`/${locale}/lab/chemistry`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-chemistry-600">{bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={10} /></Link>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><Cpu size={12} /> {bn ? 'সার্কিট ল্যাব' : 'Circuit Lab'}</p>
            <p className="mt-1 text-[11px] muted">{bn ? '২০+ রোবটিক্স প্রজেক্ট' : '20+ robotics projects'}</p>
            <Link href={`/${locale}/lab/circuit`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-slate-700">{bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={10} /></Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-physics-600 text-white"><Atom size={18} /></span>
          <h2 className="section-title text-xl">{bn ? 'ফিজিক্স প্র্যাকটিক্যাল টপিক' : 'Physics Practical Topics'}</h2>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <PracticalCatalog initialSubject={selectedSubject === 'chemistry' ? 'all' : 'physics'} />
      </div>

      <div className="mt-16">
        <div className="mb-6 max-w-3xl">
          <p className="eyebrow">{bn ? 'বিস্তারিত গাইড — আলাদা তালিকা' : 'Detailed guides — separate lists'}</p>
          <h2 className="section-title mt-2">{bn ? 'বিস্তারিত ব্যবহারিক নির্দেশিকা' : 'Detailed practical guides'}</h2>
          <p className="mt-2 text-sm leading-6 muted">
            {bn ? 'প্রতিটি গাইডে উদ্দেশ্য, তত্ত্ব, যন্ত্রপাতি, পদ্ধতি, পর্যবেক্ষণ, হিসাব, সতর্কতা ও ভাইভা আছে — ফিজিক্স ও কেমিস্ট্রি আলাদা।' : 'Each guide includes aim, theory, apparatus, procedure, observation, calculation, precautions and viva — physics and chemistry separated.'}
          </p>
        </div>

        {(!selectedSubject || selectedSubject === 'physics') && physicsExperiments.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="pill bg-physics-100 text-physics-800"><Atom size={12} /> {bn ? 'ফিজিক্স' : 'Physics'} · {physicsExperiments.length}</span>
              <span className="h-px flex-1 bg-physics-200" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {physicsExperiments.map((experiment) => <ExperimentCard key={experiment.slug} experiment={experiment} />)}
            </div>
          </div>
        )}

        {(!selectedSubject || selectedSubject === 'chemistry') && chemistryExperiments.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="pill bg-chemistry-100 text-chemistry-800"><Beaker size={12} /> {bn ? 'কেমিস্ট্রি' : 'Chemistry'} · {chemistryExperiments.length}</span>
              <span className="h-px flex-1 bg-chemistry-200" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {chemistryExperiments.map((experiment) => <ExperimentCard key={experiment.slug} experiment={experiment} />)}
            </div>
          </div>
        )}

        {experiments.length === 0 && (
          <p className="card p-6 text-sm muted">{bn ? 'এই বিষয়ে কোনো গাইড নেই।' : 'No guides for this subject yet.'}</p>
        )}
      </div>
    </section>
  );
}
