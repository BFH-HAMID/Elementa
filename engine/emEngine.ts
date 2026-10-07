export const CONSTANTS = {
  h: 6.62607015e-34, // Planck's constant (J·s)
  c: 2.99792458e8, // Speed of light (m/s)
  e: 1.602176634e-19, // Elementary charge (C)
  mu0: 4 * Math.PI * 1e-7, // Vacuum permeability (T·m/A)
  earthBh: 3.5e-5 // Earth's horizontal magnetic field ~ 35 microTesla
};

export const WORK_FUNCTION_EV: Record<string, number> = {
  cesium: 2.14,
  potassium: 2.30,
  sodium: 2.36,
  zinc: 4.30,
  copper: 4.70,
  platinum: 5.65
};

export interface DeflectionMagnetometerResult {
  magneticFieldTesla: number;
  deflectionAngleDeg: number;
  tanTheta: number;
  magneticMomentM: number;
}

export interface SolenoidFieldResult {
  magneticFieldTesla: number;
  magneticFluxWebers: number;
  turnsDensityPerM: number;
}

export interface PhotoelectricResult {
  photonEnergyEv: number;
  workFunctionEv: number;
  maxKineticEnergyEv: number;
  stoppingPotentialVolts: number;
  isEmitting: boolean;
  photocurrentMicroAmps: number;
}

export interface GmCounterResult {
  countsPerMinute: number;
  countsPerSecond: number;
  doseRateMicroSvHr: number;
  backgroundCpm: number;
}

/** Convert degrees to radians */
const deg2rad = (deg: number) => (deg * Math.PI) / 180;
/** Convert radians to degrees */
const rad2deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Deflection Magnetometer (Tangent Law):
 * Tan-A (End-on): B = (mu0 / 4pi) * (2M / d^3)
 * Tan-B (Broadside-on): B = (mu0 / 4pi) * (M / d^3)
 * Tangent Law: B = Bh * tan(θ) => tan(θ) = B / Bh
 */
export function calculateDeflectionMagnetometer(
  magneticMomentAm2 = 1.5,
  distanceCm = 20,
  mode: 'tan-A' | 'tan-B' = 'tan-A',
  earthBh = CONSTANTS.earthBh
): DeflectionMagnetometerResult {
  const dMeters = distanceCm / 100;
  const factor = 1e-7; // mu0 / (4*pi)

  let B: number;
  if (mode === 'tan-A') {
    B = (factor * 2 * magneticMomentAm2) / Math.pow(dMeters, 3);
  } else {
    B = (factor * magneticMomentAm2) / Math.pow(dMeters, 3);
  }

  const tanTheta = B / earthBh;
  const thetaRad = Math.atan(tanTheta);
  const deflectionAngleDeg = rad2deg(thetaRad);

  return {
    magneticFieldTesla: Number(B.toExponential(4)),
    deflectionAngleDeg: Number(deflectionAngleDeg.toFixed(2)),
    tanTheta: Number(tanTheta.toFixed(4)),
    magneticMomentM: magneticMomentAm2
  };
}

/**
 * Solenoid & Electromagnet Magnetic Field:
 * B = mu0 * n * I = mu0 * (N / L) * I
 */
export function calculateSolenoidField(
  turns: number,
  lengthCm: number,
  currentAmps: number,
  coreRelativePermeability = 1.0 // 1.0 for air, ~200-1000 for soft iron core
): SolenoidFieldResult {
  const lengthM = lengthCm / 100;
  const n = turns / lengthM; // turns per meter
  const mu = CONSTANTS.mu0 * coreRelativePermeability;

  const B = mu * n * currentAmps;
  const radiusM = 0.02; // 2 cm coil radius
  const areaM2 = Math.PI * radiusM * radiusM;
  const magneticFluxWebers = B * areaM2;

  return {
    magneticFieldTesla: Number(B.toFixed(5)),
    magneticFluxWebers: Number(magneticFluxWebers.toExponential(4)),
    turnsDensityPerM: Number(n.toFixed(1))
  };
}

/**
 * Photoelectric Effect calculation:
 * E = h*c / λ
 * Kmax = E - Φ
 * V0 = Kmax / e
 */
export function calculatePhotoelectricEffect(
  wavelengthNm: number,
  retardingVoltage = 0,
  cathodeMaterial: keyof typeof WORK_FUNCTION_EV = 'potassium',
  lightIntensityPercent = 80
): PhotoelectricResult {
  const lambdaMeters = wavelengthNm * 1e-9;
  const photonEnergyJoules = (CONSTANTS.h * CONSTANTS.c) / lambdaMeters;
  const photonEnergyEv = photonEnergyJoules / CONSTANTS.e;

  const workFunctionEv = WORK_FUNCTION_EV[cathodeMaterial] || 2.30;
  const maxKineticEnergyEv = Math.max(0, photonEnergyEv - workFunctionEv);
  const stoppingPotentialVolts = Number(maxKineticEnergyEv.toFixed(3));
  const isEmitting = photonEnergyEv > workFunctionEv;

  let photocurrentMicroAmps = 0;
  if (isEmitting) {
    const satCurrent = (lightIntensityPercent / 100) * 15.0; // 15 uA sat current at 100%
    if (retardingVoltage >= stoppingPotentialVolts) {
      photocurrentMicroAmps = 0;
    } else if (retardingVoltage <= 0) {
      photocurrentMicroAmps = satCurrent;
    } else {
      // Linear drop towards stopping potential
      const fraction = 1 - retardingVoltage / stoppingPotentialVolts;
      photocurrentMicroAmps = satCurrent * Math.pow(fraction, 1.2);
    }
  }

  return {
    photonEnergyEv: Number(photonEnergyEv.toFixed(3)),
    workFunctionEv: Number(workFunctionEv.toFixed(3)),
    maxKineticEnergyEv: Number(maxKineticEnergyEv.toFixed(3)),
    stoppingPotentialVolts,
    isEmitting,
    photocurrentMicroAmps: Number(photocurrentMicroAmps.toFixed(2))
  };
}

/**
 * Geiger-Müller Radiation Counter & Inverse Square Law:
 * CPS(r) = (Activity / (4 * pi * r^2)) * geomFactor + background
 */
export function calculateGmCounter(
  sourceDistanceCm: number,
  isotope: 'cobalt-60' | 'cesium-137' | 'strontium-90' = 'cobalt-60',
  shieldingMaterial: 'none' | 'paper' | 'aluminum' | 'lead' = 'none',
  shieldingThicknessMm = 0
): GmCounterResult {
  const backgroundCpm = 25; // 25 counts/min background
  const rCm = Math.max(1, sourceDistanceCm);

  // Source base activity factor (counts at 10 cm without shield)
  const baseRateAt10Cm = isotope === 'cobalt-60' ? 1200 : isotope === 'cesium-137' ? 950 : 800;

  // Inverse square scaling: Rate(r) = Rate(10) * (10 / r)^2
  let rawCpm = baseRateAt10Cm * Math.pow(10 / rCm, 2);

  // Shielding attenuation
  if (shieldingMaterial !== 'none' && shieldingThicknessMm > 0) {
    let muMm = 0.05; // attenuation coeff per mm
    if (shieldingMaterial === 'paper') muMm = 0.01;
    if (shieldingMaterial === 'aluminum') muMm = 0.08;
    if (shieldingMaterial === 'lead') muMm = 0.45;
    rawCpm = rawCpm * Math.exp(-muMm * shieldingThicknessMm);
  }

  const netCpm = rawCpm + backgroundCpm;
  const countsPerSecond = netCpm / 60;
  // Approximate dose rate in microSieverts per hour (100 CPM ≈ 0.1 uSv/hr)
  const doseRateMicroSvHr = Number((netCpm * 0.001).toFixed(3));

  return {
    countsPerMinute: Math.round(netCpm),
    countsPerSecond: Number(countsPerSecond.toFixed(1)),
    doseRateMicroSvHr,
    backgroundCpm
  };
}
