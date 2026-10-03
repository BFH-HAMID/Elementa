'use client';

import { heatColour } from '@/engine/heatModel';
import { cn } from '@/lib/utils';

export type ThermometerProps = {
  temperatureC: number;
  min?: number;
  max?: number;
  className?: string;
  showScale?: boolean;
};

/** A liquid-in-glass thermometer; the column follows the vessel temperature. */
export function Thermometer({ temperatureC, min = -10, max = 250, className, showScale = true }: ThermometerProps) {
  const span = max - min;
  const ratio = Math.min(1, Math.max(0, (temperatureC - min) / span));
  const columnBottom = 104;
  const columnTop = 14;
  const height = (columnBottom - columnTop) * ratio;
  const color = heatColour(temperatureC);

  return (
    <svg viewBox="0 0 34 124" className={cn('', className)} role="img" aria-hidden="true">
      <rect x="12" y="8" width="10" height="98" rx="5" fill="#eaf2f9" stroke="#7d94ab" strokeWidth="1.6" />
      <circle cx="17" cy="110" r="8" fill={color} stroke="#7d94ab" strokeWidth="1.6" />
      <rect x="14.6" y={columnBottom - height} width="4.8" height={Math.max(0.5, height)} rx="2.4" fill={color}>
        <animate attributeName="opacity" values="1;0.9;1" dur="2.4s" repeatCount="indefinite" />
      </rect>
      {showScale &&
        Array.from({ length: 9 }).map((_, index) => {
          const y = columnTop + ((columnBottom - columnTop) / 8) * index;
          const value = Math.round(max - (span / 8) * index);
          return (
            <g key={y}>
              <line x1="22" y1={y} x2={index % 2 === 0 ? 28 : 25.5} y2={y} stroke="#7d94ab" strokeWidth="1" />
              {index % 2 === 0 && (
                <text x="30" y={y + 3} fontSize="6.5" fill="var(--muted)" fontWeight="700">
                  {value}
                </text>
              )}
            </g>
          );
        })}
      <text x="17" y="6" textAnchor="middle" fontSize="7" fill="var(--muted)" fontWeight="800">
        °C
      </text>
    </svg>
  );
}
