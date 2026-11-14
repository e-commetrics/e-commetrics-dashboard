"use client";

// Small SVG charts for the dashboard. One axis, thin marks, ink-coloured text,
// a hover readout, and colours from the theme tokens so light and dark both work.

import { useEffect, useRef, useState } from "react";

export type Series = { name: string; values: number[]; color: string; dashed?: boolean; area?: boolean };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function niceStep(max: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 5000, 10000, 50000];
  return steps.find((s) => s * 4 >= max) ?? steps[steps.length - 1];
}

const M = { l: 34, r: 12, t: 10, b: 22 };

export function Chart({
  type,
  labels,
  series,
  height = 180,
  unit = "",
  ariaLabel,
}: {
  type: "line" | "bar";
  labels: string[];
  series: Series[];
  height?: number;
  unit?: string;
  ariaLabel: string;
}) {
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const iw = Math.max(0, width - M.l - M.r);
  const ih = height - M.t - M.b;
  const y = (v: number) => M.t + ih - (v / top) * ih;
  const band = n ? iw / n : 0;
  const x = (i: number) => (type === "bar" ? M.l + band * i + band / 2 : M.l + (n > 1 ? (iw * i) / (n - 1) : iw / 2));
  const every = Math.max(1, Math.ceil(n / Math.max(1, width / 72)));
  const ticks: number[] = [];
  for (let g = 0; g <= top; g += step) ticks.push(g);
  const barW = Math.max(4, Math.min(26, band - 6));

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {series.length > 1 ? (
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ec-text-muted)", marginBottom: 4, flexWrap: "wrap" }}>
          {series.map((s) => (
            <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <i style={{ width: 14, height: 3, borderRadius: 2, background: s.color, display: "inline-block" }} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
      {width > 0 && n > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          style={{ display: "block", overflow: "visible" }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
            let best = 0;
            for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
            setHover(best);
          }}
        >
          {ticks.map((g) => (
            <g key={g}>
              <line x1={M.l} x2={width - M.r} y1={y(g)} y2={y(g)} style={{ stroke: "var(--ec-hairline)" }} />
              <text x={M.l - 6} y={y(g) + 4} textAnchor="end" style={{ fontSize: 11, fill: "var(--ec-text-dim)" }}>
                {g}
              </text>
            </g>
          ))}
          {labels.map((label, i) =>
            i % every === 0 ? (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={type === "line" ? (i === 0 ? "start" : i === n - 1 ? "end" : "middle") : "middle"}
                style={{ fontSize: 11, fill: "var(--ec-text-dim)" }}
              >
                {label}
              </text>
            ) : null,
          )}
          {type === "bar"
            ? series[0].values.map((v, i) => {
                const yy = y(v);
                const base = M.t + ih;
                const r = Math.min(4, (base - yy) / 2);
                const x0 = x(i) - barW / 2;
                return (
                  <path
                    key={i}
                    d={`M${x0} ${base}V${yy + r}q0 ${-r} ${r} ${-r}h${barW - 2 * r}q${r} 0 ${r} ${r}V${base}z`}
                    style={{ fill: series[0].color, opacity: hover === null || hover === i ? 1 : 0.55 }}
                  />
                );
              })
            : series.map((s) => {
                const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join("");
                return (
                  <g key={s.name}>
                    {s.area ? <path d={`${d}L${x(n - 1)} ${M.t + ih}L${x(0)} ${M.t + ih}z`} style={{ fill: s.color, opacity: 0.12 }} /> : null}
                    <path d={d} fill="none" style={{ stroke: s.color }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "4 4" : undefined} />
                    {s.dashed ? null : <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r={4.5} style={{ fill: s.color, stroke: "var(--ec-surface-1)" }} strokeWidth={2} />}
                  </g>
                );
              })}
          {type === "line" && hover !== null ? <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={M.t + ih} style={{ stroke: "var(--ec-border)" }} /> : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}
      {hover !== null && width > 0 ? (
        <div
          style={{
            position: "absolute",
            left: Math.max(70, Math.min(width - 70, x(hover))),
            top: y(Math.max(...series.map((s) => s.values[hover] ?? 0))),
            transform: "translate(-50%, -130%)",
            pointerEvents: "none",
            background: "var(--ec-text)",
            color: "var(--ec-bg)",
            padding: "5px 9px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {labels[hover]}: {series.map((s) => `${series.length > 1 ? `${s.name} ` : ""}${s.values[hover]}`).join(" · ")}
          {series.length === 1 && unit ? ` ${unit}` : ""}
        </div>
      ) : null}
    </div>
  );
}
