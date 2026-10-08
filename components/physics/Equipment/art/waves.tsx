'use client';

import React from 'react';
import { BindingPost, Contact, Etch, Knob, LinearScale, Rod, Screw, Sheen, WoodBoard, clamp, num, on, type ArtEntry } from './shared';

/* ------------------------------------------------------------------ */
/* Waves & sound: forks, tubes, sonometer, ripple tank, CRO             */
/* ------------------------------------------------------------------ */

const SPEED_OF_SOUND = 343; // m/s at 20 °C

const tuningForks: ArtEntry = {
  vb: '0 0 86 100',
  Comp: ({ p, bn, live }) => {
    const f = num(p.frequencyHz, 512);
    const striking = on(p.isStriking);
    const ring = clamp(f / 512, 0.6, 1.6);
    // A struck fork blurs: two ghost prongs offset by the vibration amplitude.
    const tines = (dx: number, opacity: number) => (
      <g opacity={opacity} transform={`translate(${dx} 0)`}>
        {[24, 55.6].map((x) => (
          <g key={x}>
            <rect x={x} y={10} width={6.6} height={46} rx={3.2} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.5} />
            <rect x={x + 1.2} y={11} width={2} height={44} rx={1} fill="#ffffff" opacity={0.5} />
          </g>
        ))}
      </g>
    );
    return (
      <g>
        <Contact cx={43} cy={96} rx={28} opacity={0.3} />
        {striking && tines(-1.7 * ring, 0.28)}
        {tines(1.7 * ring, 0.28)}
        {/* the machined bend that joins the two prongs, then the stem and handle */}
        <path d="M 27.3 52 v 4 a 15.7 15.7 0 0 0 31.4 0 v -4" fill="none" stroke="url(#ix-steel)" strokeWidth={8} strokeLinecap="butt" />
        <path d="M 27.3 52 v 4 a 15.7 15.7 0 0 0 31.4 0 v -4" fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={2} strokeLinecap="butt" transform="translate(0 -2)" />
        <Rod x1={43} y1={72} x2={43} y2={92} w={5} />
        <ellipse cx={43} cy={93} rx={7} ry={2.6} fill="url(#ix-steel)" />
        <ellipse cx={43} cy={94} rx={9} ry={2.6} fill="url(#ix-steel)" />
        {/* engraved frequency, stamped on the stem like a real fork */}
        <Etch x={43} y={86} size={5.4} color="#334155" weight={800} mono>
          {`${f} Hz`}
        </Etch>
        {striking && live && (
          <g>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${20 - i * 4} ${22 + i * 3} q -6 6 0 12`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={0.8}
                opacity={0.5 - i * 0.12}
                style={{ animation: `ix-pulse ${(1.2 - i * 0.2).toFixed(2)}s ease-in-out infinite` }}
              />
            ))}
          </g>
        )}
        <Etch x={43} y={99} size={4.8} color="#475569">
          {on(p.isStriking) ? (bn ? 'কম্পিত' : 'VIBRATING') : bn ? 'নীরব' : 'AT REST'}
        </Etch>
      </g>
    );
  }
};

const resonanceTube: ArtEntry = {
  vb: '0 0 96 168',
  Comp: ({ p, bn, live }) => {
    const level = clamp(num(p.waterLevelCm, 16.5), 0, 100);
    const dia = num(p.tubeDiameterCm, 3);
    const f = 512;
    const lambda = SPEED_OF_SOUND / f; // m
    const resonantL = (lambda / 4) * 100; // cm, first resonance
    const L = 100 - level;
    const tuning = Math.abs(L - resonantL) < 1.5;
    const tubeTop = 16;
    const tubeBottom = 150;
    const waterY = tubeTop + ((100 - level) / 100) * (tubeBottom - tubeTop);
    return (
      <g>
        {/* graduated support board */}
        <WoodBoard x={12} y={8} w={72} h={150} rx={3} />
        <LinearScale x={20} y={14} w={10} h={140} from={100} to={0} major={10} minor={2} vertical unit="cm" size={4} />
        {/* the resonance tube itself */}
        <rect x={40} y={tubeTop} width={16} height={tubeBottom - tubeTop} rx={3} fill="url(#ix-glass-edge)" stroke="#7ea9c9" strokeWidth={0.8} />
        <rect x={42} y={tubeTop + 2} width={12} height={tubeBottom - tubeTop - 4} fill="#f7fbff" opacity={0.5} />
        {/* water column (from the reservoir, level set in cm) */}
        <rect x={42} y={waterY} width={12} height={tubeBottom - waterY} fill="url(#ix-water)" opacity={0.92} />
        <ellipse cx={48} cy={waterY} rx={6} ry={1.6} fill="#bfe6ff" opacity={0.75} />
        <line x1={44} y1={tubeTop + 4} x2={44} y2={tubeBottom - 6} stroke="#ffffff" strokeOpacity={0.75} strokeWidth={1.2} />
        {/* reservoir bottle */}
        <rect x={64} y={120} width={26} height={38} rx={3} fill="url(#ix-glass-edge)" stroke="#7ea9c9" strokeWidth={0.7} />
        <rect x={65.5} y={124} width={23} height={32} rx={2} fill="url(#ix-water)" opacity={0.85} />
        <path d="M 56 140 h 8" stroke="#7ea9c9" strokeWidth={4} />
        {/* tuning fork sounding above the open end */}
        <g transform="translate(48 8)">
          <path d="M -5 2 v -1 a 5 5 0 0 1 10 0 v 1" fill="none" stroke="url(#ix-steel)" strokeWidth={3} />
          <line x1={-5} y1={2} x2={-5} y2={9} stroke="url(#ix-steel)" strokeWidth={3} />
          <line x1={5} y1={2} x2={5} y2={9} stroke="url(#ix-steel)" strokeWidth={3} />
          <Etch x={0} y={-4} size={4.6} color="#334155" weight={800} mono>
            {`${f} Hz`}
          </Etch>
        </g>
        {/* standing wave: node at the water, antinode at the open end */}
        {tuning && (
          <g>
            <path
              d={`M 48 ${waterY} C 60 ${(waterY - (waterY - tubeTop) * 0.28).toFixed(1)} 36 ${(waterY - (waterY - tubeTop) * 0.55).toFixed(1)} 48 ${tubeTop}`}
              fill="none"
              stroke="#f97316"
              strokeWidth={1.4}
              opacity={0.85}
              style={live ? { animation: 'ix-pulse 1.1s ease-in-out infinite' } : undefined}
            />
            <circle cx={48} cy={waterY} r={3} fill="#0f172a" />
            <Etch x={48} y={tubeTop - 6} size={4.6} color="#c2410c" weight={800}>
              A
            </Etch>
          </g>
        )}
        <Etch x={48} y={164} size={5.4} color="#3f2a0e" weight={800} mono>
          {`L = ${L.toFixed(1)} cm`}
          {tuning ? ` · ${bn ? 'অনুনাদ' : 'RESONANCE'}` : ''}
        </Etch>
        {tuning && live && <ellipse cx={48} cy={(waterY + tubeTop) / 2} rx={22} ry={(waterY - tubeTop) / 2} fill="url(#ix-glow-amber)" opacity={0.22} />}
        <Etch x={50} y={158} size={4.4} color="#475569">
          {`λ/4 = ${resonantL.toFixed(1)} cm · Ø ${dia} cm`}
        </Etch>
      </g>
    );
  }
};

const sonometer: ArtEntry = {
  vb: '0 0 200 84',
  Comp: ({ p, bn, live }) => {
    const L = clamp(num(p.bridgeSeparationCm, 35), 10, 90) / 100;
    const mass = clamp(num(p.suspendedMassKg, 2.5), 0.5, 10);
    const material = typeof p.wireMaterial === 'string' ? p.wireMaterial : 'steel';
    const T = mass * 9.80665;
    // μ from a realistic 26 SWG wire (0.457 mm radius) and the wire's density.
    const rho = material === 'brass' ? 8500 : material === 'aluminium' ? 2700 : 7850;
    const mu = Math.PI * Math.pow(0.2e-3, 2) * rho;
    const f = (1 / (2 * L)) * Math.sqrt(T / mu);
    const [phase, setPhase] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setPhase(((now - t0) / 1000) * Math.min(6, f / 80));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, f]);
    const boardX = 8;
    const boardY = 10;
    const boardW = 184;
    const bridgeA = 46;
    const bridgeB = bridgeA + L * 200;
    const wireY = 34;
    const amp = 7;
    const loop = (x0: number, x1: number, sign: number) => {
      const mid = (x0 + x1) / 2;
      return `M ${x0} ${wireY} Q ${mid} ${wireY + amp * sign} ${x1} ${wireY}`;
    };
    return (
      <g>
        <WoodBoard x={boardX} y={boardY} w={boardW} h={56} rx={4} />
        <Sheen x={boardX + 6} y={boardY + 3} w={boardW - 20} h={5} rx={2.5} opacity={0.14} rotate={0} />
        {/* hollow sounding board edge + grappling nails */}
        <rect x={16} y={22} width={168} height={12} rx={4} fill="#8a5f2b" opacity={0.35} />
        {[16, 176].map((x) => (
          <circle key={x} cx={x} cy={wireY} r={2.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
        ))}
        {/* vibrating wire between the two bridges */}
        <line x1={16} y1={wireY} x2={20} y2={wireY} stroke="#9aa4ad" strokeWidth={1} />
        <line x1={bridgeB} y1={wireY} x2={176} y2={wireY} stroke="#9aa4ad" strokeWidth={1} />
        {live ? (
          <g>
            <path d={loop(bridgeA, bridgeB, 1)} fill="none" stroke="#9aa4ad" strokeWidth={1} opacity={0.5} style={{ animation: 'ix-pulse 0.5s ease-in-out infinite' }} />
            <path
              d={`M ${bridgeA} ${wireY} Q ${(bridgeA + bridgeB) / 2} ${wireY - amp * Math.sin(phase)} ${bridgeB} ${wireY}`}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1.2}
            />
            <path
              d={`M ${bridgeA} ${wireY} Q ${(bridgeA + bridgeB) / 2} ${wireY + amp * Math.sin(phase)} ${bridgeB} ${wireY}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={0.8}
              opacity={0.7}
            />
          </g>
        ) : (
          <line x1={bridgeA} y1={wireY} x2={bridgeB} y2={wireY} stroke="#cbd5e1" strokeWidth={1} />
        )}
        <Etch x={(bridgeA + bridgeB) / 2} y={wireY - 10} size={5} color="#c2410c" weight={800}>
          A
        </Etch>
        {/* knife-edge bridges */}
        {[bridgeA, bridgeB].map((x) => (
          <g key={x}>
            <path d={`M ${x - 5} 46 L ${x + 5} 46 L ${x} 28 Z`} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.6} />
            <rect x={x - 7} y={46} width={14} height={4} rx={1} fill="#8a8272" />
          </g>
        ))}
        {/* pulley + hanging weights at the right end */}
        <circle cx={192} cy={wireY} r={7} fill="url(#ix-chrome)" stroke="#475569" strokeWidth={0.6} />
        <circle cx={192} cy={wireY} r={2} fill="#334155" />
        <path d={`M 176 ${wireY} L 192 ${wireY} L 192 ${wireY + 14}`} fill="none" stroke="#9aa4ad" strokeWidth={1} />
        <rect x={184} y={wireY + 14} width={16} height={16} rx={2} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
        <Etch x={192} y={wireY + 25} size={4.6} color="#4a3208" weight={800} mono>
          {`${mass}kg`}
        </Etch>
        <Etch x={92} y={80} size={5.6} color="#3f2a0e" weight={800} mono>
          {`f = ${f.toFixed(1)} Hz · L = ${(L * 100).toFixed(0)} cm · T = ${T.toFixed(1)} N · ${material}`}
        </Etch>
        {bn && (
          <Etch x={50} y={80} size={4.6} color="#475569">
            {'সোনোমিটার'}
          </Etch>
        )}
      </g>
    );
  }
};

const rippleTank: ArtEntry = {
  vb: '0 0 150 108',
  Comp: ({ p, bn, live }) => {
    const f = clamp(num(p.motorFrequencyHz, 12), 2, 40);
    const dipper = typeof p.dipperType === 'string' ? p.dipperType : 'two-points';
    const [phase, setPhase] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setPhase(((now - t0) / 1000) * f * 0.35);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, f]);
    const spacing = clamp(26 - f * 0.4, 6, 24);
    const ripple = (cx: number, cy: number, phaseOffset: number) => (
      <g>
        {Array.from({ length: 8 }).map((_, i) => {
          const rr = (((i + phaseOffset) % 8) / 8) * 54 + 3;
          const fade = 1 - rr / 60;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={rr + 0.8} fill="none" stroke="#08243a" strokeWidth={0.7 + fade * 1.2} opacity={clamp(fade * 0.45, 0, 0.45)} />
              <circle cx={cx} cy={cy} r={rr} fill="none" stroke="#f2fbff" strokeWidth={0.9 + fade * 1.6} opacity={clamp(fade * 1.1, 0, 1)} />
            </g>
          );
        })}
      </g>
    );
    return (
      <g>
        {/* strip lamp over the tank */}
        <rect x={16} y={4} width={118} height={9} rx={3} fill="url(#ix-charcoal)" stroke="#111827" strokeWidth={0.6} />
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={22 + i * 17} y1={6} x2={22 + i * 17} y2={11} stroke="#f8fafc" strokeOpacity={0.7} strokeWidth={1.6} />
        ))}
        {[30, 120].map((x) => (
          <Rod key={x} x1={x} y1={13} x2={x} y2={26} w={3} />
        ))}
        {/* the light the strip lamp pours into the tank */}
        <path d="M 20 13 L 126 13 L 140 32 L 10 32 Z" fill="#fff6d8" opacity={0.4} />
        <ellipse cx={73} cy={34} rx={66} ry={14} fill="url(#ix-lamp-cone)" opacity={0.85} />
        {/* glass tank with a little water */}
        <rect x={10} y={26} width={130} height={70} rx={4} fill="#eaf6ff" fillOpacity={0.5} stroke="#7ea9c9" strokeWidth={1.2} filter="url(#ix-drop)" />
        <rect x={12} y={34} width={126} height={60} fill="url(#ix-water)" opacity={0.75} />
        <rect x={12} y={34} width={126} height={18} fill="#ffffff" opacity={0.22} />
        <rect x={12} y={34} width={126} height={60} fill="#0b3550" opacity={0.30} />
        {/* ripple pattern on the water surface, clipped to the glass */}
        <clipPath id="ix-ripple-clip">
          <rect x={12} y={34} width={126} height={60} rx={3} />
        </clipPath>
        <g clipPath="url(#ix-ripple-clip)" opacity={live ? 1 : 0.55}>
          {dipper === 'two-points' ? (
            <>
              {ripple(52, 64, phase)}
              {ripple(98, 64, phase)}
            </>
          ) : (
            ripple(75, 64, phase)
          )}
        </g>
        {/* the nodal lines of the two-source interference, cut as hyperbolas */}
        {dipper === 'two-points' && live && (
          <g clipPath="url(#ix-ripple-clip)">
            {[-2, -1, 1, 2].map((k) => (
              <g key={k} opacity={Math.abs(k) === 1 ? 0.75 : 0.5}>
                <path
                  d={`M 75 64 Q ${75 + k * 9} 48 ${75 + k * 20} 34`}
                  fill="none"
                  stroke="#0b3550"
                  strokeWidth={2.4}
                  strokeDasharray="6 5"
                  opacity={0.5}
                />
                <path
                  d={`M 75 64 Q ${75 + k * 9} 80 ${75 + k * 20} 94`}
                  fill="none"
                  stroke="#0b3550"
                  strokeWidth={2.4}
                  strokeDasharray="6 5"
                  opacity={0.5}
                />
                <path
                  d={`M 75 64 Q ${75 + k * 9} 48 ${75 + k * 20} 34`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1.1}
                  strokeDasharray="6 5"
                  opacity={0.7}
                />
                <path
                  d={`M 75 64 Q ${75 + k * 9} 80 ${75 + k * 20} 94`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1.1}
                  strokeDasharray="6 5"
                  opacity={0.7}
                />
              </g>
            ))}
          </g>
        )}
        {/* mechanical dipper + motor */}
        <rect x={66} y={14} width={18} height={12} rx={3} fill="url(#ix-charcoal)" stroke="#111827" strokeWidth={0.6} />
        <circle cx={75} cy={20} r={3.4} fill="url(#ix-brass)" />
        <line x1={75} y1={26} x2={75} y2={44} stroke="url(#ix-steel)" strokeWidth={2.4} />
        <circle cx={75} cy={46} r={2.4} fill="url(#ix-chrome)" />
        {/* the tank's own shadow, then the readings along the front edge */}
        <rect x={12} y={96} width={126} height={4.5} rx={2} fill="url(#ix-charcoal)" opacity={0.65} />
        <Etch x={75} y={106} size={5.2} color="#334155" weight={800} mono>
          {`${f} Hz · spacing ≈ ${spacing.toFixed(1)} mm`}
        </Etch>
        {bn && (
          <Etch x={14} y={106} size={4.4} color="#475569" anchor="start">
            {'রিপল ট্যাংক'}
          </Etch>
        )}
      </g>
    );
  }
};

const signalGenerator: ArtEntry = {
  vb: '0 0 140 78',
  Comp: ({ p, bn, live }) => {
    const f = clamp(num(p.frequencyHz, 1000), 10, 20000);
    const amp = clamp(num(p.amplitudeVolts, 5), 0.1, 20);
    const wave = typeof p.waveform === 'string' ? p.waveform : 'sine';
    const path = React.useMemo(() => {
      const pts: string[] = [];
      const period = 60 / clamp(Math.log10(f) / 4.3, 0.12, 1); // visual cycles scale with frequency
      for (let x = 0; x <= 60; x += 1) {
        const th = (x / period) * Math.PI * 2;
        let y: number;
        if (wave === 'square') y = Math.sin(th) >= 0 ? -1 : 1;
        else if (wave === 'triangle') y = (2 / Math.PI) * Math.asin(Math.sin(th));
        else y = Math.sin(th);
        pts.push(`${x === 0 ? 'M' : 'L'} ${x} ${(y * (amp / 20) * 9).toFixed(2)}`);
      }
      return pts.join(' ');
    }, [f, amp, wave]);
    return (
      <g>
        <Contact cx={70} cy={74} rx={46} opacity={0.32} />
        {/* pressed aluminium case with a brushed front panel */}
        <rect x={8} y={8} width={124} height={58} rx={5} fill="url(#ix-alu-ball)" stroke="#79828f" strokeWidth={0.9} filter="url(#ix-shadow)" />
        <rect x={8} y={8} width={124} height={58} rx={5} fill="url(#ix-brushed)" opacity={0.4} />
        <rect x={10} y={10} width={120} height={54} rx={4} fill="url(#ix-enamel-cream)" opacity={0.9} stroke="#b3a68b" strokeWidth={0.5} />
        <rect x={10} y={10} width={120} height={12} rx={4} fill="#ffffff" opacity={0.45} />
        <rect x={8} y={8} width={124} height={58} rx={5} fill="url(#ix-varnish)" opacity={0.4} />
        <Etch x={22} y={20} size={7} color="#334155" weight={800} anchor="start">
          {bn ? 'অডিও জেনারেটর' : 'SIGNAL GENERATOR'}
        </Etch>
        {/* frequency dial with printed band */}
        <circle cx={44} cy={44} r={22} fill="url(#ix-dial)" stroke="#8a8272" strokeWidth={0.7} />
        <circle cx={44} cy={44} r={22} fill="url(#ix-reflect)" opacity={0.28} />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (-150 + i * (300 / 23)) * (Math.PI / 180);
          return <line key={i} x1={44 + Math.sin(a) * 16} y1={44 - Math.cos(a) * 16} x2={44 + Math.sin(a) * 20} y2={44 - Math.cos(a) * 20} stroke="#1f2937" strokeWidth={i % 4 === 0 ? 0.9 : 0.45} />;
        })}
        <Knob cx={44} cy={44} r={9.6} kind="black" />
        <circle cx={44} cy={44} r={9.6} fill="url(#ix-knurl)" opacity={0.45} />
        <circle cx={44} cy={44} r={3} fill="url(#ix-brass-ball)" />
        <path d="M 44 44 L 44 33" stroke="#f8fafc" strokeWidth={1.5} strokeLinecap="round" />
        <Etch x={44} y={70} size={4.6} color="#4b5563" mono>
          {f >= 1000 ? `${(f / 1000).toFixed(2)} kHz` : `${f.toFixed(0)} Hz`}
        </Etch>
        {/* amplitude + waveform selector */}
        <Knob cx={80} cy={30} r={7} kind="black" />
        <Etch x={80} y={42} size={4.4} color="#4b5563">
          AMPL
        </Etch>
        <Knob cx={102} cy={30} r={7} kind="black" />
        <Etch x={102} y={42} size={4.4} color="#4b5563">
          {wave.toUpperCase()}
        </Etch>
        {/* built-in monitor scope showing the selected waveform */}
        <rect x={94} y={46} width={34} height={18} rx={2} fill="url(#ix-screen-off)" stroke="#334155" strokeWidth={0.6} />
        <g transform="translate(98 55)">
          <path d={path} fill="none" stroke="#4ade80" strokeWidth={1} opacity={live ? 0.95 : 0.7} />
        </g>
        {/* output terminals */}
        <BindingPost cx={116} cy={62} r={3.6} />
        <BindingPost cx={126} cy={62} r={3.6} />
        <Etch x={121} y={70} size={4} color="#475569" mono>
          OUT
        </Etch>
        <circle cx={124} cy={15} r={3} fill={live ? '#22c55e' : '#6b7280'} />
        {live && <circle cx={124} cy={15} r={5.6} fill="url(#ix-glow-green)" opacity={0.6} />}
        <Screw cx={14} cy={62} r={2} />
      </g>
    );
  }
};

const oscilloscope: ArtEntry = {
  vb: '0 0 170 96',
  Comp: ({ p, bn, live }) => {
    const timeBase = clamp(num(p.timeBaseMs, 1), 0.1, 10);
    const vDiv = clamp(num(p.voltsPerDiv, 1), 0.1, 10);
    const f = num(p.frequencyHz, 1000);
    const xy = on(p.xyMode);
    const perDiv = (timeBase / 1000) * f; // cycles per division
    const [sweep, setSweep] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setSweep(((now - t0) / 1000) % 1);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live]);
    const trace = React.useMemo(() => {
      const pts: string[] = [];
      for (let i = 0; i <= 240; i++) {
        const x = (i / 240) * 116;
        const y = xy ? Math.sin((i / 240) * Math.PI * 2 * perDiv * 0.25) * 16 : -Math.sin((i / 240) * Math.PI * 2 * perDiv) * Math.min(20, 10 / vDiv + 8);
        pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(2)}`);
      }
      return pts.join(' ');
    }, [perDiv, vDiv, xy]);
    return (
      <g>
        <Contact cx={85} cy={92} rx={62} opacity={0.32} />
        {/* instrument case */}
        <rect x={6} y={6} width={158} height={80} rx={5} fill="url(#ix-enamel)" stroke="#0b1220" strokeWidth={0.9} filter="url(#ix-shadow-lift)" />
        <rect x={6} y={6} width={158} height={80} rx={5} fill="url(#ix-brushed)" opacity={0.28} />
        <rect x={6} y={6} width={158} height={11} rx={4} fill="#ffffff" opacity={0.14} />
        <rect x={12} y={20} width={122} height={58} rx={4} fill="none" stroke="#0b1220" strokeOpacity={0.5} strokeWidth={1.2} />
        <Etch x={18} y={16} size={6.4} color="#e2e8f0" weight={800} anchor="start">
          {bn ? 'ডিজিটাল অসিলোস্কোপ' : 'DUAL TRACE OSCILLOSCOPE'}
        </Etch>
        {/* CRT with graticule and the live trace */}
        <rect x={14} y={22} width={118} height={54} rx={3} fill="url(#ix-screen-off)" stroke="#0f172a" strokeWidth={1} />
        <rect x={14} y={22} width={118} height={54} rx={3} fill="#0f3d2a" opacity={0.5} />
        <ellipse cx={73} cy={49} rx={54} ry={24} fill="#22c55e" opacity={0.06} />
        <g opacity={0.35}>
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={16 + i * 14.25} y1={23} x2={16 + i * 14.25} y2={75} stroke="#1f7a4d" strokeWidth={0.5} strokeDasharray="2 2" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`h${i}`} x1={15} y1={26 + i * 12} x2={129} y2={26 + i * 12} stroke="#1f7a4d" strokeWidth={0.5} strokeDasharray="2 2" />
          ))}
          <line x1={15} y1={49} x2={129} y2={49} stroke="#22c55e" strokeWidth={0.5} />
          <line x1={71} y1={23} x2={71} y2={75} stroke="#22c55e" strokeWidth={0.5} />
        </g>
        <g transform="translate(15 49)">
          <path d={trace} fill="none" stroke="#4ade80" strokeWidth={1.3} filter="url(#ix-glow)" opacity={live ? 0.95 : 0.8} />
        </g>
        {/* beam blanking sweep mark */}
        {live && <rect x={15 + sweep * 114} y={23} width={2} height={52} fill="#86efac" opacity={0.25} />}
        <rect x={14} y={22} width={118} height={54} rx={3} fill="url(#ix-glass-sheen)" opacity={0.22} />
        {/* front panel: time-base, volts/div, focus knobs */}
        {[
          { cx: 142, cy: 32, label: 'TIME/DIV' },
          { cx: 142, cy: 58, label: 'VOLTS/DIV' }
        ].map((k) => (
          <g key={k.label}>
            <Knob cx={k.cx} cy={k.cy} r={8} kind="black" />
            <Etch x={k.cx} y={k.cy + 14} size={3.6} color="#94a3b8">
              {k.label}
            </Etch>
          </g>
        ))}
        <Knob cx={158} cy={30} r={5} kind="black" />
        <Knob cx={158} cy={44} r={5} kind="black" />
        {/* BNC input sockets */}
        <circle cx={30} cy={80} r={4} fill="url(#ix-chrome)" stroke="#334155" strokeWidth={0.6} />
        <circle cx={50} cy={80} r={4} fill="url(#ix-chrome)" stroke="#334155" strokeWidth={0.6} />
        <circle cx={70} cy={80} r={4} fill="url(#ix-chrome)" stroke="#334155" strokeWidth={0.6} />
        <circle cx={30} cy={80} r={1.6} fill="#334155" />
        <circle cx={50} cy={80} r={1.6} fill="#334155" />
        <circle cx={70} cy={80} r={1.6} fill="#334155" />
        <Etch x={100} y={83} size={4.6} color="#cbd5e1" mono>
          {`${timeBase} ms/div · ${vDiv} V/div`}
        </Etch>
        <circle cx={150} cy={78} r={3} fill={live ? '#22c55e' : '#6b7280'} />
        <Screw cx={12} cy={84} r={1.8} />
      </g>
    );
  }
};

export const wavesArt: Record<string, ArtEntry> = {
  'tuning-forks-set': tuningForks,
  'resonance-air-column-tube': resonanceTube,
  'sonometer-board': sonometer,
  'ripple-tank-setup': rippleTank,
  'audio-signal-generator': signalGenerator,
  'digital-oscilloscope': oscilloscope
};
