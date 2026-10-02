import practicalCatalog from '@/content/practical-topics.json';
import { getEquationEntries, getExperimentEntries, getQuizEntries } from '@/lib/content';
import { phetSimulationCounts } from '@/lib/phet-simulations';
import { simulationMetas } from '@/lib/simulations';
import type { Subject } from '@/lib/schemas';

export type SubjectResourceCounts = {
  equations: number;
  experimentGuides: number;
  practicalTopics: number;
  simulations: number;
  phetSimulations: number;
  quizzes: number;
};

export function getSubjectResourceCounts(subject: Subject): SubjectResourceCounts {
  const practicalTopics = practicalCatalog.groups
    .filter((group) => group.subject === subject)
    .reduce((count, group) => count + group.topics.length, 0);

  return {
    equations: getEquationEntries().filter((entry) => entry.subject === subject).length,
    experimentGuides: getExperimentEntries().filter((entry) => entry.subject === subject).length,
    practicalTopics,
    simulations: simulationMetas.filter((entry) => entry.subject === subject).length,
    phetSimulations: phetSimulationCounts[subject],
    quizzes: getQuizEntries().filter((entry) => entry.subject === subject).length
  };
}
