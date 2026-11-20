"use client";

import { useEffect, useRef, useState } from "react";
import { monthLabel, money } from "@/lib/format";

/**
 * Single-series line chart of monthly writing-service revenue (Jan..Dec, as in the original
 * Chart.js chart on templates/Admin/Admin/dashboard.php). One series, so no legend box:
 * the title names it. Hover/focus shows a crosshair and tooltip; a table view is available.
 */
export function RevenueChart({ data, title }: { data: number[]; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(Math.max(280, Math.floor(entries[0].contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = 240;
  const pad = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(...data, 0);
  const step = niceStep(max / 4 || 100);
  const top = Math.max(step * 4, step);
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step).filter((t) => t <= top);

  const x = (i: number) => pad.left + (innerW * i) / (data.length - 1);
  const y = (v: number) => pad.top + innerH - (innerH * v) / top;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const maxIndex = data.indexOf(max);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round((px / rect.width) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
          aria-pressed={showTable}
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </figcaption>

      {showTable ? (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1 text-slate-700">{monthLabel(i)}</td>
                <td className="py-1 text-right text-slate-800 tabular-nums">{money(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div ref={wrapRef} className="relative">
          <svg width={width} height={height} role="img" aria-label={`${title}. Highest month: ${monthLabel(maxIndex)}, ${money(max)}.`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth={1} />
                <text x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#6b7280">
                  {"$" + t.toLocaleString("en-AU")}
                </text>
              </g>
            ))}
            {data.map((_, i) => (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="#6b7280">
                {monthLabel(i)}
              </text>
            ))}

            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
            )}

            <path d={path} fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={hover === i ? 5.5 : 4}
                fill="#2a78d6"
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}

            {max > 0 && hover === null && (
              <text x={x(maxIndex)} y={y(max) - 10} textAnchor="middle" fontSize={11} fontWeight={600} fill="#111827">
                {money(max)}
              </text>
            )}

            <rect
              x={pad.left}
              y={pad.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>

          {hover !== null && (
            <div
              className="pointer-events-none absolute rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow"
              style={{
                left: Math.min(Math.max(x(hover) - 60, 0), width - 130),
                top: Math.max(y(data[hover]) - 52, 0),
                width: 130,
              }}
            >
              <p className="text-slate-300">{monthLabel(hover)}</p>
              <p className="font-semibold tabular-nums">{money(data[hover])}</p>
            </div>
          )}

          <div className="sr-only">
            <ul>
              {data.map((v, i) => (
                <li key={i}>
                  {monthLabel(i)}: {money(v)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </figure>
  );
}

function niceStep(raw: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}
