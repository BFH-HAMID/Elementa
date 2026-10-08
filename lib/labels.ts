import type { Level } from './schemas';

/**
 * Learning levels are shown to users as categories (স্কুল, উচ্চমাধ্যমিক, বিশ্ববিদ্যালয়)
 * with their grades listed under each category, instead of one flat list.
 */
export const levelCategories = [
  { id: 'school', levels: ['class-6-8', 'class-9-10'], bn: 'স্কুল', en: 'School', bnRange: '৬ষ্ঠ–১০ম', enRange: 'Class 6–10' },
  { id: 'higher-secondary', levels: ['class-11-12'], bn: 'উচ্চমাধ্যমিক', en: 'Higher secondary', bnRange: '১১শ–১২শ', enRange: 'Class 11–12' },
  { id: 'university', levels: ['honours'], bn: 'বিশ্ববিদ্যালয়', en: 'University', bnRange: 'অনার্স', enRange: 'Honours' }
] as const satisfies ReadonlyArray<{ id: string; levels: readonly Level[]; bn: string; en: string; bnRange: string; enRange: string }>;

export type LevelCategory = (typeof levelCategories)[number];

/** Category id a level belongs to, e.g. 'school' for 'class-9-10'. */
export function levelCategoryId(level: Level): LevelCategory['id'] | undefined {
  return levelCategories.find((item) => (item.levels as readonly Level[]).includes(level))?.id;
}

/** One filter option per category, e.g. "স্কুল (৬ষ্ঠ–১০ম)". */
export function formatLevelCategoryOption(category: LevelCategory, locale: 'bn' | 'en'): string {
  return locale === 'bn' ? `${category.bn} (${category.bnRange})` : `${category.en} (${category.enRange})`;
}

/** Grade or programme name only, e.g. "৯ম–১০ম" or "অনার্স". */
export function formatLevelShort(level: Level, locale: 'bn' | 'en'): string {
  if (locale === 'bn') {
    return ({
      'class-6-8': '৬ষ্ঠ–৮ম',
      'class-9-10': '৯ম–১০ম',
      'class-11-12': '১১শ–১২শ',
      honours: 'অনার্স'
    })[level];
  }
  return ({
    'class-6-8': 'Class 6–8',
    'class-9-10': 'Class 9–10',
    'class-11-12': 'Class 11–12',
    honours: 'Honours'
  })[level];
}

/** Category name a level belongs to, e.g. "স্কুল" or "উচ্চমাধ্যমিক". */
export function formatLevelCategory(level: Level, locale: 'bn' | 'en'): string {
  const category = levelCategories.find((item) => (item.levels as readonly Level[]).includes(level));
  if (!category) return formatLevelShort(level, locale);
  return locale === 'bn' ? category.bn : category.en;
}

/** Badge text: category and grade together, e.g. "স্কুল · ৯ম–১০ম". */
export function formatLevel(level: Level, locale: 'bn' | 'en'): string {
  if (locale === 'bn') return `${formatLevelCategory(level, locale)} · ${formatLevelShort(level, locale)}`;
  return formatLevelShort(level, locale);
}
