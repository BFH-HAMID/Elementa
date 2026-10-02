import catalog from '@/content/phet-simulations.json';

export type PhetSubject = 'physics' | 'chemistry';

type CatalogEntry = { slug: string; title: string };
export type PhetSimulationMeta = {
  slug: string;
  title: string;
  subjects: PhetSubject[];
  provider: 'PhET Interactive Simulations';
  compatibility: 'HTML5';
};

const subjects: PhetSubject[] = ['physics', 'chemistry'];
const metaBySlug = new Map<string, PhetSimulationMeta>();

for (const subject of subjects) {
  for (const item of catalog[subject] as CatalogEntry[]) {
    const existing = metaBySlug.get(item.slug);
    if (existing) {
      if (!existing.subjects.includes(subject)) existing.subjects.push(subject);
      continue;
    }

    metaBySlug.set(item.slug, {
      ...item,
      subjects: [subject],
      provider: 'PhET Interactive Simulations',
      compatibility: 'HTML5'
    });
  }
}

export const phetSimulationMetas = Array.from(metaBySlug.values()).sort((a, b) => a.title.localeCompare(b.title));
export const phetSimulationCounts = {
  physics: catalog.physics.length,
  chemistry: catalog.chemistry.length,
  unique: phetSimulationMetas.length
};

export function getPhetSimulationMeta(slug: string): PhetSimulationMeta | undefined {
  return metaBySlug.get(slug);
}

export function getPhetSimulationsBySubject(subject: PhetSubject): PhetSimulationMeta[] {
  return phetSimulationMetas.filter((simulation) => simulation.subjects.includes(subject));
}

export function phetEmbedUrl(slug: string): string {
  return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_all.html`;
}

export function phetThumbnailUrl(slug: string): string {
  return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}-420.png`;
}
