"use client";

/**
 * FIG.20b — Pair production with a nucleus present.
 *
 * γ + nucleus → e⁺ + e⁻ + (recoiling nucleus)
 *
 * A photon comes from the left and strikes a stationary nucleus.
 * Below the 1.022 MeV threshold: the nucleus recoils but no pair appears.
 * Above threshold: e⁺ and e⁻ tracks emerge, slightly asymmetric because
 * the nucleus takes some recoil.
 *
 * The user can slide photon energy to explore the threshold.
 *
 * Palette: amber = photon; cyan = e⁻; magenta = e⁺; blue = nucleus.
 */

import { useEffect, useRef, useState } from "react";

const WIDTH = 720;
const HEIGHT = 380;

const THRESHOLD_MEV = 1.022;

export function WithNucleusScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CY = HEIGHT / 2;
    const NUCLEUS_X = WIDTH / 2;
    const NUCLEUS_R = 18;

    function drawPhoton(x: number, y: number) {
      ctx!.save();
      ctx!.strokeStyle = "#FBBF24";
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      for (let i = 0; i < 80; i++) {
        const px = x - 80 + i;
        const py = y + 5 * Math.sin(i * 0.42);
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.stroke();
      ctx!.fillStyle = "#FBBF24";
      ctx!.beginPath();
      ctx!.arc(x, y, 6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawNucleus(x: number, y: number, label: string) {
      // gradient fill for nucleus
      const grad = ctx!.createRadialGradient(x, y, 2, x, y, NUCLEUS_R);
      grad.addColorStop(0, "#60A5FA");
      grad.addColorStop(1, "#1D4ED8");
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(x, y, NUCLEUS_R, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "rgba(255,255,255,0.3)";
      ctx!.lineWidth = 1;
      ctx!.stroke();
      ctx!.fillStyle = "white";
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
      ctx!.fillStyle = "#0A0C12";
      ctx!.fillRect(0, 0, WIDTH, HEIGHT);

      // Grid
      ctx!.strokeStyle = "rgba(255,255,255,0.03)";
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

      // Phase: 0–0.4 = photon approach; 0.4–0.6 = collision; 0.6–1 = aftermath
      if (progress < 0.4) {
        // Photon approaching
        const p = progress / 0.4;
        const photonX = 60 + p * (NUCLEUS_X - 60 - NUCLEUS_R - 20);
        drawPhoton(photonX, CY);
        // Static nucleus
        drawNucleus(NUCLEUS_X, CY, "Z");

        // Threshold indicator
        const threshColor = aboveThreshold ? "#4ADE80" : "#EF4444";
        ctx!.fillStyle = threshColor;
        ctx!.font = "13px ui-monospace, monospace";
        ctx!.textAlign = "center";
        ctx!.fillText(
          `E = ${E.toFixed(3)} MeV  ${aboveThreshold ? "≥" : "<"}  E_th = 1.022 MeV`,
          CENTER_X,
          40,
        );
      } else if (progress < 0.6) {
        // Collision flash
        const flashP = (progress - 0.4) / 0.2;
        const flashAlpha = Math.sin(flashP * Math.PI);
        ctx!.save();
        ctx!.globalAlpha = flashAlpha * 0.6;
        ctx!.fillStyle = "#FBBF24";
        ctx!.beginPath();
        ctx!.arc(NUCLEUS_X, CY, 40 + flashAlpha * 20, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
        drawNucleus(NUCLEUS_X, CY, "Z");
      } else {
        // Aftermath
        const p = (progress - 0.6) / 0.4;
        const nucRecoil = p * 60; // nucleus recoils right
        drawNucleus(NUCLEUS_X + nucRecoil, CY + 10, "Z'");

        if (aboveThreshold) {
          // Pair emerging
          const spread = p * 160;
          const tiltE = 20; // slight asymmetry for realism
          drawTrack(
            NUCLEUS_X,
            CY,
            NUCLEUS_X + spread,
            CY - spread * 0.6 + tiltE,
            "#FF6ADE",
          );
          drawTrack(
            NUCLEUS_X,
            CY,
            NUCLEUS_X - spread * 0.9,
            CY + spread * 0.55 + tiltE,
            "#67E8F9",
          );
          drawLepton(
            NUCLEUS_X + spread,
            CY - spread * 0.6 + tiltE,
            "e⁺",
            "#FF6ADE",
          );
          drawLepton(
            NUCLEUS_X - spread * 0.9,
            CY + spread * 0.55 + tiltE,
            "e⁻",
            "#67E8F9",
          );
        } else {
          // No pair — show red X at vertex
          ctx!.strokeStyle = "#EF4444";
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
          ctx!.fillStyle = "#EF4444";
          ctx!.font = "13px ui-monospace, monospace";
          ctx!.textAlign = "center";
          ctx!.fillText("below threshold — no pair", NUCLEUS_X, CY + 55);
        }
      }

      // HUD
      ctx!.fillStyle = "rgba(255,255,255,0.5)";
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
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-36">E_γ = {energyMeV.toFixed(3)} MeV</span>
        <input
          type="range"
          min={0.3}
          max={3.0}
          step={0.001}
          value={energyMeV}
          onChange={(e) => setEnergyMeV(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span
          className={
            energyMeV >= THRESHOLD_MEV ? "text-green-400" : "text-red-400"
          }
        >
          {energyMeV >= THRESHOLD_MEV ? "above" : "below"} 1.022 MeV
        </span>
      </label>
    </div>
  );
}
