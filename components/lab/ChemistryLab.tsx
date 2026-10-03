'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/engine/types';
import { labT, useLabI18n } from '@/lib/i18n';
import { apparatusById, getExperiment } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';
import { ApparatusGlyph } from './Apparatus';
import { EquationBox } from './EquationBox';
import { ExperimentGuidePanel } from './ExperimentGuidePanel';
import { LabToolbar } from './LabToolbar';
import { ObservationPanel } from './ObservationPanel';
import { PhMeter } from './PhMeter';
import { SafetyOverlay } from './SafetyOverlay';
import { Shelf } from './Shelf';
import { Workbench } from './Workbench';
import type { DragPayload, DropTargetData } from './dragTypes';

const TICK_MS = 200;

/**
 * The whole lab: a drag-and-drop context around the shelf, the bench and the notebooks.
 * Chemistry never happens here — every drop becomes a store action, and the store asks
 * the pure engine what should happen.
 */
export function ChemistryLab() {
  const { t, locale } = useLabI18n();
  const searchParams = useSearchParams();
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const requestedExperiment = searchParams.get('experiment');

  const sensors = useSensors(
    // A small distance threshold keeps taps and scrolling working on touch screens.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // `/lab/chemistry?experiment=litmus-test` opens the lab with that walkthrough loaded.
  useEffect(() => {
    if (!requestedExperiment) return;
    const store = useLabStore.getState();
    if (store.activeExperiment?.slug === requestedExperiment) return;
    const experiment = getExperiment(requestedExperiment);
    if (experiment) store.startExperiment(experiment);
  }, [requestedExperiment]);

  // Keep the store's copy in step with the site locale.
  useEffect(() => {
    useLabStore.getState().setLocale(locale as Locale);
  }, [locale]);

  // Heat, cooling, boiling and settling all advance on a clock.
  useEffect(() => {
    const timer = window.setInterval(() => useLabStore.getState().tick(TICK_MS / 1000), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const onDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragPayload | undefined) ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const payload = (event.active.data.current as DragPayload | undefined) ?? null;
    const target = (event.over?.data.current as DropTargetData | undefined) ?? null;
    setActiveDrag(null);
    if (payload && target) drop(payload, target);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveDrag(null)}>
      <div className="page-shell space-y-4">
        <header className="card flex flex-wrap items-end justify-between gap-3 p-5">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('brand.badge')}</p>
            <h1 className="display-title mt-1">{t('brand.title')}</h1>
            <p className={cn('mt-2 text-sm leading-6 muted', locale === 'bn' && 'font-bengali')}>{t('brand.tagline')}</p>
          </div>
          <p className="max-w-xs text-[11px] leading-5 muted">{t('shelf.dragHint')}</p>
        </header>

        <LabToolbar />

        <div className="grid gap-4 xl:grid-cols-[minmax(290px,340px)_minmax(0,1fr)_minmax(300px,370px)]">
          <div className="order-2 min-w-0 xl:order-1">
            <Shelf />
          </div>

          <div className="order-1 min-w-0 space-y-4 xl:order-2">
            <Workbench />
            <ExperimentGuidePanel />
          </div>

          <div className="order-3 min-w-0 space-y-4">
            <PhMeter />
            <EquationBox />
            <ObservationPanel />
          </div>
        </div>

        <p className="px-1 pb-2 text-[11px] muted">
          {t('safety.simulated')} · {t('misc.reducedMotion')} · {t('misc.offline')}
        </p>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeDrag && <DragChip payload={activeDrag} locale={locale} />}
      </DragOverlay>

      <SafetyOverlay />
    </DndContext>
  );
}

/** What a dropped chemical or piece of apparatus actually does to the bench. */
function drop(payload: DragPayload, target: DropTargetData) {
  const store = useLabStore.getState();

  if (payload.kind === 'chemical') {
    let vesselId: string;
    if (target.type === 'vessel') vesselId = target.vesselId;
    else vesselId = store.selectedVesselId ?? store.vessels[0]?.id ?? store.addVessel('test-tube');
    if (!vesselId) return;
    store.selectVessel(vesselId);
    store.addChemical(vesselId, payload.chemicalId, store.pourMl);
    return;
  }

  if (target.type === 'bench') {
    if (payload.apparatusKind === 'vessel') store.addVessel(payload.apparatusId);
    return;
  }

  const vesselId = target.vesselId;
  switch (payload.apparatusKind) {
    case 'vessel':
      store.setVesselApparatus(vesselId, payload.apparatusId);
      break;
    case 'heat':
    case 'support':
      // Dropping the burner, the tripod or the tube holder means "heat this station".
      store.setHeating(vesselId, true);
      break;
    case 'measure':
      store.attachThermometer(vesselId, true);
      break;
    case 'power':
      store.attachElectrolysis(vesselId, true);
      break;
    case 'tool':
      if (payload.apparatusId === 'delivery-tube') {
        const jar = store.vessels.find((vessel) => vessel.id !== vesselId && apparatusById.get(vessel.apparatusId)?.acceptsGas);
        const jarId = jar?.id ?? store.addVessel('gas-jar');
        if (jarId) store.collectGas(vesselId, jarId);
      } else if (payload.apparatusId === 'dropper') {
        const source =
          store.vessels.find((vessel) => vessel.id === store.selectedVesselId && vessel.id !== vesselId) ??
          store.vessels.find((vessel) => vessel.id !== vesselId && vessel.portions.length > 0);
        if (source) store.dispense(source.id, vesselId, 1);
      } else if (payload.apparatusId === 'spatula') {
        store.stir(vesselId);
      } else {
        store.setHeating(vesselId, true);
      }
      break;
    default:
      break;
  }
}

function DragChip({ payload, locale }: { payload: DragPayload; locale: Locale }) {
  if (payload.kind === 'chemical') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-chemistry-300 bg-[var(--surface)] px-3 py-2 shadow-float">
        <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white/70" style={{ background: payload.color }} />
        <span className="font-mono text-xs font-black">{payload.formula}</span>
        <span className="max-w-[140px] truncate text-[11px] font-bold muted">{payload.name}</span>
        <span className="pill bg-[var(--surface-soft)] text-[10px]">{labT(locale, payload.state === 'solid' ? 'unit.g' : 'unit.mL')}</span>
      </div>
    );
  }

  const apparatus = apparatusById.get(payload.apparatusId);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-physics-300 bg-[var(--surface)] px-3 py-2 text-physics-700 shadow-float dark:text-physics-200">
      {apparatus && <ApparatusGlyph apparatus={apparatus} size={20} />}
      <span className="max-w-[160px] truncate text-[11px] font-black">{payload.name}</span>
    </div>
  );
}
