'use client';

import { motion } from 'framer-motion';
import { Beaker } from 'lucide-react';
import { indicatorBands, indicatorColor, indicatorLabel, neutralPhAt, formatPh } from '@/engine/phCalc';
import { vesselView } from '@/engine/vesselView';
import type { IndicatorId } from '@/engine/types';
import { useLabI18n } from '@/lib/i18n';
import { chemicalName, labDataset, vessels as glassware } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { useLabStore, vesselLabel } from '@/store/labStore';

const stops = [0, 2, 4, 6, 7, 8.5, 10, 12, 14];
const scaleGradient = `linear-gradient(90deg, ${indicatorBands.universal
  .map((band, index) => `${band.color} ${((stops[index] / 14) * 100).toFixed(1)}%`)
  .join(', ')})`;

const natureClass = {
  acidic: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-100',
  neutral: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  alkaline: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-100'
} as const;

/** pH of the selected vessel plus every indicator colour it is showing. */
export function PhMeter() {
  const { t, locale } = useLabI18n();
  const vessels = useLabStore((state) => state.vessels);
  const selectedVesselId = useLabStore((state) => state.selectedVesselId);
  const burnerLit = useLabStore((state) => state.burner.lit);

  const vessel = vessels.find((item) => item.id === selectedVesselId) ?? vessels[0];
  const view = vessel ? vesselView(vessel, labDataset, burnerLit) : null;
  const ph = view?.ph ?? null;
  const position = ph === null ? 0 : Math.min(1, Math.max(0, ph / 14));

  return (
    <section className="card overflow-hidden" aria-label={t('ph.title')}>
      <header className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        <Beaker size={16} className="text-chemistry-600" />
        <h2 className="text-sm font-extrabold">{t('ph.title')}</h2>
        {vessel && (
          <span className="ml-auto truncate text-[11px] font-bold muted">
            {vesselLabel(vessel, locale, Math.max(0, vessels.findIndex((item) => item.id === vessel.id)))}
          </span>
        )}
      </header>

      <div className="space-y-3 p-4">
        {!view || ph === null ? (
          <p className="text-xs leading-6 muted">{t('ph.empty')}</p>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <div>
                <p className="font-mono text-4xl font-black leading-none" style={{ color: indicatorColor('universal' as IndicatorId, ph) }}>
                  {formatPh(ph)}
                </p>
                <p className="mt-1 text-[11px] font-bold muted">pH</p>
              </div>
              <div className="flex-1 pb-1">
                {view.nature && (
                  <span className={cn('pill text-[11px] font-black', natureClass[view.nature])}>{t(`ph.${view.nature}`)}</span>
                )}
                <p className="mt-1.5 font-mono text-[10px] leading-4 muted">
                  {t('ph.hplus', { value: Math.pow(10, -ph).toExponential(2) })}
                </p>
                <p className="font-mono text-[10px] leading-4 muted">
                  {t('ph.poh', { value: formatPh(2 * neutralPhAt(vessel.temperatureC) - ph) })} · {Math.round(vessel.temperatureC)} {t('unit.celsius')}
                </p>
              </div>
            </div>

            <div>
              <div className="relative h-3 w-full overflow-hidden rounded-full" style={{ background: scaleGradient }} role="img" aria-label={`pH ${formatPh(ph)}`}>
                <motion.span
                  className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#101828] shadow"
                  animate={{ left: `${position * 100}%` }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[9px] muted">
                {[0, 3.5, 7, 10.5, 14].map((mark) => (
                  <span key={mark}>{mark}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide muted">{t('ph.indicator')}</p>
              {view.indicators.length === 0 ? (
                <p className="text-[11px] leading-5 muted">{t('ph.indicatorHint')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {view.indicators.map((entry) => {
                    const color = indicatorColor(entry.id, ph);
                    return (
                      <li key={entry.chemicalId} className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] p-1.5">
                        <span
                          className="h-5 w-5 shrink-0 rounded-md border border-black/10"
                          style={{ background: color === '#eef4fa' ? 'repeating-linear-gradient(45deg,#eef4fa,#eef4fa 3px,#dbe4ee 3px,#dbe4ee 6px)' : color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-extrabold">{chemicalName(entry.chemicalId, locale)}</span>
                          <span className="block truncate text-[10px] muted">{indicatorLabel(entry.id, ph, locale)}</span>
                        </span>
                        <span className="font-mono text-[10px] font-bold muted">{entry.mL.toFixed(1)} {t('unit.mL')}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {!vessel && glassware.length > 0 && <p className="border-t border-[var(--line)] px-4 py-2 text-[11px] muted">{t('bench.empty')}</p>}
    </section>
  );
}
