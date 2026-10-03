import { describe, expect, it } from 'vitest';
import {
  COLORLESS,
  computePh,
  formatPh,
  indicatorColor,
  indicatorLabel,
  kwAt,
  neutralPhAt,
  observedColor,
  titreVolumeMl
} from '../phCalc';
import { makePortion } from '../reactionEngine';
import type { Portion } from '../types';
import { chemicalsById, chemical } from './helpers';

const pHOf = (portions: Portion[], volumeMl: number, temperatureC = 25) =>
  computePh({ portions, volumeMl, chemicalsById, temperatureC });

describe('computePh', () => {
  it('returns neutral for pure water', () => {
    const result = pHOf([makePortion(chemical('H2O'), 100)], 100);
    expect(result.ph).toBeCloseTo(7, 2);
    expect(result.nature).toBe('neutral');
    expect(result.dominantId).toBeNull();
  });

  it('gives pH 1 for 0.1 M hydrochloric acid', () => {
    const result = pHOf([makePortion(chemical('HCl'), 10)], 100);
    expect(result.ph).toBeCloseTo(1, 2);
    expect(result.nature).toBe('acidic');
    expect(result.dominantId).toBe('HCl');
  });

  it('gives pH 13 for 0.1 M sodium hydroxide', () => {
    const result = pHOf([makePortion(chemical('NaOH'), 10)], 100);
    expect(result.ph).toBeCloseTo(13, 1);
    expect(result.nature).toBe('alkaline');
  });

  it('neutralises equal amounts of strong acid and strong base', () => {
    const result = pHOf([makePortion(chemical('HCl'), 25), makePortion(chemical('NaOH'), 25)], 50);
    expect(result.ph).toBeCloseTo(7, 1);
    expect(result.nature).toBe('neutral');
  });

  it('stays acidic when the acid is in excess', () => {
    const result = pHOf([makePortion(chemical('HCl'), 30), makePortion(chemical('NaOH'), 10)], 40);
    expect(result.ph).toBeLessThan(2);
    expect(result.nature).toBe('acidic');
  });

  it('goes alkaline past the equivalence point', () => {
    const result = pHOf([makePortion(chemical('HCl'), 10), makePortion(chemical('NaOH'), 30)], 40);
    expect(result.ph).toBeGreaterThan(12);
    expect(result.nature).toBe('alkaline');
  });

  it('uses the weak-acid approximation for ethanoic acid', () => {
    const result = pHOf([makePortion(chemical('CH3COOH'), 100)], 100);
    expect(result.ph).toBeCloseTo(2.37, 1);
    expect(result.ph).toBeGreaterThan(pHOf([makePortion(chemical('HCl'), 100)], 100).ph);
  });

  it('treats a salt of a weak acid as alkaline', () => {
    const result = pHOf([makePortion(chemical('Na2CO3'), 50)], 50);
    expect(result.ph).toBeGreaterThan(8.5);
  });

  it('counts both protons of sulphuric acid', () => {
    const sulphuric = pHOf([makePortion(chemical('H2SO4'), 10)], 100);
    const hydrochloric = pHOf([makePortion(chemical('HCl'), 10)], 100);
    expect(sulphuric.ph).toBeLessThan(hydrochloric.ph);
    expect(sulphuric.ph).toBeCloseTo(0.7, 1);
  });

  it('shifts neutrality down when hot', () => {
    expect(neutralPhAt(25)).toBeCloseTo(7, 2);
    expect(neutralPhAt(100)).toBeLessThan(6.5);
    expect(kwAt(100)).toBeGreaterThan(kwAt(25));
  });

  it('clamps absurd values and formats sensibly', () => {
    const result = pHOf([makePortion(chemical('HCl'), 100)], 1);
    expect(result.ph).toBeGreaterThanOrEqual(-1);
    expect(formatPh(7)).toBe('7.0');
    expect(formatPh(6.53)).toBe('6.53');
  });

  it('computes the titre volume for a known amount of acid', () => {
    const acid = pHOf([makePortion(chemical('HCl'), 20)], 20);
    expect(acid.ph).toBeCloseTo(0, 1); // 1.0 M strong acid
    // 0.02 mol HCl needs 20 mL of 1 M NaOH.
    expect(titreVolumeMl(0.02, 1, 1)).toBeCloseTo(20, 5);
  });
});

describe('indicator colours', () => {
  it('litmus: red in acid, purple near neutral, blue in base', () => {
    expect(indicatorColor('litmus', 1)).toBe('#d9403c');
    expect(indicatorColor('litmus', 7)).toBe('#8a5fbf');
    expect(indicatorColor('litmus', 12)).toBe('#2f6fd0');
  });

  it('phenolphthalein: colourless in acid, pink in base, colourless again above pH 13', () => {
    expect(indicatorColor('phenolphthalein', 3)).toBe(COLORLESS);
    expect(indicatorColor('phenolphthalein', 9)).toBe('#f06fb0');
    expect(indicatorColor('phenolphthalein', 14)).toBe(COLORLESS);
  });

  it('methyl orange: red, orange then yellow', () => {
    expect(indicatorColor('methyl-orange', 2)).toBe('#e2453c');
    expect(indicatorColor('methyl-orange', 4)).toBe('#f5943b');
    expect(indicatorColor('methyl-orange', 9)).toBe('#f7d44a');
  });

  it('universal indicator is a smooth gradient', () => {
    expect(indicatorColor('universal', 0)).toBe('#d92f24');
    const mid = indicatorColor('universal', 7);
    expect(mid.startsWith('#')).toBe(true);
    expect(mid).not.toBe(indicatorColor('universal', 14));
  });

  it('labels both languages', () => {
    expect(indicatorLabel('litmus', 2, 'en')).toMatch(/acidic/i);
    expect(indicatorLabel('litmus', 2, 'bn')).toMatch(/অম্লীয়/);
  });

  it('an added indicator dominates the observed colour', () => {
    const base = '#dcefff';
    const withLitmusAcid = observedColor(base, [{ indicator: 'litmus', mL: 1 }], 1);
    const withLitmusBase = observedColor(base, [{ indicator: 'litmus', mL: 1 }], 13);
    expect(withLitmusAcid).not.toBe(base);
    expect(withLitmusAcid).not.toBe(withLitmusBase);
    expect(observedColor(base, [], 1)).toBe(base);
  });
});
