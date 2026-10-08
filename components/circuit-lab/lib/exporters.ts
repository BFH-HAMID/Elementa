/**
 * Share links, JSON files and picture export. Everything runs in the browser:
 * no server, no paid APIs. PNG is produced by drawing the bench's SVG onto a canvas.
 */

import { encodeShared } from '@/store/circuitStore';
import type { CircuitProject } from '../types';

export const SHARE_PARAM = 'circuit';

export function shareUrl(project: CircuitProject): string {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
  return `${base}?${SHARE_PARAM}=${encodeShared(project)}`;
}

export function projectFileText(project: CircuitProject): string {
  return JSON.stringify(project, null, 2);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Standalone SVG markup of the bench, cropped to its contents. */
export function benchSvgMarkup(svg: SVGSVGElement, box: { x: number; y: number; w: number; h: number }): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const pad = 40;
  clone.removeAttribute('id');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${box.w + pad * 2} ${box.h + pad * 2}`);
  clone.setAttribute('width', String(Math.round(box.w + pad * 2)));
  clone.setAttribute('height', String(Math.round(box.h + pad * 2)));
  clone.setAttribute('style', 'color:#14283d;background:#eef3f8;font-family:system-ui,sans-serif');
  // Drop interaction-only layers (zoom buttons, minimap are outside the svg already).
  clone.querySelectorAll('[data-addbend]').forEach((n) => n.remove());
  clone.querySelectorAll('rect[fill="url(#circuit-grid)"]').forEach((n) => n.remove());
  const g = clone.querySelector(':scope > g');
  if (g) g.removeAttribute('transform');
  const xml = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

export function exportSvg(svg: SVGSVGElement, box: { x: number; y: number; w: number; h: number }, name: string) {
  const markup = benchSvgMarkup(svg, box);
  downloadBlob(`${safeName(name)}.svg`, new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
}

export async function exportPng(svg: SVGSVGElement, box: { x: number; y: number; w: number; h: number }, name: string): Promise<void> {
  const markup = benchSvgMarkup(svg, box);
  const width = Math.round(box.w + 80);
  const height = Math.round(box.h + 80);
  const scale = 2;
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not rasterise the bench'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#eef3f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
    if (blob) downloadBlob(`${safeName(name)}.png`, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function safeName(name: string): string {
  return (name || 'circuit').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'circuit';
}
