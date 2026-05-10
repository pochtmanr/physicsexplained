"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { integrateGeodesic } from "@/lib/physics/relativity/geodesics";
import { sphericalMetric } from "@/lib/physics/relativity/christoffel";
import {
  FONT_HUD,
  FONT_HUD_LARGE,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawArrow,
  drawSectionTitle,
  drawDivider,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

/**
 * FIG.33b — Geodesic equation solver.
 *
 * Two side-by-side panels:
 *   Left:  Flat 2D Euclidean space in Cartesian coords — geodesics are straight lines.
 *   Right: A 2-sphere in (θ, φ) chart — geodesics curve in coordinates but are
 *          intrinsically straight (great circles).
 *
 * A CYAN initial-condition arrow is drawn at the start point of each panel.
 * A moving GREEN dot traces the geodesic over a 4 s cycle then resets.
 * The geodesic equation is shown at the top of each panel in FONT_HUD_LARGE.
 *
 * Sliders:
 *   • Initial speed angle α (direction of v0 in the respective space).
 *   • Initial position φ₀ on the sphere.
 */

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
function cartToScreen(
  x: number,
  y: number,
  ox: number,
  panelW: number,
  H: number,
): [number, number] {
  const scale = (panelW - 2 * PAD) / 4;
  const cx = ox + panelW / 2 + x * scale;
  const cy = (H - 32) / 2 + 32 - y * scale;
  return [cx, cy];
}

/** Map sphere chart (θ, φ) to panel pixels (Mercator-like flat projection). */
function sphereChartToScreen(
  theta: number,
  phi: number,
  ox: number,
  panelW: number,
  panelH: number,
): [number, number] {
  const sx = ox + PAD + (((phi + Math.PI) % (2 * Math.PI)) * (panelW - 2 * PAD)) / (2 * Math.PI);
  const sy = 32 + PAD + (theta / Math.PI) * (panelH - 2 * PAD);
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
  const x0 = [Math.PI / 2, phi0];
  const speed = 0.8;
  const v0 = [speed * Math.cos(angle), speed * Math.sin(angle)];
  return [...integrateGeodesic(sphericalMetric(1), x0, v0, 4.0, 0.04)];
}

// ── Component ───────────────────────────────────────────────────────────────

export function GeodesicEquationSolverScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.53,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [angle, setAngle] = useState(0.4);
  const [phi0, setPhi0] = useState(0);
  // 0..1 tracer phase driven by RAF
  const [phase, setPhase] = useState(0);

  const flatPath = useMemo(() => computeFlatPath(angle), [angle]);
  const spherePath = useMemo(() => computeSpherePath(phi0, angle), [phi0, angle]);

  // 4-second tracer cycle
  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const CYCLE = 4000; // ms
    const loop = (t: number) => {
      setPhase(((t - start) % CYCLE) / CYCLE);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const W = width;
    const H = height;
    const PANEL_W = W / 2 - 20;
    const PANEL_H = H - 70;
    const cs = (x: number, y: number, ox: number) => cartToScreen(x, y, ox, PANEL_W, H);
    const ss = (theta: number, phi: number, ox: number) =>
      sphereChartToScreen(theta, phi, ox, PANEL_W, PANEL_H);

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    const PANEL_OX = [10, W / 2 + 10];

    // ── Panel backgrounds ────────────────────────────────────────────────
    for (let p = 0; p < 2; p++) {
      const ox = PANEL_OX[p];
      ctx.fillStyle = hexToRgba(tokens.textBright, 0.03);
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ox, 28, PANEL_W, PANEL_H, 6);
      ctx.fill();
      ctx.stroke();
    }

    // ── Geodesic equation header ─────────────────────────────────────────
    const EQ_FLAT_X = PANEL_OX[0] + PANEL_W / 2;
    const EQ_SPHERE_X = PANEL_OX[1] + PANEL_W / 2;
    const EQ_Y = 6;
    ctx.save();
    ctx.font = FONT_HUD_LARGE;
    ctx.fillStyle = tokens.textDim;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("d²x/dλ² = 0  (Γ = 0)", EQ_FLAT_X, EQ_Y);
    ctx.fillText("d²x^μ/dλ² + Γ^μ_αβ ẋ^α ẋ^β = 0", EQ_SPHERE_X, EQ_Y);
    ctx.restore();

    // ── Flat panel: Cartesian grid ────────────────────────────────────────
    const OX_FLAT = PANEL_OX[0];
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    for (let gv = -2; gv <= 2; gv++) {
      const [x0c, y0c] = cs(gv, -2, OX_FLAT);
      const [x1c, y1c] = cs(gv, 2, OX_FLAT);
      ctx.beginPath();
      ctx.moveTo(x0c, y0c);
      ctx.lineTo(x1c, y1c);
      ctx.stroke();

      const [x0r, y0r] = cs(-2, gv, OX_FLAT);
      const [x1r, y1r] = cs(2, gv, OX_FLAT);
      ctx.beginPath();
      ctx.moveTo(x0r, y0r);
      ctx.lineTo(x1r, y1r);
      ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 1;
    const [ax0, ay0] = cs(-2.2, 0, OX_FLAT);
    const [ax1, ay1] = cs(2.2, 0, OX_FLAT);
    ctx.beginPath();
    ctx.moveTo(ax0, ay0);
    ctx.lineTo(ax1, ay1);
    ctx.stroke();
    const [az0, az1_y] = cs(0, -2.2, OX_FLAT);
    const [, az1_y2] = cs(0, 2.2, OX_FLAT);
    ctx.beginPath();
    ctx.moveTo(az0, az1_y);
    ctx.lineTo(az0, az1_y2);
    ctx.stroke();

    // Flat geodesic path (CYAN)
    if (flatPath.length > 1) {
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const [sx0, sy0] = cs(flatPath[0].x[0], flatPath[0].x[1], OX_FLAT);
      ctx.moveTo(sx0, sy0);
      for (let i = 1; i < flatPath.length; i++) {
        const [sx, sy] = cs(flatPath[i].x[0], flatPath[i].x[1], OX_FLAT);
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // CYAN initial-condition arrow at start
    {
      const [sdx, sdy] = cs(0, 0, OX_FLAT);
      const arrowScale = 30;
      const ax = sdx + Math.cos(angle) * arrowScale;
      const ay = sdy - Math.sin(angle) * arrowScale;
      drawArrow(ctx, sdx, sdy, ax, ay, tokens.cyan, 1.5, 7);
    }

    // Moving GREEN tracer dot on flat path
    if (flatPath.length > 1) {
      const idx = Math.min(Math.floor(phase * flatPath.length), flatPath.length - 1);
      const [tdx, tdy] = cs(flatPath[idx].x[0], flatPath[idx].x[1], OX_FLAT);
      ctx.save();
      // glow
      const glowF = ctx.createRadialGradient(tdx, tdy, 0, tdx, tdy, 10);
      glowF.addColorStop(0, tokens.green);
      glowF.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowF;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = tokens.green;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Panel section title
    drawSectionTitle(ctx, OX_FLAT + 8, 32, "flat space — Γ = 0", tokens.textMute);

    // ── Sphere panel: (θ, φ) chart ────────────────────────────────────────
    const OX_SPHERE = PANEL_OX[1];

    // Latitude grid lines
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    for (let tIdx = 0; tIdx <= 8; tIdx++) {
      const theta = (tIdx / 8) * Math.PI;
      const [sx0_s, sy0_s] = ss(theta, -Math.PI, OX_SPHERE);
      const [sx1_s, sy1_s] = ss(theta, Math.PI, OX_SPHERE);
      ctx.beginPath();
      ctx.moveTo(sx0_s, sy0_s);
      ctx.lineTo(sx1_s, sy1_s);
      ctx.stroke();
    }
    // Longitude grid lines
    for (let pIdx = 0; pIdx <= 8; pIdx++) {
      const phi = -Math.PI + (pIdx / 8) * 2 * Math.PI;
      const [sx0_p, sy0_p] = ss(0, phi, OX_SPHERE);
      const [sx1_p, sy1_p] = ss(Math.PI, phi, OX_SPHERE);
      ctx.beginPath();
      ctx.moveTo(sx0_p, sy0_p);
      ctx.lineTo(sx1_p, sy1_p);
      ctx.stroke();
    }
    // Equator highlighted
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 1;
    const [esx0, esy0] = ss(Math.PI / 2, -Math.PI, OX_SPHERE);
    const [esx1, esy1] = ss(Math.PI / 2, Math.PI, OX_SPHERE);
    ctx.beginPath();
    ctx.moveTo(esx0, esy0);
    ctx.lineTo(esx1, esy1);
    ctx.stroke();

    // Sphere geodesic path (AMBER)
    if (spherePath.length > 1) {
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const first = spherePath[0];
      const phi0Wrapped = ((first.x[1] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const [ssx0, ssy0] = ss(first.x[0], phi0Wrapped, OX_SPHERE);
      ctx.moveTo(ssx0, ssy0);
      let prevPhi = phi0Wrapped;
      for (let i = 1; i < spherePath.length; i++) {
        const theta_i = spherePath[i].x[0];
        const phi_i = ((spherePath[i].x[1] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        if (Math.abs(phi_i - prevPhi) > Math.PI) {
          ctx.stroke();
          ctx.beginPath();
        }
        const [ssx, ssy] = ss(theta_i, phi_i, OX_SPHERE);
        ctx.lineTo(ssx, ssy);
        prevPhi = phi_i;
      }
      ctx.stroke();
    }

    // CYAN initial-condition arrow on sphere chart
    {
      const phi0w = ((phi0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const [sdx, sdy] = ss(Math.PI / 2, phi0w, OX_SPHERE);
      const arrowScale = 28;
      const ax = sdx + Math.cos(angle) * arrowScale;
      const ay = sdy - Math.sin(angle) * arrowScale;
      drawArrow(ctx, sdx, sdy, ax, ay, tokens.cyan, 1.5, 7);
    }

    // Moving GREEN tracer dot on sphere path
    if (spherePath.length > 1) {
      const idx = Math.min(Math.floor(phase * spherePath.length), spherePath.length - 1);
      const phi_i = ((spherePath[idx].x[1] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const [tdx, tdy] = ss(spherePath[idx].x[0], phi_i, OX_SPHERE);
      ctx.save();
      const glowS = ctx.createRadialGradient(tdx, tdy, 0, tdx, tdy, 10);
      glowS.addColorStop(0, tokens.green);
      glowS.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowS;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = tokens.green;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Axis labels
    ctx.save();
    ctx.font = FONT_HUD;
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("θ=0 (N)", OX_SPHERE + PAD - 2, 32 + PAD + 2);
    ctx.fillText("θ=π (S)", OX_SPHERE + PAD - 2, 32 + PANEL_H - PAD);
    ctx.textAlign = "center";
    ctx.fillText("φ = −π", OX_SPHERE + PAD + 2, 32 + PANEL_H - PAD + 4);
    ctx.fillText("φ = +π", OX_SPHERE + PANEL_W - PAD, 32 + PANEL_H - PAD + 4);
    ctx.restore();

    // Panel section title
    drawSectionTitle(ctx, OX_SPHERE + 8, 32, "sphere chart — Γ ≠ 0", tokens.textMute);

    // Bottom divider
    drawDivider(ctx, 10, W - 10, H - 22, tokens.grid);

    // Footer
    ctx.save();
    ctx.font = FONT_HUD;
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      "green dot traces the geodesic · straight in geometry, curved in coordinates",
      W / 2,
      H - 18,
    );
    ctx.restore();
  }, [flatPath, spherePath, phi0, angle, phase, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Split-panel geodesic equation solver. Left: flat Cartesian space where geodesics are straight lines (Γ = 0). Right: sphere (θ, φ) chart where geodesics appear curved in coordinates but are intrinsically straight great circles. A green dot traces each path over 4 seconds."
      />

      <div className="mt-3 flex flex-col gap-1">
        <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
          <span className="w-40 shrink-0">Initial direction α</span>
          <input
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
          <span className="w-14 text-right">{angle.toFixed(2)} rad</span>
        </div>

        <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
          <span className="w-40 shrink-0">Start longitude φ₀ (sphere)</span>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.05}
            value={phi0}
            onChange={(e) => setPhi0(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
          />
          <span className="w-14 text-right">{phi0.toFixed(2)} rad</span>
        </div>
      </div>

      <div className="mt-3 flex gap-6 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.cyan }} />
          flat geodesic (straight line)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.amber }} />
          sphere geodesic (great-circle arc)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: tokens.green }} />
          tracer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.cyan }} />
          initial condition
        </span>
      </div>
    </div>
  );
}
