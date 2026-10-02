import { CheckCircle2 } from 'lucide-react';

export function ExperimentSteps({ steps }: { steps: string[] }) {
  return <ol className="space-y-4">{steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-physics-100 text-xs font-black text-physics-700 dark:bg-physics-900 dark:text-physics-100">{index + 1}</span><p className="pt-1 text-sm leading-6 muted">{step}</p></li>)}</ol>;
}

export function ApparatusList({ items }: { items: string[] }) {
  return <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex items-start gap-2 rounded-xl bg-[var(--surface-soft)] p-3 text-sm font-bold"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-chemistry-600" />{item}</li>)}</ul>;
}
