"use client";

import { smeBounds } from "@/lib/physics/relativity/precision-tests";
import {
  hexToRgba,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.24b — Bar chart of SME coefficient bounds across sectors.
 * Bars on log scale because bounds span 10⁻¹⁴ … 10⁻³¹.
 */

const WIDTH = 760;
const HEIGHT = 440;
const PAD_L = 220;
const PAD_R = 32;
const PAD_T = 36;
const PAD_B = 64;

const LOG_LEFT = -14;
const LOG_RIGHT = -32;

export function SmeBoundsScene() {
  const data = smeBounds();
  const tokens = useSceneTokens();

  const sectorColor: Record<string, string> = {
    photon: tokens.cyan,
    electron: tokens.magenta,
    proton: tokens.amber,
    neutron: tokens.green,
  };

  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const barH = plotH / data.length;

  const xToPx = (log10: number) => {
    const t = (LOG_LEFT - log10) / (LOG_LEFT - LOG_RIGHT);
    return PAD_L + t * plotW;
  };

  const xTicks = [-14, -18, -22, -26, -30];

  return (
    <div className="flex w-full justify-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, background: tokens.bg }}
        className="block"
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
          stroke={tokens.panelBorder}
        />

        {/* Vertical grid */}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xToPx(t)}
            y1={PAD_T}
            x2={xToPx(t)}
            y2={PAD_T + plotH}
            stroke={tokens.grid}
          />
        ))}

        {/* X axis */}
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke={tokens.axes}
        />

        {/* X tick labels */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={xToPx(t)}
              y1={PAD_T + plotH}
              x2={xToPx(t)}
              y2={PAD_T + plotH + 4}
              stroke={tokens.axes}
            />
            <text
              x={xToPx(t)}
              y={PAD_T + plotH + 18}
              textAnchor="middle"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill={tokens.textMute}
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
          fill={tokens.textDim}
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
          const color = sectorColor[b.sector] ?? tokens.cyan;
          return (
            <g key={`bar-${i}`}>
              <text
                x={PAD_L - 10}
                y={yMid - 1}
                textAnchor="end"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill={tokens.textDim}
              >
                {b.coefficient}
              </text>
              <text
                x={PAD_L - 10}
                y={yMid + 12}
                textAnchor="end"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fill={tokens.textMute}
              >
                {b.source}
              </text>

              <rect
                x={PAD_L}
                y={yTop}
                width={Math.max(2, xEnd - PAD_L)}
                height={barHeight}
                fill={hexToRgba(color, 0.78)}
              />

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

        <g>
          {(["photon", "electron", "proton", "neutron"] as const).map(
            (sector, j) => (
              <g key={`leg-${sector}`}>
                <rect
                  x={WIDTH - PAD_R - 110}
                  y={PAD_T + 4 + j * 16}
                  width={10}
                  height={10}
                  fill={hexToRgba(sectorColor[sector], 0.85)}
                />
                <text
                  x={WIDTH - PAD_R - 96}
                  y={PAD_T + 13 + j * 16}
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                  fill={tokens.textDim}
                >
                  {sector}
                </text>
              </g>
            ),
          )}
        </g>

        <text
          x={PAD_L}
          y={PAD_T - 14}
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill={tokens.textMute}
        >
          Kostelecký + Russell · Data Tables for Lorentz and CPT Violation
        </text>
      </svg>
    </div>
  );
}
