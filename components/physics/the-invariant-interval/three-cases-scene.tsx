"use client";

import { useEffect, useRef } from "react";

/**
 * FIG.12b — THE THREE QUADRANTS.
 *
 * Three side-by-side mini-spacetime diagrams, each showing one event pair
 * representative of a Lorentz-invariant quadrant:
 *
 *   • TIMELIKE   (s² > 0)  — origin → (Δct = 2, Δx = 1).  Inside the cone.
 *   • NULL       (s² = 0)  — origin → (Δct = 1.5, Δx = 1.5). On the cone.
 *   • SPACELIKE  (s² < 0)  — origin → (Δct = 0.5, Δx = 1.5). Outside the cone.
 *
 * Each panel is drawn with Canvas 2D directly (rather than the shared
 * SpacetimeDiagramCanvas) so the three panels can sit in one row and so
 * the appropriate quadrant can be HATCHED to mark the causal region:
 *
 *   • timelike-future  — light hatch covers the upper cone (t > |x|)
 *   • timelike-past    — same hatch on the lower cone (t < −|x|)
 *   • spacelike        — hatch covers the elsewhere (|t| < |x|)
 *
 * Convention: c = 1, so the light cone sits at slope ±1 in (x, ct) space.
 */

type CaseId = "timelike" | "null" | "spacelike";

interface CaseDef {
  id: CaseId;
  title: string;
  s2Sign: string;
  color: string;
  Ax: number;
  At: number;
  Bx: number;
  Bt: number;
  s2: number;
  hatchRegion: "future-cone" | "elsewhere" | "null-line";
}

const CASES: readonly CaseDef[] = [
  {
    id: "timelike",
    title: "TIMELIKE",
    s2Sign: "s² > 0",
    color: "#67E8F9",
    Ax: 0,
    At: 0,
    Bx: 1,
    Bt: 2,
    s2: 4 - 1,
    hatchRegion: "future-cone",
  },
  {
    id: "null",
    title: "NULL (LIGHT)",
    s2Sign: "s² = 0",
    color: "#FFD66B",
    Ax: 0,
    At: 0,
    Bx: 1.5,
    Bt: 1.5,
    s2: 0,
    hatchRegion: "null-line",
  },
  {
    id: "spacelike",
    title: "SPACELIKE",
    s2Sign: "s² < 0",
    color: "#FF6ADE",
    Ax: 0,
    At: 0,
    Bx: 1.5,
    Bt: 0.5,
    s2: 0.25 - 2.25,
    hatchRegion: "elsewhere",
  },
];

const PANEL_W = 240;
const PANEL_H = 240;
const X_RANGE: [number, number] = [-2, 2];
const T_RANGE: [number, number] = [-0.5, 2.5];

export function ThreeCasesScene() {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {CASES.map((c) => (
          <CasePanel key={c.id} def={c} />
        ))}
      </div>
      <div className="grid w-full max-w-[760px] grid-cols-3 gap-x-3 font-mono text-[11px] text-white/65">
        <div>
          <span className="text-cyan-300/85">future light cone</span> — only
          events here can be reached by you.
        </div>
        <div>
          <span className="text-amber-300/85">light cone itself</span> — what
          a photon traces.
        </div>
        <div>
          <span className="text-fuchsia-300/85">elsewhere</span> — causally
          disconnected; ordering depends on frame.
        </div>
      </div>
    </div>
  );
}

function CasePanel({ def }: { def: CaseDef }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = PANEL_W * dpr;
    canvas.height = PANEL_H * dpr;
    canvas.style.width = `${PANEL_W}px`;
    canvas.style.height = `${PANEL_H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, PANEL_W, PANEL_H);

    const margin = 24;
    const plotW = PANEL_W - 2 * margin;
    const plotH = PANEL_H - 2 * margin;
    const [xMin, xMax] = X_RANGE;
    const [tMin, tMax] = T_RANGE;
    const xToPx = (x: number) => margin + ((x - xMin) / (xMax - xMin)) * plotW;
    const tToPx = (t: number) =>
      PANEL_H - margin - ((t - tMin) / (tMax - tMin)) * plotH;

    // Hatch the causal region. Diagonal stripes — pattern depends on quadrant.
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin, margin, plotW, plotH);
    ctx.clip();

    const stripe = 6;
    if (def.hatchRegion === "future-cone") {
      // Hatch t > |x| (upper cone)
      ctx.strokeStyle = "rgba(103, 232, 249, 0.15)";
      ctx.lineWidth = 1;
      for (let i = -PANEL_H; i < PANEL_W * 2; i += stripe) {
        // Diagonal line; clip to upper cone in subsequent fillPath
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + PANEL_H, PANEL_H);
        ctx.stroke();
      }
      // Mask back: paint outside the cone with the panel bg
      ctx.fillStyle = "rgba(0,0,0,0.999)";
      ctx.beginPath();
      // Below cone (t < |x|): the two side regions
      ctx.moveTo(xToPx(xMin), tToPx(tMin));
      ctx.lineTo(xToPx(xMin), tToPx(0));
      ctx.lineTo(xToPx(0), tToPx(0));
      ctx.lineTo(xToPx(xMin), tToPx(-xMin));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(xToPx(xMax), tToPx(tMin));
      ctx.lineTo(xToPx(xMax), tToPx(0));
      ctx.lineTo(xToPx(0), tToPx(0));
      ctx.lineTo(xToPx(xMax), tToPx(xMax));
      ctx.closePath();
      ctx.fill();
      // Bottom cone region (t < −|x|)
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(tMin));
      ctx.lineTo(xToPx(xMax), tToPx(tMin));
      ctx.lineTo(xToPx(xMax), tToPx(-xMax));
      ctx.lineTo(xToPx(0), tToPx(0));
      ctx.lineTo(xToPx(xMin), tToPx(-xMin));
      ctx.closePath();
      ctx.fill();
    } else if (def.hatchRegion === "elsewhere") {
      // Hatch the elsewhere — |t| < |x|
      ctx.strokeStyle = "rgba(255, 106, 222, 0.15)";
      ctx.lineWidth = 1;
      for (let i = -PANEL_H; i < PANEL_W * 2; i += stripe) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + PANEL_H, PANEL_H);
        ctx.stroke();
      }
      // Mask back: paint over the cone interior with panel bg
      ctx.fillStyle = "rgba(0,0,0,0.999)";
      // Upper cone (t > |x|)
      ctx.beginPath();
      ctx.moveTo(xToPx(0), tToPx(0));
      ctx.lineTo(xToPx(xMax), tToPx(xMax));
      ctx.lineTo(xToPx(xMin), tToPx(-xMin));
      ctx.closePath();
      ctx.fill();
      // Lower cone (t < −|x|)
      ctx.beginPath();
      ctx.moveTo(xToPx(0), tToPx(0));
      ctx.lineTo(xToPx(xMax), tToPx(-xMax));
      ctx.lineTo(xToPx(xMin), tToPx(xMin));
      ctx.closePath();
      ctx.fill();
    }
    // null case: no hatch — the worldline is exactly on the cone, drawn below

    ctx.restore();

    // Grid (faint)
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let xg = Math.ceil(xMin); xg <= Math.floor(xMax); xg++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(xg), tToPx(tMin));
      ctx.lineTo(xToPx(xg), tToPx(tMax));
      ctx.stroke();
    }
    for (let tg = Math.ceil(tMin); tg <= Math.floor(tMax); tg++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(tg));
      ctx.lineTo(xToPx(xMax), tToPx(tg));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(tMin));
    ctx.lineTo(xToPx(0), tToPx(tMax));
    ctx.moveTo(xToPx(xMin), tToPx(0));
    ctx.lineTo(xToPx(xMax), tToPx(0));
    ctx.stroke();

    // Light cone (45°)
    ctx.strokeStyle = "#FFD66B";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(xToPx(xMin), tToPx(-xMin));
    ctx.lineTo(xToPx(xMax), tToPx(xMax));
    ctx.moveTo(xToPx(xMin), tToPx(xMin));
    ctx.lineTo(xToPx(xMax), tToPx(-xMax));
    ctx.stroke();
    ctx.setLineDash([]);

    // Event pair line
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(def.Ax), tToPx(def.At));
    ctx.lineTo(xToPx(def.Bx), tToPx(def.Bt));
    ctx.stroke();

    // Endpoints
    ctx.fillStyle = def.color;
    for (const [px, py] of [
      [xToPx(def.Ax), tToPx(def.At)],
      [xToPx(def.Bx), tToPx(def.Bt)],
    ]) {
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title and s²
    ctx.fillStyle = def.color;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(def.title, margin, margin - 8);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${def.s2Sign}   s²=${def.s2.toFixed(2)}`, PANEL_W - margin, margin - 8);

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("x", PANEL_W - margin + 4, tToPx(0) + 4);
    ctx.fillText("ct", xToPx(0) + 4, margin + 4);
  }, [def]);

  return (
    <canvas
      ref={ref}
      className="rounded-md border border-white/10 bg-black/40"
    />
  );
}
