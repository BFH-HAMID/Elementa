'use client';

import React from 'react';
import { BENCH, C, SceneFrame, Stopwatch, Thermometer, Txt, clampN, vBool, vNum, type SceneProps } from '../primitives';
import { ConicalFlask } from '../glass';

/** Disappearing cross: side view of the flask on a paper cross, plus the view from above. */
export function CrossFlaskScene({ view, t, bn }: SceneProps) {
  const cloud = clampN(vNum(view, 'cloud', 0), 0, 1.3);
  const clock = vNum(view, 'clock', 0);
  const temp = vNum(view, 'temp', 25);
  const bath = vBool(view, 'bath');
  const opacity = clampN(Math.pow(Math.min(cloud, 1), 1.1), 0, 1);
  const crossVis = clampN(1 - Math.pow(Math.min(cloud, 1), 1.4), 0, 1);
  const fx = 220;
  const sulfur = '#efe3a8';
  const eyeX = 470;
  const eyeY = 64;
  return (
    <SceneFrame label={bn ? 'অদৃশ্য ক্রস পরীক্ষা' : 'Disappearing cross experiment'}>
      {/* paper with the cross */}
      <path d={`M ${fx - 92} ${BENCH + 2} L ${fx + 92} ${BENCH + 2} L ${fx + 104} ${BENCH + 22} L ${fx - 104} ${BENCH + 22} Z`} fill="#fbfaf4" stroke="#d9d3bd" />
      <path d={`M ${fx - 40} ${BENCH + 6} L ${fx + 40} ${BENCH + 18} M ${fx + 40} ${BENCH + 6} L ${fx - 40} ${BENCH + 18}`} stroke="#111827" strokeWidth="3.4" strokeLinecap="round" />
      {bath && (
        <g>
          <rect x={fx - 92} y={170} width="184" height="128" rx="6" fill={temp > 35 ? '#ffe4cf' : '#dceffb'} opacity="0.7" />
          <rect x={fx - 92} y={170} width="184" height="128" rx="6" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.5" />
        </g>
      )}
      <ConicalFlask cx={fx} yb={BENCH - 2} w={124} h={128} liquid="#f2f6f9" level={0.62} t={t} />
      {/* sulfur cloud over the liquid */}
      <ConicalFlask cx={fx} yb={BENCH - 2} w={124} h={128} liquid={sulfur} level={0.62} opacity={opacity * 0.95} t={t} />
      <Thermometer x={fx + 30} y={110} h={150} value={temp} min={0} max={70} label={false} />
      <Txt x={fx + 30} y={104} size={8.5} color={C.ink} weight={800}>
        {temp} °C
      </Txt>
      {/* eye and line of sight */}
      <g>
        <path d={`M ${eyeX - 14} ${eyeY} Q ${eyeX} ${eyeY - 11} ${eyeX + 14} ${eyeY} Q ${eyeX} ${eyeY + 11} ${eyeX - 14} ${eyeY} Z`} fill="#ffffff" stroke={C.ink} strokeWidth="1.4" />
        <circle cx={eyeX} cy={eyeY} r="4.5" fill="#24486b" />
        <path d={`M ${eyeX - 18} ${eyeY + 8} C ${fx + 120} ${eyeY + 20} ${fx + 20} ${eyeY + 40} ${fx} ${150}`} fill="none" stroke={C.muted} strokeWidth="1" strokeDasharray="3 3" />
      </g>
      {/* view from above */}
      <g>
        <circle cx={eyeX} cy={190} r="72" fill="#fbfaf4" stroke={C.glassDark} strokeWidth="2" />
        <path d={`M ${eyeX - 38} 152 L ${eyeX + 38} 228 M ${eyeX + 38} 152 L ${eyeX - 38} 228`} stroke="#111827" strokeWidth="9" strokeLinecap="round" opacity={crossVis} />
        <circle cx={eyeX} cy={190} r="70" fill={sulfur} opacity={opacity * 0.97} />
        <circle cx={eyeX} cy={190} r="72" fill="none" stroke={C.glassDark} strokeWidth="2" />
        <Txt x={eyeX} y={278} size={9} color={C.ink} weight={800}>
          {bn ? 'উপর থেকে দেখা' : 'view from above'}
        </Txt>
        <Txt x={eyeX} y={291} size={8.5} color={crossVis < 0.05 ? C.chemDark : C.muted} weight={800}>
          {crossVis < 0.05 ? (bn ? 'ক্রস দেখা যায় না' : 'cross hidden') : bn ? 'ক্রস দেখা যায়' : 'cross visible'}
        </Txt>
      </g>
      <Stopwatch cx={64} cy={70} r={34} seconds={clock} unit="s" label={bn ? 'স্টপওয়াচ' : 'stopwatch'} />
      <Txt x={fx} y={BENCH + 36} size={8.5} color="#c9d6e3" weight={700}>
        {`Na₂S₂O₃ ${vNum(view, 'vthio', 50)} mL + ${bn ? 'পানি' : 'water'} ${50 - vNum(view, 'vthio', 50)} mL + HCl 5 mL`}
      </Txt>
    </SceneFrame>
  );
}
