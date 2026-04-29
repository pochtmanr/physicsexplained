"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  fresnelDragCoefficient,
  fresnelLinearApproximation,
  partialDraggingFizeau,
  REFRACTIVE_INDEX_GLASS,
  REFRACTIVE_INDEX_WATER,
} from "@/lib/physics/relativity/velocity-addition";

/**
 * FIG.09c — Fizeau 1851 partial-dragging measurement.
 *
 * Light enters a horizontal water tube; water flows rightward at slider-
 * controlled speed v_water; light propagates rightward through it. The
 * scene plots three numbers:
 *
 *   • Stationary water: light moves at c/n (no drag, baseline cyan).
 *   • Full Galilean drag: light moves at c/n + v_water (amber, the
 *     "aether is fully dragged" hypothesis Fresnel ruled out in 1818).
 *   • Fresnel partial drag: light moves at c/n + v_water · (1 − 1/n²).
 *     This is what Fizeau measured. It is also exactly the v/c-order
 *     expansion of the relativistic velocity-addition formula. The
 *     coefficient `1 − 1/n²` is the cleanest single-line confirmation
 *     of pre-Einstein-special-relativity that nineteenth-century optics
 *     ever produced.
 *
 * The reader controls n (water/glass preset + custom slider) and
 * v_water. At everyday water speeds (~7 m/s) the relativistic and
 * Fresnel curves are visually identical; the slider lets v_water climb
 * into the relativistic regime, where the two diverge.
 *
 * Palette:
 *   amber    — full Galilean drag (refuted)
 *   cyan     — stationary-water baseline c/n
 *   magenta  — Fresnel/relativistic answer (this is what 1851 saw)
 */

const RATIO = 0.5;
const MAX_HEIGHT = 360;

type Preset = "water" | "glass" | "custom";

const PRESETS: Record<"water" | "glass", number> = {
  water: REFRACTIVE_INDEX_WATER,
  glass: REFRACTIVE_INDEX_GLASS,
};

export function FizeauWaterTubeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [preset, setPreset] = useState<Preset>("water");
  const [customN, setCustomN] = useState(1.33);
  // Water-speed slider expressed as fraction of c. Default 0.05 c — far
  // above Fizeau's actual rate (~2e-8 c) but visually meaningful and
  // mathematically still in the linear-Fresnel regime.
  const [betaWater, setBetaWater] = useState(0.05);

  const presetRef = useRef(preset);
  const customNRef = useRef(customN);
  const betaRef = useRef(betaWater);
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);
  useEffect(() => {
    customNRef.current = customN;
  }, [customN]);
  useEffect(() => {
    betaRef.current = betaWater;
  }, [betaWater]);

  const [size, setSize] = useState({ width: 720, height: 360 });
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

  const currentN = (): number => {
    if (presetRef.current === "custom") return customNRef.current;
    return PRESETS[presetRef.current];
  };

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const c = SPEED_OF_LIGHT;
      const n = currentN();
      const beta = betaRef.current;
      const vWater = beta * c;
      const eta = fresnelDragCoefficient(n);

      const uStationary = c / n;
      const uFresnel = fresnelLinearApproximation(n, vWater, c);
      const uRelativistic = partialDraggingFizeau(n, vWater, c);
      const uFullDrag = c / n + vWater; // refuted hypothesis (Galilean drag)

      // Tube geometry — horizontal pipe with arrows indicating flow.
      const padX = 50;
      const tubeY = height * 0.5;
      const tubeH = 60;
      const usable = width - 2 * padX;

      // Tube frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, tubeY - tubeH / 2, usable, tubeH);

      // Animated water flow — small dots drifting at vWater.
      const period = 4;
      const tau = ((t / 1000) % period) / period; // 0..1
      const dropletCount = 18;
      ctx.fillStyle = colors.cyan;
      for (let i = 0; i < dropletCount; i++) {
        const phase = (tau + i / dropletCount) % 1;
        const xd = padX + phase * usable;
        const yd = tubeY - 10 + ((i * 7) % 20);
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(xd, yd, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Three travelling photon ticks: cyan = stationary baseline,
      // amber = Galilean drag, magenta = Fresnel/Einstein.
      // We map each speed to the canvas-time domain: the light reaches
      // padX + (u/c) · usable in one period.
      const drawPhoton = (u: number, color: string, yOff: number) => {
        const x = padX + tau * (u / c) * usable;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, tubeY + yOff, 4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawPhoton(uStationary, colors.cyan, -tubeH / 2 - 14);
      drawPhoton(uFullDrag, "#FFC857", tubeH / 2 + 14);
      drawPhoton(uRelativistic, colors.magenta, 0);

      // Legend on the right
      ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
      const legendX = width - padX - 220;
      let ly = 20;
      ctx.fillStyle = colors.cyan;
      ctx.fillText("●", legendX, ly);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `c/n         = ${(uStationary / c).toFixed(4)} c  (no drag)`,
        legendX + 14,
        ly,
      );
      ly += 16;
      ctx.fillStyle = "#FFC857";
      ctx.fillText("●", legendX, ly);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `c/n + v     = ${(uFullDrag / c).toFixed(4)} c  (full drag)`,
        legendX + 14,
        ly,
      );
      ly += 16;
      ctx.fillStyle = colors.magenta;
      ctx.fillText("●", legendX, ly);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `Fresnel     = ${(uFresnel / c).toFixed(4)} c  (Fizeau saw this)`,
        legendX + 14,
        ly,
      );
      ly += 16;
      ctx.fillText(
        `Einstein    = ${(uRelativistic / c).toFixed(4)} c  (full formula)`,
        legendX + 14,
        ly,
      );

      // Left-side: parameters
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      let yh = 20;
      ctx.fillText(`n = ${n.toFixed(3)}`, padX, yh);
      yh += 16;
      ctx.fillText(`v_water = ${beta.toFixed(3)} c`, padX, yh);
      yh += 16;
      ctx.fillText(
        `drag coefficient 1 − 1/n² = ${eta.toFixed(4)}`,
        padX,
        yh,
      );

      // Tube label
      ctx.fillStyle = colors.fg2;
      ctx.fillText("water flow →", padX + 12, tubeY + tubeH / 2 - 6);
    },
  });

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-md bg-[#0A0C12]"
        style={{ height: size.height }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="font-mono text-xs text-white/70">
          <div className="mb-1">Medium</div>
          <div className="flex flex-wrap gap-2">
            {(["water", "glass", "custom"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`rounded border px-2 py-1 ${
                  preset === p
                    ? "border-fuchsia-400 text-fuchsia-300"
                    : "border-white/20 text-white/60 hover:border-white/40"
                }`}
              >
                {p === "water"
                  ? "water (n = 1.33)"
                  : p === "glass"
                    ? "glass (n = 1.5)"
                    : "custom"}
              </button>
            ))}
          </div>
          {preset === "custom" ? (
            <label className="mt-2 block">
              <div className="mb-1 flex items-center justify-between">
                <span>n (custom)</span>
                <span className="opacity-60">{customN.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.001}
                value={customN}
                onChange={(e) => setCustomN(parseFloat(e.target.value))}
                className="w-full accent-fuchsia-400"
              />
            </label>
          ) : null}
        </div>
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>Water speed: β = v_water / c</span>
            <span className="opacity-60">{betaWater.toFixed(3)} c</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.001}
            value={betaWater}
            onChange={(e) => setBetaWater(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/50">
        Fizeau&apos;s 1851 setup ran water at ~7 m/s — about 2×10⁻⁸ c, well
        below the slider&apos;s minimum tick. The Fresnel drag coefficient
        1 − 1/n² ≈ 0.434 for water that he extracted is the v/c-order
        expansion of Einstein&apos;s formula. Fifty-four years before SR.
      </p>
    </div>
  );
}
