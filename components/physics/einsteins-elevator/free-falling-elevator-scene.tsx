"use client";

import { useEffect, useRef } from "react";

/**
 * FreeFallingElevatorScene — FIG.26a
 *
 * The "happiest thought" made visible. Two side-by-side panels show the
 * SAME view from inside an elevator:
 *   • Left: an elevator falling under Earth's gravity g. The cab and the
 *     three test objects inside (apple, ball, beaker) all accelerate
 *     downward at the same g — so in the cab's frame everything floats.
 *   • Right: a stationary elevator in deep space (no gravitational field).
 *     Same scene from inside — everything floats.
 *
 * From inside the cab, the two scenes are indistinguishable. That is the
 * equivalence principle.
 *
 * Canvas 2D, dark bg.
 */

const BG = "#0A0C12";
const PANEL_BG = "rgba(255,255,255,0.025)";
const PANEL_BORDER = "rgba(255,255,255,0.12)";
const TEXT_DIM = "rgba(255,255,255,0.55)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const HUD = "rgba(255,255,255,0.7)";
const CYAN = "#67C4F0";
const AMBER = "#FFB36B";
const CAB_OUTLINE = "rgba(255,255,255,0.35)";

interface Body {
  /** baseline (centre) position inside the cab, in cab-frame coords */
  baseX: number;
  baseY: number;
  /** small drift offsets — bodies slowly tumble in the floating cab */
  driftPhase: number;
  driftAmpX: number;
  driftAmpY: number;
  size: number;
  color: string;
  shape: "apple" | "ball" | "beaker";
  label: string;
}

const BODIES: Body[] = [
  {
    baseX: 0,
    baseY: -8,
    driftPhase: 0,
    driftAmpX: 7,
    driftAmpY: 4,
    size: 12,
    color: "#E66B6B",
    shape: "apple",
    label: "apple",
  },
  {
    baseX: -28,
    baseY: 14,
    driftPhase: 1.7,
    driftAmpX: 5,
    driftAmpY: 6,
    size: 10,
    color: CYAN,
    shape: "ball",
    label: "ball",
  },
  {
    baseX: 30,
    baseY: 18,
    driftPhase: 3.1,
    driftAmpX: 4,
    driftAmpY: 5,
    size: 13,
    color: AMBER,
    shape: "beaker",
    label: "",
  },
];

export function FreeFallingElevatorScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { W, H };
    };

    const tick = (now: number) => {
      if (t0Ref.current === null) t0Ref.current = now;
      const t = (now - t0Ref.current) / 1000;
      const { W, H } = setupCanvas();
      draw(ctx, W, H, t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 420, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="Two side-by-side elevator cabs. Left: free-falling on Earth, with three objects floating inside. Right: stationary in deep space, with the same three objects floating. From inside the cab, the two scenes are indistinguishable."
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
) {
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;
  const panelW = (W - 48) / 2;
  const panelH = H - 100;
  const panelY = 40;

  // ---- LEFT PANEL: free-falling elevator on Earth ----
  drawPanelBg(ctx, 16, panelY, panelW, panelH);
  drawEarthScene(ctx, 16, panelY, panelW, panelH, t);

  // ---- RIGHT PANEL: stationary elevator in deep space ----
  drawPanelBg(ctx, midX + 8, panelY, panelW, panelH);
  drawDeepSpaceScene(ctx, midX + 8, panelY, panelW, panelH, t);

  // Title
  ctx.save();
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText(
    "From inside the cab, these two scenes are indistinguishable",
    midX,
    24,
  );
  ctx.restore();

  // Bottom HUD
  const hudY = H - 50;
  ctx.save();
  ctx.fillStyle = HUD;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("free-fall (Earth, g = 9.81 m/s²):  cab + bodies all accelerate at g  →  no contact force on floor", 24, hudY);
  ctx.fillText("deep space (g = 0):  cab + bodies inertial  →  no contact force on floor", 24, hudY + 18);
  ctx.fillStyle = AMBER;
  ctx.fillText("g_apparent = g_field − a_lab = 0", W - 24 - 220, hudY + 9);
  ctx.restore();
}

function drawPanelBg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PANEL_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawEarthScene(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  t: number,
) {
  // Cab in lab-frame falls (animated). We show the cab at a falling height.
  // Period of fall + reset.
  const period = 4.5; // seconds
  const tMod = t % period;
  // Fall fraction 0..1 for first 80% of cycle, then small pause.
  const fallFrac = Math.min(tMod / (period * 0.85), 1);
  // Lab y goes from ground-ceiling at top of panel to mid-bottom.
  const labCabTop = py + 16 + fallFrac * (ph * 0.45);

  // Earth surface indicator (ground line at bottom)
  const groundY = py + ph - 20;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(px + 8, groundY);
  ctx.lineTo(px + pw - 8, groundY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `10px ui-monospace, monospace`;
  ctx.textAlign = "right";
  ctx.fillText("Earth surface", px + pw - 12, groundY - 4);
  ctx.textAlign = "left";
  ctx.fillText("g ↓", px + 14, py + 26);
  ctx.restore();

  // Gravity arrow (down) just outside cab on the left side of the panel
  drawGravityArrow(ctx, px + 22, py + 38, py + 90, "rgba(255, 220, 120, 0.7)");

  // Cab
  const cabW = pw * 0.6;
  const cabH = ph * 0.42;
  const cabX = px + (pw - cabW) / 2;
  drawCab(ctx, cabX, labCabTop, cabW, cabH);

  // Inside cab, bodies float in cab frame (slow drift only)
  drawFloatingBodies(ctx, cabX + cabW / 2, labCabTop + cabH / 2, t);

  // Caption
  ctx.save();
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = `bold 12px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("free-falling elevator (Earth)", px + pw / 2, py + ph - 4);
  ctx.restore();
}

function drawDeepSpaceScene(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  t: number,
) {
  // Sparse stars
  drawStars(ctx, px, py, pw, ph);

  // Cab is stationary — sit it near vertical mid
  const cabW = pw * 0.6;
  const cabH = ph * 0.42;
  const cabX = px + (pw - cabW) / 2;
  const cabY = py + (ph - cabH) / 2 - 14;
  drawCab(ctx, cabX, cabY, cabW, cabH);

  // Bodies float (same drift)
  drawFloatingBodies(ctx, cabX + cabW / 2, cabY + cabH / 2, t);

  // No-gravity badge
  ctx.save();
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `10px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("no field — g = 0", px + 14, py + 26);
  ctx.restore();

  // Caption
  ctx.save();
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = `bold 12px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("stationary elevator (deep space)", px + pw / 2, py + ph - 4);
  ctx.restore();
}

function drawCab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  // Subtle floor / ceiling shading
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(180, 200, 230, 0.04)");
  g.addColorStop(1, "rgba(120, 140, 180, 0.07)");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  // Outline
  ctx.strokeStyle = CAB_OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Floor and ceiling slabs
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.restore();
}

function drawFloatingBodies(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
) {
  for (const b of BODIES) {
    const dx = Math.cos(t * 0.6 + b.driftPhase) * b.driftAmpX;
    const dy = Math.sin(t * 0.5 + b.driftPhase * 1.3) * b.driftAmpY;
    const x = cx + b.baseX + dx;
    const y = cy + b.baseY + dy;

    if (b.shape === "apple") drawApple(ctx, x, y, b.size, b.color);
    else if (b.shape === "ball") drawBall(ctx, x, y, b.size, b.color);
    else drawBeaker(ctx, x, y, b.size, b.color);
  }
}

function drawApple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.1, y - r * 0.9);
  ctx.lineTo(x + r * 0.4, y - r * 1.4);
  ctx.stroke();
  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBeaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  const w = r * 1.3;
  const h = r * 1.6;
  // Glass walls
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.stroke();
  // Liquid (a floating blob, since gravity is canceled)
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGravityArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  y1: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
  // arrowhead at bottom
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x - 4, y1 - 7);
  ctx.lineTo(x + 4, y1 - 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
) {
  // Deterministic star grid
  const stars: Array<[number, number, number]> = [
    [0.12, 0.18, 1.1],
    [0.34, 0.07, 0.7],
    [0.55, 0.22, 1.3],
    [0.74, 0.13, 0.9],
    [0.88, 0.30, 1.0],
    [0.10, 0.42, 0.8],
    [0.28, 0.55, 1.0],
    [0.46, 0.70, 0.6],
    [0.66, 0.62, 1.2],
    [0.83, 0.78, 0.8],
    [0.18, 0.88, 0.9],
    [0.40, 0.92, 1.1],
    [0.60, 0.92, 0.7],
    [0.92, 0.92, 1.0],
  ];
  ctx.save();
  for (const [u, v, r] of stars) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.arc(px + u * pw, py + v * ph, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
