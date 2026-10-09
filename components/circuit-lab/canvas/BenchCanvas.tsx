'use client';

/**
 * The bench: an SVG workspace with pan/zoom, selection, drag-to-move, pin-to-pin
 * wiring with bendable waypoints, pin hover tooltips, a context menu, current-flow
 * animation and a minimap. Rendering is pure SVG + memoised React; all state
 * lives in the circuit store.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { Copy, FlipHorizontal2, RotateCw, Trash2, Palette, Plus, Minus } from 'lucide-react';
import { useCircuitStore } from '@/store/circuitStore';
import { benchBounds, clampViewport, dist, pinWorldPos, screenToWorld, wireMidpoint, wirePath, zoomAt, type Point, type Viewport } from '../geometry';
import { getPart } from '../parts/registry';
import { PartArt, WIRE_COLORS } from '../parts/renderers';
import { snapPositions } from '../lib/snap';
import { useCircuitI18n } from '../lib/i18n';
import { cn } from '@/lib/utils';
import type { PartDef, PinDef, PlacedComponent, PlacedWire, SimFrame, WireColor, WireEndpoint } from '../types';

export const PART_DRAG_MIME = 'application/x-elementa-circuit-part';
const PIN_HIT = 7;

interface PinIndexEntry {
  compId: string;
  pinId: string;
  x: number;
  y: number;
  func: string;
  label: string;
}

type Drag =
  | { kind: 'pan'; start: Point; vp: Viewport }
  | { kind: 'move'; start: Point; origins: Record<string, Point>; pushed: boolean; moved: boolean }
  | { kind: 'wire'; from: WireEndpoint; start: Point; end: Point }
  | { kind: 'marquee'; start: Point; end: Point; additive: boolean }
  | { kind: 'waypoint'; wireId: string; index: number; pushed: boolean }
  | { kind: 'pinch'; ids: [number, number]; dist: number; vp: Viewport };

export function BenchCanvas({ frame, onFit }: { frame: SimFrame | null; onFit: (api: { fit: () => void }) => void }) {
  const { t } = useCircuitI18n();
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const selectedComps = useCircuitStore((s) => s.selectedComps);
  const selectedWires = useCircuitStore((s) => s.selectedWires);
  const viewport = useCircuitStore((s) => s.viewport);
  const tool = useCircuitStore((s) => s.tool);
  const snap = useCircuitStore((s) => s.snap);
  const showFlow = useCircuitStore((s) => s.showFlow);
  const running = useCircuitStore((s) => s.running);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [hoverPin, setHoverPin] = useState<{ compId: string; pinId: string } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; wireId?: string; compId?: string; at: Point } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const longPress = useRef<number | null>(null);

  const setDragBoth = useCallback((d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  }, []);

  // Size tracking.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(200, r.width), h: Math.max(200, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Space toggles temporary pan mode.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) setSpaceDown(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const defs = useMemo(() => {
    const m = new Map<string, PartDef>();
    for (const c of components) {
      const d = getPart(c.partId);
      if (d) m.set(c.id, d);
    }
    return m;
  }, [components]);

  const compById = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);

  /** Pin world positions for everything on the bench. */
  const pinIndex = useMemo(() => {
    const out: PinIndexEntry[] = [];
    for (const c of components) {
      const d = defs.get(c.id);
      if (!d) continue;
      for (const pin of d.pins) {
        const p = pinWorldPos(c, d, pin);
        out.push({ compId: c.id, pinId: pin.id, x: p.x, y: p.y, func: pin.func ?? pin.label, label: pin.label });
      }
    }
    return out;
  }, [components, defs]);

  const pinPos = useCallback(
    (ep: WireEndpoint | null): Point | null => {
      if (!ep) return null;
      const d = defs.get(ep.compId);
      const c = compById.get(ep.compId);
      if (!d || !c) return null;
      const pin = d.pins.find((p) => p.id === ep.pinId);
      return pin ? pinWorldPos(c, d, pin) : null;
    },
    [defs, compById]
  );

  const connectedPins = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const w of wires) {
      for (const ep of [w.from, w.to]) {
        if (!ep) continue;
        const s = m.get(ep.compId) ?? new Set<string>();
        s.add(ep.pinId);
        m.set(ep.compId, s);
      }
    }
    return m;
  }, [wires]);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      const sx = clientX - (rect?.left ?? 0);
      const sy = clientY - (rect?.top ?? 0);
      return screenToWorld(viewport, sx, sy);
    },
    [viewport]
  );

  const toScreen = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
    },
    []
  );

  const nearestPin = useCallback(
    (w: Point, exclude?: WireEndpoint | null): PinIndexEntry | null => {
      let best: { d: number; e: PinIndexEntry } | null = null;
      for (const e of pinIndex) {
        if (exclude && exclude.compId === e.compId && exclude.pinId === e.pinId) continue;
        const d = dist(w, e);
        if (d <= PIN_HIT / Math.max(0.5, viewport.zoom) * 1.2 && (!best || d < best.d)) best = { d, e };
      }
      return best ? best.e : null;
    },
    [pinIndex, viewport.zoom]
  );

  const fit = useCallback(() => {
    const st = useCircuitStore.getState();
    const b = benchBounds(st.components, st.wires, new Map(st.components.map((c) => [c.partId, getPart(c.partId) ?? { w: 0, h: 0, pins: [] }])));
    const pad = 60;
    const zoom = Math.min(2, Math.max(0.2, Math.min(size.w / (b.w + pad * 2), size.h / (b.h + pad * 2))));
    useCircuitStore.getState().setViewport(clampViewport({ zoom, x: b.x - pad, y: b.y - pad }));
  }, [size.w, size.h]);

  useEffect(() => {
    onFit({ fit });
  }, [fit, onFit]);

  // ── Pointer handling ───────────────────────────────────────────────

  const beginDrag = (e: ReactPointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const pinEl = target.closest('[data-pin]') as SVGElement | null;
    const compEl = target.closest('[data-comp]') as SVGElement | null;
    const wireEl = target.closest('[data-wire]') as SVGElement | null;
    const handleEl = target.closest('[data-waypoint]') as SVGElement | null;
    const addEl = target.closest('[data-addbend]') as SVGElement | null;
    const st = useCircuitStore.getState();
    const world = toWorld(e.clientX, e.clientY);
    const screen = toScreen(e.clientX, e.clientY);
    setMenu(null);

    const panning = e.button === 1 || spaceDown || st.tool === 'pan';
    if (panning) {
      setDragBoth({ kind: 'pan', start: screen, vp: st.viewport });
      return;
    }
    if (e.button === 2) return; // context menu handled by onContextMenu

    if (handleEl) {
      const wireId = handleEl.getAttribute('data-wire-id') ?? '';
      const index = Number(handleEl.getAttribute('data-waypoint'));
      setDragBoth({ kind: 'waypoint', wireId, index, pushed: false });
      return;
    }
    if (addEl) {
      const wireId = addEl.getAttribute('data-addbend') ?? '';
      const w = st.wires.find((x) => x.id === wireId);
      if (w) {
        const a = pinPos(w.from) ?? world;
        const b = pinPos(w.to) ?? world;
        st.addWaypoint(wireId, Math.max(0, w.waypoints.length), wireMidpoint(a, b, w.waypoints));
      }
      return;
    }
    if (pinEl) {
      const compId = pinEl.closest('[data-comp]')?.getAttribute('data-comp') ?? compEl?.getAttribute('data-comp') ?? '';
      const pinId = pinEl.getAttribute('data-pin') ?? '';
      if (compId && pinId) {
        setDragBoth({ kind: 'wire', from: { compId, pinId }, start: world, end: world });
        return;
      }
    }
    if (wireEl) {
      const wireId = wireEl.getAttribute('data-wire') ?? '';
      st.toggleSelect(wireId, 'wire', e.shiftKey);
      return;
    }
    if (compEl) {
      const compId = compEl.getAttribute('data-comp') ?? '';
      if (!st.selectedComps.includes(compId) || e.shiftKey) st.toggleSelect(compId, 'comp', e.shiftKey);
      const ids = useCircuitStore.getState().selectedComps;
      const origins: Record<string, Point> = {};
      for (const id of ids) {
        const c = compById.get(id);
        if (c) origins[id] = { x: c.x, y: c.y };
      }
      setDragBoth({ kind: 'move', start: world, origins, pushed: false, moved: false });
      return;
    }
    // Empty bench: marquee select (or clear).
    setDragBoth({ kind: 'marquee', start: world, end: world, additive: e.shiftKey });
    if (!e.shiftKey) st.clearSelection();
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const ids = [...pointers.current.keys()] as [number, number];
      setDragBoth({ kind: 'pinch', ids, dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, vp: useCircuitStore.getState().viewport });
      if (longPress.current) window.clearTimeout(longPress.current);
      return;
    }
    if (e.pointerType === 'touch') {
      const { clientX, clientY } = e;
      if (longPress.current) window.clearTimeout(longPress.current);
      longPress.current = window.setTimeout(() => {
        if (dragRef.current) return;
        const screen = toScreen(clientX, clientY);
        setMenu({ x: screen.x, y: screen.y, at: toWorld(clientX, clientY) });
      }, 520);
    }
    beginDrag(e);
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = dragRef.current;
    const world = toWorld(e.clientX, e.clientY);
    const screen = toScreen(e.clientX, e.clientY);
    const st = useCircuitStore.getState();

    if (!d) {
      const hit = nearestPin(world);
      const next = hit ? { compId: hit.compId, pinId: hit.pinId } : null;
      if ((next?.compId ?? '') !== (hoverPin?.compId ?? '') || (next?.pinId ?? '') !== (hoverPin?.pinId ?? '')) setHoverPin(next);
      return;
    }
    if (longPress.current) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
    switch (d.kind) {
      case 'pinch': {
        const a = pointers.current.get(d.ids[0]);
        const b = pointers.current.get(d.ids[1]);
        if (!a || !b) break;
        const cur = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const rect = svgRef.current?.getBoundingClientRect();
        const ms = { x: mid.x - (rect?.left ?? 0), y: mid.y - (rect?.top ?? 0) };
        const zoomed = zoomAt(d.vp, ms.x, ms.y, cur / d.dist);
        st.setViewport(clampViewport(zoomed));
        break;
      }
      case 'pan': {
        const dx = (screen.x - d.start.x) / d.vp.zoom;
        const dy = (screen.y - d.start.y) / d.vp.zoom;
        st.setViewport(clampViewport({ zoom: d.vp.zoom, x: d.vp.x - dx, y: d.vp.y - dy }));
        break;
      }
      case 'move': {
        const dx = world.x - d.start.x;
        const dy = world.y - d.start.y;
        if (!d.moved && Math.hypot(dx, dy) < 2) break;
        if (!d.pushed) {
          st.pushHistory();
          d.pushed = true;
          d.moved = true;
        }
        const updates: Record<string, { x: number; y: number }> = {};
        for (const [id, o] of Object.entries(d.origins)) {
          const nx = o.x + dx;
          const ny = o.y + dy;
          updates[id] = snap ? { x: Math.round(nx / 5) * 5, y: Math.round(ny / 5) * 5 } : { x: nx, y: ny };
        }
        st.setPositions(updates);
        break;
      }
      case 'wire': {
        const hit = nearestPin(world, d.from);
        const end = hit ? { x: pinPos({ compId: hit.compId, pinId: hit.pinId })?.x ?? world.x, y: pinPos({ compId: hit.compId, pinId: hit.pinId })?.y ?? world.y } : world;
        setDragBoth({ ...d, end });
        setHoverPin(hit ? { compId: hit.compId, pinId: hit.pinId } : null);
        break;
      }
      case 'marquee':
        setDragBoth({ ...d, end: world });
        break;
      case 'waypoint': {
        const w = st.wires.find((x) => x.id === d.wireId);
        if (!w) break;
        if (!d.pushed) {
          st.pushHistory();
          setDragBoth({ ...d, pushed: true });
        }
        st.moveWaypoint(d.wireId, d.index, { x: snap ? Math.round(world.x / 5) * 5 : world.x, y: snap ? Math.round(world.y / 5) * 5 : world.y });
        break;
      }
      default:
        break;
    }
  };

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (longPress.current) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
    const d = dragRef.current;
    const st = useCircuitStore.getState();
    const world = toWorld(e.clientX, e.clientY);
    if (d?.kind === 'wire') {
      const hit = nearestPin(world, d.from);
      if (hit && !(hit.compId === d.from.compId && hit.pinId === d.from.pinId)) {
        st.addWire(d.from, { compId: hit.compId, pinId: hit.pinId }, 'blue');
      }
    } else if (d?.kind === 'move' && d.moved) {
      // Final snap to grid + holes for the selection (one history entry already pushed).
      const comps = st.components.filter((c) => d.origins[c.id]);
      const updates = snapPositions(comps, snap, true);
      st.setPositions(updates);
    } else if (d?.kind === 'marquee') {
      const x0 = Math.min(d.start.x, d.end.x);
      const x1 = Math.max(d.start.x, d.end.x);
      const y0 = Math.min(d.start.y, d.end.y);
      const y1 = Math.max(d.start.y, d.end.y);
      if (x1 - x0 > 3 || y1 - y0 > 3) {
        const inside: string[] = [];
        for (const c of st.components) {
          const def = getPart(c.partId);
          if (!def) continue;
          if (c.x >= x0 && c.y >= y0 && c.x + def.w <= x1 && c.y + def.h <= y1) inside.push(c.id);
        }
        st.select(d.additive ? [...new Set([...st.selectedComps, ...inside])] : inside, []);
      }
    }
    setDragBoth(null);
  };

  const onWheel = (e: ReactWheelEvent<SVGSVGElement>) => {
    const screen = toScreen(e.clientX, e.clientY);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const st = useCircuitStore.getState();
    st.setViewport(clampViewport(zoomAt(st.viewport, screen.x, screen.y, factor)));
  };

  const onContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const target = e.target as Element;
    const wireEl = target.closest('[data-wire]');
    const compEl = target.closest('[data-comp]');
    const screen = toScreen(e.clientX, e.clientY);
    const at = toWorld(e.clientX, e.clientY);
    const st = useCircuitStore.getState();
    if (wireEl) {
      const id = wireEl.getAttribute('data-wire') ?? '';
      st.select([], [id]);
      setMenu({ x: screen.x, y: screen.y, wireId: id, at });
    } else if (compEl) {
      const id = compEl.getAttribute('data-comp') ?? '';
      if (!st.selectedComps.includes(id)) st.select([id], []);
      setMenu({ x: screen.x, y: screen.y, compId: id, at });
    } else {
      setMenu({ x: screen.x, y: screen.y, at });
    }
  };

  const onDragOver = (e: React.DragEvent<SVGSVGElement>) => {
    if (e.dataTransfer.types.includes(PART_DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e: React.DragEvent<SVGSVGElement>) => {
    const partId = e.dataTransfer.getData(PART_DRAG_MIME);
    if (!partId) return;
    e.preventDefault();
    const def = getPart(partId);
    if (!def) return;
    const w = toWorld(e.clientX, e.clientY);
    const st = useCircuitStore.getState();
    const id = st.addComponent(partId, Math.round((w.x - def.w / 2) / 5) * 5, Math.round((w.y - def.h / 2) / 5) * 5);
    if (id) {
      const after = useCircuitStore.getState();
      const snapped = snapPositions(after.components.filter((c) => c.id === id), true, true);
      after.setPositions(snapped);
    }
  };

  // ── Derived render data ───────────────────────────────────────────

  const vb = viewport;
  const transform = `scale(${vb.zoom}) translate(${-vb.x} ${-vb.y})`;
  const hovered = hoverPin;
  const hoverEntry = hovered ? pinIndex.find((p) => p.compId === hovered.compId && p.pinId === hovered.pinId) : null;

  const wireDrawList = useMemo(() => {
    return wires
      .map((w) => {
        const a = pinPos(w.from);
        const b = pinPos(w.to);
        if (!a || !b) return null;
        return { w, a, b, d: wirePath(a, b, w.waypoints) };
      })
      .filter(Boolean) as { w: PlacedWire; a: Point; b: Point; d: string }[];
  }, [wires, pinPos]);

  const wireCurrent = (w: PlacedWire): number => {
    const fromI = w.from ? frame?.components[w.from.compId]?.current ?? 0 : 0;
    const toI = w.to ? frame?.components[w.to.compId]?.current ?? 0 : 0;
    return Math.max(fromI, toI);
  };

  const bounds = useMemo(() => benchBounds(components, wires, defs as Map<string, { w: number; h: number; pins: PinDef[] }>), [components, wires, defs]);

  const cursorClass = tool === 'pan' || spaceDown ? (drag?.kind === 'pan' ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[#eef3f8] dark:bg-[#0c141d]">
      <svg
        ref={svgRef}
        id="circuit-bench-svg"
        role="application"
        aria-label={t('title')}
        tabIndex={0}
        className={cn('h-full w-full select-none touch-none outline-none', cursorClass)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHoverPin(null)}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onKeyDown={() => undefined}
        onClick={() => setMenu(null)}
      >
        <defs>
          <pattern id="circuit-grid" width={10 * vb.zoom} height={10 * vb.zoom} patternUnits="userSpaceOnUse" x={(-vb.x * vb.zoom) % (10 * vb.zoom)} y={(-vb.y * vb.zoom) % (10 * vb.zoom)}>
            <circle cx={0} cy={0} r={0.7} className="fill-slate-400/50 dark:fill-slate-500/40" />
          </pattern>
        </defs>
        <style>{`@keyframes circuit-dash{to{stroke-dashoffset:-24}} @keyframes circuit-smoke{0%{transform:translateY(0) scale(.6);opacity:.8}100%{transform:translateY(-26px) scale(1.6);opacity:0}}`}</style>
        <rect x={0} y={0} width="100%" height="100%" fill="url(#circuit-grid)" />
        <g transform={transform}>
          {/* Wires (under parts) */}
          {wireDrawList.map(({ w, a, b, d }) => {
            const selected = selectedWires.includes(w.id);
            const flowing = showFlow && running && wireCurrent(w) > 1e-5;
            return (
              <g key={w.id}>
                <path d={d} fill="none" stroke="transparent" strokeWidth={10} data-wire={w.id} style={{ cursor: 'pointer' }} />
                <path
                  d={d}
                  fill="none"
                  stroke={WIRE_COLORS[w.color] ?? WIRE_COLORS.blue}
                  strokeWidth={selected ? 3.6 : 2.6}
                  strokeLinecap="round"
                  opacity={0.95}
                  style={flowing ? { strokeDasharray: '6 6', animation: 'circuit-dash 0.6s linear infinite' } : undefined}
                  pointerEvents="none"
                />
                {selected ? (
                  <g>
                    <circle cx={a.x} cy={a.y} r={1.6} fill="#fff" pointerEvents="none" />
                    {w.waypoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="#f4b942" stroke="#8a5a00" strokeWidth={0.8} data-waypoint={i} data-wire-id={w.id} style={{ cursor: 'move' }} />
                    ))}
                    {(() => {
                      const m = wireMidpoint(a, b, w.waypoints);
                      return (
                        <circle cx={m.x} cy={m.y} r={2.4} fill="none" stroke="#f4b942" strokeWidth={0.9} strokeDasharray="1.5 1.5" data-addbend={w.id} style={{ cursor: 'copy' }}>
                          <title>{t('addBend')}</title>
                        </circle>
                      );
                    })()}
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* Parts */}
          {components.map((c) => (
            <BenchPart
              key={c.id}
              comp={c}
              def={defs.get(c.id)}
              sim={frame?.components[c.id]}
              selected={selectedComps.includes(c.id)}
              hoverPin={hovered && hovered.compId === c.id ? hovered.pinId : null}
              connected={connectedPins.get(c.id)}
              running={running}
              simTime={frame ? frame.t / 1000 : 0}
            />
          ))}

          {/* Hover tooltip */}
          {hoverEntry ? (
            <g pointerEvents="none">
              <rect x={hoverEntry.x + 6} y={hoverEntry.y - 18} width={Math.max(40, hoverEntry.func.length * 4.6 + 10)} height={14} rx={3} fill="#0d1b2a" opacity={0.92} />
              <text x={hoverEntry.x + 11} y={hoverEntry.y - 8} fontSize={6} fill="#f4f7fb">
                {hoverEntry.func}
              </text>
            </g>
          ) : null}

          {/* In-progress wire */}
          {drag?.kind === 'wire' ? (
            <path
              d={wirePath(pinPos(drag.from) ?? drag.start, drag.end, [])}
              fill="none"
              stroke="#f4b942"
              strokeWidth={2.2}
              strokeDasharray="4 3"
              strokeLinecap="round"
              pointerEvents="none"
            />
          ) : null}

          {/* Marquee */}
          {drag?.kind === 'marquee' ? (
            <rect
              x={Math.min(drag.start.x, drag.end.x)}
              y={Math.min(drag.start.y, drag.end.y)}
              width={Math.abs(drag.end.x - drag.start.x)}
              height={Math.abs(drag.end.y - drag.start.y)}
              fill="rgba(244,185,66,0.12)"
              stroke="#f4b942"
              strokeDasharray="4 3"
              strokeWidth={1}
              pointerEvents="none"
            />
          ) : null}
        </g>

        {components.length === 0 ? (
          <text x="50%" y="50%" textAnchor="middle" fontSize={14} className="fill-[color:var(--muted)]" pointerEvents="none">
            {t('emptyBench')}
          </text>
        ) : null}
      </svg>

      {/* Zoom buttons + minimap */}
      <div className="pointer-events-auto absolute bottom-3 left-3 flex flex-col gap-1">
        <button type="button" className="btn btn-secondary h-8 w-8 p-0" aria-label="Zoom in" onClick={() => {
          const st = useCircuitStore.getState();
          st.setViewport(clampViewport(zoomAt(st.viewport, size.w / 2, size.h / 2, 1.25)));
        }}>
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" className="btn btn-secondary h-8 w-8 p-0" aria-label="Zoom out" onClick={() => {
          const st = useCircuitStore.getState();
          st.setViewport(clampViewport(zoomAt(st.viewport, size.w / 2, size.h / 2, 0.8)));
        }}>
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <Minimap components={components} wires={wires} defs={defs} bounds={bounds} viewport={viewport} size={size} />

      {/* Context menu */}
      {menu ? (
        <div role="menu" className="absolute z-20 min-w-[180px] rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-1 text-sm shadow-xl" style={{ left: Math.min(menu.x, size.w - 200), top: Math.min(menu.y, size.h - 220) }} onPointerDown={(e) => e.stopPropagation()}>
          {menu.compId ? (
            <>
              <MenuItem icon={<RotateCw className="h-4 w-4" />} label={t('rotate')} onClick={() => { useCircuitStore.getState().rotateSelection(1); setMenu(null); }} />
              <MenuItem icon={<FlipHorizontal2 className="h-4 w-4" />} label={t('flip')} onClick={() => { useCircuitStore.getState().flipSelection(); setMenu(null); }} />
              <MenuItem icon={<Copy className="h-4 w-4" />} label={t('duplicate')} onClick={() => { useCircuitStore.getState().duplicateSelection(); setMenu(null); }} />
              <MenuItem icon={<Trash2 className="h-4 w-4" />} label={t('delete')} onClick={() => { useCircuitStore.getState().deleteSelection(); setMenu(null); }} />
            </>
          ) : null}
          {menu.wireId ? (
            <>
              <MenuItem icon={<Plus className="h-4 w-4" />} label={t('addBend')} onClick={() => {
                const st = useCircuitStore.getState();
                const w = st.wires.find((x) => x.id === menu.wireId);
                if (w) {
                  const a = pinPos(w.from) ?? menu.at;
                  const b = pinPos(w.to) ?? menu.at;
                  st.addWaypoint(w.id, w.waypoints.length, wireMidpoint(a, b, w.waypoints));
                }
                setMenu(null);
              }} />
              {(['red', 'black', 'blue', 'green', 'yellow', 'white', 'orange', 'purple'] as WireColor[]).map((col) => (
                <MenuItem key={col} icon={<Palette className="h-4 w-4" style={{ color: WIRE_COLORS[col] }} />} label={`${t('setColor')}: ${col}`} onClick={() => { useCircuitStore.getState().setWireColor(menu.wireId!, col); setMenu(null); }} />
              ))}
              <MenuItem icon={<Trash2 className="h-4 w-4" />} label={t('deleteWire')} onClick={() => { useCircuitStore.getState().deleteWire(menu.wireId!); setMenu(null); }} />
            </>
          ) : null}
          {!menu.compId && !menu.wireId ? (
            <MenuItem icon={<Copy className="h-4 w-4" />} label={t('selectAll')} onClick={() => { useCircuitStore.getState().select(useCircuitStore.getState().components.map((c) => c.id), []); setMenu(null); }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[color:var(--surface-soft)]" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

/** One placed part: transform group + art. Memoised so only moved/selected parts re-render. */
const BenchPart = memo(function BenchPart({
  comp,
  def,
  sim,
  selected,
  hoverPin,
  connected,
  running,
  simTime
}: {
  comp: PlacedComponent;
  def: PartDef | undefined;
  sim: SimFrame['components'][string] | undefined;
  selected: boolean;
  hoverPin: string | null;
  connected: Set<string> | undefined;
  running: boolean;
  simTime: number;
}) {
  if (!def) return null;
  const { w, h } = def;
  const rotW = comp.rotation % 180 === 0 ? w : h;
  const rotH = comp.rotation % 180 === 0 ? h : w;
  const off = comp.rotation === 90 ? { x: h, y: 0 } : comp.rotation === 180 ? { x: w, y: h } : comp.rotation === 270 ? { x: 0, y: w } : { x: 0, y: 0 };
  const flipT = comp.flipH ? `translate(${w} 0) scale(-1 1)` : '';
  return (
    <g transform={`translate(${comp.x} ${comp.y})`} data-comp={comp.id} data-part={def.id}>
      {selected ? (
        <rect x={-3} y={-3} width={rotW + 6} height={rotH + 6} rx={5} fill="rgba(244,185,66,0.08)" stroke="#f4b942" strokeWidth={1.2} strokeDasharray="4 3" pointerEvents="none" />
      ) : null}
      <g transform={`translate(${off.x} ${off.y}) rotate(${comp.rotation})`}>
        <g transform={flipT}>
          <PartArt def={def} comp={comp} sim={sim} hoverPin={hoverPin} connectedPins={connected} simTime={simTime} running={running} />
        </g>
      </g>
      {sim?.burnt ? <Smoke x={rotW / 2} y={-2} /> : null}
      {sim?.powered === false && def.category === 'boards' && running ? (
        <text x={rotW / 2} y={-6} fontSize={5} textAnchor="middle" fill="#e0412f" pointerEvents="none">
          unpowered
        </text>
      ) : null}
    </g>
  );
});

function Smoke({ x, y }: { x: number; y: number }) {
  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + (i - 1) * 4} cy={y} r={3} fill="#9aa3ad" style={{ animation: `circuit-smoke 1.6s ease-out ${i * 0.4}s infinite`, transformOrigin: `${x + (i - 1) * 4}px ${y}px` }} />
      ))}
    </g>
  );
}

function Minimap({
  components,
  wires,
  defs,
  bounds,
  viewport,
  size
}: {
  components: PlacedComponent[];
  wires: PlacedWire[];
  defs: Map<string, PartDef>;
  bounds: { x: number; y: number; w: number; h: number };
  viewport: Viewport;
  size: { w: number; h: number };
}) {
  const pad = 40;
  const mw = 160;
  const mh = 100;
  const x0 = Math.min(bounds.x, viewport.x) - pad;
  const y0 = Math.min(bounds.y, viewport.y) - pad;
  const x1 = Math.max(bounds.x + bounds.w, viewport.x + size.w / viewport.zoom) + pad;
  const y1 = Math.max(bounds.y + bounds.h, viewport.y + size.h / viewport.zoom) + pad;
  const sc = Math.min(mw / Math.max(1, x1 - x0), mh / Math.max(1, y1 - y0));
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const wx = x0 + (e.clientX - r.left) / sc;
    const wy = y0 + (e.clientY - r.top) / sc;
    const st = useCircuitStore.getState();
    st.setViewport(clampViewport({ zoom: st.viewport.zoom, x: wx - size.w / 2 / st.viewport.zoom, y: wy - size.h / 2 / st.viewport.zoom }));
  };
  return (
    <svg width={mw} height={mh} className="absolute bottom-3 right-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] shadow" onClick={onClick} role="img" aria-label="Minimap">
      {components.map((c) => {
        const d = defs.get(c.id);
        if (!d) return null;
        return <rect key={c.id} x={(c.x - x0) * sc} y={(c.y - y0) * sc} width={Math.max(2, d.w * sc)} height={Math.max(2, d.h * sc)} className="fill-physics-600/60" />;
      })}
      {wires.slice(0, 300).map((w) => {
        const a = w.from ? components.find((c) => c.id === w.from!.compId) : null;
        const b = w.to ? components.find((c) => c.id === w.to!.compId) : null;
        if (!a || !b) return null;
        return <line key={w.id} x1={(a.x - x0) * sc} y1={(a.y - y0) * sc} x2={(b.x - x0) * sc} y2={(b.y - y0) * sc} stroke="#f4b942" strokeWidth={0.8} />;
      })}
      <rect x={(viewport.x - x0) * sc} y={(viewport.y - y0) * sc} width={(size.w / viewport.zoom) * sc} height={(size.h / viewport.zoom) * sc} fill="none" stroke="#075db1" strokeWidth={1.2} />
    </svg>
  );
}
