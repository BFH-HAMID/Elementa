import { computePh } from './phCalc';
import { liquidVolume } from './reactionEngine';
import type { Chemical, Locale, LogEntry, StepCheck, Vessel } from './types';

/**
 * Guided-experiment progress is checked here, purely: give the checker what is on the
 * bench plus what the notebook recorded, and it tells you whether a step is done.
 * No component decides chemistry or progress on its own.
 */

export type StepFacts = {
  vessels: Vessel[];
  log: LogEntry[];
  chemicalsById: Map<string, Chemical>;
};

export function factsFrom(vessels: Vessel[], log: LogEntry[], chemicalsById: Map<string, Chemical>): StepFacts {
  return { vessels, log, chemicalsById };
}

function containsChemical(vessel: Vessel, chemicalId: string): boolean {
  return (
    vessel.portions.some((portion) => portion.chemicalId === chemicalId) ||
    vessel.sediment.some((item) => item.chemicalId === chemicalId) ||
    vessel.gases.some((gas) => gas.chemicalId === chemicalId)
  );
}

export function vesselPh(vessel: Vessel, chemicalsById: Map<string, Chemical>): number | null {
  const volumeMl = liquidVolume(vessel);
  if (volumeMl <= 0) return null;
  return computePh({ portions: vessel.portions, volumeMl, chemicalsById, temperatureC: vessel.temperatureC }).ph;
}

/** Is this step's condition true for the bench as it stands right now? */
export function stepSatisfied(check: StepCheck, facts: StepFacts): boolean {
  const at = (index: number) => facts.vessels[index];

  switch (check.type) {
    case 'vesselCount':
      return facts.vessels.length >= check.min;

    case 'contains': {
      const vessel = at(check.vessel);
      return vessel ? containsChemical(vessel, check.chemicalId) : false;
    }

    case 'temperature': {
      const vessel = at(check.vessel);
      return vessel ? vessel.temperatureC >= check.min : false;
    }

    case 'phRange': {
      const vessel = at(check.vessel);
      if (!vessel) return false;
      const ph = vesselPh(vessel, facts.chemicalsById);
      if (ph === null) return false;
      if (check.min !== undefined && ph < check.min) return false;
      if (check.max !== undefined && ph > check.max) return false;
      return true;
    }

    case 'reactionFired':
      return (
        facts.log.some((entry) => entry.reactionId === check.reactionId) ||
        facts.vessels.some((vessel) => vessel.lastReactionId === check.reactionId)
      );

    case 'heating': {
      const vessel = at(check.vessel);
      return vessel ? vessel.heating : false;
    }

    case 'electrolysis': {
      const vessel = at(check.vessel);
      return vessel ? vessel.electrolysis : false;
    }

    case 'spark': {
      const vessel = at(check.vessel);
      return vessel ? facts.log.some((entry) => entry.kind === 'spark' && entry.vesselId === vessel.id) : false;
    }

    default:
      return false;
  }
}

const name = (chemicalId: string, locale: Locale, chemicalsById: Map<string, Chemical>) => {
  const chemical = chemicalsById.get(chemicalId);
  if (!chemical) return chemicalId;
  return locale === 'bn' ? `${chemical.name_bn} (${chemical.formula})` : `${chemical.name_en} (${chemical.formula})`;
};

/** A one-line reminder of what the bench is still waiting for. */
export function checkHint(check: StepCheck, locale: Locale, chemicalsById: Map<string, Chemical>): string {
  const station = (index: number) => (locale === 'bn' ? `স্টেশন ${index + 1}` : `station ${index + 1}`);

  switch (check.type) {
    case 'vesselCount':
      return locale === 'bn' ? `বেঞ্চে কমপক্ষে ${check.min}টি পাত্র দরকার।` : `At least ${check.min} vessels on the bench.`;
    case 'contains':
      return locale === 'bn'
        ? `${station(check.vessel)}-এ ${name(check.chemicalId, 'bn', chemicalsById)} দিন।`
        : `Put ${name(check.chemicalId, 'en', chemicalsById)} into ${station(check.vessel)}.`;
    case 'temperature':
      return locale === 'bn'
        ? `${station(check.vessel)} এর তাপমাত্রা ${check.min} °C বা তার বেশি হতে হবে।`
        : `${station(check.vessel)} must reach ${check.min} °C or hotter.`;
    case 'phRange': {
      const range = [check.min, check.max].filter((value): value is number => value !== undefined).join('–');
      return locale === 'bn' ? `${station(check.vessel)} এর pH ${range || 'নির্দিষ্ট সীমায়'} হতে হবে।` : `${station(check.vessel)} needs a pH of ${range || 'the given range'}.`;
    }
    case 'reactionFired':
      return locale === 'bn' ? 'বিক্রিয়াটি ঘটাতে হবে।' : 'That reaction still has to happen.';
    case 'heating':
      return locale === 'bn' ? `${station(check.vessel)}-এ তাপ দিতে হবে।` : `Heat ${station(check.vessel)}.`;
    case 'electrolysis':
      return locale === 'bn' ? `${station(check.vessel)}-এ তড়িৎ কোষ যুক্ত করুন।` : `Attach the electrolysis cell to ${station(check.vessel)}.`;
    case 'spark':
      return locale === 'bn' ? `${station(check.vessel)}-এ স্ফুলিঙ্গ দিন।` : `Spark ${station(check.vessel)}.`;
    default:
      return '';
  }
}
