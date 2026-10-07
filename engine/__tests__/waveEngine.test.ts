import { describe, expect, it } from 'vitest';
import {
  calculateResonanceTube,
  calculateSonometer,
  calculateAcousticBeats,
  generateOscilloscopeTrace
} from '../waveEngine';

describe('Wave & Sound Engine', () => {
  it('calculates resonance tube lengths and speed of sound at 22°C (v ≈ 344 m/s)', () => {
    // 512 Hz fork: λ = 344.4 / 512 ≈ 0.6726 m = 67.26 cm
    // l1 = λ/4 - 0.3*3 = 16.81 - 0.9 = 15.91 cm
    // l2 = 3λ/4 - 0.9 = 50.45 - 0.9 = 49.55 cm
    const result = calculateResonanceTube(512, 15.9, 3.0, 22.0);
    expect(result.firstResonanceLengthCm).toBeCloseTo(15.9, 1);
    expect(result.secondResonanceLengthCm).toBeCloseTo(49.5, 1);
    expect(result.speedOfSoundTheoryMps).toBeCloseTo(344.4, 1);
    expect(result.isResonating).toBe(true);
  });

  it('calculates sonometer vibrating wire frequency and detects resonance', () => {
    // Wire length 35 cm, mass 2.5 kg
    const result = calculateSonometer(35, 2.5, 256);
    expect(result.frequencyHz).toBeGreaterThan(100);
    expect(result.tensionN).toBeCloseTo(24.52, 1);
  });

  it('calculates acoustic beat frequency: 440 Hz & 444 Hz -> 4 Hz beat', () => {
    const beats = calculateAcousticBeats(440, 444);
    expect(beats.beatFrequencyHz).toBe(4);
    expect(beats.carrierFrequencyHz).toBe(442);
    expect(beats.waveformPoints.length).toBeGreaterThan(50);
  });

  it('generates oscilloscope trace points in time and Lissajous mode', () => {
    const timeTrace = generateOscilloscopeTrace(1000, 5, 1000, 5, 0, false);
    expect(timeTrace.length).toBeGreaterThan(50);

    const lissajous = generateOscilloscopeTrace(1000, 5, 1000, 5, 90, true);
    expect(lissajous.length).toBeGreaterThan(50);
  });
});
