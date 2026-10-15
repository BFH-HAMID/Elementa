import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { allChemPracticalModels } from '@/engine/chemPracticals';
import { getExperiment } from '@/lib/labData';
import { ChemPracticalSimulator } from '@/components/lab/practicals/ChemPracticalSimulator';
import { ChemDataPlot } from '@/components/lab/practicals/ChemDataPlot';

/** The whole simulator page renders for every practical, in both languages, without bad values. */
function render(slug: string, locale: 'bn' | 'en') {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <ChemPracticalSimulator slug={slug} onNavigate={() => undefined} onOpenBench={() => undefined} />
    </NextIntlClientProvider>
  );
}

describe('chemistry practical simulator UI', () => {
  for (const model of allChemPracticalModels) {
    it(`renders ${model.slug} in Bangla and English`, () => {
      const exp = getExperiment(model.slug)!;
      const en = render(model.slug, 'en');
      expect(en).toContain(exp.title_en.replace(/&/g, '&amp;').replace(/'/g, '&#x27;'));
      expect(en).toContain('Record reading');
      expect(en).not.toMatch(/NaN|Infinity|undefined/);
      const bn = render(model.slug, 'bn');
      expect(bn).toContain('পাঠ রেকর্ড করো');
      expect(bn).not.toMatch(/NaN|Infinity|undefined/);
      // every observation-table column heading is there (table is empty, so check the controls/tasks instead)
      for (const task of model.tasks ?? []) expect(en).toContain(task.en.replace(/&/g, '&amp;'));
    });
  }

  it('plots recorded rows and asks for more when there are fewer than two', () => {
    const model = allChemPracticalModels.find((m) => m.slug === 'acid-base-neutralisation')!;
    const empty = renderToStaticMarkup(<ChemDataPlot graph={model.graph!} columns={model.columns} rows={[{ vb: 0, ph: 0 }]} bn={false} />);
    expect(empty).toContain('at least two readings');
    const plotted = renderToStaticMarkup(
      <ChemDataPlot
        graph={model.graph!}
        columns={model.columns}
        rows={[
          { vb: 0, ph: 0.1 },
          { vb: 20, ph: 1 },
          { vb: 25, ph: 7 },
          { vb: 30, ph: 13 }
        ]}
        bn
      />
    );
    expect((plotted.match(/<circle/g) ?? []).length).toBe(4);
    expect(plotted).not.toMatch(/NaN|Infinity/);
  });
});
