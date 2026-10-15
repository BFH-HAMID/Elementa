import { beforeEach, describe, expect, it } from 'vitest';
import { factsFrom, stepSatisfied } from '@/engine/experimentChecks';
import { chemicalsById, getExperiment, guidedExperiments } from '@/lib/labData';
import { useLabStore } from '@/store/labStore';

/**
 * Every guided practical is meant to be completable on the virtual bench: the setup seeds
 * the glassware, and the auto-checked steps must all become true while a student follows the
 * printed instructions. This file scripts the walkthrough for each of the twenty practicals
 * added in the chemistry-lab expansion and drives the store exactly as the UI does.
 */

const state = () => useLabStore.getState();
const facts = () => factsFrom(state().vessels, state().log, chemicalsById);

type Action = { label: string; run: () => void };

/** A tiny bench DSL so each walkthrough reads like the printed procedure. */
function bench(vesselIds: string[], settle: () => void) {
  const actions: Action[] = [];
  return {
    actions,
    add: (index: number, chemicalId: string, amount: number) =>
      actions.push({ label: `add ${amount} of ${chemicalId} to station ${index + 1}`, run: () => state().addChemical(vesselIds[index], chemicalId, amount) }),
    heat: (index: number, seconds: number) =>
      actions.push({
        label: `heat station ${index + 1} for ${seconds} s`,
        run: () => {
          state().setHeating(vesselIds[index], true);
          for (let tick = 0; tick < seconds; tick += 1) {
            state().tick(1);
            // The guide panel ticks a step off while the flame is on (the "heating" check only
            // reads true then), so evaluate progress during the heating loop, not just after.
            settle();
          }
          state().setHeating(vesselIds[index], false);
        }
      }),
    spark: (index: number) => actions.push({ label: `spark station ${index + 1}`, run: () => state().spark(vesselIds[index]) }),
    collect: (from: number, to: number) =>
      actions.push({ label: `collect gas from station ${from + 1} into station ${to + 1}`, run: () => state().collectGas(vesselIds[from], vesselIds[to]) }),
    electrolyse: (index: number) =>
      actions.push({ label: `attach the electrolysis cell to station ${index + 1}`, run: () => state().attachElectrolysis(vesselIds[index], true) })
  };
}

type Bench = ReturnType<typeof bench>;

const walkthroughs: Record<string, (b: Bench) => void> = {
  'sublimation-nh4cl': (b) => {
    b.heat(0, 40);
  },
  'prepare-chlorine': (b) => {
    b.add(0, 'KMnO4', 5);
    b.collect(0, 1);
    b.add(1, 'H2O', 5);
    b.add(1, 'litmus', 2);
  },
  'electrolysis-brine': (b) => {
    b.electrolyse(0);
    b.collect(0, 1);
    b.add(0, 'phenolphthalein', 2);
  },
  'sodium-water': (b) => {
    b.add(0, 'Na', 1);
    b.collect(0, 1);
    b.add(0, 'phenolphthalein', 2);
  },
  'copper-nitric-acid': (b) => {
    b.add(0, 'Cu', 1);
    b.collect(0, 2);
    b.add(1, 'Zn', 1);
  },
  'oxidising-agents': (b) => {
    b.add(0, 'KMnO4', 5);
    b.add(1, 'K2Cr2O7', 5);
  },
  'iodine-liberation': (b) => {
    b.add(0, 'FeCl3', 5);
  },
  'golden-rain': (b) => {
    b.add(0, 'KI', 5);
    b.heat(0, 40);
  },
  'metal-hydroxide-precipitates': (b) => {
    b.add(0, 'NaOH', 4);
    b.add(1, 'NaOH', 4);
    b.add(2, 'NaOH', 4);
    b.add(2, 'NaOH', 4);
    b.heat(0, 30);
  },
  'salt-solution-ph': (b) => {
    b.add(0, 'universal', 2);
    b.add(1, 'universal', 2);
    b.add(2, 'universal', 2);
  },
  'acid-strength-comparison': (b) => {
    b.add(0, 'universal', 2);
    b.add(1, 'universal', 2);
    b.add(0, 'Zn', 1);
    b.add(1, 'Zn', 1);
  },
  'heat-of-neutralisation': (b) => {
    b.add(0, 'NaOH', 40);
  },
  'carbonate-test': (b) => {
    b.add(0, 'HCl', 3);
    b.collect(0, 2);
    b.collect(2, 3);
    b.add(1, 'HCl', 3);
  },
  'limestone-cycle': (b) => {
    b.heat(0, 50);
    b.collect(0, 1);
    b.add(0, 'H2O', 5);
    b.collect(1, 0);
  },
  'metal-acid-reactivity': (b) => {
    b.add(0, 'Mg', 0.5);
    b.add(1, 'Zn', 0.5);
    b.add(2, 'Fe', 0.5);
    b.add(3, 'Cu', 1);
  },
  'rusting-conditions': (b) => {
    b.add(0, 'Fe', 1);
    b.add(1, 'Fe', 1);
    b.add(1, 'O2', 10);
  },
  'oxidation-ethanol': (b) => {
    b.add(0, 'KMnO4', 5);
  },
  'gas-identification': (b) => {
    b.add(0, 'O2', 20);
    b.spark(0);
    b.add(1, 'Ca(OH)2', 5);
    b.heat(2, 15);
  },
  'aluminium-alkali': (b) => {
    b.add(0, 'Al', 1);
    b.collect(0, 1);
  },
  'burning-metals-in-air': (b) => {
    b.add(0, 'Mg', 1);
    b.add(0, 'O2', 20);
    b.heat(0, 25);
    b.add(1, 'Cu', 1);
    b.add(1, 'O2', 20);
    b.heat(1, 25);
  },
  // ── the ten extra practicals added together with the practical simulations ──
  'rate-thiosulfate-concentration': (b) => {
    b.add(0, 'HCl', 5);
    b.add(1, 'HCl', 5);
  },
  'rate-thiosulfate-temperature': (b) => {
    b.heat(0, 30);
    b.add(0, 'HCl', 5);
  },
  'water-of-crystallisation': (b) => {
    b.heat(0, 30);
    b.add(0, 'H2O', 2);
  },
  'molar-volume-hydrogen': (b) => {
    b.add(0, 'Mg', 0.05);
    b.collect(0, 1);
    b.spark(1);
  },
  'copper-electrolysis-faraday': (b) => {
    b.electrolyse(0);
  },
  'solubility-curve-kno3': (b) => {
    b.heat(0, 20);
  },
  'electrochemical-cell': (b) => {
    b.add(0, 'Zn', 1);
    b.add(1, 'Cu', 1);
    b.add(2, 'Zn', 1);
  },
  'catalytic-decomposition-h2o2': (b) => {
    b.add(0, 'MnO2', 0.5);
    b.collect(0, 1);
    b.heat(1, 15);
  },
  'rock-salt-purification': (b) => {
    b.add(0, 'H2O', 20);
    b.heat(1, 75);
  },
  'iron-thiocyanate-equilibrium': (b) => {
    b.add(0, 'KSCN', 1);
    b.add(1, 'KSCN', 1);
    b.add(1, 'NaOH', 2);
  }
};

beforeEach(() => {
  state().reset();
  state().setBurnerIntensity(0.8);
});

describe('the practicals added to the chemistry lab', () => {
  it('lists exactly the walkthroughs that exist in the dataset', () => {
    const newlyAdded = guidedExperiments.filter((experiment) => experiment.order > 11).map((experiment) => experiment.slug);
    expect(newlyAdded.sort()).toEqual(Object.keys(walkthroughs).sort());
  });

  for (const [slug, walk] of Object.entries(walkthroughs)) {
    it(`${slug} can be worked through from setup to the last step`, () => {
      const experiment = getExperiment(slug);
      expect(experiment, `unknown experiment ${slug}`).toBeDefined();

      state().startExperiment(experiment!);
      const vesselIds = state().vessels.map((vessel) => vessel.id);

      // The guide panel ticks a step off as soon as the bench satisfies its check, so walk
      // the actions in order and record how far the list of steps has advanced.
      let pointer = 0;
      const settle = () => {
        while (pointer < experiment!.steps.length && stepSatisfied(experiment!.steps[pointer].check, facts())) {
          pointer += 1;
        }
      };
      settle();
      const scripted = bench(vesselIds, settle);
      walk(scripted);
      for (const action of scripted.actions) {
        action.run();
        settle();
      }

      const unfinished = experiment!.steps
        .slice(pointer)
        .map((step) => `step ${step.order} still waits for ${JSON.stringify(step.check)}`);
      expect(unfinished, `walkthrough stalled at: ${unfinished.join('; ')}`).toEqual([]);

      const fired = new Set(state().log.map((entry) => entry.reactionId).filter((id): id is string => Boolean(id)));
      const missing = experiment!.expectedReactions.filter((id) => !fired.has(id));
      expect(missing, `expected reactions that never fired: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
