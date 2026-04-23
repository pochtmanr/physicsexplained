"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  ampereMaxwellLineIntegral,
  capacitorCurrentContinuity,
} from "@/lib/physics/electromagnetism/displacement-current";
import { EPSILON_0 } from "@/lib/physics/constants";

const RATIO = 0.52;
const MAX_HEIGHT = 460;

const AMBER = "rgba(255, 214, 107,"; // conduction current
const LILAC = "rgba(200, 160, 255,"; // displacement current
const BFIELD = "rgba(120, 220, 255,";

// Fixed capacitor-geometry + drive rate. Units are SI but exaggerated for
// readability on canvas.
const PLATE_AREA = 0.02; // m²
const PLATE_GAP = 1e-3; // m
const DRIVE_I = 1.0; // A (conduction current in the wire)

/**
 * FIG.33 — THE MONEY SHOT.
 *
 * Two panels share a charging parallel-plate capacitor. Both panels show
 * the SAME Ampère loop wrapped around the wire upstream of the capacitor.
 * They differ only in the choice of surface bounded by that loop:
 *
 *   LEFT:  a flat disc threaded by the wire. Conduction current I crosses.
 *   RIGHT: the same loop, but the surface bulges out like a bag and passes
 *          between the capacitor plates. No conduction current crosses.
 *
 * The right-panel surface inflates/deflates over time so the reader can see
 * it morph from "nearly flat" to "fully through the gap." Both panels carry
 * a HUD with ∮B·dℓ, I_conduction and I_displacement.
 *
 * A toggle switches Maxwell's correction ON/OFF:
 *
 *   OFF: the right panel's displacement term is zeroed. The two ∮B·dℓ
 *        readouts disagree — left shows μ₀·I, right shows 0. Overlay:
 *        "PARADOX."
 *   ON:  the displacement term is restored. The right readout becomes
 *        μ₀·(0 + ε₀·∂Φ_E/∂t) which equals μ₀·I exactly. Overlay: "RESOLVED."
 *
 * The moment the paradox collapses is the entire point of §07.
 */
export function AmpereSurfaceMorphScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 820, height: 420 });
  const [maxwellOn, setMaxwellOn] = useState(true);

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

      // Morph phase: 0..1..0 ping-pong every 4 s.
      const morphPhase = 0.5 - 0.5 * Math.cos((t * Math.PI) / 2);

      // Physics readouts (identical in both panels; the PARADOX mode
      // simulates a naïve Ampère's law on the right panel by zeroing its
      // displacement term — see below).
      const { Iconduction, Idisplacement } = capacitorCurrentContinuity(
        PLATE_AREA,
        PLATE_GAP,
        DRIVE_I,
      );
      const dPhiEdt = Idisplacement / EPSILON_0;
      const lhsLeft = ampereMaxwellLineIntegral(Iconduction, 0);
      const lhsRightCorrected = ampereMaxwellLineIntegral(0, dPhiEdt);
      const lhsRightNaive = ampereMaxwellLineIntegral(0, 0);
      const lhsRight = maxwellOn ? lhsRightCorrected : lhsRightNaive;

      // Layout: two panels side by side.
      const panelW = (width - 12) / 2;
      drawPanel(ctx, {
        x: 0,
        y: 0,
        w: panelW,
        h: height,
        colors,
        side: "left",
        t,
        morphPhase,
        maxwellOn,
        Iconduction,
        Idisplacement,
        lhs: lhsLeft,
      });
      drawPanel(ctx, {
        x: panelW + 12,
        y: 0,
        w: panelW,
        h: height,
        colors,
        side: "right",
        t,
        morphPhase,
        maxwellOn,
        Iconduction,
        Idisplacement,
        lhs: lhsRight,
      });

      // Global resolution overlay (centred between the panels at the
      // bottom, large type).
      const bannerY = height - 28;
      ctx.textAlign = "center";
      ctx.font = "bold 14px monospace";
      if (maxwellOn) {
        ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
        ctx.fillText(
          `RESOLVED — both  ∮B·dℓ = μ₀·I = ${(lhsLeft * 1e6).toFixed(3)} μT·m`,
          width / 2,
          bannerY,
        );
      } else {
        ctx.fillStyle = "rgba(255, 180, 180, 0.92)";
        ctx.fillText(
          `PARADOX — left: μ₀·I = ${(lhsLeft * 1e6).toFixed(3)} μT·m   |   right: 0`,
          width / 2,
          bannerY,
        );
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">
          same loop · two surfaces · same answer only with Maxwell&rsquo;s term
        </span>
        <button
          type="button"
          onClick={() => setMaxwellOn((v) => !v)}
          className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[rgb(200,160,255)] hover:text-[rgb(200,160,255)]"
        >
          Maxwell&rsquo;s correction: {maxwellOn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}

interface PanelOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  colors: { fg1: string; fg2: string; fg3: string };
  side: "left" | "right";
  t: number;
  morphPhase: number;
  maxwellOn: boolean;
  Iconduction: number;
  Idisplacement: number;
  lhs: number;
}

function drawPanel(ctx: CanvasRenderingContext2D, opts: PanelOpts) {
  const { x, y, w, h, colors, side, t, morphPhase, maxwellOn, lhs } = opts;

  // Frame
  ctx.save();
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // Title
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    side === "left"
      ? "surface A · flat disc · threaded by wire"
      : "surface B · bag · through the plate gap",
    x + 10,
    y + 16,
  );

  // Geometry — shared center line y, wire on the left half, capacitor on
  // the right half of each panel.
  const cy = y + h / 2 - 10;
  const wireX0 = x + 24;
  const loopCx = x + w * 0.28;
  const plateCx = x + w * 0.68;
  const wireX1 = plateCx - 28;
  const plateGap = 10;
  const plateW = 54;

  // ─────── Wire with conduction current ───────
  // Left stub before the loop
  drawWire(ctx, wireX0, cy, loopCx - 8, cy, colors);
  // Wire through the loop (passes right through)
  drawWire(ctx, loopCx + 8, cy, wireX1, cy, colors);

  // Capacitor plates
  drawPlates(ctx, plateCx, cy, plateW, plateGap);

  // Wire on the far side of the cap (for visual completeness)
  drawWire(ctx, plateCx + 28, cy, x + w - 24, cy, colors);

  // Conduction current dots moving left→right on both wire segments
  drawCurrentDots(ctx, {
    xs: [
      { x0: wireX0, x1: loopCx - 8, y: cy },
      { x0: loopCx + 8, x1: wireX1, y: cy },
      { x0: plateCx + 28, x1: x + w - 24, y: cy },
    ],
    t,
    color: AMBER,
  });

  // ─────── Ampère loop (same on both panels) ───────
  // A ring perpendicular to the wire at loopCx. Drawn as an ellipse to hint
  // 3D. The wire pierces it at cy.
  const loopRy = Math.min(h * 0.26, 80);
  const loopRx = 14;
  ctx.strokeStyle = "rgba(230, 237, 247, 0.95)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(loopCx, cy, loopRx, loopRy, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Loop direction arrow (counter-clockwise from the right)
  drawLoopArrow(ctx, loopCx, cy, loopRx, loopRy);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Ampère loop", loopCx, cy - loopRy - 6);

  // ─────── Surface bounded by the loop ───────
  if (side === "left") {
    // A flat disc, shaded amber-tinted to show it is threaded by the wire.
    ctx.fillStyle = "rgba(255, 214, 107, 0.12)";
    ctx.strokeStyle = "rgba(255, 214, 107, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(loopCx, cy, loopRx, loopRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // "I_enc = I" tag
    ctx.fillStyle = `${AMBER} 0.95)`;
    ctx.font = "bold 11px monospace";
    ctx.fillText("I_enc = I_c", loopCx, cy + loopRy + 18);
  } else {
    // The bag — starts as a near-flat disc at morphPhase = 0 and inflates
    // toward the capacitor gap at morphPhase = 1. The surface passes around
    // the wire (never crossing it) and ends between the plates.
    drawBag(ctx, {
      startX: loopCx,
      startCy: cy,
      startRx: loopRx,
      startRy: loopRy,
      endX: plateCx,
      endCy: cy,
      endRy: plateGap / 2 - 1,
      phase: morphPhase,
      maxwellOn,
    });
    // "I_enc = 0" tag (the bag passes through the gap where no conduction
    // current flows)
    ctx.fillStyle = colors.fg1;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("I_enc (conduction) = 0", loopCx, cy + loopRy + 18);

    // If Maxwell is on, draw lilac flux arrows crossing the bag's end-cap
    // between the plates — the displacement current.
    if (maxwellOn) {
      drawDisplacementFlux(ctx, plateCx, cy, plateW, plateGap, t);
    }
  }

  // ─────── B-field arrows around the loop ───────
  drawBFieldArrows(ctx, loopCx, cy, loopRx, loopRy, t);

  // ─────── HUD (bottom-left of panel) ───────
  const hudY = y + h - 64;
  ctx.textAlign = "left";
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText(
    `∮B·dℓ = ${(lhs * 1e6).toFixed(3)} μT·m`,
    x + 12,
    hudY,
  );
  ctx.fillStyle = `${AMBER} 0.95)`;
  ctx.fillText(
    `I_conduction = ${opts.Iconduction.toFixed(3)} A`,
    x + 12,
    hudY + 14,
  );
  ctx.fillStyle =
    side === "right" && maxwellOn ? `${LILAC} 0.95)` : `${LILAC} 0.4)`;
  ctx.fillText(
    `I_displacement = ${(side === "right" && maxwellOn ? opts.Idisplacement : 0).toFixed(3)} A`,
    x + 12,
    hudY + 28,
  );

  ctx.restore();
}

function drawWire(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colors: { fg1: string },
) {
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawPlates(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  plateW: number,
  gap: number,
) {
  // Wire stubs to each plate
  ctx.strokeStyle = "rgba(230, 237, 247, 0.85)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy);
  ctx.lineTo(cx - plateW / 2, cy);
  ctx.moveTo(cx + plateW / 2, cy);
  ctx.lineTo(cx + 28, cy);
  ctx.stroke();

  // Plates: two vertical bars with gap
  const plateH = 48;
  ctx.fillStyle = "rgba(255, 106, 222, 0.7)";
  ctx.fillRect(cx - plateW / 2 - 2, cy - plateH / 2, 4, plateH);
  ctx.fillStyle = "rgba(111, 184, 198, 0.7)";
  ctx.fillRect(cx + plateW / 2 - 2, cy - plateH / 2, 4, plateH);

  // +/- labels
  ctx.fillStyle = "#FF6ADE";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("+", cx - plateW / 2 - 10, cy - plateH / 2 + 2);
  ctx.fillStyle = "#6FB8C6";
  ctx.fillText("−", cx + plateW / 2 + 10, cy - plateH / 2 + 2);
  void gap;
}

function drawCurrentDots(
  ctx: CanvasRenderingContext2D,
  opts: {
    xs: { x0: number; x1: number; y: number }[];
    t: number;
    color: string;
  },
) {
  const speed = 60; // px/s
  ctx.fillStyle = `${opts.color} 0.9)`;
  for (const seg of opts.xs) {
    const len = seg.x1 - seg.x0;
    if (len <= 0) continue;
    const nDots = Math.max(2, Math.floor(len / 24));
    const phase = (opts.t * speed) % (len / nDots);
    for (let i = 0; i < nDots; i++) {
      const px = seg.x0 + ((i * len) / nDots + phase) % len;
      ctx.beginPath();
      ctx.arc(px, seg.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLoopArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const ax = cx + rx;
  const ay = cy;
  ctx.strokeStyle = "rgba(230, 237, 247, 0.9)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 5, ay - 4);
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 5, ay + 4);
  ctx.stroke();
  void ry;
}

function drawBag(
  ctx: CanvasRenderingContext2D,
  opts: {
    startX: number;
    startCy: number;
    startRx: number;
    startRy: number;
    endX: number;
    endCy: number;
    endRy: number;
    phase: number;
    maxwellOn: boolean;
  },
) {
  const { startX, startCy, startRy, endX, endCy, endRy, phase, maxwellOn } =
    opts;
  // The bag extends from the loop at startX to an end-cap between the
  // plates at endX. The end-cap size and horizontal extent scale with
  // `phase`.
  const reach = startX + phase * (endX - startX);
  const midX = (startX + reach) / 2;
  const bagRy = startRy + phase * (endRy - startRy);

  // Upper profile
  ctx.strokeStyle = maxwellOn
    ? `${LILAC} ${(0.55 + 0.35 * phase).toFixed(3)})`
    : "rgba(255, 180, 180, 0.7)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(startX, startCy - startRy);
  ctx.bezierCurveTo(
    midX,
    startCy - startRy - 10,
    midX,
    endCy - bagRy - 4,
    reach,
    endCy - bagRy,
  );
  ctx.stroke();

  // Lower profile
  ctx.beginPath();
  ctx.moveTo(startX, startCy + startRy);
  ctx.bezierCurveTo(
    midX,
    startCy + startRy + 10,
    midX,
    endCy + bagRy + 4,
    reach,
    endCy + bagRy,
  );
  ctx.stroke();

  // End-cap at reach (vertical line / narrow ellipse)
  ctx.beginPath();
  ctx.ellipse(reach, endCy, 3, Math.max(2, bagRy), 0, 0, Math.PI * 2);
  ctx.stroke();

  // Fill the bag with a faint tint so the volume reads as a surface region
  ctx.fillStyle = maxwellOn
    ? `${LILAC} ${(0.08 + 0.08 * phase).toFixed(3)})`
    : "rgba(255, 180, 180, 0.07)";
  ctx.beginPath();
  ctx.moveTo(startX, startCy - startRy);
  ctx.bezierCurveTo(
    midX,
    startCy - startRy - 10,
    midX,
    endCy - bagRy - 4,
    reach,
    endCy - bagRy,
  );
  ctx.lineTo(reach, endCy + bagRy);
  ctx.bezierCurveTo(
    midX,
    endCy + bagRy + 4,
    midX,
    startCy + startRy + 10,
    startX,
    startCy + startRy,
  );
  ctx.closePath();
  ctx.fill();
}

function drawDisplacementFlux(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  plateW: number,
  plateGap: number,
  t: number,
) {
  // Lilac arrows crossing the gap to show the E-flux changing through the
  // bag's end-cap. The arrow length pulses at 0.8 Hz to hint ∂E/∂t.
  const nArrows = 5;
  const plateH = 40;
  const pulse = 0.6 + 0.4 * Math.sin(2 * Math.PI * t * 0.8);
  ctx.strokeStyle = `${LILAC} ${(0.55 + 0.35 * pulse).toFixed(3)})`;
  ctx.fillStyle = `${LILAC} ${(0.85 * pulse).toFixed(3)})`;
  ctx.lineWidth = 1.3;
  const step = plateH / (nArrows + 1);
  for (let i = 1; i <= nArrows; i++) {
    const yy = cy - plateH / 2 + i * step;
    const x0 = cx - plateW / 2 + 6;
    const x1 = cx + plateW / 2 - 6;
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.lineTo(x1, yy);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(x1, yy);
    ctx.lineTo(x1 - 5, yy - 3);
    ctx.lineTo(x1 - 5, yy + 3);
    ctx.closePath();
    ctx.fill();
  }
  // "ε₀·∂Φ_E/∂t" label
  ctx.fillStyle = `${LILAC} 0.95)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ε₀ · ∂Φ_E/∂t", cx, cy + plateH / 2 + 14);
  void plateGap;
}

function drawBFieldArrows(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  t: number,
) {
  // Draw four short tangent arrows on the loop to hint B is tangent. We
  // animate their phase slightly to reinforce the "line integral" vibe.
  const positions = [0, 0.25, 0.5, 0.75];
  const tPhase = (t * 0.3) % 1;
  ctx.strokeStyle = `${BFIELD} 0.85)`;
  ctx.fillStyle = `${BFIELD} 0.95)`;
  ctx.lineWidth = 1.3;
  for (const pBase of positions) {
    const p = (pBase + tPhase) % 1;
    const ang = p * Math.PI * 2;
    const px = cx + rx * Math.cos(ang);
    const py = cy + ry * Math.sin(ang);
    // Tangent direction (ccw)
    const tx = -rx * Math.sin(ang);
    const ty = ry * Math.cos(ang);
    const tlen = Math.hypot(tx, ty) || 1;
    const ux = tx / tlen;
    const uy = ty / tlen;
    const len = 10;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + ux * len, py + uy * len);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(px + ux * len, py + uy * len);
    ctx.lineTo(
      px + ux * (len - 4) - uy * 3,
      py + uy * (len - 4) + ux * 3,
    );
    ctx.lineTo(
      px + ux * (len - 4) + uy * 3,
      py + uy * (len - 4) - ux * 3,
    );
    ctx.closePath();
    ctx.fill();
  }
}
