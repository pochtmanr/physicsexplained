"use client";

import { useEffect, useRef, useState } from "react";
import { inelasticMergerMass } from "@/lib/physics/relativity/relativistic-collision";
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
 * FIG.18b — Inelastic merger: kinetic energy becomes rest mass.
 *
 *   m_final = 2γ(β)·m
 *
 * Color palette:
 *   cyan    = particle 1 (incoming)
 *   magenta = particle 2 (incoming)
 *   amber   = merged particle
 */

export function InelasticMergerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.45,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [beta, setBeta] = useState(0.5);
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
    const mFinal = inelasticMergerMass(mass, beta, mass, -beta, 1);
    const mNewton = 2 * mass;
    const massExcess = (mFinal - mNewton) / mNewton;

    const midX = WIDTH / 2;
    const lineY = HEIGHT / 2 - 20;
    const arrowLen = Math.min(130, WIDTH * 0.18);
    const ballR1 = 14;
    const ballRFinal = ballR1 * Math.sqrt(mFinal / (mass * 1.5));

    // Background subtle grid
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= WIDTH; xv += 60) {
      ctx.beginPath();
      ctx.moveTo(xv, 20);
      ctx.lineTo(xv, HEIGHT - 90);
      ctx.stroke();
    }

    // --- PARTICLE 1 (cyan) ---
    const p1x = midX - arrowLen - ballR1 - 30;

    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p1x + ballR1, lineY);
    ctx.lineTo(midX - 15, lineY);
    ctx.stroke();
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.moveTo(midX - 8, lineY);
    ctx.lineTo(midX - 20, lineY - 6);
    ctx.lineTo(midX - 20, lineY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.arc(p1x, lineY, ballR1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p1x, lineY + 4);

    ctx.fillStyle = tokens.cyan;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`β = +${beta.toFixed(3)}`, p1x, lineY - ballR1 - 8);

    // --- PARTICLE 2 (magenta) ---
    const p2x = midX + arrowLen + ballR1 + 30;

    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p2x - ballR1, lineY);
    ctx.lineTo(midX + 15, lineY);
    ctx.stroke();
    ctx.fillStyle = tokens.magenta;
    ctx.beginPath();
    ctx.moveTo(midX + 8, lineY);
    ctx.lineTo(midX + 20, lineY - 6);
    ctx.lineTo(midX + 20, lineY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tokens.magenta;
    ctx.beginPath();
    ctx.arc(p2x, lineY, ballR1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p2x, lineY + 4);

    ctx.fillStyle = tokens.magenta;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`β = −${beta.toFixed(3)}`, p2x, lineY - ballR1 - 8);

    // --- COLLISION SPARK ---
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.8);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(midX + 5 * Math.cos(angle), lineY + 5 * Math.sin(angle));
      ctx.lineTo(midX + 18 * Math.cos(angle), lineY + 18 * Math.sin(angle));
      ctx.stroke();
    }

    // --- MERGED PARTICLE ---
    const mergedY = lineY + 80;
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(midX, mergedY, Math.max(ballRFinal, 18), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.bg;
    ctx.font = `bold ${Math.round(Math.min(11, 10 + mFinal / mass))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("M", midX, mergedY + 4);

    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, lineY + 22);
    ctx.lineTo(midX, mergedY - Math.max(ballRFinal, 18) - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tokens.amber;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("β = 0 (at rest in CoM)", midX + Math.max(ballRFinal, 18) + 8, mergedY + 4);

    // --- HUD ---
    const hudY = HEIGHT - 88;
    ctx.fillStyle = hexToRgba(tokens.bg, 0.88);
    ctx.fillRect(0, hudY, WIDTH, 88);

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";

    ctx.fillStyle = tokens.textMute;
    ctx.fillText(`m = ${mass.toFixed(2)}   β = ${beta.toFixed(3)}   γ = ${g.toFixed(6)}`, 12, hudY + 16);

    ctx.fillStyle = tokens.cyan;
    ctx.fillText(`Newtonian  M_final = 2m = ${mNewton.toFixed(6)}`, 12, hudY + 32);

    ctx.fillStyle = tokens.amber;
    ctx.fillText(
      `Relativistic M_final = 2γm = ${mFinal.toFixed(6)}   (${(massExcess * 100).toFixed(2)}% heavier)`,
      12,
      hudY + 48,
    );

    ctx.fillStyle = tokens.green;
    ctx.fillText(
      `Mass excess = (2γ − 2)m = ${(mFinal - mNewton).toFixed(6)}   [was kinetic energy]`,
      12,
      hudY + 64,
    );

    ctx.fillStyle = tokens.textFaint;
    ctx.textAlign = "right";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("c = 1 natural units — Σp^μ conserved, rest mass is NOT", WIDTH - 12, hudY + 80);
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
          <span className="w-24">β = {beta.toFixed(3)}</span>
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
            min={0.5}
            max={5}
            step={0.5}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
          />
        </label>
      </div>
    </div>
  );
}
