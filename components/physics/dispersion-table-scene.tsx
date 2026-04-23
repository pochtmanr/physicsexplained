"use client";

import { useMemo, useState } from "react";
import { cauchyFit } from "@/lib/physics/electromagnetism/optics-refraction";

const MAGENTA = "rgba(255, 100, 200,";
const CYAN = "rgba(120, 220, 255,";

/**
 * FIG.42b — dispersion table.
 *
 * A sortable-looking list of common transparent materials with their
 * refractive indices at the sodium D line (589 nm). Hovering a row draws the
 * material's n(λ) Cauchy curve from 400 nm (violet) to 700 nm (red) on the
 * right-hand panel.
 *
 * Cauchy coefficients are from standard optics tables (Jenkins & White;
 * Schott / Hoya datasheets). The two-term form A + B/λ² is adequate over
 * the visible band for all these materials.
 */

interface Material {
  name: string;
  nD: number;    // tabulated n at 589 nm for display
  A: number;     // Cauchy A
  B: number;     // Cauchy B, in µm²
  notes: string;
}

// Cauchy A is chosen so that A + B/(0.589)² equals the tabulated n_D. B is
// fitted to the Abbe number where a handbook value exists, otherwise a sane
// default (~4e-3 µm²) that matches the visible-band slope for most glasses.
const MATERIALS: Material[] = [
  { name: "vacuum",       nD: 1.0000, A: 1.0000, B: 0.0,    notes: "reference" },
  { name: "air (STP)",    nD: 1.0003, A: 1.0003, B: 0.0,    notes: "barely above 1" },
  { name: "water",        nD: 1.3330, A: 1.3208, B: 4.24e-3, notes: "optical ε_r ≈ 1.77" },
  { name: "fused silica", nD: 1.4585, A: 1.4508, B: 2.66e-3, notes: "UV-transparent" },
  { name: "BK7 crown",    nD: 1.5168, A: 1.5046, B: 4.20e-3, notes: "the glass" },
  { name: "SF11 flint",   nD: 1.7847, A: 1.7376, B: 1.63e-2, notes: "heavy flint" },
  { name: "sapphire",     nD: 1.7680, A: 1.7519, B: 5.58e-3, notes: "Al₂O₃" },
  { name: "diamond",      nD: 2.4175, A: 2.3780, B: 1.37e-2, notes: "C, cubic" },
];

export function DispersionTableScene() {
  const [hoverIdx, setHoverIdx] = useState<number>(4); // default to BK7

  const material = MATERIALS[hoverIdx] ?? MATERIALS[0];

  // Build the n(λ) curve for the hovered material across 400–700 nm.
  const curve = useMemo(() => {
    const out: { lambdaNm: number; n: number }[] = [];
    for (let lambdaNm = 400; lambdaNm <= 700; lambdaNm += 5) {
      const lambdaUm = lambdaNm / 1000;
      out.push({ lambdaNm, n: cauchyFit(lambdaUm, material.A, material.B) });
    }
    return out;
  }, [material.A, material.B]);

  // Plot range: auto-fit ±0.5% padding around the curve, floored at 0.002.
  const nMin = Math.min(...curve.map((p) => p.n));
  const nMax = Math.max(...curve.map((p) => p.n));
  const pad = Math.max(0.002, (nMax - nMin) * 0.1);
  const yMin = nMin - pad;
  const yMax = nMax + pad;

  const PLOT_W = 280;
  const PLOT_H = 200;

  return (
    <div className="grid w-full gap-4 pb-2 md:grid-cols-[minmax(0,1fr)_320px]">
      {/* Left: material table */}
      <div className="overflow-hidden rounded-md border border-[var(--color-fg-4)]">
        <table className="w-full font-mono text-xs">
          <thead className="border-b border-[var(--color-fg-4)] bg-[color-mix(in_srgb,var(--color-fg-4)_30%,transparent)]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-[var(--color-fg-2)]">material</th>
              <th className="px-3 py-2 text-right font-semibold text-[var(--color-fg-2)]">n (589 nm)</th>
              <th className="hidden px-3 py-2 text-right font-semibold text-[var(--color-fg-2)] md:table-cell">v = c/n</th>
              <th className="hidden px-3 py-2 text-left font-semibold text-[var(--color-fg-2)] md:table-cell">notes</th>
            </tr>
          </thead>
          <tbody>
            {MATERIALS.map((m, i) => {
              const selected = i === hoverIdx;
              const vFrac = 1 / m.nD;
              return (
                <tr
                  key={m.name}
                  onMouseEnter={() => setHoverIdx(i)}
                  onFocus={() => setHoverIdx(i)}
                  tabIndex={0}
                  className={
                    "cursor-pointer border-b border-[var(--color-fg-4)] transition-colors last:border-0 " +
                    (selected
                      ? "bg-[color-mix(in_srgb,var(--color-fg-4)_20%,transparent)] text-[var(--color-fg-0)]"
                      : "text-[var(--color-fg-1)] hover:bg-[color-mix(in_srgb,var(--color-fg-4)_10%,transparent)]")
                  }
                >
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{m.nD.toFixed(4)}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">
                    {(vFrac).toFixed(4)} c
                  </td>
                  <td className="hidden px-3 py-2 text-[var(--color-fg-3)] md:table-cell">{m.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right: n(λ) plot for the hovered material */}
      <div className="flex flex-col items-start gap-2">
        <div className="font-mono text-xs text-[var(--color-fg-2)]">
          n(λ) — <span className="text-[var(--color-fg-0)]">{material.name}</span> · Cauchy
        </div>
        <svg
          width={PLOT_W}
          height={PLOT_H}
          viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
          className="rounded-md border border-[var(--color-fg-4)]"
        >
          {/* Visible-spectrum gradient strip along the x-axis */}
          <defs>
            <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8A3FFF" />
              <stop offset="17%" stopColor="#3F5FFF" />
              <stop offset="34%" stopColor="#00B2FF" />
              <stop offset="50%" stopColor="#00E06B" />
              <stop offset="67%" stopColor="#FFD23F" />
              <stop offset="84%" stopColor="#FF6A2F" />
              <stop offset="100%" stopColor="#FF2F3F" />
            </linearGradient>
          </defs>
          <rect x={32} y={PLOT_H - 14} width={PLOT_W - 44} height={6} fill="url(#spectrum)" opacity={0.7} />

          {/* Axes */}
          <line x1={32} y1={8} x2={32} y2={PLOT_H - 16} stroke="currentColor" strokeOpacity={0.25} />
          <line x1={32} y1={PLOT_H - 16} x2={PLOT_W - 12} y2={PLOT_H - 16} stroke="currentColor" strokeOpacity={0.25} />

          {/* Curve */}
          <polyline
            fill="none"
            stroke={`${MAGENTA} 0.95)`}
            strokeWidth={2}
            points={curve
              .map(({ lambdaNm, n }) => {
                const x = 32 + ((lambdaNm - 400) / 300) * (PLOT_W - 44);
                const y = 8 + (1 - (n - yMin) / (yMax - yMin)) * (PLOT_H - 24);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
              })
              .join(" ")}
          />

          {/* 589 nm marker */}
          {(() => {
            const xD = 32 + ((589 - 400) / 300) * (PLOT_W - 44);
            const yD = 8 + (1 - (material.nD - yMin) / (yMax - yMin)) * (PLOT_H - 24);
            return (
              <g>
                <line x1={xD} y1={8} x2={xD} y2={PLOT_H - 16} stroke={`${CYAN} 0.5)`} strokeDasharray="2 3" />
                <circle cx={xD} cy={yD} r={3} fill={`${CYAN} 0.95)`} />
              </g>
            );
          })()}

          {/* Axis labels */}
          <text x={32} y={PLOT_H - 2} fontSize={9} fontFamily="monospace" fill="currentColor" opacity={0.6}>
            400
          </text>
          <text x={PLOT_W - 32} y={PLOT_H - 2} fontSize={9} fontFamily="monospace" fill="currentColor" opacity={0.6}>
            700 nm
          </text>
          <text x={4} y={14} fontSize={9} fontFamily="monospace" fill="currentColor" opacity={0.6}>
            {yMax.toFixed(3)}
          </text>
          <text x={4} y={PLOT_H - 20} fontSize={9} fontFamily="monospace" fill="currentColor" opacity={0.6}>
            {yMin.toFixed(3)}
          </text>
        </svg>
        <div className="font-mono text-[10px] text-[var(--color-fg-3)]">
          n(λ) = A + B/λ² · A = {material.A.toFixed(4)} · B = {material.B.toExponential(2)} µm²
        </div>
      </div>
    </div>
  );
}
