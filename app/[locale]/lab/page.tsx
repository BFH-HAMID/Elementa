import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Atom, Beaker, Cpu, FlaskConical, Sparkles, BookOpen, ArrowRight, Layers, Wrench } from 'lucide-react';
import { isLocale } from '@/i18n/routing';
import { physicsDatasetStats } from '@/lib/physicsData';
import { datasetStats } from '@/lib/labData';
import { PARTS } from '@/components/circuit-lab/parts/registry';
import { EXAMPLE_PROJECTS } from '@/components/circuit-lab/projects/examples';
import { ADVANCED_PROJECTS } from '@/components/circuit-lab/projects/catalog-advanced';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const title = locale === 'bn' ? 'ল্যাবসমূহ - আলাদা আলাদা ল্যাব' : 'Labs - Separate & Organized';
  const description = locale === 'bn' ? 'ফিজিক্স ল্যাব, কেমিস্ট্রি ল্যাব ও সার্কিট ল্যাব আলাদা আলাদা — কোনো ডুপ্লিকেট নেই।' : 'Physics Lab, Chemistry Lab and Circuit Lab are separate with no duplicates.';
  return { title, description, alternates: { canonical: '/lab' } };
}

export default function LabHubPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const bn = locale === 'bn';

  const labs = [
    {
      id: 'physics',
      href: `/${locale}/lab/physics`,
      icon: Atom,
      color: 'physics' as const,
      title: bn ? 'ফিজিক্স ল্যাব' : 'Physics Lab',
      subtitle: bn ? 'পদার্থবিজ্ঞান' : 'Physics',
      description: bn ? 'মেকানিক্স, তাপ, বিদ্যুৎ, আলোকবিজ্ঞান, তরঙ্গ ও আধুনিক পদার্থবিজ্ঞানের যন্ত্রপাতি ও প্র্যাকটিক্যাল।' : 'Mechanics, heat, electricity, optics, waves and modern physics equipment and practicals.',
      stats: [
        { value: physicsDatasetStats.equipment, label: bn ? 'যন্ত্রপাতি' : 'Equipment' },
        { value: physicsDatasetStats.experiments, label: bn ? 'পরীক্ষা' : 'Experiments' },
        { value: physicsDatasetStats.categories, label: bn ? 'বিভাগ' : 'Categories' },
      ],
      features: bn ? ['বেঞ্চে যন্ত্র বসানো', '৪৬টি প্র্যাকটিক্যাল সিমুলেশন', 'গ্রাফ ও ডেটা টেবিল'] : ['Place instruments on bench', '46 practical simulations', 'Graphs & data tables'],
      gradient: 'from-physics-50 via-white to-sky-50 dark:from-physics-950/50 dark:via-slate-900 dark:to-slate-900',
      border: 'border-physics-200 dark:border-physics-800',
      btn: 'bg-physics-600 hover:bg-physics-700',
    },
    {
      id: 'chemistry',
      href: `/${locale}/lab/chemistry`,
      icon: Beaker,
      color: 'chemistry' as const,
      title: bn ? 'কেমিস্ট্রি ল্যাব' : 'Chemistry Lab',
      subtitle: bn ? 'রসায়ন' : 'Chemistry',
      description: bn ? 'বিকার, টেস্টটিউব, ব্যুরেট, রাসায়নিক বিক্রিয়া ও টাইট্রেশন প্র্যাকটিক্যাল।' : 'Beakers, test tubes, burettes, chemical reactions and titration practicals.',
      stats: [
        { value: datasetStats.shelfChemicals, label: bn ? 'রাসায়নিক' : 'Chemicals' },
        { value: datasetStats.apparatus, label: bn ? 'যন্ত্রপাতি' : 'Apparatus' },
        { value: datasetStats.experiments, label: bn ? 'পরীক্ষা' : 'Experiments' },
      ],
      features: bn ? ['ড্র্যাগ-ড্রপ বেঞ্চ', '৭২টি প্র্যাকটিক্যাল সিমুলেশন', 'pH ও গ্যাস সূত্র'] : ['Drag-drop bench', '72 practical simulations', 'pH & gas laws'],
      gradient: 'from-chemistry-50 via-white to-amber-50 dark:from-chemistry-950/50 dark:via-slate-900 dark:to-slate-900',
      border: 'border-chemistry-200 dark:border-chemistry-800',
      btn: 'bg-chemistry-600 hover:bg-chemistry-700',
    },
    {
      id: 'circuit',
      href: `/${locale}/lab/circuit`,
      icon: Cpu,
      color: 'circuit' as const,
      title: bn ? 'সার্কিট ল্যাব' : 'Circuit Lab',
      subtitle: bn ? 'ইলেকট্রনিক্স ও রোবটিক্স' : 'Electronics & Robotics',
      description: bn ? 'সার্কিট তৈরি, Arduino, সেন্সর, মোটর ও ২০টি রোবটিক্স প্রজেক্ট সিমুলেশন।' : 'Build circuits, Arduino, sensors, motors and 20 robotics project simulations.',
      stats: [
        { value: PARTS.length, label: bn ? 'পার্টস' : 'Parts' },
        { value: EXAMPLE_PROJECTS.length + ADVANCED_PROJECTS.length, label: bn ? 'প্রজেক্ট' : 'Projects' },
        { value: 'Web Worker', label: bn ? 'সিমুলেশন' : 'Simulation' },
      ],
      features: bn ? ['SVG বেঞ্চ', 'DC ও ট্রানজিয়েন্ট সলভার', 'ড্রোন ও রোবট'] : ['SVG bench', 'DC & transient solver', 'Drones & robots'],
      gradient: 'from-slate-50 via-white to-physics-50 dark:from-slate-900 dark:via-slate-900 dark:to-physics-950/30',
      border: 'border-slate-200 dark:border-slate-700',
      btn: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600',
    },
  ];

  return (
    <section className="page-shell section-space">
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow">{bn ? 'Elementa · ল্যাব হাব' : 'Elementa · Lab Hub'}</p>
        <h1 className="display-title mt-3">
          {bn ? 'ল্যাবসমূহ' : 'Laboratories'} <span className="text-physics-600 dark:text-physics-200">/ Labs</span>
        </h1>
        <p className="mt-4 text-base leading-7 muted">
          {bn ? 'প্রতিটি ল্যাব আলাদা — কোনো ডুপ্লিকেট নেই। ফিজিক্স, কেমিস্ট্রি ও সার্কিট ল্যাব নিজস্ব যন্ত্রপাতি, সিমুলেশন ও প্র্যাকটিক্যাল নিয়ে সাজানো।' : 'Each lab is separate with no duplicates. Physics, Chemistry and Circuit labs have their own equipment, simulations and practicals, organized cleanly.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill bg-physics-100 text-physics-800 dark:bg-physics-900 dark:text-physics-100"><Atom size={12} /> {bn ? 'ফিজিক্স আলাদা' : 'Physics separate'}</span>
          <span className="pill bg-chemistry-100 text-chemistry-800 dark:bg-chemistry-900 dark:text-chemistry-100"><Beaker size={12} /> {bn ? 'কেমিস্ট্রি আলাদা' : 'Chemistry separate'}</span>
          <span className="pill bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"><Cpu size={12} /> {bn ? 'সার্কিট আলাদা' : 'Circuit separate'}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {labs.map((lab) => {
          const Icon = lab.icon;
          return (
            <Link key={lab.id} href={lab.href} className="group block h-full">
              <div className={`card-hover flex h-full flex-col overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-6 ${lab.gradient} ${lab.border}`}>
                <div className="flex items-start justify-between">
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl text-white shadow-sm ${lab.btn}`}>
                    <Icon size={26} />
                  </span>
                  <span className="pill bg-white/80 text-xs font-black dark:bg-black/20">{lab.subtitle}</span>
                </div>
                <h2 className="mt-5 text-xl font-black">{lab.title}</h2>
                <p className="mt-2 text-sm leading-6 muted">{lab.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {lab.stats.map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/70 p-2 text-center dark:bg-black/20">
                      <p className="font-mono text-lg font-black">{s.value}</p>
                      <p className="text-[10px] font-bold muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                <ul className="mt-4 space-y-1.5">
                  {lab.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs font-semibold muted">
                      <span className="h-1 w-1 rounded-full bg-current" /> {f}
                    </li>
                  ))}
                </ul>

                <span className={`mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black transition group-hover:gap-3 ${lab.id === 'physics' ? 'text-physics-700 dark:text-physics-200' : lab.id === 'chemistry' ? 'text-chemistry-700 dark:text-chemistry-200' : 'text-slate-700 dark:text-slate-200'}`}>
                  {bn ? 'ল্যাবে যান' : 'Open Lab'} <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-physics-600" />
            <h3 className="font-bold">{bn ? 'সিমুলেশন হাব' : 'Simulation Hub'}</h3>
          </div>
          <p className="mt-2 text-sm muted">{bn ? 'সব ল্যাবের সিমুলেশন এক জায়গায় — ফিজিক্স, কেমিস্ট্রি, সার্কিট ও PhET।' : 'All lab simulations in one place — Physics, Chemistry, Circuit & PhET.'}</p>
          <Link href={`/${locale}/simulations`} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-physics-600 dark:text-physics-200">
            {bn ? 'সব সিমুলেশন দেখুন' : 'View all simulations'} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-chemistry-600" />
            <h3 className="font-bold">{bn ? 'সমীকরণ লাইব্রেরি' : 'Equation Library'}</h3>
          </div>
          <p className="mt-2 text-sm muted">{bn ? 'ফিজিক্স ও কেমিস্ট্রির সব সমীকরণ আলাদা আলাদা তালিকায়।' : 'All physics and chemistry equations in separate organized lists.'}</p>
          <Link href={`/${locale}/equations`} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-chemistry-600 dark:text-chemistry-200">
            {bn ? 'সব সমীকরণ দেখুন' : 'View all equations'} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-amber-600" />
            <h3 className="font-bold">{bn ? 'পরীক্ষা গাইড' : 'Experiment Guides'}</h3>
          </div>
          <p className="mt-2 text-sm muted">{bn ? 'প্রতিটি ল্যাবের প্র্যাকটিক্যাল গাইড আলাদা বিভাগে।' : 'Each lab’s practical guides in separate sections.'}</p>
          <Link href={`/${locale}/experiments`} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-amber-700 dark:text-amber-200">
            {bn ? 'সব পরীক্ষা দেখুন' : 'View all experiments'} <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
        <div className="flex items-start gap-3">
          <Layers size={18} className="mt-0.5 shrink-0 text-physics-600" />
          <div>
            <h4 className="text-sm font-black">{bn ? 'কোনো ডুপ্লিকেট নেই — সিস্টেম পরিষ্কার' : 'No duplicates — clean system'}</h4>
            <p className="mt-1 text-xs leading-5 muted">
              {bn
                ? 'প্রতিটি ল্যাবের নিজস্ব রুট: /lab/physics, /lab/chemistry, /lab/circuit। সিমুলেশন পেজে সব ল্যাবের সিমুলেশন একসাথে তালিকায়, সমীকরণ পেজে ফিজিক্স ও কেমিস্ট্রি আলাদা আলাদা তালিকায়।'
                : 'Each lab has its own route: /lab/physics, /lab/chemistry, /lab/circuit. Simulations page lists all labs together, equations page separates physics and chemistry into distinct lists.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
