import { describe, expect, it } from 'vitest';
import {
  calculateDeflectionMagnetometer,
  calculateSolenoidField,
  calculatePhotoelectricEffect,
  calculateGmCounter
} from '../emEngine';

describe('Electromagnetism & Modern Physics Engine', () => {
  it('calculates Deflection Magnetometer Tangent Law in Tan-A position', () => {
    // M = 1.5 A·m^2, d = 0.2 m -> B = 1e-7 * 2 * 1.5 / 0.008 = 3.75e-5 T
    // tan θ = 3.75e-5 / 3.5e-5 ≈ 1.0714 -> θ ≈ 47°
    const result = calculateDeflectionMagnetometer(1.5, 20, 'tan-A');
    expect(result.deflectionAngleDeg).toBeGreaterThan(40);
    expect(result.deflectionAngleDeg).toBeLessThan(55);
  });

  it('calculates Solenoid magnetic field: N=300, L=15cm, I=2A -> B = mu0 * (300/0.15) * 2 ≈ 0.00503 T', () => {
    const result = calculateSolenoidField(300, 15, 2.0);
    expect(result.magneticFieldTesla).toBeCloseTo(0.00503, 4);
    expect(result.turnsDensityPerM).toBe(2000);
  });

  it('calculates Photoelectric effect photon energy and stopping potential', () => {
    // 365 nm UV on Potassium (Φ = 2.30 eV): E = 1240 / 365 ≈ 3.397 eV -> V0 = 3.397 - 2.30 ≈ 1.097 V
    const result = calculatePhotoelectricEffect(365, 0, 'potassium');
    expect(result.isEmitting).toBe(true);
    expect(result.photonEnergyEv).toBeCloseTo(3.40, 1);
    expect(result.stoppingPotentialVolts).toBeCloseTo(1.10, 1);
    expect(result.photocurrentMicroAmps).toBeGreaterThan(0);

    // With retarding potential V > V0, photocurrent drops to 0
    const cutoff = calculatePhotoelectricEffect(365, 1.5, 'potassium');
    expect(cutoff.photocurrentMicroAmps).toBe(0);
  });

  it('calculates GM Counter inverse square law: distance doubled -> counts ~ 1/4th', () => {
    const at10Cm = calculateGmCounter(10, 'cobalt-60');
    const at20Cm = calculateGmCounter(20, 'cobalt-60');
    // At 20cm, raw rate should be ~ 1200 / 4 = 300 (+ background 25) = 325 CPM
    expect(at20Cm.countsPerMinute).toBeLessThan(at10Cm.countsPerMinute / 2);
    expect(at20Cm.countsPerMinute).toBeCloseTo(325, -2);
  });
});
