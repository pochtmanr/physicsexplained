"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  SIGMA_AL,
  SIGMA_CU,
  SIGMA_FE,
  SIGMA_SEAWATER,
  skinDepth,
} from "@/lib/physics/electromagnetism/skin-depth";
import { MU_0 } from "@/lib/physics/constants";

const RATIO = 0.52;
const MAX_HEIGHT = 380;

const AMBER = "rgba(255, 180, 80,";
const LILAC = "rgba(200, 160, 255,";
const CYAN = "rgba(120, 220, 255,";

type MaterialKey = "Cu" | "Al" | "Fe" | "Seawater";
const MATERIALS: Record<MaterialKey, { sigma: number; mu: number; label: string }> = {
  Cu: { sigma: SIGMA_CU, mu: MU_0, label: "Copper" },
  Al: { sigma: SIGMA_AL, mu: MU_0, label: "Aluminum" },
  // Iron is magnetic — μ_r ≈ 200 inside a typical low-carbon steel, which
  // collapses δ by roughly ×14 compared to the same-σ non-magnetic metal.
  Fe: { sigma: SIGMA_FE, mu: MU_0 * 200, label: "Iron (μᵣ≈200)" },
  Seawater: { sigma: SIGMA_SEAWATER, mu: MU_0, label: "Seawater" },
};

/**
 * FIG.43a — exponential decay of |E| vs depth into a conductor.
 *
 * The field inside a good conductor satisfies E(z) = E₀·exp(−z/δ), so a
 * log-plot becomes a straight line with slope −1/δ. The scene draws a
 * linear-axis view: depth z on the horizontal axis, |E|/|E₀| on the
 * vertical. A dashed marker sits at z = δ (amplitude has fallen to 1/e),
 * another at z = 5δ (amplitude ~0.7%).
 *
 * Frequency slider sweeps 50 Hz → 10 GHz on a log scale; material dropdown
 * switches Cu / Al / Fe / seawater. HUD prints δ in whichever unit is
 * human-scale (m / mm / μm / nm).
 */
export function SkinDepthDecayScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 380 });
  // log10(f / 1 Hz): from 1.7 (50 Hz) to 10 (10 GHz).
  const [logF, setLogF] = useState(9); // 1 GHz default
  const [material, setMaterial] = useState<MaterialKey>("Cu");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      // ─── Compute δ ─────────────────────────────────────────────────────
      const freqHz = Math.pow(10, logF);
      const omega = 2 * Math.PI * freqHz;
      const mat = MATERIALS[material];
      const delta = skinDepth(mat.sigma, omega, mat.mu);

      // ─── Plot frame ────────────────────────────────────────────────────
      const padL = 56;
      const padR = 24;
      const padT = 20;
      const padB = 48;
      const plotX0 = padL;
      const plotX1 = width - padR;
      const plotY0 = padT;
      const plotY1 = height - padB;
      const plotW = plotX1 - plotX0;
      const plotH = plotY1 - plotY0;

      // x-axis: depth from 0 to 5·δ in physical units, normalised to plotW.
      // y-axis: |E|/|E₀| from 0 to 1.
      const zMaxUnits = 5;
      const xOf = (zOverDelta: number) =>
        plotX0 + (zOverDelta / zMaxUnits) * plotW;
      const yOf = (amp: number) => plotY1 - amp * plotH;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotX0, plotY0);
      ctx.lineTo(plotX0, plotY1);
      ctx.lineTo(plotX1, plotY1);
      ctx.stroke();

      // Gridlines at 0.25, 0.5, 0.75, 1.0
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      for (const y of [0.25, 0.5, 0.75, 1.0]) {
        ctx.beginPath();
        ctx.moveTo(plotX0, yOf(y));
        ctx.lineTo(plotX1, yOf(y));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // y-axis labels
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      for (const y of [0, 0.25, 0.5, 0.75, 1.0]) {
        ctx.fillText(y.toFixed(2), plotX0 - 6, yOf(y) + 3);
      }
      ctx.textAlign = "center";
      for (let k = 0; k <= 5; k++) {
        ctx.fillText(`${k}δ`, xOf(k), plotY1 + 14);
      }

      // 1/e horizontal reference
      const inverseE = 1 / Math.E;
      ctx.strokeStyle = `${AMBER} 0.5)`;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(plotX0, yOf(inverseE));
      ctx.lineTo(plotX1, yOf(inverseE));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "left";
      ctx.fillStyle = `${AMBER} 0.85)`;
      ctx.fillText("1/e ≈ 0.368", plotX0 + 6, yOf(inverseE) - 4);

      // ─── The exponential curve — with a subtle animated shimmer to
      // suggest the wave is propagating and losing amplitude in real time.
      const shimmer = 0.04 * Math.sin(t * 2.5);
      ctx.strokeStyle = `${LILAC} 0.95)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const z = (i / N) * zMaxUnits;
        const amp = Math.exp(-z) * (1 + shimmer * Math.cos(z * 4 - t * 6));
        const x = xOf(z);
        const y = yOf(Math.max(0, amp));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Marker at z = δ
      ctx.strokeStyle = `${CYAN} 0.8)`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xOf(1), plotY0);
      ctx.lineTo(xOf(1), plotY1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `${CYAN} 0.9)`;
      ctx.textAlign = "center";
      ctx.fillText("z = δ", xOf(1), plotY0 - 6);

      // ─── HUD ───────────────────────────────────────────────────────────
      const prettyDelta = (() => {
        if (delta >= 1) return `${delta.toFixed(2)} m`;
        if (delta >= 1e-3) return `${(delta * 1e3).toFixed(2)} mm`;
        if (delta >= 1e-6) return `${(delta * 1e6).toFixed(2)} µm`;
        return `${(delta * 1e9).toFixed(2)} nm`;
      })();
      const prettyFreq = (() => {
        if (freqHz >= 1e9) return `${(freqHz / 1e9).toFixed(2)} GHz`;
        if (freqHz >= 1e6) return `${(freqHz / 1e6).toFixed(2)} MHz`;
        if (freqHz >= 1e3) return `${(freqHz / 1e3).toFixed(2)} kHz`;
        return `${freqHz.toFixed(1)} Hz`;
      })();

      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        "|E(z)| / |E₀|  =  exp(−z/δ)",
        plotX0 + 8,
        plotY0 + 14,
      );

      ctx.textAlign = "right";
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.fillText(`δ = ${prettyDelta}`, plotX1 - 4, plotY0 + 14);
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg3;
      ctx.fillText(`${mat.label} @ ${prettyFreq}`, plotX1 - 4, plotY0 + 30);
    },
  });

  const freqHz = Math.pow(10, logF);
  const prettyFreq = (() => {
    if (freqHz >= 1e9) return `${(freqHz / 1e9).toFixed(2)} GHz`;
    if (freqHz >= 1e6) return `${(freqHz / 1e6).toFixed(2)} MHz`;
    if (freqHz >= 1e3) return `${(freqHz / 1e3).toFixed(2)} kHz`;
    return `${freqHz.toFixed(1)} Hz`;
  })();

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Frequency</label>
        <input
          type="range"
          min={1.7}
          max={10}
          step={0.01}
          value={logF}
          onChange={(e) => setLogF(parseFloat(e.target.value))}
          className="accent-[rgb(200,160,255)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {prettyFreq}
        </span>

        <label className="text-[var(--color-fg-3)]">Material</label>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value as MaterialKey)}
          className="col-span-2 border border-[var(--color-fg-4)] bg-transparent px-2 py-1 font-mono text-xs text-[var(--color-fg-1)]"
        >
          {(Object.keys(MATERIALS) as MaterialKey[]).map((k) => (
            <option key={k} value={k} className="bg-[var(--color-bg-1)]">
              {MATERIALS[k].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
