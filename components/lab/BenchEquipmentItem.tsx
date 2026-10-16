'use client';

import { Copy, Move, RotateCw, X } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Apparatus, BenchEquipment, Vessel } from '@/engine/types';
import { labT } from '@/lib/i18n';
import { apparatusById, apparatusName } from '@/lib/labData';
import { cn } from '@/lib/utils';
import { useLabStore } from '@/store/labStore';
import { ApparatusGlyph, Burner, DeliveryTube, Dropper, ElectrolysisCell, Spatula, TestTubeHolder, Thermometer, TripodStand } from './Apparatus';

export function benchEquipmentSize(shape: Apparatus['shape']): { width: number; height: number } {
  if (shape === 'burner') return { width: 88, height: 118 };
  if (shape === 'tripod') return { width: 132, height: 82 };
  if (shape === 'thermometer') return { width: 70, height: 170 };
  if (shape === 'dropper' || shape === 'pipette' || shape === 'spatula' || shape === 'glass-rod' || shape === 'holder') return { width: 72, height: 150 };
  if (shape === 'delivery' || shape === 'funnel' || shape === 'wire-gauze') return { width: 142, height: 94 };
  if (shape === 'cell' || shape === 'wash-bottle' || shape === 'mortar-pestle') return { width: 110, height: 128 };
  if (shape === 'retort-stand') return { width: 148, height: 176 };
  if (shape === 'test-tube-rack') return { width: 170, height: 105 };
  return { width: 116, height: 124 };
}

export function BenchEquipmentItem({
  item,
  locale,
  selected,
  dragging,
  vessel,
  onPointerDown,
  onSelect,
  onRemove,
  onDuplicate,
  onRotate
}: {
  item: BenchEquipment;
  locale: 'bn' | 'en';
  selected: boolean;
  dragging: boolean;
  vessel: Vessel | null;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, id: string) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
}) {
  const burner = useLabStore((state) => state.burner);
  const apparatus = apparatusById.get(item.apparatusId ?? '');
  if (!apparatus) return null;
  const size = benchEquipmentSize(apparatus.shape);
  const name = apparatusName(item.apparatusId ?? '', locale);

  return (
    <div
      data-bench-item={`equipment:${item.id}`}
      onPointerDown={(event) => onPointerDown(event, item.id)}
      onClick={() => onSelect(item.id)}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: size.width,
        minHeight: size.height,
        transform: `rotate(${item.rotation}deg)`,
        zIndex: dragging ? 60 : selected ? 35 : 10,
        touchAction: 'none'
      }}
      className={cn('group cursor-grab select-none active:cursor-grabbing', dragging && 'opacity-90')}
      aria-label={name}
      title={`${name} · ${locale === 'bn' ? 'টেনে সরান' : 'drag to move'}`}
    >
      <div className={cn(
        'relative flex min-h-full flex-col items-center justify-center rounded-2xl border px-2 pb-2 pt-3 transition',
        selected ? 'border-chemistry-500 bg-white/95 shadow-[0_0_0_3px_rgba(14,165,233,.18),0_12px_24px_rgba(15,23,42,.18)]' : 'border-white/90 bg-white/78 shadow-[0_8px_18px_rgba(30,41,59,.16)] group-hover:shadow-[0_12px_24px_rgba(30,41,59,.2)]'
      )}>
        <div className="absolute left-2 top-2 flex items-center gap-1 text-[var(--muted)]" aria-hidden="true">
          <Move size={12} />
          <span className="text-[8px] font-black uppercase tracking-wider">{locale === 'bn' ? 'সরান' : 'move'}</span>
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); onRemove(item.id); }}
          className="absolute right-1 top-1 z-20 grid h-6 w-6 place-items-center rounded-lg bg-white/90 text-slate-500 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100"
          aria-label={`${labT(locale, 'action.remove')} ${name}`}
          title={labT(locale, 'action.remove')}
        >
          <X size={13} />
        </button>
        <div className="flex h-full w-full items-center justify-center px-1 pt-4">
          <EquipmentDrawing shape={apparatus.shape} item={item} linkedVessel={vessel} lit={burner.lit} intensity={burner.intensity} />
        </div>
        <div className="mt-1 max-w-full text-center">
          <p className="line-clamp-2 text-[10px] font-extrabold leading-tight text-slate-700">{name}</p>
          {vessel && <p className="mt-0.5 truncate font-mono text-[8px] font-bold text-slate-500">{vessel.temperatureC.toFixed(0)} °C · {labT(locale, 'bench.selected')}</p>}
        </div>
        {selected && (
          <div className="absolute -bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-[var(--line)] bg-white p-0.5 shadow-card">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onDuplicate(item.id); }} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={labT(locale, 'bench.duplicate')} title={labT(locale, 'bench.duplicate')}><Copy size={12} /></button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRotate(item.id); }} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={labT(locale, 'bench.rotate')} title={labT(locale, 'bench.rotate')}><RotateCw size={12} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentDrawing({
  shape,
  item,
  linkedVessel,
  lit,
  intensity
}: {
  shape: Apparatus['shape'];
  item: BenchEquipment;
  linkedVessel: Vessel | null;
  lit: boolean;
  intensity: number;
}) {
  if (shape === 'burner') return <Burner lit={linkedVessel ? linkedVessel.heating && lit : lit} intensity={intensity} className="h-[88px] w-[76px] overflow-visible" />;
  if (shape === 'tripod') return <TripodStand className="h-[66px] w-[118px]" />;
  if (shape === 'thermometer') return <Thermometer temperatureC={linkedVessel?.temperatureC ?? 25} className="h-[138px] w-[46px]" />;
  if (shape === 'dropper') return <Dropper className="h-[114px] w-[42px]" />;
  if (shape === 'spatula') return <Spatula className="h-[114px] w-[42px]" />;
  if (shape === 'delivery') return <DeliveryTube className="h-[54px] w-[118px]" />;
  if (shape === 'holder') return <TestTubeHolder className="h-[104px] w-[72px]" />;
  if (shape === 'cell') return <ElectrolysisCell className="h-[92px] w-[84px]" />;
  const apparatus = apparatusById.get(item.apparatusId ?? '');
  return apparatus ? <ApparatusGlyph apparatus={apparatus} size={shape === 'test-tube-rack' ? 82 : 70} className="text-slate-600" /> : null;
}
