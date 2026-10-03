// Usage: node scripts/audit-honours-content.mjs. Validates coverage and references.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const entries = ['physics', 'chemistry'].flatMap((subject) =>
  fs.readdirSync(`content/${subject}/honours`)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => ({ subject, file: `content/${subject}/honours/${name}`,
      data: matter(fs.readFileSync(`content/${subject}/honours/${name}`, 'utf8')).data })));
const equations = entries.filter(({ data }) => data.type === 'equation');
const labs = entries.filter(({ data }) => data.type === 'experiment');
const labSlugs = new Set(['physics', 'chemistry'].flatMap((subject) => ['class-6-8', 'class-9-10', 'class-11-12', 'honours'].flatMap((level) => {
  const directory = `content/${subject}/${level}`;
  return fs.existsSync(directory) ? fs.readdirSync(directory).filter((name) => name.endsWith('.mdx'))
    .map((name) => matter(fs.readFileSync(path.join(directory, name), 'utf8')).data)
    .filter((entry) => entry.type === 'experiment').map((entry) => entry.slug) : [];
})));
const quizSlugs = new Set(fs.readdirSync('content/quizzes').filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(fs.readFileSync(path.join('content/quizzes', name), 'utf8')).slug));
let failures = 0;
for (const { file, data } of equations) {
  if (!Array.isArray(data.derivation_steps) || data.derivation_steps.length < 2 || !data.derivation_bn || !data.latex) {
    console.error('Incomplete bilingual derivation/formula:', file); failures++;
  }
  if (data.experiment && !labSlugs.has(data.experiment)) {
    console.error('Broken lab reference:', file, data.experiment); failures++;
  }
  if (!quizSlugs.has(`honours-${data.slug}`)) {
    console.error('Missing topic quiz:', file); failures++;
  }
  if (!matter(fs.readFileSync(file, 'utf8')).content.includes('### Experimental context / পরীক্ষাগত সংযোগ')) {
    console.error('Missing honest experiment context:', file); failures++;
  }
}
for (const { file, data } of labs) {
  for (const field of ['aim_bn', 'theory_bn', 'calculation_bn', 'apparatus_bn', 'procedure_bn',
    'precautions_bn', 'sources_of_error_bn', 'viva', 'observation_table']) {
    if (!data[field] || (Array.isArray(data[field]) && !data[field].length)) {
      console.error(`Incomplete lab ${field}:`, file); failures++;
    }
  }
  if (!quizSlugs.has(`honours-${data.slug}`)) {
    console.error('Missing lab quiz:', file); failures++;
  }
}
console.log(`${equations.length} Honours equations (${equations.filter(({ data }) => data.experiment).length} with linked labs), ${labs.length} lab guides, ${quizSlugs.size} site quizzes; ${failures} structural issues. Scientific peer review and the remaining direct-lab gaps are outside this check.`);
process.exitCode = failures ? 1 : 0;
