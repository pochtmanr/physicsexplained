"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.28a — The same falling apple, two interpretations.
 *
 * LEFT PANEL — Newtonian view: the apple is "pulled" down by a gravitational
 * force vector. The trajectory bends because there is a force acting on it.
 *
 * RIGHT PANEL — GR view: the apple follows a geodesic in curved spacetime.
 * No force acts on it; it moves along the straightest possible path through
 * a geometry that has been bent by the Earth below. The path looks curved
 * because spacetime is curved, not because anything is pulling.
 *
 * Both panels show identical (x, y) trajectories. The slider drives the
 * apple's progress along the same parabolic path — same physics, two
 * interpretations. The reader sees that the SAME observed motion supports
 * both readings; the question of which is "real" is the §06.4 reframe.
 */

const W = 700;
const H = 360;
const PAD = 16;
const PANEL_W = (W - PAD * 3) / 2;

// Apple's parabolic trajectory: launched horizontally from upper-left of each panel,
// arcs down to a target on the lower-right. Same path drawn in both panels.
const T_MAX = 1.0;

function applePos(t: number, panelX0: number, panelY0: number) {
  // Parametrize a parabolic arc within the panel.
  const xLocal = t * (PANEL_W - 60); // from x = 30 to x = PANEL_W − 30
  const yLocal = 40 + 4.5 * (xLocal / (PANEL_W - 60)) * xLocal; // mild parabola
  return { x: panelX0 + 30 + xLocal, y: panelY0 + 30 + yLocal };
}

export function CurvedTrajectoryScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [t, setT] = useState(0.5);

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

    // ── LEFT PANEL: Newtonian — apple "pulled" by gravity ──────────────────
    const leftX0 = PAD;
    const leftY0 = PAD;

    // Panel frame
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX0, leftY0, PANEL_W, H - PAD * 2);

    // Header
    ctx.fillStyle = "#67E8F9";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("NEWTON  ·  a force pulls the apple", leftX0 + 8, leftY0 + 18);

    // Earth (a flat horizon line at the bottom of each panel — schematic, not literal)
    ctx.fillStyle = "rgba(180,140,90,0.50)";
    ctx.fillRect(leftX0 + 4, H - PAD - 24, PANEL_W - 8, 20);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Earth", leftX0 + PANEL_W / 2, H - PAD - 8);

    // Trajectory (same parabola in both panels)
    ctx.strokeStyle = "rgba(103,232,249,0.40)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let s = 0; s <= 60; s++) {
      const tt = s / 60;
      const p = applePos(tt, leftX0, leftY0);
      if (s === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Apple position
    const appleL = applePos(t, leftX0, leftY0);
    ctx.fillStyle = "#FB923C";
    ctx.beginPath();
    ctx.arc(appleL.x, appleL.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Force vector pulling apple straight down — the Newtonian explanation
    ctx.strokeStyle = "#F87171";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(appleL.x, appleL.y);
    ctx.lineTo(appleL.x, appleL.y + 38);
    ctx.stroke();
    // Arrowhead
    ctx.fillStyle = "#F87171";
    ctx.beginPath();
    ctx.moveTo(appleL.x, appleL.y + 42);
    ctx.lineTo(appleL.x - 5, appleL.y + 34);
    ctx.lineTo(appleL.x + 5, appleL.y + 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#F87171";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("F = mg", appleL.x + 8, appleL.y + 28);

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("trajectory bends BECAUSE a force acts", leftX0 + 8, H - PAD - 36);

    // ── RIGHT PANEL: GR — apple follows a geodesic in curved spacetime ────
    const rightX0 = PAD * 2 + PANEL_W;
    const rightY0 = PAD;

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX0, rightY0, PANEL_W, H - PAD * 2);

    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("EINSTEIN  ·  a geodesic in curved spacetime", rightX0 + 8, rightY0 + 18);

    // Earth schematic
    ctx.fillStyle = "rgba(180,140,90,0.50)";
    ctx.fillRect(rightX0 + 4, H - PAD - 24, PANEL_W - 8, 20);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Earth (curving spacetime around it)", rightX0 + PANEL_W / 2, H - PAD - 8);

    // Coordinate-grid background showing curvature
    // Draw a set of horizontal lines that bow downward toward the Earth
    // (a 2D pictorial of curvature; the literal §07 picture replaces this).
    ctx.strokeStyle = "rgba(167,139,250,0.18)";
    ctx.lineWidth = 1;
    for (let row = 0; row < 6; row++) {
      const baseY = rightY0 + 50 + row * 38;
      ctx.beginPath();
      const samples = 30;
      for (let i = 0; i <= samples; i++) {
        const xL = rightX0 + 8 + (i / samples) * (PANEL_W - 16);
        // Bow downward proportional to how close to the Earth this row is.
        // Strength of curvature increases for lower rows.
        const curvatureStrength = 0.25 + row * 0.08;
        const center = rightX0 + PANEL_W / 2;
        const dxFromCenter = xL - center;
        const sag = curvatureStrength * Math.exp(-(dxFromCenter * dxFromCenter) / 4500);
        const yL = baseY + sag * 14;
        if (i === 0) ctx.moveTo(xL, yL);
        else ctx.lineTo(xL, yL);
      }
      ctx.stroke();
    }

    // Geodesic (the same parabola — in GR, this IS a "straight line"
    // in the curved geometry).
    ctx.strokeStyle = "rgba(167,139,250,0.55)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let s = 0; s <= 60; s++) {
      const tt = s / 60;
      const p = applePos(tt, rightX0, rightY0);
      if (s === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Apple
    const appleR = applePos(t, rightX0, rightY0);
    ctx.fillStyle = "#FB923C";
    ctx.beginPath();
    ctx.arc(appleR.x, appleR.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Annotation: "no force — geodesic"
    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("(no force) ", appleR.x + 8, appleR.y - 4);
    ctx.fillStyle = "rgba(167,139,250,0.85)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("→ straightest path in the local geometry", appleR.x + 8, appleR.y + 12);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("trajectory bends BECAUSE spacetime is curved", rightX0 + 8, H - PAD - 36);
  }, [t]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-28">progress = {t.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={T_MAX}
            step={0.01}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <p className="font-mono text-xs text-white/40">
          Same trajectory, two interpretations. Newton: a force pulls. Einstein: spacetime is curved
          and the apple takes the straightest available path. The observed motion is identical;
          the explanation is geometric.
        </p>
      </div>
    </div>
  );
}
