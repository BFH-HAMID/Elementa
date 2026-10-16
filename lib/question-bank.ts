import { z } from 'zod';
import questionBankJson from '@/content/question-bank.json';
import { subjectSchema } from './schemas';

const questionAnswerSchema = z.object({
  q: z.string().min(1),
  q_bn: z.string().min(1),
  a: z.string().min(1),
  a_bn: z.string().min(1)
});

const questionTopicSchema = z.object({
  slug: z.string().min(1),
  simulation_slug: z.string().min(1),
  subject: subjectSchema,
  title_en: z.string().min(1),
  title_bn: z.string().min(1),
  experiment_slugs: z.array(z.string()),
  questions: z.array(questionAnswerSchema).min(1)
});

const questionBankSchema = z.object({
  version: z.number().int().positive(),
  count: z.number().int().positive(),
  topics: z.array(questionTopicSchema).min(1)
});

const parsedQuestionBank = questionBankSchema.parse(questionBankJson);
const actualQuestionCount = parsedQuestionBank.topics.reduce((total, topic) => total + topic.questions.length, 0);

if (actualQuestionCount !== parsedQuestionBank.count) {
  throw new Error(`Question bank count mismatch: declared ${parsedQuestionBank.count}, found ${actualQuestionCount}`);
}

export type QuestionAnswer = z.infer<typeof questionAnswerSchema>;
export type QuestionTopic = z.infer<typeof questionTopicSchema>;

export const questionTopics: QuestionTopic[] = parsedQuestionBank.topics;
export const questionBankCount = actualQuestionCount;

export function getQuestionsForSimulation(simulationSlug: string): QuestionAnswer[] {
  return questionTopics.find((topic) => topic.simulation_slug === simulationSlug)?.questions ?? [];
}

export function getQuestionsForExperiment(experimentSlug: string): QuestionAnswer[] {
  return questionTopics
    .filter((topic) => topic.experiment_slugs.includes(experimentSlug))
    .flatMap((topic) => topic.questions);
}
