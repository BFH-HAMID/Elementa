'use client';

/**
 * Schematic view: the same circuit drawn as netlist-labelled schematic symbols.
 * Derived entirely from the bench state, so it stays in sync as parts and wires
 * change. Clicking a symbol selects the matching bench part (Shift adds to the
 * selection), hovering a pin highlights its whole net, and live node voltages
 * from the simulator appear on the net labels while a frame is available.
 */

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import type { SimFrame } from '../types';
import { layoutSchematic, STUB, type SchemItem, type SchemLayout, type SchemPin } from './layout';
import { useCircuitI18n } from '../lib/i18n';
import { cn } from '@/lib/utils';

export const SCHEMATIC_SVG_ID = 'circuit-schematic-svg';
const MARGIN = 24;

const NET_DOT = {
  gnd: 'fill-slate-500 dark:fill-slate-400',
  power: 'fill-orange-700 dark:fill-orange-300',
  signal: 'fill-physics-700 dark:fill-physics-200'
} as const;

const NET_TEXT = {
  gnd: 'fill-slate-500 dark:fill-slate-400',
  power: 'fill-orange-700 dark:fill-orange-300',
  signal: 'fill-physics-700 dark:fill-physics-200'
} as const;

const INK = 'stroke-[color:var(--ink)] dark:stroke-slate-100';
const MUTED = 'fill-[color:var(--muted)]';
const BG = 'fill-[#eef3f8] dark:fill-[#0c141d]';

export function fmtVolts(v: number): string {
  const abs = Math.abs(v);
  return `${abs >= 10 ? v.toFixed(1) : v.toFixed(2)} V`;
}

/** Glyph for two-terminal parts, drawn between the two pin tips. */
function TwoTerminalGlyph({ item }: { item: SchemItem }) {
  const sx0 = item.ax + STUB;
  const sx1 = item.bx - STUB;
  const cy = item.cy;
  const cx = (sx0 + sx1) / 2;
  const span = sx1 - sx0;
  const lead = { className: cn('fill-none', INK), strokeWidth: 1.6 };

  let glyph: React.ReactNode;
  switch (item.model) {
    case 'resistor': {
      const pts = [`M${sx0} ${cy}`];
      for (let k = 1; k <= 7; k++) pts.push(`L${sx0 + (k * span) / 8} ${cy + (k % 2 === 1 ? -5 : 5)}`);
      pts.push(`L${sx1} ${cy}`);
      glyph = <path d={pts.join(' ')} strokeLinejoin="round" {...lead} />;
      break;
    }
    case 'capacitor': {
      const right = item.polarized ? `M${cx + 3} ${cy - 9} Q${cx + 9} ${cy} ${cx + 3} ${cy + 9}` : `M${cx + 3} ${cy - 9} V${cy + 9}`;
      glyph = (
        <g className={cn('fill-none', INK)} strokeWidth={1.8}>
          <path d={`M${cx - 3} ${cy - 9} V${cy + 9}`} />
          <path d={right} />
          {item.polarized ? <text x={cx - 9} y={cy - 4} fontSize={9} className="fill-[color:var(--ink)] stroke-none dark:fill-slate-100">+</text> : null}
        </g>
      );
      break;
    }
    case 'inductor': {
      const r = span / 8;
      let d = `M${sx0} ${cy}`;
      for (let k = 0; k < 4; k++) d += ` a${r} ${r} 0 0 1 ${2 * r} 0`;
      glyph = <path d={d} strokeWidth={1.6} className={cn('fill-none', INK)} />;
      break;
    }
    case 'diode':
    case 'led': {
      glyph = (
        <g>
          <path d={`M${cx - 7} ${cy - 9} L${cx + 7} ${cy} L${cx - 7} ${cy + 9} Z`} strokeLinejoin="round" {...lead} />
          <path d={`M${cx + 7} ${cy - 9} V${cy + 9}`} {...lead} />
          {item.model === 'led' ? (
            <path d={`M${cx + 2} ${cy - 12} L${cx + 7} ${cy - 17} M${cx + 6} ${cy - 9} L${cx + 11} ${cy - 14}`} strokeWidth={1.2} className={cn('fill-none', INK)} />
          ) : null}
        </g>
      );
      break;
    }
    case 'switch': {
      glyph = (
        <g>
          <circle cx={cx - 10} cy={cy} r={2} strokeWidth={1.4} className={cn('fill-none', INK)} />
          <circle cx={cx + 10} cy={cy} r={2} strokeWidth={1.4} className={cn('fill-none', INK)} />
          <path d={`M${cx - 10} ${cy} L${cx + 9} ${cy - 10}`} {...lead} />
        </g>
      );
      break;
    }
    case 'source': {
      glyph = item.ac ? (
        <path d={`M${sx0} ${cy} q${span / 8} -10 ${span / 4} 0 t${span / 4} 0 t${span / 4} 0 t${span / 4} 0`} {...lead} />
      ) : (
        <g className={cn('fill-none', INK)} strokeWidth={1.8}>
          <path d={`M${cx - 6} ${cy - 10} V${cy + 10}`} />
          <path d={`M${cx - 1} ${cy - 5} V${cy + 5}`} />
          <path d={`M${cx + 4} ${cy - 10} V${cy + 10}`} />
          <path d={`M${cx + 9} ${cy - 5} V${cy + 5}`} />
        </g>
      );
      break;
    }
    default: {
      const tag = item.model === 'motor' ? 'M' : item.model === 'buzzer' ? 'BZ' : item.model === 'regulator' ? 'REG' : '';
      glyph = (
        <g>
          <rect x={sx0 + 6} y={cy - 9} width={Math.max(8, span - 12)} height={18} rx={3} strokeWidth={1.4} className={cn('fill-[color:var(--surface)]', INK)} />
          {tag ? (
            <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={9} className={MUTED}>
              {tag}
            </text>
          ) : null}
        </g>
      );
    }
  }
  return (
    <>
      <path d={`M${item.ax} ${cy} H${sx0} M${sx1} ${cy} H${item.bx}`} strokeWidth={1.6} className={cn('fill-none', INK)} />
      {glyph}
    </>
  );
}

function GroundGlyph({ pin }: { pin: SchemPin }) {
  const cx = pin.x;
  return (
    <g strokeWidth={1.6} className={cn('fill-none', INK)}>
      <path d={`M${cx} ${pin.y} V9`} />
      <path d={`M${cx - 10} 9 H${cx + 10} M${cx - 6} 13 H${cx + 6} M${cx - 2} 17 H${cx + 2}`} />
    </g>
  );
}

function PinMark({
  pin,
  kind,
  volts,
  highlighted,
  onHover
}: {
  pin: SchemPin;
  kind: SchemItem['kind'];
  volts: number | null;
  highlighted: boolean;
  onHover: (net: string | null) => void;
}) {
  const net = pin.net;
  const dot = net ? NET_DOT[net.cls] : 'fill-slate-400 dark:fill-slate-500';
  // Box symbols draw a short stub from the pin tip into the body.
  const stub = kind === 'box' ? (pin.side === 'left' ? `M${pin.x} ${pin.y} H${pin.x + STUB}` : `M${pin.x} ${pin.y} H${pin.x - STUB}`) : null;
  const netText = net ? (volts !== null ? `${net.name}  ${fmtVolts(volts)}` : net.name) : null;
  const tip = `${pin.label} — ${pin.func}${net ? ` · net ${net.name}` : ' · not connected'}${volts !== null ? ` · ${fmtVolts(volts)}` : ''}`;
  return (
    <g onMouseEnter={() => onHover(net?.name ?? null)} onMouseLeave={() => onHover(null)}>
      {stub ? (
        <path d={stub} fill="none" strokeWidth={net ? 1.6 : 1.1} strokeDasharray={net ? undefined : '3 3'} className={net ? INK : 'stroke-slate-400'} />
      ) : null}
      <circle cx={pin.x} cy={pin.y} r={highlighted ? 4 : 2.6} className={cn(dot, highlighted && 'stroke-[color:var(--ink)]')} strokeWidth={highlighted ? 1 : 0}>
        <title>{tip}</title>
      </circle>
      {kind === 'two' ? (
        <text x={pin.labelX} y={pin.labelY} textAnchor="middle" fontSize={9} className={MUTED}>
          {pin.label}
        </text>
      ) : null}
      {kind === 'box' ? (
        <text x={pin.labelX} y={pin.labelY + 1} textAnchor={pin.side === 'left' ? 'start' : 'end'} fontSize={9} className="fill-[color:var(--ink)] dark:fill-slate-200">
          {pin.label}
        </text>
      ) : null}
      {netText ? (
        <text
          x={pin.netX}
          y={pin.netY}
          textAnchor={pin.netAnchor}
          fontSize={10}
          fontWeight={net?.cls === 'signal' ? 500 : 600}
          className={cn(net ? NET_TEXT[net.cls] : '', highlighted && 'underline')}
        >
          {netText}
        </text>
      ) : null}
    </g>
  );
}

function ItemView({
  item,
  selected,
  voltsOf,
  hoverNet,
  onHover,
  onSelect
}: {
  item: SchemItem;
  selected: boolean;
  voltsOf: (pinId: string) => number | null;
  hoverNet: string | null;
  onHover: (net: string | null) => void;
  onSelect: (additive: boolean) => void;
}) {
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(e.shiftKey);
    }
  };
  const onClick = (e: MouseEvent<SVGGElement>) => {
    e.stopPropagation();
    onSelect(e.shiftKey);
  };
  return (
    <g
      transform={`translate(${item.x} ${item.y})`}
      role="button"
      tabIndex={0}
      aria-label={item.value ? `${item.name}, ${item.value}` : item.name}
      aria-pressed={selected}
      className="cursor-pointer"
      onClick={onClick}
      onKeyDown={onKey}
    >
      <title>{`${item.name} · ${item.partNumber}`}</title>
      <rect
        x={-6}
        y={-6}
        width={item.w + 12}
        height={item.h + 12}
        rx={8}
        fill="transparent"
        strokeWidth={selected ? 2 : 1}
        strokeDasharray={selected ? undefined : '4 3'}
        className={selected ? 'stroke-physics-500' : 'stroke-transparent hover:stroke-[color:var(--line)]'}
      />
      {item.kind === 'box' && item.body ? (
        <rect x={item.body.x} y={item.body.y} width={item.body.w} height={item.body.h} rx={6} strokeWidth={1.6} className={cn('fill-[color:var(--surface)]', INK)} />
      ) : null}
      {item.kind === 'two' ? <TwoTerminalGlyph item={item} /> : null}
      {item.kind === 'ground' && item.pins[0] ? <GroundGlyph pin={item.pins[0]} /> : null}
      {item.pins.map((pin) => (
        <PinMark
          key={pin.id}
          pin={pin}
          kind={item.kind}
          volts={voltsOf(pin.id)}
          highlighted={!!pin.net && pin.net.name === hoverNet}
          onHover={onHover}
        />
      ))}
      {item.kind !== 'ground' ? (
        <>
          <text x={item.titleX} y={item.titleY} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-[color:var(--ink)] dark:fill-slate-100">
            {item.name}
          </text>
          <text x={item.titleX} y={item.partY} textAnchor="middle" fontSize={9} className={MUTED}>
            {item.partNumber}
          </text>
        </>
      ) : null}
      {item.value ? (
        <text x={item.valueX} y={item.valueY} textAnchor="middle" fontSize={10} className="fill-physics-700 dark:fill-physics-100">
          {item.value}
        </text>
      ) : null}
    </g>
  );
}

/** Store-connected view: toolbar plus the canvas, with the layout memoised on parts and wires only. */
export function SchematicView({ frame }: { frame: SimFrame | null }) {
  const { t } = useCircuitI18n();
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const selected = useCircuitStore((s) => s.selectedComps);
  const zoom = useCircuitStore((s) => s.schematicZoom);
  const setZoom = useCircuitStore((s) => s.setSchematicZoom);

  // Topology only changes when parts or wires change, not on every drag tick.
  const layout = useMemo(() => layoutSchematic(components, wires), [components, wires]);
  const effective = zoom ?? 1;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted" role="toolbar" aria-label={t('schematicView')}>
        <button type="button" className="btn btn-secondary px-2.5 py-1 text-xs" onClick={() => setZoom(Math.min(3, effective * 1.25))} aria-label={t('zoomIn')}>
          +
        </button>
        <button type="button" className="btn btn-secondary px-2.5 py-1 text-xs" onClick={() => setZoom(Math.max(0.4, effective * 0.8))} aria-label={t('zoomOut')}>
          −
        </button>
        <button type="button" className="btn btn-secondary px-2.5 py-1 text-xs" onClick={() => setZoom(null)}>
          {t('fit')}
        </button>
        <span className="ml-auto">{t('schematicHint')}</span>
      </div>
      <div className="relative h-full min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-[#eef3f8] dark:bg-[#0c141d]">
        {layout.items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{t('schematicEmpty')}</p>
        ) : (
          <SchematicCanvas layout={layout} selected={selected} zoom={zoom} frame={frame} label={t('schematicView')} />
        )}
      </div>
    </div>
  );
}

/** Pure SVG canvas for a computed layout. No store access, so it renders anywhere. */
export function SchematicCanvas({
  layout,
  selected,
  zoom,
  frame,
  label
}: {
  layout: SchemLayout;
  selected: string[];
  zoom: number | null;
  frame: SimFrame | null;
  label: string;
}) {
  const [hoverNet, setHoverNet] = useState<string | null>(null);
  const vbW = layout.width + MARGIN * 2;
  const vbH = Math.max(layout.height, 1) + MARGIN * 2;
  const voltsFor = (compId: string) => (pinId: string) => {
    const v = frame?.components[compId]?.pinV?.[pinId];
    return typeof v === 'number' && isFinite(v) ? v : null;
  };
  return (
    <svg
      id={SCHEMATIC_SVG_ID}
      role="img"
      aria-label={label}
      viewBox={`${-MARGIN} ${-MARGIN} ${vbW} ${vbH}`}
      width={zoom === null ? '100%' : vbW * zoom}
      style={zoom === null ? { maxWidth: vbW * 2, display: 'block', margin: '0 auto' } : { display: 'block' }}
      className="text-ink"
      onClick={(e) => {
        if (e.target === e.currentTarget) useCircuitStore.getState().clearSelection();
      }}
    >
      <rect x={-MARGIN} y={-MARGIN} width={vbW} height={vbH} className={BG} />
      <g>
        {layout.items.map((item) => (
          <ItemView
            key={item.compId}
            item={item}
            selected={selected.includes(item.compId)}
            voltsOf={voltsFor(item.compId)}
            hoverNet={hoverNet}
            onHover={setHoverNet}
            onSelect={(additive) => useCircuitStore.getState().toggleSelect(item.compId, 'comp', additive)}
          />
        ))}
      </g>
    </svg>
  );
}
