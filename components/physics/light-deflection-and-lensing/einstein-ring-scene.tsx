"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";
import {
  lensImagePositions,
  totalMagnification,
  imageMagnification,
} from "@/lib/physics/relativity/light-deflection-and-lensing";

/**
 * FIG.41c — Point-source lensing toy.
 *
 * Looking through a point lens (a foreground galaxy or compact object) at a
 * background point source. A slider moves the source's angular offset u from
 * the lens, measured in Einstein radii θ_E. The lens equation u = θ − 1/θ
 * gives two images:
 *
 *   θ± = ½(u ± √(u²+4))
 *
 * The outer (+) image lies beyond the Einstein ring; the inner (−) image lies
 * inside it, flipped. As u → 0 (perfect alignment) the two images sweep around
 * and merge into a complete Einstein ring; the combined brightness, traced as
 * a microlensing light-curve at the bottom, spikes toward infinity.
 */

const PAD = 18;

export function EinsteinRingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [u, setU] = useState(0.6);
  const [angle, setAngle] = useState(35); // azimuth of source on the sky (deg)
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 340,
  });

  const images = useMemo(() => lensImagePositions(u), [u]);
  const mag = useMemo(() => totalMagnification(u), [u]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, { u, angle, images, mag });
  }, [tokens, width, height, u, angle, images, mag]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A background point source seen through a point lens. A slider moves the source's offset from the lens in Einstein-radius units; the two lensed images move along the line through the lens and merge into a complete Einstein ring at perfect alignment, while a light-curve below shows the total magnification spiking."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">source offset u: {u.toFixed(2)} θ_E</span>
        <input
          type="range"
          min={0}
          max={2.2}
          step={0.01}
          value={u}
          onChange={(e) => setU(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">source azimuth: {angle.toFixed(0)}°</span>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={angle}
          onChange={(e) => setAngle(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1 font-mono text-xs">
        {[
          { label: "aligned (ring)", u: 0 },
          { label: "near", u: 0.25 },
          { label: "two images", u: 0.9 },
          { label: "weak", u: 1.8 },
        ].map((p) => (
          <Button key={p.label} active={u === p.u} onClick={() => setU(p.u)}>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  s: {
    u: number;
    angle: number;
    images: [number, number];
    mag: number;
  },
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const skyX0 = PAD;
  const skyY0 = PAD + 18;
  const skyW = W - PAD * 2;
  const curveH = 56;
  const skyH = H - PAD * 2 - 18 - curveH - 14;
  const cx = skyX0 + skyW / 2;
  const cy = skyY0 + skyH / 2;
  const thetaE = Math.min(skyW, skyH) * 0.28; // px per Einstein radius

  drawSectionTitle(ctx, skyX0, skyY0 - 16, "VIEW THROUGH A POINT LENS", tokens.textMute);

  const rad = (s.angle * Math.PI) / 180;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  // ── Einstein ring (reference circle, θ_E)
  ctx.strokeStyle = hexToRgba(tokens.amber, s.u < 0.04 ? 0.95 : 0.35);
  ctx.lineWidth = s.u < 0.04 ? 3 : 1;
  ctx.setLineDash(s.u < 0.04 ? [] : [4, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, thetaE, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── the lens (foreground mass) at center
  const lensGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, thetaE * 0.5);
  lensGrad.addColorStop(0, hexToRgba(tokens.magenta, 0.55));
  lensGrad.addColorStop(1, hexToRgba(tokens.magenta, 0));
  ctx.fillStyle = lensGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, thetaE * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.magenta;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // ── true source position (ghost)
  const srcX = cx + dirX * s.u * thetaE;
  const srcY = cy + dirY * s.u * thetaE;
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(srcX, srcY, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("true source", srcX, srcY - 8);

  // ── the two lensed images along the lens–source line
  const [tp, tm] = s.images;
  const drawImage = (theta: number, accent: string) => {
    const ix = cx + dirX * theta * thetaE;
    const iy = cy + dirY * theta * thetaE;
    const brightness = Math.min(1, Math.abs(imageMagnification(theta)) / 4);
    const r = 4 + brightness * 7;
    const glow = ctx.createRadialGradient(ix, iy, 1, ix, iy, r * 2.2);
    glow.addColorStop(0, hexToRgba(accent, 0.9));
    glow.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ix, iy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(ix, iy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  if (s.u >= 0.04) {
    drawImage(tp, tokens.cyan);
    drawImage(tm, tokens.blue);
  } else {
    // perfect alignment: paint the whole ring as the image
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.95);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, thetaE, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ── HUD
  let hy = skyY0 + 4;
  hy = drawHudReadout(
    ctx,
    skyX0 + 6,
    hy,
    "u = ",
    `${s.u.toFixed(2)} θ_E`,
    tokens.textDim,
    tokens.textMute,
  );
  hy = drawHudReadout(
    ctx,
    skyX0 + 6,
    hy,
    "θ₊ / θ₋ = ",
    `${tp.toFixed(2)} / ${tm.toFixed(2)} θ_E`,
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    skyX0 + 6,
    hy,
    "total mag A = ",
    s.u < 0.01 ? "→ ∞ (ring)" : `${s.mag.toFixed(2)}×`,
    tokens.textDim,
    tokens.amber,
  );

  // ── light-curve strip A(u)
  const curveY0 = skyY0 + skyH + 12;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(skyX0, curveY0, skyW, curveH);
  drawSectionTitle(ctx, skyX0 + 4, curveY0 + 3, "MICROLENSING LIGHT-CURVE  A(u)", tokens.textMute);

  const uMax = 2.2;
  const aMax = 6; // clip magnification for the plot
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const uu = (i / N) * uMax;
    const a = Math.min(aMax, totalMagnification(Math.max(uu, 1e-3)));
    const px = skyX0 + (uu / uMax) * skyW;
    const py = curveY0 + curveH - 8 - ((a - 1) / (aMax - 1)) * (curveH - 18);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // marker for current u
  const aNow = Math.min(aMax, s.mag);
  const mx = skyX0 + (Math.min(s.u, uMax) / uMax) * skyW;
  const my = curveY0 + curveH - 8 - ((aNow - 1) / (aMax - 1)) * (curveH - 18);
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
