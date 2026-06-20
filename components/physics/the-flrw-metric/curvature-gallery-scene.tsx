"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  angleSumDegrees,
  type CurvatureSign,
} from "@/lib/physics/relativity/the-flrw-metric";

/**
 * FIG.54b — Curvature gallery.
 *
 * Three constant-curvature spatial slices side by side: open (k = −1,
 * saddle), flat (k = 0, plane), closed (k = +1, sphere cap). A geodesic
 * triangle is drawn on each, and a single "triangle size" slider grows all
 * three together. The Gauss–Bonnet readout shows the interior angle sum:
 * > 180° on the sphere, exactly 180° on the plane, < 180° on the saddle.
 * Only the flat slice keeps Euclid; the other two do not.
 *
 * Palette: cyan (flat), magenta (closed/+1), amber (open/−1), with the
 * active panel highlighted.
 */

const PANELS: { k: CurvatureSign; label: string; tag: string }[] = [
  { k: -1, label: "OPEN  k = −1", tag: "saddle" },
  { k: 0, label: "FLAT  k = 0", tag: "plane" },
  { k: 1, label: "CLOSED  k = +1", tag: "sphere" },
];

export function CurvatureGalleryScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [size, setSize] = useState(0.45); // fractional triangle area [0,1]
  const [active, setActive] = useState(2); // start on the closed slice
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, size, active, width, height);
  }, [size, active, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Three constant-curvature spatial slices: open saddle, flat plane, closed sphere. A geodesic triangle on each shows interior angle sums above, equal to, and below 180 degrees respectively."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">triangle size</span>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.01}
          value={size}
          onChange={(e) => setSize(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {PANELS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            className="cursor-pointer rounded-none border px-2 py-0.5"
            style={{
              borderColor:
                i === active ? "var(--color-cyan)" : "var(--color-fg-4)",
              color:
                i === active ? "var(--color-cyan)" : "var(--color-fg-3)",
            }}
            onClick={() => setActive(i)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  size: number,
  active: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = 14;
  const gap = 10;
  const panelW = (W - PAD * 2 - gap * 2) / 3;
  const panelTop = PAD + 18;
  const panelH = H - panelTop - PAD - 28;

  PANELS.forEach((p, i) => {
    const x0 = PAD + i * (panelW + gap);
    const isActive = i === active;
    const accent =
      p.k === 0 ? tokens.cyan : p.k === 1 ? tokens.magenta : tokens.amber;

    // panel border
    ctx.strokeStyle = isActive ? accent : tokens.panelBorder;
    ctx.lineWidth = isActive ? 1.5 : 1;
    ctx.strokeRect(x0, panelTop, panelW, panelH);

    // title
    ctx.fillStyle = isActive ? accent : tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(p.label, x0 + 4, panelTop - 4);

    const cx = x0 + panelW / 2;
    const cy = panelTop + panelH * 0.46;
    const R = Math.min(panelW, panelH) * 0.34;

    drawSurface(ctx, tokens, p.k, cx, cy, R, accent, isActive);
    drawGeodesicTriangle(ctx, p.k, cx, cy, R, size, accent);

    // angle-sum readout under each panel
    const sum = angleSumDegrees(size, p.k);
    const rel =
      p.k === 0 ? "= 180°" : p.k === 1 ? "> 180°" : "< 180°";
    ctx.fillStyle = isActive ? accent : tokens.textDim;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      `Σ∠ = ${sum.toFixed(1)}°  (${rel})`,
      cx,
      panelTop + panelH + 6,
    );
  });

  // footer note
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "Gauss–Bonnet:  (Σ∠) − π = K · A,  K = k / a²",
    W / 2,
    H - 6,
  );
}

/** Sketch the surface: saddle contours (−1), grid (0), sphere outline (+1). */
function drawSurface(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  k: CurvatureSign,
  cx: number,
  cy: number,
  R: number,
  accent: string,
  isActive: boolean,
) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = tokens.grid;

  if (k === 0) {
    // flat: a simple square grid
    const n = 4;
    for (let i = -n; i <= n; i++) {
      const t = (i / n) * R;
      ctx.beginPath();
      ctx.moveTo(cx - R, cy + t);
      ctx.lineTo(cx + R, cy + t);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + t, cy - R);
      ctx.lineTo(cx + t, cy + R);
      ctx.stroke();
    }
  } else if (k === 1) {
    // closed: sphere as outline + a few latitude/longitude ellipses
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 1; i <= 2; i++) {
      const ry = R * (i / 3);
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 0.55, R, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // open: saddle — hyperbolic contours
    for (let i = 1; i <= 3; i++) {
      const s = (i / 3) * R;
      ctx.beginPath();
      for (let x = -R; x <= R; x += 4) {
        const y = (x * x) / (2 * R) - s * 0.6;
        if (x === -R) ctx.moveTo(cx + x, cy + y - R * 0.1);
        else ctx.lineTo(cx + x, cy + y - R * 0.1);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let x = -R; x <= R; x += 4) {
        const y = -(x * x) / (2 * R) + s * 0.6;
        if (x === -R) ctx.moveTo(cx + x, cy + y + R * 0.1);
        else ctx.lineTo(cx + x, cy + y + R * 0.1);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Draw a geodesic triangle whose edges bow out (+1), straight (0), or bow in (−1). */
function drawGeodesicTriangle(
  ctx: CanvasRenderingContext2D,
  k: CurvatureSign,
  cx: number,
  cy: number,
  R: number,
  size: number,
  accent: string,
) {
  const r = R * (0.35 + 0.6 * size);
  // three vertices on a circle of radius r, pointing up
  const verts = [-90, 30, 150].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  // bow factor: +1 bows outward (convex), −1 bows inward (concave)
  const bow = k * R * 0.22 * size;

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.fillStyle = hexToRgba(accent, 0.12);
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const p0 = verts[i];
    const p1 = verts[(i + 1) % 3];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    // outward normal from triangle centroid
    const nx = mx - cx;
    const ny = my - cy;
    const nlen = Math.hypot(nx, ny) || 1;
    const ctrlX = mx + (nx / nlen) * bow;
    const ctrlY = my + (ny / nlen) * bow;
    if (i === 0) ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, p1.x, p1.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // vertex dots
  ctx.fillStyle = accent;
  verts.forEach((v) => {
    ctx.beginPath();
    ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
