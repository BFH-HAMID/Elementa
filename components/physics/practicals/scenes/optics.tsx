'use client';

import React, { useId, useRef } from 'react';
import { C, Digital, Grip, Ruler, SceneFrame, Txt, fmt, num, useSvgDrag, type SceneProps } from '../primitives';
import { Rod } from '../../Equipment/art/parts';

const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* Optical bench: convex lens / concave mirror                          */
/* ------------------------------------------------------------------ */

function Arrow({ x, base, h, color }: { x: number; base: number; h: number; color: string }) {
  const tip = base - h;
  const dir = h >= 0 ? 1 : -1;
  return (
    <g>
      <line x1={x} y1={base} x2={x} y2={tip} stroke={color} strokeWidth={3} />
      <path d={`M ${x - 7} ${tip + 9 * dir} L ${x} ${tip} L ${x + 7} ${tip + 9 * dir} Z`} fill={color} />
    </g>
  );
}

export function OpticalBenchScene({ model, view, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const blurId = useId().replace(/:/g, '');
  const isLens = model.variant === 'lens';
  const u = num(view, 'u');
  const v = num(view, 'v');
  const vTrue = num(view, 'vTrue');
  const blur = num(view, 'blur');
  const f = num(view, 'f');
  const mag = num(view, 'mag');
  const sharp = num(view, 'sharp') === 1;
  const axis = 170;
  const objH = 40;
  const sc = isLens ? 3.5 : 4;
  const opticX = isLens ? 250 : 592;
  const objX = isLens ? opticX - u * sc : opticX - u * sc;
  const scrX = isLens ? opticX + v * sc : opticX - v * sc;
  const imgX = isLens ? opticX + vTrue * sc : opticX - vTrue * sc;
  const imgH = -objH * mag;
  const benchFrom = 40;
  const benchTo = 600;
  const imgOnScreen = Math.max(-110, Math.min(110, imgH));
  const toCm = (x: number) => (isLens ? (x - opticX) / sc : (opticX - x) / sc);
  return (
    <SceneFrame ref={ref} label={isLens ? 'Optical bench with convex lens' : 'Optical bench with concave mirror'}>
      <defs>
        <filter id={`b${blurId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={blur * 7} />
        </filter>
      </defs>
      {/* bench */}
      <rect x={benchFrom - 10} y={290} width={benchTo - benchFrom + 20} height={14} rx={3} fill="url(#pr-metal)" />
      <Ruler x1={benchFrom} x2={benchTo} y={306} from={0} to={(benchTo - benchFrom) / sc} major={10} minor={5} unit="cm" height={10} />
      <line x1={benchFrom} y1={axis} x2={benchTo} y2={axis} stroke={C.muted} strokeDasharray="6 5" opacity={0.6} />
      {/* principal rays from object top */}
      {(() => {
        const topY = axis - objH;
        const imgTopY = axis - imgH;
        const rays: React.ReactNode[] = [];
        // ray parallel to axis then through image point; ray through optical centre
        rays.push(<path key="r1" d={`M ${objX} ${topY} L ${opticX} ${topY} L ${imgX} ${imgTopY}`} fill="none" stroke={C.amber} strokeWidth={1.4} opacity={0.85} />);
        rays.push(<path key="r2" d={`M ${objX} ${topY} L ${opticX} ${axis} L ${imgX} ${imgTopY}`} fill="none" stroke={C.amber} strokeWidth={1.4} opacity={0.6} />);
        return rays;
      })()}
      {/* focal points */}
      {[1, 2].map((k) => (
        <g key={k}>
          <circle cx={opticX - k * f * sc * (isLens ? 1 : 1)} cy={axis} r={3} fill={C.muted} />
          <Txt x={opticX - k * f * sc} y={axis + 16} size={9}>{k === 1 ? 'F' : isLens ? '2F' : 'C'}</Txt>
          {isLens && (
            <>
              <circle cx={opticX + k * f * sc} cy={axis} r={3} fill={C.muted} />
              <Txt x={opticX + k * f * sc} y={axis + 16} size={9}>{k === 1 ? 'F' : '2F'}</Txt>
            </>
          )}
        </g>
      ))}
      {/* optic: a real lens in a ring carrier, or a silvered concave mirror */}
      {isLens ? (
        <g filter="url(#pr-ground)">
          <path d={`M ${opticX - 9} ${axis - 70} Q ${opticX - 14} ${axis} ${opticX - 9} ${axis + 70} Q ${opticX} ${axis + 74} ${opticX + 9} ${axis + 70} Q ${opticX + 14} ${axis} ${opticX + 9} ${axis - 70} Z`} fill="url(#pr-glass)" stroke="#7fb4dc" strokeWidth={1.4} />
          <path d={`M ${opticX - 8} ${axis - 66} Q ${opticX - 12} ${axis} ${opticX - 8} ${axis + 66}`} fill="none" stroke="#ffffff" strokeWidth={2.6} opacity={0.75} strokeLinecap="round" />
          <path d={`M ${opticX + 8} ${axis - 62} Q ${opticX + 11} ${axis} ${opticX + 8} ${axis + 62}`} fill="none" stroke="#ffffff" strokeWidth={1.4} opacity={0.4} strokeLinecap="round" />
        </g>
      ) : (
        <g filter="url(#pr-ground)">
          <path d={`M ${opticX - 10} ${axis - 75} Q ${opticX + 14} ${axis} ${opticX - 10} ${axis + 75} Z`} fill="url(#ix-steel-h)" stroke="#64748b" strokeWidth={1} />
          <path d={`M ${opticX - 6} ${axis - 68} Q ${opticX + 9} ${axis} ${opticX - 6} ${axis + 68}`} fill="none" stroke="#ffffff" strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />
        </g>
      )}
      <rect x={opticX - 4} y={axis + 70} width={8} height={Math.max(0, 290 - axis - 70)} fill={C.steelDark} />
      {/* object */}
      <Arrow x={objX} base={axis} h={objH} color={C.red} />
      <rect x={objX - 4} y={axis} width={8} height={120} fill="url(#ix-steel-h)" />
      <rect x={objX - 6} y={axis - 1.5} width={12} height={3} rx={1.5} fill={C.steelDark} />
      <rect x={objX - 18} y={axis - 60} width={36} height={190} fill="transparent" {...drag((pt) => setParam('u', Math.round(isLens ? (opticX - pt.x) / sc : (opticX - pt.x) / sc)))} />
      <Grip x={objX} y={axis + 40} color={C.red} />
      <Txt x={objX} y={axis - objH - 10} size={10} color={C.red}>u = {fmt(u, 0)} cm</Txt>
      {/* screen */}
      <g>
        <rect x={scrX - 3} y={isLens ? axis - 115 : axis + 8} width={6} height={isLens ? 230 : 110} fill="#fbf8ef" stroke="#6b7280" strokeWidth={1} filter="url(#pr-ground)" />
        <rect x={scrX - 2} y={isLens ? axis - 115 : axis + 8} width={1.8} height={isLens ? 230 : 110} fill="#ffffff" opacity={0.7} />
        <g filter={`url(#b${blurId})`} opacity={sharp ? 1 : 0.85}>
          <Arrow x={scrX} base={axis} h={isLens ? imgOnScreen : Math.max(-110, imgOnScreen)} color={C.red} />
        </g>
        <rect x={scrX - 3} y={isLens ? axis + 115 : axis + 128} width={6} height={Math.max(0, isLens ? 290 - axis - 115 : 290 - axis - 128)} fill={C.steelDark} />
        <rect x={scrX - 20} y={isLens ? axis - 120 : axis} width={40} height={isLens ? 240 : 130} fill="transparent" {...drag((pt) => setParam('v', Math.round(toCm(pt.x) * 2) / 2))} />
        <Grip x={scrX} y={isLens ? axis + 90 : axis + 100} color={sharp ? C.green : C.blue} />
        <Txt x={scrX} y={isLens ? axis - 122 : axis + 146} size={10} color={sharp ? C.green : C.ink} weight={800}>v = {fmt(v, 1)} cm</Txt>
      </g>
      {/* screen view inset */}
      <g>
        <rect x={40} y={12} width={120} height={98} rx={8} fill="#f8fafc" stroke={sharp ? C.green : C.line} strokeWidth={sharp ? 2.5 : 1.5} filter="url(#pr-ground)" />
        <g filter={`url(#b${blurId})`}>
          <Arrow x={100} base={58} h={Math.max(-40, Math.min(40, imgH * 0.6))} color={C.red} />
        </g>
        <Txt x={100} y={100} size={9} color="#475569">{bn ? 'পর্দায় প্রতিবিম্ব' : 'Image on screen'}</Txt>
      </g>
      <Digital x={isLens ? 470 : 200} y={20} w={120} text={`${Math.round((1 - blur) * 100)}% ${bn ? 'স্পষ্ট' : 'sharp'}`} label={bn ? 'স্পষ্টতা' : 'Sharpness'} good={sharp} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Ray diagrams: glass slab & prism                                     */
/* ------------------------------------------------------------------ */

export function RaysScene(props: SceneProps) {
  return props.model.variant === 'prism' ? <PrismRays {...props} /> : <SlabRays {...props} />;
}

function SlabRays({ view, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const i = num(view, 'i');
  const r = num(view, 'r');
  const top = 130;
  const bot = 250;
  const px = 280;
  const L = 150;
  const sx = px - Math.sin(i * DEG) * L;
  const sy = top - Math.cos(i * DEG) * L;
  const qx = px + Math.tan(r * DEG) * (bot - top);
  const ex = qx + Math.sin(i * DEG) * 120;
  const ey = bot + Math.cos(i * DEG) * 120;
  return (
    <SceneFrame ref={ref} label="Refraction through a glass slab">
      {/* drawing board, cartridge paper taped down, and the slab sitting on it */}
      <rect x={40} y={24} width={560} height={332} rx={6} fill="url(#pr-board)" stroke="#7c5327" strokeWidth={1} filter="url(#pr-ground-lg)" />
      <rect x={40} y={24} width={560} height={332} rx={6} fill="url(#pr-sheen)" opacity={0.35} />
      <rect x={56} y={40} width={528} height={300} rx={3} fill="url(#pr-paper)" stroke="#d9d2bd" strokeWidth={0.7} filter="url(#pr-ground)" />
      {/* the eye-line the experimenter rules in pencil */}
      <line x1={px} y1={top - 110} x2={px} y2={top} stroke="#4b5563" strokeWidth={0.6} opacity={0.55} />
      <line x1={qx} y1={bot} x2={qx} y2={bot + 80} stroke="#4b5563" strokeWidth={0.6} opacity={0.55} />
      {/* the slab: edge-lit glass with a polished bevel and a soft cast shadow */}
      <rect x={120} y={top} width={400} height={bot - top} rx={2} fill="url(#pr-glass)" stroke="#7fb4dc" strokeWidth={1.2} filter="url(#pr-ground)" />
      <rect x={120} y={top} width={400} height={6} rx={2} fill="url(#pr-glass-edge)" />
      <rect x={120} y={bot - 6} width={400} height={6} rx={2} fill="#7fb4dc" opacity={0.5} />
      <rect x={124} y={top + 8} width={10} height={bot - top - 16} rx={4} fill="#ffffff" opacity={0.4} />
      <rect x={508} y={top + 8} width={7} height={bot - top - 16} rx={3} fill="#ffffff" opacity={0.18} />
      <rect x={120} y={top} width={400} height={bot - top} rx={2} fill="url(#pr-sheen)" opacity={0.6} />
      <Txt x={500} y={top + 18} size={10} color={C.blue} anchor="end">{bn ? 'কাচের স্ল্যাব μ ≈ 1.52' : 'Glass slab μ ≈ 1.52'}</Txt>
      <line x1={px} y1={top - 110} x2={px} y2={top + 60} stroke={C.muted} strokeDasharray="4 4" />
      <path d={`M ${sx} ${sy} L ${px} ${top}`} stroke={C.red} strokeWidth={2.4} markerEnd="url(#pr-arrow)" color={C.red} />
      <line x1={px} y1={top} x2={qx} y2={bot} stroke="#b8352b" strokeWidth={2.4} opacity={0.75} />
      <path d={`M ${qx} ${bot} L ${ex} ${ey}`} stroke={C.red} strokeWidth={2.4} markerEnd="url(#pr-arrow)" color={C.red} />
      <line x1={px} y1={top} x2={px + Math.sin(i * DEG) * 160} y2={top + Math.cos(i * DEG) * 160} stroke={C.red} strokeDasharray="3 4" opacity={0.4} />
      {/* angle arcs */}
      <path d={`M ${px} ${top - 50} A 50 50 0 0 0 ${px - Math.sin(i * DEG) * 50} ${top - Math.cos(i * DEG) * 50}`} fill="none" stroke={C.amber} strokeWidth={2} />
      <Txt x={px - 24} y={top - 56} size={11} color={C.amber} weight={800}>i = {fmt(i, 0)}°</Txt>
      <path d={`M ${px} ${top + 50} A 50 50 0 0 0 ${px + Math.sin(r * DEG) * 50} ${top + Math.cos(r * DEG) * 50}`} fill="none" stroke={C.green} strokeWidth={2} />
      <Txt x={px + 30} y={top + 70} size={11} color={C.green} weight={800} anchor="start">r = {fmt(r, 1)}°</Txt>
      {/* pins */}
      {[0.45, 0.8].map((k) => {
        const cxp = px - Math.sin(i * DEG) * L * k;
        const cyp = top - Math.cos(i * DEG) * L * k;
        return (
          <g key={k}>
            <circle cx={cxp + 1} cy={cyp + 1.4} r={4.4} fill="#0b1220" opacity={0.28} />
            <circle cx={cxp} cy={cyp} r={4.2} fill="url(#ix-steel-h)" stroke="#5b6673" strokeWidth={0.6} />
            <circle cx={cxp - 1.2} cy={cyp - 1.3} r={1.5} fill="#ffffff" opacity={0.8} />
          </g>
        );
      })}
      <circle cx={sx} cy={sy} r={16} fill="transparent" {...drag((pt) => {
        const ang = Math.atan2(px - pt.x, top - pt.y) / DEG;
        setParam('i', Math.round(ang));
      })} />
      <Grip x={sx} y={sy} color={C.red} />
      <Digital x={480} y={280} w={140} text={`${(Math.sin(i * DEG) / Math.sin(r * DEG)).toFixed(3)}`} label="sin i / sin r" />
    </SceneFrame>
  );
}

function PrismRays({ view, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const i = num(view, 'i');
  const tir = num(view, 'tir') === 1;
  const r1 = num(view, 'r1');
  const e = num(view, 'e');
  const delta = num(view, 'delta');
  const A = { x: 300, y: 60 };
  const side = 250;
  const B = { x: A.x - side / 2, y: A.y + side * 0.866 };
  const Cc = { x: A.x + side / 2, y: A.y + side * 0.866 };
  const P = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const incAng = (30 - i) * DEG;
  const src = { x: P.x - Math.cos(incAng) * 190, y: P.y - Math.sin(incAng) * 190 };
  // inside ray
  let Q = P;
  let emerg = '';
  let devArc: React.ReactNode = null;
  if (!tir) {
    const inAng = (30 - r1) * DEG;
    const dx = Math.cos(inAng);
    const dy = Math.sin(inAng);
    // intersect with A–C: A + s(C−A)
    const ex = Cc.x - A.x;
    const ey = Cc.y - A.y;
    const den = dx * ey - dy * ex;
    const tt = ((A.x - P.x) * ey - (A.y - P.y) * ex) / den;
    Q = { x: P.x + dx * tt, y: P.y + dy * tt };
    const outAng = (-30 + e) * DEG;
    const end = { x: Q.x + Math.cos(outAng) * 200, y: Q.y + Math.sin(outAng) * 200 };
    emerg = `M ${Q.x} ${Q.y} L ${end.x} ${end.y}`;
    const ext = { x: P.x + Math.cos(incAng) * 330, y: P.y + Math.sin(incAng) * 330 };
    devArc = (
      <g>
        <line x1={P.x} y1={P.y} x2={ext.x} y2={ext.y} stroke={C.red} strokeDasharray="4 5" opacity={0.45} />
        <Txt x={end.x - 30} y={end.y - 20 + (delta > 45 ? 10 : 0)} size={11} color={C.violet} weight={800}>δ = {fmt(delta, 1)}°</Txt>
      </g>
    );
  }
  return (
    <SceneFrame ref={ref} label="Refraction through a prism">
      <rect x={64} y={48} width={512} height={300} rx={5} fill="url(#pr-paper)" stroke="#d9d2bd" strokeWidth={0.8} filter="url(#pr-ground-lg)" />
      <rect x={64} y={48} width={512} height={300} rx={5} fill="url(#pr-sheen)" opacity={0.25} />
      <path d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${Cc.x} ${Cc.y} Z`} fill="url(#pr-glass)" stroke="#7fb4dc" strokeWidth={1.4} filter="url(#pr-ground)" />
      <path d={`M ${A.x} ${A.y} L ${B.x} ${B.y}`} stroke="#ffffff" strokeWidth={1.8} opacity={0.7} strokeLinecap="round" />
      <path d={`M ${A.x} ${A.y} L ${Cc.x} ${Cc.y}`} stroke="#ffffff" strokeWidth={1.2} opacity={0.45} strokeLinecap="round" />
      <path d={`M ${B.x} ${B.y} L ${Cc.x} ${Cc.y}`} stroke="#8fc3e8" strokeWidth={2.2} opacity={0.6} />
      <path d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${Cc.x} ${Cc.y} Z`} fill="url(#pr-sheen)" opacity={0.5} />
      <g opacity={0.5}>
        {[
          { col: '#ff4d5e', k: 0 },
          { col: '#fb923c', k: 4 },
          { col: '#facc15', k: 8 },
          { col: '#4ade80', k: 12 },
          { col: '#38bdf8', k: 16 },
          { col: '#a78bfa', k: 20 }
        ].map(({ col, k }) => (
          <rect key={col} x={476 + k * 1.4} y={252 + k * 2.6} width={3.4} height={72} rx={1.6} fill={col} />
        ))}
      </g>
      <Txt x={A.x} y={A.y - 8} size={10} color={C.blue}>A = 60°</Txt>
      {/* normal at P */}
      <line x1={P.x - 0.866 * 60} y1={P.y - 0.5 * 60} x2={P.x + 0.866 * 60} y2={P.y + 0.5 * 60} stroke={C.muted} strokeDasharray="4 4" />
      <path d={`M ${src.x} ${src.y} L ${P.x} ${P.y}`} stroke={C.red} strokeWidth={2.4} markerEnd="url(#pr-arrow)" color={C.red} />
      {!tir && <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke="#b8352b" strokeWidth={2.4} opacity={0.8} />}
      {!tir && <path d={emerg} stroke={C.red} strokeWidth={2.4} markerEnd="url(#pr-arrow)" color={C.red} />}
      {!tir && <line x1={Q.x - 0.866 * 50} y1={Q.y + 0.5 * 50} x2={Q.x + 0.866 * 50} y2={Q.y - 0.5 * 50} stroke={C.muted} strokeDasharray="4 4" />}
      {devArc}
      {tir && <Txt x={420} y={200} size={11} color={C.red} weight={800}>{bn ? 'পূর্ণ অভ্যন্তরীণ প্রতিফলন' : 'Total internal reflection'}</Txt>}
      <Txt x={src.x + 10} y={src.y - 12} size={11} color={C.amber} weight={800} anchor="start">i = {fmt(i, 0)}°</Txt>
      {!tir && <Txt x={Q.x + 30} y={Q.y - 20} size={11} color={C.green} weight={800} anchor="start">e = {fmt(e, 1)}°</Txt>}
      <circle cx={src.x} cy={src.y} r={16} fill="transparent" {...drag((pt) => {
        const ang = Math.atan2(P.y - pt.y, P.x - pt.x) / DEG; // direction of travel
        setParam('i', Math.round(30 - ang));
      })} />
      <Grip x={src.x} y={src.y} color={C.red} />
      {/* δ vs i mini plot */}
      <rect x={470} y={240} width={150} height={100} rx={8} fill={C.surface} stroke={C.line} />
      {(() => {
        const pts: string[] = [];
        for (let a = 30; a <= 75; a += 1) {
          const rr = Math.asin(Math.sin(a * DEG) / 1.517) / DEG;
          const s2 = 1.517 * Math.sin((60 - rr) * DEG);
          if (s2 >= 1) continue;
          const d = a + Math.asin(s2) / DEG - 60;
          pts.push(`${pts.length ? 'L' : 'M'} ${480 + ((a - 30) / 45) * 130} ${330 - (d - 36) * 4}`);
        }
        return (
          <g>
            <path d={pts.join(' ')} fill="none" stroke={C.violet} strokeWidth={1.6} />
            {!tir && <circle cx={480 + ((i - 30) / 45) * 130} cy={330 - (delta - 36) * 4} r={4} fill={C.red} />}
            <Txt x={545} y={254} size={9}>δ vs i</Txt>
          </g>
        );
      })()}
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Interference fringes & grating spots                                 */
/* ------------------------------------------------------------------ */

export function FringesScene(props: SceneProps) {
  return props.model.variant === 'grating' ? <GratingScene {...props} /> : <DoubleSlitScene {...props} />;
}

function DoubleSlitScene({ view, bn }: SceneProps) {
  const D = num(view, 'D');
  const d = num(view, 'd');
  const beta = num(view, 'beta');
  const pxmm = 6.4;
  const fx = 320;
  const fy = 258;
  const fr = 96;
  const bars: React.ReactNode[] = [];
  // integrate the two-slit profile finely and fade it with the envelope, so the
  // field looks like light in an eyepiece rather than a printed barcode
  for (let k = 0; k < 640; k++) {
    const xmm = (k - 320) * 0.055;
    const env = Math.exp(-Math.pow(xmm / 15, 2));
    const I = Math.pow(Math.cos((Math.PI * xmm) / beta), 2) * env;
    bars.push(
      <rect
        key={k}
        x={fx + xmm * pxmm - 0.75}
        y={fy - 62}
        width={1.6}
        height={124}
        fill="#ff4038"
        opacity={Math.pow(Math.max(0, I), 0.68) * 0.95}
      />
    );
  }
  const screenX = 160 + D * 200;
  return (
    <SceneFrame label="Young's double slit">
      {/* top view: the laser, its beam, the slide and the screen on the bench */}
      <g>
        <rect x="0" y="162" width="640" height="14" fill="url(#pr-wood)" />
        <rect x="0" y="162" width="640" height="3" fill="#ffffff" opacity="0.35" />
        <rect x={40} y={58} width={66} height={28} rx={6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth="0.8" />
        <rect x={40} y={58} width={66} height={9} rx={4} fill="#ffffff" opacity="0.16" />
        <circle cx={102} cy={72} r={4.6} fill="#ff3b52" opacity="0.95" />
        <rect x={48} y={66} width={20} height={11} rx={2} fill="#4a0b16" />
        <rect x={50} y={68} width={16} height={4} rx={2} fill="#ff4d5e" opacity="0.85" />
        <line x1={72} y1={72} x2={156} y2={72} stroke="#ff4d5e" strokeWidth="2.2" />
        <line x1={72} y1={72} x2={156} y2={72} stroke="#ff4d5e" strokeWidth="7" opacity="0.25" filter="url(#pr-glow)" />
        <Txt x={73} y={48} size={9.5}>He–Ne 632.8 nm</Txt>
        {/* the slide in its holder */}
        <Rod x1={160} y1={110} x2={160} y2={166} w={6} />
        <rect x={154} y={36} width={12} height={78} rx={2} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth="0.7" />
        <rect x={154} y={71 - d * 6} width={12} height={2.4} fill="#fff8e1" />
        <rect x={154} y={77 + d * 6} width={12} height={2.4} fill="#fff8e1" />
        <path d={`M 166 ${72 - d * 6} L ${screenX} 30 M 166 ${78 + d * 6} L ${screenX} 120`} stroke="#ff4d5e" opacity="0.28" />
        <Txt x={162} y={30} size={9.5}>d = {d} mm</Txt>
        {/* the screen on its own carrier */}
        <Rod x1={screenX + 3} y1={124} x2={screenX + 3} y2={166} w={6} />
        <rect x={screenX - 2} y={22} width={10} height={102} rx={2} fill="url(#ix-screen-off)" stroke="#0b1220" strokeWidth="0.8" />
        <line x1={164} y1={140} x2={screenX} y2={140} stroke={C.blue} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
        <Txt x={(164 + screenX) / 2} y={158} size={10.5} color={C.blue}>D = {fmt(D, 1)} m</Txt>
      </g>
      {/* the fringe field as it really looks: a round eyepiece in a darkened room */}
      <defs>
        <clipPath id="fr-field">
          <circle cx={fx} cy={fy} r={fr - 5} />
        </clipPath>
        <radialGradient id="fr-vig" cx="0.5" cy="0.5" r="0.5">
          <stop offset="58%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx={fx} cy={fy + 4} r={fr + 2} fill="#0b1220" opacity={0.22} filter="url(#pr-soft)" />
      <circle cx={fx} cy={fy} r={fr} fill="url(#ix-knurl)" />
      <circle cx={fx} cy={fy} r={fr} fill="#141821" stroke="#0b1220" strokeWidth={1} />
      <circle cx={fx} cy={fy} r={fr - 8} fill="#07070c" />
      <g clipPath="url(#fr-field)">
        <g filter="url(#pr-soft)">{bars}</g>
        {/* micrometer crosshair, set ten fringes apart */}
        <line x1={fx} y1={fy - fr} x2={fx} y2={fy + fr} stroke="#a3e635" strokeWidth={1.1} opacity={0.9} />
        <line
          x1={fx + Math.min(10 * beta * pxmm, 168)}
          y1={fy - fr}
          x2={fx + Math.min(10 * beta * pxmm, 168)}
          y2={fy + fr}
          stroke="#a3e635"
          strokeWidth={1.1}
          strokeDasharray="3 3"
          opacity={0.9}
        />
        <circle cx={fx + Math.min(10 * beta * pxmm, 168) / 2} cy={fy + 54} r={13} fill="#07070c" opacity={0.72} />
        <Txt x={fx + Math.min(10 * beta * pxmm, 168) / 2} y={fy + 58} size={10} color="#a3e635">10β</Txt>
      </g>
      <circle cx={fx} cy={fy} r={fr - 8} fill="url(#fr-vig)" />
      <circle cx={fx} cy={fy} r={fr - 4} fill="none" stroke="#1f2937" strokeWidth={1.4} />
      <Txt x={fx - fr - 14} y={fy + 4} size={10} color={C.muted} anchor="end">
        {bn ? 'মাইক্রোমিটার আইপিসে ডোরা' : 'Fringes in the micrometer eyepiece'}
      </Txt>
      <Digital x={440} y={160} w={170} text={`10β = ${fmt(beta * 10, 2)} mm`} label={bn ? '১০টি ডোরার প্রস্থ' : 'Width of 10 fringes'} />
      <Digital x={440} y={94} w={170} text={`β = ${fmt(beta, 3)} mm`} label={bn ? 'ডোরা প্রস্থ' : 'Fringe width'} />
    </SceneFrame>
  );
}

function GratingScene({ view, bn }: SceneProps) {
  const N = num(view, 'N');
  const n = num(view, 'n');
  const D = num(view, 'D');
  const k = 300; // px per m
  const gx = 120;
  const sx = gx + D * k;
  const cy = 180;
  const lambda = 632.8e-9;
  const spots: React.ReactNode[] = [];
  for (let m = -3; m <= 3; m++) {
    const s = m * lambda * N * 1000;
    if (Math.abs(s) >= 1) continue;
    const y = D * Math.tan(Math.asin(s)) * k;
    const visible = Math.abs(y) < 165;
    const sel = Math.abs(m) === n;
    if (visible) {
      spots.push(
        <g key={m}>
          <line x1={gx} y1={cy} x2={sx} y2={cy - y} stroke="#ef4444" opacity={sel ? 0.55 : 0.16} strokeWidth={sel ? 1.6 : 1} strokeDasharray="7 5" />
          <circle cx={sx} cy={cy - y} r={sel ? 7 : 5} fill="#ef4444" />
          <circle cx={sx} cy={cy - y} r={sel ? 18 : 12} fill="url(#pr-glow-red)" opacity={sel ? 0.85 : 0.45} />
          <Txt x={sx + 14} y={cy - y + 4} size={9.5} anchor="start">{m === 0 ? '0' : m > 0 ? `+${m}` : m}</Txt>
        </g>
      );
    }
  }
  const s1 = n * lambda * N * 1000;
  const yy = s1 < 1 ? D * Math.tan(Math.asin(s1)) * k : 0;
  return (
    <SceneFrame label="Diffraction grating">
      <rect x={30} y={cy - 14} width={60} height={28} rx={5} fill={C.ink} />
      <line x1={90} y1={cy} x2={gx} y2={cy} stroke="#ef4444" strokeWidth={2.5} />
      <rect x={gx - 3} y={cy - 60} width={6} height={120} rx={1.5} fill="url(#pr-glass)" stroke="#7fb4dc" strokeWidth={0.8} filter="url(#pr-ground)" />
      <rect x={gx - 2.4} y={cy - 58} width={1.6} height={116} fill="#ffffff" opacity={0.55} />
      <Txt x={gx} y={cy - 68} size={9.5}>{N} / mm</Txt>
      <line x1={sx} y1={14} x2={sx} y2={346} stroke={C.ink} strokeWidth={4} />
      {spots}
      {s1 < 1 && Math.abs(yy) < 165 && (
        <g>
          <line x1={sx - 26} y1={cy} x2={sx - 26} y2={cy - yy} stroke={C.green} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.green} />
          <Txt x={sx - 32} y={cy - yy / 2} size={10.5} color={C.green} anchor="end">y = {fmt(num(view, 'y'), 1)} cm</Txt>
        </g>
      )}
      <line x1={gx} y1={330} x2={sx} y2={330} stroke={C.blue} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={(gx + sx) / 2} y={324} size={10.5} color={C.blue}>D = {fmt(D, 2)} m</Txt>
      <Digital x={470} y={30} w={150} text={`n = ${n}`} label={bn ? 'ক্রম' : 'Order'} good={s1 < 1} />
    </SceneFrame>
  );
}
