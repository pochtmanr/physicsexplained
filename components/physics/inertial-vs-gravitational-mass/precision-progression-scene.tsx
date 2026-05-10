"use client";

import { wepBoundTimeline } from "@/lib/physics/relativity/equivalence-mass";
import {
  hexToRgba,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * PrecisionProgressionScene — FIG.25c
 *
 * Historical bounds on the Eötvös parameter |η|, plotted on a log-y axis.
 * Static SVG — no animation, no interactivity.
 */

const WIDTH = 760;
const HEIGHT = 440;
const PAD_L = 80;
const PAD_R = 36;
const PAD_T = 56;
const PAD_B = 76;

const YEAR_MIN = 1550;
const YEAR_MAX = 2050;

const LOG_ETA_TOP = -16;
const LOG_ETA_BOTTOM = -2;

export function PrecisionProgressionScene() {
  const tokens = useSceneTokens();
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

  const gridFaint = hexToRgba(tokens.textBright, 0.04);
  const gridFrame = hexToRgba(tokens.textBright, 0.08);
  const tickColor = hexToRgba(tokens.textBright, 0.5);
  const labelColor = hexToRgba(tokens.textBright, 0.6);
  const titleColor = tokens.textBright;
  const axisTitle = hexToRgba(tokens.textBright, 0.75);

  return (
    <div className="flex w-full justify-center pb-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, display: "block" }}
        role="img"
        aria-label="Log-scale chart of historical bounds on the Eötvös parameter η, from Galileo 1589 (10⁻³) to MICROSCOPE 2017 (10⁻¹⁵)."
      >
        <rect
          x={PAD_L}
          y={PAD_T}
          width={plotW}
          height={plotH}
          fill="none"
          stroke={gridFrame}
        />

        {yTicks.map((t) => {
          const y = yToPx(Math.pow(10, t));
          return (
            <g key={`yt-${t}`}>
              <line
                x1={PAD_L}
                y1={y}
                x2={PAD_L + plotW}
                y2={y}
                stroke={gridFaint}
              />
              <line
                x1={PAD_L - 4}
                y1={y}
                x2={PAD_L}
                y2={y}
                stroke={tickColor}
              />
              <text
                x={PAD_L - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
                fill={labelColor}
              >
                10
                <tspan dy="-4" fontSize="9">
                  {t}
                </tspan>
              </text>
            </g>
          );
        })}

        {xTicks.map((t) => {
          const x = xToPx(t);
          return (
            <g key={`xt-${t}`}>
              <line
                x1={x}
                y1={PAD_T}
                x2={x}
                y2={PAD_T + plotH}
                stroke={gridFaint}
              />
              <line
                x1={x}
                y1={PAD_T + plotH}
                x2={x}
                y2={PAD_T + plotH + 4}
                stroke={tickColor}
              />
              <text
                x={x}
                y={PAD_T + plotH + 18}
                textAnchor="middle"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
                fill={labelColor}
              >
                {t}
              </text>
            </g>
          );
        })}

        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke={tickColor}
        />
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={PAD_T + plotH}
          stroke={tickColor}
        />

        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 32}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill={axisTitle}
        >
          year
        </text>
        <text
          x={22}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fill={axisTitle}
          transform={`rotate(-90 22 ${PAD_T + plotH / 2})`}
        >
          upper bound on |η| = |m_g − m_i| / m_i
        </text>

        <text
          x={WIDTH / 2}
          y={28}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fontFamily="ui-monospace, monospace"
          fill={titleColor}
        >
          400 years of testing m_g = m_i
        </text>
        <text
          x={WIDTH / 2}
          y={46}
          textAnchor="middle"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          fill={hexToRgba(tokens.mint, 0.85)}
        >
          14 orders of magnitude · still zero · still consistent with WEP
        </text>

        <path
          d={pathD}
          fill="none"
          stroke={tokens.cyan}
          strokeWidth={2}
          strokeOpacity={0.7}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

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
                fill={isMicroscope ? tokens.amber : tokens.cyan}
                stroke={isMicroscope ? tokens.amber : "rgba(0,0,0,0.5)"}
                strokeWidth={isMicroscope ? 1.5 : 0.5}
              />
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill={isMicroscope ? tokens.amber : hexToRgba(tokens.cyan, 0.85)}
              >
                {d.experiment}
              </text>
              <text
                x={x}
                y={labelY + 12}
                textAnchor="middle"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fill={hexToRgba(tokens.textBright, 0.45)}
              >
                {d.year}
              </text>
            </g>
          );
        })}

        <g>
          <line
            x1={xToPx(microscope.year)}
            y1={yToPx(microscope.bound)}
            x2={xToPx(microscope.year) - 70}
            y2={yToPx(microscope.bound) + 60}
            stroke={tokens.amber}
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
            fill={tokens.amber}
          >
            current state of the art
          </text>
          <text
            x={xToPx(microscope.year) - 70}
            y={yToPx(microscope.bound) + 90}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.amber, 0.8)}
          >
            Pt vs Ti, low-Earth orbit
          </text>
          <text
            x={xToPx(microscope.year) - 70}
            y={yToPx(microscope.bound) + 102}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.amber, 0.8)}
          >
            |η| &lt; 1.4 × 10⁻¹⁵
          </text>
        </g>

        <text
          x={PAD_L + plotW - 12}
          y={PAD_T + plotH - 10}
          textAnchor="end"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill={hexToRgba(tokens.red, 0.7)}
        >
          Aristotle&apos;s universe (excluded)
        </text>
        <text
          x={PAD_L + plotW - 12}
          y={PAD_T + 18}
          textAnchor="end"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill={hexToRgba(tokens.mint, 0.7)}
        >
          η = 0 (Einstein&apos;s universe)
        </text>
      </svg>
    </div>
  );
}
