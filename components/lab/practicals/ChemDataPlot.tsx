'use client';

import React from 'react';
import type { ChemColumn, ChemGraphDef, ChemRow } from '@/engine/chemPracticals';

/**
 * Small dependency-free scatter/line plot of the recorded observation table — the
 * "graph paper" of a chemistry practical (pH curve, gas volume–time, Δm–Q…).
 */

const COLORS = ['#087d60', '#1677d2', '#e2483d', '#b45309'];
const WIDTH = 440;
const HEIGHT = 250;
const PAD = { l: 48, r: 14, t: 16, b: 38 };

function niceStep(span: number, target = 5): number {
  if (!(span > 0)) return 1;
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n >= 5 ? 10 : n >= 2 ? 5 : n >= 1 ? 2 : 1) * mag;
}

function ticks(min: number, max: number): number[] {
  const step = niceStep(max - min);
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Number(v.toPrecision(10)));
  return out;
}

const label = (v: number) => {
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(1).replace('e+', 'e');
  return String(Number(v.toPrecision(4)));
};

export function ChemDataPlot({ graph, columns, rows, bn }: { graph: ChemGraphDef; columns: ChemColumn[]; rows: ChemRow[]; bn: boolean }) {
  const ys = Array.isArray(graph.y) ? graph.y : [graph.y];
  const series = ys.map((key) =>
    rows
      .map((r) => ({ x: Number(r[graph.x]), y: Number(r[key]) }))
      .filter((p) => typeof p.x === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x)
  );
  const all = series.flat();
  const colOf = (key: string) => columns.find((c) => c.key === key);
  const axisName = (key: string) => {
    const c = colOf(key);
    if (!c) return key;
    return `${bn ? c.bn : c.en}${c.unit ? ` / ${c.unit}` : ''}`;
  };
  if (all.length < 2) {
    return (
      <div className="grid h-[200px] place-items-center rounded-2xl border border-dashed border-[var(--line)] text-center text-xs font-bold text-[var(--muted)]">
        {bn ? 'অন্তত দুটি পাঠ নিলে লেখচিত্র দেখা যাবে' : 'Record at least two readings to see the graph'}
      </div>
    );
  }
  let xMin = Math.min(...all.map((p) => p.x));
  let xMax = Math.max(...all.map((p) => p.x));
  let yMin = Math.min(...all.map((p) => p.y));
  let yMax = Math.max(...all.map((p) => p.y));
  if (xMin > 0 && xMin < (xMax - xMin) * 0.6) xMin = 0;
  if (yMin > 0 && yMin < (yMax - yMin) * 0.6) yMin = 0;
  if (xMax === xMin) xMax = xMin + 1;
  if (yMax === yMin) {
    yMax += Math.abs(yMax) * 0.1 || 1;
    yMin -= Math.abs(yMin) * 0.1 || 1;
  }
  const yPad = (yMax - yMin) * 0.08;
  yMax += yPad;
  if (yMin !== 0) yMin -= yPad;
  const px = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * (WIDTH - PAD.l - PAD.r);
  const py = (y: number) => HEIGHT - PAD.b - ((y - yMin) / (yMax - yMin)) * (HEIGHT - PAD.t - PAD.b);
  const xt = ticks(xMin, xMax);
  const yt = ticks(yMin, yMax);
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" role="img" aria-label={bn ? 'পাঠের লেখচিত্র' : 'Graph of the readings'}>
      <rect x={PAD.l} y={PAD.t} width={WIDTH - PAD.l - PAD.r} height={HEIGHT - PAD.t - PAD.b} fill="var(--surface-soft)" rx="4" />
      {yt.map((v) => (
        <g key={`y${v}`}>
          <line x1={PAD.l} x2={WIDTH - PAD.r} y1={py(v)} y2={py(v)} stroke="var(--line)" strokeWidth="0.8" />
          <text x={PAD.l - 6} y={py(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">
            {label(v)}
          </text>
        </g>
      ))}
      {xt.map((v) => (
        <g key={`x${v}`}>
          <line x1={px(v)} x2={px(v)} y1={PAD.t} y2={HEIGHT - PAD.b} stroke="var(--line)" strokeWidth="0.8" />
          <text x={px(v)} y={HEIGHT - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {label(v)}
          </text>
        </g>
      ))}
      <text x={(PAD.l + WIDTH - PAD.r) / 2} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
        {axisName(graph.x)}
      </text>
      <text x={12} y={(PAD.t + HEIGHT - PAD.b) / 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)" transform={`rotate(-90 12 ${(PAD.t + HEIGHT - PAD.b) / 2})`}>
        {ys.length === 1 ? axisName(ys[0]) : bn ? 'মান' : 'value'}
      </text>
      {series.map((pts, i) => (
        <g key={i}>
          {graph.kind !== 'scatter' && pts.length > 1 && <polyline points={pts.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" strokeLinejoin="round" />}
          {pts.map((p, k) => (
            <circle key={k} cx={px(p.x)} cy={py(p.y)} r="3.6" fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth="1.2" />
          ))}
        </g>
      ))}
      {ys.length > 1 &&
        ys.map((key, i) => (
          <g key={key} transform={`translate(${PAD.l + 10 + i * 130} ${PAD.t + 12})`}>
            <rect width="10" height="10" y="-8" rx="2" fill={COLORS[i % COLORS.length]} />
            <text x="14" y="1" fontSize="10" fontWeight="700" fill="var(--ink)">
              {(() => {
                const c = colOf(key);
                return c ? (bn ? c.bn : c.en) : key;
              })()}
            </text>
          </g>
        ))}
    </svg>
  );
}
