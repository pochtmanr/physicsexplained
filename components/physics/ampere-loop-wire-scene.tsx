"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { MU_0 } from "@/lib/physics/constants";

/**
 * A single straight wire pokes out of the page at the centre of the
 * frame, carrying current I (toward the reader, marked with a dot).
 * Around it the magnetic field circulates in concentric circles.
 *
 * The reader cycles through three Amperian loop shapes — circle, square,
 * irregular blob — all enclosing the wire. The HUD reports
 *   ∮ B · dℓ   (numerically integrated around the loop the user sees)
 *   μ₀ · I_enc (the right-hand side of Ampère's law)
 * They agree, to plotting precision, no matter the loop's shape. That
 * agreement *is* the law.
 *
 * Colour key:
 *   magenta `#FF6ADE` — the wire (current source)
 *   amber   `#FFD66B` — the right-hand-rule curl arrow / accent
 *   blue-cyan         — B-field arrows and the Amperian loop
 */

const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const FIELD_COLOR = "rgba(120, 220, 255, 0.65)";
const LOOP_COLOR = "rgba(120, 220, 255, 0.95)";
const I_DEMO = 5; // amperes — keeps the HUD readout a tidy number

type LoopShape = "circle" | "square" | "blob";
const SHAPES: { id: LoopShape; label: string }[] = [
  { id: "circle", label: "CIRCLE" },
  { id: "square", label: "SQUARE" },
  { id: "blob", label: "IRREGULAR" },
];

/**
 * Sample N points around a closed loop of the chosen shape, scaled so
 * the loop's average radius is roughly `s` pixels. Used both for
 * drawing the loop outline and for numerically integrating B · dℓ.
 */
function loopOutline(
  shape: LoopShape,
  cx: number,
  cy: number,
  s: number,
  n: number,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    let r: number;
    switch (shape) {
      case "circle":
        r = s;
        break;
      case "square": {
        const m = Math.max(Math.abs(cos), Math.abs(sin));
        r = s / m;
        break;
      }
      case "blob": {
        // A wobbly closed curve — three sinusoidal lobes superposed.
        r = s * (1 + 0.18 * Math.cos(3 * theta) + 0.07 * Math.sin(5 * theta));
        break;
      }
    }
    pts.push({ x: cx + r * cos, y: cy + r * sin });
  }
  return pts;
}

/**
 * Numerically evaluates ∮ B · dℓ around `pts` for an infinite wire of
 * current I at (cx, cy), assuming the loop encloses the wire once.
 * Returns the integral in (T · pixel) units — but since we also compute
 * μ₀·I in the same scaled units, the ratio HUD readout is dimensionless.
 *
 * We use the *unit* tangent direction at each segment dotted with the
 * tangential B-field magnitude. For the closed-form straight wire,
 * B(r) = μ₀·I/(2π·r) and B is everywhere tangent to a circle around
 * the wire — so B · dℓ at a point is (μ₀·I)/(2π·r) · cos(angle between
 * the segment direction and the local circumferential direction) · |dℓ|.
 *
 * Mathematically the result is exactly μ₀·I; numerically we recover it
 * to ~0.1% with N = 256 points. That is the visual proof.
 */
function lineIntegral(
  pts: { x: number; y: number }[],
  cx: number,
  cy: number,
  I: number,
  pixelsPerMeter: number,
): number {
  let sum = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % n]!;
    const mx = (p.x + q.x) * 0.5;
    const my = (p.y + q.y) * 0.5;
    // segment vector and length
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const dl = Math.hypot(dx, dy);
    if (dl === 0) continue;
    // distance from wire to segment midpoint, in metres
    const rxPx = mx - cx;
    const ryPx = my - cy;
    const rPx = Math.hypot(rxPx, ryPx);
    if (rPx === 0) continue;
    const rMeters = rPx / pixelsPerMeter;
    // tangential B direction at midpoint: perpendicular to (rx, ry),
    // chosen counter-clockwise (right-hand rule, current toward reader)
    const bxHat = -ryPx / rPx;
    const byHat = rxPx / rPx;
    const Bmag = (MU_0 * I) / (2 * Math.PI * rMeters);
    // convert dl from pixels to metres for the dot product
    const dlMeters = dl / pixelsPerMeter;
    const dxHat = dx / dl;
    const dyHat = dy / dl;
    const dot = bxHat * dxHat + byHat * dyHat;
    sum += Bmag * dot * dlMeters;
  }
  return sum;
}

export function AmpereLoopWireScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [shape, setShape] = useState<LoopShape>("circle");
  const [encloseWire, setEncloseWire] = useState(true);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.6, 320), 420) });
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

      const cx = width / 2;
      const cy = height / 2;
      // Pixel scale: 1 metre = 800 px (so a 0.05 m radius loop is 40 px).
      // The HUD reports the *ratio* of the two integrals so the absolute
      // scale doesn't matter — only that we use one consistent value.
      const pixelsPerMeter = 800;
      const baseRadius = Math.min(width, height) * 0.20;

      // Animate the loop centre: keep it on the wire if encloseWire,
      // slide it off-axis otherwise (so the HUD reads zero).
      const offset = encloseWire ? 0 : baseRadius * 2.4;
      const loopCx = cx + offset;
      const loopCy = cy;

      // --- B-field circulation (concentric circles around the wire) ---
      ctx.strokeStyle = "rgba(120, 220, 255, 0.20)";
      ctx.lineWidth = 1;
      for (let k = 1; k <= 5; k++) {
        const rr = (k / 5) * Math.min(width, height) * 0.42;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tangent arrowheads on a few of those circles to show direction
      ctx.fillStyle = FIELD_COLOR;
      const phase = t * 0.5;
      for (let k = 1; k <= 5; k++) {
        const rr = (k / 5) * Math.min(width, height) * 0.42;
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * Math.PI * 2 + phase * (1 / k);
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          // Tangent direction: counter-clockwise (right-hand rule, I out of page)
          const tx = -Math.sin(a);
          const ty = Math.cos(a);
          drawArrow(ctx, px, py, tx, ty, 7, FIELD_COLOR);
        }
      }

      // --- Amperian loop ---
      const N = 256;
      const loopPts = loopOutline(shape, loopCx, loopCy, baseRadius, N);

      ctx.beginPath();
      ctx.moveTo(loopPts[0]!.x, loopPts[0]!.y);
      for (let i = 1; i < N; i++) ctx.lineTo(loopPts[i]!.x, loopPts[i]!.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(120, 220, 255, 0.05)";
      ctx.fill();
      ctx.strokeStyle = LOOP_COLOR;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(120, 220, 255, 0.5)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Direction-of-travel arrow on the loop (counter-clockwise to match
      // the right-hand rule)
      const arrowIdx = Math.floor((t * 30) % N);
      const ap = loopPts[arrowIdx]!;
      const aq = loopPts[(arrowIdx + 1) % N]!;
      const dxL = aq.x - ap.x;
      const dyL = aq.y - ap.y;
      const dlL = Math.hypot(dxL, dyL) || 1;
      drawArrow(ctx, ap.x, ap.y, dxL / dlL, dyL / dlL, 12, AMBER);

      // --- Wire (a dot — current OUT of the page toward the reader) ---
      ctx.shadowColor = "rgba(255, 106, 222, 0.85)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = MAGENTA;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // ⊙ dot inside (the "out of page" symbol)
      ctx.fillStyle = "#0E0F18";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = MAGENTA;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("I (out of page)", cx + 14, cy - 12);

      // --- HUD ---
      const Iint = lineIntegral(loopPts, cx, cy, I_DEMO, pixelsPerMeter);
      const Ienc = encloseWire ? I_DEMO : 0;
      const rhs = MU_0 * Ienc;

      const pad = 12;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("LOOP", pad, pad + 12);
      ctx.fillStyle = colors.fg0;
      ctx.fillText(SHAPES.find((s) => s.id === shape)!.label, pad, pad + 28);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("∮ B · dℓ", pad, pad + 54);
      ctx.fillStyle = LOOP_COLOR;
      ctx.fillText(`= ${Iint.toExponential(3)} T·m`, pad, pad + 70);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("μ₀ · I_enc", pad, pad + 92);
      ctx.fillStyle = AMBER;
      ctx.fillText(`= ${rhs.toExponential(3)} T·m`, pad, pad + 108);

      // Right-hand-rule reminder
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("right-hand rule: thumb ⇧ I, fingers curl B", width - pad, pad + 12);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2">
        <div className="flex gap-1">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShape(s.id)}
              className={`rounded border px-2 py-1 font-mono text-xs ${
                shape === s.id
                  ? "border-[rgba(120,220,255,0.9)] bg-[rgba(120,220,255,0.12)] text-[var(--color-fg-0)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:border-[var(--color-fg-3)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 font-mono text-xs text-[var(--color-fg-2)]">
          <input
            type="checkbox"
            checked={encloseWire}
            onChange={(e) => setEncloseWire(e.target.checked)}
            className="accent-[#FFD66B]"
          />
          loop encloses the wire
        </label>
      </div>
    </div>
  );
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
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  // arrowhead
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
