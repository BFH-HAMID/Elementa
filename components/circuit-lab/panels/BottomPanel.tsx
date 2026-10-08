'use client';

/** Tabbed bottom panel: serial monitor, examples, bill of materials & netlist, circuit check, guide. */

import { useMemo } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import { EXAMPLE_PROJECTS } from '../projects/examples';
import { billOfMaterials, checkCircuit, netlist } from '../lib/analysis';
import { useCircuitI18n, type CircuitKey } from '../lib/i18n';
import { cn } from '@/lib/utils';

const TABS: { id: 'serial' | 'examples' | 'analysis' | 'check' | 'guide'; key: CircuitKey }[] = [
  { id: 'serial', key: 'serial' },
  { id: 'examples', key: 'examples' },
  { id: 'analysis', key: 'analysis' },
  { id: 'check', key: 'check' },
  { id: 'guide', key: 'guide' }
];

export function BottomPanel() {
  const { t, locale } = useCircuitI18n();
  const tab = useCircuitStore((s) => s.bottomTab);
  const setTab = useCircuitStore((s) => s.setBottomTab);

  return (
    <section aria-label={t('serial')} className="card flex min-h-0 flex-col p-0">
      <div role="tablist" aria-label={t('serial')} className="flex flex-wrap gap-1 border-b border-line px-2 pt-2">
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            aria-controls={`panel-${x.id}`}
            id={`tab-${x.id}`}
            type="button"
            onClick={() => setTab(x.id)}
            className={cn('rounded-t-lg px-3 py-2 text-sm font-medium transition', tab === x.id ? 'bg-surface-soft text-ink' : 'text-muted hover:text-ink')}
          >
            {t(x.key)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-h-0 flex-1 overflow-auto p-3 text-sm">
        {tab === 'serial' ? <SerialTab /> : null}
        {tab === 'examples' ? <ExamplesTab locale={locale} /> : null}
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
        <p className="text-xs text-muted">{t('sendHint')}</p>
        <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={clear}>
          {t('clear')}
        </button>
      </div>
      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-xl bg-coral-50 p-2 text-xs text-coral-700 dark:bg-coral-900/20 dark:text-coral-200" role="status">
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
  const active = useCircuitStore((s) => s.activeExampleId);
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EXAMPLE_PROJECTS.map((ex) => (
        <article key={ex.id} className={cn('rounded-2xl border border-line bg-surface p-3', active === ex.id && 'ring-2 ring-physics-300')}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink">{locale === 'bn' ? ex.title.bn : ex.title.en}</h3>
            <span className="pill shrink-0 text-[10px] uppercase">{ex.difficulty}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{locale === 'bn' ? ex.summary.bn : ex.summary.en}</p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-brand dark:text-physics-200">{locale === 'bn' ? 'ধাপে ধাপে' : 'Step by step'}</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted">
              {ex.steps.map((s, i) => (
                <li key={i}>{locale === 'bn' ? s.bn : s.en}</li>
              ))}
            </ol>
            <p className="mt-2 text-muted">{locale === 'bn' ? ex.explanation.bn : ex.explanation.en}</p>
          </details>
          <button type="button" className="btn btn-primary mt-3 w-full text-xs" onClick={() => loadExample(ex.id)}>
            {locale === 'bn' ? 'এই উদাহরণ খুলুন' : 'Open example'}
          </button>
        </article>
      ))}
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
        <h3 className="mb-2 font-semibold text-ink">{t('bom')}</h3>
        {bom.length === 0 ? <p className="text-muted">—</p> : null}
        <table className="w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th className="py-1">Qty</th>
              <th>Part</th>
              <th>Part no.</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((l) => (
              <tr key={l.partId} className="border-t border-line/60">
                <td className="py-1 tabular-nums">{l.count}</td>
                <td>{l.name}</td>
                <td className="font-mono">{l.partNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="mb-2 font-semibold text-ink">{t('netlist')}</h3>
        {nets.length === 0 ? <p className="text-muted">—</p> : null}
        <ul className="max-h-64 space-y-2 overflow-auto text-xs">
          {nets.map((n) => (
            <li key={n.net} className="rounded-lg border border-line p-2">
              <p className="font-mono font-semibold">{n.net}</p>
              {n.pins.length ? (
                <ul className="mt-1 list-disc pl-4 text-muted">
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
              i.level === 'error' && 'border-coral-200 bg-coral-50 text-coral-800 dark:bg-coral-900/20 dark:text-coral-100',
              i.level === 'warning' && 'border-sun-300 bg-sun-50 text-ink dark:bg-sun-900/20',
              i.level === 'info' && 'border-line bg-surface-soft text-ink'
            )}
          >
            {locale === 'bn' ? i.text.bn : i.text.en}
          </li>
        ))}
      </ul>
      {frame?.isShortCircuit ? <p className="text-xs text-coral-700">{t('shortCircuit')}</p> : null}
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
      <ol className="list-decimal space-y-2 pl-5 text-muted">{(locale === 'bn' ? bn : en).map((x) => <li key={x}>{x}</li>)}</ol>
      <div>
        <h3 className="mb-2 font-semibold text-ink">{locale === 'bn' ? 'কীবোর্ড শর্টকাট' : 'Keyboard shortcuts'}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {shortcuts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-mono text-ink">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
