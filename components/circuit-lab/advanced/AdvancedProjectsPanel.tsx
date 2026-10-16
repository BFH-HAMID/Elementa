'use client';

/** Searchable catalogue, build procedure and linked mission scene. */
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BatteryCharging, Camera, ChevronRight, Compass, Navigation, Radio, Search, ShieldCheck, Ship, Truck, Plane } from 'lucide-react';
import { useCircuitStore } from '@/store/circuitStore';
import { useCircuitI18n } from '../lib/i18n';
import { ADVANCED_PROJECTS, type AdvancedProject, type VehicleKind } from '../projects/catalog-advanced';
import { getPart } from '../parts/registry';
import { MissionSimulator } from './MissionSimulator';
import { cn } from '@/lib/utils';

const FILTERS: { id: 'all' | VehicleKind; en: string; bn: string }[] = [
  { id: 'all', en: 'All builds', bn: 'সব বিল্ড' },
  { id: 'drone', en: 'Drones', bn: 'ড্রোন' },
  { id: 'rover', en: 'Cars & rovers', bn: 'কার ও রোভার' },
  { id: 'boat', en: 'Boats', bn: 'নৌকা' },
  { id: 'bench', en: 'Power bench', bn: 'পাওয়ার বেঞ্চ' }
];
const ICONS = { drone: Plane, rover: Truck, boat: Ship, bench: BatteryCharging } as const;
const FEATURE_ICONS = { gps: Navigation, camera: Camera, telemetry: Radio, sonar: Compass, barometer: Compass, gimbal: Camera, display: Compass, imu: Compass } as const;

export function AdvancedProjectsPanel() {
  const { locale } = useCircuitI18n();
  const bn = locale === 'bn';
  const active = useCircuitStore((s) => s.activeExampleId);
  const [filter, setFilter] = useState<'all' | VehicleKind>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(ADVANCED_PROJECTS[0].id);
  const [missionKey, setMissionKey] = useState(0);
  useEffect(() => {
    if (active && ADVANCED_PROJECTS.some((p) => p.id === active)) setSelectedId(active);
  }, [active]);
  const visible = useMemo(() => ADVANCED_PROJECTS.filter((p) =>
    (filter === 'all' || p.kind === filter) &&
    `${p.title.en} ${p.title.bn} ${p.summary.en} ${p.summary.bn} ${p.features.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())
  ), [filter, query]);
  const project = visible.find((p) => p.id === selectedId) ?? visible[0];
  const onOpen = (p: AdvancedProject) => {
    useCircuitStore.getState().loadExample(p.id);
    setSelectedId(p.id);
    setMissionKey((k) => k + 1);
  };
  return (
    <div className="space-y-5" lang={locale}>
      <header className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#102b3c] px-5 py-5 text-white">
        <div className="absolute -right-12 -top-20 h-44 w-44 rounded-full bg-cyan-400/20 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{bn ? 'এলিমেন্টা · অ্যাডভান্সড ল্যাব' : 'ELEMENTA · ADVANCED LAB'}</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">{bn ? 'ড্রোন, ক্যামেরা কার ও রোবটিক্স' : 'Drone, camera car & robotics studio'}</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">{bn
              ? 'তারসহ সার্কিট বেঞ্চে পাওয়ার ও মোটর পরীক্ষা করুন। পাশের শিক্ষামূলক মিশন মডেলে GPS, ব্যাটারি, বাধা ও লিংক হারানোর প্রভাব দেখুন। বাস্তব ফ্লাইট কন্ট্রোলার বা লাইভ ভিডিও নয়।'
              : 'Check power and motors on a wired circuit bench. Explore GPS, battery, obstacles and radio loss in a linked educational mission model. Not live video or real flight-controller firmware.'}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-2">
            <ShieldCheck className="h-5 w-5 text-cyan-300" aria-hidden /><span className="text-sm font-bold">{ADVANCED_PROJECTS.length} {bn ? 'নির্দেশনাসহ বিল্ড' : 'guided builds'}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(245px,310px)_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3" aria-label={bn ? 'প্রজেক্ট বেছে নিন' : 'Choose a project'}>
          <label className="relative block">
            <span className="sr-only">{bn ? 'প্রজেক্ট খুঁজুন' : 'Search projects'}</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder={bn ? 'প্রজেক্ট খুঁজুন…' : 'Search projects…'} className="input w-full pl-9 text-sm" />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={bn ? 'ধরন' : 'Filter by type'}>
            {FILTERS.map((f) => <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={cn('rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition', filter === f.id ? 'border-physics-500 bg-physics-50 text-physics-800 dark:bg-physics-900/40 dark:text-physics-100' : 'border-[color:var(--line)] text-[color:var(--muted)] hover:text-[color:var(--ink)]')}>{bn ? f.bn : f.en}</button>)}
          </div>
          <p className="text-xs text-[color:var(--muted)]">{bn ? `${visible.length}টি প্রজেক্ট` : `${visible.length} projects`}</p>
          <div className="max-h-[760px] space-y-1.5 overflow-y-auto pr-1">
            {visible.map((p) => {
              const Icon = ICONS[p.kind];
              return (
                <button key={p.id} type="button" aria-current={project?.id === p.id ? 'true' : undefined} onClick={() => setSelectedId(p.id)} className={cn('flex w-full items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition', project?.id === p.id ? 'border-physics-400 bg-physics-50/80 dark:bg-physics-900/30' : 'border-[color:var(--line)] bg-[color:var(--surface)] hover:border-physics-300')}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--surface-soft)] text-[color:var(--brand)]"><Icon className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">{String(ADVANCED_PROJECTS.indexOf(p) + 1).padStart(2, '0')} · {bn ? FILTERS.find((f) => f.id === p.kind)?.bn : FILTERS.find((f) => f.id === p.kind)?.en}</span>
                    <span className="block text-sm font-semibold leading-5 text-[color:var(--ink)]">{bn ? p.title.bn : p.title.en}</span>
                    {active === p.id ? <span className="mt-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">{bn ? 'বেঞ্চে খোলা' : 'On bench'}</span> : null}
                  </span>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[color:var(--muted)]" aria-hidden />
                </button>
              );
            })}
            {visible.length === 0 ? <p className="rounded-xl border border-dashed border-[color:var(--line)] p-4 text-sm muted">{bn ? 'এমন প্রজেক্ট নেই।' : 'No matching projects.'}</p> : null}
          </div>
        </aside>

        {project ? (
          <article key={project.id} className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">{bn ? 'অ্যাডভান্সড বিল্ড' : 'ADVANCED BUILD'} · {String(ADVANCED_PROJECTS.indexOf(project) + 1).padStart(2, '0')}</p>
                  <h3 className="mt-1 text-lg font-bold text-[color:var(--ink)] sm:text-xl">{bn ? project.title.bn : project.title.en}</h3>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-[color:var(--muted)]">{bn ? project.summary.bn : project.summary.en}</p>
                </div>
                <button type="button" onClick={() => onOpen(project)} className="btn btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold">
                  {active === project.id ? bn ? 'বিল্ড পুনরায় খুলুন' : 'Reload wired build' : bn ? 'তারসহ বেঞ্চে খুলুন' : 'Open wired build'} <ArrowUpRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="pill text-[11px]">{project.components.length} {bn ? 'যন্ত্রাংশ' : 'parts'} · {project.wires.length} {bn ? 'তার' : 'wires'}</span>
                {project.features.map((feature) => {
                  const Icon = FEATURE_ICONS[feature];
                  return <span key={feature} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2 py-1 text-[11px] text-[color:var(--muted)]"><Icon className="h-3 w-3" aria-hidden />{feature.toUpperCase()}</span>;
                })}
              </div>
            </section>

            <MissionSimulator key={`${project.id}:${missionKey}`} project={project} active={active === project.id} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,.8fr)]">
              <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">{bn ? 'তৈরির পদ্ধতি' : 'MAKING PROCEDURE'}</p>
                <h4 className="mt-1 text-base font-bold text-[color:var(--ink)]">{bn ? 'ধাপে ধাপে বানান ও যাচাই করুন' : 'Build & verify, step by step'}</h4>
                <ol className="mt-4 space-y-3">
                  {project.steps.map((s, i) => <li key={i} className="flex items-start gap-3 text-sm leading-6 text-[color:var(--ink)]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-physics-50 font-mono text-[11px] font-bold text-physics-700 dark:bg-physics-900/40 dark:text-physics-200">{i + 1}</span><span>{bn ? s.bn : s.en}</span></li>)}
                </ol>
                <div className="mt-4 rounded-xl bg-[color:var(--surface-soft)] p-3 text-sm leading-6 text-[color:var(--muted)]"><strong className="text-[color:var(--ink)]">{bn ? 'কীভাবে কাজ করে · ' : 'How it works · '}</strong>{bn ? project.explanation.bn : project.explanation.en}</div>
              </section>
              <div className="space-y-4">
                <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950/25 dark:text-amber-100">
                  <h4 className="text-sm font-bold">{bn ? '⚠ নিরাপত্তা আগে' : '⚠ Safety first'}</h4>
                  <p className="mt-2 text-xs leading-5">{bn ? project.safety.bn : project.safety.en}</p>
                </section>
                <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                  <h4 className="text-sm font-bold text-[color:var(--ink)]">{bn ? 'প্রত্যাশিত পর্যবেক্ষণ' : 'Expected observation'}</h4>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{bn ? project.expected.bn : project.expected.en}</p>
                </section>
                <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                  <h4 className="text-sm font-bold text-[color:var(--ink)]">{bn ? 'যন্ত্রাংশ তালিকা' : 'Parts checklist'}</h4>
                  <ul className="mt-2 max-h-52 space-y-1 overflow-auto text-xs text-[color:var(--muted)]">
                    {[...new Set(project.components.map((c) => c.partId))].map((id) => <li key={id} className="flex justify-between gap-2 border-b border-[color:var(--line)] py-1"><span>{getPart(id)?.name ?? id}</span><span className="shrink-0 font-mono">×{project.components.filter((c) => c.partId === id).length}</span></li>)}
                  </ul>
                </section>
              </div>
            </div>
            <details className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm">
              <summary className="cursor-pointer font-semibold text-[color:var(--ink)]">{bn ? `প্রয়োজনীয় কানেকশন · ${project.essentialWires.length}` : `Required harness connections · ${project.essentialWires.length}`}</summary>
              <p className="mt-2 text-xs text-[color:var(--muted)]">{bn ? 'এগুলো ট্রেনিং কানেক্টর; বাস্তব বোর্ডের প্যাড বিন্যাস ডেটাশিটে মিলিয়ে নিন।' : 'These are training connectors. Verify the actual board pad order against its datasheet.'}</p>
              <ul className="mt-2 grid max-h-64 gap-1 overflow-auto font-mono text-xs text-[color:var(--muted)] sm:grid-cols-2">
                {project.essentialWires.map((w, i) => <li key={`${w.from}:${i}`} className="rounded-lg bg-[color:var(--surface-soft)] px-2 py-1.5">{w.from} → {w.to}</li>)}
              </ul>
            </details>
          </article>
        ) : null}
      </div>
    </div>
  );
}
