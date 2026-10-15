'use client';

import React from 'react';
import { BENCH, Digital, MiniPlot, SceneFrame, Thermometer, Txt, clampN, fmt, vBool, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { ClampStand } from '../kit';
import { Beaker, Burette } from '../glass';

type CurveView = { pts: { x: number; y: number }[]; cur?: { x: number; y: number }; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string };

/** Polystyrene-cup calorimeter with NaOH run in from a burette. */
export function CalorimeterScene({ view, t, bn }: SceneProps) {
  const temp = vNum(view, 'temp', 25);
  const vb = vNum(view, 'vb', 0);
  const lid = vBool(view, 'lid');
  const level = clampN(vNum(view, 'level', 0.25), 0, 0.95);
  const curve = vObj<CurveView>(view, 'curve');
  const cx = 214;
  const cupTop = 186;
  const cupB = BENCH - 6;
  const cupW = 92;
  const yl = cupB - 4 - level * (cupB - cupTop - 10);
  const warm = clampN((temp - 25) / 8, 0, 1);
  return (
    <SceneFrame label={bn ? 'প্রশমন তাপ পরিমাপ' : 'Heat of neutralisation'}>
      <ClampStand x={110} h={270} clamps={[{ y: 56, toX: cx + 48 }]} />
      <Burette cx={cx + 54} y={22} h={176} reading={vb} max={50} color="#eef5ff" label="NaOH 1.0 M" t={t} />
      {/* beaker holding the cup */}
      <Beaker cx={cx} yb={BENCH - 2} w={cupW + 26} h={92} level={0} marks={false} />
      {/* polystyrene cup */}
      <path d={`M ${cx - cupW / 2} ${cupTop} L ${cx - cupW / 2 + 9} ${cupB} L ${cx + cupW / 2 - 9} ${cupB} L ${cx + cupW / 2} ${cupTop} Z`} fill="#fbfbf8" stroke="#c9ced3" strokeWidth="1.2" />
      <path d={`M ${cx - cupW / 2 + 4} ${yl} L ${cx - cupW / 2 + 9.5} ${cupB - 3} L ${cx + cupW / 2 - 9.5} ${cupB - 3} L ${cx + cupW / 2 - 4} ${yl} Z`} fill="#eaf3fb" opacity="0.9" />
      <rect x={cx - cupW / 2 + 6} y={yl - 1} width={cupW - 12} height="3" fill="#ffffff" opacity="0.7" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={cx - cupW / 2 + 12 + i * 13} cy={cupTop + 30 + (i % 2) * 22} r="1.1" fill="#d9dde2" />
      ))}
      <ellipse cx={cx} cy={cupTop + 40} rx={cupW / 2} ry="40" fill="#ff7a3d" opacity={warm * 0.12} filter="url(#cx-blur-lg)" />
      {lid && <rect x={cx - cupW / 2 - 4} y={cupTop - 6} width={cupW + 8} height="7" rx="3" fill="#f3f4f1" stroke="#c9ced3" strokeWidth="1" />}
      <Thermometer x={cx - 18} y={64} h={210} value={temp} min={20} max={40} />
      <path d={`M ${cx + 12} ${cupTop - 8} L ${cx + 12} ${yl + 20}`} stroke="#9aa6b2" strokeWidth="2" />
      <circle cx={cx + 12} cy={yl + 22} r="5" fill="none" stroke="#9aa6b2" strokeWidth="2" />
      <Digital x={292} y={170} w={110} h={46} value={fmt(temp, 1)} unit="°C" label={bn ? 'সর্বোচ্চ তাপমাত্রা' : 'highest temperature'} />
      {curve && <MiniPlot x={420} y={22} w={206} h={142} pts={curve.pts ?? []} cur={curve.cur} xMax={curve.xMax} yMin={curve.yMin ?? 24} yMax={curve.yMax} xLabel={curve.xLabel} yLabel={curve.yLabel} />}
      <Txt x={cx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
        {`${vStr(view, 'acidLabel', 'HCl')} 25.0 mL + NaOH ${fmt(vb, 0)} mL`}
      </Txt>
      <Txt x={cx} y={BENCH + 34} size={8} color="#b9c7d6">
        {lid ? (bn ? 'ঢাকনাসহ পলিস্টাইরিন কাপ' : 'polystyrene cup with lid') : bn ? 'ঢাকনা ছাড়া কাপ — তাপ বেরিয়ে যায়' : 'no lid — heat escapes'}
      </Txt>
    </SceneFrame>
  );
}
