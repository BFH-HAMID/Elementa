import rawCatalog from '@/content/practical-topics.json';

/**
 * Typed view of `content/practical-topics.json`.
 *
 * The JSON is imported directly, so TypeScript would infer a union of every
 * object shape in the file and refuse optional fields. These types state the
 * contract explicitly: every topic carries a one-line note for cards and
 * search, and a 10–12 point revision brief that the catalogue expands.
 */

export type PracticalTopic = {
  slug: string;
  category_en: string;
  category_bn: string;
  title_en: string;
  title_bn: string;
  note_en: string;
  note_bn: string;
  /** Short revision brief: 10–12 scannable points, Bangla and English. */
  points_bn: string[];
  points_en: string[];
  /** Optional KaTeX relation shown under the points. */
  equation?: string;
  /** Optional slug of a full step-by-step lab guide. */
  guide_slug?: string;
};

export type PracticalGroup = {
  id: string;
  subject: 'physics' | 'chemistry';
  stage: 'school' | 'hsc';
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  topics: PracticalTopic[];
};

export type PracticalCatalog = {
  version: number;
  groups: PracticalGroup[];
};

const catalog = rawCatalog as unknown as PracticalCatalog;

// The point arrays are authored per subject, so a topic may not have them yet.
// Normalise once at import time and the catalogue can always render a list.
catalog.groups.forEach((group) => {
  group.topics.forEach((topic) => {
    topic.points_bn ??= [];
    topic.points_en ??= [];
  });
});

export const practicalCatalog = catalog;

export const practicalTopics: PracticalTopic[] = practicalCatalog.groups.flatMap((group) => group.topics);
