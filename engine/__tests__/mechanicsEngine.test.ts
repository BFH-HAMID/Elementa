import { describe, expect, it } from 'vitest';
import {
  calculatePendulumStep,
  calculateSpringStep,
  calculateInclinedPlaneStep,
  calculateProjectileMotion,
  calculateAtwoodMachine,
  calculateNewtonsSecondLaw
} from '../mechanicsEngine';

describe('Mechanics Engine', () => {
  it('calculates simple pendulum period: L=1.0m -> T ≈ 2.006 s', () => {
    const result = calculatePendulumStep(1.0, 0.05, 0.08, 0, 0.02, 9.80665);
    expect(result.periodTheoretical).toBeCloseTo(2.006, 2);
  });

  it('calculates spring constant oscillation period: k=25 N/m, m=0.1 kg -> T ≈ 0.397 s', () => {
    const result = calculateSpringStep(25, 0.1, 0.02, 0, 0.02, 9.80665);
    expect(result.periodTheoretical).toBeCloseTo(0.397, 2);
    expect(result.staticExtensionM).toBeCloseTo(0.0392, 3);
  });

  it('calculates inclined plane friction and sliding threshold', () => {
    // Mass 0.5 kg at 15° with static friction coeff 0.35: tan 15° = 0.2679 < 0.35 -> should NOT slide
    const noSlide = calculateInclinedPlaneStep(0.5, 15, 0.35, 0.25);
    expect(noSlide.isSliding).toBe(false);
    expect(noSlide.acceleration).toBe(0);

    // At 30°: tan 30° = 0.577 > 0.35 -> SHOULD slide with positive acceleration
    const slide = calculateInclinedPlaneStep(0.5, 30, 0.35, 0.25);
    expect(slide.isSliding).toBe(true);
    expect(slide.acceleration).toBeGreaterThan(0);
  });

  it('calculates projectile motion range and maximum height (v0=10m/s, θ=45°)', () => {
    // R = v0^2 * sin(90) / g = 100 / 9.80665 ≈ 10.197 m
    // H = v0^2 * sin^2(45) / (2g) = 100 * 0.5 / 19.6133 ≈ 2.549 m
    const proj = calculateProjectileMotion(10, 45, 0, 9.80665);
    expect(proj.rangeM).toBeCloseTo(10.197, 2);
    expect(proj.maxHeightM).toBeCloseTo(2.549, 2);
    expect(proj.trajectory.length).toBeGreaterThan(10);
  });

  it('calculates Atwood machine acceleration and rope tension (m1=0.22kg, m2=0.20kg)', () => {
    // a = (0.02 / 0.42) * 9.80665 ≈ 0.467 m/s^2
    // T = (2 * 0.22 * 0.20 * 9.80665) / 0.42 ≈ 2.055 N
    const atwood = calculateAtwoodMachine(0.22, 0.20);
    expect(atwood.acceleration).toBeCloseTo(0.467, 2);
    expect(atwood.tensionN).toBeCloseTo(2.055, 2);
  });

  it('calculates Newton’s 2nd Law F = ma for cart and hanging mass', () => {
    const result = calculateNewtonsSecondLaw(0.5, 0.05, 9.80665);
    expect(result.netForceN).toBeCloseTo(0.4903, 3);
    expect(result.totalMassKg).toBeCloseTo(0.55, 2);
    expect(result.accelerationMps2).toBeCloseTo(0.8915, 3);
  });
});
