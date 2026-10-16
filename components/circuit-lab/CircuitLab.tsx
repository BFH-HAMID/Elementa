'use client';

/**
 * Circuit Lab root: composes the palette, bench, inspector, toolbar and bottom
 * panel; starts the simulation worker; reads shared projects from `?circuit=`.
 * Loaded lazily from the route (next/dynamic, ssr: false) so the heavy bundle
 * stays out of the initial page load.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCircuitStore, decodeShared } from '@/store/circuitStore';
import { useSimEngine } from './simulator/useSimEngine';
import { useCircuitShortcuts } from './lib/shortcuts';
import { useCircuitI18n } from './lib/i18n';
import { BenchCanvas } from './canvas/BenchCanvas';
import { PartPalette } from './palette/PartPalette';
import { Inspector } from './inspector/Inspector';
import { Toolbar } from './toolbar/Toolbar';
import { BottomPanel } from './panels/BottomPanel';
import { SchematicView, SCHEMATIC_SVG_ID } from './schematic/SchematicView';
import { SHARE_PARAM } from './lib/exporters';
import { cn } from '@/lib/utils';
import { Plane, ArrowRight, CircuitBoard } from 'lucide-react';
import { ADVANCED_PROJECTS } from './projects/catalog-advanced';

const SVG_ID = 'circuit-bench-svg';

export default function CircuitLab() {
  const { t, shortcuts, locale } = useCircuitI18n();
  const frame = useCircuitStore((s) => s.frame);
  const running = useCircuitStore((s) => s.running);
  const simErrors = useCircuitStore((s) => s.simErrors);
  const components = useCircuitStore((s) => s.components.length);
  const [mobilePanel, setMobilePanel] = useState<'parts' | 'inspect' | null>(null);
  const fitRef = useRef<() => void>(() => undefined);
  const onFit = useCallback((api: { fit: () => void }) => {
    fitRef.current = api.fit;
  }, []);
  const help = useCircuitStore((s) => s.showHelp);
  const view = useCircuitStore((s) => s.view);
  const activeExampleId = useCircuitStore((s) => s.activeExampleId);
  const fitActive = useCallback(() => {
    if (useCircuitStore.getState().view === 'schematic') useCircuitStore.getState().setSchematicZoom(null);
    else fitRef.current();
  }, []);

  useSimEngine();
  useCircuitShortcuts(fitActive);

  // Shared project link: ?circuit=<base64url JSON>.
  const params = useSearchParams();
  useEffect(() => {
    const encoded = params.get(SHARE_PARAM);
    if (!encoded) return;
    const project = decodeShared(encoded);
    if (project) useCircuitStore.getState().loadProject(project, null);
    // Only on first mount for this URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refit after a preset loads so large flight stacks are visible at once.
  useEffect(() => {
    const id = window.setTimeout(() => fitRef.current(), 120);
    return () => window.clearTimeout(id);
  }, [activeExampleId]);

  const shortStatus = frame?.isShortCircuit ? t('shortCircuit') : frame && !running && components > 0 && frame.isOpenCircuit ? t('openCircuit') : null;
  const problem = simErrors.find((e) => e.toLowerCase().includes('overcurrent') || e.toLowerCase().includes('burnt') || e.toLowerCase().includes('overheat'));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Toolbar svgId={view === 'schematic' ? SCHEMATIC_SVG_ID : SVG_ID} onFit={fitActive} />
        {shortStatus ? (
          <p role="alert" className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:bg-orange-900/20 dark:text-orange-100">
            {shortStatus}
          </p>
        ) : null}
        {problem ? (
          <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-[color:var(--ink)] dark:bg-amber-900/20">
            {problem}
          </p>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#102635] p-4 text-white shadow-lg sm:p-5">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-2.5 text-cyan-200"><Plane className="h-6 w-6" aria-hidden /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{locale === 'bn' ? `নতুন · ${ADVANCED_PROJECTS.length}টি প্রজেক্ট` : `NEW · ${ADVANCED_PROJECTS.length} GUIDED PROJECTS`}</p>
              <h2 className="mt-1 text-lg font-bold">{t('advanced')}</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
{locale === 'en'
                  ? 'F4, ESC, PDB, GPS, RC, FPV and telemetry boards. Open a wired build, follow the bilingual guide and test power, motion, battery and link loss.'
                  : 'F4, ESC, PDB, GPS, RC, FPV ও টেলিমেট্রি বোর্ড। তারসহ বিল্ড খুলে গাইড অনুযায়ী পাওয়ার, চলাচল, ব্যাটারি ও লিংক হারানোর প্রভাব দেখুন।'}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => {
            useCircuitStore.getState().setBottomTab('advanced');
            window.requestAnimationFrame(() => document.getElementById('circuit-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
          }} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
            <CircuitBoard className="h-4 w-4" aria-hidden /> {locale === 'en' ? 'Explore projects' : 'প্রজেক্টগুলো দেখুন'} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex gap-2 lg:hidden">
        <button type="button" className={cn('btn px-3 py-1.5 text-xs', mobilePanel === 'parts' ? 'btn-primary' : 'btn-secondary')} aria-pressed={mobilePanel === 'parts'} onClick={() => setMobilePanel(mobilePanel === 'parts' ? null : 'parts')}>
          {t('library')}
        </button>
        <button type="button" className={cn('btn px-3 py-1.5 text-xs', mobilePanel === 'inspect' ? 'btn-primary' : 'btn-secondary')} aria-pressed={mobilePanel === 'inspect'} onClick={() => setMobilePanel(mobilePanel === 'inspect' ? null : 'inspect')}>
          {t('inspector')}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className={cn('card h-[70vh] min-h-[420px] overflow-hidden p-3 lg:flex lg:flex-col', mobilePanel === 'parts' ? 'block' : 'hidden lg:flex')} aria-label={t('library')}>
          <h2 className="mb-2 px-1 text-sm font-semibold text-[color:var(--ink)]">{t('library')}</h2>
          <div className="min-h-0 flex-1">
            <PartPalette onPick={() => setMobilePanel(null)} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="h-[70vh] min-h-[420px]">
            {view === 'schematic' ? <SchematicView frame={frame} /> : <BenchCanvas frame={frame} onFit={onFit} />}
          </div>
          {view === 'schematic' ? null : <p className="text-xs text-[color:var(--muted)]">{t('wireHint')}</p>}
        </div>

        <aside className={cn('card max-h-[70vh] min-h-[420px] overflow-y-auto p-4', mobilePanel === 'inspect' ? 'block' : 'hidden lg:block')} aria-label={t('inspector')}>
          <h2 className="mb-3 text-sm font-semibold text-[color:var(--ink)]">{t('inspector')}</h2>
          <Inspector />
        </aside>
      </div>

      <BottomPanel />

      {help ? (
        <div role="dialog" aria-modal="true" aria-labelledby="circuit-help-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => useCircuitStore.getState().setShowHelp(false)}>
          <div className="card max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 id="circuit-help-title" className="display-title mb-3 text-lg text-[color:var(--ink)]">{t('helpTitle')}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {shortcuts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-mono text-xs text-[color:var(--ink)]">{k}</dt>
                  <dd className="text-[color:var(--muted)]">{v}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => useCircuitStore.getState().setShowHelp(false)}>
              {t('close')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
