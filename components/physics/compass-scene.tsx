"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.5;
const MAX_HEIGHT = 360;

// "Earth's" reference field. Pretend Earth's magnetic field points along +x
// (geographic north on the screen), with magnitude B_earth. The current-
// carrying wire produces a field around itself of magnitude B_wire that we
// scale by the slider.
const B_EARTH = 1; // arbitrary units; only the ratio with B_wire matters
const ROT_SPEED = 6; // rad/s — how fast the needle catches up to its target

/**
 * Reproduces Ørsted's 1820 experiment. A compass needle sits over a
 * straight wire that runs north-south. With no current, the needle points
 * north along Earth's field. Toggle the current on and the wire's
 * circular magnetic field swings the needle east-west. The needle's
 * deflection angle is the equilibrium of the two competing torques.
 *
 * For this 2D top-down view we model the wire as running into the page
 * (perpendicular to the screen plane), so its field at the needle's
 * location is purely tangential — pointing east or west depending on
 * the sign of the current.
 */
export function CompassScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 320 });
  const [current, setCurrent] = useState(0); // -3..3, in arbitrary units
  const angleRef = useRef(0); // current needle angle, radians (0 = north)
  const lastTimeRef = useRef<number | null>(null);

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

      // Time step for smooth needle motion
      const now = performance.now() / 1000;
      const dt = lastTimeRef.current === null ? 0 : Math.min(now - lastTimeRef.current, 0.05);
      lastTimeRef.current = now;

      // Equilibrium angle: needle aligns along the vector sum (B_earth_x, B_wire_y)
      // B_earth points +x (north on screen). B_wire points +y (east) for I > 0,
      // -y (west) for I < 0. Magnitude of B_wire scales with current.
      const Bwire = current; // arbitrary units, ∝ I
      const targetAngle = Math.atan2(Bwire, B_EARTH);

      // Critically-damped catch-up
      const da = targetAngle - angleRef.current;
      angleRef.current += da * Math.min(1, ROT_SPEED * dt);

      ctx.clearRect(0, 0, width, height);

      drawCompassRose(ctx, width, height, colors);
      drawWire(ctx, width, height, current);
      drawFieldLines(ctx, width, height, current);
      drawNeedle(ctx, width, height, angleRef.current);

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `I = ${current.toFixed(2)} A   ·   wire field ${current === 0 ? "off" : current > 0 ? "→ east" : "→ west"}`,
        12,
        20,
      );
      const deflectionDeg = (angleRef.current * 180) / Math.PI;
      ctx.textAlign = "right";
      ctx.fillText(
        `deflection: ${deflectionDeg.toFixed(0)}° from north`,
        width - 12,
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
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-10 text-sm text-[var(--color-fg-3)]">I</label>
          <input
            type="range"
            min={-3}
            max={3}
            step={0.05}
            value={current}
            onChange={(e) => setCurrent(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {current.toFixed(2)} A
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrent(0)}
            className="rounded border border-[var(--color-fg-4)] px-3 py-1 text-xs font-mono text-[var(--color-fg-1)]"
          >
            current off
          </button>
          <button
            type="button"
            onClick={() => setCurrent(1.5)}
            className="rounded border border-[var(--color-fg-4)] px-3 py-1 text-xs font-mono text-[var(--color-fg-1)]"
          >
            switch on
          </button>
          <button
            type="button"
            onClick={() => setCurrent(-1.5)}
            className="rounded border border-[var(--color-fg-4)] px-3 py-1 text-xs font-mono text-[var(--color-fg-1)]"
          >
            reverse
          </button>
        </div>
      </div>
    </div>
  );
}

function drawCompassRose(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;

  // Outer ring
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // N/E/S/W labels — N is up-left in this scene. We use:
  //   north = +x in physics (to the right on screen, matching a standard
  //   plot). For visual clarity though, we put N at the top of the rose.
  // To keep the geometry sane, we render the rose with N up but the
  // physics still works: just relabel directions on the canvas.
  // The needle angle is "from N", measured clockwise as east-positive.
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("N", cx, cy - r - 6);
  ctx.fillText("S", cx, cy + r + 14);
  ctx.fillText("E", cx + r + 10, cy + 4);
  ctx.fillText("W", cx - r - 10, cy + 4);

  // Tick marks every 30°
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + Math.cos(a) * (r - 4);
    const y0 = cy + Math.sin(a) * (r - 4);
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    ctx.strokeStyle = colors.fg3;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

function drawWire(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  current: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  // Wire goes into the page at the centre — draw it as a small disc with
  // either a "·" (current toward viewer) or "×" (current away from viewer)
  // depending on current direction.
  const r = 8;
  ctx.fillStyle = "#1A2332";
  ctx.strokeStyle = colors2(current);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors2(current);
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (current === 0) {
    ctx.fillText("·", cx, cy);
  } else if (current > 0) {
    // Out of page (toward viewer)
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Into page
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.moveTo(cx - 4, cy + 4);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.stroke();
  }
  ctx.textBaseline = "alphabetic";
}

function colors2(current: number): string {
  if (current === 0) return "#56687F";
  return current > 0 ? "#FFD66B" : "#6FB8C6";
}

function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  current: number,
) {
  if (current === 0) return;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.42;

  // Concentric circles around the wire — each carrying a tangent arrow
  // showing the curl direction (right-hand rule).
  const radii = [40, 70, 105, 140];
  ctx.strokeStyle = "rgba(120, 220, 255, 0.35)";
  ctx.lineWidth = 1;
  for (const r of radii) {
    if (r > maxR) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // Tangent arrows at four cardinal points, sense determined by current sign.
    // For current OUT of page (positive), B circulates counter-clockwise (right-hand rule).
    const sense = current > 0 ? 1 : -1;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      // Tangent direction
      const tx = -Math.sin(a) * sense;
      const ty = Math.cos(a) * sense;
      drawSmallArrow(ctx, px, py, tx, ty, 8, "rgba(120, 220, 255, 0.7)");
    }
  }
}

function drawSmallArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const x1 = cx + tx * len;
  const y1 = cy + ty * len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - tx * 4 - ty * 2, y1 - ty * 4 + tx * 2);
  ctx.lineTo(x1 - tx * 4 + ty * 2, y1 - ty * 4 - tx * 2);
  ctx.closePath();
  ctx.fill();
}

function drawNeedle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angle: number,
) {
  // angle = 0 means needle points north (up). Positive angle = east deflection
  // (clockwise in screen coords).
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.min(w, h) * 0.28;

  // Convert to canvas: north is up (-y), east is right (+x).
  const nx = Math.sin(angle);
  const ny = -Math.cos(angle);

  // North half (magenta) and south half (cyan)
  const tipNx = cx + nx * len;
  const tipNy = cy + ny * len;
  const tipSx = cx - nx * len;
  const tipSy = cy - ny * len;

  ctx.lineCap = "round";

  // South (cyan)
  ctx.strokeStyle = "#6FB8C6";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tipSx, tipSy);
  ctx.stroke();

  // North (magenta) — pointing end is the magnetic north of the needle
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tipNx, tipNy);
  ctx.stroke();

  // Arrowhead on the north tip
  ctx.fillStyle = "#FF6ADE";
  const ah = 10;
  ctx.beginPath();
  ctx.moveTo(tipNx, tipNy);
  ctx.lineTo(
    tipNx - nx * ah - ny * ah * 0.5,
    tipNy - ny * ah + nx * ah * 0.5,
  );
  ctx.lineTo(
    tipNx - nx * ah + ny * ah * 0.5,
    tipNy - ny * ah - nx * ah * 0.5,
  );
  ctx.closePath();
  ctx.fill();

  // Centre pivot
  ctx.fillStyle = "#1A2332";
  ctx.strokeStyle = "#56687F";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.lineCap = "butt";
}
