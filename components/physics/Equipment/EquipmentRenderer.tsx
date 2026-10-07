'use client';

import React from 'react';
import type { BenchItem, ComponentCircuitResult, EquipmentDef } from '@/engine/physicsTypes';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import {
  Activity,
  AlertTriangle,
  AlignJustify,
  Anchor,
  BarChart2,
  Battery,
  Box,
  Circle,
  Clock,
  Compass,
  Cpu,
  Crosshair,
  Database,
  Disc,
  FlaskConical,
  Flame,
  Gauge,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Grid3x3,
  Layers,
  Loader,
  Magnet,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Radio,
  Repeat,
  Scale,
  Share2,
  Shield,
  Sliders,
  Square,
  Sun,
  Thermometer,
  ToggleRight,
  TrendingUp,
  Triangle,
  Truck,
  Tv,
  Zap,
  ZoomIn,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Maps the `icon` names used in data/equipment.json to Lucide icons. */
export const EQUIPMENT_ICONS: Record<string, LucideIcon> = {
  battery: Battery,
  activity: Activity,
  sliders: Sliders,
  'toggle-right': ToggleRight,
  radio: Radio,
  'git-branch': GitBranch,
  'minimize-2': Minimize2,
  box: Box,
  'align-justify': AlignJustify,
  'git-pull-request': GitPullRequest,
  grid: Grid3x3,
  sun: Sun,
  gauge: Gauge,
  compass: Compass,
  cpu: Cpu,
  pause: Pause,
  zap: Zap,
  play: Play,
  'share-2': Share2,
  repeat: Repeat,
  magnet: Magnet,
  disc: Disc,
  'maximize-2': Maximize2,
  circle: Circle,
  square: Square,
  layers: Layers,
  triangle: Triangle,
  loader: Loader,
  database: Database,
  'trending-up': TrendingUp,
  truck: Truck,
  anchor: Anchor,
  scale: Scale,
  crosshair: Crosshair,
  'git-commit': GitCommitHorizontal,
  thermometer: Thermometer,
  flame: Flame,
  music: Music,
  'bar-chart-2': BarChart2,
  tv: Tv,
  clock: Clock,
  'zoom-in': ZoomIn,
  shield: Shield,
  'alert-triangle': AlertTriangle,
  bottle: FlaskConical
};

export function equipmentIcon(name: string | undefined): LucideIcon {
  return (name && EQUIPMENT_ICONS[name]) || FlaskConical;
}

interface EquipmentRendererProps {
  item: BenchItem;
  def: EquipmentDef;
  circuitResult?: ComponentCircuitResult;
  isSelected: boolean;
  isDragging?: boolean;
  isConnectTarget?: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * The visual card for one tool on the workbench. Ports, wires and the
 * selection toolbar are drawn by the Workbench in overlay layers, so this
 * component only renders the body. Interactive controls inside the body are
 * marked `data-no-drag` so using them never starts a drag.
 */
export function EquipmentRenderer({
  item,
  def,
  circuitResult,
  isSelected,
  isDragging,
  isConnectTarget,
  onPointerDown
}: EquipmentRendererProps) {
  const { isBangla } = usePhysicsI18n();
  const updateItemProperties = usePhysicsStore((s) => s.updateItemProperties);
  const setMeasuringToolModal = usePhysicsStore((s) => s.setMeasuringToolModal);

  const width = def.width || 120;
  const height = def.height || 80;
  const props = item.properties || {};
  const Icon = equipmentIcon(def.icon);
  const compact = height < 64;
  // Narrow tools (lenses, mirrors, screens…) show their full name as a caption under the card.
  const captionBelow = width < 96;
  const name = isBangla ? def.name_bn : def.name_en;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  let body: React.ReactNode;
  switch (item.equipmentId) {
    case 'battery-dc':
      body = (
        <div className="flex flex-col items-center leading-none font-mono font-black text-physics-700 dark:text-physics-200">
          <span className="text-sm">{Number(props.voltage ?? 6)} V</span>
          {!compact && <span className="mt-0.5 text-[8px] font-bold text-[var(--muted)]">DC</span>}
        </div>
      );
      break;
    case 'switch-spst':
    case 'tap-key':
      body = (
        <button
          type="button"
          data-no-drag
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation();
            updateItemProperties(item.id, { closed: !props.closed });
          }}
          className={cn(
            'flex h-6 items-center gap-1 rounded-md px-2 font-mono text-[10px] font-black transition',
            props.closed ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-500/15 text-red-600 dark:text-red-300'
          )}
        >
          <Zap size={11} />
          {props.closed ? 'ON' : 'OFF'}
        </button>
      );
      break;
    case 'resistor-fixed':
      body = (
        <div className="flex flex-col items-center leading-none font-mono font-black text-amber-700 dark:text-amber-300">
          <span className="text-xs">{Number(props.resistance ?? 100)} Ω</span>
          <span className="mt-0.5 text-[8px] font-bold text-[var(--muted)]">
            {circuitResult?.current ? `${(circuitResult.current * 1000).toFixed(1)} mA` : '0 mA'}
          </span>
        </div>
      );
      break;
    case 'incandescent-bulb':
    case 'led': {
      const lit = !circuitResult?.burnedOut && (circuitResult?.power || 0) > 0.02;
      body = (
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'grid h-8 w-8 place-items-center rounded-full transition-all duration-300',
              circuitResult?.burnedOut
                ? 'bg-neutral-800 text-neutral-500'
                : lit
                ? 'bg-amber-400 text-amber-950 shadow-[0_0_22px_#f59e0b]'
                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
            )}
          >
            <Sun size={18} />
          </div>
          <span className="mt-0.5 font-mono text-[8px] font-bold text-[var(--muted)]">
            {circuitResult?.burnedOut ? 'BURNED' : `${(circuitResult?.power || 0).toFixed(2)} W`}
          </span>
        </div>
      );
      break;
    }
    case 'ammeter-dc':
    case 'voltmeter-dc':
    case 'galvanometer':
    case 'digital-multimeter':
      body = (
        <div className="flex w-full flex-col items-center rounded-md bg-neutral-900 px-1 py-1 font-mono text-emerald-400 shadow-inner">
          <span className="text-sm font-black tracking-wider leading-none">
            {circuitResult?.displayReading !== undefined ? circuitResult.displayReading : '0.0'}
            <span className="ml-0.5 text-[9px] text-emerald-300">
              {circuitResult?.displayUnit || (item.equipmentId === 'ammeter-dc' ? 'A' : item.equipmentId === 'galvanometer' ? 'div' : 'V')}
            </span>
          </span>
          {circuitResult?.polarityError && <span className="text-[7px] font-bold text-red-400">POLARITY</span>}
        </div>
      );
      break;
    case 'rheostat':
      body = (
        <div className="flex w-full flex-col gap-0.5 px-1" data-no-drag onPointerDown={stop}>
          <div className="flex justify-between text-[9px] font-bold text-[var(--muted)]">
            <span>{isBangla ? 'স্লাইডার' : 'Slider'}</span>
            <span className="font-mono text-physics-600 dark:text-physics-300">{Number(props.sliderPosition ?? 50)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Number(props.sliderPosition ?? 50)}
            onChange={(e) => updateItemProperties(item.id, { sliderPosition: parseFloat(e.target.value) })}
            className="h-1.5 w-full accent-physics-600"
            aria-label="Rheostat slider"
          />
        </div>
      );
      break;
    case 'vernier-caliper':
    case 'screw-gauge-micrometer':
      body = (
        <button
          type="button"
          data-no-drag
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation();
            setMeasuringToolModal(item.equipmentId === 'screw-gauge-micrometer' ? 'screw-gauge' : 'vernier-caliper');
          }}
          className="flex items-center gap-1 rounded-md bg-physics-600 px-2 py-1 text-[10px] font-black text-white shadow-sm hover:bg-physics-700"
        >
          <Sliders size={11} />
          {isBangla ? 'স্কেল দেখুন' : 'Inspect'}
        </button>
      );
      break;
    default:
      body = (
        <Icon
          size={Math.max(16, Math.min(34, Math.min(width, height) * 0.32))}
          className="text-physics-600 dark:text-physics-300"
          strokeWidth={1.8}
        />
      );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      data-bench-item={item.id}
      style={{
        left: item.x,
        top: item.y,
        width,
        height,
        transform: `rotate(${item.rotation || 0}deg)`,
        touchAction: 'none'
      }}
      className={cn(
        'group absolute flex select-none flex-col rounded-xl border bg-[var(--surface)] p-1 shadow-card',
        isDragging ? 'cursor-grabbing shadow-float ring-2 ring-physics-400/60' : 'cursor-grab',
        isSelected
          ? 'z-20 border-physics-500 ring-2 ring-physics-400/50'
          : isConnectTarget
          ? 'z-10 border-emerald-500 ring-2 ring-emerald-400/60'
          : 'z-10 border-[var(--line)] hover:border-physics-300 dark:hover:border-physics-700'
      )}
      title={name}
    >
      {captionBelow ? (
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 w-max max-w-[140px] -translate-x-1/2 rounded-md bg-[var(--surface)]/90 px-1.5 py-0.5 text-center text-[9px] font-black leading-tight text-[var(--ink)] shadow-sm">
          {name}
        </span>
      ) : (
        <div className="flex h-4 shrink-0 items-center justify-between gap-1 px-0.5 text-[9px] font-black leading-none text-[var(--ink)]">
          <span className="truncate">{name}</span>
          {circuitResult?.burnedOut && <AlertTriangle size={10} className="shrink-0 animate-pulse text-red-500" />}
        </div>
      )}
      <div className={cn('relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-soft)] px-1', !captionBelow && 'mt-0.5')}>
        {body}
      </div>
    </div>
  );
}
