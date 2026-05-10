"use client";

import { useEffect, useRef, useState } from "react";
import { gamma } from "@/lib/physics/relativity/types";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.18c — 2D elastic scattering: relativistic vs. Newtonian outgoing angles.
 *
 * Color palette:
 *   cyan    = projectile
 *   amber   = target
 *   green   = scattered particle 1 (upper)
 *   magenta = scattered particle 2 (lower)
 */

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  headSize = 8,
  dashed = false,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  if (dashed) ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headSize * Math.cos(angle - Math.PI / 7),
    y2 - headSize * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    x2 - headSize * Math.cos(angle + Math.PI / 7),
    y2 - headSize * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();
}

function solveScatteringAngles(betaIn: number, phi: number) {
  const gIn = gamma(betaIn);
  const betaCom = betaIn / (1 + gIn);
  const gCom = gamma(betaCom);

  const E_star = gCom;
  const p_star = gCom * betaCom;

  const p1x_com = p_star * Math.cos(phi);
  const p1y_com = p_star * Math.sin(phi);
  const p1E_lab = gCom * (E_star + betaCom * p1x_com);
  const p1x_lab = gCom * (p1x_com + betaCom * E_star);
  const p1y_lab = p1y_com;
  const theta1 = Math.atan2(p1y_lab, p1x_lab);

  const p2x_com = -p_star * Math.cos(phi);
  const p2y_com = -p_star * Math.sin(phi);
  const p2E_lab = gCom * (E_star + betaCom * p2x_com);
  const p2x_lab = gCom * (p2x_com + betaCom * E_star);
  const p2y_lab = p2y_com;
  const theta2 = Math.atan2(-p2y_lab, p2x_lab);

  const theta1Newton = phi / 2;
  const theta2Newton = Math.PI / 2 - phi / 2;
  const thetaSumNewton = theta1Newton + theta2Newton;
  const thetaSumRel = theta1 + theta2;

  const p1Mag = Math.sqrt(p1x_lab * p1x_lab + p1y_lab * p1y_lab);
  const p2Mag = Math.sqrt(p2x_lab * p2x_lab + p2y_lab * p2y_lab);

  return {
    theta1,
    theta2,
    theta1Newton,
    theta2Newton,
    thetaSumRel,
    thetaSumNewton,
    p1E_lab,
    p2E_lab,
    p1Mag,
    p2Mag,
  };
}

export function TwoDScatteringScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [betaIn, setBetaIn] = useState(0.6);
  const [phiDeg, setPhiDeg] = useState(45);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    const WIDTH = width;
    const HEIGHT = height;

    const phi = (phiDeg * Math.PI) / 180;
    const result = solveScatteringAngles(betaIn, phi);
    const {
      theta1,
      theta2,
      theta1Newton,
      theta2Newton,
      thetaSumRel,
      thetaSumNewton,
      p1Mag,
      p2Mag,
    } = result;

    const collX = Math.min(300, WIDTH * 0.42);
    const collY = HEIGHT / 2 - 10;
    const incomingLen = Math.min(150, WIDTH * 0.2);
    const arrowScale = Math.min(130, WIDTH * 0.18);

    // Background grid
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= WIDTH; xv += 60) {
      ctx.beginPath();
      ctx.moveTo(xv, 20);
      ctx.lineTo(xv, HEIGHT - 90);
      ctx.stroke();
    }
    for (let yv = 20; yv <= HEIGHT - 90; yv += 60) {
      ctx.beginPath();
      ctx.moveTo(0, yv);
      ctx.lineTo(WIDTH, yv);
      ctx.stroke();
    }

    // Beam axis (dashed)
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, collY);
    ctx.lineTo(WIDTH, collY);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- INCOMING PROJECTILE ---
    drawArrow(ctx, collX - incomingLen, collY, collX - 15, collY, tokens.cyan);
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.arc(collX - incomingLen - 14, collY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", collX - incomingLen - 14, collY + 4);

    ctx.fillStyle = tokens.cyan;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`β = ${betaIn.toFixed(2)}`, collX - incomingLen - 14, collY - 22);

    // --- TARGET ---
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(collX, collY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", collX, collY + 4);
    ctx.fillStyle = tokens.amber;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("β = 0", collX, collY - 22);

    // Spark
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.5);
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(collX + 16 * Math.cos(angle), collY + 16 * Math.sin(angle));
      ctx.lineTo(collX + 26 * Math.cos(angle), collY + 26 * Math.sin(angle));
      ctx.stroke();
    }

    // --- NEWTONIAN ---
    const newtonScale = arrowScale * 0.7;
    drawArrow(
      ctx,
      collX,
      collY,
      collX + newtonScale * Math.cos(theta1Newton),
      collY - newtonScale * Math.sin(theta1Newton),
      hexToRgba(tokens.green, 0.3),
      6,
      true,
    );
    drawArrow(
      ctx,
      collX,
      collY,
      collX + newtonScale * Math.cos(theta2Newton),
      collY + newtonScale * Math.sin(theta2Newton),
      hexToRgba(tokens.magenta, 0.3),
      6,
      true,
    );

    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(collX, collY, newtonScale * 0.6, -theta1Newton, theta2Newton);
    ctx.stroke();

    // --- RELATIVISTIC ---
    const p1ArrowLen = Math.min(arrowScale * p1Mag, arrowScale * 1.5);
    const p2ArrowLen = Math.min(arrowScale * p2Mag, arrowScale * 1.5);

    drawArrow(
      ctx,
      collX,
      collY,
      collX + p1ArrowLen * Math.cos(theta1),
      collY - p1ArrowLen * Math.sin(theta1),
      tokens.green,
    );
    drawArrow(
      ctx,
      collX,
      collY,
      collX + p2ArrowLen * Math.cos(theta2),
      collY + p2ArrowLen * Math.sin(theta2),
      tokens.magenta,
    );

    // Angle labels (relativistic)
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = tokens.green;
    const lx1 = collX + (p1ArrowLen + 18) * Math.cos(theta1);
    const ly1 = collY - (p1ArrowLen + 18) * Math.sin(theta1);
    ctx.textAlign = "left";
    ctx.fillText(`θ₁ = ${((theta1 * 180) / Math.PI).toFixed(1)}°`, lx1, ly1);

    ctx.fillStyle = tokens.magenta;
    const lx2 = collX + (p2ArrowLen + 18) * Math.cos(theta2);
    const ly2 = collY + (p2ArrowLen + 18) * Math.sin(theta2);
    ctx.fillText(`θ₂ = ${((theta2 * 180) / Math.PI).toFixed(1)}°`, lx2, ly2);

    // Newtonian angle labels (dim)
    ctx.fillStyle = hexToRgba(tokens.green, 0.45);
    ctx.font = "10px ui-monospace, monospace";
    const nlx1 = collX + (newtonScale + 15) * Math.cos(theta1Newton);
    const nly1 = collY - (newtonScale + 15) * Math.sin(theta1Newton);
    ctx.textAlign = "left";
    ctx.fillText(`θ₁ᴺ = ${((theta1Newton * 180) / Math.PI).toFixed(1)}°`, nlx1, nly1);
    ctx.fillStyle = hexToRgba(tokens.magenta, 0.45);
    const nlx2 = collX + (newtonScale + 15) * Math.cos(theta2Newton);
    const nly2 = collY + (newtonScale + 15) * Math.sin(theta2Newton);
    ctx.fillText(`θ₂ᴺ = ${((theta2Newton * 180) / Math.PI).toFixed(1)}°`, nlx2, nly2);

    // Legend
    ctx.textAlign = "left";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = tokens.green;
    ctx.fillText("— relativistic", WIDTH - 160, 38);
    ctx.fillStyle = hexToRgba(tokens.green, 0.4);
    ctx.fillText("- - Newtonian", WIDTH - 160, 52);

    // --- HUD ---
    const hudY = HEIGHT - 88;
    ctx.fillStyle = hexToRgba(tokens.bg, 0.88);
    ctx.fillRect(0, hudY, WIDTH, 88);

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";

    ctx.fillStyle = tokens.textMute;
    ctx.fillText(
      `β_in = ${betaIn.toFixed(3)}   γ = ${gamma(betaIn).toFixed(4)}   φ_CoM = ${phiDeg.toFixed(0)}°`,
      12,
      hudY + 16,
    );

    ctx.fillStyle = tokens.green;
    ctx.fillText(
      `Relativistic:  θ₁ = ${((theta1 * 180) / Math.PI).toFixed(3)}°   θ₂ = ${((theta2 * 180) / Math.PI).toFixed(3)}°   sum = ${((thetaSumRel * 180) / Math.PI).toFixed(3)}°`,
      12,
      hudY + 32,
    );

    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(
      `Newtonian:     θ₁ = ${((theta1Newton * 180) / Math.PI).toFixed(3)}°   θ₂ = ${((theta2Newton * 180) / Math.PI).toFixed(3)}°   sum = ${((thetaSumNewton * 180) / Math.PI).toFixed(3)}°  (always 90°)`,
      12,
      hudY + 48,
    );

    const deficit = (90 - (thetaSumRel * 180) / Math.PI).toFixed(3);
    ctx.fillStyle = tokens.amber;
    ctx.fillText(
      `Relativistic deficit: θ₁ + θ₂ = 90° − ${deficit}°   (diverges with β)`,
      12,
      hudY + 64,
    );

    ctx.fillStyle = tokens.textFaint;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("equal-mass elastic 2D — c = 1 natural units", WIDTH - 12, hudY + 80);
  }, [betaIn, phiDeg, tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex w-full flex-col gap-2">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-36">β_in = {betaIn.toFixed(2)}</span>
          <input
            type="range"
            min={0.01}
            max={0.95}
            step={0.01}
            value={betaIn}
            onChange={(e) => setBetaIn(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-36">φ_CoM = {phiDeg.toFixed(0)}°</span>
          <input
            type="range"
            min={5}
            max={85}
            step={1}
            value={phiDeg}
            onChange={(e) => setPhiDeg(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
          />
        </label>
      </div>
    </div>
  );
}
