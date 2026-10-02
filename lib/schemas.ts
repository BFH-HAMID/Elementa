import { z } from 'zod';

export const subjectSchema = z.enum(['physics', 'chemistry']);
export const levelSchema = z.enum(['class-6-8', 'class-9-10', 'class-11-12', 'honours']);

export const variableSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  name_bn: z.string().optional(),
  unit: z.string().min(1),
  si_unit: z.string().min(1),
  min: z.number().optional(),
  max: z.number().optional()
});

export const referenceFormulaSchema = z.object({
  label_en: z.string().min(1),
  label_bn: z.string().min(1),
  latex: z.string().min(1),
  note_en: z.string().optional(),
  note_bn: z.string().optional()
});

export const derivationStepSchema = z.object({
  step_en: z.string().min(1),
  step_bn: z.string().min(1),
  latex: z.string().optional()
});

export const equationFrontmatterSchema = z.object({
  type: z.literal('equation').default('equation'),
  slug: z.string().min(1),
  title_bn: z.string().min(1),
  title_en: z.string().min(1),
  subject: subjectSchema,
  level: levelSchema,
  chapter: z.string().min(1),
  chapter_bn: z.string().optional(),
  latex: z.string().min(1),
  variables: z.array(variableSchema).min(1),
  calculator: z.boolean().default(true),
  reference_formulas: z.array(referenceFormulaSchema).default([]),
  reference_note_en: z.string().optional(),
  reference_note_bn: z.string().optional(),
  derivation: z.string().min(1),
  derivation_bn: z.string().optional(),
  derivation_steps: z.array(derivationStepSchema).default([]),
  summary_en: z.string().optional(),
  summary_bn: z.string().optional(),
  related: z.array(z.string()).default([]),
  simulation: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const observationTableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string()))
});

export const experimentFrontmatterSchema = z.object({
  type: z.literal('experiment').default('experiment'),
  slug: z.string().min(1),
  title_bn: z.string().min(1),
  title_en: z.string().min(1),
  subject: subjectSchema,
  level: levelSchema,
  aim: z.string().min(1),
  aim_bn: z.string().optional(),
  apparatus: z.array(z.string()),
  apparatus_bn: z.array(z.string()).optional(),
  theory: z.string().min(1),
  theory_bn: z.string().optional(),
  procedure: z.array(z.string()),
  procedure_bn: z.array(z.string()).optional(),
  observation_table: observationTableSchema,
  calculation: z.string().min(1),
  calculation_bn: z.string().optional(),
  precautions: z.array(z.string()),
  precautions_bn: z.array(z.string()).optional(),
  sources_of_error: z.array(z.string()),
  sources_of_error_bn: z.array(z.string()).optional(),
  viva: z.array(z.object({ q: z.string(), a: z.string(), q_bn: z.string().optional(), a_bn: z.string().optional() })),
  simulation: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const quizQuestionSchema = z.object({
  q: z.string(),
  q_bn: z.string().optional(),
  options: z.array(z.string()).min(2),
  options_bn: z.array(z.string()).optional(),
  answer: z.number().int().nonnegative(),
  explanation: z.string(),
  explanation_bn: z.string().optional()
});

export const quizSchema = z.object({
  slug: z.string(),
  title_en: z.string(),
  title_bn: z.string(),
  subject: subjectSchema,
  level: levelSchema,
  chapter: z.string(),
  chapter_bn: z.string().optional(),
  description_en: z.string(),
  description_bn: z.string(),
  questions: z.array(quizQuestionSchema).min(1)
});

export type EquationFrontmatter = z.infer<typeof equationFrontmatterSchema>;
export type ExperimentFrontmatter = z.infer<typeof experimentFrontmatterSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type Variable = z.infer<typeof variableSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type Level = z.infer<typeof levelSchema>;

export type EquationEntry = EquationFrontmatter & {
  body: string;
  filePath: string;
  /** True when the entry can be solved numerically, either by a hand-written
   *  routine or by a declarative model in `lib/calculator-models.ts`. */
  interactive: boolean;
};

export type ExperimentEntry = ExperimentFrontmatter & {
  body: string;
  filePath: string;
};

export type SearchRecord = {
  slug: string;
  kind: 'equation' | 'experiment' | 'simulation';
  subject: Subject;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  href: string;
  tags: string[];
};
