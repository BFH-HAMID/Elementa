'use client';

import React from 'react';
import { Contact, Display, Etch, Flame, GlassTube, Knob, LinearScale, Led, Rod, Sheen, WoodBoard, clamp, num, on, type ArtEntry } from './shared';

/* ------------------------------------------------------------------ */
/* Heat: thermometers, calorimeters, burners and conductivity           */
/* ------------------------------------------------------------------ */

const mercuryThermometer: ArtEntry = {
  vb: '0 0 48 132',
  Comp: ({ p, bn }) => {
    const t = clamp(num(p.readingCelsius, 25), -10, 110);
    const y0 = 16;
    const y1 = 112;
    const frac = (t + 10) / 120;
    const colTop = y1 - (y1 - y0) * frac;
    return (
      <g>
        {/* stem with an enamelled back strip */}
        <rect x={17} y={10} width={14} height={110} rx={6} fill="#fdfcf7" opacity={0.85} stroke="#c7d4de" strokeWidth={0.8} />
        <rect x={18} y={11} width={12} height={108} rx={5} fill="url(#ix-glass-edge)" opacity={0.55} />
        <rect x={12} y={12} width={8} height={104} rx={2} fill="#f4efdf" stroke="#d6cfba" strokeWidth={0.6} />
        {/* printed scale (real -10…110 range) */}
        <LinearScale x={12} y={12} w={8} h={104} from={-10} to={110} major={10} minor={2} vertical size={4} />
        {/* mercury thread + bulb */}
        <rect x={23}
          y={colTop}
          width={3.4}
          height={y1 - colTop + 6}
          fill="url(#ix-mercury)"
        />
        <circle cx={24.7} cy={118} r={6.4} fill="url(#ix-mercury)" stroke="#8d99a5" strokeWidth={0.6} />
        <circle cx={22.6} cy={116} r={1.8} fill="#ffffff" opacity={0.55} />
        {/* glass highlights */}
        <line x1={28} y1={14} x2={28} y2={114} stroke="#ffffff" strokeOpacity={0.8} strokeWidth={1} />
        <line x1={20} y1={16} x2={20} y2={110} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.6} />
        {/* reading flag */}
        <g>
          <rect x={32} y={clamp(colTop - 6, 6, 118)} width={12} height={10} rx={2} fill="#0f172a" opacity={0.9} />
          <Etch x={38} y={clamp(colTop - 6, 6, 118) + 7.6} size={5} color="#7dd3fc" mono>
            {`${t.toFixed(0)}°`}
          </Etch>
        </g>
        {bn && (
          <Etch x={24} y={8} size={4.6} color="#475569">
            {'থার্মোমিটার'}
          </Etch>
        )}
      </g>
    );
  }
};

const digitalThermometer: ArtEntry = {
  vb: '0 0 96 72',
  Comp: ({ p, bn, live }) => {
    const t = num(p.readingCelsius, 25);
    return (
      <g>
        <Contact cx={48} cy={68} rx={30} opacity={0.3} />
        <rect x={22} y={8} width={52} height={44} rx={6} fill="url(#ix-cream)" stroke="#b9ac93" strokeWidth={0.8} filter="url(#ix-drop)" />
        <rect x={22} y={8} width={52} height={16} rx={6} fill="#ffffff" opacity={0.35} />
        <Display x={28} y={16} w={40} h={16} text={t.toFixed(1)} unit="°C" on color="lcd" digits={5} />
        <Etch x={48} y={42} size={5.2} color="#4b5563" weight={700}>
          {bn ? 'ডিজিটাল থার্মোমিটার' : 'DIGITAL THERMOMETER'}
        </Etch>
        {/* rubber cable to a stainless probe */}
        <path d="M 74 30 C 84 32 88 40 84 48" fill="none" stroke="url(#ix-rubber)" strokeWidth={2.4} />
        <Rod x1={84} y1={48} x2={84} y2={62} w={3.4} variant="steel" />
        <circle cx={84} cy={63} r={2.2} fill="url(#ix-chrome)" />
        <Led cx={68} cy={44} r={2.2} color="green" lit={live} />
      </g>
    );
  }
};

const calorimeter: ArtEntry = {
  vb: '0 0 118 104',
  Comp: ({ p, bn, live }) => {
    const t = num(p.initialTempCelsius, 22);
    return (
      <g>
        <Contact cx={59} cy={98} rx={44} opacity={0.3} />
        {/* wooden jacket (lagging) with a copper vessel inside */}
        <rect x={16} y={38} width={86} height={58} rx={5} fill="url(#ix-wood)" stroke="#5b3c14" strokeWidth={0.9} filter="url(#ix-drop)" />
        <rect x={16} y={38} width={86} height={58} rx={5} fill="url(#ix-grain)" />
        <rect x={22} y={30} width={74} height={12} rx={4} fill="url(#ix-wood-dark)" stroke="#3f2a0e" strokeWidth={0.8} />
        <Sheen x={26} y={31.5} w={64} h={3} rx={1.5} opacity={0.16} rotate={0} />
        {/* polished copper rim */}
        <ellipse cx={59} cy={36} rx={38} ry={9} fill="url(#ix-copper)" stroke="#6d3512" strokeWidth={0.7} />
        <ellipse cx={59} cy={36} rx={32} ry={7} fill="#1f2937" opacity={0.55} />
        {/* thermal trap: the felt lagging lip */}
        <ellipse cx={59} cy={36} rx={36} ry={8.4} fill="none" stroke="#c8b48a" strokeWidth={1.6} opacity={0.7} />
        {/* stirrer + thermometer in the lid */}
        <Rod x1={44} y1={6} x2={48} y2={40} w={2.2} variant="steel" />
        <path d="M 44 6 a 3 3 0 0 1 6 0" fill="none" stroke="#9aa4ad" strokeWidth={1.6} />
        <g transform="translate(74 4)">
          <rect x={-4} y={0} width={8} height={40} rx={3} fill="#fdfcf7" opacity={0.85} stroke="#c7d4de" strokeWidth={0.6} />
          <rect x={-8} y={2} width={4} height={34} rx={1} fill="#f4efdf" />
          <rect x={-1.6} y={2 + (34 * (100 - clamp(t, 0, 100))) / 100} width={3.2} height={36 - (34 * (100 - clamp(t, 0, 100))) / 100} fill="url(#ix-mercury)" />
          <circle cx={0} cy={42} r={3.6} fill="url(#ix-mercury)" />
        </g>
        {/* wooden lid screws */}
        {[28, 90].map((x) => (
          <circle key={x} cx={x} cy={42} r={2} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
        ))}
        <Etch x={59} y={102} size={5.4} color="#3f2a0e" weight={800} mono>
          {`water ${num(p.waterMassGrams, 150)} g · ${t.toFixed(1)} °C`}
        </Etch>
        {live && t > 40 && <ellipse cx={59} cy={30} rx={30} ry={10} fill="url(#ix-glow-amber)" opacity={0.25} />}
        {bn && (
          <Etch x={59} y={10} size={5.4} color="#334155" weight={700} rotate={0}>
            {'ক্যালরিমিটার'}
          </Etch>
        )}
      </g>
    );
  }
};

const bunsenBurner: ArtEntry = {
  vb: '0 0 90 104',
  Comp: ({ p, bn, live }) => {
    const lit = on(p.lit);
    const intensity = clamp(num(p.flameIntensity, 70) / 70, 0.3, 1.5);
    return (
      <g>
        <Contact cx={45} cy={100} rx={30} opacity={0.32} />
        {/* heavy hexagonal base */}
        <path d="M 18 92 L 72 92 L 66 82 L 24 82 Z" fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.7} />
        <ellipse cx={45} cy={92} rx={27} ry={5.5} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} />
        <ellipse cx={45} cy={82} rx={21} ry={4.4} fill="#4b5563" opacity={0.7} />
        {/* barrel with an air collar */}
        <rect x={38} y={34} width={14} height={49} rx={3} fill="url(#ix-steel)" stroke="#5b6876" strokeWidth={0.7} />
        <rect x={40} y={36} width={4} height={45} rx={2} fill="#ffffff" opacity={0.45} />
        <rect x={34} y={40} width={22} height={10} rx={3} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} />
        {/* air holes: closed = luminous flame, open = roaring */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={38 + i * 4.6} cy={45} r={1.5} fill={intensity > 0.8 ? '#0b1220' : '#94a3b8'} opacity={0.85} />
        ))}
        {/* rubber hose to the gas tap */}
        <path d="M 40 84 C 24 84 14 76 12 62" fill="none" stroke="url(#ix-rubber)" strokeWidth={4} strokeLinecap="round" />
        <path d="M 40 84 C 24 84 14 76 12 62" fill="none" stroke="#ffffff" strokeOpacity={0.14} strokeWidth={1} />
        {/* gas tap wheel */}
        <Knob cx={12} cy={60} r={6} kind="brass" teeth={8} />
        {/* flame */}
        {lit ? (
          <g>
            <Flame x={45} y={34} scale={0.72} intensity={intensity} live={live} />
            <ellipse cx={45} cy={62} rx={22} ry={26} fill="url(#ix-glow-amber)" opacity={0.22} />
          </g>
        ) : (
          <Etch x={45} y={30} size={5.4} color="#6b7280" weight={700}>
            {bn ? 'নির্বাপিত' : 'NOT LIT'}
          </Etch>
        )}
        <Etch x={45} y={102} size={5.2} color="#334155" weight={800} mono>
          {lit ? (intensity > 0.85 ? (bn ? 'নীল শিখা' : 'BLUE FLAME') : bn ? 'হলুদ শিখা' : 'YELLOW FLAME') : 'BUNSEN'}
        </Etch>
      </g>
    );
  }
};

const immersionHeater: ArtEntry = {
  vb: '0 0 98 112',
  Comp: ({ p, bn, live }) => {
    const R = num(p.coilResistance, 5);
    const power = num(p.heaterPower, 50);
    const [pulse, setPulse] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setPulse(Math.sin(((now - t0) / 900) * Math.PI * 2));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live]);
    const heat = live ? 1 : 0;
    return (
      <g>
        <Contact cx={49} cy={108} rx={30} opacity={0.3} />
        {/* bakelite head sitting on the tube, with a gland and two brass pins */}
        <rect x={25} y={7} width={48} height={27} rx={6} fill="url(#ix-bakelite)" stroke="#0b1220" strokeWidth={0.7} filter="url(#ix-shadow)" />
        <rect x={25} y={7} width={48} height={8} rx={4} fill="#ffffff" opacity={0.16} />
        <rect x={29} y={11} width={40} height={19} rx={3} fill="none" stroke="#00000055" strokeWidth={0.6} />
        {[36, 53].map((x) => (
          <g key={x}>
            <ellipse cx={x + 3.5} cy={8.6} rx={5} ry={1.8} fill="#0b1220" opacity={0.35} />
            <rect x={x} y={0} width={7} height={9} rx={1.6} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
            <rect x={x + 2.2} y={-4} width={2.6} height={5} rx={1.3} fill="url(#ix-brass-ball)" />
          </g>
        ))}
        <Etch x={49} y={26} size={5.4} color="#e2e8f0" weight={800} mono>
          {`${power} W`}
        </Etch>
        {/* the quartz tube: thick wall, softened by the glow of the element */}
        <GlassTube x={38} y={34} w={22} h={64} rx={10} fillTop={heat ? 'rgba(255,150,70,0.20)' : undefined} />
        {/* nichrome helix on a ceramic former, wound turn by turn */}
        {Array.from({ length: 9 }).map((_, i) => {
          const cy = 42 + i * 6.4;
          const glow = heat ? `rgba(255,${Math.round(150 + pulse * 55)},${Math.round(70 + pulse * 30)},0.96)` : '#9aa4ad';
          return (
            <g key={i}>
              <ellipse cx={49} cy={cy + 1.4} rx={7} ry={3.2} fill="none" stroke="#3f1c06" strokeOpacity={heat ? 0.35 : 0.5} strokeWidth={1.5} />
              <ellipse cx={49} cy={cy} rx={7} ry={3.2} fill="none" stroke={glow} strokeWidth={1.7} filter={heat ? 'url(#ix-glow)' : undefined} />
            </g>
          );
        })}
        <rect x={46.4} y={38} width={5.2} height={56} rx={2.6} fill="#cbbfae" opacity={0.5} />
        {live && <ellipse cx={49} cy={64} rx={15} ry={32} fill="url(#ix-glow-red)" opacity={0.32} style={{ animation: 'ix-pulse 2.6s ease-in-out infinite' }} />}
        <Etch x={49} y={112} size={5} color="#334155" weight={700} mono>
          {`${R} Ω`}
          {bn ? ' · নিমজ্জন হিটার' : ' · IMMERSION'}
        </Etch>
      </g>
    );
  }
};

const metalBlocks: ArtEntry = {
  vb: '0 0 78 60',
  Comp: ({ p, bn }) => {
    const material = typeof p.material === 'string' ? p.material : 'copper';
    const shade: Record<string, [string, string, string]> = {
      copper: ['#f3c093', '#b25f27', '#5e2c0c'],
      aluminium: ['#f7fafd', '#b9c3cf', '#79828f'],
      iron: ['#b0b9c1', '#5c6570', '#232a30'],
      lead: ['#d3d9df', '#7d858d', '#333941']
    };
    const [hi, mid, lo] = shade[material] ?? shade.copper;
    const hot = num(p.temperatureCelsius, 100) > 90;
    return (
      <g>
        <Contact cx={39} cy={55} rx={22} opacity={0.32} />
        {/* turned cylinder: specular band left, core shadow right, ellipse on top */}
        <rect x={20} y={12} width={38} height={38} rx={2.6} fill={mid} stroke={lo} strokeWidth={0.8} filter="url(#ix-shadow)" />
        <rect x={20} y={12} width={38} height={38} rx={2.6} fill="url(#ix-brushed)" opacity={0.35} />
        <rect x={20} y={12} width={9} height={38} fill={hi} opacity={0.85} />
        <rect x={25} y={12} width={4} height={38} fill="#ffffff" opacity={0.5} />
        <rect x={43} y={12} width={15} height={38} fill={lo} opacity={0.5} />
        <rect x={20} y={44} width={38} height={6} rx={2.6} fill="#0b1220" opacity={0.2} />
        {/* the machined top face with its thermometer hole */}
        <ellipse cx={39} cy={12} rx={19} ry={5.2} fill={hi} stroke={lo} strokeWidth={0.6} />
        <ellipse cx={39} cy={12} rx={19} ry={5.2} fill="url(#ix-brushed)" opacity={0.4} />
        <ellipse cx={39} cy={12.4} rx={5.6} ry={2} fill="#111827" opacity={0.75} />
        <path d="M 34 12.2 a 5.6 2 0 0 1 10.4 -0.4" fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.7} />
        {/* chamfer line where the face meets the wall */}
        <ellipse cx={39} cy={12.6} rx={19} ry={5.2} fill="none" stroke="#ffffff" strokeOpacity={0.28} strokeWidth={0.7} />
        {hot && <ellipse cx={39} cy={30} rx={26} ry={22} fill="url(#ix-glow-amber)" opacity={0.26} />}
        <Etch x={39} y={58.4} size={5.4} color="#334155" weight={800}>
          {material.toUpperCase()} {Math.round(num(p.massGrams, 100))} g
        </Etch>
        {bn && (
          <Etch x={39} y={8} size={4.6} color="#475569">
            {'ধাতব ব্লক'}
          </Etch>
        )}
      </g>
    );
  }
};

const searlesApparatus: ArtEntry = {
  vb: '0 0 180 100',
  Comp: ({ p, bn, live }) => {
    const dist = num(p.thermometerDistCm, 10);
    return (
      <g>
        <Contact cx={90} cy={94} rx={72} opacity={0.28} />
        {/* wooden insulating box around the bar */}
        <WoodBoard x={18} y={40} w={146} h={44} rx={4} />
        {/* the metal bar (steam jacket at one end) */}
        <rect x={26} y={52} width={130} height={16} rx={2} fill="#c8b48a" stroke="#8a7a5c" strokeWidth={0.7} />
        <rect x={26} y={52} width={130} height={4} rx={2} fill="#ffffff" opacity={0.3} />
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={i} x1={32 + i * 5.6} y1={54} x2={32 + i * 5.6} y2={66} stroke="#7c6a4a" strokeOpacity={0.25} strokeWidth={0.6} />
        ))}
        {/* steam jacket + boiler at the left */}
        <rect x={14} y={46} width={22} height={28} rx={3} fill="url(#ix-copper)" stroke="#6d3512" strokeWidth={0.6} />
        <path d="M 20 46 C 18 34 30 32 30 24" fill="none" stroke="#cbd5e1" strokeOpacity={0.6} strokeWidth={2} strokeDasharray="3 3" />
        {live && <path d="M 26 44 C 22 32 34 30 32 20" fill="none" stroke="#e2e8f0" strokeOpacity={0.35} strokeWidth={3} filter="url(#ix-blur)" />}
        {/* three thermometers at their tap positions */}
        {[0.18, 0.5, 0.82].map((f, i) => {
          const x = 34 + f * 116;
          const t = 100 - f * 55 - (dist > 12 ? 6 : 0);
          return (
            <g key={i}>
              <rect x={x - 3.4} y={14} width={7} height={40} rx={3} fill="#fdfcf7" opacity={0.9} stroke="#c7d4de" strokeWidth={0.5} />
              <rect x={x - 1.4} y={14 + (40 * (100 - t)) / 100} width={2.8} height={(40 * t) / 100 + 2} fill="url(#ix-mercury)" />
              <circle cx={x} cy={56} r={3.4} fill="url(#ix-mercury)" />
              <Etch x={x} y={10} size={4.6} color="#334155" weight={800} mono>
                {`${Math.round(t)}°`}
              </Etch>
            </g>
          );
        })}
        {/* cooling water out */}
        <path d="M 176 62 h 4" stroke="#7fb6dd" strokeWidth={3} />
        <Etch x={90} y={94} size={5.2} color="#3f2a0e" weight={700} mono>
          {`Searle's · rod Ø ${num(p.rodDiameterMm, 40)} mm · Δx ${dist} cm`}
        </Etch>
        {bn && (
          <Etch x={90} y={6} size={5.2} color="#334155" weight={700}>
            {'তাপ পরিবাহিতা যন্ত্র'}
          </Etch>
        )}
      </g>
    );
  }
};

export const heatArt: Record<string, ArtEntry> = {
  'lab-thermometer-mercury': mercuryThermometer,
  'digital-thermometer': digitalThermometer,
  'copper-calorimeter': calorimeter,
  'bunsen-burner-physics': bunsenBurner,
  'immersion-heater': immersionHeater,
  'metal-sample-blocks': metalBlocks,
  'searles-conductivity-apparatus': searlesApparatus
};
