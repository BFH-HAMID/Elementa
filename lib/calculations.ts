export type CalculatorResult = {
  result: number;
  unit: string;
  formula: string;
  steps: string[];
};

const safe = (value: number | undefined, fallback = 0) => (value !== undefined && Number.isFinite(value) ? value : fallback);
const deg = (value: number) => value * Math.PI / 180;

export const unitOptions: Record<string, string[]> = {
  m: ['m', 'cm', 'km'],
  s: ['s', 'min', 'h'],
  kg: ['kg', 'g'],
  V: ['V', 'mV'],
  I: ['A', 'mA'],
  R: ['Ω', 'kΩ'],
  F: ['N', 'kN'],
  A_area: ['m²', 'cm²'],
  Pa: ['Pa', 'kPa'],
  K: ['K', '°C'],
  mol: ['mol', 'mmol'],
  L: ['L', 'mL', 'm³'],
  molarity: ['mol L⁻¹', 'mol m⁻³'],
  J: ['J', 'kJ'],
  W: ['W', 'kW'],
  Hz: ['Hz', 'kHz'],
  C: ['C', 'mC'],
  dimensionless: ['1']
};

export function convertToSI(value: number, unit: string): number {
  const multipliers: Record<string, number> = {
    cm: 0.01, km: 1000, min: 60, h: 3600, g: 0.001, mV: 0.001, mA: 0.001, 'kΩ': 1000,
    kN: 1000, 'cm²': 0.0001, kPa: 1000, mmol: 0.001, mL: 0.001, L: 0.001, 'mol m⁻³': 1,
    'mol L⁻¹': 1000, kJ: 1000, kW: 1000, kHz: 1000, mC: 0.001
  };
  if (unit === '°C') return value + 273.15;
  return value * (multipliers[unit] ?? 1);
}

export function convertFromSI(value: number, unit: string): number {
  if (unit === '°C') return value - 273.15;
  const multipliers: Record<string, number> = {
    cm: 0.01, km: 1000, min: 60, h: 3600, g: 0.001, mV: 0.001, mA: 0.001, 'kΩ': 1000,
    kN: 1000, 'cm²': 0.0001, kPa: 1000, mmol: 0.001, mL: 0.001, L: 0.001, 'mol m⁻³': 1,
    'mol L⁻¹': 1000, kJ: 1000, kW: 1000, kHz: 1000, mC: 0.001
  };
  return value / (multipliers[unit] ?? 1);
}

function clean(result: number, unit: string, formula: string, steps: string[]): CalculatorResult {
  return { result, unit, formula, steps };
}

export function solveEquation(slug: string, values: Record<string, number>, unknown: string): CalculatorResult | null {
  const v = (key: string) => values[key];
  switch (slug) {
    case 'speed': {
      const d = safe(v('d')); const t = safe(v('t')); const speed = unknown === 'v' ? d / t : unknown === 'd' ? safe(v('v')) * t : safe(v('d')) / safe(v('v'));
      return clean(speed, unknown === 'v' ? 'm/s' : unknown === 'd' ? 'm' : 's', 'v = d / t', [`v = ${d} / ${t}`, `${unknown} = ${speed.toFixed(4)}`]);
    }
    case 'density': {
      const m = safe(v('m')); const volume = safe(v('V')); const result = unknown === 'ρ' ? m / volume : unknown === 'm' ? safe(v('ρ')) * volume : safe(v('m')) / safe(v('ρ'));
      return clean(result, unknown === 'ρ' ? 'kg/m³' : unknown === 'm' ? 'kg' : 'm³', 'ρ = m / V', [`ρ = ${m} / ${volume}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'pressure': {
      const force = safe(v('F')); const area = safe(v('A')); const result = unknown === 'P' ? force / area : unknown === 'F' ? safe(v('P')) * area : force / safe(v('P'));
      return clean(result, unknown === 'P' ? 'Pa' : unknown === 'F' ? 'N' : 'm²', 'P = F / A', [`P = ${force} / ${area}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'newtons-second-law': {
      const mass = safe(v('m')); const acceleration = safe(v('a')); const result = unknown === 'F' ? mass * acceleration : unknown === 'm' ? safe(v('F')) / acceleration : safe(v('F')) / mass;
      return clean(result, unknown === 'F' ? 'N' : unknown === 'm' ? 'kg' : 'm/s²', 'F = ma', [`F = ${mass} × ${acceleration}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'ohms-law': {
      const current = safe(v('I')); const resistance = safe(v('R')); const voltage = safe(v('V')); const result = unknown === 'V' ? current * resistance : unknown === 'I' ? voltage / resistance : voltage / current;
      return clean(result, unknown === 'V' ? 'V' : unknown === 'I' ? 'A' : 'Ω', 'V = IR', [`${unknown === 'V' ? 'V' : unknown} = ${unknown === 'V' ? current : voltage} ${unknown === 'V' ? '×' : '/'} ${unknown === 'V' ? resistance : unknown === 'I' ? resistance : current}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'electrical-power': {
      const voltage = safe(v('V')); const current = safe(v('I')); const result = unknown === 'P' ? voltage * current : unknown === 'V' ? safe(v('P')) / current : safe(v('P')) / voltage;
      return clean(result, unknown === 'P' ? 'W' : 'V', 'P = VI', [`P = ${voltage} × ${current}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'work-done': {
      const force = safe(v('F')); const distance = safe(v('s')); const angle = safe(v('θ')); const result = unknown === 'W' ? force * distance * Math.cos(deg(angle)) : unknown === 'F' ? safe(v('W')) / (distance * Math.cos(deg(angle))) : safe(v('W')) / (force * Math.cos(deg(angle)));
      return clean(result, unknown === 'W' ? 'J' : unknown === 'F' ? 'N' : 'm', 'W = Fs cos θ', [`W = ${force} × ${distance} × cos(${angle}°)`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'wave-speed': {
      const frequency = safe(v('f')); const wavelength = safe(v('λ')); const result = unknown === 'v' ? frequency * wavelength : unknown === 'f' ? safe(v('v')) / wavelength : safe(v('v')) / frequency;
      return clean(result, unknown === 'v' ? 'm/s' : unknown === 'f' ? 'Hz' : 'm', 'v = fλ', [`v = ${frequency} × ${wavelength}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'projectile-range': {
      const speed = safe(v('u')); const angle = safe(v('θ')); const gravity = safe(v('g'), 9.80665); const result = unknown === 'R' ? speed ** 2 * Math.sin(2 * deg(angle)) / gravity : unknown === 'u' ? Math.sqrt(safe(v('R')) * gravity / Math.sin(2 * deg(angle))) : (180 / (2 * Math.PI)) * Math.asin(safe(v('R')) * gravity / speed ** 2);
      return clean(result, unknown === 'R' ? 'm' : unknown === 'u' ? 'm/s' : '°', 'R = u² sin(2θ) / g', [`R = ${speed}² × sin(2 × ${angle}°) / ${gravity}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'lens-formula': {
      const focal = safe(v('f')); const object = safe(v('u')); const result = unknown === 'v' ? (focal * object) / (object - focal) : unknown === 'f' ? (object * safe(v('v'))) / (object + safe(v('v'))) : (focal * safe(v('v'))) / (safe(v('v')) - focal);
      return clean(result, 'm', '1/f = 1/v + 1/u', [`1/${focal} = 1/${unknown === 'v' ? 'v' : 'u'} + 1/${object}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'ideal-gas-law': {
      const n = safe(v('n')); const temperature = safe(v('T'), 298.15); const volume = safe(v('V')); const pressure = safe(v('P')); const R = 8.314462618; const result = unknown === 'P' ? n * R * temperature / volume : unknown === 'V' ? n * R * temperature / pressure : unknown === 'T' ? pressure * volume / (n * R) : pressure * volume / (R * temperature);
      return clean(result, unknown === 'P' ? 'Pa' : unknown === 'V' ? 'm³' : unknown === 'T' ? 'K' : 'mol', 'PV = nRT', [`${unknown} = ${unknown === 'P' ? `${n} × ${R} × ${temperature} / ${volume}` : 'rearrange PV = nRT'}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'molarity': {
      const moles = safe(v('n')); const volume = safe(v('V')); const result = unknown === 'M' ? moles / volume : unknown === 'n' ? safe(v('M')) * volume : safe(v('n')) / safe(v('M'));
      return clean(result, unknown === 'M' ? 'mol/L' : unknown === 'n' ? 'mol' : 'L', 'M = n / V', [`M = ${moles} / ${volume}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'ph': {
      const concentration = safe(v('[H⁺]')); const result = unknown === 'pH' ? -Math.log10(concentration) : 10 ** (-safe(v('pH')));
      return clean(result, unknown === 'pH' ? 'pH' : 'mol/L', 'pH = −log₁₀[H⁺]', [`pH = −log₁₀(${concentration})`, `${unknown} = ${result.toFixed(4)}`]);
    }
    case 'nernst-equation': {
      const standard = safe(v('E°')); const temp = safe(v('T'), 298.15); const electrons = safe(v('n'), 1); const reactionQuotient = safe(v('Q'), 1); const result = standard - (8.314462618 * temp / (electrons * 96485.33212)) * Math.log(reactionQuotient);
      return clean(result, 'V', 'E = E° − (RT/nF) ln Q', [`E = ${standard} − (8.314 × ${temp} / (${electrons} × 96485)) ln(${reactionQuotient})`, `E = ${result.toFixed(4)} V`]);
    }
    case 'arrhenius-equation': {
      const A = safe(v('A')); const activation = safe(v('Ea')); const temperature = safe(v('T'), 298.15); const result = A * Math.exp(-activation / (8.314462618 * temperature));
      return clean(result, 's⁻¹', 'k = A e⁻ᴱᵃ/ᴿᵀ', [`k = ${A} × exp(−${activation} / (8.314 × ${temperature}))`, `k = ${result.toExponential(4)}`]);
    }
    case 'beer-lambert': {
      const epsilon = safe(v('ε')); const length = safe(v('l')); const concentration = safe(v('c')); const result = unknown === 'A' ? epsilon * length * concentration : unknown === 'c' ? safe(v('A')) / (epsilon * length) : safe(v('A')) / (epsilon * concentration);
      return clean(result, unknown === 'A' ? '1' : 'mol L⁻¹', 'A = εlc', [`A = ${epsilon} × ${length} × ${concentration}`, `${unknown} = ${result.toFixed(4)}`]);
    }
    default:
      return null;
  }
}
