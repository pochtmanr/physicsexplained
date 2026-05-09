"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.33c — The §07.5 honest-moment payoff.
 *
 * Two side-by-side panels:
 *
 *   Left  "Space view":  An apple tossed upward, tracing a parabolic arc in (x, y)
 *         space under Newtonian gravity.  The Earth sits below.  This is what we
 *         see every day.  A downward force arrow is annotated: "F = mg (Newton)".
 *
 *   Right "Spacetime view": The same motion drawn as a worldline in (t, y) spacetime.
 *         Near the Earth the metric is slightly curved (weak-field Schwarzschild).
 *         The worldline is drawn as a thick line — very nearly straight.  Annotation:
 *         "no force; this is a geodesic of curved spacetime."
 *
 * A slider lets the reader vary the initial upward toss speed, watching both views
 * update simultaneously.
 *
 * The honest-moment callout is rendered below the canvas.
 */

const W = 660;
const H = 320;
const PANEL_W = 300;
const PANEL_H = 280;
const PAD = 28;
const OX_LEFT = 14;
const OX_RIGHT = W / 2 + 14;

// ── Physics ──────────────────────────────────────────────────────────────────

const G_GRAV = 9.8;   // m/s²
const Y0 = 1.5;       // launch height (m above ground reference)
const X0 = 0;

/** Parabolic trajectory in (x, y) space. y = y0 + v0_y t − ½ g t². */
function parabolaPoints(v0y: number, v0x: number, nSteps = 80): { t: number; x: number; y: number }[] {
  const tFall = (v0y + Math.sqrt(v0y * v0y + 2 * G_GRAV * Y0)) / G_GRAV;
  const dt = tFall / nSteps;
  const pts: { t: number; x: number; y: number }[] = [];
  for (let i = 0; i <= nSteps; i++) {
    const t = i * dt;
    const y = Y0 + v0y * t - 0.5 * G_GRAV * t * t;
    const x = X0 + v0x * t;
    if (y < 0) break;
    pts.push({ t, x, y });
  }
  return pts;
}

// ── Rendering helpers ─────────────────────────────────────────────────────────

/** Map world (x, y) ∈ [−3, 3] × [0, 5] to canvas pixels in the LEFT panel. */
function spaceToScreen(x: number, y: number): [number, number] {
  const scaleX = (PANEL_W - 2 * PAD) / 6;
  const scaleY = (PANEL_H - 2 * PAD) / 5;
  const sx = OX_LEFT + PAD + (x + 3) * scaleX;
  const sy = 8 + PANEL_H - PAD - y * scaleY;
  return [sx, sy];
}

/** Map (t, y) to canvas pixels in the RIGHT spacetime panel.
 *  t ∈ [0, tMax], y ∈ [0, 5]. Spacetime axis: t rightward, y upward. */
function stToScreen(t: number, y: number, tMax: number): [number, number] {
  const scaleT = (PANEL_W - 2 * PAD) / (tMax || 1);
  const scaleY = (PANEL_H - 2 * PAD) / 5;
  const sx = OX_RIGHT + PAD + t * scaleT;
  const sy = 8 + PANEL_H - PAD - y * scaleY;
  return [sx, sy];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FallingAppleAsGeodesicScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [v0y, setV0y] = useState(4.0); // initial upward speed m/s
  const v0x = 0.8;

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
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, W, H);

    const pts = parabolaPoints(v0y, v0x);
    const tMax = pts.length > 0 ? pts[pts.length - 1].t : 1;

    // ── Panel backgrounds ─────────────────────────────────────────────────
    for (const ox of [OX_LEFT, OX_RIGHT]) {
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ox, 8, PANEL_W, PANEL_H, 6);
      ctx.fill();
      ctx.stroke();
    }

    // ─── LEFT: Space view ─────────────────────────────────────────────────

    // Ground line.
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.5;
    const [gx0, gy0] = spaceToScreen(-3, 0);
    const [gx1, gy1] = spaceToScreen(3, 0);
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();

    // Earth ellipse at bottom.
    const [ecx, ecy] = spaceToScreen(0, -0.4);
    ctx.fillStyle = "rgba(100,160,255,0.25)";
    ctx.strokeStyle = "rgba(100,160,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(ecx, ecy, 60, 18, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Earth", ecx, ecy + 4);

    // Gravity force arrow (at midpoint of trajectory).
    if (pts.length > 1) {
      const midPt = pts[Math.floor(pts.length / 2)];
      const [arx, ary] = spaceToScreen(midPt.x, midPt.y);
      const arrowLen = 28;
      ctx.strokeStyle = "#F87171";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arx, ary);
      ctx.lineTo(arx, ary + arrowLen);
      ctx.stroke();
      // Arrowhead.
      ctx.fillStyle = "#F87171";
      ctx.beginPath();
      ctx.moveTo(arx, ary + arrowLen);
      ctx.lineTo(arx - 5, ary + arrowLen - 8);
      ctx.lineTo(arx + 5, ary + arrowLen - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#F87171";
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("F = mg", arx + 6, ary + arrowLen - 4);
    }

    // Parabolic arc.
    if (pts.length > 1) {
      ctx.strokeStyle = "#67E8F9";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const [px0, py0] = spaceToScreen(pts[0].x, pts[0].y);
      ctx.moveTo(px0, py0);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = spaceToScreen(pts[i].x, pts[i].y);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Apple dot.
    if (pts.length > 0) {
      const [adx, ady] = spaceToScreen(pts[0].x, pts[0].y);
      ctx.fillStyle = "#86EFAC";
      ctx.beginPath();
      ctx.arc(adx, ady, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Panel title.
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SPACE VIEW (Newton)", OX_LEFT + PANEL_W / 2, PANEL_H + 4);

    // ─── RIGHT: Spacetime view ────────────────────────────────────────────

    // Spacetime grid (t lines at constant y, y lines at constant t).
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let yg = 0; yg <= 5; yg++) {
      const [sx0, sy0] = stToScreen(0, yg, tMax);
      const [sx1, sy1] = stToScreen(tMax, yg, tMax);
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();
    }
    for (let tg = 0; tg <= 4; tg++) {
      const t = (tg / 4) * tMax;
      const [sx0, sy0] = stToScreen(t, 0, tMax);
      const [sx1, sy1] = stToScreen(t, 5, tMax);
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();
    }

    // Ground line in spacetime.
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.5;
    const [st_gx0, st_gy0] = stToScreen(0, 0, tMax);
    const [st_gx1, st_gy1] = stToScreen(tMax, 0, tMax);
    ctx.beginPath();
    ctx.moveTo(st_gx0, st_gy0);
    ctx.lineTo(st_gx1, st_gy1);
    ctx.stroke();

    // Draw "curvature" of metric — a faint warp shading near y = 0.
    const warpGrad = ctx.createLinearGradient(OX_RIGHT + PAD, 8 + PANEL_H - PAD, OX_RIGHT + PAD, 8 + PANEL_H - PAD - 40);
    warpGrad.addColorStop(0, "rgba(167,139,250,0.13)");
    warpGrad.addColorStop(1, "rgba(167,139,250,0.00)");
    ctx.fillStyle = warpGrad;
    ctx.fillRect(OX_RIGHT + PAD, 8 + PANEL_H - PAD - 40, PANEL_W - 2 * PAD, 40);

    // Worldline in spacetime: y(t).
    if (pts.length > 1) {
      ctx.strokeStyle = "#A78BFA";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const [stx0, sty0] = stToScreen(pts[0].t, pts[0].y, tMax);
      ctx.moveTo(stx0, sty0);
      for (let i = 1; i < pts.length; i++) {
        const [stx, sty] = stToScreen(pts[i].t, pts[i].y, tMax);
        ctx.lineTo(stx, sty);
      }
      ctx.stroke();
    }

    // "Geodesic" annotation on the worldline.
    if (pts.length > 2) {
      const midIdx = Math.floor(pts.length * 0.6);
      const [lx, ly] = stToScreen(pts[midIdx].t, pts[midIdx].y, tMax);
      ctx.fillStyle = "#A78BFA";
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("geodesic", lx + 6, ly - 4);
    }

    // Axis labels.
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    const [t_axis_x, t_axis_y] = stToScreen(tMax / 2, 0, tMax);
    ctx.fillText("time →", t_axis_x, t_axis_y + 14);
    ctx.save();
    ctx.translate(OX_RIGHT + 14, 8 + PANEL_H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("height y", 0, 0);
    ctx.restore();

    // Panel title.
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SPACETIME VIEW (GR)", OX_RIGHT + PANEL_W / 2, PANEL_H + 4);
  }, [v0y, v0x]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />

      {/* Speed slider */}
      <div className="flex w-full max-w-[660px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-40 shrink-0">Initial toss speed v₀</span>
        <input
          type="range"
          min={1}
          max={8}
          step={0.1}
          value={v0y}
          onChange={(e) => setV0y(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-16 text-right">{v0y.toFixed(1)} m/s</span>
      </div>

      {/* Legend */}
      <div className="flex gap-6 font-mono text-xs text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#67E8F9]" />
          parabola (space)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#A78BFA]" />
          worldline (spacetime geodesic)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#F87171]" />
          Newtonian force
        </span>
      </div>

      {/* Honest-moment callout */}
      <div className="w-full max-w-[660px] rounded border border-purple-400/30 bg-purple-950/30 p-4 font-mono text-xs leading-relaxed text-white/80">
        <span className="font-bold text-purple-300">The apple isn&apos;t being pulled.</span>
        {" "}It&apos;s running along the straightest possible line in curved spacetime. In the spacetime view the worldline looks nearly straight — it is a geodesic of the Schwarzschild metric. The &quot;force&quot; Newton saw was the Christoffel correction keeping the tangent vector parallel-transported along the worldline. The same object, two descriptions: one geometric, one illusory.
      </div>
    </div>
  );
}
