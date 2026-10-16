'use client';

import React from 'react';
import { BENCH, C, Digital, SceneFrame, Stopwatch, Tag, Txt, clampN, fmt, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { Beaker } from '../glass';

type ChromatographyBand = { label: string; labelBn: string; color: string; rf: number };

/** Paper strip, shallow solvent chamber, separated pigment bands and Rf ruler. */
export function ChromatographyScene({ view, t, bn }: SceneProps) {
  const bands = vObj<ChromatographyBand[]>(view, 'bands') ?? [];
  const frontFraction = clampN(vNum(view, 'frontFraction', 0), 0, 1);
  const frontDistance = clampN(vNum(view, 'frontDistance', 0), 0, 8.5);
  const selected = Math.round(clampN(vNum(view, 'selectedBand', 0), 0, Math.max(0, bands.length - 1)));
  const time = vNum(view, 'time', 0);
  const sample = bn ? vStr(view, 'sampleBn', 'কালির মিশ্রণ') : vStr(view, 'sample', 'Ink mixture');
  const solvent = bn ? vStr(view, 'solventBn', 'পানি') : vStr(view, 'solvent', 'Water');
  const solventColor = /ethanol|ইথানল/i.test(solvent) ? '#dff2ff' : '#d6efff';
  const paperX = 230;
  const paperW = 58;
  const paperTop = 73;
  const paperBottom = 281;
  const baselineY = 247;
  const developedLength = 157 * frontFraction;
  const frontY = baselineY - developedLength;
  const selectedBand = bands[selected];
  const selectedRf = selectedBand?.rf ?? 0;

  return (
    <SceneFrame label={bn ? 'কাগজ ক্রোমাটোগ্রাফি' : 'Paper chromatography'}>
      <Stopwatch cx={74} cy={67} r={31} seconds={time} unit="min" label={bn ? 'সময়' : 'time'} />
      <Tag x={260} y={45} text={sample} tone="chem" size={8.5} />
      <Tag x={495} y={45} text={`${bn ? 'দ্রাবক' : 'solvent'}: ${solvent}`} tone="light" size={8} />

      {/* Shallow solvent chamber; the pencil baseline stays above the liquid. */}
      <Beaker cx={260} yb={BENCH - 2} w={176} h={168} liquid={solventColor} level={0.15} t={t} />
      <path d="M 167 131 Q 260 119 353 131 L 347 137 Q 260 127 173 137 Z" fill="#d7e2ec" stroke="#8298aa" strokeWidth="1" opacity="0.9" />
      <Txt x={260} y={154} size={8} color={C.muted} weight={800}>{bn ? 'ঢাকনাযুক্ত বিকাশ চেম্বার' : 'covered developing chamber'}</Txt>

      {/* Chromatography paper, pencil origin, moving solvent front and separated spots. */}
      <rect x={paperX} y={paperTop} width={paperW} height={paperBottom - paperTop} rx="2" fill="#fffefa" stroke="#aebac5" strokeWidth="1.2" />
      <rect x={paperX + 4} y={baselineY} width={paperW - 8} height={Math.max(0, paperBottom - baselineY)} fill={solventColor} opacity="0.15" />
      <line x1={paperX + 2} y1={baselineY} x2={paperX + paperW - 2} y2={baselineY} stroke="#57534e" strokeWidth="1.8" />
      <Txt x={paperX - 7} y={baselineY + 3} anchor="end" size={7.5} color={C.ink} weight={800}>{bn ? 'বেসলাইন' : 'baseline'}</Txt>
      {frontFraction > 0 && (
        <g>
          <line x1={paperX + 2} y1={frontY} x2={paperX + paperW - 2} y2={frontY} stroke="#e58a25" strokeWidth="1.4" strokeDasharray="4 2" />
          <Txt x={paperX + paperW + 9} y={frontY + 3} anchor="start" size={7.2} color="#9a5a13" weight={800}>{bn ? 'দ্রাবক-ফ্রন্ট' : 'solvent front'}</Txt>
        </g>
      )}
      {bands.map((band, i) => {
        const y = developedLength > 1 ? baselineY - band.rf * developedLength : baselineY - 1;
        const x = developedLength > 1 ? paperX + paperW / 2 : paperX + paperW / 2 + (i - (bands.length - 1) / 2) * 7;
        const radius = i === selected ? 5.2 : 4.4;
        return (
          <g key={`${band.label}-${i}`}>
            <ellipse cx={x} cy={y} rx={radius + 2} ry={radius + 2} fill={band.color} opacity="0.17" />
            <ellipse cx={x} cy={y} rx={radius} ry={radius * 0.77} fill={band.color} stroke="#ffffff" strokeOpacity="0.65" strokeWidth="0.8" />
            {i === selected && <ellipse cx={x} cy={y} rx={radius + 3.2} ry={radius + 2.4} fill="none" stroke="#1f2937" strokeWidth="0.8" strokeDasharray="2 2" />}
            {developedLength > 18 && (
              <Txt x={paperX + paperW + 9} y={y + 3} anchor="start" size={7.4} color={band.color} weight={900}>
                {bn ? band.labelBn : band.label}
              </Txt>
            )}
          </g>
        );
      })}
      <path d={`M ${paperX + paperW / 2} ${baselineY - 4} L ${paperX + paperW / 2} ${paperBottom - 4}`} stroke="#d5d9dd" strokeWidth="0.6" strokeDasharray="2 3" />

      {/* Distance ruler from the origin to the solvent front. */}
      <line x1={365} y1={baselineY} x2={365} y2={Math.max(frontY, paperTop)} stroke="#526171" strokeWidth="1.1" />
      {Array.from({ length: 6 }, (_, i) => {
        const y = baselineY - i * 25;
        if (y < frontY - 1) return null;
        return (
          <g key={i}>
            <line x1={361} y1={y} x2={i % 2 === 0 ? 370 : 367} y2={y} stroke="#526171" strokeWidth="0.9" />
            {i % 2 === 0 && <Txt x={374} y={y + 3} anchor="start" size={7} color={C.muted}>{(i * 1.35).toFixed(1)}</Txt>}
          </g>
        );
      })}
      <Txt x={365} y={baselineY + 15} size={7.2} color={C.muted} weight={800}>{bn ? 'cm' : 'cm'}</Txt>

      {/* Selected-band instrument panel. */}
      <rect x={440} y={104} width="160" height="116" rx="12" fill="#ffffff" opacity="0.9" stroke={C.line} />
      <Txt x={520} y={124} size={8.5} color={C.ink} weight={900}>{bn ? `ব্যান্ড ${selected + 1} মাপ` : `measure band ${selected + 1}`}</Txt>
      <Digital x={455} y={135} w={130} h={50} value={fmt(selectedRf, 3)} label="Rf" />
      <Txt x={520} y={203} size={7.5} color={C.muted}>{bn ? 'রঞ্জকের দূরত্ব ÷ ফ্রন্টের দূরত্ব' : 'pigment distance ÷ front distance'}</Txt>
      <Txt x={260} y={BENCH + 19} size={8.5} color="#dbe7f1" weight={800}>{bn ? `${solvent} · কাগজের নমুনা` : `${solvent} · chromatography strip`}</Txt>
      <Txt x={260} y={BENCH + 35} size={7.6} color="#b8c7d6">{bn ? 'দ্রাবকের স্তর বেসলাইনের নিচে রাখো' : 'keep the solvent level below the baseline'}</Txt>
    </SceneFrame>
  );
}
