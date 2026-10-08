import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import practicalCatalog from '../content/practical-topics.json';
import { formatLevel } from './labels';
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
import { hasCalculatorModel } from './calculator-models';
import { mathToText } from './utils';

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

let equationCache: EquationEntry[] | null = null;
let equationBySlugCache: Map<string, EquationEntry> | null = null;
let experimentCache: ExperimentEntry[] | null = null;
let experimentBySlugCache: Map<string, ExperimentEntry> | null = null;

export function getEquationEntries(): EquationEntry[] {
  if (equationCache) return equationCache;
  equationCache = (['physics', 'chemistry'] as const)
    .flatMap((subject) => allMdx(subject))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      if ((parsed.data.type ?? 'equation') !== 'equation') return null;
      const data = equationFrontmatterSchema.parse({ ...parsed.data, type: 'equation' });
      return {
        ...data,
        body: parsed.content.trim(),
        filePath,
        interactive: data.calculator || hasCalculatorModel(data.slug)
      };
    })
    .filter((entry): entry is EquationEntry => entry !== null && entry.type === 'equation')
    .sort((a, b) => a.title_en.localeCompare(b.title_en));
  equationBySlugCache = new Map(equationCache.map((entry) => [entry.slug, entry]));
  return equationCache;
}

export function getEquationBySlug(slug: string): EquationEntry | undefined {
  if (!equationBySlugCache) getEquationEntries();
  return equationBySlugCache?.get(slug);
}

export function getExperimentEntries(): ExperimentEntry[] {
  if (experimentCache) return experimentCache;
  experimentCache = (['physics', 'chemistry'] as const)
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
  experimentBySlugCache = new Map(experimentCache.map((entry) => [entry.slug, entry]));
  return experimentCache;
}

export function getExperimentBySlug(slug: string): ExperimentEntry | undefined {
  if (!experimentBySlugCache) getExperimentEntries();
  return experimentBySlugCache?.get(slug);
}

let quizCache: Quiz[] | null = null;
let quizBySlugCache: Map<string, Quiz> | null = null;

export function getQuizEntries(): Quiz[] {
  if (quizCache) return quizCache;
  const directory = path.join(contentRoot, 'quizzes');
  quizCache = fs.existsSync(directory)
    ? fs.readdirSync(directory)
      .filter((file) => file.endsWith('.json'))
      .map((file) => quizSchema.parse(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'))))
      .sort((a, b) => a.title_en.localeCompare(b.title_en))
    : [];
  quizBySlugCache = new Map(quizCache.map((quiz) => [quiz.slug, quiz]));
  return quizCache;
}

export function getQuizBySlug(slug: string): Quiz | undefined {
  if (!quizBySlugCache) getQuizEntries();
  return quizBySlugCache?.get(slug);
}

export function getSearchRecords(): SearchRecord[] {
  const equations = getEquationEntries().map((entry) => ({
    slug: entry.slug,
    kind: 'equation' as const,
    subject: entry.subject,
    title_en: entry.title_en,
    title_bn: entry.title_bn,
    description_en: mathToText(entry.summary_en ?? entry.derivation),
    description_bn: mathToText(entry.summary_bn ?? entry.derivation_bn ?? entry.derivation),
    href: `/equations/${entry.slug}`,
    tags: [entry.chapter, ...entry.tags]
  }));
  const experiments = getExperimentEntries().map((entry) => ({
    slug: entry.slug,
    kind: 'experiment' as const,
    subject: entry.subject,
    title_en: entry.title_en,
    title_bn: entry.title_bn,
    description_en: mathToText(entry.aim),
    description_bn: mathToText(entry.aim_bn ?? entry.aim),
    href: `/experiments/${entry.slug}`,
    tags: entry.tags
  }));
  const practicals: SearchRecord[] = practicalCatalog.groups.flatMap((group) => group.topics.map((topic) => ({
    slug: topic.slug,
    kind: 'experiment' as const,
    subject: group.subject as Subject,
    title_en: topic.title_en,
    title_bn: topic.title_bn,
    description_en: mathToText(topic.note_en),
    description_bn: mathToText(topic.note_bn),
    href: `/experiments#lab-${topic.slug}`,
    tags: ['practical', group.stage, topic.category_en]
  })));
  return [...equations, ...experiments, ...practicals];
}

export { formatLevel };

export function contentCounts() {
  return {
    equations: getEquationEntries().length,
    experiments: getExperimentEntries().length,
    quizzes: getQuizEntries().length
  };
}
