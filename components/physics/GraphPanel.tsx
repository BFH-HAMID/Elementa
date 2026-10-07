'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Line
} from 'recharts';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { calculateLinearRegression } from '@/engine/measurement';
import { physicsExperimentsBySlug } from '@/lib/physicsData';
import { TrendingUp, BarChart2, Info } from 'lucide-react';

export function GraphPanel() {
  const { isBangla } = usePhysicsI18n();
  const dataRows = usePhysicsStore((s) => s.dataRows);
  const activeExperimentSlug = usePhysicsStore((s) => s.activeExperimentSlug);

  const exp = activeExperimentSlug ? physicsExperimentsBySlug.get(activeExperimentSlug) : null;

  // Available numerical keys in dataRows
  const availableKeys = useMemo(() => {
    if (dataRows.length === 0) return ['x', 'y'];
    const keys = new Set<string>();
    for (const row of dataRows) {
      for (const [k, v] of Object.entries(row.values)) {
        if (typeof v === 'number') keys.add(k);
      }
    }
    return Array.from(keys);
  }, [dataRows]);

  const defaultX = exp?.theoreticalTarget?.xColumn || availableKeys[0] || 'voltage';
  const defaultY = exp?.theoreticalTarget?.yColumn || availableKeys[1] || 'current';

  const [xKey, setXKey] = useState<string>(defaultX);
  const [yKey, setYKey] = useState<string>(defaultY);

  // Filter numeric points
  const points = useMemo(() => {
    return dataRows
      .map((r) => ({
        x: typeof r.values[xKey] === 'number' ? (r.values[xKey] as number) : NaN,
        y: typeof r.values[yKey] === 'number' ? (r.values[yKey] as number) : NaN
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));
  }, [dataRows, xKey, yKey]);

  // Linear regression
  const regression = useMemo(() => {
    return calculateLinearRegression(points);
  }, [points]);

  // Generate 2 points for best-fit line
  const lineData = useMemo(() => {
    if (points.length < 2) return [];
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    return [
      { x: minX, y: regression.slope * minX + regression.intercept },
      { x: maxX, y: regression.slope * maxX + regression.intercept }
    ];
  }, [points, regression]);

  return (
    <div className="space-y-6">
      {/* Controls & Statistics Bar */}
      <div className="grid gap-4 sm:grid-cols-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
        <div>
          <label className="text-[11px] font-bold text-[var(--muted)]">{isBangla ? 'X-অক্ষ চলক:' : 'X-Axis Column:'}</label>
          <select
            value={xKey}
            onChange={(e) => setXKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-2 text-xs font-bold text-[var(--ink)]"
          >
            {availableKeys.map((k) => (
              <option key={`x-${k}`} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[var(--muted)]">{isBangla ? 'Y-অক্ষ চলক:' : 'Y-Axis Column:'}</label>
          <select
            value={yKey}
            onChange={(e) => setYKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-2 text-xs font-bold text-[var(--ink)]"
          >
            {availableKeys.map((k) => (
              <option key={`y-${k}`} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Slope result */}
        <div className="rounded-xl border border-physics-200 bg-physics-50/50 p-2.5 dark:border-physics-900/60 dark:bg-physics-900/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-physics-700 dark:text-physics-300">
            {isBangla ? 'ঢাল (Slope m):' : 'Slope (m):'}
          </span>
          <p className="mt-0.5 font-mono text-base font-black text-physics-600 dark:text-physics-200">
            {points.length >= 2 ? regression.slope.toFixed(4) : '—'}
          </p>
        </div>

        {/* R-squared */}
        <div className="rounded-xl border border-physics-200 bg-physics-50/50 p-2.5 dark:border-physics-900/60 dark:bg-physics-900/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-physics-700 dark:text-physics-300">
            {isBangla ? 'সহসম্বন্ধ (R²):' : 'Correlation (R²):'}
          </span>
          <p className="mt-0.5 font-mono text-base font-black text-physics-600 dark:text-physics-200">
            {points.length >= 2 ? `${(regression.rSquared * 100).toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-physics-600" />
            <h3 className="text-sm font-black text-[var(--ink)]">
              {isBangla ? `লেখচিত্র: ${yKey} বনাম ${xKey}` : `Live Plot: ${yKey} vs ${xKey}`}
            </h3>
          </div>
          {points.length >= 2 && (
            <span className="font-mono text-xs font-bold text-physics-600">
              {regression.equation}
            </span>
          )}
        </div>

        {points.length < 2 ? (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <BarChart2 size={36} className="text-[var(--muted)] opacity-40 mb-2" />
            <p className="text-xs font-bold text-[var(--muted)]">
              {isBangla
                ? 'লেখচিত্র আঁকতে "ডেটা টেবিল" ট্যাবে গিয়ে অন্তত ২টি পাঠ রেকর্ড করুন।'
                : 'Record at least 2 observations in the Data Table tab to plot a live best-fit line.'}
            </p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={xKey}
                  unit=""
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={yKey}
                  unit=""
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 font-mono text-xs shadow-float">
                        <p className="text-[var(--muted)]">{xKey}: <span className="font-bold text-[var(--ink)]">{data.x}</span></p>
                        <p className="text-[var(--muted)]">{yKey}: <span className="font-bold text-physics-600">{data.y}</span></p>
                      </div>
                    );
                  }}
                />
                {/* Data Points */}
                <Scatter name="Observations" data={points} fill="#2563eb" />
                {/* Best Fit Line */}
                <Scatter name="Best Fit Line" data={lineData} line={{ stroke: '#ef4444', strokeWidth: 2 }} fill="#ef4444" shape={() => null as any} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
