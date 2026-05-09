"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { integrateGeodesic } from "@/lib/physics/relativity/geodesics";
import { sphericalMetric } from "@/lib/physics/relativity/christoffel";

/**
 * FIG.33b — Geodesic equation solver.
 *
 * Two side-by-side panels:
 *   Left:  Flat 2D Euclidean space in Cartesian coords — geodesics are straight lines.
 *   Right: A 2-sphere in (θ, φ) chart — geodesics curve in coordinates but are
 *          intrinsically straight (great circles).
 *
 * The geodesic equation is displayed above:
 *   d²x^μ/dλ² + Γ^μ_{αβ} (dx^α/dλ)(dx^β/dλ) = 0
 *
 * Sliders:
 *   • Initial speed angle α (direction of v0 in the respective space).
 *   • Initial position φ₀ on the sphere.
 *
 * The path unfolds from a fixed start as the user adjusts the sliders.
 */

const W = 680;
const H = 320;
const PANEL_W = 320;
const PANEL_H = 280;
const PAD = 20;

// ── metric helpers ──────────────────────────────────────────────────────────

function flatMetric2D(_x: readonly number[]): readonly (readonly number[])[] {
  return [
    [1, 0],
    [0, 1],
  ] as const;
}

// ── coordinate converters ─────────────────────────────────────────────────────

/** Map Cartesian (x, y) ∈ [−2, 2]² to canvas pixels inside a panel. */
function cartToScreen(x: number, y: number, ox: number): [number, number] {
  const scale = (PANEL_W - 2 * PAD) / 4; // 4 units → panel width
  const cx = ox + PANEL_W / 2 + x * scale;
  const cy = H / 2 - y * scale;
  return [cx, cy];
}

/** Map sphere chart (θ, φ) to panel pixels (Mercator-like flat projection). */
function sphereChartToScreen(theta: number, phi: number, ox: number): [number, number] {
  // θ ∈ [0, π] → vertical axis (inverted: θ=0 top, θ=π bottom)
  // φ ∈ [0, 2π] → horizontal axis
  const sx = ox + PAD + ((phi + Math.PI) % (2 * Math.PI)) * (PANEL_W - 2 * PAD) / (2 * Math.PI);
  const sy = PAD + (theta / Math.PI) * (PANEL_H - 2 * PAD);
  return [sx, sy];
}

// ── integrations ───────────────────────────────────────────────────────────

function computeFlatPath(angle: number): { x: readonly number[]; v: readonly number[] }[] {
  const v0 = [Math.cos(angle), Math.sin(angle)];
  return [...integrateGeodesic(flatMetric2D, [0, 0], v0, 3.0, 0.06)];
}

function computeSpherePath(
  phi0: number,
  angle: number,
): { x: readonly number[]; v: readonly number[] }[] {
  // Start on equator at (θ = π/2, φ = phi0), tangent direction mixed dθ+dφ.
  const x0 = [Math.PI / 2, phi0];
  const speed = 0.8;
  const v0 = [speed * Math.cos(angle), speed * Math.sin(angle)];
  return [...integrateGeodesic(sphericalMetric(1), x0, v0, 4.0, 0.04)];
}

// ── Component ───────────────────────────────────────────────────────────────

export function GeodesicEquationSolverScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [angle, setAngle] = useState(0.4);
  const [phi0, setPhi0] = useState(0);

  const flatPath = useMemo(() => computeFlatPath(angle), [angle]);
  const spherePath = useMemo(() => computeSpherePath(phi0, angle), [phi0, angle]);

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

    // Background
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, W, H);

    // ── Panel backgrounds ────────────────────────────────────────────────
    const PANEL_OX = [10, W / 2 + 10];

    for (let p = 0; p < 2; p++) {
      const ox = PANEL_OX[p];
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ox, 8, PANEL_W, PANEL_H, 6);
      ctx.fill();
      ctx.stroke();
    }

    // ── Flat panel: Cartesian grid ────────────────────────────────────────
    const OX_FLAT = PANEL_OX[0];
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 0.5;
    for (let gv = -2; gv <= 2; gv++) {
      const [x0c, y0c] = cartToScreen(gv, -2, OX_FLAT);
      const [x1c, y1c] = cartToScreen(gv, 2, OX_FLAT);
      ctx.beginPath();
      ctx.moveTo(x0c, y0c);
      ctx.lineTo(x1c, y1c);
      ctx.stroke();

      const [x0r, y0r] = cartToScreen(-2, gv, OX_FLAT);
      const [x1r, y1r] = cartToScreen(2, gv, OX_FLAT);
      ctx.beginPath();
      ctx.moveTo(x0r, y0r);
      ctx.lineTo(x1r, y1r);
      ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    const [ax0, ay0] = cartToScreen(-2.2, 0, OX_FLAT);
    const [ax1, ay1] = cartToScreen(2.2, 0, OX_FLAT);
    ctx.beginPath();
    ctx.moveTo(ax0, ay0);
    ctx.lineTo(ax1, ay1);
    ctx.stroke();
    const [az0, az1_y] = cartToScreen(0, -2.2, OX_FLAT);
    const [, az1_y2] = cartToScreen(0, 2.2, OX_FLAT);
    ctx.beginPath();
    ctx.moveTo(az0, az1_y);
    ctx.lineTo(az0, az1_y2);
    ctx.stroke();

    // Flat geodesic path
    if (flatPath.length > 1) {
      ctx.strokeStyle = "#67E8F9";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const [sx0, sy0] = cartToScreen(flatPath[0].x[0], flatPath[0].x[1], OX_FLAT);
      ctx.moveTo(sx0, sy0);
      for (let i = 1; i < flatPath.length; i++) {
        const [sx, sy] = cartToScreen(flatPath[i].x[0], flatPath[i].x[1], OX_FLAT);
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    // Start dot
    const [sdx, sdy] = cartToScreen(0, 0, OX_FLAT);
    ctx.fillStyle = "#F87171";
    ctx.beginPath();
    ctx.arc(sdx, sdy, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("flat: Γ = 0, straight lines", OX_FLAT + PANEL_W / 2, PANEL_H + 2);

    // ── Sphere panel: (θ, φ) chart ────────────────────────────────────────
    const OX_SPHERE = PANEL_OX[1];

    // Latitude grid lines (constant θ).
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    for (let tIdx = 0; tIdx <= 8; tIdx++) {
      const theta = (tIdx / 8) * Math.PI;
      const [sx0_s, sy0_s] = sphereChartToScreen(theta, -Math.PI, OX_SPHERE);
      const [sx1_s, sy1_s] = sphereChartToScreen(theta, Math.PI, OX_SPHERE);
      ctx.beginPath();
      ctx.moveTo(sx0_s, sy0_s);
      ctx.lineTo(sx1_s, sy1_s);
      ctx.stroke();
    }
    // Longitude grid lines (constant φ).
    for (let pIdx = 0; pIdx <= 8; pIdx++) {
      const phi = -Math.PI + (pIdx / 8) * 2 * Math.PI;
      const [sx0_p, sy0_p] = sphereChartToScreen(0, phi, OX_SPHERE);
      const [sx1_p, sy1_p] = sphereChartToScreen(Math.PI, phi, OX_SPHERE);
      ctx.beginPath();
      ctx.moveTo(sx0_p, sy0_p);
      ctx.lineTo(sx1_p, sy1_p);
      ctx.stroke();
    }
    // Equator highlighted.
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    const [esx0, esy0] = sphereChartToScreen(Math.PI / 2, -Math.PI, OX_SPHERE);
    const [esx1, esy1] = sphereChartToScreen(Math.PI / 2, Math.PI, OX_SPHERE);
    ctx.beginPath();
    ctx.moveTo(esx0, esy0);
    ctx.lineTo(esx1, esy1);
    ctx.stroke();

    // Sphere geodesic path.
    if (spherePath.length > 1) {
      ctx.strokeStyle = "#A78BFA";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const first = spherePath[0];
      const phi0Wrapped = ((first.x[1] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const [ssx0, ssy0] = sphereChartToScreen(first.x[0], phi0Wrapped, OX_SPHERE);
      ctx.moveTo(ssx0, ssy0);
      let prevPhi = phi0Wrapped;
      for (let i = 1; i < spherePath.length; i++) {
        const theta_i = spherePath[i].x[0];
        let phi_i = ((spherePath[i].x[1] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        // Detect wrap-around discontinuities.
        if (Math.abs(phi_i - prevPhi) > Math.PI) {
          ctx.stroke();
          ctx.beginPath();
        }
        const [ssx, ssy] = sphereChartToScreen(theta_i, phi_i, OX_SPHERE);
        ctx.lineTo(ssx, ssy);
        prevPhi = phi_i;
      }
      ctx.stroke();
    }
    // Start dot
    const phi0w = ((phi0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const [ssd0x, ssd0y] = sphereChartToScreen(Math.PI / 2, phi0w, OX_SPHERE);
    ctx.fillStyle = "#F87171";
    ctx.beginPath();
    ctx.arc(ssd0x, ssd0y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Axis labels.
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("θ=0 (N)", OX_SPHERE + PAD - 2, PAD + 4);
    ctx.fillText("θ=π (S)", OX_SPHERE + PAD - 2, PANEL_H - PAD + 2);
    ctx.textAlign = "center";
    ctx.fillText("φ = −π", OX_SPHERE + PAD + 2, PANEL_H - 4);
    ctx.fillText("φ = +π", OX_SPHERE + PANEL_W - PAD, PANEL_H - 4);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("sphere (θ,φ) chart — geodesics curve in coords", OX_SPHERE + PANEL_W / 2, PANEL_H + 2);
  }, [flatPath, spherePath, phi0, angle]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Geodesic equation */}
      <div className="rounded border border-white/10 bg-black/40 px-4 py-2 text-center font-mono text-sm text-yellow-200">
        d²x^μ/dλ² + Γ^μ_αβ (dx^α/dλ)(dx^β/dλ) = 0
      </div>

      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />

      <div className="flex w-full max-w-[680px] flex-col gap-2 font-mono text-xs text-white/70">
        <label className="flex items-center gap-3">
          <span className="w-40 shrink-0">Initial direction α</span>
          <input
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-14 text-right">{angle.toFixed(2)} rad</span>
        </label>

        <label className="flex items-center gap-3">
          <span className="w-40 shrink-0">Start longitude φ₀ (sphere)</span>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.05}
            value={phi0}
            onChange={(e) => setPhi0(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-14 text-right">{phi0.toFixed(2)} rad</span>
        </label>
      </div>

      <div className="flex gap-6 font-mono text-xs text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#67E8F9]" />
          flat geodesic (straight line)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#A78BFA]" />
          sphere geodesic (great-circle arc)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F87171]" />
          start
        </span>
      </div>
    </div>
  );
}
