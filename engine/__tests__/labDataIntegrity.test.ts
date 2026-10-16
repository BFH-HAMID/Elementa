import { describe, expect, it } from 'vitest';
import chemicalsData from '@/data/chemicals.json';
import reactionsData from '@/data/reactions.json';
import experimentsData from '@/data/experiments.json';
import apparatusData from '@/data/apparatus.json';
import type { GuidedExperiment, Reaction } from '@/engine/types';

/** Cross-references between the chemistry-lab data files must never dangle. */
const chemicals = new Set(chemicalsData.chemicals.map((c) => c.id));
const apparatus = new Set(apparatusData.apparatus.map((a) => a.id));
const reactions = reactionsData.reactions as unknown as Reaction[];
const reactionIds = new Set(reactions.map((r) => r.id));
const experiments = experimentsData.experiments as unknown as GuidedExperiment[];

describe('chemistry lab data integrity', () => {
  it('keeps the count fields in step with the lists', () => {
    expect(chemicalsData.count).toBe(chemicalsData.chemicals.length);
    expect(chemicalsData.shelfCount).toBe(chemicalsData.chemicals.filter((c) => c.shelf).length);
    expect(reactionsData.count).toBe(reactions.length);
    expect(experimentsData.count).toBe(experiments.length);
  });

  it('has unique ids and slugs', () => {
    expect(chemicals.size).toBe(chemicalsData.chemicals.length);
    expect(reactionIds.size).toBe(reactions.length);
    expect(new Set(experiments.map((e) => e.slug)).size).toBe(experiments.length);
    expect(new Set(experiments.map((e) => e.order)).size).toBe(experiments.length);
  });

  it('only uses known chemicals in reactions', () => {
    const unknown = reactions.flatMap((r) => [...r.reactants, ...r.products].filter((s) => !chemicals.has(s.id)).map((s) => `${r.id}: ${s.id}`));
    expect(unknown).toEqual([]);
  });

  for (const e of experiments) {
    it(`${e.slug} references real chemicals, apparatus, reactions and vessels`, () => {
      const problems: string[] = [];
      for (const id of e.chemicals) if (!chemicals.has(id)) problems.push(`chemical ${id}`);
      for (const id of e.apparatus) if (!apparatus.has(id)) problems.push(`apparatus ${id}`);
      for (const id of e.expectedReactions) if (!reactionIds.has(id)) problems.push(`reaction ${id}`);
      for (const v of e.setup.vessels) {
        if (!apparatus.has(v.apparatusId)) problems.push(`vessel ${v.apparatusId}`);
        for (const p of v.portions) if (!chemicals.has(p.chemicalId)) problems.push(`portion ${p.chemicalId}`);
      }
      for (const step of e.steps) {
        const check = step.check as { type: string; vessel?: number; chemicalId?: string; reactionId?: string };
        if (check.chemicalId && !chemicals.has(check.chemicalId)) problems.push(`step ${step.order} chemical ${check.chemicalId}`);
        if (check.reactionId && !reactionIds.has(check.reactionId)) problems.push(`step ${step.order} reaction ${check.reactionId}`);
        if (typeof check.vessel === 'number' && check.vessel >= e.setup.vessels.length) problems.push(`step ${step.order} vessel ${check.vessel}`);
      }
      expect(e.title_en && e.title_bn && e.aim_en && e.aim_bn).toBeTruthy();
      expect(e.quiz.length).toBeGreaterThan(0);
      expect(problems).toEqual([]);
    });
  }
});
