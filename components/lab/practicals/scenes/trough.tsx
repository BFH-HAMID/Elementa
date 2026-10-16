'use client';

import React from 'react';
import { BENCH, Bubbles, C, Glow, SceneFrame, Stopwatch, Txt, clampN, rnd, vBool, vNum, type SceneProps } from '../primitives';
import { InvertedCylinder, Trough } from '../glass';

const METALS = [
  { sym: 'Li', color: '#cfd3d8', flame: null as string | null },
  { sym: 'Na', color: '#e3e7ec', flame: '#ffb020' },
  { sym: 'K', color: '#d7dbe0', flame: '#c07cff' }
];

/** Alkali metal in a gauze cage under an inverted measuring cylinder in a trough of water. */
export function TroughScene({ view, t, bn }: SceneProps) {
  const metal = clampN(Math.round(vNum(view, 'metal', 1)), 0, 2);
  const progress = clampN(vNum(view, 'progress', 0), 0, 1);
  const size = clampN(vNum(view, 'size', 0.5), 0.1, 1);
  const pink = clampN(vNum(view, 'pink', 0), 0, 1);
  const volume = vNum(view, 'volume', 0);
  const max = vNum(view, 'max', 250);
  const running = vBool(view, 'running');
  const m = METALS[metal];
  const cx = 320;
  const cageY = 270;
  const r = (4 + 6 * size) * (1 - progress * 0.92);
  const melted = metal > 0 && running;
  const jiggle = running ? Math.sin(t * (metal === 2 ? 30 : 14)) * (metal === 2 ? 2.4 : 1.2) : 0;
  return (
    <SceneFrame label={bn ? 'পানিতে সোডিয়াম' : 'Sodium and water'}>
      {/* stand holding the cylinder */}
      <rect x={cx + 70} y={40} width="6" height="260" fill="url(#cx-metal-h)" />
      <rect x={cx + 14} y={78} width="62" height="5" fill="url(#cx-metal)" />
      <Trough x0={90} x1={560} y={196} h={102} />
      {pink > 0 && <ellipse cx={cx} cy={cageY - 8} rx={30 + 150 * pink} ry={14 + 28 * pink} fill="#f06fb0" opacity={0.18 + 0.32 * pink} filter="url(#cx-blur-lg)" />}
      <InvertedCylinder cx={cx} y={44} h={238} w={36} volume={volume} max={max} />
      {/* gauze cage with the metal */}
      <rect x={cx - 13} y={cageY - 8} width="26" height="18" rx="3" fill="none" stroke="#7d8995" strokeWidth="1.2" strokeDasharray="2 1.5" />
      <path d={`M ${cx + 13} ${cageY} L ${cx + 120} ${cageY - 60} L ${cx + 150} 150`} stroke="#7d8995" strokeWidth="2.2" fill="none" />
      {r > 0.6 && <circle cx={cx + jiggle} cy={cageY + 1} r={r} fill={m.color} stroke={melted ? '#ffffff' : '#9aa3ad'} strokeWidth={melted ? 1.4 : 0.8} />}
      {melted && r > 0.6 && <circle cx={cx + jiggle - r * 0.35} cy={cageY - r * 0.3} r={Math.max(0.6, r * 0.3)} fill="#ffffff" opacity="0.8" />}
      {running && <Bubbles x0={cx - 14} x1={cx + 14} yTop={60} yBottom={cageY - 4} rate={metal === 2 ? 1 : metal === 1 ? 0.8 : 0.45} t={t} seed={4} max={16} size={1.2} />}
      {running && metal === 2 && (
        <g>
          <Glow cx={cx} cy={cageY - 6} r={34} amount={0.6 + 0.3 * Math.sin(t * 17)} color="url(#cx-glow)" />
          <ellipse cx={cx} cy={cageY - 8} rx="18" ry="12" fill="#c07cff" opacity={0.45 + 0.2 * Math.sin(t * 23)} filter="url(#cx-blur)" />
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={cx + (rnd(i + Math.floor(t * 8)) - 0.5) * 40} cy={cageY - 12 - rnd(i * 3 + Math.floor(t * 8)) * 18} r="1.2" fill="#fff4c2" />
          ))}
        </g>
      )}
      <Stopwatch cx={66} cy={70} r={32} seconds={vNum(view, 'clock', 0)} unit="s" label={bn ? 'স্টপওয়াচ' : 'stopwatch'} />
      <Txt x={cx + 52} y={36} anchor="start" size={9} color={C.ink} weight={800}>
        {`${volume.toFixed(1)} mL H₂`}
      </Txt>
      <Txt x={cx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
        {bn ? `তারজালির খাঁচায় ${m.sym}` : `${m.sym} in a gauze cage`}
      </Txt>
      <Txt x={cx} y={BENCH + 34} size={8} color="#b9c7d6">
        {pink > 0 ? (bn ? 'ফেনফথ্যালিন গোলাপি — দ্রবণ ক্ষারীয়' : 'phenolphthalein turns pink — the solution is alkaline') : ''}
      </Txt>
    </SceneFrame>
  );
}
