"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  outerHorizonRadius,
  ergosphereRadius,
  zamoAngularVelocity,
} from "@/lib/physics/relativity/kerr-and-the-ergosphere";
import { Button } from "@/components/ui/button";

/**
 * FIG.45b — Frame dragging.
 *
 * Equatorial top-down view. A ring of test particles is "released at rest with
 * respect to infinity" — yet they cannot stay still. Each is carried around
 * the spin axis at the ZAMO angular velocity ω(r) = 2 a r / A, animated in
 * real time. Particles inside the static limit (the amber circle) are forced
 * to co-rotate no matter what; outside, the drag falls off as ~1/r³.
 *
 * A companion ω-vs-r curve is drawn at the bottom so the radial profile is
 * legible. The spin slider rescales the whole drag field.
 */

const PAD = 18;
const N_RINGS = 5;
const PARTICLES_PER_RING = 12;
// angular-velocity playback gain (visual): physical ω is in 1/M; multiply so
// the inner ring completes a revolution in a few seconds.
const PLAYBACK = 5.2;

export function FrameDraggingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [aStar, setAStar] = useState(0.9);
  const [running, setRunning] = useState(true);
  const tickRef = useSceneTick(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  // radii of the test-particle rings, in units of M (from just outside the
  // equatorial static limit out to r = 6 M)
  const ringRadii = useMemo(() => {
    const rs: number[] = [];
    for (let i = 0; i < N_RINGS; i++) {
      rs.push(2.1 + (i / (N_RINGS - 1)) * (6.0 - 2.1));
    }
    return rs;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const t = running ? tickRef.current / 1000 : 0;
      draw(ctx, tokens, aStar, ringRadii, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, aStar, ringRadii, running, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Top-down equatorial view of frame dragging around a Kerr black hole. Rings of test particles released at rest are swept around the spin axis at the ZAMO angular velocity, fastest near the horizon and falling off with radius."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32 shrink-0">a* = {aStar.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.998}
          step={0.002}
          value={aStar}
          onChange={(e) => setAStar(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "pause" : "run"}
        </Button>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        ω(r) = 2 a r / A — particles cannot stay at rest; inside the static
        limit they are forced to co-rotate.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  aStar: number,
  ringRadii: number[],
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD, "FRAME DRAGGING  (equatorial)", tokens.textMute);

  // ── split: disk on top ~70%, ω(r) profile below ──────────────────────────
  const profileH = 64;
  const diskH = H - PAD * 2 - 24 - profileH - 10;
  const cx = W / 2;
  const cy = PAD + 24 + diskH / 2;
  const rMax = 6.6; // world units shown
  const scale = Math.min(W - PAD * 2, diskH) / (2 * rMax);

  const rHorizon = outerHorizonRadius(aStar);
  const rStatic = ergosphereRadius(aStar, Math.PI / 2); // equatorial = 2M

  // faint radial grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (const rr of [2, 4, 6]) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ergosphere annulus (horizon → static limit)
  ctx.beginPath();
  ctx.arc(cx, cy, rStatic * scale, 0, Math.PI * 2);
  ctx.arc(cx, cy, rHorizon * scale, 0, Math.PI * 2, true);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.14);
  ctx.fill("evenodd");

  // static limit
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rStatic * scale, 0, Math.PI * 2);
  ctx.stroke();

  // horizon (filled)
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.12);
  ctx.beginPath();
  ctx.arc(cx, cy, rHorizon * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rHorizon * scale, 0, Math.PI * 2);
  ctx.stroke();

  // spin direction arrow (curved, CCW)
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.7);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, rHorizon * scale * 0.5, -0.6, 1.2);
  ctx.stroke();

  // ── particle rings ────────────────────────────────────────────────────────
  for (let ri = 0; ri < ringRadii.length; ri++) {
    const r = ringRadii[ri];
    const omega = zamoAngularVelocity(aStar, r); // 1/M
    const phase = omega * t * PLAYBACK;
    const insideStatic = r < rStatic;
    const dotColor = insideStatic ? tokens.magenta : tokens.textDim;
    for (let p = 0; p < PARTICLES_PER_RING; p++) {
      const ang = (p / PARTICLES_PER_RING) * Math.PI * 2 + phase;
      const x = cx + r * Math.cos(ang) * scale;
      const y = cy + r * Math.sin(ang) * scale;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(x, y, insideStatic ? 3 : 2.4, 0, Math.PI * 2);
      ctx.fill();
      // short motion trail in spin direction
      const tAng = ang - Math.min(0.5, omega * PLAYBACK * 0.12);
      ctx.strokeStyle = hexToRgba(
        insideStatic ? tokens.magenta : tokens.textDim,
        0.4,
      );
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + r * Math.cos(tAng) * scale, cy + r * Math.sin(tAng) * scale);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  // ── ω(r) profile strip ────────────────────────────────────────────────────
  const py0 = H - PAD - profileH;
  const px0 = PAD;
  const pw = W - PAD * 2;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(px0, py0, pw, profileH);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("ω(r)", px0 + 4, py0 + 3);

  const rProfMin = rHorizon;
  const rProfMax = 8;
  // peak ω at the horizon for normalization
  const omegaPeak = Math.max(
    1e-6,
    zamoAngularVelocity(aStar, rHorizon + 0.02),
  );
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const Nprof = 120;
  for (let i = 0; i <= Nprof; i++) {
    const r = rProfMin + (i / Nprof) * (rProfMax - rProfMin);
    const omega = zamoAngularVelocity(aStar, r);
    const fx = px0 + 4 + (i / Nprof) * (pw - 8);
    const fy = py0 + profileH - 6 - (omega / omegaPeak) * (profileH - 16);
    i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
  }
  ctx.stroke();

  // mark static-limit radius on the profile
  const fxStatic =
    px0 + 4 + ((rStatic - rProfMin) / (rProfMax - rProfMin)) * (pw - 8);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.8);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(fxStatic, py0 + 4);
  ctx.lineTo(fxStatic, py0 + profileH - 4);
  ctx.stroke();
  ctx.setLineDash([]);
}
