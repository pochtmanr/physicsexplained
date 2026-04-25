"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.60c — Maxwell's four equations as two tensor equations.
 *
 *   ∂_μ F^{μν} = μ₀ J^ν             (sources)
 *   ∂_μ *F^{μν} = 0                 (no monopoles)
 *
 * The first equation, with ν running 0..3, is *Gauss's law* (ν=0) and
 * *Ampère-Maxwell* (ν=i ∈ {1,2,3}). The second is the *no-monopole law*
 * (ν=0) and *Faraday's law* (ν=i).
 *
 * Animation: a single 4×4 F-grid cycles through highlighting one row at
 * a time. Beside the grid a HUD card displays the corresponding scalar
 * Maxwell equation. Halfway through the cycle the grid switches to *F
 * and the HUD shows the dual pair.
 *
 * Eight states total, 1.4s each.
 */

const RATIO = 0.46;
const MAX_HEIGHT = 320;

const F_LABELS = [
  ["0", "Eₓ/c", "Eᵧ/c", "E_z/c"],
  ["−Eₓ/c", "0", "−B_z", "Bᵧ"],
  ["−Eᵧ/c", "B_z", "0", "−Bₓ"],
  ["−E_z/c", "−Bᵧ", "Bₓ", "0"],
];

const D_LABELS = [
  ["0", "Bₓ", "Bᵧ", "B_z"],
  ["−Bₓ", "0", "E_z/c", "−Eᵧ/c"],
  ["−Bᵧ", "−E_z/c", "0", "Eₓ/c"],
  ["−B_z", "Eᵧ/c", "−Eₓ/c", "0"],
];

interface Stage {
  tensor: "F" | "D";
  nu: number;
  heading: string;
  equation: string;
  recovers: string;
}

const STAGES: Stage[] = [
  {
    tensor: "F",
    nu: 0,
    heading: "∂_μ F^{μ0} = μ₀ J^0",
    equation: "∇·E = ρ/ε₀",
    recovers: "Gauss's law",
  },
  {
    tensor: "F",
    nu: 1,
    heading: "∂_μ F^{μ1} = μ₀ J^1",
    equation: "(∇×B − μ₀ε₀ ∂E/∂t)_x = μ₀ J_x",
    recovers: "Ampère–Maxwell (x)",
  },
  {
    tensor: "F",
    nu: 2,
    heading: "∂_μ F^{μ2} = μ₀ J^2",
    equation: "(∇×B − μ₀ε₀ ∂E/∂t)_y = μ₀ J_y",
    recovers: "Ampère–Maxwell (y)",
  },
  {
    tensor: "F",
    nu: 3,
    heading: "∂_μ F^{μ3} = μ₀ J^3",
    equation: "(∇×B − μ₀ε₀ ∂E/∂t)_z = μ₀ J_z",
    recovers: "Ampère–Maxwell (z)",
  },
  {
    tensor: "D",
    nu: 0,
    heading: "∂_μ *F^{μ0} = 0",
    equation: "∇·B = 0",
    recovers: "No magnetic monopoles",
  },
  {
    tensor: "D",
    nu: 1,
    heading: "∂_μ *F^{μ1} = 0",
    equation: "(∇×E + ∂B/∂t)_x = 0",
    recovers: "Faraday's law (x)",
  },
  {
    tensor: "D",
    nu: 2,
    heading: "∂_μ *F^{μ2} = 0",
    equation: "(∇×E + ∂B/∂t)_y = 0",
    recovers: "Faraday's law (y)",
  },
  {
    tensor: "D",
    nu: 3,
    heading: "∂_μ *F^{μ3} = 0",
    equation: "(∇×E + ∂B/∂t)_z = 0",
    recovers: "Faraday's law (z)",
  },
];

const STAGE_DURATION = 1.6; // seconds

export function TensorRecoversMaxwellScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 760, height: 320 });
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

      const stageIdx =
        Math.floor(t / STAGE_DURATION) % STAGES.length;
      const stage = STAGES[stageIdx];
      const stageT = (t / STAGE_DURATION) % 1; // 0..1 within the current stage
      // pulse brightness on the active row
      const pulse = 0.55 + 0.45 * Math.sin(stageT * Math.PI);

      const labels = stage.tensor === "F" ? F_LABELS : D_LABELS;

      // Layout: grid on the left half, HUD card on the right
      const padLeft = 14;
      const padTop = 28;
      const gridSize = Math.min(height - padTop - 24, (width - 32) * 0.42);
      const cell = gridSize / 4;
      const x0 = padLeft;
      const y0 = padTop;

      // Grid title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(stage.tensor === "F" ? "F^{μν}" : "*F^{μν}", x0, y0 - 10);

      // Cells
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const x = x0 + j * cell;
          const y = y0 + i * cell;
          const isActive = i === stage.nu;

          // determine kind from label
          const lbl = labels[i][j];
          const isB = /B/.test(lbl);
          const isE = /E/.test(lbl);

          let fill = "rgba(255,255,255,0.02)";
          if (isE) fill = "rgba(255, 106, 222, 0.18)";
          else if (isB) fill = "rgba(116, 220, 255, 0.18)";
          if (isActive)
            fill =
              isE
                ? `rgba(255, 106, 222, ${(0.35 * pulse + 0.25).toFixed(3)})`
                : isB
                  ? `rgba(116, 220, 255, ${(0.35 * pulse + 0.25).toFixed(3)})`
                  : `rgba(200, 160, 255, ${(0.25 * pulse + 0.1).toFixed(3)})`;
          ctx.fillStyle = fill;
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

          ctx.strokeStyle = isActive ? "rgba(200,160,255,0.95)" : colors.fg3;
          ctx.lineWidth = isActive ? 1.6 : 0.7;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

          ctx.fillStyle = lbl === "0" ? colors.fg3 : colors.fg1;
          ctx.font = "11px monospace";
          ctx.textAlign = "center";
          ctx.fillText(lbl, x + cell / 2, y + cell / 2 + 4);
        }
      }

      // arrow pointing at active row from outside grid
      const arrowY = y0 + (stage.nu + 0.5) * cell;
      const arrowX1 = x0 - 6;
      const arrowX0 = x0 - 22;
      ctx.strokeStyle = "rgba(200,160,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(arrowX0, arrowY);
      ctx.lineTo(arrowX1, arrowY);
      ctx.stroke();
      ctx.fillStyle = "rgba(200,160,255,0.9)";
      ctx.beginPath();
      ctx.moveTo(arrowX1, arrowY);
      ctx.lineTo(arrowX1 - 6, arrowY - 4);
      ctx.lineTo(arrowX1 - 6, arrowY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`ν=${stage.nu}`, arrowX0 - 24, arrowY + 4);

      // HUD card on the right
      const hx = x0 + gridSize + 24;
      const hy = y0;
      const hw = width - hx - 8;

      ctx.fillStyle = "rgba(200,160,255,0.07)";
      ctx.fillRect(hx, hy, hw, gridSize);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(hx + 0.5, hy + 0.5, hw - 1, gridSize - 1);

      // Heading: tensor equation
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(stage.heading, hx + 12, hy + 22);

      // Subheading: "recovers"
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.fillText("expands to →", hx + 12, hy + 42);

      // Equation in scalar form
      ctx.fillStyle =
        stage.tensor === "F" ? "rgba(255,106,222,0.95)" : "rgba(116,220,255,0.95)";
      ctx.font = "13px monospace";
      ctx.fillText(stage.equation, hx + 12, hy + 64);

      // Footer: name of the equation
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(stage.recovers, hx + 12, hy + gridSize - 14);

      // pagination dots
      const dotsY = hy + gridSize - 30;
      for (let k = 0; k < STAGES.length; k++) {
        const dx = hx + 12 + k * 12;
        ctx.fillStyle = k === stageIdx ? colors.fg1 : colors.fg3;
        ctx.beginPath();
        ctx.arc(dx, dotsY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bottom voice
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Eight scalar Maxwell equations. Two tensor equations. Same content.",
        width / 2,
        height - 8,
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
    </div>
  );
}
