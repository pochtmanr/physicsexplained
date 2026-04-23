"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.34c — Sources, sinks, and the curl of B.
 *
 * Three tiles in one canvas:
 *   (1) a + charge with E-field lines streaming out of it (a "source")
 *   (2) a − charge with E-field lines streaming into it (a "sink")
 *   (3) a current-carrying loop: no E source, but B curls around the
 *       wire by the right-hand rule
 *
 * The first two tiles say: Gauss's law is about where E-field lines
 * begin and end — on charges. The third tile says: B has no such
 * sources; its field lines close on themselves around currents.
 * Together, tiles 1–2 illustrate the first Maxwell equation (∇·E = ρ/ε₀)
 * and tile 3 illustrates the fourth (∇×B with a conduction-current
 * source, Ampère's static piece).
 *
 * Colour key:
 *   magenta `#FF6ADE`           — positive charge
 *   cyan    `#7ADCFF`           — negative charge
 *   amber   `#FFD66B`           — current (I) direction
 *   rgba(120,220,255,…)         — B-field lines curling around the loop
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#7ADCFF";
const AMBER = "#FFD66B";
const B_FIELD = "rgba(120, 220, 255, 0.8)";

export function SourceSinkFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 340 });
  const tRef = useRef(0);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.48, 280), 380) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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
      tRef.current += dt;
      const t = tRef.current;

      ctx.clearRect(0, 0, width, height);

      const tileW = width / 3;
      drawSourceTile(ctx, 0, 0, tileW, height, t, colors);
      drawSinkTile(ctx, tileW, 0, tileW, height, t, colors);
      drawCurlTile(ctx, tileW * 2, 0, tileW, height, t, colors);

      // Dividers
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tileW, 20);
      ctx.lineTo(tileW, height - 20);
      ctx.moveTo(tileW * 2, 20);
      ctx.lineTo(tileW * 2, height - 20);
      ctx.stroke();
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-2">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawSourceTile(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  t: number,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText("SOURCE   \u2014   \u2207\u00B7E > 0", x0 + w / 2, y0 + 18);

  const cx = x0 + w / 2;
  const cy = y0 + h / 2;

  // Emanating field-line arrows (animated outward)
  const lineCount = 10;
  const speed = 30;
  for (let i = 0; i < lineCount; i++) {
    const a = (i / lineCount) * Math.PI * 2;
    const hx = Math.cos(a);
    const hy = Math.sin(a);
    for (let seg = 0; seg < 3; seg++) {
      const r = 14 + ((t * speed + seg * 40) % 110);
      const px = cx + hx * r;
      const py = cy + hy * r;
      if (px < x0 + 6 || px > x0 + w - 6) continue;
      if (py < y0 + 28 || py > y0 + h - 28) continue;
      drawArrow(ctx, px, py, hx, hy, 10, "rgba(255, 106, 222, 0.8)");
    }
  }

  // Positive charge
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0A0A0F";
  ctx.font = "bold 14px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("+", cx, cy + 1);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText("lines begin on + charges", cx, y0 + h - 12);
}

function drawSinkTile(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  t: number,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText("SINK   \u2014   \u2207\u00B7E < 0", x0 + w / 2, y0 + 18);

  const cx = x0 + w / 2;
  const cy = y0 + h / 2;

  // Infalling arrows
  const lineCount = 10;
  const speed = 30;
  for (let i = 0; i < lineCount; i++) {
    const a = (i / lineCount) * Math.PI * 2;
    const hx = Math.cos(a);
    const hy = Math.sin(a);
    for (let seg = 0; seg < 3; seg++) {
      const r = 120 - ((t * speed + seg * 40) % 110);
      if (r < 16) continue;
      const px = cx + hx * r;
      const py = cy + hy * r;
      if (px < x0 + 6 || px > x0 + w - 6) continue;
      if (py < y0 + 28 || py > y0 + h - 28) continue;
      drawArrow(ctx, px, py, -hx, -hy, 10, "rgba(122, 220, 255, 0.8)");
    }
  }

  // Negative charge
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0A0A0F";
  ctx.font = "bold 14px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2212", cx, cy + 1);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText("lines end on \u2212 charges", cx, y0 + h - 12);
}

function drawCurlTile(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  t: number,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText("NO SOURCE   \u2014   B curls around I", x0 + w / 2, y0 + 18);

  const cx = x0 + w / 2;
  const cy = y0 + h / 2;

  // Wire: a vertical line through the middle
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, y0 + 36);
  ctx.lineTo(cx, y0 + h - 30);
  ctx.stroke();

  // Current-direction arrow at the top
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.moveTo(cx, y0 + 30);
  ctx.lineTo(cx - 5, y0 + 40);
  ctx.lineTo(cx + 5, y0 + 40);
  ctx.closePath();
  ctx.fill();
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "left";
  ctx.fillText("I", cx + 10, y0 + 36);

  // B field lines curling around the wire (animated phase)
  const phase = t * 1.2;
  ctx.strokeStyle = B_FIELD;
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) {
    const rx = 20 + k * 16;
    const ry = 5 + k * 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Animated arrowhead on each ellipse to indicate curl direction (RHR: with
    // I up the page, B curls counter-clockwise when viewed from above, which
    // in our 2D projection means the arrowheads on the front of the ellipse
    // move rightward, on the back leftward).
    const ang = phase * (k % 2 === 0 ? 1 : -1);
    const hx = cx + Math.cos(ang) * rx;
    const hy = cy + Math.sin(ang) * ry;
    const tx = -Math.sin(ang);
    const ty = Math.cos(ang) * (ry / rx);
    const mag = Math.hypot(tx, ty);
    drawArrow(ctx, hx, hy, tx / mag, ty / mag, 10, B_FIELD);
  }

  // Footer label
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText("\u2207\u00B7B = 0   everywhere", cx, y0 + h - 12);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const tipX = x + tx * len * 0.5;
  const tipY = y + ty * len * 0.5;
  const tailX = x - tx * len * 0.5;
  const tailY = y - ty * len * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const ang = Math.atan2(ty, tx);
  const head = 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(ang - Math.PI / 6),
    tipY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(ang + Math.PI / 6),
    tipY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}
