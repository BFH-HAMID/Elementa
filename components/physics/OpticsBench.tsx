'use client';

import React, { useState } from 'react';
import { usePhysicsI18n } from '@/lib/i18n';
import {
  calculateLensImage,
  calculateMirrorImage,
  calculatePrismRefraction,
  calculateDoubleSlitPattern,
  calculateScreenBlur
} from '@/engine/opticsEngine';
import { Etch, LinearScale, Rod, Screw } from './Equipment/art/parts';
import { Sun, Sparkles, Layers, Maximize2, Crosshair, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEG = Math.PI / 180;
/** Cauchy dispersion of crown glass — the same fit the bench glassware artwork uses. */
const glassIndex = (nm: number) => 1.5046 + 4200 / (nm * nm);
/** The spectrum, sampled as a real prism would spread it. */
const SPECTRUM = [
  { nm: 405, hex: '#8b5cf6' },
  { nm: 435, hex: '#6366f1' },
  { nm: 470, hex: '#3b82f6' },
  { nm: 490, hex: '#0ea5e9' },
  { nm: 520, hex: '#22c55e' },
  { nm: 565, hex: '#84cc16' },
  { nm: 590, hex: '#facc15' },
  { nm: 620, hex: '#f97316' },
  { nm: 650, hex: '#ef4444' }
];

/** Rotate a screen-space vector: y grows downward, so this reads clockwise on screen. */
const rot = (x: number, y: number, deg: number) => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return { x: x * c - y * s, y: x * s + y * c };
};

/** One optical carrier clamped on the rail: saddle + pillar + ring holder. */
function Carrier({ x, railY, height = 78, w = 30 }: { x: number; railY: number; height?: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={railY} width={w} height={16} rx={3} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.7} />
      <rect x={x - w / 2} y={railY} width={w} height={5} rx={2} fill="#ffffff" opacity={0.16} />
      <Screw cx={x + w / 2 - 5} cy={railY + 11} r={2.6} />
      <Rod x1={x} y1={railY} x2={x} y2={railY - height} w={7} />
      <circle cx={x} cy={railY - height} r={7} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.8} />
      <circle cx={x} cy={railY - height} r={2.6} fill="url(#ix-brass)" />
    </g>
  );
}

/** A beam of light, with the halo a real beam shows in a dusty lab. */
function Beam({
  x1,
  y1,
  x2,
  y2,
  color = '#ef4444',
  w = 2.2,
  halo = 0.22,
  dash
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  w?: number;
  halo?: number;
  dash?: string;
}) {
  return (
    <g>
      {halo > 0 && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w + 5} opacity={halo} strokeLinecap="round" filter="url(#ix-blur)" />
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />
    </g>
  );
}

/** Bench data logger: a moulded case with a backlit LCD and its rows of readings. */
function Plate({ x, y, w = 196, title, rows }: { x: number; y: number; w?: number; title: string; rows: Array<[string, string]> }) {
  const head = 24;
  const line = 16;
  const h = head + rows.length * line + 12;
  return (
    <g>
      <rect x={x + 2} y={y + 4} width={w} height={h} rx={7} fill="#0b1220" opacity={0.32} filter="url(#ix-blur)" />
      <rect x={x} y={y} width={w} height={h} rx={7} fill="url(#ix-enamel)" stroke="#0b1220" strokeOpacity={0.65} strokeWidth={0.9} />
      <rect x={x} y={y} width={w} height={h * 0.3} rx={7} fill="#ffffff" opacity={0.12} />
      <rect x={x + 8} y={y + 6} width={w - 16} height={head - 10} rx={2} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.5} />
      <Etch x={x + 13} y={y + 18} size={9} color="#1f2937" weight={800} anchor="start" mono>
        {title}
      </Etch>
      <rect x={x + 8} y={y + head} width={w - 16} height={rows.length * line + 6} rx={3} fill="url(#ix-lcd)" stroke="#0b1220" strokeOpacity={0.5} strokeWidth={0.7} />
      <rect x={x + 8} y={y + head} width={w - 16} height={(rows.length * line + 6) * 0.42} rx={3} fill="url(#ix-reflect)" opacity={0.35} />
      {rows.map(([k, v], i) => (
        <g key={k}>
          <Etch x={x + 14} y={y + head + 13 + i * line} size={9.5} color="#1f3d21" weight={700} anchor="start" mono>
            {k}
          </Etch>
          <Etch x={x + w - 14} y={y + head + 13 + i * line} size={10} color="#12301a" weight={800} anchor="end" mono>
            {v}
          </Etch>
        </g>
      ))}
      <circle cx={x + w - 12} cy={y + 11} r={2.4} fill="#ef4444" opacity={0.85} />
      <circle cx={x + w - 12} cy={y + 11} r={4.6} fill="url(#ix-glow-red)" opacity={0.5} />
      <Screw cx={x + 7} cy={y + h - 7} r={2.2} />
      <Screw cx={x + w - 7} cy={y + h - 7} r={2.2} />
    </g>
  );
}

export type OpticsMode = 'lens' | 'mirror' | 'prism' | 'interference';

export function OpticsBench({ initialMode = 'lens' }: { initialMode?: OpticsMode } = {}) {
  const { isBangla } = usePhysicsI18n();

  const [opticsMode, setOpticsMode] = useState<OpticsMode>(initialMode);
  const [lensPosCm, setLensPosCm] = useState<number>(55);
  const [screenPosCm, setScreenPosCm] = useState<number>(85);
  const [lensObjectCm, setLensObjectCm] = useState<number>(12);
  const [mirrorPosCm, setMirrorPosCm] = useState<number>(118);
  const [mirrorObjectCm, setMirrorObjectCm] = useState<number>(78);
  const [focalLengthCm, setFocalLengthCm] = useState<number>(15);
  const [prismPosCm, setPrismPosCm] = useState<number>(46);
  const [prismAngleDeg, setPrismAngleDeg] = useState<number>(60);
  const [prismIncidenceDeg, setPrismIncidenceDeg] = useState<number>(48.6);
  const [prismMu, setPrismMu] = useState<number>(1.517);
  const [slitSeparationMm, setSlitSeparationMm] = useState<number>(0.25);
  const [laserWavelengthNm, setLaserWavelengthNm] = useState<number>(632.8);

  /* ------------------------------- rail geometry ------------------------------ */
  const pxPerCm = 5.5;
  const railStartX = 40;
  const axis = 150;
  const railTop = 246;
  const railBottom = 286;
  const toX = (cm: number) => railStartX + cm * pxPerCm;
  const objH = 40;

  /* -------------------------------- solutions -------------------------------- */
  const lensU = Math.max(0.5, lensPosCm - lensObjectCm);
  const lensImage = calculateLensImage(lensU, focalLengthCm, 2.5, lensPosCm);
  const mirrorU = Math.max(0.5, mirrorPosCm - mirrorObjectCm);
  const mirrorImage = calculateMirrorImage(mirrorU, focalLengthCm, 2.5, mirrorPosCm);
  const prismData = calculatePrismRefraction(prismIncidenceDeg, prismAngleDeg, prismMu);
  const doubleSlitData = calculateDoubleSlitPattern(laserWavelengthNm, slitSeparationMm, 1.0);
  const blurRadius = calculateScreenBlur(screenPosCm, lensImage.x, 40);

  const modeTabs = [
    { id: 'lens' as const, icon: Sun, bn: 'উত্তল ও অবতল লেন্স', en: 'Lenses (Convex / Concave)' },
    { id: 'mirror' as const, icon: Sparkles, bn: 'গোলীয় দর্পণ', en: 'Spherical Mirrors' },
    { id: 'prism' as const, icon: Layers, bn: 'প্রিজম ও বিচ্ছুরণ', en: 'Prism & Dispersion' },
    { id: 'interference' as const, icon: Maximize2, bn: 'দ্বি-চির ব্যতিচার', en: 'Young’s Double Slit' }
  ];

  const imgY = (v: number) => (Number.isFinite(v) ? Math.max(28, Math.min(282, v)) : axis);

  /* ============================ lens: convex / concave ============================ */
  const lensScene = (() => {
    const objX = toX(lensObjectCm);
    const lensX = toX(lensPosCm);
    const topY = axis - objH;
    const isConvex = focalLengthCm > 0;
    const fAbs = Math.abs(focalLengthCm) * pxPerCm;
    const focusNear = lensX - fAbs;
    const focusFar = lensX + fAbs;
    const offRail = lensImage.exists && isFinite(lensImage.x) && lensImage.x > 152;
    const realImage = lensImage.exists && lensImage.isReal && isFinite(lensImage.x) && lensImage.x <= 152;
    const virtualImage = lensImage.exists && !lensImage.isReal && isFinite(lensImage.x);
    const imgX = lensImage.exists && isFinite(lensImage.x) ? toX(Math.min(lensImage.x, 152)) : lensX;
    const imgH = lensImage.exists && isFinite(lensImage.height) ? objH * (lensImage.height / 2.5) : 0;
    const tipY = axis - imgH;
    const rayEnd = 280;
    return (
      <g>
        {/* object: an illuminated arrow in a holder */}
        <line x1={objX} y1={axis} x2={objX} y2={topY} stroke="#059669" strokeWidth={5} strokeLinecap="round" />
        <path d={`M ${objX - 9} ${topY + 13} L ${objX} ${topY} L ${objX + 9} ${topY + 13} Z`} fill="#059669" />
        <circle cx={objX} cy={topY} r={15} fill="url(#ix-glow-green)" opacity={0.5} />
        <Carrier x={objX} railY={railTop} height={axis - railTop + objH} />

        {/* the lens in its ring */}
        <Carrier x={lensX} railY={railTop} height={axis - railTop + 62} />
        {isConvex ? (
          <>
            <path
              d={`M ${lensX} ${axis - 62} Q ${lensX + 15} ${axis} ${lensX} ${axis + 62} Q ${lensX - 15} ${axis} ${lensX} ${axis - 62} Z`}
              fill="url(#ix-lens-glass)"
              stroke="#7fb6dd"
              strokeWidth={1.4}
            />
            <path d={`M ${lensX - 7} ${axis - 40} Q ${lensX - 2} ${axis - 6} ${lensX - 8} ${axis + 34}`} fill="none" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={2} />
          </>
        ) : (
          <>
            <path
              d={`M ${lensX - 11} ${axis - 62} Q ${lensX - 4} ${axis} ${lensX - 11} ${axis + 62} L ${lensX + 11} ${axis + 62} Q ${lensX + 4} ${axis} ${lensX + 11} ${axis - 62} Z`}
              fill="url(#ix-lens-glass)"
              stroke="#7fb6dd"
              strokeWidth={1.4}
            />
            <path d={`M ${lensX - 6} ${axis - 44} Q ${lensX - 1} ${axis - 8} ${lensX - 7} ${axis + 36}`} fill="none" stroke="#ffffff" strokeOpacity={0.65} strokeWidth={1.4} />
          </>
        )}
        <Etch x={lensX} y={railTop - 10} size={9.5} color="#0c4a6e" weight={800} mono>
          {`f = ${focalLengthCm > 0 ? '+' : ''}${focalLengthCm} cm`}
        </Etch>

        {/* focal points marked on the axis */}
        {[focusNear, focusFar].map((fx, i) => (
          <g key={i}>
            <circle cx={fx} cy={axis} r={3.4} fill="#c2410c" />
            <Etch x={fx} y={axis + 18} size={8.5} color="#c2410c" weight={800}>
              F
            </Etch>
          </g>
        ))}

        {/* construction rays */}
        {realImage && (
          <>
            <Beam x1={objX} y1={topY} x2={lensX} y2={topY} color="#f59e0b" w={1.7} halo={0.16} />
            <Beam x1={lensX} y1={topY} x2={imgX} y2={imgY(tipY)} color="#f59e0b" w={1.7} halo={0.16} />
            <Beam x1={objX} y1={topY} x2={lensX} y2={axis} color="#0ea5e9" w={1.7} halo={0.16} />
            <Beam x1={lensX} y1={axis} x2={imgX} y2={imgY(tipY)} color="#0ea5e9" w={1.7} halo={0.16} />
            {lensX > objX + 14 && (
              <>
                <Beam x1={objX} y1={topY} x2={focusNear} y2={axis} color="#16a34a" w={1.1} halo={0} dash="5 4" />
                <Beam
                  x1={focusNear}
                  y1={axis}
                  x2={lensX}
                  y2={axis - ((axis - topY) * (lensX - focusNear)) / Math.max(1, lensX - objX) + (objH * 2 * objH) / Math.max(1, lensX - objX) * 0}
                  color="#16a34a"
                  w={1.1}
                  halo={0}
                  dash="5 4"
                />
                <Beam
                  x1={lensX}
                  y1={axis - ((axis - topY) * (lensX - focusNear)) / Math.max(1, lensX - objX)}
                  x2={imgX}
                  y2={imgY(tipY)}
                  color="#16a34a"
                  w={1.1}
                  halo={0}
                  dash="5 4"
                />
              </>
            )}
          </>
        )}
        {virtualImage && (
          <>
            <Beam x1={objX} y1={topY} x2={lensX} y2={topY} color="#f59e0b" w={1.7} halo={0.16} />
            <Beam
              x1={lensX}
              y1={topY}
              x2={lensX + rayEnd}
              y2={topY - (rayEnd * (axis - topY)) / Math.max(16, Math.abs(focusFar - lensX))}
              color="#f59e0b"
              w={1.7}
              halo={0.16}
            />
            <Beam x1={objX} y1={topY} x2={lensX} y2={axis} color="#0ea5e9" w={1.7} halo={0.16} />
            <Beam x1={lensX} y1={axis} x2={lensX + rayEnd} y2={axis + (rayEnd * (axis - topY)) / Math.max(16, lensX - objX)} color="#0ea5e9" w={1.7} halo={0.16} />
            <Beam x1={lensX} y1={topY} x2={imgX} y2={tipY} color="#f59e0b" w={1.1} halo={0} dash="6 5" />
            <Beam x1={lensX} y1={axis} x2={imgX} y2={tipY} color="#0ea5e9" w={1.1} halo={0} dash="6 5" />
          </>
        )}
        {!realImage && !virtualImage && (
          <>
            <Beam x1={objX} y1={topY} x2={lensX + rayEnd} y2={topY} color="#f59e0b" w={1.7} halo={0.16} />
            <Beam x1={objX} y1={topY} x2={lensX} y2={axis} color="#0ea5e9" w={1.7} halo={0.16} />
            <Beam x1={lensX} y1={axis} x2={lensX + rayEnd} y2={axis + (rayEnd * (axis - topY)) / Math.max(16, lensX - objX)} color="#0ea5e9" w={1.7} halo={0.16} />
          </>
        )}

        {/* the image */}
        {realImage && (
          <g>
            <line x1={imgX} y1={axis} x2={imgX} y2={imgY(tipY)} stroke="#dc2626" strokeWidth={4.4} strokeLinecap="round" />
            <path d={`M ${imgX - 8} ${imgY(tipY) + 12} L ${imgX} ${imgY(tipY)} L ${imgX + 8} ${imgY(tipY) + 12} Z`} fill="#dc2626" />
            <Etch x={imgX} y={axis + 34} size={9.5} color="#b91c1c" weight={800}>
              {isBangla ? 'প্রতিবিম্ব (v)' : 'IMAGE (v)'}
            </Etch>
          </g>
        )}
        {virtualImage && (
          <g>
            <line x1={imgX} y1={axis} x2={imgX} y2={tipY} stroke="#7c3aed" strokeWidth={3.4} strokeDasharray="6 4" strokeLinecap="round" />
            <path d={`M ${imgX - 7} ${tipY + 11} L ${imgX} ${tipY} L ${imgX + 7} ${tipY + 11} Z`} fill="#7c3aed" opacity={0.9} />
            <Etch x={imgX} y={tipY - 12} size={9.5} color="#6d28d9" weight={800}>
              {isBangla ? 'অবাস্তব প্রতিবিম্ব' : 'VIRTUAL IMAGE'}
            </Etch>
          </g>
        )}
        {offRail && (
          <Etch x={lensX + 40} y={topY - 6} size={10} color="#b45309" weight={800} anchor="start">
            {`v = ${lensImage.x.toFixed(0)} cm — ${isBangla ? 'রেলের শেষের বাইরে' : 'beyond the end of the rail'}`}
          </Etch>
        )}

        {/* projection screen: the spot really does (de)focus on it */}
        <Carrier x={toX(screenPosCm)} railY={railTop} height={axis - railTop + 84} />
        <rect x={toX(screenPosCm) - 4} y={axis - 84} width={8} height={168} rx={2} fill="url(#ix-cream)" stroke="#8a8272" strokeWidth={1} />
        <rect x={toX(screenPosCm) - 4} y={axis - 84} width={8} height={168} fill="url(#ix-paper)" opacity={0.6} />
        <g style={{ filter: `blur(${Math.min(7, blurRadius * 1.2).toFixed(2)}px)` }} opacity={Math.max(0.22, 1 - blurRadius / 20)}>
          <line x1={toX(screenPosCm)} y1={axis} x2={toX(screenPosCm)} y2={axis - Math.min(120, Math.max(6, imgH))} stroke="#dc2626" strokeWidth={4} />
        </g>
        <Etch x={toX(screenPosCm)} y={axis - 92} size={9.5} color="#334155" weight={800} mono>
          {`${screenPosCm} cm`}
        </Etch>

        <Plate
          x={610}
          y={24}
          w={286}
          title={isBangla ? 'লেন্সের সমাধান — ১/v = ১/f − ১/u' : 'LENS SOLUTION — 1/v = 1/f − 1/u'}
          rows={[
            ['u', `${lensU.toFixed(1)} cm`],
            ['v', lensImage.exists && isFinite(lensImage.x) ? `${(lensImage.isReal ? lensImage.x - lensPosCm : -(lensPosCm - lensImage.x)).toFixed(1)} cm` : '∞'],
            ['m', lensImage.exists ? `${lensImage.magnification.toFixed(2)}×` : '∞'],
            ['f', `${focalLengthCm > 0 ? '+' : ''}${focalLengthCm} cm`],
            [
              isBangla ? 'প্রতিবিম্ব' : 'nature',
              lensImage.exists
                ? lensImage.isReal
                  ? isBangla
                    ? 'বাস্তব, উল্টো'
                    : 'real, inverted'
                  : isBangla
                  ? 'অবাস্তব, সোজা'
                  : 'virtual, erect'
                : isBangla
                ? 'অসীমে'
                : 'at infinity'
            ]
          ]}
        />
      </g>
    );
  })();

  /* ================================ spherical mirror ================================ */
  const mirrorScene = (() => {
    const objX = toX(mirrorObjectCm);
    const mirrorX = toX(mirrorPosCm);
    const topY = axis - objH;
    const concave = focalLengthCm > 0;
    const fAbs = Math.abs(focalLengthCm) * pxPerCm;
    const focusX = concave ? mirrorX - fAbs : mirrorX + fAbs;
    const centreX = mirrorX - 2 * fAbs;
    const exists = mirrorImage.exists && isFinite(mirrorImage.x);
    const offRail = exists && mirrorImage.x > 152;
    const real = exists && mirrorImage.isReal && mirrorImage.x <= 152;
    const imgX = exists ? toX(Math.min(mirrorImage.x, 152)) : mirrorX;
    const imgH = exists && isFinite(mirrorImage.height) ? objH * (mirrorImage.height / 2.5) : 0;
    const tipY = axis - imgH;
    // paraxial hit points: the parallel ray at the object height, the other at the pole
    const sagHitX = concave ? mirrorX - 17 : mirrorX + 17;
    const rayLen = concave ? 220 : 260;
    return (
      <g>
        {/* object */}
        <line x1={objX} y1={axis} x2={objX} y2={topY} stroke="#059669" strokeWidth={5} strokeLinecap="round" />
        <path d={`M ${objX - 9} ${topY + 13} L ${objX} ${topY} L ${objX + 9} ${topY + 13} Z`} fill="#059669" />
        <circle cx={objX} cy={topY} r={15} fill="url(#ix-glow-green)" opacity={0.45} />
        <Carrier x={objX} railY={railTop} height={axis - railTop + objH} />

        {/* mirror: polished face on a cast backing plate */}
        <Carrier x={mirrorX} railY={railTop} height={axis - railTop + 78} />
        {concave ? (
          <>
            <path
              d={`M ${mirrorX - 17} ${axis - 78} Q ${mirrorX + 19} ${axis} ${mirrorX - 17} ${axis + 78} L ${mirrorX - 26} ${axis + 78} Q ${mirrorX + 10} ${axis} ${mirrorX - 26} ${axis - 78} Z`}
              fill="url(#ix-charcoal)"
              stroke="#0b1220"
              strokeWidth={0.8}
            />
            <path d={`M ${mirrorX - 17} ${axis - 78} Q ${mirrorX + 19} ${axis} ${mirrorX - 17} ${axis + 78}`} fill="none" stroke="#eef4fa" strokeWidth={3.6} />
            <path d={`M ${mirrorX - 18.6} ${axis - 78} Q ${mirrorX + 17.4} ${axis} ${mirrorX - 18.6} ${axis + 78}`} fill="none" stroke="#7fb6dd" strokeWidth={0.9} opacity={0.7} />
          </>
        ) : (
          <>
            <path
              d={`M ${mirrorX + 17} ${axis - 78} Q ${mirrorX - 19} ${axis} ${mirrorX + 17} ${axis + 78} L ${mirrorX + 26} ${axis + 78} Q ${mirrorX - 10} ${axis} ${mirrorX + 26} ${axis - 78} Z`}
              fill="url(#ix-charcoal)"
              stroke="#0b1220"
              strokeWidth={0.8}
            />
            <path d={`M ${mirrorX + 17} ${axis - 78} Q ${mirrorX - 19} ${axis} ${mirrorX + 17} ${axis + 78}`} fill="none" stroke="#eef4fa" strokeWidth={3.6} />
          </>
        )}
        <Etch x={mirrorX - 30} y={axis - 86} size={9.5} color="#0c4a6e" weight={800} anchor="end" mono>
          {`${concave ? (isBangla ? 'অবতল' : 'concave') : isBangla ? 'উত্তল' : 'convex'} · f = ${Math.abs(focalLengthCm)} cm`}
        </Etch>

        {/* P, F and C on the axis */}
        <circle cx={mirrorX} cy={axis} r={3.2} fill="#c2410c" />
        <Etch x={mirrorX + 9} y={axis + 19} size={8.5} color="#c2410c" weight={800} anchor="start">
          P
        </Etch>
        <circle cx={focusX} cy={axis} r={3} fill="#0369a1" />
        <Etch x={focusX} y={axis + 19} size={8.5} color="#0369a1" weight={800}>
          F
        </Etch>
        {concave && (
          <>
            <circle cx={centreX} cy={axis} r={3} fill="#7c3aed" />
            <Etch x={centreX} y={axis + 19} size={8.5} color="#7c3aed" weight={800}>
              C
            </Etch>
          </>
        )}

        {/* the two construction rays, reflected at the mirror */}
        {exists && (
          <>
            <Beam x1={objX} y1={topY} x2={sagHitX} y2={topY} color="#f59e0b" w={1.7} halo={0.16} />
            <Beam
              x1={sagHitX}
              y1={topY}
              x2={real ? imgX : sagHitX - rayLen}
              y2={real ? imgY(tipY) : topY - ((sagHitX - rayLen < sagHitX ? sagHitX - (sagHitX - rayLen) : rayLen) * (axis - topY)) / Math.max(18, Math.abs(sagHitX - focusX))}
              color="#f59e0b"
              w={1.7}
              halo={0.16}
            />
            <Beam x1={objX} y1={topY} x2={sagHitX} y2={axis} color="#0ea5e9" w={1.7} halo={0.16} />
            <Beam
              x1={sagHitX}
              y1={axis}
              x2={real ? imgX : sagHitX - rayLen}
              y2={real ? imgY(tipY) : axis - (rayLen * (axis - topY)) / Math.max(18, sagHitX - objX)}
              color="#0ea5e9"
              w={1.7}
              halo={0.16}
            />
            {!real && (
              <>
                <Beam x1={sagHitX} y1={topY} x2={imgX} y2={tipY} color="#f59e0b" w={1.1} halo={0} dash="6 5" />
                <Beam x1={sagHitX} y1={axis} x2={imgX} y2={tipY} color="#0ea5e9" w={1.1} halo={0} dash="6 5" />
              </>
            )}
          </>
        )}

        {/* the image */}
        {exists && (
          <g>
            <line
              x1={imgX}
              y1={axis}
              x2={imgX}
              y2={imgY(tipY)}
              stroke={real ? '#dc2626' : '#7c3aed'}
              strokeWidth={real ? 4 : 3.4}
              strokeDasharray={real ? undefined : '6 4'}
              strokeLinecap="round"
            />
            <path d={`M ${imgX - 8} ${imgY(tipY) + 12} L ${imgX} ${imgY(tipY)} L ${imgX + 8} ${imgY(tipY) + 12} Z`} fill={real ? '#dc2626' : '#7c3aed'} />
            <Etch x={imgX} y={real ? axis + 34 : Math.max(34, imgY(tipY) - 12)} size={9.5} color={real ? '#b91c1c' : '#6d28d9'} weight={800}>
              {real ? (isBangla ? 'বাস্তব প্রতিবিম্ব' : 'REAL IMAGE') : isBangla ? 'অবাস্তব প্রতিবিম্ব' : 'VIRTUAL IMAGE'}
            </Etch>
          </g>
        )}
        {offRail && (
          <Etch x={mirrorX - 20} y={axis + 44} size={10} color="#b45309" weight={800} anchor="end">
            {`v = ${mirrorImage.x.toFixed(0)} cm — ${isBangla ? 'রেলের শেষের বাইরে' : 'beyond the end of the rail'}`}
          </Etch>
        )}

        <Plate
          x={20}
          y={24}
          w={272}
          title={isBangla ? 'দর্পণের সমাধান — ১/v + ১/u = ১/f' : 'MIRROR SOLUTION — 1/v + 1/u = 1/f'}
          rows={[
            ['u', `${mirrorU.toFixed(1)} cm`],
            ['v', exists ? `${(mirrorImage.isReal ? mirrorImage.x - mirrorPosCm : mirrorPosCm - mirrorImage.x).toFixed(1)} cm` : '∞'],
            ['m', exists ? `${mirrorImage.magnification.toFixed(2)}×` : '∞'],
            ['f', `${focalLengthCm > 0 ? '+' : ''}${focalLengthCm} cm (R = ${Math.abs(focalLengthCm * 2)} cm)`],
            [isBangla ? 'প্রকৃতি' : 'nature', concave ? (isBangla ? 'অবতল, অভিসারী' : 'concave, converging') : isBangla ? 'উত্তল, অপসারী' : 'convex, diverging']
          ]}
        />
      </g>
    );
  })();

  /* ================================= prism & dispersion ================================= */
  const prismScene = (() => {
    const pX = toX(prismPosCm);
    const apex = { x: pX, y: 78 };
    const A = prismAngleDeg * DEG;
    const side = 156;
    const half = Math.sin(A / 2) * side;
    const drop = Math.cos(A / 2) * side;
    const bl = { x: apex.x - half, y: apex.y + drop };
    const br = { x: apex.x + half, y: apex.y + drop };
    // entry point on the left face, 55% of the way down from the apex
    const entry = { x: apex.x + (bl.x - apex.x) * 0.55, y: apex.y + (bl.y - apex.y) * 0.55 };
    const nOutL = { x: -Math.cos(A / 2), y: -Math.sin(A / 2) }; // outward normal of the left face
    const nInL = { x: -nOutL.x, y: -nOutL.y };
    const nOutR = rot(nInL.x, nInL.y, -prismAngleDeg); // outward normal of the right face
    const i = prismIncidenceDeg;

    // incident ray: the inward normal turned back by the angle of incidence
    const dIn = rot(nInL.x, nInL.y, -i);
    const inStart = { x: entry.x - dIn.x * 210, y: entry.y - dIn.y * 210 };

    // per-wavelength refraction through the prism (real Snell, three surfaces facts)
    const fan = SPECTRUM.map((s) => {
      const n = (glassIndex(s.nm) / 1.517) * prismMu;
      const r1 = Math.asin(Math.min(0.999, Math.sin(i * DEG) / n));
      const r2 = A - r1;
      const sinE = n * Math.sin(r2);
      if (Math.abs(sinE) >= 1) return { ...s, out: null, delta: NaN };
      const e = Math.asin(sinE);
      const dir = rot(nOutR.x, nOutR.y, e * (180 / Math.PI));
      return { ...s, out: dir, delta: i + e * (180 / Math.PI) - prismAngleDeg };
    });

    // inside the glass the beam is the mean refraction direction
    const nD = (glassIndex(589) / 1.517) * prismMu;
    const r1D = Math.asin(Math.min(0.999, Math.sin(i * DEG) / nD));
    const dInside = rot(nInL.x, nInL.y, -(r1D * 180) / Math.PI);
    // walk along the inside ray until it meets the right face
    const faceDir = { x: (br.x - apex.x) / side, y: (br.y - apex.y) / side };
    const tHit = (() => {
      const dx = faceDir.x;
      const dy = faceDir.y;
      const denom = dInside.x * dy - dInside.y * dx;
      if (Math.abs(denom) < 1e-6) return 0.6;
      const qx = apex.x - entry.x;
      const qy = apex.y - entry.y;
      return (qx * dy - qy * dx) / denom / side;
    })();
    const exitPt = { x: entry.x + dInside.x * tHit * side, y: entry.y + dInside.y * tHit * side };
    const meanDelta = fan.reduce((a, s) => a + (Number.isFinite(s.delta) ? s.delta : 0), 0) / fan.length;

    // the whole fan, and where it lands
    const fanLen = 300;
    const hits = fan
      .filter((s) => s.out)
      .map((s) => ({ ...s, end: { x: exitPt.x + (s.out as { x: number }).x * fanLen, y: exitPt.y + s.out!.y * fanLen } }));
    const landX = hits.length ? Math.min(...hits.map((h) => h.end.x)) : exitPt.x + 200;

    // magnified inset of the same fan, so the 1.5° spread is actually readable
    const ins = { x: 622, y: 30, w: 268, h: 116 };
    const magOrigin = { x: ins.x + 26, y: ins.y + 62 };
    const magLen = 176;
    return (
      <g>
        <Carrier x={pX} railY={railTop} height={axis - railTop + 96} />

        {/* the prism, apex up, resting on its base */}
        <path d={`M ${apex.x} ${apex.y} L ${bl.x} ${bl.y} L ${br.x} ${br.y} Z`} fill="url(#ix-lens-glass)" stroke="#7fb6dd" strokeWidth={1.6} filter="url(#ix-drop)" />
        <path d={`M ${apex.x} ${apex.y} L ${bl.x} ${bl.y} L ${br.x} ${br.y} Z`} fill="url(#ix-glass-sheen)" opacity={0.3} />
        <path d={`M ${apex.x - 5} ${apex.y + 16} L ${bl.x + 26} ${bl.y - 18}`} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} />
        <path d={`M ${apex.x + 7} ${apex.y + 18} L ${br.x - 28} ${br.y - 20}`} stroke="#ffffff" strokeOpacity={0.32} strokeWidth={1.4} />
        <Etch x={pX} y={br.y + 20} size={9.5} color="#0c4a6e" weight={800} mono>
          {`A = ${prismAngleDeg}° · μ_D = ${prismMu}`}
        </Etch>

        {/* incident beam, the refracted path inside, and the dispersed fan */}
        <Beam x1={inStart.x} y1={inStart.y} x2={entry.x} y2={entry.y} color="#e2e8f0" w={3.4} halo={0.5} />
        <Beam x1={inStart.x} y1={inStart.y} x2={entry.x} y2={entry.y} color="#ffffff" w={1.3} halo={0} />
        <Beam x1={entry.x} y1={entry.y} x2={exitPt.x} y2={exitPt.y} color="#e2e8f0" w={3} halo={0.22} />
        {hits.map((h) => (
          <line key={h.nm} x1={exitPt.x} y1={exitPt.y} x2={h.end.x} y2={h.end.y} stroke={h.hex} strokeWidth={2.6} strokeLinecap="round" opacity={0.95} />
        ))}
        {/* undeviated reference direction */}
        <line
          x1={inStart.x + (entry.x - inStart.x) * 0.35}
          y1={inStart.y + (entry.y - inStart.y) * 0.35}
          x2={entry.x + (exitPt.x - entry.x) + dIn.x * 330}
          y2={entry.y + (exitPt.y - entry.y) + dIn.y * 330}
          stroke="#0f172a"
          strokeWidth={1}
          strokeDasharray="7 5"
          opacity={0.4}
        />
        {/* the normal at the entry face, and the angle of incidence */}
        <line x1={entry.x} y1={entry.y} x2={entry.x + nOutL.x * 54} y2={entry.y + nOutL.y * 54} stroke="#94a3b8" strokeWidth={0.9} strokeDasharray="5 4" />
        <line x1={entry.x} y1={entry.y} x2={entry.x - nOutL.x * 46} y2={entry.y - nOutL.y * 46} stroke="#94a3b8" strokeWidth={0.9} strokeDasharray="5 4" opacity={0.55} />
        <Etch x={entry.x + nOutL.x * 62} y={entry.y + nOutL.y * 62 + 4} size={9.5} color="#475569" weight={800} anchor="end">
          N
        </Etch>
        <Etch x={entry.x - 22} y={entry.y + 24} size={10.5} color="#b45309" weight={800} anchor="end" mono>
          {`i = ${i.toFixed(1)}°`}
        </Etch>

        {/* white card on the bench catches the spectrum, as in the classic demonstration */}
        <Carrier x={landX} railY={railTop} height={axis - railTop + 84} />
        <rect x={landX - 12} y={axis - 84} width={13} height={168} rx={2} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={1} />
        <rect x={landX - 12} y={axis - 84} width={13} height={168} fill="url(#ix-paper)" opacity={0.35} />
        {hits.map((h) => {
          const yAt = exitPt.y + ((h.end.y - exitPt.y) / (h.end.x - exitPt.x || 1)) * (landX - exitPt.x);
          return Math.abs(yAt - axis) < 84 ? <rect key={h.nm} x={landX - 12} y={yAt - 1.6} width={13} height={3.2} fill={h.hex} opacity={0.9} /> : null;
        })}
        <Etch x={landX} y={axis - 92} size={9} color="#334155" weight={800}>
          {isBangla ? 'পর্দা' : 'screen'}
        </Etch>

        {/* magnified dispersion inset — real labs read this with a travelling telescope */}
        <g>
          <rect x={ins.x} y={ins.y} width={ins.w} height={ins.h} rx={10} fill="#101923" opacity={0.94} />
          <rect x={ins.x} y={ins.y} width={ins.w} height={ins.h} rx={10} fill="none" stroke="#334155" strokeWidth={0.8} />
          <Etch x={ins.x + 13} y={ins.y + 19} size={10} color="#7dd3fc" weight={800} anchor="start">
            {isBangla ? 'বিচ্ছুরণ — বিবর্ধিত ×১২' : 'DISPERSION — MAGNIFIED ×12'}
          </Etch>
          <line x1={ins.x + 10} y1={ins.y + 25} x2={ins.x + ins.w - 10} y2={ins.y + 25} stroke="#7dd3fc" strokeOpacity={0.25} strokeWidth={0.7} />
          {fan.map((s) =>
            s.out ? (
              <g key={s.nm}>
                <line
                  x1={magOrigin.x}
                  y1={magOrigin.y}
                  x2={magOrigin.x + magLen}
                  y2={magOrigin.y + Math.tan(((s.delta - meanDelta) * 12 * Math.PI) / 180) * magLen}
                  stroke={s.hex}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
                <Etch
                  x={magOrigin.x + magLen + 6}
                  y={magOrigin.y + Math.tan(((s.delta - meanDelta) * 12 * Math.PI) / 180) * magLen + 3.4}
                  size={8.5}
                  color={s.hex}
                  weight={800}
                  anchor="start"
                  mono
                >
                  {`${s.nm}`}
                </Etch>
              </g>
            ) : null
          )}
          <Etch x={magOrigin.x - 12} y={magOrigin.y + 3.5} size={8.5} color="#cbd5e1" weight={800} anchor="end" mono>
            {isBangla ? 'আলো' : 'in'}
          </Etch>
        </g>

        <Plate
          x={20}
          y={24}
          w={228}
          title={isBangla ? 'প্রিজমের সমাধান' : 'PRISM SOLUTION'}
          rows={[
            ['i', `${i.toFixed(1)}°`],
            ['A', `${prismAngleDeg}°`],
            ['e', `${prismData.angleEmergenceDeg.toFixed(2)}°`],
            ['δ', `${prismData.deviationAngleDeg.toFixed(2)}°`],
            ['δmin', `${prismData.minimumDeviationDeg.toFixed(2)}°`],
            ['Δδ', `${prismData.dispersionSpreadDeg.toFixed(2)}°`]
          ]}
        />
      </g>
    );
  })();

  /* ================================= Young's double slit ================================= */
  const interferenceScene = (() => {
    const laserX = toX(9);
    const slitX = toX(52);
    const screenX = toX(128);
    const tubeLen = 74;
    const gap = 8;
    const pxPerMm = 9; // magnified screen view: 0.5 mm of the pattern per profile sample
    const profile = doubleSlitData.intensityProfile || [];
    const halfSpan = 96;
    const orders = Math.max(0, Math.floor(10 / Math.max(0.05, doubleSlitData.fringeWidthMm)));
    return (
      <g>
        {/* helium–neon laser on its rider */}
        <Carrier x={laserX} railY={railTop} height={axis - railTop + 18} />
        <rect x={laserX - tubeLen / 2 - 6} y={axis - 15} width={tubeLen + 16} height={30} rx={6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.9} />
        <rect x={laserX - tubeLen / 2 - 6} y={axis - 15} width={tubeLen + 16} height={9} rx={4} fill="#ffffff" opacity={0.16} />
        <rect x={laserX + tubeLen / 2 - 12} y={axis - 9} width={16} height={18} rx={2} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.6} />
        <rect x={laserX - tubeLen / 2 + 2} y={axis - 4} width={26} height={8} rx={2} fill={`hsl(${Math.round(310 + (laserWavelengthNm - 400) / 4)}, 90%, 42%)`} />
        <circle cx={laserX + tubeLen / 2 - 4} cy={axis} r={4.6} fill={`hsl(${Math.round(310 + (laserWavelengthNm - 400) / 4)}, 92%, 52%)`} opacity={0.9} />
        <Etch x={laserX} y={axis + 30} size={9} color="#334155" weight={800} mono>
          {`He–Ne ${laserWavelengthNm} nm`}
        </Etch>

        {/* the beam, and the slide with its two slits */}
        <Beam x1={laserX + tubeLen / 2 + 2} y1={axis} x2={slitX} y2={axis} color="#ff4d5e" w={2.2} halo={0.35} />
        <Carrier x={slitX} railY={railTop} height={axis - railTop + 84} />
        <rect x={slitX - 6} y={axis - 84} width={12} height={168} rx={2} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.8} />
        {[-1, 1].map((s) => (
          <rect key={s} x={slitX - 6} y={axis + s * (gap / 2) - 1.4} width={12} height={2.8} fill="#fff8e1" />
        ))}
        <Etch x={slitX} y={axis - 92} size={9.5} color="#334155" weight={800} mono>
          {`d = ${slitSeparationMm} mm`}
        </Etch>

        {/* the two diffracted cones overlapping on the screen */}
        {[-1, 1].map((s) => (
          <path
            key={s}
            d={`M ${slitX} ${axis + s * (gap / 2)} L ${screenX} ${axis - halfSpan} L ${screenX} ${axis + halfSpan} Z`}
            fill="#ff4d5e"
            opacity={0.08}
          />
        ))}

        {/* the screen: the real fringe pattern from the solved intensity profile */}
        <Carrier x={screenX} railY={railTop} height={axis - railTop + 96} />
        <rect x={screenX - 9} y={axis - halfSpan} width={18} height={halfSpan * 2} rx={2} fill="url(#ix-screen-off)" stroke="#0b1220" strokeWidth={0.9} />
        {profile.map((p) => (
          <rect
            key={p.positionMm}
            x={screenX - 9}
            y={axis + p.positionMm * pxPerMm - 1.5}
            width={18}
            height={3}
            fill="#ff2d2d"
            opacity={Math.max(0, p.intensity / 100)}
          />
        ))}
        <Etch x={screenX} y={axis - halfSpan - 10} size={9.5} color="#334155" weight={800}>
          {isBangla ? 'পর্দা (বিবর্ধিত)' : 'SCREEN (magnified)'}
        </Etch>

        {/* a photodiode-style trace of the same profile, as a real bench records it */}
        <g>
          <rect x={screenX + 16} y={axis - halfSpan - 6} width={64} height={halfSpan * 2 + 12} rx={6} fill="#101923" opacity={0.9} />
          <line x1={screenX + 20} y1={axis + halfSpan} x2={screenX + 74} y2={axis + halfSpan} stroke="#475569" strokeWidth={0.8} />
          <line x1={screenX + 20} y1={axis - halfSpan} x2={screenX + 74} y2={axis - halfSpan} stroke="#475569" strokeWidth={0.8} />
          <path
            d={`M ${profile
              .map((p) => `${(screenX + 20 + (p.intensity / 100) * 52).toFixed(1)} ${(axis + p.positionMm * pxPerMm).toFixed(1)}`)
              .join(' L ')}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1.4}
          />
          <Etch x={screenX + 47} y={axis - halfSpan + 4} size={8} color="#7dd3fc" weight={800}>
            {isBangla ? 'তীব্রতা' : 'I(y)'}
          </Etch>
        </g>

        {/* a millimetre scale, as used to read β off the screen */}
        <g>
          <rect x={screenX - 40} y={axis - 50} width={22} height={100} rx={2} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.7} />
          <LinearScale x={screenX - 38} y={axis - 50} w={18} h={100} from={-5} to={5} major={1} minor={0.5} vertical unit="mm" size={6} tick={11} />
        </g>

        <Plate
          x={16}
          y={8}
          w={228}
          title={isBangla ? 'ব্যতিচারের ফলাফল' : 'DOUBLE SLIT RESULTS'}
          rows={[
            ['β = λD/d', `${doubleSlitData.fringeWidthMm} mm`],
            ['θ₁', `${doubleSlitData.angularSeparationDeg.toFixed(3)}°`],
            ['λ', `${laserWavelengthNm} nm · d ${slitSeparationMm} mm`],
            ['D', '1.00 m'],
            [isBangla ? 'দৃশ্য ক্রম' : 'orders', `${orders}`]
          ]}
        />
      </g>
    );
  })();

  /* ----------------------------------- controls ----------------------------------- */
  const sliders: Record<OpticsMode, React.ReactNode> = {
    lens: (
      <>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'বস্তুর অবস্থান' : 'Object position'}</span>
            <span className="font-mono font-black text-physics-600">{lensObjectCm} cm</span>
          </span>
          <input type="range" min={1} max={Math.max(6, lensPosCm - 6)} value={Math.min(lensObjectCm, lensPosCm - 6)} onChange={(e) => setLensObjectCm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
          <span className="block font-mono text-[11px] font-bold text-[var(--muted)]">{`u = ${Math.max(0.5, lensPosCm - lensObjectCm).toFixed(1)} cm`}</span>
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'লেন্সের অবস্থান' : 'Lens position'}</span>
            <span className="font-mono font-black text-physics-600">{lensPosCm} cm</span>
          </span>
          <input type="range" min="30" max="92" value={lensPosCm} onChange={(e) => setLensPosCm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'ফোকাস দূরত্ব f' : 'Focal length f'}</span>
            <span className="font-mono font-black text-physics-600">
              {focalLengthCm > 0 ? '+' : ''}
              {focalLengthCm} cm
            </span>
          </span>
          <input
            type="range"
            min="-40"
            max="40"
            step="1"
            value={focalLengthCm}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setFocalLengthCm(Math.abs(v) < 4 ? (v < 0 ? -4 : 4) : v);
            }}
            className="w-full accent-physics-600"
          />
          <span className="block text-[11px] font-bold text-[var(--muted)]">
            {focalLengthCm > 0 ? (isBangla ? 'ধনাত্মক → উত্তল, অভিসারী' : 'positive → convex, converging') : isBangla ? 'ঋণাত্মক → অবতল, অপসারী' : 'negative → concave, diverging'}
          </span>
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'পর্দার অবস্থান' : 'Screen position'}</span>
            <span className="font-mono font-black text-physics-600">{screenPosCm} cm</span>
          </span>
          <input type="range" min={10} max={148} value={screenPosCm} onChange={(e) => setScreenPosCm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
        </label>
      </>
    ),
    mirror: (
      <>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'বস্তুর অবস্থান' : 'Object position'}</span>
            <span className="font-mono font-black text-physics-600">{mirrorObjectCm} cm</span>
          </span>
          <input type="range" min={10} max={Math.max(20, mirrorPosCm - 8)} value={Math.min(mirrorObjectCm, mirrorPosCm - 8)} onChange={(e) => setMirrorObjectCm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
          <span className="block font-mono text-[11px] font-bold text-[var(--muted)]">{`u = ${Math.max(0.5, mirrorPosCm - mirrorObjectCm).toFixed(1)} cm`}</span>
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'দর্পণের অবস্থান' : 'Mirror position'}</span>
            <span className="font-mono font-black text-physics-600">{mirrorPosCm} cm</span>
          </span>
          <input type="range" min="70" max="140" value={mirrorPosCm} onChange={(e) => setMirrorPosCm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'ফোকাস দূরত্ব f' : 'Focal length f'}</span>
            <span className="font-mono font-black text-physics-600">
              {focalLengthCm > 0 ? '+' : ''}
              {focalLengthCm} cm
            </span>
          </span>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={focalLengthCm}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setFocalLengthCm(Math.abs(v) < 5 ? (v < 0 ? -5 : 5) : v);
            }}
            className="w-full accent-physics-600"
          />
          <span className="block text-[11px] font-bold text-[var(--muted)]">
            {isBangla ? `R = 2f = ${Math.abs(focalLengthCm * 2)} cm` : `radius of curvature R = 2f = ${Math.abs(focalLengthCm * 2)} cm`}
          </span>
        </label>
        <div className="card flex flex-col justify-center gap-1 p-4">
          <span className="text-xs font-bold text-[var(--muted)]">{isBangla ? 'দর্পণের ধরণ:' : 'Mirror type:'}</span>
          <span className="font-mono text-base font-black text-physics-600">
            {focalLengthCm > 0 ? (isBangla ? 'অবতল (অভিসারী)' : 'concave (converging)') : isBangla ? 'উত্তল (অপসারী)' : 'convex (diverging)'}
          </span>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            {mirrorImage.exists
              ? mirrorImage.isReal
                ? isBangla
                  ? 'প্রতিবিম্ব পর্দায় ধরা যায়'
                  : 'the image can be caught on a screen'
                : isBangla
                ? 'পর্দায় ধরা যায় না'
                : 'cannot be caught on a screen'
              : isBangla
              ? 'প্রতিবিম্ব অসীমে'
              : 'image at infinity'}
          </span>
        </div>
      </>
    ),
    prism: (
      <>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'আপতন কোণ i' : 'Angle of incidence i'}</span>
            <span className="font-mono font-black text-physics-600">{prismIncidenceDeg}°</span>
          </span>
          <input type="range" min="28" max="72" step="0.5" value={prismIncidenceDeg} onChange={(e) => setPrismIncidenceDeg(parseFloat(e.target.value))} className="w-full accent-physics-600" />
          <button
            type="button"
            onClick={() => {
              // at minimum deviation the light passes symmetrically: i = (A + δmin)/2
              setPrismIncidenceDeg(Number(((prismAngleDeg + prismData.minimumDeviationDeg) / 2).toFixed(1)));
            }}
            className="rounded-lg border border-[var(--line)] px-2 py-1 text-[11px] font-bold text-physics-600"
          >
            {isBangla ? 'ন্যূনতম বিচ্যুতিতে সেট করুন' : 'Set to minimum deviation'}
          </button>
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'প্রিজম কোণ A' : 'Prism angle A'}</span>
            <span className="font-mono font-black text-physics-600">{prismAngleDeg}°</span>
          </span>
          <input type="range" min="30" max="75" value={prismAngleDeg} onChange={(e) => setPrismAngleDeg(parseFloat(e.target.value))} className="w-full accent-physics-600" />
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'প্রতিসরাঙ্ক μ' : 'Refractive index μ'}</span>
            <span className="font-mono font-black text-physics-600">{prismMu.toFixed(3)}</span>
          </span>
          <input type="range" min="1.4" max="1.8" step="0.005" value={prismMu} onChange={(e) => setPrismMu(parseFloat(e.target.value))} className="w-full accent-physics-600" />
          <span className="block text-[11px] font-bold text-[var(--muted)]">
            {prismMu < 1.5
              ? isBangla
                ? 'ফ্লিন্ট কাচের চেয়ে হালকা'
                : 'lighter than flint glass'
              : isBangla
              ? 'ফ্লিন্ট কাচের কাছাকাছি'
              : 'close to flint glass'}
          </span>
        </label>
        <div className="card space-y-1 p-4">
          <span className="text-xs font-bold text-[var(--muted)]">{isBangla ? 'ন্যূনতম বিচ্যুতি δm:' : 'Minimum deviation δm:'}</span>
          <span className="font-mono text-lg font-black text-physics-600">{prismData.minimumDeviationDeg.toFixed(2)}°</span>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            {isBangla ? `μ = sin((A+δm)/2) / sin(A/2) → ${prismMu.toFixed(3)}` : `μ = sin((A+δm)/2)/sin(A/2) → ${prismMu.toFixed(3)}`}
          </span>
        </div>
      </>
    ),
    interference: (
      <>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'চির ব্যবধান d' : 'Slit separation d'}</span>
            <span className="font-mono font-black text-physics-600">{slitSeparationMm} mm</span>
          </span>
          <input type="range" min="0.05" max="1" step="0.01" value={slitSeparationMm} onChange={(e) => setSlitSeparationMm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
        </label>
        <label className="card space-y-2 p-4">
          <span className="flex justify-between text-xs font-bold">
            <span>{isBangla ? 'তরঙ্গদৈর্ঘ্য λ' : 'Wavelength λ'}</span>
            <span className="font-mono font-black text-physics-600">{laserWavelengthNm} nm</span>
          </span>
          <input type="range" min="400" max="700" step="5" value={laserWavelengthNm} onChange={(e) => setLaserWavelengthNm(parseFloat(e.target.value))} className="w-full accent-physics-600" />
          <span className="block text-[11px] font-bold text-[var(--muted)]">
            {laserWavelengthNm < 500
              ? isBangla
                ? 'নীল-সবুজ লেজার'
                : 'blue-green laser'
              : laserWavelengthNm < 560
              ? isBangla
                ? 'সবুজ লেজার'
                : 'green laser'
              : laserWavelengthNm < 600
              ? isBangla
                ? 'হলুদ-কমলা'
                : 'yellow laser'
              : isBangla
              ? 'লাল লেজার'
              : 'red laser'}
          </span>
        </label>
        <div className="card space-y-1 p-4">
          <span className="text-xs font-bold text-[var(--muted)]">{isBangla ? 'পট্টি প্রস্থ β = λD/d:' : 'Fringe width β = λD/d:'}</span>
          <span className="font-mono text-lg font-black text-physics-600">{doubleSlitData.fringeWidthMm} mm</span>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            {isBangla ? 'পর্দা D = 1.00 m দূরে' : 'with the screen D = 1.00 m away'}
          </span>
        </div>
      </>
    )
  };

  return (
    <div className="space-y-4">
      {/* mode ribbon */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-card">
        {modeTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpticsMode(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              opticsMode === t.id ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <t.icon size={15} />
            {isBangla ? t.bn : t.en}
          </button>
        ))}
        {opticsMode === 'lens' && (
          <button
            type="button"
            onClick={() => lensImage.exists && isFinite(lensImage.x) && setScreenPosCm(Math.min(148, Math.max(2, Math.round(lensImage.x))))}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-physics-600"
          >
            <Crosshair size={13} />
            {isBangla ? 'পর্দা ফোকাসে আনুন' : 'Focus the screen'}
          </button>
        )}
        {opticsMode === 'lens' && (
          <button
            type="button"
            onClick={() => {
              // the "distant object" setting every textbook draws
              setLensObjectCm(1);
              setLensPosCm(60);
              setFocalLengthCm(15);
              setScreenPosCm(75);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-physics-600"
          >
            <InfinityIcon size={13} />
            {isBangla ? 'বস্তু অসীমে (u → ∞)' : 'Object at infinity'}
          </button>
        )}
      </div>

      {/* the bench */}
      <div className="overflow-hidden rounded-3xl border border-[var(--line)] shadow-card">
        <div className="bench-mat relative overflow-x-auto p-4">
          <svg viewBox="0 0 920 320" className="w-full min-w-[820px] select-none">
            {/* rail: anodised body, dovetail, end stops and a printed centimetre scale */}
            <rect x={12} y={railTop + 4} width={896} height={railBottom - railTop} rx={5} fill="#0b1220" opacity={0.2} filter="url(#ix-blur)" />
            <rect x={16} y={railTop} width={888} height={railBottom - railTop} rx={3} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={1} />
            <rect x={16} y={railTop} width={888} height={7} rx={3} fill="#ffffff" opacity={0.12} />
            <rect x={16} y={railTop + 7} width={888} height={4} fill="#94a3b8" opacity={0.25} />
            <rect x={24} y={railTop - 5} width={872} height={6} rx={2} fill="url(#ix-steel-h)" stroke="#64748b" strokeWidth={0.5} />
            {[22, 898].map((x) => (
              <rect key={x} x={x - 5} y={railTop - 8} width={10} height={railBottom - railTop + 16} rx={2} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.6} />
            ))}
            <LinearScale x={30} y={railTop + 14} w={860} h={18} from={0} to={150} major={10} minor={1} unit="cm" size={9} tick={18} />
            {(opticsMode === 'lens' || opticsMode === 'mirror') && (
              <Etch x={460} y={axis - 8} size={8.5} color="#64748b" weight={700} mono>
                {isBangla ? 'প্রধান অক্ষ' : 'PRINCIPAL AXIS'}
              </Etch>
            )}

            {opticsMode === 'lens' && lensScene}
            {opticsMode === 'mirror' && mirrorScene}
            {opticsMode === 'prism' && prismScene}
            {opticsMode === 'interference' && interferenceScene}
          </svg>
        </div>

        {/* focus read-out for the lens mode */}
        {opticsMode === 'lens' && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs font-bold">
            <span className="text-[var(--muted)]">
              {isBangla ? 'পর্দায় প্রতিবিম্বের স্পষ্টতা:' : 'Sharpness of the image on the screen:'}
            </span>
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 font-mono text-xs font-black',
                blurRadius < 2 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}
            >
              {blurRadius < 2 ? (isBangla ? '✓ তীক্ষ্ণ — ফোকাসে' : '✓ sharp — in focus') : `blur ${blurRadius.toFixed(1)} mm`}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{sliders[opticsMode]}</div>
    </div>
  );
}
