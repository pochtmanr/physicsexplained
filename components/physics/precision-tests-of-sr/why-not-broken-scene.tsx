"use client";

import {
  naivePlanckScaleBound,
  naturalnessGapOrders,
  precisionTestTimeline,
} from "@/lib/physics/relativity/precision-tests";

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

const NAIVE = naivePlanckScaleBound(); // ~1e-4
const TL = precisionTestTimeline();
const PHOTON_FRONTIER = TL[TL.length - 1].bound; // 1e-18

const MARKERS: readonly MarkerEntry[] = [
  {
    log10: 0,
    label: "Newtonian limit",
    sub: "no Lorentz constraint",
    color: "rgba(255,255,255,0.35)",
  },
  {
    log10: Math.log10(NAIVE),
    label: "naïve quantum-gravity expectation",
    sub: "≈ v⊕ / c",
    color: "#FCA5A5", // red — the "natural" estimate
  },
  {
    log10: Math.log10(PHOTON_FRONTIER),
    label: "modern photon-sector bound",
    sub: "Sr / Yb optical clocks",
    color: "#67E8F9", // cyan — the data
  },
  {
    log10: -31,
    label: "neutron-sector bound",
    sub: "He-3 / Xe co-magnetometer",
    color: "#86EFAC", // green
  },
];

export function WhyNotBrokenScene() {
  const plotW = WIDTH - PAD_L - PAD_R;

  const xToPx = (log10: number) => {
    const t = (LOG_LEFT - log10) / (LOG_LEFT - LOG_RIGHT);
    return PAD_L + t * plotW;
  };

  const axisY = HEIGHT - PAD_B;
  const xTicks = [0, -4, -8, -12, -16, -20, -24, -28, -32];

  const gap = naturalnessGapOrders(PHOTON_FRONTIER);

  return (
    <div className="flex w-full justify-center p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        role="img"
        aria-label="Comparison of naïve quantum-gravity expectation versus modern bounds on Lorentz violation."
      >
        {/* Title */}
        <text
          x={PAD_L}
          y={PAD_T - 14}
          fontSize={12}
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
          fill="rgba(255,255,255,0.85)"
        >
          The naturalness puzzle: bounds vs. naïve expectation
        </text>

        {/* Main axis */}
        <line
          x1={PAD_L}
          y1={axisY}
          x2={PAD_L + plotW}
          y2={axisY}
          stroke="rgba(255,255,255,0.5)"
        />

        {/* Tick marks + labels */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={xToPx(t)}
              y1={axisY}
              x2={xToPx(t)}
              y2={axisY + 4}
              stroke="rgba(255,255,255,0.5)"
            />
            <text
              x={xToPx(t)}
              y={axisY + 18}
              textAnchor="middle"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.55)"
            >
              10
              <tspan fontSize={8} dy={-3}>
                {t}
              </tspan>
            </text>
          </g>
        ))}

        {/* Axis title */}
        <text
          x={PAD_L + plotW / 2}
          y={HEIGHT - 18}
          textAnchor="middle"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          fill="rgba(255,255,255,0.65)"
        >
          fractional Lorentz-violating coefficient (log scale)
        </text>

        {/* The "naturalness gap" shaded band — between naïve and modern */}
        <rect
          x={xToPx(Math.log10(NAIVE))}
          y={PAD_T + 16}
          width={Math.max(1, xToPx(Math.log10(PHOTON_FRONTIER)) - xToPx(Math.log10(NAIVE)))}
          height={axisY - PAD_T - 16}
          fill="url(#gapFill)"
          opacity={0.18}
        />
        <defs>
          <linearGradient id="gapFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#67E8F9" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {/* Markers — vertical lines + labels */}
        {MARKERS.map((m, i) => {
          const x = xToPx(m.log10);
          // Stagger label heights so they don't overlap.
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
                fill="rgba(10,12,18,0.85)"
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
                fill="rgba(255,255,255,0.55)"
              >
                {m.sub}
              </text>
            </g>
          );
        })}

        {/* The gap callout */}
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
            fill="rgba(255,179,107,0.92)"
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
            fill="rgba(255,179,107,0.7)"
          >
            the naturalness gap
          </text>
        </g>

        {/* HUD: motivations to look + the verdict */}
        <g>
          <text
            x={WIDTH - PAD_R - 6}
            y={PAD_T + 4}
            textAnchor="end"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="rgba(255,255,255,0.55)"
          >
            quantum gravity · string vacua · Lorentz cosmologies
          </text>
        </g>
      </svg>
    </div>
  );
}
