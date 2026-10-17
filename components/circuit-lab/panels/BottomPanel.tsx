'use client';

/** Tabbed bottom panel: serial monitor, examples, bill of materials & netlist, circuit check, guide. */

import { useEffect, useMemo, useState } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import { EXAMPLE_PROJECTS } from '../projects/examples';
import { AdvancedProjectsPanel } from '../advanced/AdvancedProjectsPanel';
import { billOfMaterials, checkCircuit, netlist } from '../lib/analysis';
import { useCircuitI18n, type CircuitKey } from '../lib/i18n';
import { cn } from '@/lib/utils';

const TABS: { id: 'serial' | 'examples' | 'practical' | 'advanced' | 'analysis' | 'check' | 'guide'; key: CircuitKey }[] = [
  { id: 'serial', key: 'serial' },
  { id: 'examples', key: 'examples' },
  { id: 'practical', key: 'practical' },
  { id: 'advanced', key: 'advanced' },
  { id: 'analysis', key: 'analysis' },
  { id: 'check', key: 'check' },
  { id: 'guide', key: 'guide' }
];

export function BottomPanel() {
  const { t, locale } = useCircuitI18n();
  const tab = useCircuitStore((s) => s.bottomTab);
  const setTab = useCircuitStore((s) => s.setBottomTab);

  return (
    <section id="circuit-projects" aria-label={t('advanced')} className="card flex min-h-0 flex-col p-0">
      <div role="tablist" aria-label={t('serial')} className="flex flex-wrap gap-1 border-b border-[color:var(--line)] px-2 pt-2">
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            aria-controls={`panel-${x.id}`}
            id={`tab-${x.id}`}
            type="button"
            onClick={() => setTab(x.id)}
            className={cn('rounded-t-lg px-3 py-2 text-sm font-medium transition', tab === x.id ? 'bg-[color:var(--surface-soft)] text-[color:var(--ink)]' : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]')}
          >
            {t(x.key)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-h-0 flex-1 overflow-auto p-3 text-sm">
        {tab === 'serial' ? <SerialTab /> : null}
        {tab === 'examples' ? <ExamplesTab locale={locale} /> : null}
        {tab === 'practical' ? <PracticalTab locale={locale} /> : null}
        {tab === 'advanced' ? <AdvancedProjectsPanel /> : null}
        {tab === 'analysis' ? <AnalysisTab /> : null}
        {tab === 'check' ? <CheckTab /> : null}
        {tab === 'guide' ? <GuideTab /> : null}
      </div>
    </section>
  );
}

function SerialTab() {
  const { t } = useCircuitI18n();
  const serial = useCircuitStore((s) => s.serial);
  const errors = useCircuitStore((s) => s.simErrors);
  const clear = useCircuitStore((s) => s.clearSerial);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[color:var(--muted)]">{t('sendHint')}</p>
        <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={clear}>
          {t('clear')}
        </button>
      </div>
      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-xl bg-orange-50 p-2 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-200" role="status">
          {errors.slice(0, 8).map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      ) : null}
      <pre aria-live="polite" className="max-h-56 min-h-[120px] overflow-auto rounded-xl bg-[#0f1822] p-3 font-mono text-xs leading-5 text-emerald-200">
        {serial.length ? serial.join('\n') : '…'}
      </pre>
    </div>
  );
}

function ExamplesTab({ locale }: { locale: 'en' | 'bn' }) {
  const { t } = useCircuitI18n();
  const loadExample = useCircuitStore((s) => s.loadExample);
  const setBottomTab = useCircuitStore((s) => s.setBottomTab);
  const active = useCircuitStore((s) => s.activeExampleId);
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EXAMPLE_PROJECTS.map((ex) => (
        <article key={ex.id} className={cn('rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3', active === ex.id && 'ring-2 ring-physics-300')}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[color:var(--ink)]">{locale === 'bn' ? ex.title.bn : ex.title.en}</h3>
            <span className="pill shrink-0 text-[10px] uppercase">{ex.difficulty}</span>
          </div>
          <p className="mt-1 text-xs text-[color:var(--muted)]">{locale === 'bn' ? ex.summary.bn : ex.summary.en}</p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-[color:var(--brand)] dark:text-physics-200">{locale === 'bn' ? 'ধাপে ধাপে' : 'Step by step'}</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[color:var(--muted)]">
              {ex.steps.map((s, i) => (
                <li key={i}>{locale === 'bn' ? s.bn : s.en}</li>
              ))}
            </ol>
            <p className="mt-2 text-[color:var(--muted)]">{locale === 'bn' ? ex.explanation.bn : ex.explanation.en}</p>
          </details>
          <button type="button" className="btn btn-primary mt-3 w-full text-xs" onClick={() => { loadExample(ex.id); if (ex.practical) setBottomTab('practical'); }}>
            {locale === 'bn' ? 'এই উদাহরণ খুলুন' : 'Open example'}
          </button>
        </article>
      ))}
    </div>
  );
}

type CircuitReadingRow = { x: number; y: number; estimate: number };

function PracticalTab({ locale }: { locale: 'en' | 'bn' }) {
  const activeId = useCircuitStore((s) => s.activeExampleId);
  const components = useCircuitStore((s) => s.components);
  const frame = useCircuitStore((s) => s.frame);
  const running = useCircuitStore((s) => s.running);
  const setRunning = useCircuitStore((s) => s.setRunning);
  const setProp = useCircuitStore((s) => s.setProp);
  const project = useMemo(() => EXAMPLE_PROJECTS.find((entry) => entry.id === activeId), [activeId]);
  const practical = project?.practical;
  const [rows, setRows] = useState<CircuitReadingRow[]>([]);

  useEffect(() => setRows([]), [activeId]);

  const x = practical
    ? Number(components.find((component) => component.id === practical.control.componentId)?.props[practical.control.prop] ?? practical.control.values[0])
    : 0;
  let live: number | null = null;
  if (practical && frame) {
    if (practical.reading.kind === 'sourceCurrent') {
      const value = frame.sourceCurrents[practical.reading.componentId];
      if (typeof value === 'number' && Number.isFinite(value)) live = Math.abs(value) * practical.reading.scale;
    } else {
      const value = frame.components[practical.reading.componentId]?.pinV[practical.reading.pinId ?? ''];
      if (typeof value === 'number' && Number.isFinite(value)) live = value * practical.reading.scale;
    }
  }

  const estimates = rows.map((row) => row.estimate).filter(Number.isFinite);
  const result = estimates.length ? estimates.reduce((sum, value) => sum + value, 0) / estimates.length : null;
  const error = practical && result !== null && practical.result.expected !== 0
    ? (Math.abs(result - practical.result.expected) / Math.abs(practical.result.expected)) * 100
    : null;
  const good = Boolean(practical && error !== null && rows.length >= practical.control.values.length && error <= practical.result.tolerancePercent);

  if (!project || !practical) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-6 text-center text-[color:var(--muted)]">
        <p className="font-semibold text-[color:var(--ink)]">{locale === 'bn' ? 'একটি quantitative circuit practical খুলুন' : 'Open a quantitative circuit practical'}</p>
        <p className="mt-2 text-xs">{locale === 'bn' ? 'Examples tab-এর নতুন ৩০টি practical-এ live control, table, graph ও result validation আছে।' : 'The 30 new projects in Examples include a live control, table, graph and result validation.'}</p>
      </div>
    );
  }

  const capture = () => {
    if (live === null || !Number.isFinite(live) || live === 0) return;
    const estimate = practical.result.mode === 'resistance' ? x / (live / 1000) : live / x;
    if (!Number.isFinite(estimate)) return;
    setRows((current) => [...current.filter((row) => Math.abs(row.x - x) > 1e-9), { x, y: live, estimate }].sort((a, b) => a.x - b.x));
  };

  const graphPoints = (() => {
    if (rows.length === 0) return '';
    const minX = Math.min(...rows.map((row) => row.x));
    const maxX = Math.max(...rows.map((row) => row.x));
    const minY = Math.min(...rows.map((row) => row.y));
    const maxY = Math.max(...rows.map((row) => row.y));
    return rows
      .map((row) => {
        const gx = 35 + ((row.x - minX) / Math.max(maxX - minX, 1)) * 310;
        const gy = 112 - ((row.y - minY) / Math.max(maxY - minY, 1e-9)) * 88;
        return `${gx},${gy}`;
      })
      .join(' ');
  })();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">
      <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[color:var(--brand)]">{locale === 'bn' ? 'Full interactive practical' : 'Full interactive practical'}</p>
            <h3 className="mt-1 text-base font-bold text-[color:var(--ink)]">{locale === 'bn' ? project.title.bn : project.title.en}</h3>
            <p className="mt-1 text-xs text-[color:var(--muted)]">{practical.formula}</p>
          </div>
          <button type="button" className="btn btn-primary px-4 py-2 text-xs" onClick={() => setRunning(!running)}>{running ? (locale === 'bn' ? 'Stop' : 'Stop') : (locale === 'bn' ? 'Run' : 'Run')}</button>
        </div>

        <label className="mt-4 block text-xs font-semibold text-[color:var(--ink)]">
          {locale === 'bn' ? practical.control.bn : practical.control.en}: <span className="tabular-nums text-[color:var(--brand)]">{x} {practical.control.unit}</span>
          <input
            className="mt-2 w-full accent-[color:var(--brand)]"
            type="range"
            min={practical.control.min}
            max={practical.control.max}
            step={practical.control.step}
            value={x}
            onChange={(event) => setProp(practical.control.componentId, practical.control.prop, Number(event.target.value))}
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {practical.control.values.map((value) => (
            <button key={value} type="button" onClick={() => setProp(practical.control.componentId, practical.control.prop, value)} className={cn('rounded-lg border px-2 py-1 text-xs tabular-nums', x === value ? 'border-[color:var(--brand)] bg-physics-50 text-physics-800 dark:bg-physics-900/30 dark:text-physics-100' : 'border-[color:var(--line)]')}>{value} {practical.control.unit}</button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)]">{locale === 'bn' ? practical.reading.bn : practical.reading.en}</p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">{live === null ? '—' : live.toPrecision(6)} {practical.reading.unit}</p>
          </div>
          <div className={cn('rounded-xl border p-3', good ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[color:var(--line)] bg-[color:var(--surface)]')}>
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)]">{locale === 'bn' ? practical.result.bn : practical.result.en}</p>
            <p className="mt-1 font-mono text-xl font-bold text-[color:var(--ink)]">{result === null ? '—' : result.toPrecision(6)} {practical.result.unit}</p>
            <p className="mt-1 text-[10px] text-[color:var(--muted)]">{locale === 'bn' ? 'accepted' : 'Accepted'}: {practical.result.expected.toPrecision(6)} {practical.result.unit}{error === null ? '' : ` · ${error.toFixed(2)}% error`}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn btn-primary flex-1 text-xs" disabled={!running || live === null || live === 0} onClick={capture}>{locale === 'bn' ? 'পাঠ রেকর্ড করুন' : 'Record reading'}</button>
          <button type="button" className="btn btn-ghost text-xs" onClick={() => setRows([])}>{locale === 'bn' ? 'মুছুন' : 'Clear'}</button>
        </div>
        <p className={cn('mt-2 text-xs font-semibold', good ? 'text-emerald-700 dark:text-emerald-300' : 'text-[color:var(--muted)]')}>
          {good ? (locale === 'bn' ? '✓ ফল accepted tolerance-এর মধ্যে।' : '✓ Result is within the accepted tolerance.') : (locale === 'bn' ? `${rows.length}/${practical.control.values.length} পাঠ · সব task শেষ করে ফল validate করুন।` : `${rows.length}/${practical.control.values.length} readings · complete the sweep to validate the result.`)}
        </p>
      </section>

      <section className="min-w-0 space-y-3">
        <div className="overflow-auto rounded-2xl border border-[color:var(--line)]">
          <table className="w-full min-w-[430px] text-left text-xs">
            <thead className="bg-[color:var(--surface-soft)] text-[color:var(--muted)]"><tr><th className="p-2">#</th><th className="p-2">{locale === 'bn' ? practical.control.bn : practical.control.en}</th><th className="p-2">{locale === 'bn' ? practical.reading.bn : practical.reading.en}</th><th className="p-2">{locale === 'bn' ? practical.result.bn : practical.result.en}</th></tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.x} className="border-t border-[color:var(--line)]"><td className="p-2">{index + 1}</td><td className="p-2 font-mono">{row.x.toPrecision(5)} {practical.control.unit}</td><td className="p-2 font-mono">{row.y.toPrecision(6)} {practical.reading.unit}</td><td className="p-2 font-mono">{row.estimate.toPrecision(6)} {practical.result.unit}</td></tr>)}</tbody>
          </table>
          {rows.length === 0 ? <p className="p-4 text-center text-xs text-[color:var(--muted)]">{locale === 'bn' ? 'এখনও কোনো পাঠ নেই' : 'No readings recorded yet'}</p> : null}
        </div>
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3">
          <p className="mb-2 text-xs font-semibold text-[color:var(--ink)]">{locale === 'bn' ? 'Live data graph' : 'Live data graph'}</p>
          <svg viewBox="0 0 370 130" className="h-36 w-full" role="img" aria-label="Circuit practical observation graph">
            <line x1="35" y1="112" x2="352" y2="112" stroke="currentColor" opacity=".35" />
            <line x1="35" y1="14" x2="35" y2="112" stroke="currentColor" opacity=".35" />
            {graphPoints ? <polyline points={graphPoints} fill="none" stroke="#1677d2" strokeWidth="2.5" /> : null}
            {graphPoints.split(' ').filter(Boolean).map((point) => { const [cx, cy] = point.split(','); return <circle key={point} cx={cx} cy={cy} r="4" fill="#16a34a" />; })}
            <text x="190" y="127" textAnchor="middle" fontSize="9" fill="currentColor">{locale === 'bn' ? practical.control.bn : practical.control.en} ({practical.control.unit})</text>
            <text x="8" y="66" textAnchor="middle" fontSize="9" fill="currentColor" transform="rotate(-90 8 66)">{locale === 'bn' ? practical.reading.bn : practical.reading.en}</text>
          </svg>
        </div>
      </section>
    </div>
  );
}

function AnalysisTab() {
  const { t } = useCircuitI18n();
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const bom = useMemo(() => billOfMaterials(components), [components]);
  const nets = useMemo(() => netlist(components, wires), [components, wires]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--ink)]">{t('bom')}</h3>
        {bom.length === 0 ? <p className="text-[color:var(--muted)]">—</p> : null}
        <table className="w-full text-left text-xs">
          <thead className="text-[color:var(--muted)]">
            <tr>
              <th className="py-1">Qty</th>
              <th>Part</th>
              <th>Part no.</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((l) => (
              <tr key={l.partId} className="border-t border-[color:var(--line)]">
                <td className="py-1 tabular-nums">{l.count}</td>
                <td>{l.name}</td>
                <td className="font-mono">{l.partNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--ink)]">{t('netlist')}</h3>
        {nets.length === 0 ? <p className="text-[color:var(--muted)]">—</p> : null}
        <ul className="max-h-64 space-y-2 overflow-auto text-xs">
          {nets.map((n) => (
            <li key={n.net} className="rounded-lg border border-[color:var(--line)] p-2">
              <p className="font-mono font-semibold">{n.net}</p>
              {n.pins.length ? (
                <ul className="mt-1 list-disc pl-4 text-[color:var(--muted)]">
                  {n.pins.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CheckTab() {
  const { t, locale } = useCircuitI18n();
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const issues = useMemo(() => checkCircuit(components, wires), [components, wires]);
  const frame = useCircuitStore((s) => s.frame);
  return (
    <div className="space-y-2">
      {issues.length === 0 ? <p className="text-emerald-700 dark:text-emerald-300">{t('noIssues')}</p> : null}
      <ul className="space-y-2">
        {issues.map((i, idx) => (
          <li
            key={idx}
            className={cn(
              'rounded-xl border p-3 text-xs',
              i.level === 'error' && 'border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-100',
              i.level === 'warning' && 'border-amber-300 bg-amber-50 text-[color:var(--ink)] dark:bg-amber-900/20',
              i.level === 'info' && 'border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--ink)]'
            )}
          >
            {locale === 'bn' ? i.text.bn : i.text.en}
          </li>
        ))}
      </ul>
      {frame?.isShortCircuit ? <p className="text-xs text-orange-700">{t('shortCircuit')}</p> : null}
    </div>
  );
}

function GuideTab() {
  const { locale, shortcuts } = useCircuitI18n();
  const en = [
    'Drag a part from the library onto the bench (or tap it to drop at the centre).',
    'Drag from one pin to another to wire them; drag a wire’s dotted handle to bend it.',
    'Parts snap to the grid, and to breadboard holes when a pin is within 6 units of one.',
    'Press Run (F5). LEDs glow with current, motors spin, servos move, and displays update.',
    'Boards with a USB port are powered from your computer; other boards need a supply on VIN.',
    'Sketches use an Arduino-style C++ subset. delay() advances the simulated clock.'
  ];
  const bn = [
    'লাইব্রেরি থেকে যন্ত্রাংশ বেঞ্চে টেনে আনুন (বা ট্যাপ করে মাঝখানে যোগ করুন)।',
    'এক পিন থেকে অন্য পিনে টেনে ওয়্যার করুন; ওয়্যারের বিন্দুযুক্ত হাতল টেনে বাঁকান।',
    'যন্ত্রাংশ গ্রিডে এবং ব্রেডবোর্ড হোলে স্ন্যাপ করে (পিন ৬ ইউনিটের মধ্যে হলে)।',
    'Run (F5) চাপুন। কারেন্টে LED জ্বলে, মোটর ঘোরে, সার্ভো নড়ে, ডিসপ্লে আপডেট হয়।',
    'USB-যুক্ত বোর্ড কম্পিউটার থেকে চলে; অন্যগুলোতে VIN-এ সরবরাহ লাগে।',
    'স্কেচে Arduino-ধরনের C++ সাবসেট। delay() সিমুলেটেড সময় এগিয়ে নেয়।'
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ol className="list-decimal space-y-2 pl-5 text-[color:var(--muted)]">{(locale === 'bn' ? bn : en).map((x) => <li key={x}>{x}</li>)}</ol>
      <div>
        <h3 className="mb-2 font-semibold text-[color:var(--ink)]">{locale === 'bn' ? 'কীবোর্ড শর্টকাট' : 'Keyboard shortcuts'}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {shortcuts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-mono text-[color:var(--ink)]">{k}</dt>
              <dd className="text-[color:var(--muted)]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
