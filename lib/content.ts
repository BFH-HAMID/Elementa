import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  equationFrontmatterSchema,
  experimentFrontmatterSchema,
  quizSchema,
  type EquationEntry,
  type ExperimentEntry,
  type Quiz,
  type SearchRecord,
  type Subject,
  type Level
} from './schemas';

const contentRoot = path.join(process.cwd(), 'content');

function readMarkdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => file.endsWith('.mdx')).map((file) => path.join(directory, file));
}

function directoriesFor(subject: Subject): string[] {
  return ['class-6-8', 'class-9-10', 'class-11-12', 'honours'].map((level) => path.join(contentRoot, subject, level));
}

function allMdx(subject: Subject): string[] {
  return directoriesFor(subject).flatMap(readMarkdownFiles);
}

function labelLevel(level: Level): string {
  return ({
    'class-6-8': 'Class 6–8',
    'class-9-10': 'Class 9–10',
    'class-11-12': 'Class 11–12',
    honours: 'Honours'
  })[level];
}

export function getEquationEntries(): EquationEntry[] {
  return (['physics', 'chemistry'] as const)
    .flatMap((subject) => allMdx(subject))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      if ((parsed.data.type ?? 'equation') !== 'equation') return null;
      const data = equationFrontmatterSchema.parse({ ...parsed.data, type: 'equation' });
      return { ...data, body: parsed.content.trim(), filePath };
    })
    .filter((entry): entry is EquationEntry => entry !== null && entry.type === 'equation')
    .sort((a, b) => a.title_en.localeCompare(b.title_en));
}

export function getEquationBySlug(slug: string): EquationEntry | undefined {
  return getEquationEntries().find((entry) => entry.slug === slug);
}

export function getExperimentEntries(): ExperimentEntry[] {
  return (['physics', 'chemistry'] as const)
    .flatMap((subject) => allMdx(subject))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      if ((parsed.data.type ?? 'equation') !== 'experiment') return null;
      const data = experimentFrontmatterSchema.parse({ ...parsed.data, type: 'experiment' });
      return { ...data, body: parsed.content.trim(), filePath };
    })
    .filter((entry): entry is ExperimentEntry => entry !== null && entry.type === 'experiment')
    .sort((a, b) => a.title_en.localeCompare(b.title_en));
}

export function getExperimentBySlug(slug: string): ExperimentEntry | undefined {
  return getExperimentEntries().find((entry) => entry.slug === slug);
}

export function getQuizEntries(): Quiz[] {
  const directory = path.join(contentRoot, 'quizzes');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => quizSchema.parse(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'))))
    .sort((a, b) => a.title_en.localeCompare(b.title_en));
}

export function getQuizBySlug(slug: string): Quiz | undefined {
  return getQuizEntries().find((quiz) => quiz.slug === slug);
}

export function getSearchRecords(): SearchRecord[] {
  const equations = getEquationEntries().map((entry) => ({
    slug: entry.slug,
    kind: 'equation' as const,
    subject: entry.subject,
    title_en: entry.title_en,
    title_bn: entry.title_bn,
    description_en: entry.summary_en ?? entry.derivation,
    description_bn: entry.summary_bn ?? entry.derivation_bn ?? entry.derivation,
    href: `/equations/${entry.slug}`,
    tags: [entry.chapter, ...entry.tags]
  }));
  const experiments = getExperimentEntries().map((entry) => ({
    slug: entry.slug,
    kind: 'experiment' as const,
    subject: entry.subject,
    title_en: entry.title_en,
    title_bn: entry.title_bn,
    description_en: entry.aim,
    description_bn: entry.aim_bn ?? entry.aim,
    href: `/experiments/${entry.slug}`,
    tags: entry.tags
  }));
  return [...equations, ...experiments];
}

export function formatLevel(level: Level, locale: 'bn' | 'en'): string {
  if (locale === 'bn') {
    return ({
      'class-6-8': '৬–৮ শ্রেণি',
      'class-9-10': '৯–১০ শ্রেণি',
      'class-11-12': '১১–১২ শ্রেণি',
      honours: 'অনার্স'
    })[level];
  }
  return labelLevel(level);
}

export function contentCounts() {
  return {
    equations: getEquationEntries().length,
    experiments: getExperimentEntries().length,
    quizzes: getQuizEntries().length
  };
}
