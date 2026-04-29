"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gamma } from "@/lib/physics/relativity/types";
import { contractedLength } from "@/lib/physics/relativity/length-contraction";

/**
 * FIG.07a — A rod of proper length L₀ moving longitudinally at βc.
 *
 *  • Top track (cyan): the rod in its own rest frame — proper length L₀,
 *    drawn at full extent. This is what the rod "is".
 *  • Bottom track (magenta): the same rod as the lab observer measures it,
 *    drawn at L₀/γ(β). The rod is animated drifting rightward at β.
 *  • A β-slider rules both. Endpoint worldlines are sketched in a small
 *    inset Minkowski diagram on the right: vertical in the rest frame,
 *    tilted in the lab frame, simultaneously sampled in the lab frame at
 *    smaller spatial separation.
 *
 * The rod is not warping or compressing physically. The lab observer is
 * simply marking the positions of its endpoints at the same lab-frame
 * instant; in the rod's frame, those two markings happened at different
 * times, and that's the entire content of length contraction.
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;

export function RodContractionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.6);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 720, height: 400 });
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

      const b = betaRef.current;
      const g = gamma(b);

      // Layout: split horizontally — left ~70% rod tracks; right ~30% inset.
      const splitX = Math.floor(width * 0.66);

      // Two horizontal tracks (rest frame on top, lab frame on bottom).
      const restY = height * 0.32;
      const labY = height * 0.72;

      const trackPad = 24;
      const trackLeft = trackPad;
      const trackRight = splitX - 12;
      const trackSpan = trackRight - trackLeft;

      // The rod's proper length in pixels — fix it at 70% of the track span
      // so contraction is visible without overflow.
      const restLenPx = trackSpan * 0.7;
      const labLenPx = restLenPx / g;

      // Rest-frame rod is centred and stationary. Lab-frame rod drifts
      // rightward at a paced visual speed proportional to β; wraps.
      const driftPxPerSec = b * trackSpan * 0.18;
      const driftDistance = (t * driftPxPerSec) % (trackSpan + labLenPx);

      // --- Rest-frame track ---
      // axis line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(trackLeft, restY);
      ctx.lineTo(trackRight, restY);
      ctx.stroke();
      // tick marks
      for (let i = 0; i <= 10; i++) {
        const x = trackLeft + (trackSpan * i) / 10;
        ctx.beginPath();
        ctx.moveTo(x, restY - 3);
        ctx.lineTo(x, restY + 3);
        ctx.stroke();
      }
      // rod (rest frame, cyan)
      const restLeft = trackLeft + (trackSpan - restLenPx) / 2;
      const restRight = restLeft + restLenPx;
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(restLeft, restY);
      ctx.lineTo(restRight, restY);
      ctx.stroke();
      // endpoints
      ctx.fillStyle = colors.cyan;
      ctx.beginPath();
      ctx.arc(restLeft, restY, 4, 0, Math.PI * 2);
      ctx.arc(restRight, restY, 4, 0, Math.PI * 2);
      ctx.fill();

      // L0 label
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("L₀", (restLeft + restRight) / 2, restY - 14);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("rest frame — rod at rest, proper length L₀", trackLeft, restY - 26);

      // --- Lab-frame track ---
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(trackLeft, labY);
      ctx.lineTo(trackRight, labY);
      ctx.stroke();
      for (let i = 0; i <= 10; i++) {
        const x = trackLeft + (trackSpan * i) / 10;
        ctx.beginPath();
        ctx.moveTo(x, labY - 3);
        ctx.lineTo(x, labY + 3);
        ctx.stroke();
      }
      // rod (lab frame, magenta) — drifting
      const labLeft0 = trackLeft + driftDistance - labLenPx;
      const labLeft = Math.max(trackLeft, labLeft0);
      const labRight = Math.min(trackRight, labLeft0 + labLenPx);
      if (labRight > labLeft) {
        ctx.strokeStyle = colors.magenta;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(labLeft, labY);
        ctx.lineTo(labRight, labY);
        ctx.stroke();
        // endpoints (only if visible)
        ctx.fillStyle = colors.magenta;
        if (labLeft0 >= trackLeft) {
          ctx.beginPath();
          ctx.arc(labLeft0, labY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        if (labLeft0 + labLenPx <= trackRight) {
          ctx.beginPath();
          ctx.arc(labLeft0 + labLenPx, labY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // L = L0/γ label centred on rod
      const cxLab = (labLeft + labRight) / 2;
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("L = L₀/γ", cxLab, labY - 14);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `lab frame — rod drifts at βc, measured length L₀/γ`,
        trackLeft,
        labY + 28,
      );

      // arrow showing motion direction
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cxLab + labLenPx / 2 + 14, labY);
      ctx.lineTo(cxLab + labLenPx / 2 + 28, labY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cxLab + labLenPx / 2 + 28, labY);
      ctx.lineTo(cxLab + labLenPx / 2 + 22, labY - 4);
      ctx.lineTo(cxLab + labLenPx / 2 + 22, labY + 4);
      ctx.closePath();
      ctx.fillStyle = colors.magenta;
      ctx.fill();

      // --- Right-side inset Minkowski diagram ---
      const insLeft = splitX + 12;
      const insRight = width - 12;
      const insTop = 20;
      const insBot = height - 28;
      const insW = insRight - insLeft;
      const insH = insBot - insTop;

      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(insLeft, insTop, insW, insH);

      // axes (lab frame: x to the right, ct upward).
      const ox = insLeft + insW * 0.18;
      const oy = insBot - 14;
      ctx.beginPath();
      ctx.moveTo(insLeft + 6, oy);
      ctx.lineTo(insRight - 6, oy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, insBot - 8);
      ctx.lineTo(ox, insTop + 8);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("x", insRight - 14, oy - 3);
      ctx.fillText("ct", ox + 4, insTop + 14);

      // Rod endpoint worldlines in lab frame: each tilts with slope
      // (ct/x) = 1/β. Endpoints separated by lab-frame distance L₀/γ at any
      // common ct.
      const xScale = insW * 0.55;
      const tScale = insH * 0.7;
      const labSepNorm = 1 / g; // normalised separation
      const slope = b > 0 ? 1 / b : Infinity;

      // Endpoint 1 worldline — passes through (0, 0)
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // parameterise by ct in [0, 1]
      const drawWorldline = (xOff: number) => {
        const x0 = ox + xOff * xScale;
        const y0 = oy;
        ctx.moveTo(x0, y0);
        // worldline: x = x0 + β·(ct), so dx_pixels = β · dct_pixels
        const dyTop = -tScale;
        const dxTop = isFinite(slope) ? (-dyTop) * b : 0;
        ctx.lineTo(x0 + dxTop * xScale * 0.5, y0 + dyTop);
      };

      drawWorldline(0);
      ctx.stroke();
      ctx.beginPath();
      drawWorldline(labSepNorm);
      ctx.stroke();

      // Lab simultaneity slice: a horizontal segment at some ct level,
      // demonstrating the rod is sampled here.
      const ctSliceY = oy - tScale * 0.55;
      const w0x = ox + 0 + (oy - ctSliceY) * b * (xScale / tScale);
      const w1x = ox + labSepNorm * xScale + (oy - ctSliceY) * b * (xScale / tScale);
      ctx.strokeStyle = colors.fg1;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w0x, ctSliceY);
      ctx.lineTo(w1x, ctSliceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // mark the slice endpoints
      ctx.fillStyle = colors.magenta;
      ctx.beginPath();
      ctx.arc(w0x, ctSliceY, 3, 0, Math.PI * 2);
      ctx.arc(w1x, ctSliceY, 3, 0, Math.PI * 2);
      ctx.fill();

      // label
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("endpoint worldlines", insLeft + 6, insTop + 12);
      ctx.fillText("·sampled at one lab time", insLeft + 6, insTop + 26);

      // --- Top-left HUD ---
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`β = ${b.toFixed(3)}`, 8, 16);
      ctx.fillText(`γ = ${g.toFixed(3)}`, 8, 30);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `L/L₀ = ${(contractedLength(1, b)).toFixed(3)}`,
        8,
        44,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
      <div className="mt-3 flex items-center gap-3 px-2 font-mono text-xs text-white/70">
        <label htmlFor="beta-rod" className="shrink-0">
          β = {beta.toFixed(3)}
        </label>
        <input
          id="beta-rod"
          type="range"
          min={0}
          max={0.99}
          step={0.001}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="w-full accent-[#FF6ADE]"
        />
      </div>
    </div>
  );
}
