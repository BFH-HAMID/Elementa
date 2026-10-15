'use client';

import React from 'react';
import { BENCH, C, Mark, SceneFrame, Tag, Txt, vNum, vStr, type SceneProps } from '../primitives';
import { PaperStrip, Splint } from '../kit';
import { GasJar, TestTube } from '../glass';
import { PopBurst } from './shared';

type JarInfo = { label: string; tint: string; mark?: 'good' | 'bad' };

/** Gas identification: a row of gas jars and the chosen test applied to one of them. */
export function GasJarScene({ view, t, bn }: SceneProps) {
  const jars = (Array.isArray(view.jars) ? view.jars : []) as JarInfo[];
  const active = vNum(view, 'jar', 0);
  const test = vNum(view, 'test', 0);
  const result = vStr(view, 'result', 'none');
  const big = jars[active];
  const jx = (i: number) => 52 + i * 58;
  const bigX = 470;
  const bigYb = BENCH - 2;
  const bigH = 150;
  const top = bigYb - bigH;
  return (
    <SceneFrame label={bn ? 'গ্যাস শনাক্তকরণ' : 'Gas identification'}>
      {jars.map((j, i) => (
        <g key={i} opacity={i === active ? 1 : 0.92}>
          {i === active && <ellipse cx={jx(i)} cy={BENCH - 50} rx="34" ry="62" fill="url(#cx-halo)" />}
          <GasJar cx={jx(i)} yb={BENCH - 2} w={40} h={96} gas={j.tint} fill={1} />
          <Txt x={jx(i)} y={BENCH + 18} size={10} color={i === active ? '#7cf0b4' : '#e7eef5'} weight={800}>
            {j.label}
          </Txt>
          {j.mark && <Mark x={jx(i) + 18} y={BENCH - 104} good={j.mark === 'good'} />}
        </g>
      ))}
      {big && (
        <g>
          <path d={`M ${jx(active) + 22} ${BENCH - 60} C 340 ${BENCH - 140} 380 ${BENCH - 160} ${bigX - 44} ${top + 30}`} fill="none" stroke={C.muted} strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#cx-arrow)" color={C.muted} />
          <GasJar cx={bigX} yb={bigYb} w={74} h={bigH} gas={big.tint} fill={1} cover={false} />
          {/* cover slip slid aside */}
          <rect x={bigX + 16} y={top - 8} width="70" height="4" rx="1" fill="#e9f3fa" stroke="#5f7f99" strokeWidth="0.8" />
          {test === 2 && (
            <g>
              <rect x={bigX - 35} y={bigYb - 26} width="70" height="22" fill={result === 'milky' ? '#f4f6f8' : '#e1eef7'} opacity={result === 'milky' ? 0.95 : 0.6} />
              <Txt x={bigX} y={bigYb - 10} size={8} color={C.ink} weight={800}>
                {result === 'milky' ? (bn ? 'ঘোলা' : 'milky') : bn ? 'স্বচ্ছ' : 'clear'}
              </Txt>
              <TestTube cx={bigX + 70} y={top + 10} w={20} h={96} spec={{ label: '', liquid: '#e9f1f6', level: 0.2 }} t={t} />
              <Txt x={bigX + 70} y={top + 2} size={8} color={C.ink} weight={800}>
                {bn ? 'চুনের পানি' : 'limewater'}
              </Txt>
            </g>
          )}
          {(test === 0 || test === 1) && (
            <g>
              <Splint
                x={bigX - 10}
                y={top + 36}
                angle={-28}
                t={t}
                state={test === 0 ? (result === 'pop' ? 'burning' : result === 'bright' ? 'bright' : 'out') : result === 'relight' ? 'bright' : 'out'}
              />
              {result === 'pop' && <PopBurst x={bigX - 24} y={top + 6} t={t} text={bn ? 'পপ!' : 'POP!'} />}
              {result === 'relight' && <Tag x={bigX - 40} y={top - 16} text={bn ? 'আবার জ্বলে উঠল!' : 'relights!'} tone="chem" size={9} />}
            </g>
          )}
          {(test === 3 || test === 4) && (
            <g>
              <PaperStrip
                cx={bigX}
                y={top - 10}
                h={86}
                color={result === 'bleach' ? '#f6f3ea' : result === 'blue' ? '#2f6fd0' : result === 'red' ? '#e0605a' : test === 3 ? '#d9403c' : '#2f6fd0'}
                wet={0.7}
              />
              <Txt x={bigX + 14} y={top - 16} anchor="start" size={8.5} color={C.ink} weight={800}>
                {test === 3 ? (bn ? 'ভেজা লাল লিটমাস' : 'damp red litmus') : bn ? 'ভেজা নীল লিটমাস' : 'damp blue litmus'}
              </Txt>
            </g>
          )}
          <Txt x={bigX} y={BENCH + 18} size={10.5} color="#7cf0b4" weight={800}>
            {bn ? `জার ${big.label}` : `Jar ${big.label}`}
          </Txt>
        </g>
      )}
    </SceneFrame>
  );
}
