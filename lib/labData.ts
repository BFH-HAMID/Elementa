import apparatusData from '@/data/apparatus.json';
import chemicalsData from '@/data/chemicals.json';
import experimentsData from '@/data/experiments.json';
import reactionsData from '@/data/reactions.json';
import { indexById } from '@/engine/reactionEngine';
import type {
  Apparatus,
  Chemical,
  ChemicalCategory,
  GuidedExperiment,
  LabDataset,
  Locale,
  Reaction
} from '@/engine/types';

/**
 * Single typed entry point to everything under `/data`.
 * New chemicals, apparatus, reactions or experiments only need a JSON edit.
 */

export const chemicals = chemicalsData.chemicals as unknown as Chemical[];
export const apparatus = apparatusData.apparatus as unknown as Apparatus[];
export const reactions = reactionsData.reactions as unknown as Reaction[];
export const guidedExperiments = experimentsData.experiments as unknown as GuidedExperiment[];

export const chemicalsById = indexById(chemicals);
export const apparatusById = indexById(apparatus);
export const reactionsById = indexById(reactions);
export const experimentsBySlug = new Map(guidedExperiments.map((experiment) => [experiment.slug, experiment]));

export const labDataset: LabDataset = { chemicals, reactions, apparatus };

export const shelfChemicals = chemicals.filter((chemical) => chemical.shelf);
export const vessels = apparatus.filter((item) => item.kind === 'vessel');
export const tools = apparatus.filter((item) => item.kind !== 'vessel');

export type CategoryMeta = { id: ChemicalCategory; en: string; bn: string };

export const shelfCategories: CategoryMeta[] = (
  Object.entries(chemicalsData.categories as Record<string, { en: string; bn: string }>) as [ChemicalCategory, { en: string; bn: string }][]
).map(([id, labels]) => ({ id, ...labels }));

export function chemicalsInCategory(category: ChemicalCategory): Chemical[] {
  return shelfChemicals.filter((chemical) => chemical.category === category);
}

export function chemicalName(id: string, locale: Locale): string {
  const chemical = chemicalsById.get(id);
  if (!chemical) return id;
  return locale === 'bn' ? chemical.name_bn : chemical.name_en;
}

export function chemicalFormula(id: string): string {
  return chemicalsById.get(id)?.formula ?? id;
}

export function apparatusName(id: string, locale: Locale): string {
  const item = apparatusById.get(id);
  if (!item) return id;
  return locale === 'bn' ? item.name_bn : item.name_en;
}

export function capacityOf(apparatusId: string): number {
  return apparatusById.get(apparatusId)?.capacityMl ?? 100;
}

export function getExperiment(slug: string): GuidedExperiment | undefined {
  return experimentsBySlug.get(slug);
}

export function experimentHref(slug: string): string {
  return `/lab/experiments/${slug}`;
}

/** Rules that mention a chemical — used for the "try this" hint on a shelf chip. */
export function partnerIdsFor(chemicalId: string): string[] {
  const partners = new Set<string>();
  for (const reaction of reactions) {
    const involved = reaction.reactants.some((reactant) => reactant.id === chemicalId);
    if (!involved) continue;
    for (const reactant of reaction.reactants) if (reactant.id !== chemicalId) partners.add(reactant.id);
  }
  return [...partners];
}

export const datasetStats = {
  chemicals: chemicals.length,
  shelfChemicals: shelfChemicals.length,
  apparatus: apparatus.length,
  reactions: reactions.length,
  experiments: guidedExperiments.length
};
