'use client';

import React from 'react';
import { C, Digital, FallingDrop, SceneFrame, Txt, fmt, vNum, vObj, vStr, type SceneProps } from '../primitives';

/** Shared quantitative-analysis bench with experiment-specific glassware and reagents. */
export function AnalysisBenchScene({ view, bn, t }: SceneProps) {
  const title = vStr(view, bn ? 'title_bn' : 'title_en', 'Quantitative analysis');
  const xLabel = vStr(view, bn ? 'x_bn' : 'x_en', 'Condition');
  const yLabel = vStr(view, bn ? 'y_bn' : 'y_en', 'Reading');
  const xUnit = vStr(view, 'x_unit');
  const yUnit = vStr(view, 'y_unit');
  const formula = vStr(view, 'formula');
  const x = vNum(view, 'x');
  const y = vNum(view, 'y');
  const signal = vNum(view, 'signal', 0.5);
  const apparatus = vObj<string[]>(view, bn ? 'apparatus_bn' : 'apparatus_en') ?? ['burette', 'flask', 'meter'];
  const reagents = vObj<string[]>(view, bn ? 'reagents_bn' : 'reagents_en') ?? ['sample', 'reagent', 'indicator'];
  const solution = `hsl(${188 + Math.round(signal * 72)} 72% ${62 - signal * 14}%)`;

  return (
    <SceneFrame label={`${title} analysis bench`} hood>
      <rect x={18} y={18} width={604} height={42} rx={10} fill="#eef5fb" stroke={C.line} />
      <Txt x={320} y={37} size={13} weight={800}>{title}</Txt>
      <Txt x={320} y={52} size={9.5} color={C.muted}>{formula}</Txt>

      {/* Three labelled reagent bottles make each practical's chemistry explicit. */}
      {reagents.slice(0, 3).map((name, i) => {
        const bx = 34 + i * 69;
        const colors = ['#60a5fa', '#f59e0b', '#a78bfa'];
        return (
          <g key={`${name}-${i}`}>
            <rect x={bx + 8} y={91} width={35} height={12} rx={3} fill={C.steelDark} />
            <path d={`M ${bx + 3} 104 L ${bx + 48} 104 L ${bx + 53} 176 Q ${bx + 25} 190 ${bx - 2} 176 Z`} fill="#f8fbff" stroke={C.glassDark} strokeWidth={1.2} />
            <path d={`M ${bx + 1} 148 L ${bx + 50} 148 L ${bx + 53} 176 Q ${bx + 25} 188 ${bx - 2} 176 Z`} fill={colors[i]} opacity={0.58} />
            <rect x={bx + 2} y={119} width={48} height={26} rx={3} fill="#fff" stroke={C.line} />
            <Txt x={bx + 26} y={132} size={7.5} weight={700}>{name}</Txt>
          </g>
        );
      })}

      {/* Delivery glassware feeding the analytical vessel. */}
      <rect x={266} y={76} width={22} height={137} rx={9} fill="rgba(210,235,250,.42)" stroke={C.glassDark} strokeWidth={1.5} />
      {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={270} x2={278} y1={94 + i * 16} y2={94 + i * 16} stroke={C.glassDark} />)}
      <path d="M 274 212 L 280 212 L 280 235 L 274 245 Z" fill={C.glass} stroke={C.glassDark} />
      <circle cx={289} cy={220} r={8} fill={C.steelDark} />
      <FallingDrop x={278} y0={246} y1={269} color={solution} t={t} speed={1.1} />
      <Txt x={277} y={69} size={8.5} weight={700}>{apparatus[0]}</Txt>

      {/* Reaction / sample vessel */}
      <path d="M 316 208 L 316 260 Q 316 293 365 293 Q 414 293 414 260 L 414 208" fill="rgba(235,247,255,.64)" stroke={C.glassDark} strokeWidth={2} />
      <path d="M 318 255 Q 365 246 412 255 L 412 270 Q 406 291 365 291 Q 324 291 318 270 Z" fill={solution} opacity={0.7} />
      <path d="M 331 268 Q 365 250 399 268" fill="none" stroke="#fff" strokeWidth={2} opacity={0.7} />
      <line x1={376} y1={198} x2={376} y2={273} stroke={C.steelDark} strokeWidth={3} />
      <circle cx={376} cy={198} r={7} fill={C.chem} />
      <Txt x={365} y={314} size={9} weight={700}>{apparatus[1]}</Txt>

      {/* Instrument readout */}
      <path d="M 390 222 C 438 210 436 155 468 151" fill="none" stroke={C.steelDark} strokeWidth={2} />
      <rect x={453} y={88} width={155} height={124} rx={12} fill={C.steelDark} />
      <rect x={466} y={102} width={129} height={47} rx={6} fill="#071b20" stroke="#4b6572" />
      <text x={531} y={130} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={15} fontWeight={800} fill="#86efac">{Number.isFinite(y) ? y.toPrecision(6) : '—'}</text>
      <Txt x={531} y={165} size={9} color="#e2e8f0">{yLabel}</Txt>
      <Txt x={531} y={183} size={9} color="#e2e8f0">{yUnit}</Txt>
      <circle cx={486} cy={193} r={7} fill={C.chem} />
      <circle cx={509} cy={193} r={7} fill={C.amber} />
      <Txt x={531} y={228} size={9} weight={700}>{apparatus[2]}</Txt>

      <Digital x={31} y={260} w={214} value={`${fmt(x, 5)} ${xUnit}`} label={xLabel} tone="lcd" />
      <rect x={447} y={254} width={161} height={70} rx={9} fill="#f7fbff" stroke={C.line} />
      <Txt x={527} y={272} size={9} color={C.muted}>{bn ? 'live analytical signal' : 'Live analytical signal'}</Txt>
      <line x1={462} y1={307} x2={593} y2={307} stroke={C.line} />
      <path d={`M 464 303 C 486 ${303 - signal * 22}, 503 ${303 - signal * 35}, 525 ${295 - signal * 20} S 568 ${285 - signal * 28}, 592 ${278 - signal * 30}`} fill="none" stroke={C.chem} strokeWidth={2.5} />
    </SceneFrame>
  );
}
