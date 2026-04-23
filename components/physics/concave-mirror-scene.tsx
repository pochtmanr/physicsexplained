"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { thinLensImage } from "@/lib/physics/electromagnetism/geometric-optics";

/**
 * FIG.47c — ConcaveMirrorScene.
 *
 * A concave spherical mirror of radius R. The geometric centre of curvature
 * sits at x = −R along the optical axis; the mirror reflects from a shallow
 * arc centred on the axis. For paraxial rays the focal point F lies
 * halfway: f = R / 2.
 *
 * The reader drags s_o (the object distance), and the scene draws:
 *
 *   1. Parallel ray (cyan)   — leaves the object head horizontally, reflects
 *                              through F.
 *   2. Chief ray (amber)     — passes through the centre of curvature C; by
 *                              symmetry strikes the mirror perpendicularly and
 *                              retraces itself.
 *   3. Focal ray (magenta)   — leaves the object head through F, reflects
 *                              parallel to the axis.
 *
 * Image geometry is algebraically identical to the thin-lens case with
 * f = R/2, so we reuse `thinLensImage` with that f. The image is real and
 * inverted for s_o > f, virtual and upright for s_o < f.
 */

const WIDTH_BASE = 720;
const HEIGHT_BASE = 380;
const RATIO = HEIGHT_BASE / WIDTH_BASE;
const MAX_HEIGHT = 400;
const R = 2.4; // radius of curvature in scene units
const F = R / 2;
const OBJECT_HEIGHT = 0.8;

export function ConcaveMirrorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: WIDTH_BASE, height: HEIGHT_BASE });
  const [sObj, setSObj] = useState(2 * F); // start at s_o = 2f — real, inverted, unit magnification

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

    const axisY = height / 2;
    // The mirror VERTEX sits at x = 0 in scene coords. Centre of curvature
    // at x = −R (behind the mirror from the object's perspective, but in
    // front of the mirror on the optical-axis negative-x side — object also
    // at negative x). Focal point at x = −F.
    //
    // Canvas layout: place the mirror vertex near the RIGHT edge of the
    // canvas so the negative-x axis has room for object + C + F. Reflections
    // head back to the LEFT where the image forms.
    const rightPad = 60;
    const leftPad = 20;
    const mirrorX_px = width - rightPad;
    // We want the leftmost thing (object at −sObj up to −6*F) to fit.
    const maxObjSpan = 5 * F + 0.2;
    const pxPerUnit = Math.min(
      (mirrorX_px - leftPad) / maxObjSpan,
      (height * 0.38) / (OBJECT_HEIGHT * 2.2),
    );
    const toPx = (x: number, y: number) => ({
      x: mirrorX_px + x * pxPerUnit,
      y: axisY - y * pxPerUnit,
    });

    // Optical axis.
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(leftPad, axisY);
    ctx.lineTo(width - 4, axisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw mirror as a circular arc segment. Sphere centre is at x = −R
    // (scene units) so canvas centre is at toPx(−R, 0). Radius in pixels is
    // R * pxPerUnit.
    const cPx = toPx(-R, 0);
    const rPx = R * pxPerUnit;
    // We want the reflective arc on the side closest to the object (i.e.
    // at x > cPx.x + rPx*... actually the reflective surface is on the side
    // facing negative-x-from-vertex, which is the x < mirror_vertex side of
    // the sphere. Paraxially it hugs the vertex. Draw arc spanning a modest
    // half-angle around the axis.
    const halfAngleRad = Math.PI / 6; // 30°
    ctx.strokeStyle = "rgba(200, 160, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Angle convention: 0° points toward +x from the sphere centre. The
    // vertex is at angle 0. The reflective arc spans ±halfAngleRad around
    // that axis.
    ctx.arc(cPx.x, cPx.y, rPx, -halfAngleRad, halfAngleRad);
    ctx.stroke();

    // C, F, vertex markers.
    const drawDot = (xScene: number, label: string, small = false) => {
      const p = toPx(xScene, 0);
      ctx.fillStyle = colors.fg3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, small ? 2 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, p.y + 16);
    };
    drawDot(0, "V");
    drawDot(-F, "F");
    drawDot(-R, "C");

    // Object at x = −sObj, base on axis, tip at height OBJECT_HEIGHT.
    const Ox = -sObj;
    const Oy = OBJECT_HEIGHT;
    const objBase = toPx(Ox, 0);
    const objTip = toPx(Ox, Oy);
    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objBase.x, objBase.y);
    ctx.lineTo(objTip.x, objTip.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(objTip.x - 5, objTip.y + 6);
    ctx.lineTo(objTip.x, objTip.y);
    ctx.lineTo(objTip.x + 5, objTip.y + 6);
    ctx.stroke();

    // Image geometry (same algebra as a thin lens with f = F).
    const { s_i, magnification, type } = thinLensImage(F, sObj);
    const isVirtual = type === "virtual";
    const imageIsDefined = Number.isFinite(s_i) && Number.isFinite(magnification);
    // For a concave mirror, real images form on the SAME side as the object
    // (in front of the mirror). So the image is at x = −s_i when s_i > 0,
    // and at x = −s_i (positive x, i.e. *behind* the mirror) when s_i < 0.
    const Ix = imageIsDefined ? -s_i : Number.NaN;
    const Iy = imageIsDefined ? magnification * OBJECT_HEIGHT : Number.NaN;

    const drawRay = (
      points: { x: number; y: number }[],
      color: string,
      dashed = false,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (dashed) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const first = toPx(points[0].x, points[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < points.length; i++) {
        const p = toPx(points[i].x, points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Mirror hit point for a ray travelling horizontally at height y: in the
    // paraxial approximation we take the mirror plane as x = 0.
    // 1. Parallel ray (cyan): from (Ox, Oy) horizontally to (0, Oy), then
    //    reflects through F = (−F, 0). Parameterise after-reflection and
    //    extend until it meets the image tip OR the canvas edge.
    {
      const hit = { x: 0, y: Oy };
      const dx = -F - 0;
      const dy = 0 - Oy;
      // Extend to a far point. If image is real and finite, extend just past
      // the image; otherwise a long leg to the left edge.
      const tExt = 6; // large
      const end = { x: hit.x + dx * tExt, y: hit.y + dy * tExt };
      drawRay([{ x: Ox, y: Oy }, hit, end], "#6FB8C6");
      if (isVirtual && imageIsDefined) {
        // Back-extend reflected ray behind the mirror (into +x) to virtual
        // image.
        drawRay([hit, { x: Ix, y: Iy }], "rgba(111, 184, 198, 0.55)", true);
      }
    }

    // 2. Chief ray (amber): from (Ox, Oy) through (−R, 0) = C. By symmetry
    //    this ray hits the mirror perpendicularly and retraces itself.
    {
      // Parameterise line (Ox, Oy) + t·((−R − Ox), (0 − Oy)). Find the point
      // on the mirror in the paraxial plane (x ≈ 0): t = (0 − Ox)/(−R − Ox).
      const denom = -R - Ox;
      if (Math.abs(denom) > 1e-9) {
        const tHit = (0 - Ox) / denom;
        const yHit = Oy + tHit * (0 - Oy);
        drawRay(
          [
            { x: Ox, y: Oy },
            { x: 0, y: yHit },
            // Retrace back through C and onward.
            { x: -R - (0 - -R), y: 0 - yHit }, // reflect back through C
          ],
          "#E4C27A",
        );
        if (isVirtual && imageIsDefined) {
          drawRay(
            [{ x: 0, y: yHit }, { x: Ix, y: Iy }],
            "rgba(228, 194, 122, 0.55)",
            true,
          );
        }
      }
    }

    // 3. Focal ray (magenta): from (Ox, Oy) through (−F, 0) to the mirror,
    //    then reflects parallel to the axis.
    {
      const denom = -F - Ox;
      if (Math.abs(denom) > 1e-9) {
        const tHit = (0 - Ox) / denom;
        const yHit = Oy + tHit * (0 - Oy);
        drawRay(
          [
            { x: Ox, y: Oy },
            { x: 0, y: yHit },
            { x: -6, y: yHit }, // parallel to axis, travelling left
          ],
          "#FF6ADE",
        );
        if (isVirtual && imageIsDefined) {
          drawRay(
            [{ x: 0, y: yHit }, { x: Ix, y: Iy }],
            "rgba(255, 106, 222, 0.55)",
            true,
          );
        }
      }
    }

    // Image arrow.
    if (imageIsDefined) {
      const base = toPx(Ix, 0);
      const tip = toPx(Ix, Iy);
      ctx.strokeStyle = isVirtual ? "rgba(228, 194, 122, 0.65)" : "#E4C27A";
      ctx.lineWidth = 2;
      if (isVirtual) ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const yDir = Iy >= 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(tip.x - 5, tip.y - yDir * 6);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(tip.x + 5, tip.y - yDir * 6);
      ctx.stroke();
    }

    // HUD.
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    const hudX = 10;
    let hudY = 16;
    const lines = [
      `R     = ${R.toFixed(2)}`,
      `f     = R/2 = ${F.toFixed(2)}`,
      `s_o   = ${sObj.toFixed(2)}`,
      `s_i   = ${Number.isFinite(s_i) ? s_i.toFixed(2) : "∞"}`,
      `m     = ${Number.isFinite(magnification) ? magnification.toFixed(2) : "−∞"}`,
      `image = ${isVirtual ? "virtual" : "real"}, ${magnification >= 0 ? "upright" : "inverted"}`,
    ];
    for (const line of lines) {
      ctx.fillText(line, hudX, hudY);
      hudY += 14;
    }
  }, [size, sObj, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">s_o / f</label>
        <input
          type="range"
          min={0.2}
          max={5}
          step={0.01}
          value={sObj / F}
          onChange={(e) => setSObj(parseFloat(e.target.value) * F)}
          className="flex-1 accent-[#E4C27A]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {(sObj / F).toFixed(2)}
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        C is the centre of curvature, F = R/2 the paraxial focal point. The
        chief ray through C reflects onto itself. Inside F (s_o &lt; f) the
        rays diverge after reflection and the dashed back-extensions meet
        behind the mirror — the virtual, upright, magnified image of a
        shaving mirror.
      </p>
    </div>
  );
}
