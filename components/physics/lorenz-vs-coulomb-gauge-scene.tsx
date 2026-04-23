"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

const RATIO = 0.5;
const MAX_HEIGHT = 340;

/**
 * Multi-line plot of ∇·A(t) in two gauges, for the same physical setup.
 *
 * The scenario we trace: a charge density ρ(t) oscillating at angular
 * frequency ω, producing a scalar potential V(t) ∝ cos(ω t) somewhere.
 * From ∂V/∂t = −V₀·ω·sin(ω t) we can read off what ∇·A must be in each
 * gauge:
 *
 *   Coulomb gauge:  ∇·A_C(t)  ≡  0                 (by definition)
 *   Lorenz  gauge:  ∇·A_L(t)  =  −(1/c²) ∂V/∂t     (by the Lorenz condition)
 *
 * Two traces. The Coulomb trace is a dead flat line at zero. The Lorenz
 * trace is a shifted sinusoid whose amplitude is V₀·ω / c². Both are
 * correct; they just impose different constraints on A.
 *
 * For the y-scale to be visible we set c = 1 in scene units — the ratio
 * between the two constraints is what matters, not the SI numerical value
 * (which would make the Lorenz residual invisibly small at scale).
 */

type ScenarioKey = "slow" | "fast";

const SCENARIOS: Record<
  ScenarioKey,
  { label: string; V0: number; omega: number; cScene: number }
> = {
  slow: {
    label: "slow  (ω = 1)",
    V0: 1.0,
    omega: 1.0,
    cScene: 1.0,
  },
  fast: {
    label: "fast  (ω = 3)",
    V0: 1.0,
    omega: 3.0,
    cScene: 1.0,
  },
};

export function LorenzVsCoulombGaugeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [scenario, setScenario] = useState<ScenarioKey>("slow");
  const [size, setSize] = useState({ width: 640, height: 340 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (tSec) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const { V0, omega, cScene } = SCENARIOS[scenario];

      // Plot geometry
      const padL = 58;
      const padR = 16;
      const padT = 24;
      const padB = 54;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const plotMid = padT + plotH / 2;

      // x-axis: time, rolling window
      const tSpan = 6; // seconds of history
      const tNow = tSec;
      const tMin = tNow - tSpan;
      const tToPx = (t: number) =>
        padL + ((t - tMin) / tSpan) * plotW;

      // y-axis: a comfortable band covering ±(V₀ ω / c²) + headroom
      const yMax = (V0 * omega) / (cScene * cScene) * 1.25 || 1;
      const yToPx = (y: number) =>
        plotMid - (y / yMax) * (plotH / 2);

      // Axes + gridlines
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.6;
      ctx.strokeRect(padL, padT, plotW, plotH);
      ctx.beginPath();
      ctx.moveTo(padL, plotMid);
      ctx.lineTo(padL + plotW, plotMid);
      ctx.stroke();

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("+", padL - 4, padT + 10);
      ctx.fillText("0", padL - 4, plotMid + 3);
      ctx.fillText("−", padL - 4, padT + plotH - 4);
      ctx.textAlign = "left";
      ctx.fillText("∇·A", padL + 4, padT + 12);
      ctx.textAlign = "right";
      ctx.fillText("t →", padL + plotW - 4, padT + plotH - 4);

      // Coulomb trace: flat line at 0
      ctx.strokeStyle = "#FF6ADE"; // magenta = Coulomb
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, plotMid);
      ctx.lineTo(padL + plotW, plotMid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lorenz trace:  ∇·A_L(t) = −(1/c²) ∂V/∂t
      //               = −(1/c²) · (−V₀ ω sin(ωt))
      //               = (V₀ ω / c²) sin(ωt)
      ctx.strokeStyle = "rgba(200, 160, 255, 0.95)"; // lilac = displacement/gauge accent
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const N = 240;
      for (let i = 0; i <= N; i++) {
        const t = tMin + (i / N) * tSpan;
        const divA_L = ((V0 * omega) / (cScene * cScene)) * Math.sin(omega * t);
        const px = tToPx(t);
        const py = yToPx(divA_L);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // "now" marker
      const pxNow = tToPx(tNow);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(pxNow, padT);
      ctx.lineTo(pxNow, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current values
      const divA_L_now =
        ((V0 * omega) / (cScene * cScene)) * Math.sin(omega * tNow);
      const residual_C_now = 0 + (-V0 * omega * Math.sin(omega * tNow)) / (cScene * cScene);
      // For Coulomb: residual of the Lorenz condition = ∇·A_C + (1/c²)∂V/∂t
      //            = 0 + (1/c²)·(−V₀ ω sin ω t) = −(V₀ ω / c²) sin ω t
      // — which is exactly −divA_L_now, shown so readers see that Coulomb
      // fails the Lorenz condition whenever V is time-dependent.

      // Legend
      const legY = height - 32;
      ctx.fillStyle = "#FF6ADE";
      ctx.fillRect(padL, legY, 14, 3);
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Coulomb:  ∇·A = 0", padL + 20, legY + 4);
      ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
      ctx.fillRect(padL + 200, legY, 14, 3);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        "Lorenz:  ∇·A = −(1/c²) ∂V/∂t",
        padL + 220,
        legY + 4,
      );

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `c (scene) = ${cScene.toFixed(1)}   |   real c = ${SPEED_OF_LIGHT.toExponential(2)} m/s`,
        width - padR,
        height - 16,
      );
      ctx.textAlign = "left";
      ctx.fillText(
        `now: ∇·A_L = ${divA_L_now.toFixed(3)},  Lorenz-residual in Coulomb = ${residual_C_now.toFixed(3)}`,
        padL,
        height - 16,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">ω:</span>
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setScenario(k)}
            className={
              "rounded border px-2 py-1 transition " +
              (k === scenario
                ? "border-[#FFD66B] text-[#FFD66B]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-1)] hover:border-[var(--color-fg-3)]")
            }
          >
            {SCENARIOS[k].label}
          </button>
        ))}
        <span className="ml-auto text-[var(--color-fg-3)]">
          magenta dashed = Coulomb · lilac = Lorenz
        </span>
      </div>
    </div>
  );
}
