'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { EquipmentShelf } from './EquipmentShelf';
import { Workbench } from './Workbench';
import { ObservationPanel } from './ObservationPanel';
import { GraphPanel } from './GraphPanel';
import { DataTable } from './DataTable';
import { Atom, Layout, TrendingUp, Table, BookOpen, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhysicsLab() {
  const { isBangla, t } = usePhysicsI18n();
  const searchParams = useSearchParams();
  const activeTab = usePhysicsStore((s) => s.activeTab);
  const setActiveTab = usePhysicsStore((s) => s.setActiveTab);
  const loadExperiment = usePhysicsStore((s) => s.loadExperiment);
  const activeExperimentSlug = usePhysicsStore((s) => s.activeExperimentSlug);

  // Load experiment from query parameter `?experiment=ohms-law`
  const requestedExp = searchParams.get('experiment');
  useEffect(() => {
    if (requestedExp && requestedExp !== activeExperimentSlug) {
      loadExperiment(requestedExp);
    }
  }, [requestedExp, activeExperimentSlug, loadExperiment]);

  return (
    <div className="mx-auto w-full max-w-[1720px] space-y-4 px-3 pb-16 pt-4 sm:px-5 lg:px-6">
      {/* Brand Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-physics-600 text-white shadow-sm">
            <Atom size={26} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[var(--ink)] sm:text-2xl">
                {t('brand.title')}
              </h1>
              <span className="rounded-full bg-physics-500/10 px-2.5 py-0.5 text-[11px] font-black text-physics-600 dark:text-physics-300">
                {t('brand.badge')}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--muted)] max-w-2xl">
              {t('brand.tagline')}
            </p>
          </div>
        </div>

        {/* Global Tab Switcher (Workbench / Graph / Data Table / Theory / Quiz) */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('workbench')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'workbench'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <Layout size={14} />
            {isBangla ? 'ওয়ার্কবেঞ্চ' : 'Workbench'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'graph'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <TrendingUp size={14} />
            {isBangla ? 'লাইভ গ্রাফ' : 'Live Graph'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'table'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <Table size={14} />
            {isBangla ? 'ডেটা সারণি' : 'Data Table'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition 2xl:hidden',
              activeTab === 'theory'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <BookOpen size={14} />
            {isBangla ? 'তত্ত্ব' : 'Guide'}
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Grid */}
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* Left Column: Equipment Shelf */}
        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <EquipmentShelf />
        </div>

        {/* Center Column: Active Main Tab (Workbench / Graph / Table) */}
        <div className="min-w-0">
          {activeTab === 'workbench' && <Workbench />}
          {activeTab === 'graph' && <GraphPanel />}
          {activeTab === 'table' && <DataTable />}
          {activeTab === 'theory' && <ObservationPanel />}
          {/* Below 2xl there is no right column, so the guide sits under the bench. */}
          {activeTab === 'workbench' && (
            <div className="mt-4 2xl:hidden">
              <ObservationPanel />
            </div>
          )}
        </div>

        {/* Right Column: Observation Notebook & Guide */}
        <div className="hidden min-w-0 2xl:block">
          <ObservationPanel />
        </div>
      </div>
    </div>
  );
}
