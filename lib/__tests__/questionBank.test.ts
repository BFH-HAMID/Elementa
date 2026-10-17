import { describe, expect, it } from 'vitest';
import { getExperimentEntries } from '@/lib/content';
import {
  getQuestionsForExperiment,
  getQuestionsForSimulation,
  questionBankCount,
  questionTopics
} from '@/lib/question-bank';
import { simulationMetas } from '@/lib/simulations';

describe('bilingual question bank', () => {
  it('contains more than 100 complete bilingual questions', () => {
    expect(questionBankCount).toBe(128);
    expect(questionBankCount).toBeGreaterThan(100);

    for (const topic of questionTopics) {
      for (const question of topic.questions) {
        expect(question.q.trim()).not.toBe('');
        expect(question.q_bn.trim()).not.toBe('');
        expect(question.a.trim()).not.toBe('');
        expect(question.a_bn.trim()).not.toBe('');
      }
    }
  });

  it('provides eight questions for every custom simulation', () => {
    expect(new Set(questionTopics.map((topic) => topic.simulation_slug)).size).toBe(simulationMetas.length);

    for (const simulation of simulationMetas) {
      expect(getQuestionsForSimulation(simulation.slug)).toHaveLength(8);
    }
  });

  it('links more than 100 questions only to real experiment guides', () => {
    const experimentSlugs = new Set(getExperimentEntries().map((experiment) => experiment.slug));
    const linkedTopics = questionTopics.filter((topic) => topic.experiment_slugs.length > 0);
    const linkedQuestionCount = linkedTopics.reduce((total, topic) => total + topic.questions.length, 0);
    const linkedSlugs = linkedTopics.flatMap((topic) => topic.experiment_slugs);

    expect(linkedQuestionCount).toBe(120);
    expect(linkedQuestionCount).toBeGreaterThan(100);
    for (const slug of linkedSlugs) expect(experimentSlugs.has(slug)).toBe(true);
  });

  it('adds relevant viva questions without losing bilingual answers', () => {
    const projectileViva = getQuestionsForExperiment('projectile-motion-lab');
    expect(projectileViva).toHaveLength(8);
    expect(projectileViva.every((item) => item.q_bn && item.a_bn)).toBe(true);
    expect(getQuestionsForExperiment('hall-effect-lab')).toEqual([]);
  });
});
