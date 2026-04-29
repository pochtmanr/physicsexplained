"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.16a — The energy-momentum-mass triangle.
 *
 *   E² = (pc)² + (mc²)²
 *
 *   Right triangle:
 *     • vertical leg = mc²        (rest energy, cyan)
 *     • horizontal leg = pc        (momentum × c, magenta)
 *     • hypotenuse = E             (total energy, amber)
 *
 *   β slider drives the construction. At β = 0 the horizontal leg vanishes,
 *   the hypotenuse coincides with the vertical leg: E = mc². At β → 1 the
 *   horizontal leg dominates; the hypotenuse → pc.
 *
 *   Visual proof of the energy-momentum-mass triangle. The four-momentum
 *   norm m²c² is the Lorentz invariant; it sits as the unchanging vertical
 *   leg while β shears the horizontal leg.
 *
 *   Palette: cyan = rest energy (mc²); magenta = pc; amber = total E.
 */

const WIDTH = 720;
const HEIGHT = 400;

// Natural units: c = 1, mc² = 1. We scale to fit the canvas.
const MC2 = 1; // rest energy in natural units
const VERT_PIXELS = 220; // pixels representing mc² = 1
const ORIGIN_X = 140;
const ORIGIN_Y = HEIGHT - 80;

export function EnergyMomentumTriangleScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Compute γ, pc, E in natural units (c = 1, m = 1).
    const g = 1 / Math.sqrt(1 - beta * beta);
    const pc = g * beta * MC2; // pc = γmβc²; with m = c = 1: γβ
    const E = g * MC2; // E = γmc²; with m = c = 1: γ

    // Pixel scaling: vertical leg mc² = 1 → VERT_PIXELS px.
    const scale = VERT_PIXELS / MC2;
    const vertLen = MC2 * scale;
    const horizLen = pc * scale;
    const hypLen = E * scale;

    // Triangle vertices on canvas:
    //   A = origin (bottom-left, right angle)
    //   B = (origin + horizLen px right, origin)         — bottom-right
    //   C = (origin, origin − vertLen px)                 — top-left
    // The hypotenuse runs from B (bottom-right) to C (top-left).
    const A = { x: ORIGIN_X, y: ORIGIN_Y };
    const B = { x: ORIGIN_X + horizLen, y: ORIGIN_Y };
    const C = { x: ORIGIN_X, y: ORIGIN_Y - vertLen };

    // Background grid (faint)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= 6; xv++) {
      const px = ORIGIN_X + xv * (VERT_PIXELS / 2);
      if (px > WIDTH - 20) break;
      ctx.beginPath();
      ctx.moveTo(px, 30);
      ctx.lineTo(px, ORIGIN_Y);
      ctx.stroke();
    }
    for (let yv = 0; yv <= 4; yv++) {
      const py = ORIGIN_Y - yv * (VERT_PIXELS / 2);
      ctx.beginPath();
      ctx.moveTo(ORIGIN_X, py);
      ctx.lineTo(WIDTH - 30, py);
      ctx.stroke();
    }

    // Right-angle marker at A
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    const tick = 10;
    ctx.beginPath();
    ctx.moveTo(A.x + tick, A.y);
    ctx.lineTo(A.x + tick, A.y - tick);
    ctx.lineTo(A.x, A.y - tick);
    ctx.stroke();

    // Vertical leg: mc² (cyan)
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();

    // Horizontal leg: pc (magenta)
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // Hypotenuse: E (amber)
    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();

    // Vertex dots
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const v of [A, B, C]) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels
    ctx.font = "13px ui-monospace, monospace";

    // mc² label — left of the vertical leg
    ctx.fillStyle = "#67E8F9";
    ctx.textAlign = "right";
    ctx.fillText("mc²", A.x - 12, (A.y + C.y) / 2 + 4);

    // pc label — below the horizontal leg
    ctx.fillStyle = "#FF6ADE";
    ctx.textAlign = "center";
    ctx.fillText(`pc = ${pc.toFixed(3)}`, (A.x + B.x) / 2, A.y + 22);

    // E label — along the hypotenuse, slightly above
    ctx.fillStyle = "#FBBF24";
    ctx.textAlign = "left";
    const midH = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
    ctx.fillText(`E = ${E.toFixed(3)}`, midH.x + 8, midH.y - 6);

    // mc² value at the cyan tick
    ctx.fillStyle = "#67E8F9";
    ctx.textAlign = "right";
    ctx.fillText(`= ${MC2.toFixed(3)}`, A.x - 12, (A.y + C.y) / 2 + 22);

    // Axis hint labels
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "left";
    ctx.fillText("→ pc", WIDTH - 60, A.y + 22);
    ctx.fillText("↑ mc²", A.x - 28, 40);

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `β = ${beta.toFixed(2)}   γ = ${g.toFixed(4)}   E² = (pc)² + (mc²)² = ${(pc * pc + MC2 * MC2).toFixed(4)}   E² = ${(E * E).toFixed(4)}`,
      20,
      HEIGHT - 22,
    );
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(
      "natural units (c = 1, m = 1) — at β=0 the magenta leg vanishes, hypotenuse = mc²",
      20,
      HEIGHT - 6,
    );
  }, [beta]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-24">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
      </label>
    </div>
  );
}
