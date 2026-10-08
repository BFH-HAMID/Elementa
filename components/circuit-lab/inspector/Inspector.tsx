'use client';

/**
 * Inspector: property editor, datasheet-style info card (description, pinout,
 * ratings), wire colour, and the sketch editor for microcontroller boards.
 */

import { RotateCw, FlipHorizontal2, Copy, Trash2 } from 'lucide-react';
import { useCircuitStore } from '@/store/circuitStore';
import { getPart } from '../parts/registry';
import { WIRE_COLORS, formatSI } from '../parts/renderers';
import { CodeEditor } from '../panels/CodeEditor';
import { useCircuitI18n } from '../lib/i18n';
import { cn } from '@/lib/utils';
import type { PlacedComponent, PlacedWire, PropDef, WireColor } from '../types';

function fieldValue(v: unknown): string {
  return v === undefined || v === null ? '' : String(v);
}

function PropField({ def, comp, onChange }: { def: PropDef; comp: PlacedComponent; onChange: (key: string, v: string | number | boolean) => void }) {
  const raw = comp.props[def.key];
  const id = `prop-${comp.id}-${def.key}`;
  if (def.type === 'boolean') {
    return (
      <label className="flex items-center justify-between gap-3 py-1 text-sm">
        <span className="text-ink">{def.label}</span>
        <input id={id} type="checkbox" checked={Boolean(raw)} onChange={(e) => onChange(def.key, e.target.checked)} className="h-4 w-4 accent-physics-600" />
      </label>
    );
  }
  if (def.type === 'select') {
    return (
      <label className="flex items-center justify-between gap-3 py-1 text-sm">
        <span className="text-ink">{def.label}</span>
        <select id={id} value={fieldValue(raw)} onChange={(e) => onChange(def.key, e.target.value)} className="input max-w-[60%] text-sm">
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (def.type === 'text') {
    return (
      <label className="flex flex-col gap-1 py-1 text-sm">
        <span className="text-ink">{def.label}</span>
        <input id={id} type="text" value={fieldValue(raw)} onChange={(e) => onChange(def.key, e.target.value)} className="input text-sm" maxLength={32} />
      </label>
    );
  }
  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-ink">
        {def.label}
        {typeof raw === 'number' && def.unit ? <span className="ml-1 text-xs text-muted">({formatSI(raw, def.unit)})</span> : null}
      </span>
      <span className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={def.min}
          max={def.max}
          step={def.step ?? 'any'}
          value={fieldValue(raw)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (e.target.value !== '' && Number.isFinite(n)) onChange(def.key, n);
          }}
          className="input w-28 text-right text-sm tabular-nums"
        />
        {def.unit ? <span className="w-8 text-xs text-muted">{def.unit}</span> : null}
      </span>
    </label>
  );
}

export function Inspector() {
  const { t, isBangla } = useCircuitI18n();
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const selectedComps = useCircuitStore((s) => s.selectedComps);
  const selectedWires = useCircuitStore((s) => s.selectedWires);
  const errors = useCircuitStore((s) => s.simErrors);
  const frame = useCircuitStore((s) => s.frame);

  const comp = selectedComps.length === 1 ? components.find((c) => c.id === selectedComps[0]) : undefined;
  const wire = selectedComps.length === 0 && selectedWires.length === 1 ? wires.find((w) => w.id === selectedWires[0]) : undefined;
  const def = comp ? getPart(comp.partId) : undefined;
  const sim = comp ? frame?.components[comp.id] : undefined;

  if (!comp && !wire) {
    return (
      <div className="space-y-3 text-sm text-muted">
        <p>{t('noSelection')}</p>
        <p className="text-xs">{t('wireHint')}</p>
        {selectedComps.length > 1 ? <p className="text-xs">{selectedComps.length} selected — rotate, flip, duplicate or delete them together.</p> : null}
      </div>
    );
  }

  if (wire) return <WireInspector wire={wire} />;
  if (!comp || !def) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{def.partNumber}</p>
        <h3 className="display-title text-lg text-ink">{def.name}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{def.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-secondary px-2.5 py-1.5 text-xs" onClick={() => useCircuitStore.getState().rotateSelection(1)}>
          <RotateCw className="mr-1 h-3.5 w-3.5" /> {t('rotate')} (R)
        </button>
        <button type="button" className="btn btn-secondary px-2.5 py-1.5 text-xs" onClick={() => useCircuitStore.getState().flipSelection()}>
          <FlipHorizontal2 className="mr-1 h-3.5 w-3.5" /> {t('flip')} (F)
        </button>
        <button type="button" className="btn btn-secondary px-2.5 py-1.5 text-xs" onClick={() => useCircuitStore.getState().duplicateSelection()}>
          <Copy className="mr-1 h-3.5 w-3.5" /> {t('duplicate')}
        </button>
        <button type="button" className="btn btn-secondary px-2.5 py-1.5 text-xs text-coral-700" onClick={() => useCircuitStore.getState().deleteSelection()}>
          <Trash2 className="mr-1 h-3.5 w-3.5" /> {t('delete')}
        </button>
      </div>

      {sim?.burnt ? <p className="rounded-xl bg-coral-50 p-2 text-xs text-coral-700 dark:bg-coral-900/20 dark:text-coral-200">{t('burnt')}: {sim.warnings?.[0] ?? ''}</p> : null}

      {def.props.length > 0 ? (
        <section aria-labelledby="props-heading">
          <h4 id="props-heading" className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t('properties')}</h4>
          <div className="divide-y divide-line/60 rounded-xl border border-line px-3">
            {def.props.map((p) => (
              <PropField
                key={p.key}
                def={p}
                comp={comp}
                onChange={(key, v) => {
                  if (p.type === 'text' || p.type === 'select' || p.type === 'boolean') useCircuitStore.getState().setProp(comp.id, key, v);
                  else {
                    const clamped = typeof v === 'number' ? Math.min(p.max ?? v, Math.max(p.min ?? v, v)) : v;
                    useCircuitStore.getState().setProp(comp.id, key, clamped);
                  }
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {def.category === 'boards' ? (
        <section aria-labelledby="sketch-heading" className="flex min-h-[260px] flex-col gap-2">
          <h4 id="sketch-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">{t('code')}</h4>
          <CodeEditor
            label={t('code')}
            value={comp.code ?? ''}
            onChange={(v) => useCircuitStore.getState().setCode(comp.id, v)}
            errors={errors.filter((e) => e.includes(def.name) || e.startsWith('Sketch'))}
          />
          <p className="text-xs text-muted">
            {isBangla
              ? 'Arduino-ধরনের C++ সাবসেট: pinMode, digitalWrite/Read, analogWrite/Read, delay, Serial, Servo, DHT, LiquidCrystal, Adafruit_SSD1306, pulseIn, tone।'
              : 'Arduino-style C++ subset: pinMode, digitalWrite/Read, analogWrite/Read, delay, Serial, Servo, DHT, LiquidCrystal, Adafruit_SSD1306, pulseIn, tone.'}
          </p>
          <p className="text-xs text-muted">{sim?.powered === false ? t('unpowered') : ''}</p>
        </section>
      ) : null}

      <section aria-labelledby="pinout-heading">
        <h4 id="pinout-heading" className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t('pinout')}</h4>
        <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded-xl border border-line p-2 text-xs">
          {def.pins.map((p) => (
            <li key={p.id} className="flex items-baseline gap-2">
              <span className={cn('w-14 shrink-0 font-mono text-[11px]', p.kind === 'gnd' ? 'text-ink' : p.kind === 'vcc' || p.kind === 'vin' ? 'text-coral-600' : 'text-brand')}>{p.label}</span>
              <span className="text-muted">{p.func ?? ''}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ratings-heading">
        <h4 id="ratings-heading" className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t('ratings')}</h4>
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted">
          {def.ratings.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WireInspector({ wire }: { wire: PlacedWire }) {
  const { t } = useCircuitI18n();
  const colors: WireColor[] = ['red', 'black', 'blue', 'green', 'yellow', 'white', 'orange', 'purple'];
  return (
    <div className="space-y-3">
      <h3 className="display-title text-lg text-ink">Wire</h3>
      <p className="text-xs text-muted">
        {wire.from ? `${wire.from.compId}·${wire.from.pinId}` : '—'} → {wire.to ? `${wire.to.compId}·${wire.to.pinId}` : '—'}
      </p>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t('wireColor')}</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={wire.color === c}
              onClick={() => useCircuitStore.getState().setWireColor(wire.id, c)}
              className={cn('h-7 w-7 rounded-full border-2', wire.color === c ? 'border-ink' : 'border-white/60')}
              style={{ background: WIRE_COLORS[c] }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary px-2.5 py-1.5 text-xs text-coral-700" onClick={() => useCircuitStore.getState().deleteWire(wire.id)}>
          {t('deleteWire')}
        </button>
      </div>
    </div>
  );
}
