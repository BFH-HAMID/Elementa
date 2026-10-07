'use client';

import React from 'react';
import type { BenchItem, ComponentCircuitResult } from '@/engine/physicsTypes';
import { equipmentById } from '@/lib/physicsData';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { RotateCw, Trash2, Sliders, Zap, Sun, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentRendererProps {
  item: BenchItem;
  circuitResult?: ComponentCircuitResult;
  isSelected: boolean;
  onSelect: () => void;
}

export function EquipmentRenderer({ item, circuitResult, isSelected, onSelect }: EquipmentRendererProps) {
  const { isBangla } = usePhysicsI18n();
  const def = equipmentById.get(item.equipmentId);
  const updateItemProperties = usePhysicsStore((s) => s.updateItemProperties);
  const removeItem = usePhysicsStore((s) => s.removeItem);
  const rotateItem = usePhysicsStore((s) => s.rotateItem);
  const startConnectingWire = usePhysicsStore((s) => s.startConnectingWire);
  const finishConnectingWire = usePhysicsStore((s) => s.finishConnectingWire);
  const connectingWireFrom = usePhysicsStore((s) => s.connectingWireFrom);
  const setMeasuringToolModal = usePhysicsStore((s) => s.setMeasuringToolModal);

  if (!def) return null;

  const width = def.width || 120;
  const height = def.height || 80;
  const props = item.properties || {};

  const handleTerminalClick = (e: React.MouseEvent, terminalId: string) => {
    e.stopPropagation();
    if (connectingWireFrom) {
      finishConnectingWire(item.id, terminalId);
    } else {
      startConnectingWire(item.id, terminalId);
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        left: item.x,
        top: item.y,
        width,
        height,
        transform: `rotate(${item.rotation}deg)`
      }}
      className={cn(
        'group absolute select-none rounded-2xl border bg-[var(--surface)] p-2 shadow-card transition-shadow cursor-grab active:cursor-grabbing',
        isSelected
          ? 'border-physics-500 ring-2 ring-physics-400/50 shadow-float z-30'
          : 'border-[var(--line)] hover:border-physics-300 dark:hover:border-physics-700 z-10'
      )}
    >
      {/* Component Title & Icon Header */}
      <div className="flex items-center justify-between gap-1 border-b border-[var(--line)]/60 pb-1 text-[10px] font-bold text-[var(--muted)]">
        <span className="truncate max-w-[90px] font-black text-[var(--ink)]">
          {isBangla ? def.name_bn : def.name_en}
        </span>
        {circuitResult?.burnedOut && (
          <span className="flex items-center gap-0.5 text-red-500 font-black animate-pulse" title="Burned Out!">
            <AlertTriangle size={10} />
          </span>
        )}
      </div>

      {/* Center Body Visual */}
      <div className="relative my-1 flex h-[calc(100%-28px)] items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-soft)] p-1">
        {/* Specific rendering per equipment type */}

        {/* Battery */}
        {item.equipmentId === 'battery-dc' && (
          <div className="flex flex-col items-center justify-center font-mono text-xs font-bold text-physics-700 dark:text-physics-300">
            <span className="text-sm font-black">{Number(props.voltage || 6)} V</span>
            <span className="text-[9px] text-[var(--muted)]">DC Cell</span>
          </div>
        )}

        {/* SPST Switch */}
        {item.equipmentId === 'switch-spst' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateItemProperties(item.id, { closed: !props.closed });
            }}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-lg px-2.5 font-mono text-[11px] font-black transition',
              props.closed
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-red-500/20 text-red-600 dark:text-red-400'
            )}
          >
            <Zap size={12} />
            {props.closed ? (isBangla ? 'বন্ধ (ON)' : 'ON') : (isBangla ? 'খোলা (OFF)' : 'OFF')}
          </button>
        )}

        {/* Resistor */}
        {item.equipmentId === 'resistor-fixed' && (
          <div className="flex flex-col items-center justify-center font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
            <span className="text-sm font-black">{Number(props.resistance || 100)} Ω</span>
            <span className="text-[9px] text-[var(--muted)]">{circuitResult?.current ? `${(circuitResult.current * 1000).toFixed(1)} mA` : '0 mA'}</span>
          </div>
        )}

        {/* Bulb */}
        {item.equipmentId === 'incandescent-bulb' && (
          <div className="relative flex flex-col items-center justify-center">
            <div
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition-all duration-300',
                circuitResult?.burnedOut
                  ? 'bg-neutral-800 text-neutral-500'
                  : (circuitResult?.power || 0) > 0.05
                  ? 'bg-amber-400 text-amber-950 shadow-[0_0_20px_#f59e0b]'
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
              )}
            >
              <Sun size={20} className={circuitResult?.burnedOut ? 'opacity-20' : ''} />
            </div>
            <span className="mt-1 font-mono text-[9px] font-bold text-[var(--muted)]">
              {circuitResult?.burnedOut ? 'BURNED' : `${(circuitResult?.power || 0).toFixed(1)} W`}
            </span>
          </div>
        )}

        {/* Ammeter / Voltmeter / Galvanometer */}
        {(item.equipmentId === 'ammeter-dc' || item.equipmentId === 'voltmeter-dc' || item.equipmentId === 'galvanometer') && (
          <div className="flex w-full flex-col items-center justify-center rounded-lg bg-neutral-900 p-1.5 font-mono text-emerald-400 shadow-inner">
            <span className="text-base font-black tracking-wider">
              {circuitResult?.displayReading !== undefined ? circuitResult.displayReading : 0.0}
              <span className="ml-1 text-[10px] text-emerald-300">{circuitResult?.displayUnit || (item.equipmentId === 'ammeter-dc' ? 'A' : 'V')}</span>
            </span>
            {circuitResult?.polarityError && (
              <span className="text-[8px] font-bold text-red-400">POLARITY ERR</span>
            )}
          </div>
        )}

        {/* Rheostat */}
        {item.equipmentId === 'rheostat' && (
          <div className="flex w-full flex-col items-center gap-1 p-1">
            <div className="flex w-full justify-between font-mono text-[10px] font-bold text-[var(--muted)]">
              <span>Slider</span>
              <span className="text-physics-600">{Number(props.sliderPosition || 50)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Number(props.sliderPosition || 50)}
              onChange={(e) => updateItemProperties(item.id, { sliderPosition: parseFloat(e.target.value) })}
              className="w-full accent-physics-600 h-1.5"
            />
          </div>
        )}

        {/* Measuring Tool Card with Modal Trigger */}
        {(item.equipmentId === 'vernier-caliper' || item.equipmentId === 'screw-gauge') && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMeasuringToolModal(item.equipmentId as any);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-physics-600 px-2.5 py-1.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-physics-700"
          >
            <Sliders size={13} />
            {isBangla ? 'স্কেল পরিদর্শন' : 'Inspect Scale'}
          </button>
        )}

        {/* Default fallback */}
        {!['battery-dc', 'switch-spst', 'resistor-fixed', 'incandescent-bulb', 'ammeter-dc', 'voltmeter-dc', 'galvanometer', 'rheostat', 'vernier-caliper', 'screw-gauge'].includes(item.equipmentId) && (
          <div className="flex flex-col items-center justify-center font-mono text-[11px] font-bold text-physics-700 dark:text-physics-300">
            <span>{def.icon || '🔬'}</span>
          </div>
        )}
      </div>

      {/* Interactive Terminals Pins */}
      {def.terminals?.map((term) => {
        const isConnectingThis = connectingWireFrom?.itemId === item.id && connectingWireFrom?.terminalId === term.id;
        return (
          <button
            key={term.id}
            type="button"
            onClick={(e) => handleTerminalClick(e, term.id)}
            title={`Terminal: ${term.name} (${term.polarity})`}
            style={{
              left: `${term.x}%`,
              top: `${term.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            className={cn(
              'absolute z-40 grid h-4 w-4 place-items-center rounded-full border-2 shadow-sm transition hover:scale-125',
              term.polarity === 'positive'
                ? 'border-white bg-red-600 text-white'
                : term.polarity === 'negative' || term.polarity === 'ground'
                ? 'border-white bg-neutral-900 text-white'
                : 'border-white bg-amber-500 text-white',
              isConnectingThis && 'animate-ping ring-4 ring-physics-400'
            )}
          >
            <span className="text-[7px] font-black leading-none">{term.name}</span>
          </button>
        );
      })}

      {/* Floating Action Controls on Selection */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-float">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }}
            className="btn-ghost rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--ink)]"
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
            className="btn-ghost rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Delete Item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
