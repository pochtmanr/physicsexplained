"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * Superconducting levitation — method of images echo.
 *
 * A small permanent bar magnet floats a few cm above a cooled
 * superconducting plate. The plate expels B, which is formally
 * equivalent to placing a *mirror* magnet underneath with reversed
 * polarity (so like poles face each other, giving pure repulsion).
 *
 *   • real magnet:  drawn solid (magenta = N, cyan = S)
 *   • image magnet: drawn dashed below the plate, reversed polarity
 *   • dipole field lines: a few curved arcs connecting the N of the
 *     real magnet through the S of the image and back — the only
 *     region where field is non-zero (above the plate, never inside)
 *   • gentle damped-sinusoid wobble to sell the "floating" quality
 *
 * Slider: hover height. The system is stable at any height the
 * flux-pinning / image-repulsion balance allows. The mirror-magnet
 * picture deliberately mirrors §01.07 method-of-images.
 */
export function LevitationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  const [height, setHeight] = useState<number>(48); // pixels above plate

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

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height: H } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== H * dpr) {
        canvas.width = width * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, H);

      const cx = width / 2;
      const plateY = H * 0.72;

      // Gentle damped wobble on top of the slider value
      const wobble = 4 * Math.sin(t * 2.2) * Math.exp(-(((t % 8) - 4) ** 2) / 6);
      const hover = height + wobble;

      const magnetY = plateY - hover;
      const imageY = plateY + hover; // mirror
      const magW = 64;
      const magH = 26;

      // ── Plate (YBCO puck style: grey rim + cold blue top face) ──
      const plateH = 22;
      ctx.fillStyle = "rgba(30, 90, 140, 0.65)";
      ctx.fillRect(cx - width * 0.38, plateY, width * 0.76, plateH);
      ctx.strokeStyle = "rgba(120, 220, 255, 0.8)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - width * 0.38, plateY, width * 0.76, plateH);
      // Cold mist wisps
      for (let i = 0; i < 6; i++) {
        const wx = cx - width * 0.38 + ((t * 30 + i * 90) % (width * 0.76));
        const wy = plateY + plateH + 6 + Math.sin(t * 1.5 + i) * 3;
        ctx.fillStyle = `rgba(180, 230, 255, ${0.08 + 0.05 * Math.sin(t + i)})`;
        ctx.beginPath();
        ctx.ellipse(wx, wy, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Field-line arcs (from real-magnet N down to image-magnet S) ──
      // Drawn BEFORE the magnets so the magnets overlay them.
      drawDipoleArcs(ctx, cx, magnetY, imageY);

      // ── Image (ghost) magnet under the plate ──
      drawBarMagnet(ctx, cx, imageY, magW, magH, { ghost: true, flipped: true });

      // ── Real magnet above the plate ──
      drawBarMagnet(ctx, cx, magnetY, magW, magH, { ghost: false, flipped: false });

      // Repulsion cue — small upward arrow between the magnets
      const arrowX = cx + magW / 2 + 18;
      const arrowY = (magnetY + plateY) / 2;
      ctx.strokeStyle = "rgba(120, 255, 170, 0.9)";
      ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 10);
      ctx.lineTo(arrowX, arrowY - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 14);
      ctx.lineTo(arrowX - 4, arrowY - 9);
      ctx.lineTo(arrowX + 4, arrowY - 9);
      ctx.closePath();
      ctx.fill();
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
      ctx.fillText("F_lift", arrowX + 6, arrowY - 4);

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("Levitation · method of images", 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`hover height h = ${hover.toFixed(1)} px`, 12, 36);
      ctx.fillText("image = mirror magnet, poles reversed", 12, 52);

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("solid: real magnet", width - 12, 18);
      ctx.fillStyle = "rgba(180, 200, 220, 0.75)";
      ctx.fillText("dashed: image (inside SC)", width - 12, 36);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("flux expelled → pure repulsion", width - 12, 52);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2">
        <Slider
          label="h"
          value={height}
          min={24}
          max={96}
          step={1}
          onChange={setHeight}
          unit="px"
          accent="#78FFAA"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        same trick as §01.07 method-of-images: the expelled-flux boundary is replaced by a ghost magnet underneath, whose reversed polarity pushes the real one up.
      </p>
    </div>
  );
}

function drawBarMagnet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  opts: { ghost: boolean; flipped: boolean },
) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const half = w / 2;
  // N on top (magenta) if not flipped; otherwise N below
  const northColor = "rgba(255, 106, 222, 0.95)";
  const southColor = "rgba(111, 184, 198, 0.95)";
  const nCol = opts.flipped ? southColor : northColor;
  const sCol = opts.flipped ? northColor : southColor;
  ctx.save();
  if (opts.ghost) {
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([4, 4]);
  }
  // Two halves, side by side (long axis horizontal, N on left, S on right)
  ctx.fillStyle = nCol;
  ctx.fillRect(x, y, half, h);
  ctx.fillStyle = sCol;
  ctx.fillRect(x + half, y, half, h);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = opts.ghost ? "rgba(200, 220, 240, 0.6)" : "rgba(20, 26, 36, 0.9)";
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = opts.ghost ? "rgba(20, 26, 36, 0.9)" : "#0B1017";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", x + half / 2, cy);
  ctx.fillText("S", x + half + half / 2, cy);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

function drawDipoleArcs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  yA: number,
  yB: number,
) {
  // Field lines from the real magnet's right (S) sweeping out and connecting
  // to the image magnet's left (N). Five symmetric arcs either side, drawn
  // as green-cyan induction cues (rgba(120,255,170,…)) since they are the
  // induced-repulsion proxy here.
  const arcs = 5;
  for (let i = 1; i <= arcs; i++) {
    const spread = 40 + i * 18;
    const midY = (yA + yB) / 2;
    // Right side arc
    ctx.beginPath();
    ctx.strokeStyle = `rgba(120, 255, 170, ${0.55 - i * 0.07})`;
    ctx.lineWidth = 1.2;
    ctx.moveTo(cx + 22, yA);
    ctx.bezierCurveTo(
      cx + 22 + spread, yA,
      cx + 22 + spread, yB,
      cx + 22, yB,
    );
    ctx.stroke();
    // Left side arc
    ctx.beginPath();
    ctx.strokeStyle = `rgba(120, 255, 170, ${0.55 - i * 0.07})`;
    ctx.moveTo(cx - 22, yA);
    ctx.bezierCurveTo(
      cx - 22 - spread, yA,
      cx - 22 - spread, yB,
      cx - 22, yB,
    );
    ctx.stroke();
    void midY;
  }
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
      <span className="w-6 text-[var(--color-fg-1)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: accent }}
      />
      <span className="w-20 text-right text-[var(--color-fg-1)]">
        {value.toFixed(0)} {unit}
      </span>
    </label>
  );
}
