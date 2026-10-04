// Usage: node scripts/check-math.mjs
// Renders every relation in the content tree with KaTeX and reports formatting
// that a reader cannot parse: invalid LaTeX, raw LaTeX left in prose without
// `$...$` delimiters, backticked maths in MDX bodies, Bangla numerals inside a
// maths segment, and `\quad` chains that should be split over separate lines.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import katex from 'katex';

const contentRoot = path.join(process.cwd(), 'content');
const problems = [];
let checked = 0;

const MATH_SEGMENT = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;
const RAW_LATEX = /\\(?:frac|sqrt|quad|log|mathrm|text|Delta|alpha|beta|gamma|theta|lambda|omega|pi|rho|mu|nu|tau|eta|kappa|sigma|epsilon|infty|times|approx|propto|partial|sum|int|begin|left|right|boldsymbol|mathbf|mathcal|circ|le|ge|ll|gg|to|Rightarrow|hbar)|[_^]\{/;
const BANGLA_DIGIT = /[০-৯]/;
const PROSE_FIELDS = [
  'derivation', 'derivation_bn', 'summary_en', 'summary_bn', 'reference_note_en', 'reference_note_bn',
  'aim', 'aim_bn', 'theory', 'theory_bn', 'calculation', 'calculation_bn',
  'note_en', 'note_bn'
];

function render(latex, where) {
  checked += 1;
  if (/\\\\[A-Za-z,;]/.test(latex)) {
    problems.push(`${where}: double-escaped LaTeX (YAML single quotes keep both backslashes) — ${JSON.stringify(latex)}`);
  }
  try {
    katex.renderToString(latex, { displayMode: true, throwOnError: true, strict: false });
  } catch (error) {
    problems.push(`${where}: KaTeX cannot render ${JSON.stringify(latex)} — ${error.message.split('\n')[0]}`);
    return;
  }
  if (BANGLA_DIGIT.test(latex)) {
    problems.push(`${where}: Bangla numeral inside maths ${JSON.stringify(latex)} — keep digits Latin inside a relation`);
  }
  if (/[;,]\s*\\q?quad/.test(latex) && !latex.includes('\\begin{aligned}')) {
    problems.push(`${where}: \\quad chain should be an aligned block — ${JSON.stringify(latex)}`);
  }
}

function checkProse(value, where) {
  if (typeof value !== 'string' || !value) return;
  const withoutMath = value.replace(MATH_SEGMENT, ' ');
  if (RAW_LATEX.test(withoutMath)) {
    problems.push(`${where}: raw LaTeX in prose without $…$ delimiters — ${JSON.stringify(withoutMath.slice(0, 120))}`);
  }
}

function walkMdx(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walkMdx(full) : entry.name.endsWith('.mdx') ? [full] : [];
  });
}

for (const file of walkMdx(contentRoot)) {
  const where = path.relative(process.cwd(), file);
  const source = fs.readFileSync(file, 'utf8');
  const parsed = matter(source);
  const data = parsed.data;

  for (const field of PROSE_FIELDS) checkProse(data[field], `${where} ${field}`);
  for (const step of data.derivation_steps ?? []) {
    checkProse(step.step_en, `${where} step_en`);
    checkProse(step.step_bn, `${where} step_bn`);
    if (step.latex) render(step.latex, `${where} derivation_steps.latex`);
  }
  for (const formula of data.reference_formulas ?? []) {
    if (formula.latex) render(formula.latex, `${where} reference_formulas.latex`);
    checkProse(formula.note_en, `${where} reference note_en`);
    checkProse(formula.note_bn, `${where} reference note_bn`);
  }
  if (data.latex) render(data.latex, `${where} latex`);
  // Every `$…$` span is rendered wherever it lives — a derived bullet, a
  // derivation step, a viva answer, a formula note or a variable name.
  const renderSpans = (value, label) => {
    if (typeof value === 'string') {
      for (const segment of value.match(MATH_SEGMENT) ?? []) {
        render(segment.replace(/^\$+|\$+$/g, ''), `${where} ${label}`);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => renderSpans(item, `${label}[${index}]`));
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) renderSpans(item, `${label}.${key}`);
    }
  };
  for (const [key, value] of Object.entries(data)) {
    if (key === 'latex' || key === 'body') continue;
    renderSpans(value, key);
  }

  const body = parsed.content ?? '';
  for (const segment of body.match(MATH_SEGMENT) ?? []) {
    render(segment.replace(/^\$+|\$+$/g, ''), `${where} body maths`);
  }
  for (const code of body.match(/`[^`\n]+`/g) ?? []) {
    const payload = code.slice(1, -1);
    if (RAW_LATEX.test(payload)) {
      problems.push(`${where}: backticked LaTeX in body should be $$…$$ — ${code.slice(0, 100)}`);
    }
  }
}

const practical = JSON.parse(fs.readFileSync(path.join(contentRoot, 'practical-topics.json'), 'utf8'));
for (const group of practical.groups) {
  for (const topic of group.topics) {
    const where = `practical-topics.json ${topic.slug}`;
    if (topic.equation) render(topic.equation, `${where} equation`);
    for (const field of ['note_en', 'note_bn']) checkProse(topic[field], `${where} ${field}`);
    for (const field of ['points_en', 'points_bn']) {
      for (const point of topic[field] ?? []) {
        checkProse(point, `${where} ${field}`);
        for (const segment of String(point).match(MATH_SEGMENT) ?? []) {
          render(segment.replace(/^\$+|\$+$/g, ''), `${where} ${field} maths`);
        }
      }
    }
  }
}

if (problems.length) {
  for (const problem of problems.slice(0, 60)) console.error(problem);
  console.error(`${problems.length} maths formatting problem(s) in ${checked} rendered relation(s).`);
  process.exitCode = 1;
} else {
  console.log(`${checked} relations render cleanly and no raw LaTeX is left in prose.`);
}
