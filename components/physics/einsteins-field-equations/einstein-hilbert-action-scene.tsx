"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

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

/** Annotation specs sans color — color is resolved per-theme at render time. */
type AnnotationSpec = Omit<Annotation, "color"> & { colorKey: "amber" | "purple" | "mint" | "cyan" };

const ANNOTATION_SPECS: AnnotationSpec[] = [
  {
    symbol: "c⁴/16πG",
    xFrac: 0.18,
    side: "above",
    tipDx: -130,
    tipDy: -72,
    label: "coupling",
    desc: "c⁴/16πG — fixes units\nand Newtonian limit",
    colorKey: "amber",
  },
  {
    symbol: "R",
    xFrac: 0.44,
    side: "above",
    tipDx: 20,
    tipDy: -78,
    label: "Ricci scalar",
    desc: "R — scalar curvature of spacetime\nat each point of the manifold",
    colorKey: "purple",
  },
  {
    symbol: "√(−g)",
    xFrac: 0.62,
    side: "below",
    tipDx: 60,
    tipDy: 80,
    label: "volume element",
    desc: "√(−g) d⁴x — covariant measure;\nensures coordinate independence",
    colorKey: "mint",
  },
  {
    symbol: "d⁴x",
    xFrac: 0.80,
    side: "above",
    tipDx: 130,
    tipDy: -72,
    label: "integration",
    desc: "∫ over all of spacetime —\nthe action is a global quantity",
    colorKey: "cyan",
  },
];

export function EinsteinHilbertActionScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const annotations = useMemo<Annotation[]>(
    () =>
      ANNOTATION_SPECS.map((spec) => ({
        symbol: spec.symbol,
        xFrac: spec.xFrac,
        side: spec.side,
        tipDx: spec.tipDx,
        tipDy: spec.tipDy,
        label: spec.label,
        desc: spec.desc,
        color: tokens[spec.colorKey],
      })),
    [tokens],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const W = width;
    const H = height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = tokens.textMute;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("THE EINSTEIN-HILBERT ACTION — VARIATIONAL ORIGIN OF THE FIELD EQUATIONS", W / 2, 20);

    // Main equation
    const eqY = H / 2 - 8;
    const eqX = W / 2;

    ctx.fillStyle = tokens.textBright;
    ctx.font = "bold 20px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("S  =  (c⁴/16πG)  ∫  R  √(−g)  d⁴x", eqX, eqY);

    // Underline
    const eqMeasure = ctx.measureText("S  =  (c⁴/16πG)  ∫  R  √(−g)  d⁴x");
    const eqLeft = eqX - eqMeasure.width / 2;
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(eqLeft - 8, eqY + 6);
    ctx.lineTo(eqLeft + eqMeasure.width + 8, eqY + 6);
    ctx.stroke();

    // Annotation callouts
    for (const ann of annotations) {
      const rootX = eqLeft + ann.xFrac * eqMeasure.width;
      const rootY = eqY;
      const tipX = rootX + ann.tipDx;
      const tipY = eqY + ann.tipDy;

      // Dashed callout line
      ctx.strokeStyle = hexToRgba(ann.color, 0.4);
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

      ctx.fillStyle = hexToRgba(tokens.bg, 0.9);
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.fill();

      ctx.strokeStyle = hexToRgba(ann.color, 0.27);
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
      ctx.fillStyle = tokens.textDim;
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
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("vary S with respect to g_{μν}", W / 2, resultY - 2);

    ctx.strokeStyle = hexToRgba(tokens.amber, 0.55);
    ctx.lineWidth = 1.5;
    const arrX = W / 2;
    ctx.beginPath();
    ctx.moveTo(arrX - 32, resultY + 10);
    ctx.lineTo(arrX + 32, resultY + 10);
    ctx.stroke();
    // arrowhead
    ctx.fillStyle = hexToRgba(tokens.amber, 0.55);
    ctx.beginPath();
    ctx.moveTo(arrX + 36, resultY + 10);
    ctx.lineTo(arrX + 28, resultY + 6);
    ctx.lineTo(arrX + 28, resultY + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hexToRgba(tokens.amber, 0.85);
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("G_{μν} = κ T_{μν}", W / 2 + 68 + 32, resultY + 13);

    // Hilbert label
    ctx.fillStyle = hexToRgba(tokens.magenta, 0.55);
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("— David Hilbert, November 20, 1915, Göttingen", W - 16, H - 12);
  }, [tokens, annotations, width, height]);

  return (
    <div ref={containerRef} className="flex flex-col gap-2 p-2 w-full">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
      />
      <p className="px-1 font-mono text-xs text-[var(--color-fg-3)]">
        The Einstein-Hilbert action. Vary the Ricci scalar action with respect to the
        metric g_&#123;μν&#125; and the Euler-Lagrange equations are G_&#123;μν&#125; = κ T_&#123;μν&#125; — the field
        equations emerge as the least-action condition on spacetime geometry.
      </p>
    </div>
  );
}
