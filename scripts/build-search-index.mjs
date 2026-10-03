import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'content');
const output = path.join(root, 'public', 'search-index.json');
const simulations = [
  ['projectile-motion', 'physics', 'Projectile motion', 'প্রক্ষেপণ গতি'],
  ['vector-addition', 'physics', 'Vector addition and parallelogram law', 'ভেক্টর যোগ ও সামান্তরিক সূত্র'],
  ['mass-spring-oscillator', 'physics', 'Mass–spring oscillator', 'স্প্রিং-ভর দোলক'],
  ['fluid-flow-bernoulli', 'physics', 'Fluid flow: continuity and Bernoulli', 'প্রবাহ, ধারাবাহিকতা ও বার্নৌলি'],
  ['wheatstone-bridge', 'physics', 'Wheatstone bridge', 'হুইটস্টোন ব্রিজ'],
  ['simple-pendulum', 'physics', 'Simple pendulum', 'সরল দোলক'],
  ['ohms-law-circuit', 'physics', "Ohm's law circuit", 'ওহমের সূত্র সার্কিট'],
  ['wave-interference', 'physics', 'Wave interference', 'তরঙ্গের ব্যতিচার'],
  ['young-double-slit', 'physics', 'Young’s double-slit experiment', 'ইয়ং-এর দ্বিচির ব্যতিচার'],
  ['newtons-second-law', 'physics', "Newton's second law", 'নিউটনের দ্বিতীয় সূত্র'],
  ['lens-ray-diagram', 'physics', 'Lens ray diagram', 'লেন্সের রশ্মি চিত্র'],
  ['acid-base-titration', 'chemistry', 'Acid–base titration', 'অ্যাসিড–বেস টাইট্রেশন'],
  ['ph-scale', 'chemistry', 'pH scale', 'pH স্কেল'],
  ['ideal-gas-law', 'chemistry', 'Ideal gas law', 'আদর্শ গ্যাস সূত্র'],
  ['molecule-viewer', 'chemistry', '3D molecule viewer', '3D অণু দর্শক'],
  ['reaction-rate-temperature', 'chemistry', 'Reaction rate vs temperature', 'তাপমাত্রা ও বিক্রিয়ার হার']
];

function filesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith('.mdx')).map((file) => path.join(dir, file));
}
function value(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match?.[1]?.replace(/^['"]|['"]$/g, '') ?? '';
}
const records = [];
for (const subject of ['physics', 'chemistry']) {
  for (const level of ['class-6-8', 'class-9-10', 'class-11-12', 'honours']) {
    for (const file of filesIn(path.join(contentRoot, subject, level))) {
      const text = fs.readFileSync(file, 'utf8');
      const type = value(text, 'type') || 'equation';
      const slug = value(text, 'slug');
      if (type === 'experiment') {
        records.push({ slug, kind: 'experiment', subject, title_en: value(text, 'title_en'), title_bn: value(text, 'title_bn'), description_en: value(text, 'aim'), description_bn: value(text, 'aim_bn'), href: `/experiments/${slug}`, tags: [] });
      } else {
        records.push({ slug, kind: 'equation', subject, title_en: value(text, 'title_en'), title_bn: value(text, 'title_bn'), description_en: value(text, 'summary_en') || value(text, 'derivation'), description_bn: value(text, 'summary_bn') || value(text, 'derivation_bn'), href: `/equations/${slug}`, tags: [] });
      }
    }
  }
}
const practicalCatalog = JSON.parse(fs.readFileSync(path.join(contentRoot, 'practical-topics.json'), 'utf8'));
for (const group of practicalCatalog.groups) {
  for (const topic of group.topics) {
    records.push({
      slug: topic.slug,
      kind: 'experiment',
      subject: group.subject,
      title_en: topic.title_en,
      title_bn: topic.title_bn,
      description_en: topic.note_en,
      description_bn: topic.note_bn,
      href: `/experiments#lab-${topic.slug}`,
      tags: ['practical', group.stage, topic.category_en]
    });
  }
}
for (const [slug, subject, title_en, title_bn] of simulations) {
  records.push({ slug, kind: 'simulation', subject, title_en, title_bn, description_en: 'Interactive browser simulation', description_bn: 'ইন্টার‌্যাক্টিভ ব্রাউজার সিমুলেশন', href: `/simulations/${slug}`, tags: [] });
}
const phetCatalog = JSON.parse(fs.readFileSync(path.join(root, 'content', 'phet-simulations.json'), 'utf8'));
const phetBySlug = new Map();
for (const subject of ['physics', 'chemistry']) {
  for (const simulation of phetCatalog[subject]) {
    const existing = phetBySlug.get(simulation.slug);
    if (existing) existing.subjects.push(subject);
    else phetBySlug.set(simulation.slug, { ...simulation, subjects: [subject] });
  }
}
for (const simulation of phetBySlug.values()) {
  const primarySubject = simulation.subjects.includes('physics') ? 'physics' : 'chemistry';
  records.push({
    slug: `phet-${simulation.slug}`,
    kind: 'simulation',
    subject: primarySubject,
    title_en: simulation.title,
    title_bn: simulation.title,
    description_en: 'Official PhET HTML5 simulation',
    description_bn: 'PhET-এর অফিসিয়াল HTML5 সিমুলেশন',
    href: `/simulations/phet/${simulation.slug}`,
    tags: ['PhET', 'HTML5', ...simulation.subjects]
  });
}
// The Elementa Chemistry Lab lives in /data, not in MDX, so it is indexed from JSON.
const labExperiments = JSON.parse(fs.readFileSync(path.join(root, 'data', 'experiments.json'), 'utf8')).experiments;
records.push({
  slug: 'elementa-chemistry-lab',
  kind: 'lab',
  subject: 'chemistry',
  title_en: 'Elementa Chemistry Lab',
  title_bn: 'এলিমেন্টা কেমিস্ট্রি ল্যাব',
  description_en: 'Virtual chemistry bench: drag chemicals into glassware, heat them, watch reactions, pH and indicators.',
  description_bn: 'ভার্চুয়াল কেমিস্ট্রি বেঞ্চ: রাসায়নিক টেনে পাত্রে দিন, গরম করুন, বিক্রিয়া, pH ও নির্দেশকের রঙ দেখুন।',
  href: '/lab/chemistry',
  tags: ['virtual lab', 'drag and drop', 'reactions', 'pH']
});
records.push({
  slug: 'lab-guided-experiments',
  kind: 'lab',
  subject: 'chemistry',
  title_en: 'Guided chemistry experiments',
  title_bn: 'গাইডেড কেমিস্ট্রি পরীক্ষা',
  description_en: `${labExperiments.length} walkthroughs that set the virtual bench up for you and tick each step off.`,
  description_bn: `${labExperiments.length}টি ধাপে ধাপে পরীক্ষা, যেগুলো ভার্চুয়াল বেঞ্চ সাজিয়ে দেয় এবং প্রতিটি ধাপ যাচাই করে।`,
  href: '/lab/experiments',
  tags: ['experiments', 'guided']
});
for (const experiment of labExperiments) {
  records.push({
    slug: `lab-${experiment.slug}`,
    kind: 'lab',
    subject: 'chemistry',
    title_en: experiment.title_en,
    title_bn: experiment.title_bn,
    description_en: experiment.aim_en,
    description_bn: experiment.aim_bn,
    href: `/lab/experiments/${experiment.slug}`,
    tags: ['lab', experiment.level, ...experiment.tags]
  });
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(records, null, 2));
console.log(`Built ${records.length} search records → ${path.relative(root, output)}`);
