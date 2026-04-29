"use client";

/**
 * FIG.20a — Why a single photon cannot produce a pair in vacuum.
 *
 * A photon arrives from the left. An animated attempt to split into
 * e⁺ + e⁻ is shown, ending in a red-X "forbidden" flash.
 *
 * Physics: the photon four-momentum has Minkowski norm zero (null).
 * The pair's four-momentum at threshold has norm (2 m_e c)² > 0.
 * The norm is Lorentz-invariant — no boost can change a null vector
 * into a timelike one. Hence γ → e⁺ + e⁻ is unconditionally forbidden
 * in vacuum, at any photon energy.
 *
 * Palette: amber for photon; cyan for e⁻; magenta for e⁺.
 */

import { useEffect, useRef, useState } from "react";

const WIDTH = 720;
const HEIGHT = 380;

type Phase = "approach" | "attempt" | "forbidden" | "reset";

export function WhySinglePhotonIsForbiddenScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("approach");
  const [phase, setPhase] = useState<Phase>("approach");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CY = HEIGHT / 2;
    const CENTER_X = WIDTH / 2;

    // Phase durations in frames at ~60fps
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
      // arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.moveTo(toX, toY);
      ctx!.lineTo(
        toX - 10 * Math.cos(angle - 0.4),
        toY - 10 * Math.sin(angle - 0.4),
      );
      ctx!.lineTo(
        toX - 10 * Math.cos(angle + 0.4),
        toY - 10 * Math.sin(angle + 0.4),
      );
      ctx!.closePath();
      ctx!.fill();
    }

    function drawPhoton(x: number, y: number, label: string) {
      // Wavy amber streak
      ctx!.save();
      ctx!.strokeStyle = "#FBBF24";
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
      // dot
      ctx!.fillStyle = "#FBBF24";
      ctx!.beginPath();
      ctx!.arc(x, y, 7, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "#FBBF24";
      ctx!.font = "bold 13px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(label, x, y - 14);
    }

    function drawParticle(
      x: number,
      y: number,
      label: string,
      color: string,
    ) {
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
      ctx!.fillStyle = "rgba(255,255,255,0.85)";
      ctx!.font = "14px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(
        "p²_photon = 0   ≠   (2mₑc)² = p²_pair",
        CENTER_X,
        HEIGHT - 70,
      );
      ctx!.fillStyle = "rgba(239,68,68,0.9)";
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
      ctx!.strokeStyle = "#EF4444";
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

      // Background
      ctx!.fillStyle = "#0A0C12";
      ctx!.fillRect(0, 0, WIDTH, HEIGHT);

      // Faint grid lines
      ctx!.strokeStyle = "rgba(255,255,255,0.04)";
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
        // Momentum arrow
        drawArrow(80, CY + 30, photonX - 20, CY + 30, "#FBBF24", 1.5);
        // Label: no rest frame
        ctx!.fillStyle = "rgba(255,255,255,0.4)";
        ctx!.font = "12px ui-monospace, monospace";
        ctx!.textAlign = "center";
        ctx!.fillText("photon has no rest frame: |p|c = E, m = 0", CENTER_X, 40);
      } else if (t < APPROACH_FRAMES + ATTEMPT_FRAMES) {
        currentPhase = "attempt";
        const progress = (t - APPROACH_FRAMES) / ATTEMPT_FRAMES;
        const spread = progress * 80;
        // Show e⁺ and e⁻ trying to emerge
        const alpha = progress;
        ctx!.save();
        ctx!.globalAlpha = alpha * 0.9;
        drawParticle(CENTER_X + spread, CY - spread * 0.5, "e⁺", "#FF6ADE");
        drawParticle(CENTER_X - spread, CY + spread * 0.5, "e⁻", "#67E8F9");
        // faint photon at center
        ctx!.globalAlpha = 1 - progress;
        drawPhoton(CENTER_X, CY, "γ");
        ctx!.restore();
      } else if (t < APPROACH_FRAMES + ATTEMPT_FRAMES + FORBIDDEN_FRAMES) {
        currentPhase = "forbidden";
        const progress = (t - APPROACH_FRAMES - ATTEMPT_FRAMES) / FORBIDDEN_FRAMES;
        // Show particles fading
        ctx!.save();
        ctx!.globalAlpha = 1 - progress * 0.6;
        drawParticle(CENTER_X + 80, CY - 40, "e⁺", "#FF6ADE");
        drawParticle(CENTER_X - 80, CY + 40, "e⁻", "#67E8F9");
        ctx!.restore();
        // Big red X
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

      // HUD
      ctx!.fillStyle = "rgba(255,255,255,0.55)";
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
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <p className="font-mono text-xs text-white/50">
        {phase === "approach" && "Photon approaching — null four-momentum, m = 0"}
        {phase === "attempt" && "Attempting γ → e⁺ + e⁻ in vacuum…"}
        {phase === "forbidden" && "FORBIDDEN — Minkowski norm 0 ≠ (2mₑc)²"}
        {phase === "reset" && "Resetting…"}
      </p>
    </div>
  );
}
