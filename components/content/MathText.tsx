'use client';

import { Fragment, useMemo } from 'react';
import { Tex } from './Tex';

/**
 * Content authors write relations inside prose with `$...$` (inline) or
 * `$$...$$` (display). Frontmatter fields such as `theory`, `calculation` and
 * the practical-topic bullets are rendered as plain strings elsewhere, which
 * left raw LaTeX like `1/[A]-1/[A]_0=kt;\quad...` on screen. `MathText` splits
 * those segments and hands each one to KaTeX, so a sentence can mix Bangla
 * prose with properly typeset mathematics.
 */

export type MathSegment = { kind: 'text' | 'inline' | 'display'; value: string };

const SEGMENT_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export function splitMathSegments(source: string): MathSegment[] {
  return source
    .split(SEGMENT_PATTERN)
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        return { kind: 'display' as const, value: part.slice(2, -2).trim() };
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        return { kind: 'inline' as const, value: part.slice(1, -1).trim() };
      }
      return { kind: 'text' as const, value: part.replace(/\\\$/g, '$') };
    });
}

/** True when a string carries at least one maths segment. */
export function hasMath(source: string): boolean {
  return splitMathSegments(source).some((segment) => segment.kind !== 'text');
}

export function MathText({ text, className }: { text: string; className?: string }) {
  const segments = useMemo(() => splitMathSegments(text), [text]);
  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.kind === 'text' ? (
          <Fragment key={`${segment.kind}-${index}`}>{segment.value}</Fragment>
        ) : (
          <Tex key={`${segment.kind}-${index}`} latex={segment.value} display={segment.kind === 'display'} />
        )
      )}
    </span>
  );
}
