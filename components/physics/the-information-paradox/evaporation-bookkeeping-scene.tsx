"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  energyRadiatedFraction,
  informationInRadiation,
  remainingMassFraction,
  PAGE_FRACTION,
} from "@/lib/physics/relativity/the-information-paradox";

/**
 * FIG.60b — The bookkeeping picture.
 *
 * Two ledgers tracked as the hole evaporates (slider = radiated entropy
 * fraction f):
 *   LEFT  — the shrinking hole: a disk whose radius ∝ remaining mass fraction,
 *           wrapped by a stack of "energy out" bars.
 *   RIGHT — two meters: ENERGY radiated (MINT, convex — most energy leaves
 *           late) and INFORMATION recovered (CYAN, zero until the Page time
 *           then rising). The visual point: energy starts pouring out early
 *           while information stays locked in until the halfway mark.
 */

const PAD = 18;

export function EvaporationBookkeepingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [f, setF] = useState(0.4);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, f, width, height);
  }, [tokens, f, width, height]);

  const eOut = energyRadiatedFraction(f);
  const iOut = informationInRadiation(f);
  const mLeft = remainingMassFraction(f);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two ledgers as a black hole evaporates: a shrinking hole on the left, and meters on the right for radiated energy and recovered information. Energy leaves early; information stays locked until the Page time, then rises."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">evaporated: {(f * 100).toFixed(0)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={f}
          onChange={(e) => setF(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-mint)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span>mass left: {(mLeft * 100).toFixed(0)}%</span>
        <span style={{ color: "var(--color-mint)" }}>
          energy out: {(eOut * 100).toFixed(0)}%
        </span>
        <span style={{ color: "var(--color-cyan)" }}>
          information out: {(iOut * 100).toFixed(0)}%
        </span>
        <button
          type="button"
          className="cursor-pointer hover:text-[var(--color-fg-1)]"
          onClick={() => setF(PAGE_FRACTION)}
        >
          Page time
        </button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  f: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const leftW = Math.max(180, W * 0.42);
  const rightX0 = leftW + PAD;
  const rightW = W - rightX0 - PAD;

  // ── LEFT: the shrinking hole ───────────────────────────────────────────────
  drawSectionTitle(ctx, PAD, 10, "THE HOLE", tokens.textMute);
  const cx = PAD + (leftW - PAD) / 2;
  const cy = H / 2 + 6;
  const maxR = Math.min((leftW - PAD * 2) / 2, H / 2 - 36);
  const mLeft = remainingMassFraction(f);
  const r = Math.max(2, maxR * mLeft);

  // ghost of original size
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // emitted quanta drifting outward (amber dots), denser as f grows
  const eOut = energyRadiatedFraction(f);
  const nQuanta = Math.round(eOut * 40);
  for (let i = 0; i < nQuanta; i++) {
    const ang = (i / nQuanta) * Math.PI * 2 * 3.3 + i * 0.7;
    const rad = r + 8 + ((i * 13) % Math.max(1, maxR - r + 26));
    const qx = cx + Math.cos(ang) * rad;
    const qy = cy + Math.sin(ang) * rad;
    ctx.fillStyle = hexToRgba(tokens.amber, 0.5);
    ctx.beginPath();
    ctx.arc(qx, qy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // the hole itself
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grad.addColorStop(0, hexToRgba(tokens.purple, 0.9));
  grad.addColorStop(1, hexToRgba(tokens.bg, 1));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.85);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`mass ${(mLeft * 100).toFixed(0)}%`, cx, cy + maxR + 8);

  // ── RIGHT: the two meters ───────────────────────────────────────────────────
  drawSectionTitle(ctx, rightX0, 10, "THE LEDGER", tokens.textMute);
  const meterX = rightX0 + 70;
  const meterW = rightW - 78;
  const eY = H * 0.42;
  const iY = H * 0.68;
  const barH = 16;

  meter(ctx, tokens, "energy out", meterX, eY, meterW, barH, eOut, tokens.mint);
  meter(ctx, tokens, "info out", meterX, iY, meterW, barH, informationInRadiation(f), tokens.cyan);

  // Page-time tick under both meters
  const xPage = meterX + PAGE_FRACTION * meterW;
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPage, eY - 8);
  ctx.lineTo(xPage, iY + barH + 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Page time", xPage, iY + barH + 10);

  // takeaway caption
  ctx.fillStyle = tokens.textDim;
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const msg =
    f < PAGE_FRACTION
      ? "energy leaks, information stays locked"
      : "past halfway: information now leaks out too";
  ctx.fillText(msg, rightX0, H - 26);
}

function meter(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string,
) {
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x - 8, y + h / 2);

  // track
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  // fill
  ctx.fillStyle = hexToRgba(color, 0.85);
  ctx.fillRect(x, y, Math.max(0, w * frac), h);

  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${(frac * 100).toFixed(0)}%`, x + w + 8, y + h / 2);
}
