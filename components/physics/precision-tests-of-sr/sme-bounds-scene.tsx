"use client";

import { smeBounds } from "@/lib/physics/relativity/precision-tests";

/**
 * FIG.24b — SmeBoundsScene.
 *
 * Bar chart of representative present-day bounds on Standard-Model
 * Extension (SME) coefficients across the photon, electron, proton, and
 * neutron sectors. Bars render on a log scale because the bounds span
 * 10⁻¹⁴ … 10⁻³¹ — sixteen orders of magnitude.
 *
 * The SME is the framework Kostelecký + collaborators systematized in the
 * 1990s. Each experiment constrains a specific subset of coefficients;
 * the *Data Tables for Lorentz and CPT Violation* (Rev. Mod. Phys.,
 * updated annually) compile the global picture.
 *
 * Static SVG. Data: `smeBounds()`.
 *
 * Palette per sector:
 *   • photon   — cyan
 *   • electron — magenta
 *   • proton   — amber
 *   • neutron  — green
 */

const WIDTH = 760;
const HEIGHT = 440;
const PAD_L = 220;
const PAD_R = 32;
const PAD_T = 36;
const PAD_B = 64;

const LOG_LEFT = -14;
const LOG_RIGHT = -32;

const SECTOR_COLOR: Record<string, string> = {
  photon: "#67E8F9",
  electron: "#F0ABFC",
  proton: "#FFB36B",
  neutron: "#86EFAC",
};

export function SmeBoundsScene() {
  const data = smeBounds();

  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const barH = plotH / data.length;

  // x maps log10(bound) to a horizontal position.
  // LOG_LEFT (less tight, larger bound) → left edge of plot.
  // LOG_RIGHT (tighter, smaller bound) → right edge.
  const xToPx = (log10: number) => {
    const t = (LOG_LEFT - log10) / (LOG_LEFT - LOG_RIGHT);
    return PAD_L + t * plotW;
  };

  const xTicks = [-14, -18, -22, -26, -30];

  return (
    <div className="flex w-full justify-center p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        role="img"
        aria-label="Bar chart of SME coefficient bounds across the photon, electron, proton, and neutron sectors."
      >
        {/* Plot frame */}
        <rect
          x={PAD_L}
          y={PAD_T}
          width={plotW}
          height={plotH}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />

        {/* Vertical grid */}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xToPx(t)}
            y1={PAD_T}
            x2={xToPx(t)}
            y2={PAD_T + plotH}
            stroke="rgba(255,255,255,0.05)"
          />
        ))}

        {/* X axis */}
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke="rgba(255,255,255,0.5)"
        />

        {/* X tick labels */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={xToPx(t)}
              y1={PAD_T + plotH}
              x2={xToPx(t)}
              y2={PAD_T + plotH + 4}
              stroke="rgba(255,255,255,0.5)"
            />
            <text
              x={xToPx(t)}
              y={PAD_T + plotH + 18}
              textAnchor="middle"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.6)"
            >
              10
              <tspan fontSize={9} dy={-4}>
                {t}
              </tspan>
            </text>
          </g>
        ))}

        {/* X axis title */}
        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 16}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.75)"
        >
          upper bound on |SME coefficient| (log scale, tighter →)
        </text>

        {/* Bars */}
        {data.map((b, i) => {
          const yTop = PAD_T + i * barH + barH * 0.18;
          const yMid = PAD_T + i * barH + barH / 2;
          const barHeight = barH * 0.64;
          const log10 = Math.log10(b.bound);
          const xEnd = xToPx(log10);
          const color = SECTOR_COLOR[b.sector] ?? "#67E8F9";
          return (
            <g key={`bar-${i}`}>
              {/* Coefficient label (left of axis) */}
              <text
                x={PAD_L - 10}
                y={yMid - 1}
                textAnchor="end"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.85)"
              >
                {b.coefficient}
              </text>
              {/* Source under coefficient */}
              <text
                x={PAD_L - 10}
                y={yMid + 12}
                textAnchor="end"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.45)"
              >
                {b.source}
              </text>

              {/* The bar */}
              <rect
                x={PAD_L}
                y={yTop}
                width={Math.max(2, xEnd - PAD_L)}
                height={barHeight}
                fill={color}
                opacity={0.78}
              />

              {/* Bound value at bar end */}
              <text
                x={xEnd + 6}
                y={yMid + 4}
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fontWeight={600}
                fill={color}
              >
                10
                <tspan fontSize={8} dy={-3}>
                  {Math.round(log10)}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Sector legend (top right) */}
        <g>
          {(["photon", "electron", "proton", "neutron"] as const).map(
            (sector, j) => (
              <g key={`leg-${sector}`}>
                <rect
                  x={WIDTH - PAD_R - 110}
                  y={PAD_T + 4 + j * 16}
                  width={10}
                  height={10}
                  fill={SECTOR_COLOR[sector]}
                  opacity={0.85}
                />
                <text
                  x={WIDTH - PAD_R - 96}
                  y={PAD_T + 13 + j * 16}
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                  fill="rgba(255,255,255,0.7)"
                >
                  {sector}
                </text>
              </g>
            ),
          )}
        </g>

        {/* HUD attribution */}
        <text
          x={PAD_L}
          y={PAD_T - 14}
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.5)"
        >
          Kostelecký + Russell · Data Tables for Lorentz and CPT Violation
        </text>
      </svg>
    </div>
  );
}
