"use client";

import { useEffect, useRef, useState } from "react";
import {
  totalFourMomentum,
  fourMomentaEqual,
} from "@/lib/physics/relativity/relativistic-collision";
import { fourMomentum } from "@/lib/physics/relativity/four-momentum";
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
 * FIG.18a — 1D head-on elastic collision.
 *
 * Color palette:
 *   cyan    = particle 1
 *   magenta = particle 2
 *   green   = outgoing particles
 */

const C_NAT = 1;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  headSize = 8,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

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

export function ElasticCollisionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.47,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [beta, setBeta] = useState(0.6);
  const [mass, setMass] = useState(1.0);

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

    const g = gamma(beta);
    const c = C_NAT;

    const p1in = fourMomentum(mass, { x: beta * c, y: 0, z: 0 }, c);
    const p2in = fourMomentum(mass, { x: -beta * c, y: 0, z: 0 }, c);
    const p1out = fourMomentum(mass, { x: -beta * c, y: 0, z: 0 }, c);
    const p2out = fourMomentum(mass, { x: beta * c, y: 0, z: 0 }, c);

    const totalIn = totalFourMomentum([p1in, p2in]);
    const totalOut = totalFourMomentum([p1out, p2out]);
    const conserved = fourMomentaEqual(totalIn, totalOut, 1e-9);

    const midX = WIDTH / 2;
    const lineY = HEIGHT / 2 - 10;
    const arrowLen = Math.min(120, WIDTH * 0.16);
    const ballR = 16;
    const collX = midX;

    // Background grid
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= WIDTH; xv += 60) {
      ctx.beginPath();
      ctx.moveTo(xv, 30);
      ctx.lineTo(xv, HEIGHT - 80);
      ctx.stroke();
    }
    for (let yv = 30; yv <= HEIGHT - 80; yv += 60) {
      ctx.beginPath();
      ctx.moveTo(0, yv);
      ctx.lineTo(WIDTH, yv);
      ctx.stroke();
    }

    // Divider
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, HEIGHT - 80);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels BEFORE / AFTER
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "center";
    ctx.fillText("BEFORE", midX / 2, 24);
    ctx.fillText("AFTER", midX + midX / 2, 24);

    // --- BEFORE ---
    const p1x = collX - arrowLen - ballR - 20;
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.arc(p1x, lineY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p1x, lineY + 4);
    drawArrow(ctx, p1x + ballR, lineY, collX - 10, lineY, tokens.cyan);

    const p2x = collX + arrowLen + ballR + 20;
    ctx.fillStyle = tokens.magenta;
    ctx.beginPath();
    ctx.arc(p2x, lineY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p2x, lineY + 4);
    drawArrow(ctx, p2x - ballR, lineY, collX + 10, lineY, tokens.magenta);

    // Collision spark
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.6);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(collX + 4 * Math.cos(angle), lineY + 4 * Math.sin(angle));
      ctx.lineTo(collX + 12 * Math.cos(angle), lineY + 12 * Math.sin(angle));
      ctx.stroke();
    }

    // --- AFTER ---
    const p1outx = collX - arrowLen - ballR - 20;
    drawArrow(ctx, collX + 10, lineY + 40, p1outx - ballR, lineY + 40, tokens.green);
    ctx.fillStyle = tokens.green;
    ctx.beginPath();
    ctx.arc(p1outx, lineY + 40, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p1outx, lineY + 44);

    const p2outx = collX + arrowLen + ballR + 20;
    drawArrow(ctx, collX - 10, lineY + 40, p2outx + ballR, lineY + 40, tokens.green);
    ctx.fillStyle = tokens.green;
    ctx.beginPath();
    ctx.arc(p2outx, lineY + 40, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p2outx, lineY + 44);

    // β labels
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = tokens.cyan;
    ctx.textAlign = "center";
    ctx.fillText(`β = +${beta.toFixed(2)}`, (p1x + collX) / 2, lineY - 28);
    ctx.fillStyle = tokens.magenta;
    ctx.fillText(`β = −${beta.toFixed(2)}`, (p2x + collX) / 2, lineY - 28);
    ctx.fillStyle = tokens.green;
    ctx.fillText(`β = −${beta.toFixed(2)}`, (p1outx + collX) / 2 - 20, lineY + 20);
    ctx.fillText(`β = +${beta.toFixed(2)}`, (p2outx + collX) / 2 + 20, lineY + 20);

    // --- HUD ---
    const hudY = HEIGHT - 72;
    ctx.fillStyle = hexToRgba(tokens.bg, 0.85);
    ctx.fillRect(0, hudY, WIDTH, 72);

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";

    ctx.fillStyle = tokens.cyan;
    ctx.fillText(
      `p₁ᵢₙ = (${p1in[0].toFixed(6)}, ${p1in[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 16,
    );
    ctx.fillStyle = tokens.magenta;
    ctx.fillText(
      `p₂ᵢₙ = (${p2in[0].toFixed(6)}, ${p2in[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 30,
    );
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(
      `Σpᵢₙ  = (${totalIn[0].toFixed(6)}, ${totalIn[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 44,
    );
    ctx.fillStyle = tokens.green;
    ctx.fillText(
      `Σpₒᵤₜ = (${totalOut[0].toFixed(6)}, ${totalOut[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 58,
    );

    ctx.textAlign = "right";
    ctx.fillStyle = conserved ? tokens.green : tokens.red;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.fillText(
      conserved
        ? `✓ Σp^μ_in = Σp^μ_out   γ = ${g.toFixed(4)}`
        : `✗ NOT CONSERVED   γ = ${g.toFixed(4)}`,
      WIDTH - 12,
      hudY + 20,
    );
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText("c = 1, equal-mass elastic 1D (velocity swap)", WIDTH - 12, hudY + 58);
  }, [beta, mass, tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex w-full flex-col gap-2">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-24">β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={0.01}
            max={0.95}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-24">m = {mass.toFixed(1)}</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </label>
      </div>
    </div>
  );
}
