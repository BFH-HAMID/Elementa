import type { Chemical, Portion } from './types';

/**
 * A deliberately small thermal model: one explicit Euler step per tick so the UI can
 * call it from an interval and the tests can call it once and assert exact numbers.
 */

export const AMBIENT_C = 25;
/** Effective burner power at full intensity, in watts delivered to the liquid. */
export const BURNER_POWER_W = 260;
/** Specific heat capacity of the (mostly aqueous) contents, J g⁻¹ °C⁻¹. */
export const SPECIFIC_HEAT = 4.18;
/** Latent heat of vaporisation of water, J g⁻¹. */
export const LATENT_HEAT = 2260;
/** Newtonian cooling coefficient toward ambient, s⁻¹. */
export const COOLING_K = 0.006;
/** Extra thermal mass of the glassware, expressed as grams of water equivalent. */
export const GLASS_MASS_G = 12;

export type HeatStepInput = {
  temperatureC: number;
  volumeMl: number;
  heating: boolean;
  intensity?: number;
  ambientC?: number;
  dtSeconds?: number;
  boilingPointC?: number;
  canHeat?: boolean;
};

export type HeatStepResult = {
  temperatureC: number;
  volumeMl: number;
  boiledOffMl: number;
  boiling: boolean;
  steam: boolean;
  /** Watts actually delivered — 0 when the vessel is cold glass or the burner is off. */
  powerW: number;
};

export function boilingPointFor(portions: Portion[], chemicalsById?: Map<string, Chemical>): number {
  const water = portions.find((portion) => portion.chemicalId === 'H2O');
  const solventMassKg = Math.max(0.01, ((water?.mL ?? portions.reduce((sum, p) => sum + p.mL, 0)) / 1000));
  let soluteMoles = 0;
  for (const portion of portions) {
    const chemical = chemicalsById?.get(portion.chemicalId);
    if (portion.chemicalId === 'H2O') continue;
    if (chemical && chemical.state === 'gas') continue;
    // Dissociating salts raise the boiling point a little more per mole.
    const particles = chemical?.acidity && chemical.acidity.kind !== 'neutral' ? 2 : 1.5;
    soluteMoles += portion.moles * particles;
  }
  const molality = soluteMoles / solventMassKg;
  // Ebullioscopic constant of water = 0.512 °C·kg·mol⁻¹, capped to stay sane.
  return Math.min(112, 100 + 0.512 * Math.min(molality, 20));
}

export function stepHeat(input: HeatStepInput): HeatStepResult {
  const {
    temperatureC,
    volumeMl,
    heating,
    intensity = 1,
    ambientC = AMBIENT_C,
    dtSeconds = 1,
    canHeat = true
  } = input;
  const boilingPointC = input.boilingPointC ?? boilingPointFor([]);
  const massG = Math.max(0.5, volumeMl + GLASS_MASS_G);

  if (!heating || !canHeat || intensity <= 0) {
    // Passive cooling toward the room.
    const drift = (ambientC - temperatureC) * COOLING_K * dtSeconds;
    const next = temperatureC + drift;
    return {
      temperatureC: round1(next),
      volumeMl: round2(volumeMl),
      boiledOffMl: 0,
      boiling: false,
      steam: next > boilingPointC - 2,
      powerW: 0
    };
  }

  const powerW = BURNER_POWER_W * clamp01(intensity);
  const energyJ = powerW * dtSeconds;
  const gainC = energyJ / (massG * SPECIFIC_HEAT);
  const lossC = (temperatureC - ambientC) * COOLING_K * dtSeconds;
  let next = temperatureC + gainC - lossC;

  let boiledOffMl = 0;
  const boiling = next >= boilingPointC;
  if (boiling) {
    // Energy above the boiling point goes into latent heat instead of temperature.
    const overshootJ = (next - boilingPointC) * massG * SPECIFIC_HEAT;
    boiledOffMl = Math.min(volumeMl, overshootJ / LATENT_HEAT);
    next = boilingPointC;
  }

  return {
    temperatureC: round1(next),
    volumeMl: round2(Math.max(0, volumeMl - boiledOffMl)),
    boiledOffMl: round2(boiledOffMl),
    boiling,
    steam: boiling || next > boilingPointC - 3,
    powerW: round1(powerW)
  };
}

/** Temperature jump applied instantly by an exothermic / endothermic reaction. */
export function applyDeltaT(temperatureC: number, deltaT: number, volumeMl: number): number {
  if (!deltaT || volumeMl <= 0) return round1(temperatureC + deltaT);
  const massG = Math.max(1, volumeMl + GLASS_MASS_G);
  // Bigger volumes absorb the same reaction heat with a smaller temperature rise.
  const damped = deltaT * Math.min(1, 40 / massG + 0.25);
  return round1(temperatureC + damped);
}

export function heatColour(temperatureC: number): string {
  if (temperatureC < 40) return '#8fb6d6';
  if (temperatureC < 70) return '#f4b942';
  if (temperatureC < 100) return '#e8795b';
  return '#e0453c';
}

export function describeHeat(temperatureC: number, locale: 'bn' | 'en'): string {
  if (locale === 'bn') {
    if (temperatureC >= 100) return 'ফুটন্ত';
    if (temperatureC >= 60) return 'খুব গরম';
    if (temperatureC >= 38) return 'উষ্ণ';
    if (temperatureC <= 5) return 'ঠান্ডা';
    return 'স্বাভাবিক';
  }
  if (temperatureC >= 100) return 'Boiling';
  if (temperatureC >= 60) return 'Very hot';
  if (temperatureC >= 38) return 'Warm';
  if (temperatureC <= 5) return 'Cold';
  return 'Room temperature';
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round1(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : AMBIENT_C;
}

function round2(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}
