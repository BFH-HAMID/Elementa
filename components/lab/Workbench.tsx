'use client';

import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { Flame, Info, Plus } from 'lucide-react';
import { labT } from '@/lib/i18n';
import { vessels as glassware } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { MAX_VESSELS, useLabStore } from '@/store/labStore';
import { ApparatusGlyph } from './Apparatus';
import { VesselStation } from './VesselStation';
import type { DropTargetData } from './dragTypes';

/** The bench: every station on it is a drop target, and so is the bench itself. */
export function Workbench() {
  const locale = useLabStore((state) => state.locale);
  const vessels = useLabStore((state) => state.vessels);
  const selectedVesselId = useLabStore((state) => state.selectedVesselId);
  const burner = useLabStore((state) => state.burner);
  const hint = useLabStore((state) => state.hint);
  const addVessel = useLabStore((state) => state.addVessel);
  const toggleBurner = useLabStore((state) => state.toggleBurner);
  const setBurnerIntensity = useLabStore((state) => state.setBurnerIntensity);
  const attachThermometer = useLabStore((state) => state.attachThermometer);
  const attachElectrolysis = useLabStore((state) => state.attachElectrolysis);

  const benchData: DropTargetData = { type: 'bench' };
  const { setNodeRef, isOver } = useDroppable({ id: 'bench', data: benchData });
  const selected = vessels.find((vessel) => vessel.id === selectedVesselId);

  return (
    <section ref={setNodeRef} className="flex min-h-[420px] flex-col gap-3" aria-label={labT(locale, 'bench.title')}>
      <div className="card flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl transition', burner.lit ? 'bg-orange-100 text-orange-600 dark:bg-orange-950' : 'bg-[var(--surface-soft)] text-[var(--muted)]')}>
            <Flame size={19} />
          </span>
          <div>
            <p className="text-sm font-extrabold leading-tight">{labT(locale, 'bench.burnerIntensity')}</p>
            <p className="text-[11px] muted">{burner.lit ? labT(locale, 'action.extinguish') : labT(locale, 'action.light')}</p>
          </div>
        </div>

        <button type="button" onClick={toggleBurner} className={cn('btn-secondary min-h-9 rounded-lg px-3 text-xs', burner.lit && 'border-orange-300 text-orange-700 dark:text-orange-200')}>
          {burner.lit ? labT(locale, 'action.extinguish') : labT(locale, 'action.light')}
        </button>

        <label className="flex min-w-[140px] flex-1 items-center gap-2">
          <span className="sr-only">{labT(locale, 'bench.burnerIntensity')}</span>
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(burner.intensity * 100)}
            onChange={(event) => setBurnerIntensity(Number(event.target.value) / 100)}
            className="w-full accent-orange-500"
          />
          <span className="font-mono text-xs font-black">{Math.round(burner.intensity * 100)}%</span>
        </label>

        {selected && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => attachThermometer(selected.id, !selected.thermometer)}
              className={cn('btn-ghost min-h-9 rounded-lg px-2.5 text-xs', selected.thermometer && 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100')}
              title={labT(locale, 'bench.thermometer')}
            >
              🌡 {labT(locale, 'bench.thermometer')}
            </button>
            <button
              type="button"
              onClick={() => attachElectrolysis(selected.id, !selected.electrolysis)}
              className={cn('btn-ghost min-h-9 rounded-lg px-2.5 text-xs', selected.electrolysis && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100')}
              title={labT(locale, 'bench.electrolysis')}
            >
              ⚡ {labT(locale, 'bench.electrolysis')}
            </button>
          </div>
        )}
      </div>

      {hint && (
        <div className="flex items-start gap-2 rounded-xl border border-physics-200 bg-physics-50 px-3 py-2 text-xs font-bold leading-5 text-physics-900 dark:border-physics-700 dark:bg-physics-900/50 dark:text-physics-100">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>{locale === 'bn' ? hint.text_bn : hint.text_en}</span>
        </div>
      )}

      {vessels.length === 0 ? (
        <div
          className={cn(
            'grid flex-1 place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition',
            isOver ? 'border-chemistry-500 bg-chemistry-50 dark:bg-chemistry-900/30' : 'border-[var(--line)] bg-[var(--surface-soft)]'
          )}
        >
          <div className="max-w-md">
            <div className="mx-auto mb-3 flex w-fit items-end gap-2 text-physics-500">
              {glassware.slice(0, 3).map((item) => (
                <ApparatusGlyph key={item.id} apparatus={item} size={26} />
              ))}
            </div>
            <p className="text-base font-extrabold">{labT(locale, 'bench.dropHere')}</p>
            <p className="mt-2 text-sm leading-6 muted">{labT(locale, 'bench.empty')}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {glassware.slice(0, 4).map((item) => (
                <button key={item.id} type="button" onClick={() => addVessel(item.id)} className="btn-secondary min-h-9 rounded-lg px-3 text-xs">
                  <Plus size={14} /> {locale === 'bn' ? item.name_bn : item.name_en}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-1 flex-wrap items-start gap-3 rounded-2xl border-2 border-dashed p-3 transition',
            isOver ? 'border-chemistry-400 bg-chemistry-50/60 dark:bg-chemistry-900/20' : 'border-transparent'
          )}
        >
          <AnimatePresence mode="popLayout">
            {vessels.map((vessel, index) => (
              <VesselStation key={vessel.id} vessel={vessel} index={index} selected={vessel.id === selectedVesselId} />
            ))}
          </AnimatePresence>

          {vessels.length < MAX_VESSELS && (
            <button
              type="button"
              onClick={() => addVessel('test-tube')}
              className="flex h-[240px] w-[112px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--line)] text-[var(--muted)] transition hover:border-chemistry-400 hover:text-chemistry-600"
              aria-label={labT(locale, 'bench.addVessel')}
            >
              <Plus size={20} />
              <span className="px-2 text-center text-[11px] font-bold leading-4">{labT(locale, 'bench.addVessel')}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
