export interface ResonanceTubeResult {
  firstResonanceLengthCm: number;
  secondResonanceLengthCm: number;
  endCorrectionCm: number;
  speedOfSoundMps: number;
  speedOfSoundTheoryMps: number;
  isResonating: boolean;
  resonanceIntensity: number; // 0 to 100%
}

export interface SonometerResult {
  frequencyHz: number;
  tensionN: number;
  linearMassDensityKgM: number;
  isResonating: boolean;
  paperRiderFell: boolean;
}

export interface BeatWaveformResult {
  beatFrequencyHz: number;
  carrierFrequencyHz: number;
  waveformPoints: { tMs: number; amplitude: number; envelope: number }[];
}

export interface OscilloscopeTracePoint {
  x: number;
  y: number;
}

/**
 * Calculates Speed of Sound by Resonance Tube:
 * v = 2 * f * (l2 - l1)
 * End correction e = (l2 - 3*l1) / 2 ≈ 0.3 * d
 */
export function calculateResonanceTube(
  frequencyHz: number,
  currentWaterLevelCm: number,
  tubeDiameterCm = 3.0,
  temperatureCelsius = 22.0
): ResonanceTubeResult {
  // Speed of sound in air at temperature T: v = 331.3 * sqrt(1 + T/273.15)
  const speedOfSoundTheoryMps = 331.3 * Math.sqrt(1 + temperatureCelsius / 273.15);
  const endCorrectionCm = 0.3 * tubeDiameterCm;

  const wavelengthCm = (speedOfSoundTheoryMps / frequencyHz) * 100;
  const firstResonanceLengthCm = Number((wavelengthCm / 4 - endCorrectionCm).toFixed(2));
  const secondResonanceLengthCm = Number(((3 * wavelengthCm) / 4 - endCorrectionCm).toFixed(2));

  // Determine resonance proximity
  const dist1 = Math.abs(currentWaterLevelCm - firstResonanceLengthCm);
  const dist2 = Math.abs(currentWaterLevelCm - secondResonanceLengthCm);
  const minDist = Math.min(dist1, dist2);

  // Lorentzian resonance peak
  const resonanceIntensity = Number((100 / (1 + Math.pow(minDist / 0.8, 2))).toFixed(1));
  const isResonating = resonanceIntensity > 60;

  const speedOfSoundMps = 2 * frequencyHz * ((secondResonanceLengthCm - firstResonanceLengthCm) / 100);

  return {
    firstResonanceLengthCm,
    secondResonanceLengthCm,
    endCorrectionCm: Number(endCorrectionCm.toFixed(2)),
    speedOfSoundMps: Number(speedOfSoundMps.toFixed(2)),
    speedOfSoundTheoryMps: Number(speedOfSoundTheoryMps.toFixed(2)),
    isResonating,
    resonanceIntensity
  };
}

/**
 * Calculates Sonometer frequency and resonance:
 * f = (1 / 2L) * sqrt(T / m)
 * where T = suspendedMassKg * 9.80665, m = pi * r^2 * rho (for steel wire rho ≈ 7800 kg/m^3, r ≈ 0.25 mm)
 */
export function calculateSonometer(
  wireLengthCm: number,
  suspendedMassKg: number,
  tuningForkFreqHz: number,
  wireRadiusMm = 0.25,
  wireDensityKgM3 = 7800
): SonometerResult {
  const L = wireLengthCm / 100; // meters
  const tensionN = suspendedMassKg * 9.80665;
  const rMeters = wireRadiusMm * 1e-3;
  const areaM2 = Math.PI * rMeters * rMeters;
  const linearMassDensityKgM = areaM2 * wireDensityKgM3;

  const frequencyHz = (1 / (2 * L)) * Math.sqrt(tensionN / linearMassDensityKgM);
  const freqDiff = Math.abs(frequencyHz - tuningForkFreqHz);
  const isResonating = freqDiff < 3.0;
  const paperRiderFell = freqDiff < 1.5;

  return {
    frequencyHz: Number(frequencyHz.toFixed(1)),
    tensionN: Number(tensionN.toFixed(2)),
    linearMassDensityKgM: Number(linearMassDensityKgM.toFixed(6)),
    isResonating,
    paperRiderFell
  };
}

/**
 * Beat frequency and modulated waveform calculation:
 * y(t) = 2 * A * cos(2pi * (f1 - f2)/2 * t) * sin(2pi * (f1 + f2)/2 * t)
 */
export function calculateAcousticBeats(
  freq1Hz: number,
  freq2Hz: number,
  durationMs = 50,
  pointsCount = 200
): BeatWaveformResult {
  const beatFrequencyHz = Math.abs(freq1Hz - freq2Hz);
  const carrierFrequencyHz = (freq1Hz + freq2Hz) / 2;

  const waveformPoints: { tMs: number; amplitude: number; envelope: number }[] = [];
  const dt = durationMs / pointsCount;

  for (let i = 0; i < pointsCount; i++) {
    const tMs = i * dt;
    const tSec = tMs / 1000;

    const envelope = Math.abs(Math.cos(Math.PI * beatFrequencyHz * tSec));
    const wave = Math.sin(2 * Math.PI * carrierFrequencyHz * tSec);
    const amplitude = envelope * wave;

    waveformPoints.push({
      tMs: Number(tMs.toFixed(2)),
      amplitude: Number(amplitude.toFixed(3)),
      envelope: Number(envelope.toFixed(3))
    });
  }

  return {
    beatFrequencyHz: Number(beatFrequencyHz.toFixed(2)),
    carrierFrequencyHz: Number(carrierFrequencyHz.toFixed(2)),
    waveformPoints
  };
}

/**
 * Oscilloscope Trace & Lissajous pattern points generation.
 */
export function generateOscilloscopeTrace(
  ch1FreqHz: number,
  ch1AmpVolts: number,
  ch2FreqHz: number,
  ch2AmpVolts: number,
  ch2PhaseDeg = 0,
  isLissajous = false,
  timeBaseMs = 1.0,
  voltsPerDiv = 1.0,
  pointsCount = 120
): OscilloscopeTracePoint[] {
  const points: OscilloscopeTracePoint[] = [];
  const phaseRad = (ch2PhaseDeg * Math.PI) / 180;

  if (isLissajous) {
    // X-Y Mode: X = CH2, Y = CH1
    const period = 1 / Math.min(ch1FreqHz, ch2FreqHz);
    for (let i = 0; i < pointsCount; i++) {
      const t = (i / pointsCount) * period;
      const xVal = ch2AmpVolts * Math.sin(2 * Math.PI * ch2FreqHz * t + phaseRad);
      const yVal = ch1AmpVolts * Math.sin(2 * Math.PI * ch1FreqHz * t);
      points.push({
        x: Number((xVal / voltsPerDiv).toFixed(3)),
        y: Number((yVal / voltsPerDiv).toFixed(3))
      });
    }
  } else {
    // Time mode: Y vs Time
    const totalTimeSec = (timeBaseMs * 10 * 1e-3);
    for (let i = 0; i < pointsCount; i++) {
      const t = (i / pointsCount) * totalTimeSec;
      const yVal = ch1AmpVolts * Math.sin(2 * Math.PI * ch1FreqHz * t);
      points.push({
        x: Number(((i / pointsCount) * 10 - 5).toFixed(3)), // grid units -5 to +5
        y: Number((yVal / voltsPerDiv).toFixed(3))
      });
    }
  }

  return points;
}
