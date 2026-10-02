import type { Metadata } from 'next';
import { EquationLibrary } from '@/components/content/EquationLibrary';
import { getEquationEntries } from '@/lib/content';

export const metadata: Metadata = { title: 'Equations', description: 'Searchable bilingual physics and chemistry equations with calculators.' };

export default function EquationsPage() {
  const equations = getEquationEntries();
  return <section className="page-shell section-space"><div className="mb-8 max-w-3xl"><p className="eyebrow">PhysChem Lab · Reference</p><h1 className="display-title mt-3">সমীকরণ <span className="text-physics-600 dark:text-physics-200">/ Equations</span></h1><p className="mt-4 text-base leading-7 muted">A searchable shelf of formula notes and bilingual chapter sheets, with calculators for supported models.</p></div><EquationLibrary equations={equations} /></section>;
}
