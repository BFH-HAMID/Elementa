'use client';

import React from 'react';
import { BENCH, C, Glow, Mark, SceneFrame, Tag, Txt, vBool, vNum, vStr, type SceneProps } from '../primitives';
import { BunsenBurner } from '../kit';
import { TestTube } from '../glass';

type SaltDish = { label: string; color: string; mark?: 'good' | 'bad' };

/** Flame test: Bunsen burner, nichrome loop, watch glasses of salts, conc. HCl for cleaning. */
export function FlameScene({ view, t, bn }: SceneProps) {
  const open = vBool(view, 'open');
  const clean = vBool(view, 'clean');
  const cobalt = vBool(view, 'cobalt');
  const color = vStr(view, 'flameColor', '#ffb020');
  const sample = vNum(view, 'sample', 0);
  const salts = (Array.isArray(view.salts) ? view.salts : []) as SaltDish[];
  const bx = 330;
  const barrelTop = BENCH - 66;
  const flameH = open ? 82 : 64;
  const loopX = bx + 9;
  const loopY = barrelTop - flameH * 0.5;
  const sx = (i: number) => 60 + i * 46;
  return (
    <SceneFrame label={bn ? 'শিখা পরীক্ষা' : 'Flame test'}>
      <Glow cx={bx} cy={barrelTop - 40} r={110} amount={open ? 0.5 : 0.35} color={open ? 'url(#cx-glow)' : 'url(#cx-heat)'} />
      <ellipse cx={bx} cy={barrelTop - 40} rx="60" ry="70" fill={color} opacity={open ? 0.12 : 0.06} filter="url(#cx-blur-lg)" />
      <BunsenBurner cx={bx} yb={BENCH} flame={flameH / 44} open={open} color={open ? color : undefined} t={t} />
      {/* nichrome wire loop in a glass holder */}
      <path d={`M 150 118 L ${loopX - 8} ${loopY}`} stroke="#c2cad3" strokeWidth="1.6" />
      <path d="M 96 92 L 152 119" stroke="#a7c2d6" strokeWidth="6" strokeLinecap="round" />
      <path d="M 96 92 L 152 119" stroke="#eef7fd" strokeWidth="2" strokeLinecap="round" />
      <circle cx={loopX - 4} cy={loopY + 1} r="4.5" fill="none" stroke="#d7dde3" strokeWidth="1.6" />
      <circle cx={loopX - 4} cy={loopY + 1} r="2.4" fill={salts[sample]?.color ?? '#ffffff'} opacity="0.9" />
      {/* cobalt-blue glass */}
      {cobalt && (
        <g>
          <rect x={bx + 40} y={barrelTop - 120} width="46" height="120" rx="4" fill="#1f3fb8" opacity="0.38" stroke="#132a7a" strokeWidth="1.5" />
          <Txt x={bx + 63} y={barrelTop - 126} size={8} color={C.ink} weight={800}>
            {bn ? 'কোবাল্ট কাচ' : 'cobalt glass'}
          </Txt>
          <circle cx={bx + 118} cy={barrelTop - 62} r="9" fill="#ffffff" stroke={C.ink} strokeWidth="1.2" />
          <circle cx={bx + 115} cy={barrelTop - 62} r="3.5" fill={C.ink} />
        </g>
      )}
      {/* conc. HCl for cleaning the loop */}
      <TestTube cx={520} y={150} w={24} h={130} spec={{ label: 'HCl', liquid: '#f6f9e8', level: 0.42, fumes: 0.25, fumeColor: '#f1f6e6' }} t={t} seed={7} />
      <Txt x={520} y={BENCH + 20} size={9} color="#e7eef5" weight={800}>
        {bn ? 'গাঢ় HCl' : 'conc. HCl'}
      </Txt>
      {clean ? <Tag x={520} y={138} text={bn ? '✓ তার পরিষ্কার' : '✓ wire clean'} tone="chem" size={8.5} /> : <Tag x={520} y={138} text={bn ? 'তার ময়লা' : 'wire dirty'} tone="warn" size={8.5} />}
      <path d={`M ${bx + 9} ${BENCH - 21} L ${bx + 46} ${BENCH - 34}`} stroke={C.muted} strokeWidth="1" />
      <Tag x={bx + 50} y={BENCH - 34} anchor="start" text={open ? (bn ? 'বায়ুছিদ্র খোলা' : 'air hole open') : bn ? 'বায়ুছিদ্র বন্ধ' : 'air hole closed'} tone={open ? 'chem' : 'warn'} size={8} />
      {/* watch glasses of salts */}
      {salts.map((s, i) => (
        <g key={i}>
          {i === sample && <ellipse cx={sx(i)} cy={BENCH - 4} rx="23" ry="10" fill="url(#cx-halo)" />}
          <ellipse cx={sx(i)} cy={BENCH - 3} rx="18" ry="5" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.2" />
          <ellipse cx={sx(i)} cy={BENCH - 5} rx="9" ry="2.6" fill={s.color} stroke="#9aa6b2" strokeWidth="0.5" />
          <Txt x={sx(i)} y={BENCH + 18} size={9.5} color={i === sample ? '#7cf0b4' : '#e7eef5'} weight={800}>
            {s.label}
          </Txt>
          {s.mark && <Mark x={sx(i) + 15} y={BENCH - 14} good={s.mark === 'good'} />}
        </g>
      ))}
      <Txt x={sx(2)} y={BENCH + 33} size={8} color="#b9c7d6">
        {bn ? 'ঘড়িকাচে লবণ' : 'salts on watch glasses'}
      </Txt>
    </SceneFrame>
  );
}
