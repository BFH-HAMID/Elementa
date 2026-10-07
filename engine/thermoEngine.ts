export interface CalorimetryResult {
  equilibriumTempCelsius: number;
  calculatedSpecificHeat: number;
  heatExchangedJoules: number;
  waterEquivalentGrams: number;
}

export interface JouleHeatingResult {
  electricalWorkJoules: number;
  heatAbsorbedJoules: number;
  tempRiseCelsius: number;
  currentTempCelsius: number;
  equivalentJ: number; // J/J (should be 1.0)
}

export const SPECIFIC_HEAT_TABLE: Record<string, number> = {
  water: 4186,
  copper: 385,
  aluminum: 900,
  iron: 450,
  lead: 128,
  brass: 380,
  glass: 840
};

/**
 * Method of Mixtures Calorimetry calculation:
 * Heat Lost by hot solid = Heat Gained by cold water & copper vessel
 */
export function calculateMethodOfMixtures(
  sampleMaterial: 'copper' | 'aluminum' | 'iron' | 'lead' | 'brass',
  sampleMassGrams: number,
  sampleInitialTempC: number,
  waterMassGrams: number,
  waterInitialTempC: number,
  calorimeterMassGrams = 85,
  calorimeterMaterial: 'copper' | 'aluminum' = 'copper'
): CalorimetryResult {
  const sSample = SPECIFIC_HEAT_TABLE[sampleMaterial] || 385;
  const sWater = SPECIFIC_HEAT_TABLE.water;
  const sCal = SPECIFIC_HEAT_TABLE[calorimeterMaterial] || 385;

  const m1 = sampleMassGrams / 1000; // kg
  const m2 = waterMassGrams / 1000;
  const mc = calorimeterMassGrams / 1000;

  const C_sample = m1 * sSample;
  const C_cal_water = m2 * sWater + mc * sCal;

  // Equilibrium temp Tf = (C_sample * T1 + C_cal_water * T2) / (C_sample + C_cal_water)
  const Tf = (C_sample * sampleInitialTempC + C_cal_water * waterInitialTempC) / (C_sample + C_cal_water);

  const heatExchanged = C_cal_water * (Tf - waterInitialTempC);
  const waterEquivalentGrams = (calorimeterMassGrams * sCal) / sWater;

  // Re-calculate experimental specific heat from Tf
  const calcSpecificHeat = (C_cal_water * (Tf - waterInitialTempC)) / (m1 * (sampleInitialTempC - Tf));

  return {
    equilibriumTempCelsius: Number(Tf.toFixed(2)),
    calculatedSpecificHeat: Number(calcSpecificHeat.toFixed(1)),
    heatExchangedJoules: Number(heatExchanged.toFixed(1)),
    waterEquivalentGrams: Number(waterEquivalentGrams.toFixed(2))
  };
}

/**
 * Joule's Law Electrical Heating:
 * Electrical Work W = V * I * t
 * Heat Q = (mw * sw + mc * sc) * ΔT
 */
export function calculateJouleHeatingStep(
  voltage: number,
  current: number,
  timeSec: number,
  initialTempC: number,
  waterMassGrams = 200,
  calorimeterMassGrams = 85,
  ambientTempC = 20
): JouleHeatingResult {
  const sWater = SPECIFIC_HEAT_TABLE.water;
  const sCal = SPECIFIC_HEAT_TABLE.copper;

  const mw = waterMassGrams / 1000;
  const mc = calorimeterMassGrams / 1000;
  const totalHeatCapacity = mw * sWater + mc * sCal; // J/K

  const electricalWorkJoules = voltage * current * timeSec;

  // Approximate cooling loss to ambient
  const kCooling = 0.05; // W/K
  const avgTempDiff = Math.max(0, initialTempC - ambientTempC);
  const heatLostToAmbient = kCooling * avgTempDiff * timeSec;

  const netHeatJoules = Math.max(0, electricalWorkJoules - heatLostToAmbient);
  const tempRiseCelsius = netHeatJoules / totalHeatCapacity;
  const currentTempCelsius = initialTempC + tempRiseCelsius;

  const equivalentJ = electricalWorkJoules > 0 && netHeatJoules > 0
    ? electricalWorkJoules / netHeatJoules
    : 1.0;

  return {
    electricalWorkJoules: Number(electricalWorkJoules.toFixed(1)),
    heatAbsorbedJoules: Number(netHeatJoules.toFixed(1)),
    tempRiseCelsius: Number(tempRiseCelsius.toFixed(2)),
    currentTempCelsius: Number(currentTempCelsius.toFixed(2)),
    equivalentJ: Number(equivalentJ.toFixed(3))
  };
}

/**
 * Searle's Apparatus Thermal Conductivity:
 * K = (m_water * s_water * (T4 - T3) * d) / (A * (T1 - T2) * t)
 */
export function calculateSearleConductivity(
  waterMassKg: number,
  timeSec: number,
  rodDiameterMm: number,
  thermometerDistM: number,
  t1HotC: number,
  t2ColdC: number,
  t3WaterInC: number,
  t4WaterOutC: number
): { thermalConductivityK: number; rateOfHeatFlowWatts: number } {
  const rMeters = (rodDiameterMm * 1e-3) / 2;
  const areaM2 = Math.PI * rMeters * rMeters;
  const sWater = SPECIFIC_HEAT_TABLE.water;

  const heatAbsorbedQ = waterMassKg * sWater * (t4WaterOutC - t3WaterInC);
  const rateOfHeatFlowWatts = heatAbsorbedQ / timeSec;

  const deltaT_rod = Math.max(0.1, t1HotC - t2ColdC);
  const thermalConductivityK = (rateOfHeatFlowWatts * thermometerDistM) / (areaM2 * deltaT_rod);

  return {
    thermalConductivityK: Number(thermalConductivityK.toFixed(1)),
    rateOfHeatFlowWatts: Number(rateOfHeatFlowWatts.toFixed(2))
  };
}

/**
 * Newton's Law of Cooling:
 * T(t) = T_ambient + (T0 - T_ambient) * exp(-k * t)
 */
export function calculateNewtonCooling(
  initialTempC: number,
  ambientTempC: number,
  coolingConstantK = 0.003,
  timeSec = 300
): { currentTempC: number; rateOfCooling: number } {
  const tempDiff = initialTempC - ambientTempC;
  const currentTempC = ambientTempC + tempDiff * Math.exp(-coolingConstantK * timeSec);
  const rateOfCooling = -coolingConstantK * (currentTempC - ambientTempC);

  return {
    currentTempC: Number(currentTempC.toFixed(2)),
    rateOfCooling: Number(rateOfCooling.toFixed(4))
  };
}
