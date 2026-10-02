import type { Metadata } from 'next';
import { HomeExperience } from '@/components/content/HomeExperience';
import { contentCounts } from '@/lib/content';
import { simulationMetas } from '@/lib/simulations';

export const metadata: Metadata = { title: 'PhysChem Lab', description: 'Bilingual equations, experiments and simulations for physics and chemistry learners.' };

export default function HomePage() {
  const counts = contentCounts();
  return <><HomeExperience counts={counts} simulations={simulationMetas} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'LearningResource', name: 'PhysChem Lab', description: 'A free bilingual physics and chemistry learning laboratory.', inLanguage: ['bn', 'en'], educationalLevel: 'Class 6–Honours', learningResourceType: 'interactive simulation and equation library', isAccessibleForFree: true }) }} /></>;
}
