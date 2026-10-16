'use client';

import React from 'react';
import { BENCH, C, Digital, SceneFrame, Stopwatch, Tag, Txt, clampN, fmt, rnd, vBool, vNum, type SceneProps } from '../primitives';

/** Horizontal diffusion tube showing both fronts and the ammonium-chloride ring. */
export function DiffusionScene({ view, t, bn }: SceneProps) {
  const left = 74;
  const right = 566;
  const tubeWidth = right - left;
  const length = Math.max(1, vNum(view, 'tubeLength', 100));
  const scale = tubeWidth / length;
  const nh3 = clampN(vNum(view, 'frontNH3', 0), 0, length);
  const hcl = clampN(vNum(view, 'frontHCl', 0), 0, length);
  const nh3Front = left + nh3 * scale;
  const hclFront = right - hcl * scale;
  const ringX = left + clampN(vNum(view, 'ringPosition', length / 2), 0, length) * scale;
  const formed = vBool(view, 'ringFormed');
  const time = vNum(view, 'time', 0);
  const ratio = vNum(view, 'speedRatio', 1.46);

  return (
    <SceneFrame label={bn ? 'অ্যামোনিয়া ও হাইড্রোজেন ক্লোরাইডের ব্যাপন' : 'Diffusion of ammonia and hydrogen chloride'} hood>
      <Stopwatch cx={76} cy={69} r={31} seconds={time} unit="s" label={bn ? 'সময়' : 'time'} />
      <Digital x={438} y={42} w={142} h={52} value={fmt(time, 0)} unit="s" label={bn ? 'ব্যাপন-সময়' : 'diffusion time'} />
      <Tag x={320} y={76} text={`√(M(HCl)/M(NH₃)) = ${ratio.toFixed(2)}`} tone="chem" size={8.5} />

      {/* The long glass tube and the colourless gases' advancing fronts. */}
      <rect x={left} y={157} width={tubeWidth} height="58" rx="29" fill="#f8fcff" fillOpacity="0.86" stroke={C.glassDark} strokeWidth="2" />
      <rect x={left + 7} y={164} width={Math.max(0, nh3Front - left - 7)} height="44" rx="21" fill="#dce7ff" opacity="0.62" />
      <rect x={hclFront} y={164} width={Math.max(0, right - hclFront - 7)} height="44" rx="21" fill="#d9f0e7" opacity="0.68" />
      <rect x={left + 3} y={157} width="12" height="58" rx="5" fill="#f7f7f4" stroke="#bdc7cf" strokeWidth="1" />
      <rect x={right - 15} y={157} width="12" height="58" rx="5" fill="#f7f7f4" stroke="#bdc7cf" strokeWidth="1" />

      {/* Colour-coded molecular tracers are a teaching aid; the actual gases are colourless. */}
      {Array.from({ length: 9 }, (_, i) => {
        const maxTravel = Math.max(1, nh3Front - left - 18);
        const fraction = (rnd(i + 2) + t * 0.19 + i / 9) % 1;
        const x = left + 20 + fraction * maxTravel;
        const y = 172 + rnd(i + 31) * 28;
        return <circle key={`n-${i}`} cx={Math.min(nh3Front - 4, x)} cy={y} r={2.5 + (i % 2) * 0.35} fill="#5976d4" opacity="0.7" />;
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const maxTravel = Math.max(1, right - hclFront - 18);
        const fraction = (rnd(i + 19) + t * 0.13 + i / 9) % 1;
        const x = right - 20 - fraction * maxTravel;
        const y = 172 + rnd(i + 51) * 28;
        return <circle key={`h-${i}`} cx={Math.max(hclFront + 4, x)} cy={y} r={2.3 + (i % 2) * 0.35} fill="#4f9b73" opacity="0.72" />;
      })}

      {/* Direction arrows show that NH₃ travels farther in the same time. */}
      <path d={`M ${left + 18} 139 L ${Math.max(left + 26, nh3Front - 8)} 139`} fill="none" stroke="#566fc7" strokeWidth="2" markerEnd="url(#cx-arrow)" />
      <path d={`M ${right - 18} 139 L ${Math.min(right - 26, hclFront + 8)} 139`} fill="none" stroke="#448461" strokeWidth="2" markerEnd="url(#cx-arrow)" />
      <Txt x={left + 8} y={132} anchor="start" size={9} color="#4058a8" weight={900}>{bn ? 'NH₃ দ্রুততর' : 'NH₃ faster'}</Txt>
      <Txt x={right - 8} y={132} anchor="end" size={9} color="#31724c" weight={900}>{bn ? 'HCl ধীরতর' : 'HCl slower'}</Txt>

      {/* The white product band appears exactly where the two fronts meet. */}
      {formed && (
        <g>
          <ellipse cx={ringX} cy={186} rx="15" ry="27" fill="#ffffff" opacity="0.76" filter="url(#cx-blur-lg)" />
          <rect x={ringX - 3.4} y={163} width="6.8" height="46" rx="3.4" fill="#ffffff" stroke="#e0e6eb" strokeWidth="1" />
          <path d={`M ${ringX} 159 L ${ringX} 119`} stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" />
          <Tag x={ringX} y={112} text={bn ? 'সাদা NH₄Cl বলয়' : 'white NH₄Cl ring'} tone="light" size={8} />
        </g>
      )}
      {!formed && (
        <Txt x={320} y={238} size={9} color={C.muted} weight={800}>
          {bn ? 'গ্যাসের ফ্রন্ট এগোচ্ছে…' : 'gas fronts advancing…'}
        </Txt>
      )}

      {/* Centimetre scale along the sealed-length demonstration tube. */}
      <line x1={left} y1={245} x2={right} y2={245} stroke="#596878" strokeWidth="1.2" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = left + (tubeWidth * i) / 10;
        return (
          <g key={i}>
            <line x1={x} y1={242} x2={x} y2={i % 5 === 0 ? 254 : 250} stroke="#596878" strokeWidth="1" />
            {i % 2 === 0 && <Txt x={x} y={267} size={7.5} color="#d7e1eb" weight={700}>{i * 10}</Txt>}
          </g>
        );
      })}
      <Txt x={320} y={284} size={8} color="#d7e1eb" weight={700}>{bn ? 'নলের দৈর্ঘ্য: ১০০ cm' : 'tube length: 100 cm'}</Txt>
      <Txt x={left + 6} y={BENCH + 18} anchor="start" size={8.5} color="#dbe7f1" weight={800}>{bn ? 'NH₃-ভেজা তুলা' : 'NH₃-soaked cotton'}</Txt>
      <Txt x={right - 6} y={BENCH + 18} anchor="end" size={8.5} color="#dbe7f1" weight={800}>{bn ? 'HCl-ভেজা তুলা' : 'HCl-soaked cotton'}</Txt>
      <Txt x={320} y={BENCH + 35} size={7.5} color="#b8c7d6">{bn ? 'রঙিন বিন্দু শুধু গ্যাসের চলন বোঝায়; গ্যাস দুটি বর্ণহীন।' : 'Coloured tracers indicate motion only; both gases are colourless.'}</Txt>
    </SceneFrame>
  );
}
