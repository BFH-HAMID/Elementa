'use client';

import React from 'react';
import type { BenchItem, CircuitWire } from '@/engine/physicsTypes';
import { equipmentById } from '@/lib/physicsData';
import { usePhysicsStore } from '@/store/physicsStore';

interface CircuitCanvasProps {
  items: BenchItem[];
  wires: CircuitWire[];
  isLive: boolean;
}

export function CircuitCanvas({ items, wires, isLive }: CircuitCanvasProps) {
  const removeWire = usePhysicsStore((s) => s.removeWire);

  const itemMap = new Map<string, BenchItem>(items.map((it) => [it.id, it]));

  const getTerminalAbsolutePos = (itemId: string, terminalId: string): { x: number; y: number } | null => {
    const item = itemMap.get(itemId);
    if (!item) return null;
    const def = equipmentById.get(item.equipmentId);
    if (!def) return null;
    const term = def.terminals?.find((t) => t.id === terminalId);
    if (!term) return null;

    const w = def.width || 120;
    const h = def.height || 80;

    // Center offset within item box
    const tx = (term.x / 100) * w;
    const ty = (term.y / 100) * h;

    // Apply rotation around center
    const cx = w / 2;
    const cy = h / 2;
    const rad = (item.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rx = cx + (tx - cx) * cos - (ty - cy) * sin;
    const ry = cy + (tx - cx) * sin + (ty - cy) * cos;

    return {
      x: item.x + rx,
      y: item.y + ry
    };
  };

  const colorHex: Record<CircuitWire['color'], string> = {
    red: '#dc2626',
    black: '#1e293b',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#d97706'
  };

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full select-none overflow-visible">
      <defs>
        <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {wires.map((wire) => {
        const fromPos = getTerminalAbsolutePos(wire.fromItemId, wire.fromTerminalId);
        const toPos = getTerminalAbsolutePos(wire.toItemId, wire.toTerminalId);
        if (!fromPos || !toPos) return null;

        // Cubic bezier control points with natural gravitational droop
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.hypot(dx, dy);
        const sag = Math.min(60, dist * 0.2);

        const cx1 = fromPos.x + dx * 0.3;
        const cy1 = fromPos.y + dy * 0.3 + sag;
        const cx2 = fromPos.x + dx * 0.7;
        const cy2 = fromPos.y + dy * 0.7 + sag;

        const pathData = `M ${fromPos.x} ${fromPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toPos.x} ${toPos.y}`;
        const hex = colorHex[wire.color] || '#2563eb';

        return (
          <g key={wire.id} className="group pointer-events-auto cursor-pointer">
            {/* Thick transparent stroke for easier hover/click target */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              onClick={() => removeWire(wire.id)}
            />
            {/* Wire outer insulation */}
            <path
              d={pathData}
              fill="none"
              stroke={hex}
              strokeWidth="4"
              strokeLinecap="round"
              className="transition-all group-hover:stroke-red-500 group-hover:stroke-[6px]"
            />
            {/* Animated flow dots when live */}
            {isLive && (
              <path
                d={pathData}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="4 8"
                className="animate-[shimmer_1.5s_linear_infinite]"
                opacity="0.8"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
