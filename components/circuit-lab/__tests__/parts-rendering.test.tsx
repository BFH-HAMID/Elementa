import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PartArt } from '../parts/renderers';
import { PARTS } from '../parts/registry';
import type { PlacedComponent } from '../types';

describe('hardware artwork', () => {
  it('renders a usable SVG thumbnail for every part in the palette', () => {
    for (const def of PARTS) {
      const comp: PlacedComponent = {
        id: `preview-${def.id}`,
        partId: def.id,
        x: 0,
        y: 0,
        rotation: 0,
        flipH: false,
        props: { ...def.defaults },
        state: {}
      };
      const markup = renderToStaticMarkup(<svg viewBox={`-8 -8 ${def.w + 16} ${def.h + 16}`}><PartArt def={def} comp={comp} /></svg>);
      expect(markup.length, def.id).toBeGreaterThan(40);
      expect(markup, def.id).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});
