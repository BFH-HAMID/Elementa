import { describe, expect, it } from 'vitest';
import { getChemPracticalModel } from '@/engine/chemPracticals';
import { getExperimentEntries } from '@/lib/content';
import { guidedExperiments } from '@/lib/labData';

/**
 * Every chemistry write-up in `content/chemistry/**` is a practical a student can
 * perform, so each one must point at a Chemistry Lab practical — a guided
 * walkthrough plus the simulation model that drives the virtual bench.
 */
describe('chemistry experiment write-ups', () => {
  const entries = getExperimentEntries();
  const chemistry = entries.filter((entry) => entry.subject === 'chemistry');

  it('has chemistry write-ups to check', () => {
    expect(chemistry.length).toBeGreaterThanOrEqual(30);
  });

  it('links every chemistry write-up to a lab practical with a simulation', () => {
    const missing: string[] = [];
    for (const entry of chemistry) {
      const slug = entry.lab_practical;
      if (!slug) {
        missing.push(`${entry.slug} (no lab_practical)`);
        continue;
      }
      if (!guidedExperiments.some((experiment) => experiment.slug === slug)) {
        missing.push(`${entry.slug} → unknown practical ${slug}`);
        continue;
      }
      if (!getChemPracticalModel(slug)) missing.push(`${entry.slug} → no simulation model for ${slug}`);
    }
    expect(missing).toEqual([]);
  });

  it('keeps the links unique to a practical that exists', () => {
    const slugs = chemistry.map((entry) => entry.lab_practical).filter((slug): slug is string => !!slug);
    for (const slug of slugs) {
      expect(guidedExperiments.some((experiment) => experiment.slug === slug), slug).toBe(true);
    }
  });
});
