import type { MeasurementReadingResult } from './physicsTypes';

/**
 * Vernier Caliper calculation.
 * MSD: Main Scale Division (default 1 mm).
 * VSD Count: Number of Vernier Scale divisions (e.g. 10 divisions = 0.1 mm LC; 50 divisions = 0.02 mm LC).
 * Zero Error: Positive when vernier zero is to the right of main zero (+ZE), negative when to left (-ZE).
 */
export function calculateVernierReading(
  actualDimensionMm: number,
  msdMm = 1.0,
  vsdCount = 10,
  zeroErrorMm = 0.0
): MeasurementReadingResult {
  const leastCount = msdMm / vsdCount; // e.g., 1 / 10 = 0.1 mm
  const uncorrectedMm = Math.max(0, actualDimensionMm + zeroErrorMm);

  const mainScaleReading = Math.floor(uncorrectedMm / msdMm) * msdMm;
  const remainder = uncorrectedMm - mainScaleReading;
  const vernierOrCircularReading = Math.min(
    vsdCount - 1,
    Math.max(0, Math.round(remainder / leastCount))
  );

  const totalRaw = mainScaleReading + vernierOrCircularReading * leastCount;
  const correctedReading = Number((totalRaw - zeroErrorMm).toFixed(3));

  const breakdown = `MSR = ${mainScaleReading.toFixed(1)} mm, VSR = ${vernierOrCircularReading} div, LC = ${leastCount.toFixed(2)} mm, ZE = ${zeroErrorMm.toFixed(2)} mm → Total = ${mainScaleReading.toFixed(1)} + (${vernierOrCircularReading} × ${leastCount.toFixed(2)}) - (${zeroErrorMm.toFixed(2)}) = ${correctedReading.toFixed(2)} mm`;
  const breakdown_bn = `প্রধান স্কেল পাঠ = ${mainScaleReading.toFixed(1)} মিমি, ভার্নিয়ার সমপাতন = ${vernierOrCircularReading}, ভার্নিয়ার ধ্রুবক = ${leastCount.toFixed(2)} মিমি, শূন্য ত্রুটি = ${zeroErrorMm.toFixed(2)} মিমি → মোট পাঠ = ${correctedReading.toFixed(2)} মিমি`;

  return {
    toolId: 'vernier-caliper',
    mainScaleReading,
    vernierOrCircularReading,
    leastCount,
    zeroError: zeroErrorMm,
    correctedReading,
    unit: 'mm',
    breakdown,
    breakdown_bn
  };
}

/**
 * Micrometer Screw Gauge calculation.
 * Pitch: linear distance per revolution (default 1.0 mm or 0.5 mm).
 * Circular Divisions: typically 100 or 50 divisions.
 */
export function calculateScrewGaugeReading(
  actualGapMm: number,
  pitchMm = 1.0,
  circularDivisions = 100,
  zeroErrorMm = 0.0
): MeasurementReadingResult {
  const leastCount = pitchMm / circularDivisions; // e.g. 1.0 / 100 = 0.01 mm
  const uncorrectedMm = Math.max(0, actualGapMm + zeroErrorMm);

  const mainScaleReading = Math.floor(uncorrectedMm / pitchMm) * pitchMm;
  const remainder = uncorrectedMm - mainScaleReading;
  const vernierOrCircularReading = Math.min(
    circularDivisions - 1,
    Math.max(0, Math.round(remainder / leastCount))
  );

  const totalRaw = mainScaleReading + vernierOrCircularReading * leastCount;
  const correctedReading = Number((totalRaw - zeroErrorMm).toFixed(4));

  const breakdown = `PSR = ${mainScaleReading.toFixed(2)} mm, CSR = ${vernierOrCircularReading} div, LC = ${leastCount.toFixed(3)} mm, ZE = ${zeroErrorMm.toFixed(3)} mm → Total = ${mainScaleReading.toFixed(2)} + (${vernierOrCircularReading} × ${leastCount.toFixed(3)}) - (${zeroErrorMm.toFixed(3)}) = ${correctedReading.toFixed(3)} mm`;
  const breakdown_bn = `রৈখিক স্কেল পাঠ = ${mainScaleReading.toFixed(2)} মিমি, বৃত্তাকার স্কেল ভাগ = ${vernierOrCircularReading}, লঘিষ্ঠ গণন = ${leastCount.toFixed(3)} মিমি, শূন্য ত্রুটি = ${zeroErrorMm.toFixed(3)} মিমি → মোট পাঠ = ${correctedReading.toFixed(3)} মিমি`;

  return {
    toolId: 'screw-gauge',
    mainScaleReading,
    vernierOrCircularReading,
    leastCount,
    zeroError: zeroErrorMm,
    correctedReading,
    unit: 'mm',
    breakdown,
    breakdown_bn
  };
}

/**
 * Travelling Microscope calculation.
 * MSD: 0.05 cm (0.5 mm), Vernier divisions: 50 -> LC = 0.05 / 50 = 0.001 cm (0.01 mm).
 */
export function calculateTravellingMicroscopeReading(
  actualCm: number,
  msdCm = 0.05,
  vsdCount = 50,
  zeroErrorCm = 0.0
): MeasurementReadingResult {
  const leastCount = msdCm / vsdCount; // 0.001 cm
  const uncorrectedCm = Math.max(0, actualCm + zeroErrorCm);

  const mainScaleReading = Math.floor(uncorrectedCm / msdCm) * msdCm;
  const remainder = uncorrectedCm - mainScaleReading;
  const vernierOrCircularReading = Math.min(
    vsdCount - 1,
    Math.max(0, Math.round(remainder / leastCount))
  );

  const totalRaw = mainScaleReading + vernierOrCircularReading * leastCount;
  const correctedReading = Number((totalRaw - zeroErrorCm).toFixed(5));

  const breakdown = `MSR = ${mainScaleReading.toFixed(3)} cm, VSR = ${vernierOrCircularReading} div, LC = ${leastCount.toFixed(4)} cm → Total = ${correctedReading.toFixed(4)} cm`;
  const breakdown_bn = `প্রধান স্কেল = ${mainScaleReading.toFixed(3)} সেমি, ভার্নিয়ার ভাগ = ${vernierOrCircularReading}, LC = ${leastCount.toFixed(4)} সেমি → মোট পাঠ = ${correctedReading.toFixed(4)} সেমি`;

  return {
    toolId: 'travelling-microscope',
    mainScaleReading,
    vernierOrCircularReading,
    leastCount,
    zeroError: zeroErrorCm,
    correctedReading,
    unit: 'cm',
    breakdown,
    breakdown_bn
  };
}

/**
 * Spherometer calculation for radius of curvature of spherical surface:
 * R = (l^2) / (6 * h) + h / 2
 * where l is the mean distance between two legs, h is the sagittal height.
 */
export function calculateSpherometerRadius(lCm: number, hCm: number): { radiusCm: number; powerDiopters: number } {
  if (hCm <= 0) return { radiusCm: Infinity, powerDiopters: 0 };
  const radiusCm = (lCm * lCm) / (6 * hCm) + hCm / 2;
  const radiusMeters = radiusCm / 100;
  // Refractive index assumption for lens surface (n=1.5): Power = (n - 1) / R
  const powerDiopters = (1.5 - 1.0) / radiusMeters;
  return { radiusCm: Number(radiusCm.toFixed(2)), powerDiopters: Number(powerDiopters.toFixed(2)) };
}

/**
 * Adds realistic measurement noise / random error within bounds.
 */
export function applyMeasurementNoise(
  trueValue: number,
  leastCount: number,
  noiseEnabled = true,
  noiseLevel = 1.0
): number {
  if (!noiseEnabled || leastCount <= 0) return trueValue;
  // Uniform pseudo-random error within [-leastCount * noiseLevel, +leastCount * noiseLevel]
  const error = (Math.random() * 2 - 1) * leastCount * noiseLevel;
  return Number((trueValue + error).toFixed(5));
}

/**
 * Percentage Error calculation:
 * % Error = (|Experimental - Theoretical| / Theoretical) * 100%
 */
export function calculatePercentageError(
  experimental: number,
  theoretical: number
): { errorAbsolute: number; percentError: number } {
  const errorAbsolute = Math.abs(experimental - theoretical);
  if (theoretical === 0) {
    return { errorAbsolute, percentError: experimental === 0 ? 0 : 100 };
  }
  const percentError = (errorAbsolute / Math.abs(theoretical)) * 100;
  return {
    errorAbsolute: Number(errorAbsolute.toFixed(4)),
    percentError: Number(percentError.toFixed(2))
  };
}

/**
 * Linear regression (y = m*x + c) with correlation coefficient R^2.
 */
export function calculateLinearRegression(
  points: { x: number; y: number }[]
): { slope: number; intercept: number; rSquared: number; equation: string } {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, equation: 'y = 0' };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-12) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, equation: `y = ${(sumY / n).toFixed(2)}` };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Correlation coefficient r
  const numeratorR = n * sumXY - sumX * sumY;
  const denomR = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const r = denomR !== 0 ? numeratorR / denomR : 0;
  const rSquared = Math.min(1, Math.max(0, r * r));

  const sign = intercept >= 0 ? '+' : '-';
  const equation = `y = ${slope.toFixed(3)}x ${sign} ${Math.abs(intercept).toFixed(3)}`;

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    rSquared: Number(rSquared.toFixed(4)),
    equation
  };
}

/**
 * Calculates mean, standard deviation, and standard error.
 */
export function calculateStatistics(values: number[]): {
  mean: number;
  variance: number;
  standardDeviation: number;
  standardError: number;
} {
  const n = values.length;
  if (n === 0) return { mean: 0, variance: 0, standardDeviation: 0, standardError: 0 };
  if (n === 1) return { mean: values[0], variance: 0, standardDeviation: 0, standardError: 0 };

  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const standardDeviation = Math.sqrt(variance);
  const standardError = standardDeviation / Math.sqrt(n);

  return {
    mean: Number(mean.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    standardDeviation: Number(standardDeviation.toFixed(4)),
    standardError: Number(standardError.toFixed(4))
  };
}
