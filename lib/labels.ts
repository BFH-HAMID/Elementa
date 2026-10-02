import type { Level } from './schemas';

export function formatLevel(level: Level, locale: 'bn' | 'en'): string {
  if (locale === 'bn') {
    return ({
      'class-6-8': '৬–৮ শ্রেণি',
      'class-9-10': '৯–১০ শ্রেণি',
      'class-11-12': '১১–১২ শ্রেণি',
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
