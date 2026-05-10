"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawDivider,
  drawSectionTitle,
  drawHudReadout,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

/**
 * FIG.33c — The §07.5 honest-moment payoff.
 *
 * Two side-by-side panels:
 *
 *   Left  "Space view":  A parabolic apple trajectory in (x, y) space.
 *         The apple (AMBER dot) animates continuously (3 s cycle).
 *         The force arrow is in RED. Subtle AMBER radial gradient near
 *         the ground indicates weak-field curvature.
 *
 *   Right "Spacetime view": The same motion drawn as a worldline in (t, y).
 *         Worldline in MAGENTA (nearly straight). Ground in CYAN.
 *         Faint AMBER radial glow near ground = curvature hint.
 *
 * A "callout" annotation at the bottom delivers the honest-moment message
 * in AMBER TEXT_BRIGHT, preceded by a drawDivider.
 *
 * Slider: initial upward toss speed v₀.
 */

const PAD = 28;

// ── Physics ──────────────────────────────────────────────────────────────────

const G_GRAV = 9.8;
const Y0 = 1.5;
const X0 = 0;
const V0X = 0.8;

function parabolaPoints(
  v0y: number,
  nSteps = 80,
): { t: number; x: number; y: number }[] {
  const tFall = (v0y + Math.sqrt(v0y * v0y + 2 * G_GRAV * Y0)) / G_GRAV;
  const dt = tFall / nSteps;
  const pts: { t: number; x: number; y: number }[] = [];
  for (let i = 0; i <= nSteps; i++) {
    const t = i * dt;
    const y = Y0 + v0y * t - 0.5 * G_GRAV * t * t;
    const x = X0 + V0X * t;
    if (y < 0) break;
    pts.push({ t, x, y });
  }
  return pts;
}

// ── Rendering helpers ─────────────────────────────────────────────────────────

function spaceToScreen(
  x: number,
  y: number,
  panelW: number,
  panelH: number,
  oxLeft: number,
): [number, number] {
  const scaleX = (panelW - 2 * PAD) / 6;
  const scaleY = (panelH - 2 * PAD) / 5;
  const sx = oxLeft + PAD + (x + 3) * scaleX;
  const sy = 8 + panelH - PAD - y * scaleY;
  return [sx, sy];
}

function stToScreen(
  t: number,
  y: number,
  tMax: number,
  panelW: number,
  panelH: number,
  oxRight: number,
): [number, number] {
  const scaleT = (panelW - 2 * PAD) / (tMax || 1);
  const scaleY = (panelH - 2 * PAD) / 5;
  const sx = oxRight + PAD + t * scaleT;
  const sy = 8 + panelH - PAD - y * scaleY;
  return [sx, sy];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FallingAppleAsGeodesicScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [v0y, setV0y] = useState(4.0);
  // 0..1 animation phase (3 s cycle)
  const [phase, setPhase] = useState(0);

  // 3-second animation cycle
  useEffect(() => {
    let raf = 0;
    const CYCLE = 3000;
    const start = performance.now();
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
    const PANEL_W = W / 2 - 24;
    const PANEL_H = H - 90;
    const OX_LEFT = 14;
    const OX_RIGHT = W / 2 + 14;
    const sp = (x: number, y: number) => spaceToScreen(x, y, PANEL_W, PANEL_H, OX_LEFT);
    const stp = (t: number, y: number, tMax: number) =>
      stToScreen(t, y, tMax, PANEL_W, PANEL_H, OX_RIGHT);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    const pts = parabolaPoints(v0y);
    const tMax = pts.length > 0 ? pts[pts.length - 1].t : 1;

    // ── Panel backgrounds ─────────────────────────────────────────────────
    for (const ox of [OX_LEFT, OX_RIGHT]) {
      ctx.fillStyle = hexToRgba(tokens.textBright, 0.03);
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ox, 8, PANEL_W, PANEL_H, 6);
      ctx.fill();
      ctx.stroke();
    }

    // ─── LEFT: Space view ─────────────────────────────────────────────────

    drawSectionTitle(ctx, OX_LEFT + 8, 14, "space view (Newton)", tokens.textMute);

    // Subtle AMBER radial gradient near ground = weak-field curvature hint
    {
      const [gx, gy] = sp(0, 0);
      const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 80);
      rg.addColorStop(0, hexToRgba(tokens.amber, 0.06));
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(OX_LEFT, 8, PANEL_W, PANEL_H);
    }

    // Ground line (CYAN)
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 1.5;
    const [gx0, gy0] = sp(-3, 0);
    const [gx1, gy1] = sp(3, 0);
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();

    // Earth ellipse
    const [ecx, ecy] = sp(0, -0.4);
    ctx.fillStyle = hexToRgba(tokens.blue, 0.18);
    ctx.strokeStyle = hexToRgba(tokens.blue, 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(ecx, ecy, 58, 16, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Earth", ecx, ecy);
    ctx.restore();

    // Gravity force arrow (RED) at mid-trajectory
    if (pts.length > 1) {
      const midPt = pts[Math.floor(pts.length / 2)];
      const [arx, ary] = sp(midPt.x, midPt.y);
      const arrowLen = 26;
      ctx.strokeStyle = tokens.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arx, ary);
      ctx.lineTo(arx, ary + arrowLen);
      ctx.stroke();
      ctx.fillStyle = tokens.red;
      ctx.beginPath();
      ctx.moveTo(arx, ary + arrowLen);
      ctx.lineTo(arx - 5, ary + arrowLen - 8);
      ctx.lineTo(arx + 5, ary + arrowLen - 8);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.font = FONT_HUD_SMALL;
      ctx.fillStyle = tokens.red;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("F = mg", arx + 6, ary + arrowLen - 8);
      ctx.restore();
    }

    // Parabolic arc (AMBER)
    if (pts.length > 1) {
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const [px0, py0] = sp(pts[0].x, pts[0].y);
      ctx.moveTo(px0, py0);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = sp(pts[i].x, pts[i].y);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Animated AMBER apple dot
    if (pts.length > 1) {
      const idx = Math.min(Math.floor(phase * pts.length), pts.length - 1);
      const [adx, ady] = sp(pts[idx].x, pts[idx].y);
      const glowA = ctx.createRadialGradient(adx, ady, 0, adx, ady, 14);
      glowA.addColorStop(0, hexToRgba(tokens.amber, 0.5));
      glowA.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowA;
      ctx.beginPath();
      ctx.arc(adx, ady, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.arc(adx, ady, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // ─── RIGHT: Spacetime view ────────────────────────────────────────────

    drawSectionTitle(ctx, OX_RIGHT + 8, 14, "spacetime view (GR)", tokens.textMute);

    // Spacetime grid
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    for (let yg = 0; yg <= 5; yg++) {
      const [sx0, sy0] = stp(0, yg, tMax);
      const [sx1, sy1] = stp(tMax, yg, tMax);
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();
    }
    for (let tg = 0; tg <= 4; tg++) {
      const t = (tg / 4) * tMax;
      const [sx0, sy0] = stp(t, 0, tMax);
      const [sx1, sy1] = stp(t, 5, tMax);
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();
    }

    // AMBER radial gradient near ground = curvature indicator
    {
      const [gx, gy] = stp(tMax / 2, 0, tMax);
      const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 90);
      rg.addColorStop(0, hexToRgba(tokens.amber, 0.06));
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(OX_RIGHT, 8, PANEL_W, PANEL_H);
    }

    // Ground line in spacetime (CYAN)
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 1.5;
    const [st_gx0, st_gy0] = stp(0, 0, tMax);
    const [st_gx1, st_gy1] = stp(tMax, 0, tMax);
    ctx.beginPath();
    ctx.moveTo(st_gx0, st_gy0);
    ctx.lineTo(st_gx1, st_gy1);
    ctx.stroke();
    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.cyan;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("ground", (st_gx0 + st_gx1) / 2, st_gy0 + 3);
    ctx.restore();

    // Worldline in spacetime (MAGENTA)
    if (pts.length > 1) {
      ctx.strokeStyle = tokens.magenta;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const [stx0, sty0] = stp(pts[0].t, pts[0].y, tMax);
      ctx.moveTo(stx0, sty0);
      for (let i = 1; i < pts.length; i++) {
        const [stx, sty] = stp(pts[i].t, pts[i].y, tMax);
        ctx.lineTo(stx, sty);
      }
      ctx.stroke();
    }

    // "geodesic" annotation on the worldline
    if (pts.length > 2) {
      const midIdx = Math.floor(pts.length * 0.55);
      const [lx, ly] = stp(pts[midIdx].t, pts[midIdx].y, tMax);
      ctx.save();
      ctx.font = FONT_HUD_SMALL;
      ctx.fillStyle = tokens.magenta;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("geodesic", lx + 7, ly - 14);
      ctx.restore();
    }

    // Animated AMBER apple tracer in spacetime panel
    if (pts.length > 1) {
      const idx = Math.min(Math.floor(phase * pts.length), pts.length - 1);
      const [tdx, tdy] = stp(pts[idx].t, pts[idx].y, tMax);
      const glowST = ctx.createRadialGradient(tdx, tdy, 0, tdx, tdy, 14);
      glowST.addColorStop(0, hexToRgba(tokens.amber, 0.5));
      glowST.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowST;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Axis labels
    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const [t_axis_x, t_axis_y] = stp(tMax / 2, 0, tMax);
    ctx.fillText("time →", t_axis_x, t_axis_y + 12);
    ctx.save();
    ctx.translate(OX_RIGHT + 14, 8 + PANEL_H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("height y", 0, 0);
    ctx.restore();
    ctx.restore();

    // HUD readout: toss speed
    drawHudReadout(ctx, OX_LEFT + 8, PANEL_H + 14, "v₀: ", `${v0y.toFixed(1)} m/s`, tokens.textDim, tokens.amber);

    // Divider above callout
    drawDivider(ctx, 10, W - 10, H - 54, tokens.gridHeavy);

    // Honest-moment callout text (AMBER)
    ctx.save();
    ctx.font = FONT_HUD;
    ctx.fillStyle = tokens.amber;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      "the apple isn't pulled; it's running along a geodesic of curved spacetime",
      W / 2,
      H - 46,
    );
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(
      "the “force” Newton saw is the Christoffel correction — a coordinate artefact",
      W / 2,
      H - 28,
    );
    ctx.restore();
  }, [v0y, phase, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Split-panel falling apple scene. Left: parabolic trajectory in (x, y) space with a Newtonian force arrow. Right: the same motion as a nearly-straight worldline in (t, y) spacetime — a geodesic of curved spacetime. An amber apple animates on both panels simultaneously."
      />

      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="w-40 shrink-0">Initial toss speed v₀</span>
        <input
          type="range"
          min={1}
          max={8}
          step={0.1}
          value={v0y}
          onChange={(e) => setV0y(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-16 text-right">{v0y.toFixed(1)} m/s</span>
      </div>

      <div className="mt-3 flex gap-6 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.amber }} />
          apple / trajectory
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.magenta }} />
          spacetime worldline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.cyan }} />
          ground
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.red }} />
          Newtonian force
        </span>
      </div>
    </div>
  );
}
