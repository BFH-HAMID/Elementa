import { describe, expect, it } from 'vitest';
import {
  calculateMethodOfMixtures,
  calculateJouleHeatingStep,
  calculateSearleConductivity,
  calculateNewtonCooling
} from '../thermoEngine';

describe('Thermodynamics Engine', () => {
  it('calculates specific heat by method of mixtures for copper cylinder', () => {
    // 100g copper at 100°C into 150g water at 22°C with 85g copper calorimeter
    const result = calculateMethodOfMixtures('copper', 100, 100, 150, 22, 85);
    expect(result.equilibriumTempCelsius).toBeGreaterThan(22);
    expect(result.equilibriumTempCelsius).toBeLessThan(35);
    expect(result.calculatedSpecificHeat).toBeCloseTo(385, 0);
  });

  it('calculates specific heat for aluminum (s = 900 J/kg·K)', () => {
    const result = calculateMethodOfMixtures('aluminum', 100, 100, 150, 22, 85);
    expect(result.calculatedSpecificHeat).toBeCloseTo(900, 0);
  });

  it('calculates Joule heating temperature rise (V=12V, I=2A, t=300s -> W=7200 J)', () => {
    const result = calculateJouleHeatingStep(12, 2, 300, 20, 200, 85);
    expect(result.electricalWorkJoules).toBe(7200);
    expect(result.currentTempCelsius).toBeGreaterThan(20);
    expect(result.tempRiseCelsius).toBeGreaterThan(5);
  });

  it('calculates Searle’s thermal conductivity of copper bar', () => {
    // water 0.5kg in 180s, deltaT_water = 4°C, rod diameter 40mm, dist 0.1m, deltaT_rod = 20°C -> K ≈ 185.1 W/m·K
    const result = calculateSearleConductivity(0.5, 180, 40, 0.1, 80, 60, 15, 19);
    expect(result.thermalConductivityK).toBeGreaterThan(150);
    expect(result.rateOfHeatFlowWatts).toBeGreaterThan(0);
  });

  it('calculates Newton’s law of cooling exponential decay', () => {
    const result = calculateNewtonCooling(80, 25, 0.003, 300);
    expect(result.currentTempC).toBeLessThan(80);
    expect(result.currentTempC).toBeGreaterThan(25);
  });
});
