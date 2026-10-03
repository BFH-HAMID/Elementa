import type { Chemical, Portion, Sediment } from './types';

/**
 * Pure colour helpers. Liquids mix like paints (weighted average of channel
 * reflectance), so a drop of purple permanganate in water gives a pale violet
 * rather than a neon average.
 */

export type Rgb = { r: number; g: number; b: number };

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = Number.parseInt(full.slice(0, 6) || '000000', 16);
  if (!Number.isFinite(int)) return { r: 0, g: 0, b: 0 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export type MixSample = { color: string; weight: number; opacity?: number };

/**
 * Weighted paint mixing. Weights are typically volumes in mL. `opacity` biases the
 * sample towards covering whatever is underneath, which is how a dense precipitate
 * hides a pale solution.
 */
export function mixColors(samples: MixSample[], fallback = '#e7f2fb'): string {
  const usable = samples.filter((sample) => sample.weight > 0 && /^#?[0-9a-f]{3,6}$/i.test(sample.color.trim()));
  if (usable.length === 0) return fallback;
  if (usable.length === 1) return rgbToHex(hexToRgb(usable[0].color));

  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (const sample of usable) {
    const coverage = clamp(sample.opacity ?? 1) * 0.6 + 0.4;
    const weight = Math.max(0, sample.weight) * coverage;
    if (weight <= 0) continue;
    const { r: sr, g: sg, b: sb } = hexToRgb(sample.color);
    r += sr * weight;
    g += sg * weight;
    b += sb * weight;
    total += weight;
  }
  if (total <= 0) return fallback;
  return rgbToHex({ r: r / total, g: g / total, b: b / total });
}

/** Linear blend of two hex colours — used for temperature and pH gradients. */
export function blendColors(from: string, to: string, amount: number): string {
  const t = clamp(amount);
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha).toFixed(3)})`;
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = clamp(amount);
  return rgbToHex({ r: r + (255 - r) * t, g: g + (255 - g) * t, b: b + (255 - b) * t });
}

export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = clamp(amount);
  return rgbToHex({ r: r * (1 - t), g: g * (1 - t), b: b * (1 - t) });
}

/** Relative luminance, handy for picking readable text on top of a liquid colour. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? '#14283d' : '#f7fbff';
}

export type LiquidComposition = {
  color: string;
  opacity: number;
  totalMl: number;
  turbidity: number;
  sedimentColor: string | null;
};

/**
 * Turn a vessel's contents into one liquid colour.
 *
 * - dissolved portions tint by volume,
 * - suspended sediment adds its own colour weighted by turbidity,
 * - explicit `override` (from a reaction's `colorTo`) wins when supplied.
 */
export function composeLiquidColor(
  portions: Portion[],
  sediment: Sediment[],
  chemicalsById: Map<string, Chemical>,
  options: { turbidity?: number; override?: string | null; emptyColor?: string } = {}
): LiquidComposition {
  const turbidity = clamp(options.turbidity ?? 0);
  const samples: MixSample[] = [];
  let totalMl = 0;
  let weightedOpacity = 0;

  for (const portion of portions) {
    const chemical = chemicalsById.get(portion.chemicalId);
    if (!chemical || portion.mL <= 0) continue;
    // Metals and insoluble solids sit at the bottom instead of tinting the liquid.
    if (chemical.state === 'solid' && chemical.category === 'metal') continue;
    totalMl += portion.mL;
    samples.push({ color: chemical.color, weight: portion.mL, opacity: chemical.opacity });
    weightedOpacity += chemical.opacity * portion.mL;
  }

  const sedimentMl = sediment.reduce((sum, item) => sum + item.mL, 0);
  let sedimentColor: string | null = null;
  if (sedimentMl > 0) {
    sedimentColor = mixColors(
      sediment.map((item) => ({ color: item.color, weight: item.mL, opacity: 0.95 })),
      '#f4f7f9'
    );
    // Turbidity is the cloud still hanging in the liquid; the settled layer is separate.
    if (turbidity > 0) {
      samples.push({ color: sedimentColor, weight: Math.max(1, totalMl) * turbidity * 0.9, opacity: 0.85 });
    }
  }

  if (options.override) {
    return {
      color: options.override,
      opacity: totalMl > 0 ? clamp(weightedOpacity / Math.max(totalMl, 1) + 0.15, 0.35, 0.95) : 0.7,
      totalMl,
      turbidity,
      sedimentColor
    };
  }

  const color = totalMl > 0 || sedimentMl > 0 ? mixColors(samples, options.emptyColor ?? '#e7f2fb') : options.emptyColor ?? '#e7f2fb';
  const opacity = totalMl > 0 ? clamp(weightedOpacity / Math.max(totalMl, 1), 0.35, 0.95) : 0.55;
  return { color, opacity, totalMl, turbidity, sedimentColor };
}
