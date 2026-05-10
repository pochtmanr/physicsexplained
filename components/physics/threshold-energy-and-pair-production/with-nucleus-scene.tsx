"use client";

/**
 * FIG.20b — Pair production with a nucleus present.
 *
 * γ + nucleus → e⁺ + e⁻ + (recoiling nucleus)
 *
 * Palette: amber = photon; cyan = e⁻; magenta = e⁺; blue = nucleus.
 */

import { useEffect, useRef, useState } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

const THRESHOLD_MEV = 1.022;

export function WithNucleusScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const frameRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const [energyMeV, setEnergyMeV] = useState(1.2);
  const energyRef = useRef(1.2);

  useEffect(() => {
    energyRef.current = energyMeV;
  }, [energyMeV]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const WIDTH = width;
    const HEIGHT = height;
    const CY = HEIGHT / 2;
    const NUCLEUS_X = WIDTH / 2;
    const NUCLEUS_R = 18;

    function drawPhoton(x: number, y: number) {
      ctx!.save();
      ctx!.strokeStyle = tokens.amber;
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      for (let i = 0; i < 80; i++) {
        const px = x - 80 + i;
        const py = y + 5 * Math.sin(i * 0.42);
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.stroke();
      ctx!.fillStyle = tokens.amber;
      ctx!.beginPath();
      ctx!.arc(x, y, 6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawNucleus(x: number, y: number, label: string) {
      const grad = ctx!.createRadialGradient(x, y, 2, x, y, NUCLEUS_R);
      grad.addColorStop(0, tokens.blue);
      grad.addColorStop(1, tokens.purple);
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(x, y, NUCLEUS_R, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = tokens.panelBorder;
      ctx!.lineWidth = 1;
      ctx!.stroke();
      ctx!.fillStyle = tokens.textBright;
      ctx!.font = "bold 11px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(label, x, y);
      ctx!.textBaseline = "alphabetic";
    }

    function drawLepton(x: number, y: number, label: string, color: string) {
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, 8, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = color;
      ctx!.font = "bold 12px ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(label, x, y - 16);
    }

    function drawTrack(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: string,
    ) {
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 2;
      ctx!.setLineDash([6, 3]);
      ctx!.beginPath();
      ctx!.moveTo(x0, y0);
      ctx!.lineTo(x1, y1);
      ctx!.stroke();
      ctx!.setLineDash([]);
    }

    const PERIOD = 180;
    const CENTER_X = WIDTH / 2;

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

      const E = energyRef.current;
      const aboveThreshold = E >= THRESHOLD_MEV;
      const t = tRef.current % PERIOD;
      const progress = t / PERIOD;

      if (progress < 0.4) {
        const p = progress / 0.4;
        const photonX = 60 + p * (NUCLEUS_X - 60 - NUCLEUS_R - 20);
        drawPhoton(photonX, CY);
        drawNucleus(NUCLEUS_X, CY, "Z");

        const threshColor = aboveThreshold ? tokens.green : tokens.red;
        ctx!.fillStyle = threshColor;
        ctx!.font = "13px ui-monospace, monospace";
        ctx!.textAlign = "center";
        ctx!.fillText(
          `E = ${E.toFixed(3)} MeV  ${aboveThreshold ? "≥" : "<"}  E_th = 1.022 MeV`,
          CENTER_X,
          40,
        );
      } else if (progress < 0.6) {
        const flashP = (progress - 0.4) / 0.2;
        const flashAlpha = Math.sin(flashP * Math.PI);
        ctx!.save();
        ctx!.globalAlpha = flashAlpha * 0.6;
        ctx!.fillStyle = tokens.amber;
        ctx!.beginPath();
        ctx!.arc(NUCLEUS_X, CY, 40 + flashAlpha * 20, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
        drawNucleus(NUCLEUS_X, CY, "Z");
      } else {
        const p = (progress - 0.6) / 0.4;
        const nucRecoil = p * 60;
        drawNucleus(NUCLEUS_X + nucRecoil, CY + 10, "Z'");

        if (aboveThreshold) {
          const spread = p * 160;
          const tiltE = 20;
          drawTrack(
            NUCLEUS_X,
            CY,
            NUCLEUS_X + spread,
            CY - spread * 0.6 + tiltE,
            tokens.magenta,
          );
          drawTrack(
            NUCLEUS_X,
            CY,
            NUCLEUS_X - spread * 0.9,
            CY + spread * 0.55 + tiltE,
            tokens.cyan,
          );
          drawLepton(
            NUCLEUS_X + spread,
            CY - spread * 0.6 + tiltE,
            "e⁺",
            tokens.magenta,
          );
          drawLepton(
            NUCLEUS_X - spread * 0.9,
            CY + spread * 0.55 + tiltE,
            "e⁻",
            tokens.cyan,
          );
        } else {
          ctx!.strokeStyle = tokens.red;
          ctx!.lineWidth = 5;
          ctx!.lineCap = "round";
          const r = 22;
          ctx!.beginPath();
          ctx!.moveTo(NUCLEUS_X - r, CY - r);
          ctx!.lineTo(NUCLEUS_X + r, CY + r);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.moveTo(NUCLEUS_X + r, CY - r);
          ctx!.lineTo(NUCLEUS_X - r, CY + r);
          ctx!.stroke();
          ctx!.fillStyle = tokens.red;
          ctx!.font = "13px ui-monospace, monospace";
          ctx!.textAlign = "center";
          ctx!.fillText("below threshold — no pair", NUCLEUS_X, CY + 55);
        }
      }

      ctx!.fillStyle = tokens.textMute;
      ctx!.font = "12px ui-monospace, monospace";
      ctx!.textAlign = "left";
      ctx!.fillText(
        `amber = γ   |   blue = nucleus   |   cyan = e⁻   |   magenta = e⁺`,
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
      <label className="mt-3 flex w-full items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
        <span className="w-36">E_γ = {energyMeV.toFixed(3)} MeV</span>
        <input
          type="range"
          min={0.3}
          max={3.0}
          step={0.001}
          value={energyMeV}
          onChange={(e) => setEnergyMeV(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span
          style={{
            color: energyMeV >= THRESHOLD_MEV ? "var(--color-mint)" : "var(--color-red)",
          }}
        >
          {energyMeV >= THRESHOLD_MEV ? "above" : "below"} 1.022 MeV
        </span>
      </label>
    </div>
  );
}
