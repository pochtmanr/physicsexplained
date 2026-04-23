"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { polarizationState } from "@/lib/physics/electromagnetism/plane-waves";

const RATIO = 0.52;
const MAX_HEIGHT = 420;

const MAGENTA = "rgba(255, 100, 200,";
const CYAN = "rgba(120, 220, 255,";
const GREEN = "rgba(120, 255, 170,";
const AMBER = "rgba(255, 180, 80,";

/**
 * FIG.39c — parameter-space tour of the Jones triple.
 *
 * The left panel is a 2D map with axes (|Ex|/|Ey|-ratio, phaseDelta):
 *   x-axis:  amplitude ratio r = |Ey| / |Ex|  ∈ [0, 2]
 *   y-axis:  phase delay δ                    ∈ [−π, π]
 *
 * The map is tinted in three regions — linear / elliptical / circular — by
 * calling `polarizationState` on a grid. Click anywhere on the map to set
 * the live point; the right panel animates the tip-of-E trajectory in the
 * transverse plane for that choice.
 *
 * This is the "map of polarisations" that §08.2 wraps up with — a single
 * diagram where every lockable-in-vacuum polarisation state lives.
 */
export function JonesVectorsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 380 });
  // The picked point in parameter space.
  const [ratio, setRatio] = useState(1); // |Ey| / |Ex|
  const [delta, setDelta] = useState(Math.PI / 2); // phase delay

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
    onFrame: (t) => {
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

      const padding = 16;
      const mapW = Math.min((width - padding * 3) * 0.55, width * 0.55);
      const mapH = height - padding * 2 - 24;
      const mapX0 = padding;
      const mapY0 = padding + 16;

      // ─── Parameter-space tinted map ──────────────────────────────────
      // We sample a coarse grid and paint small rects.
      const gridNx = 40;
      const gridNy = 28;
      const dx = mapW / gridNx;
      const dy = mapH / gridNy;
      for (let i = 0; i < gridNx; i++) {
        for (let j = 0; j < gridNy; j++) {
          const rSample = (i / (gridNx - 1)) * 2; // |Ey| / |Ex|
          const dSample = ((j / (gridNy - 1)) - 0.5) * 2 * Math.PI;
          // Ex = 1, Ey = rSample
          const state = polarizationState({
            Ex_amplitude: 1,
            Ey_amplitude: rSample,
            phaseDelta: dSample,
            tol: 0.08, // visual bucketing tolerance
          });
          let fill: string;
          if (state === "linear") fill = `${MAGENTA} 0.18)`;
          else if (state === "circular") fill = `${GREEN} 0.28)`;
          else fill = `${AMBER} 0.10)`;
          ctx.fillStyle = fill;
          ctx.fillRect(mapX0 + i * dx, mapY0 + j * dy, dx + 0.5, dy + 0.5);
        }
      }

      // Border
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(mapX0, mapY0, mapW, mapH);

      // Axes labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("|Ey| / |Ex|", mapX0 + mapW / 2, mapY0 + mapH + 14);
      ctx.save();
      ctx.translate(mapX0 - 4, mapY0 + mapH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("phase δ", 0, 0);
      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillText("0", mapX0 + 2, mapY0 + mapH + 14);
      ctx.textAlign = "right";
      ctx.fillText("2", mapX0 + mapW - 2, mapY0 + mapH + 14);
      ctx.textAlign = "left";
      ctx.fillText("−π", mapX0 + 4, mapY0 + mapH - 4);
      ctx.fillText("+π", mapX0 + 4, mapY0 + 12);
      ctx.fillText("0", mapX0 + 4, mapY0 + mapH / 2 + 4);

      // Guide lines: δ = 0 (linear horizontal), δ = ±π/2 (circular ridges).
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 3]);
      for (const dLine of [-Math.PI / 2, 0, Math.PI / 2]) {
        const py = mapY0 + mapH * (1 - (dLine + Math.PI) / (2 * Math.PI));
        ctx.beginPath();
        ctx.moveTo(mapX0, py);
        ctx.lineTo(mapX0 + mapW, py);
        ctx.stroke();
      }
      // Vertical guide at r = 1 (equal amplitudes).
      ctx.beginPath();
      ctx.moveTo(mapX0 + mapW / 2, mapY0);
      ctx.lineTo(mapX0 + mapW / 2, mapY0 + mapH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live point marker
      const markerX = mapX0 + (ratio / 2) * mapW;
      const markerY = mapY0 + mapH * (1 - (delta + Math.PI) / (2 * Math.PI));
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Legend
      const legendX = mapX0;
      const legendY = mapY0 - 8;
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.fillText("linear", legendX, legendY);
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.fillText("elliptical", legendX + 60, legendY);
      ctx.fillStyle = `${GREEN} 0.95)`;
      ctx.fillText("circular", legendX + 140, legendY);

      // ─── Transverse-plane preview on the right ───────────────────────
      const prevX0 = mapX0 + mapW + padding;
      const prevY0 = mapY0;
      const prevW = width - prevX0 - padding;
      const prevH = mapH;
      const prevCx = prevX0 + prevW / 2;
      const prevCy = prevY0 + prevH / 2;
      const R = Math.min(prevW, prevH) * 0.42;

      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(prevX0, prevY0, prevW, prevH);

      // Transverse axes
      ctx.strokeStyle = `${MAGENTA} 0.4)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(prevCx - R, prevCy);
      ctx.lineTo(prevCx + R, prevCy);
      ctx.stroke();
      ctx.strokeStyle = `${CYAN} 0.4)`;
      ctx.beginPath();
      ctx.moveTo(prevCx, prevCy - R);
      ctx.lineTo(prevCx, prevCy + R);
      ctx.stroke();

      ctx.fillStyle = `${MAGENTA} 0.8)`;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Ex", prevCx + R + 4, prevCy + 3);
      ctx.fillStyle = `${CYAN} 0.8)`;
      ctx.textAlign = "center";
      ctx.fillText("Ey", prevCx, prevCy - R - 4);

      // Normalise amplitudes so that max(|Ex|, |Ey|) = 1.
      const rawEx = 1;
      const rawEy = ratio;
      const ampMax = Math.max(rawEx, rawEy) || 1;
      const Ax = (rawEx / ampMax) * R * 0.75;
      const Ay = (rawEy / ampMax) * R * 0.75;

      // Draw the ellipse traced over one full period.
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const nPts = 90;
      for (let i = 0; i <= nPts; i++) {
        const ph = (i / nPts) * 2 * Math.PI;
        const ex = Ax * Math.cos(ph);
        const ey = Ay * Math.cos(ph + delta);
        const px = prevCx + ex;
        const py = prevCy - ey;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Live tip arrow
      const phLive = t * 2.0;
      const exLive = Ax * Math.cos(phLive);
      const eyLive = Ay * Math.cos(phLive + delta);
      const tipX = prevCx + exLive;
      const tipY = prevCy - eyLive;
      ctx.strokeStyle = `${MAGENTA} 0.95)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(prevCx, prevCy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // State label
      const state = polarizationState({
        Ex_amplitude: rawEx,
        Ey_amplitude: rawEy,
        phaseDelta: delta,
        tol: 0.02,
      });
      const stateColor =
        state === "linear"
          ? `${MAGENTA} 0.95)`
          : state === "circular"
            ? `${GREEN} 0.95)`
            : `${AMBER} 0.95)`;
      ctx.fillStyle = stateColor;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `state: ${state.toUpperCase()}`,
        prevCx,
        prevY0 + prevH - 6,
      );

      // Caption
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        "FIG.39c · click the map to set the polarisation state",
        12,
        12,
      );
    },
  });

  const handleClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;
    const padding = 16;
    const mapW = Math.min((size.width - padding * 3) * 0.55, size.width * 0.55);
    const mapH = size.height - padding * 2 - 24;
    const mapX0 = padding;
    const mapY0 = padding + 16;
    if (
      px >= mapX0 &&
      px <= mapX0 + mapW &&
      py >= mapY0 &&
      py <= mapY0 + mapH
    ) {
      const r = ((px - mapX0) / mapW) * 2;
      const d = (1 - (py - mapY0) / mapH) * 2 * Math.PI - Math.PI;
      setRatio(Math.max(0, Math.min(2, r)));
      setDelta(Math.max(-Math.PI, Math.min(Math.PI, d)));
    }
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width: size.width, height: size.height, cursor: "crosshair" }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setRatio(1);
            setDelta(0);
          }}
        >
          linear 45°
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,255,170)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setRatio(1);
            setDelta(Math.PI / 2);
          }}
        >
          right-circular
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,255,170)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setRatio(1);
            setDelta(-Math.PI / 2);
          }}
        >
          left-circular
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,180,80)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setRatio(0.5);
            setDelta(Math.PI / 2);
          }}
        >
          elliptical
        </button>
      </div>
    </div>
  );
}
