import { describe, expect, it } from 'vitest';
import {
  MOLAR_VOLUME_ML,
  applyReaction,
  candidatesFor,
  equationFor,
  indexById,
  inventoryOf,
  liquidVolume,
  makePortion,
  molesFor,
  noReactionNote,
  observationFor,
  resolveVessel,
  scoreReaction,
  selectReaction,
  severity,
  toActiveEffects,
  triggerBlock,
  triggerSatisfied,
  volumeFor
} from '../reactionEngine';
import type { ReactionContext } from '../types';
import { chemicalsById, chemical, dataset, mL, makeVessel, reaction } from './helpers';

const roomContext: ReactionContext = { temperatureC: 25, heating: false, spark: false, electrolysis: false, light: false };
const hotContext = (temperatureC: number): ReactionContext => ({ ...roomContext, heating: true, temperatureC });

describe('amount conversion', () => {
  it('converts a solution from mL to moles and back', () => {
    const hcl = chemical('HCl');
    expect(molesFor(hcl, 1000)).toBeCloseTo(1, 5);
    expect(volumeFor(hcl, 1)).toBeCloseTo(1000, 5);
  });

  it('treats solids as grams and gases as mL at RTP', () => {
    expect(molesFor(chemical('CaCO3'), 100)).toBeCloseTo(1, 2);
    expect(molesFor(chemical('H2'), MOLAR_VOLUME_ML)).toBeCloseTo(1, 5);
    expect(volumeFor(chemical('H2'), 1)).toBe(MOLAR_VOLUME_ML);
  });

  it('ignores negative and non-finite amounts', () => {
    expect(molesFor(chemical('HCl'), -5)).toBe(0);
    expect(molesFor(chemical('HCl'), Number.NaN)).toBe(0);
  });

  it('indexes a list by id', () => {
    expect(indexById(dataset.chemicals).get('HCl')?.name_en).toBe('Hydrochloric acid');
  });
});

describe('matching', () => {
  it('finds the neutralisation rule when acid meets base', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 20 }, { id: 'NaOH', mL: 20 }]);
    const found = candidatesFor(vessel, dataset.reactions, roomContext);
    expect(found.some((candidate) => candidate.id === 'hcl-naoh')).toBe(true);
    expect(selectReaction(vessel, dataset.reactions, roomContext)?.id).toBe('hcl-naoh');
  });

  it('finds nothing for a single chemical that needs a partner', () => {
    const vessel = makeVessel([{ id: 'NaCl', mL: 20 }]);
    expect(candidatesFor(vessel, dataset.reactions, roomContext)).toHaveLength(0);
  });

  it('withholds heat-triggered rules until the burner is on', () => {
    const vessel = makeVessel([{ id: 'NaHCO3', mL: 5 }]);
    expect(candidatesFor(vessel, dataset.reactions, roomContext)).toHaveLength(0);
    expect(triggerBlock(reaction('nahco3-heat').trigger, roomContext)).toBe('heat');
    expect(candidatesFor(vessel, dataset.reactions, hotContext(90)).some((c) => c.id === 'nahco3-heat')).toBe(true);
  });

  it('waits for the minimum temperature', () => {
    const vessel = makeVessel([{ id: 'CaCO3', mL: 5 }]);
    expect(triggerSatisfied(reaction('caco3-heat').trigger, hotContext(300))).toBe(false);
    expect(triggerSatisfied(reaction('caco3-heat').trigger, hotContext(700))).toBe(true);
  });

  it('requires a spark for the hydrogen pop test', () => {
    const vessel = makeVessel([], { apparatusId: 'gas-jar' });
    vessel.gases = [
      { chemicalId: 'H2', moles: 100 / MOLAR_VOLUME_ML, mL: 100 },
      { chemicalId: 'O2', moles: 60 / MOLAR_VOLUME_ML, mL: 60 }
    ];
    expect(triggerBlock(reaction('h2-o2-spark').trigger, roomContext)).toBe('spark');
    expect(selectReaction(vessel, dataset.reactions, { ...roomContext, spark: true })?.id).toBe('h2-o2-spark');
  });

  it('ranks a specific rule above a generic one', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 20 }, { id: 'NaOH', mL: 20 }, { id: 'H2O', mL: 20 }]);
    const specific = scoreReaction(reaction('hcl-naoh'), vessel, roomContext);
    const generic = scoreReaction(reaction('naoh-h2o-dilute'), vessel, roomContext);
    expect(specific).toBeGreaterThan(generic);
  });

  it('knows which hazard level is worse', () => {
    expect(severity('danger')).toBeGreaterThan(severity('caution'));
    expect(severity('caution')).toBeGreaterThan(severity('none'));
  });
});

describe('resolveVessel', () => {
  it('neutralises HCl with NaOH, warms up and leaves salt water', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 25 }, { id: 'NaOH', mL: 25 }]);
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes.map((outcome) => outcome.reaction?.id)).toContain('hcl-naoh');
    expect(result.vessel.temperatureC).toBeGreaterThan(25);
    expect(result.vessel.portions.some((portion) => portion.chemicalId === 'NaCl')).toBe(true);
    expect(result.hazard).toBe('none');
    expect(result.colorOverride).toBeTruthy();
  });

  it('precipitates silver chloride as sediment', () => {
    const vessel = makeVessel([{ id: 'AgNO3', mL: 10 }, { id: 'NaCl', mL: 10 }], { apparatusId: 'test-tube' });
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes[0].reaction?.id).toBe('agno3-nacl');
    const sediment = result.vessel.sediment.find((item) => item.chemicalId === 'AgCl');
    expect(sediment).toBeDefined();
    expect(sediment?.color).toBe('#f7f8f9');
    expect(result.vessel.turbidity).toBeGreaterThan(0);
    expect(result.effects.some((effect) => effect.kind === 'precipitate')).toBe(true);
  });

  it('collects hydrogen in the headspace with bubbles', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 30 }], { apparatusId: 'conical-flask' });
    vessel.sediment = [];
    vessel.portions.push(makePortion(chemical('Zn'), 1));
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes[0].reaction?.id).toBe('zn-hcl');
    expect(result.vessel.gases.some((gas) => gas.chemicalId === 'H2')).toBe(true);
    expect(result.effects.some((effect) => effect.kind === 'bubbles')).toBe(true);
    expect(result.hazard).toBe('caution');
  });

  it('reports a documented non-reaction instead of staying silent', () => {
    const vessel = makeVessel([{ id: 'ZnSO4', mL: 20 }]);
    vessel.portions.push(makePortion(chemical('Cu'), 1));
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes[0].reaction?.id).toBe('cu-znso4');
    expect(result.outcomes[0].reaction?.category).toBe('no-reaction');
    // An inert rule leaves the zinc sulphate solution untouched.
    expect(mL(result.vessel, 'ZnSO4')).toBeCloseTo(20, 3);
  });

  it('displaces copper with iron and changes the colour', () => {
    const vessel = makeVessel([{ id: 'CuSO4', mL: 20 }]);
    vessel.portions.push(makePortion(chemical('Fe'), 1));
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes[0].reaction?.id).toBe('fe-cuso4');
    expect(result.vessel.sediment.some((item) => item.chemicalId === 'Cu')).toBe(true);
    expect(result.vessel.portions.some((portion) => portion.chemicalId === 'FeSO4')).toBe(true);
  });

  it('decomposes bicarbonate only when it is hot enough', () => {
    const cold = resolveVessel(makeVessel([{ id: 'NaHCO3', mL: 4 }]), dataset, roomContext);
    expect(cold.outcomes).toHaveLength(0);
    const hot = resolveVessel(makeVessel([{ id: 'NaHCO3', mL: 4 }]), dataset, hotContext(120));
    expect(hot.outcomes[0].reaction?.id).toBe('nahco3-heat');
    expect(hot.vessel.gases.some((gas) => gas.chemicalId === 'CO2')).toBe(true);
  });

  it('splits water only with the electrolysis cell switched on', () => {
    const vessel = makeVessel([{ id: 'H2O', mL: 60 }]);
    expect(resolveVessel(vessel, dataset, roomContext).outcomes).toHaveLength(0);
    const result = resolveVessel(vessel, dataset, { ...roomContext, electrolysis: true });
    expect(result.outcomes[0].reaction?.id).toBe('h2o-electrolysis');
    expect(result.vessel.gases.map((gas) => gas.chemicalId).sort()).toEqual(['H2', 'O2']);
  });

  it('flags sodium in water as dangerous', () => {
    const vessel = makeVessel([{ id: 'H2O', mL: 40 }]);
    vessel.portions.push(makePortion(chemical('Na'), 1));
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes[0].reaction?.id).toBe('na-h2o');
    expect(result.hazard).toBe('danger');
    expect(result.hazardMessage?.en).toMatch(/violently|Never/i);
    expect(result.effects.some((effect) => effect.kind === 'flash')).toBe(true);
  });

  it('never invents instructions for a dangerous oxidiser and fuel pair', () => {
    const vessel = makeVessel([{ id: 'HNO3', mL: 10 }, { id: 'ethanol', mL: 10 }]);
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.hazard).toBe('danger');
    expect(result.hazardMessage?.en).not.toMatch(/ratio|recipe|measure out/i);
  });

  it('chains a carbonate reaction into the limewater test', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 10 }, { id: 'Ca(OH)2', mL: 10 }, { id: 'Na2CO3', mL: 10 }], { apparatusId: 'test-tube' });
    const result = resolveVessel(vessel, dataset, roomContext);
    const ids = result.outcomes.map((outcome) => outcome.reaction?.id);
    expect(ids.length).toBeGreaterThan(1);
  });

  it('leaves an unknown pair alone but says so', () => {
    const vessel = makeVessel([{ id: 'thinner', mL: 10 }, { id: 'NaCl', mL: 10 }]);
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.outcomes).toHaveLength(0);
    expect(result.blockedReaction).toBeNull();
    expect(noReactionNote(result.vessel, chemicalsById, 'en')).toMatch(/no visible reaction/i);
    expect(noReactionNote(result.vessel, chemicalsById, 'bn')).toMatch(/কোনো দৃশ্যমান বিক্রিয়া/);
  });

  it('does not report a note for a single chemical', () => {
    expect(noReactionNote(makeVessel([{ id: 'H2O', mL: 10 }]), chemicalsById, 'en')).toBeNull();
  });

  it('says what is blocking when a rule needs a trigger', () => {
    // Thermal decomposition of a single solid is the one single-reactant hint we surface.
    const vessel = makeVessel([{ id: 'CaCO3', mL: 5 }]);
    const result = resolveVessel(vessel, dataset, roomContext);
    expect(result.blockedReaction?.reaction.id).toBe('caco3-heat');
    expect(result.blockedReaction?.block).toBe('heat');
  });
});

describe('applyReaction', () => {
  it('consumes the limiting reagent and leaves the excess', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 10 }, { id: 'NaOH', mL: 40 }]);
    const result = applyReaction(vessel, reaction('hcl-naoh'), chemicalsById, 250);
    expect(result.outcome.fired).toBe(true);
    expect(result.outcome.limitingReagentId).toBe('HCl');
    expect(result.vessel.portions.some((portion) => portion.chemicalId === 'HCl')).toBe(false);
    expect(result.vessel.portions.find((portion) => portion.chemicalId === 'NaOH')?.mL).toBeCloseTo(30, 1);
  });

  it('never mutates the vessel it was given', () => {
    const vessel = makeVessel([{ id: 'HCl', mL: 10 }, { id: 'NaOH', mL: 10 }]);
    const before = liquidVolume(vessel);
    applyReaction(vessel, reaction('hcl-naoh'), chemicalsById, 250);
    expect(liquidVolume(vessel)).toBe(before);
    expect(vessel.portions.map((portion) => portion.chemicalId)).toEqual(['HCl', 'NaOH']);
  });

  it('does not consume anything for an inert rule', () => {
    const vessel = makeVessel([{ id: 'NaCl', mL: 10 }]);
    const result = applyReaction(vessel, reaction('flame-na'), chemicalsById, 100);
    expect(result.vessel.portions[0].mL).toBeCloseTo(10, 5);
    expect(result.effects.some((effect) => effect.kind === 'flame')).toBe(true);
  });
});

describe('inventory and presentation', () => {
  it('counts liquid, sediment and gas separately', () => {
    const vessel = makeVessel([{ id: 'H2O', mL: 20 }]);
    vessel.sediment = [{ chemicalId: 'AgCl', mL: 2, moles: 0.014, color: '#ffffff' }];
    vessel.gases = [{ chemicalId: 'CO2', moles: 0.01, mL: 240 }];
    const inventory = inventoryOf(vessel);
    expect(inventory.get('H2O')?.where).toBe('liquid');
    expect(inventory.get('AgCl')?.where).toBe('solid');
    expect(inventory.get('CO2')?.where).toBe('gas');
    expect(inventory.get('CO2')?.moles).toBeCloseTo(0.01, 5);
    expect(inventory.size).toBe(3);
  });

  it('localises equations and observations', () => {
    const rule = reaction('agno3-nacl');
    expect(equationFor(rule, 'en')).toContain('AgNO');
    expect(equationFor(rule, 'bn')).toContain('↓');
    expect(observationFor(rule, 'en')).toMatch(/white/i);
    expect(observationFor(rule, 'bn')).toMatch(/সাদা/);
  });

  it('turns engine effects into timed store effects', () => {
    const effects = toActiveEffects('vessel-1', [{ kind: 'bubbles', color: '#dff0ff', intensity: 0.7, durationMs: 3000 }], 1000);
    expect(effects[0]).toMatchObject({ vesselId: 'vessel-1', kind: 'bubbles', startedAt: 1000, durationMs: 3000 });
    expect(new Set(effects.map((effect) => effect.id)).size).toBe(effects.length);
  });
});
