import equipmentJson from '@/data/equipment.json';
import type { Locale } from '@/engine/types';

/**
 * The full lab-instrument catalogue (`data/equipment.json`).
 *
 * The physics lab owns these 65 instruments, but a chemistry bench needs plenty of
 * them too — balances, thermometers, calorimeters, burners, meters, stopwatches —
 * so the wet lab can offer the whole catalogue next to its own glassware.
 *
 * The catalogue is read-only here: instruments are placed on the bench as
 * movable objects, they never run chemistry.
 */
export interface LabInstrument {
  id: string;
  name_en: string;
  name_bn: string;
  category: string;
  domain?: string;
  description_en?: string;
  description_bn?: string;
  icon?: string;
  width?: number;
  height?: number;
  defaultProperties?: Record<string, number | boolean | string>;
  propertySchema?: {
    key: string;
    name_en: string;
    name_bn: string;
    type: string;
    unit?: string;
    default?: number | boolean | string;
    min?: number;
    max?: number;
    step?: number;
  }[];
  terminals?: { id: string; name: string; polarity?: string; x: number; y: number }[];
}

export const labInstruments = equipmentJson.equipment as unknown as LabInstrument[];

export const labInstrumentById = new Map<string, LabInstrument>(
  labInstruments.map((item) => [item.id, item])
);

export type LabInstrumentCategory = { id: string; en: string; bn: string };

/** The catalogue's own departments, reused as shelf filters. */
export const labInstrumentCategories: LabInstrumentCategory[] = [
  { id: 'electricity', en: 'Electricity & circuits', bn: 'তড়িৎ ও বর্তনী' },
  { id: 'magnetism', en: 'Magnetism & induction', bn: 'চৌম্বক ও আবেশ' },
  { id: 'optics', en: 'Optics & light', bn: 'আলোকবিজ্ঞান' },
  { id: 'mechanics', en: 'Mechanics & motion', bn: 'বলবিদ্যা ও গতি' },
  { id: 'heat', en: 'Heat & thermodynamics', bn: 'তাপ ও তাপগতিবিদ্যা' },
  { id: 'waves', en: 'Waves & sound', bn: 'তরঙ্গ ও শব্দ' },
  { id: 'measuring-tools', en: 'Measuring tools', bn: 'পরিমাপক যন্ত্র' },
  { id: 'modern-physics', en: 'Modern physics', bn: 'আধুনিক পদার্থবিজ্ঞান' }
];

export function labInstrumentName(id: string, locale: Locale): string {
  const item = labInstrumentById.get(id);
  if (!item) return id;
  return locale === 'bn' ? item.name_bn : item.name_en;
}

export function labInstrumentDescription(id: string, locale: Locale): string {
  const item = labInstrumentById.get(id);
  if (!item) return '';
  return locale === 'bn' ? item.description_bn ?? '' : item.description_en ?? '';
}

/** The instrument's own footprint on the bench, in bench pixels. */
export function labInstrumentSize(id: string): { width: number; height: number } {
  const item = labInstrumentById.get(id);
  return { width: item?.width ?? 120, height: item?.height ?? 80 };
}

export function labInstrumentsInCategory(category: string): LabInstrument[] {
  return labInstruments.filter((item) => item.category === category);
}
