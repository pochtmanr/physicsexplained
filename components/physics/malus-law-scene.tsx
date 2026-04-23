"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { malusLaw } from "@/lib/physics/electromagnetism/polarization-optics";

const RATIO = 0.58;
const MAX_HEIGHT = 520;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const MAGENTA = "rgba(255, 100, 200,";

/**
 * MALUS SCENE. A linearly polarised beam enters from the left (E-vector
 * fixed along the vertical axis). It passes through a rotating *analyser*
 * whose transmission axis is tilted by θ. The transmitted intensity is
 *
 *   I(θ) = I₀ · cos²θ
 *
 * The left panel draws the beam, the two polariser axes, and the
 * surviving component of E projected onto the analyser axis. The right
 * panel plots I(θ) across a full 180° sweep with the live θ marked.
 */
export function MalusLawScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 860, height: 500 });
  const [thetaDeg, setThetaDeg] = useState(30);

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

    const isStacked = width < 560;
    const leftW = isStacked ? width : width * 0.55;
    const leftH = isStacked ? height * 0.55 : height;
    const rightX = isStacked ? 0 : leftW;
    const rightY = isStacked ? leftH : 0;
    const rightW = isStacked ? width : width - leftW;
    const rightH = isStacked ? height * 0.45 : height;

    drawPolariserDiagram(ctx, colors, {
      x: 0,
      y: 0,
      w: leftW,
      h: leftH,
      thetaDeg,
    });

    drawCosSquaredPlot(ctx, colors, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      liveDeg: thetaDeg,
    });
  }, [size, thetaDeg, colors]);

  const transmitted = malusLaw(1, thetaDeg);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Analyser θ</label>
        <input
          type="range"
          min={-90}
          max={90}
          step={0.5}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(1)}°
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <span style={{ color: "rgb(255,180,80)" }}>
          I / I₀ = cos²θ = {transmitted.toFixed(3)}
        </span>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,220,240)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(0)}
        >
          aligned (0°)
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(200,160,255)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(45)}
        >
          half (45°)
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(90)}
        >
          crossed (90°)
        </button>
      </div>
    </div>
  );
}

function drawPolariserDiagram(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  o: { x: number; y: number; w: number; h: number; thetaDeg: number },
) {
  const { x, y, w, h, thetaDeg } = o;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const theta = (thetaDeg * Math.PI) / 180;

  // Baseline beam arrow running left → right.
  ctx.strokeStyle = `${AMBER} 0.65)`;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 20, cy);
  ctx.lineTo(x + w - 20, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Input polariser (draw as a vertical slab of lines on the left third).
  const pol1X = x + w * 0.28;
  drawPolariserPlate(ctx, pol1X, cy, 0, `${CYAN} 0.85)`, "P₁ fixed");

  // Analyser (rotating) on the right third.
  const pol2X = x + w * 0.72;
  drawPolariserPlate(ctx, pol2X, cy, theta, `${LILAC} 0.9)`, "P₂ θ");

  // Incoming beam (before P₁) — grey, "unpolarised". Draw as a thick
  // bundle of random-angle tick marks on the beam axis.
  drawBundle(ctx, x + 24, cy, pol1X - 24, 18, "random");

  // After P₁: vertical linear polarisation (E along y-axis). Magenta.
  drawBundle(ctx, pol1X + 6, cy, pol2X - pol1X - 12, 16, "vertical");

  // After P₂: polarised along the analyser axis, with intensity cos²θ.
  // Render bundle with reduced extent proportional to √(I/I₀) = |cosθ|.
  const survival = Math.abs(Math.cos(theta));
  drawBundle(ctx, pol2X + 6, cy, x + w - (pol2X + 6) - 20, 16 * survival, "tilted", theta);

  // Labels.
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("unpolarised →", (x + pol1X) / 2, y + 14);
  ctx.fillText("linear ↕", (pol1X + pol2X) / 2, y + 14);
  ctx.fillText(
    `I = I₀·cos²θ  (${(survival * survival).toFixed(2)})`,
    (pol2X + x + w) / 2,
    y + 14,
  );

  // Projection diagram: draw the E-vector of the input (vertical), then
  // project it onto the analyser axis — show the surviving component.
  const pvX = x + w - 90;
  const pvY = y + h - 90;
  drawProjection(ctx, pvX, pvY, 48, theta);

  // Summary in the bottom-left.
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "left";
  ctx.font = "10px monospace";
  ctx.fillText("Malus's law (1809):", x + 14, y + h - 30);
  ctx.fillStyle = colors.fg1;
  ctx.fillText("I(θ) = I₀ · cos²θ", x + 14, y + h - 14);
}

function drawPolariserPlate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  thetaRad: number,
  color: string,
  label: string,
) {
  const plateR = 26;
  ctx.save();
  ctx.translate(cx, cy);

  // Outer circle (the polariser disc).
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, plateR, 0, Math.PI * 2);
  ctx.stroke();

  // Transmission-axis lines, tilted by θ relative to the *vertical*.
  // "theta = 0" means axis is vertical.
  ctx.rotate(thetaRad);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  for (const off of [-12, -4, 4, 12]) {
    ctx.beginPath();
    ctx.moveTo(off, -plateR * 0.85);
    ctx.lineTo(off, plateR * 0.85);
    ctx.stroke();
  }
  ctx.restore();

  // Label below.
  ctx.fillStyle = color;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + plateR + 14);
}

function drawBundle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  yc: number,
  len: number,
  amp: number,
  kind: "random" | "vertical" | "tilted",
  thetaRad = 0,
) {
  if (len <= 0 || amp <= 0.4) return;
  const step = 12;
  ctx.strokeStyle =
    kind === "random"
      ? `${AMBER} 0.45)`
      : kind === "vertical"
        ? `${MAGENTA} 0.85)`
        : `${LILAC} 0.9)`;
  ctx.lineWidth = 1.3;
  const n = Math.floor(len / step);
  for (let i = 1; i <= n; i++) {
    const x = x1 + i * step;
    ctx.beginPath();
    if (kind === "random") {
      // pseudo-random orientation (deterministic).
      const ang = Math.sin(i * 1.379) * Math.PI;
      const dx = Math.sin(ang) * amp;
      const dy = Math.cos(ang) * amp;
      ctx.moveTo(x - dx, yc - dy);
      ctx.lineTo(x + dx, yc + dy);
    } else if (kind === "vertical") {
      ctx.moveTo(x, yc - amp);
      ctx.lineTo(x, yc + amp);
    } else {
      // tilted along θ measured from the vertical.
      const dx = Math.sin(thetaRad) * amp;
      const dy = Math.cos(thetaRad) * amp;
      ctx.moveTo(x - dx, yc + dy);
      ctx.lineTo(x + dx, yc - dy);
    }
    ctx.stroke();
  }
}

function drawProjection(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  thetaRad: number,
) {
  // Faint reference box.
  ctx.strokeStyle = `rgba(120, 220, 240, 0.25)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - r - 6, cy - r - 6, (r + 6) * 2, (r + 6) * 2);

  // Vertical E_in (magenta arrow up).
  ctx.strokeStyle = `${MAGENTA} 0.95)`;
  ctx.fillStyle = `${MAGENTA} 0.95)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.1);
  ctx.lineTo(cx, cy - r * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx - 3, cy - r * 0.9 + 6);
  ctx.lineTo(cx + 3, cy - r * 0.9 + 6);
  ctx.closePath();
  ctx.fill();

  // Analyser axis (dashed lilac).
  ctx.strokeStyle = `${LILAC} 0.85)`;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - Math.sin(thetaRad) * r, cy + Math.cos(thetaRad) * r);
  ctx.lineTo(cx + Math.sin(thetaRad) * r, cy - Math.cos(thetaRad) * r);
  ctx.stroke();
  ctx.setLineDash([]);

  // Projection of E_in onto analyser axis — magnitude cosθ.
  const projLen = Math.cos(thetaRad) * r * 0.9;
  ctx.strokeStyle = `${AMBER} 0.95)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(thetaRad) * projLen, cy - Math.cos(thetaRad) * projLen);
  ctx.stroke();

  // Labels.
  ctx.fillStyle = `${MAGENTA} 0.9)`;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("E_in", cx + 4, cy - r * 0.8);
  ctx.fillStyle = `${AMBER} 0.9)`;
  ctx.fillText("E·cosθ", cx + 6, cy - 2);
}

function drawCosSquaredPlot(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  o: { x: number; y: number; w: number; h: number; liveDeg: number },
) {
  const { x, y, w, h, liveDeg } = o;
  const padL = 38;
  const padR = 12;
  const padT = 22;
  const padB = 30;
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("I / I₀", plotX + 4, plotY + 12);
  ctx.textAlign = "center";
  ctx.fillText("θ (deg)", plotX + plotW / 2, y + h - 8);

  // Y gridlines at 0, 0.25, 0.5, 0.75, 1.
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  for (let r = 0; r <= 1.001; r += 0.25) {
    const py = plotY + plotH * (1 - r);
    ctx.strokeStyle = `${colors.fg3}`;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    ctx.moveTo(plotX, py);
    ctx.lineTo(plotX + plotW, py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(r.toFixed(2), plotX - 4, py + 3);
  }

  // X ticks from −90 to 90, every 30°.
  ctx.textAlign = "center";
  for (let a = -90; a <= 90; a += 30) {
    const px = plotX + (plotW * (a + 90)) / 180;
    ctx.fillText(String(a), px, plotY + plotH + 12);
  }

  // Curve.
  const N = 200;
  ctx.strokeStyle = `${AMBER} 0.95)`;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const ang = -90 + (180 * i) / N;
    const I = malusLaw(1, ang);
    const px = plotX + (plotW * (ang + 90)) / 180;
    const py = plotY + plotH * (1 - I);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Live cursor.
  const clampedLive = Math.max(-90, Math.min(90, liveDeg));
  const liveX = plotX + (plotW * (clampedLive + 90)) / 180;
  const liveI = malusLaw(1, clampedLive);
  const liveY = plotY + plotH * (1 - liveI);
  ctx.strokeStyle = `${MAGENTA} 0.9)`;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(liveX, plotY);
  ctx.lineTo(liveX, plotY + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Live dot.
  ctx.fillStyle = `${MAGENTA} 0.95)`;
  ctx.beginPath();
  ctx.arc(liveX, liveY, 3.5, 0, Math.PI * 2);
  ctx.fill();
}
