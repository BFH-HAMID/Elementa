import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BenchInstrumentItem } from '@/components/lab/BenchInstrumentItem';
import { labInstruments } from '@/lib/labInstruments';

/**
 * A lab instrument stands on the bench as the instrument itself: the shared
 * artwork plus a small caption. It must never grow a text box — no input, no
 * readout, no badge strip.
 */
function render(instrumentId: string, locale: 'bn' | 'en' = 'bn') {
  return renderToStaticMarkup(
    <BenchInstrumentItem
      item={{ id: `bench-${instrumentId}`, instrumentId, x: 0, y: 0, rotation: 0, linkedVesselId: null }}
      locale={locale}
      selected={false}
      dragging={false}
      onPointerDown={() => undefined}
      onSelect={() => undefined}
      onRemove={() => undefined}
      onDuplicate={() => undefined}
      onRotate={() => undefined}
    />
  );
}

describe('chemistry bench instruments', () => {
  it('renders every catalogue instrument as artwork', () => {
    for (const instrument of labInstruments) {
      const html = render(instrument.id);
      expect(html).toContain(`data-equipment-art="${instrument.id}"`);
    }
  });

  it('never wraps an instrument in a text box', () => {
    for (const instrument of labInstruments) {
      const html = render(instrument.id);
      expect(html).not.toMatch(/<input|<textarea/);
      // No readouts such as a volume or a temperature badge.
      expect(html).not.toMatch(/[0-9]+\.[0-9]+\/[0-9]+ মিলি/);
    }
  });

  it('names the instrument in Bangla and English', () => {
    const bn = render('digital-multimeter', 'bn');
    expect(bn).toContain('ডিজিটাল মাল্টিমিটার');
    const en = render('digital-multimeter', 'en');
    expect(en).toContain('Digital Multimeter');
  });
});
