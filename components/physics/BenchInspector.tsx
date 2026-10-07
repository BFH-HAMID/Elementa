'use client';

import React from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { equipmentById } from '@/lib/physicsData';
import { getPorts, isLinkWire } from '@/lib/physicsBench';
import { equipmentIcon } from './Equipment/EquipmentRenderer';
import { Cable, CircleDot, Link2, MousePointer2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.001 && value !== 0)) return value.toExponential(2);
  return Number(value.toFixed(digits)).toString();
}

/**
 * The strip under the workbench canvas: edits the selected tool's properties,
 * shows its live electrical readings and lists what it's connected to.
 */
export function BenchInspector() {
  const { isBangla } = usePhysicsI18n();
  const items = usePhysicsStore((s) => s.items);
  const wires = usePhysicsStore((s) => s.wires);
  const selectedItemId = usePhysicsStore((s) => s.selectedItemId);
  const selectedWireId = usePhysicsStore((s) => s.selectedWireId);
  const circuitResult = usePhysicsStore((s) => s.circuitResult);
  const updateItemProperties = usePhysicsStore((s) => s.updateItemProperties);
  const removeWire = usePhysicsStore((s) => s.removeWire);
  const selectItem = usePhysicsStore((s) => s.selectItem);

  const item = selectedItemId ? items.find((it) => it.id === selectedItemId) : undefined;
  const def = item ? equipmentById.get(item.equipmentId) : undefined;
  const wire = selectedWireId ? wires.find((w) => w.id === selectedWireId) : undefined;

  const electricalWires = wires.filter((w) => !isLinkWire(w)).length;
  const linkWires = wires.length - electricalWires;

  const nameOf = (id: string) => {
    const it = items.find((x) => x.id === id);
    const d = it ? equipmentById.get(it.equipmentId) : undefined;
    return d ? (isBangla ? d.name_bn : d.name_en) : '?';
  };
  const portName = (itemId: string, terminalId: string) => {
    const it = items.find((x) => x.id === itemId);
    const port = getPorts(it ? equipmentById.get(it.equipmentId) : undefined).find((p) => p.id === terminalId);
    if (!port) return terminalId;
    return port.id.startsWith('link') ? (isBangla ? 'সংযোগ' : 'link') : port.name;
  };

  // ── Nothing selected: bench summary ──
  if (!item || !def) {
    if (wire) {
      const link = isLinkWire(wire);
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold">
          <div className="flex items-center gap-2 text-[var(--ink)]">
            {link ? <Link2 size={15} className="text-emerald-600" /> : <Cable size={15} className="text-physics-600" />}
            <span className="font-black">{link ? (isBangla ? 'যান্ত্রিক সংযোগ' : 'Link') : isBangla ? 'তার' : 'Wire'}:</span>
            <span>
              {nameOf(wire.fromItemId)} <span className="text-[var(--muted)]">({portName(wire.fromItemId, wire.fromTerminalId)})</span> →{' '}
              {nameOf(wire.toItemId)} <span className="text-[var(--muted)]">({portName(wire.toItemId, wire.toTerminalId)})</span>
            </span>
          </div>
          <button type="button" onClick={() => removeWire(wire.id)} className="rounded-lg border border-red-200 px-2.5 py-1 font-black text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40">
            {isBangla ? 'মুছুন' : 'Delete'}
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <Wrench size={14} className="text-physics-600" />
          {items.length} {isBangla ? 'যন্ত্র' : items.length === 1 ? 'tool' : 'tools'}
        </span>
        <span className="flex items-center gap-1.5">
          <Cable size={14} className="text-physics-600" />
          {electricalWires} {isBangla ? 'তার' : electricalWires === 1 ? 'wire' : 'wires'}
        </span>
        <span className="flex items-center gap-1.5">
          <Link2 size={14} className="text-emerald-600" />
          {linkWires} {isBangla ? 'যান্ত্রিক সংযোগ' : linkWires === 1 ? 'link' : 'links'}
        </span>
        <span className={cn('flex items-center gap-1.5', circuitResult.isOpenCircuit ? '' : 'text-emerald-600 dark:text-emerald-400')}>
          <CircleDot size={14} />
          {circuitResult.isOpenCircuit
            ? isBangla ? 'বর্তনী খোলা' : 'Circuit open'
            : isBangla ? 'বর্তনী সম্পূর্ণ — কারেন্ট চলছে' : 'Circuit closed — current flowing'}
        </span>
        <span className="ml-auto hidden items-center gap-1.5 lg:flex">
          <MousePointer2 size={13} />
          {isBangla ? 'যন্ত্রে ক্লিক করলে এখানে তার মান পরিবর্তন করা যাবে' : 'Select a tool to edit its values here'}
        </span>
      </div>
    );
  }

  // ── A tool is selected ──
  const Icon = equipmentIcon(def.icon);
  const result = circuitResult.componentResults[item.id];
  const props = item.properties || {};
  const connections = wires.filter((w) => w.fromItemId === item.id || w.toItemId === item.id);

  return (
    <div className="grid gap-3 border-t border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="min-w-0">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-physics-600 dark:text-physics-300">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[var(--ink)]">{isBangla ? def.name_bn : def.name_en}</p>
            <p className="line-clamp-2 text-[11px] font-bold leading-4 text-[var(--muted)]">{isBangla ? def.description_bn : def.description_en}</p>
          </div>
        </div>

        {result && (Math.abs(result.current) > 1e-9 || Math.abs(result.voltageDrop) > 1e-9) && (
          <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px] font-black">
            <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-physics-700 dark:text-physics-300">V = {formatNumber(result.voltageDrop)} V</span>
            <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-physics-700 dark:text-physics-300">I = {formatNumber(result.current)} A</span>
            <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-physics-700 dark:text-physics-300">P = {formatNumber(result.power)} W</span>
          </div>
        )}

        <div className="mt-2 text-[11px] font-bold text-[var(--muted)]">
          {connections.length === 0 ? (
            <span>{isBangla ? 'এখনো কোনো সংযোগ নেই — বিন্দু থেকে টেনে অন্য যন্ত্রে ছাড়ুন।' : 'Not connected yet — drag from one of its dots to another tool.'}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {connections.map((w) => {
                const otherId = w.fromItemId === item.id ? w.toItemId : w.fromItemId;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => selectItem(otherId)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 hover:border-physics-300"
                  >
                    {isLinkWire(w) ? <Link2 size={11} className="text-emerald-600" /> : <Cable size={11} className="text-physics-600" />}
                    {nameOf(otherId)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {def.propertySchema.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {def.propertySchema.map((field) => {
            const label = isBangla ? field.name_bn : field.name_en;
            const unit = (isBangla ? field.unit_bn : undefined) || field.unit || '';
            const value = props[field.key] ?? field.default;
            if (field.type === 'boolean') {
              return (
                <label key={field.key} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-black text-[var(--ink)]">
                  <span className="truncate">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => updateItemProperties(item.id, { [field.key]: e.target.checked })}
                    className="h-4 w-4 accent-physics-600"
                  />
                </label>
              );
            }
            if (field.type === 'select' && field.options) {
              return (
                <label key={field.key} className="flex flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-black text-[var(--ink)]">
                  <span className="truncate">{label}</span>
                  <select
                    value={String(value)}
                    onChange={(e) => updateItemProperties(item.id, { [field.key]: e.target.value })}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-1.5 py-1 text-[11px] font-bold"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isBangla ? opt.label_bn : opt.label_en}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            if (field.type === 'number') {
              const num = Number(value);
              const min = field.min ?? 0;
              const max = field.max ?? Math.max(100, num * 2);
              const step = field.step ?? (max - min) / 100;
              return (
                <label key={field.key} className="flex flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-black text-[var(--ink)]">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{label}</span>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        value={Number.isFinite(num) ? num : 0}
                        min={min}
                        max={max}
                        step={step}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v)) updateItemProperties(item.id, { [field.key]: Math.max(min, Math.min(max, v)) });
                        }}
                        className="w-16 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-1.5 py-0.5 text-right font-mono text-[11px]"
                      />
                      <span className="text-[10px] text-[var(--muted)]">{unit}</span>
                    </span>
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={Number.isFinite(num) ? num : min}
                    onChange={(e) => updateItemProperties(item.id, { [field.key]: parseFloat(e.target.value) })}
                    className="h-1.5 w-full accent-physics-600"
                  />
                </label>
              );
            }
            return (
              <label key={field.key} className="flex flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] font-black text-[var(--ink)]">
                <span className="truncate">{label}</span>
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => updateItemProperties(item.id, { [field.key]: e.target.value })}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-1.5 py-1 text-[11px] font-bold"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
