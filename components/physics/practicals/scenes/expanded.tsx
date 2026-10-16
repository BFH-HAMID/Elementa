'use client';

import React from 'react';
import { C, SceneFrame, Txt, fmt, num, type SceneProps } from '../primitives';

const text = (view: SceneProps['view'], key: string, fallback = '') => (typeof view[key] === 'string' ? String(view[key]) : fallback);

/**
 * A labelled three-stage instrument rig used by the expanded quantitative practicals.
 * The apparatus names, equation, scales, sample motion and meter values all come from
 * the individual practical model, while the shared bench keeps the 30 scenes compact.
 */
export function InstrumentRigScene({ view, bn, t }: SceneProps) {
  const x = num(view, 'x');
  const y = num(view, 'y');
  const xLabel = text(view, bn ? 'x_bn' : 'x_en', 'Input');
  const yLabel = text(view, bn ? 'y_bn' : 'y_en', 'Reading');
  const xUnit = text(view, 'x_unit');
  const yUnit = text(view, 'y_unit');
  const title = text(view, bn ? 'title_bn' : 'title_en', 'Instrument practical');
  const apparatus = [1, 2, 3].map((i) => text(view, `apparatus${i}_${bn ? 'bn' : 'en'}`, `Instrument ${i}`));
  const pulse = 0.55 + Math.sin(t * 2.4) * 0.15;
  const needle = Math.max(-58, Math.min(58, Math.log10(Math.abs(y) + 1) * 24));

  return (
    <SceneFrame label={`${title} apparatus`}>
      <rect x={22} y={24} width={596} height={42} rx={10} fill={C.soft} stroke={C.line} />
      <Txt x={320} y={43} size={13} weight={800} color={C.ink}>{title}</Txt>
      <Txt x={320} y={58} size={9.5} color={C.muted}>{text(view, 'formula')}</Txt>

      {/* Excitation / source module */}
      <rect x={34} y={103} width={148} height={145} rx={14} fill={C.surface} stroke={C.blue} strokeWidth={2} />
      <circle cx={108} cy={158} r={31} fill={C.soft} stroke={C.blue} strokeWidth={2} />
      <circle cx={108} cy={158} r={12 + pulse * 5} fill={C.sky} opacity={0.65} />
      <path d="M 72 158 Q 82 142 92 158 T 112 158 T 132 158 T 152 158" fill="none" stroke={C.blueDark} strokeWidth={2.5} />
      <Txt x={108} y={218} size={10} weight={700}>{apparatus[0]}</Txt>

      {/* Adjustable specimen module */}
      <rect x={224} y={91} width={190} height={170} rx={16} fill={C.surface} stroke={C.violet} strokeWidth={2} />
      <rect x={250} y={132} width={138} height={63} rx={8} fill={C.glass} stroke={C.steelDark} strokeWidth={1.5} />
      <path d="M 267 180 L 284 146 L 304 180 L 324 146 L 344 180 L 367 146" fill="none" stroke={C.copper} strokeWidth={5} strokeLinecap="round" />
      <line x1={252} y1={213} x2={386} y2={213} stroke={C.line} strokeWidth={5} />
      <circle cx={252 + ((Math.sin(x * 1.7) + 1) / 2) * 134} cy={213} r={8} fill={C.amber} stroke={C.ink} />
      <Txt x={319} y={113} size={10} weight={700}>{apparatus[1]}</Txt>
      <Txt x={319} y={242} size={10} color={C.violet} weight={800}>{xLabel}: {fmt(x, 5)} {xUnit}</Txt>

      {/* Readout / detector module */}
      <rect x={456} y={103} width={150} height={145} rx={14} fill={C.surface} stroke={C.green} strokeWidth={2} />
      <path d="M 480 179 A 51 51 0 0 1 582 179" fill="none" stroke={C.line} strokeWidth={8} />
      <line x1={531} y1={179} x2={531 + Math.sin((needle * Math.PI) / 180) * 39} y2={179 - Math.cos((needle * Math.PI) / 180) * 39} stroke={C.red} strokeWidth={3} strokeLinecap="round" />
      <circle cx={531} cy={179} r={5} fill={C.ink} />
      <rect x={474} y={194} width={114} height={28} rx={5} fill="#0f172a" />
      <text x={531} y={213} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={13} fontWeight={800} fill="#86efac">{Number.isFinite(y) ? y.toPrecision(5) : '—'} {yUnit}</text>
      <Txt x={531} y={234} size={9.5} weight={700}>{apparatus[2]}</Txt>

      {/* Signal path and live labels */}
      <path d="M 182 160 C 200 160 205 160 224 160 M 414 160 C 430 160 440 160 456 160" fill="none" stroke={C.blue} strokeWidth={3} strokeDasharray="6 5" />
      <circle cx={199 + ((t * 28) % 24)} cy={160} r={3} fill={C.blue} />
      <circle cx={430 + ((t * 25) % 20)} cy={160} r={3} fill={C.green} />

      <rect x={34} y={282} width={572} height={52} rx={10} fill={C.soft} stroke={C.line} />
      <Txt x={177} y={304} size={10} color={C.muted}>{xLabel}</Txt>
      <Txt x={177} y={322} size={13} color={C.blueDark} weight={800}>{fmt(x, 5)} {xUnit}</Txt>
      <line x1={318} y1={292} x2={318} y2={326} stroke={C.line} />
      <Txt x={458} y={304} size={10} color={C.muted}>{yLabel}</Txt>
      <Txt x={458} y={322} size={13} color={C.green} weight={800}>{Number.isFinite(y) ? y.toPrecision(6) : '—'} {yUnit}</Txt>
    </SceneFrame>
  );
}
