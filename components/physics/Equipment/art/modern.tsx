'use client';

import React from 'react';
import { BindingPost, Contact, Display, Etch, GlassTube, Knob, LinearScale, Rod, Screw, clamp, num, on, type ArtEntry } from './shared';

/* ------------------------------------------------------------------ */
/* Modern physics: photocell, GM counter, Franck–Hertz, sealed source   */
/* ------------------------------------------------------------------ */

const hc = 1239.841; // eV·nm

const photoelectric: ArtEntry = {
  vb: '0 0 158 96',
  Comp: ({ p, bn, live }) => {
    const lambda = num(p.filterWavelengthNm, 450);
    const vRet = clamp(num(p.retardingVoltage, 0), -3, 2);
    const material = typeof p.cathodeMaterial === 'string' ? p.cathodeMaterial : 'potassium';
    const work: Record<string, number> = { potassium: 2.2, sodium: 2.28, caesium: 2.1, zinc: 4.3, copper: 4.7 };
    const phi = work[material] ?? 2.2;
    const photon = hc / lambda;
    const emitting = photon > phi;
    const vStop = Math.max(0, photon - phi);
    const current = emitting && vRet < vStop ? clamp((vStop - vRet) * 4, 0, 9.4) : 0;
    const colour = lambda < 430 ? '#8b5cf6' : lambda < 490 ? '#2563eb' : lambda < 560 ? '#22c55e' : lambda < 620 ? '#eab308' : '#ef4444';
    return (
      <g>
        <Contact cx={79} cy={92} rx={62} opacity={0.3} />
        {/* mercury lamp with a filter housing */}
        <g>
          <rect x={6} y={30} width={34} height={40} rx={4} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.8} filter="url(#ix-drop)" />
          <rect x={10} y={34} width={26} height={12} rx={2} fill="url(#ix-screen-off)" stroke="#334155" strokeWidth={0.5} />
          {live && <rect x={11} y={35} width={24} height={10} rx={2} fill={colour} opacity={0.75} filter="url(#ix-glow)" />}
          <Etch x={23} y={64} size={4.6} color="#cbd5e1" mono>
            {`${lambda} nm`}
          </Etch>
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1={12} y1={22 + i * 2} x2={34} y2={22 + i * 2} stroke="#94a3b8" strokeWidth={0.7} opacity={0.5} />
          ))}
        </g>
        {/* collimated beam */}
        <path d={`M 40 46 H 62`} stroke={colour} strokeWidth={3} opacity={0.85} />
        {live && <path d={`M 40 46 H 62`} stroke={colour} strokeWidth={7} opacity={0.25} filter="url(#ix-blur)" />}
        {/* evacuated photocell: a glass bulb with a potassium cathode and an anode ring */}
        <ellipse cx={88} cy={46} rx={30} ry={26} fill="#eef7ff" opacity={0.6} stroke="#7ea9c9" strokeWidth={1} />
        <path d="M 62 42 a 26 22 0 0 1 0 8" fill="none" stroke="#8a6d3b" strokeWidth={4} strokeLinecap="round" />
        <path d="M 96 26 a 22 26 0 0 1 0 40" fill="none" stroke="#9aa4ad" strokeWidth={1.6} />
        <ellipse cx={88} cy={46} rx={30} ry={26} fill="url(#ix-glass-sheen)" opacity={0.3} />
        {emitting && live && (
          <g>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={70 + i * 8} cy={46 - 6 + i * 6} r={2.2} fill="#7dd3fc" opacity={0.9} style={{ animation: `ix-pulse ${1 + i * 0.22}s ease-in-out infinite` }} />
            ))}
          </g>
        )}
        {/* microammeter showing the photocurrent */}
        <g transform="translate(132 40)">
          <circle r={17} fill="url(#ix-dial)" stroke="#b9ac93" strokeWidth={0.8} />
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (-60 + i * 12) * (Math.PI / 180);
            return <line key={i} x1={Math.sin(a) * 12} y1={8 - Math.cos(a) * 12} x2={Math.sin(a) * 15} y2={8 - Math.cos(a) * 15} stroke="#1f2937" strokeWidth={i % 5 === 0 ? 0.9 : 0.4} />;
          })}
          <line
            x1={0}
            y1={8}
            x2={Math.sin((-60 + Math.min(1, current / 9.4) * 120) * (Math.PI / 180)) * 15}
            y2={8 - Math.cos((-60 + Math.min(1, current / 9.4) * 120) * (Math.PI / 180)) * 15}
            stroke="#0f172a"
            strokeWidth={1.2}
            style={{ transition: 'all 600ms cubic-bezier(.16,.9,.24,1.06)' }}
          />
          <circle cx={0} cy={8} r={1.8} fill="url(#ix-brass)" />
          <circle cx={0} cy={0} r={17} fill="url(#ix-glass-sheen)" opacity={0.3} />
          <Etch x={0} y={-21} size={4.4} color="#334155" weight={800}>
            µA
          </Etch>
          <Etch x={0} y={28} size={4.4} color="#334155" mono>
            {current.toFixed(1)}
          </Etch>
        </g>
        {/* retarding-voltage dial */}
        <Knob cx={132} cy={74} r={8} kind="black" />
        <Etch x={132} y={92} size={4.6} color="#334155" mono>
          {`V: ${vRet.toFixed(1)} V`}
        </Etch>
        <BindingPost cx={104} cy={80} r={3.2} polarity="negative" />
        <BindingPost cx={116} cy={80} r={3.2} polarity="positive" />
        <Etch x={79} y={12} size={5} color="#334155" weight={800} mono>
          {emitting ? `${bn ? 'নির্গমন চলছে' : 'EMISSION'} · eVs = ${vStop.toFixed(2)} V` : bn ? 'থ্রেশহোল্ডের নিচে' : 'BELOW THRESHOLD'}
        </Etch>
      </g>
    );
  }
};

const gmCounter: ArtEntry = {
  vb: '0 0 148 100',
  Comp: ({ p, bn, live }) => {
    const dist = clamp(num(p.sourceDistanceCm, 10), 2, 50);
    const hv = num(p.highVoltage, 450);
    const rate = Math.round((220 / (dist * dist)) * (hv / 450) * 60);
    const [clicks, setClicks] = React.useState(0);
    const [flash, setFlash] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      const id = window.setInterval(() => {
        setClicks((c) => (c + 1) % 10000);
        setFlash((f) => f + 1);
      }, Math.max(120, 30000 / Math.max(1, rate)));
      return () => window.clearInterval(id);
    }, [live, rate]);
    void clicks;
    return (
      <g>
        <Contact cx={74} cy={96} rx={58} opacity={0.3} />
        {/* electronic counter / scaler box */}
        <rect x={56} y={16} width={88} height={58} rx={5} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.9} filter="url(#ix-drop)" />
        <rect x={56} y={16} width={88} height={12} rx={4} fill="#ffffff" opacity={0.35} />
        <Display x={62} y={28} w={56} h={18} text={`${rate}`} unit="cpm" on color="lcd" digits={6} />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={124 + (i % 4) * 5} cy={30 + Math.floor(i / 4) * 7} r={1.8} fill={live && (flash + i) % 4 === 0 ? '#f59e0b' : '#94a3b8'} />
        ))}
        {/* loudspeaker grille that ticks with each count */}
        <rect x={62} y={50} width={34} height={20} rx={2} fill="url(#ix-charcoal)" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={64 + i * 3.6} y1={52} x2={64 + i * 3.6} y2={68} stroke="#0b1220" strokeWidth={1.1} opacity={0.8} />
        ))}
        <Knob cx={128} cy={60} r={7} kind="black" />
        <Etch x={128} y={74} size={4} color="#334155" mono>
          {`${hv} V`}
        </Etch>
        {/* GM tube on a clamp stand, with the lead to the scaler */}
        <g>
          <rect x={18} y={40} width={54} height={16} rx={8} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.7} />
          <rect x={22} y={42} width={46} height={5} rx={3} fill="#ffffff" opacity={0.4} />
          <Etch x={45} y={51} size={4.6} color="#334155" weight={800} mono>
            GM
          </Etch>
          <path d="M 70 48 C 84 46 92 44 100 40" fill="none" stroke="#334155" strokeWidth={1.6} />
          <Rod x1={45} y1={56} x2={45} y2={84} w={4} />
          <rect x={30} y={84} width={30} height={7} rx={2} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.5} />
          {/* end-window keeps alpha/beta out (marked) */}
          <rect x={16} y={44} width={6} height={8} rx={1.6} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
        </g>
        {/* sealed source on a rack at the set distance */}
        <g transform={`translate(${clamp(20 - dist * 0.1, 4, 16)} 66)`}>
          <rect x={0} y={0} width={26} height={16} rx={2} fill="url(#ix-lead)" stroke="#111827" strokeWidth={0.6} />
          <circle cx={13} cy={8} r={4} fill="#eab308" />
          <path d="M 13 4.6 L 13 8 M 13 8 L 10.4 10.2 M 13 8 L 15.6 10.2" stroke="#1f2937" strokeWidth={0.7} />
          {live && (
            <g>
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={26 + i * 9 + (flash % 3) * 2} cy={8} r={1.6} fill="#facc15" opacity={0.85} style={{ animation: `ix-pulse ${(0.9 + i * 0.3).toFixed(2)}s ease-in-out infinite` }} />
              ))}
            </g>
          )}
        </g>
        <Etch x={74} y={96} size={5} color="#334155" weight={800} mono>
          {`${dist} cm from tube`}
        </Etch>
        {bn && <Etch x={74} y={10} size={4.8} color="#475569">{'গাইগার-মুলার কাউন্টার'}</Etch>}
      </g>
    );
  }
};

const franckHertz: ArtEntry = {
  vb: '0 0 138 84',
  Comp: ({ p, bn, live }) => {
    const V = clamp(num(p.acceleratingVoltage, 0), 0, 30);
    // Argon: excitation at ~11.8 V and a further step at 23.6 V
    const excited = V > 11.8 ? (V > 23.6 ? 1 : (V - 11.8) / 11.8) : 0;
    const [pulse, setPulse] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setPulse(Math.sin(((now - t0) / 700) * Math.PI * 2));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live]);
    return (
      <g>
        <Contact cx={69} cy={80} rx={48} opacity={0.3} />
        {/* oven with a viewing window */}
        <rect x={14} y={14} width={110} height={50} rx={5} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.9} filter="url(#ix-drop)" />
        <rect x={14} y={14} width={110} height={10} rx={4} fill="#ffffff" opacity={0.1} />
        <rect x={24} y={26} width={90} height={30} rx={3} fill="#0d1117" stroke="#334155" strokeWidth={0.6} />
        {/* the tube with cathode, grids, collector and the glowing argon column */}
        <GlassTube x={30} y={30} w={78} h={22} rx={9} />
        {[
          { x: 36, label: 'K' },
          { x: 62, label: 'G1' },
          { x: 86, label: 'G2' },
          { x: 100, label: 'A' }
        ].map((e) => (
          <g key={e.label}>
            <line x1={e.x} y1={32} x2={e.x} y2={50} stroke="#cbd5e1" strokeWidth={1.1} />
            <Etch x={e.x} y={56} size={3.8} color="#94a3b8">
              {e.label}
            </Etch>
          </g>
        ))}
        {live && (
          <rect
            x={40}
            y={36}
            width={Math.max(4, (V / 30) * 54)}
            height={10}
            rx={5}
            fill="url(#ix-glow-amber)"
            opacity={0.55 + excited * 0.3 + pulse * 0.06}
          />
        )}
        {/* accelerating-voltage dial */}
        <Knob cx={124} cy={40} r={8} kind="black" />
        <Etch x={124} y={56} size={4.4} color="#94a3b8" mono>
          {`${V.toFixed(1)} V`}
        </Etch>
        <BindingPost cx={26} cy={74} r={3} polarity="negative" />
        <BindingPost cx={112} cy={74} r={3} polarity="positive" />
        <Etch x={70} y={80} size={5} color="#334155" weight={800} mono>
          {excited > 0.9 ? (bn ? 'দ্বিতীয় উত্তেজনা' : '2nd EXCITATION') : excited > 0.05 ? (bn ? 'প্রথম উত্তেজনা স্তর' : '1st EXCITATION') : bn ? 'স্থিতিশীল' : 'NO COLLISION LOSS'}
        </Etch>
        {bn && <Etch x={70} y={10} size={4.6} color="#475569">{'ফ্রাঙ্ক-হার্টজ নল'}</Etch>}
      </g>
    );
  }
};

const radioactiveSource: ArtEntry = {
  vb: '0 0 76 62',
  Comp: ({ p, bn, live }) => {
    const isotope = typeof p.isotope === 'string' ? p.isotope : 'cobalt-60';
    const halfLife: Record<string, string> = { 'cobalt-60': '5.27 y', 'strontium-90': '28.8 y', 'radium-226': '1600 y', 'americium-241': '432 y' };
    return (
      <g>
        <Contact cx={38} cy={58} rx={26} opacity={0.32} />
        {/* lead castle with a collimated port */}
        <rect x={8} y={10} width={60} height={44} rx={4} fill="url(#ix-lead)" stroke="#111827" strokeWidth={0.8} filter="url(#ix-drop)" />
        <rect x={8} y={10} width={60} height={8} rx={4} fill="#ffffff" opacity={0.16} />
        <circle cx={26} cy={32} r={9} fill="#eab308" stroke="#78350f" strokeWidth={0.6} />
        <path d="M 26 23 L 26 32 M 26 32 L 18.5 36.5 M 26 32 L 33.5 36.5" stroke="#1f2937" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={26} cy={32} r={3} fill="#1f2937" />
        {/* the sealed capsule in its channel */}
        <rect x={40} y={26} width={22} height={12} rx={2} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.6} />
        <circle cx={51} cy={32} r={3.6} fill="#f59e0b" stroke="#78350f" strokeWidth={0.5} />
        {/* collimated beam out of the port */}
        {live && (
          <g>
            <path d="M 63 29 L 74 26 L 74 38 L 63 35 Z" fill="#facc15" opacity={0.28} filter="url(#ix-glow)" />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={64 + i * 4} cy={32} r={1.3} fill="#fde68a" opacity={0.9} style={{ animation: `ix-pulse ${(0.8 + i * 0.35).toFixed(2)}s ease-in-out infinite` }} />
            ))}
          </g>
        )}
        <Screw cx={14} cy={16} r={1.8} />
        <Etch x={38} y={60} size={4.8} color="#334155" weight={800} mono>
          {`${isotope} · t½ ${halfLife[isotope] ?? '—'}`}
        </Etch>
        {bn && <Etch x={38} y={6} size={4.4} color="#475569">{'সিলড তেজস্ক্রিয় উৎস'}</Etch>}
      </g>
    );
  }
};

export const modernArt: Record<string, ArtEntry> = {
  'photoelectric-effect-apparatus': photoelectric,
  'geiger-muller-counter': gmCounter,
  'franck-hertz-tube': franckHertz,
  'radioactive-source-sample': radioactiveSource
};
