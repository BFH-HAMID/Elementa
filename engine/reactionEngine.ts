import type {
  ActiveEffect,
  Chemical,
  EffectKind,
  GasVolume,
  HazardLevel,
  LabDataset,
  Portion,
  Reaction,
  ReactionContext,
  ReactionOutcome,
  Sediment,
  Vessel
} from './types';
import { applyDeltaT } from './heatModel';

/**
 * The reaction engine. Pure functions only — no React, no clock, no randomness —
 * so every rule in `data/reactions.json` can be asserted in a unit test.
 */

/** Molar volume of a gas at room temperature and pressure, in mL mol⁻¹. */
export const MOLAR_VOLUME_ML = 24000;
/** How many reaction passes one addition may trigger before we stop chasing chains. */
export const MAX_PASSES = 6;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function indexById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

/**
 * Convert a shelf amount into moles.
 * Liquids are dosed in mL of a known molarity, solids are dosed in grams
 * (the UI labels the same slider "mL / g"), gases in mL at RTP.
 */
export function molesFor(chemical: Chemical, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (chemical.state === 'gas') return amount / MOLAR_VOLUME_ML;
  if (chemical.state === 'solid') return chemical.molarMass > 0 ? amount / chemical.molarMass : 0;
  const molarity = chemical.concentrationM ?? 1;
  return (amount / 1000) * molarity;
}

/** Inverse of {@link molesFor}: how much shelf volume a given amount of substance takes. */
export function volumeFor(chemical: Chemical, moles: number): number {
  if (!Number.isFinite(moles) || moles <= 0) return 0;
  if (chemical.state === 'gas') return moles * MOLAR_VOLUME_ML;
  if (chemical.state === 'solid') return moles * chemical.molarMass;
  const molarity = chemical.concentrationM ?? 1;
  return (moles / molarity) * 1000;
}

export function makePortion(chemical: Chemical, amountMl: number, addedAt = 0): Portion {
  return { chemicalId: chemical.id, mL: Math.max(0, amountMl), moles: molesFor(chemical, amountMl), addedAt };
}

export function liquidVolume(vessel: Vessel): number {
  return vessel.portions.reduce((sum, portion) => sum + portion.mL, 0);
}

export function sedimentVolume(vessel: Vessel): number {
  return vessel.sediment.reduce((sum, item) => sum + item.mL, 0);
}

/** Every chemical present anywhere in the vessel: dissolved, settled or in the headspace. */
export function inventoryOf(vessel: Vessel): Map<string, { moles: number; mL: number; where: 'liquid' | 'solid' | 'gas' }> {
  const inventory = new Map<string, { moles: number; mL: number; where: 'liquid' | 'solid' | 'gas' }>();
  const add = (id: string, moles: number, mL: number, where: 'liquid' | 'solid' | 'gas') => {
    const existing = inventory.get(id);
    if (existing) {
      existing.moles += moles;
      existing.mL += mL;
      // Prefer the dissolved record when the same species appears in two places.
      if (existing.where !== 'liquid' && where === 'liquid') existing.where = 'liquid';
    } else {
      inventory.set(id, { moles, mL, where });
    }
  };
  for (const portion of vessel.portions) add(portion.chemicalId, portion.moles, portion.mL, 'liquid');
  for (const item of vessel.sediment) add(item.chemicalId, item.moles, item.mL, 'solid');
  for (const gas of vessel.gases) {
    add(gas.chemicalId, gas.moles, gas.mL, 'gas');
  }
  return inventory;
}

export function triggerSatisfied(trigger: Reaction['trigger'], context: ReactionContext): boolean {
  if (trigger.heat) {
    if (!context.heating) return false;
    if (trigger.minTempC !== null && context.temperatureC < trigger.minTempC) return false;
  }
  if (trigger.spark && !context.spark) return false;
  if (trigger.electrolysis && !context.electrolysis) return false;
  if (trigger.light && !context.light) return false;
  return true;
}

/** How close a reaction is to firing right now — used for the "needs heating" hint. */
export function triggerBlock(trigger: Reaction['trigger'], context: ReactionContext): 'none' | 'heat' | 'spark' | 'electrolysis' | 'light' {
  if (trigger.spark && !context.spark) return 'spark';
  if (trigger.electrolysis && !context.electrolysis) return 'electrolysis';
  if (trigger.light && !context.light) return 'light';
  if (trigger.heat && !context.heating) return 'heat';
  if (trigger.heat && trigger.minTempC !== null && context.temperatureC < trigger.minTempC) return 'heat';
  return 'none';
}

export function candidatesFor(
  vessel: Vessel,
  reactions: readonly Reaction[],
  context: ReactionContext
): Reaction[] {
  const inventory = inventoryOf(vessel);
  return reactions.filter((reaction) => {
    if (reaction.reactants.length === 0) return false;
    if (!triggerSatisfied(reaction.trigger, context)) return false;
    return reaction.reactants.every((reactant) => (inventory.get(reactant.id)?.moles ?? 0) > 1e-9);
  });
}

/**
 * Rank candidates so the most meaningful one wins:
 * explicit high-priority rules first, then reactions with a trigger (they are more
 * specific), then more reactants, then a larger achievable extent.
 */
export function scoreReaction(reaction: Reaction, vessel: Vessel, context: ReactionContext): number {
  const { extentMoles } = limitingExtent(reaction, vessel);
  const triggered = reaction.trigger.heat || reaction.trigger.spark || reaction.trigger.electrolysis || reaction.trigger.light ? 1 : 0;
  // A hot burner should show the flame test rather than a slow room-temperature change.
  const heatBonus = context.heating && reaction.trigger.heat ? 2 : 0;
  return (
    reaction.priority * 10 +
    triggered * 4 +
    heatBonus +
    reaction.reactants.length * 1.5 +
    Math.min(1, extentMoles * 500) * 2
  );
}

export function limitingExtent(
  reaction: Reaction,
  vessel: Vessel
): { extentMoles: number; limitingReagentId: string | null } {
  const inventory = inventoryOf(vessel);
  let extent = Number.POSITIVE_INFINITY;
  let limiting: string | null = null;
  for (const reactant of reaction.reactants) {
    const coefficient = reactant.coefficient || 1;
    const available = inventory.get(reactant.id)?.moles ?? 0;
    const possible = available / coefficient;
    if (possible < extent) {
      extent = possible;
      limiting = reactant.id;
    }
  }
  if (!Number.isFinite(extent) || extent <= 0) return { extentMoles: 0, limitingReagentId: null };
  return { extentMoles: extent, limitingReagentId: limiting };
}

/**
 * Prefer a real chemical change over a demonstration rule: an inert rule (flame test,
 * boiling, "no reaction" note) only wins when nothing substantive can happen.
 */
export function rankCandidates(candidates: Reaction[]): Reaction[] {
  const substantive = candidates.filter((reaction) => !reaction.inert);
  if (substantive.length > 0) return substantive;
  const documented = candidates.filter((reaction) => reaction.category === 'no-reaction');
  if (documented.length > 0) return documented;
  return candidates;
}

export function selectReaction(
  vessel: Vessel,
  reactions: readonly Reaction[],
  context: ReactionContext
): Reaction | null {
  const candidates = candidatesFor(vessel, reactions, context);
  if (candidates.length === 0) return null;
  return rankCandidates(candidates)
    .map((reaction) => ({ reaction, score: scoreReaction(reaction, vessel, context) }))
    .sort((a, b) => b.score - a.score)[0].reaction;
}

/** Split the headspace between the gases present, in proportion to how much there is. */
export function settleGases(vessel: Vessel, capacityMl: number): void {
  const headspace = Math.max(1, capacityMl - liquidVolume(vessel) - sedimentVolume(vessel));
  const totalMoles = vessel.gases.reduce((sum, gas) => sum + gas.moles, 0);
  for (const gas of vessel.gases) {
    const share = totalMoles > 0 ? gas.moles / totalMoles : 0;
    const ideal = gas.moles * MOLAR_VOLUME_ML;
    gas.mL = Math.min(ideal, headspace * share);
  }
}

export type ApplyResult = {
  vessel: Vessel;
  outcome: ReactionOutcome;
  effects: EngineEffect[];
  colorOverride: string | null;
  gasesReleased: GasVolume[];
};

export type EngineEffect = { kind: EffectKind; color: string; intensity: number; durationMs: number };

function consumeFrom(vessel: Vessel, chemicalId: string, moles: number): void {
  let remaining = moles;
  if (remaining <= 0) return;
  for (const portion of vessel.portions) {
    if (portion.chemicalId !== chemicalId || remaining <= 0) continue;
    const taken = Math.min(portion.moles, remaining);
    const ratio = portion.moles > 0 ? taken / portion.moles : 1;
    portion.moles -= taken;
    portion.mL -= portion.mL * ratio;
    remaining -= taken;
  }
  for (const item of vessel.sediment) {
    if (item.chemicalId !== chemicalId || remaining <= 0) continue;
    const taken = Math.min(item.moles, remaining);
    const ratio = item.moles > 0 ? taken / item.moles : 1;
    item.moles -= taken;
    item.mL -= item.mL * ratio;
    remaining -= taken;
  }
  for (const gas of vessel.gases) {
    if (gas.chemicalId !== chemicalId || remaining <= 0) continue;
    const taken = Math.min(gas.moles, remaining);
    gas.moles -= taken;
    remaining -= taken;
  }
  vessel.portions = vessel.portions.filter((portion) => portion.moles > 1e-9 && portion.mL > 1e-6);
  vessel.sediment = vessel.sediment.filter((item) => item.moles > 1e-9 && item.mL > 1e-6);
  vessel.gases = vessel.gases.filter((gas) => gas.moles > 1e-9);
}

function addProduct(vessel: Vessel, chemicalsById: Map<string, Chemical>, chemicalId: string, moles: number, capacityMl: number): void {
  const chemical = chemicalsById.get(chemicalId);
  if (!chemical || moles <= 0) return;
  const amount = volumeFor(chemical, moles);

  if (chemical.state === 'gas') {
    // Gases keep their true amount; the visible volume is squeezed into the headspace.
    const existing = vessel.gases.find((gas) => gas.chemicalId === chemicalId);
    if (existing) existing.moles += moles;
    else vessel.gases.push({ chemicalId, moles, mL: 0 });
    settleGases(vessel, capacityMl);
    return;
  }

  if (chemical.precipitate || !chemical.soluble || (chemical.state === 'solid' && chemical.category === 'metal')) {
    const existing = vessel.sediment.find((item) => item.chemicalId === chemicalId);
    if (existing) {
      existing.moles += moles;
      existing.mL += amount;
      existing.color = chemical.color;
    } else {
      vessel.sediment.push({ chemicalId, mL: amount, moles, color: chemical.color } satisfies Sediment);
    }
    return;
  }

  const existing = vessel.portions.find((portion) => portion.chemicalId === chemicalId);
  if (existing) {
    existing.moles += moles;
    existing.mL += amount;
  } else {
    vessel.portions.push({ chemicalId, mL: amount, moles, addedAt: Date.now() });
  }
}

/** Apply one reaction to a vessel and return the new state plus the effects to animate. */
export function applyReaction(
  source: Vessel,
  reaction: Reaction,
  chemicalsById: Map<string, Chemical>,
  capacityMl: number
): ApplyResult {
  const vessel: Vessel = {
    ...source,
    portions: source.portions.map((portion) => ({ ...portion })),
    sediment: source.sediment.map((item) => ({ ...item })),
    gases: source.gases.map((gas) => ({ ...gas }))
  };

  const { extentMoles, limitingReagentId } = limitingExtent(reaction, vessel);
  const effects: EngineEffect[] = [];
  const gasesReleased: GasVolume[] = [];

  if (!reaction.inert && extentMoles <= 0) {
    return {
      vessel: source,
      outcome: { reaction, fired: false, reason_en: 'Not enough of one reactant.', reason_bn: 'একটি বিকারকের পরিমাণ যথেষ্ট নয়।', limitingReagentId, extentMoles: 0 },
      effects,
      colorOverride: null,
      gasesReleased
    };
  }

  if (!reaction.inert) {
    for (const reactant of reaction.reactants) {
      consumeFrom(vessel, reactant.id, reactant.coefficient * extentMoles);
    }
    for (const product of reaction.products) {
      const before = vessel.gases.find((gas) => gas.chemicalId === product.id)?.moles ?? 0;
      addProduct(vessel, chemicalsById, product.id, product.coefficient * extentMoles, capacityMl);
      const entry = vessel.gases.find((gas) => gas.chemicalId === product.id);
      if (entry && entry.moles > before) {
        gasesReleased.push({ chemicalId: product.id, moles: entry.moles - before, mL: entry.mL });
      }
    }
  }

  const { effects: declared } = reaction;
  const totalMl = Math.max(1, liquidVolume(vessel) + sedimentVolume(vessel));

  if (declared.gasRate > 0 || gasesReleased.length > 0) {
    const gasChemical = declared.gas ? chemicalsById.get(declared.gas) : undefined;
    effects.push({
      kind: 'bubbles',
      color: gasChemical?.color ?? '#dff0ff',
      intensity: clamp(declared.gasRate || 0.6, 0.1, 1),
      durationMs: reaction.inert ? 1200 : 3200
    });
  }
  if (declared.precipitate || (!reaction.inert && vessel.sediment.length > source.sediment.length)) {
    const color = declared.precipitate?.color ?? vessel.sediment[vessel.sediment.length - 1]?.color ?? '#f2f5f8';
    effects.push({ kind: 'precipitate', color, intensity: clamp(declared.precipitate?.density ?? 0.8, 0.2, 1), durationMs: 2600 });
  }
  if (declared.smoke) {
    effects.push({ kind: 'smoke', color: declared.smoke.color, intensity: clamp(declared.smoke.density, 0.2, 1), durationMs: 3000 });
  }
  if (declared.flame) {
    effects.push({ kind: 'flame', color: declared.flame.color, intensity: 1, durationMs: reaction.inert ? 4200 : 3000 });
  }
  if (declared.glow) {
    effects.push({ kind: declared.sound === 'boom' || declared.sound === 'pop' ? 'flash' : 'glow', color: declared.flame?.color ?? '#ffe9a8', intensity: 1, durationMs: 1200 });
  }
  if (declared.dissolve) {
    effects.push({ kind: 'settle', color: '#e9f3fb', intensity: 0.6, durationMs: 1800 });
  }

  vessel.temperatureC = applyDeltaT(vessel.temperatureC, declared.deltaT, totalMl);
  if (declared.deltaT > 0 && vessel.temperatureC >= 100) {
    effects.push({ kind: 'steam', color: '#eaf2f8', intensity: 0.7, durationMs: 2400 });
  }
  if (declared.precipitate) vessel.turbidity = clamp(vessel.turbidity + declared.precipitate.density, 0, 1);
  if (declared.dissolve) vessel.turbidity = clamp(vessel.turbidity - 0.6, 0, 1);
  vessel.lastReactionId = reaction.id;
  if (declared.colorTo) vessel.colorOverride = declared.colorTo;

  const outcome: ReactionOutcome = {
    reaction,
    fired: true,
    reason_en: reaction.observation_en,
    reason_bn: reaction.observation_bn,
    limitingReagentId,
    extentMoles: reaction.inert ? 0 : extentMoles
  };

  return { vessel, outcome, effects, colorOverride: declared.colorTo, gasesReleased };
}

export type ResolveResult = {
  vessel: Vessel;
  outcomes: ReactionOutcome[];
  effects: EngineEffect[];
  colorOverride: string | null;
  hazard: HazardLevel;
  hazardMessage: { en: string; bn: string } | null;
  blockedReaction: { reaction: Reaction; block: 'heat' | 'spark' | 'electrolysis' | 'light' } | null;
};

/**
 * Run a vessel to a settled state: fire the best matching reaction, then look again,
 * up to {@link MAX_PASSES} times so chained reactions (acid + carbonate, then the
 * gas meeting limewater in the same vessel) resolve in one go.
 */
export function resolveVessel(
  source: Vessel,
  dataset: LabDataset,
  context: ReactionContext
): ResolveResult {
  const chemicalsById = indexById(dataset.chemicals);
  const apparatus = dataset.apparatus.find((item) => item.id === source.apparatusId);
  const capacityMl = apparatus?.capacityMl ?? 100;

  let vessel = source;
  // Chaining is allowed only into chemicals that were already there: freshly made
  // products must not instantly react with each other (CO₂ from a carbonate fizz
  // would otherwise dissolve back into the water it was just made in).
  const originalIds = new Set(inventoryOf(source).keys());
  const outcomes: ReactionOutcome[] = [];
  const effects: EngineEffect[] = [];
  let colorOverride: string | null = null;
  let hazard: HazardLevel = 'none';
  let hazardMessage: { en: string; bn: string } | null = null;

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const pool =
      pass === 0
        ? dataset.reactions
        : dataset.reactions.filter((rule) => rule.reactants.some((reactant) => originalIds.has(reactant.id)));
    const reaction = selectReaction(vessel, pool, context);
    if (!reaction) break;
    const result = applyReaction(vessel, reaction, chemicalsById, capacityMl);
    if (!result.outcome.fired) break;
    vessel = result.vessel;
    outcomes.push(result.outcome);
    effects.push(...result.effects);
    if (result.colorOverride) colorOverride = result.colorOverride;
    if (severity(reaction.hazard) > severity(hazard)) {
      hazard = reaction.hazard;
      hazardMessage = reaction.hazard_en || reaction.hazard_bn ? { en: reaction.hazard_en ?? '', bn: reaction.hazard_bn ?? '' } : null;
    }
    // Inert rules (flame tests, "no reaction" notes) must not loop.
    if (reaction.inert) break;
  }

  if (outcomes.length === 0) {
    const blocked = findBlocked(vessel, dataset, context);
    return { vessel, outcomes, effects, colorOverride: null, hazard: 'none', hazardMessage: null, blockedReaction: blocked };
  }
  return { vessel, outcomes, effects, colorOverride, hazard, hazardMessage, blockedReaction: null };
}

function findBlocked(
  vessel: Vessel,
  dataset: LabDataset,
  context: ReactionContext
): { reaction: Reaction; block: 'heat' | 'spark' | 'electrolysis' | 'light' } | null {
  const inventory = inventoryOf(vessel);
  for (const reaction of dataset.reactions) {
    if (reaction.reactants.length === 0) continue;
    // Only multi-reactant rules (plus classic thermal decompositions) earn a hint;
    // otherwise every beaker of water would nag about boiling.
    const hintable = reaction.reactants.length >= 2 || reaction.category === 'decomposition';
    if (!hintable) continue;
    const present = reaction.reactants.every((reactant) => (inventory.get(reactant.id)?.moles ?? 0) > 1e-9);
    if (!present) continue;
    const block = triggerBlock(reaction.trigger, context);
    if (block !== 'none') return { reaction, block };
  }
  return null;
}

const severityOrder: Record<HazardLevel, number> = { none: 0, caution: 1, danger: 2 };
export function severity(level: HazardLevel): number {
  return severityOrder[level] ?? 0;
}

/** Two or more chemicals that match nothing: tell the learner, don't stay silent. */
export function noReactionNote(vessel: Vessel, chemicalsById: Map<string, Chemical>, locale: 'bn' | 'en'): string | null {
  const inventory = inventoryOf(vessel);
  const distinct = [...inventory.keys()].filter((id) => chemicalsById.get(id));
  if (distinct.length < 2) return null;
  const names = distinct.slice(0, 3).map((id) => {
    const chemical = chemicalsById.get(id);
    return locale === 'bn' ? chemical?.name_bn ?? id : chemical?.name_en ?? id;
  });
  return locale === 'bn'
    ? `${names.join(' + ')} মিশিয়ে কোনো দৃশ্যমান বিক্রিয়া হলো না।`
    : `${names.join(' + ')} mixed — no visible reaction.`;
}

/** Which reaction rules mention a chemical — powers "what can I try?" hints. */
export function reactionsFor(chemicalId: string, reactions: readonly Reaction[]): Reaction[] {
  return reactions.filter(
    (reaction) =>
      reaction.reactants.some((reactant) => reactant.id === chemicalId) ||
      reaction.products.some((product) => product.id === chemicalId)
  );
}

/** Balance-free helper used by the UI: render the equation with the current locale. */
export function equationFor(reaction: Reaction, locale: 'bn' | 'en'): string {
  return locale === 'bn' ? reaction.equation_bn || reaction.equation : reaction.equation;
}

export function observationFor(reaction: Reaction, locale: 'bn' | 'en'): string {
  return locale === 'bn' ? reaction.observation_bn : reaction.observation_en;
}

/** Convert engine effect descriptors into store-ready timed effects. */
export function toActiveEffects(vesselId: string, effects: EngineEffect[], now: number, prefix = 'fx'): ActiveEffect[] {
  return effects.map((effect, index) => ({
    id: `${prefix}-${vesselId}-${now}-${index}`,
    vesselId,
    kind: effect.kind,
    color: effect.color,
    intensity: effect.intensity,
    startedAt: now,
    durationMs: effect.durationMs
  }));
}
