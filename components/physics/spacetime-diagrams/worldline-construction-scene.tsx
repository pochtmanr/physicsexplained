"use client";

import { useEffect, useRef, useState } from "react";

/**
 * §03.1 WORLDLINE CONSTRUCTION — interactive: click on the diagram to add
 * events; the scene draws straight-line segments between consecutive clicks
 * and reports the slope of each segment as β = dx / d(ct).
 *
 * Pedagogy: the reader builds a piecewise-linear worldline by clicking and
 * watches the slope of each segment numerically. A vertical click pair gives
 * β = 0 (stationary). A 45° pair gives β = ±1 (light-speed). Subluminal
 * worldlines stay between 45° lines — and the scene flashes a red border on
 * the offending segment if the user constructs a superluminal one.
 *
 * Custom Canvas 2D — does not use SpacetimeDiagramCanvas because we need
 * mouse-event handling on the canvas itself.
 */

interface Event {
  /** ct (vertical), in plot units. */
  ct: number;
  /** x (horizontal), in plot units. */
  x: number;
}

const WIDTH = 520;
const HEIGHT = 420;
const MARGIN = 36;
const X_RANGE: [number, number] = [-2.5, 2.5];
const T_RANGE: [number, number] = [0, 4];

export function WorldlineConstructionScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // Pixel <-> world transforms
  const plotW = WIDTH - 2 * MARGIN;
  const plotH = HEIGHT - 2 * MARGIN;
  const xToPx = (x: number) =>
    MARGIN + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * plotW;
  const tToPx = (t: number) =>
    HEIGHT - MARGIN - ((t - T_RANGE[0]) / (T_RANGE[1] - T_RANGE[0])) * plotH;
  const pxToX = (px: number) =>
    X_RANGE[0] + ((px - MARGIN) / plotW) * (X_RANGE[1] - X_RANGE[0]);
  const pxToT = (py: number) =>
    T_RANGE[0] + ((HEIGHT - MARGIN - py) / plotH) * (T_RANGE[1] - T_RANGE[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = Math.ceil(X_RANGE[0]); x <= Math.floor(X_RANGE[1]); x++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(x), tToPx(T_RANGE[0]));
      ctx.lineTo(xToPx(x), tToPx(T_RANGE[1]));
      ctx.stroke();
    }
    for (let t = Math.ceil(T_RANGE[0]); t <= Math.floor(T_RANGE[1]); t++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(X_RANGE[0]), tToPx(t));
      ctx.lineTo(xToPx(X_RANGE[1]), tToPx(t));
      ctx.stroke();
    }

    // Lab axes
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(T_RANGE[0]));
    ctx.lineTo(xToPx(0), tToPx(T_RANGE[1]));
    ctx.moveTo(xToPx(X_RANGE[0]), tToPx(0));
    ctx.lineTo(xToPx(X_RANGE[1]), tToPx(0));
    ctx.stroke();

    // Light cone (ct = ±x from origin)
    ctx.strokeStyle = "#FFD66B";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(xToPx(X_RANGE[0]), tToPx(-X_RANGE[0]));
    ctx.lineTo(xToPx(X_RANGE[1]), tToPx(X_RANGE[1]));
    ctx.moveTo(xToPx(X_RANGE[0]), tToPx(X_RANGE[0]));
    ctx.lineTo(xToPx(X_RANGE[1]), tToPx(-X_RANGE[1]));
    ctx.stroke();
    ctx.setLineDash([]);

    // Worldline segments — color by causality: cyan if subluminal, red if superluminal.
    for (let i = 0; i < events.length - 1; i++) {
      const p1 = events[i];
      const p2 = events[i + 1];
      const dct = p2.ct - p1.ct;
      const dx = p2.x - p1.x;
      const slope = dct === 0 ? Infinity : dx / dct;
      const superluminal = Math.abs(slope) > 1;
      ctx.strokeStyle = superluminal ? "#F87171" : "#67E8F9";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xToPx(p1.x), tToPx(p1.ct));
      ctx.lineTo(xToPx(p2.x), tToPx(p2.ct));
      ctx.stroke();
    }

    // Event dots
    for (const ev of events) {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(xToPx(ev.x), tToPx(ev.ct), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("x", xToPx(X_RANGE[1]) - 14, tToPx(0) - 6);
    ctx.fillText("ct", xToPx(0) + 6, tToPx(T_RANGE[1]) + 14);
  }, [events, xToPx, tToPx]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = pxToX(px);
    const ct = pxToT(py);
    if (x < X_RANGE[0] || x > X_RANGE[1] || ct < T_RANGE[0] || ct > T_RANGE[1]) {
      return;
    }
    setEvents((prev) => [...prev, { x, ct }]);
  }

  function handleClear() {
    setEvents([]);
  }

  // Compute slopes for the HUD readout.
  const segments = events.slice(1).map((p2, i) => {
    const p1 = events[i];
    const dct = p2.ct - p1.ct;
    const dx = p2.x - p1.x;
    const slope = dct === 0 ? Infinity : dx / dct;
    return { i, slope };
  });

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-crosshair rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex items-center justify-between gap-3 font-mono text-xs text-white/70">
        <span>
          click to add events · {events.length} placed · 45° lines = light cone
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="rounded border border-white/20 bg-white/5 px-3 py-1 text-white/80 transition hover:bg-white/10"
        >
          clear
        </button>
      </div>
      {segments.length > 0 ? (
        <div className="rounded-md border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-white/80">
          <div className="mb-1 text-white/60">SEGMENT SLOPES (= β = v/c)</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
            {segments.map(({ i, slope }) => {
              const supra = Math.abs(slope) > 1;
              const text = !Number.isFinite(slope)
                ? "∞ (instantaneous jump)"
                : `β = ${slope.toFixed(3)}`;
              return (
                <div
                  key={i}
                  className={supra ? "text-red-300" : "text-cyan-300/90"}
                >
                  seg {i + 1}: {text}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-white/60">
          place at least two events to read off slopes.
        </div>
      )}
    </div>
  );
}
