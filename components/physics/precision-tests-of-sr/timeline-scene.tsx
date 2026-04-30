"use client";

import { precisionTestTimeline } from "@/lib/physics/relativity/precision-tests";

/**
 * FIG.24a — TimelineScene.
 *
 * Horizontal timeline of the canonical precision Lorentz-invariance tests
 * from 1887 to 2025. Each marker shows experiment + year; the y-axis is
 * the log-scale fractional bound on the relevant Lorentz-violating
 * coefficient. Nine orders of magnitude of progress in 138 years.
 *
 * Static SVG. Data: `precisionTestTimeline()`.
 *
 * Palette:
 *   • cyan   — main timeline + bound markers
 *   • amber  — modern frontier (latest entry)
 *   • white  — axes / labels
 */

const WIDTH = 760;
const HEIGHT = 420;
const PAD_L = 84;
const PAD_R = 32;
const PAD_T = 36;
const PAD_B = 64;

const YEAR_MIN = 1880;
const YEAR_MAX = 2030;

// log-scale bound axis: 10^LOG_TOP at top, 10^LOG_BOTTOM at bottom.
const LOG_TOP = -7; // 10^-7
const LOG_BOTTOM = -19; // 10^-19

export function TimelineScene() {
  const data = precisionTestTimeline();

  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const xToPx = (year: number) =>
    PAD_L + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * plotW;
  const yToPx = (bound: number) => {
    const log10 = Math.log10(bound);
    const t = (LOG_TOP - log10) / (LOG_TOP - LOG_BOTTOM);
    return PAD_T + t * plotH;
  };

  const yearTicks = [1890, 1920, 1950, 1980, 2010];
  const logTicks = [-9, -11, -13, -15, -17];

  // Polyline through all data points (chronological order).
  const polyline = data.map((p) => `${xToPx(p.year)},${yToPx(p.bound)}`).join(" ");

  const latest = data[data.length - 1];

  return (
    <div className="flex w-full justify-center p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        role="img"
        aria-label="Timeline of Lorentz-invariance tests from 1887 to 2025."
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
        {yearTicks.map((y) => (
          <line
            key={`gx-${y}`}
            x1={xToPx(y)}
            y1={PAD_T}
            x2={xToPx(y)}
            y2={PAD_T + plotH}
            stroke="rgba(255,255,255,0.04)"
          />
        ))}
        {logTicks.map((log10) => (
          <line
            key={`gy-${log10}`}
            x1={PAD_L}
            y1={yToPx(Math.pow(10, log10))}
            x2={PAD_L + plotW}
            y2={yToPx(Math.pow(10, log10))}
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

        {/* X axis ticks + labels */}
        {yearTicks.map((y) => (
          <g key={`xt-${y}`}>
            <line
              x1={xToPx(y)}
              y1={PAD_T + plotH}
              x2={xToPx(y)}
              y2={PAD_T + plotH + 4}
              stroke="rgba(255,255,255,0.5)"
            />
            <text
              x={xToPx(y)}
              y={PAD_T + plotH + 18}
              textAnchor="middle"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.6)"
            >
              {y}
            </text>
          </g>
        ))}

        {/* Y axis ticks + labels (log scale) */}
        {logTicks.map((log10) => (
          <g key={`yt-${log10}`}>
            <line
              x1={PAD_L - 4}
              y1={yToPx(Math.pow(10, log10))}
              x2={PAD_L}
              y2={yToPx(Math.pow(10, log10))}
              stroke="rgba(255,255,255,0.5)"
            />
            <text
              x={PAD_L - 8}
              y={yToPx(Math.pow(10, log10)) + 4}
              textAnchor="end"
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.6)"
            >
              10
              <tspan fontSize={9} dy={-4}>
                {log10}
              </tspan>
            </text>
          </g>
        ))}

        {/* Axis titles */}
        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 18}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.75)"
        >
          year
        </text>
        <text
          x={20}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.75)"
          transform={`rotate(-90 20 ${PAD_T + plotH / 2})`}
        >
          fractional bound on Lorentz violation (log scale)
        </text>

        {/* Connecting polyline (cyan trend) */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#67E8F9"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.55}
        />

        {/* Data markers */}
        {data.map((p, i) => {
          const isLatest = i === data.length - 1;
          const x = xToPx(p.year);
          const y = yToPx(p.bound);
          const fill = isLatest ? "#FFB36B" : "#67E8F9";
          const stroke = isLatest ? "#FFB36B" : "#67E8F9";
          // Stagger labels above/below so they don't collide.
          const labelAbove = i % 2 === 0;
          const labelDy = labelAbove ? -14 : 26;
          const subDy = labelAbove ? -28 : 40;
          return (
            <g key={`pt-${p.year}-${i}`}>
              {/* Vertical drop line down to the year axis */}
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={PAD_T + plotH}
                stroke={fill}
                strokeWidth={0.75}
                strokeDasharray="2 4"
                opacity={0.4}
              />
              <circle
                cx={x}
                cy={y}
                r={isLatest ? 5.5 : 4}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
              />
              <text
                x={x}
                y={y + labelDy}
                textAnchor="middle"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fontWeight={isLatest ? 600 : 500}
                fill={fill}
              >
                {p.experiment.length > 26
                  ? p.experiment.slice(0, 24) + "…"
                  : p.experiment}
              </text>
              <text
                x={x}
                y={y + subDy}
                textAnchor="middle"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.55)"
              >
                {p.year} · 10
                <tspan fontSize={8} dy={-3}>
                  {Math.round(Math.log10(p.bound))}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Improvement arrow + caption */}
        <g>
          <text
            x={WIDTH - PAD_R - 6}
            y={PAD_T + 14}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,179,107,0.85)"
          >
            modern frontier · {latest.experiment.split(" (")[0]}
          </text>
          <text
            x={WIDTH - PAD_R - 6}
            y={PAD_T + 28}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,255,255,0.5)"
          >
            9 orders of magnitude · 138 years
          </text>
        </g>
      </svg>
    </div>
  );
}
