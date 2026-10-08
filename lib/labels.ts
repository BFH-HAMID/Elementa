import type { Level } from './schemas';

const levelCategory: Record<Level, { bn: string; en: string }> = {
  'class-6-8': { bn: 'স্কুল', en: 'School' },
  'class-9-10': { bn: 'স্কুল', en: 'School' },
  'class-11-12': { bn: 'উচ্চমাধ্যমিক', en: 'Higher secondary' },
  honours: { bn: 'বিশ্ববিদ্যালয়', en: 'University' }
};

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

/** Badge text: category and grade together, e.g. "স্কুল · ৯ম–১০ম". */
export function formatLevel(level: Level, locale: 'bn' | 'en'): string {
  const category = levelCategory[level];
  if (locale === 'bn') return `${category.bn} · ${formatLevelShort(level, 'bn')}`;
  return formatLevelShort(level, 'en');
}
