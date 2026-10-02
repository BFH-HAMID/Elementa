import type { Subject } from './schemas';

export type SimulationMeta = {
  slug: string;
  subject: Subject;
  title_bn: string;
  title_en: string;
  description_bn: string;
  description_en: string;
  level: 'class-6-8' | 'class-9-10' | 'class-11-12' | 'honours';
  symbol: string;
  formula: string;
  tags: string[];
};

export const simulationMetas: SimulationMeta[] = [
  { slug: 'projectile-motion', subject: 'physics', title_bn: 'প্রক্ষেপণ গতি', title_en: 'Projectile motion', description_bn: 'কোণ ও বেগ বদলে উড়ন্ত বস্তুর পথ দেখুন।', description_en: 'Change the angle and speed of a launched object.', level: 'class-9-10', symbol: '↗', formula: 'R = u² sin(2θ) / g', tags: ['motion', 'trajectory'] },
  { slug: 'vector-addition', subject: 'physics', title_bn: 'ভেক্টর যোগ ও সামান্তরিক সূত্র', title_en: 'Vector addition and the parallelogram law', description_bn: 'দুটি ভেক্টরের মান ও কোণ বদলে লব্ধির মান, দিক ও উপাংশ দেখুন।', description_en: 'Change two vector magnitudes and their angle to inspect the resultant, direction and components.', level: 'class-11-12', symbol: '↗', formula: 'R² = A² + B² + 2AB cos θ', tags: ['vectors', 'resultant', 'components'] },
  { slug: 'mass-spring-oscillator', subject: 'physics', title_bn: 'স্প্রিং-ভর দোলক', title_en: 'Mass–spring oscillator', description_bn: 'ভর, স্প্রিং ধ্রুবক ও বিস্তার বদলে SHM ও শক্তির রূপান্তর দেখুন।', description_en: 'Change mass, spring constant and amplitude to explore SHM and energy exchange.', level: 'class-11-12', symbol: '↕', formula: 'T = 2π√(m/k), E = ½kA²', tags: ['shm', 'spring', 'energy'] },
  { slug: 'fluid-flow-bernoulli', subject: 'physics', title_bn: 'প্রবাহ, ধারাবাহিকতা ও বার্নৌলি', title_en: 'Fluid flow: continuity and Bernoulli', description_bn: 'নলের ক্ষেত্রফল, প্রবাহবেগ ও উচ্চতা বদলে বেগ ও চাপের সম্পর্ক দেখুন।', description_en: 'Change pipe area, flow speed and height to compare speed and pressure.', level: 'class-11-12', symbol: '≈', formula: 'A₁v₁ = A₂v₂; P + ½ρv² + ρgh = const', tags: ['fluid', 'continuity', 'bernoulli'] },
  { slug: 'wheatstone-bridge', subject: 'physics', title_bn: 'হুইটস্টোন ব্রিজ', title_en: 'Wheatstone bridge', description_bn: 'চারটি বাহুর রোধ বদলে সাম্য অবস্থা ও গ্যালভানোমিটারের প্রবাহ দেখুন।', description_en: 'Adjust four arm resistances to balance the bridge and null the galvanometer.', level: 'class-11-12', symbol: '◇', formula: 'R₁/R₂ = R₃/R₄', tags: ['electricity', 'bridge', 'resistance'] },
  { slug: 'simple-pendulum', subject: 'physics', title_bn: 'সরল দোলক', title_en: 'Simple pendulum', description_bn: 'দৈর্ঘ্য ও মহাকর্ষের সঙ্গে দোলনকাল কীভাবে বদলায়?', description_en: 'See how length and gravity set the period.', level: 'class-9-10', symbol: '◌', formula: 'T = 2π√(L/g)', tags: ['oscillation', 'period'] },
  { slug: 'ohms-law-circuit', subject: 'physics', title_bn: 'ওহমের সূত্র সার্কিট', title_en: "Ohm's law circuit", description_bn: 'সিরিজ ও প্যারালাল রোধে কারেন্ট দেখুন।', description_en: 'Explore current through series and parallel resistors.', level: 'class-9-10', symbol: '⌁', formula: 'V = IR', tags: ['electricity', 'circuit'] },
  { slug: 'wave-interference', subject: 'physics', title_bn: 'তরঙ্গের ব্যতিচার', title_en: 'Wave interference', description_bn: 'দুটি উৎস থেকে গঠনমূলক ও ধ্বংসাত্মক ব্যতিচার।', description_en: 'Watch constructive and destructive interference.', level: 'class-11-12', symbol: '≈', formula: 'y = 2A cos(φ/2) sin(ωt)', tags: ['waves', 'superposition'] },
  { slug: 'young-double-slit', subject: 'physics', title_bn: 'ইয়ং-এর দ্বিচির ব্যতিচার', title_en: 'Young’s double-slit experiment', description_bn: 'আলোর তরঙ্গদৈর্ঘ্য, চিরের দূরত্ব ও পর্দার ব্যবধান বদলে ঝালরের প্রস্থ দেখুন।', description_en: 'Change wavelength, slit spacing and screen distance to explore fringe spacing.', level: 'class-11-12', symbol: 'β', formula: 'β = λD/d', tags: ['optics', 'interference', 'young double slit'] },
  { slug: 'newtons-second-law', subject: 'physics', title_bn: 'নিউটনের দ্বিতীয় সূত্র', title_en: "Newton's second law", description_bn: 'বল বা ভর বদলে ত্বরণের ফল দেখুন।', description_en: 'Change force or mass and see acceleration respond.', level: 'class-9-10', symbol: 'F', formula: 'F = ma', tags: ['force', 'motion'] },
  { slug: 'lens-ray-diagram', subject: 'physics', title_bn: 'লেন্সের রশ্মি চিত্র', title_en: 'Lens ray diagram', description_bn: 'উত্তল লেন্সে প্রতিবিম্ব কোথায় তৈরি হয়?', description_en: 'Trace rays and locate the image of an object.', level: 'class-9-10', symbol: '◐', formula: '1/f = 1/v + 1/u', tags: ['optics', 'image'] },
  { slug: 'acid-base-titration', subject: 'chemistry', title_bn: 'অ্যাসিড–বেস টাইট্রেশন', title_en: 'Acid–base titration', description_bn: 'বিউরেটের ফোঁটায় pH curve ও equivalence point দেখুন।', description_en: 'Add titrant and follow the pH curve to equivalence.', level: 'class-11-12', symbol: '滴', formula: 'n₁V₁ = n₂V₂', tags: ['titration', 'pH'] },
  { slug: 'ph-scale', subject: 'chemistry', title_bn: 'pH স্কেল', title_en: 'pH scale', description_bn: 'হাইড্রোজেন আয়নের ঘনত্ব থেকে অম্লত্ব বুঝুন।', description_en: 'Connect hydrogen-ion concentration to acidity.', level: 'class-9-10', symbol: 'pH', formula: 'pH = −log₁₀[H⁺]', tags: ['acid', 'base'] },
  { slug: 'ideal-gas-law', subject: 'chemistry', title_bn: 'আদর্শ গ্যাস সূত্র', title_en: 'Ideal gas law', description_bn: 'চাপ, আয়তন ও তাপমাত্রার live graph।', description_en: 'Move P, V and T while the gas state updates.', level: 'class-11-12', symbol: 'PV', formula: 'PV = nRT', tags: ['gas', 'thermodynamics'] },
  { slug: 'molecule-viewer', subject: 'chemistry', title_bn: '3D অণু দর্শক', title_en: '3D molecule viewer', description_bn: 'জল, মিথেন ও বেঞ্জিনের গঠন ঘুরিয়ে দেখুন।', description_en: 'Inspect water, methane and benzene in 3D.', level: 'class-11-12', symbol: '◉', formula: 'structure → properties', tags: ['molecules', '3D'] },
  { slug: 'reaction-rate-temperature', subject: 'chemistry', title_bn: 'তাপমাত্রা ও বিক্রিয়ার হার', title_en: 'Reaction rate vs temperature', description_bn: 'Arrhenius সূত্রে তাপমাত্রার প্রভাব দেখুন।', description_en: 'Use Arrhenius behaviour to explore temperature effects.', level: 'honours', symbol: 'Ea', formula: 'k = A e⁻ᴱᵃ/ᴿᵀ', tags: ['kinetics', 'arrhenius'] }
];

export function getSimulationMeta(slug: string): SimulationMeta | undefined {
  return simulationMetas.find((simulation) => simulation.slug === slug);
}
