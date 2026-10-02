import { Activity } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export type Readout = { label: string; value: number | string; unit?: string; accent?: 'physics' | 'chemistry' | 'warm' };

export function LiveReadout({ items, title = 'Live readout' }: { items: Readout[]; title?: string }) {
  return <section aria-label={title}><div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest muted"><Activity size={15} />{title}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map((item) => { const tone = item.accent === 'chemistry' ? 'border-chemistry-200 bg-chemistry-50 dark:border-chemistry-700 dark:bg-chemistry-900/50' : item.accent === 'warm' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40' : 'border-physics-200 bg-physics-50 dark:border-physics-700 dark:bg-physics-900/50'; return <div key={item.label} className={`rounded-xl border p-3 ${tone}`}><p className="text-xs font-bold muted">{item.label}</p><p className="mt-1 truncate text-lg font-black">{typeof item.value === 'number' ? formatNumber(item.value, 4) : item.value} <span className="text-xs font-bold muted">{item.unit}</span></p></div>; })}</div></section>;
}
