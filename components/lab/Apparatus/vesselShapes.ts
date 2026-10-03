import type { VesselShape } from '@/engine/types';

/**
 * Glassware geometry. Every shape is drawn inside a 100 × 170 viewBox and describes:
 *
 * - `glass`  the outer outline (stroked),
 * - `cavity` the inside of the vessel, used as a clip path so a plain rectangle can
 *   stand in for the liquid and still take the silhouette of the glass,
 * - `box`    the bounding box of that cavity (the liquid rectangle is placed in it),
 * - `rimY`   where the mouth sits, so smoke and steam know where to start.
 */

export type ShapeGeometry = {
  viewBox: { width: number; height: number };
  glass: string;
  cavity: string;
  box: { x: number; y: number; width: number; height: number };
  rimY: number;
  rim: { cx: number; rx: number } | null;
  base: string | null;
  graduations: { x: number; count: number; width: number } | null;
  highlight: string;
};

export const vesselShapes: Record<VesselShape, ShapeGeometry> = {
  tube: {
    viewBox: { width: 100, height: 170 },
    glass: 'M38 22 L38 126 Q38 140 50 140 Q62 140 62 126 L62 22',
    cavity: 'M41 25 L41 125 Q41 137 50 137 Q59 137 59 125 L59 25 Z',
    box: { x: 41, y: 25, width: 18, height: 112 },
    rimY: 22,
    rim: { cx: 50, rx: 12 },
    base: null,
    graduations: { x: 59, count: 4, width: 5 },
    highlight: 'M44 34 L44 118'
  },
  beaker: {
    viewBox: { width: 100, height: 170 },
    glass: 'M22 34 L22 132 Q22 141 31 141 L69 141 Q78 141 78 132 L78 34 M22 34 L13 27',
    cavity: 'M25 36 L25 131 Q25 138 32 138 L68 138 Q75 138 75 131 L75 36 Z',
    box: { x: 25, y: 36, width: 50, height: 102 },
    rimY: 34,
    rim: { cx: 50, rx: 28 },
    base: null,
    graduations: { x: 27, count: 5, width: 9 },
    highlight: 'M31 46 L31 128'
  },
  flask: {
    viewBox: { width: 100, height: 170 },
    glass: 'M42 26 L42 62 L20 130 Q17 141 29 141 L71 141 Q83 141 80 130 L58 62 L58 26',
    cavity: 'M45 29 L45 63 L24 129 Q22 137 31 137 L69 137 Q78 137 76 129 L55 63 L55 29 Z',
    box: { x: 22, y: 29, width: 56, height: 108 },
    rimY: 26,
    rim: { cx: 50, rx: 9 },
    base: null,
    graduations: { x: 40, count: 3, width: 7 },
    highlight: 'M46 40 L46 60 L30 122'
  },
  cylinder: {
    viewBox: { width: 100, height: 170 },
    glass: 'M34 20 L34 132 Q34 140 42 140 L58 140 Q66 140 66 132 L66 20',
    cavity: 'M37 23 L37 131 Q37 137 43 137 L57 137 Q63 137 63 131 L63 23 Z',
    box: { x: 37, y: 23, width: 26, height: 114 },
    rimY: 20,
    rim: { cx: 50, rx: 16 },
    base: 'M26 140 L74 140 L74 147 L26 147 Z',
    graduations: { x: 39, count: 10, width: 8 },
    highlight: 'M42 32 L42 126'
  },
  burette: {
    viewBox: { width: 100, height: 170 },
    glass: 'M44 14 L44 112 L44 118 L48 124 L48 138 L52 138 L52 124 L56 118 L56 112 L56 14 M40 112 L60 112 L60 120 L40 120 Z',
    cavity: 'M46 17 L46 112 L49 122 L49 136 L51 136 L51 122 L54 112 L54 17 Z',
    box: { x: 46, y: 17, width: 8, height: 119 },
    rimY: 14,
    rim: { cx: 50, rx: 6 },
    base: null,
    graduations: { x: 46, count: 10, width: 4 },
    highlight: 'M48 24 L48 108'
  },
  jar: {
    viewBox: { width: 100, height: 170 },
    glass: 'M26 34 L26 132 Q26 141 35 141 L65 141 Q74 141 74 132 L74 34 M20 30 L80 30 L80 36 L20 36 Z',
    cavity: 'M29 37 L29 131 Q29 138 36 138 L64 138 Q71 138 71 131 L71 37 Z',
    box: { x: 29, y: 37, width: 42, height: 101 },
    rimY: 30,
    rim: { cx: 50, rx: 30 },
    base: null,
    graduations: null,
    highlight: 'M35 48 L35 126'
  },
  dish: {
    viewBox: { width: 100, height: 170 },
    glass: 'M14 100 Q50 152 86 100 M14 100 Q50 116 86 100',
    cavity: 'M18 102 Q50 116 82 102 Q50 146 18 102 Z',
    box: { x: 18, y: 102, width: 64, height: 36 },
    rimY: 100,
    rim: null,
    base: null,
    graduations: null,
    highlight: 'M26 110 Q50 122 74 110'
  }
};

/** Non-vessel apparatus get a small glyph in the shelf rather than a full drawing. */
export const apparatusGlyphPaths: Record<string, string> = {
  burner: 'M44 12 q6 10 0 18 q-8 10 0 20 q10 -8 6 -20 q-2 -10 -6 -18 Z M36 54 h28 v10 h-28 Z M44 64 h12 v24 h-12 Z',
  tripod: 'M20 30 h60 M30 30 L18 78 M70 30 L82 78 M50 30 L50 78 M22 78 h56',
  thermometer: 'M46 12 h8 v46 a10 10 0 1 1 -8 0 Z M50 62 a5 5 0 1 0 0.1 0',
  dropper: 'M44 10 h12 v8 h-12 Z M46 18 h8 v26 h-8 Z M46 44 l4 16 l4 -16 Z',
  spatula: 'M46 10 h8 v34 h-8 Z M40 44 h20 v8 h-20 Z M48 52 h4 v26 h-4 Z',
  delivery: 'M20 20 q0 30 20 34 q20 4 20 30 M20 20 h8 M60 84 h-8',
  holder: 'M22 30 h40 a10 10 0 0 1 0 20 h-40 Z M62 40 h20 M46 50 v28',
  cell: 'M24 24 h20 v52 h-20 Z M56 24 h20 v52 h-20 Z M44 40 h12 M30 76 v14 M70 76 v14 M34 34 h12 M34 44 h12 M62 34 h8 M62 44 h8'
};
