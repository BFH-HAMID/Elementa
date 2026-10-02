/**
 * Declarative calculator models for equation entries.
 *
 * Each model maps a slug to the algebra needed to solve for *any* of its
 * variables. `solve` receives every known variable (already converted to SI)
 * and returns a value for every variable, so the caller just picks the
 * requested unknown. Keeping all rearrangements in one function makes the set
 * of equivalent forms easy to review side by side.
 *
 * Conventions:
 *  - Every symbol in the MDX `variables:` list must appear in `unit`.
 *  - `unit` values are the labels shown next to the computed result.
 *  - Angles are entered in degrees (frontmatter unit `°`); convert with `deg`
 *    and report back with `toDeg`.
 *  - Chemistry molar concentrations are entered and reported in mol L⁻¹,
 *    matching the way `molarity`, `ph` and `beer-lambert` already behave.
 */
/** One selectable unit for a variable, with the factor that maps it to the declared unit. */
export type UnitChoice = { label: string; factor: number; offset?: number };

/**
 * Alternative units offered for a declared unit, keyed by the declared unit
 * string. `factor` converts a value *from* that choice *into* the declared
 * unit, so `solve` can always work in the units it declares. Anything not
 * listed here gets exactly one choice — the declared unit itself — which keeps
 * exotic units such as `N m²/kg²` or `W/(m² K⁴)` free of accidental
 * conversions.
 */
export const unitChoices: Record<string, UnitChoice[]> = {
  m: [
    { label: 'm', factor: 1 },
    { label: 'cm', factor: 0.01 },
    { label: 'mm', factor: 0.001 },
    { label: 'km', factor: 1000 }
  ],
  'm²': [
    { label: 'm²', factor: 1 },
    { label: 'cm²', factor: 1e-4 },
    { label: 'mm²', factor: 1e-6 }
  ],
  'm³': [
    { label: 'm³', factor: 1 },
    { label: 'L', factor: 0.001 },
    { label: 'mL', factor: 1e-6 },
    { label: 'cm³', factor: 1e-6 }
  ],
  L: [
    { label: 'L', factor: 1 },
    { label: 'mL', factor: 0.001 }
  ],
  'm/s': [
    { label: 'm/s', factor: 1 },
    { label: 'cm/s', factor: 0.01 },
    { label: 'km/h', factor: 1 / 3.6 },
    { label: 'km/s', factor: 1000 }
  ],
  'm/s²': [{ label: 'm/s²', factor: 1 }],
  s: [
    { label: 's', factor: 1 },
    { label: 'ms', factor: 0.001 },
    { label: 'min', factor: 60 },
    { label: 'h', factor: 3600 }
  ],
  kg: [
    { label: 'kg', factor: 1 },
    { label: 'g', factor: 0.001 },
    { label: 'mg', factor: 1e-6 }
  ],
  g: [
    { label: 'g', factor: 1 },
    { label: 'kg', factor: 1000 },
    { label: 'mg', factor: 0.001 }
  ],
  K: [
    { label: 'K', factor: 1 },
    { label: '°C', factor: 1, offset: 273.15 }
  ],
  J: [
    { label: 'J', factor: 1 },
    { label: 'kJ', factor: 1000 },
    { label: 'eV', factor: 1.602176634e-19 }
  ],
  'J/mol': [
    { label: 'J/mol', factor: 1 },
    { label: 'kJ/mol', factor: 1000 }
  ],
  Pa: [
    { label: 'Pa', factor: 1 },
    { label: 'kPa', factor: 1000 },
    { label: 'atm', factor: 101325 },
    { label: 'bar', factor: 1e5 }
  ],
  N: [
    { label: 'N', factor: 1 },
    { label: 'kN', factor: 1000 }
  ],
  W: [
    { label: 'W', factor: 1 },
    { label: 'kW', factor: 1000 },
    { label: 'mW', factor: 0.001 }
  ],
  Hz: [
    { label: 'Hz', factor: 1 },
    { label: 'kHz', factor: 1000 },
    { label: 'MHz', factor: 1e6 }
  ],
  C: [
    { label: 'C', factor: 1 },
    { label: 'mC', factor: 0.001 },
    { label: 'µC', factor: 1e-6 }
  ],
  V: [
    { label: 'V', factor: 1 },
    { label: 'mV', factor: 0.001 }
  ],
  A: [
    { label: 'A', factor: 1 },
    { label: 'mA', factor: 0.001 }
  ],
  'Ω': [
    { label: 'Ω', factor: 1 },
    { label: 'kΩ', factor: 1000 }
  ],
  T: [
    { label: 'T', factor: 1 },
    { label: 'mT', factor: 0.001 }
  ],
  mol: [
    { label: 'mol', factor: 1 },
    { label: 'mmol', factor: 0.001 }
  ],
  'kg/m³': [
    { label: 'kg/m³', factor: 1 },
    { label: 'g/cm³', factor: 1000 }
  ],
  '°': [{ label: '°', factor: 1 }]
};

/**
 * Selectable units for a variable. Temperature *differences* (ΔT) must not be
 * offered the °C offset, since a rise of 1 °C is a rise of 1 K.
 */
export function unitChoicesFor(unit: string, symbol: string): UnitChoice[] {
  if (unit === 'K' && symbol.startsWith('Δ')) return [{ label: 'K', factor: 1 }];
  return unitChoices[unit] ?? [{ label: unit, factor: 1 }];
}

/** True when an entry has a declarative calculator model. */
export function hasCalculatorModel(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(calculatorModels, slug);
}

export type CalculatorModel = {
  /** Formula shown in the "step-by-step working" panel. */
  formula: string;
  /** Display unit for each variable symbol, keyed by symbol. */
  unit: Record<string, string>;
  /** Returns a value for every symbol, in SI. */
  solve: (v: Record<string, number>) => Record<string, number>;
  /** Optional richer worked steps; a generic two-line fallback is used otherwise. */
  steps?: (v: Record<string, number>, out: Record<string, number>, unknown: string) => string[];
};

/** Degrees → radians, for variables whose frontmatter unit is `°`. */
const deg = (value: number) => (value * Math.PI) / 180;
/** Radians → degrees, for results that should be reported in degrees. */
const toDeg = (value: number) => (value * 180) / Math.PI;

/** Planck constant, used by the atomic-physics models. */
const H_PLANCK = 6.62607015e-34;
/** Units for the two Heisenberg pairs, shared by `unit` and its `steps`. */
const HEISENBERG_UNITS: Record<string, string> = {
  'Δx': 'm', 'Δp_x': 'kg m/s', 'ħ': 'J s', 'ΔE': 'J', 'Δt': 's'
};

/** Reduced Planck constant ħ = h / 2π. */
const H_BAR = H_PLANCK / (2 * Math.PI);
/** Elementary charge, used for hydrogen energy levels. */
const E_CHARGE = 1.602176634e-19;

/**
 * Bisection helper for rearrangements with no closed form. Used only where the
 * underlying function is monotonic over the searched interval; the direction is
 * inferred from the endpoints so both rising and falling functions work.
 */
function bisect(fn: (x: number) => number, target: number, low: number, high: number): number {
  let lo = low;
  let hi = high;
  const increasing = fn(lo) < fn(hi);
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (increasing ? fn(mid) < target : fn(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const calculatorModels: Record<string, CalculatorModel> = {
  /* ---------------------------------------------------------------- 6–8 */
  'weight-gravity': {
    formula: 'W = mg',
    unit: { W: 'N', m: 'kg', g: 'm/s²' },
    solve: (v) => ({ W: v.m * v.g, m: v.W / v.g, g: v.W / v.m })
  },
  'moment-of-force': {
    formula: 'τ = F d⊥',
    unit: { 'τ': 'N m', F: 'N', 'd_⊥': 'm' },
    solve: (v) => ({ 'τ': v.F * v['d_⊥'], F: v['τ'] / v['d_⊥'], 'd_⊥': v['τ'] / v.F })
  },
  'liquid-column-pressure': {
    formula: 'P = hρg',
    unit: { P: 'Pa', h: 'm', 'ρ': 'kg/m³', g: 'm/s²' },
    solve: (v) => ({
      P: v.h * v['ρ'] * v.g,
      h: v.P / (v['ρ'] * v.g),
      'ρ': v.P / (v.h * v.g),
      g: v.P / (v.h * v['ρ'])
    })
  },
  'echo-minimum-distance': {
    formula: 'd = vt / 2',
    unit: { d: 'm', v: 'm/s', t: 's' },
    solve: (v) => ({ d: (v.v * v.t) / 2, v: (2 * v.d) / v.t, t: (2 * v.d) / v.v })
  },
  'electric-charge-current': {
    formula: 'Q = It',
    unit: { Q: 'C', I: 'A', t: 's' },
    solve: (v) => ({ Q: v.I * v.t, I: v.Q / v.t, t: v.Q / v.I })
  },
  'surface-tension-force': {
    formula: 'F = 2TL',
    unit: { F: 'N', T: 'N/m', L: 'm' },
    solve: (v) => ({ F: 2 * v.T * v.L, T: v.F / (2 * v.L), L: v.F / (2 * v.T) })
  },

  /* -------------------------------------------------------------- 9–10 */
  'first-equation-of-motion': {
    formula: 'v = u + at',
    unit: { v: 'm/s', u: 'm/s', a: 'm/s²', t: 's' },
    solve: (v) => ({
      v: v.u + v.a * v.t,
      u: v.v - v.a * v.t,
      a: (v.v - v.u) / v.t,
      t: (v.v - v.u) / v.a
    })
  },
  'second-equation-of-motion': {
    formula: 's = ut + ½at²',
    unit: { s: 'm', u: 'm/s', a: 'm/s²', t: 's' },
    solve: (v) => ({
      s: v.u * v.t + 0.5 * v.a * v.t ** 2,
      u: (v.s - 0.5 * v.a * v.t ** 2) / v.t,
      a: (2 * (v.s - v.u * v.t)) / v.t ** 2,
      // positive root of ½at² + ut − s = 0
      t: v.a === 0 ? v.s / v.u : (-v.u + Math.sqrt(v.u ** 2 + 2 * v.a * v.s)) / v.a
    })
  },
  'third-equation-of-motion': {
    formula: 'v² = u² + 2as',
    unit: { v: 'm/s', u: 'm/s', a: 'm/s²', s: 'm' },
    solve: (v) => ({
      v: Math.sqrt(Math.max(0, v.u ** 2 + 2 * v.a * v.s)),
      u: Math.sqrt(Math.max(0, v.v ** 2 - 2 * v.a * v.s)),
      a: (v.v ** 2 - v.u ** 2) / (2 * v.s),
      s: (v.v ** 2 - v.u ** 2) / (2 * v.a)
    })
  },
  'nth-second-displacement': {
    formula: 'sₙ = u + ½a(2n − 1)',
    unit: { s_n: 'm', u: 'm/s', a: 'm/s²', n: 's' },
    solve: (v) => ({
      s_n: v.u + 0.5 * v.a * (2 * v.n - 1),
      u: v.s_n - 0.5 * v.a * (2 * v.n - 1),
      a: (2 * (v.s_n - v.u)) / (2 * v.n - 1),
      n: ((2 * (v.s_n - v.u)) / v.a + 1) / 2
    })
  },
  'linear-momentum': {
    formula: 'p = mv',
    unit: { p: 'kg m/s', m: 'kg', v: 'm/s' },
    solve: (v) => ({ p: v.m * v.v, m: v.p / v.v, v: v.p / v.m })
  },
  'rocket-recoil-velocity': {
    formula: 'V = −mv / M',
    unit: { V: 'm/s', M: 'kg', m: 'kg', v: 'm/s' },
    solve: (v) => ({
      V: -(v.m * v.v) / v.M,
      M: -(v.m * v.v) / v.V,
      m: -(v.V * v.M) / v.v,
      v: -(v.V * v.M) / v.m
    })
  },
  'gravitational-potential-energy': {
    formula: 'Eₚ = mgh',
    unit: { E_p: 'J', m: 'kg', g: 'm/s²', h: 'm' },
    solve: (v) => ({
      E_p: v.m * v.g * v.h,
      m: v.E_p / (v.g * v.h),
      g: v.E_p / (v.m * v.h),
      h: v.E_p / (v.m * v.g)
    })
  },
  'hookes-law-spring': {
    formula: 'Fₛ = −kx',
    unit: { F_s: 'N', k: 'N/m', x: 'm' },
    solve: (v) => ({ F_s: -v.k * v.x, k: -v.F_s / v.x, x: -v.F_s / v.k })
  },
  'pascal-hydraulic-lift': {
    formula: 'F₁/A₁ = F₂/A₂',
    unit: { F_1: 'N', A_1: 'm²', F_2: 'N', A_2: 'm²' },
    solve: (v) => ({
      F_1: (v.F_2 * v.A_1) / v.A_2,
      A_1: (v.F_1 * v.A_2) / v.F_2,
      F_2: (v.F_1 * v.A_2) / v.A_1,
      A_2: (v.F_2 * v.A_1) / v.F_1
    })
  },
  'archimedes-buoyant-force': {
    formula: 'F_b = Vρg',
    unit: { F_b: 'N', V: 'm³', 'ρ': 'kg/m³', g: 'm/s²' },
    solve: (v) => ({
      F_b: v.V * v['ρ'] * v.g,
      V: v.F_b / (v['ρ'] * v.g),
      'ρ': v.F_b / (v.V * v.g),
      g: v.F_b / (v.V * v['ρ'])
    })
  },
  'linear-thermal-expansion': {
    formula: 'ΔL = α L₀ ΔT',
    unit: { 'ΔL': 'm', L_0: 'm', 'α': 'K⁻¹', 'ΔT': 'K' },
    solve: (v) => ({
      'ΔL': v['α'] * v.L_0 * v['ΔT'],
      L_0: v['ΔL'] / (v['α'] * v['ΔT']),
      'α': v['ΔL'] / (v.L_0 * v['ΔT']),
      'ΔT': v['ΔL'] / (v['α'] * v.L_0)
    })
  },
  'thermal-expansion-coefficients': {
    formula: '6α = 3β = 2γ',
    unit: { 'α': 'K⁻¹', 'β': 'K⁻¹', 'γ': 'K⁻¹' },
    solve: (v) => ({ 'α': v['β'] / 2, 'β': 2 * v['α'], 'γ': 3 * v['α'] })
  },
  'calorimetry-heat-equation': {
    formula: 'Q = mcΔT',
    unit: { Q: 'J', m: 'kg', c: 'J/(kg K)', 'ΔT': 'K' },
    solve: (v) => ({
      Q: v.m * v.c * v['ΔT'],
      m: v.Q / (v.c * v['ΔT']),
      c: v.Q / (v.m * v['ΔT']),
      'ΔT': v.Q / (v.m * v.c)
    })
  },
  'lens-power-equation': {
    formula: 'P = 1 / f',
    unit: { P: 'D', f: 'm' },
    solve: (v) => ({ P: 1 / v.f, f: 1 / v.P })
  },
  'resistivity-formula': {
    formula: 'R = ρL / A',
    unit: { R: 'Ω', 'ρ': 'Ω m', L: 'm', A: 'm²' },
    solve: (v) => ({
      R: (v['ρ'] * v.L) / v.A,
      'ρ': (v.R * v.A) / v.L,
      L: (v.R * v.A) / v['ρ'],
      A: (v['ρ'] * v.L) / v.R
    })
  },

  /* ------------------------------------------------------------- 11–12 */
  'banking-angle-road': {
    formula: 'tan θ = v² / rg',
    unit: { 'θ': '°', v: 'm/s', r: 'm', g: 'm/s²' },
    solve: (v) => ({
      'θ': toDeg(Math.atan(v.v ** 2 / (v.r * v.g))),
      v: Math.sqrt(Math.tan(deg(v['θ'])) * v.r * v.g),
      r: v.v ** 2 / (Math.tan(deg(v['θ'])) * v.g),
      g: v.v ** 2 / (Math.tan(deg(v['θ'])) * v.r)
    })
  },
  'torque-angular-acceleration': {
    formula: 'τ = Iα',
    unit: { 'τ': 'N m', I: 'kg m²', 'α': 'rad/s²' },
    solve: (v) => ({ 'τ': v.I * v['α'], I: v['τ'] / v['α'], 'α': v['τ'] / v.I })
  },
  'moment-of-inertia-point-mass': {
    formula: 'I = mr²',
    unit: { I: 'kg m²', m: 'kg', r: 'm' },
    solve: (v) => ({ I: v.m * v.r ** 2, m: v.I / v.r ** 2, r: Math.sqrt(v.I / v.m) })
  },
  'parallel-axis-theorem': {
    formula: 'I = I_cm + Md²',
    unit: { I: 'kg m²', I_cm: 'kg m²', M: 'kg', d: 'm' },
    solve: (v) => ({
      I: v.I_cm + v.M * v.d ** 2,
      I_cm: v.I - v.M * v.d ** 2,
      M: (v.I - v.I_cm) / v.d ** 2,
      d: Math.sqrt((v.I - v.I_cm) / v.M)
    })
  },
  'angular-momentum-conservation': {
    formula: 'L = Iω',
    unit: { L: 'kg m²/s', I: 'kg m²', 'ω': 'rad/s' },
    solve: (v) => ({ L: v.I * v['ω'], I: v.L / v['ω'], 'ω': v.L / v.I })
  },
  'newtons-law-of-gravitation': {
    formula: 'F = G m₁m₂ / r²',
    unit: { F: 'N', G: 'N m²/kg²', m_1: 'kg', m_2: 'kg', r: 'm' },
    solve: (v) => ({
      F: (v.G * v.m_1 * v.m_2) / v.r ** 2,
      G: (v.F * v.r ** 2) / (v.m_1 * v.m_2),
      m_1: (v.F * v.r ** 2) / (v.G * v.m_2),
      m_2: (v.F * v.r ** 2) / (v.G * v.m_1),
      r: Math.sqrt((v.G * v.m_1 * v.m_2) / v.F)
    })
  },
  'gravitational-field-strength': {
    formula: 'g = GM / r²',
    unit: { g: 'N/kg', G: 'N m²/kg²', M: 'kg', r: 'm' },
    solve: (v) => ({
      g: (v.G * v.M) / v.r ** 2,
      G: (v.g * v.r ** 2) / v.M,
      M: (v.g * v.r ** 2) / v.G,
      r: Math.sqrt((v.G * v.M) / v.g)
    })
  },
  'gravitational-potential-energy-general': {
    formula: 'U = −GMm / r',
    unit: { U: 'J', G: 'N m²/kg²', M: 'kg', m: 'kg', r: 'm' },
    solve: (v) => ({
      U: -(v.G * v.M * v.m) / v.r,
      G: -(v.U * v.r) / (v.M * v.m),
      M: -(v.U * v.r) / (v.G * v.m),
      m: -(v.U * v.r) / (v.G * v.M),
      r: -(v.G * v.M * v.m) / v.U
    })
  },
  'keplers-third-law': {
    formula: 'T² = 4π²r³ / GM',
    unit: { T: 's', r: 'm', G: 'N m²/kg²', M: 'kg' },
    solve: (v) => ({
      T: 2 * Math.PI * Math.sqrt(v.r ** 3 / (v.G * v.M)),
      r: Math.cbrt((v.T ** 2 * v.G * v.M) / (4 * Math.PI ** 2)),
      G: (4 * Math.PI ** 2 * v.r ** 3) / (v.T ** 2 * v.M),
      M: (4 * Math.PI ** 2 * v.r ** 3) / (v.G * v.T ** 2)
    })
  },
  'youngs-modulus-equation': {
    formula: 'Y = FL / AΔL',
    unit: { Y: 'Pa', F: 'N', A: 'm²', 'ΔL': 'm', L: 'm' },
    solve: (v) => ({
      Y: (v.F * v.L) / (v.A * v['ΔL']),
      F: (v.Y * v.A * v['ΔL']) / v.L,
      A: (v.F * v.L) / (v.Y * v['ΔL']),
      'ΔL': (v.F * v.L) / (v.Y * v.A),
      L: (v.Y * v.A * v['ΔL']) / v.F
    })
  },
  'bulk-modulus': {
    formula: 'K = −ΔP / (ΔV / V)',
    unit: { K: 'Pa', 'ΔP': 'Pa', 'ΔV': 'm³', V: 'm³' },
    solve: (v) => ({
      K: -(v['ΔP'] * v.V) / v['ΔV'],
      'ΔP': -(v.K * v['ΔV']) / v.V,
      'ΔV': -(v['ΔP'] * v.V) / v.K,
      V: -(v.K * v['ΔV']) / v['ΔP']
    })
  },
  'newtons-law-of-viscosity': {
    formula: 'F = ηA (dv/dx)',
    unit: { F: 'N', 'η': 'Pa s', A: 'm²', 'dv/dx': 's⁻¹' },
    solve: (v) => ({
      F: v['η'] * v.A * v['dv/dx'],
      'η': v.F / (v.A * v['dv/dx']),
      A: v.F / (v['η'] * v['dv/dx']),
      'dv/dx': v.F / (v['η'] * v.A)
    })
  },
  'kinetic-viscosity': {
    formula: 'ν = η / ρ',
    unit: { 'ν': 'm²/s', 'η': 'Pa s', 'ρ': 'kg/m³' },
    solve: (v) => ({
      'ν': v['η'] / v['ρ'],
      'η': v['ν'] * v['ρ'],
      'ρ': v['η'] / v['ν']
    })
  },
  'poiseuilles-equation': {
    formula: 'Q = πR⁴ΔP / 8ηL',
    unit: { Q: 'm³/s', R: 'm', 'ΔP': 'Pa', 'η': 'Pa s', L: 'm' },
    solve: (v) => ({
      Q: (Math.PI * v.R ** 4 * v['ΔP']) / (8 * v['η'] * v.L),
      R: ((8 * v.Q * v['η'] * v.L) / (Math.PI * v['ΔP'])) ** 0.25,
      'ΔP': (8 * v.Q * v['η'] * v.L) / (Math.PI * v.R ** 4),
      'η': (Math.PI * v.R ** 4 * v['ΔP']) / (8 * v.Q * v.L),
      L: (Math.PI * v.R ** 4 * v['ΔP']) / (8 * v['η'] * v.Q)
    })
  },
  'equation-of-continuity': {
    formula: 'A₁v₁ = A₂v₂',
    unit: { A_1: 'm²', v_1: 'm/s', A_2: 'm²', v_2: 'm/s' },
    solve: (v) => ({
      A_1: (v.A_2 * v.v_2) / v.v_1,
      v_1: (v.A_2 * v.v_2) / v.A_1,
      A_2: (v.A_1 * v.v_1) / v.v_2,
      v_2: (v.A_1 * v.v_1) / v.A_2
    })
  },
  'torricelli-theorem': {
    formula: 'v = √(2gh)',
    unit: { v: 'm/s', g: 'm/s²', h: 'm' },
    solve: (v) => ({
      v: Math.sqrt(2 * v.g * v.h),
      g: v.v ** 2 / (2 * v.h),
      h: v.v ** 2 / (2 * v.g)
    })
  },
  'venturi-flow-meter': {
    formula: 'Q = A₁A₂ √(2ΔP / ρ(A₁² − A₂²))',
    unit: { Q: 'm³/s', A_1: 'm²', A_2: 'm²', 'ΔP': 'Pa', 'ρ': 'kg/m³' },
    solve: (v) => ({
      Q: v.A_1 * v.A_2 * Math.sqrt((2 * v['ΔP']) / (v['ρ'] * (v.A_1 ** 2 - v.A_2 ** 2))),
      A_1: Math.sqrt((v['ρ'] * v.Q ** 2 * v.A_2 ** 2) / (v['ρ'] * v.Q ** 2 - 2 * v['ΔP'] * v.A_2 ** 2)),
      A_2: Math.sqrt((v['ρ'] * v.Q ** 2 * v.A_1 ** 2) / (v['ρ'] * v.Q ** 2 + 2 * v['ΔP'] * v.A_1 ** 2)),
      'ΔP': (v['ρ'] * v.Q ** 2 * (v.A_1 ** 2 - v.A_2 ** 2)) / (2 * v.A_1 ** 2 * v.A_2 ** 2),
      'ρ': (2 * v['ΔP'] * v.A_1 ** 2 * v.A_2 ** 2) / (v.Q ** 2 * (v.A_1 ** 2 - v.A_2 ** 2))
    })
  },
  'reynolds-number': {
    formula: 'Re = ρvD / η',
    unit: { Re: '1', 'ρ': 'kg/m³', v: 'm/s', D: 'm', 'η': 'Pa s' },
    solve: (v) => ({
      Re: (v['ρ'] * v.v * v.D) / v['η'],
      'ρ': (v.Re * v['η']) / (v.v * v.D),
      v: (v.Re * v['η']) / (v['ρ'] * v.D),
      D: (v.Re * v['η']) / (v['ρ'] * v.v),
      'η': (v['ρ'] * v.v * v.D) / v.Re
    })
  },
  'first-law-thermodynamics': {
    formula: 'ΔU = Q − W',
    unit: { 'ΔU': 'J', Q: 'J', W: 'J' },
    solve: (v) => ({ 'ΔU': v.Q - v.W, Q: v['ΔU'] + v.W, W: v.Q - v['ΔU'] })
  },
  'isothermal-work': {
    formula: 'W = nRT ln(V₂/V₁)',
    unit: { W: 'J', n: 'mol', R: 'J/(mol K)', T: 'K', V_1: 'm³', V_2: 'm³' },
    solve: (v) => ({
      W: v.n * v.R * v.T * Math.log(v.V_2 / v.V_1),
      n: v.W / (v.R * v.T * Math.log(v.V_2 / v.V_1)),
      R: v.W / (v.n * v.T * Math.log(v.V_2 / v.V_1)),
      T: v.W / (v.n * v.R * Math.log(v.V_2 / v.V_1)),
      V_1: v.V_2 / Math.exp(v.W / (v.n * v.R * v.T)),
      V_2: v.V_1 * Math.exp(v.W / (v.n * v.R * v.T))
    })
  },
  'heat-engine-efficiency': {
    formula: 'η = W / Q_H = 1 − Q_C / Q_H',
    unit: { 'η': '1', W: 'J', Q_H: 'J', Q_C: 'J' },
    solve: (v) => ({
      'η': v.W / v.Q_H,
      W: v.Q_H - v.Q_C,
      Q_H: v.W / v['η'],
      Q_C: v.Q_H * (1 - v['η'])
    })
  },
  'carnot-engine-efficiency': {
    formula: 'η = 1 − T_C / T_H',
    unit: { 'η_Carnot': '1', T_C: 'K', T_H: 'K' },
    solve: (v) => ({
      'η_Carnot': 1 - v.T_C / v.T_H,
      T_C: v.T_H * (1 - v['η_Carnot']),
      T_H: v.T_C / (1 - v['η_Carnot'])
    })
  },
  'stefan-boltzmann-law': {
    formula: 'P = σAeT⁴',
    unit: { P: 'W', 'σ': 'W/(m² K⁴)', A: 'm²', e: '1', T: 'K' },
    solve: (v) => ({
      P: v['σ'] * v.A * v.e * v.T ** 4,
      'σ': v.P / (v.A * v.e * v.T ** 4),
      A: v.P / (v['σ'] * v.e * v.T ** 4),
      e: v.P / (v['σ'] * v.A * v.T ** 4),
      T: (v.P / (v['σ'] * v.A * v.e)) ** 0.25
    })
  },
  'wien-displacement-law': {
    formula: 'λ_max T = b',
    unit: { 'λ_max': 'm', T: 'K', b: 'm K' },
    solve: (v) => ({ 'λ_max': v.b / v.T, T: v.b / v['λ_max'], b: v['λ_max'] * v.T })
  },
  'thermal-conductivity-equation': {
    formula: 'Q/t = kA(T_H − T_C) / L',
    unit: { 'Q/t': 'W', k: 'W/(m K)', A: 'm²', T_H: 'K', T_C: 'K', L: 'm' },
    solve: (v) => ({
      'Q/t': (v.k * v.A * (v.T_H - v.T_C)) / v.L,
      k: (v['Q/t'] * v.L) / (v.A * (v.T_H - v.T_C)),
      A: (v['Q/t'] * v.L) / (v.k * (v.T_H - v.T_C)),
      T_H: (v['Q/t'] * v.L) / (v.k * v.A) + v.T_C,
      T_C: v.T_H - (v['Q/t'] * v.L) / (v.k * v.A),
      L: (v.k * v.A * (v.T_H - v.T_C)) / v['Q/t']
    })
  },
  'shm-acceleration-displacement': {
    formula: 'a = −ω²x',
    unit: { a: 'm/s²', 'ω': 'rad/s', x: 'm' },
    solve: (v) => ({
      a: -(v['ω'] ** 2) * v.x,
      'ω': Math.sqrt(-v.a / v.x),
      x: -v.a / v['ω'] ** 2
    })
  },
  'shm-velocity-displacement': {
    formula: 'v = ω√(A² − x²)',
    unit: { v: 'm/s', A: 'm', x: 'm', 'ω': 'rad/s' },
    solve: (v) => ({
      v: v['ω'] * Math.sqrt(Math.max(0, v.A ** 2 - v.x ** 2)),
      A: Math.sqrt(v.x ** 2 + (v.v / v['ω']) ** 2),
      x: Math.sqrt(Math.max(0, v.A ** 2 - (v.v / v['ω']) ** 2)),
      'ω': v.v / Math.sqrt(Math.max(0, v.A ** 2 - v.x ** 2))
    })
  },
  'simple-pendulum-period': {
    formula: 'T = 2π√(L/g)',
    unit: { T: 's', L: 'm', g: 'm/s²' },
    solve: (v) => ({
      T: 2 * Math.PI * Math.sqrt(v.L / v.g),
      L: v.g * (v.T / (2 * Math.PI)) ** 2,
      g: (4 * Math.PI ** 2 * v.L) / v.T ** 2
    })
  },
  'wave-velocity-string': {
    formula: 'v = √(T/μ)',
    unit: { v: 'm/s', T: 'N', 'μ': 'kg/m' },
    solve: (v) => ({
      v: Math.sqrt(v.T / v['μ']),
      T: v.v ** 2 * v['μ'],
      'μ': v.T / v.v ** 2
    })
  },
  'fundamental-frequency-string': {
    formula: 'fₙ = (n / 2L) √(T/μ)',
    unit: { f_n: 'Hz', L: 'm', T: 'N', 'μ': 'kg/m', n: '1' },
    solve: (v) => ({
      f_n: (v.n / (2 * v.L)) * Math.sqrt(v.T / v['μ']),
      L: (v.n / (2 * v.f_n)) * Math.sqrt(v.T / v['μ']),
      T: v['μ'] * ((2 * v.L * v.f_n) / v.n) ** 2,
      'μ': v.T / ((2 * v.L * v.f_n) / v.n) ** 2,
      n: (2 * v.L * v.f_n) / Math.sqrt(v.T / v['μ'])
    })
  },
  'beats-frequency': {
    formula: 'f_beat = |f₁ − f₂|',
    unit: { f_beat: 'Hz', f_1: 'Hz', f_2: 'Hz' },
    solve: (v) => ({
      f_beat: Math.abs(v.f_1 - v.f_2),
      f_1: v.f_2 + v.f_beat,
      f_2: v.f_1 - v.f_beat
    }),
    steps: (v, out, unknown) => [
      'f_beat = |f₁ − f₂|',
      unknown === 'f_beat'
        ? `f_beat = |${v.f_1} − ${v.f_2}| = ${out.f_beat.toFixed(4)} Hz`
        : `taking f₁ ≥ f₂, ${unknown} = ${unknown === 'f_1' ? v.f_2 : v.f_1} ${unknown === 'f_1' ? '+' : '−'} ${v.f_beat} = ${out[unknown].toFixed(4)} Hz`,
      `${unknown} = ${out[unknown].toFixed(4)} Hz`
    ]
  },
  'sound-intensity-level-decibel': {
    formula: 'β = 10 log₁₀(I / I₀)',
    unit: { 'β': 'dB', I: 'W/m²', I_0: 'W/m²' },
    solve: (v) => ({
      'β': 10 * Math.log10(v.I / v.I_0),
      I: v.I_0 * 10 ** (v['β'] / 10),
      I_0: v.I / 10 ** (v['β'] / 10)
    })
  },
  'coulombs-law-equation': {
    formula: 'F = (1 / 4πε₀) · q₁q₂ / r²',
    unit: { F: 'N', q_1: 'C', q_2: 'C', r: 'm', 'ε_0': 'F/m' },
    solve: (v) => {
      const k = 1 / (4 * Math.PI * v['ε_0']);
      return {
        F: (k * v.q_1 * v.q_2) / v.r ** 2,
        q_1: (v.F * v.r ** 2) / (k * v.q_2),
        q_2: (v.F * v.r ** 2) / (k * v.q_1),
        r: Math.sqrt((k * v.q_1 * v.q_2) / v.F),
        'ε_0': (v.q_1 * v.q_2) / (4 * Math.PI * v.F * v.r ** 2)
      };
    }
  },
  'drift-velocity': {
    formula: 'v_d = I / nAe',
    unit: { v_d: 'm/s', I: 'A', n: 'm⁻³', A: 'm²', e: 'C' },
    solve: (v) => ({
      v_d: v.I / (v.n * v.A * v.e),
      I: v.v_d * v.n * v.A * v.e,
      n: v.I / (v.v_d * v.A * v.e),
      A: v.I / (v.v_d * v.n * v.e),
      e: v.I / (v.v_d * v.n * v.A)
    })
  },
  'wheatstone-bridge': {
    formula: 'P / Q = R / S',
    unit: { P: 'Ω', Q: 'Ω', R: 'Ω', S: 'Ω' },
    solve: (v) => ({
      P: (v.R * v.Q) / v.S,
      Q: (v.P * v.S) / v.R,
      R: (v.P * v.S) / v.Q,
      S: (v.R * v.Q) / v.P
    })
  },
  'force-current-carrying-conductor': {
    formula: 'F = BIL sin θ',
    unit: { F: 'N', I: 'A', L: 'm', B: 'T', 'θ': '°' },
    solve: (v) => ({
      F: v.B * v.I * v.L * Math.sin(deg(v['θ'])),
      I: v.F / (v.B * v.L * Math.sin(deg(v['θ']))),
      L: v.F / (v.B * v.I * Math.sin(deg(v['θ']))),
      B: v.F / (v.I * v.L * Math.sin(deg(v['θ']))),
      'θ': toDeg(Math.asin(v.F / (v.B * v.I * v.L)))
    })
  },
  'lens-makers-equation': {
    formula: '1/f = (n − 1)(1/R₁ − 1/R₂)',
    unit: { f: 'm', n: '1', R_1: 'm', R_2: 'm' },
    solve: (v) => ({
      f: 1 / ((v.n - 1) * (1 / v.R_1 - 1 / v.R_2)),
      n: 1 + 1 / (v.f * (1 / v.R_1 - 1 / v.R_2)),
      R_1: 1 / (1 / v.R_2 + 1 / (v.f * (v.n - 1))),
      R_2: 1 / (1 / v.R_1 - 1 / (v.f * (v.n - 1)))
    })
  },
  'prism-minimum-deviation': {
    formula: 'n = sin((A + δm)/2) / sin(A/2)',
    unit: { n: '1', A: '°', 'δ_m': '°' },
    solve: (v) => ({
      n: Math.sin(deg((v.A + v['δ_m']) / 2)) / Math.sin(deg(v.A / 2)),
      // n(A) increases monotonically for 0 < A < 180°, so bisection is safe.
      A: bisect((a) => Math.sin(deg((a + v['δ_m']) / 2)) / Math.sin(deg(a / 2)), v.n, 0.5, 179),
      'δ_m': 2 * toDeg(Math.asin(v.n * Math.sin(deg(v.A / 2)))) - v.A
    }),
    steps: (v, out, unknown) => {
      if (unknown === 'n') {
        return [
          'n = sin((A + δm)/2) / sin(A/2)',
          `n = sin((${v.A}° + ${v['δ_m']}°)/2) / sin(${v.A}°/2)`,
          `n = ${out.n.toFixed(4)}`
        ];
      }
      if (unknown === 'δ_m') {
        return [
          'δm = 2 arcsin(n · sin(A/2)) − A',
          `δm = 2 arcsin(${v.n} × sin(${v.A}°/2)) − ${v.A}°`,
          `δm = ${out['δ_m'].toFixed(4)}°`
        ];
      }
      return [
        'n = sin((A + δm)/2) / sin(A/2), solved numerically for A',
        `n = ${v.n}, δm = ${v['δ_m']}°`,
        `A = ${out.A.toFixed(4)}°`
      ];
    }
  },
  'young-double-slit-fringe-width': {
    formula: 'β = λD / d',
    unit: { 'β': 'm', 'λ': 'm', D: 'm', d: 'm' },
    solve: (v) => ({
      'β': (v['λ'] * v.D) / v.d,
      'λ': (v['β'] * v.d) / v.D,
      D: (v['β'] * v.d) / v['λ'],
      d: (v['λ'] * v.D) / v['β']
    })
  },
  'malus-law': {
    formula: 'I = I₀ cos²θ',
    unit: { I: 'W/m²', I_0: 'W/m²', 'θ': '°' },
    solve: (v) => ({
      I: v.I_0 * Math.cos(deg(v['θ'])) ** 2,
      I_0: v.I / Math.cos(deg(v['θ'])) ** 2,
      'θ': toDeg(Math.acos(Math.sqrt(v.I / v.I_0)))
    })
  },
  'bragg-equation': {
    formula: 'nλ = 2d sin θ',
    unit: { n: '1', 'λ': 'm', d: 'm', 'θ': '°' },
    solve: (v) => ({
      n: (2 * v.d * Math.sin(deg(v['θ']))) / v['λ'],
      'λ': (2 * v.d * Math.sin(deg(v['θ']))) / v.n,
      d: (v.n * v['λ']) / (2 * Math.sin(deg(v['θ']))),
      'θ': toDeg(Math.asin((v.n * v['λ']) / (2 * v.d)))
    })
  },

  /* ----------------------------------------------------------- honours */
  'bohr-quantization-angular-momentum': {
    formula: 'L = mvr = nħ',
    unit: { L: 'J s', m: 'kg', v: 'm/s', r: 'm', n: '1' },
    solve: (v) => ({
      L: v.m * v.v * v.r,
      m: v.L / (v.v * v.r),
      v: v.L / (v.m * v.r),
      r: v.L / (v.m * v.v),
      n: (v.m * v.v * v.r) / H_BAR
    })
  },
  'hydrogen-energy-levels-bohr': {
    formula: 'Eₙ = −(m e⁴)/(8ε₀²h²) · 1/n²',
    unit: { E_n: 'J', n: '1', m: 'kg', e: 'C', 'ε_0': 'F/m' },
    solve: (v) => {
      // h is a fixed constant here rather than an input field.
      const scale = (v.m * v.e ** 4) / (8 * v['ε_0'] ** 2 * H_PLANCK ** 2);
      return {
        E_n: -scale / v.n ** 2,
        n: Math.sqrt(-scale / v.E_n),
        m: (-v.E_n * v.n ** 2 * 8 * v['ε_0'] ** 2 * H_PLANCK ** 2) / v.e ** 4,
        e: ((-v.E_n * v.n ** 2 * 8 * v['ε_0'] ** 2 * H_PLANCK ** 2) / v.m) ** 0.25,
        'ε_0': Math.sqrt((v.m * v.e ** 4) / (-v.E_n * v.n ** 2 * 8 * H_PLANCK ** 2))
      };
    }
  },
  'heisenberg-uncertainty-principle': {
    formula: 'Δx Δp ≥ ħ/2  and  ΔE Δt ≥ ħ/2',
    unit: HEISENBERG_UNITS,
    solve: (v) => ({
      'Δx': v['ħ'] / (2 * v['Δp_x']),
      'Δp_x': v['ħ'] / (2 * v['Δx']),
      'ħ': 2 * v['Δx'] * v['Δp_x'],
      'ΔE': v['ħ'] / (2 * v['Δt']),
      'Δt': v['ħ'] / (2 * v['ΔE'])
    }),
    // The two uncertainty pairs are independent, so only show the one in play.
    steps: (v, out, unknown) => {
      const pair = ['Δx', 'Δp_x'].includes(unknown)
        ? { law: 'Δx Δp ≥ ħ/2', group: ['Δx', 'Δp_x', 'ħ'] }
        : { law: 'ΔE Δt ≥ ħ/2', group: ['ΔE', 'Δt', 'ħ'] };
      const known = pair.group.filter((symbol) => symbol !== unknown);
      return [
        `${pair.law}, taken at the minimum uncertainty`,
        known.map((symbol) => `${symbol} = ${fmtWithUnit(v[symbol], HEISENBERG_UNITS[symbol])}`).join(', '),
        `${unknown} = ${fmtWithUnit(out[unknown], HEISENBERG_UNITS[unknown])}`
      ];
    }
  },

  /* --------------------------------------------------------- chemistry */
  'atomic-number-mass-number': {
    formula: 'A = Z + N',
    unit: { A: '1', Z: '1', N: '1' },
    solve: (v) => ({ A: v.Z + v.N, Z: v.A - v.N, N: v.A - v.Z })
  },
  'valency-chemical-formula': {
    formula: 'x v_A = y v_B',
    unit: { v_A: '1', v_B: '1', x: '1', y: '1' },
    solve: (v) => ({
      v_A: (v.y * v.v_B) / v.x,
      v_B: (v.x * v.v_A) / v.y,
      x: (v.y * v.v_B) / v.v_A,
      y: (v.x * v.v_A) / v.v_B
    })
  },
  'solubility-saturated-solution': {
    formula: 'S = (m_solute / m_solvent) × 100',
    unit: { S: 'g/100 g', m_solute: 'g', m_solvent: 'g' },
    solve: (v) => ({
      S: (v.m_solute / v.m_solvent) * 100,
      m_solute: (v.S * v.m_solvent) / 100,
      m_solvent: (v.m_solute * 100) / v.S
    })
  },
  'mass-percentage-composition': {
    formula: '%E = n_E A_r / M_r × 100%',
    unit: { '%E': '%', n_E: '1', A_r: '1', M_r: '1' },
    solve: (v) => ({
      '%E': ((v.n_E * v.A_r) / v.M_r) * 100,
      n_E: (v['%E'] * v.M_r) / (100 * v.A_r),
      A_r: (v['%E'] * v.M_r) / (100 * v.n_E),
      M_r: (100 * v.n_E * v.A_r) / v['%E']
    })
  },
  'molecular-formula-from-empirical': {
    formula: 'k = M_molar / M_empirical',
    unit: { k: '1', M_molar: 'g/mol', M_empirical: 'g/mol' },
    solve: (v) => ({
      k: v.M_molar / v.M_empirical,
      M_molar: v.k * v.M_empirical,
      M_empirical: v.M_molar / v.k
    })
  },
  'molar-volume-of-gas-stp': {
    formula: 'V_m = V / n',
    unit: { V_m: 'L/mol', V: 'L', n: 'mol' },
    solve: (v) => ({ V_m: v.V / v.n, V: v.V_m * v.n, n: v.V / v.V_m })
  },
  'percentage-yield': {
    formula: '%yield = m_actual / m_theoretical × 100%',
    unit: { '%yield': '%', m_actual: 'g', m_theoretical: 'g' },
    solve: (v) => ({
      '%yield': (v.m_actual / v.m_theoretical) * 100,
      m_actual: (v['%yield'] * v.m_theoretical) / 100,
      m_theoretical: (v.m_actual * 100) / v['%yield']
    })
  },
  'molality-equation': {
    formula: 'm = n_solute / m_solvent',
    unit: { m: 'mol/kg', n_solute: 'mol', m_solvent: 'kg' },
    solve: (v) => ({
      m: v.n_solute / v.m_solvent,
      n_solute: v.m * v.m_solvent,
      m_solvent: v.n_solute / v.m
    })
  },
  'mole-fraction-equation': {
    formula: 'x_A = n_A / n_total',
    unit: { x_A: '1', n_A: 'mol', n_total: 'mol' },
    solve: (v) => ({
      x_A: v.n_A / v.n_total,
      n_A: v.x_A * v.n_total,
      n_total: v.n_A / v.x_A
    })
  },
  'dilution-equation': {
    formula: 'C₁V₁ = C₂V₂',
    unit: { C_1: 'mol/L', V_1: 'L', C_2: 'mol/L', V_2: 'L' },
    solve: (v) => ({
      C_1: (v.C_2 * v.V_2) / v.V_1,
      V_1: (v.C_2 * v.V_2) / v.C_1,
      C_2: (v.C_1 * v.V_1) / v.V_2,
      V_2: (v.C_1 * v.V_1) / v.C_2
    })
  },
  'poh-and-ph-relation': {
    formula: 'pH + pOH = pK_w',
    unit: { pH: '1', pOH: '1', K_w: 'mol²/L²' },
    solve: (v) => ({
      pH: -Math.log10(v.K_w) - v.pOH,
      pOH: -Math.log10(v.K_w) - v.pH,
      K_w: 10 ** -(v.pH + v.pOH)
    })
  },
  'ionic-product-of-water': {
    formula: 'K_w = [H⁺][OH⁻]',
    unit: { K_w: 'mol²/L²', '[H⁺]': 'mol/L', '[OH⁻]': 'mol/L' },
    solve: (v) => ({
      K_w: v['[H⁺]'] * v['[OH⁻]'],
      '[H⁺]': v.K_w / v['[OH⁻]'],
      '[OH⁻]': v.K_w / v['[H⁺]']
    })
  },
  'clausius-clapeyron-equation': {
    formula: 'ln(P₂/P₁) = −ΔH_vap/R · (1/T₂ − 1/T₁)',
    unit: { P_1: 'Pa', P_2: 'Pa', 'ΔH_vap': 'J/mol', R: 'J/(mol K)', T_1: 'K', T_2: 'K' },
    solve: (v) => ({
      P_1: v.P_2 / Math.exp((-v['ΔH_vap'] / v.R) * (1 / v.T_2 - 1 / v.T_1)),
      P_2: v.P_1 * Math.exp((-v['ΔH_vap'] / v.R) * (1 / v.T_2 - 1 / v.T_1)),
      'ΔH_vap': (-v.R * Math.log(v.P_2 / v.P_1)) / (1 / v.T_2 - 1 / v.T_1),
      R: (-v['ΔH_vap'] * (1 / v.T_2 - 1 / v.T_1)) / Math.log(v.P_2 / v.P_1),
      T_1: 1 / (1 / v.T_2 + (v.R * Math.log(v.P_2 / v.P_1)) / v['ΔH_vap']),
      T_2: 1 / (1 / v.T_1 - (v.R * Math.log(v.P_2 / v.P_1)) / v['ΔH_vap'])
    })
  },
  'elevation-of-boiling-point': {
    formula: 'ΔT_b = i K_b m',
    unit: { 'ΔT_b': 'K', i: '1', K_b: 'K kg/mol', m: 'mol/kg' },
    solve: (v) => ({
      'ΔT_b': v.i * v.K_b * v.m,
      i: v['ΔT_b'] / (v.K_b * v.m),
      K_b: v['ΔT_b'] / (v.i * v.m),
      m: v['ΔT_b'] / (v.i * v.K_b)
    })
  },
  'depression-of-freezing-point': {
    formula: 'ΔT_f = i K_f m',
    unit: { 'ΔT_f': 'K', i: '1', K_f: 'K kg/mol', m: 'mol/kg' },
    solve: (v) => ({
      'ΔT_f': v.i * v.K_f * v.m,
      i: v['ΔT_f'] / (v.K_f * v.m),
      K_f: v['ΔT_f'] / (v.i * v.m),
      m: v['ΔT_f'] / (v.i * v.K_f)
    })
  },
  'henry-law': {
    formula: 'c = k_H P',
    unit: { c: 'mol/L', k_H: 'mol/(L Pa)', P_gas: 'Pa' },
    solve: (v) => ({
      c: v.k_H * v.P_gas,
      k_H: v.c / v.P_gas,
      P_gas: v.c / v.k_H
    })
  },
  'kp-kc-relation': {
    formula: 'K_p = K_c (RT)^Δn',
    unit: { K_p: '1', K_c: '1', R: 'L atm/(mol K)', T: 'K', 'Δn': '1' },
    solve: (v) => ({
      K_p: v.K_c * (v.R * v.T) ** v['Δn'],
      K_c: v.K_p / (v.R * v.T) ** v['Δn'],
      R: (v.K_p / v.K_c) ** (1 / v['Δn']) / v.T,
      T: (v.K_p / v.K_c) ** (1 / v['Δn']) / v.R,
      'Δn': Math.log(v.K_p / v.K_c) / Math.log(v.R * v.T)
    })
  },
  'electrode-potential-emf': {
    formula: 'E°_cell = E°_cathode − E°_anode',
    unit: { 'E°_cell': 'V', 'E°_cathode': 'V', 'E°_anode': 'V' },
    solve: (v) => ({
      'E°_cell': v['E°_cathode'] - v['E°_anode'],
      'E°_cathode': v['E°_cell'] + v['E°_anode'],
      'E°_anode': v['E°_cathode'] - v['E°_cell']
    })
  },
  'first-order-integrated-rate-law': {
    formula: 'ln([A]₀/[A]) = kt',
    unit: { '[A]': 'mol/L', '[A]_0': 'mol/L', k: 's⁻¹', t: 's' },
    solve: (v) => ({
      '[A]': v['[A]_0'] * Math.exp(-v.k * v.t),
      '[A]_0': v['[A]'] * Math.exp(v.k * v.t),
      k: Math.log(v['[A]_0'] / v['[A]']) / v.t,
      t: Math.log(v['[A]_0'] / v['[A]']) / v.k
    })
  },
  'half-life-first-order': {
    formula: 't½ = ln 2 / k',
    unit: { 't_1/2': 's', k: 's⁻¹' },
    solve: (v) => ({ 't_1/2': Math.LN2 / v.k, k: Math.LN2 / v['t_1/2'] })
  },
  'zero-order-kinetics': {
    formula: '[A] = [A]₀ − kt',
    unit: { '[A]': 'mol/L', '[A]_0': 'mol/L', k: 'mol/(L s)', t: 's' },
    solve: (v) => ({
      '[A]': v['[A]_0'] - v.k * v.t,
      '[A]_0': v['[A]'] + v.k * v.t,
      k: (v['[A]_0'] - v['[A]']) / v.t,
      t: (v['[A]_0'] - v['[A]']) / v.k
    })
  },
  'arrhenius-two-temperature': {
    formula: 'ln(k₂/k₁) = −E_a/R · (1/T₂ − 1/T₁)',
    unit: { k_1: 's⁻¹', k_2: 's⁻¹', E_a: 'J/mol', R: 'J/(mol K)', T_1: 'K', T_2: 'K' },
    solve: (v) => ({
      k_1: v.k_2 / Math.exp((-v.E_a / v.R) * (1 / v.T_2 - 1 / v.T_1)),
      k_2: v.k_1 * Math.exp((-v.E_a / v.R) * (1 / v.T_2 - 1 / v.T_1)),
      E_a: (-v.R * Math.log(v.k_2 / v.k_1)) / (1 / v.T_2 - 1 / v.T_1),
      R: (-v.E_a * (1 / v.T_2 - 1 / v.T_1)) / Math.log(v.k_2 / v.k_1),
      T_1: 1 / (1 / v.T_2 + (v.R * Math.log(v.k_2 / v.k_1)) / v.E_a),
      T_2: 1 / (1 / v.T_1 - (v.R * Math.log(v.k_2 / v.k_1)) / v.E_a)
    })
  },
  'ostwald-dilution-law': {
    formula: 'K_a = α²c / (1 − α)',
    unit: { K_a: 'mol/L', 'α': '1', c: 'mol/L' },
    solve: (v) => ({
      K_a: (v['α'] ** 2 * v.c) / (1 - v['α']),
      // exact root of α²c + K_a α − K_a = 0 (the √K_a/c form is the weak-acid approximation)
      'α': (-v.K_a + Math.sqrt(v.K_a ** 2 + 4 * v.c * v.K_a)) / (2 * v.c),
      c: (v.K_a * (1 - v['α'])) / v['α'] ** 2
    })
  },
  'langmuir-adsorption-isotherm': {
    formula: 'θ = KP / (1 + KP)',
    unit: { 'θ': '1', K: 'Pa⁻¹', P: 'Pa' },
    solve: (v) => ({
      'θ': (v.K * v.P) / (1 + v.K * v.P),
      K: v['θ'] / (v.P * (1 - v['θ'])),
      P: v['θ'] / (v.K * (1 - v['θ']))
    })
  },
  'freundlich-adsorption-isotherm': {
    formula: 'x/m = kP^(1/n)',
    unit: { 'x/m': 'g/g', k: '1', P: 'Pa', n: '1' },
    solve: (v) => ({
      'x/m': v.k * v.P ** (1 / v.n),
      k: v['x/m'] / v.P ** (1 / v.n),
      P: (v['x/m'] / v.k) ** v.n,
      n: Math.log(v.P) / Math.log(v['x/m'] / v.k)
    })
  },
  'nernst-distribution-law': {
    formula: 'K_D = C₁ⁿ / C₂',
    unit: { K_D: '1', C_1: 'mol/L', C_2: 'mol/L', n: '1' },
    solve: (v) => ({
      K_D: v.C_1 ** v.n / v.C_2,
      C_1: (v.K_D * v.C_2) ** (1 / v.n),
      C_2: v.C_1 ** v.n / v.K_D,
      n: Math.log(v.K_D * v.C_2) / Math.log(v.C_1)
    })
  },
  'rydberg-equation-hydrogen': {
    formula: '1/λ = R_H (1/n₁² − 1/n₂²)',
    unit: { 'λ': 'm', R_H: 'm⁻¹', n_1: '1', n_2: '1' },
    solve: (v) => ({
      'λ': 1 / (v.R_H * (1 / v.n_1 ** 2 - 1 / v.n_2 ** 2)),
      R_H: 1 / (v['λ'] * (1 / v.n_1 ** 2 - 1 / v.n_2 ** 2)),
      n_1: 1 / Math.sqrt(1 / (v['λ'] * v.R_H) + 1 / v.n_2 ** 2),
      n_2: 1 / Math.sqrt(1 / v.n_1 ** 2 - 1 / (v['λ'] * v.R_H))
    })
  }
};

export type ModelResult = {
  result: number;
  unit: string;
  formula: string;
  steps: string[];
};

/** Formats a value with its unit, omitting the unit for dimensionless quantities. */
const fmtWithUnit = (value: number, unit: string | undefined) =>
  unit && unit !== '1' ? `${fmt(value)} ${unit}` : fmt(value);

const fmt = (value: number) => {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e7)) return value.toExponential(4);
  return Number(value.toFixed(6)).toString();
};

/**
 * Runs the declarative model for `slug`.
 *
 * @param raw   values exactly as typed, in the units the student selected
 * @param units symbol → the unit label that was selected for it
 * @param unknown symbol to solve for
 */
export function solveWithModel(
  slug: string,
  raw: Record<string, number>,
  units: Record<string, string>,
  unknown: string
): ModelResult | null {
  const model = calculatorModels[slug];
  if (!model) return null;

  const values: Record<string, number> = {};
  for (const [symbol, declaredUnit] of Object.entries(model.unit)) {
    if (symbol === unknown) continue;
    const choice = unitChoicesFor(declaredUnit, symbol).find((item) => item.label === units[symbol])
      ?? { label: declaredUnit, factor: 1 };
    const typed = raw[symbol];
    if (typed === undefined || !Number.isFinite(typed)) return null;
    values[symbol] = typed * choice.factor + (choice.offset ?? 0);
  }

  let solved: Record<string, number>;
  try {
    solved = model.solve(values);
  } catch {
    return null;
  }
  const result = solved[unknown];
  if (result === undefined || !Number.isFinite(result)) return null;

  // Dimensionless results read better with no unit label at all.
  const unit = !model.unit[unknown] || model.unit[unknown] === '1' ? '' : model.unit[unknown];
  const steps = model.steps
    ? model.steps(values, solved, unknown)
    : [
        model.formula,
        ...Object.entries(values).map(([symbol, value]) => `${symbol} = ${fmtWithUnit(value, model.unit[symbol])}`),
        `${unknown} = ${fmtWithUnit(result, model.unit[unknown])}`
      ];

  return { result, unit, formula: model.formula, steps };
}
