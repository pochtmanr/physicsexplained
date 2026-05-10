"use client";

import { useEffect, useRef, useState } from "react";
import {
  POUND_REBKA_PREDICTED,
  compensatingDopplerVelocity,
} from "@/lib/physics/relativity/gravitational-redshift";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * PoundRebkaTowerScene — FIG.27a · §06 MONEY SHOT.
 */

const TOWER_HEIGHT_M = 22.5;
const PREDICTED = POUND_REBKA_PREDICTED;
const V_COMP = compensatingDopplerVelocity(TOWER_HEIGHT_M);

// Real-world brick masonry colors (not chrome). Kept as literal rgba
// because they represent the physical tower's brick.
const BRICK = "rgba(180,140,100,0.55)";
const BRICK_DARK = "rgba(120,90,60,0.45)";

export function PoundRebkaTowerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 360,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      const elapsed = (t - start) / 1000;
      const phase = (elapsed % 4) / 4;
      setTick(phase);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, width, height, tick, tokens);
  }, [tick, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Cross-section of Harvard's 22.5-meter Jefferson Physical Laboratory tower. A Co-57 gamma source at the top emits 14.4 keV photons that fall to an Fe-57 absorber at the bottom, blueshifting by Δν/ν = gh/c² ≈ 2.46 × 10⁻¹⁵."
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  phase: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const STEEL = hexToRgba(tokens.textBright, 0.35);
  const PHOTON_RED = tokens.red;
  const PHOTON_BLUE = tokens.blue;

  const towerW = 130;
  const towerX = W * 0.28;
  const topY = 56;
  const botY = H - 80;
  const tH = botY - topY;

  // Ground line
  ctx.save();
  ctx.strokeStyle = tokens.textFaint;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(20, botY);
  ctx.lineTo(W - 20, botY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Tower body
  ctx.save();
  ctx.fillStyle = BRICK_DARK;
  ctx.fillRect(towerX - towerW / 2, topY, towerW, tH);
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 1;
  for (let y = topY + 12; y < botY; y += 14) {
    ctx.beginPath();
    ctx.moveTo(towerX - towerW / 2, y);
    ctx.lineTo(towerX + towerW / 2, y);
    ctx.stroke();
  }
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 2;
  ctx.strokeRect(towerX - towerW / 2, topY, towerW, tH);

  // Hollow shaft
  const shaftW = 36;
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(towerX - shaftW / 2, topY + 14, shaftW, tH - 28);
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1;
  ctx.strokeRect(towerX - shaftW / 2, topY + 14, shaftW, tH - 28);
  ctx.restore();

  // ── Source at top: Co-57
  const sourceY = topY + 18;
  ctx.save();
  ctx.fillStyle = STEEL;
  ctx.fillRect(towerX - 18, sourceY - 8, 36, 8);
  const sgrad = ctx.createRadialGradient(
    towerX,
    sourceY + 6,
    1,
    towerX,
    sourceY + 6,
    10,
  );
  sgrad.addColorStop(0, hexToRgba(tokens.red, 0.9));
  sgrad.addColorStop(1, hexToRgba(tokens.red, 0.2));
  ctx.fillStyle = sgrad;
  ctx.beginPath();
  ctx.arc(towerX, sourceY + 6, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PHOTON_RED;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = PHOTON_RED;
  ctx.textAlign = "left";
  ctx.fillText("Co-57", towerX + 22, sourceY + 4);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("source · 14.4 keV γ", towerX + 22, sourceY + 17);
  ctx.restore();

  // ── Absorber at bottom: Fe-57
  const absorberY = botY - 18;
  ctx.save();
  ctx.fillStyle = STEEL;
  ctx.fillRect(towerX - 18, absorberY, 36, 8);
  const agrad = ctx.createRadialGradient(
    towerX,
    absorberY - 4,
    1,
    towerX,
    absorberY - 4,
    10,
  );
  agrad.addColorStop(0, hexToRgba(tokens.blue, 0.9));
  agrad.addColorStop(1, hexToRgba(tokens.blue, 0.2));
  ctx.fillStyle = agrad;
  ctx.beginPath();
  ctx.arc(towerX, absorberY - 4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PHOTON_BLUE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = PHOTON_BLUE;
  ctx.textAlign = "left";
  ctx.fillText("Fe-57", towerX + 22, absorberY - 4);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("absorber · resonance", towerX + 22, absorberY + 9);
  ctx.restore();

  // ── Animated photon
  const photonY = sourceY + 6 + phase * (absorberY - 4 - sourceY - 6);
  // Color blend cyan-side vs red-side via theme; simple lerp via rgba alpha mix
  const photonColour = phase < 0.5 ? PHOTON_RED : PHOTON_BLUE;

  ctx.save();
  ctx.strokeStyle = photonColour;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  const trailTopY = sourceY + 12;
  const trailBotY = photonY;
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const yy = trailTopY + tt * (trailBotY - trailTopY);
    const wavelength = 14 - 4 * tt;
    const xx = towerX + 5 * Math.sin((yy / wavelength) * Math.PI * 2);
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  const grad = ctx.createRadialGradient(towerX, photonY, 0, towerX, photonY, 8);
  grad.addColorStop(0, photonColour);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(towerX, photonY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Tower height annotation
  ctx.save();
  const annX = towerX - towerW / 2 - 18;
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(annX, topY);
  ctx.lineTo(annX, botY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(annX - 4, topY);
  ctx.lineTo(annX + 4, topY);
  ctx.moveTo(annX - 4, botY);
  ctx.lineTo(annX + 4, botY);
  ctx.stroke();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(annX - 10, (topY + botY) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`h = ${TOWER_HEIGHT_M} m`, 0, 0);
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "center";
  ctx.fillText("Jefferson Physical Lab · Harvard 1960", towerX, topY - 30);
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.fillText("the 22.5-meter tower", towerX, topY - 14);
  ctx.restore();

  // ── HUD on the right
  const hudX = W * 0.55;
  const hudY = topY + 12;
  const hudW = W - hudX - 20;

  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.fillRect(hudX, hudY, hudW, 220);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX, hudY, hudW, 220);

  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "left";
  ctx.fillText("PREDICTED — from the equivalence principle", hudX + 14, hudY + 22);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("Δν / ν  =  g h / c²", hudX + 14, hudY + 42);

  ctx.fillStyle = tokens.amber;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillText(
    `         =  ${PREDICTED.toExponential(2)}`,
    hudX + 14,
    hudY + 60,
  );

  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(
    "9.80665 m/s² × 22.5 m / (3 × 10⁸ m/s)²",
    hudX + 14,
    hudY + 76,
  );

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.beginPath();
  ctx.moveTo(hudX + 14, hudY + 92);
  ctx.lineTo(hudX + hudW - 14, hudY + 92);
  ctx.stroke();

  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.fillText("MEASURED — Pound & Rebka 1960", hudX + 14, hudY + 110);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.mint;
  ctx.fillText(
    "(2.57 ± 0.26) × 10⁻¹⁵",
    hudX + 14,
    hudY + 130,
  );

  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(
    "predicted within 10% — Pound-Snider 1965 → 1%",
    hudX + 14,
    hudY + 146,
  );

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.beginPath();
  ctx.moveTo(hudX + 14, hudY + 162);
  ctx.lineTo(hudX + hudW - 14, hudY + 162);
  ctx.stroke();

  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.fillText("COMPENSATING DOPPLER", hudX + 14, hudY + 180);
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText(
    `v = g h / c  ≈  ${(V_COMP * 1e6).toFixed(2)} μm/s`,
    hudX + 14,
    hudY + 198,
  );
  ctx.restore();

  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "center";
  ctx.fillText(
    "First laboratory test of GR · derivable from EP alone · no field equations needed",
    W / 2,
    H - 22,
  );
  ctx.restore();
}
