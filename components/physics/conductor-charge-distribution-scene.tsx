"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

// Discretise the blob's outline into N samples. Each sample carries a
// signed "induced charge" weight that depends on the relative direction
// from the sample point to the external positive charge — more negative
// where the blob faces the charge, slightly positive on the far side.
const N_SAMPLES = 90;

/**
 * An irregular blob-shaped conductor with a positive point charge on the
 * right. Drag the slider to bring the charge closer or pull it away. The
 * blob's surface charge distribution shifts: the near face turns strongly
 * negative, the far face mildly positive (the conductor's net charge is
 * still zero — only its arrangement has changed). Density is shaded along
 * the rim and the strongest sites are tagged with ± symbols.
 */
export function ConductorChargeDistributionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  // Distance is in canvas-pixel space relative to the blob centre.
  const [distance, setDistance] = useState(180);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Build the blob outline once — a perturbed circle, deterministic.
  const blobRef = useRef<{ x: number; y: number }[]>([]);
  if (blobRef.current.length === 0) {
    const baseR = 78;
    const samples: { x: number; y: number }[] = [];
    for (let i = 0; i < N_SAMPLES; i++) {
      const theta = (i / N_SAMPLES) * Math.PI * 2;
      // Smooth, low-frequency lumps
      const r =
        baseR *
        (1 +
          0.18 * Math.sin(2 * theta + 0.4) +
          0.12 * Math.sin(3 * theta + 1.7) +
          0.06 * Math.sin(5 * theta - 0.9));
      samples.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    blobRef.current = samples;
  }

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

      // Blob centred on the left third
      const blobCx = width * 0.36;
      const blobCy = height / 2;
      const samples = blobRef.current;

      // External point charge sits to the right of the blob centre.
      // distance is the px gap; clamp so it never overlaps the blob.
      const minGap = 110;
      const maxGap = Math.min(width - blobCx - 30, 320);
      const dist = Math.max(minGap, Math.min(maxGap, distance));
      const chargeX = blobCx + dist;
      const chargeY = blobCy;

      // ── Compute induced "weight" w_i for each sample point ──
      // Heuristic: w_i ∝ −cos(angle between outward normal and direction-from
      // -sample-to-charge) / r_i².  The minus sign makes the side facing the
      // positive charge negative (electrons accumulate there).
      const weights = new Array<number>(samples.length).fill(0);
      let wMax = 0;
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const sx = blobCx + s.x;
        const sy = blobCy + s.y;
        // Outward radial direction (good enough for a smoothly perturbed disc)
        const nLen = Math.hypot(s.x, s.y);
        const nx = s.x / nLen;
        const ny = s.y / nLen;
        // Vector from this surface point to the external charge
        const dx = chargeX - sx;
        const dy = chargeY - sy;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);
        const cosTheta = (nx * dx + ny * dy) / r;
        // Negative on near face (cos > 0 there) — multiply by −1
        weights[i] = (-cosTheta / r2) * 1e4;
        if (Math.abs(weights[i]!) > wMax) wMax = Math.abs(weights[i]!);
      }
      // Normalise to [-1, 1]
      if (wMax > 0) {
        for (let i = 0; i < weights.length; i++) weights[i]! /= wMax;
      }

      // ── Draw faint blob fill ──
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const px = blobCx + s.x;
        const py = blobCy + s.y;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(86, 104, 127, 0.10)";
      ctx.fill();

      // ── Draw the rim as short coloured segments shaded by |w_i| ──
      ctx.lineWidth = 6;
      for (let i = 0; i < samples.length; i++) {
        const s0 = samples[i]!;
        const s1 = samples[(i + 1) % samples.length]!;
        const w = (weights[i]! + weights[(i + 1) % samples.length]!) / 2;
        const mag = Math.min(1, Math.abs(w));
        const alpha = 0.18 + 0.75 * mag;
        const colour =
          w < 0
            ? `rgba(111, 184, 198, ${alpha})` // negative — cyan
            : `rgba(255, 106, 222, ${alpha})`; // positive — magenta
        ctx.strokeStyle = colour;
        ctx.beginPath();
        ctx.moveTo(blobCx + s0.x, blobCy + s0.y);
        ctx.lineTo(blobCx + s1.x, blobCy + s1.y);
        ctx.stroke();
      }

      // Thin outline on top for a clean silhouette
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.fg2;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const px = blobCx + s.x;
        const py = blobCy + s.y;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // ── Place ± labels at the strongest negative + positive sample ──
      let iMin = 0;
      let iMax = 0;
      for (let i = 1; i < weights.length; i++) {
        if (weights[i]! < weights[iMin]!) iMin = i;
        if (weights[i]! > weights[iMax]!) iMax = i;
      }
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelN = samples[iMin]!;
      const labelP = samples[iMax]!;
      ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
      ctx.fillText("−", blobCx + labelN.x * 1.18, blobCy + labelN.y * 1.18);
      ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
      ctx.fillText("+", blobCx + labelP.x * 1.18, blobCy + labelP.y * 1.18);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      // ── External point charge ──
      ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(chargeX, chargeY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#07090E";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", chargeX, chargeY + 1);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.fillText("conductor (net charge = 0)", 12, 18);
      ctx.textAlign = "right";
      ctx.fillText(`distance = ${dist.toFixed(0)} px`, width - 12, 18);
      ctx.fillText(
        `σ_max ∝ 1/r² (closer = sharper)`,
        width - 12,
        36,
      );
      ctx.textAlign = "left";
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2 font-mono text-xs">
        <label className="flex items-center gap-2 text-[var(--color-fg-1)]">
          <span>charge distance</span>
          <input
            type="range"
            min={110}
            max={320}
            step={2}
            value={distance}
            onChange={(e) => setDistance(parseInt(e.target.value, 10))}
            className="w-44 accent-[#FF6ADE]"
          />
        </label>
        <span className="text-[var(--color-fg-3)]">
          drag closer — induced − piles up on the near face
        </span>
      </div>
    </div>
  );
}
