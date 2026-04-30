"use client";

import { wepBoundTimeline } from "@/lib/physics/relativity/equivalence-mass";

/**
 * PrecisionProgressionScene — FIG.25c
 *
 * Historical bounds on the Eötvös parameter |η|, plotted on a log-y axis from
 * 10⁻¹⁵ (modern) to 10⁻² (Galileo). Each data point is a published upper limit;
 * each downward step is an order-of-magnitude (or multi-order) improvement.
 *
 * Take-home: |η| has been driven from ~10⁻³ (Galileo, 1589) to ~10⁻¹⁵
 * (MICROSCOPE, 2017) — fourteen orders of magnitude in four hundred years, and
 * still consistent with zero. The weak equivalence principle is one of the
 * most precisely tested statements in physics.
 *
 * Static SVG — no animation, no interactivity. Data sourced from the
 * `wepBoundTimeline()` helper in `equivalence-mass.ts`.
 *
 * Palette:
 *   • cyan  — data points + curve
 *   • amber — MICROSCOPE 2017 marker (current state of the art)
 *   • green — accent on the WEP-holds-everywhere headline
 */

const WIDTH = 760;
const HEIGHT = 440;
const PAD_L = 80;
const PAD_R = 36;
const PAD_T = 56;
const PAD_B = 76;

const YEAR_MIN = 1550;
const YEAR_MAX = 2050;

// log10(η) axis: top = -16 (tighter), bottom = -2 (looser)
const LOG_ETA_TOP = -16;
const LOG_ETA_BOTTOM = -2;

export function PrecisionProgressionScene() {
  const data = wepBoundTimeline();
  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const xToPx = (year: number) =>
    PAD_L + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * plotW;
  const yToPx = (eta: number) => {
    const logEta = Math.log10(eta);
    const u = (logEta - LOG_ETA_BOTTOM) / (LOG_ETA_TOP - LOG_ETA_BOTTOM);
    return PAD_T + u * plotH;
  };

  const yTicks = [-2, -4, -6, -8, -10, -12, -14, -16];
  const xTicks = [1600, 1700, 1800, 1900, 2000];

  const pathD = data
    .map((d, i) => {
      const x = xToPx(d.year);
      const y = yToPx(d.bound);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const microscope = data[data.length - 1];

  return (
    <div className="flex w-full justify-center p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        role="img"
        aria-label="Log-scale chart of historical bounds on the Eötvös parameter η, from Galileo 1589 (10⁻³) to MICROSCOPE 2017 (10⁻¹⁵)."
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

        {/* Y-grid + log labels */}
        {yTicks.map((t) => {
          const y = yToPx(Math.pow(10, t));
          return (
            <g key={`yt-${t}`}>
              <line
                x1={PAD_L}
                y1={y}
                x2={PAD_L + plotW}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
              />
              <line
                x1={PAD_L - 4}
                y1={y}
                x2={PAD_L}
                y2={y}
                stroke="rgba(255,255,255,0.5)"
              />
              <text
                x={PAD_L - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.6)"
              >
                10
                <tspan dy="-4" fontSize="9">
                  {t}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* X-grid + year labels */}
        {xTicks.map((t) => {
          const x = xToPx(t);
          return (
            <g key={`xt-${t}`}>
              <line
                x1={x}
                y1={PAD_T}
                x2={x}
                y2={PAD_T + plotH}
                stroke="rgba(255,255,255,0.04)"
              />
              <line
                x1={x}
                y1={PAD_T + plotH}
                x2={x}
                y2={PAD_T + plotH + 4}
                stroke="rgba(255,255,255,0.5)"
              />
              <text
                x={x}
                y={PAD_T + plotH + 18}
                textAnchor="middle"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.6)"
              >
                {t}
              </text>
            </g>
          );
        })}

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

        {/* Axis titles */}
        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 32}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.75)"
        >
          year
        </text>
        <text
          x={22}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.75)"
          transform={`rotate(-90 22 ${PAD_T + plotH / 2})`}
        >
          upper bound on |η| = |m_g − m_i| / m_i
        </text>

        {/* Title */}
        <text
          x={WIDTH / 2}
          y={28}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.92)"
        >
          400 years of testing m_g = m_i
        </text>
        <text
          x={WIDTH / 2}
          y={46}
          textAnchor="middle"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          fill="rgba(134,239,172,0.85)"
        >
          14 orders of magnitude · still zero · still consistent with WEP
        </text>

        {/* The progression line */}
        <path
          d={pathD}
          fill="none"
          stroke="#67E8F9"
          strokeWidth={2}
          strokeOpacity={0.7}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Per-experiment data points + labels */}
        {data.map((d) => {
          const x = xToPx(d.year);
          const y = yToPx(d.bound);
          const isMicroscope = /MICROSCOPE/.test(d.experiment);
          const labelY = y - 10;
          return (
            <g key={d.experiment}>
              <circle
                cx={x}
                cy={y}
                r={isMicroscope ? 6 : 4}
                fill={isMicroscope ? "#FFB36B" : "#67E8F9"}
                stroke={isMicroscope ? "#FFB36B" : "rgba(0,0,0,0.5)"}
                strokeWidth={isMicroscope ? 1.5 : 0.5}
              />
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill={isMicroscope ? "#FFB36B" : "rgba(103,232,249,0.85)"}
              >
                {d.experiment}
              </text>
              <text
                x={x}
                y={labelY + 12}
                textAnchor="middle"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.45)"
              >
                {d.year}
              </text>
            </g>
          );
        })}

        {/* MICROSCOPE callout */}
        <g>
          <line
            x1={xToPx(microscope.year)}
            y1={yToPx(microscope.bound)}
            x2={xToPx(microscope.year) - 70}
            y2={yToPx(microscope.bound) + 60}
            stroke="#FFB36B"
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={xToPx(microscope.year) - 70}
            y={yToPx(microscope.bound) + 76}
            textAnchor="end"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
            fill="#FFB36B"
          >
            current state of the art
          </text>
          <text
            x={xToPx(microscope.year) - 70}
            y={yToPx(microscope.bound) + 90}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,179,107,0.8)"
          >
            Pt vs Ti, low-Earth orbit
          </text>
          <text
            x={xToPx(microscope.year) - 70}
            y={yToPx(microscope.bound) + 102}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,179,107,0.8)"
          >
            |η| &lt; 1.4 × 10⁻¹⁵
          </text>
        </g>

        {/* WEP-holds region annotation */}
        <text
          x={PAD_L + plotW - 12}
          y={PAD_T + plotH - 10}
          textAnchor="end"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill="rgba(252,165,165,0.7)"
        >
          Aristotle's universe (excluded)
        </text>
        <text
          x={PAD_L + plotW - 12}
          y={PAD_T + 18}
          textAnchor="end"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill="rgba(134,239,172,0.7)"
        >
          η = 0 (Einstein's universe)
        </text>
      </svg>
    </div>
  );
}
