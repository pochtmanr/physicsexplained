"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.35c — Einstein Tensor Divergence-Free Schematic.
 *
 * The contracted second Bianchi identity states:
 *   ∇^μ G_{μν} = 0
 *
 * This means the net flow of G_{μν} out of any closed region is exactly zero —
 * just like ∇·B = 0 for magnetic fields (no monopoles), or ∂_μ T^{μν} = 0
 * for a conserved current.
 *
 * Visual: a central rectangular "region" of spacetime with arrows representing
 * the Einstein tensor flux G^{μν} flowing through each face. The arrows on
 * opposite faces are equal and opposite — net flux = 0.
 *
 * A second panel shows the matter side: T_{μν} with identical flow structure,
 * labelled "also ∇^μ T_{μν} = 0 (energy-momentum conservation)".
 *
 * Slider: "animation phase" that cycles the arrows smoothly, showing that the
 * pattern is always satisfied regardless of the state.
 */

const W = 680;
const H = 330;

const CYAN = "#67E8F9";
const AMBER = "#FBBF24";
const PINK = "#FF6ADE";
const WHITE60 = "rgba(255,255,255,0.60)";
const WHITE35 = "rgba(255,255,255,0.35)";

interface BoxPanel {
  cx: number;
  cy: number;
  hw: number; // half-width
  hh: number; // half-height
  label: string;
  subLabel: string;
  arrowColor: string;
  phase: number; // animation phase offset
}

function drawDivergenceFreePanel(
  ctx: CanvasRenderingContext2D,
  panel: BoxPanel,
  t: number,
) {
  const { cx, cy, hw, hh, label, subLabel, arrowColor, phase } = panel;

  // Background box
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.lineWidth = 1.5;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath();
  ctx.rect(cx - hw, cy - hh, hw * 2, hh * 2);
  ctx.fill();
  ctx.stroke();

  // Label inside
  ctx.fillStyle = WHITE60;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy - 6);
  ctx.fillStyle = WHITE35;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(subLabel, cx, cy + 12);

  // Flux arrows on the 4 faces. For a divergence-free field, each face carries
  // the same magnitude but inward = outward on opposite faces.
  const magnitude = 30 + 8 * Math.sin(t * 2 * Math.PI + phase);
  const arrows = [
    // [startX, startY, dx, dy, faceLabel]
    [cx - hw, cy, -magnitude, 0, "G^{0ν}"],   // left face (outward = left)
    [cx + hw, cy, magnitude, 0, "G^{0ν}"],    // right face (outward = right)
    [cx, cy - hh, 0, -magnitude, "G^{1ν}"],   // top face (outward = up)
    [cx, cy + hh, 0, magnitude, "G^{2ν}"],    // bottom face (outward = down)
  ] as const;

  for (const [bx, by, adx, ady] of arrows) {
    const tipX = bx + adx;
    const tipY = by + ady;
    const len = Math.hypot(adx, ady);
    if (len < 1) continue;
    const ux = adx / len;
    const uy = ady / len;

    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Arrowhead
    const headLen = 9;
    const headAngle = 0.5;
    const ang = Math.atan2(ady, adx);
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(ang - headAngle), tipY - headLen * Math.sin(ang - headAngle));
    ctx.lineTo(tipX - headLen * Math.cos(ang + headAngle), tipY - headLen * Math.sin(ang + headAngle));
    ctx.closePath();
    ctx.fill();
  }

  // "net = 0" badge
  ctx.fillStyle = PINK;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("∇^μ " + label + " = 0", cx, cy + hh + 22);
}

function render(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0A0C12";
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = WHITE35;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("CONTRACTED BIANCHI IDENTITY — DIVERGENCE-FREE FLOW", 12, 18);

  // Left panel: G_{μν}
  drawDivergenceFreePanel(ctx, {
    cx: W * 0.25,
    cy: H / 2 - 8,
    hw: 80,
    hh: 70,
    label: "G_{μν}",
    subLabel: "Einstein tensor",
    arrowColor: CYAN,
    phase: 0,
  }, t);

  // "= 8πG/c⁴" connector
  ctx.fillStyle = WHITE60;
  ctx.font = "15px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("=", W / 2, H / 2 - 8);

  ctx.fillStyle = WHITE35;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("8πG/c⁴", W / 2, H / 2 + 14);

  // Right panel: T_{μν}
  drawDivergenceFreePanel(ctx, {
    cx: W * 0.75,
    cy: H / 2 - 8,
    hw: 80,
    hh: 70,
    label: "T_{μν}",
    subLabel: "stress-energy tensor",
    arrowColor: AMBER,
    phase: 0.3,
  }, t);

  // Bottom explanation
  ctx.fillStyle = WHITE60;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    "Bianchi identity ⟹  ∇^μ G_{μν} = 0   forces   ∇^μ T_{μν} = 0  (energy-momentum conservation)",
    W / 2,
    H - 12,
  );
}

export function EinsteinTensorDivergenceScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    render(ctx, phase);
  }, [phase]);

  useEffect(() => {
    if (!playing) {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      return;
    }
    let start: number | null = null;
    const PERIOD = 3000; // ms per cycle

    const step = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      setPhase((elapsed % PERIOD) / PERIOD);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [playing]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="rounded border border-white/20 px-3 py-1 font-mono text-xs text-white/70 hover:border-white/40 transition-colors"
        >
          {playing ? "pause" : "animate"}
        </button>
        <label className="flex flex-1 items-center gap-3 font-mono text-xs text-white/70">
          <span>phase</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={phase}
            onChange={(e) => { setPlaying(false); setPhase(parseFloat(e.target.value)); }}
            className="flex-1"
          />
        </label>
      </div>
      <p className="px-1 font-mono text-xs text-white/40">
        The contracted Bianchi identity guarantees that the net flux of G<sub>&#956;&#957;</sub> out of any
        spacetime region is exactly zero — &#8711;&#8319;G<sub>&#956;&#957;</sub> = 0. Because the Einstein field equations
        set G<sub>&#956;&#957;</sub> = (8&#960;G/c&#8308;) T<sub>&#956;&#957;</sub>, the stress-energy tensor inherits the same
        property: &#8711;&#8319;T<sub>&#956;&#957;</sub> = 0, which is energy-momentum conservation. The geometry forces
        the conservation law — they must match.
      </p>
    </div>
  );
}
