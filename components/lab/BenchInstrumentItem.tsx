'use client';

import { Copy, RotateCw, X } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { BenchEquipment } from '@/engine/types';
import { labT } from '@/lib/i18n';
import { labInstrumentById, labInstrumentName, labInstrumentSize } from '@/lib/labInstruments';
import { cn } from '@/lib/utils';
import { EquipmentArt } from '@/components/physics/Equipment/art';

/**
 * A lab instrument standing on the chemistry worktop.
 *
 * Unlike a glassware station, an instrument has no readings to show, so it lands
 * on the bench as the instrument itself — the same artwork the physics lab uses —
 * with nothing but a small caption. No card, no badges, no text box.
 */
export function BenchInstrumentItem({
  item,
  locale,
  selected,
  dragging,
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
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, id: string) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
}) {
  const instrumentId = item.instrumentId ?? '';
  const instrument = labInstrumentById.get(instrumentId);
  if (!instrument) return null;
  const size = labInstrumentSize(instrumentId);
  const name = labInstrumentName(instrumentId, locale);

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
        transform: `rotate(${item.rotation}deg)`,
        zIndex: dragging ? 60 : selected ? 35 : 10,
        touchAction: 'none'
      }}
      className={cn('group cursor-grab select-none active:cursor-grabbing', dragging && 'opacity-90')}
      aria-label={name}
      title={`${name} · ${locale === 'bn' ? 'টেনে সরান' : 'drag to move'}`}
    >
      <div className="relative">
        <div
          className={cn(
            'rounded-xl transition',
            selected && 'ring-2 ring-physics-400/70 ring-offset-1 ring-offset-transparent'
          )}
        >
          <EquipmentArt
            equipmentId={instrumentId}
            p={instrument.defaultProperties ?? {}}
            bn={locale === 'bn'}
            live={false}
            detailed={size.width >= 76 && size.height >= 58}
          />
        </div>
        <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 w-max max-w-[160px] -translate-x-1/2 text-center text-[9px] font-black leading-tight text-[var(--ink)]/75">
          {name}
        </span>
      </div>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); onRemove(item.id); }}
        className="absolute -right-1.5 -top-1.5 z-20 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100"
        aria-label={`${labT(locale, 'action.remove')} ${name}`}
        title={labT(locale, 'action.remove')}
      >
        <X size={13} />
      </button>

      {selected && (
        <div className="absolute -top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-[var(--line)] bg-white p-0.5 shadow-card">
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onDuplicate(item.id); }} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={labT(locale, 'bench.duplicate')} title={labT(locale, 'bench.duplicate')}><Copy size={12} /></button>
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRotate(item.id); }} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={labT(locale, 'bench.rotate')} title={labT(locale, 'bench.rotate')}><RotateCw size={12} /></button>
        </div>
      )}
    </div>
  );
}
