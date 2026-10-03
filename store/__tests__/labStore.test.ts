import { beforeEach, describe, expect, it } from 'vitest';
import { factsFrom, stepSatisfied } from '@/engine/experimentChecks';
import { chemicalsById, getExperiment } from '@/lib/labData';
import { useLabStore } from '@/store/labStore';

/**
 * Integration tests for the bench itself: the same actions the UI fires when a student
 * drags, heats, sparks or loads a walkthrough. The chemistry is asserted through the
 * store's public state, never through a component.
 */

const state = () => useLabStore.getState();
const vesselOf = (id: string) => state().vessels.find((vessel) => vessel.id === id);
const facts = () => factsFrom(state().vessels, state().log, chemicalsById);

/** The store reads `window.localStorage`, so the stub hangs off `window`. */
function installLocalStorage() {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, String(value)),
    removeItem: (key: string) => void memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    }
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
}

beforeEach(() => {
  state().reset();
  state().setBurnerIntensity(0.8);
});

describe('pouring and mixing', () => {
  it('neutralises a strong acid with a strong base, warming the beaker', () => {
    const id = state().addVessel('beaker');
    state().addChemical(id, 'HCl', 20);
    state().addChemical(id, 'NaOH', 20);

    const vessel = vesselOf(id);
    expect(vessel?.portions.some((portion) => portion.chemicalId === 'NaCl')).toBe(true);
    expect(vessel?.temperatureC).toBeGreaterThan(25);
    expect(state().lastOutcome?.reaction.id).toBe('hcl-naoh');
    expect(state().log.some((entry) => entry.reactionId === 'hcl-naoh')).toBe(true);
  });

  it('settles a precipitate and clouds the liquid', () => {
    const id = state().addVessel('test-tube');
    state().addChemical(id, 'AgNO3', 5);
    state().addChemical(id, 'NaCl', 5);

    const vessel = vesselOf(id);
    expect(vessel?.sediment.some((item) => item.chemicalId === 'AgCl')).toBe(true);
    expect(vessel?.turbidity).toBeGreaterThan(0);
  });

  it('respects the pour slider and the capacity of the glassware', () => {
    state().setPourMl(500);
    expect(state().pourMl).toBe(100);
    state().setPourMl(0);
    expect(state().pourMl).toBe(1);

    state().setPourMl(10);
    const id = state().addVessel('test-tube'); // 15 mL tube
    state().addChemical(id, 'H2O', 10);
    state().addChemical(id, 'H2O', 10);
    const vessel = vesselOf(id);
    const total = vessel?.portions.reduce((sum, portion) => sum + portion.mL, 0) ?? 0;
    expect(total).toBeLessThanOrEqual(15);
  });

  it('raises the safety overlay for a dangerous combination and dismisses it', () => {
    const id = state().addVessel('beaker');
    state().addChemical(id, 'H2O', 40);
    state().addChemical(id, 'Na', 1);

    expect(state().hazard?.level).toBe('danger');
    expect((state().hazard?.bn ?? '').length).toBeGreaterThan(0);
    expect(state().log.some((entry) => entry.kind === 'safety')).toBe(true);

    state().dismissHazard();
    expect(state().hazard).toBeNull();
  });

  it('explains a pair that cannot react instead of staying silent', () => {
    const id = state().addVessel('beaker');
    state().addChemical(id, 'Cu', 5);
    state().addChemical(id, 'ZnSO4', 20);

    // `cu-znso4` is an inert, documented rule: copper is below zinc in the reactivity series.
    expect(state().lastOutcome?.reaction.id).toBe('cu-znso4');
    expect(state().log.some((entry) => entry.reactionId === 'cu-znso4')).toBe(true);
    expect(state().hazard).toBeNull();
    expect(vesselOf(id)?.portions.map((portion) => portion.chemicalId).sort()).toEqual(['Cu', 'ZnSO4']);
  });

  it('hints at the missing trigger when a rule only needs heat', () => {
    const id = state().addVessel('test-tube');
    state().addChemical(id, 'CaCO3', 5);

    expect(state().hint).not.toBeNull();
    expect(state().hint?.text_en.toLowerCase()).toContain('heat');
  });
});

describe('heating', () => {
  it('lights the burner, climbs to a boil and boils liquid away', () => {
    const id = state().addVessel('beaker');
    state().addChemical(id, 'H2O', 50);
    state().setHeating(id, true);

    expect(state().burner.lit).toBe(true);
    expect(vesselOf(id)?.heating).toBe(true);

    const startVolume = vesselOf(id)?.portions.reduce((sum, portion) => sum + portion.mL, 0) ?? 0;
    for (let step = 0; step < 400; step += 1) state().tick(1);

    const vessel = vesselOf(id);
    expect(vessel?.temperatureC).toBeGreaterThan(95);
    const endVolume = vessel?.portions.reduce((sum, portion) => sum + portion.mL, 0) ?? 0;
    expect(endVolume).toBeLessThan(startVolume);
  });

  it('refuses to heat glassware that must not be heated', () => {
    const id = state().addVessel('measuring-cylinder');
    state().setHeating(id, true);

    expect(vesselOf(id)?.heating).toBe(false);
    expect(state().flash?.tone).toBe('warning');
  });

  it('fires a heat-triggered rule only once the liquid is hot enough', () => {
    const id = state().addVessel('test-tube');
    state().addChemical(id, 'NaHCO3', 5); // a dry solid: nothing to boil, so it can pass 100 °C
    state().setHeating(id, true);

    expect(state().log.some((entry) => entry.reactionId === 'nahco3-heat')).toBe(false);
    for (let step = 0; step < 400; step += 1) state().tick(1);

    expect(vesselOf(id)?.temperatureC).toBeGreaterThan(120);
    expect(state().log.some((entry) => entry.reactionId === 'nahco3-heat')).toBe(true);
    expect(vesselOf(id)?.portions.some((portion) => portion.chemicalId === 'NaHCO3')).toBe(false);
  });

  it('collects gas through the delivery tube into a gas jar', () => {
    const tube = state().addVessel('test-tube');
    state().addChemical(tube, 'Zn', 1);
    state().addChemical(tube, 'HCl', 10);
    expect(vesselOf(tube)?.gases.length).toBeGreaterThan(0);

    const jar = state().addVessel('gas-jar');
    state().collectGas(tube, jar);

    expect(vesselOf(jar)?.gases.some((gas) => gas.chemicalId === 'H2')).toBe(true);
    expect(vesselOf(tube)?.gases).toHaveLength(0);
  });
});

describe('bench controls', () => {
  it('undoes and redoes a pour', () => {
    const id = state().addVessel('test-tube');
    state().addChemical(id, 'HCl', 5);
    expect(vesselOf(id)?.portions).toHaveLength(1);

    state().undo();
    expect(vesselOf(id)?.portions).toHaveLength(0);

    state().redo();
    expect(vesselOf(id)?.portions).toHaveLength(1);
  });

  it('empties a vessel and removes it from the bench', () => {
    const id = state().addVessel('beaker');
    state().addChemical(id, 'CuSO4', 20);
    state().emptyVessel(id);
    expect(vesselOf(id)?.portions).toHaveLength(0);

    state().removeVessel(id);
    expect(state().vessels).toHaveLength(0);
  });

  it('stirs sediment back into suspension with a spatula', () => {
    const id = state().addVessel('test-tube');
    state().addChemical(id, 'AgNO3', 5);
    state().addChemical(id, 'NaCl', 5);
    for (let step = 0; step < 60; step += 1) state().tick(1);
    const settled = vesselOf(id)?.turbidity ?? 1;

    state().stir(id);
    expect(vesselOf(id)?.turbidity ?? 0).toBeGreaterThan(settled);
  });

  it('swaps glassware and keeps the contents', () => {
    const id = state().addVessel('test-tube');
    state().addChemical(id, 'H2O', 10);
    state().setVesselApparatus(id, 'beaker');

    const vessel = vesselOf(id);
    expect(vessel?.apparatusId).toBe('beaker');
    const total = vessel?.portions.reduce((sum, portion) => sum + portion.mL, 0) ?? 0;
    expect(total).toBeGreaterThan(0);
  });

  it('saves to and loads from localStorage', () => {
    installLocalStorage();
    const id = state().addVessel('beaker');
    state().addChemical(id, 'CuSO4', 25);

    expect(state().hasSavedLab()).toBe(false);
    state().save();
    expect(state().hasSavedLab()).toBe(true);

    state().reset();
    expect(state().vessels).toHaveLength(0);

    expect(state().load()).toBe(true);
    const restored = state().vessels[0];
    expect(restored?.apparatusId).toBe('beaker');
    expect(restored?.portions.some((portion) => portion.chemicalId === 'CuSO4')).toBe(true);
  });
});

describe('guided experiments', () => {
  it('seeds the bench from the walkthrough setup', () => {
    const litmus = getExperiment('litmus-test');
    expect(litmus).toBeDefined();
    state().startExperiment(litmus!);

    expect(state().vessels).toHaveLength(litmus!.setup.vessels.length);
    expect(state().activeExperiment?.slug).toBe('litmus-test');
    expect(state().selectedVesselId).toBe(state().vessels[0].id);
    expect(stepSatisfied(litmus!.steps[0].check, facts())).toBe(true);
  });

  it('ticks a step off as soon as the bench satisfies its check', () => {
    const litmus = getExperiment('litmus-test')!;
    state().startExperiment(litmus);

    const indicatorStep = litmus.steps.find((step) => step.check.type === 'contains' && step.check.vessel === 0)!;
    expect(stepSatisfied(indicatorStep.check, facts())).toBe(false);

    state().addChemical(state().vessels[0].id, 'litmus', 2);
    expect(stepSatisfied(indicatorStep.check, facts())).toBe(true);

    state().completeStep(indicatorStep.order);
    expect(state().activeExperiment?.completed).toContain(indicatorStep.order);
  });

  it('watches a neutralisation walkthrough reach its end point', () => {
    const neutralisation = getExperiment('acid-base-neutralisation')!;
    state().startExperiment(neutralisation);

    const beaker = state().vessels[0].id;
    state().addChemical(beaker, 'NaOH', 25); // equivalence: the beaker started with 25 mL of HCl
    expect(neutralisation.steps.some((step) => stepSatisfied(step.check, facts()))).toBe(true);

    // The last step wants the swing past neutral, so the base has to be in excess.
    state().addChemical(beaker, 'NaOH', 30);
    const phStep = neutralisation.steps.find((step) => step.check.type === 'phRange');
    expect(phStep).toBeDefined();
    if (phStep) expect(stepSatisfied(phStep.check, facts())).toBe(true);

    const heatStep = neutralisation.steps.find((step) => step.check.type === 'temperature');
    if (heatStep) expect(stepSatisfied(heatStep.check, facts())).toBe(true);

    state().stopExperiment();
    expect(state().activeExperiment).toBeNull();
  });
});
