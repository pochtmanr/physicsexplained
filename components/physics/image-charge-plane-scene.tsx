"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { electricFieldAtPoint } from "@/lib/physics/electric-field";
import { imageChargeForPlane } from "@/lib/physics/method-of-images";

const RATIO = 0.62;
const MAX_HEIGHT = 380;
const N_LINES = 14;
const STEP = 4; // px integration step for each field-line trace
const MAX_STEPS = 360;

type Mode = "real" | "image";

/**
 * A point + charge sitting at height d above a grounded conducting plane.
 *
 * "real-world" view: field lines from the + charge curve down and terminate
 *   normal to the conducting plane (the way a real conductor looks).
 * "image-world" view: the conductor is replaced with a phantom − charge at
 *   depth -d. Field lines pass through the plane straight to the phantom,
 *   exposing why the boundary condition is satisfied.
 */
export function ImageChargePlaneScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [d, setD] = useState(1.2); // metres above the plane (slider 0.4 → 2.4)
  const [mode, setMode] = useState<Mode>("real");
  const [size, setSize] = useState({ width: 640, height: 380 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
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

      // World units: charge sits at world (0, d). Plane is at world y = 0.
      // Show world y ∈ [-3, 3] mapped to canvas (top → bottom flipped).
      const planeY = height * 0.55; // canvas y where world y = 0
      const pxPerUnit = Math.min(
        width / 6, // horizontal world ∈ [-3, 3]
        Math.min(planeY, height - planeY) / 3,
      );
      const cx = width / 2;
      const realY = planeY - d * pxPerUnit; // canvas y for real charge
      const imageY = planeY + d * pxPerUnit; // canvas y for image charge

      // -----------------------
      // 1. The conducting plane
      // -----------------------
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, planeY);
      ctx.lineTo(width - 20, planeY);
      ctx.stroke();

      // Hatching below the plane (conductor body) — only in real-world view.
      if (mode === "real") {
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        const hatchSpacing = 9;
        for (let x = 20; x < width - 10; x += hatchSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, planeY);
          ctx.lineTo(x - 8, planeY + 8);
          ctx.stroke();
        }
      }

      // "GROUNDED" label
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("V = 0", 26, planeY + 22);

      // -----------------------
      // 2. Field lines
      // -----------------------
      // Sources for the math depend on mode. In both modes the field ABOVE the
      // plane is identical — that's the whole point of the trick. Below the
      // plane, in real mode, there's no field (so we don't draw lines there).
      const realCharge = { q: 1, x: 0, y: d };
      const image = imageChargeForPlane(1, d);
      const imageCharge = { q: image.q, x: image.x, y: image.y };
      const sources = [realCharge, imageCharge];

      ctx.strokeStyle = "rgba(111, 184, 198, 0.65)";
      ctx.lineWidth = 1;

      for (let i = 0; i < N_LINES; i++) {
        // Distribute starting angles evenly around the real charge.
        const angle = (i / N_LINES) * Math.PI * 2;
        traceLine(
          ctx,
          sources,
          { x: 0, y: d },
          { cx, cy: realY, pxPerUnit, planeY },
          angle,
          mode,
          width,
          height,
        );
      }

      // -----------------------
      // 3. The image charge (phantom) — only in image-world view
      // -----------------------
      if (mode === "image") {
        // Dotted outline disc with semi-transparent fill
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(111, 184, 198, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.fillStyle = "rgba(111, 184, 198, 0.18)";
        ctx.beginPath();
        ctx.arc(cx, imageY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(230, 237, 247, 0.85)";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("−", cx, imageY + 1);
        ctx.textBaseline = "alphabetic";

        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText("image −q", cx + 22, imageY + 4);
      }

      // -----------------------
      // 4. The real charge
      // -----------------------
      ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(cx, realY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#1A1D24";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", cx, realY + 1);
      ctx.textBaseline = "alphabetic";

      // Distance indicator (dashed vertical from charge to plane)
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 24, realY);
      ctx.lineTo(cx + 24, planeY);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`d = ${d.toFixed(2)} m`, cx + 30, (realY + planeY) / 2 + 4);

      // -----------------------
      // 5. HUD
      // -----------------------
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`d = ${d.toFixed(2)} m`, 14, 20);
      ctx.fillText(
        mode === "real" ? "real-world view" : "image-world view",
        14,
        38,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        mode === "real"
          ? "lines terminate ⊥ to the plane"
          : "lines pass through to the phantom −q",
        width - 14,
        20,
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
      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="w-12 text-[var(--color-fg-3)]">VIEW</span>
          <button
            type="button"
            onClick={() => setMode("real")}
            className={`rounded border px-3 py-1 transition-colors ${
              mode === "real"
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            real
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`rounded border px-3 py-1 transition-colors ${
              mode === "image"
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            image
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-12 text-[var(--color-fg-3)]">d</label>
          <input
            type="range"
            min={0.4}
            max={2.4}
            step={0.05}
            value={d}
            onChange={(e) => setD(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {d.toFixed(2)} m
          </span>
        </div>
      </div>
    </div>
  );
}

/** Trace one streamline of E from the real charge outward. */
function traceLine(
  ctx: CanvasRenderingContext2D,
  sources: { q: number; x: number; y: number }[],
  start: { x: number; y: number },
  view: { cx: number; cy: number; pxPerUnit: number; planeY: number },
  angle: number,
  mode: Mode,
  width: number,
  height: number,
) {
  // Start a touch outside the charge so we don't seed inside the singularity.
  const seedR = 0.08;
  let x = start.x + seedR * Math.cos(angle);
  let y = start.y + seedR * Math.sin(angle);

  const points: Array<[number, number]> = [worldToCanvas(x, y, view)];
  const stepUnits = STEP / view.pxPerUnit;

  for (let i = 0; i < MAX_STEPS; i++) {
    const E = electricFieldAtPoint(sources, { x, y });
    const mag = Math.hypot(E.x, E.y);
    if (mag === 0 || !isFinite(mag)) break;

    const dx = (E.x / mag) * stepUnits;
    const dy = (E.y / mag) * stepUnits;
    const nextX = x + dx;
    const nextY = y + dy;

    // Stop conditions
    if (mode === "real" && nextY <= 0) {
      // Clip exactly to the plane to land cleanly on the conductor
      const t = y / (y - nextY); // y > 0, nextY ≤ 0 → t ∈ (0, 1]
      const xHit = x + t * dx;
      points.push(worldToCanvas(xHit, 0, view));
      break;
    }
    if (mode === "image" && nextY < -3.5) break;
    if (Math.abs(nextX) > 4) break;

    // In image mode, when the line gets very close to the phantom −q, stop.
    if (
      mode === "image" &&
      Math.hypot(nextX - sources[1]!.x, nextY - sources[1]!.y) < seedR
    ) {
      points.push(worldToCanvas(sources[1]!.x, sources[1]!.y, view));
      break;
    }

    x = nextX;
    y = nextY;
    const p = worldToCanvas(x, y, view);
    if (p[0] < 0 || p[0] > width || p[1] < 0 || p[1] > height) break;
    points.push(p);
  }

  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]![0], points[i]![1]);
  }
  ctx.stroke();

  // Arrow head about 60% along the line
  const ai = Math.min(points.length - 1, Math.floor(points.length * 0.55));
  const aPrev = points[Math.max(0, ai - 1)]!;
  const aHere = points[ai]!;
  const dx = aHere[0] - aPrev[0];
  const dy = aHere[1] - aPrev[1];
  const dlen = Math.hypot(dx, dy);
  if (dlen > 0.001) {
    const ux = dx / dlen;
    const uy = dy / dlen;
    const aSize = 4.5;
    ctx.fillStyle = "#6FB8C6";
    ctx.beginPath();
    ctx.moveTo(aHere[0] + ux * aSize, aHere[1] + uy * aSize);
    ctx.lineTo(
      aHere[0] - ux * aSize - uy * aSize * 0.6,
      aHere[1] - uy * aSize + ux * aSize * 0.6,
    );
    ctx.lineTo(
      aHere[0] - ux * aSize + uy * aSize * 0.6,
      aHere[1] - uy * aSize - ux * aSize * 0.6,
    );
    ctx.closePath();
    ctx.fill();
  }
}

function worldToCanvas(
  wx: number,
  wy: number,
  view: { cx: number; planeY: number; pxPerUnit: number },
): [number, number] {
  return [view.cx + wx * view.pxPerUnit, view.planeY - wy * view.pxPerUnit];
}
