'use client';

import React from 'react';
import { Contact, Etch, Knob, LinearScale, Rod, Screw, Sheen, clamp, num, type ArtEntry } from './shared';

/* ------------------------------------------------------------------ */
/* Mechanics: stands, springs, pulleys, carts and balances              */
/* ------------------------------------------------------------------ */

const G = 9.80665;

/** Shared retort-stand artwork: cast base, column, boss head, clamp. */
function Stand({
  x,
  baseY,
  top,
  clampY,
  arm = 46,
  dir = 1
}: {
  x: number;
  baseY: number;
  top: number;
  clampY?: number;
  arm?: number;
  dir?: 1 | -1;
}) {
  return (
    <g>
      <Contact cx={x} cy={baseY + 3} rx={30} opacity={0.34} />
      {/* cast-iron A-base in perspective */}
      <path d={`M ${x - 30} ${baseY} L ${x + 30} ${baseY} L ${x + 22} ${baseY - 12} L ${x - 22} ${baseY - 12} Z`} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} />
      <ellipse cx={x} cy={baseY} rx={30} ry={5} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.5} />
      <ellipse cx={x} cy={baseY - 12} rx={22} ry={4} fill="#4b5563" opacity={0.6} />
      <rect x={x - 30} y={baseY - 6} width={60} height={2.4} fill="#0b1220" opacity={0.35} />
      <Rod x1={x} y1={baseY - 10} x2={x} y2={top} w={7} />
      <ellipse cx={x} cy={top} rx={3.5} ry={1.6} fill="#94a3b8" />
      {clampY !== undefined && (
        <g>
          <rect x={x - 8} y={clampY - 7} width={16} height={14} rx={2} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.5} />
          <Knob cx={x + dir * 13} cy={clampY} r={4.2} kind="black" teeth={10} />
          <Rod x1={x} y1={clampY} x2={x + dir * arm} y2={clampY} w={5} />
          <Screw cx={x + dir * 6} cy={clampY - 4.4} r={1.6} />
        </g>
      )}
    </g>
  );
}

/** Brass slotted weight (hanger disc with a milled slot). */
function SlottedWeight({ cx, cy, r = 11, label }: { cx: number; cy: number; r?: number; label?: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.85} rx={r * 1.05} ry={r * 0.24} fill="#0b1220" opacity={0.25} />
      <circle cx={cx} cy={cy} r={r} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={r} fill="url(#ix-brass-h)" opacity={0.5} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.34} fill="#fff8dc" opacity={0.35} />
      <path d={`M ${cx - r * 0.34} ${cy - r} a ${r * 0.34} ${r * 0.34} 0 0 1 ${r * 0.68} 0`} fill="#3f2a0e" opacity={0.8} />
      {label && r > 8 && (
        <Etch x={cx} y={cy + r * 0.42} size={r * 0.48} color="#4a3208" weight={800} mono>
          {label}
        </Etch>
      )}
    </g>
  );
}

const simplePendulum: ArtEntry = {
  vb: '0 0 104 138',
  Comp: ({ p, bn, live }) => {
    const L = clamp(num(p.lengthCm, 100), 20, 200);
    const mass = num(p.bobMassGrams, 50);
    const amp = clamp(num(p.initialAngleDeg, 5), 1, 30);
    const period = 2 * Math.PI * Math.sqrt(L / 100 / G);
    const bobR = 7 + Math.min(6, mass / 25);
    const px = 52;
    const py = 22;
    const len = 84 * (L / 200) + 22;
    const [ang, setAng] = React.useState(amp);
    React.useEffect(() => {
      if (!live) {
        setAng(amp);
        return;
      }
      let raf = 0;
      const t0 = performance.now();
      const step = (t: number) => {
        setAng(amp * Math.cos(((2 * Math.PI) / period) * ((t - t0) / 1000)));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, amp, period]);
    const bx = px + len * Math.sin((ang * Math.PI) / 180);
    const by = py + len * Math.cos((ang * Math.PI) / 180);
    const threadAng = Math.atan2(bx - px, by - py);
    const prl = 48 * (L / 200) + 14;
    return (
      <g>
        <Stand x={px} baseY={128} top={16} />
        {/* cotton thread */}
        <line x1={px} y1={py} x2={bx} y2={by} stroke="#6b7280" strokeWidth={0.9} />
        <line x1={px} y1={py} x2={bx} y2={by} stroke="#e5e7eb" strokeWidth={0.4} />
        {/* split brass bob clamped on the thread */}
        <g>
          <circle cx={bx} cy={by} r={bobR} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={0.8} />
          <ellipse cx={bx} cy={by} rx={bobR} ry={bobR * 0.92} fill="url(#ix-brass-h)" opacity={0.7} />
          <circle cx={bx - bobR * 0.32} cy={by - bobR * 0.34} r={bobR * 0.3} fill="#fffdf0" opacity={0.65} />
          <rect x={bx - 1.6} y={by - bobR} width={3.2} height={bobR} fill="#7c560f" opacity={0.5} />
          <circle cx={bx} cy={by - bobR * 0.55} r={1.6} fill="url(#ix-chrome)" />
          {bobR > 9 && (
            <Etch x={bx} y={by + bobR * 0.35} size={4.6} color="#4a3208" weight={800} mono>
              {`${Math.round(mass)}g`}
            </Etch>
          )}
        </g>
        {/* motion-blur arc at the extremes */}
        {live && (
          <path
            d={`M ${px + len * Math.sin(((amp + 3) * Math.PI) / 180)} ${py + len * Math.cos(((amp + 3) * Math.PI) / 180)} A ${len} ${len} 0 0 0 ${px + len * Math.sin(((-amp - 3) * Math.PI) / 180)} ${py + len * Math.cos(((-amp - 3) * Math.PI) / 180)}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={0.6}
            strokeDasharray="3 4"
            opacity={0.5}
          />
        )}
        {/* protractor scale + reference line */}
        <g transform={`translate(${px} ${py})`}>
          <path d={`M ${-prl} 0 A ${prl} ${prl} 0 0 1 ${prl} 0`} fill="none" stroke="#cbd5e1" strokeWidth={0.7} />
          {[-30, -20, -10, 0, 10, 20, 30].map((d) => {
            const a = ((d - 90) * Math.PI) / 180;
            return (
              <g key={d}>
                <line x1={Math.cos(a) * prl} y1={prl * -0.02 + -Math.sin(a) * 0} x2={Math.cos(a) * (prl - 5)} y2={-Math.sin(a) * (prl - 5)} stroke="#64748b" strokeWidth={d === 0 ? 1 : 0.5} />
                {d % 10 === 0 && (
                  <Etch x={Math.cos(a) * (prl + 5)} y={-Math.sin(a) * (prl + 5) + 2} size={4} color="#64748b">
                    {Math.abs(d)}
                  </Etch>
                )}
              </g>
            );
          })}
        </g>
        <line
          x1={px}
          y1={py}
          x2={px + Math.sin((ang * Math.PI) / 180) * (len + bobR)}
          y2={py + Math.cos((ang * Math.PI) / 180) * (len + bobR)}
          stroke="#94a3b8"
          strokeWidth={0.4}
          opacity={0.5}
        />
        <Etch x={px + 26} y={132} size={6} color="#334155" weight={800} mono>
          {`T = ${period.toFixed(2)} s`}
        </Etch>
        <Etch x={px - 30} y={132} size={5.4} color="#475569">
          {`L=${L}cm`}
        </Etch>
        <Etch x={px} y={10} size={5.4} color="#475569">
          {bn ? 'সরল দোলক' : 'SIMPLE PENDULUM'}
        </Etch>
        {Math.abs(ang) < 0.4 && <circle cx={bx} cy={by} r={bobR + 6} fill="#fbbf24" opacity={0.12} />}
      </g>
    );
  }
};

const helicalSpring: ArtEntry = {
  vb: '0 0 96 126',
  Comp: ({ p, bn, live }) => {
    const k = Math.max(1, num(p.springConstant, 25));
    const m = num(p.attachedMassGrams, 100) / 1000;
    const ext = clamp((m * G) / k, 0, 0.35);
    const naturalPx = 46;
    const extPx = (ext / 0.35) * 42;
    const coils = 22;
    const top = 20;
    const coilLen = naturalPx + extPx;
    const period = 2 * Math.PI * Math.sqrt(m / k);
    const [osc, setOsc] = React.useState(0);
    React.useEffect(() => {
      if (!live) {
        setOsc(0);
        return;
      }
      let raf = 0;
      const t0 = performance.now();
      const step = (t: number) => {
        setOsc(Math.sin(((2 * Math.PI) / period) * ((t - t0) / 1000)) * 3.4);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, period]);
    const massY = top + coilLen + osc;
    // A real helical coil: a tight zig-zag pair of sine paths reads as a 3-D spring.
    const helix = (phase: number) => {
      let d = `M 48 ${top}`;
      for (let i = 0; i <= coils * 2; i++) {
        const f = i / (coils * 2);
        const y = top + f * coilLen;
        const x = 48 + Math.sin((f * coils + phase) * Math.PI * 2) * 11.5;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      return d;
    };
    return (
      <g>
        <Stand x={48} baseY={118} top={12} clampY={18} arm={30} dir={1} />
        <path d="M 48 18 a 6 6 0 0 1 12 0" fill="none" stroke="url(#ix-steel-h)" strokeWidth={2.6} />
        {/* pointer + mirror scale */}
        <LinearScale x={64} y={top} w={12} h={coilLen + 20} from={0} to={40} major={10} minor={2} vertical unit="cm" size={4} />
        <path d={helix(0)} fill="none" stroke="#4b5563" strokeWidth={2.6} strokeLinejoin="round" />
        <path d={helix(0.5)} fill="none" stroke="#e2e8f0" strokeWidth={1.6} strokeLinejoin="round" opacity={0.85} />
        <path d={helix(0.25)} fill="none" stroke="#94a3b8" strokeWidth={0.6} strokeLinejoin="round" opacity={0.5} />
        {/* hanger + slotted weights */}
        <line x1={48} y1={massY - osc} x2={48} y2={massY} stroke="#94a3b8" strokeWidth={0.8} />
        <circle cx={48} cy={massY + 2} r={2.4} fill="url(#ix-chrome)" />
        {[0, 1, 2].map((i) => (
          <SlottedWeight key={i} cx={48} cy={massY + 12 + i * 11.5} r={9.5} />
        ))}
        {/* pointer at the spring's lower end */}
        <line x1={48} y1={massY - 6} x2={62} y2={massY - 6} stroke="#b91c1c" strokeWidth={1.4} />
        <Etch x={48} y={124} size={5.6} color="#334155" weight={800} mono>
          {`x = ${(ext * 100).toFixed(1)} cm`}
        </Etch>
        <Etch x={20} y={124} size={5} color="#475569" mono>
          {`k=${k}N/m`}
        </Etch>
        {bn && (
          <Etch x={48} y={8} size={5} color="#475569">
            {'হুকের সূত্র'}
          </Etch>
        )}
      </g>
    );
  }
};

const weightsSet: ArtEntry = {
  vb: '0 0 78 62',
  Comp: ({ p }) => {
    const total = num(p.totalMassGrams, 250);
    const discs = clamp(Math.round(total / 50), 1, 6);
    return (
      <g>
        <Contact cx={39} cy={56} rx={26} opacity={0.3} />
        {/* wire hanger */}
        <path d="M 39 4 v 14" stroke="#9aa4ad" strokeWidth={1.2} />
        <path d="M 26 18 h 26 M 26 18 a 13 13 0 0 0 26 0" fill="none" stroke="#9aa4ad" strokeWidth={1.2} />
        {Array.from({ length: discs }).map((_, i) => (
          <SlottedWeight key={i} cx={39} cy={34 + i * 4.2} r={15} label={i === 0 ? `${Math.round(total / discs)}` : undefined} />
        ))}
        <Etch x={39} y={60} size={6} color="#334155" weight={800} mono>
          {`${Math.round(total)} g`}
        </Etch>
      </g>
    );
  }
};

const inclinedPlane: ArtEntry = {
  vb: '0 0 190 90',
  Comp: ({ p, bn }) => {
    const angle = clamp(num(p.inclineAngleDeg, 30), 0, 60);
    const rad = (angle * Math.PI) / 180;
    const baseX = 52;
    const baseY = 74;
    const len = 118;
    const topX = baseX + len * Math.cos(rad);
    const topY = baseY - len * Math.sin(rad);
    const trolleyX = baseX + len * 0.62 * Math.cos(rad);
    const trolleyY = baseY - len * 0.62 * Math.sin(rad);
    const mu = typeof p.surfaceType === 'string' && p.surfaceType.includes('steel') ? 0.18 : 0.35;
    return (
      <g>
        {/* wooden plank on a hinged support */}
        <polygon points={`${baseX},${baseY} ${topX},${topY} ${topX},${topY + 7} ${baseX},${baseY + 7}`} fill="url(#ix-wood)" stroke="#5b3c14" strokeWidth={0.8} />
        <polygon points={`${baseX},${baseY} ${topX},${topY} ${topX},${topY + 3} ${baseX},${baseY + 3}`} fill="url(#ix-grain)" />
        <polygon points={`${baseX},${baseY} ${baseX + len * 0.34},${baseY - len * 0.34 * Math.tan(rad)} ${baseX + len * 0.34 + 6},${baseY - len * 0.34 * Math.tan(rad)} ${baseX + 6},${baseY}`} fill="url(#ix-wood-dark)" opacity={0.9} />
        {/* protractor at the hinge */}
        <g transform={`translate(${baseX} ${baseY})`}>
          <path d="M 0 0 m -30 0 a 30 30 0 0 1 60 0" fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.6} />
          {Array.from({ length: 13 }).map((_, i) => {
            const a = ((i * 5 - 90) * Math.PI) / 180;
            return <line key={i} x1={Math.cos(a) * 26} y1={Math.sin(a) * 26} x2={Math.cos(a) * (i % 3 === 0 ? 20 : 23)} y2={Math.sin(a) * (i % 3 === 0 ? 20 : 23)} stroke="#334155" strokeWidth={i % 3 === 0 ? 0.8 : 0.4} />;
          })}
          <line x1={0} y1={0} x2={ctx_x(angle)} y2={ctx_y(angle)} stroke="#b91c1c" strokeWidth={1.2} />
          <circle cx={0} cy={0} r={2.4} fill="url(#ix-brass)" />
          <Etch x={-2} y={-34} size={5.6} color="#334155" weight={800} mono>
            {`θ = ${angle}°`}
          </Etch>
        </g>
        {/* cart riding the plane */}
        <g transform={`translate(${trolleyX} ${trolleyY}) rotate(${-angle})`}>
          <rect x={-17} y={-13} width={34} height={11} rx={2} fill="url(#ix-blue-plastic)" stroke="#0d3b68" strokeWidth={0.6} />
          <rect x={-17} y={-13} width={34} height={4} rx={2} fill="#ffffff" opacity={0.2} />
          <circle cx={-10} cy={-1} r={3.6} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.5} />
          <circle cx={10} cy={-1} r={3.6} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.5} />
          <circle cx={-10} cy={-1} r={1.4} fill="url(#ix-chrome)" />
          <circle cx={10} cy={-1} r={1.4} fill="url(#ix-chrome)" />
        </g>
        {/* pulley at the top with a hanging hanger */}
        <circle cx={topX + 4} cy={topY + 2} r={7} fill="url(#ix-chrome)" stroke="#475569" strokeWidth={0.6} />
        <circle cx={topX + 4} cy={topY + 2} r={2} fill="#334155" />
        <path d={`M ${trolleyX + 12} ${trolleyY - 12} L ${topX + 4} ${topY + 2} L ${topX + 4} ${topY + 34}`} fill="none" stroke="#8a97a5" strokeWidth={0.9} />
        <SlottedWeight cx={topX + 4} cy={topY + 44} r={10} />
        <Etch x={95} y={88} size={5.4} color="#3f2a0e" weight={700} mono>
          {`μ ≈ ${mu.toFixed(2)} · ${typeof p.surfaceType === 'string' ? p.surfaceType : 'wood-on-wood'}`}
        </Etch>
        {bn && (
          <Etch x={95} y={10} size={5.4} color="#334155" weight={700}>
            {'নততল ও ঘর্ষণ'}
          </Etch>
        )}
      </g>
    );
  }
};

// tiny helpers used by the protractor needle above
function ctx_x(angleDeg: number) {
  return Math.cos(((angleDeg - 90) * Math.PI) / 180) * 26;
}
function ctx_y(angleDeg: number) {
  return Math.sin(((angleDeg - 90) * Math.PI) / 180) * 26;
}

const dynamicsTrolley: ArtEntry = {
  vb: '0 0 120 54',
  Comp: ({ p, bn }) => {
    const m = num(p.cartMassGrams, 500) + num(p.extraMassGrams, 0);
    return (
      <g>
        {/* burnished aluminium deck with a hook */}
        <rect x={14} y={18} width={92} height={16} rx={2.5} fill="url(#ix-steel)" stroke="#5b6876" strokeWidth={0.7} filter="url(#ix-drop)" />
        <rect x={14} y={18} width={92} height={5} rx={2} fill="#ffffff" opacity={0.28} />
        <rect x={14} y={31} width={92} height={3} rx={1.5} fill="#0b1220" opacity={0.25} />
        <path d="M 12 22 h -8 a 3 3 0 0 1 0 -6 h 4" fill="none" stroke="url(#ix-chrome)" strokeWidth={1.6} />
        {/* ball-bearing wheels */}
        {[26, 104].map((x) => (
          <g key={x}>
            <circle cx={x} cy={40} r={7} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.6} />
            <circle cx={x} cy={40} r={3.4} fill="url(#ix-chrome)" stroke="#475569" strokeWidth={0.4} />
            <circle cx={x} cy={40} r={1} fill="#334155" />
          </g>
        ))}
        {/* slotted weights stacked on the deck */}
        {Array.from({ length: clamp(Math.round(num(p.extraMassGrams, 0) / 200), 0, 4) }).map((_, i) => (
          <SlottedWeight key={i} cx={60} cy={12} r={9} />
        ))}
        <Etch x={60} y={52} size={5.6} color="#334155" weight={800} mono>
          {`${Math.round(m)} g`}
        </Etch>
        <Etch x={100} y={14} size={5} color="#475569">
          {bn ? 'গাড়ি' : 'TROLLEY'}
        </Etch>
      </g>
    );
  }
};

const singlePulley: ArtEntry = {
  vb: '0 0 72 66',
  Comp: ({ p }) => {
    const d = clamp(num(p.diameterCm, 5), 1, 20);
    const r = 8 + d * 1.4;
    const cx = 36;
    const cy = 30;
    return (
      <g>
        {/* wall bracket and the screw that holds the frame up */}
        <rect x={4} y={3} width={13} height={5} rx={1.6} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.5} />
        <Screw cx={8} cy={5.5} r={2} />
        <path d={`M 16 5.5 H ${cx}`} stroke="url(#ix-steel-h)" strokeWidth={5} />
        {/* the stirrup frame: two straps either side of the sheave, joined on top */}
        <rect x={cx - 4} y={8} width={8} height={5} rx={1.6} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.5} />
        <path
          d={`M ${cx - 3.4} 12 L ${cx - 3.4} ${cy + r * 0.35} M ${cx + 3.4} 12 L ${cx + 3.4} ${cy + r * 0.35}`}
          stroke="url(#ix-steel-h)"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        {/* turned aluminium sheave with a narrow rope groove and a bright rim */}
        <circle cx={cx} cy={cy} r={r} fill="url(#ix-alu-ball)" stroke="#5b6673" strokeWidth={0.7} filter="url(#ix-shadow)" />
        <circle cx={cx} cy={cy} r={r * 0.9} fill="none" stroke="#334155" strokeOpacity={0.55} strokeWidth={Math.max(1, r * 0.16)} />
        <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="#e2e8f0" strokeOpacity={0.45} strokeWidth={0.8} />
        {[20, 65, 110, 155, 200, 245, 290, 335].map((k) => (
          <line
            key={k}
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r * 0.76}
            stroke="#ffffff"
            strokeOpacity={0.28}
            strokeWidth={1.2}
            transform={`rotate(${k} ${cx} ${cy})`}
          />
        ))}
        {/* bronze bush and axle */}
        <circle cx={cx} cy={cy} r={r * 0.3} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.6} />
        <circle cx={cx} cy={cy} r={r * 0.3} fill="url(#ix-knurl)" opacity={0.3} />
        <circle cx={cx} cy={cy} r={1.9} fill="#2b3238" />
        <path d={`M ${cx - r * 0.72} ${cy - r * 0.68} a ${r} ${r} 0 0 1 ${r * 0.98} ${-r * 0.42}`} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.7} />
        {/* the cord: it hangs vertically on both sides of the sheave, as it must */}
        <path
          d={`M ${cx - r} 58 L ${cx - r} ${cy - r * 0.2} A ${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.2} L ${cx + r} 58`}
          fill="none"
          stroke="#5b4b32"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} 58 L ${cx - r} ${cy - r * 0.2} A ${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.2} L ${cx + r} 58`}
          fill="none"
          stroke="#e0cda6"
          strokeWidth={1}
          strokeDasharray="2.6 2.6"
          strokeLinecap="round"
        />
        <Etch x={cx} y={64} size={6} color="#334155" weight={800} mono>
          {`Ø ${d} cm`}
        </Etch>
      </g>
    );
  }
};

const springBalance: ArtEntry = {
  vb: '0 0 58 118',
  Comp: ({ p, bn }) => {
    const cap = num(p.maxCapacityN, 5);
    const zero = num(p.zeroError, 0);
    const load = clamp(num(p.loadN, 0), 0, cap);
    // the index really hangs at the point the load puts it: a linear spring
    const stretch = (load / Math.max(0.1, cap)) * 62;
    return (
      <g>
        {/* top cap and the ring it hangs from */}
        <rect x={20} y={14} width={20} height={12} rx={3} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} filter="url(#ix-shadow)" />
        <rect x={20} y={14} width={20} height={4} rx={2} fill="#ffffff" opacity={0.18} />
        <path d="M 30 14 v -5 a 5.5 5.5 0 0 1 11 0 v 5" fill="none" stroke="url(#ix-chrome)" strokeWidth={2.2} />
        <circle cx={30} cy={9} r={1.6} fill="url(#ix-brass)" />
        {/* clear barrel so the spring can be seen working */}
        <rect x={21} y={25} width={18} height={74} rx={3} fill="#f7fbff" opacity={0.42} stroke="#9dc0da" strokeWidth={0.6} />
        <rect x={22} y={26} width={16} height={72} rx={2.6} fill="url(#ix-glass)" opacity={0.65} />
        {/* the helical spring inside, stretched by the load */}
        {(() => {
          const coils = 16;
          const top = 30;
          const len = 40 + stretch * 0.6;
          let d = `M 30 ${top}`;
          for (let i = 1; i <= coils * 4; i++) {
            const f = i / (coils * 4);
            d += ` L ${(30 + Math.sin((f * coils) * Math.PI * 2) * 6).toFixed(2)} ${(top + f * len).toFixed(2)}`;
          }
          return (
            <>
              <path d={d} fill="none" stroke="#5b6876" strokeWidth={1.8} strokeLinejoin="round" />
              <path d={d} fill="none" stroke="#e6edf4" strokeWidth={0.7} strokeLinejoin="round" opacity={0.8} />
            </>
          );
        })()}
        {/* the index plunger, riding at the stretched position */}
        <g transform={`translate(0 ${stretch})`}>
          <rect x={24} y={62} width={12} height={3.4} rx={1.4} fill="#b91c1c" />
          <rect x={27} y={58} width={5} height={22} fill="url(#ix-steel)" opacity={0.9} />
        </g>
        {/* printed newton scale beside the barrel */}
        <rect x={40} y={27} width={13} height={68} rx={2} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.5} />
        <LinearScale x={41} y={29} w={11} h={64} from={cap} to={0} major={1} minor={0.2} vertical unit="N" size={4.2} tick={11} />
        {/* the load hook under the barrel, swinging a little with the load */}
        <path d="M 30 99 v 5 a 4.4 4.4 0 1 0 8.8 0 v -3" fill="none" stroke="url(#ix-chrome)" strokeWidth={1.8} />
        <circle cx={30} cy={99} r={2} fill="url(#ix-brass)" />
        {zero !== 0 && (
          <Etch x={30} y={116} size={4.6} color="#b91c1c" mono>
            {`zero ${zero > 0 ? '+' : ''}${zero}`}
          </Etch>
        )}
        {bn && (
          <Etch x={30} y={8} size={4.6} color="#475569">
            {'স্প্রিং ব্যালান্স'}
          </Etch>
        )}
      </g>
    );
  }
};

const beamBalance: ArtEntry = {
  vb: '0 0 150 112',
  Comp: ({ p, bn, live }) => {
    const rider = clamp(num(p.riderPositionMg, 0), 0, 10);
    const tilt = clamp((rider - 5) * 1.6, -8, 8);
    return (
      <g>
        <Contact cx={75} cy={106} rx={54} opacity={0.3} />
        {/* polished mahogany base on levelling feet */}
        <rect x={14} y={88} width={122} height={14} rx={3} fill="url(#ix-mahogany)" stroke="#3f1c0d" strokeWidth={0.8} filter="url(#ix-shadow)" />
        <rect x={14} y={88} width={122} height={14} rx={3} fill="url(#ix-grain)" opacity={0.7} />
        <rect x={14} y={88} width={122} height={14} rx={3} fill="url(#ix-varnish)" />
        <Screw cx={26} cy={104} r={3.4} />
        <Screw cx={124} cy={104} r={3.4} />
        {/* polished column with the agate knife edge on top */}
        <path d="M 68 88 L 82 88 L 78 46 L 72 46 Z" fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
        <path d="M 72.6 88 L 76 88 L 75 48 L 73.8 48 Z" fill="#fff8dc" opacity={0.45} />
        <path d="M 68 88 L 82 88 L 82 84 L 68 84 Z" fill="#0b1220" opacity={0.18} />
        <path d="M 71 46 L 79 46 L 75 42 Z" fill="#e8eef5" stroke="#8b97a3" strokeWidth={0.4} />
        <circle cx={75} cy={44} r={3} fill="url(#ix-brass-ball)" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '75px 44px', transition: live ? 'transform 700ms cubic-bezier(.2,1.4,.4,1)' : undefined }}>
          {/* beam */}
          <rect x={26} y={41} width={98} height={5} rx={2.5} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
          <rect x={26} y={41} width={98} height={1.8} rx={1} fill="#fff8dc" opacity={0.6} />
          {/* rider sliding on the beam */}
          <path d={`M ${26 + rider * 9.8} 34 l 4 8 l -8 0 Z`} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth={0.4} />
          {/* hangers with pans */}
          {[26, 124].map((x) => (
            <g key={x}>
              <line x1={x} y1={43} x2={x} y2={62} stroke="#9aa4ad" strokeWidth={0.7} />
              <path d={`M ${x - 20} 62 h 40 l -5 4 h -30 Z`} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.5} />
              <ellipse cx={x} cy={66} rx={20} ry={5} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.5} />
              {/* brass weights on the right pan */}
              {x === 124 && (
                <g>
                  <rect x={x - 8} y={56} width={16} height={9} rx={1.5} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
                  <circle cx={x} cy={56} r={2.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
                </g>
              )}
            </g>
          ))}
        </g>
        {/* long pointer against an ivory scale */}
        <g style={{ transform: `rotate(${-tilt * 0.7}deg)`, transformOrigin: '75px 44px', transition: live ? 'transform 700ms cubic-bezier(.2,1.4,.4,1)' : undefined }}>
          <line x1={75} y1={44} x2={75} y2={82} stroke="#b91c1c" strokeWidth={1.4} />
        </g>
        <rect x={65} y={74} width={20} height={15} rx={1.4} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.5} />
        <rect x={67} y={76} width={16} height={2.2} rx={1} fill="#cbd5e1" opacity={0.7} />
        <line x1={69} y1={81} x2={81} y2={81} stroke="#334155" strokeWidth={0.7} />
        <line x1={69} y1={86} x2={81} y2={86} stroke="#334155" strokeWidth={0.4} opacity={0.7} />
        <Etch x={75} y={110} size={5.4} color="#3f2a0e" weight={700} mono>
          {rider === 0 ? (bn ? 'ভারসাম্য' : 'BALANCED') : `rider ${rider.toFixed(1)} mg`}
        </Etch>
        {bn && (
          <Etch x={75} y={10} size={5.4} color="#334155" weight={700}>
            {'ভার নিক্তি'}
          </Etch>
        )}
      </g>
    );
  }
};

const projectileLauncher: ArtEntry = {
  vb: '0 0 132 84',
  Comp: ({ p, bn, live }) => {
    const angle = clamp(num(p.launchAngleDeg, 45), 0, 90);
    const v = clamp(num(p.muzzleVelocity, 8), 2, 25);
    const h0 = clamp(num(p.launchHeightM, 0), 0, 30);
    const g = G;
    const rad = (angle * Math.PI) / 180;
    const range = ((v * v * Math.sin(2 * rad)) / g) * (h0 > 0 ? 1.08 : 1);
    const apex = (v * v * Math.sin(rad) * Math.sin(rad)) / (2 * g);
    const [t, setT] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setT((((now - t0) / 1400) % 1) * 1.0);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, v, angle]);
    const muzzle = { x: 22, y: 60 - h0 * 1.2 };
    const px = (m: number) => muzzle.x + (m / Math.max(1, range * 1.06)) * 92;
    const py = (m: number) => 66 - (m / Math.max(0.5, apex * 1.25)) * 44;
    const path: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const tt = (i / 40) * (2 * v * Math.sin(rad)) / g;
      const x = v * Math.cos(rad) * tt;
      const y = h0 + v * Math.sin(rad) * tt - 0.5 * g * tt * tt;
      if (y < 0) break;
      path.push(`${i === 0 ? 'M' : 'L'} ${px(x).toFixed(1)} ${py(y).toFixed(1)}`);
    }
    const ballT = t * ((2 * v * Math.sin(rad)) / g);
    const ballX = v * Math.cos(rad) * ballT;
    const ballY = h0 + v * Math.sin(rad) * ballT - 0.5 * g * ballT * ballT;
    return (
      <g>
        {/* cast-iron base with carriage wheels */}
        <path d="M 8 66 h 40 l -6 -14 h -28 Z" fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} filter="url(#ix-drop)" />
        <circle cx={16} cy={68} r={6} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.6} />
        <circle cx={40} cy={68} r={6} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.6} />
        <circle cx={16} cy={68} r={2} fill="#334155" />
        <circle cx={40} cy={68} r={2} fill="#334155" />
        {/* brass barrel elevated by the launch angle */}
        <g transform={`translate(${muzzle.x} ${muzzle.y}) rotate(${-angle})`}>
          <rect x={0} y={-7} width={44} height={14} rx={3} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth={0.6} />
          <rect x={4} y={-7} width={40} height={3.4} rx={2} fill="#fff8dc" opacity={0.55} />
          <rect x={0} y={-9} width={6} height={18} rx={2} fill="url(#ix-brass)" />
          <circle cx={2} cy={0} r={7} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
          {[14, 24, 34].map((x) => (
            <rect key={x} x={x} y={-8} width={2} height={16} fill="#6d4a0a" opacity={0.45} />
          ))}
        </g>
        {/* protractor quadrant + elevation pointer */}
        <g transform="translate(22 60)">
          <path d="M 0 0 m -22 -2 a 22 22 0 0 1 44 0" fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.5} opacity={0.9} />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = ((i * 10 - 90) * Math.PI) / 180;
            return <line key={i} x1={Math.cos(a) * 20} y1={Math.sin(a) * 20 - 2} x2={Math.cos(a) * 16} y2={Math.sin(a) * 16 - 2} stroke="#334155" strokeWidth={i % 3 === 0 ? 0.8 : 0.4} />;
          })}
        </g>
        {/* real parabolic trajectory for the set v₀ and θ */}
        <path d={path.join(' ')} fill="none" stroke="#2563eb" strokeWidth={1.1} strokeDasharray="4 3" opacity={0.75} />
        {live && <circle cx={px(ballX)} cy={py(Math.max(0, ballY))} r={3.4} fill="url(#ix-chrome)" stroke="#334155" strokeWidth={0.5} />}
        <line x1={22} y1={72} x2={120} y2={72} stroke="#334155" strokeWidth={1.6} />
        <line x1={22} y1={72} x2={22} y2={20} stroke="#334155" strokeWidth={1.2} opacity={0.5} />
        <Etch x={64} y={82} size={5.4} color="#334155" weight={700} mono>
          {`θ=${angle}° · v₀=${v} m/s · R≈${range.toFixed(1)} m · H≈${apex.toFixed(1)} m`}
        </Etch>
        {bn && (
          <Etch x={92} y={12} size={5} color="#475569">
            {'প্রাস লঞ্চার'}
          </Etch>
        )}
      </g>
    );
  }
};

const atwoodMachine: ArtEntry = {
  vb: '0 0 140 144',
  Comp: ({ p, bn, live }) => {
    const m1 = num(p.mass1Grams, 200) / 1000;
    const m2 = num(p.mass2Grams, 220) / 1000;
    const a = ((m2 - m1) * G) / (m1 + m2 || 1);
    const [t, setT] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setT(((now - t0) / 1000) % 4);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, a]);
    // x = ½at² over a 2.4 m fall, clipped to the drawn travel.
    const travel = Math.min(0.55, 0.5 * Math.abs(a) * Math.pow(Math.min(t, 2.4 / Math.max(0.05, Math.abs(a))), 2) / 2.2);
    const shift = (m2 >= m1 ? 1 : -1) * travel * 46;
    const leftY = 62 + shift;
    const rightY = 62 - shift;
    const pulleyR = 24;
    const spin = live ? (shift / (pulleyR * 2)) * 360 : 0;
    return (
      <g>
        {/* wall bracket + retort column */}
        <rect x={66} y={10} width={8} height={16} fill="url(#ix-iron)" />
        <rect x={44} y={6} width={52} height={8} rx={2} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.5} />
        <Rod x1={70} y1={14} x2={70} y2={26} w={6} />
        {/* pulley */}
        <g>
          <circle cx={70} cy={30} r={pulleyR} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.9} filter="url(#ix-drop)" />
          <circle cx={70} cy={30} r={pulleyR * 0.8} fill="none" stroke="#0b1220" strokeOpacity={0.3} strokeWidth={2.4} />
          <circle cx={70} cy={30} r={7} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
          <g style={{ transform: `rotate(${spin}deg)`, transformOrigin: '70px 30px', transition: 'transform 80ms linear' }}>
            {[0, 90, 180, 270].map((d) => (
              <line key={d} x1={70} y1={30} x2={70} y2={30 - pulleyR * 0.78} stroke="#cbd5e1" strokeOpacity={0.6} strokeWidth={1.4} transform={`rotate(${d} 70 30)`} />
            ))}
          </g>
        </g>
        {/* inextensible thread */}
        <path d={`M ${70 - pulleyR} 30 L ${70 - pulleyR} ${leftY - 6}`} stroke="#6b7280" strokeWidth={1} fill="none" />
        <path d={`M ${70 + pulleyR} 30 L ${70 + pulleyR} ${rightY - 6}`} stroke="#6b7280" strokeWidth={1} fill="none" />
        {/* slotted masses with hangers */}
        {[
          { x: 70 - pulleyR, y: leftY, m: m1 },
          { x: 70 + pulleyR, y: rightY, m: m2 }
        ].map((side, k) => (
          <g key={k}>
            <path d={`M ${side.x} ${side.y - 8} v 6`} stroke="#9aa4ad" strokeWidth={1.2} />
            <path d={`M ${side.x - 9} ${side.y - 2} h 18 a 9 9 0 0 0 -18 0`} fill="none" stroke="#9aa4ad" strokeWidth={1.2} />
            {Array.from({ length: clamp(Math.round(side.m * 1000 / 50), 1, 8) }).map((_, i) => (
              <SlottedWeight key={i} cx={side.x} cy={side.y + 10 + i * 7.4} r={11} label={i === 0 ? `${Math.round(side.m * 1000)}` : undefined} />
            ))}
          </g>
        ))}
        {/* graduated vertical scale */}
        <LinearScale x={118} y={48} w={12} h={86} from={0} to={100} major={10} minor={2} vertical unit="cm" size={4} />
        <Etch x={64} y={142} size={5.4} color="#334155" weight={800} mono>
          {`a = ${a.toFixed(2)} m/s²`}
        </Etch>
        {bn && (
          <Etch x={22} y={142} size={5} color="#475569">
            {'অ্যাটউড'}
          </Etch>
        )}
      </g>
    );
  }
};

const flywheel: ArtEntry = {
  vb: '0 0 140 122',
  Comp: ({ p, bn, live }) => {
    const R = clamp(num(p.wheelRadiusCm, 10), 4, 25);
    const m = num(p.wheelMassKg, 4);
    const hang = num(p.hangingMassGrams, 200) / 1000;
    const r = 34 + R * 1.6;
    const [spin, setSpin] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        // ω grows with the falling mass over the flywheel's inertia
        const I = 0.5 * m * Math.pow(R / 100, 2);
        const alpha = (hang * G * (R / 100)) / Math.max(0.05, I);
        const t = ((now - t0) / 1000) % 3.2;
        setSpin(0.5 * alpha * t * t * (180 / Math.PI) * 0.35);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, m, R, hang]);
    return (
      <g>
        <Contact cx={70} cy={116} rx={48} opacity={0.3} />
        {/* bearing pedestals on a cast base */}
        <rect x={22} y={98} width={96} height={16} rx={3} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.7} />
        {[44, 96].map((x) => (
          <g key={x}>
            <path d={`M ${x - 8} 98 L ${x + 8} 98 L ${x + 5} 64 L ${x - 5} 64 Z`} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.5} />
            <circle cx={x} cy={62} r={5.5} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
          </g>
        ))}
        {/* heavy rim + spokes + hub */}
        <g style={{ transform: `rotate(${spin % 360}deg)`, transformOrigin: '70px 62px' }}>
          <circle cx={70} cy={62} r={r} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.8} />
          <circle cx={70} cy={62} r={r * 0.86} fill="url(#ix-charcoal)" opacity={0.25} />
          {Array.from({ length: 6 }).map((_, i) => (
            <g key={i} transform={`rotate(${i * 60} 70 62)`}>
              <path d={`M 68 62 L 71 62 L ${71} ${62 - r * 0.9} L 68 ${62 - r * 0.9} Z`} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.4} />
            </g>
          ))}
          <circle cx={70} cy={62} r={12} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
          <circle cx={70} cy={62} r={4.4} fill="#334155" />
          {live && <path d={`M 70 62 L ${70 + r * 0.8} ${62 - r * 0.2}`} stroke="#f8fafc" strokeOpacity={0.5} strokeWidth={1.2} />}
        </g>
        {/* weight hanger on a cord wrapped round the axle */}
        <path d={`M ${70 + 12} 62 C ${70 + r * 0.9} 74 ${70 + r * 0.75} 90 70 + ${r * 0.6} 108`} fill="none" stroke="#c8b48a" strokeWidth={1.1} />
        <SlottedWeight cx={70 + r * 0.6} cy={104} r={11} label={`${Math.round(hang * 1000)}`} />
        <Etch x={70} y={120} size={5.4} color="#334155" weight={800} mono>
          {`R = ${R} cm · M = ${m} kg`}
        </Etch>
        {bn && (
          <Etch x={20} y={14} size={5.2} color="#475569">
            {'ফ্লাইহুইল'}
          </Etch>
        )}
      </g>
    );
  }
};

const newtonsCradle: ArtEntry = {
  vb: '0 0 130 86',
  Comp: ({ p, bn, live }) => {
    const n = clamp(Math.round(num(p.displacedBalls, 1)), 1, 4);
    const [t, setT] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      const t0 = performance.now();
      const step = (now: number) => {
        setT((((now - t0) / 1000) % 1.6) / 1.6);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live, n]);
    const swing = Math.sin(t * Math.PI * 2) * (Math.PI / 5);
    const pivotY = 18;
    const len = 44;
    const gap = 13;
    const firstX = 65 - 2 * gap;
    return (
      <g>
        <Contact cx={65} cy={80} rx={48} opacity={0.3} />
        {/* polished wooden frame */}
        <rect x={8} y={72} width={114} height={10} rx={2.5} fill="url(#ix-wood)" stroke="#5b3c14" strokeWidth={0.8} />
        <rect x={8} y={72} width={114} height={10} rx={2.5} fill="url(#ix-grain)" />
        {[14, 116].map((x) => (
          <g key={x}>
            <rect x={x - 5} y={16} width={10} height={58} fill="url(#ix-wood-dark)" stroke="#3f2a0e" strokeWidth={0.6} />
            <rect x={x - 5} y={16} width={3} height={58} fill="#ffffff" opacity={0.14} />
          </g>
        ))}
        <rect x={9} y={12} width={112} height={9} rx={2.5} fill="url(#ix-wood-dark)" stroke="#3f2a0e" strokeWidth={0.7} />
        <Sheen x={14} y={13.5} w={100} h={3} rx={1.5} opacity={0.18} rotate={0} />
        {/* 5 chrome balls on bifilar suspensions */}
        {[0, 1, 2, 3, 4].map((i) => {
          const isLeftGroup = i < n;
          const isRightGroup = i >= 5 - n;
          const ang = live ? (isLeftGroup ? swing : isRightGroup ? -swing : 0) : isLeftGroup ? swing * 0 + -0.35 : 0;
          const px = firstX + i * gap;
          const bx = px + Math.sin(ang) * len;
          const by = pivotY + Math.cos(ang) * len;
          return (
            <g key={i}>
              <line x1={px - 5} y1={pivotY} x2={bx - 4} y2={by} stroke="#9aa4ad" strokeWidth={0.5} />
              <line x1={px + 5} y1={pivotY} x2={bx + 4} y2={by} stroke="#9aa4ad" strokeWidth={0.5} />
              <circle cx={bx} cy={by} r={6.4} fill="url(#ix-chrome)" stroke="#475569" strokeWidth={0.5} />
              <circle cx={bx - 2} cy={by - 2.4} r={2} fill="#ffffff" opacity={0.75} />
              <ellipse cx={bx} cy={by + 3.4} rx={5} ry={2} fill="#0b1220" opacity={0.2} />
            </g>
          );
        })}
        <Etch x={65} y={84} size={5.4} color="#3f2a0e" weight={700} mono>
          {`${n} ${bn ? 'বল সরানো' : n === 1 ? 'ball lifted' : 'balls lifted'}`}
        </Etch>
      </g>
    );
  }
};

export const mechanicsArt: Record<string, ArtEntry> = {
  'simple-pendulum': simplePendulum,
  'helical-spring': helicalSpring,
  'slotted-weights-set': weightsSet,
  'inclined-plane-track': inclinedPlane,
  'dynamics-trolley': dynamicsTrolley,
  'single-pulley': singlePulley,
  'spring-balance': springBalance,
  'physical-beam-balance': beamBalance,
  'projectile-launcher': projectileLauncher,
  'atwood-machine': atwoodMachine,
  'flywheel-rotational': flywheel,
  'newtons-cradle': newtonsCradle
};
