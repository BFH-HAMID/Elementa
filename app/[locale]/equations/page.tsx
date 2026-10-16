import type { Metadata } from 'next';
import Link from 'next/link';
import { Atom, Beaker, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { EquationLibrary } from '@/components/content/EquationLibrary';
import { getEquationEntries } from '@/lib/content';
import { topicGroups } from '@/lib/topics';

type SubjectFilter = 'physics' | 'chemistry';

export const metadata: Metadata = { title: 'Equations - Separate Lists', description: 'All physics and chemistry equations in separate organized lists by chapter and topic. No duplicates, clean system.' };

export default function EquationsPage({ params, searchParams }: { params: { locale: string }, searchParams?: { subject?: string } }) {
  const locale = params.locale as 'bn' | 'en';
  const bn = locale === 'bn';
  const initialSubject = searchParams?.subject === 'physics' || searchParams?.subject === 'chemistry'
    ? searchParams.subject as SubjectFilter
    : 'all';
  const equations = getEquationEntries();
  const physicsEquations = equations.filter(e => e.subject === 'physics');
  const chemistryEquations = equations.filter(e => e.subject === 'chemistry');

  const physicsChapters = Array.from(new Set(physicsEquations.map(e => locale === 'bn' ? e.chapter_bn ?? e.chapter : e.chapter))).sort();
  const chemistryChapters = Array.from(new Set(chemistryEquations.map(e => locale === 'bn' ? e.chapter_bn ?? e.chapter : e.chapter))).sort();

  return (
    <section className="page-shell section-space">
      <div className="mb-8 max-w-4xl">
        <p className="eyebrow">{bn ? 'Elementa · সব সমীকরণ আলাদা আলাদা' : 'Elementa · All Equations Separated'}</p>
        <h1 className="display-title mt-3">
          {bn ? 'সমীকরণ' : 'Equations'} <span className="text-physics-600 dark:text-physics-200">/ {equations.length}</span>
        </h1>
        <p className="mt-4 text-base leading-7 muted">
          {bn
            ? 'ফিজিক্স ও কেমিস্ট্রির সব সমীকরণ আলাদা আলাদা তালিকায় — অধ্যায় ও টপিক অনুযায়ী সাজানো, কোনো ডুপ্লিকেট নেই।'
            : 'All physics and chemistry equations in separate organized lists by chapter and topic — no duplicates, clean system.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/${locale}/equations`} className={`pill px-4 py-2 text-sm font-black ${initialSubject === 'all' ? 'bg-slate-800 text-white' : 'bg-[var(--surface-soft)]'}`}>
            <Layers size={14} /> {bn ? `সব (${equations.length})` : `All (${equations.length})`}
          </Link>
          <Link href={`/${locale}/equations?subject=physics`} className={`pill px-4 py-2 text-sm font-black ${initialSubject === 'physics' ? 'bg-physics-600 text-white' : 'bg-physics-50 text-physics-800 hover:bg-physics-100'}`}>
            <Atom size={14} /> {bn ? `ফিজিক্স (${physicsEquations.length})` : `Physics (${physicsEquations.length})`}
          </Link>
          <Link href={`/${locale}/equations?subject=chemistry`} className={`pill px-4 py-2 text-sm font-black ${initialSubject === 'chemistry' ? 'bg-chemistry-600 text-white' : 'bg-chemistry-50 text-chemistry-800 hover:bg-chemistry-100'}`}>
            <Beaker size={14} /> {bn ? `কেমিস্ট্রি (${chemistryEquations.length})` : `Chemistry (${chemistryEquations.length})`}
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-physics-200 bg-gradient-to-br from-physics-50 to-white p-4 dark:border-physics-800 dark:from-physics-950/30 dark:to-slate-900">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-physics-600 text-white"><Atom size={16} /></span>
              <h3 className="font-black">{bn ? 'ফিজিক্স সমীকরণ' : 'Physics Equations'}</h3>
              <span className="pill bg-physics-100 text-physics-800 text-xs">{physicsEquations.length}</span>
            </div>
            <p className="mt-2 text-xs muted">{bn ? `${physicsChapters.length}টি অধ্যায়ে সাজানো` : `Organized in ${physicsChapters.length} chapters`}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {physicsChapters.slice(0, 6).map(ch => (
                <span key={ch} className="pill bg-white text-[10px] dark:bg-black/20">{ch}</span>
              ))}
              {physicsChapters.length > 6 && <span className="pill bg-physics-100 text-[10px]">+{physicsChapters.length - 6}</span>}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-chemistry-200 bg-gradient-to-br from-chemistry-50 to-white p-4 dark:border-chemistry-800 dark:from-chemistry-950/30 dark:to-slate-900">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-chemistry-600 text-white"><Beaker size={16} /></span>
              <h3 className="font-black">{bn ? 'কেমিস্ট্রি সমীকরণ' : 'Chemistry Equations'}</h3>
              <span className="pill bg-chemistry-100 text-chemistry-800 text-xs">{chemistryEquations.length}</span>
            </div>
            <p className="mt-2 text-xs muted">{bn ? `${chemistryChapters.length}টি অধ্যায়ে সাজানো` : `Organized in ${chemistryChapters.length} chapters`}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {chemistryChapters.slice(0, 6).map(ch => (
                <span key={ch} className="pill bg-white text-[10px] dark:bg-black/20">{ch}</span>
              ))}
              {chemistryChapters.length > 6 && <span className="pill bg-chemistry-100 text-[10px]">+{chemistryChapters.length - 6}</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
          <div className="flex items-start gap-2">
            <BookOpen size={16} className="mt-0.5 shrink-0 text-physics-600" />
            <div>
              <p className="text-xs font-black">{bn ? 'আলাদা আলাদা তালিকা — কোনো ডুপ্লিকেট নেই' : 'Separate lists — no duplicates'}</p>
              <p className="mt-1 text-[11px] leading-4 muted">
                {bn
                  ? 'প্রতিটি সমীকরণের নিজস্ব অধ্যায়, টপিক ও লেভেল আছে। ফিজিক্স ও কেমিস্ট্রি আলাদা রঙে, আলাদা ফিল্টারে। নিচে সার্চ ও ফিল্টার দিয়ে খুঁজুন।'
                  : 'Each equation has its own chapter, topic and level. Physics and chemistry are in separate colors and filters. Use search and filters below.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-black">{bn ? 'সব সমীকরণ — আলাদা আলাদা তালিকা' : 'All Equations — Separate Lists'}</h2>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <EquationLibrary equations={equations} initialSubject={initialSubject} />
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-5 border-l-4 border-l-physics-500">
          <h3 className="font-bold flex items-center gap-2"><Atom size={18} className="text-physics-600" /> {bn ? 'ফিজিক্স অধ্যায় অনুযায়ী' : 'Physics by Chapter'}</h3>
          <ul className="mt-3 space-y-1.5">
            {physicsChapters.map(ch => {
              const count = physicsEquations.filter(e => (locale === 'bn' ? e.chapter_bn ?? e.chapter : e.chapter) === ch).length;
              return (
                <li key={ch} className="flex items-center justify-between text-sm">
                  <span className="muted">{ch}</span>
                  <span className="pill bg-physics-50 text-xs">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="card p-5 border-l-4 border-l-chemistry-500">
          <h3 className="font-bold flex items-center gap-2"><Beaker size={18} className="text-chemistry-600" /> {bn ? 'কেমিস্ট্রি অধ্যায় অনুযায়ী' : 'Chemistry by Chapter'}</h3>
          <ul className="mt-3 space-y-1.5">
            {chemistryChapters.map(ch => {
              const count = chemistryEquations.filter(e => (locale === 'bn' ? e.chapter_bn ?? e.chapter : e.chapter) === ch).length;
              return (
                <li key={ch} className="flex items-center justify-between text-sm">
                  <span className="muted">{ch}</span>
                  <span className="pill bg-chemistry-50 text-xs">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {topicGroups.slice(0, 6).map(group => (
          <div key={group.id} className="card p-3">
            <p className="text-xs font-black">{locale === 'bn' ? group.bn : group.en}</p>
            <p className="mt-1 text-[11px] muted">{group.id}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
