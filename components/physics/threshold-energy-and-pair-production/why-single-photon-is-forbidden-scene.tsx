"use client";

/**
 * FIG.20a — Why a single photon cannot produce a pair in vacuum.
 *
 * Palette: amber for photon; cyan for e⁻; magenta for e⁺.
 */

import { useEffect, useRef, useState } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

type Phase = "approach" | "attempt" | "forbidden" | "reset";

export function WhySinglePhotonIsForbiddenScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const frameRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("approach");
  const [phase, setPhase] = useState<Phase>("approach");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const WIDTH = width;
    const HEIGHT = height;
    const CY = HEIGHT / 2;
    const CENTER_X = WIDTH / 2;

    const APPROACH_FRAMES = 90;
    const ATTEMPT_FRAMES = 40;
    const FORBIDDEN_FRAMES = 80;
    const RESET_FRAMES = 30;
    const TOTAL = APPROACH_FRAMES + ATTEMPT_FRAMES + FORBIDDEN_FRAMES + RESET_FRAMES;

    function drawArrow(
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      color: string,
      lw = 2,
    ) {
      ctx!.strokeStyle = color;
      ctx!.lineWidth = lw;
      ctx!.beginPath();
      ctx!.moveTo(fromX, fromY);
      ctx!.lineTo(toX, toY);
      ctx!.stroke();
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.moveTo(toX, toY);
      ctx!.lineTo(toX - 10 * Math.cos(angle - 0.4), toY - 10 * Math.sin(angle - 0.4));
      ctx!.lineTo(toX - 10 * Math.cos(angle + 0.4), toY - 10 * Math.sin(angle + 0.4));
      ctx!.closePath();
      ctx!.fill();
    }

    function drawPhoton(x: number, y: number, label: string) {
      ctx!.save();
      ctx!.strokeStyle = tokens.amber;
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      for (let i = 0; i < 60; i++) {
        const px = x - 60 + i;
        const py = y + 6 * Math.sin(i * 0.4);
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.stroke();
      ctx!.restore();
      ctx!.fillStyle = tokens.amber;
      ctx!.beginPath();
      ctx!.arc(x, y, 7, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = tokens.amber;
      ctx!.font = "bold 13px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(label, x, y - 14);
    }

    function drawParticle(x: number, y: number, label: string, color: string) {
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, 9, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = color;
      ctx!.font = "bold 13px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(label, x, y - 18);
    }

    function drawEquation(alpha: number) {
      ctx!.save();
      ctx!.globalAlpha = Math.min(alpha, 1);
      ctx!.fillStyle = tokens.textBright;
      ctx!.font = "14px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(
        "p²_photon = 0   ≠   (2mₑc)² = p²_pair",
        CENTER_X,
        HEIGHT - 70,
      );
      ctx!.fillStyle = tokens.red;
      ctx!.font = "bold 13px ui-monospace, monospace";
      ctx!.fillText(
        "Minkowski norm is Lorentz-invariant — no boost can rescue this",
        CENTER_X,
        HEIGHT - 50,
      );
      ctx!.restore();
    }

    function drawX(cx: number, cy: number, alpha: number) {
      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.strokeStyle = tokens.red;
      ctx!.lineWidth = 8;
      ctx!.lineCap = "round";
      const r = 36;
      ctx!.beginPath();
      ctx!.moveTo(cx - r, cy - r);
      ctx!.lineTo(cx + r, cy + r);
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.moveTo(cx + r, cy - r);
      ctx!.lineTo(cx - r, cy + r);
      ctx!.stroke();
      ctx!.restore();
    }

    function draw() {
      ctx!.clearRect(0, 0, WIDTH, HEIGHT);

      ctx!.fillStyle = tokens.bg;
      ctx!.fillRect(0, 0, WIDTH, HEIGHT);

      ctx!.strokeStyle = tokens.grid;
      ctx!.lineWidth = 1;
      for (let x = 0; x < WIDTH; x += 60) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, HEIGHT);
        ctx!.stroke();
      }
      for (let y = 0; y < HEIGHT; y += 60) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(WIDTH, y);
        ctx!.stroke();
      }

      const t = tRef.current % TOTAL;
      let currentPhase: Phase;

      if (t < APPROACH_FRAMES) {
        currentPhase = "approach";
        const progress = t / APPROACH_FRAMES;
        const photonX = 80 + progress * (CENTER_X - 80);
        drawPhoton(photonX, CY, "γ  (E = 1 MeV)");
        drawArrow(80, CY + 30, photonX - 20, CY + 30, tokens.amber, 1.5);
        ctx!.fillStyle = tokens.textFaint;
        ctx!.font = "12px ui-monospace, monospace";
        ctx!.textAlign = "center";
        ctx!.fillText("photon has no rest frame: |p|c = E, m = 0", CENTER_X, 40);
      } else if (t < APPROACH_FRAMES + ATTEMPT_FRAMES) {
        currentPhase = "attempt";
        const progress = (t - APPROACH_FRAMES) / ATTEMPT_FRAMES;
        const spread = progress * 80;
        const alpha = progress;
        ctx!.save();
        ctx!.globalAlpha = alpha * 0.9;
        drawParticle(CENTER_X + spread, CY - spread * 0.5, "e⁺", tokens.magenta);
        drawParticle(CENTER_X - spread, CY + spread * 0.5, "e⁻", tokens.cyan);
        ctx!.globalAlpha = 1 - progress;
        drawPhoton(CENTER_X, CY, "γ");
        ctx!.restore();
      } else if (t < APPROACH_FRAMES + ATTEMPT_FRAMES + FORBIDDEN_FRAMES) {
        currentPhase = "forbidden";
        const progress = (t - APPROACH_FRAMES - ATTEMPT_FRAMES) / FORBIDDEN_FRAMES;
        ctx!.save();
        ctx!.globalAlpha = 1 - progress * 0.6;
        drawParticle(CENTER_X + 80, CY - 40, "e⁺", tokens.magenta);
        drawParticle(CENTER_X - 80, CY + 40, "e⁻", tokens.cyan);
        ctx!.restore();
        drawX(CENTER_X, CY, Math.min(progress * 3, 1));
        drawEquation(Math.min(progress * 2, 1));
      } else {
        currentPhase = "reset";
        const progress = (t - APPROACH_FRAMES - ATTEMPT_FRAMES - FORBIDDEN_FRAMES) / RESET_FRAMES;
        ctx!.save();
        ctx!.globalAlpha = 1 - progress;
        drawX(CENTER_X, CY, 1);
        drawEquation(1);
        ctx!.restore();
      }

      if (currentPhase !== phaseRef.current) {
        phaseRef.current = currentPhase;
        setPhase(currentPhase);
      }

      ctx!.fillStyle = tokens.textMute;
      ctx!.font = "12px ui-monospace, monospace";
      ctx!.textAlign = "left";
      ctx!.fillText(
        "amber = photon  |  cyan = e⁻  |  magenta = e⁺  |  red-X = forbidden",
        16,
        HEIGHT - 16,
      );

      tRef.current += 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        {phase === "approach" && "Photon approaching — null four-momentum, m = 0"}
        {phase === "attempt" && "Attempting γ → e⁺ + e⁻ in vacuum…"}
        {phase === "forbidden" && "FORBIDDEN — Minkowski norm 0 ≠ (2mₑc)²"}
        {phase === "reset" && "Resetting…"}
      </p>
    </div>
  );
}
