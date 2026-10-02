import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'content');
const output = path.join(root, 'public', 'search-index.json');
const simulations = [
  ['projectile-motion', 'physics', 'Projectile motion', 'প্রক্ষেপণ গতি'],
  ['simple-pendulum', 'physics', 'Simple pendulum', 'সরল দোলক'],
  ['ohms-law-circuit', 'physics', "Ohm's law circuit", 'ওহমের সূত্র সার্কিট'],
  ['wave-interference', 'physics', 'Wave interference', 'তরঙ্গের ব্যতিচার'],
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
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(records, null, 2));
console.log(`Built ${records.length} search records → ${path.relative(root, output)}`);
