"use client";

import { bindingEnergyCurve } from "@/lib/physics/relativity/mass-energy";
import {
  hexToRgba,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.17 — THE MONEY SHOT.
 *
 * Binding energy per nucleon B/A vs. mass number A, from H-1 to U-238.
 * Iron-56 sits at the peak (~8.79 MeV/nucleon).
 *
 * Palette:
 *   • cyan   — the curve and its data points
 *   • amber  — Fe-56 peak marker + label
 *   • green  — fusion-side annotation (left of iron)
 *   • red    — fission-side annotation (right of iron)
 */

const WIDTH = 760;
const HEIGHT = 420;
const PAD_L = 64;
const PAD_R = 32;
const PAD_T = 32;
const PAD_B = 56;

const A_MIN = 0;
const A_MAX = 250;
const B_MIN = 0;
const B_MAX = 9.5;

export function BindingEnergyCurveScene() {
  const tokens = useSceneTokens();
  const data = bindingEnergyCurve();

  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const xToPx = (a: number) =>
    PAD_L + ((a - A_MIN) / (A_MAX - A_MIN)) * plotW;
  const yToPx = (b: number) =>
    PAD_T + plotH - ((b - B_MIN) / (B_MAX - B_MIN)) * plotH;

  const pathD = catmullRomPath(
    data.map((p) => ({ x: xToPx(p.A), y: yToPx(p.B_per_A_MeV) })),
  );

  const fe = data.find((p) => p.isotope === "Fe-56")!;
  const fePx = { x: xToPx(fe.A), y: yToPx(fe.B_per_A_MeV) };

  const xTicks = [0, 50, 100, 150, 200, 250];
  const yTicks = [0, 2, 4, 6, 8, 9];

  return (
    <div className="w-full pb-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ display: "block" }}
        role="img"
        aria-label="Binding energy per nucleon vs mass number, showing Fe-56 at the peak."
      >
        {/* Plot frame */}
        <rect
          x={PAD_L}
          y={PAD_T}
          width={plotW}
          height={plotH}
          fill="none"
          stroke={hexToRgba(tokens.textBright, 0.08)}
        />

        {/* Grid */}
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
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={PAD_L}
            y1={yToPx(t)}
            x2={PAD_L + plotW}
            y2={yToPx(t)}
            stroke={tokens.grid}
          />
        ))}

        {/* Axes */}
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke={tokens.axes}
        />
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={PAD_T + plotH}
          stroke={tokens.axes}
        />

        {/* Axis ticks + labels */}
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
              {t}
            </text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line
              x1={PAD_L - 4}
              y1={yToPx(t)}
              x2={PAD_L}
              y2={yToPx(t)}
              stroke={tokens.axes}
            />
            <text
              x={PAD_L - 8}
              y={yToPx(t) + 4}
              textAnchor="end"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill={tokens.textMute}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis titles */}
        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 14}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill={tokens.textDim}
        >
          mass number A (nucleons)
        </text>
        <text
          x={18}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill={tokens.textDim}
          transform={`rotate(-90 18 ${PAD_T + plotH / 2})`}
        >
          binding energy per nucleon  B/A  (MeV)
        </text>

        {/* The curve */}
        <path
          d={pathD}
          fill="none"
          stroke={tokens.cyan}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {data.map((p) => (
          <circle
            key={p.isotope}
            cx={xToPx(p.A)}
            cy={yToPx(p.B_per_A_MeV)}
            r={p.isotope === "Fe-56" ? 5 : 3}
            fill={p.isotope === "Fe-56" ? tokens.amber : tokens.cyan}
            stroke={p.isotope === "Fe-56" ? tokens.amber : hexToRgba(tokens.bg, 0.5)}
            strokeWidth={p.isotope === "Fe-56" ? 1.5 : 0.5}
          />
        ))}

        {/* Iron-56 peak marker */}
        <line
          x1={fePx.x}
          y1={fePx.y - 6}
          x2={fePx.x}
          y2={PAD_T + plotH}
          stroke={tokens.amber}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.6}
        />
        <text
          x={fePx.x}
          y={fePx.y - 14}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
          fill={tokens.amber}
        >
          Fe-56  ·  8.79 MeV/A
        </text>
        <text
          x={fePx.x}
          y={fePx.y - 28}
          textAnchor="middle"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill={hexToRgba(tokens.amber, 0.85)}
        >
          peak — universe's energy minimum
        </text>

        {/* Fusion-side annotation */}
        <g>
          <text
            x={xToPx(20)}
            y={yToPx(2.5)}
            fontSize={12}
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
            fill={tokens.green}
          >
            FUSION
          </text>
          <text
            x={xToPx(20)}
            y={yToPx(2.5) + 14}
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.green, 0.85)}
          >
            light → heavier
          </text>
          <text
            x={xToPx(20)}
            y={yToPx(2.5) + 26}
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.green, 0.85)}
          >
            releases energy ↑
          </text>
          <path
            d={`M ${xToPx(8)} ${yToPx(0.6)} Q ${xToPx(30)} ${yToPx(7.0)} ${xToPx(50)} ${yToPx(8.4)}`}
            stroke={tokens.green}
            strokeWidth={1.5}
            fill="none"
            opacity={0.55}
            markerEnd="url(#arrow-fusion)"
          />
        </g>

        {/* Fission-side annotation */}
        <g>
          <text
            x={xToPx(220)}
            y={yToPx(5.6)}
            textAnchor="end"
            fontSize={12}
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
            fill={tokens.red}
          >
            FISSION
          </text>
          <text
            x={xToPx(220)}
            y={yToPx(5.6) + 14}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.red, 0.85)}
          >
            heavy → lighter
          </text>
          <text
            x={xToPx(220)}
            y={yToPx(5.6) + 26}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.red, 0.85)}
          >
            releases energy ↓
          </text>
          <path
            d={`M ${xToPx(75)} ${yToPx(8.7)} Q ${xToPx(160)} ${yToPx(8.0)} ${xToPx(235)} ${yToPx(7.5)}`}
            stroke={tokens.red}
            strokeWidth={1.5}
            fill="none"
            opacity={0.55}
            markerEnd="url(#arrow-fission)"
          />
        </g>

        {/* Selected isotope labels */}
        {data
          .filter((p) =>
            ["H-2", "He-4", "C-12", "O-16", "U-238"].includes(p.isotope),
          )
          .map((p) => {
            const dy = p.isotope === "He-4" ? -10 : 14;
            return (
              <text
                key={`lbl-${p.isotope}`}
                x={xToPx(p.A) + (p.isotope === "U-238" ? -8 : 6)}
                y={yToPx(p.B_per_A_MeV) + dy}
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill={hexToRgba(tokens.cyan, 0.85)}
                textAnchor={p.isotope === "U-238" ? "end" : "start"}
              >
                {p.isotope}
              </text>
            );
          })}

        <defs>
          <marker
            id="arrow-fusion"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill={tokens.green} opacity={0.7} />
          </marker>
          <marker
            id="arrow-fission"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill={tokens.red} opacity={0.7} />
          </marker>
        </defs>

        {/* HUD */}
        <text
          x={WIDTH - PAD_R - 6}
          y={PAD_T + 14}
          textAnchor="end"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill={tokens.textMute}
        >
          AME-2020 sample · 11 isotopes
        </text>
      </svg>
    </div>
  );
}

function catmullRomPath(pts: ReadonlyArray<{ x: number; y: number }>): string {
  if (pts.length < 2) return "";
  const cmds: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    cmds.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
  }
  return cmds.join(" ");
}
