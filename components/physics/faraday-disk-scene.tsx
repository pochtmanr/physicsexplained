"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { faradayDiskEmf } from "@/lib/physics/electromagnetism/faradays-law";

/**
 * FIG.21c — Faraday's 1831 homopolar disk.
 *
 * A conducting disk of radius R rotates at angular speed ω in a
 * uniform axial magnetic field B (field *out of the page*, drawn as
 * dotted circles in the background). Charges in the disk move in
 * circles; the Lorentz force qv×B pushes positive charge radially —
 * inward or outward depending on the sign of ω and B. In steady
 * state, this sets up a radial EMF between the centre axle and the
 * rim.
 *
 *   EMF = ½ · B · ω · R²
 *
 * The disk is the first DC generator. A sliding brush at the rim and
 * a contact at the axle pick off the voltage; the scene draws both as
 * subtle taps connected to a voltmeter.
 *
 * Colour key:
 *   magenta `#FF6ADE`           — positive-charge accumulation (rim)
 *   cyan                        — negative-charge region (axle)
 *   amber   `#FFD66B`           — velocity vectors on the disk
 *   rgba(120,220,255,0.5)       — axial B-field (out of page, dots ⊙)
 *   rgba(120,255,170,0.9)       — induced radial-current arrows
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#7ADCFF";
const AMBER = "#FFD66B";
const INDUCED = "rgba(120, 255, 170, 0.95)";
const B_OUT = "rgba(120, 220, 255, 0.55)";

export function FaradayDiskScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });
  const [omega, setOmega] = useState(15); // rad/s
  const [B, setB] = useState(0.8); // tesla
  const [R, setR] = useState(0.2); // metres

  const phaseRef = useRef(0);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.64, 340), 460) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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

      phaseRef.current += omega * dt * 0.25; // slow the visual a bit

      const cx = width * 0.42;
      const cy = height * 0.52;
      const rPx = Math.min(width, height) * 0.32;

      // --- Axial B (out of the page) background: scattered ⊙ dots ---
      ctx.strokeStyle = B_OUT;
      ctx.fillStyle = B_OUT;
      ctx.lineWidth = 1;
      const gridStep = 36;
      for (let gx = 24; gx < width - 180; gx += gridStep) {
        for (let gy = 24; gy < height - 20; gy += gridStep) {
          const dd = Math.hypot(gx - cx, gy - cy);
          if (dd < rPx - 4) continue; // skip where the disk covers
          ctx.beginPath();
          ctx.arc(gx, gy, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(gx, gy, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Disk body ---
      const grad = ctx.createRadialGradient(cx, cy, rPx * 0.1, cx, cy, rPx);
      grad.addColorStop(0, "rgba(122, 220, 255, 0.18)");
      grad.addColorStop(1, "rgba(255, 106, 222, 0.18)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.stroke();

      // --- Velocity vectors on the rotating disk (amber) ---
      const spokeCount = 8;
      for (let i = 0; i < spokeCount; i++) {
        const a = (i / spokeCount) * Math.PI * 2 + phaseRef.current;
        for (let r = 0.35; r <= 0.85; r += 0.25) {
          const px = cx + Math.cos(a) * rPx * r;
          const py = cy + Math.sin(a) * rPx * r;
          // tangent direction (CCW if omega>0)
          const sgn = Math.sign(omega) || 1;
          const tx = -Math.sin(a) * sgn;
          const ty = Math.cos(a) * sgn;
          const arrowLen = 10 + 12 * r;
          drawArrow(ctx, px, py, tx, ty, arrowLen, "rgba(255, 214, 107, 0.55)");
        }
      }

      // --- Induced radial current arrows (green-cyan) ---
      // Sign: qv×B points radially. With B out of page and CCW motion (ω>0),
      // positive charges flow outward (rim = +). Flip the sign if either
      // reverses.
      const indDir = Math.sign(omega * B) || 1; // +1 ⇒ radially outward
      ctx.strokeStyle = INDUCED;
      ctx.fillStyle = INDUCED;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + phaseRef.current * 0.2;
        const rStart = rPx * 0.15;
        const rEnd = rPx * 0.9;
        const midR = (rStart + rEnd) / 2;
        const px = cx + Math.cos(a) * midR;
        const py = cy + Math.sin(a) * midR;
        // radial unit vector
        const rxHat = Math.cos(a) * indDir;
        const ryHat = Math.sin(a) * indDir;
        drawArrow(ctx, px, py, rxHat, ryHat, 18, INDUCED);
      }

      // --- Axle (centre contact) with − / + accumulation hints ---
      ctx.fillStyle = indDir > 0 ? CYAN : MAGENTA;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0E0F18";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(indDir > 0 ? "−" : "+", cx, cy);

      // Rim brush (top of disk)
      const brushX = cx + rPx + 8;
      const brushY = cy;
      ctx.fillStyle = indDir > 0 ? MAGENTA : CYAN;
      ctx.beginPath();
      ctx.arc(brushX, brushY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0E0F18";
      ctx.font = "bold 10px monospace";
      ctx.fillText(indDir > 0 ? "+" : "−", brushX, brushY);

      // --- Wires + voltmeter ---
      const voltX = width - 80;
      const voltY = 80;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(brushX + 6, brushY);
      ctx.lineTo(brushX + 40, brushY);
      ctx.lineTo(brushX + 40, voltY + 24);
      ctx.lineTo(voltX, voltY + 24);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy - 60);
      ctx.lineTo(voltX - 30, cy - 60);
      ctx.lineTo(voltX - 30, voltY + 24);
      ctx.stroke();
      // voltmeter body
      ctx.fillStyle = "rgba(14, 15, 24, 0.9)";
      ctx.strokeStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(voltX - 15, voltY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("V", voltX - 15, voltY);

      // --- HUD ---
      const emf = faradayDiskEmf(B, omega, R);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("EMF  =  ½ · B · ω · R²", pad, pad + 14);
      ctx.fillStyle = INDUCED;
      ctx.fillText(`     =  ${emf.toFixed(4)} V`, pad, pad + 30);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`B      =  ${B.toFixed(2)} T`, pad, pad + 54);
      ctx.fillText(`ω      =  ${omega.toFixed(1)} rad/s`, pad, pad + 70);
      ctx.fillText(`R      =  ${(R * 100).toFixed(1)} cm`, pad, pad + 86);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("B out of page · disk spins CCW", width - pad, pad + 14);

      // Right-hand-rule axes badge (bottom-left)
      drawRHRBadge(ctx, 24, height - 26, colors.fg2);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-4 px-2 font-mono text-xs text-[var(--color-fg-2)]">
        <label className="flex items-center gap-2">
          <span>ω = {omega.toFixed(1)} rad/s</span>
          <input
            type="range"
            min={-50}
            max={50}
            step={0.5}
            value={omega}
            onChange={(e) => setOmega(Number(e.target.value))}
            className="accent-[#FFD66B]"
          />
        </label>
        <label className="flex items-center gap-2">
          <span>B = {B.toFixed(2)} T</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={B}
            onChange={(e) => setB(Number(e.target.value))}
            className="accent-[rgba(120,220,255,0.9)]"
          />
        </label>
        <label className="flex items-center gap-2">
          <span>R = {(R * 100).toFixed(0)} cm</span>
          <input
            type="range"
            min={0.05}
            max={0.4}
            step={0.01}
            value={R}
            onChange={(e) => setR(Number(e.target.value))}
            className="accent-[#FF6ADE]"
          />
        </label>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const tipX = x + tx * len * 0.5;
  const tipY = y + ty * len * 0.5;
  const tailX = x - tx * len * 0.5;
  const tailY = y - ty * len * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const ang = Math.atan2(ty, tx);
  const head = 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(ang - Math.PI / 6),
    tipY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(ang + Math.PI / 6),
    tipY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  subdued: string,
) {
  ctx.save();
  ctx.strokeStyle = subdued;
  ctx.lineWidth = 1;
  drawArrow(ctx, cx + 8, cy, 1, 0, 16, subdued);
  drawArrow(ctx, cx, cy - 8, 0, -1, 16, subdued);
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 3, 9, 0.2, Math.PI * 1.6);
  ctx.stroke();
  ctx.font = "9px monospace";
  ctx.fillStyle = subdued;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("RHR", cx + 20, cy - 14);
  ctx.restore();
}
