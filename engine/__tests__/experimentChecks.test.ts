import { describe, expect, it } from 'vitest';
import experimentsData from '../../data/experiments.json';
import { checkHint, factsFrom, stepSatisfied, vesselPh } from '../experimentChecks';
import type { GuidedExperiment, LogEntry, StepCheck } from '../types';
import { chemicalsById, makeVessel } from './helpers';

const experiments = experimentsData.experiments as unknown as GuidedExperiment[];
const litmus = experiments.find((experiment) => experiment.slug === 'litmus-test') as GuidedExperiment;
const hydrogen = experiments.find((experiment) => experiment.slug === 'prepare-hydrogen') as GuidedExperiment;
const electrolysis = experiments.find((experiment) => experiment.slug === 'electrolysis-water') as GuidedExperiment;

function entry(partial: Partial<LogEntry>): LogEntry {
  return {
    id: 'log-1',
    at: Date.now(),
    kind: 'system',
    tone: 'info',
    reactionId: null,
    vesselId: null,
    text_en: 'test',
    text_bn: 'পরীক্ষা',
    ...partial
  };
}

describe('stepSatisfied', () => {
  it('counts vessels on the bench', () => {
    const facts = factsFrom([makeVessel(), makeVessel(), makeVessel()], [], chemicalsById);
    expect(stepSatisfied({ type: 'vesselCount', min: 3 }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'vesselCount', min: 4 }, facts)).toBe(false);
  });

  it('finds a chemical in liquid, sediment or gas', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 5 }]);
    vessel.sediment = [{ chemicalId: 'AgCl', mL: 2, moles: 0.01, color: '#f2f4f7' }];
    vessel.gases = [{ chemicalId: 'H2', moles: 0.001, mL: 24 }];
    const facts = factsFrom([vessel], [], chemicalsById);

    expect(stepSatisfied({ type: 'contains', vessel: 0, chemicalId: 'HCl' }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'contains', vessel: 0, chemicalId: 'AgCl' }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'contains', vessel: 0, chemicalId: 'H2' }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'contains', vessel: 0, chemicalId: 'NaOH' }, facts)).toBe(false);
    expect(stepSatisfied({ type: 'contains', vessel: 3, chemicalId: 'HCl' }, facts)).toBe(false);
  });

  it('reads temperature and heating state', () => {
    const cold = makeVessel([{ id: 'H2O', mL: 20 }]);
    const hot = makeVessel([{ id: 'H2O', mL: 20 }], { temperatureC: 95, heating: true });
    const facts = factsFrom([cold, hot], [], chemicalsById);

    expect(stepSatisfied({ type: 'temperature', vessel: 1, min: 90 }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'temperature', vessel: 0, min: 90 }, facts)).toBe(false);
    expect(stepSatisfied({ type: 'heating', vessel: 1 }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'heating', vessel: 0 }, facts)).toBe(false);
  });

  it('checks a pH window using the pH model', () => {
    const acid = makeVessel([{ id: 'HCl', mL: 10 }]);
    const base = makeVessel([{ id: 'NaOH', mL: 10 }]);
    const facts = factsFrom([acid, base], [], chemicalsById);

    expect(stepSatisfied({ type: 'phRange', vessel: 0, max: 3 }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'phRange', vessel: 0, min: 6 }, facts)).toBe(false);
    expect(stepSatisfied({ type: 'phRange', vessel: 1, min: 11 }, facts)).toBe(true);
    expect(vesselPh(makeVessel([]), chemicalsById)).toBeNull();
  });

  it('recognises a fired reaction from the notebook or the vessel', () => {
    const check: StepCheck = { type: 'reactionFired', reactionId: 'hcl-naoh' };
    const vessel = makeVessel([{ id: 'HCl', mL: 5 }]);
    vessel.lastReactionId = 'hcl-naoh';

    expect(stepSatisfied(check, factsFrom([makeVessel()], [entry({ reactionId: 'hcl-naoh' })], chemicalsById))).toBe(true);
    expect(stepSatisfied(check, factsFrom([vessel], [], chemicalsById))).toBe(true);
    expect(stepSatisfied(check, factsFrom([makeVessel()], [entry({ reactionId: 'zn-hcl' })], chemicalsById))).toBe(false);
  });

  it('tracks the electrolysis cell and sparks', () => {
    const cell = makeVessel([{ id: 'H2O', mL: 20 }], { electrolysis: true });
    const sparked = makeVessel([{ id: 'H2', mL: 20 }], { id: 'vessel-2' });
    const facts = factsFrom([cell, sparked], [entry({ kind: 'spark', vesselId: 'vessel-2' })], chemicalsById);

    expect(stepSatisfied({ type: 'electrolysis', vessel: 0 }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'electrolysis', vessel: 1 }, facts)).toBe(false);
    expect(stepSatisfied({ type: 'spark', vessel: 1 }, facts)).toBe(true);
    expect(stepSatisfied({ type: 'spark', vessel: 0 }, facts)).toBe(false);
  });

  it('never marks a missing station as done', () => {
    const facts = factsFrom([], [], chemicalsById);
    const checks: StepCheck[] = [
      { type: 'contains', vessel: 0, chemicalId: 'HCl' },
      { type: 'temperature', vessel: 0, min: 40 },
      { type: 'phRange', vessel: 0, min: 0, max: 14 },
      { type: 'heating', vessel: 0 },
      { type: 'electrolysis', vessel: 0 },
      { type: 'spark', vessel: 0 }
    ];
    for (const check of checks) expect(stepSatisfied(check, facts)).toBe(false);
  });
});

describe('the seeded walkthroughs', () => {
  it('litmus test: step 1 is satisfied by the pre-built bench', () => {
    const vessels = litmus.setup.vessels.map((setup) =>
      makeVessel(setup.portions.map((portion) => ({ id: portion.chemicalId, mL: portion.mL })), { apparatusId: setup.apparatusId })
    );
    const facts = factsFrom(vessels, [], chemicalsById);
    expect(stepSatisfied(litmus.steps[0].check, facts)).toBe(true);
    expect(stepSatisfied(litmus.steps[1].check, facts)).toBe(false);
  });

  it('every check in the dataset refers to a station the setup provides or a bench action', () => {
    for (const experiment of experiments) {
      for (const step of experiment.steps) {
        const check = step.check;
        if ('vessel' in check) {
          // A step may ask for a station the student adds themselves (a gas jar, say),
          // so it only has to be a whole, non-negative index.
          expect(Number.isInteger(check.vessel)).toBe(true);
          expect(check.vessel).toBeGreaterThanOrEqual(0);
        }
        if (check.type === 'reactionFired') expect(check.reactionId.length).toBeGreaterThan(0);
      }
    }
  });

  it('hydrogen preparation and electrolysis steps are checkable end to end', () => {
    const zincStep = hydrogen.steps.find((step) => step.check.type === 'reactionFired');
    expect(zincStep?.check).toEqual({ type: 'reactionFired', reactionId: 'zn-hcl' });
    const tube = makeVessel([{ id: 'Zn', mL: 2 }], { apparatusId: 'test-tube' });
    const facts = factsFrom([tube], [entry({ reactionId: 'zn-hcl' })], chemicalsById);
    expect(stepSatisfied({ type: 'contains', vessel: 0, chemicalId: 'Zn' }, facts)).toBe(true);
    expect(zincStep && stepSatisfied(zincStep.check, facts)).toBe(true);

    const cell = makeVessel([{ id: 'H2O', mL: 30 }], { apparatusId: 'beaker', electrolysis: true });
    const cellFacts = factsFrom([cell], [], chemicalsById);
    expect(electrolysis.steps.some((step) => stepSatisfied(step.check, cellFacts))).toBe(true);
  });
});

describe('checkHint', () => {
  it('explains an unfinished step in both languages', () => {
    const en = checkHint({ type: 'contains', vessel: 1, chemicalId: 'NaOH' }, 'en', chemicalsById);
    const bn = checkHint({ type: 'contains', vessel: 1, chemicalId: 'NaOH' }, 'bn', chemicalsById);

    expect(en).toContain('station 2');
    expect(en).toContain('NaOH');
    expect(bn).toContain('স্টেশন');
    expect(bn).toContain('NaOH');
    expect(checkHint({ type: 'vesselCount', min: 3 }, 'en', chemicalsById)).toContain('3');
    expect(checkHint({ type: 'temperature', vessel: 0, min: 120 }, 'bn', chemicalsById)).toContain('120');
  });
});
