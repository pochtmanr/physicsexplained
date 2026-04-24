"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { pathLossDb } from "@/lib/physics/electromagnetism/antenna";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

const RATIO = 0.62;
const MAX_HEIGHT = 400;

const D_MIN = 1; // metres
const D_MAX = 1e5; // 100 km
const LOSS_MAX = 140; // dB
const LOSS_MIN = 20;

const F_FM = 100e6; // 100 MHz FM
const F_WIFI = 2.4e9; // 2.4 GHz Wi-Fi

/**
 * FIG.54c — free-space path loss, Friis equation.
 *
 *     FSPL(dB) = 20 · log₁₀(4π d / λ)
 *
 * Two curves on a log-distance axis: 100 MHz FM broadcast (λ = 3 m)
 * versus 2.4 GHz Wi-Fi (λ ≈ 12.5 cm). At any distance the Wi-Fi curve
 * sits about 27 dB above the FM curve — 20·log₁₀(24) — the penalty for
 * shorter wavelength. That is why FM covers a whole city from a single
 * tower and Wi-Fi barely reaches across a flat.
 *
 * A distance slider drags a vertical cursor across both curves; the HUD
 * reads the loss at that distance for each frequency. Tiny TX and RX
 * antenna icons at the edges of the plot show a fading amber power-arrow
 * that shrinks as distance grows.
 */
export function RadioPathLossScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });

  const [distanceM, setDistanceM] = useState(1000); // 1 km default
  const distanceRef = useRef(distanceM);
  useEffect(() => {
    distanceRef.current = distanceM;
  }, [distanceM]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const marginL = 54;
      const marginR = 22;
      const marginT = 32;
      const marginB = 50;
      const plotW = width - marginL - marginR;
      const plotH = height - marginT - marginB;

      const logD = (d: number) =>
        (Math.log10(d) - Math.log10(D_MIN)) /
        (Math.log10(D_MAX) - Math.log10(D_MIN));
      const xOfD = (d: number) => marginL + logD(d) * plotW;
      const yOfLoss = (loss: number) =>
        marginT +
        (1 - (loss - LOSS_MIN) / (LOSS_MAX - LOSS_MIN)) * plotH;

      // ── Grid: log-spaced vertical lines at every decade, horizontal every 20 dB ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let k = 0; k <= 5; k++) {
        const d = Math.pow(10, k); // 1, 10, 100, ... 1e5
        const x = xOfD(d);
        ctx.beginPath();
        ctx.moveTo(x, marginT);
        ctx.lineTo(x, marginT + plotH);
        ctx.stroke();
      }
      for (let loss = LOSS_MIN; loss <= LOSS_MAX; loss += 20) {
        const y = yOfLoss(loss);
        ctx.beginPath();
        ctx.moveTo(marginL, y);
        ctx.lineTo(marginL + plotW, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── Axis labels ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const distLabels = ["1 m", "10 m", "100 m", "1 km", "10 km", "100 km"];
      for (let k = 0; k <= 5; k++) {
        const d = Math.pow(10, k);
        ctx.fillText(distLabels[k] ?? "", xOfD(d), marginT + plotH + 14);
      }
      ctx.textAlign = "right";
      for (let loss = LOSS_MIN; loss <= LOSS_MAX; loss += 20) {
        ctx.fillText(`${loss} dB`, marginL - 6, yOfLoss(loss) + 3);
      }

      // ── Axes ──
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL, marginT);
      ctx.lineTo(marginL, marginT + plotH);
      ctx.lineTo(marginL + plotW, marginT + plotH);
      ctx.stroke();

      // ── Loss curves ──
      const lambdaFm = SPEED_OF_LIGHT / F_FM;
      const lambdaWifi = SPEED_OF_LIGHT / F_WIFI;

      const drawCurve = (lambda: number, color: string, widthPx: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = widthPx;
        ctx.beginPath();
        const N = 200;
        for (let i = 0; i < N; i++) {
          const d =
            Math.pow(
              10,
              Math.log10(D_MIN) + (i / (N - 1)) * (Math.log10(D_MAX) - Math.log10(D_MIN)),
            );
          const loss = pathLossDb(d, lambda);
          const clamped = Math.max(LOSS_MIN, Math.min(LOSS_MAX, loss));
          const x = xOfD(d);
          const y = yOfLoss(clamped);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawCurve(lambdaFm, "rgba(140, 240, 200, 0.95)", 2);
      drawCurve(lambdaWifi, "rgba(255, 180, 80, 0.95)", 2);

      // ── Cursor at current distance ──
      const d = distanceRef.current;
      const xc = xOfD(d);
      ctx.strokeStyle = "rgba(120, 220, 255, 0.8)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xc, marginT);
      ctx.lineTo(xc, marginT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      const lossFm = pathLossDb(d, lambdaFm);
      const lossWifi = pathLossDb(d, lambdaWifi);
      // Dots where cursor hits each curve
      ctx.fillStyle = "rgba(140, 240, 200, 1)";
      ctx.beginPath();
      ctx.arc(xc, yOfLoss(lossFm), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 180, 80, 1)";
      ctx.beginPath();
      ctx.arc(xc, yOfLoss(lossWifi), 4, 0, Math.PI * 2);
      ctx.fill();

      // ── Legend ──
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(140, 240, 200, 1)";
      ctx.fillText(
        `● 100 MHz FM   (λ ${(lambdaFm).toFixed(2)} m)  ${lossFm.toFixed(1)} dB`,
        marginL + 8,
        marginT + 14,
      );
      ctx.fillStyle = "rgba(255, 180, 80, 1)";
      ctx.fillText(
        `● 2.4 GHz Wi-Fi (λ ${(lambdaWifi * 1000).toFixed(0)} mm) ${lossWifi.toFixed(1)} dB`,
        marginL + 8,
        marginT + 28,
      );

      // ── Title ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("FSPL = 20 · log₁₀(4π d / λ)", 14, 18);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("free-space path loss (Friis)", width - 14, 18);

      // ── Tiny antenna icons + fading power arrow at bottom strip ──
      const iconY = marginT + plotH + 30;
      const iconTxX = marginL + 16;
      const iconRxX = marginL + plotW - 16;
      drawAntennaIcon(ctx, iconTxX, iconY, colors.fg1);
      drawAntennaIcon(ctx, iconRxX, iconY, colors.fg1);

      // Power arrow — fades with distance (use FM loss as visual proxy).
      const alpha = Math.max(
        0.1,
        1 - (lossFm - 30) / 60,
      );
      ctx.strokeStyle = `rgba(255, 180, 80, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(iconTxX + 10, iconY);
      ctx.lineTo(iconRxX - 10, iconY);
      ctx.stroke();
      // Arrow head
      ctx.fillStyle = `rgba(255, 180, 80, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(iconRxX - 10, iconY);
      ctx.lineTo(iconRxX - 16, iconY - 4);
      ctx.lineTo(iconRxX - 16, iconY + 4);
      ctx.closePath();
      ctx.fill();
    },
  });

  const formatDistance = (d: number) => {
    if (d >= 1000) return `${(d / 1000).toFixed(d >= 10000 ? 0 : 1)} km`;
    return `${d.toFixed(0)} m`;
  };

  // Log-mapped slider — 0..1000 → 1..1e5 m
  const sliderMin = 0;
  const sliderMax = 1000;
  const sliderValue = Math.round(
    ((Math.log10(distanceM) - Math.log10(D_MIN)) /
      (Math.log10(D_MAX) - Math.log10(D_MIN))) *
      sliderMax,
  );

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">distance</label>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={1}
          value={sliderValue}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            const d = Math.pow(
              10,
              Math.log10(D_MIN) +
                (v / sliderMax) * (Math.log10(D_MAX) - Math.log10(D_MIN)),
            );
            setDistanceM(d);
          }}
          className="flex-1 accent-[#8EE6B0]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {formatDistance(distanceM)}
        </span>
      </div>
    </div>
  );
}

function drawAntennaIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy);
  ctx.lineTo(cx + 5, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
