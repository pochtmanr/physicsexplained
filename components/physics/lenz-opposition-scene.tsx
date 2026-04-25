"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 440;

/**
 * FIG.22a — Lenz's law visualised. A bar magnet drifts back and forth along
 * the axis of a conducting loop. The changing flux through the loop induces
 * a current; the induced current's direction is drawn with green-cyan
 * arrows. The loop behaves as a second, induced magnet whose north pole
 * faces whatever pole of the real magnet is approaching — so the system
 * *always pushes back* against the change. Reverse direction, the induced
 * pole flips to pull the magnet back. Nature's conservative streak.
 */
export function LenzOppositionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 400 });
  const [speed, setSpeed] = useState(1.0);
  const magnetXRef = useRef(-1.8);
  const magnetVRef = useRef(1);

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

      // Magnet oscillates along x in scene units (±1.8 m).
      const AMP = 1.8;
      magnetXRef.current += magnetVRef.current * speed * dt;
      if (magnetXRef.current > AMP) {
        magnetXRef.current = AMP;
        magnetVRef.current = -1;
      } else if (magnetXRef.current < -AMP) {
        magnetXRef.current = -AMP;
        magnetVRef.current = 1;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const PX = Math.min(width, height * 1.7) / 5; // scene-to-pixel

      // Loop (conducting ring, end-on view — shown as vertical ellipse).
      drawLoop(ctx, cx, cy, PX * 0.55, PX * 1.3, colors);

      // Bar magnet (N = magenta on the side facing +x; S = cyan on the
      // side facing −x). Drawn moving along x.
      const mx = cx + magnetXRef.current * PX;
      drawBarMagnet(ctx, mx, cy, PX * 0.8, PX * 0.38);

      // Motion arrow on the magnet.
      drawMotionArrow(ctx, mx, cy - PX * 0.7, magnetVRef.current * speed);

      // Determine induced current direction and induced pole facing the magnet.
      // Convention: magnet's N is on its +x side (magenta). As it approaches
      // the loop (magnet moving toward loop with N-side leading), flux
      // through the loop increases in the +x direction. By Lenz, the
      // induced current circulates to produce a B opposing this — i.e.
      // a north pole facing the incoming N (repulsive).
      //
      // We pick the "face" of the loop nearest the magnet and label its
      // induced pole. Sign of dΦ/dt ∝ −(magnet.v) · sign(distance) — when
      // magnet is to the left of loop (x < 0) and moving right (v > 0),
      // it's approaching → flux grows → induced current opposes.
      const magnetToLeft = magnetXRef.current < 0;
      const approaching = magnetToLeft
        ? magnetVRef.current > 0
        : magnetVRef.current < 0;

      // Loop's facing side (left face or right face, depending on magnet
      // position) shows the induced pole label.
      const loopFaceX = magnetToLeft ? cx - PX * 0.55 : cx + PX * 0.55;
      const loopFaceDir = magnetToLeft ? -1 : 1;

      // If approaching with N leading → induced face pole is N (repel).
      // If receding → induced face pole is S (attract).
      const inducedPoleIsN = approaching;
      drawInducedPoleLabel(
        ctx,
        loopFaceX - loopFaceDir * PX * 0.25,
        cy + PX * 0.95,
        inducedPoleIsN ? "N" : "S",
      );

      // Induced current arrows on the loop (green-cyan).
      // Direction (CW or CCW as seen from the magnet side): for
      // "induced N facing magnet," right-hand rule gives CCW from magnet's
      // view (curl fingers CCW, thumb points toward magnet).
      const inducedCCW_fromMagnetView = inducedPoleIsN;
      // From observer view (looking at the scene head-on in 2D), we render
      // arrows on the ellipse at top/bottom.
      drawInducedCurrent(
        ctx,
        cx,
        cy,
        PX * 0.55,
        PX * 1.3,
        inducedCCW_fromMagnetView,
        magnetToLeft,
      );

      // "Push back" indicator: force on magnet from the induced loop.
      // Always opposes the magnet's velocity.
      drawRepulsionVector(
        ctx,
        mx,
        cy,
        -Math.sign(magnetVRef.current),
        PX,
        approaching,
      );

      // Right-hand-rule badge.
      drawRHRBadge(ctx, width, height, colors);

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("Lenz's law — induced current opposes the change", 12, 18);
      ctx.fillStyle = `rgb(120, 255, 170)`;
      ctx.fillText("● induced current (green-cyan)", 12, 36);
      ctx.fillStyle = "#FF6ADE";
      ctx.fillText("● N pole", 12, 54);
      ctx.fillStyle = "#78DCFF";
      ctx.fillText("● S pole", 12, 72);

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        approaching ? "approaching → loop repels" : "receding → loop attracts",
        width - 12,
        18,
      );
      ctx.fillText(
        `magnet x = ${magnetXRef.current.toFixed(2)} m`,
        width - 12,
        36,
      );
      ctx.fillText(
        `v = ${(magnetVRef.current * speed).toFixed(2)} m/s`,
        width - 12,
        54,
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
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-1">
        <Slider
          label="speed"
          value={speed}
          min={0.2}
          max={2.5}
          step={0.05}
          onChange={setSpeed}
          unit="×"
          accent="#FFD66B"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        right-hand rule: curl fingers along the induced current; thumb points
        to the loop's induced-N pole
      </p>
    </div>
  );
}

function drawLoop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  colors: { fg2: string; fg3: string },
) {
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Soft inner shadow for depth
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.82, ry * 0.94, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBarMagnet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
) {
  const halfW = w / 2;
  const halfH = h / 2;
  // S half (left, cyan)
  ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
  ctx.fillRect(cx - halfW, cy - halfH, halfW, h);
  // N half (right, magenta)
  ctx.fillStyle = "rgba(255, 106, 222, 0.9)";
  ctx.fillRect(cx, cy - halfH, halfW, h);
  // Outline
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - halfW, cy - halfH, w, h);
  // Labels
  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", cx - halfW / 2, cy);
  ctx.fillText("N", cx + halfW / 2, cy);
  ctx.textBaseline = "alphabetic";
}

function drawMotionArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
) {
  const len = 28 * Math.sign(dir || 1);
  ctx.strokeStyle = "#FFD66B";
  ctx.fillStyle = "#FFD66B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();
  // Arrowhead
  const tipX = x + len;
  const back = len > 0 ? -6 : 6;
  ctx.beginPath();
  ctx.moveTo(tipX, y);
  ctx.lineTo(tipX + back, y - 4);
  ctx.lineTo(tipX + back, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("v", x, y - 8);
}

function drawInducedPoleLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pole: "N" | "S",
) {
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = pole === "N" ? "#FF6ADE" : "#78DCFF";
  ctx.fillText(`induced ${pole}`, x, y);
}

function drawInducedCurrent(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ccwFromMagnetView: boolean,
  magnetToLeft: boolean,
) {
  // Four tick-arrows around the ellipse at top, bottom, left, right.
  // In 2D we render the "visible" arrows on top and bottom only (left/right
  // are end-on, so tangent direction there is into/out of page and can't
  // be clearly drawn on an ellipse). The direction at top/bottom depends
  // on CCW-vs-CW as seen from the magnet side, which is +x or −x.
  ctx.strokeStyle = "rgba(120, 255, 170, 0.95)";
  ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(120, 255, 170, 0.4)";
  ctx.shadowBlur = 4;

  // When CCW from magnet (magnet side is +x when magnetToLeft=false),
  // top-of-loop tangent points in −x if magnet is to the right, +x if
  // magnet is to the left. Equivalently: top arrow points toward the
  // magnet side iff CCW-from-magnet-view matches magnet-to-left.
  const topGoesLeft = ccwFromMagnetView ? magnetToLeft : !magnetToLeft;
  const bottomGoesLeft = !topGoesLeft;

  drawTangentArrow(ctx, cx, cy - ry, topGoesLeft);
  drawTangentArrow(ctx, cx, cy + ry, bottomGoesLeft);

  ctx.shadowBlur = 0;
}

function drawTangentArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  goesLeft: boolean,
) {
  const len = 22 * (goesLeft ? -1 : 1);
  ctx.beginPath();
  ctx.moveTo(x - len * 0.5, y);
  ctx.lineTo(x + len * 0.5, y);
  ctx.stroke();
  const tipX = x + len * 0.5;
  const back = goesLeft ? 6 : -6;
  ctx.beginPath();
  ctx.moveTo(tipX, y);
  ctx.lineTo(tipX + back, y - 4);
  ctx.lineTo(tipX + back, y + 4);
  ctx.closePath();
  ctx.fill();
}

function drawRepulsionVector(
  ctx: CanvasRenderingContext2D,
  mx: number,
  cy: number,
  dir: number,
  PX: number,
  approaching: boolean,
) {
  // Arrow from the loop side face of the magnet pushing against v.
  const len = approaching ? PX * 0.55 : PX * 0.4;
  const col = approaching
    ? "rgba(255, 214, 107, 0.95)" // repel (amber)
    : "rgba(120, 255, 170, 0.85)"; // attract (green-cyan)
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 2.5;
  const startX = mx;
  const endX = mx + dir * len;
  const yOff = cy + PX * 0.5;
  ctx.beginPath();
  ctx.moveTo(startX, yOff);
  ctx.lineTo(endX, yOff);
  ctx.stroke();
  const back = dir > 0 ? -7 : 7;
  ctx.beginPath();
  ctx.moveTo(endX, yOff);
  ctx.lineTo(endX + back, yOff - 5);
  ctx.lineTo(endX + back, yOff + 5);
  ctx.closePath();
  ctx.fill();
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    approaching ? "F (push back)" : "F (pull back)",
    (startX + endX) / 2,
    yOff + 16,
  );
}

function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: { fg2: string; fg3: string },
) {
  const ox = 28;
  const oy = height - 28;
  const len = 18;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1.2;
  // x̂ right
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 4, oy - 3);
  ctx.lineTo(ox + len - 4, oy + 3);
  ctx.closePath();
  ctx.fill();
  // ŷ up
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - len);
  ctx.lineTo(ox - 3, oy - len + 4);
  ctx.lineTo(ox + 3, oy - len + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("x̂", ox + len + 3, oy + 4);
  ctx.fillText("ŷ", ox - 3, oy - len - 3);
  ctx.fillText("RHR", ox + 4, oy - len - 14);
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
      <span className="w-16 text-[var(--color-fg-1)]">{label}</span>
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
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
