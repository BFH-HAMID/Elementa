import { describe, expect, it } from 'vitest';
import {
  AMBIENT_C,
  BURNER_POWER_W,
  applyDeltaT,
  boilingPointFor,
  describeHeat,
  heatColour,
  stepHeat
} from '../heatModel';
import { makePortion } from '../reactionEngine';
import { chemicalsById, chemical } from './helpers';

describe('stepHeat', () => {
  it('does nothing when the burner is off and the liquid is already at room temperature', () => {
    const result = stepHeat({ temperatureC: AMBIENT_C, volumeMl: 50, heating: false, dtSeconds: 1 });
    expect(result.temperatureC).toBeCloseTo(AMBIENT_C, 5);
    expect(result.powerW).toBe(0);
    expect(result.boiling).toBe(false);
  });

  it('cools a hot vessel back toward the room', () => {
    const result = stepHeat({ temperatureC: 80, volumeMl: 50, heating: false, dtSeconds: 1 });
    expect(result.temperatureC).toBeLessThan(80);
    expect(result.temperatureC).toBeGreaterThan(AMBIENT_C);
  });

  it('heats faster with a stronger flame', () => {
    const low = stepHeat({ temperatureC: 25, volumeMl: 50, heating: true, intensity: 0.25, dtSeconds: 1 });
    const high = stepHeat({ temperatureC: 25, volumeMl: 50, heating: true, intensity: 1, dtSeconds: 1 });
    expect(high.temperatureC).toBeGreaterThan(low.temperatureC);
    expect(high.powerW).toBeCloseTo(BURNER_POWER_W, 3);
  });

  it('heats a small volume faster than a large one', () => {
    const small = stepHeat({ temperatureC: 25, volumeMl: 10, heating: true, dtSeconds: 1 });
    const large = stepHeat({ temperatureC: 25, volumeMl: 200, heating: true, dtSeconds: 1 });
    expect(small.temperatureC).toBeGreaterThan(large.temperatureC);
  });

  it('caps at the boiling point and boils liquid away', () => {
    const result = stepHeat({ temperatureC: 99, volumeMl: 50, heating: true, dtSeconds: 5, boilingPointC: 100 });
    expect(result.boiling).toBe(true);
    expect(result.temperatureC).toBe(100);
    expect(result.boiledOffMl).toBeGreaterThan(0);
    expect(result.volumeMl).toBeLessThan(50);
    expect(result.steam).toBe(true);
  });

  it('never boils the vessel dry below zero', () => {
    const result = stepHeat({ temperatureC: 100, volumeMl: 0.4, heating: true, dtSeconds: 60, boilingPointC: 100 });
    expect(result.volumeMl).toBeGreaterThanOrEqual(0);
  });

  it('respects glassware that cannot be heated', () => {
    const result = stepHeat({ temperatureC: 25, volumeMl: 50, heating: true, canHeat: false, dtSeconds: 5 });
    expect(result.temperatureC).toBeCloseTo(25, 5);
    expect(result.powerW).toBe(0);
  });
});

describe('applyDeltaT', () => {
  it('damps the same reaction heat in a bigger volume', () => {
    const small = applyDeltaT(25, 18, 10);
    const large = applyDeltaT(25, 18, 250);
    expect(small).toBeGreaterThan(large);
    expect(large).toBeGreaterThan(25);
  });

  it('handles endothermic changes', () => {
    expect(applyDeltaT(25, -4, 20)).toBeLessThan(25);
  });

  it('still records a change in an empty vessel', () => {
    expect(applyDeltaT(25, 5, 0)).toBe(30);
  });
});

describe('boilingPointFor', () => {
  it('is 100 °C for pure water', () => {
    expect(boilingPointFor([makePortion(chemical('H2O'), 100)])).toBeCloseTo(100, 5);
  });

  it('rises when a solute is dissolved', () => {
    const pure = boilingPointFor([makePortion(chemical('H2O'), 100)]);
    const salty = boilingPointFor([makePortion(chemical('H2O'), 100), makePortion(chemical('NaCl'), 100)], chemicalsById);
    expect(salty).toBeGreaterThan(pure);
  });

  it('ignores gases in the headspace', () => {
    const withGas = boilingPointFor([makePortion(chemical('H2O'), 100), makePortion(chemical('CO2'), 100)], chemicalsById);
    expect(withGas).toBeCloseTo(100, 5);
  });
});

describe('readouts', () => {
  it('names the heat level in both languages', () => {
    expect(describeHeat(101, 'en')).toBe('Boiling');
    expect(describeHeat(101, 'bn')).toBe('ফুটন্ত');
    expect(describeHeat(20, 'en')).toBe('Room temperature');
  });

  it('colours the thermometer', () => {
    expect(heatColour(20)).toBe('#8fb6d6');
    expect(heatColour(150)).toBe('#e0453c');
  });
});
