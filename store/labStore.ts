import { create } from 'zustand';
import { AMBIENT_C, applyDeltaT, boilingPointFor, describeHeat, stepHeat } from '@/engine/heatModel';
import {
  MOLAR_VOLUME_ML,
  clamp,
  indexById,
  liquidVolume,
  makePortion,
  molesFor,
  noReactionNote,
  resolveVessel,
  settleGases,
  toActiveEffects,
  volumeFor
} from '@/engine/reactionEngine';
import type {
  ActiveEffect,
  Apparatus,
  Chemical,
  GasVolume,
  GuidedExperiment,
  HazardLevel,
  LabDataset,
  Locale,
  LogEntry,
  Portion,
  Reaction,
  ReactionContext,
  ReactionOutcome,
  Sediment,
  Vessel
} from '@/engine/types';
import { apparatusById, chemicalsById, labDataset } from '@/lib/labData';
import { labT } from '@/lib/i18n';

/**
 * All lab state lives here. Components stay presentational: they call actions and read
 * the resulting vessels, log and effects. Nothing in this file touches the DOM except
 * the localStorage save/load pair.
 */

export const STORAGE_KEY = 'elementa-chemistry-lab:v1';
export const HISTORY_LIMIT = 40;
export const LOG_LIMIT = 80;
export const MAX_VESSELS = 4;

export type BurnerState = { lit: boolean; intensity: number };

export type SavedLab = {
  version: 1;
  savedAt: number;
  vessels: Vessel[];
  burner: BurnerState;
  pourMl: number;
  log: LogEntry[];
  activeExperiment: ActiveExperiment | null;
};

export type ActiveExperiment = { slug: string; completed: number[] };

export type HazardAlert = {
  level: Exclude<HazardLevel, 'none'>;
  reactionId: string;
  en: string;
  bn: string;
  at: number;
};

export type LastOutcome = {
  vesselId: string;
  reaction: Reaction;
  limitingReagentId: string | null;
  extentMoles: number;
  at: number;
};

type Snapshot = {
  vessels: Vessel[];
  burner: BurnerState;
  effects: ActiveEffect[];
  log: LogEntry[];
  lastOutcome: LastOutcome | null;
  hazard: HazardAlert | null;
};

export type LabStore = {
  locale: Locale;
  vessels: Vessel[];
  selectedVesselId: string | null;
  pourMl: number;
  burner: BurnerState;
  effects: ActiveEffect[];
  log: LogEntry[];
  lastOutcome: LastOutcome | null;
  hazard: HazardAlert | null;
  hint: { vesselId: string; text_en: string; text_bn: string } | null;
  activeExperiment: ActiveExperiment | null;
  experiment: GuidedExperiment | null;
  history: Snapshot[];
  future: Snapshot[];
  savedAt: number | null;
  flash: { message_en: string; message_bn: string; tone: 'info' | 'success' | 'warning' } | null;

  setLocale: (locale: Locale) => void;
  setPourMl: (amount: number) => void;
  selectVessel: (vesselId: string | null) => void;
  addVessel: (apparatusId: string, label?: { en: string; bn: string }) => string;
  removeVessel: (vesselId: string) => void;
  setVesselApparatus: (vesselId: string, apparatusId: string) => void;
  addChemical: (vesselId: string, chemicalId: string, amount?: number) => void;
  removePortion: (vesselId: string, chemicalId: string) => void;
  emptyVessel: (vesselId: string) => void;
  stir: (vesselId: string) => void;
  setHeating: (vesselId: string, heating: boolean) => void;
  toggleBurner: () => void;
  setBurnerIntensity: (intensity: number) => void;
  attachThermometer: (vesselId: string, attached: boolean) => void;
  attachElectrolysis: (vesselId: string, attached: boolean) => void;
  spark: (vesselId: string) => void;
  collectGas: (fromVesselId: string, toVesselId: string) => void;
  dispense: (fromVesselId: string, toVesselId: string, mL?: number) => void;
  tick: (dtSeconds: number) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
  load: () => boolean;
  hasSavedLab: () => boolean;
  startExperiment: (experiment: GuidedExperiment) => void;
  stopExperiment: () => void;
  completeStep: (order: number) => void;
  dismissHazard: () => void;
  clearFlash: () => void;
  pushLog: (entry: Omit<LogEntry, 'id' | 'at'>) => void;
};

let vesselCounter = 0;
export function nextVesselId(): string {
  vesselCounter += 1;
  return `vessel-${Date.now().toString(36)}-${vesselCounter}`;
}

let logCounter = 0;
function nextId(prefix: string): string {
  logCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${logCounter}`;
}

export function createVessel(
  apparatusId: string,
  options: { id?: string; labelEn?: string; labelBn?: string; contents?: { chemicalId: string; mL: number }[] } = {}
): Vessel {
  const apparatus = apparatusById.get(apparatusId);
  const capacity = apparatus?.capacityMl ?? 100;
  const portions: Portion[] = (options.contents ?? [])
    .map((item) => {
      const chemical = chemicalsById.get(item.chemicalId);
      if (!chemical) return null;
      return makePortion(chemical, Math.min(item.mL, capacity));
    })
    .filter((portion): portion is Portion => portion !== null && portion.mL > 0);

  return {
    id: options.id ?? nextVesselId(),
    apparatusId,
    labelEn: options.labelEn ?? null,
    labelBn: options.labelBn ?? null,
    portions,
    sediment: [],
    gases: [],
    temperatureC: AMBIENT_C,
    heating: false,
    thermometer: false,
    electrolysis: false,
    turbidity: 0,
    lastReactionId: null,
    colorOverride: null,
    lastResolveTempC: AMBIENT_C
  };
}

export function contextFor(vessel: Vessel, burner: BurnerState, extra: Partial<ReactionContext> = {}): ReactionContext {
  return {
    temperatureC: vessel.temperatureC,
    heating: vessel.heating && burner.lit,
    spark: false,
    electrolysis: vessel.electrolysis,
    light: false,
    ...extra
  };
}

/** Remove boiled-off liquid, taking water first and then other solvents proportionally. */
function boilOff(vessel: Vessel, mL: number, chemicalsById: Map<string, Chemical>): void {
  let remaining = mL;
  if (remaining <= 0) return;
  const water = vessel.portions.find((portion) => portion.chemicalId === 'H2O');
  const takeFrom = (portion: Portion, wanted: number) => {
    const taken = Math.min(portion.mL, wanted);
    portion.mL -= taken;
    portion.moles = molesFor(chemicalsById.get(portion.chemicalId) as Chemical, portion.mL);
    return taken;
  };
  if (water) remaining -= takeFrom(water, remaining);
  if (remaining > 0) {
    const others = vessel.portions.filter((portion) => portion.chemicalId !== 'H2O');
    const total = others.reduce((sum, portion) => sum + portion.mL, 0);
    for (const portion of others) {
      if (total <= 0) break;
      remaining -= takeFrom(portion, (portion.mL / total) * remaining);
    }
  }
  vessel.portions = vessel.portions.filter((portion) => portion.mL > 0.05);
  vessel.colorOverride = null;
}

export const useLabStore = create<LabStore>()((set, get) => {
  const snapshot = (state: LabStore): Snapshot => ({
    vessels: state.vessels.map((vessel) => ({
      ...vessel,
      portions: vessel.portions.map((portion) => ({ ...portion })),
      sediment: vessel.sediment.map((item) => ({ ...item })),
      gases: vessel.gases.map((gas) => ({ ...gas }))
    })),
    burner: { ...state.burner },
    effects: [...state.effects],
    log: [...state.log],
    lastOutcome: state.lastOutcome,
    hazard: state.hazard
  });

  const commit = (mutate: (state: LabStore) => Partial<LabStore>) => {
    const before = snapshot(get());
    set((state) => {
      const patch = mutate(state);
      return { ...patch, history: [...state.history, before].slice(-HISTORY_LIMIT), future: [] };
    });
  };

  const log = (
    entry: Omit<LogEntry, 'id' | 'at'> & { at?: number },
    state: LabStore
  ): LogEntry[] => {
    const record: LogEntry = { id: nextId('log'), at: entry.at ?? Date.now(), ...entry };
    const previous = state.log[0];
    // Repeating the same inert rule (a boiling beaker, a flame test) must not flood the notebook.
    if (previous && previous.reactionId && previous.reactionId === record.reactionId && previous.text_en === record.text_en) {
      return state.log;
    }
    return [record, ...state.log].slice(0, LOG_LIMIT);
  };

  /** Run the engine for one vessel and fold the result back into the store. */
  const resolve = (state: LabStore, vesselId: string, extraContext: Partial<ReactionContext> = {}): Partial<LabStore> => {
    const vessel = state.vessels.find((item) => item.id === vesselId);
    if (!vessel) return {};
    const context = contextFor(vessel, state.burner, extraContext);
    const result = resolveVessel(vessel, labDataset, context);
    const apparatus = apparatusById.get(vessel.apparatusId);
    settleGases(result.vessel, apparatus?.capacityMl ?? 100);

    const nextVessels = state.vessels.map((item) =>
      item.id === vesselId
        ? {
            ...result.vessel,
            lastResolveTempC: result.vessel.temperatureC,
            gases: result.vessel.gases.map((gas) => ({ ...gas }))
          }
        : item
    );

    let logEntries = state.log;
    let lastOutcome = state.lastOutcome;
    let hazard = state.hazard;
    let hint = state.hint;

    const staged: LogEntry[] = [];
    for (const outcome of result.outcomes) {
      const reaction = outcome.reaction;
      if (!reaction) continue;
      const now = Date.now();
      lastOutcome = {
        vesselId,
        reaction,
        limitingReagentId: outcome.limitingReagentId,
        extentMoles: outcome.extentMoles,
        at: now
      };
      staged.push({
        id: nextId('log'),
        at: now,
        kind: 'observation',
        tone: reaction.hazard === 'danger' ? 'danger' : reaction.hazard === 'caution' ? 'warning' : 'reaction',
        reactionId: reaction.id,
        vesselId,
        text_en: reaction.observation_en,
        text_bn: reaction.observation_bn
      });
      if (reaction.hazard !== 'none' && (reaction.hazard_en || reaction.hazard_bn)) {
        hazard = {
          level: reaction.hazard as 'caution' | 'danger',
          reactionId: reaction.id,
          en: reaction.hazard_en ?? reaction.observation_en,
          bn: reaction.hazard_bn ?? reaction.observation_bn,
          at: now
        };
        staged.push({
          id: nextId('log'),
          at: now,
          kind: 'safety',
          tone: reaction.hazard === 'danger' ? 'danger' : 'warning',
          reactionId: reaction.id,
          vesselId,
          text_en: hazard.en,
          text_bn: hazard.bn
        });
      }
    }

    if (result.outcomes.length === 0) {
      if (result.blockedReaction) {
        const { reaction, block } = result.blockedReaction;
        const minTemp = reaction.trigger.minTempC;
        const text_en = labT('en', `hint.${block}` as never, minTemp ? { value: minTemp } : undefined);
        const text_bn = labT('bn', `hint.${block}` as never, minTemp ? { value: minTemp } : undefined);
        hint = { vesselId, text_en, text_bn };
      } else {
        const note = noReactionNote(result.vessel, chemicalsById, 'en');
        if (note && result.vessel.portions.length + result.vessel.sediment.length > 1) {
          hint = { vesselId, text_en: note, text_bn: noReactionNote(result.vessel, chemicalsById, 'bn') ?? note };
        } else {
          hint = null;
        }
      }
    } else {
      hint = null;
    }

    for (const entry of staged) {
      const previous = logEntries[0];
      if (previous && previous.reactionId && previous.reactionId === entry.reactionId && previous.text_en === entry.text_en) continue;
      logEntries = [entry, ...logEntries].slice(0, LOG_LIMIT);
    }

    const effects: ActiveEffect[] = [
      ...toActiveEffects(vesselId, result.effects, Date.now()),
      ...state.effects
    ].slice(0, 60);

    return { vessels: nextVessels, log: logEntries, lastOutcome, hazard, hint, effects };
  };

  return {
    locale: 'bn',
    vessels: [],
    selectedVesselId: null,
    pourMl: 10,
    burner: { lit: false, intensity: 0.8 },
    effects: [],
    log: [],
    lastOutcome: null,
    hazard: null,
    hint: null,
    activeExperiment: null,
    experiment: null,
    history: [],
    future: [],
    savedAt: null,
    flash: null,

    setLocale: (locale) => set({ locale }),
    setPourMl: (amount) => set({ pourMl: clamp(Math.round(amount), 1, 100) }),
    selectVessel: (vesselId) => set({ selectedVesselId: vesselId }),

    addVessel: (apparatusId, label) => {
      const state = get();
      if (state.vessels.length >= MAX_VESSELS) {
        set({ flash: { message_en: 'The bench holds four stations at most.', message_bn: 'বেঞ্চে সর্বোচ্চ চারটি স্টেশন রাখা যায়।', tone: 'warning' } });
        return '';
      }
      const apparatus = apparatusById.get(apparatusId);
      const vessel = createVessel(apparatusId, { labelEn: label?.en, labelBn: label?.bn });
      commit(() => ({
        vessels: [...get().vessels, vessel],
        selectedVesselId: vessel.id,
        log: log(
          {
            kind: 'system',
            tone: 'info',
            reactionId: null,
            vesselId: vessel.id,
            text_en: `${apparatus?.name_en ?? apparatusId} placed on the bench.`,
            text_bn: `বেঞ্চে ${apparatus?.name_bn ?? apparatusId} রাখা হলো।`
          },
          get()
        )
      }));
      return vessel.id;
    },

    removeVessel: (vesselId) =>
      commit((state) => ({
        vessels: state.vessels.filter((vessel) => vessel.id !== vesselId),
        selectedVesselId: state.selectedVesselId === vesselId ? null : state.selectedVesselId,
        effects: state.effects.filter((effect) => effect.vesselId !== vesselId)
      })),

    setVesselApparatus: (vesselId, apparatusId) =>
      commit((state) => ({
        vessels: state.vessels.map((vessel) => {
          if (vessel.id !== vesselId) return vessel;
          const capacity = apparatusById.get(apparatusId)?.capacityMl ?? 100;
          const used = liquidVolume(vessel);
          // Overflow is simply left behind on the bench when you swap to smaller glassware.
          const scale = used > capacity ? capacity / used : 1;
          const portions = vessel.portions
            .map((portion) => {
              const mL = portion.mL * scale;
              const chemical = chemicalsById.get(portion.chemicalId);
              return { ...portion, mL, moles: chemical ? molesFor(chemical, mL) : portion.moles * scale };
            })
            .filter((portion) => portion.mL > 0.05);
          const next = { ...vessel, apparatusId, portions, colorOverride: null };
          settleGases(next, capacity);
          return next;
        })
      })),

    addChemical: (vesselId, chemicalId, amount) => {
      const state = get();
      const vessel = state.vessels.find((item) => item.id === vesselId);
      const chemical = chemicalsById.get(chemicalId);
      if (!vessel || !chemical) return;
      const apparatus = apparatusById.get(vessel.apparatusId);
      const capacity = apparatus?.capacityMl ?? 100;
      const wanted = amount ?? state.pourMl;
      const used = liquidVolume(vessel) + vessel.sediment.reduce((sum, item) => sum + item.mL, 0);
      const room = Math.max(0, capacity - used);
      if (room <= 0.05) {
        set({ flash: { message_en: labT('en', 'bench.full'), message_bn: labT('bn', 'bench.full'), tone: 'warning' } });
        return;
      }
      const poured = Math.min(wanted, room);
      const portion = makePortion(chemical, poured);
      const before = snapshot(state);

      set((current) => {
        const nextVessels = current.vessels.map((item) => {
          if (item.id !== vesselId) return item;
          const portions = item.portions.map((entry) => ({ ...entry }));
          const existing = portions.find((entry) => entry.chemicalId === chemicalId);
          if (existing) {
            existing.mL += poured;
            existing.moles = molesFor(chemical, existing.mL);
            existing.addedAt = Date.now();
          } else {
            portions.push(portion);
          }
          // A fresh addition clears the colour the previous reaction asked for.
          return { ...item, portions, colorOverride: null };
        });
        const staged: LabStore = { ...current, vessels: nextVessels };
        const patch = resolve(staged, vesselId);
        const pourLog: LogEntry = {
          id: nextId('log'),
          at: Date.now(),
          kind: 'system',
          tone: 'info',
          reactionId: null,
          vesselId,
          text_en: `Added ${poured.toFixed(1)} ${chemical.state === 'solid' ? 'g' : 'mL'} of ${chemical.name_en}.`,
          text_bn: `${chemical.name_bn} যোগ করা হলো — ${poured.toFixed(1)} ${chemical.state === 'solid' ? 'গ্রাম' : 'মিলি'}।`
        };
        return {
          ...patch,
          vessels: patch.vessels ?? nextVessels,
          log: [pourLog, ...(patch.log ?? staged.log)].slice(0, LOG_LIMIT),
          history: [...current.history, before].slice(-HISTORY_LIMIT),
          future: []
        };
      });
    },

    removePortion: (vesselId, chemicalId) =>
      commit((state) => {
        const vessels = state.vessels.map((vessel) =>
          vessel.id === vesselId
            ? {
                ...vessel,
                portions: vessel.portions.filter((portion) => portion.chemicalId !== chemicalId),
                colorOverride: null
              }
            : vessel
        );
        return { vessels };
      }),

    emptyVessel: (vesselId) =>
      commit((state) => {
        const vessels = state.vessels.map((vessel) =>
          vessel.id === vesselId
            ? { ...vessel, portions: [], sediment: [], gases: [], turbidity: 0, colorOverride: null, temperatureC: AMBIENT_C }
            : vessel
        );
        return {
          vessels,
          effects: state.effects.filter((effect) => effect.vesselId !== vesselId),
          hint: state.hint?.vesselId === vesselId ? null : state.hint
        };
      }),

    /** A spatula stirs: settled solid clouds the liquid again, then settles once more. */
    stir: (vesselId) =>
      commit((state) => {
        const vessel = state.vessels.find((item) => item.id === vesselId);
        if (!vessel) return {};
        const hasSolid = vessel.sediment.length > 0;
        const vessels = state.vessels.map((item) =>
          item.id === vesselId ? { ...item, turbidity: hasSolid ? Math.min(1, item.turbidity + 0.55) : Math.max(0, item.turbidity - 0.2) } : item
        );
        return {
          vessels,
          log: log(
            {
              kind: 'system',
              tone: 'info',
              reactionId: null,
              vesselId,
              text_en: hasSolid
                ? 'Stirred with a spatula — the settled solid clouds the liquid, then settles again.'
                : 'Stirred with a spatula — the mixture is even.',
              text_bn: hasSolid
                ? 'স্প্যাচুলা দিয়ে নাড়া হলো — তলানি ভেসে তরল ঘোলা হলো, আবার জমে যাবে।'
                : 'স্প্যাচুলা দিয়ে নাড়া হলো — মিশ্রণ এখন সমসত্ত্ব।'
            },
            state
          )
        };
      }),

    setHeating: (vesselId, heating) => {
      const state = get();
      const vessel = state.vessels.find((item) => item.id === vesselId);
      if (!vessel) return;
      const apparatus = apparatusById.get(vessel.apparatusId);
      if (heating && apparatus && !apparatus.canHeat) {
        set({
          flash: {
            message_en: `${apparatus.name_en} must not be heated.`,
            message_bn: `${apparatus.name_bn} গরম করা যাবে না।`,
            tone: 'warning'
          }
        });
        return;
      }
      commit((current) => {
        const burner = heating && !current.burner.lit ? { ...current.burner, lit: true } : current.burner;
        const vessels = current.vessels.map((item) => (item.id === vesselId ? { ...item, heating } : item));
        const staged: LabStore = { ...current, vessels, burner };
        const patch = resolve(staged, vesselId);
        return {
          ...patch,
          vessels: patch.vessels ?? vessels,
          burner,
          log: log(
            {
              kind: 'heat',
              tone: 'info',
              reactionId: null,
              vesselId,
              text_en: heating ? 'The burner is now under this vessel.' : 'Heating stopped.',
              text_bn: heating ? 'বার্নার এখন এই পাত্রের নিচে।' : 'তাপ দেওয়া বন্ধ হলো।'
            },
            current
          )
        };
      });
    },

    toggleBurner: () =>
      commit((state) => ({
        burner: { ...state.burner, lit: !state.burner.lit },
        log: log(
          {
            kind: 'system',
            tone: 'info',
            reactionId: null,
            vesselId: null,
            text_en: state.burner.lit ? 'Burner extinguished.' : 'Burner lit.',
            text_bn: state.burner.lit ? 'বার্নার নেভানো হলো।' : 'বার্নার জ্বালানো হলো।'
          },
          state
        )
      })),

    setBurnerIntensity: (intensity) => set((state) => ({ burner: { ...state.burner, intensity: clamp(intensity, 0.1, 1) } })),

    attachThermometer: (vesselId, attached) =>
      commit((state) => ({
        vessels: state.vessels.map((vessel) => (vessel.id === vesselId ? { ...vessel, thermometer: attached } : vessel))
      })),

    attachElectrolysis: (vesselId, attached) => {
      const state = get();
      commit((current) => {
        const vessels = current.vessels.map((vessel) => (vessel.id === vesselId ? { ...vessel, electrolysis: attached } : vessel));
        const staged: LabStore = { ...current, vessels };
        const patch = resolve(staged, vesselId);
        return {
          ...patch,
          vessels: patch.vessels ?? vessels,
          log: attached
            ? log(
                {
                  kind: 'system',
                  tone: 'info',
                  reactionId: null,
                  vesselId,
                  text_en: 'Electrolysis cell connected — current is flowing.',
                  text_bn: 'তড়িৎ বিশ্লেষণ কোষ যুক্ত — বিদ্যুৎ প্রবাহিত হচ্ছে।'
                },
                current
              )
            : current.log
        };
      });
      void state;
    },

    spark: (vesselId) => {
      const state = get();
      const before = snapshot(state);
      set((current) => {
        const staged: LabStore = { ...current };
        const sparkLog: LogEntry = {
          id: nextId('log'),
          at: Date.now(),
          kind: 'spark',
          tone: 'info',
          reactionId: null,
          vesselId,
          text_en: 'A spark was passed through the station.',
          text_bn: 'স্টেশনে স্ফুলিঙ্গ দেওয়া হলো।'
        };
        // A spark is also a bright flash, so light-triggered rules fire too.
        const patch = resolve(staged, vesselId, { spark: true, light: true });
        return {
          ...patch,
          vessels: patch.vessels ?? current.vessels,
          log: [sparkLog, ...(patch.log ?? current.log)].slice(0, LOG_LIMIT),
          history: [...current.history, before].slice(-HISTORY_LIMIT),
          future: []
        };
      });
    },

    collectGas: (fromVesselId, toVesselId) => {
      const state = get();
      const source = state.vessels.find((vessel) => vessel.id === fromVesselId);
      const target = state.vessels.find((vessel) => vessel.id === toVesselId);
      if (!source || !target || source.gases.length === 0) {
        set({ flash: { message_en: 'No gas to collect yet.', message_bn: 'এখনো সংগ্রহ করার মতো গ্যাস নেই।', tone: 'info' } });
        return;
      }
      commit((current) => {
        const from = current.vessels.find((vessel) => vessel.id === fromVesselId) as Vessel;
        const moved: GasVolume[] = from.gases.map((gas) => ({ ...gas }));
        const vessels = current.vessels.map((vessel) => {
          if (vessel.id === fromVesselId) return { ...vessel, gases: [] };
          if (vessel.id !== toVesselId) return vessel;
          const gases = vessel.gases.map((gas) => ({ ...gas }));
          for (const gas of moved) {
            const existing = gases.find((entry) => entry.chemicalId === gas.chemicalId);
            if (existing) existing.moles += gas.moles;
            else gases.push({ ...gas });
          }
          const capacity = apparatusById.get(vessel.apparatusId)?.capacityMl ?? 250;
          settleGases({ ...vessel, gases }, capacity);
          return { ...vessel, gases };
        });
        const names = moved.map((gas) => chemicalsById.get(gas.chemicalId)?.name_en ?? gas.chemicalId).join(', ');
        const namesBn = moved.map((gas) => chemicalsById.get(gas.chemicalId)?.name_bn ?? gas.chemicalId).join(', ');
        const staged: LabStore = { ...current, vessels };
        const patch = resolve(staged, toVesselId);
        return {
          ...patch,
          vessels: patch.vessels ?? vessels,
          log: log(
            {
              kind: 'system',
              tone: 'info',
              reactionId: null,
              vesselId: toVesselId,
              text_en: `Collected ${names} through the delivery tube.`,
              text_bn: `ডেলিভারি টিউব দিয়ে ${namesBn} সংগ্রহ করা হলো।`
            },
            current
          )
        };
      });
    },

    dispense: (fromVesselId, toVesselId, amount) => {
      const state = get();
      const source = state.vessels.find((vessel) => vessel.id === fromVesselId);
      if (!source || source.portions.length === 0) return;
      const wanted = Math.min(amount ?? state.pourMl, liquidVolume(source));
      if (wanted <= 0) return;
      commit((current) => {
        const from = current.vessels.find((vessel) => vessel.id === fromVesselId) as Vessel;
        const total = liquidVolume(from) || 1;
        const target = current.vessels.find((vessel) => vessel.id === toVesselId);
        const room = target ? Math.max(0, (apparatusById.get(target.apparatusId)?.capacityMl ?? 100) - liquidVolume(target)) : 0;
        const poured = Math.min(wanted, room);
        if (poured <= 0) return {};
        const transferred = new Map<string, number>(
          from.portions.map((portion) => [portion.chemicalId, (portion.mL / total) * poured])
        );
        const vessels = current.vessels.map((vessel) => {
          if (vessel.id === fromVesselId) {
            const portions = vessel.portions
              .map((portion) => {
                const share = transferred.get(portion.chemicalId) ?? 0;
                const chemical = chemicalsById.get(portion.chemicalId) as Chemical;
                return { ...portion, mL: portion.mL - share, moles: molesFor(chemical, portion.mL - share) };
              })
              .filter((portion) => portion.mL > 0.05);
            return { ...vessel, portions, colorOverride: null };
          }
          if (vessel.id !== toVesselId) return vessel;
          const portions = vessel.portions.map((portion) => ({ ...portion }));
          for (const [chemicalId, mL] of transferred) {
            const chemical = chemicalsById.get(chemicalId);
            if (!chemical) continue;
            const existing = portions.find((portion) => portion.chemicalId === chemicalId);
            if (existing) {
              existing.mL += mL;
              existing.moles = molesFor(chemical, existing.mL);
            } else {
              portions.push(makePortion(chemical, mL, Date.now()));
            }
          }
          return { ...vessel, portions, colorOverride: null };
        });
        const staged: LabStore = { ...current, vessels };
        const patch = resolve(staged, toVesselId);
        return { ...patch, vessels: patch.vessels ?? vessels };
      });
    },

    tick: (dtSeconds) => {
      const state = get();
      const now = Date.now();
      const activeEffects = state.effects.filter((effect) => now - effect.startedAt < effect.durationMs);
      let changed = false;
      let logEntries = state.log;
      let lastOutcome = state.lastOutcome;
      let hazard = state.hazard;

      const vessels = state.vessels.map((vessel) => {
        const heating = vessel.heating && state.burner.lit;
        const apparatus = apparatusById.get(vessel.apparatusId);
        const canHeat = heating && (apparatus?.canHeat ?? false);
        const volume = liquidVolume(vessel);
        const boilingPointC = boilingPointFor(vessel.portions, chemicalsById);
        const stepped = stepHeat({
          temperatureC: vessel.temperatureC,
          volumeMl: volume,
          heating: canHeat,
          intensity: state.burner.intensity,
          dtSeconds,
          boilingPointC,
          canHeat: apparatus?.canHeat ?? true
        });
        const next: Vessel = {
          ...vessel,
          temperatureC: stepped.temperatureC,
          portions: vessel.portions.map((portion) => ({ ...portion })),
          sediment: vessel.sediment.map((item) => ({ ...item })),
          gases: vessel.gases.map((gas) => ({ ...gas }))
        };
        if (stepped.boiledOffMl > 0) {
          boilOff(next, stepped.boiledOffMl, chemicalsById);
          next.colorOverride = null;
          changed = true;
        }
        if (next.turbidity > 0) {
          next.turbidity = clamp(next.turbidity - dtSeconds * 0.22, 0, 1);
        }
        if (Math.abs(next.temperatureC - vessel.temperatureC) > 0.05) changed = true;
        settleGases(next, apparatus?.capacityMl ?? 100);

        // Heat-triggered rules are re-checked whenever the temperature climbs a step.
        if (canHeat && next.temperatureC - vessel.lastResolveTempC >= 8) {
          const context = contextFor(next, state.burner);
          const result = resolveVessel(next, labDataset, context);
          if (result.outcomes.length > 0) {
            for (const outcome of result.outcomes) {
              const reaction = outcome.reaction;
              if (!reaction) continue;
              const previous = logEntries[0];
              if (!previous || previous.reactionId !== reaction.id) {
                const entry: LogEntry = {
                  id: nextId('log'),
                  at: now,
                  kind: 'observation',
                  tone: reaction.hazard === 'danger' ? 'danger' : reaction.hazard === 'caution' ? 'warning' : 'reaction',
                  reactionId: reaction.id,
                  vesselId: vessel.id,
                  text_en: reaction.observation_en,
                  text_bn: reaction.observation_bn
                };
                logEntries = [entry, ...logEntries].slice(0, LOG_LIMIT);
              }
              lastOutcome = {
                vesselId: vessel.id,
                reaction,
                limitingReagentId: outcome.limitingReagentId,
                extentMoles: outcome.extentMoles,
                at: now
              };
              if (reaction.hazard !== 'none' && (reaction.hazard_en || reaction.hazard_bn)) {
                hazard = {
                  level: reaction.hazard as 'caution' | 'danger',
                  reactionId: reaction.id,
                  en: reaction.hazard_en ?? reaction.observation_en,
                  bn: reaction.hazard_bn ?? reaction.observation_bn,
                  at: now
                };
              }
            }
            next.lastResolveTempC = next.temperatureC;
            activeEffects.unshift(...toActiveEffects(vessel.id, result.effects, now));
            changed = true;
          } else {
            next.lastResolveTempC = next.temperatureC;
          }
        }
        return next;
      });

      if (!changed && activeEffects.length === state.effects.length) return;
      set({ vessels, effects: activeEffects.slice(0, 60), log: logEntries, lastOutcome, hazard });
    },

    reset: () =>
      commit((state) => ({
        vessels: [],
        selectedVesselId: null,
        effects: [],
        lastOutcome: null,
        hazard: null,
        hint: null,
        burner: { lit: false, intensity: state.burner.intensity },
        log: log(
          {
            kind: 'system',
            tone: 'info',
            reactionId: null,
            vesselId: null,
            text_en: 'Bench cleared. Everything washed and put back on the shelf.',
            text_bn: 'বেঞ্চ পরিষ্কার করা হলো। সবকিছু ধুয়ে শেলফে রাখা হলো।'
          },
          state
        )
      })),

    undo: () =>
      set((state) => {
        const previous = state.history[state.history.length - 1];
        if (!previous) return {};
        return {
          ...previous,
          history: state.history.slice(0, -1),
          future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT)
        };
      }),

    redo: () =>
      set((state) => {
        const next = state.future[0];
        if (!next) return {};
        return {
          ...next,
          future: state.future.slice(1),
          history: [...state.history, snapshot(state)].slice(-HISTORY_LIMIT)
        };
      }),

    save: () => {
      const state = get();
      const payload: SavedLab = {
        version: 1,
        savedAt: Date.now(),
        vessels: state.vessels,
        burner: state.burner,
        pourMl: state.pourMl,
        log: state.log,
        activeExperiment: state.activeExperiment
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        set({
          savedAt: payload.savedAt,
          flash: { message_en: labT('en', 'action.saved'), message_bn: labT('bn', 'action.saved'), tone: 'success' }
        });
      } catch {
        set({
          flash: {
            message_en: 'This browser blocked local storage, so the lab could not be saved.',
            message_bn: 'এই ব্রাউজার লোকাল স্টোরেজ বন্ধ রেখেছে, তাই ল্যাব সংরক্ষণ করা যায়নি।',
            tone: 'warning'
          }
        });
      }
    },

    load: () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          set({ flash: { message_en: labT('en', 'action.noSave'), message_bn: labT('bn', 'action.noSave'), tone: 'info' } });
          return false;
        }
        const parsed = JSON.parse(raw) as SavedLab;
        const before = snapshot(get());
        set((state) => ({
          vessels: parsed.vessels ?? [],
          burner: parsed.burner ?? state.burner,
          pourMl: parsed.pourMl ?? state.pourMl,
          log: parsed.log ?? [],
          activeExperiment: parsed.activeExperiment ?? null,
          savedAt: parsed.savedAt ?? null,
          effects: [],
          lastOutcome: null,
          hazard: null,
          hint: null,
          history: [...state.history, before].slice(-HISTORY_LIMIT),
          future: [],
          flash: { message_en: labT('en', 'action.loaded'), message_bn: labT('bn', 'action.loaded'), tone: 'success' }
        }));
        return true;
      } catch {
        set({ flash: { message_en: 'Saved lab could not be read.', message_bn: 'সংরক্ষিত ল্যাব পড়া যায়নি।', tone: 'warning' } });
        return false;
      }
    },

    hasSavedLab: () => {
      try {
        return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) !== null;
      } catch {
        return false;
      }
    },

    startExperiment: (experiment) => {
      const state = get();
      const before = snapshot(state);
      const vessels = experiment.setup.vessels.map((setup) =>
        createVessel(setup.apparatusId, {
          labelEn: setup.label_en,
          labelBn: setup.label_bn,
          contents: setup.portions.map((portion) => ({ chemicalId: portion.chemicalId, mL: portion.mL }))
        })
      );
      set((current) => ({
        vessels,
        selectedVesselId: vessels[0]?.id ?? null,
        effects: [],
        hazard: null,
        hint: null,
        lastOutcome: null,
        activeExperiment: { slug: experiment.slug, completed: state.activeExperiment?.slug === experiment.slug ? state.activeExperiment.completed : [] },
        experiment,
        log: [
          {
            id: nextId('log'),
            at: Date.now(),
            kind: 'system',
            tone: 'success',
            reactionId: null,
            vesselId: null,
            text_en: `Guided experiment loaded: ${experiment.title_en}.`,
            text_bn: `গাইডেড পরীক্ষা লোড হলো: ${experiment.title_bn}।`
          }
        ],
        history: [...current.history, before].slice(-HISTORY_LIMIT),
        future: []
      }));
    },

    stopExperiment: () => set({ activeExperiment: null, experiment: null }),

    completeStep: (order) =>
      set((state) => {
        if (!state.activeExperiment) return {};
        if (state.activeExperiment.completed.includes(order)) return {};
        return {
          activeExperiment: { ...state.activeExperiment, completed: [...state.activeExperiment.completed, order] }
        };
      }),

    dismissHazard: () => set({ hazard: null }),
    clearFlash: () => set({ flash: null }),

    pushLog: (entry) => set((state) => ({ log: log(entry, state) }))
  };
});

// ── Small read-only selectors used by several components ───────────────────────

export function vesselLabel(vessel: Vessel, locale: Locale, index: number): string {
  const label = locale === 'bn' ? vessel.labelBn : vessel.labelEn;
  if (label) return label;
  const apparatus = apparatusById.get(vessel.apparatusId);
  const name = apparatus ? (locale === 'bn' ? apparatus.name_bn : apparatus.name_en) : vessel.apparatusId;
  return `${name} · ${labT(locale, 'bench.slot', { index: index + 1 })}`;
}

export function vesselContents(vessel: Vessel): { portion: Portion; chemical: Chemical }[] {
  return vessel.portions
    .map((portion) => ({ portion, chemical: chemicalsById.get(portion.chemicalId) as Chemical }))
    .filter((entry) => Boolean(entry.chemical))
    .sort((a, b) => b.portion.mL - a.portion.mL);
}

export function sedimentList(vessel: Vessel): { item: Sediment; chemical: Chemical | undefined }[] {
  return vessel.sediment.map((item) => ({ item, chemical: chemicalsById.get(item.chemicalId) }));
}

export function gasList(vessel: Vessel): { gas: GasVolume; chemical: Chemical | undefined }[] {
  return vessel.gases.map((gas) => ({ gas, chemical: chemicalsById.get(gas.chemicalId) }));
}

export function heatDescription(vessel: Vessel, locale: Locale): string {
  return describeHeat(vessel.temperatureC, locale);
}

export function fillRatio(vessel: Vessel, apparatus: Apparatus | undefined): number {
  const capacity = apparatus?.capacityMl ?? 100;
  const used = liquidVolume(vessel) + vessel.sediment.reduce((sum, item) => sum + item.mL, 0);
  return clamp(used / capacity, 0, 1);
}

export function headspaceMl(vessel: Vessel, apparatus: Apparatus | undefined): number {
  const capacity = apparatus?.capacityMl ?? 100;
  return Math.max(0, capacity - liquidVolume(vessel) - vessel.sediment.reduce((sum, item) => sum + item.mL, 0));
}

export function gasVolumeInMl(gas: GasVolume): number {
  return gas.moles * MOLAR_VOLUME_ML;
}

export { applyDeltaT, volumeFor, indexById };
