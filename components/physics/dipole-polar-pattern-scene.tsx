"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 460;

const LILAC = "rgba(200, 160, 255,"; // lobe outline
const MAGENTA = "rgba(255, 106, 222,"; // dipole body
const AMBER = "rgba(255, 180, 80,"; // broadside arrows / peak direction

/**
 * FIG.53c — sin²θ doughnut, rotating slowly.
 *
 * The angular distribution of radiated power from a Hertzian / oscillating
 * electric dipole is
 *
 *   dP/dΩ ∝ sin²θ
 *
 * where θ is the polar angle from the dipole axis. Integrating in azimuth
 * gives the familiar "doughnut" — a torus with its hole aligned along the
 * dipole axis. This scene renders an axonometric 3D view of that shape,
 * rotating slowly so the reader can see the torus hole from different
 * angles. The 2D cross-section in the drawing plane is drawn as a filled
 * lemniscate-style lobe pair (lilac outline + semi-transparent fill).
 *
 * The dipole axis is vertical; the "dead" direction (null in the pattern)
 * is along that axis; the peak is broadside (θ = π/2).
 */
export function DipolePolarPatternScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 460 });

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

      const cx = width * 0.5;
      const cy = height * 0.52;
      const R = Math.min(width * 0.34, height * 0.42);

      // Slow azimuthal rotation of the "view angle" about the dipole axis.
      // Azimuthal angle φ0 gives the orientation of the drawing plane.
      const phi0 = t * 0.35;

      // Axonometric projection: dipole axis → screen Y (up), drawing plane
      // perpendicular to axis → screen X. A perspective foreshortening of
      // the "out of plane" direction gives a 3D-ish feel.
      const fore = 0.45;

      // ─── Dipole axis line ────────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 1.15);
      ctx.lineTo(cx, cy + R * 1.15);
      ctx.stroke();
      ctx.setLineDash([]);

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("dipole axis  ·  θ = 0", cx, cy - R * 1.15 - 8);
      ctx.fillText("null  (no radiation)", cx, cy + R * 1.15 + 16);

      // ─── Azimuthal "equator" circle — the broadside ring where
      //    radiation is maximum ─────────────────────────────────────────
      ctx.strokeStyle = `${AMBER} 0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      {
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
          const phi = (i / steps) * Math.PI * 2;
          const rx = Math.cos(phi + phi0);
          const ry = Math.sin(phi + phi0) * fore;
          const px = cx + R * rx;
          const py = cy + R * ry * 0.35;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // ─── 3D doughnut rendered as a back-to-front layer ordering ─────
      // We sample θ × φ over the torus with r(θ) = sin²θ. Layer-order by
      // perspective depth so the front of the torus overwrites the back.
      // Simple approach: sort by the sign of the y-foreshortening component.
      type Seg = { x: number; y: number; depth: number; alphaShade: number };
      const segs: Seg[] = [];
      const thetaSteps = 48;
      const phiSteps = 80;
      for (let it = 0; it < thetaSteps; it++) {
        const theta = ((it + 0.5) / thetaSteps) * Math.PI;
        const rTheta = Math.sin(theta) * Math.sin(theta);
        for (let ip = 0; ip < phiSteps; ip++) {
          const phi = ((ip + 0.5) / phiSteps) * Math.PI * 2 + phi0;
          // Point in 3D: x = r·sin θ · cos φ, y = r·cos θ, z = r·sin θ · sin φ
          // (dipole axis = ŷ, drawing plane = (x,z), z is "out of page").
          const xx = rTheta * Math.sin(theta) * Math.cos(phi);
          const yy = rTheta * Math.cos(theta);
          const zz = rTheta * Math.sin(theta) * Math.sin(phi);
          const px = cx + R * xx;
          const py = cy - R * yy + R * zz * 0.3;
          const depth = zz; // out-of-page = larger depth = closer to camera
          // Shade: deeper points slightly brighter.
          const alphaShade = 0.12 + 0.18 * (depth + 0.5);
          segs.push({ x: px, y: py, depth, alphaShade });
        }
      }
      // Draw back-to-front as translucent dots.
      segs.sort((a, b) => a.depth - b.depth);
      for (const s of segs) {
        ctx.fillStyle = `${LILAC} ${Math.max(0, Math.min(0.45, s.alphaShade)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─── 2D cross-section (the classic "figure-eight" polar plot) ───
      // Draw a crisp lilac lemniscate in the dipole's vertical plane at
      // screen depth = 0, so it overlays the doughnut cleanly.
      ctx.strokeStyle = `${LILAC} 0.95)`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      {
        const steps = 180;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const s = Math.sin(theta);
          const r = s * s; // sin²θ
          const px = cx + R * r * Math.sin(theta);
          const py = cy - R * r * Math.cos(theta);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fillStyle = `${LILAC} 0.12)`;
      ctx.fill();
      ctx.stroke();

      // ─── Dipole body (short magenta bar) ─────────────────────────────
      const dipoleLen = R * 0.16;
      ctx.strokeStyle = `${MAGENTA} 0.95)`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy - dipoleLen);
      ctx.lineTo(cx, cy + dipoleLen);
      ctx.stroke();
      ctx.lineCap = "butt";

      // ─── Broadside arrows ───────────────────────────────────────────
      drawArrow(
        ctx,
        cx + R * 0.92,
        cy,
        cx + R * 1.12,
        cy,
        `${AMBER} 0.9)`,
        1.5,
      );
      drawArrow(
        ctx,
        cx - R * 0.92,
        cy,
        cx - R * 1.12,
        cy,
        `${AMBER} 0.9)`,
        1.5,
      );
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("broadside", cx + R * 1.18 + 14, cy + 4);
      ctx.fillText("peak", cx + R * 1.18 + 14, cy + 16);

      // ─── HUD ───────────────────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("FIG.53c · dP/dΩ ∝ sin²θ — the doughnut", 14, 20);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        "peak at θ = π/2  ·  null at θ = 0, π",
        14,
        height - 14,
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

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(7, len * 0.35);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}
