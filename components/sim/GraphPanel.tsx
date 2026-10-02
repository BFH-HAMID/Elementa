'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';

export type GraphPoint = { x: number; y: number; label?: string };

export function GraphPanel({ data, xLabel = 'x', yLabel = 'y', color = '#1677d2', title = 'Live graph' }: { data: GraphPoint[]; xLabel?: string; yLabel?: string; color?: string; title?: string }) {
  return <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5"><div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest muted"><BarChart3 size={15} />{title}</div>{data.length < 2 ? <div className="grid h-52 place-items-center rounded-xl bg-[var(--surface-soft)] text-center text-sm muted">Move a control to populate the graph.</div> : <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="x" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} label={{ value: xLabel, position: 'insideBottomRight', offset: -2, fontSize: 11, fill: 'var(--muted)' }} /><YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--muted)' }} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} /><Line type="monotone" dataKey="y" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>}</section>;
}
