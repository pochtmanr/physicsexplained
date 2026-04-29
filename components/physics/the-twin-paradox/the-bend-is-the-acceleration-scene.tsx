"use client";

import { useEffect, useRef, useState } from "react";

/**
 * §03.5 THE BEND IS THE ACCELERATION — annotated zoom on the turnaround.
 *
 * A close-up Minkowski (x, ct) plot focused on the turnaround event of the
 * traveling twin. The kink is labeled. The scene's caption: this is the
 * only place in the trip where the twins' frames differ in any meaningful
 * way; everything else is symmetric. The asymmetry is the geometry of the
 * kink, not a force.
 *
 * Slider: turnaround "softening" radius. The kink can be drawn as a sharp
 * corner (idealised) or a finite arc (physical, what you'd get for any real
 * acceleration phase). The proper-time accumulated along the smoothed corner
 * is *less* than along a straight line of the same chord — the bend itself
 * doesn't add proper time, it loses it. The slider lets the reader watch
 * the corner soften without changing the shorter-path conclusion.
 */

const WIDTH = 560;
const HEIGHT = 420;
const PAD = 36;

export function TheBendIsTheAccelerationScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // softening radius in (x, ct) units; 0 = sharp corner.
  const [softening, setSoftening] = useState(0);

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
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Plot region. We zoom on the turnaround at (x = 1.6, ct = 2).
    // X axis from -0.5 to 2.5; ct from 0 to 4.
    const xRange: [number, number] = [-0.5, 2.5];
    const tRange: [number, number] = [0, 4];
    const plotW = WIDTH - 2 * PAD;
    const plotH = HEIGHT - 2 * PAD;
    const xToPx = (x: number) =>
      PAD + ((x - xRange[0]) / (xRange[1] - xRange[0])) * plotW;
    const tToPx = (t: number) =>
      HEIGHT - PAD - ((t - tRange[0]) / (tRange[1] - tRange[0])) * plotH;

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xRange[0]); x <= Math.floor(xRange[1]); x++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(x), tToPx(tRange[0]));
      ctx.lineTo(xToPx(x), tToPx(tRange[1]));
      ctx.stroke();
    }
    for (let t = Math.ceil(tRange[0]); t <= Math.floor(tRange[1]); t++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(xRange[0]), tToPx(t));
      ctx.lineTo(xToPx(xRange[1]), tToPx(t));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(tRange[0]));
    ctx.lineTo(xToPx(0), tToPx(tRange[1]));
    ctx.moveTo(xToPx(xRange[0]), tToPx(0));
    ctx.lineTo(xToPx(xRange[1]), tToPx(0));
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("x", xToPx(xRange[1]) - 12, tToPx(0) - 6);
    ctx.fillText("ct", xToPx(0) + 6, tToPx(tRange[1]) + 12);

    // Home twin (cyan) — vertical
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(0), tToPx(4));
    ctx.stroke();
    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("home", xToPx(0) - 38, tToPx(3.5));

    // Traveler (orange): outbound (0,0) → turnaround (1.6, 2) → inbound (0, 4).
    // If softening > 0, replace the sharp corner with a quadratic Bezier whose
    // control point is the turnaround event itself.
    const turnaroundX = 1.6;
    const turnaroundT = 2;
    const r = Math.max(0, Math.min(0.9, softening));
    // Choose endpoints of the soft corner along each leg, distance r from the
    // turnaround in the (x, ct) plane.
    const legLen = Math.sqrt(turnaroundX * turnaroundX + turnaroundT * turnaroundT);
    const fr = r / legLen; // fractional offset along each leg
    const aX = turnaroundX * (1 - fr);
    const aT = turnaroundT * (1 - fr);
    const bX = turnaroundX * (1 - fr);
    const bT = turnaroundT * (1 + fr);

    ctx.strokeStyle = "#FFB36B";
    ctx.lineWidth = 2.75;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(aX), tToPx(aT));
    if (r > 1e-3) {
      ctx.quadraticCurveTo(
        xToPx(turnaroundX),
        tToPx(turnaroundT),
        xToPx(bX),
        tToPx(bT),
      );
    } else {
      ctx.lineTo(xToPx(turnaroundX), tToPx(turnaroundT));
    }
    ctx.lineTo(xToPx(0), tToPx(4));
    ctx.stroke();
    ctx.fillStyle = "#FFB36B";
    ctx.fillText("traveler", xToPx(turnaroundX) + 8, tToPx(turnaroundT));

    // Reunion + start dots
    ctx.fillStyle = "#FFFFFF";
    for (const ev of [
      { x: 0, t: 0, label: "departure" },
      { x: 0, t: 4, label: "reunion" },
    ]) {
      ctx.beginPath();
      ctx.arc(xToPx(ev.x), tToPx(ev.t), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(ev.label, xToPx(ev.x) + 8, tToPx(ev.t) + 4);
      ctx.fillStyle = "#FFFFFF";
    }

    // Annotation arrow pointing at the kink
    const kinkPx = xToPx(turnaroundX);
    const kinkPy = tToPx(turnaroundT);
    ctx.strokeStyle = "rgba(255, 214, 107, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const labelX = kinkPx + 90;
    const labelY = kinkPy - 10;
    ctx.moveTo(labelX, labelY);
    ctx.lineTo(kinkPx + 12, kinkPy - 4);
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(kinkPx + 12, kinkPy - 4);
    ctx.lineTo(kinkPx + 20, kinkPy - 12);
    ctx.moveTo(kinkPx + 12, kinkPy - 4);
    ctx.lineTo(kinkPx + 22, kinkPy - 2);
    ctx.stroke();

    ctx.fillStyle = "#FFD66B";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("THE BEND", labelX + 4, labelY - 4);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("= acceleration", labelX + 4, labelY + 10);
    ctx.fillText("= the asymmetry", labelX + 4, labelY + 22);

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `softening radius r = ${r.toFixed(2)}`,
      PAD,
      HEIGHT - 10,
    );
  }, [softening]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      <label className="flex w-full max-w-[560px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-32">corner radius r</span>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.01}
          value={softening}
          onChange={(e) => setSoftening(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-16">{softening.toFixed(2)}</span>
      </label>
      <p className="max-w-[560px] text-center font-mono text-[11px] text-white/50">
        The bend is the only frame-asymmetric event in the round trip. Soften
        the corner — the kink remains a kink. The geometry is what aged the
        traveler less, not a force.
      </p>
    </div>
  );
}
