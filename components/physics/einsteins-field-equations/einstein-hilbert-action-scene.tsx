"use client";

import { useEffect, useRef } from "react";

/**
 * FIG.37c — The Einstein-Hilbert action.
 *
 * Canvas 2D annotation diagram showing the action
 *
 *   S = (c⁴/16πG) ∫ R √(−g) d⁴x
 *
 * with callout annotations for each term, and the note:
 * "vary with respect to g_{μν} → get G_{μν} = κ T_{μν}."
 *
 * The diagram follows the visual style of the site's other annotation scenes:
 * a centered monospace equation with radial callout lines pointing to
 * annotated boxes explaining each symbol.
 */

const W = 680;
const H = 340;

interface Annotation {
  /** The substring of the equation this annotation points to (for x-positioning). */
  symbol: string;
  /** Fractional x position on the equation baseline (0 = left, 1 = right). */
  xFrac: number;
  /** Whether the callout goes up or down. */
  side: "above" | "below";
  /** Callout endpoint relative to center. */
  tipDx: number;
  tipDy: number;
  /** Annotation box label (short). */
  label: string;
  /** Annotation description. */
  desc: string;
  color: string;
}

const ANNOTATIONS: Annotation[] = [
  {
    symbol: "c⁴/16πG",
    xFrac: 0.18,
    side: "above",
    tipDx: -130,
    tipDy: -72,
    label: "coupling",
    desc: "c⁴/16πG — fixes units\nand Newtonian limit",
    color: "#FCD34D",
  },
  {
    symbol: "R",
    xFrac: 0.44,
    side: "above",
    tipDx: 20,
    tipDy: -78,
    label: "Ricci scalar",
    desc: "R — scalar curvature of spacetime\nat each point of the manifold",
    color: "#C084FC",
  },
  {
    symbol: "√(−g)",
    xFrac: 0.62,
    side: "below",
    tipDx: 60,
    tipDy: 80,
    label: "volume element",
    desc: "√(−g) d⁴x — covariant measure;\nensures coordinate independence",
    color: "#6EE7B7",
  },
  {
    symbol: "d⁴x",
    xFrac: 0.80,
    side: "above",
    tipDx: 130,
    tipDy: -72,
    label: "integration",
    desc: "∫ over all of spacetime —\nthe action is a global quantity",
    color: "#67E8F9",
  },
];

export function EinsteinHilbertActionScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    // Background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("THE EINSTEIN-HILBERT ACTION — VARIATIONAL ORIGIN OF THE FIELD EQUATIONS", W / 2, 20);

    // Main equation
    const eqY = H / 2 - 8;
    const eqX = W / 2;

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 20px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("S  =  (c⁴/16πG)  ∫  R  √(−g)  d⁴x", eqX, eqY);

    // Underline
    const eqMeasure = ctx.measureText("S  =  (c⁴/16πG)  ∫  R  √(−g)  d⁴x");
    const eqLeft = eqX - eqMeasure.width / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(eqLeft - 8, eqY + 6);
    ctx.lineTo(eqLeft + eqMeasure.width + 8, eqY + 6);
    ctx.stroke();

    // Annotation callouts
    for (const ann of ANNOTATIONS) {
      const rootX = eqLeft + ann.xFrac * eqMeasure.width;
      const rootY = eqY;
      const tipX = rootX + ann.tipDx;
      const tipY = eqY + ann.tipDy;

      // Dashed callout line
      ctx.strokeStyle = `${ann.color}66`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rootX, rootY + (ann.side === "above" ? -4 : 8));
      ctx.lineTo(tipX, tipY + (ann.side === "above" ? 16 : -16));
      ctx.stroke();
      ctx.setLineDash([]);

      // Annotation box
      const lines = ann.desc.split("\n");
      const boxW = 148;
      const boxH = 32 + lines.length * 12;
      const boxX = tipX - boxW / 2;
      const boxY = ann.side === "above" ? tipY - boxH + 8 : tipY - 8;

      ctx.fillStyle = "rgba(12,8,28,0.90)";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.fill();

      ctx.strokeStyle = `${ann.color}44`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.stroke();

      // Label
      ctx.fillStyle = ann.color;
      ctx.font = "bold 9px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(ann.label, tipX, boxY + 14);

      // Description lines
      ctx.fillStyle = "rgba(255,255,255,0.60)";
      ctx.font = "8.5px ui-monospace, monospace";
      ctx.textAlign = "center";
      lines.forEach((line, i) => {
        ctx.fillText(line, tipX, boxY + 26 + i * 12);
      });

      // Small circle at root
      ctx.fillStyle = ann.color;
      ctx.beginPath();
      ctx.arc(rootX, rootY + (ann.side === "above" ? -4 : 8), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Euler-Lagrange result arrow + label
    const resultY = H - 38;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("vary S with respect to g_{μν}", W / 2, resultY - 2);

    ctx.strokeStyle = "rgba(255,230,60,0.55)";
    ctx.lineWidth = 1.5;
    const arrX = W / 2;
    ctx.beginPath();
    ctx.moveTo(arrX - 32, resultY + 10);
    ctx.lineTo(arrX + 32, resultY + 10);
    ctx.stroke();
    // arrowhead
    ctx.fillStyle = "rgba(255,230,60,0.55)";
    ctx.beginPath();
    ctx.moveTo(arrX + 36, resultY + 10);
    ctx.lineTo(arrX + 28, resultY + 6);
    ctx.lineTo(arrX + 28, resultY + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,230,60,0.75)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("G_{μν} = κ T_{μν}", W / 2 + 68 + 32, resultY + 13);

    // Hilbert label
    ctx.fillStyle = "rgba(249,168,212,0.45)";
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("— David Hilbert, November 20, 1915, Göttingen", W - 16, H - 12);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/60"
      />
      <p className="px-1 font-mono text-xs text-white/40">
        The Einstein-Hilbert action. Vary the Ricci scalar action with respect to the
        metric g_&#123;μν&#125; and the Euler-Lagrange equations are G_&#123;μν&#125; = κ T_&#123;μν&#125; — the field
        equations emerge as the least-action condition on spacetime geometry.
      </p>
    </div>
  );
}
