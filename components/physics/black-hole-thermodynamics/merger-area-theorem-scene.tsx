"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  drawArrow,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  horizonArea,
  mergerAreaCheck,
  maxRadiatedFractionEqualMerger,
} from "@/lib/physics/relativity/black-hole-thermodynamics";

/**
 * FIG.48a — The merger area-theorem checker.
 *
 * Two black holes (masses m₁, m₂; spins a₁, a₂ from sliders) coalesce. The
 * canvas draws the two input horizons as filled disks whose radius ∝ √A, the
 * remnant horizon to the right, and a live verdict on whether
 * A_final ≥ A₁ + A₂ — Hawking's 1971 area theorem. A radiated-fraction slider
 * lets the user dial the gravitational-wave loss up to (and past) the
 * theorem's ceiling of 1 − 1/√2 ≈ 29%, turning the verdict from green to red.
 */

const PAD = 18;

export function MergerAreaTheoremScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [m1, setM1] = useState(1);
  const [m2, setM2] = useState(1);
  const [a1, setA1] = useState(0.3);
  const [a2, setA2] = useState(0.3);
  const [radiated, setRadiated] = useState(0.04);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  const result = mergerAreaCheck(m1, a1, m2, a2, radiated, 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, m1, a1, m2, a2, radiated, width, height);
  }, [tokens, m1, a1, m2, a2, radiated, width, height]);

  const ceiling = maxRadiatedFractionEqualMerger();

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two black holes of adjustable mass and spin merge into one. The scene compares the total horizon area before the merger with the remnant's area and reports whether Hawking's area theorem A_final ≥ A₁ + A₂ holds as the radiated gravitational-wave fraction is varied."
      />
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 font-mono text-xs text-[var(--color-fg-2)] sm:grid-cols-2">
        <Slider label={`m₁ = ${m1.toFixed(1)} M`} min={0.5} max={3} step={0.1} value={m1} onChange={setM1} />
        <Slider label={`m₂ = ${m2.toFixed(1)} M`} min={0.5} max={3} step={0.1} value={m2} onChange={setM2} />
        <Slider label={`a₁* = ${a1.toFixed(2)}`} min={0} max={0.998} step={0.01} value={a1} onChange={setA1} />
        <Slider label={`a₂* = ${a2.toFixed(2)}`} min={0} max={0.998} step={0.01} value={a2} onChange={setA2} />
        <Slider
          label={`radiated = ${(radiated * 100).toFixed(0)}%`}
          min={0}
          max={0.5}
          step={0.01}
          value={radiated}
          onChange={setRadiated}
        />
        <div className="flex items-center">
          <span className={result.satisfies ? "text-[var(--color-mint)]" : "text-[var(--color-red)]"}>
            {result.satisfies
              ? "dA ≥ 0 ✓ area theorem holds"
              : `dA < 0 ✗ would violate (ceiling ${(ceiling * 100).toFixed(0)}%)`}
          </span>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-[var(--color-fg-3)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: "var(--color-cyan)" }}
      />
    </label>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  m1: number,
  a1: number,
  m2: number,
  a2: number,
  radiated: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const res = mergerAreaCheck(m1, a1, m2, a2, radiated, 0);

  // Scale: map area to a pixel disk radius. r_px ∝ √A. Pick a reference so the
  // largest plausible remnant fits the panel comfortably.
  const refArea = horizonArea(6, 0); // big upper bound
  const maxR = Math.min(W, H) * 0.16;
  const rPx = (area: number) => maxR * Math.sqrt(area / refArea);

  const a1Area = horizonArea(m1, a1);
  const a2Area = horizonArea(m2, a2);
  const fArea = res.areaFinal;

  const leftCX = W * 0.2;
  const rightCX = W * 0.78;
  const cy = H * 0.42;

  drawSectionTitle(ctx, PAD, PAD, "BEFORE  (TWO HOLES)", tokens.textMute);
  drawSectionTitle(ctx, rightCX - 60, PAD, "AFTER  (REMNANT)", tokens.textMute);

  // Input holes stacked vertically on the left
  drawHole(ctx, tokens, leftCX, cy - rPx(a1Area) - 8, rPx(a1Area), tokens.cyan, `A₁=${a1Area.toFixed(1)}`);
  drawHole(ctx, tokens, leftCX, cy + rPx(a2Area) + 8, rPx(a2Area), tokens.blue, `A₂=${a2Area.toFixed(1)}`);

  // Plus sign
  ctx.fillStyle = tokens.textDim;
  ctx.font = "bold 18px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", leftCX, cy);

  // Arrow from inputs to remnant
  const arrowColor = hexToRgba(tokens.amber, 0.75);
  drawArrow(ctx, leftCX + maxR + 16, cy, rightCX - rPx(fArea) - 16, cy, arrowColor, 2, 9);

  // Radiated GW glyph above the arrow
  if (radiated > 0.005) {
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.6);
    ctx.lineWidth = 1.5;
    const ax = (leftCX + rightCX) / 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const yy = cy - 26 - i * 6;
      for (let xx = ax - 26; xx <= ax + 26; xx += 2) {
        const yo = Math.sin((xx - ax) * 0.4) * 4;
        if (xx === ax - 26) ctx.moveTo(xx, yy + yo);
        else ctx.lineTo(xx, yy + yo);
      }
      ctx.stroke();
    }
    ctx.fillStyle = tokens.magenta;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(`${(radiated * 100).toFixed(0)}% radiated`, ax, cy - 52);
  }

  // Remnant hole
  const remnantColor = res.satisfies ? tokens.mint : tokens.red;
  drawHole(ctx, tokens, rightCX, cy, rPx(fArea), remnantColor, `A=${fArea.toFixed(1)}`);

  // ── Ledger / verdict at the bottom ─────────────────────────────────────────
  const ledgerY = H - 64;
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillStyle = tokens.textDim;
  ctx.fillText("A₁ + A₂", PAD, ledgerY);
  ctx.fillStyle = tokens.cyan;
  ctx.fillText(`= ${res.areaIn.toFixed(2)}`, PAD + 70, ledgerY);

  ctx.fillStyle = tokens.textDim;
  ctx.fillText("A_final", PAD, ledgerY + 20);
  ctx.fillStyle = remnantColor;
  ctx.fillText(`= ${res.areaFinal.toFixed(2)}`, PAD + 70, ledgerY + 20);

  // Big verdict
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = remnantColor;
  ctx.fillText(
    res.satisfies ? "A_final ≥ A₁ + A₂   ✓" : "A_final < A₁ + A₂   ✗",
    W - PAD,
    ledgerY,
  );
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("horizon area never decreases  (Hawking 1971)", W - PAD, ledgerY + 22);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawHole(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  r: number,
  ringColor: string,
  label: string,
) {
  // Photon-ring glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.7);
  glow.addColorStop(0, hexToRgba(ringColor, 0.5));
  glow.addColorStop(1, hexToRgba(ringColor, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Black disk
  ctx.fillStyle = tokens.bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Horizon ring
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, cx, cy + r + 6);
  ctx.textAlign = "left";
}
