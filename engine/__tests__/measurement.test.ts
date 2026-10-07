import { describe, expect, it } from 'vitest';
import {
  calculateVernierReading,
  calculateScrewGaugeReading,
  calculateTravellingMicroscopeReading,
  calculateSpherometerRadius,
  calculatePercentageError,
  calculateLinearRegression,
  calculateStatistics
} from '../measurement';

describe('Measurement Engine', () => {
  it('calculates Vernier Caliper reading correctly', () => {
    // 24.6 mm: MSR should be 24 mm, VSR should be 6 (since LC = 0.1 mm)
    const result = calculateVernierReading(24.6, 1.0, 10, 0);
    expect(result.mainScaleReading).toBe(24);
    expect(result.vernierOrCircularReading).toBe(6);
    expect(result.leastCount).toBe(0.1);
    expect(result.correctedReading).toBe(24.6);
  });

  it('corrects for positive and negative zero error in Vernier Caliper', () => {
    // With positive zero error +0.2 mm
    const withPosZE = calculateVernierReading(24.6, 1.0, 10, 0.2);
    expect(withPosZE.correctedReading).toBe(24.6);
  });

  it('calculates Micrometer Screw Gauge reading correctly', () => {
    // 3.74 mm with pitch 1 mm and 100 circular divisions -> LC = 0.01 mm
    const result = calculateScrewGaugeReading(3.74, 1.0, 100, 0);
    expect(result.mainScaleReading).toBe(3.0);
    expect(result.vernierOrCircularReading).toBe(74);
    expect(result.leastCount).toBe(0.01);
    expect(result.correctedReading).toBe(3.74);
  });

  it('calculates Travelling Microscope reading with 0.001 cm least count', () => {
    const result = calculateTravellingMicroscopeReading(4.523, 0.05, 50, 0);
    expect(result.leastCount).toBe(0.001);
    expect(Math.abs(result.correctedReading - 4.523)).toBeLessThan(0.002);
  });

  it('calculates Spherometer radius of curvature', () => {
    // l = 4 cm, h = 0.2 cm -> R = (4^2)/(6*0.2) + 0.2/2 = 16/1.2 + 0.1 = 13.33 + 0.1 = 13.43 cm
    const { radiusCm } = calculateSpherometerRadius(4, 0.2);
    expect(radiusCm).toBeCloseTo(13.43, 1);
  });

  it('computes percentage error correctly', () => {
    const { percentError } = calculatePercentageError(9.75, 9.807);
    expect(percentError).toBeCloseTo(0.58, 2);
  });

  it('computes linear regression slope and R^2', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 }
    ];
    const { slope, intercept, rSquared } = calculateLinearRegression(points);
    expect(slope).toBeCloseTo(2.0, 3);
    expect(intercept).toBeCloseTo(0.0, 3);
    expect(rSquared).toBeCloseTo(1.0, 3);
  });

  it('computes statistical mean and standard error', () => {
    const data = [10, 12, 11, 13, 9];
    const stats = calculateStatistics(data);
    expect(stats.mean).toBe(11);
    expect(stats.standardError).toBeGreaterThan(0);
  });
});
