import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(value: number, maximumFractionDigits = 3): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits, notation: Math.abs(value) >= 10000 ? 'compact' : 'standard' }).format(value);
}

export function titleFor(locale: 'bn' | 'en', titleBn: string, titleEn: string): string {
  return locale === 'bn' ? titleBn : titleEn;
}

const LATEX_MACROS: ReadonlyArray<readonly [string, string]> = [
  ['\\Delta', 'Δ'], ['\\alpha', 'α'], ['\\approx', '≈'], ['\\beta', 'β'], ['\\gamma', 'γ'],
  ['\\eta', 'η'], ['\\infty', '∞'], ['\\kappa', 'κ'], ['\\lambda', 'λ'], ['\\mu', 'μ'],
  ['\\omega', 'ω'], ['\\pi', 'π'], ['\\pm', '±'], ['\\propto', '∝'], ['\\rho', 'ρ'],
  ['\\sigma', 'σ'], ['\\sum', 'Σ'], ['\\theta', 'θ'], ['\\times', '×'], ['\\div', '÷'],
  ['\\rightarrow', '→'], ['\\longrightarrow', '→'], ['\\rightleftharpoons', '⇌'],
  ['\\leq', '≤'], ['\\geq', '≥'], ['\\neq', '≠'], ['\\ln', 'ln'], ['\\log', 'log'],
  ['\\sin', 'sin'], ['\\cos', 'cos'], ['\\tan', 'tan'], ['\\exp', 'exp'],
  ['\\mathrm', ''], ['\\text', ''], ['\\mathbf', ''], ['\\cdot', '·'], ['\\circ', '°']
];

/**
 * Turn inline maths into readable plain text.
 *
 * Prose fields (`aim`, `derivation`, `summary`) carry `$…$` spans that KaTeX
 * renders on the page. Metadata, search records and CSV exports are plain text,
 * where the delimiters and macros would show up as noise, so they are converted
 * to the unicode symbols a reader expects instead.
 */
export function mathToText(value: string): string {
  if (!value.includes('$') && !value.includes('\\')) return value;
  const simplify = (body: string) => {
    let out = body
      .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, ' ')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\sqrt\{([^{}]*)\}/g, '√$1')
      .replace(/\\(?:mathrm|text|mathbf)\{([^{}]*)\}/g, '$1')
      .replace(/_\{([^{}]*)\}/g, '_$1')
      .replace(/\^\{([^{}]*)\}/g, '^$1')
      .replace(/\\(?:left|right|big|Big)/g, '')
      .replace(/\\[,;: !]/g, ' ')
      .replace(/&/g, ' ')
      .replace(/\\\\/g, ' ');
    for (const [macro, plain] of LATEX_MACROS) out = out.split(macro).join(plain);
    return out.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  };
  return value
    .replace(/\$([^$]*)\$/g, (_match, body: string) => ` ${simplify(body)} `)
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:।])/g, '$1')
    .trim();
}

const GREEK_TO_LATEX: ReadonlyArray<readonly [string, string]> = [
  ['Δ', '\\Delta'], ['Ω', '\\Omega'], ['Σ', '\\Sigma'], ['Θ', '\\Theta'], ['Λ', '\\Lambda'],
  ['α', '\\alpha'], ['β', '\\beta'], ['γ', '\\gamma'], ['δ', '\\delta'], ['ε', '\\epsilon'],
  ['ζ', '\\zeta'], ['η', '\\eta'], ['θ', '\\theta'], ['κ', '\\kappa'], ['λ', '\\lambda'],
  ['μ', '\\mu'], ['ν', '\\nu'], ['ξ', '\\xi'], ['ρ', '\\rho'], ['σ', '\\sigma'],
  ['τ', '\\tau'], ['φ', '\\phi'], ['χ', '\\chi'], ['ψ', '\\psi'], ['ω', '\\omega'],
];

// Unicode sub/superscripts exist for digits and a handful of letters, which is
// all a dropdown option or an aria-label needs.
const SUBSCRIPT_TEXT: Record<string, string> = {
  '+': '₊', '-': '₋', '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅',
  '6': '₆', '7': '₇', '8': '₈', '9': '₉', a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ',
  k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ',
  v: 'ᵥ', x: 'ₓ',
};
const SUPERSCRIPT_TEXT: Record<string, string> = {
  '+': '⁺', '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
  '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', i: 'ⁱ', n: 'ⁿ',
};

/**
 * Variable symbols are data, not markup: `check:models` keys every unit map by
 * the literal string (`k_1`, `ΔH_vap`, `ε`), so they must never be rewritten in
 * content. The calculator typesets them at render time instead.
 */
export function symbolNeedsMath(symbol: string): boolean {
  return /[_^°]|[Α-Ωα-ω]|[⁰-₉]/.test(symbol);
}

/** `ΔH_vap` → `\Delta H_{\mathrm{vap}}`, `k_1` → `k_{1}`, `T^4` → `T^{4}`. */
export function symbolLatex(symbol: string): string {
  let out = symbol;
  for (const [letter, macro] of GREEK_TO_LATEX) out = out.split(letter).join(`${macro} `);
  return out
    .replace(/°/g, '^{\\circ}')
    .replace(/_\{?([A-Za-z]{2,})\}?/g, '_{\\mathrm{$1}}')
    .replace(/_\{?([A-Za-z0-9])\}?/g, '_{$1}')
    .replace(/\^\{?([A-Za-z0-9+-]+)\}?/g, '^{$1}')
    .replace(/\\([A-Za-z]+) (?=[_^])/g, '\\$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Plain-text form for the places KaTeX cannot go — a native `<option>`, an
 * `aria-label`, a worked step. Scripts become unicode where a glyph exists and
 * stay readable otherwise (`f_beat` has no subscript "b").
 */
export function symbolText(value: string): string {
  const convert = (body: string, table: Record<string, string>) =>
    [...body].every((char) => table[char]) ? [...body].map((char) => table[char]).join('') : null;
  return value
    .replace(/_\{?([A-Za-z0-9+-]+)\}?/g, (match, body: string) => convert(body, SUBSCRIPT_TEXT) ?? match)
    .replace(/\^\{?([A-Za-z0-9+-]+)\}?/g, (match, body: string) => convert(body, SUPERSCRIPT_TEXT) ?? match);
}

export function escapeCsv(value: string | number): string {
  const text = String(value).replaceAll('"', '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

export function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function slugToLabel(slug: string): string {
  return slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
