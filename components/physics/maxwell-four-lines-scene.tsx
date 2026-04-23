"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.56;
const MAX_HEIGHT = 520;

const MAGENTA = "rgba(255, 100, 200,";
const CYAN = "rgba(120, 220, 255,";
const AMBER = "rgba(255, 180, 80,";
const LILAC = "rgba(200, 160, 255,";

/**
 * FIG.38a — THE DERIVATION.
 *
 * Six stepped panels walk the reader from Maxwell's four equations in
 * vacuum to the wave equation and the identity c = 1/√(μ₀ε₀). Each step
 * is a line of text; each line fades in on the previous, with a cyan rail
 * pointing at the *current* step.
 *
 *   1. Four lines of Maxwell in vacuum.
 *   2. Take curl of Faraday.
 *   3. BAC-CAB identity on the left; Ampère–Maxwell substitution on the
 *      right.
 *   4. Combine: ∇²E = (1/c²) ∂²E/∂t².
 *   5. Identify c = 1/√(μ₀ε₀).
 *   6. Plug in numbers → c ≈ 2.998 × 10⁸ m/s.
 *
 * Controls: a step counter and auto-advance toggle. Canvas-2D text only;
 * no external LaTeX rendering since the derivation is short enough to
 * typeset as stylised mono-font strings.
 */
export function MaxwellFourLinesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 820, height: 460 });
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

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

  const TOTAL = 6;

  // Auto-advance: bump step every 2.4 s while auto is ON.
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % TOTAL);
    }, 2400);
    return () => window.clearInterval(id);
  }, [auto]);

  useEffect(() => {
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

    // Background
    ctx.fillStyle = "#0b0d10";
    ctx.fillRect(0, 0, width, height);

    const lines: { tag: string; text: string; color: string }[] = [
      {
        tag: "1",
        text: "∇·E = 0     ∇·B = 0     ∇×E = −∂B/∂t     ∇×B = μ₀ε₀·∂E/∂t",
        color: colors.fg0,
      },
      {
        tag: "2",
        text: "Take curl of Faraday:   ∇×(∇×E) = −∂/∂t(∇×B)",
        color: `${CYAN} 0.95)`,
      },
      {
        tag: "3",
        text: "BAC−CAB:  ∇×(∇×E) = ∇(∇·E) − ∇²E = −∇²E       (since ∇·E = 0)",
        color: `${LILAC} 0.95)`,
      },
      {
        tag: "4",
        text: "Substitute Ampère−Maxwell:   −∇²E = −μ₀ε₀·∂²E/∂t²",
        color: `${AMBER} 0.95)`,
      },
      {
        tag: "5",
        text: "⇒   ∇²E = (1/c²)·∂²E/∂t²       with   c = 1/√(μ₀·ε₀)",
        color: `${MAGENTA} 0.95)`,
      },
      {
        tag: "6",
        text: "Plug in: c = 1/√(4π×10⁻⁷ · 8.85×10⁻¹²)  ≈  2.998 × 10⁸ m/s",
        color: `${MAGENTA} 1)`,
      },
    ];

    // Title strip
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      "FROM MAXWELL TO THE WAVE EQUATION — one step at a time",
      16,
      22,
    );

    // Step bar
    const barY = 34;
    const barX0 = 16;
    const barW = width - 32;
    const segW = barW / TOTAL;
    for (let i = 0; i < TOTAL; i++) {
      ctx.fillStyle = i <= step ? `${CYAN} 0.85)` : colors.fg3;
      ctx.fillRect(barX0 + i * segW + 2, barY, segW - 4, 3);
    }

    // Render each line, dimmed if not yet reached, highlighted if current.
    const topY = 64;
    const lineH = Math.max(44, (height - 120) / TOTAL);
    ctx.font =
      "500 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    for (let i = 0; i < TOTAL; i++) {
      const y = topY + i * lineH;
      const revealed = i <= step;
      const current = i === step;

      // Step number chip
      ctx.fillStyle = revealed ? `${CYAN} 0.9)` : colors.fg3;
      ctx.fillRect(16, y - 12, 22, 18);
      ctx.fillStyle = revealed ? "#0b0d10" : colors.fg2;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(lines[i].tag, 27, y + 1);

      // Text
      ctx.textAlign = "left";
      ctx.font =
        "500 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.fillStyle = revealed
        ? current
          ? lines[i].color
          : `rgba(200, 210, 225, ${0.55 + 0.15 * (i / TOTAL)})`
        : colors.fg3;
      const textX = 48;
      ctx.fillText(lines[i].text, textX, y + 2);

      // Current-step underline
      if (current) {
        ctx.strokeStyle = `${CYAN} 0.85)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(textX, y + 10);
        ctx.lineTo(width - 20, y + 10);
        ctx.stroke();
      }
    }

    // Payoff strip: once step ≥ 5, show the "Fizeau 1849 measured 3.15e8; Maxwell 1862 predicted"
    if (step >= 5) {
      ctx.fillStyle = `${AMBER} 0.85)`;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "measured optically by Fizeau 1849 · derived by Maxwell 1862 · confirmed by Hertz 1888",
        width / 2,
        height - 18,
      );
    }
  }, [size, step, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">
          step {step + 1}/{TOTAL} · four equations → wave equation → c
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => (s + TOTAL - 1) % TOTAL)}
            className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[rgb(120,220,255)] hover:text-[rgb(120,220,255)]"
          >
            ◀ prev
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) % TOTAL)}
            className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[rgb(120,220,255)] hover:text-[rgb(120,220,255)]"
          >
            next ▶
          </button>
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[rgb(200,160,255)] hover:text-[rgb(200,160,255)]"
          >
            auto: {auto ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
