"use client";

import { useEffect, useRef, useState } from "react";
import { tPrimeDifference } from "@/lib/physics/relativity/simultaneity";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * FIG.05c — Three observers, one slider.
 *
 * Two events A and B, simultaneous in the lab frame, separated by L = 600 m
 * along x. Three observers:
 *
 *   • cyan stationary observer (β = 0):    A and B simultaneous.
 *   • magenta toward-A observer (β = -|s|): sees A first.
 *   • amber toward-B observer (β = +|s|):   sees B first.
 *
 * The slider drives |s| from 0 → 0.95. Each observer's strip shows two
 * markers placed by the actual t' values from `tPrimeDifference`.
 *
 * The bottom-of-canvas conclusion text fades in as |β| crosses 0.05:
 *   "There is no privileged 'now' extending across space."
 */

const W = 720;
const H = 360;
const L = 600; // meters between events along x
const T_MAX_FRAMING = (1.05 * L) / SPEED_OF_LIGHT; // domain for the strip mapping

export function SimultaneitySliderScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Common strip layout: time axis maps from -T_MAX to +T_MAX onto the strip.
    const stripX0 = 130;
    const stripX1 = W - 50;
    const stripW = stripX1 - stripX0;
    const cxStrip = stripX0 + stripW / 2;
    const tToFraction = (t: number) =>
      Math.max(-1, Math.min(1, t / T_MAX_FRAMING));
    const tToPx = (t: number) => cxStrip + tToFraction(t) * (stripW / 2);

    // Observer mappings. Events A at x = 0, B at x = +L, both at t = 0 (lab).
    type ObserverRow = {
      label: string;
      betaUsed: number;
      color: string;
      y: number;
      conclusion: string;
    };
    const observers: ObserverRow[] = [
      {
        label: "stationary",
        betaUsed: 0,
        color: "#67E8F9",
        y: 110,
        conclusion: "A and B simultaneous",
      },
      {
        label: "toward A",
        betaUsed: -Math.abs(beta),
        color: "#FF6ADE",
        y: 180,
        conclusion: "A first",
      },
      {
        label: "toward B",
        betaUsed: +Math.abs(beta),
        color: "#FFD66B",
        y: 250,
        conclusion: "B first",
      },
    ];

    // Headers
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "13px ui-monospace, monospace";
    ctx.fillText("Three observers, one pair of events", 12, 28);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `A at x = 0,  B at x = ${L} m,  both at t = 0 (lab frame).  |β| = ${Math.abs(beta).toFixed(2)}`,
      12,
      46,
    );

    // Time axis label
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("← earlier   t' (each observer's frame)   later →", stripX0, 70);

    // Center reference line
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(cxStrip, 90);
    ctx.lineTo(cxStrip, 280);
    ctx.stroke();
    ctx.setLineDash([]);

    // Each observer row
    for (const obs of observers) {
      // Strip line
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(stripX0, obs.y);
      ctx.lineTo(stripX1, obs.y);
      ctx.stroke();

      // Label
      ctx.fillStyle = obs.color;
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillText(obs.label, 12, obs.y - 4);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(`β = ${obs.betaUsed.toFixed(2)}`, 12, obs.y + 12);

      // Compute t'_A and t'_B in this observer's frame using the lab event
      // pair (A at (0,0), B at (0, L)). Reference event = A.
      // tPrimeDifference returns t1' − t2'; we compute each individually
      // by setting the second arg to (0, 0) for "subtract A".
      const dtA = tPrimeDifference(0, 0, 0, 0, obs.betaUsed); // = 0
      const dtB = tPrimeDifference(0, L, 0, 0, obs.betaUsed); // = γ ( -β L / c )

      // Draw markers for A and B on the strip
      const drawMark = (
        t: number,
        label: string,
        markerColor: string,
      ) => {
        const px = tToPx(t);
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.arc(px, obs.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(label, px - 3, obs.y - 10);
      };
      drawMark(dtA, "A", "#67E8F9");
      drawMark(dtB, "B", "#FFD66B");

      // Conclusion text (right-aligned at end of row)
      const concText =
        obs.betaUsed === 0
          ? obs.conclusion
          : Math.abs(beta) < 0.02
            ? obs.conclusion + " (≈ simultaneous)"
            : obs.conclusion;
      ctx.fillStyle = obs.color;
      ctx.font = "11px ui-monospace, monospace";
      const tw = ctx.measureText(concText).width;
      ctx.fillText(concText, stripX1 - tw, obs.y + 22);
    }

    // Bottom conclusion (fades in past |β| > 0.05)
    const opacity = Math.min(1, Math.max(0, (Math.abs(beta) - 0.05) / 0.15));
    ctx.fillStyle = `rgba(255, 214, 107, ${opacity})`;
    ctx.font = 'italic 13px ui-monospace, monospace';
    const conclusion = "There is no privileged 'now' extending across space.";
    const cwidth = ctx.measureText(conclusion).width;
    ctx.fillText(conclusion, (W - cwidth) / 2, H - 24);
  }, [beta]);

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span>|β| = {Math.abs(beta).toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={Math.abs(beta)}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
      </label>
    </div>
  );
}
