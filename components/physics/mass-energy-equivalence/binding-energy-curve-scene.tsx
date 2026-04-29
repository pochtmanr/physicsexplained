"use client";

import { bindingEnergyCurve } from "@/lib/physics/relativity/mass-energy";

/**
 * FIG.17 — THE MONEY SHOT.
 *
 * Binding energy per nucleon B/A vs. mass number A, from H-1 to U-238.
 * Iron-56 sits at the peak (~8.79 MeV/nucleon) — the universe's energy
 * minimum per nucleon.
 *
 * Stars run on FUSION (climbing left of iron); reactors run on FISSION
 * (descending right of iron). Every joule of energy ever liberated by a
 * nucleus has been a movement on this curve.
 *
 * Static SVG. Data: AME-2020 sample points from `bindingEnergyCurve()`.
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
  const data = bindingEnergyCurve();

  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const xToPx = (a: number) =>
    PAD_L + ((a - A_MIN) / (A_MAX - A_MIN)) * plotW;
  const yToPx = (b: number) =>
    PAD_T + plotH - ((b - B_MIN) / (B_MAX - B_MIN)) * plotH;

  // Smooth the polyline through the AME-2020 sample points. We use a
  // Catmull-Rom-to-Bezier conversion for a clean physical-looking curve.
  const pathD = catmullRomPath(
    data.map((p) => ({ x: xToPx(p.A), y: yToPx(p.B_per_A_MeV) })),
  );

  const fe = data.find((p) => p.isotope === "Fe-56")!;
  const fePx = { x: xToPx(fe.A), y: yToPx(fe.B_per_A_MeV) };

  // Axis ticks
  const xTicks = [0, 50, 100, 150, 200, 250];
  const yTicks = [0, 2, 4, 6, 8, 9];

  return (
    <div className="flex w-full justify-center p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
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
          stroke="rgba(255,255,255,0.08)"
        />

        {/* Grid */}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xToPx(t)}
            y1={PAD_T}
            x2={xToPx(t)}
            y2={PAD_T + plotH}
            stroke="rgba(255,255,255,0.04)"
          />
        ))}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={PAD_L}
            y1={yToPx(t)}
            x2={PAD_L + plotW}
            y2={yToPx(t)}
            stroke="rgba(255,255,255,0.04)"
          />
        ))}

        {/* Axes */}
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke="rgba(255,255,255,0.5)"
        />
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={PAD_T + plotH}
          stroke="rgba(255,255,255,0.5)"
        />

        {/* Axis ticks + labels */}
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
              stroke="rgba(255,255,255,0.5)"
            />
            <text
              x={PAD_L - 8}
              y={yToPx(t) + 4}
              textAnchor="end"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.6)"
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
          fill="rgba(255,255,255,0.75)"
        >
          mass number A (nucleons)
        </text>
        <text
          x={18}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.75)"
          transform={`rotate(-90 18 ${PAD_T + plotH / 2})`}
        >
          binding energy per nucleon  B/A  (MeV)
        </text>

        {/* The curve itself */}
        <path
          d={pathD}
          fill="none"
          stroke="#67E8F9"
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
            fill={p.isotope === "Fe-56" ? "#FFB36B" : "#67E8F9"}
            stroke={p.isotope === "Fe-56" ? "#FFB36B" : "rgba(0,0,0,0.5)"}
            strokeWidth={p.isotope === "Fe-56" ? 1.5 : 0.5}
          />
        ))}

        {/* Iron-56 peak marker — vertical dashed guide + label */}
        <line
          x1={fePx.x}
          y1={fePx.y - 6}
          x2={fePx.x}
          y2={PAD_T + plotH}
          stroke="#FFB36B"
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
          fill="#FFB36B"
        >
          Fe-56  ·  8.79 MeV/A
        </text>
        <text
          x={fePx.x}
          y={fePx.y - 28}
          textAnchor="middle"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,179,107,0.85)"
        >
          peak — universe's energy minimum
        </text>

        {/* Fusion-side annotation (left of iron) */}
        <g>
          <text
            x={xToPx(20)}
            y={yToPx(2.5)}
            fontSize={12}
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
            fill="#86EFAC"
          >
            FUSION
          </text>
          <text
            x={xToPx(20)}
            y={yToPx(2.5) + 14}
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(134,239,172,0.85)"
          >
            light → heavier
          </text>
          <text
            x={xToPx(20)}
            y={yToPx(2.5) + 26}
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(134,239,172,0.85)"
          >
            releases energy ↑
          </text>
          {/* Arrow rising toward iron */}
          <path
            d={`M ${xToPx(8)} ${yToPx(0.6)} Q ${xToPx(30)} ${yToPx(7.0)} ${xToPx(50)} ${yToPx(8.4)}`}
            stroke="#86EFAC"
            strokeWidth={1.5}
            fill="none"
            opacity={0.55}
            markerEnd="url(#arrow-fusion)"
          />
        </g>

        {/* Fission-side annotation (right of iron) */}
        <g>
          <text
            x={xToPx(220)}
            y={yToPx(5.6)}
            textAnchor="end"
            fontSize={12}
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
            fill="#FCA5A5"
          >
            FISSION
          </text>
          <text
            x={xToPx(220)}
            y={yToPx(5.6) + 14}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(252,165,165,0.85)"
          >
            heavy → lighter
          </text>
          <text
            x={xToPx(220)}
            y={yToPx(5.6) + 26}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(252,165,165,0.85)"
          >
            releases energy ↓
          </text>
          <path
            d={`M ${xToPx(75)} ${yToPx(8.7)} Q ${xToPx(160)} ${yToPx(8.0)} ${xToPx(235)} ${yToPx(7.5)}`}
            stroke="#FCA5A5"
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
                fill="rgba(103,232,249,0.85)"
                textAnchor={p.isotope === "U-238" ? "end" : "start"}
              >
                {p.isotope}
              </text>
            );
          })}

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrow-fusion"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#86EFAC" opacity={0.7} />
          </marker>
          <marker
            id="arrow-fission"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#FCA5A5" opacity={0.7} />
          </marker>
        </defs>

        {/* HUD */}
        <text
          x={WIDTH - PAD_R - 6}
          y={PAD_T + 14}
          textAnchor="end"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.5)"
        >
          AME-2020 sample · 11 isotopes
        </text>
      </svg>
    </div>
  );
}

/**
 * Catmull-Rom spline → cubic Bezier path. Tension parameter alpha = 0.5
 * gives the centripetal version (no self-intersection on uneven sampling).
 */
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
