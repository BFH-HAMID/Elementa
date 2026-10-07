import type { MetadataRoute } from 'next';
import { getEquationEntries, getExperimentEntries, getQuizEntries } from '@/lib/content';
import { guidedExperiments } from '@/lib/labData';
import { locales } from '@/i18n/routing';
import { phetSimulationMetas } from '@/lib/phet-simulations';
import { simulationMetas } from '@/lib/simulations';

const base = 'https://physchem-lab.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ['', '/physics', '/chemistry', '/equations', '/experiments', '/simulations', '/quiz', '/constants', '/bookmarks', '/about', '/developer', '/lab/chemistry', '/lab/experiments'];
  const dynamic = [
    ...getEquationEntries().map((item) => `/equations/${item.slug}`),
    ...getExperimentEntries().map((item) => `/experiments/${item.slug}`),
    ...simulationMetas.map((item) => `/simulations/${item.slug}`),
    ...phetSimulationMetas.map((item) => `/simulations/phet/${item.slug}`),
    ...getQuizEntries().map((item) => `/quiz/${item.slug}`),
    ...guidedExperiments.map((item) => `/lab/experiments/${item.slug}`)
  ];

  return locales.flatMap((locale) => [...fixed, ...dynamic].map((path) => ({
    url: `${base}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7
  })));
}
