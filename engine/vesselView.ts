import { composeLiquidColor, mixColors } from './colorMixer';
import { boilingPointFor } from './heatModel';
import { observedColor } from './phCalc';
import { computePh } from './phCalc';
import { MOLAR_VOLUME_ML, indexById, liquidVolume } from './reactionEngine';
import type {
  Apparatus,
  Chemical,
  GasVolume,
  IndicatorId,
  LabDataset,
  Portion,
  ReactionContext,
  Sediment,
  Vessel
} from './types';

/**
 * Everything the UI needs to draw one vessel, computed from pure data: colour, level,
 * pH, indicator readings, gases and whether it is boiling. Components never do
 * chemistry themselves — they render this.
 */

export type VesselView = {
  vessel: Vessel;
  apparatus: Apparatus | undefined;
  capacityMl: number;
  contents: { portion: Portion; chemical: Chemical }[];
  sediment: { item: Sediment; chemical: Chemical | undefined }[];
  gases: { gas: GasVolume; chemical: Chemical | undefined }[];
  totalMl: number;
  fill: number;
  sedimentFill: number;
  color: string;
  liquidOpacity: number;
  turbidity: number;
  sedimentColor: string | null;
  ph: number | null;
  nature: 'acidic' | 'neutral' | 'alkaline' | null;
  indicators: { id: IndicatorId; chemicalId: string; mL: number }[];
  boiling: boolean;
  boilingPointC: number;
  heating: boolean;
  headspaceMl: number;
};

export function vesselView(vessel: Vessel, dataset: LabDataset, burnerLit: boolean): VesselView {
  const chemicalsById = indexById(dataset.chemicals);
  const apparatus = dataset.apparatus.find((item) => item.id === vessel.apparatusId);
  const capacityMl = apparatus?.capacityMl ?? 100;

  const contents = vessel.portions
    .map((portion) => ({ portion, chemical: chemicalsById.get(portion.chemicalId) }))
    .filter((entry): entry is { portion: Portion; chemical: Chemical } => Boolean(entry.chemical))
    .sort((a, b) => b.portion.mL - a.portion.mL);

  const sediment = vessel.sediment.map((item) => ({ item, chemical: chemicalsById.get(item.chemicalId) }));
  const totalMl = liquidVolume(vessel);
  const sedimentMl = vessel.sediment.reduce((sum, item) => sum + item.mL, 0);

  // Read-only version of `settleGases`: share the headspace by mole fraction.
  const headspace = Math.max(1, capacityMl - totalMl - sedimentMl);
  const totalGasMoles = vessel.gases.reduce((sum, gas) => sum + gas.moles, 0);
  const gases = vessel.gases.map((gas) => {
    const share = totalGasMoles > 0 ? gas.moles / totalGasMoles : 0;
    return {
      gas: { ...gas, mL: Math.min(gas.moles * MOLAR_VOLUME_ML, headspace * share) },
      chemical: chemicalsById.get(gas.chemicalId)
    };
  });
  const liquid = composeLiquidColor(vessel.portions, vessel.sediment, chemicalsById, {
    turbidity: vessel.turbidity,
    override: vessel.colorOverride
  });

  const indicators = vessel.portions
    .map((portion) => ({ portion, chemical: chemicalsById.get(portion.chemicalId) }))
    .filter((entry): entry is { portion: Portion; chemical: Chemical } => Boolean(entry.chemical?.indicator))
    .map((entry) => ({ id: entry.chemical.indicator as IndicatorId, chemicalId: entry.chemical.id, mL: entry.portion.mL }));

  const phResult =
    totalMl > 0
      ? computePh({ portions: vessel.portions, volumeMl: totalMl, chemicalsById, temperatureC: vessel.temperatureC })
      : null;

  const withIndicators =
    phResult && indicators.length > 0
      ? observedColor(liquid.color, indicators.map((entry) => ({ indicator: entry.id, mL: entry.mL })), phResult.ph)
      : liquid.color;

  // Dissolved gases tint the liquid a little (chlorine water, brown NO₂).
  const gasTint = gases.filter((entry) => (entry.chemical?.opacity ?? 0) > 0.3 && entry.gas.mL > 0);
  const color =
    gasTint.length > 0 && totalMl > 0
      ? mixColors(
          [
            { color: withIndicators, weight: totalMl, opacity: liquid.opacity },
            ...gasTint.map((entry) => ({
              color: entry.chemical?.color ?? '#ffffff',
              weight: Math.min(entry.gas.mL, capacityMl) * 0.35,
              opacity: (entry.chemical?.opacity ?? 0.5) * 0.6
            }))
          ],
          withIndicators
        )
      : withIndicators;

  const boilingPointC = boilingPointFor(vessel.portions, chemicalsById);

  return {
    vessel,
    apparatus,
    capacityMl,
    contents,
    sediment,
    gases,
    totalMl,
    fill: Math.min(1, (totalMl + sedimentMl) / capacityMl),
    sedimentFill: Math.min(0.6, sedimentMl / capacityMl),
    color,
    liquidOpacity: liquid.opacity,
    turbidity: vessel.turbidity,
    sedimentColor: liquid.sedimentColor,
    ph: phResult?.ph ?? null,
    nature: phResult?.nature ?? null,
    indicators,
    boiling: vessel.heating && burnerLit && vessel.temperatureC >= boilingPointC - 0.5,
    boilingPointC,
    heating: vessel.heating && burnerLit,
    headspaceMl: Math.max(0, capacityMl - totalMl - sedimentMl)
  };
}

/** A shared context object for the engine, derived from a vessel plus the burner. */
export function contextFrom(vessel: Vessel, burnerLit: boolean, extra: Partial<ReactionContext> = {}): ReactionContext {
  return {
    temperatureC: vessel.temperatureC,
    heating: vessel.heating && burnerLit,
    spark: false,
    electrolysis: vessel.electrolysis,
    light: false,
    ...extra
  };
}
