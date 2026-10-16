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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, FlaskConical, ListChecks } from 'lucide-react';
import type { Locale } from '@/engine/types';
import { allChemPracticalModels, hasChemPracticalModel } from '@/engine/chemPracticals';
import { labT, useLabI18n } from '@/lib/i18n';
import { apparatusById, chemicalsById, getExperiment } from '@/lib/labData';
import { labInstrumentById, labInstrumentSize } from '@/lib/labInstruments';
import { EquipmentArt } from '@/components/physics/Equipment/art';
import { cn } from '@/lib/utils';
import { useLabStore, type BenchPoint } from '@/store/labStore';
import { benchEquipmentSize } from './BenchEquipmentItem';
import { ChemPracticalSimulator } from './practicals/ChemPracticalSimulator';
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
  const router = useRouter();
  const pathname = usePathname();
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const requestedExperiment = searchParams.get('experiment');
  const benchExperiment = useLabStore((state) => state.activeExperiment?.slug ?? null);
  // `?experiment=<slug>` opens the interactive practical simulation (when the practical
  // has one); `&mode=bench` opens the drag-and-drop bench walkthrough instead.
  const simulationSlug = requestedExperiment && hasChemPracticalModel(requestedExperiment) ? requestedExperiment : null;
  const mode: 'simulation' | 'bench' = simulationSlug && searchParams.get('mode') !== 'bench' ? 'simulation' : 'bench';
  // On the bench the walkthrough can be switched from the guide panel, so the mode
  // switch follows whatever practical is loaded there.
  const switchSlug = mode === 'simulation' ? simulationSlug : benchExperiment && hasChemPracticalModel(benchExperiment) ? benchExperiment : simulationSlug;

  const goTo = useCallback(
    (slug: string, nextMode: 'simulation' | 'bench') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('experiment', slug);
      params.set('mode', nextMode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

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
    if (payload && target) {
      const point = target.type === 'bench' ? benchDropPoint(event, payload) : undefined;
      drop(payload, target, point);
    }
  };

  return (
    <DndContext id="elementa-chemistry-lab" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveDrag(null)}>
      <div className="page-shell space-y-4">
        <header className="card flex flex-wrap items-end justify-between gap-3 p-5">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('brand.badge')}</p>
            <h1 className="display-title mt-1">{t('brand.title')}</h1>
            <p className={cn('mt-2 text-sm leading-6 muted', locale === 'bn' && 'font-bengali')}>{t('brand.tagline')}</p>
          </div>
          <div className="flex max-w-xs flex-col items-start gap-2 sm:items-end">
            <Link
              href={`/${locale}/lab/experiments`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-chemistry-300 bg-chemistry-50 px-3 py-2 text-[11px] font-black text-chemistry-800 transition hover:bg-chemistry-100 dark:border-chemistry-700 dark:bg-chemistry-900/40 dark:text-chemistry-100"
            >
              <ClipboardList size={14} />
              {locale === 'bn' ? `${allChemPracticalModels.length}টি প্র্যাকটিক্যাল সিমুলেশন` : `${allChemPracticalModels.length} practical simulations`}
            </Link>
            {mode === 'bench' && <p className="text-[11px] leading-5 muted">{t('shelf.dragHint')}</p>}
          </div>
        </header>

        {switchSlug && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-1.5" role="tablist" aria-label={locale === 'bn' ? 'পরীক্ষার ধরন' : 'Practical mode'}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'simulation'}
              data-testid="mode-simulation"
              onClick={() => goTo(switchSlug, 'simulation')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
                mode === 'simulation' ? 'bg-chemistry-600 text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              )}
            >
              <FlaskConical size={14} />
              {locale === 'bn' ? 'প্র্যাকটিক্যাল সিমুলেশন' : 'Practical simulation'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'bench'}
              data-testid="mode-bench"
              onClick={() => goTo(switchSlug, 'bench')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
                mode === 'bench' ? 'bg-chemistry-600 text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              )}
            >
              <ListChecks size={14} />
              {locale === 'bn' ? 'ভার্চুয়াল বেঞ্চ (ধাপে ধাপে)' : 'Virtual bench (guided steps)'}
            </button>
          </div>
        )}

        {mode === 'simulation' && simulationSlug ? (
          <ChemPracticalSimulator slug={simulationSlug} onNavigate={(slug) => goTo(slug, 'simulation')} onOpenBench={() => goTo(simulationSlug, 'bench')} />
        ) : (
          <>
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
          </>
        )}

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

/** Convert the drag overlay position into world coordinates on the zoomable worktop. */
function benchDropPoint(event: DragEndEvent, payload: DragPayload): BenchPoint | undefined {
  if (typeof document === 'undefined') return undefined;
  const surface = document.querySelector<HTMLElement>('[data-chemistry-bench-surface="true"]');
  const rect = surface?.getBoundingClientRect();
  const activeRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
  if (!surface || !rect || !activeRect) return undefined;

  const zoom = Number(surface.dataset.zoom) || 1;
  const cx = (activeRect.left + activeRect.width / 2 - rect.left) / zoom;
  const cy = (activeRect.top + activeRect.height / 2 - rect.top) / zoom;
  const size = payload.kind === 'instrument'
    ? labInstrumentSize(payload.instrumentId)
    : payload.kind === 'apparatus' && payload.apparatusKind !== 'vessel'
      ? benchEquipmentSize(payload.shape)
      : payload.kind === 'element'
        ? { width: 112, height: 128 }
        : { width: 230, height: 490 };
  return { x: Math.max(0, cx - size.width / 2), y: Math.max(0, cy - size.height / 2) };
}

/** What a dropped chemical, element or piece of apparatus actually does to the bench. */
function drop(payload: DragPayload, target: DropTargetData, position?: BenchPoint) {
  const store = useLabStore.getState();

  // Lab instruments are plain bench objects: they are never poured into or heated
  // with a vessel, they just stand on the worktop next to the glassware.
  if (payload.kind === 'instrument') {
    const vessel = target.type === 'vessel' ? store.vessels.find((item) => item.id === target.vesselId) : null;
    const point = position ?? (vessel ? { x: (vessel.x ?? 24) + 246, y: (vessel.y ?? 178) + 42 } : undefined);
    store.addBenchInstrument(payload.instrumentId, point);
    return;
  }

  if (payload.kind === 'chemical') {
    let vesselId: string;
    if (target.type === 'vessel') vesselId = target.vesselId;
    else vesselId = store.selectedVesselId ?? store.vessels[0]?.id ?? store.addVessel('test-tube', undefined, position);
    if (!vesselId) return;
    store.selectVessel(vesselId);
    store.addChemical(vesselId, payload.chemicalId, store.pourMl);
    return;
  }

  if (payload.kind === 'element') {
    if (target.type === 'bench') {
      store.addElementSample(payload.element, position);
      return;
    }
    const elementalForms: Record<string, string> = { H: 'H2', N: 'N2', O: 'O2', Cl: 'Cl2' };
    const knownChemical = chemicalsById.get(payload.element.symbol) ?? chemicalsById.get(elementalForms[payload.element.symbol] ?? '');
    if (knownChemical?.shelf) {
      store.selectVessel(target.vesselId);
      const amount = knownChemical.state === 'solid' ? 1 : knownChemical.state === 'gas' ? 20 : 5;
      store.addChemical(target.vesselId, knownChemical.id, amount);
      return;
    }
    const vessel = store.vessels.find((item) => item.id === target.vesselId);
    const sampleIndex = store.elementSamples.length;
    store.addElementSample(payload.element, {
      x: (vessel?.x ?? 24) + 246 + (sampleIndex % 4) * 112,
      y: (vessel?.y ?? 178) + Math.floor(sampleIndex / 4) * 128
    });
    store.notify(labT('en', 'elements.notAReagent'), labT('bn', 'elements.notAReagent'), 'info');
    return;
  }

  if (target.type === 'bench') {
    if (payload.apparatusKind === 'vessel') store.addVessel(payload.apparatusId, undefined, position);
    else store.addBenchEquipment(payload.apparatusId, position);
    return;
  }

  const vesselId = target.vesselId;
  const vessel = store.vessels.find((item) => item.id === vesselId);
  if (payload.apparatusKind === 'vessel') {
    store.setVesselApparatus(vesselId, payload.apparatusId);
    return;
  }

  const linkedEquipmentCount = store.benchEquipment.filter((item) => item.linkedVesselId === vesselId).length;
  const equipmentPosition = position ?? {
    x: (vessel?.x ?? 24) + 246 + (linkedEquipmentCount % 3) * 142,
    y: (vessel?.y ?? 178) + 42 + Math.floor(linkedEquipmentCount / 3) * 172
  };
  const equipmentId = store.addBenchEquipment(payload.apparatusId, equipmentPosition, vesselId);
  if (!equipmentId) return;
  store.selectVessel(vesselId);

  switch (payload.apparatusId) {
    case 'bunsen-burner':
      store.setHeating(vesselId, true);
      break;
    case 'thermometer':
      store.attachThermometer(vesselId, true);
      break;
    case 'electrolysis-cell':
      store.attachElectrolysis(vesselId, true);
      break;
    case 'delivery-tube': {
      const jar = store.vessels.find((item) => item.id !== vesselId && apparatusById.get(item.apparatusId)?.acceptsGas);
      const jarId = jar?.id ?? store.addVessel('gas-jar', undefined, { x: equipmentPosition.x + 40, y: equipmentPosition.y + 180 });
      if (jarId) store.collectGas(vesselId, jarId);
      break;
    }
    case 'dropper':
    case 'graduated-pipette': {
      const source =
        store.vessels.find((item) => item.id === store.selectedVesselId && item.id !== vesselId) ??
        store.vessels.find((item) => item.id !== vesselId && item.portions.length > 0);
      if (source) store.dispense(source.id, vesselId, 1);
      break;
    }
    case 'spatula':
    case 'glass-stirring-rod':
      store.stir(vesselId);
      break;
    default:
      // Supports and other tools are now real, movable bench objects. Their physical
      // presence does not silently start heating or alter the vessel's contents.
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

  if (payload.kind === 'element') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-chemistry-300 bg-white px-3 py-2 shadow-float">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-chemistry-100 font-mono text-sm font-black text-chemistry-900">{payload.element.symbol}</span>
        <span className="min-w-0">
          <span className="block max-w-[150px] truncate text-[11px] font-black text-slate-800">{payload.name}</span>
          <span className="block font-mono text-[9px] font-bold text-slate-500">Z {payload.element.z} · {payload.element.mass} u</span>
        </span>
      </div>
    );
  }

  if (payload.kind === 'instrument') {
    const instrument = labInstrumentById.get(payload.instrumentId);
    return (
      <div className="flex items-center gap-2 rounded-xl border border-physics-300 bg-[var(--surface)] px-3 py-2 text-physics-700 shadow-float dark:text-physics-200">
        <span className="h-8 w-12 shrink-0">
          <EquipmentArt
            equipmentId={payload.instrumentId}
            p={instrument?.defaultProperties ?? {}}
            bn={locale === 'bn'}
            live={false}
            detailed={false}
          />
        </span>
        <span className="max-w-[160px] truncate text-[11px] font-black">{payload.name}</span>
      </div>
    );
  }

  const apparatusItem = apparatusById.get(payload.apparatusId);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-physics-300 bg-[var(--surface)] px-3 py-2 text-physics-700 shadow-float dark:text-physics-200">
      {apparatusItem && <ApparatusGlyph apparatus={apparatusItem} size={20} />}
      <span className="max-w-[160px] truncate text-[11px] font-black">{payload.name}</span>
    </div>
  );
}
