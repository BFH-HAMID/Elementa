'use client';

import React from 'react';
import { Contact, Etch, LinearScale, Rod, Screw, clamp, num, on, type ArtEntry } from './shared';

/* ------------------------------------------------------------------ */
/* Optics: the light bench — lenses, mirrors, slabs, prism, slits       */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

/** Cauchy dispersion for crown glass — the prism really splits by wavelength. */
const glassIndex = (lambdaNm: number) => 1.5046 + 4200 / (lambdaNm * lambdaNm);

const SPECTRUM = [
  { nm: 400, hex: '#7c3aed' },
  { nm: 440, hex: '#2563eb' },
  { nm: 480, hex: '#0891b2' },
  { nm: 510, hex: '#16a34a' },
  { nm: 570, hex: '#eab308' },
  { nm: 600, hex: '#f97316' },
  { nm: 650, hex: '#dc2626' }
];

/** Saddle clamp that carries optics on the rail. */
function Saddle({ x, y, w = 26, h = 10 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={2} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
      <rect x={x - w / 2} y={y} width={w} height={3} rx={1.5} fill="#ffffff" opacity={0.16} />
      <Screw cx={x + w / 2 - 3} cy={y + h / 2 + 0.4} r={1.7} angle={45} />
    </g>
  );
}

const opticalBench: ArtEntry = {
  vb: '0 0 240 46',
  Comp: ({ p, bn }) => {
    const len = clamp(num(p.railLengthCm, 150), 100, 200);
    return (
      <g>
        {/* machined steel rail with a dovetail top */}
        <rect x={6} y={22} width={228} height={14} rx={2} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.7} filter="url(#ix-drop)" />
        <rect x={6} y={22} width={228} height={4} rx={2} fill="#ffffff" opacity={0.45} />
        <rect x={10} y={18} width={220} height={5} rx={2} fill="url(#ix-steel-h)" stroke="#64748b" strokeWidth={0.4} />
        {/* printed centimetre scale */}
        <LinearScale x={10} y={25} w={220} h={10} from={0} to={len} major={10} minor={5} unit="cm" size={4.4} />
        {/* carriers */}
        <Saddle x={46} y={10} />
        <Saddle x={118} y={10} />
        <Saddle x={192} y={10} />
        <Contact cx={120} cy={40} rx={110} opacity={0.25} />
        <Etch x={120} y={44} size={4.8} color="#334155" weight={700} mono>
          {`${bn ? 'অপটিক্যাল বেঞ্চ রেল' : 'OPTICAL BENCH RAIL'} · ${len} cm`}
        </Etch>
      </g>
    );
  }
};

function lensEntry(kind: 'convex' | 'concave'): ArtEntry {
  return {
    vb: '0 0 76 98',
    Comp: ({ p, bn }) => {
      const f = num(p.focalLengthCm, kind === 'convex' ? 15 : -20);
      const d = clamp(num(p.diameterMm, 50), 20, 80) / 100;
      const r = 26 + d * 8;
      const bulge = clamp(Math.abs(f) < 10 ? 11 : 19 - Math.abs(f) * 0.18, 4.5, 11);
      const cy = 40;
      const cx = 38;
      return (
        <g>
          <Saddle x={cx} y={82} w={30} h={9} />
          <Rod x1={cx} y1={40} x2={cx} y2={84} w={5} />
          {/* glass body: biconvex or biconcave, with polished edges */}
          {kind === 'convex' ? (
            <path
              d={`M ${cx} ${cy - r} Q ${cx + bulge} ${cy} ${cx} ${cy + r} Q ${cx - bulge} ${cy} ${cx} ${cy - r} Z`}
              fill="url(#ix-lens-glass)"
              stroke="#7fb6dd"
              strokeWidth={1}
              filter="url(#ix-drop)"
            />
          ) : (
            <path
              d={`M ${cx - 9} ${cy - r} Q ${cx - 3} ${cy} ${cx - 9} ${cy + r} L ${cx + 9} ${cy + r} Q ${cx + 3} ${cy} ${cx + 9} ${cy - r} Z`}
              fill="url(#ix-lens-glass)"
              stroke="#7fb6dd"
              strokeWidth={1}
              filter="url(#ix-drop)"
            />
          )}
          {/* internal reflections that make glass read as glass */}
          <path d={`M ${cx - bulge * 0.7} ${cy - r * 0.6} Q ${cx - bulge * 0.2} ${cy - r * 0.1} ${cx - bulge * 0.75} ${cy + r * 0.35}`} fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.6} />
          <path d={`M ${cx + bulge * 0.55} ${cy - r * 0.7} Q ${cx + bulge * 0.15} ${cy - r * 0.2} ${cx + bulge * 0.6} ${cy + r * 0.3}`} fill="none" stroke="#ffffff" strokeOpacity={0.4} strokeWidth={0.9} />
          <ellipse cx={cx + bulge * 0.15} cy={cy - r * 0.55} rx={2.4} ry={3.6} fill="#ffffff" opacity={0.5} />
          {/* the focal points engraved on the holder's rule */}
          <line x1={cx - 22} y1={74} x2={cx + 22} y2={74} stroke="#94a3b8" strokeWidth={0.6} />
          {[cx - 14, cx + 14].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={74} r={1.8} fill="#c2410c" />
              <Etch x={x} y={70} size={4.4} color="#c2410c" weight={800}>
                F
              </Etch>
            </g>
          ))}
          <Etch x={cx} y={96} size={5} color="#334155" weight={800} mono>
            {`f = ${f > 0 ? '+' : ''}${f} cm`}
          </Etch>
          {bn && (
            <Etch x={cx} y={10} size={4.6} color="#475569">
              {kind === 'convex' ? 'উত্তল লেন্স' : 'অবতল লেন্স'}
            </Etch>
          )}
        </g>
      );
    }
  };
}

function mirrorEntry(kind: 'concave' | 'convex' | 'plane'): ArtEntry {
  return {
    vb: '0 0 76 98',
    Comp: ({ p, bn }) => {
      const f = num(p.focalLengthCm, kind === 'concave' ? 20 : -25);
      const cy = 40;
      const cx = 40;
      const r = 34;
      const depth = clamp(Math.abs(f) < 10 ? 10 : 26 - Math.abs(f) * 0.3, 5, 14);
      const tilt = kind === 'plane' ? clamp(num(p.angleDeg, 0), -90, 90) : 0;
      return (
        <g>
          <Saddle x={cx} y={82} w={30} h={9} />
          <Rod x1={cx} y1={40} x2={cx} y2={84} w={5} />
          <g style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined, transformOrigin: `${cx}px ${cy}px` }}>
            {kind === 'concave' && (
              <>
                <path d={`M ${cx - depth} ${cy - r} Q ${cx + depth} ${cy} ${cx - depth} ${cy + r} L ${cx - depth - 6} ${cy + r} Q ${cx + depth - 8} ${cy} ${cx - depth - 6} ${cy - r} Z`} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} filter="url(#ix-drop)" />
                <path d={`M ${cx - depth - 1} ${cy - r} Q ${cx + depth - 1} ${cy} ${cx - depth - 1} ${cy + r}`} fill="none" stroke="#dfe9f2" strokeWidth={3.4} strokeLinecap="round" />
                <path d={`M ${cx - depth - 2.4} ${cy - r} Q ${cx + depth - 2.4} ${cy} ${cx - depth - 2.4} ${cy + r}`} fill="none" stroke="#8ea3b5" strokeWidth={0.9} opacity={0.75} />
                <path d={`M ${cx - depth + 3} ${cy - r * 0.55} Q ${cx + depth * 0.5} ${cy - r * 0.2} ${cx - depth + 3} ${cy + r * 0.2}`} fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={0.8} />
              </>
            )}
            {kind === 'convex' && (
              <>
                <path d={`M ${cx + depth} ${cy - r} Q ${cx - depth} ${cy} ${cx + depth} ${cy + r} L ${cx + depth + 6} ${cy + r} Q ${cx - depth + 8} ${cy} ${cx + depth + 6} ${cy - r} Z`} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} filter="url(#ix-drop)" />
                <path d={`M ${cx + depth} ${cy - r} Q ${cx - depth} ${cy} ${cx + depth} ${cy + r}`} fill="none" stroke="#dfe9f2" strokeWidth={3.4} strokeLinecap="round" />
                <path d={`M ${cx + depth + 1.4} ${cy - r} Q ${cx - depth + 1.4} ${cy} ${cx + depth + 1.4} ${cy + r}`} fill="none" stroke="#8ea3b5" strokeWidth={0.9} opacity={0.75} />
              </>
            )}
            {/* the mirror sits in a clamp that grips its edge, as on a real holder */}
            <rect x={cx - 9} y={cy + r - 2} width={18} height={7} rx={2} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
            <Screw cx={cx - 5} cy={cy + r + 1.4} r={1.6} />
            {kind === 'plane' && (
              <>
                <rect x={cx - 4} y={cy - r} width={8} height={r * 2} rx={1} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} />
                <line x1={cx - 4} y1={cy - r} x2={cx - 4} y2={cy + r} stroke="#eaf6ff" strokeWidth={2.6} />
                <line x1={cx - 4} y1={cy - r} x2={cx - 4} y2={cy + r} stroke="#ffffff" strokeWidth={0.8} opacity={0.7} />
                {/* a faint reflected highlight reads as a front-coated mirror */}
                <path d={`M ${cx - 4} ${cy - r * 0.6} L ${cx - 16} ${cy - r * 0.2}`} stroke="#e2e8f0" strokeWidth={1} opacity={0.5} />
              </>
            )}
          </g>
          {kind !== 'plane' && (
            <>
              <line x1={cx - 22} y1={74} x2={cx + 22} y2={74} stroke="#94a3b8" strokeWidth={0.6} />
              <circle cx={cx} cy={74} r={1.8} fill="#c2410c" />
              <Etch x={cx} y={70} size={4.4} color="#c2410c" weight={800}>
                {kind === 'concave' ? 'F' : 'F'}
              </Etch>
            </>
          )}
          <Etch x={cx} y={96} size={5} color="#334155" weight={800} mono>
            {kind === 'plane' ? `tilt ${tilt.toFixed(0)}°` : `f = ${f > 0 ? '+' : ''}${f} cm`}
          </Etch>
          {bn && (
            <Etch x={cx} y={10} size={4.6} color="#475569">
              {kind === 'concave' ? 'অবতল দর্পণ' : kind === 'convex' ? 'উত্তল দর্পণ' : 'সমতল দর্পণ'}
            </Etch>
          )}
        </g>
      );
    }
  };
}

const glassSlab: ArtEntry = {
  vb: '0 0 118 88',
  Comp: ({ p, bn }) => {
    const n = clamp(num(p.refractiveIndex, 1.52), 1.3, 1.9);
    const thick = clamp(num(p.thicknessMm, 30), 10, 80);
    const top = 14;
    const bottom = top + 12 + thick * 0.45;
    const px = 52;
    const i = 42 * DEG;
    const r = Math.asin(Math.sin(i) / n);
    const shift = (bottom - top) * Math.tan(r - i);
    const qx = px + (bottom - top) * Math.tan(r);
    const startX = px - 34;
    const startY = top - 34 * Math.tan(i);
    const endY = bottom + 26 * Math.cos(i);
    const endX = qx + 26 * Math.sin(i);
    return (
      <g>
        {/* rectangular crown-glass slab in a holder */}
        <rect x={22} y={top} width={74} height={bottom - top} rx={2} fill="url(#ix-lens-glass)" stroke="#7fb6dd" strokeWidth={1} filter="url(#ix-drop)" />
        <rect x={22} y={top} width={74} height={bottom - top} rx={2} fill="url(#ix-glass-sheen)" opacity={0.35} />
        <path d={`M 28 ${top + 4} L 88 ${top + 4}`} stroke="#ffffff" strokeOpacity={0.65} strokeWidth={1.4} />
        <Etch x={96} y={top + 14} size={4.6} color="#0c4a6e" weight={800} mono>
          {`n = ${n.toFixed(3)}`}
        </Etch>
        {/* the ray: incident (with pins), refracted, emergent with lateral shift */}
        <path d={`M ${startX} ${startY} L ${px} ${top}`} stroke="#dc2626" strokeWidth={2} />
        <line x1={px} y1={top} x2={qx} y2={bottom} stroke="#dc2626" strokeWidth={2} />
        <path d={`M ${qx} ${bottom} L ${endX} ${endY}`} stroke="#dc2626" strokeWidth={2} markerEnd="url(#ix-arrow-red)" />
        <line x1={px} y1={top} x2={px} y2={bottom} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="3 3" />
        <line x1={qx} y1={top} x2={qx} y2={bottom} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="3 3" />
        {[0.35, 0.7].map((k) => (
          <g key={k}>
            <circle cx={px - 34 * k * Math.cos(i)} cy={top - 34 * k * Math.cos(i) * Math.tan(i)} r={1.8} fill="#0f172a" />
          </g>
        ))}
        <path d={`M ${px} ${top - 16} A 16 16 0 0 0 ${px - 16 * Math.sin(i)} ${top - 16 * Math.cos(i)}`} fill="none" stroke="#f59e0b" strokeWidth={1.2} />
        <Etch x={px - 40} y={top - 18} size={5} color="#b45309" weight={800} anchor="end">
          {`i ${Math.round(i / DEG)}°`}
        </Etch>
        <Etch x={px + 26} y={top + 20} size={5} color="#047857" weight={800}>
          {`r ${(r / DEG).toFixed(1)}°`}
        </Etch>
        <Etch x={59} y={84} size={5} color="#334155" weight={800} mono>
          {`shift ≈ ${Math.abs(shift).toFixed(1)} cm · t = ${thick} mm`}
        </Etch>
        {bn && (
          <Etch x={59} y={8} size={4.6} color="#475569">
            {'কাচের স্ল্যাব'}
          </Etch>
        )}
      </g>
    );
  }
};

const prism: ArtEntry = {
  vb: '0 0 150 96',
  Comp: ({ p, bn, live }) => {
    const A = clamp(num(p.prismAngleDeg, 60), 30, 75);
    const n0 = clamp(num(p.refractiveIndex, 1.517), 1.4, 1.8);
    const apex = { x: 66, y: 16 };
    const side = 62;
    const half = (A / 2) * DEG;
    const b = { x: apex.x - Math.sin(half) * side, y: apex.y + Math.cos(half) * side };
    const c = { x: apex.x + Math.sin(half) * side, y: apex.y + Math.cos(half) * side };
    const i = 46; // angle of incidence on the first face, in degrees
    // Real prism maths for each wavelength (Cauchy index).
    const rays = SPECTRUM.map((s) => {
      const n = n0 * (glassIndex(s.nm) / glassIndex(589));
      const r1 = Math.asin(clamp(Math.sin(i * DEG) / n, -0.999, 0.999)) / DEG;
      const r2 = A - r1;
      const e = Math.asin(clamp(n * Math.sin(r2 * DEG), -0.999, 0.999)) / DEG;
      const delta = i + e - A;
      return { ...s, r1, r2, e, delta };
    });
    const entry = { x: apex.x - 4, y: apex.y + Math.cos(half) * (side * 0.55) - Math.sin(i * DEG) * 30 };
    return (
      <g>
        {/* prism body */}
        <polygon points={`${apex.x},${apex.y} ${b.x},${b.y} ${c.x},${c.y}`} fill="url(#ix-lens-glass)" stroke="#7fb6dd" strokeWidth={1.1} filter="url(#ix-drop)" />
        <polygon points={`${apex.x},${apex.y} ${b.x},${b.y} ${c.x},${c.y}`} fill="url(#ix-glass-sheen)" opacity={0.3} />
        <path d={`M ${apex.x - 4} ${apex.y + 8} L ${b.x + 8} ${b.y - 6}`} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.2} />
        <path d={`M ${apex.x + 4} ${apex.y + 10} L ${c.x - 6} ${c.y - 8}`} stroke="#ffffff" strokeOpacity={0.4} strokeWidth={0.8} />
        {/* white incident beam */}
        <path d={`M 6 ${entry.y + 16} L ${entry.x} ${entry.y}`} stroke="url(#ix-beam-white)" strokeWidth={5} />
        <path d={`M 6 ${entry.y + 16} L ${entry.x} ${entry.y}`} stroke="#f8fafc" strokeWidth={2} />
        {live && <path d={`M 6 ${entry.y + 16} L ${entry.x} ${entry.y}`} stroke="#ffffff" strokeWidth={9} opacity={0.18} filter="url(#ix-blur)" />}
        {/* dispersed fan: one ray per wavelength, each with its own deviation */}
        {rays.map((ray) => {
          const outX = ray.delta / 2;
          const spread = Math.sin(ray.delta * DEG) * 26;
          return (
            <path
              key={ray.nm}
              d={`M ${entry.x + 4} ${entry.y + 16} L ${entry.x + 24} ${entry.y + 8} L ${104} ${30 + (ray.delta - 34) * 2.4 + spread * 0.25 + outX * 0.1}`}
              fill="none"
              stroke={ray.hex}
              strokeWidth={1.8}
              opacity={0.9}
            />
          );
        })}
        {rays
          .filter((ray) => [400, 510, 650].includes(ray.nm))
          .map((ray) => {
            const spread = Math.sin(ray.delta * DEG) * 26;
            return (
              <Etch key={`l${ray.nm}`} x={148} y={clamp(26 + (ray.delta - 34) * 2.4 + spread * 0.18, 16, 84)} size={4.2} color={ray.hex} weight={800} anchor="end" mono>
                {`${ray.nm}nm δ${ray.delta.toFixed(1)}°`}
              </Etch>
            );
          })}
        <Etch x={48} y={92} size={5} color="#334155" weight={800} mono>
          {`A = ${A}° · n_D = ${n0.toFixed(3)} · i = ${i}°`}
        </Etch>
        {bn && (
          <Etch x={40} y={12} size={4.6} color="#475569">
            {'প্রিজম ও বিচ্ছুরণ'}
          </Etch>
        )}
      </g>
    );
  }
};

function laserEntry(colour: 'red' | 'green'): ArtEntry {
  return {
    vb: '0 0 132 44',
    Comp: ({ p, bn, setProp, live }) => {
      const nm = num(p.wavelengthNm, colour === 'red' ? 632.8 : 532);
      const power = num(p.powerMw, 5);
      const beam = typeof p.beamAngleDeg !== 'undefined' ? clamp(num(p.beamAngleDeg, 0), -45, 45) : 0;
      const lit = p.on === undefined ? true : on(p.on);
      const hex = colour === 'red' ? '#e11d48' : '#22c55e';
      const glow = colour === 'red' ? 'url(#ix-glow-red)' : 'url(#ix-glow-green)';
      const toggle = () => setProp?.('on', !lit);
      return (
        <g>
          {/* anodised aluminium body with a knurled tail cap */}
          <rect x={10} y={14} width={78} height={16} rx={5} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.8} filter="url(#ix-drop)" />
          <rect x={10} y={14} width={78} height={5} rx={3} fill="#ffffff" opacity={0.18} />
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={i} x1={12 + i * 2.4} y1={17} x2={14 + i * 2.4} y2={27} stroke="#0b1220" strokeOpacity={0.5} strokeWidth={0.8} />
          ))}
          <rect x={64} y={16} width={22} height={12} rx={2} fill={lit ? (colour === 'red' ? '#4a0b16' : '#052e16') : '#27272a'} stroke="#0b1220" strokeWidth={0.4} />
          <rect x={66} y={18} width={18} height={4} rx={2} fill={hex} opacity={lit ? 0.85 : 0.25} />
          {/* lens aperture + emitted beam */}
          <ellipse cx={90} cy={22} rx={3.4} ry={8.4} fill="#0f172a" stroke="#475569" strokeWidth={0.5} />
          {lit && (
            <g style={{ transform: `rotate(${beam}deg)`, transformOrigin: '90px 22px' }}>
              <ellipse cx={92} cy={22} rx={2.6} ry={7} fill={glow} opacity={0.95} />
              <rect x={92} y={20.4} width={40} height={3.2} rx={1.6} fill="#ffffff" opacity={0.85} />
              <rect x={92} y={19} width={40} height={6} rx={3} fill={hex} opacity={0.7} />
              {live && <rect x={92} y={17} width={40} height={10} rx={5} fill={hex} opacity={0.25} filter="url(#ix-blur)" />}
              <circle cx={90} cy={22} r={5} fill="#ffffff" opacity={0.9} />
            </g>
          )}
          {/* on/off push button — click it and the beam really goes out */}
          <g
            data-no-drag
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect x={22} y={8} width={14} height={7} rx={2} fill={lit ? hex : '#52525b'} stroke="#0b1220" strokeWidth={0.5} />
            <rect x={20} y={4} width={18} height={14} fill="transparent" />
          </g>
          <Etch x={29} y={6} size={3.6} color="#94a3b8">
            ON
          </Etch>
          <Etch x={90} y={40} size={4.6} color="#334155" weight={800} mono>
            {`${nm.toFixed(1)} nm · ${power} mW`}
          </Etch>
          {bn && (
            <Etch x={48} y={40} size={4.4} color="#475569">
              {lit ? 'চালু' : 'নিভানো'}
            </Etch>
          )}
        </g>
      );
    }
  };
}

const whiteLightSource: ArtEntry = {
  vb: '0 0 100 66',
  Comp: ({ p, bn, live }) => {
    const intensity = clamp(num(p.intensity, 80) / 100, 0.1, 1);
    const slit = clamp(num(p.slitWidthMm, 1), 0.2, 5);
    return (
      <g>
        <Contact cx={46} cy={62} rx={30} opacity={0.3} />
        {/* lamp housing with cooling fins and a chimney */}
        <rect x={10} y={14} width={54} height={40} rx={4} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.9} filter="url(#ix-drop)" />
        <rect x={10} y={14} width={54} height={9} rx={4} fill="#ffffff" opacity={0.12} />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={14} y1={30 + i * 3.4} x2={40} y2={30 + i * 3.4} stroke="#94a3b8" strokeOpacity={0.35} strokeWidth={1.1} />
        ))}
        <rect x={30} y={4} width={16} height={10} rx={2.4} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} />
        {live && <ellipse cx={38} cy={10} rx={5} ry={3} fill="url(#ix-glow-amber)" opacity={0.5} style={{ animation: 'ix-pulse 3s ease-in-out infinite' }} />}
        {/* filament window */}
        <circle cx={40} cy={40} r={11} fill="url(#ix-lens-bulb)" stroke="#8ea3b5" strokeWidth={0.7} />
        {live && <circle cx={40} cy={40} r={20} fill="url(#ix-glow-white)" opacity={0.55 * intensity} style={{ animation: 'ix-pulse 2.6s ease-in-out infinite' }} />}
        <path d={`M 34 40 l 4 -6 h 4 l 4 6`} fill="none" stroke={live ? '#ffd9a0' : '#9aa4ad'} strokeWidth={1.2} filter={live ? 'url(#ix-glow)' : undefined} />
        {/* collimator barrel + adjustable slit */}
        <rect x={62} y={30} width={26} height={16} rx={3} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.7} />
        <rect x={62} y={30} width={26} height={5} rx={2} fill="#ffffff" opacity={0.35} />
        <rect x={86} y={26} width={6} height={24} rx={1.6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
        <rect x={88} y={38 - slit * 1.6} width={2.4} height={slit * 3.2} rx={1} fill="#fffbe8" />
        {live && (
          <rect x={90} y={38 - slit * 1.6 - 1} width={8} height={slit * 3.2 + 2} rx={2} fill="#ffffff" opacity={0.5 * intensity} filter="url(#ix-blur)" />
        )}
        <Etch x={46} y={62} size={4.6} color="#334155" weight={800} mono>
          {`slit ${slit.toFixed(1)} mm · ${Math.round(intensity * 100)}%`}
        </Etch>
        {bn && (
          <Etch x={26} y={12} size={4.2} color="#475569">
            {'আলোর উৎস'}
          </Etch>
        )}
      </g>
    );
  }
};

const projectionScreen: ArtEntry = {
  vb: '0 0 60 100',
  Comp: ({ p, bn, live }) => {
    const pos = num(p.positionCm, 100);
    return (
      <g>
        {/* matte white screen on a stand */}
        <rect x={8} y={12} width={44} height={58} rx={2} fill="#f7f7f4" stroke="#c9c4b6" strokeWidth={0.8} filter="url(#ix-drop)" />
        <rect x={8} y={12} width={44} height={58} rx={2} fill="url(#ix-paper)" opacity={0.5} />
        {/* the screen is only lit where light lands: an inverted real image */}
        {live && (
          <g transform="translate(30 40)">
            <path d="M -12 0 L 0 -16 L 12 0" fill="none" stroke="#e2483d" strokeWidth={4} opacity={0.85} filter="url(#ix-glow)" />
            <path d="M 0 -16 L 0 0" stroke="#e2483d" strokeWidth={4} opacity={0.85} filter="url(#ix-glow)" />
          </g>
        )}
        <rect x={8} y={12} width={44} height={58} rx={2} fill="url(#ix-glass-sheen)" opacity={0.12} />
        <Rod x1={30} y1={70} x2={30} y2={86} w={4} />
        <rect x={12} y={86} width={36} height={8} rx={2} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} />
        <Etch x={30} y={98} size={4.6} color="#334155" weight={800} mono>
          {`${pos} cm`}
        </Etch>
        {bn && (
          <Etch x={30} y={8} size={4.2} color="#475569">
            {'পর্দা'}
          </Etch>
        )}
      </g>
    );
  }
};

const gratingSlide: ArtEntry = {
  vb: '0 0 72 84',
  Comp: ({ p, bn, live }) => {
    const linesPerMm = clamp(num(p.linesPerMm, 500), 100, 1200);
    const d = 1 / linesPerMm; // mm
    const theta1 = (Math.asin(clamp(632.8e-6 / d, -1, 1)) * 180) / Math.PI;
    return (
      <g>
        {/* glass slide in a 35 mm mount */}
        <rect x={6} y={26} width={60} height={34} rx={3} fill="#e9e4d8" stroke="#a89f8b" strokeWidth={0.8} filter="url(#ix-drop)" />
        <rect x={10} y={30} width={52} height={26} rx={1.6} fill="url(#ix-lens-glass)" stroke="#7fb6dd" strokeWidth={0.6} />
        {/* the ruled grating itself: a fine line texture */}
        {Array.from({ length: 26 }).map((_, i) => (
          <line key={i} x1={12 + i * 2} y1={31} x2={12 + i * 2} y2={55} stroke="#5b6875" strokeOpacity={0.55} strokeWidth={0.5} />
        ))}
        {Array.from({ length: 60 }).map((_, i) => (
          <line key={`f${i}`} x1={12 + i} y1={31} x2={12 + i} y2={55} stroke="#0b1220" strokeOpacity={0.08} strokeWidth={0.3} />
        ))}
        <rect x={10} y={30} width={52} height={26} rx={1.6} fill="url(#ix-glass-sheen)" opacity={0.4} />
        <Etch x={36} y={24} size={4.4} color="#334155" weight={800} mono>
          {`${linesPerMm} lines/mm`}
        </Etch>
        {/* first-order diffraction for the red laser line */}
        {live && (
          <g>
            <path d={`M 36 62 L ${36 - Math.tan((theta1 * Math.PI) / 180) * 20} 80`} stroke="#7c3aed" strokeWidth={1.4} opacity={0.85} />
            <path d={`M 36 62 L ${36 + Math.tan((theta1 * Math.PI) / 180) * 0.6} 80`} stroke="#dc2626" strokeWidth={1.4} opacity={0.85} />
            <path d="M 36 62 L 36 80" stroke="#f8fafc" strokeWidth={1.2} opacity={0.8} />
          </g>
        )}
        <Etch x={36} y={82} size={4.4} color="#334155" weight={700} mono>
          {`d = ${(1 / linesPerMm * 1000).toFixed(0)} nm`}
        </Etch>
        {bn && (
          <Etch x={36} y={14} size={4.4} color="#475569">
            {'ডিফ্র্যাকশন গ্রেটিং'}
          </Etch>
        )}
      </g>
    );
  }
};

const doubleSlitSlide: ArtEntry = {
  vb: '0 0 72 84',
  Comp: ({ p, bn, live }) => {
    const d = clamp(num(p.slitSeparationMm, 0.25), 0.05, 1);
    const a = clamp(num(p.slitWidthMm, 0.04), 0.01, 0.4);
    const lambda = 632.8e-6; // mm
    const beta = (lambda * 1000) / d; // mm fringe width at 1 m
    const sep = clamp(d * 40, 3, 26);
    return (
      <g>
        <rect x={6} y={26} width={60} height={34} rx={3} fill="#e9e4d8" stroke="#a89f8b" strokeWidth={0.8} filter="url(#ix-drop)" />
        {/* opaque coating with two very fine slits */}
        <rect x={10} y={30} width={52} height={26} rx={1.6} fill="#1f2937" />
        <rect x={10} y={30} width={52} height={26} rx={1.6} fill="url(#ix-glass-sheen)" opacity={0.25} />
        <rect x={34} y={30} width={Math.max(0.8, a * 8)} height={26} fill="#fffbe8" />
        <rect x={34 + sep} y={30} width={Math.max(0.8, a * 8)} height={26} fill="#fffbe8" />
        <Etch x={36} y={24} size={4.4} color="#334155" weight={800} mono>
          {`d = ${d} mm · a = ${a} mm`}
        </Etch>
        {/* the interference pattern the slits would throw on a screen 1 m away */}
        {live && (
          <g>
            {Array.from({ length: 11 }).map((_, i) => {
              const order = i - 5;
              const intensity = Math.cos((order * Math.PI * a) / d) ** 2 / (1 + Math.abs(order) * 0.35);
              return <rect key={i} x={36 + order * clamp(beta * 3, 1.2, 4)} y={62} width={1.4} height={12} rx={0.6} fill="#dc2626" opacity={clamp(intensity, 0, 1)} />;
            })}
          </g>
        )}
        <Etch x={36} y={82} size={4.4} color="#334155" weight={700} mono>
          {`β ≈ ${beta.toFixed(2)} mm @1 m`}
        </Etch>
        {bn && (
          <Etch x={36} y={14} size={4.4} color="#475569">
            {'ডবল স্লিট'}
          </Etch>
        )}
      </g>
    );
  }
};

const polarizerPair: ArtEntry = {
  vb: '0 0 84 84',
  Comp: ({ p, bn, live, setProp }) => {
    const ang = clamp(num(p.analyzerAngleDeg, 0), 0, 360);
    // Malus' law: the analyser transmits cos²θ of the polarised beam.
    const transmission = Math.cos(ang * DEG) ** 2;
    return (
      <g>
        {/* polarizer in its graduated holder */}
        <circle cx={26} cy={42} r={20} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.7} filter="url(#ix-drop)" />
        <circle cx={26} cy={42} r={15} fill="#2b3a46" opacity={0.85} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = ((i * 15) * Math.PI) / 180;
          return <line key={i} x1={26 + Math.cos(a) * 15} y1={42 + Math.sin(a) * 15} x2={26 + Math.cos(a) * 20} y2={42 + Math.sin(a) * 20} stroke="#fff8dc" strokeOpacity={0.4} strokeWidth={0.5} />;
        })}
        <line x1={14} y1={42} x2={38} y2={42} stroke="#f8fafc" strokeWidth={1.2} opacity={0.85} />
        <Etch x={26} y={68} size={4.4} color="#334155" weight={800}>
          POLARISER
        </Etch>
        {/* analyzer that really rotates with the pointer */}
        <g
          data-no-drag
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!(e.currentTarget as Element).hasPointerCapture?.(e.pointerId)) return;
            const svg = e.currentTarget.ownerSVGElement;
            const ctm = svg?.getScreenCTM();
            if (!svg || !ctm) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const art = pt.matrixTransform(ctm.inverse());
            const a = (Math.atan2(art.y - 42, art.x - 66) / DEG + 360) % 360;
            setProp?.('analyzerAngleDeg', Math.round(a));
          }}
        >
          <circle cx={66} cy={42} r={20} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.7} filter="url(#ix-drop)" />
          <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: '66px 42px' }}>
            <circle cx={66} cy={42} r={15} fill="#2b3a46" opacity={0.9} />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = ((i * 15) * Math.PI) / 180;
              return <line key={i} x1={66 + Math.cos(a) * 15} y1={42 + Math.sin(a) * 15} x2={66 + Math.cos(a) * 20} y2={42 + Math.sin(a) * 20} stroke="#fff8dc" strokeOpacity={0.45} strokeWidth={0.5} />;
            })}
            <line x1={54} y1={42} x2={78} y2={42} stroke="#f8fafc" strokeWidth={1.2} opacity={0.9} />
          </g>
          <rect x={50} y={26} width={32} height={32} fill="transparent" />
        </g>
        <Etch x={66} y={68} size={4.4} color="#334155" weight={800}>
          ANALYSER
        </Etch>
        {/* the transmitted light between the two filters follows Malus' law */}
        {live && (
          <g>
            <path d="M 4 42 H 90" stroke="#fde68a" strokeWidth={3} opacity={0.55} />
            <rect x={48} y={36} width={6} height={12} fill="#fde68a" opacity={0.7} />
            <circle cx={66} cy={42} r={10} fill="#fde68a" opacity={transmission * 0.5} />
            <path d={`M 78 42 H 90`} stroke="#fde68a" strokeWidth={3} opacity={transmission * 0.85} />
          </g>
        )}
        <Etch x={42} y={80} size={5} color="#334155" weight={800} mono>
          {`θ = ${ang.toFixed(0)}° · I/I₀ = ${transmission.toFixed(2)}`}
        </Etch>
        {bn && (
          <Etch x={42} y={12} size={4.4} color="#475569">
            {'পোলারাইজার-অ্যানালাইজার'}
          </Etch>
        )}
      </g>
    );
  }
};

export const opticsArt: Record<string, ArtEntry> = {
  'optical-bench': opticalBench,
  'lens-convex': lensEntry('convex'),
  'lens-concave': lensEntry('concave'),
  'mirror-concave': mirrorEntry('concave'),
  'mirror-convex': mirrorEntry('convex'),
  'mirror-plane': mirrorEntry('plane'),
  'glass-slab': glassSlab,
  'triangular-prism': prism,
  'laser-pointer-red': laserEntry('red'),
  'laser-pointer-green': laserEntry('green'),
  'white-light-source': whiteLightSource,
  'projection-screen': projectionScreen,
  'diffraction-grating-slide': gratingSlide,
  'double-slit-slide': doubleSlitSlide,
  'polarizer-analyzer-pair': polarizerPair
};
