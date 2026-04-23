"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { thinLensImage } from "@/lib/physics/electromagnetism/geometric-optics";

/**
 * FIG.47b — ThinLensRayDiagramScene.
 *
 * A thin converging lens of focal length f sits on the optical axis. An
 * upright arrow-shaped object of fixed height sits a distance s_o to the
 * left; the reader drags s_o from 0 up to ~6f. Three principal rays are
 * drawn in real time:
 *
 *   1. Parallel ray (cyan)   — leaves the object head horizontally, goes
 *                              through the far-side focal point F'.
 *   2. Chief ray (amber)     — passes undeflected through the lens centre.
 *   3. Focal ray (magenta)   — leaves the object head aimed at the near-side
 *                              focal point F, emerges parallel to the axis.
 *
 * Where the three refracted rays meet is the tip of the image. For s_o > f
 * they meet on the far side of the lens (real image, inverted). For
 * s_o < f the rays *diverge* after the lens; the image tip is then the
 * intersection of their *back-extended* prolongations on the near side —
 * the virtual-image regime you experience as a magnifying glass.
 *
 * The `thinLensImage` helper computes s_i, magnification, real/virtual,
 * and orientation from (f, s_o); the scene reads those values off and
 * draws accordingly.
 */

const WIDTH_BASE = 720;
const HEIGHT_BASE = 360;
const RATIO = HEIGHT_BASE / WIDTH_BASE;
const MAX_HEIGHT = 380;
const F = 1.2; // focal length in scene units
const OBJECT_HEIGHT = 0.9; // object arrow length in scene units

export function ThinLensRayDiagramScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: WIDTH_BASE, height: HEIGHT_BASE });
  // object distance as fraction of the slider range in scene units
  const [sObj, setSObj] = useState(2.5 * F); // start outside 2f — real, inverted

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

    // World-to-pixel: put lens at x = width / 2. 1 scene unit = pxPerUnit px.
    const axisY = height / 2;
    const lensX = width * 0.5;
    const padLeft = 16;
    const padRight = 16;
    // Fit ~6F on the left, and enough room on the right for real images at
    // s_o = 1.2 f giving s_i = 6 f. Allow headroom.
    const maxLeft = 6 * F + 0.2;
    const maxRight = 6 * F + 0.2;
    const pxPerUnit = Math.min(
      (lensX - padLeft) / maxLeft,
      (width - lensX - padRight) / maxRight,
      (height * 0.42) / (OBJECT_HEIGHT * 2.2),
    );
    const toPx = (xScene: number, yScene: number) => ({
      x: lensX + xScene * pxPerUnit,
      y: axisY - yScene * pxPerUnit,
    });

    // Compute image via helper.
    const { s_i, magnification, type } = thinLensImage(F, sObj);

    // Draw optical axis.
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, axisY);
    ctx.lineTo(width - padRight, axisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Focal points.
    ctx.fillStyle = colors.fg3;
    ctx.beginPath();
    ctx.arc(lensX - F * pxPerUnit, axisY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lensX + F * pxPerUnit, axisY, 3, 0, Math.PI * 2);
    ctx.fill();
    // 2F markers (smaller).
    ctx.beginPath();
    ctx.arc(lensX - 2 * F * pxPerUnit, axisY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lensX + 2 * F * pxPerUnit, axisY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.fg2;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("F", lensX - F * pxPerUnit, axisY + 16);
    ctx.fillText("F'", lensX + F * pxPerUnit, axisY + 16);
    ctx.fillText("2F", lensX - 2 * F * pxPerUnit, axisY + 16);
    ctx.fillText("2F'", lensX + 2 * F * pxPerUnit, axisY + 16);

    // Draw the lens — a vertical ellipse on the axis, with suggestive tick
    // marks at the top and bottom as arrows (converging lens icon).
    const lensHeight = OBJECT_HEIGHT * 1.6 * pxPerUnit;
    ctx.strokeStyle = "rgba(200, 160, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lensX, axisY - lensHeight);
    ctx.lineTo(lensX, axisY + lensHeight);
    ctx.stroke();
    // Arrow tips on lens.
    ctx.beginPath();
    ctx.moveTo(lensX - 6, axisY - lensHeight + 6);
    ctx.lineTo(lensX, axisY - lensHeight);
    ctx.lineTo(lensX + 6, axisY - lensHeight + 6);
    ctx.moveTo(lensX - 6, axisY + lensHeight - 6);
    ctx.lineTo(lensX, axisY + lensHeight);
    ctx.lineTo(lensX + 6, axisY + lensHeight - 6);
    ctx.stroke();

    // Draw the object — an upright arrow at x = −s_o.
    const objBase = toPx(-sObj, 0);
    const objTip = toPx(-sObj, OBJECT_HEIGHT);
    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objBase.x, objBase.y);
    ctx.lineTo(objTip.x, objTip.y);
    ctx.stroke();
    // arrowhead at tip
    ctx.beginPath();
    ctx.moveTo(objTip.x - 5, objTip.y + 6);
    ctx.lineTo(objTip.x, objTip.y);
    ctx.lineTo(objTip.x + 5, objTip.y + 6);
    ctx.stroke();

    // ---------------------------------------------------------------------
    // The three principal rays, drawn from the object tip (−s_o, h_o).
    //
    // Let Ox = −s_o (scene units), Oy = OBJECT_HEIGHT. The lens sits at x=0.
    // ---------------------------------------------------------------------
    const Ox = -sObj;
    const Oy = OBJECT_HEIGHT;
    const hImage = magnification * OBJECT_HEIGHT;
    const Ix = Number.isFinite(s_i) ? s_i : Number.NaN;
    const Iy = Number.isFinite(hImage) ? hImage : Number.NaN;
    const imageIsDefined = Number.isFinite(Ix) && Number.isFinite(Iy);
    const isVirtual = type === "virtual";

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

    // 1. Parallel-in → through F' out. Cyan.
    //    Before lens: horizontal at height Oy from (Ox, Oy) to (0, Oy).
    //    After lens: passes through (F, 0). If image is real, it meets
    //    the image tip at (Ix, Iy). If virtual, extend out to far right;
    //    back-extend the dashed continuation to the virtual image.
    {
      const beforeEnd = { x: 0, y: Oy };
      // Direction after lens: from (0, Oy) to (F, 0).
      const dx = F - 0;
      const dy = 0 - Oy;
      // Extend until we hit an edge of the canvas.
      const tFar = 6; // scene units; well past the canvas
      const afterEnd = { x: dx * tFar, y: Oy + dy * tFar };
      drawRay(
        [
          { x: Ox, y: Oy },
          beforeEnd,
          afterEnd,
        ],
        "#6FB8C6",
      );
      if (isVirtual && imageIsDefined) {
        // Back-extend from (0, Oy) in the *opposite* direction to hit (Ix, Iy).
        drawRay(
          [
            { x: 0, y: Oy },
            { x: Ix, y: Iy },
          ],
          "rgba(111, 184, 198, 0.55)",
          true,
        );
      }
    }

    // 2. Chief ray through centre. Amber. Unbent.
    {
      // Line from (Ox, Oy) through (0, 0); extend to same far x.
      // Parameterise (Ox + t*(−Ox), Oy + t*(−Oy))
      const tFar = 6;
      const afterEnd = { x: 0 + tFar * -Ox, y: 0 + tFar * -Oy };
      drawRay(
        [
          { x: Ox, y: Oy },
          { x: 0, y: 0 },
          afterEnd,
        ],
        "#E4C27A",
      );
      if (isVirtual && imageIsDefined) {
        drawRay(
          [
            { x: 0, y: 0 },
            { x: Ix, y: Iy },
          ],
          "rgba(228, 194, 122, 0.55)",
          true,
        );
      }
    }

    // 3. Focal ray: from (Ox, Oy) aimed at (−F, 0) — that is, the near-side
    //    focal point. After the lens it emerges parallel to axis at
    //    the lens-crossing height. Magenta.
    {
      // Line from (Ox, Oy) through (−F, 0). Parameterise as:
      // P(t) = (Ox, Oy) + t·((−F − Ox), (0 − Oy))
      // Find t at x = 0: t = (0 − Ox)/(−F − Ox) = −Ox / (−F − Ox) = Ox/(F+Ox)
      const denom = -F - Ox;
      if (Math.abs(denom) > 1e-9) {
        const tLens = (0 - Ox) / denom;
        const yAtLens = Oy + tLens * (0 - Oy);
        drawRay(
          [
            { x: Ox, y: Oy },
            { x: 0, y: yAtLens },
            { x: 6, y: yAtLens }, // parallel to axis after the lens
          ],
          "#FF6ADE",
        );
        if (isVirtual && imageIsDefined) {
          drawRay(
            [
              { x: 0, y: yAtLens },
              { x: Ix, y: Iy },
            ],
            "rgba(255, 106, 222, 0.55)",
            true,
          );
        }
      }
    }

    // Draw the image arrow if it exists (finite).
    if (imageIsDefined) {
      const base = toPx(Ix, 0);
      const tip = toPx(Ix, Iy);
      ctx.strokeStyle = isVirtual
        ? "rgba(228, 194, 122, 0.65)"
        : "#E4C27A";
      ctx.lineWidth = 2;
      if (isVirtual) ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Arrowhead.
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
      `f     = ${F.toFixed(2)}`,
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
          min={0.15}
          max={6}
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
        Cyan: parallel-in → through-focus-out. Amber: through-centre, undeflected.
        Magenta: aimed-at-near-focus → parallel-out. Slide s_o past s_o = f and
        the image flips from real-and-inverted to virtual-and-upright — the
        magnifying-glass transition.
      </p>
    </div>
  );
}
