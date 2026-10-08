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
import { SHARE_PARAM } from './lib/exporters';
import { cn } from '@/lib/utils';

const SVG_ID = 'circuit-bench-svg';

export default function CircuitLab() {
  const { t, shortcuts } = useCircuitI18n();
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

  useSimEngine();
  useCircuitShortcuts(() => fitRef.current());

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

  // Open the bench centred on the content once it is laid out.
  useEffect(() => {
    const id = window.setTimeout(() => fitRef.current(), 120);
    return () => window.clearTimeout(id);
  }, []);

  const shortStatus = frame?.isShortCircuit ? t('shortCircuit') : frame && !running && components > 0 && frame.isOpenCircuit ? t('openCircuit') : null;
  const problem = simErrors.find((e) => e.toLowerCase().includes('overcurrent') || e.toLowerCase().includes('burnt') || e.toLowerCase().includes('overheat'));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Toolbar svgId={SVG_ID} onFit={() => fitRef.current()} />
        {shortStatus ? (
          <p role="alert" className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800 dark:bg-coral-900/20 dark:text-coral-100">
            {shortStatus}
          </p>
        ) : null}
        {problem ? (
          <p role="status" className="rounded-xl border border-sun-300 bg-sun-50 px-3 py-2 text-xs text-ink dark:bg-sun-900/20">
            {problem}
          </p>
        ) : null}
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
          <h2 className="mb-2 px-1 text-sm font-semibold text-ink">{t('library')}</h2>
          <div className="min-h-0 flex-1">
            <PartPalette onPick={() => setMobilePanel(null)} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="h-[70vh] min-h-[420px]">
            <BenchCanvas frame={frame} onFit={onFit} />
          </div>
          <p className="text-xs text-muted">{t('wireHint')}</p>
        </div>

        <aside className={cn('card max-h-[70vh] min-h-[420px] overflow-y-auto p-4', mobilePanel === 'inspect' ? 'block' : 'hidden lg:block')} aria-label={t('inspector')}>
          <h2 className="mb-3 text-sm font-semibold text-ink">{t('inspector')}</h2>
          <Inspector />
        </aside>
      </div>

      <BottomPanel />

      {help ? (
        <div role="dialog" aria-modal="true" aria-labelledby="circuit-help-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => useCircuitStore.getState().setShowHelp(false)}>
          <div className="card max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 id="circuit-help-title" className="display-title mb-3 text-lg text-ink">{t('helpTitle')}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {shortcuts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-mono text-xs text-ink">{k}</dt>
                  <dd className="text-muted">{v}</dd>
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
