"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { newtonRingRadius } from "@/lib/physics/electromagnetism/interference";

/**
 * FIG.48b — Newton's rings.
 *
 * A plano-convex lens sits on a flat glass plate, forming a thin air wedge
 * of thickness t(r) = r² / (2R). Monochromatic light of wavelength λ
 * illuminates the stack from above; two reflections interfere — off the
 * bottom of the lens (glass → air, no phase flip) and off the flat (air →
 * glass, +π flip). Destructive interference therefore sits at
 * 2·t = m·λ  ⇒  r_m = √(m λ R), which is the helper we import from the
 * physics kernel.
 *
 * Controls: zoom (how many rings fit in view) and wavelength (colour +
 * fringe spacing).
 */

const WIDTH = 420;
const HEIGHT = 420;
const R_LENS_MM = 500; // radius of curvature, 0.5 m
const FRAME_MM_DEFAULT = 1.6; // full-frame width at default zoom

export function NewtonsRingsScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = useThemeColors();
  const [frameMm, setFrameMm] = useState(FRAME_MM_DEFAULT);
  const [lambdaNm, setLambdaNm] = useState(589);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== WIDTH * dpr || cv.height !== HEIGHT * dpr) {
      cv.width = WIDTH * dpr;
      cv.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const bg = colors.bg0 || "#1A1D24";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const lambdaMm = lambdaNm * 1e-6;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const pxPerMm = WIDTH / frameMm;

    // Wavelength-to-colour map (simple hot/cool visible proxy).
    const ringColor = wavelengthToRgb(lambdaNm);

    // Paint the rings as radial intensity:
    //   I(r) = (1 + cos(Δφ(r))) / 2, where Δφ = (2π/λ) · 2 · t + π,
    //   t = r²/(2R), so Δφ(0) = π → dark centre. At Δφ = 2πm + π we get dark.
    const step = 1;
    const image = ctx.createImageData(WIDTH, HEIGHT);
    const data = image.data;
    for (let y = 0; y < HEIGHT; y += step) {
      for (let x = 0; x < WIDTH; x += step) {
        const dx = x - cx;
        const dy = y - cy;
        const rPx = Math.hypot(dx, dy);
        const rMm = rPx / pxPerMm;
        const tMm = (rMm * rMm) / (2 * R_LENS_MM);
        const deltaPhi = ((2 * Math.PI) / lambdaMm) * 2 * tMm + Math.PI;
        const I = (1 + Math.cos(deltaPhi)) / 2;
        const idx = (y * WIDTH + x) * 4;
        data[idx + 0] = Math.round(ringColor.r * I);
        data[idx + 1] = Math.round(ringColor.g * I);
        data[idx + 2] = Math.round(ringColor.b * I);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // Lens edge — circle of apparent radius ~ half-frame, shown as a subtle
    // vignette so the viewer understands the physical extent.
    ctx.strokeStyle = "rgba(230, 236, 244, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(WIDTH, HEIGHT) * 0.47, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight the m-th dark ring in magenta: r_1 = √(λ·R).
    const r1Mm = newtonRingRadius(1, lambdaMm, R_LENS_MM);
    const r1Px = r1Mm * pxPerMm;
    if (r1Px < Math.min(WIDTH, HEIGHT) / 2 - 4) {
      ctx.strokeStyle = "rgba(255, 106, 222, 0.9)";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r1Px, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FF6ADE";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `r₁ = ${(r1Mm * 1000).toFixed(0)} μm`,
        cx + r1Px + 4,
        cy - 4,
      );
    }

    // Labels
    ctx.fillStyle = "rgba(230, 236, 244, 0.8)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`λ = ${lambdaNm} nm`, 10, 18);
    ctx.fillText(`R = ${(R_LENS_MM / 1000).toFixed(2)} m`, 10, 34);
    ctx.textAlign = "right";
    ctx.fillText(`frame = ${frameMm.toFixed(2)} mm`, WIDTH - 10, 18);
  }, [frameMm, lambdaNm, colors]);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT }}
        className="block mx-auto"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)] min-w-[70px]">
          Zoom
        </label>
        <input
          type="range"
          min={0.6}
          max={4.0}
          step={0.05}
          value={frameMm}
          onChange={(e) => setFrameMm(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {frameMm.toFixed(2)} mm
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)] min-w-[70px]">
          λ
        </label>
        <input
          type="range"
          min={420}
          max={680}
          step={1}
          value={lambdaNm}
          onChange={(e) => setLambdaNm(parseFloat(e.target.value))}
          className="flex-1 accent-[#E4C27A]"
        />
        <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {lambdaNm} nm
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        A plano-convex lens on flat glass under monochromatic light. The dark
        centre is the π-phase-flip contact point; each successive dark ring
        sits at r_m = √(m λ R). Magenta dashed circle marks m = 1.
      </p>
    </div>
  );
}

/**
 * Rough visible-wavelength → RGB mapping for display. Not CIE-accurate —
 * just enough to make 450 nm look violet and 650 nm look red.
 */
function wavelengthToRgb(nm: number): { r: number; g: number; b: number } {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380);
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = -(nm - 510) / (510 - 490);
  } else if (nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / (645 - 580);
  } else if (nm <= 780) {
    r = 1;
  }
  const gamma = 0.9;
  return {
    r: Math.round(255 * Math.pow(r, gamma)),
    g: Math.round(255 * Math.pow(g, gamma)),
    b: Math.round(255 * Math.pow(b, gamma)),
  };
}
