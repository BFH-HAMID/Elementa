import { describe, expect, it } from 'vitest';
import {
  calculateSnellRefraction,
  calculateGlassSlabDisplacement,
  calculateLensImage,
  calculateMirrorImage,
  calculatePrismRefraction,
  calculateDoubleSlitPattern,
  calculateGratingDiffraction,
  calculateMalusIntensity
} from '../opticsEngine';

describe('Optics Engine', () => {
  it('calculates Snell’s law refraction angle correctly', () => {
    // Air (1.0) to Glass (1.5) with incidence 30°: sin r = sin 30 / 1.5 = 0.5 / 1.5 = 0.3333 -> r ≈ 19.47°
    const result = calculateSnellRefraction(30, 1.0, 1.5);
    expect(result.isTotalInternalReflection).toBe(false);
    expect(result.angleRefractionDeg).toBeCloseTo(19.47, 1);
  });

  it('detects Total Internal Reflection when exceeding critical angle', () => {
    // Glass (1.5) to Air (1.0): critical angle = asin(1/1.5) ≈ 41.81°
    const result = calculateSnellRefraction(50, 1.5, 1.0);
    expect(result.isTotalInternalReflection).toBe(true);
    expect(result.criticalAngleDeg).toBeCloseTo(41.81, 1);
  });

  it('calculates Glass Slab lateral displacement', () => {
    // Thickness 30 mm, i = 45°, n = 1.5 -> lateral shift > 0
    const { lateralShiftMm } = calculateGlassSlabDisplacement(45, 30, 1.5);
    expect(lateralShiftMm).toBeGreaterThan(5);
    expect(lateralShiftMm).toBeLessThan(15);
  });

  it('calculates Convex Lens image formation (u=30cm, f=15cm -> v=30cm, m=-1)', () => {
    // Object at 2f (30cm) -> image at 2f (30cm), real, inverted
    const image = calculateLensImage(30, 15, 2.0, 50.0);
    expect(image.exists).toBe(true);
    expect(image.isReal).toBe(true);
    expect(image.isErect).toBe(false);
    expect(image.magnification).toBeCloseTo(-1.0, 2);
    expect(image.x).toBeCloseTo(80.0, 1); // 50 + 30 = 80 cm
  });

  it('calculates Virtual Erect image for object within focal length (u=10cm, f=15cm)', () => {
    const image = calculateLensImage(10, 15, 2.0, 50.0);
    expect(image.exists).toBe(true);
    expect(image.isReal).toBe(false);
    expect(image.isErect).toBe(true);
    expect(image.magnification).toBeGreaterThan(1.0);
  });

  it('calculates Concave Mirror focal image', () => {
    const image = calculateMirrorImage(40, 20, 2.0, 80.0);
    expect(image.exists).toBe(true);
    expect(image.isReal).toBe(true);
    expect(image.magnification).toBeCloseTo(-1.0, 2);
  });

  it('calculates Prism minimum deviation angle', () => {
    // Equilateral A=60°, μ=1.5 -> δm = 2*asin(1.5*sin 30) - 60 = 2*asin(0.75) - 60 ≈ 97.18 - 60 = 37.18°
    const prism = calculatePrismRefraction(48.59, 60, 1.5);
    expect(prism.minimumDeviationDeg).toBeCloseTo(37.18, 1);
  });

  it('calculates Young’s Double Slit fringe width: β = λD/d', () => {
    // λ = 632.8 nm, D = 1.0 m, d = 0.25 mm -> β = 632.8e-9 * 1.0 / 0.25e-3 = 2.5312 mm
    const pattern = calculateDoubleSlitPattern(632.8, 0.25, 1.0);
    expect(pattern.fringeWidthMm).toBeCloseTo(2.531, 2);
  });

  it('calculates Diffraction Grating angles: d sin θ = n λ', () => {
    // 500 lines/mm => d = 2000 nm. For λ = 632.8 nm: sin θ1 = 632.8 / 2000 = 0.3164 -> θ1 ≈ 18.45°
    const grating = calculateGratingDiffraction(632.8, 500, 2);
    expect(grating.orders[0].order).toBe(1);
    expect(grating.orders[0].sinTheta).toBeCloseTo(0.3164, 3);
    expect(grating.orders[0].angleDeg).toBeCloseTo(18.45, 1);
  });

  it('calculates Malus’s Law polarization intensity', () => {
    // At 45°, I = 100 * cos²(45°) = 50%
    const intensity45 = calculateMalusIntensity(45, 100);
    expect(intensity45).toBeCloseTo(50, 1);

    // At 90°, crossed polarizers block light: I = 0
    const intensity90 = calculateMalusIntensity(90, 100);
    expect(intensity90).toBeCloseTo(0, 1);
  });
});
