import type { Acidity, Chemical, IndicatorId, Portion } from './types';
import { blendColors } from './colorMixer';

/**
 * A school-lab pH model: strong acids and bases dissociate completely and cancel
 * each other first; whatever is left over is treated as a weak acid or weak base
 * with the usual √(K·C) approximation. Salt hydrolysis is folded in through
 * `saltOf`. Everything is pure and unit-tested.
 */

export const KW_25C = 1e-14;
export const AMBIENT_C = 25;

/** Kw rises with temperature, so neutral pH drifts slightly below 7 when hot. */
export function kwAt(temperatureC: number): number {
  const t = Number.isFinite(temperatureC) ? temperatureC : AMBIENT_C;
  // pKw: 14.95 at 0 °C → 13.99 at 25 °C → 12.26 at 100 °C (smooth interpolation).
  const pKw = t <= 25 ? 14.95 - ((14.95 - 13.995) * Math.max(0, t)) / 25 : 13.995 - ((13.995 - 12.26) * Math.min(75, t - 25)) / 75;
  return 10 ** -pKw;
}

export function neutralPhAt(temperatureC: number): number {
  return -Math.log10(Math.sqrt(kwAt(temperatureC)));
}

export type PhInput = {
  portions: Portion[];
  volumeMl: number;
  chemicalsById: Map<string, Chemical>;
  temperatureC?: number;
};

export type PhResult = {
  ph: number;
  poh: number;
  hPlus: number;
  ohMinus: number;
  nature: 'acidic' | 'neutral' | 'alkaline';
  dominantId: string | null;
};

function isAcidity(value: Acidity | undefined): value is Acidity {
  return Boolean(value);
}

function protonsOf(acidity: Acidity): number {
  return acidity.kind === 'acid' ? Math.max(1, acidity.protons) : 0;
}

function hydroxidesOf(acidity: Acidity): number {
  return acidity.kind === 'base' ? Math.max(1, acidity.hydroxides) : 0;
}

/** Look up how strong the parent acid/base of a salt was, for hydrolysis. */
function parentStrength(
  chemicalsById: Map<string, Chemical>,
  id: string | undefined,
  kind: 'acid' | 'base'
): { strength: 'strong' | 'weak'; k: number } | undefined {
  if (!id) return undefined;
  const acidity = chemicalsById.get(id)?.acidity;
  if (!acidity) return undefined;
  if (kind === 'acid') {
    if (acidity.kind !== 'acid') return undefined;
    return { strength: acidity.strength, k: acidity.ka ?? 1.8e-5 };
  }
  if (acidity.kind !== 'base') return undefined;
  return { strength: acidity.strength, k: acidity.kb ?? 1.8e-5 };
}

export function computePh({ portions, volumeMl, chemicalsById, temperatureC = AMBIENT_C }: PhInput): PhResult {
  const volumeL = Math.max(volumeMl, 0) / 1000;
  const neutral = neutralPhAt(temperatureC);
  const kw = kwAt(temperatureC);
  const empty: PhResult = { ph: neutral, poh: neutral, hPlus: Math.sqrt(kw), ohMinus: Math.sqrt(kw), nature: 'neutral', dominantId: null };
  if (volumeL <= 0) return empty;

  let strongH = 0;
  let strongOh = 0;
  const weakAcids: { concentration: number; ka: number; id: string }[] = [];
  const weakBases: { concentration: number; kb: number; id: string }[] = [];
  let dominantId: string | null = null;
  let dominantStrength = 0;

  for (const portion of portions) {
    if (portion.moles <= 0) continue;
    const chemical = chemicalsById.get(portion.chemicalId);
    if (!chemical) continue;
    const acidity = chemical.acidity;
    if (!isAcidity(acidity) || acidity.kind === 'neutral') continue;
    const concentration = portion.moles / volumeL;

    if (acidity.kind === 'acid') {
      const protons = protonsOf(acidity);
      if (acidity.strength === 'strong') {
        strongH += portion.moles * protons;
        if (portion.moles * protons > dominantStrength) { dominantStrength = portion.moles * protons; dominantId = chemical.id; }
      } else {
        weakAcids.push({ concentration, ka: acidity.ka ?? 1.8e-5, id: chemical.id });
      }
    } else if (acidity.kind === 'base') {
      const hydroxides = hydroxidesOf(acidity);
      if (acidity.strength === 'strong') {
        strongOh += portion.moles * hydroxides;
        if (portion.moles * hydroxides > dominantStrength) { dominantStrength = portion.moles * hydroxides; dominantId = chemical.id; }
      } else {
        weakBases.push({ concentration, kb: acidity.kb ?? 1.8e-5, id: chemical.id });
      }
    } else if (acidity.kind === 'salt' && acidity.saltOf) {
      // Hydrolysis: a salt of a weak acid is alkaline, of a weak base is acidic.
      const acidParent = parentStrength(chemicalsById, acidity.saltOf.acid, 'acid');
      const baseParent = parentStrength(chemicalsById, acidity.saltOf.base, 'base');
      if (acidParent?.strength === 'weak' && (!baseParent || baseParent.strength === 'strong')) {
        weakBases.push({ concentration, kb: kw / acidParent.k, id: chemical.id });
      } else if (baseParent?.strength === 'weak' && (!acidParent || acidParent.strength === 'strong')) {
        weakAcids.push({ concentration, ka: kw / baseParent.k, id: chemical.id });
      }
    }
  }

  const netStrong = strongH - strongOh;
  const residual = Math.abs(netStrong);

  // Weak species react with the leftover strong acid/base before setting their own pH.
  let weakAcidPool = weakAcids.reduce((sum, item) => sum + item.concentration * item.ka, 0);
  let weakBasePool = weakBases.reduce((sum, item) => sum + item.concentration * item.kb, 0);

  let hPlus: number;
  if (residual > 1e-12) {
    if (netStrong > 0) {
      // Excess strong acid swamps weak acids; weak bases are consumed first.
      const consumed = Math.min(netStrong / volumeL, weakBases.reduce((sum, item) => sum + item.concentration, 0));
      const free = (netStrong / volumeL) - consumed;
      hPlus = Math.max(free, 0) + Math.sqrt(Math.max(weakAcidPool, 0));
      if (!dominantId) dominantId = weakAcids[0]?.id ?? null;
    } else {
      const excessOh = -netStrong / volumeL;
      const consumed = Math.min(excessOh, weakAcids.reduce((sum, item) => sum + item.concentration, 0));
      const free = excessOh - consumed;
      const ohMinus = Math.max(free, 0) + Math.sqrt(Math.max(weakBasePool, 0));
      hPlus = kw / Math.max(ohMinus, 1e-15);
      if (!dominantId) dominantId = weakBases[0]?.id ?? null;
    }
  } else {
    // No strong species left: let the weak equilibria decide.
    weakAcidPool = weakAcids.reduce((sum, item) => sum + item.concentration * item.ka, 0);
    weakBasePool = weakBases.reduce((sum, item) => sum + item.concentration * item.kb, 0);
    const acidH = Math.sqrt(Math.max(weakAcidPool, 0));
    const baseOh = Math.sqrt(Math.max(weakBasePool, 0));
    if (acidH === 0 && baseOh === 0) {
      hPlus = Math.sqrt(kw);
    } else if (acidH >= baseOh) {
      hPlus = Math.max(acidH - baseOh, Math.sqrt(kw));
      if (!dominantId) dominantId = weakAcids[0]?.id ?? null;
    } else {
      const ohMinus = Math.max(baseOh - acidH, Math.sqrt(kw));
      hPlus = kw / ohMinus;
      if (!dominantId) dominantId = weakBases[0]?.id ?? null;
    }
  }

  const ph = clampPh(-Math.log10(Math.max(hPlus, 1e-16)));
  const poh = -Math.log10(kw) - ph;
  const nature = ph < neutral - 0.15 ? 'acidic' : ph > neutral + 0.15 ? 'alkaline' : 'neutral';
  return { ph, poh, hPlus, ohMinus: kw / Math.max(hPlus, 1e-16), nature, dominantId };
}

export function clampPh(value: number): number {
  if (!Number.isFinite(value)) return 7;
  return Math.min(15, Math.max(-1, value));
}

/** How many mL of a titrant at `molarity` are needed to neutralise `molesTarget`. */
export function titreVolumeMl(molesTarget: number, molarity: number, protons = 1): number {
  if (molarity <= 0 || protons <= 0) return 0;
  return (Math.max(0, molesTarget) / (molarity * protons)) * 1000;
}

// ── Indicator colours ────────────────────────────────────────────────────────

export const COLORLESS = '#eef4fa';

export type IndicatorBand = { max: number; color: string; label_en: string; label_bn: string };

export const indicatorBands: Record<IndicatorId, IndicatorBand[]> = {
  litmus: [
    { max: 4.5, color: '#d9403c', label_en: 'Red — acidic', label_bn: 'লাল — অম্লীয়' },
    { max: 8.3, color: '#8a5fbf', label_en: 'Purple — near neutral', label_bn: 'বেগুনি — প্রায় প্রশম' },
    { max: 15, color: '#2f6fd0', label_en: 'Blue — alkaline', label_bn: 'নীল — ক্ষারীয়' }
  ],
  phenolphthalein: [
    { max: 8.2, color: COLORLESS, label_en: 'Colourless', label_bn: 'বর্ণহীন' },
    { max: 10, color: '#f06fb0', label_en: 'Pink', label_bn: 'গোলাপি' },
    { max: 13, color: '#d92f86', label_en: 'Deep pink', label_bn: 'গাঢ় গোলাপি' },
    { max: 15, color: COLORLESS, label_en: 'Colourless again in very strong base', label_bn: 'অতি তীব্র ক্ষারে আবার বর্ণহীন' }
  ],
  'methyl-orange': [
    { max: 3.1, color: '#e2453c', label_en: 'Red', label_bn: 'লাল' },
    { max: 4.4, color: '#f5943b', label_en: 'Orange', label_bn: 'কমলা' },
    { max: 15, color: '#f7d44a', label_en: 'Yellow', label_bn: 'হলুদ' }
  ],
  universal: [
    { max: 1, color: '#d92f24', label_en: 'Strongly acidic', label_bn: 'অতি অম্লীয়' },
    { max: 3, color: '#ef6a2a', label_en: 'Acidic', label_bn: 'অম্লীয়' },
    { max: 5, color: '#f5b023', label_en: 'Weakly acidic', label_bn: 'দুর্বল অম্লীয়' },
    { max: 6.5, color: '#e8d44d', label_en: 'Just acidic', label_bn: 'সামান্য অম্লীয়' },
    { max: 7.5, color: '#7cc24a', label_en: 'Neutral', label_bn: 'প্রশম' },
    { max: 9, color: '#3fa65c', label_en: 'Just alkaline', label_bn: 'সামান্য ক্ষারীয়' },
    { max: 11, color: '#2f8fa8', label_en: 'Weakly alkaline', label_bn: 'দুর্বল ক্ষারীয়' },
    { max: 13, color: '#2f5fa8', label_en: 'Alkaline', label_bn: 'ক্ষারীয়' },
    { max: 15, color: '#5b2f9f', label_en: 'Strongly alkaline', label_bn: 'অতি ক্ষারীয়' }
  ]
};

export function indicatorBand(indicator: IndicatorId, ph: number): IndicatorBand {
  const bands = indicatorBands[indicator];
  return bands.find((band) => ph < band.max) ?? bands[bands.length - 1];
}

export function indicatorColor(indicator: IndicatorId, ph: number): string {
  if (indicator === 'universal') {
    // Universal indicator is a gradient, not a set of steps.
    const bands = indicatorBands.universal;
    const stops = [0, 2, 4, 6, 7, 8.5, 10, 12, 14];
    const value = Math.min(14, Math.max(0, ph));
    for (let index = 0; index < stops.length - 1; index += 1) {
      if (value <= stops[index + 1]) {
        const span = stops[index + 1] - stops[index] || 1;
        return blendColors(bands[index].color, bands[index + 1].color, (value - stops[index]) / span);
      }
    }
    return bands[bands.length - 1].color;
  }
  return indicatorBand(indicator, ph).color;
}

export function indicatorLabel(indicator: IndicatorId, ph: number, locale: 'bn' | 'en'): string {
  const band = indicatorBand(indicator, ph);
  return locale === 'bn' ? band.label_bn : band.label_en;
}

/**
 * The colour a vessel actually shows once indicators are present: the indicator's
 * own colour dominates when it is in the mixture, weighted by how much was added.
 */
export function observedColor(baseColor: string, indicators: { indicator: IndicatorId; mL: number }[], ph: number): string {
  if (indicators.length === 0) return baseColor;
  const total = indicators.reduce((sum, item) => sum + item.mL, 0);
  if (total <= 0) return baseColor;
  // A couple of drops change the whole tube; more than ~10% of the volume owns it.
  const weight = Math.min(1, 0.45 + total / 12);
  const mixed = indicators.map((item) => indicatorColor(item.indicator, ph));
  const indicatorColorFinal = mixed.length === 1 ? mixed[0] : blendColors(mixed[0], mixed[mixed.length - 1], 0.5);
  return blendColors(baseColor, indicatorColorFinal, weight);
}

export function formatPh(ph: number): string {
  return ph.toFixed(Math.abs(ph - Math.round(ph)) < 0.05 ? 1 : 2);
}
