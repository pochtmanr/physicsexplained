"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { dampedFree } from "@/lib/physics/damped-oscillator";

const CANVAS_W = 540;
const CANVAS_H = 260;
const PAD_L = 28;
const PAD_R = 14;
const PAD_TOP = 16;
const PAD_BOT = 28;
const T_MAX = 10; // seconds plotted
const X0 = 1;
const OMEGA0 = 2 * Math.PI; // 1 Hz

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

// Log-scale slider: slider value s ∈ [0, 1] → Q = 10^(s * 4) ∈ [1, 10⁴]
function sliderToQ(s: number): number {
  return Math.pow(10, s * 4);
}
function qToSlider(q: number): number {
  return Math.log10(q) / 4;
}

const PRESETS: { label: string; q: number }[] = [
  { label: "pendulum clock", q: 1e2 },
  { label: "tuning fork", q: 1e3 },
  { label: "quartz crystal", q: 1e4 },
  { label: "LIGO mirror", q: 1e8 },
];

function plotX(t: number): number {
  const w = CANVAS_W - PAD_L - PAD_R;
  return PAD_L + (t / T_MAX) * w;
}

function plotY(x: number): number {
  const h = CANVAS_H - PAD_TOP - PAD_BOT;
  const mid = PAD_TOP + h / 2;
  return mid - (x / 1.05) * (h / 2);
}

export function QualityFactorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [sliderS, setSliderS] = useState(qToSlider(50));

  const Q = sliderToQ(sliderS);
  const gamma = OMEGA0 / Q;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const innerLeft = PAD_L;
      const innerRight = CANVAS_W - PAD_R;
      const innerTop = PAD_TOP;
      const innerBot = CANVAS_H - PAD_BOT;
      const midY = (innerTop + innerBot) / 2;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerLeft, innerTop);
      ctx.lineTo(innerLeft, innerBot);
      ctx.lineTo(innerRight, innerBot);
      ctx.stroke();

      // Zero axis
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(innerLeft, midY);
      ctx.lineTo(innerRight, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Y-axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("+1", innerLeft - 4, plotY(1) + 3);
      ctx.fillText("0", innerLeft - 4, midY + 3);
      ctx.fillText("-1", innerLeft - 4, plotY(-1) + 3);

      // X-axis tick labels (0, 5, 10 s)
      ctx.textAlign = "center";
      for (const s of [0, 5, 10]) {
        const px = plotX(s);
        ctx.fillText(`${s}s`, px, innerBot + 14);
      }

      // 1/e envelope (magenta dashed)
      const ENV_E = 1 / Math.E;
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(innerLeft, plotY(ENV_E));
      ctx.lineTo(innerRight, plotY(ENV_E));
      ctx.moveTo(innerLeft, plotY(-ENV_E));
      ctx.lineTo(innerRight, plotY(-ENV_E));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MAGENTA;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("±1/e", innerLeft + 4, plotY(ENV_E) - 3);

      // x(t) curve
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      const N = 600;
      for (let k = 0; k <= N; k++) {
        const tt = (k / N) * T_MAX;
        const x = dampedFree(tt, X0, { omega0: OMEGA0, gamma });
        const px = plotX(tt);
        const py = plotY(x);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Title
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("x(t) — free damped oscillator at 1 Hz", innerLeft, 12);
    },
  });

  // Approximate cycles to amplitude 1/e: t_e = 2/γ; cycles = t_e / T_0 = (2/γ) · (ω₀/2π) = Q/π
  const cyclesToE = Q / Math.PI;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%" }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>
            Q = <span style={{ color: CYAN }}>{Q.toFixed(Q < 10 ? 2 : 0)}</span>
          </div>
          <div>γ = ω₀/Q = {gamma.toExponential(2)} s⁻¹</div>
          <div>
            cycles to 1/e ≈{" "}
            <span style={{ color: MAGENTA }}>
              {cyclesToE >= 100 ? cyclesToE.toExponential(1) : cyclesToE.toFixed(1)}
            </span>
          </div>
          <div className="mt-1 text-[var(--color-fg-3)]">— reference —</div>
          {PRESETS.map((p) => (
            <div key={p.label} className="text-[var(--color-fg-2)]">
              {p.label}: Q ~ {p.q.toExponential(0).replace("e+", "e")}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="w-16 text-sm text-[var(--color-fg-3)]">log Q</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={sliderS}
          onChange={(e) => setSliderS(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {Q < 10
            ? Q.toFixed(2)
            : Q < 1000
              ? Q.toFixed(0)
              : Q.toExponential(1)}
        </span>
      </div>
    </div>
  );
}
