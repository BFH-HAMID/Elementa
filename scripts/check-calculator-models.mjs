/**
 * Guards the declarative calculator registry against drifting away from the
 * MDX frontmatter it serves.
 *
 * Two checks run:
 *   1. Frontmatter audit — every symbol in an entry's `variables:` list must
 *      appear in the model's `unit` map, with the exact same unit string, and
 *      the model must not invent symbols.
 *   2. Round trip — seed every symbol with a plausible value, solve for each
 *      symbol in turn, then recover the first seed from the computed values.
 *      A rearrangement that is not the true inverse shows up as drift here.
 *
 * Run with `npm run check:models`.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { calculatorModels, solveWithModel, unitChoicesFor } from '../lib/calculator-models.ts';

const contentRoot = path.join(process.cwd(), 'content');

/** Plausible values, in the units each model declares. */
const SEEDS = {
  'weight-gravity': { W: 98, m: 10, g: 9.8 },
  'moment-of-force': { 'τ': 10, F: 20, 'd_⊥': 0.5 },
  'liquid-column-pressure': { P: 98000, h: 10, 'ρ': 1000, g: 9.8 },
  'echo-minimum-distance': { d: 17, v: 340, t: 0.1 },
  'electric-charge-current': { Q: 120, I: 2, t: 60 },
  'surface-tension-force': { F: 0.0144, T: 0.072, L: 0.1 },
  'first-equation-of-motion': { v: 11, u: 5, a: 2, t: 3 },
  'second-equation-of-motion': { s: 24, u: 5, a: 2, t: 3 },
  'third-equation-of-motion': { v: 11, u: 5, a: 2, s: 24 },
  'nth-second-displacement': { s_n: 10, u: 5, a: 2, n: 3 },
  'linear-momentum': { p: 6, m: 2, v: 3 },
  'rocket-recoil-velocity': { V: -5, M: 1000, m: 10, v: 500 },
  'gravitational-potential-energy': { E_p: 98, m: 2, g: 9.8, h: 5 },
  'hookes-law-spring': { F_s: -10, k: 200, x: 0.05 },
  'pascal-hydraulic-lift': { F_1: 100, A_1: 0.01, F_2: 1000, A_2: 0.1 },
  'archimedes-buoyant-force': { F_b: 9.8, V: 0.001, 'ρ': 1000, g: 9.8 },
  'linear-thermal-expansion': { 'ΔL': 0.0006, L_0: 1, 'α': 0.000012, 'ΔT': 50 },
  'thermal-expansion-coefficients': { 'α': 1e-5, 'β': 2e-5, 'γ': 3e-5 },
  'calorimetry-heat-equation': { Q: 84000, m: 2, c: 4200, 'ΔT': 10 },
  'lens-power-equation': { P: 4, f: 0.25 },
  'resistivity-formula': { R: 0.0336, 'ρ': 1.68e-8, L: 2, A: 1e-6 },
  'banking-angle-road': { 'θ': 39.2, v: 20, r: 50, g: 9.8 },
  'torque-angular-acceleration': { 'τ': 2, I: 0.5, 'α': 4 },
  'moment-of-inertia-point-mass': { I: 0.5, m: 2, r: 0.5 },
  'parallel-axis-theorem': { I: 0.28, I_cm: 0.1, M: 2, d: 0.3 },
  'angular-momentum-conservation': { L: 5, I: 0.5, 'ω': 10 },
  'newtons-law-of-gravitation': { F: 6.674e-5, G: 6.674e-11, m_1: 1000, m_2: 1000, r: 1 },
  'gravitational-field-strength': { g: 9.82, G: 6.674e-11, M: 5.97e24, r: 6.371e6 },
  'gravitational-potential-energy-general': { U: -6.254e10, G: 6.674e-11, M: 5.97e24, m: 1000, r: 6.371e6 },
  'keplers-third-law': { T: 3.156e7, r: 1.496e11, G: 6.674e-11, M: 1.989e30 },
  'youngs-modulus-equation': { Y: 2e11, F: 100, A: 1e-6, 'ΔL': 0.001, L: 2 },
  'bulk-modulus': { K: 2e9, 'ΔP': 1e7, 'ΔV': -5e-6, V: 0.001 },
  'newtons-law-of-viscosity': { F: 0.01, 'η': 0.001, A: 0.1, 'dv/dx': 100 },
  'kinetic-viscosity': { 'ν': 1e-6, 'η': 0.001, 'ρ': 1000 },
  'poiseuilles-equation': { Q: 0.003927, R: 0.01, 'ΔP': 1000, 'η': 0.001, L: 1 },
  'equation-of-continuity': { A_1: 0.01, v_1: 2, A_2: 0.005, v_2: 4 },
  'torricelli-theorem': { v: 9.899, g: 9.8, h: 5 },
  'venturi-flow-meter': { Q: 0.006455, A_1: 0.01, A_2: 0.002, 'ΔP': 5000, 'ρ': 1000 },
  'reynolds-number': { Re: 50000, 'ρ': 1000, v: 1, D: 0.05, 'η': 0.001 },
  'first-law-thermodynamics': { 'ΔU': 300, Q: 500, W: 200 },
  'isothermal-work': { W: 3457.5, n: 2, R: 8.314, T: 300, V_1: 0.01, V_2: 0.02 },
  'heat-engine-efficiency': { 'η': 0.4, W: 400, Q_H: 1000, Q_C: 600 },
  'carnot-engine-efficiency': { 'η_Carnot': 0.5, T_C: 300, T_H: 600 },
  'stefan-boltzmann-law': { P: 2835, 'σ': 5.67e-8, A: 1, e: 0.8, T: 500 },
  'wien-displacement-law': { 'λ_max': 5e-7, T: 5800, b: 0.002898 },
  'thermal-conductivity-equation': { 'Q/t': 800, k: 400, A: 0.01, T_H: 373, T_C: 273, L: 0.5 },
  'shm-acceleration-displacement': { a: -2.5, 'ω': 5, x: 0.1 },
  'shm-velocity-displacement': { v: 0.4, A: 0.1, x: 0.06, 'ω': 5 },
  'simple-pendulum-period': { T: 2.007, L: 1, g: 9.8 },
  'wave-velocity-string': { v: 100, T: 100, 'μ': 0.01 },
  'fundamental-frequency-string': { f_n: 100, L: 0.5, T: 100, 'μ': 0.01, n: 1 },
  'beats-frequency': { f_beat: 4, f_1: 444, f_2: 440 },
  'sound-intensity-level-decibel': { 'β': 60, I: 1e-6, I_0: 1e-12 },
  'coulombs-law-equation': { F: 0.0899, q_1: 1e-6, q_2: 1e-6, r: 0.3163, 'ε_0': 8.854e-12 },
  'drift-velocity': { v_d: 7.34e-5, I: 1, n: 8.5e28, A: 1e-6, e: 1.602e-19 },
  'wheatstone-bridge': { P: 10, Q: 20, R: 15, S: 30 },
  'force-current-carrying-conductor': { F: 0.3, I: 2, L: 0.3, B: 0.5, 'θ': 90 },
  'lens-makers-equation': { f: 0.24, n: 1.5, R_1: 0.2, R_2: -0.3 },
  'prism-minimum-deviation': { n: 1.5, A: 60, 'δ_m': 37.18 },
  'young-double-slit-fringe-width': { 'β': 0.0006, 'λ': 6e-7, D: 1, d: 0.001 },
  'malus-law': { I: 25, I_0: 100, 'θ': 60 },
  'bragg-equation': { n: 1, 'λ': 1e-10, d: 2e-10, 'θ': 14.48 },
  'bohr-quantization-angular-momentum': { L: 1.0546e-34, m: 9.109e-31, v: 2.188e6, r: 5.29e-11, n: 1 },
  'hydrogen-energy-levels-bohr': { E_n: -2.18e-18, n: 1, m: 9.109e-31, e: 1.602e-19, 'ε_0': 8.854e-12 },
  'heisenberg-uncertainty-principle': { 'Δx': 1e-10, 'Δp_x': 5.27e-25, 'ħ': 1.0546e-34, 'ΔE': 1e-20, 'Δt': 5.273e-15 },
  'atomic-number-mass-number': { A: 12, Z: 6, N: 6 },
  'valency-chemical-formula': { v_A: 3, v_B: 2, x: 2, y: 3 },
  'solubility-saturated-solution': { S: 36, m_solute: 36, m_solvent: 100 },
  'mass-percentage-composition': { '%E': 54.545, n_E: 2, A_r: 12, M_r: 44 },
  'molecular-formula-from-empirical': { k: 6, M_molar: 180, M_empirical: 30 },
  'molar-volume-of-gas-stp': { V_m: 22.4, V: 44.8, n: 2 },
  'percentage-yield': { '%yield': 80, m_actual: 8, m_theoretical: 10 },
  'molality-equation': { m: 2.5, n_solute: 0.5, m_solvent: 0.2 },
  'mole-fraction-equation': { x_A: 0.25, n_A: 0.25, n_total: 1 },
  'dilution-equation': { C_1: 2, V_1: 0.25, C_2: 0.5, V_2: 1 },
  'poh-and-ph-relation': { pH: 7, pOH: 7, K_w: 1e-14 },
  'ionic-product-of-water': { K_w: 1e-14, '[H⁺]': 1e-7, '[OH⁻]': 1e-7 },
  'clausius-clapeyron-equation': { P_1: 100000, P_2: 48160, 'ΔH_vap': 40000, R: 8.314, T_1: 373, T_2: 353 },
  'elevation-of-boiling-point': { 'ΔT_b': 1.04, i: 1, K_b: 0.52, m: 2 },
  'depression-of-freezing-point': { 'ΔT_f': 3.72, i: 1, K_f: 1.86, m: 2 },
  'henry-law': { c: 0.001, k_H: 1e-8, P_gas: 100000 },
  'kp-kc-relation': { K_p: 12.315, K_c: 0.5, R: 0.0821, T: 300, 'Δn': 1 },
  'electrode-potential-emf': { 'E°_cell': 1.1, 'E°_cathode': 0.34, 'E°_anode': -0.76 },
  'first-order-integrated-rate-law': { '[A]': 0.025, '[A]_0': 0.1, k: 0.01, t: 138.63 },
  'half-life-first-order': { 't_1/2': 69.31, k: 0.01 },
  'zero-order-kinetics': { '[A]': 0.04, '[A]_0': 0.1, k: 0.002, t: 30 },
  'arrhenius-two-temperature': { k_1: 0.001, k_2: 0.002, E_a: 50000, R: 8.314, T_1: 300, T_2: 310.79 },
  'ostwald-dilution-law': { K_a: 0.001111, 'α': 0.1, c: 0.1 },
  'langmuir-adsorption-isotherm': { 'θ': 0.5, K: 1e-5, P: 100000 },
  'freundlich-adsorption-isotherm': { 'x/m': 158.11, k: 0.5, P: 100000, n: 2 },
  'nernst-distribution-law': { K_D: 0.2, C_1: 0.1, C_2: 0.05, n: 2 },
  'rydberg-equation-hydrogen': { 'λ': 6.563e-7, R_H: 1.097e7, n_1: 2, n_2: 3 }
};

function readEquations() {
  const files = [];
  (function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.name.endsWith('.mdx')) files.push(target);
    }
  })(contentRoot);

  const entries = new Map();
  for (const file of files) {
    const { data } = matter(fs.readFileSync(file, 'utf8'));
    if (data.type === 'equation') entries.set(data.slug, data);
  }
  return entries;
}

let problems = 0;
const fail = (message) => { console.error(`  ✗ ${message}`); problems += 1; };

const entries = readEquations();

console.log(`Frontmatter audit (${Object.keys(calculatorModels).length} models)`);
for (const [slug, model] of Object.entries(calculatorModels)) {
  const entry = entries.get(slug);
  if (!entry) { fail(`${slug}: no equation entry with this slug`); continue; }
  const declared = new Map(entry.variables.map((variable) => [variable.symbol, variable.unit]));
  const modelled = Object.keys(model.unit);
  for (const symbol of declared.keys()) if (!modelled.includes(symbol)) fail(`${slug}: "${symbol}" is in variables but missing from model.unit`);
  for (const symbol of modelled) if (!declared.has(symbol)) fail(`${slug}: "${symbol}" is in model.unit but not in variables`);
  for (const symbol of modelled) {
    if (declared.has(symbol) && model.unit[symbol] !== declared.get(symbol)) {
      fail(`${slug}: "${symbol}" unit is "${model.unit[symbol]}" in the model but "${declared.get(symbol)}" in frontmatter`);
    }
  }
}

console.log('Round-trip check');
for (const [slug, model] of Object.entries(calculatorModels)) {
  const symbols = Object.keys(model.unit);
  const seed = SEEDS[slug];
  if (!seed) { fail(`${slug}: no seed values — add them to scripts/check-calculator-models.mjs`); continue; }
  const missing = symbols.filter((symbol) => seed[symbol] === undefined);
  if (missing.length) { fail(`${slug}: seed is missing ${missing.join(', ')}`); continue; }

  const units = Object.fromEntries(symbols.map((symbol) => [symbol, unitChoicesFor(model.unit[symbol], symbol)[0].label]));
  const computed = {};

  for (const target of symbols) {
    const raw = {};
    for (const symbol of symbols) {
      if (symbol === target) continue;
      raw[symbol] = computed[symbol] !== undefined ? computed[symbol] : seed[symbol];
    }
    const solved = solveWithModel(slug, raw, units, target);
    if (!solved) { fail(`${slug}: solving for "${target}" returned nothing`); break; }
    computed[target] = solved.result;
  }

  const first = symbols[0];
  const raw = Object.fromEntries(symbols.filter((symbol) => symbol !== first).map((symbol) => [symbol, computed[symbol]]));
  const recovered = solveWithModel(slug, raw, units, first);
  if (!recovered) { fail(`${slug}: could not recover "${first}"`); continue; }
  const drift = Math.abs(recovered.result - seed[first]) / Math.max(1e-12, Math.abs(seed[first]));
  if (!(drift < 0.02)) fail(`${slug}: "${first}" drifted — seeded ${seed[first]}, recovered ${recovered.result}`);
}

if (problems > 0) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
console.log(`\nAll ${Object.keys(calculatorModels).length} calculator models are consistent with their frontmatter.`);
