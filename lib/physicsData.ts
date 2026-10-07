import equipmentJson from '@/data/equipment.json';
import physicsExperimentsJson from '@/data/physicsExperiments.json';
import type {
  EquipmentDef,
  EquipmentCategory,
  GuidedPhysicsExperiment,
  PhysicsDomain
} from '@/engine/physicsTypes';
import type { Locale } from '@/engine/types';

export const physicsEquipment = equipmentJson.equipment as unknown as EquipmentDef[];
export const physicsGuidedExperiments = physicsExperimentsJson.experiments as unknown as GuidedPhysicsExperiment[];

export const equipmentById = new Map<string, EquipmentDef>(
  physicsEquipment.map((item) => [item.id, item])
);

export const physicsExperimentsBySlug = new Map<string, GuidedPhysicsExperiment>(
  physicsGuidedExperiments.map((exp) => [exp.slug, exp])
);

export interface CategoryMeta {
  id: EquipmentCategory;
  domain: PhysicsDomain;
  en: string;
  bn: string;
  icon: string;
}

export const physicsCategories: CategoryMeta[] = [
  { id: 'electricity', domain: 'electricity', en: 'Electricity', bn: 'তড়িৎ ও বর্তনী', icon: 'zap' },
  { id: 'magnetism', domain: 'magnetism', en: 'Magnetism & Induction', bn: 'চৌম্বক ও আবেশ', icon: 'magnet' },
  { id: 'optics', domain: 'optics', en: 'Optics & Light', bn: 'আলোকবিজ্ঞান', icon: 'sun' },
  { id: 'mechanics', domain: 'mechanics', en: 'Mechanics & Motion', bn: 'বলবিদ্যা ও গতি', icon: 'activity' },
  { id: 'heat', domain: 'heat', en: 'Heat & Thermodynamics', bn: 'তাপ ও তাপগতিবিদ্যা', icon: 'flame' },
  { id: 'waves', domain: 'waves', en: 'Waves & Sound', bn: 'তরঙ্গ ও শব্দ', icon: 'music' },
  { id: 'measuring-tools', domain: 'measurement', en: 'Measuring Tools', bn: 'পরিমাপক যন্ত্র', icon: 'scale' },
  { id: 'modern-physics', domain: 'modern', en: 'Modern Physics', bn: 'আধুনিক পদার্থবিজ্ঞান', icon: 'cpu' }
];

export function getEquipment(id: string): EquipmentDef | undefined {
  return equipmentById.get(id);
}

export function getPhysicsExperiment(slug: string): GuidedPhysicsExperiment | undefined {
  return physicsExperimentsBySlug.get(slug);
}

export function equipmentInCategory(category: EquipmentCategory): EquipmentDef[] {
  return physicsEquipment.filter((item) => item.category === category);
}

export function equipmentName(id: string, locale: Locale): string {
  const item = equipmentById.get(id);
  if (!item) return id;
  return locale === 'bn' ? item.name_bn : item.name_en;
}

export function equipmentDescription(id: string, locale: Locale): string {
  const item = equipmentById.get(id);
  if (!item) return '';
  return locale === 'bn' ? item.description_bn : item.description_en;
}

export const physicsDatasetStats = {
  equipment: physicsEquipment.length,
  experiments: physicsGuidedExperiments.length,
  categories: physicsCategories.length
};
