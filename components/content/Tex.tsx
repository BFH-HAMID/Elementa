'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

export function Tex({ latex, display = true, className }: { latex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: display, throwOnError: false, strict: false, trust: false }), [latex, display]);
  return <span className={className} aria-label={`Equation ${latex}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
