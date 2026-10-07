'use client';

import React, { useRef } from 'react';
import { C, Digital, Grip, SceneFrame, Txt, fmt, num, useSvgDrag, type SceneProps } from '../primitives';

/* ------------------------------------------------------------------ */
/* Vernier caliper                                                      */
/* ------------------------------------------------------------------ */

export function VernierScene({ view, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const gap = num(view, 'gap');
  const size = num(view, 'size');
  const zero = num(view, 'zero');
  const vsr = num(view, 'vsr');
  const msr = num(view, 'msr');
  const touching = num(view, 'touching') === 1;
  const ppm = 9; // px per mm
  const x0 = 70;
  const sy = 70; // scale top
  const jawX = x0 + gap * ppm;
  const vz = x0 + (gap + zero) * ppm;
  // magnifier
  const mz = 22; // px per mm in magnifier
  const mx0 = 150;
  const mStart = Math.max(0, Math.floor(gap + zero) - 2);
  const mVz = mx0 + (gap + zero - mStart) * mz;
  return (
    <SceneFrame ref={ref} label="Vernier caliper">
      {/* main beam */}
      <rect x={x0 - 30} y={sy} width={500} height={36} rx={4} fill="url(#pr-metal)" />
      {Array.from({ length: 51 }).map((_, i) => (
        <g key={i}>
          <line x1={x0 + i * ppm} x2={x0 + i * ppm} y1={sy} y2={sy + (i % 10 === 0 ? 14 : i % 5 === 0 ? 10 : 6)} stroke="#0f172a" strokeWidth={i % 10 === 0 ? 1.2 : 0.7} />
          {i % 10 === 0 && <Txt x={x0 + i * ppm} y={sy + 25} size={9} color="#0f172a">{i / 10}</Txt>}
        </g>
      ))}
      <Txt x={x0 + 470} y={sy + 25} size={8} color="#0f172a">cm</Txt>
      {/* fixed jaw */}
      <path d={`M ${x0 - 30} ${sy + 36} L ${x0} ${sy + 36} L ${x0} ${sy + 130} L ${x0 - 12} ${sy + 130} L ${x0 - 30} ${sy + 100} Z`} fill="url(#pr-metal)" stroke={C.steelDark} />
      {/* object */}
      <rect x={x0} y={sy + 60} width={size * ppm} height={56} rx={size > 20 ? 6 : 28} fill={C.copper} opacity={0.85} />
      <Txt x={x0 + (size * ppm) / 2} y={sy + 92} size={10} color="#fff">{bn ? 'বস্তু' : 'object'}</Txt>
      {/* sliding jaw + vernier */}
      <g>
        <path d={`M ${jawX} ${sy - 6} L ${jawX + 100} ${sy - 6} L ${jawX + 100} ${sy + 50} L ${jawX + 30} ${sy + 50} L ${jawX + 30} ${sy + 100} L ${jawX + 12} ${sy + 130} L ${jawX} ${sy + 130} Z`} fill="#cbd5e1" stroke={C.steelDark} opacity={0.96} />
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={i} x1={vz + i * 0.9 * ppm} x2={vz + i * 0.9 * ppm} y1={sy + 50} y2={sy + 50 - (i % 5 === 0 ? 12 : 8)} stroke={i === vsr ? C.green : '#0f172a'} strokeWidth={i === vsr ? 2 : 0.8} />
        ))}
      </g>
      <rect x={jawX - 6} y={sy - 10} width={110} height={150} fill="transparent" {...drag((pt, st) => setParam('jaw', Math.round((gap + (pt.x - st.x) / ppm) * 20) / 20))} />
      <Grip x={jawX + 60} y={sy + 20} color={touching ? C.green : C.blue} />
      {/* magnifier inset */}
      <rect x={120} y={225} width={400} height={110} rx={12} fill={C.surface} stroke={C.line} strokeWidth={1.5} />
      <Txt x={130} y={240} size={9.5} anchor="start">{bn ? 'বিবর্ধিত দৃশ্য' : 'Magnified view'}</Txt>
      <g>
        {Array.from({ length: 17 }).map((_, i) => {
          const v = mStart + i;
          const x = mx0 + i * mz;
          if (x > 510) return null;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={250} y2={250 + (v % 10 === 0 ? 24 : v % 5 === 0 ? 18 : 12)} stroke={C.ink} strokeWidth={v % 5 === 0 ? 1.4 : 0.9} />
              {v % 5 === 0 && <Txt x={x} y={290} size={9}>{v}</Txt>}
            </g>
          );
        })}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = mVz + i * 0.9 * mz;
          if (x > 515) return null;
          return (
            <g key={`v${i}`}>
              <line x1={x} x2={x} y1={298} y2={298 + (i % 5 === 0 ? 20 : 13)} stroke={i === vsr ? C.green : C.blueDark} strokeWidth={i === vsr ? 2.6 : 1.1} />
              {i % 5 === 0 && <Txt x={x} y={330} size={8.5} color={C.blueDark}>{i}</Txt>}
            </g>
          );
        })}
      </g>
      <Digital x={540} y={50} w={90} text={`${msr} mm`} label="MSR" />
      <Digital x={540} y={110} w={90} text={`${vsr}`} label="VSR" good={touching} />
      <Digital x={540} y={170} w={90} text={`${fmt(msr + vsr * 0.1 - zero, 2)}`} label={bn ? 'পাঠ (mm)' : 'Reading (mm)'} good={touching} />
      {zero !== 0 && <Txt x={585} y={225} size={9} color={C.red}>{bn ? 'শূন্য ত্রুটি' : 'zero err'} {zero > 0 ? '+' : ''}{zero}</Txt>}
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Screw gauge                                                          */
/* ------------------------------------------------------------------ */

export function ScrewGaugeScene({ view, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const gap = num(view, 'gap');
  const d = num(view, 'd');
  const zero = num(view, 'zero');
  const psr = num(view, 'psr');
  const csr = num(view, 'csr');
  const touching = num(view, 'touching') === 1;
  const ppm = 16;
  const anvil = 150;
  const cy = 150;
  const spindle = anvil + gap * ppm;
  const reading = gap + zero;
  const sleeve0 = 300;
  const edge = sleeve0 + reading * ppm;
  return (
    <SceneFrame ref={ref} label="Screw gauge">
      {/* U-frame */}
      <path d={`M ${anvil - 20} ${cy - 16} L ${anvil - 20} ${cy + 90} Q ${anvil - 20} 290 ${anvil + 80} 290 L 280 290 L 300 ${cy + 18} L 290 ${cy + 18} L 270 270 L ${anvil + 80} 270 Q ${anvil} 270 ${anvil} ${cy + 90} L ${anvil} ${cy - 16} Z`} fill="#475569" />
      <rect x={anvil - 20} y={cy - 16} width={20} height={32} fill="url(#pr-metal)" />
      {/* wire */}
      <circle cx={anvil + (d * ppm) / 2} cy={cy} r={(d * ppm) / 2} fill={C.copper} />
      {/* spindle */}
      <rect x={spindle} y={cy - 10} width={sleeve0 - spindle + 4} height={20} fill="url(#pr-metal)" />
      {/* sleeve with linear scale */}
      <rect x={sleeve0} y={cy - 18} width={180} height={36} fill="#cbd5e1" stroke={C.steelDark} />
      <line x1={sleeve0} x2={sleeve0 + 180} y1={cy} y2={cy} stroke="#0f172a" strokeWidth={1} />
      {Array.from({ length: 21 }).map((_, i) => (
        <g key={i}>
          <line x1={sleeve0 + i * ppm * 0.5} x2={sleeve0 + i * ppm * 0.5} y1={cy} y2={i % 2 === 0 ? cy - 10 : cy + 8} stroke="#0f172a" strokeWidth={0.9} />
          {i % 2 === 0 && i % 4 === 0 && <Txt x={sleeve0 + i * ppm * 0.5} y={cy - 12} size={8.5} color="#0f172a">{i / 2}</Txt>}
        </g>
      ))}
      {/* thimble */}
      <rect x={edge} y={cy - 32} width={110} height={64} rx={6} fill="url(#pr-metal)" stroke={C.steelDark} />
      {Array.from({ length: 11 }).map((_, k) => {
        const div = (csr - 5 + k + 100) % 100;
        const y = cy + (k - 5) * 6;
        return (
          <g key={k}>
            <line x1={edge} x2={edge + (div % 5 === 0 ? 14 : 8)} y1={y} y2={y} stroke={k === 5 ? C.green : '#0f172a'} strokeWidth={k === 5 ? 2 : 0.8} />
            {div % 10 === 0 && <Txt x={edge + 24} y={y + 3} size={8} color="#0f172a">{div}</Txt>}
          </g>
        );
      })}
      <rect x={edge + 110} y={cy - 14} width={50} height={28} rx={4} fill={C.steelDark} />
      <Txt x={edge + 135} y={cy + 4} size={8.5} color="#fff">{bn ? 'র‍্যাচেট' : 'ratchet'}</Txt>
      <rect x={edge - 4} y={cy - 40} width={180} height={80} fill="transparent" {...drag((pt, st) => setParam('gap', Math.round((gap + (pt.x - st.x) / ppm) * 100) / 100))} />
      <Grip x={edge + 60} y={cy - 22} color={touching ? C.green : C.blue} />
      <Digital x={150} y={300} w={110} text={`${psr} mm`} label="PSR" />
      <Digital x={280} y={300} w={110} text={`${csr}`} label="CSR" good={touching} />
      <Digital x={410} y={300} w={130} text={`${fmt(psr + csr * 0.01 - zero, 2)} mm`} label={bn ? 'সংশোধিত পাঠ' : 'Corrected'} good={touching} />
      <Txt x={320} y={40} size={10.5}>{bn ? 'পিচ ১ মিমি · বৃত্তাকার স্কেলে ১০০ ঘর · লঘিষ্ঠ গণন ০.০১ মিমি' : 'Pitch 1 mm · 100 circular divisions · LC 0.01 mm'}</Txt>
      {zero !== 0 && <Txt x={320} y={58} size={9.5} color={C.red}>{bn ? 'শূন্য ত্রুটি' : 'Zero error'} {zero > 0 ? '+' : ''}{zero} mm</Txt>}
    </SceneFrame>
  );
}
