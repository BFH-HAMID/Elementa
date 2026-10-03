'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArrowUpToLine, Droplets, Flame, Trash2, X, Zap } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { heatColour } from '@/engine/heatModel';
import { indicatorColor } from '@/engine/phCalc';
import type { Vessel } from '@/engine/types';
import { vesselView } from '@/engine/vesselView';
import { labT } from '@/lib/i18n';
import { apparatusById, labDataset } from '@/lib/labData';
import { cn, prefersReducedMotion } from '@/lib/utils';
import { useLabStore, vesselLabel } from '@/store/labStore';
import { Burner, Thermometer, TripodStand, VesselFor } from './Apparatus';
import { vesselDropId, type DropTargetData } from './dragTypes';

export function VesselStation({ vessel, index, selected }: { vessel: Vessel; index: number; selected: boolean }) {
  const locale = useLabStore((state) => state.locale);
  const burner = useLabStore((state) => state.burner);
  const allEffects = useLabStore((state) => state.effects);
  const vessels = useLabStore((state) => state.vessels);
  const selectVessel = useLabStore((state) => state.selectVessel);
  const setHeating = useLabStore((state) => state.setHeating);
  const spark = useLabStore((state) => state.spark);
  const collectGas = useLabStore((state) => state.collectGas);
  const dispense = useLabStore((state) => state.dispense);
  const emptyVessel = useLabStore((state) => state.emptyVessel);
  const removeVessel = useLabStore((state) => state.removeVessel);
  const removePortion = useLabStore((state) => state.removePortion);

  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const effects = useMemo(() => allEffects.filter((effect) => effect.vesselId === vessel.id), [allEffects, vessel.id]);
  const view = useMemo(() => vesselView(vessel, labDataset, burner.lit), [vessel, burner.lit]);

  const label = vesselLabel(vessel, locale, index);
  const dropData: DropTargetData = { type: 'vessel', vesselId: vessel.id, name: label };
  const { setNodeRef, isOver } = useDroppable({ id: vesselDropId(vessel.id), data: dropData });

  const VesselDrawing = VesselFor(view.apparatus?.shape ?? 'tube');
  const flameColor = effects.find((effect) => effect.kind === 'flame')?.color ?? null;
  const gasTarget = vessels.find((other) => other.id !== vessel.id && apparatusById.get(other.apparatusId)?.acceptsGas);
  const pourTarget = vessels.find((other) => other.id !== vessel.id);
  const canHeat = view.apparatus?.canHeat ?? false;
  const phColor = view.ph === null ? '#cbd5e1' : indicatorColor('universal', view.ph);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      ref={setNodeRef}
      onClick={() => selectVessel(vessel.id)}
      className={cn(
        'card relative flex min-w-[210px] flex-1 flex-col overflow-hidden transition',
        selected ? 'border-physics-400 shadow-glow' : 'hover:border-physics-200',
        isOver && 'border-chemistry-500 ring-2 ring-chemistry-300 dark:ring-chemistry-700'
      )}
      aria-label={label}
    >
      {selected && <span className="absolute right-2 top-2 z-10 pill bg-physics-600 text-white">{labT(locale, 'bench.selected')}</span>}

      <div className="relative flex items-end justify-center gap-1 bg-[var(--surface-soft)] px-2 pt-3">
        <div className="relative h-[172px] w-[112px] shrink-0">
          <VesselDrawing
            clipId={`clip-${vessel.id}`}
            fill={view.fill}
            color={view.color}
            opacity={view.totalMl > 0 ? view.liquidOpacity : 0.25}
            sedimentFill={view.sedimentFill}
            sedimentColor={view.sedimentColor}
            turbidity={view.turbidity}
            effects={effects}
            reducedMotion={reducedMotion}
            className="h-full w-full"
          />
        </div>

        {vessel.thermometer && (
          <div className="absolute right-1 top-1 h-[124px] w-9">
            <Thermometer temperatureC={vessel.temperatureC} className="h-full w-full" />
          </div>
        )}

        {view.heating && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[-6px] flex flex-col items-center">
            <TripodStand className="w-[104px]" />
            <Burner lit={burner.lit} intensity={burner.intensity} flameColor={flameColor} reducedMotion={reducedMotion} className="-mt-3 w-[76px]" />
          </div>
        )}

        {isOver && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-chemistry-500/10 text-center">
            <span className="rounded-full bg-chemistry-600 px-3 py-1 text-[11px] font-black text-white shadow-float">
              {labT(locale, 'bench.dropHere')}
            </span>
          </div>
        )}
      </div>

      <div className={cn('flex flex-col gap-2 p-3', view.heating && 'pt-9')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-extrabold leading-tight">{label}</h3>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              removeVessel(vessel.id);
            }}
            aria-label={labT(locale, 'action.remove')}
            className="btn-ghost min-h-7 rounded-lg p-1.5"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          <span className="pill bg-[var(--surface-soft)] font-mono">
            {view.totalMl.toFixed(1)}/{view.capacityMl} {labT(locale, 'unit.mL')}
          </span>
          <span className="pill font-mono" style={{ background: `${heatColour(vessel.temperatureC)}22`, color: heatColour(vessel.temperatureC) }}>
            {vessel.temperatureC.toFixed(0)} {labT(locale, 'unit.celsius')}
          </span>
          {view.ph !== null && (
            <span className="pill font-mono" style={{ background: `${phColor}26`, color: phColor }}>
              pH {view.ph.toFixed(2)}
            </span>
          )}
          {view.boiling && <span className="pill bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100">{labT(locale, 'hint.boiling')}</span>}
          {vessel.electrolysis && <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100">⚡</span>}
        </div>

        <div className="min-h-[34px]">
          {view.contents.length === 0 && view.sediment.length === 0 ? (
            <p className="text-[11px] italic muted">{labT(locale, 'bench.emptyVessel')}</p>
          ) : (
            <ul className="flex flex-wrap gap-1">
              {view.contents.slice(0, 5).map(({ portion, chemical }) => (
                <li key={portion.chemicalId}>
                  <button
                    type="button"
                    title={`${chemical.name_en} · ${portion.mL.toFixed(1)} ${chemical.state === 'solid' ? 'g' : 'mL'} — ${labT(locale, 'action.remove')}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removePortion(vessel.id, portion.chemicalId);
                    }}
                    className="flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] font-bold transition hover:border-rose-300 hover:text-rose-600"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: chemical.color }} />
                    {chemical.formula}
                    <span className="text-[var(--muted)]">{portion.mL.toFixed(1)}</span>
                  </button>
                </li>
              ))}
              {view.contents.length > 5 && <li className="pill bg-[var(--surface-soft)] text-[10px]">+{view.contents.length - 5}</li>}
              {view.sediment.map(({ item, chemical }) => (
                <li key={item.chemicalId} className="pill bg-[var(--surface-soft)] font-mono text-[10px]" title={chemical?.name_en}>
                  ↓ {chemical?.formula ?? item.chemicalId}
                </li>
              ))}
              {view.gases.map(({ gas, chemical }) => (
                <li key={gas.chemicalId} className="pill bg-physics-50 font-mono text-[10px] text-physics-700 dark:bg-physics-900 dark:text-physics-100" title={chemical?.name_en}>
                  ↑ {chemical?.formula ?? gas.chemicalId} {gas.mL.toFixed(0)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-2">
          <StationButton
            tone={vessel.heating ? 'active' : 'idle'}
            disabled={!canHeat}
            label={vessel.heating ? labT(locale, 'action.stopHeat') : labT(locale, 'action.heat')}
            onClick={() => setHeating(vessel.id, !vessel.heating)}
          >
            <Flame size={14} />
          </StationButton>
          <StationButton tone="idle" label={labT(locale, 'action.spark')} onClick={() => spark(vessel.id)}>
            <Zap size={14} />
          </StationButton>
          <StationButton
            tone="idle"
            disabled={!gasTarget || view.gases.length === 0}
            label={labT(locale, 'action.collectGas')}
            onClick={() => gasTarget && collectGas(vessel.id, gasTarget.id)}
          >
            <ArrowUpToLine size={14} />
          </StationButton>
          <StationButton
            tone="idle"
            disabled={!pourTarget || view.totalMl <= 0}
            label={labT(locale, 'action.dispense', { value: 1 })}
            onClick={() => pourTarget && dispense(vessel.id, pourTarget.id, 1)}
          >
            <Droplets size={14} />
          </StationButton>
          <StationButton tone="idle" disabled={view.totalMl === 0 && view.sediment.length === 0} label={labT(locale, 'action.empty')} onClick={() => emptyVessel(vessel.id)}>
            <Trash2 size={14} />
          </StationButton>
        </div>

      </div>
    </motion.article>
  );
}

function StationButton({
  children,
  label,
  onClick,
  disabled,
  tone
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: 'idle' | 'active';
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'btn-ghost min-h-8 rounded-lg px-2 py-1.5',
        tone === 'active' && 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200',
        disabled && 'opacity-35'
      )}
    >
      {children}
    </button>
  );
}
