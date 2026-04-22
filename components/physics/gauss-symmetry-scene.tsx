"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Three side-by-side panels showing the three classic Gauss-law symmetry
 * pictures: a charged ball wrapped in a Gaussian sphere, a charged line
 * wrapped in a Gaussian cylinder, and a charged sheet straddled by a
 * Gaussian pillbox. Each panel labels the resulting field magnitude.
 *
 * The Gaussian surface in each panel pulses gently in scale so the eye
 * sees it as a chosen mathematical surface, not part of the physics.
 */

const CYAN = "#6FB8C6";
const MAGENTA = "#FF4FD8";

type PanelKind = "spherical" | "cylindrical" | "planar";

const PANELS: { kind: PanelKind; title: string; formula: string }[] = [
  { kind: "spherical", title: "SPHERICAL", formula: "E = q / (4π ε₀ r²)" },
  { kind: "cylindrical", title: "CYLINDRICAL", formula: "E = λ / (2π ε₀ s)" },
  { kind: "planar", title: "PLANAR", formula: "E = σ / (2 ε₀)" },
];

export function GaussSymmetryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 280 });

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.42, 240), 320) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      const panelW = width / 3;
      const pulse = 1 + 0.04 * Math.sin(t * 1.4);

      PANELS.forEach((panel, i) => {
        const x0 = i * panelW;
        const cx = x0 + panelW / 2;
        const cy = height / 2;

        // Panel divider
        if (i > 0) {
          ctx.strokeStyle = colors.fg3;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, height * 0.15);
          ctx.lineTo(x0, height * 0.85);
          ctx.stroke();
        }

        // Title
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(panel.title, cx, 18);

        // Formula at bottom
        ctx.fillStyle = CYAN;
        ctx.font = "12px monospace";
        ctx.fillText(panel.formula, cx, height - 12);

        // Draw geometry
        if (panel.kind === "spherical") {
          drawSpherical(ctx, cx, cy, panelW, height, pulse);
        } else if (panel.kind === "cylindrical") {
          drawCylindrical(ctx, cx, cy, panelW, height, pulse);
        } else {
          drawPlanar(ctx, cx, cy, panelW, height, pulse);
        }
      });
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawSpherical(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pw: number,
  ph: number,
  pulse: number,
) {
  const ballR = Math.min(pw, ph) * 0.09;
  const surfR = ballR * 2.6 * pulse;

  // Charged ball with glow
  ctx.shadowColor = "rgba(255, 79, 216, 0.7)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.arc(cx, cy, ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Radial field arrows
  const N = 12;
  ctx.strokeStyle = "rgba(111, 184, 198, 0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const x1 = cx + dx * (surfR + 4);
    const y1 = cy + dy * (surfR + 4);
    const x2 = cx + dx * (surfR + 22);
    const y2 = cy + dy * (surfR + 22);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawArrowhead(ctx, x2, y2, a, "rgba(111, 184, 198, 0.6)");
  }

  // Gaussian sphere
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, surfR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // r label
  ctx.fillStyle = CYAN;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("r", cx + surfR / 2, cy - 4);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + surfR, cy);
  ctx.strokeStyle = "rgba(111, 184, 198, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCylindrical(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pw: number,
  ph: number,
  pulse: number,
) {
  const lineHalfH = ph * 0.32;
  const surfHx = pw * 0.13 * pulse;
  const surfHy = lineHalfH * 0.92;

  // Charged line (vertical)
  ctx.shadowColor = "rgba(255, 79, 216, 0.7)";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - lineHalfH);
  ctx.lineTo(cx, cy + lineHalfH);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // λ label
  ctx.fillStyle = MAGENTA;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("λ", cx + 5, cy - lineHalfH + 12);

  // Radial field arrows perpendicular to the line
  ctx.strokeStyle = "rgba(111, 184, 198, 0.45)";
  ctx.lineWidth = 1;
  for (const sign of [-1, 1] as const) {
    for (let yOff = -lineHalfH * 0.6; yOff <= lineHalfH * 0.6; yOff += 22) {
      const x1 = cx + sign * (surfHx + 4);
      const y1 = cy + yOff;
      const x2 = cx + sign * (surfHx + 24);
      const y2 = cy + yOff;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawArrowhead(
        ctx,
        x2,
        y2,
        sign > 0 ? 0 : Math.PI,
        "rgba(111, 184, 198, 0.6)",
      );
    }
  }

  // Gaussian cylinder (rendered as a tall rectangle with elliptic top/bottom caps)
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  // Side rails
  ctx.beginPath();
  ctx.moveTo(cx - surfHx, cy - surfHy);
  ctx.lineTo(cx - surfHx, cy + surfHy);
  ctx.moveTo(cx + surfHx, cy - surfHy);
  ctx.lineTo(cx + surfHx, cy + surfHy);
  ctx.stroke();
  // End caps as ellipses (perspective hint)
  for (const sign of [-1, 1] as const) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + sign * surfHy, surfHx, surfHx * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // s label
  ctx.fillStyle = CYAN;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("s", cx + surfHx / 2 + 2, cy - 4);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + surfHx, cy);
  ctx.strokeStyle = "rgba(111, 184, 198, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPlanar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pw: number,
  ph: number,
  pulse: number,
) {
  const sheetHalfW = pw * 0.36;
  const pillHx = pw * 0.13;
  const pillHy = ph * 0.16 * pulse;

  // Charged sheet (horizontal line with hatching)
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "rgba(255, 79, 216, 0.6)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(cx - sheetHalfW, cy);
  ctx.lineTo(cx + sheetHalfW, cy);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Hatching to suggest a sheet
  ctx.strokeStyle = "rgba(255, 79, 216, 0.45)";
  ctx.lineWidth = 1;
  for (let x = -sheetHalfW; x <= sheetHalfW; x += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + x, cy);
    ctx.lineTo(cx + x + 5, cy + 6);
    ctx.stroke();
  }

  // σ label
  ctx.fillStyle = MAGENTA;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("σ", cx + sheetHalfW + 3, cy + 4);

  // Field arrows up and down
  ctx.strokeStyle = "rgba(111, 184, 198, 0.45)";
  ctx.lineWidth = 1;
  for (let xOff = -sheetHalfW * 0.7; xOff <= sheetHalfW * 0.7; xOff += 26) {
    // Up
    ctx.beginPath();
    ctx.moveTo(cx + xOff, cy - 6);
    ctx.lineTo(cx + xOff, cy - 30);
    ctx.stroke();
    drawArrowhead(ctx, cx + xOff, cy - 30, -Math.PI / 2, "rgba(111, 184, 198, 0.6)");
    // Down
    ctx.beginPath();
    ctx.moveTo(cx + xOff, cy + 6);
    ctx.lineTo(cx + xOff, cy + 30);
    ctx.stroke();
    drawArrowhead(ctx, cx + xOff, cy + 30, Math.PI / 2, "rgba(111, 184, 198, 0.6)");
  }

  // Gaussian pillbox (rectangle straddling the sheet)
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(cx - pillHx, cy - pillHy, pillHx * 2, pillHy * 2);
  ctx.setLineDash([]);
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  fill: string,
) {
  const head = 4;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - head * Math.cos(angle - Math.PI / 6),
    y - head * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x - head * Math.cos(angle + Math.PI / 6),
    y - head * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}
