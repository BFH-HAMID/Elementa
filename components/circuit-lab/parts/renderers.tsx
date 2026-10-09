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
  const body = def.id.includes('oled') ? '#0b3a6b' : def.id.includes('lcd') ? '#0d5a3d' : '#1c4f86';
  const hasMarker = variant === 'dht' || variant === 'pir' || variant === 'ir' || variant === 'mq' || variant === 'soil';
  return (
    <g>
      <rect x={3} y={3} width={def.w - 6} height={def.h - 14} rx={4} fill={body} stroke="#0a1f36" />
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
  const rad = ((angle - 90) * Math.PI) / 180;
  return (
    <g>
      <rect x={4} y={4} width={52} height={32} rx={3} fill="#1f5bb0" stroke="#0b2d5f" />
      <circle cx={30} cy={20} r={8} fill="#1c3c6e" />
      <line x1={30} y1={20} x2={30 + Math.sin(rad) * 14} y2={20 - Math.cos(rad) * 14} stroke="#e6ecf2" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={30} cy={20} r={2.2} fill="#e6ecf2" />
      <text x={30} y={44} fontSize={4} textAnchor="middle" fill="currentColor">{`${Math.round(angle)}°`}</text>
      {pinsOf(def, { def, comp, hoverPin, connectedPins })}
      {edgeLabels(def, { def, comp, hoverPin })}
    </g>
  );
}

function MotorArt({ def, comp, sim, hoverPin, connectedPins, simTime }: ArtProps) {
  const speed = Math.max(0, Math.min(1, sim?.speed ?? 0));
  const period = speed > 0.01 ? 1 / (speed * 12) : 0;
  const t = simTime ?? 0;
  const rot = period > 0 ? ((t % period) / period) * 360 : 0;
  return (
    <g>
      <rect x={6} y={6} width={48} height={28} rx={8} fill="#8f98a3" stroke="#464d56" />
      <rect x={0} y={16} width={6} height={8} fill="#c7ccd3" />
      <rect x={54} y={16} width={6} height={8} fill="#c7ccd3" />
      <g transform={`rotate(${rot} 30 20)`}>
        <circle cx={30} cy={20} r={10} fill="#e6ecf2" stroke="#5d6672" />
        <path d="M30 10 V30 M20 20 H40" stroke="#2f6fd6" strokeWidth={2.2} />
      </g>
      {speed > 0.02 ? <text x={30} y={42} fontSize={4} textAnchor="middle" fill="currentColor">{`${Math.round(speed * 100)}%`}</text> : null}
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
  return (
    <g>
      <rect x={0} y={0} width={def.w} height={def.h} rx={5} fill="#e9e4d7" stroke="#b6ae98" strokeWidth={1} />
      {/* rail stripes */}
      <rect x={6} y={6} width={def.w - 12} height={18} fill="#d9d2bf" />
      <rect x={6} y={def.h - 24} width={def.w - 12} height={18} fill="#d9d2bf" />
      <rect x={4} y={def.h / 2 - 8} width={def.w - 8} height={18} fill="#d3ccb8" />
      {holes.map((p) => {
        const isRail = p.id.startsWith('r');
        const hovered = hoverPin === p.id;
        const wired = connectedPins?.has(p.id);
        return (
          <circle
            key={p.id}
            data-pin={p.id}
            cx={p.x}
            cy={p.y}
            r={hovered ? 3.6 : isRail ? 2.1 : 2}
            fill={hovered ? '#f4b942' : wired ? '#3c4650' : '#2b2f36'}
            stroke={hovered ? '#8a5a00' : 'none'}
            strokeWidth={0.8}
          />
        );
      })}
      {/* rail polarity marks */}
      <text x={10} y={16} fontSize={6} fill="#c0392b">+</text>
      <text x={10} y={26} fontSize={6} fill="#2f6fd6">−</text>
      <text x={def.w - 14} y={16} fontSize={5} fill="#c0392b">+</text>
      <text x={def.w - 14} y={26} fontSize={5} fill="#2f6fd6">−</text>
      <text x={def.w / 2} y={def.h / 2 + 3} fontSize={5} textAnchor="middle" fill="#8c8470" style={{ letterSpacing: 6 }}>
        {def.family === 'breadboard-half' ? 'HALF BREADBOARD' : 'BREADBOARD'}
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
  const isPico = def.id === 'rpi-pico';
  const isESP = def.id.startsWith('esp32') || def.id.startsWith('nodemcu');
  const isBlue = def.id === 'stm32-bluepill';
  const body = def.art?.bodyColor ?? '#1d6f93';
  const ledOn = (pin: string) => {
    const v = sim?.pinV?.[pin];
    return v !== undefined ? v > 1.5 : false;
  };
  const shapeW = def.w;
  const shapeH = def.h;
  return (
    <g>
      {/* board body */}
      <rect x={-4} y={-4} width={shapeW + 8} height={shapeH + 8} rx={isUno ? 6 : 5} fill={body} stroke="#0c2a3d" strokeWidth={1} />
      {/* USB connector */}
      {def.art?.usb ? (
        isUno ? (
          <rect x={-10} y={shapeH / 2 - 14} width={20} height={28} rx={2} fill="#c6ccd3" stroke="#6b7280" />
        ) : isPico ? (
          <rect x={shapeW / 2 - 13} y={-10} width={26} height={12} rx={2} fill="#c6ccd3" stroke="#6b7280" />
        ) : (
          <rect x={shapeW / 2 - 10} y={-10} width={20} height={8} rx={1} fill="#c6ccd3" stroke="#6b7280" />
        )
      ) : null}
      {/* chip + detail */}
      {isUno ? (
        <g>
          <rect x={90} y={80} width={56} height={56} fill="#1b1f25" rx={2} />
          <text x={118} y={110} fontSize={5} textAnchor="middle" fill="#dfe6ee">ATmega328P</text>
          <rect x={0} y={80} width={70} height={36} rx={3} fill="#0d4a66" />
          <text x={35} y={100} fontSize={6} textAnchor="middle" fill="#fff">ARDUINO</text>
          <text x={35} y={110} fontSize={5} textAnchor="middle" fill="#bfe1ef">UNO R3</text>
        </g>
      ) : null}
      {isNano ? (
        <g>
          <rect x={50} y={70} width={60} height={60} rx={2} fill="#1b1f25" />
          <text x={80} y={103} fontSize={4.6} textAnchor="middle" fill="#dfe6ee">ATmega328P</text>
        </g>
      ) : null}
      {isESP ? (
        <g>
          <rect x={20} y={60} width={60} height={60} fill="#c7ccd3" stroke="#6b7280" rx={2} />
          <text x={50} y={92} fontSize={5.5} textAnchor="middle" fill="#2a2f36">ESP32</text>
          <text x={50} y={99} fontSize={3.4} textAnchor="middle" fill="#2a2f36">WROOM</text>
          <rect x={shapeW / 2 - 14} y={shapeH - 26} width={28} height={10} fill="#c7ccd3" opacity={0.3} />
        </g>
      ) : null}
      {isPico ? (
        <g>
          <rect x={60} y={150} width={90} height={80} rx={3} fill="#2a2f36" />
          <text x={105} y={196} fontSize={6} textAnchor="middle" fill="#cde9d7">RP2040</text>
          <circle cx={shapeW / 2} cy={shapeH - 50} r={2.6} fill="#e5e9ee" />
        </g>
      ) : null}
      {isBlue ? (
        <g>
          <rect x={shapeW / 2 - 18} y={shapeH / 2 - 15} width={36} height={36} fill="#1b1f25" rx={2} />
          <text x={shapeW / 2} y={shapeH / 2 + 5} fontSize={4.5} textAnchor="middle" fill="#dfe6ee">STM32</text>
          <text x={shapeW / 2} y={shapeH / 2 + 12} fontSize={3.4} textAnchor="middle" fill="#dfe6ee">F103C8</text>
        </g>
      ) : null}
      {/* headers: dark holes under pins */}
      {def.pins.map((p) => (
        <rect key={`hole-${p.id}`} x={p.x - 2.2} y={p.y - 2.2} width={4.4} height={4.4} rx={0.8} fill="#0b1d29" />
      ))}
      {/* onboard LEDs */}
      {(def.art?.onboardLeds ?? []).map((led, i) => {
        const on = ledOn(led.pin);
        const pin = def.pins.find((p) => p.id === led.pin);
        const x = pin ? pin.x + 6 : 10 + i * 10;
        const y = pin ? pin.y + (isUno ? 8 : 0) : 50;
        return (
          <g key={led.id}>
            <circle cx={isUno ? 150 : x} cy={isUno ? 100 : y} r={3} fill={on ? '#ffe36a' : '#4a3a12'} stroke="#111" strokeWidth={0.4} />
            {on ? <circle cx={isUno ? 150 : x} cy={isUno ? 100 : y} r={7} fill="#ffe36a" opacity={0.25} /> : null}
            <text x={isUno ? 156 : x + 5} y={(isUno ? 102 : y) + 1} fontSize={3.4} fill="#e6f4fa">{led.label}</text>
          </g>
        );
      })}
      {/* buttons */}
      {(def.art?.buttons ?? []).map((b, i) => (
        <g key={b.id}>
          <rect x={shapeW - 26} y={20 + i * 22} width={12} height={12} rx={2} fill="#3a3f47" stroke="#111" />
          <circle cx={shapeW - 20} cy={26 + i * 22} r={3.4} fill="#7b8390" />
          <text x={shapeW - 13} y={20 + i * 22 - 2} fontSize={3.2} fill="#e6f4fa" textAnchor="middle">{b.label}</text>
        </g>
      ))}
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
      if (def.id === 'servo-sg90') return <ServoArt {...props} />;
      if (def.id === 'dc-motor' || def.id.startsWith('stepper')) return <MotorArt {...props} />;
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
