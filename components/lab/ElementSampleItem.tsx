'use client';

import { Copy, Move, X } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ElementSample } from '@/engine/types';
import { labT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SAMPLE_TINT: Record<string, string> = {
  'alkali-metal': '#e58c90',
  'alkaline-earth': '#dba565',
  'transition-metal': '#d5ac58',
  'post-transition': '#94a3b8',
  metalloid: '#57a99e',
  nonmetal: '#6eaa84',
  halogen: '#49a4b8',
  'noble-gas': '#9d83c4',
  lanthanide: '#c27bb7',
  actinide: '#a77cc0'
};

export function ElementSampleItem({
  sample,
  locale,
  selected,
  dragging,
  onPointerDown,
  onSelect,
  onRemove,
  onDuplicate
}: {
  sample: ElementSample;
  locale: 'bn' | 'en';
  selected: boolean;
  dragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, id: string) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const { element } = sample;
  const tint = SAMPLE_TINT[element.category] ?? '#7c92a8';
  const name = locale === 'bn' ? element.name_bn : element.name_en;

  return (
    <div
      data-bench-item={`element:${sample.id}`}
      onPointerDown={(event) => onPointerDown(event, sample.id)}
      onClick={() => onSelect(sample.id)}
      style={{ position: 'absolute', left: sample.x, top: sample.y, width: 112, zIndex: dragging ? 65 : selected ? 40 : 12, touchAction: 'none' }}
      className={cn('group cursor-grab select-none active:cursor-grabbing', dragging && 'opacity-90')}
      aria-label={`${name} sample`}
      title={`${name} · ${locale === 'bn' ? 'টেনে সরান' : 'drag to move'}`}
    >
      <div className={cn(
        'relative rounded-2xl border bg-white/90 px-2 pb-2 pt-3 shadow-[0_8px_18px_rgba(30,41,59,.16)] transition',
        selected ? 'border-chemistry-500 shadow-[0_0_0_3px_rgba(14,165,233,.18),0_12px_24px_rgba(15,23,42,.18)]' : 'border-white/90 group-hover:shadow-[0_12px_24px_rgba(30,41,59,.2)]'
      )}>
        <div className="absolute left-2 top-2 flex items-center gap-1 text-slate-400" aria-hidden="true">
          <Move size={11} />
          <span className="text-[8px] font-black uppercase tracking-wider">{locale === 'bn' ? 'সরান' : 'move'}</span>
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); onRemove(sample.id); }}
          className="absolute right-1 top-1 z-20 grid h-6 w-6 place-items-center rounded-lg bg-white/90 text-slate-500 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100"
          aria-label={`${labT(locale, 'action.remove')} ${name}`}
          title={labT(locale, 'action.remove')}
        >
          <X size={13} />
        </button>

        <div className="relative mx-auto mt-5 grid h-[58px] w-[80px] place-items-center">
          <svg viewBox="0 0 100 62" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id={`sample-glass-${sample.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="1" stopColor="#9fb9ca" stopOpacity="0.42" />
              </linearGradient>
              <radialGradient id={`sample-tint-${sample.id}`} cx="50%" cy="35%" r="70%">
                <stop offset="0" stopColor={tint} stopOpacity="0.6" />
                <stop offset="1" stopColor={tint} stopOpacity="0.08" />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="37" rx="39" ry="13" fill={`url(#sample-tint-${sample.id})`} stroke="#6f8798" strokeOpacity=".72" strokeWidth="2" />
            <path d="M11 35 Q50 54 89 35" fill="none" stroke={`url(#sample-glass-${sample.id})`} strokeWidth="6" />
            <ellipse cx="50" cy="34" rx="39" ry="12" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
            {element.state === 'solid' ? (
              <g fill={tint} stroke="#ffffff" strokeOpacity=".8" strokeWidth="1.5">
                <circle cx="39" cy="32" r="5" /><circle cx="50" cy="29" r="6" /><circle cx="61" cy="33" r="4" />
              </g>
            ) : (
              <g fill={tint} fillOpacity=".65" stroke="#ffffff" strokeOpacity=".8" strokeWidth="1.4">
                <circle cx="39" cy="31" r="4" /><circle cx="50" cy="28" r="5" /><circle cx="61" cy="32" r="4" />
              </g>
            )}
          </svg>
          <span className="relative z-10 -mt-2 font-mono text-[12px] font-black text-slate-800" style={{ textShadow: '0 1px 3px rgba(255,255,255,.85)' }}>{element.symbol}</span>
        </div>

        <div className="mt-1 text-center">
          <p className="truncate text-[10px] font-extrabold leading-tight text-slate-700">{name}</p>
          <p className="mt-0.5 font-mono text-[8px] font-bold text-slate-500">Z {element.z} · {element.mass} u</p>
          {element.radioactive && <p className="text-[8px] font-black text-rose-600">☢ {locale === 'bn' ? 'তেজস্ক্রিয়' : 'radioactive'}</p>}
        </div>

        {selected && (
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onDuplicate(sample.id); }} className="absolute -bottom-3 left-1/2 z-30 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border border-[var(--line)] bg-white text-slate-600 shadow-card hover:bg-slate-100" aria-label={labT(locale, 'bench.duplicate')} title={labT(locale, 'bench.duplicate')}>
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
