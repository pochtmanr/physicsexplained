"use client";

import {
  naivePlanckScaleBound,
  naturalnessGapOrders,
  precisionTestTimeline,
} from "@/lib/physics/relativity/precision-tests";
import {
  hexToRgba,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.24c — WhyNotBrokenScene.
 *
 * The naturalness puzzle. A chart of "where Lorentz violation could have
 * been" versus "where it actually is, after a hundred years of looking."
 *
 * Three reference lines on a single log-scale axis:
 *   1. Naïve quantum-gravity expectation     ~10⁻⁴   (v_orbit / c)
 *   2. Tightest current photon-sector bound  ~10⁻¹⁸  (Sr/Yb clocks)
 *   3. Tightest current matter-sector bound  ~10⁻³¹  (He-3/Xe co-mag)
 *
 * The gap between (1) and (2) is the puzzle. Quantum gravity is *supposed*
 * to break Lorentz invariance at the Planck scale — but if it does, the
 * violation is fourteen-plus orders of magnitude smaller than the naïve
 * estimate. Either Lorentz invariance is exact, or whatever protects it
 * is one of the strongest symmetries in nature.
 *
 * Static SVG. Data: `naivePlanckScaleBound`, `precisionTestTimeline`,
 * `naturalnessGapOrders`.
 */

const WIDTH = 760;
const HEIGHT = 380;
const PAD_L = 64;
const PAD_R = 32;
const PAD_T = 36;
const PAD_B = 64;

// log-scale x axis. LOG_LEFT (looser) → left. LOG_RIGHT (tighter) → right.
const LOG_LEFT = 0;
const LOG_RIGHT = -32;

interface MarkerEntry {
  readonly log10: number;
  readonly label: string;
  readonly sub: string;
  readonly color: string;
}

const NAIVE = naivePlanckScaleBound();
const TL = precisionTestTimeline();
const PHOTON_FRONTIER = TL[TL.length - 1].bound;

export function WhyNotBrokenScene() {
  const tokens = useSceneTokens();
  const plotW = WIDTH - PAD_L - PAD_R;

  const MARKERS: readonly MarkerEntry[] = [
    {
      log10: 0,
      label: "Newtonian limit",
      sub: "no Lorentz constraint",
      color: tokens.textMute,
    },
    {
      log10: Math.log10(NAIVE),
      label: "naïve quantum-gravity expectation",
      sub: "≈ v⊕ / c",
      color: tokens.red,
    },
    {
      log10: Math.log10(PHOTON_FRONTIER),
      label: "modern photon-sector bound",
      sub: "Sr / Yb optical clocks",
      color: tokens.cyan,
    },
    {
      log10: -31,
      label: "neutron-sector bound",
      sub: "He-3 / Xe co-magnetometer",
      color: tokens.green,
    },
  ];

  const xToPx = (log10: number) => {
    const t = (LOG_LEFT - log10) / (LOG_LEFT - LOG_RIGHT);
    return PAD_L + t * plotW;
  };

  const axisY = HEIGHT - PAD_B;
  const xTicks = [0, -4, -8, -12, -16, -20, -24, -28, -32];

  const gap = naturalnessGapOrders(PHOTON_FRONTIER);

  return (
    <div className="flex w-full justify-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, background: tokens.bg }}
        className="block"
        role="img"
        aria-label="Comparison of naïve quantum-gravity expectation versus modern bounds on Lorentz violation."
      >
        <text
          x={PAD_L}
          y={PAD_T - 14}
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
          fill={tokens.textDim}
        >
          The naturalness puzzle: bounds vs. naïve expectation
        </text>

        <line
          x1={PAD_L}
          y1={axisY}
          x2={PAD_L + plotW}
          y2={axisY}
          stroke={tokens.axes}
        />

        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={xToPx(t)}
              y1={axisY}
              x2={xToPx(t)}
              y2={axisY + 4}
              stroke={tokens.axes}
            />
            <text
              x={xToPx(t)}
              y={axisY + 18}
              textAnchor="middle"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
              fill={tokens.textMute}
            >
              10
              <tspan fontSize={8} dy={-3}>
                {t}
              </tspan>
            </text>
          </g>
        ))}

        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 18}
          textAnchor="middle"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          fill={tokens.textDim}
        >
          fractional Lorentz-violating coefficient (log scale)
        </text>

        {/* Naturalness gap shaded band */}
        <rect
          x={xToPx(Math.log10(NAIVE))}
          y={PAD_T + 16}
          width={Math.max(
            1,
            xToPx(Math.log10(PHOTON_FRONTIER)) - xToPx(Math.log10(NAIVE)),
          )}
          height={axisY - PAD_T - 16}
          fill="url(#gapFill)"
          opacity={0.18}
        />
        <defs>
          <linearGradient id="gapFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tokens.red} stopOpacity={0.6} />
            <stop offset="100%" stopColor={tokens.cyan} stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {MARKERS.map((m, i) => {
          const x = xToPx(m.log10);
          const labelY = PAD_T + 22 + (i % 2 === 0 ? 0 : 28);
          return (
            <g key={`m-${i}`}>
              <line
                x1={x}
                y1={PAD_T + 18}
                x2={x}
                y2={axisY}
                stroke={m.color}
                strokeWidth={i === 1 || i === 2 ? 2 : 1}
                strokeDasharray={i === 1 ? "4 3" : undefined}
                opacity={0.85}
              />
              <circle cx={x} cy={axisY} r={4} fill={m.color} />
              <rect
                x={x - 90}
                y={labelY - 12}
                width={180}
                height={32}
                fill={hexToRgba(tokens.bg, 0.85)}
                stroke={m.color}
                strokeOpacity={0.4}
                strokeWidth={0.6}
                rx={3}
              />
              <text
                x={x}
                y={labelY + 1}
                textAnchor="middle"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fontWeight={600}
                fill={m.color}
              >
                {m.label}
              </text>
              <text
                x={x}
                y={labelY + 14}
                textAnchor="middle"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fill={tokens.textMute}
              >
                {m.sub}
              </text>
            </g>
          );
        })}

        <g>
          <text
            x={
              (xToPx(Math.log10(NAIVE)) + xToPx(Math.log10(PHOTON_FRONTIER))) /
              2
            }
            y={axisY - 16}
            textAnchor="middle"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
            fill={hexToRgba(tokens.amber, 0.92)}
          >
            ← {gap.toFixed(0)} orders of magnitude →
          </text>
          <text
            x={
              (xToPx(Math.log10(NAIVE)) + xToPx(Math.log10(PHOTON_FRONTIER))) /
              2
            }
            y={axisY - 2}
            textAnchor="middle"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={hexToRgba(tokens.amber, 0.7)}
          >
            the naturalness gap
          </text>
        </g>

        <g>
          <text
            x={WIDTH - PAD_R - 6}
            y={PAD_T + 4}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={tokens.textMute}
          >
            quantum gravity · string vacua · Lorentz cosmologies
          </text>
        </g>
      </svg>
    </div>
  );
}
