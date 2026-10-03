import apparatusData from '../../data/apparatus.json';
import chemicalsData from '../../data/chemicals.json';
import reactionsData from '../../data/reactions.json';
import { indexById, makePortion, volumeFor } from '../reactionEngine';
import type { Apparatus, Chemical, LabDataset, Reaction, Vessel } from '../types';

export const dataset: LabDataset = {
  chemicals: chemicalsData.chemicals as unknown as Chemical[],
  reactions: reactionsData.reactions as unknown as Reaction[],
  apparatus: apparatusData.apparatus as unknown as Apparatus[]
};

export const chemicalsById = indexById(dataset.chemicals);
export const apparatusById = indexById(dataset.apparatus);
export const reactionsById = indexById(dataset.reactions);

export function chemical(id: string): Chemical {
  const found = chemicalsById.get(id);
  if (!found) throw new Error(`Unknown chemical in test fixture: ${id}`);
  return found;
}

export function reaction(id: string): Reaction {
  const found = reactionsById.get(id);
  if (!found) throw new Error(`Unknown reaction in test fixture: ${id}`);
  return found;
}

export function makeVessel(
  contents: { id: string; mL: number }[] = [],
  options: { apparatusId?: string; id?: string; temperatureC?: number; heating?: boolean; electrolysis?: boolean } = {}
): Vessel {
  const apparatusId = options.apparatusId ?? 'beaker';
  const apparatus = apparatusById.get(apparatusId);
  const portions = contents
    .map((item) => makePortion(chemical(item.id), Math.min(item.mL, apparatus?.capacityMl ?? item.mL)))
    .filter((portion) => portion.mL > 0);
  return {
    id: options.id ?? 'vessel-1',
    apparatusId,
    labelEn: null,
    labelBn: null,
    portions,
    sediment: [],
    gases: [],
    temperatureC: options.temperatureC ?? 25,
    heating: options.heating ?? false,
    thermometer: false,
    electrolysis: options.electrolysis ?? false,
    turbidity: 0,
    lastReactionId: null,
    colorOverride: null,
    lastResolveTempC: options.temperatureC ?? 25
  };
}

/** Total liquid volume of a vessel, rounded for stable assertions. */
export function volumeOf(vessel: Vessel): number {
  return Number(vessel.portions.reduce((sum, portion) => sum + portion.mL, 0).toFixed(4));
}

export function molesOf(vessel: Vessel, chemicalId: string): number {
  return vessel.portions.find((portion) => portion.chemicalId === chemicalId)?.moles ?? 0;
}

export function mL(vessel: Vessel, chemicalId: string): number {
  return vessel.portions.find((portion) => portion.chemicalId === chemicalId)?.mL ?? 0;
}

export { volumeFor };
