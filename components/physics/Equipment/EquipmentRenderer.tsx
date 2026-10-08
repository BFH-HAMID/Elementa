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
import { EquipmentArt } from './art';

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
 * One tool on the workbench.
 *
 * The body is a scaled, shaded illustration of the real instrument (see
 * `Equipment/art`), which reacts to the tool's live state: needles swing with
 * the solved current, filaments glow with the solved power, keys snap shut,
 * the rheostat slider and the caliper jaws are grabbed directly. Ports, wires
 * and the selection toolbar are drawn by the Workbench in overlay layers.
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

  const width = def.width || 120;
  const height = def.height || 80;
  const props = item.properties || {};
  // Narrow tools (lenses, mirrors, screens…) show their full name as a caption under the card.
  const captionBelow = width < 96;
  const name = isBangla ? def.name_bn : def.name_en;
  const compact = height < 56;

  /* Keys, switches and lasers are physical controls on the instrument itself. */
  const toggle = React.useCallback(() => {
    switch (item.equipmentId) {
      case 'switch-spst':
      case 'tap-key':
        updateItemProperties(item.id, { closed: !props.closed });
        break;
      case 'switch-spdt': {
        const order = ['1', '2', 'off'];
        const cur = typeof props.selectedPosition === 'string' ? props.selectedPosition : '1';
        updateItemProperties(item.id, { selectedPosition: order[(order.indexOf(cur) + 1) % order.length] });
        break;
      }
      default:
        break;
    }
  }, [item.equipmentId, item.id, props.closed, props.selectedPosition, updateItemProperties]);

  const setProp = React.useCallback(
    (key: string, value: number | boolean | string) => updateItemProperties(item.id, { [key]: value }),
    [item.id, updateItemProperties]
  );

  const interactiveToggle = item.equipmentId === 'switch-spst' || item.equipmentId === 'tap-key' || item.equipmentId === 'switch-spdt';

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
        'instrument-card group absolute select-none rounded-xl border transition-[box-shadow,border-color]',
        isDragging ? 'cursor-grabbing ring-2 ring-physics-400/60' : 'cursor-grab',
        isSelected
          ? 'z-20 border-physics-500 ring-2 ring-physics-400/50'
          : isConnectTarget
          ? 'z-10 border-emerald-500 ring-2 ring-emerald-400/60'
          : 'z-10 border-white/70 dark:border-white/25'
      )}
      title={name}
    >
      {/* Name plate: kept small so the instrument keeps the spotlight. */}
      {!captionBelow && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex items-center justify-between gap-1 px-1.5 pt-[3px] text-[8px] font-black uppercase leading-none tracking-wide text-slate-500/90">
          <span className="truncate">{name}</span>
          {circuitResult?.burnedOut && <AlertTriangle size={9} className="shrink-0 animate-pulse text-red-500" />}
        </div>
      )}

      {/* The instrument itself, filling the card. */}
      <div className={cn('absolute inset-x-0.5 bottom-0.5 top-4', compact && 'top-2')}>
        <EquipmentArt
          equipmentId={item.equipmentId}
          p={props}
          res={circuitResult}
          burned={item.burnedOut}
          bn={isBangla}
          live
          detailed={width >= 76 && height >= 58}
          onToggle={interactiveToggle ? toggle : undefined}
          setProp={setProp}
        />
      </div>

      {captionBelow && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 w-max max-w-[150px] -translate-x-1/2 rounded-md bg-[var(--surface)]/95 px-1.5 py-0.5 text-center text-[9px] font-black leading-tight text-[var(--ink)] shadow-sm">
          {name}
          {circuitResult?.burnedOut ? ' ⚠' : ''}
        </span>
      )}

      {interactiveToggle && (
        <span className="sr-only">{isBangla ? 'ট্যাপ করে সংযোগ বদলান' : 'Click to operate the switch'}</span>
      )}
    </div>
  );
}
