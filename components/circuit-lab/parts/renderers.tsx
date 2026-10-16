/**
 * Self-generated SVG artwork for every part family. Pure presentational:
 * each renderer receives the part definition, the placed instance and the
 * latest simulation result for that instance, and draws in part-local
 * coordinates (the canvas applies position, rotation and flip).
 *
 * No external images or fonts are used; everything is drawn with primitives.
 */

import type { ReactNode } from 'react';
import type { CompSimResult, PartDef, PlacedComponent, PropValue } from '../types';
import { isHolePin } from './holes';

export interface ArtProps {
  def: PartDef;
  comp: PlacedComponent;
  sim?: CompSimResult;
  /** Pin id currently hovered (highlighted). */
  hoverPin?: string | null;
  /** Pins that are connected to a wire (drawn brighter). */
  connectedPins?: Set<string>;
  /** Simulated time in seconds, used for animations. */
  simTime?: number;
  running?: boolean;
}

export const WIRE_COLORS: Record<string, string> = {
  red: '#e0412f',
  black: '#2b2b2f',
  blue: '#2f6fd6',
  green: '#2ea55a',
  yellow: '#f2c230',
  white: '#f1f3f5',
  orange: '#f08a2c',
  purple: '#8a4fd6'
};

const LED_COLORS: Record<string, { on: string; off: string }> = {
  red: { on: '#ff3b2f', off: '#6b1f1a' },
  yellow: { on: '#ffd23a', off: '#6e5b13' },
  green: { on: '#3dff7a', off: '#1c5a2d' },
  blue: { on: '#3da5ff', off: '#183a63' },
  white: { on: '#f7fbff', off: '#5b6470' },
  rgb: { on: '#ffffff', off: '#333' }
};

const BAND_COLORS = ['#111', '#7a4b1e', '#d62c20', '#f08a2c', '#f2d43a', '#2fa64a', '#2f6fd6', '#8a4fd6', '#7f7f7f', '#ffffff'];

/** Colour bands (4-band) for a resistance in ohms. */
export function resistorBands(ohms: number): [string, string, string, string] {
  if (!isFinite(ohms) || ohms <= 0) return [BAND_COLORS[0], BAND_COLORS[0], BAND_COLORS[0], '#d4a017'];
  let exp = Math.floor(Math.log10(ohms)) - 1;
  let mant = Math.round(ohms / Math.pow(10, exp));
  if (mant >= 100) {
    mant = Math.round(mant / 10);
    exp += 1;
  }
  if (mant < 10) mant *= 10;
  const d1 = Math.floor(mant / 10);
  const d2 = mant % 10;
  const mulIdx = Math.min(9, Math.max(0, exp));
  return [BAND_COLORS[d1], BAND_COLORS[d2], BAND_COLORS[mulIdx], '#d4a017'];
}

/** Human-readable ohms/farads/henry strings. */
export function formatSI(value: number, unit: string): string {
  if (!isFinite(value)) return '—';
  const abs = Math.abs(value);
  const table: [number, string][] = [
    [1e9, 'G'],
    [1e6, 'M'],
    [1e3, 'k'],
    [1, ''],
    [1e-3, 'm'],
    [1e-6, 'µ'],
    [1e-9, 'n'],
    [1e-12, 'p']
  ];
  for (const [scale, prefix] of table) {
    if (abs >= scale) {
      const n = value / scale;
      return `${Number(n.toPrecision(3))}${prefix}${unit}`;
    }
  }
  return `${Number(value.toPrecision(3))}${unit}`;
}

function num(v: PropValue | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

function str(v: PropValue | undefined, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/** Pin dot + label. Highlight on hover, brighter when wired. */
function PinMark({
  x,
  y,
  label,
  id,
  hover,
  wired,
  size = 2.6,
  showLabel = true,
  labelOffset
}: {
  x: number;
  y: number;
  label: string;
  id: string;
  hover?: boolean;
  wired?: boolean;
  size?: number;
  showLabel?: boolean;
  labelOffset?: { dx: number; dy: number; anchor?: 'start' | 'middle' | 'end' };
}) {
  return (
    <g data-pin={id}>
      <circle cx={x} cy={y} r={size} fill={hover ? 'var(--circuit-hover, #f4b942)' : wired ? '#c9d4e0' : '#9aa6b2'} stroke={hover ? '#8a5a00' : '#4b5563'} strokeWidth={0.8} />
      {showLabel && label ? (
        <text
          x={x + (labelOffset?.dx ?? 0)}
          y={y + (labelOffset?.dy ?? 0)}
          fontSize={4.2}
          fill="currentColor"
          textAnchor={labelOffset?.anchor ?? 'middle'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function pinsOf(def: PartDef, props: ArtProps) {
  return def.pins.map((pin) => (
    <PinMark
      key={pin.id}
      id={pin.id}
      x={pin.x}
      y={pin.y}
      label={pin.label}
      hover={props.hoverPin === pin.id}
      wired={props.connectedPins?.has(pin.id)}
      showLabel={false}
    />
  ));
}

/** Labels placed just outside the body, away from the centre. */
function edgeLabels(def: PartDef, props: ArtProps) {
  return def.pins.map((pin) => {
    const outward = pin.y <= 0 ? { dx: 0, dy: -4 } : pin.y >= def.h ? { dx: 0, dy: 8 } : pin.x <= 0 ? { dx: -4, dy: 1.5 } : pin.x >= def.w ? { dx: 4, dy: 1.5 } : { dx: 0, dy: 1.5 };
    const anchor = outward.dx < 0 ? 'end' : outward.dx > 0 ? 'start' : 'middle';
    return (
      <PinMark
        key={`lbl-${pin.id}`}
        id={`lbl-${pin.id}`}
        x={pin.x}
        y={pin.y}
        label={pin.label}
        size={0}
        showLabel
        labelOffset={{ ...outward, anchor }}
        hover={props.hoverPin === pin.id}
      />
    );
  });
}

// ── Families ───────────────────────────────────────────────────────────────

function ResistorArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const ohms = num(comp.props.ohms, 220);
  const bands = resistorBands(ohms);
  const heat = sim?.power ?? 0;
  const burnt = sim?.burnt;
  const isLDR = def.id === 'ldr';
  const isTherm = def.id === 'thermistor';
  return (
    <g>
      <path d="M0 10 H9" stroke="#b8bec6" strokeWidth={1.6} />
      <path d="M31 10 H40" stroke="#b8bec6" strokeWidth={1.6} />
      {isLDR ? (
        <g>
          <ellipse cx={20} cy={10} rx={8} ry={6} fill="#c9a36b" stroke="#6b4a1e" />
          <path d="M14 8 Q20 3 26 8 M14 13 Q20 18 26 13" fill="none" stroke="#f2c230" strokeWidth={1} />
        </g>
      ) : isTherm ? (
        <g>
          <rect x={9} y={5} width={22} height={10} rx={4} fill="#3b6e8f" stroke="#1d3c52" />
          <text x={20} y={12.4} fontSize={5} textAnchor="middle" fill="#fff">NTC</text>
        </g>
      ) : (
        <g>
          <rect x={9} y={5} width={22} height={10} rx={3} fill={burnt ? '#2a2420' : '#e4c593'} stroke="#8c6a3a" strokeWidth={0.6} />
          <rect x={12} y={5.5} width={1.6} height={9} fill={bands[0]} />
          <rect x={15.2} y={5.5} width={1.6} height={9} fill={bands[1]} />
          <rect x={18.4} y={5.5} width={1.6} height={9} fill={bands[2]} />
          <rect x={26} y={5.5} width={1.6} height={9} fill={bands[3]} />
        </g>
      )}
      {heat > 0.25 * num(comp.props.watts, 0.25) ? (
        <path d="M14 1 q-2 -3 0 -5 M22 1 q-2 -3 0 -5" stroke="#9aa3ad" strokeWidth={0.8} fill="none" opacity={0.7} />
      ) : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function CapacitorArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  const isElectrolytic = def.family === 'capacitor-electrolytic';
  if (isElectrolytic) {
    return (
      <g>
        <rect x={6} y={4} width={18} height={30} rx={3} fill="#2a4a6b" stroke="#132638" />
        <rect x={6} y={27} width={18} height={4} fill="#c7d3df" />
        <rect x={20} y={4} width={4} height={30} fill="#1b3350" />
        <text x={15} y={18} fontSize={4} textAnchor="middle" fill="#dbe6f2">{formatSI(num(comp.props.farads, 1e-4), 'F')}</text>
        <text x={15} y={24} fontSize={3.4} textAnchor="middle" fill="#dbe6f2">{`${num(comp.props.volts, 25)}V`}</text>
        <path d="M5 1 H9 M7 -1 V3" stroke="#fff" strokeWidth={0.7} />
        <text x={18.5} y={38} fontSize={4} fill="#dbe6f2" textAnchor="middle">−</text>
        {pinsOf(def, { def, comp, hoverPin, connectedPins })}
        {edgeLabels(def, { def, comp, hoverPin })}
      </g>
    );
  }
  return (
    <g>
      <path d="M10 30 V18 M20 30 V18" stroke="#b8bec6" strokeWidth={1.2} />
      <circle cx={15} cy={12} r={9} fill="#e8b65a" stroke="#8c5e17" />
      <text x={15} y={14} fontSize={4} textAnchor="middle" fill="#3b2a0b">{formatSI(num(comp.props.farads, 1e-7), 'F')}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function InductorArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  return (
    <g>
      <path d="M0 10 H6 M34 10 H40" stroke="#b8bec6" strokeWidth={1.6} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${7 + i * 5.5} 10 a2.75 4 0 0 1 5.5 0`} fill="none" stroke="#b5732f" strokeWidth={1.4} />
      ))}
      <text x={20} y={18} fontSize={4} textAnchor="middle" fill="currentColor">{formatSI(num(comp.props.henry, 1e-4), 'H')}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function PotArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  const pos = num(comp.props.position, 50) / 100;
  const angle = -135 + pos * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = def.w / 2;
  const cy = 26;
  return (
    <g>
      <rect x={6} y={6} width={48} height={40} rx={4} fill="#2f3a46" stroke="#171f27" />
      <circle cx={cx} cy={cy - 10} r={12} fill="#1f2730" stroke="#0b1015" />
      <circle cx={cx} cy={cy - 10} r={8} fill="#cfd6de" stroke="#7a8794" />
      <line x1={cx} y1={cy - 10} x2={cx + Math.sin(rad) * 7} y2={cy - 10 - Math.cos(rad) * 7} stroke="#e0412f" strokeWidth={2} strokeLinecap="round" />
      <text x={cx} y={cy + 18} fontSize={3.6} textAnchor="middle" fill="#fff">{formatSI(num(comp.props.ohms, 10000), 'Ω')}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function TrimmerArt(props: ArtProps) {
  const { def, comp, hoverPin, connectedPins } = props;
  const pos = num(comp.props.position, 50) / 100;
  const angle = -135 + pos * 270;
  const rad = (angle * Math.PI) / 180;
  return (
    <g>
      <rect x={2} y={2} width={36} height={36} rx={3} fill="#2f6fa0" stroke="#17405f" />
      <circle cx={20} cy={20} r={10} fill="#e8edf2" stroke="#7a8794" />
      <line x1={20} y1={20} x2={20 + Math.sin(rad) * 8} y2={20 - Math.cos(rad) * 8} stroke="#333" strokeWidth={2.2} strokeLinecap="round" />
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function LedArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const color = str(comp.props.color, 'red');
  const colors = LED_COLORS[color] ?? LED_COLORS.red;
  const glow = Math.max(0, Math.min(1, sim?.glow ?? 0));
  const isRGB = def.id === 'led-rgb';
  const dome = isRGB
    ? { r: { on: '#ff3b2f', off: '#5a1a16' }, g: { on: '#3dff7a', off: '#1b4f2a' }, b: { on: '#3da5ff', off: '#173a5e' } }
    : null;
  const r = sim?.rgb;
  const mix = (on: string, off: string, k: number) => {
    // linear mix in hex
    const a = [1, 3, 5].map((i) => parseInt(on.slice(i, i + 2), 16));
    const b = [1, 3, 5].map((i) => parseInt(off.slice(i, i + 2), 16));
    const c = a.map((v, i) => Math.round(b[i] + (v - b[i]) * k));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };
  const fill = isRGB ? '#eef2f6' : mix(colors.on, colors.off, glow);
  return (
    <g>
      {glow > 0.05 ? <circle cx={10} cy={14} r={7 + glow * 12} fill={isRGB ? '#fff' : colors.on} opacity={0.12 + glow * 0.4} style={{ filter: 'blur(3px)' }} /> : null}
      <path d="M0 40 V30 M10 40 V30" stroke="#b8bec6" strokeWidth={1.1} />
      <path d="M2 20 Q2 4 10 4 Q18 4 18 20 V26 H2 Z" fill={fill} stroke="#4b5563" strokeWidth={0.7} />
      <rect x={1} y={24} width={18} height={3} fill="#e5e9ee" />
      {isRGB && dome ? (
        <g>
          <circle cx={6} cy={12} r={2.2} fill={mix(dome.r.on, dome.r.off, glow * (r?.r ?? glow))} />
          <circle cx={14} cy={12} r={2.2} fill={mix(dome.g.on, dome.g.off, glow * (r?.g ?? glow))} />
          <circle cx={10} cy={18} r={2.2} fill={mix(dome.b.on, dome.b.off, glow * (r?.b ?? glow))} />
        </g>
      ) : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function DiodeArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const isZener = def.id.startsWith('zener');
  const burnt = sim?.burnt;
  return (
    <g>
      <path d="M0 10 H12 M28 10 H40" stroke="#b8bec6" strokeWidth={1.4} />
      <rect x={12} y={4} width={10} height={12} rx={2} fill={burnt ? '#222' : '#2a2f36'} />
      <rect x={28} y={4} width={3} height={12} fill="#d8dde3" />
      <path d="M22 4 V16 M22 10 L30 10 M22 10 L14 10" fill="none" stroke="#e5e9ee" strokeWidth={0} />
      <path d="M20 4 L20 16" stroke="#d8dde3" strokeWidth={0.1} />
      <text x={20} y={21} fontSize={3.6} textAnchor="middle" fill="currentColor">{isZener ? `${num(comp.props.vz, 5.1)}V` : '1N4007'}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function TransistorArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const isMos = def.family === 'mosfet';
  const isTO220 = def.id === 'tip120' || def.id === 'irf540';
  const glow = sim && Math.abs(sim.current) > 0.001 ? 0.6 : 0;
  return (
    <g>
      <path d={isTO220 ? 'M4 2 H36 V26 H4 Z' : 'M4 4 Q20 -2 36 4 V22 Q20 28 4 22 Z'} fill={isTO220 ? '#1d1f24' : '#2e3742'} stroke="#0a0c0f" strokeWidth={0.8} />
      {isTO220 ? <rect x={4} y={26} width={32} height={3} fill="#d6dbe1" /> : null}
      <text x={20} y={17} fontSize={4} textAnchor="middle" fill="#e6ecf2">{def.partNumber}</text>
      {glow > 0 ? <circle cx={20} cy={14} r={3} fill="#f2c230" opacity={glow} /> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
      <text x={20} y={33} fontSize={3} textAnchor="middle" fill="currentColor">{isMos ? 'MOSFET' : 'BJT'}</text>
    </g>
  );
}

function RegulatorArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const hot = sim && sim.power > 0.5;
  return (
    <g>
      <path d="M4 2 H36 V26 H4 Z" fill="#1d1f24" stroke="#0a0c0f" />
      <rect x={14} y={6} width={12} height={10} fill="#0d0f12" />
      <text x={20} y={20} fontSize={4} textAnchor="middle" fill="#e6ecf2">{def.partNumber}</text>
      {hot ? <path d="M12 0 q-2 -4 0 -7 M28 0 q-2 -4 0 -7" stroke="#9aa3ad" fill="none" opacity={0.6} /> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function OptoArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  return (
    <g>
      <rect x={4} y={4} width={42} height={32} rx={3} fill="#2c3440" stroke="#0a0c0f" />
      <rect x={8} y={12} width={10} height={16} fill={sim && sim.current > 0.001 ? '#ffb86b' : '#5b3b1e'} />
      <rect x={30} y={12} width={10} height={16} fill="#2b2f36" />
      <text x={25} y={24} fontSize={3.4} textAnchor="middle" fill="#e6ecf2">PC817</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

/** DIP package: body, notch at pin 1 end, pin-1 dot, pins and labels. */
function DipArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const chip = def.art?.chipLabel ?? def.partNumber;
  const burnt = sim?.burnt;
  return (
    <g>
      <rect x={4} y={4} width={42} height={def.h - 8} rx={2} fill={burnt ? '#1b1b1b' : '#23272e'} stroke="#0a0c0f" />
      <path d={`M ${def.w / 2 - 5} 4 A 5 5 0 0 0 ${def.w / 2 + 5} 4`} fill="#0a0c0f" />
      <circle cx={12} cy={10} r={1.6} fill="#e5e9ee" />
      <text x={def.w / 2} y={def.h / 2} fontSize={4.4} textAnchor="middle" fill="#e6ecf2" transform={`rotate(-90 ${def.w / 2} ${def.h / 2})`}>{chip}</text>
      {def.pins.map((pin) => (
        <path key={`leg-${pin.id}`} d={pin.x < def.w / 2 ? `M ${pin.x} ${pin.y} H 6` : `M ${pin.x} ${pin.y} H ${def.w - 6}`} stroke="#c3c9d1" strokeWidth={1.6} />
      ))}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {def.pins.map((pin) => {
        const left = pin.x < def.w / 2;
        const number = Number(pin.id);
        const showNumber = Number.isFinite(number);
        return (
          <g key={`dl-${pin.id}`}>
            <text x={left ? 9 : def.w - 9} y={pin.y + 1.4} fontSize={3.2} textAnchor={left ? 'start' : 'end'} fill="#e6ecf2" style={{ pointerEvents: 'none' }}>
              {pin.label}
            </text>
            {showNumber ? <text x={left ? 2 : def.w - 2} y={pin.y - 1.5} fontSize={2.6} textAnchor={left ? 'start' : 'end'} fill="#9aa6b2">{pin.id}</text> : null}
          </g>
        );
      })}
    </g>
  );
}

/** Blue PCB module with header pins along the bottom edge and a silk label. */
function ModuleArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const variant = def.model.type === 'sensor' ? def.model.variant : def.model.type === 'wireless' ? def.model.variant : '';
  const driver = def.model.type === 'driver' ? def.model.variant : '';
  const body = def.art?.bodyColor ?? (def.id.includes('oled') ? '#0b3a6b' : def.id.includes('lcd') ? '#0d5a3d' : '#1c4f86');
  const hasMarker = variant === 'dht' || variant === 'pir' || variant === 'ir' || variant === 'mq' || variant === 'soil';
  return (
    <g>
      <rect x={3} y={3} width={def.w - 6} height={def.h - 14} rx={4} fill={body} stroke="#0a1f36" />
      {driver === 'l298n' ? (
        <g>
          <path d="M20 20 H34 M84 20 H100 M24 68 H40 M80 68 H96" fill="none" stroke="#c0a455" strokeWidth={1} opacity={0.8} />
          <rect x={37} y={8} width={46} height={42} rx={2} fill="#8f999f" stroke="#48525a" strokeWidth={1.2} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={`fin-${i}`} x={41 + i * 8} y={10} width={3} height={37} fill={i % 2 ? '#68747c' : '#b8c0c5'} />)}
          <rect x={45} y={17} width={31} height={24} rx={2} fill="#171b20" stroke="#101317" />
          <text x={60.5} y={31} fontSize={5} textAnchor="middle" fill="#dfe6ee">L298N</text>
          <rect x={5} y={24} width={20} height={33} rx={2} fill="#14734c" stroke="#073a27" />
          <rect x={95} y={24} width={20} height={33} rx={2} fill="#14734c" stroke="#073a27" />
          {[0, 1].map((i) => <g key={`out-screw-${i}`}><circle cx={15} cy={33 + i * 15} r={4.4} fill="#b8c1c4" stroke="#47525a" /><path d={`M12 ${33 + i * 15} H18`} stroke="#42494e" strokeWidth={1} /><circle cx={105} cy={33 + i * 15} r={4.4} fill="#b8c1c4" stroke="#47525a" /><path d={`M102 ${33 + i * 15} H108`} stroke="#42494e" strokeWidth={1} /></g>)}
          <rect x={29} y={57} width={62} height={18} rx={2} fill="#14734c" stroke="#073a27" />
          {[0, 1, 2].map((i) => <g key={`power-screw-${i}`}><circle cx={41 + i * 20} cy={66} r={4} fill="#b8c1c4" stroke="#47525a" /><path d={`M38 ${66} H44`} stroke="#42494e" strokeWidth={1} /></g>)}
          <text x={60} y={54} fontSize={3.5} textAnchor="middle" fill="#edf4ee">L298N DUAL H-BRIDGE</text>
          <text x={60} y={82} fontSize={3.2} textAnchor="middle" fill="#e4f1e9">ENA · IN1 · IN2 · IN3 · IN4 · ENB</text>
        </g>
      ) : null}
      {driver === 'tb6612fng' ? (
        <g>
          <path d="M18 20 H40 M80 20 H101 M20 67 H42 M78 67 H100" fill="none" stroke="#d1b558" strokeWidth={1} opacity={0.8} />
          <rect x={40} y={23} width={40} height={34} rx={3} fill="#171b20" stroke="#79838b" strokeWidth={1} />
          <text x={60} y={39} fontSize={4.8} textAnchor="middle" fill="#dfe6ee">TB6612</text>
          <text x={60} y={47} fontSize={3.3} textAnchor="middle" fill="#9eabb8">FNG</text>
          {[0, 1, 2, 3].map((i) => <rect key={`ic-leg-${i}`} x={43 + i * 9} y={20} width={4} height={3} fill="#c7ccd3" />)}
          {[0, 1, 2, 3].map((i) => <rect key={`ic-leg-b-${i}`} x={43 + i * 9} y={57} width={4} height={3} fill="#c7ccd3" />)}
          <rect x={8} y={27} width={17} height={29} rx={2} fill="#166246" stroke="#0b3828" />
          <rect x={95} y={27} width={17} height={29} rx={2} fill="#166246" stroke="#0b3828" />
          <circle cx={16.5} cy={36} r={3.5} fill="#b8c1c4" stroke="#47525a" /><circle cx={16.5} cy={48} r={3.5} fill="#b8c1c4" stroke="#47525a" />
          <circle cx={103.5} cy={36} r={3.5} fill="#b8c1c4" stroke="#47525a" /><circle cx={103.5} cy={48} r={3.5} fill="#b8c1c4" stroke="#47525a" />
          <rect x={84} y={8} width={14} height={10} rx={2} fill="#c7ccd3" stroke="#616a73" />
          <text x={60} y={75} fontSize={3.3} textAnchor="middle" fill="#edf4ee">DUAL DC MOTOR DRIVER</text>
          <circle cx={30} cy={29} r={2} fill="#d7e2e8" /><circle cx={90} cy={62} r={2} fill="#d7e2e8" />
        </g>
      ) : null}
      {variant === 'dht' ? (
        <g>
          <rect x={10} y={8} width={def.w - 20} height={def.h - 30} rx={2} fill="#eef2f6" stroke="#8a95a3" />
          <rect x={14} y={12} width={def.w - 28} height={10} fill="#c8d6e5" />
          <text x={def.w / 2} y={def.h - 26} fontSize={3.6} textAnchor="middle" fill="#213547">{def.partNumber}</text>
          <text x={def.w / 2} y={22} fontSize={4} textAnchor="middle" fill="#213547">{`${num(comp.props.celsius, 24).toFixed(1)}°C`}</text>
        </g>
      ) : null}
      {variant === 'hcsr04' ? (
        <g>
          <circle cx={18} cy={20} r={12} fill="#c7ccd3" stroke="#6b7280" />
          <circle cx={18} cy={20} r={7} fill="#2f3640" />
          <circle cx={def.w - 22} cy={20} r={12} fill="#c7ccd3" stroke="#6b7280" />
          <circle cx={def.w - 22} cy={20} r={7} fill="#2f3640" />
        </g>
      ) : null}
      {variant === 'pir' ? <circle cx={def.w / 2} cy={20} r={14} fill="#eef2f6" stroke="#6b7280" opacity={0.9} /> : null}
      {variant === 'ir' ? <circle cx={def.w / 2} cy={16} r={9} fill="#2b2b33" stroke="#6b7280" /> : null}
      {variant === 'mpu6050' || variant === 'bmp280' ? <rect x={20} y={10} width={def.w - 40} height={def.h - 36} rx={2} fill="#2d2f36" /> : null}
      {variant === 'soil' ? <rect x={def.w / 2 - 6} y={6} width={12} height={34} fill="#9aa3ad" stroke="#4b5563" /> : null}
      {variant === 'mq' ? <circle cx={def.w / 2} cy={22} r={12} fill="#c7ccd3" stroke="#6b7280" /> : null}
      {variant === 'touch' ? <circle cx={def.w / 2} cy={20} r={12} fill="#d6dbe1" stroke="#6b7280" /> : null}
      {variant === 'ldr-module' ? <ellipse cx={def.w / 2} cy={18} rx={10} ry={8} fill="#c9a36b" stroke="#6b4a1e" /> : null}
      {def.id === 'relay-5v' ? <rect x={10} y={8} width={def.w - 20} height={def.h - 36} fill="#1f5bb0" stroke="#0b2d5f" /> : null}
      {variant === 'nrf24' ? <rect x={8} y={6} width={def.w - 16} height={22} fill="#252a33" /> : null}
      {variant === 'rfid' ? <rect x={8} y={6} width={def.w - 16} height={def.h - 30} fill="#243b5c" /> : null}
      {variant === 'gps' ? <rect x={8} y={6} width={def.w - 16} height={def.h - 30} fill="#c7ccd3" stroke="#6b7280" /> : null}
      {variant === 'hc05' ? <rect x={8} y={6} width={def.w - 16} height={def.h - 30} fill="#2c4f9b" /> : null}
      {hasMarker ? <circle cx={8} cy={8} r={1.4} fill="#e5e9ee" /> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function OledArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const lines = (sim?.text ?? str(comp.props.text, '')).split('\n').slice(0, 6);
  return (
    <g>
      <rect x={2} y={2} width={def.w - 4} height={def.h - 4} rx={5} fill="#1d3b63" stroke="#0a1f36" />
      <rect x={10} y={10} width={def.w - 20} height={60} rx={2} fill="#05080c" />
      {lines.map((l, i) => (
        <text key={i} x={14} y={22 + i * 9} fontSize={6} fill="#7ef2ff" style={{ fontFamily: 'monospace' }}>
          {l.slice(0, 16)}
        </text>
      ))}
      <text x={def.w / 2} y={def.h - 20} fontSize={4} textAnchor="middle" fill="#dbe6f2">SSD1306 0.96″</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function LcdArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const i2c = def.id === 'lcd-i2c';
  const l1 = (sim?.text ?? '').split('\n')[0] ?? str(comp.props.line1);
  const l2 = (sim?.text ?? '').split('\n')[1] ?? str(comp.props.line2);
  const bl = sim?.on === false ? '#2a4a3a' : '#7bd389';
  return (
    <g>
      <rect x={2} y={2} width={def.w - 4} height={def.h - 16} rx={4} fill={i2c ? '#0d4d6b' : '#1f6b4f'} stroke="#062a1d" />
      <rect x={14} y={12} width={def.w - 28} height={def.h - 36} rx={3} fill={bl} stroke="#2f5f45" />
      <text x={20} y={34} fontSize={8} fill="#0b2a1b" style={{ fontFamily: 'monospace' }}>{l1.slice(0, 16)}</text>
      <text x={20} y={47} fontSize={8} fill="#0b2a1b" style={{ fontFamily: 'monospace' }}>{l2.slice(0, 16)}</text>
      {i2c ? <rect x={def.w - 30} y={def.h - 38} width={22} height={10} fill="#1a1a1a" /> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

const SEG_MAP: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  A: 'abcefg',
  B: 'fedcg',
  C: 'adef',
  D: 'bcdeg',
  E: 'adefg',
  F: 'aefg'
};

function SevenSegArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const digit = (sim?.digit ?? str(comp.props.digit, '8')).toUpperCase();
  const lit = new Set((SEG_MAP[digit] ?? '').split(''));
  const seg = (on: boolean, d: string) => <path d={d} fill={on ? '#ff3b2f' : '#2a1412'} key={d} />;
  return (
    <g>
      <rect x={2} y={2} width={def.w - 4} height={def.h - 4} rx={4} fill="#1b1f25" stroke="#0a0c0f" />
      {seg(lit.has('a'), 'M14 16 H42 L38 20 H18 Z')}
      {seg(lit.has('b'), 'M44 18 H48 V52 H44 L42 50 V20 Z')}
      {seg(lit.has('c'), 'M44 56 H48 V90 H44 L42 88 V58 Z')}
      {seg(lit.has('d'), 'M14 92 H42 L38 88 H18 Z')}
      {seg(lit.has('e'), 'M12 56 H16 V90 H12 L10 88 V58 Z')}
      {seg(lit.has('f'), 'M12 18 H16 V52 L14 54 H10 V20 Z')}
      {seg(lit.has('g'), 'M16 54 H42 L38 58 H20 Z')}
      <circle cx={52} cy={90} r={2.5} fill={lit.size === 0 ? '#2a1412' : '#ff3b2f'} />
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function BuzzerArt({ def, comp, sim, hoverPin, connectedPins, simTime }: ArtProps) {
  const active = sim?.on || (sim?.speed ?? 0) > 0.05;
  const t = simTime ?? 0;
  return (
    <g>
      <circle cx={20} cy={18} r={15} fill="#1d1f24" stroke="#0a0c0f" />
      <circle cx={20} cy={18} r={9} fill="#2e3340" />
      <circle cx={20} cy={18} r={3} fill="#c7ccd3" />
      {active
        ? [1, 2, 3].map((i) => (
            <circle key={i} cx={20} cy={18} r={15 + i * 4 + ((t * 40) % 6)} fill="none" stroke="#f2c230" strokeWidth={0.8} opacity={0.6 - i * 0.15} />
          ))
        : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function ServoArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const angle = sim?.angle ?? num(comp.props.angle, 90);
  const large = def.id === 'servo-mg996r';
  const bodyX = large ? 8 : 4;
  const bodyY = 5;
  const bodyW = def.w - bodyX * 2;
  const bodyH = def.h - 20;
  const cx = def.w / 2;
  const cy = bodyY + bodyH / 2;
  const hornRadius = Math.min(bodyW, bodyH) * (large ? 0.34 : 0.39);
  const leadPins = [
    { id: 'brown', color: '#553d2d' },
    { id: 'red', color: '#d94136' },
    { id: 'orange', color: '#ed9a36' }
  ];
  return (
    <g>
      {/* Moulded case and integral mounting tabs. */}
      <rect x={0} y={cy - 7} width={bodyX + 3} height={14} rx={3} fill="#263f6e" stroke="#11294e" />
      <rect x={def.w - bodyX - 3} y={cy - 7} width={bodyX + 3} height={14} rx={3} fill="#263f6e" stroke="#11294e" />
      {[8, def.w - 8].map((x, i) => <circle key={`mount-${i}`} cx={x} cy={cy} r={2.2} fill="#101827" stroke="#8194ad" strokeWidth={0.7} />)}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={large ? 5 : 3} fill="#2461ae" stroke="#0b2d5f" strokeWidth={1.2} />
      <rect x={bodyX + 3} y={bodyY + 3} width={bodyW - 6} height={bodyH - 6} rx={large ? 4 : 2} fill="#3175c5" stroke="#5790ce" strokeWidth={0.7} />
      <path d={`M${bodyX + 3} ${cy + bodyH * 0.24} H${def.w - bodyX - 3}`} stroke="#194a8b" strokeWidth={1} />
      <rect x={cx - bodyW * 0.23} y={bodyY + 6} width={bodyW * 0.46} height={Math.max(7, bodyH * 0.2)} rx={2} fill="#184782" stroke="#0e315d" strokeWidth={0.6} />
      <text x={cx} y={bodyY + Math.max(12, bodyH * 0.2)} fontSize={large ? 4.3 : 3.8} textAnchor="middle" fill="#dbeafe">{large ? 'MG996R' : 'SG90'}</text>
      <text x={cx} y={bodyY + bodyH - 4} fontSize={large ? 3.4 : 3.1} textAnchor="middle" fill="#c7def9">{large ? 'METAL GEAR SERVO' : 'MICRO SERVO'}</text>
      {/* Output spline, horn, and retaining screw move with the simulated angle. */}
      <circle cx={cx} cy={cy} r={hornRadius + 4} fill="#193c6e" stroke="#8da7c5" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={hornRadius + 1.5} fill="#dfe5ec" stroke="#929ca7" strokeWidth={0.7} />
      <g transform={`rotate(${angle - 90} ${cx} ${cy})`}>
        <rect x={cx - 2.6} y={cy - hornRadius - 1.5} width={5.2} height={hornRadius * 2 + 3} rx={2.4} fill="#f0f2f4" stroke="#7e8790" strokeWidth={0.7} />
        <circle cx={cx} cy={cy - hornRadius + 2.5} r={2} fill="#858d96" stroke="#f7f8f9" strokeWidth={0.7} />
      </g>
      <circle cx={cx} cy={cy} r={3.2} fill="#d5d9de" stroke="#79818a" strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={1.1} fill="#535b64" />
      {leadPins.map((lead, i) => {
        const pin = def.pins.find((p) => p.id === lead.id);
        return pin ? <path key={lead.id} d={`M${pin.x} ${bodyY + bodyH} L${pin.x} ${pin.y - 2}`} stroke={lead.color} strokeWidth={1.5} /> : null;
      })}
      <text x={cx} y={def.h - 4} fontSize={4} textAnchor="middle" fill="currentColor">{`${Math.round(angle)}°`}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function MotorArt({ def, comp, sim, hoverPin, connectedPins, simTime }: ArtProps) {
  const speed = Math.max(0, Math.min(1, sim?.speed ?? 0));
  const direction = sim?.direction ?? 1;
  const period = speed > 0.01 ? 1 / (speed * 12) : 0;
  const t = simTime ?? 0;
  const rot = period > 0 ? (((t % period) / period) * 360 * direction) : 0;
  const isTT = def.id === 'dc-motor';
  const isCan = def.id === 'dc-motor-130';
  const isGearmotor = def.id === 'micro-metal-gearmotor';
  const isVibration = def.id === 'vibration-motor-coin';
  const isFan = def.id === 'dc-motor-fan';
  const isStepper = def.id === 'stepper-28byj';
  return (
    <g>
      {isTT ? (
        <g>
          {/* Yellow TT gearbox with a silver 130-size motor can and plastic output hub. */}
          <rect x={5} y={15} width={43} height={20} rx={4} fill="#d5a51c" stroke="#795d11" strokeWidth={1.2} />
          <rect x={8} y={18} width={36} height={14} rx={3} fill="#edc33a" stroke="#f7dc77" strokeWidth={0.7} />
          <path d="M10 17 V33 M16 16 V34 M22 16 V34 M28 16 V34 M34 16 V34 M40 17 V33" stroke="#a87c13" strokeWidth={0.8} opacity={0.7} />
          <rect x={11} y={5} width={25} height={15} rx={7} fill="#9fa7af" stroke="#555d65" strokeWidth={1} />
          <rect x={14} y={7} width={16} height={11} rx={5} fill="#c9cfd4" stroke="#77818a" strokeWidth={0.6} />
          <path d="M17 7 V18 M21 6 V19 M25 6 V19 M29 7 V18" stroke="#8b949d" strokeWidth={0.65} />
          <rect x={45} y={20} width={9} height={10} rx={2} fill="#f2d252" stroke="#795d11" />
          <rect x={52} y={22} width={8} height={6} rx={2} fill="#f4f5f6" stroke="#8e969d" />
          <circle cx={48} cy={25} r={3.8} fill="#d29e1b" stroke="#795d11" />
          <circle cx={48} cy={25} r={1.4} fill="#fff0a1" />
          <path d="M17 35 L14 40 M34 35 L36 40" stroke="#d7dce1" strokeWidth={1.6} />
          <text x={27} y={29} fontSize={3.3} textAnchor="middle" fill="#5c4710">TT 6V</text>
        </g>
      ) : null}
      {isCan ? (
        <g>
          {/* Cylindrical 130 brushed motor: rolled can, end cap, brush tabs and steel shaft. */}
          <rect x={7} y={14} width={50} height={38} rx={18} fill="#aeb5bb" stroke="#4b535b" strokeWidth={1.2} />
          <rect x={10} y={16} width={42} height={34} rx={16} fill="#cbd0d4" stroke="#eef0f1" strokeWidth={0.6} />
          <path d="M17 17 V49 M22 16 V50 M27 16 V50 M32 16 V50 M37 16 V50 M42 17 V49" stroke="#9ba3aa" strokeWidth={0.8} opacity={0.8} />
          <rect x={6} y={20} width={10} height={25} rx={4} fill="#39414a" stroke="#171b20" />
          <circle cx={10} cy={24} r={2} fill="#d54e42" /><circle cx={10} cy={40} r={2} fill="#343a40" />
          <rect x={52} y={26} width={10} height={8} rx={2} fill="#d7dce0" stroke="#59636b" />
          <rect x={59} y={28} width={9} height={4} rx={1.5} fill="#eff1f2" stroke="#8b949b" strokeWidth={0.5} />
          <text x={32} y={37} fontSize={4.2} textAnchor="middle" fill="#535b63">130</text>
          <text x={31} y={45} fontSize={3} textAnchor="middle" fill="#686f75">3–6 V</text>
        </g>
      ) : null}
      {isGearmotor ? (
        <g>
          {/* Polished N20 can, reduction gearbox and keyed output shaft. */}
          <rect x={5} y={17} width={44} height={28} rx={13} fill="#adb5bc" stroke="#555e66" strokeWidth={1.1} />
          <rect x={8} y={19} width={36} height={24} rx={11} fill="#d2d7db" stroke="#eef0f2" strokeWidth={0.6} />
          {[0, 1, 2, 3].map((i) => <path key={`rib-${i}`} d={`M${16 + i * 6} 20 V42`} stroke="#a1a9b0" strokeWidth={0.8} />)}
          <rect x={42} y={12} width={28} height={38} rx={4} fill="#c69a38" stroke="#735719" strokeWidth={1.2} />
          <rect x={46} y={16} width={20} height={30} rx={3} fill="#dfb64c" stroke="#f4d278" strokeWidth={0.7} />
          <circle cx={57} cy={31} r={7} fill="#c28d27" stroke="#805f1d" />
          <circle cx={57} cy={31} r={3} fill="#f2d57b" />
          <rect x={65} y={27} width={18} height={8} rx={2} fill="#cfd5da" stroke="#67717a" />
          <rect x={80} y={29} width={8} height={4} rx={1.3} fill="#eff1f2" stroke="#88919a" strokeWidth={0.5} />
          <text x={27} y={34} fontSize={3.7} textAnchor="middle" fill="#545d64">N20</text>
          <path d="M16 45 L13 51 M37 45 L40 51" stroke="#d8dde1" strokeWidth={1.5} />
        </g>
      ) : null}
      {isVibration ? (
        <g>
          {/* Flat coin-can ERM motor with eccentric rotor visible through its cap. */}
          <circle cx={25} cy={24} r={20} fill="#9da5ac" stroke="#4c545c" strokeWidth={1.3} />
          <circle cx={25} cy={24} r={17} fill="#c9ced2" stroke="#eef0f1" strokeWidth={0.7} />
          <circle cx={25} cy={24} r={12} fill="#8f989f" stroke="#5c656d" strokeWidth={0.8} />
          <g transform={`rotate(${rot} 25 24)`}>
            <path d="M25 24 L25 8 Q36 9 37 19 Q34 24 25 24 Z" fill="#38414a" stroke="#171b20" strokeWidth={0.7} />
            <circle cx={31} cy={16} r={3} fill="#6f7880" />
          </g>
          <circle cx={25} cy={24} r={3.5} fill="#d9dddf" stroke="#59626a" />
          <path d="M12 7 L8 3 M38 7 L42 3" stroke="#d74439" strokeWidth={1.2} />
          <text x={25} y={47} fontSize={3} textAnchor="middle" fill="#515961">ERM · 3V</text>
        </g>
      ) : null}
      {isFan ? (
        <g>
          {/* Guard rim, rotating three-blade rotor and a small brushed motor housing. */}
          <circle cx={35} cy={27} r={23} fill="#c4c9ce" stroke="#555e66" strokeWidth={1.4} />
          <circle cx={35} cy={27} r={20} fill="#eef0f2" stroke="#87919a" strokeWidth={0.7} />
          <g transform={`rotate(${rot} 35 27)`}>
            <path d="M35 27 C31 20 27 11 31 7 C38 7 41 16 39 25 Z" fill="#65a9d8" stroke="#3477a5" strokeWidth={0.7} />
            <path d="M35 27 C43 25 53 24 56 29 C54 35 44 36 36 31 Z" fill="#65a9d8" stroke="#3477a5" strokeWidth={0.7} />
            <path d="M35 27 C34 35 32 45 27 47 C21 43 25 34 31 27 Z" fill="#65a9d8" stroke="#3477a5" strokeWidth={0.7} />
          </g>
          <circle cx={35} cy={27} r={5} fill="#aeb5bb" stroke="#53606b" strokeWidth={0.8} />
          <circle cx={35} cy={27} r={1.6} fill="#45505a" />
          <rect x={27} y={48} width={16} height={14} rx={5} fill="#959ea6" stroke="#4b535b" />
          <rect x={31} y={57} width={8} height={8} rx={2} fill="#d1d6da" stroke="#59636b" />
          <text x={35} y={67} fontSize={3} textAnchor="middle" fill="#555e66">5V FAN</text>
        </g>
      ) : null}
      {isStepper ? (
        <g>
          {/* 28BYJ motor can and gearbox, mounted beside the four-channel driver PCB. */}
          <rect x={4} y={5} width={82} height={48} rx={4} fill="#176447" stroke="#083925" strokeWidth={1} />
          <path d="M8 9 H82 M8 48 H82" stroke="#4d9870" strokeWidth={0.6} />
          <rect x={9} y={16} width={27} height={25} rx={3} fill="#15191e" stroke="#75818a" />
          <text x={22.5} y={27} fontSize={3.3} textAnchor="middle" fill="#dfe6ee">ULN</text>
          <text x={22.5} y={33} fontSize={3} textAnchor="middle" fill="#aeb8c2">2003</text>
          <circle cx={15} cy={12} r={1.5} fill="#f04d3d" /><circle cx={24} cy={12} r={1.5} fill="#e4bf3d" /><circle cx={33} cy={12} r={1.5} fill="#42c878" />
          <rect x={39} y={10} width={27} height={34} rx={12} fill="#224c83" stroke="#101b2a" strokeWidth={1.1} />
          <path d="M43 12 V42 M48 11 V43 M53 11 V43 M58 12 V42" stroke="#4672a6" strokeWidth={0.7} />
          <rect x={61} y={16} width={18} height={22} rx={4} fill="#d5d8db" stroke="#69737b" />
          <circle cx={70} cy={27} r={5} fill="#b8bec2" stroke="#858e94" />
          <rect x={77} y={24} width={10} height={6} rx={2} fill="#e2e5e7" stroke="#7f8990" />
          <text x={52} y={50} fontSize={3.2} textAnchor="middle" fill="#eaf4ee">28BYJ-48 · 5V</text>
        </g>
      ) : null}
      {speed > 0.02 ? <text x={def.w / 2} y={def.h - 5} fontSize={4} textAnchor="middle" fill="currentColor">{`${Math.round(speed * 100)}%`}</text> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function SwitchArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  const closed = def.id === 'pushbutton' ? Boolean(comp.props.pressed) : def.id === 'dip-switch' ? false : Boolean(comp.props.closed);
  const isSPDT = def.id === 'switch-spdt';
  const posNO = comp.props.position === 'no';
  return (
    <g>
      {def.id === 'pushbutton' ? (
        <g>
          <rect x={4} y={4} width={32} height={32} rx={3} fill="#2f3640" stroke="#0a0c0f" />
          <circle cx={20} cy={20} r={closed ? 7 : 9} fill={closed ? '#e0412f' : '#ef6a5b'} stroke="#7a1f16" />
        </g>
      ) : def.id === 'dip-switch' ? (
        <g>
          <rect x={2} y={2} width={56} height={36} rx={3} fill="#1d3b63" stroke="#0a1f36" />
          {[0, 1, 2, 3].map((i) => {
            const on = Boolean(comp.props[`sw${i + 1}`]);
            return (
              <g key={i}>
                <rect x={8 + i * 12} y={on ? 8 : 18} width={6} height={10} fill="#e5e9ee" />
                <text x={11 + i * 12} y={33} fontSize={3.4} textAnchor="middle" fill="#dbe6f2">{i + 1}</text>
              </g>
            );
          })}
        </g>
      ) : (
        <g>
          <rect x={4} y={isSPDT ? 6 : 4} width={def.w - 8} height={isSPDT ? 18 : 24} rx={3} fill="#2f3640" stroke="#0a0c0f" />
          {isSPDT ? (
            <line x1={10} y1={20} x2={posNO ? 20 : 40} y2={10} stroke="#e5e9ee" strokeWidth={4} strokeLinecap="round" />
          ) : (
            <line x1={10} y1={20} x2={closed ? 30 : 10} y2={closed ? 2 : 12} stroke="#e5e9ee" strokeWidth={3} strokeLinecap="round" />
          )}
        </g>
      )}
      {def.id !== 'dip-switch' ? <text x={def.w / 2} y={def.h - 2} fontSize={3.4} textAnchor="middle" fill="currentColor">{def.id === 'pushbutton' ? (closed ? 'PRESSED' : 'OPEN') : closed ? 'ON' : 'OFF'}</text> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {def.id === 'pushbutton' ? null : edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function BatteryArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const volts = num(comp.props.volts, def.id === 'battery-9v' ? 9 : 6);
  const is9v = def.family === 'battery-9v';
  const warn = sim?.burnt;
  return (
    <g>
      {is9v ? (
        <g>
          <rect x={4} y={4} width={62} height={38} rx={5} fill={warn ? '#3a2b1a' : '#1f2a1f'} stroke="#0a0c0f" />
          <rect x={20} y={10} width={26} height={22} rx={2} fill="#cfd4da" />
          <text x={33} y={24} fontSize={6} textAnchor="middle" fill="#111">{`${volts}V`}</text>
          <circle cx={12} cy={10} r={3} fill="#c7ccd3" />
          <circle cx={58} cy={10} r={3} fill="#c7ccd3" />
          <text x={12} y={44} fontSize={4.4} fill="#f2c230">+</text>
          <text x={60} y={44} fontSize={4.4} fill="#7fb2ff">−</text>
        </g>
      ) : (
        <g>
          <rect x={4} y={4} width={def.w - 8} height={def.h - 14} rx={4} fill={def.family === 'battery-pack' && def.id === 'battery-aa4' ? '#2a3b4f' : '#2f3a46'} stroke="#0a0c0f" />
          <text x={def.w / 2} y={28} fontSize={6} textAnchor="middle" fill="#e6ecf2">{def.id === 'lipo-37' ? `${volts.toFixed(2)}V` : `${volts}V`}</text>
          <text x={def.w / 2} y={37} fontSize={3.6} textAnchor="middle" fill="#9aa6b2">{def.id === 'lipo-37' ? '1S LiPo' : '4 × AA'}</text>
        </g>
      )}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function UsbArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  return (
    <g>
      <rect x={4} y={4} width={def.w - 8} height={30} rx={3} fill="#e6ecf2" stroke="#7a8794" />
      <rect x={18} y={12} width={24} height={14} fill="#3b3f47" />
      <text x={def.w / 2} y={def.h - 2} fontSize={4} textAnchor="middle" fill="currentColor">USB 5V</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function SupplyArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  const volts = num(comp.props.volts, 5);
  const isGen = def.model.type === 'source' && def.model.ac;
  return (
    <g>
      <rect x={4} y={4} width={def.w - 8} height={def.h - 14} rx={4} fill="#1f2630" stroke="#0a0c0f" />
      <rect x={10} y={10} width={def.w - 20} height={16} fill="#05080c" />
      {isGen ? (
        <path d={`M12 18 q 6 -8 12 0 t 12 0 t 12 0 t 12 0`} fill="none" stroke="#7ef2ff" strokeWidth={1.2} />
      ) : (
        <text x={def.w / 2} y={22} fontSize={7} textAnchor="middle" fill="#7ef2ff" style={{ fontFamily: 'monospace' }}>{`${volts.toFixed(1)}V`}</text>
      )}
      <text x={def.w / 2} y={def.h - 16} fontSize={3.8} textAnchor="middle" fill="#dbe6f2">{def.partNumber}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function JumperArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  const color = WIRE_COLORS[str(comp.props.color, 'blue')] ?? WIRE_COLORS.blue;
  return (
    <g>
      <path d="M0 10 Q30 -2 60 10" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M0 10 Q30 -2 60 10" fill="none" stroke="#fff" strokeWidth={0.6} opacity={0.35} />
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function SymbolArt({ def, comp, hoverPin, connectedPins }: ArtProps) {
  const isGnd = def.model.type === 'gnd';
  return (
    <g>
      {isGnd ? (
        <g>
          <path d="M10 0 V10" stroke="#c3c9d1" strokeWidth={1.4} />
          <path d="M2 10 H18 M5 14 H15 M8 18 H12" stroke="#e5e9ee" strokeWidth={1.6} />
          <text x={22} y={18} fontSize={4} fill="#e5e9ee">GND</text>
        </g>
      ) : (
        <g>
          <path d="M10 20 V10" stroke="#c3c9d1" strokeWidth={1.4} />
          <path d="M4 10 H16" stroke="#f08a2c" strokeWidth={1.6} />
          <text x={20} y={12} fontSize={4} fill="#f08a2c">VCC</text>
        </g>
      )}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
    </g>
  );
}

function BreadboardArt({ def, hoverPin, connectedPins }: ArtProps) {
  const holes = def.pins.filter((p) => isHolePin(p.id));
  const mini = def.family === 'breadboard-mini';
  const channelY = mini ? def.h / 2 : def.h / 2;
  return (
    <g>
      {/* Moulded plastic body with a raised, lightly textured contact deck. */}
      <rect x={0} y={2} width={def.w} height={def.h - 2} rx={8} fill="#c9c6bc" stroke="#989486" strokeWidth={1.2} />
      <rect x={3} y={1} width={def.w - 6} height={def.h - 7} rx={7} fill="#f0ede5" stroke="#b8b3a6" strokeWidth={0.8} />
      <rect x={7} y={5} width={def.w - 14} height={def.h - 15} rx={5} fill="#f8f6ef" stroke="#ded9cc" strokeWidth={0.7} />
      {!mini ? (
        <g>
          <rect x={6} y={5} width={def.w - 12} height={24} rx={2} fill="#eeeae0" />
          <rect x={6} y={def.h - 31} width={def.w - 12} height={24} rx={2} fill="#eeeae0" />
          <line x1={12} x2={def.w - 12} y1={4} y2={4} stroke="#d6372d" strokeWidth={1.2} />
          <line x1={12} x2={def.w - 12} y1={27} y2={27} stroke="#356dba" strokeWidth={1.2} />
          <line x1={12} x2={def.w - 12} y1={def.h - 28} y2={def.h - 28} stroke="#d6372d" strokeWidth={1.2} />
          <line x1={12} x2={def.w - 12} y1={def.h - 5} y2={def.h - 5} stroke="#356dba" strokeWidth={1.2} />
          <rect x={4} y={channelY - 12} width={def.w - 8} height={24} rx={3} fill="#d7d3c9" stroke="#c6c1b5" strokeWidth={0.6} />
          <rect x={6} y={channelY - 8} width={def.w - 12} height={16} rx={2} fill="#b8b4aa" opacity={0.45} />
          <text x={10} y={17} fontSize={5.5} fill="#c0392b">+</text>
          <text x={10} y={27} fontSize={5.5} fill="#2f6fd6">−</text>
          <text x={def.w - 13} y={17} fontSize={5} fill="#c0392b">+</text>
          <text x={def.w - 13} y={27} fontSize={5} fill="#2f6fd6">−</text>
          {Array.from({ length: Math.ceil(holes.length / 14) }).map((_, i) => {
            const col = i + 1;
            if (col % 5 !== 0 && col !== 1) return null;
            const x = 20 + (col - 1) * 10;
            return <text key={`col-${col}`} x={x} y={44} fontSize={3.4} textAnchor="middle" fill="#8b867a">{col}</text>;
          })}
        </g>
      ) : (
        <g>
          <rect x={8} y={10} width={def.w - 16} height={def.h - 20} rx={4} fill="#f5f2e9" stroke="#ded9cc" strokeWidth={0.6} />
          <rect x={8} y={channelY - 8} width={def.w - 16} height={16} rx={3} fill="#d3cfc5" stroke="#c2bdb1" strokeWidth={0.5} />
          <rect x={10} y={channelY - 5} width={def.w - 20} height={10} rx={2} fill="#b8b4aa" opacity={0.35} />
          {['a', 'b', 'c', 'd', 'e'].map((row, i) => (
            <g key={`mini-row-${row}`}>
              <text x={11} y={23 + i * 10} fontSize={3.8} textAnchor="middle" fill="#8c877b">{row.toUpperCase()}</text>
              <text x={11} y={93 + i * 10} fontSize={3.8} textAnchor="middle" fill="#8c877b">{String.fromCharCode(70 + i)}</text>
            </g>
          ))}
          <text x={def.w - 10} y={13} fontSize={3.3} textAnchor="end" fill="#8c877b">170 POINTS</text>
        </g>
      )}
      {/* Recessed spring contacts: ring, dark socket, and a tiny highlight. */}
      {holes.map((p) => {
        const isRail = p.id.startsWith('r');
        const hovered = hoverPin === p.id;
        const wired = connectedPins?.has(p.id);
        const radius = hovered ? 3.4 : isRail ? 2.2 : 2;
        return (
          <g key={p.id} data-pin={p.id}>
            <circle cx={p.x} cy={p.y} r={radius + 0.75} fill={hovered ? '#e6ba54' : '#d8d3c6'} stroke={hovered ? '#8a5a00' : '#c0baad'} strokeWidth={0.45} />
            <circle cx={p.x} cy={p.y} r={radius} fill={hovered ? '#f4b942' : wired ? '#49545d' : '#272b30'} stroke={hovered ? '#8a5a00' : '#6e6a61'} strokeWidth={0.45} />
            <circle cx={p.x - 0.65} cy={p.y - 0.65} r={0.55} fill={hovered ? '#ffe09a' : '#79828a'} opacity={0.75} />
          </g>
        );
      })}
      <text x={def.w / 2} y={mini ? def.h - 7 : channelY + 3} fontSize={mini ? 4 : 5} textAnchor="middle" fill="#817b70" style={{ letterSpacing: mini ? 1.5 : 5 }}>
        {mini ? 'MINI BREADBOARD' : def.family === 'breadboard-half' ? 'HALF BREADBOARD' : 'SOLDERLESS BREADBOARD'}
      </text>
    </g>
  );
}

function PerfArt({ def, hoverPin, connectedPins }: ArtProps) {
  const isStrip = def.id === 'stripboard';
  return (
    <g>
      <rect x={0} y={0} width={def.w} height={def.h} rx={3} fill={isStrip ? '#b68452' : '#c9955c'} stroke="#7a5230" />
      {isStrip
        ? Array.from({ length: 20 }).map((_, r) => <rect key={r} x={6} y={6 + r * 10 - 3} width={def.w - 12} height={6} fill="#d8a46b" opacity={0.7} />)
        : null}
      {def.pins.map((p) => {
        const hovered = hoverPin === p.id;
        return (
          <circle key={p.id} data-pin={p.id} cx={p.x} cy={p.y} r={hovered ? 3.4 : 2.1} fill={hovered ? '#f4b942' : connectedPins?.has(p.id) ? '#dfe5ea' : '#e0b98a'} stroke="#6b3f1e" strokeWidth={0.5} />
        );
      })}
      <text x={def.w / 2} y={def.h - 4} fontSize={4} textAnchor="middle" fill="#fff8ec" opacity={0.85}>
        {def.name}
      </text>
    </g>
  );
}

function BoardArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const isNano = def.id === 'arduino-nano';
  const isUno = def.id === 'arduino-uno';
  const isMega = def.id === 'arduino-mega-2560';
  const isPico = def.id === 'rpi-pico';
  const isS3 = def.id === 'esp32-s3-devkitc';
  const isESP = def.id.startsWith('esp32') || def.id.startsWith('nodemcu');
  const isBlue = def.id === 'stm32-bluepill';
  const body = def.art?.bodyColor ?? '#1d6f93';
  const shapeW = def.w;
  const shapeH = def.h;
  const ledOn = (pin: string) => {
    const v = sim?.pinV?.[pin];
    return v !== undefined ? v > 1.5 : false;
  };
  const mountPoints = isUno || isMega
    ? [
        { x: 38, y: 38 },
        { x: shapeW - 38, y: 38 },
        { x: 38, y: shapeH - 38 },
        { x: shapeW - 38, y: shapeH - 38 }
      ]
    : [];
  return (
    <g>
      {/* Fibreglass PCB, solder-mask face and routed board edge. */}
      <rect x={-4} y={-4} width={shapeW + 8} height={shapeH + 8} rx={isUno || isMega ? 7 : 5} fill={body} stroke="#0c2a3d" strokeWidth={1.4} />
      <rect x={1} y={1} width={shapeW - 2} height={shapeH - 2} rx={isUno || isMega ? 5 : 3} fill="none" stroke="#7db39a" strokeWidth={0.8} opacity={0.45} />
      {mountPoints.map((p, i) => (
        <g key={`mount-${i}`}>
          <circle cx={p.x} cy={p.y} r={6} fill="#0c3327" stroke="#9aa6a1" strokeWidth={1.3} />
          <circle cx={p.x} cy={p.y} r={2.6} fill="#d0d4d2" />
        </g>
      ))}
      {/* USB and external power connectors. */}
      {def.art?.usb ? (
        isUno || isMega ? (
          <g>
            <rect x={-11} y={shapeH / 2 - 15} width={23} height={30} rx={2} fill="#c8cdd2" stroke="#66717d" strokeWidth={1.4} />
            <rect x={-8} y={shapeH / 2 - 10} width={16} height={20} rx={1} fill="#303841" stroke="#edf0f2" strokeWidth={0.7} />
            <rect x={15} y={16} width={24} height={25} rx={4} fill="#161b20" stroke="#7c858c" strokeWidth={1.5} />
            <circle cx={27} cy={28.5} r={6.2} fill="#050709" stroke="#c0c7cd" strokeWidth={2} />
          </g>
        ) : (
          <g>
            <rect x={shapeW / 2 - (isPico ? 14 : 13)} y={-10} width={isPico ? 28 : 26} height={12} rx={2} fill="#c8cdd2" stroke="#66717d" strokeWidth={1.2} />
            <rect x={shapeW / 2 - (isPico ? 9 : 9)} y={-7} width={18} height={6} rx={1.5} fill="#323941" />
          </g>
        )
      ) : null}
      {/* Uno R3: USB serial interface, ATmega socket, crystal and power section. */}
      {isUno ? (
        <g>
          <rect x={84} y={70} width={69} height={70} rx={3} fill="#171b20" stroke="#56616d" strokeWidth={1} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={`uno-dip-${i}`}>
              <rect x={80} y={76 + i * 10} width={4} height={6} fill="#c6ccd3" />
              <rect x={153} y={76 + i * 10} width={4} height={6} fill="#c6ccd3" />
            </g>
          ))}
          <rect x={94} y={89} width={49} height={28} rx={2} fill="#20252b" />
          <text x={118} y={105} fontSize={5} textAnchor="middle" fill="#dfe6ee">ATmega328P</text>
          <text x={118} y={112} fontSize={3.2} textAnchor="middle" fill="#aeb8c2">16 MHz</text>
          <rect x={21} y={82} width={48} height={34} rx={3} fill="#10455d" stroke="#4b8598" strokeWidth={0.7} />
          <text x={45} y={98} fontSize={5.3} textAnchor="middle" fill="#fff">ARDUINO</text>
          <text x={45} y={107} fontSize={4.2} textAnchor="middle" fill="#bfe1ef">UNO R3</text>
          <rect x={36} y={133} width={20} height={13} rx={2} fill="#1b1e22" stroke="#8b929a" strokeWidth={0.6} />
          <text x={46} y={142} fontSize={3.2} textAnchor="middle" fill="#dfe6ee">16U2</text>
          <rect x={174} y={55} width={32} height={22} rx={3} fill="#d5d9dc" stroke="#6e7780" />
          <text x={190} y={68} fontSize={3.5} textAnchor="middle" fill="#30363d">USB</text>
          <rect x={180} y={133} width={17} height={11} rx={2} fill="#aab2ba" stroke="#59636c" />
          <rect x={207} y={70} width={15} height={15} rx={2} fill="#20252b" stroke="#8c959d" strokeWidth={0.6} />
          <rect x={210} y={96} width={13} height={12} rx={1} fill="#b9bdc1" stroke="#626b73" strokeWidth={0.6} />
          <text x={35} y={60} fontSize={4} fill="#c3d6dd">POWER</text>
          <text x={215} y={116} fontSize={3.2} fill="#dfe6ee">ANALOG IN</text>
        </g>
      ) : null}
      {/* Mega 2560: larger ATmega2560, USB-UART chip and barrel-jack power stage. */}
      {isMega ? (
        <g>
          <rect x={135} y={75} width={118} height={91} rx={3} fill="#171b20" stroke="#5d6873" strokeWidth={1} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <g key={`mega-dip-${i}`}>
              <rect x={131} y={80 + i * 11} width={4} height={7} fill="#c6ccd3" />
              <rect x={253} y={80 + i * 11} width={4} height={7} fill="#c6ccd3" />
            </g>
          ))}
          <rect x={150} y={95} width={88} height={49} rx={2} fill="#20252b" />
          <text x={194} y={119} fontSize={6} textAnchor="middle" fill="#e1e7ed">ATmega2560</text>
          <text x={194} y={130} fontSize={4} textAnchor="middle" fill="#aeb8c2">16 MHz · 8-bit AVR</text>
          <rect x={70} y={98} width={46} height={38} rx={3} fill="#171b20" stroke="#67717b" />
          <text x={93} y={116} fontSize={4.2} textAnchor="middle" fill="#e1e7ed">ATmega16U2</text>
          <text x={93} y={124} fontSize={3.2} textAnchor="middle" fill="#9eabb8">USB SERIAL</text>
          <rect x={24} y={53} width={37} height={28} rx={4} fill="#d1d6da" stroke="#59636c" />
          <rect x={30} y={58} width={25} height={18} rx={3} fill="#20252b" />
          <circle cx={42.5} cy={67} r={5} fill="#080a0c" stroke="#c1c7cc" strokeWidth={1.5} />
          <rect x={285} y={48} width={34} height={24} rx={3} fill="#20252b" stroke="#77818a" />
          <text x={302} y={63} fontSize={3.4} textAnchor="middle" fill="#dfe6ee">REGULATOR</text>
          <rect x={289} y={100} width={22} height={15} rx={2} fill="#bbc2c8" stroke="#737e87" />
          <rect x={320} y={102} width={22} height={13} rx={2} fill="#bbc2c8" stroke="#737e87" />
          <text x={112} y={58} fontSize={7} fontWeight="bold" fill="#e6f4fa">MEGA 2560</text>
          <text x={112} y={67} fontSize={3.6} fill="#b5d5df">ATmega2560 · USB BOARD</text>
          <circle cx={75} cy={158} r={4} fill="#20252b" stroke="#aab2ba" />
          <circle cx={87} cy={158} r={4} fill="#20252b" stroke="#aab2ba" />
          <circle cx={99} cy={158} r={4} fill="#20252b" stroke="#aab2ba" />
        </g>
      ) : null}
      {/* Nano carrier: compact USB-serial and ATmega package between long headers. */}
      {isNano ? (
        <g>
          <rect x={48} y={80} width={62} height={62} rx={3} fill="#171b20" stroke="#58636f" />
          <text x={79} y={108} fontSize={4.5} textAnchor="middle" fill="#dfe6ee">ATmega328P</text>
          <text x={79} y={117} fontSize={3.2} textAnchor="middle" fill="#aeb8c2">16 MHz</text>
          <rect x={68} y={31} width={24} height={18} rx={2} fill="#c6ccd3" stroke="#69737d" />
          <text x={80} y={42} fontSize={3.2} textAnchor="middle" fill="#252a30">CH340</text>
          <rect x={68} y={162} width={24} height={18} rx={2} fill="#1c2025" stroke="#86909a" />
        </g>
      ) : null}
      {/* ESP32 carrier with shield can and printed antenna. */}
      {isESP ? (
        <g>
          {def.art?.antenna ? (
            <g>
              <rect x={shapeW / 2 - 19} y={18} width={38} height={24} rx={2} fill="#155139" stroke="#a6c5ae" strokeWidth={0.6} />
              {[0, 1, 2, 3].map((i) => <path key={`ant-${i}`} d={`M${shapeW / 2 - 14 + i * 8} 20 v5 h4 v5 h-4 v5`} fill="none" stroke="#d4bc63" strokeWidth={0.7} />)}
            </g>
          ) : null}
          {isS3 ? (
            <g>
              <rect x={22} y={69} width={96} height={82} rx={5} fill="#c7ccd3" stroke="#626c76" strokeWidth={1.2} />
              <rect x={28} y={75} width={84} height={70} rx={3} fill="#aeb8c0" stroke="#eef0f2" strokeWidth={0.6} />
              <text x={70} y={104} fontSize={7} textAnchor="middle" fill="#252a30" fontWeight="bold">ESP32-S3</text>
              <text x={70} y={115} fontSize={4.1} textAnchor="middle" fill="#3b444d">WROOM-1</text>
              <text x={70} y={126} fontSize={3.2} textAnchor="middle" fill="#3b444d">Wi-Fi · BLE · USB</text>
              <rect x={48} y={161} width={44} height={14} rx={2} fill="#21262c" stroke="#75808a" />
              <text x={70} y={170} fontSize={3.2} textAnchor="middle" fill="#d7e0e7">USB INTERFACE</text>
            </g>
          ) : (
            <g>
              <rect x={20} y={60} width={60} height={60} fill="#c7ccd3" stroke="#6b7280" rx={3} />
              <rect x={24} y={64} width={52} height={52} fill="#b0b8c0" stroke="#eef0f2" strokeWidth={0.6} rx={2} />
              <text x={50} y={90} fontSize={5.5} textAnchor="middle" fill="#2a2f36">ESP32</text>
              <text x={50} y={99} fontSize={3.4} textAnchor="middle" fill="#2a2f36">WROOM</text>
            </g>
          )}
          <rect x={shapeW / 2 - 14} y={shapeH - 26} width={28} height={10} fill="#c7ccd3" opacity={0.3} />
        </g>
      ) : null}
      {isPico ? (
        <g>
          <rect x={60} y={150} width={90} height={80} rx={4} fill="#20252b" stroke="#75808a" />
          <text x={105} y={187} fontSize={6} textAnchor="middle" fill="#cde9d7">RP2040</text>
          <text x={105} y={199} fontSize={3.4} textAnchor="middle" fill="#aeb8c2">DUAL-CORE MCU</text>
          <circle cx={shapeW / 2} cy={shapeH - 50} r={2.6} fill="#e5e9ee" />
          <rect x={34} y={65} width={30} height={17} rx={3} fill="#d6dbe0" stroke="#75808a" />
          <rect x={38} y={69} width={22} height={9} rx={2} fill="#272d34" />
          <text x={49} y={76} fontSize={3} textAnchor="middle" fill="#cbd2d8">BOOT</text>
        </g>
      ) : null}
      {isBlue ? (
        <g>
          <rect x={shapeW / 2 - 22} y={shapeH / 2 - 18} width={44} height={42} fill="#1b1f25" rx={3} stroke="#637180" />
          <text x={shapeW / 2} y={shapeH / 2} fontSize={4.5} textAnchor="middle" fill="#dfe6ee">STM32</text>
          <text x={shapeW / 2} y={shapeH / 2 + 9} fontSize={3.4} textAnchor="middle" fill="#dfe6ee">F103C8</text>
          <rect x={shapeW / 2 - 9} y={20} width={18} height={12} rx={2} fill="#c7ccd3" stroke="#66717d" />
          <rect x={shapeW / 2 - 9} y={shapeH - 32} width={18} height={12} rx={2} fill="#c7ccd3" stroke="#66717d" />
        </g>
      ) : null}
      {/* Gold-plated header pads and dark socket openings. */}
      {def.pins.map((p) => (
        <g key={`hole-${p.id}`}>
          <rect x={p.x - 2.5} y={p.y - 2.5} width={5} height={5} rx={1} fill="#b99a4b" />
          <rect x={p.x - 1.7} y={p.y - 1.7} width={3.4} height={3.4} rx={0.8} fill="#0b1d29" />
        </g>
      ))}
      {/* On-board status LEDs. */}
      {(def.art?.onboardLeds ?? []).map((led, i) => {
        const on = ledOn(led.pin);
        const pin = def.pins.find((p) => p.id === led.pin);
        const x = pin ? Math.min(shapeW - 8, pin.x + 8) : 10 + i * 10;
        const y = pin ? Math.min(shapeH - 8, pin.y + (isUno ? 8 : 0)) : 50;
        const ledX = isUno ? 164 : isMega ? 115 : x;
        const ledY = isUno ? 96 : isMega ? 83 : y;
        return (
          <g key={led.id}>
            <circle cx={ledX} cy={ledY} r={3.2} fill={on ? '#ffe36a' : '#4a3a12'} stroke="#111" strokeWidth={0.5} />
            {on ? <circle cx={ledX} cy={ledY} r={7.5} fill="#ffe36a" opacity={0.25} /> : null}
            <text x={ledX + 6} y={ledY + 1} fontSize={3.4} fill="#e6f4fa">{led.label}</text>
          </g>
        );
      })}
      {/* Tactile reset / boot switches. */}
      {(def.art?.buttons ?? []).map((b, i) => {
        const x = isUno || isMega ? 18 + i * 19 : shapeW - 26;
        const y = isUno || isMega ? 44 : 20 + i * 22;
        return (
          <g key={b.id}>
            <rect x={x} y={y} width={12} height={12} rx={2} fill="#30353c" stroke="#111" />
            <circle cx={x + 6} cy={y + 6} r={3.4} fill="#9098a1" stroke="#d7dce1" strokeWidth={0.5} />
            <text x={x + 6} y={y - 2} fontSize={3.2} fill="#e6f4fa" textAnchor="middle">{b.label}</text>
          </g>
        );
      })}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
      {isBlue ? <text x={shapeW / 2} y={shapeH - 6} fontSize={3.4} textAnchor="middle" fill="#fff">{def.name}</text> : null}
    </g>
  );
}

/** Scale a sample buffer into a polyline inside a box (x0,y0,w,h). */
function tracePath(samples: number[], x0: number, y0: number, w: number, h: number, lo: number, hi: number): string {
  if (samples.length < 2) return '';
  const span = hi - lo || 1;
  return samples
    .map((v, i) => {
      const x = x0 + (i / (samples.length - 1)) * w;
      const y = y0 + h - ((Math.max(lo, Math.min(hi, v)) - lo) / span) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function MeterArt({ def, comp, sim, hoverPin, connectedPins }: ArtProps) {
  const variant = def.model.type === 'meter' ? def.model.variant : 'multimeter';
  const screenFill = variant === 'multimeter' ? '#b7d8a8' : '#05080c';
  const bodyFill = variant === 'multimeter' ? '#1f2a1f' : variant === 'scope' ? '#1d2630' : variant === 'la' ? '#1b2432' : '#2d2b1f';
  const sx = 14;
  const sy = 14;
  const sw = def.w - 28;
  const sh = variant === 'multimeter' ? 46 : 64;
  const wave1 = sim?.wave ?? [];
  const wave2 = sim?.wave2 ?? [];
  const scale = Math.max(1, ...wave1.map((v) => Math.abs(v)), ...wave2.map((v) => Math.abs(v)));
  const traces = sim?.traces ?? [];
  return (
    <g>
      <rect x={2} y={2} width={def.w - 4} height={def.h - 4} rx={6} fill={bodyFill} stroke="#0a0c0f" />
      <rect x={sx} y={sy} width={sw} height={sh} rx={3} fill={screenFill} stroke="#2b2f36" />
      {variant === 'multimeter' ? (
        <text x={def.w / 2} y={sy + 32} fontSize={12} textAnchor="middle" fill="#1b2b15" style={{ fontFamily: 'monospace' }}>
          {sim?.display ?? '—'}
        </text>
      ) : null}
      {variant === 'scope' ? (
        <g>
          {/* graticule */}
          {[1, 2, 3].map((i) => (
            <line key={`h${i}`} x1={sx} x2={sx + sw} y1={sy + (sh * i) / 4} y2={sy + (sh * i) / 4} stroke="#1f3a4a" strokeWidth={0.4} />
          ))}
          {[1, 2, 3].map((i) => (
            <line key={`v${i}`} y1={sy} y2={sy + sh} x1={sx + (sw * i) / 4} x2={sx + (sw * i) / 4} stroke="#1f3a4a" strokeWidth={0.4} />
          ))}
          <path d={tracePath(wave1, sx, sy, sw, sh, -scale, scale)} fill="none" stroke="#f2c230" strokeWidth={0.9} />
          <path d={tracePath(wave2, sx, sy, sw, sh, -scale, scale)} fill="none" stroke="#7ef2ff" strokeWidth={0.9} />
        </g>
      ) : null}
      {variant === 'la' ? (
        <g>
          {Array.from({ length: 8 }).map((_, ch) => {
            const data = traces[ch] ?? [];
            const laneH = sh / 8;
            const y0 = sy + ch * laneH + 1;
            const pts = data.map((v, i) => `${(sx + (i / Math.max(1, data.length - 1)) * sw).toFixed(1)} ${(y0 + (1 - v) * (laneH - 2)).toFixed(1)}`);
            return <path key={ch} d={pts.length ? `M${pts.join(' L')}` : ''} fill="none" stroke="#7ef2ff" strokeWidth={0.6} />;
          })}
        </g>
      ) : null}
      {variant === 'fgen' ? <text x={def.w / 2} y={sy + 32} fontSize={5} textAnchor="middle" fill="#dbe6f2">FUNCTION GEN</text> : null}
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

// ── Dispatch ───────────────────────────────────────────────────────────────

export function PartArt(props: ArtProps): ReactNode {
  const { def } = props;
  switch (def.family) {
    case 'board':
      return <BoardArt {...props} />;
    case 'breadboard':
    case 'breadboard-half':
    case 'breadboard-mini':
      return <BreadboardArt {...props} />;
    case 'perfboard':
      return <PerfArt {...props} />;
    case 'resistor':
      return <ResistorArt {...props} />;
    case 'capacitor-ceramic':
    case 'capacitor-electrolytic':
      return <CapacitorArt {...props} />;
    case 'inductor':
      return <InductorArt {...props} />;
    case 'potentiometer':
      return <PotArt {...props} />;
    case 'trimmer':
      return <TrimmerArt {...props} />;
    case 'ldr':
    case 'thermistor':
      return <ResistorArt {...props} />;
    case 'led':
      return <LedArt {...props} />;
    case 'diode':
      return <DiodeArt {...props} />;
    case 'transistor':
    case 'mosfet':
      return <TransistorArt {...props} />;
    case 'regulator':
      return <RegulatorArt {...props} />;
    case 'optocoupler':
      return <OptoArt {...props} />;
    case 'ic-dip':
      return <DipArt {...props} />;
    case 'module':
      if (def.id === 'oled-ssd1306') return <OledArt {...props} />;
      if (def.id === 'lcd-16x2' || def.id === 'lcd-i2c') return <LcdArt {...props} />;
      if (def.id === 'display-7seg') return <SevenSegArt {...props} />;
      if (def.id === 'buzzer') return <BuzzerArt {...props} />;
      if (def.model.type === 'servo') return <ServoArt {...props} />;
      if (def.model.type === 'motor' || def.id.startsWith('stepper')) return <MotorArt {...props} />;
      return <ModuleArt {...props} />;
    case 'battery-9v':
    case 'battery-pack':
      return <BatteryArt {...props} />;
    case 'usb-power':
      return <UsbArt {...props} />;
    case 'bench-supply':
      return <SupplyArt {...props} />;
    case 'switch':
    case 'pushbutton':
    case 'dip-switch':
      return <SwitchArt {...props} />;
    case 'jumper':
      return <JumperArt {...props} />;
    case 'symbol':
      return <SymbolArt {...props} />;
    case 'instrument':
      return <MeterArt {...props} />;
    default:
      return null;
  }
}
