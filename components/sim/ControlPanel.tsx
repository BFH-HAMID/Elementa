import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ControlPanel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <aside className={cn('space-y-4 self-start rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5', className)}><div className="flex items-center gap-2 border-b border-[var(--line)] pb-3"><SlidersHorizontal size={17} className="text-physics-600" /><h2 className="text-sm font-black uppercase tracking-widest">{title}</h2></div>{children}</aside>;
}

export function RangeControl({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix?: string }) {
  return <label className="block"><span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold"><span>{label}</span><span className="rounded-lg bg-[var(--surface-soft)] px-2 py-1 font-mono text-xs text-physics-700 dark:text-physics-100">{value}{suffix ? ` ${suffix}` : ''}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-physics-600" /></label>;
}

export function NumberControl({ label, value, onChange, min, max, step, suffix }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><div className="flex items-center gap-2"><input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="input" /><span className="shrink-0 text-xs font-bold muted">{suffix}</span></div></label>;
}
