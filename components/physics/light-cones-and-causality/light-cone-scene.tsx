"use client";

import { useEffect, useRef, useState } from "react";
import type { Worldline } from "@/lib/physics/relativity/types";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import {
  isCausallyConnected,
  lightConeBoundary,
  quadrant,
} from "@/lib/physics/relativity/light-cone";

/**
 * FIG.13a — The light cone of an event at the origin.
 *
 * One observer sits at the apex (0, 0). The 45° dashed lines drawn by
 * `SpacetimeDiagramCanvas` are her future and past light cones (in (x, ct)
 * units, c is set to 1 so the cone is literally at slope ±1).
 *
 * Click anywhere inside the diagram to drop an event. Each event is auto-
 * classified by `quadrant()` and `isCausallyConnected()`:
 *
 *   • cyan dot       — timelike-future (causally reachable from apex)
 *   • magenta dot    — timelike-past   (causally reaches the apex)
 *   • amber dot      — null (on the cone)
 *   • white/dim dot  — spacelike (elsewhere; no signal connects)
 *
 * The HUD lists each dropped event with its classification and a single
 * sentence on its causal relation to the apex.
 */

interface DroppedEvent {
  x: number; // x in plot units (we work in c = 1 ct-units)
  ct: number; // ct in plot units
}

const X_RANGE: [number, number] = [-3, 3];
const T_RANGE: [number, number] = [-3, 3];
const W = 520;
const H = 380;
const MARGIN = 36;

/** Color a dropped event by its quadrant relative to the origin. */
function colorFor(ev: DroppedEvent): string {
  // Use light-cone helpers in unit-c convention by passing c = 1 below.
  // We classify with quadrant on a fake (t, x) pair with c = 1.
  const apex = { t: 0, x: 0, y: 0, z: 0 };
  const q = quadrant(apex, { t: ev.ct, x: ev.x, y: 0, z: 0 }, 1);
  switch (q) {
    case "timelike-future":
      return "#67E8F9"; // cyan
    case "timelike-past":
      return "#FF6ADE"; // magenta
    case "null-future":
    case "null-past":
      return "#FFD66B"; // amber
    case "spacelike":
      return "rgba(255,255,255,0.55)";
    default:
      return "rgba(255,255,255,0.85)";
  }
}

function classifyLabel(ev: DroppedEvent): string {
  const apex = { t: 0, x: 0, y: 0, z: 0 };
  const q = quadrant(apex, { t: ev.ct, x: ev.x, y: 0, z: 0 }, 1);
  const reachable = isCausallyConnected(
    apex,
    { t: ev.ct, x: ev.x, y: 0, z: 0 },
    1,
  );
  switch (q) {
    case "timelike-future":
      return `timelike-future · reachable from origin`;
    case "timelike-past":
      return `timelike-past · could have reached origin`;
    case "null-future":
      return `null-future · on the light cone`;
    case "null-past":
      return `null-past · on the light cone`;
    case "spacelike":
      return `spacelike · elsewhere${reachable ? "" : " · no causal signal"}`;
    default:
      return `origin`;
  }
}

export function LightConeScene() {
  const [events, setEvents] = useState<DroppedEvent[]>([
    { x: 1, ct: 2 }, // pre-seeded: timelike-future
    { x: 2, ct: 0.5 }, // pre-seeded: spacelike
    { x: -1.5, ct: -1.5 }, // pre-seeded: null-past (on the cone)
  ]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // Render dots overlay on top of the SpacetimeDiagramCanvas.
  useEffect(() => {
    const canvas = overlayRef.current;
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

    const plotW = W - 2 * MARGIN;
    const plotH = H - 2 * MARGIN;
    const [xMin, xMax] = X_RANGE;
    const [tMin, tMax] = T_RANGE;
    const xToPx = (x: number) => MARGIN + ((x - xMin) / (xMax - xMin)) * plotW;
    const tToPx = (t: number) =>
      H - MARGIN - ((t - tMin) / (tMax - tMin)) * plotH;

    // Shade future and past cones (c = 1).
    ctx.fillStyle = "rgba(255, 214, 107, 0.07)";
    // future cone: triangle from origin to (xMin, |xMin|) and (xMax, |xMax|)
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMin), tToPx(-xMin));
    ctx.lineTo(xToPx(xMax), tToPx(xMax));
    ctx.closePath();
    ctx.fill();
    // past cone
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMin), tToPx(xMin));
    ctx.lineTo(xToPx(xMax), tToPx(-xMax));
    ctx.closePath();
    ctx.fill();

    for (const ev of events) {
      ctx.fillStyle = colorFor(ev);
      ctx.beginPath();
      ctx.arc(xToPx(ev.x), tToPx(ev.ct), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [events]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const plotW = W - 2 * MARGIN;
    const plotH = H - 2 * MARGIN;
    const [xMin, xMax] = X_RANGE;
    const [tMin, tMax] = T_RANGE;
    if (px < MARGIN || px > W - MARGIN || py < MARGIN || py > H - MARGIN) return;
    const x = xMin + ((px - MARGIN) / plotW) * (xMax - xMin);
    const ct = tMin + ((H - MARGIN - py) / plotH) * (tMax - tMin);
    setEvents((prev) => [...prev, { x, ct }]);
  }

  function clearEvents() {
    setEvents([]);
  }

  // Apex worldline (origin marker — a single tiny vertical stub at x = 0).
  const apexMarker: Worldline = {
    events: [
      { t: -0.06, x: 0, y: 0, z: 0 },
      { t: 0.06, x: 0, y: 0, z: 0 },
    ],
    color: "#FFFFFF",
    label: "apex",
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={wrapperRef}
        className="relative cursor-crosshair select-none"
        style={{ width: W, height: H }}
        onClick={handleClick}
      >
        <SpacetimeDiagramCanvas
          worldlines={[apexMarker]}
          xRange={X_RANGE}
          tRange={T_RANGE}
          width={W}
          height={H}
          lightCone
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-xs text-white/70">
          <p className="mb-1 text-white/85">
            Click anywhere in the diagram to drop an event. Each is classified
            by its interval relative to the apex (origin).
          </p>
          {events.length === 0 ? (
            <p className="opacity-60">No events yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {events.map((ev, i) => {
                const apex = { t: 0, x: 0, y: 0, z: 0 };
                const s2 =
                  ev.ct * ev.ct - ev.x * ev.x; // c = 1 in this scene
                void apex;
                return (
                  <li key={i} style={{ color: colorFor(ev) }}>
                    ({ev.x.toFixed(2)}, {ev.ct.toFixed(2)}) · s² = {s2.toFixed(2)}
                    {" · "}
                    {classifyLabel(ev)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={clearEvents}
          className="shrink-0 rounded border border-white/15 px-2 py-1 font-mono text-xs text-white/70 hover:bg-white/5"
        >
          clear
        </button>
      </div>
      <p className="font-mono text-[10px] text-white/40">
        amber shading · light cones (future above, past below). lightConeBoundary(t, x) = c|t| − |x|, sign tells you the quadrant.
      </p>
      <span className="hidden">
        {/* Touch the boundary helper so the import is exercised — also useful
            if someone wants to wire a numeric HUD without re-classifying. */}
        {events.map((ev, i) => (
          <span key={i}>{lightConeBoundary(ev.ct, ev.x, 1)}</span>
        ))}
      </span>
    </div>
  );
}
