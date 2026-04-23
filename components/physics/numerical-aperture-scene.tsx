"use client";

import { useEffect, useRef, useState } from "react";
import {
  acceptanceConeDeg,
  numericalAperture,
} from "@/lib/physics/electromagnetism/waveguides";

/**
 * FIG.51b — Numerical-aperture scene.
 *
 * A head-on view of a fiber end-face. The acceptance cone in air is a shaded
 * wedge whose half-angle is arcsin(NA). Sliders drive n_core (typically
 * 1.45–1.55) and n_cladding (1.40–n_core − 1e-3); NA = √(n_core² − n_clad²)
 * and the cone half-angle are recomputed live.
 *
 * This scene is a geometric illustration — not a raytrace — because the
 * physics being visualised (NA as the sine of the widest capture-angle) is
 * itself geometric. The fiber is drawn from the side as a rectangle, the
 * cone fans out from the end face, and rays inside the cone are drawn entering
 * the core; rays outside bounce off and are labelled "rejected".
 */

const WIDTH = 720;
const HEIGHT = 320;

export function NumericalApertureScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nCore, setNCore] = useState(1.48);
  const [nClad, setNClad] = useState(1.46);

  // Keep the cladding strictly below the core so NA > 0.
  const nCladEffective = Math.min(nClad, nCore - 0.001);
  const na = numericalAperture(nCore, nCladEffective);
  const coneDeg = acceptanceConeDeg(na);

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
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background tint
    ctx.fillStyle = "rgba(8, 14, 22, 0.0)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Fiber geometry: a horizontal cylinder on the right half.
    const fiberX0 = WIDTH * 0.55;
    const fiberX1 = WIDTH - 20;
    const fiberCy = HEIGHT / 2;
    const coreHalfH = 32;
    const cladHalfH = 52;

    // Cladding
    ctx.fillStyle = "rgba(111, 184, 198, 0.10)";
    ctx.fillRect(fiberX0, fiberCy - cladHalfH, fiberX1 - fiberX0, 2 * cladHalfH);
    // Core
    const coreGrad = ctx.createLinearGradient(0, fiberCy - coreHalfH, 0, fiberCy + coreHalfH);
    coreGrad.addColorStop(0, "rgba(111, 184, 198, 0.22)");
    coreGrad.addColorStop(0.5, "rgba(111, 184, 198, 0.34)");
    coreGrad.addColorStop(1, "rgba(111, 184, 198, 0.22)");
    ctx.fillStyle = coreGrad;
    ctx.fillRect(fiberX0, fiberCy - coreHalfH, fiberX1 - fiberX0, 2 * coreHalfH);

    // Fiber edges
    ctx.strokeStyle = "rgba(111, 184, 198, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(fiberX0, fiberCy - cladHalfH, fiberX1 - fiberX0, 2 * cladHalfH);
    ctx.strokeRect(fiberX0, fiberCy - coreHalfH, fiberX1 - fiberX0, 2 * coreHalfH);

    // Acceptance cone — a wedge opening to the LEFT from the core's entrance.
    const tipX = fiberX0;
    const tipY = fiberCy;
    const coneLen = fiberX0 - 40; // how far back the cone is drawn
    const coneHalfAngle = (coneDeg * Math.PI) / 180;
    const baseX = tipX - coneLen;
    const baseHalfY = coneLen * Math.tan(coneHalfAngle);

    // Cone fill — amber translucent
    const coneGrad = ctx.createLinearGradient(baseX, 0, tipX, 0);
    coneGrad.addColorStop(0, "rgba(228, 194, 122, 0.05)");
    coneGrad.addColorStop(1, "rgba(228, 194, 122, 0.28)");
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX, tipY - baseHalfY);
    ctx.lineTo(baseX, tipY + baseHalfY);
    ctx.closePath();
    ctx.fill();

    // Cone edges
    ctx.strokeStyle = "rgba(228, 194, 122, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX, tipY - baseHalfY);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX, tipY + baseHalfY);
    ctx.stroke();

    // Axis
    ctx.strokeStyle = "rgba(180, 196, 216, 0.30)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(baseX - 20, tipY);
    ctx.lineTo(fiberX1, tipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // A ray inside the cone — guided
    const insideAngle = Math.max(0, coneHalfAngle - 0.05);
    const insideStartX = baseX + 20;
    const insideStartY = tipY - (tipX - insideStartX) * Math.tan(insideAngle) * 0.7;
    ctx.strokeStyle = "rgba(111, 184, 198, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(insideStartX, insideStartY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // Continue inside — decorative zig-zag along the core showing guided propagation
    ctx.strokeStyle = "rgba(111, 184, 198, 0.7)";
    ctx.beginPath();
    let zx = tipX;
    let zy = tipY;
    const zHalf = coreHalfH - 4;
    const stepX = 45;
    let up = true;
    ctx.moveTo(zx, zy);
    while (zx < fiberX1 - 4) {
      zx += stepX;
      zy = tipY + (up ? -zHalf : zHalf);
      ctx.lineTo(zx, zy);
      up = !up;
    }
    ctx.stroke();

    // A ray outside the cone — rejected
    const outsideAngle = coneHalfAngle + 0.18;
    const outsideStartX = baseX + 40;
    const outsideStartY = tipY + (tipX - outsideStartX) * Math.tan(outsideAngle);
    ctx.strokeStyle = "rgba(255, 106, 222, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(outsideStartX, outsideStartY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // Continue out of the wall
    ctx.strokeStyle = "rgba(255, 106, 222, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + 80, tipY + 80 * Math.tan(outsideAngle) * 0.4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = "rgba(230, 236, 244, 0.78)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`n_core = ${nCore.toFixed(3)}`, fiberX0 + 10, fiberCy + 4);
    ctx.fillText(
      `n_clad = ${nCladEffective.toFixed(3)}`,
      fiberX0 + 10,
      fiberCy - cladHalfH + 14,
    );

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(228, 194, 122, 0.95)";
    ctx.font = "13px ui-monospace, monospace";
    ctx.fillText(`NA = ${na.toFixed(3)}`, WIDTH - 12, 20);
    ctx.fillText(
      `θ_a = arcsin(NA) = ${coneDeg.toFixed(2)}°`,
      WIDTH - 12,
      38,
    );

    // Arc illustrating the half-angle
    ctx.strokeStyle = "rgba(228, 194, 122, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 44, Math.PI - coneHalfAngle, Math.PI + coneHalfAngle);
    ctx.stroke();
    ctx.fillStyle = "rgba(228, 194, 122, 0.8)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${coneDeg.toFixed(1)}°`, tipX - 48, tipY - 40);
  }, [nCore, nCladEffective, na, coneDeg]);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <div className="mx-auto" style={{ width: WIDTH, height: HEIGHT }}>
        <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT }} />
      </div>
      <div className="mt-3 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-[var(--color-fg-3)]">n_core</label>
          <input
            type="range"
            min={1.41}
            max={1.60}
            step={0.005}
            value={nCore}
            onChange={(e) => setNCore(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
            {nCore.toFixed(3)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-[var(--color-fg-3)]">n_cladding</label>
          <input
            type="range"
            min={1.40}
            max={1.59}
            step={0.005}
            value={nClad}
            onChange={(e) => setNClad(parseFloat(e.target.value))}
            className="flex-1 accent-[#E4C27A]"
          />
          <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
            {nCladEffective.toFixed(3)}
          </span>
        </div>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Widen the core-cladding index contrast and the cone fans open —
        NA = √(n_core² − n_clad²) rises, acceptance half-angle = arcsin(NA).
        Standard single-mode telecom fiber sits at NA ≈ 0.14; multimode
        plastics push to ≈ 0.50.
      </p>
    </div>
  );
}
