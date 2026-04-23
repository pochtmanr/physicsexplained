"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  brewsterAngleDeg,
  malusLaw,
} from "@/lib/physics/electromagnetism/polarization-optics";
import {
  fresnelAll,
  reflectance,
} from "@/lib/physics/electromagnetism/fresnel";

const RATIO = 0.58;
const MAX_HEIGHT = 520;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const MAGENTA = "rgba(255, 100, 200,";
const PALE_BLUE = "rgba(180, 210, 240,";

/**
 * BREWSTER DEMO SCENE — the "polariser on a camera to kill glare" story.
 *
 * A diffuse unpolarised beam (think sunlight) hits a puddle / window /
 * lake surface at Brewster's angle. By §09.3, the reflected glare is
 * almost entirely **s-polarised** — E sticks out of the plane of
 * incidence, which on a flat horizontal pane means the reflected E is
 * horizontal. That is exactly the polarisation that a vertical-axis
 * polariser blocks.
 *
 * The user can rotate the polariser on the "camera" (right side of the
 * scene). The transmitted glare intensity through the polariser is
 *
 *   I_glare(φ) = R_s · I₀ / 2  ·  cos²(φ − 90°)     (reflected E is
 *                                                   horizontal, i.e. 90°
 *                                                   from the vertical)
 *
 * When the polariser axis is vertical (φ = 0°), cos² is 0 and the glare
 * disappears — this is the "polarising filter makes the lake transparent"
 * effect photographers use daily. Rotate away from vertical and the
 * glare comes back.
 *
 * Visually distinct from §09.3's BrewsterAngleScene — that one focused
 * on the bare Fresnel geometry; this one foregrounds the polariser-on-a-
 * camera application.
 */
export function BrewsterAngleDemoScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 860, height: 500 });
  const n1 = 1.0;
  const n2 = 1.5;
  const thetaBdeg = brewsterAngleDeg(n1, n2);
  const [polAngle, setPolAngle] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = size;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, width, height);

    const theta = (thetaBdeg * Math.PI) / 180;
    const { rs, rp } = fresnelAll(theta, n1, n2);
    const Rs = reflectance(rs);
    const Rp = reflectance(rp); // essentially zero at Brewster

    // Geometry — sky above, water below, ray bouncing to a camera on the
    // right-hand side.
    const cx = width * 0.35; // hit point on the surface
    const cy = height * 0.55;
    const rayLen = Math.min(width, height) * 0.30;

    // Water surface tint.
    ctx.fillStyle = `${LILAC} 0.10)`;
    ctx.fillRect(0, cy, width, height - cy);
    ctx.strokeStyle = `${CYAN} 0.85)`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(12, cy);
    ctx.lineTo(width - 12, cy);
    ctx.stroke();

    // Normal at hit point (dashed).
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - rayLen * 1.1);
    ctx.lineTo(cx, cy + rayLen * 1.1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Incoming sunlight: unpolarised, equal s + p.
    const incStartX = cx - rayLen * Math.sin(theta);
    const incStartY = cy - rayLen * Math.cos(theta);
    drawMixedBeam(ctx, incStartX, incStartY, cx, cy, 0.5, 0.5, "in");

    // Reflected glare: purely s-polarised (since we're at θ_B).
    // The width encodes intensity (R_s · I₀ / 2).
    const reflEndX = cx + rayLen * 1.35 * Math.sin(theta);
    const reflEndY = cy - rayLen * 1.35 * Math.cos(theta);
    drawMixedBeam(ctx, cx, cy, reflEndX, reflEndY, Rs * 0.5, Rp * 0.5, "out");

    // Transmitted (into water, ignored here — dim grey for context).
    const snellSinT = (n1 / n2) * Math.sin(theta);
    const thetaT = Math.asin(snellSinT);
    const transEndX = cx + rayLen * 0.9 * Math.sin(thetaT);
    const transEndY = cy + rayLen * 0.9 * Math.cos(thetaT);
    ctx.strokeStyle = `${AMBER} 0.22)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(transEndX, transEndY);
    ctx.stroke();

    // Camera on the right-hand side. Polariser axis = polAngle (0° = vertical).
    const camX = reflEndX + 20;
    const camY = reflEndY - 12;
    drawCameraWithPolariser(ctx, camX, camY, polAngle);

    // Polariser filtering: the reflected glare is linearly polarised
    // "horizontally" (s-pol = E out of the plane of incidence). Its E
    // vector in the camera frame is at 90° from the vertical axis.
    // Malus: I_transmitted = I_glare · cos²(polAngle − 90°).
    // Note cos²(φ − 90°) = sin²(φ), so transmission is zero at φ = 0°.
    const glareIntensity = Rs * 0.5; // unpolarised split
    const passAngle = polAngle - 90;
    const survived = malusLaw(glareIntensity, passAngle);

    // Draw a "photograph" preview on the far right that dims as glare
    // is killed.
    drawPhotoPreview(ctx, width - 120, 14, 106, 74, survived / glareIntensity);

    // Labels.
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`n₁ = ${n1}  (air)`, 14, 18);
    ctx.fillText(`n₂ = ${n2}  (glass / water)`, 14, height - 12);

    const nearBrewster = Math.abs(polAngle) < 6;
    ctx.fillStyle = nearBrewster ? `${CYAN} 0.95)` : colors.fg2;
    ctx.font = nearBrewster ? "bold 12px monospace" : "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      nearBrewster
        ? "POLARISER VERTICAL — GLARE BLOCKED"
        : `polariser axis = ${polAngle.toFixed(0)}°  ·  I_glare = ${(
            (survived / glareIntensity) *
            100
          ).toFixed(1)}%`,
      width / 2,
      height - 14,
    );

    // Annotate the angle.
    ctx.fillStyle = colors.fg1;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`θ_B = ${thetaBdeg.toFixed(1)}°`, cx + 16, cy - 8);
    ctx.fillText(
      `R_s = ${Rs.toFixed(3)}   R_p ≈ 0`,
      cx + 16,
      cy - 22,
    );

    // Legend top-right.
    ctx.textAlign = "right";
    ctx.font = "10px monospace";
    ctx.fillStyle = `${MAGENTA} 0.9)`;
    ctx.fillText("• s-pol (⊥ plane)", width - 140, 18);
    ctx.fillStyle = `${PALE_BLUE} 0.9)`;
    ctx.fillText("∣ p-pol (in plane)", width - 140, 32);
  }, [size, polAngle, colors, thetaBdeg]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Polariser axis</label>
        <input
          type="range"
          min={-90}
          max={90}
          step={1}
          value={polAngle}
          onChange={(e) => setPolAngle(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,240)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {polAngle.toFixed(0)}°
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,220,240)] hover:text-[var(--color-fg-1)]"
          onClick={() => setPolAngle(0)}
        >
          vertical (block)
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => setPolAngle(90)}
        >
          horizontal (pass)
        </button>
      </div>
    </div>
  );
}

function drawMixedBeam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sDensity: number,
  pDensity: number,
  direction: "in" | "out",
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const avg = 0.5 * (sDensity + pDensity);
  const baseW = 1.1 + 4 * Math.sqrt(Math.max(avg * 2, 0));
  ctx.strokeStyle = `${AMBER} ${(0.45 + 0.5 * Math.sqrt(Math.max(avg * 2, 0))).toFixed(2)})`;
  ctx.lineWidth = Math.min(baseW, 6);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (direction === "in") {
    ctx.fillStyle = `${AMBER} 0.95)`;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * 10 - px * 4, y2 - uy * 10 - py * 4);
    ctx.lineTo(x2 - ux * 10 + px * 4, y2 - uy * 10 + py * 4);
    ctx.closePath();
    ctx.fill();
  }

  const nMarkers = 6;
  for (let i = 1; i < nMarkers; i++) {
    const t = i / nMarkers;
    const mx = x1 + dx * t;
    const my = y1 + dy * t;
    if (pDensity > 0.02) {
      const tickL = 3 + 5 * Math.sqrt(Math.min(pDensity * 2, 1));
      ctx.strokeStyle = `${PALE_BLUE} ${(0.45 + 0.5 * Math.sqrt(Math.min(pDensity * 2, 1))).toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx - px * tickL, my - py * tickL);
      ctx.lineTo(mx + px * tickL, my + py * tickL);
      ctx.stroke();
    }
    if (sDensity > 0.02) {
      const dotR = 1.7 + 2.3 * Math.sqrt(Math.min(sDensity * 2, 1));
      ctx.fillStyle = `${MAGENTA} ${(0.5 + 0.45 * Math.sqrt(Math.min(sDensity * 2, 1))).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(mx + px * 7, my + py * 7, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCameraWithPolariser(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  polAngleDeg: number,
) {
  // Camera body (boxy).
  ctx.strokeStyle = `rgba(200, 200, 220, 0.8)`;
  ctx.fillStyle = `rgba(30, 40, 60, 0.6)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.rect(cx, cy - 22, 56, 44);
  ctx.fill();
  ctx.stroke();
  // Lens cylinder pointing left (toward the hit point).
  ctx.beginPath();
  ctx.rect(cx - 22, cy - 12, 22, 24);
  ctx.fill();
  ctx.stroke();
  // Polariser disc on the front of the lens.
  const discX = cx - 22;
  const discY = cy;
  const R = 13;
  ctx.strokeStyle = `${LILAC} 0.9)`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(discX, discY, R, 0, Math.PI * 2);
  ctx.stroke();

  // Axis lines at polAngle (0 = vertical).
  const theta = (polAngleDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(discX, discY);
  ctx.rotate(theta);
  ctx.strokeStyle = `${LILAC} 0.95)`;
  ctx.lineWidth = 1.4;
  for (const off of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(off, -R * 0.85);
    ctx.lineTo(off, R * 0.85);
    ctx.stroke();
  }
  ctx.restore();

  // Label.
  ctx.fillStyle = `${LILAC} 0.9)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("polariser", discX, cy + 32);
}

function drawPhotoPreview(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glareFraction: number,
) {
  // Outer frame.
  ctx.strokeStyle = `rgba(200, 210, 230, 0.6)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Sky band (always the same).
  ctx.fillStyle = `rgba(80, 120, 170, 0.32)`;
  ctx.fillRect(x + 1, y + 1, w - 2, h * 0.5);

  // Water band — darkness encodes how much glare was blocked.
  // glareFraction = 1 → bright glare; 0 → clean dark water.
  const waterBase = `rgba(40, 60, 90,`;
  const glareOverlay = 0.35 + 0.6 * Math.max(0, Math.min(1, glareFraction));
  ctx.fillStyle = `${waterBase} ${glareOverlay.toFixed(2)})`;
  ctx.fillRect(x + 1, y + h * 0.5, w - 2, h * 0.5 - 1);

  // Horizon line.
  ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();

  // Sun / highlight (on the sky half).
  ctx.fillStyle = `rgba(255, 220, 140, 0.7)`;
  ctx.beginPath();
  ctx.arc(x + w * 0.75, y + h * 0.28, 7, 0, Math.PI * 2);
  ctx.fill();

  // Reflection of the sun on water — this is the glare. Fades with the
  // polariser.
  ctx.fillStyle = `rgba(255, 220, 140, ${(0.7 * glareFraction).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.75, y + h * 0.7, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Caption below.
  ctx.fillStyle = `rgba(200, 200, 220, 0.8)`;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    glareFraction < 0.05
      ? "glare killed"
      : `glare ${(glareFraction * 100).toFixed(0)}%`,
    x + w / 2,
    y + h + 10,
  );
}
