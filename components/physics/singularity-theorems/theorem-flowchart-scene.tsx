"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawArrow,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  impliesIncompleteness,
  type TheoremHypotheses,
} from "@/lib/physics/relativity/singularity-theorems";
import { Button } from "@/components/ui/button";

/**
 * FIG.59c — The theorem as a flowchart.
 *
 * Three hypothesis boxes feed an AND gate into the conclusion box:
 *
 *   [trapped surface] ─┐
 *   [energy condition]─┼─► [geodesic INCOMPLETENESS]
 *   [global hyperbolicity]─┘
 *
 * Toggle any hypothesis OFF to see (a) the conclusion go dark, and (b) the
 * named counterexample / loophole that the missing hypothesis would open. This
 * is the whole logical content of Penrose 1965: the conclusion is not an extra
 * assumption smuggled in, it is forced — but only when all three premises hold.
 */

const PAD = 16;

interface HypoSpec {
  key: keyof TheoremHypotheses;
  label: string;
  /** What goes wrong if you drop this hypothesis. */
  loophole: string;
}

const HYPOS: HypoSpec[] = [
  {
    key: "trappedSurface",
    label: "TRAPPED SURFACE",
    loophole: "no collapse yet — flat space is geodesically complete",
  },
  {
    key: "energyCondition",
    label: "ENERGY CONDITION",
    loophole: "exotic matter defocuses — bundles can re-expand, no caustic",
  },
  {
    key: "globalHyperbolicity",
    label: "GLOBAL HYPERBOLICITY",
    loophole: "closed timelike curves / bad initial data — causality breaks first",
  },
];

export function TheoremFlowchartScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [hyp, setHyp] = useState<TheoremHypotheses>({
    trappedSurface: true,
    energyCondition: true,
    globalHyperbolicity: true,
  });

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, hyp, width, height);
  }, [tokens, hyp, width, height]);

  const fires = impliesIncompleteness(hyp);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A flowchart of the three Penrose theorem hypotheses feeding an AND gate into geodesic incompleteness. Toggling any hypothesis off shows the loophole it opens."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex flex-wrap gap-2">
          {HYPOS.map((h) => {
            const on = hyp[h.key];
            return (
              <Button
                key={h.key}
                size="sm"
                active={on}
                onClick={() => setHyp((s) => ({ ...s, [h.key]: !s[h.key] }))}
              >
                {h.label}: {on ? "ON" : "OFF"}
              </Button>
            );
          })}
        </div>
        <span style={{ color: fires ? "var(--color-mint)" : "var(--color-red)" }}>
          {fires
            ? "all three premises hold → singularity is UNAVOIDABLE"
            : "a premise is missing → the proof does not close"}
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  hyp: TheoremHypotheses,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const boxW = Math.min(190, (W - PAD * 2) * 0.34);
  const boxH = 40;
  const leftX = PAD + 4;
  const gateX = leftX + boxW + (W - PAD * 2 - boxW) * 0.34;
  const concX = W - PAD - 4 - boxW;
  const concX2 = W - PAD - 4;

  const ys = [H * 0.24, H * 0.5, H * 0.76];
  const gateY = H * 0.5;
  const concY = H * 0.5;

  // ── hypothesis boxes ──────────────────────────────────────────────────────
  HYPOS.forEach((h, i) => {
    const on = hyp[h.key];
    const y = ys[i] - boxH / 2;
    drawBox(
      ctx,
      tokens,
      leftX,
      y,
      boxW,
      boxH,
      h.label,
      on,
      on ? tokens.cyan : tokens.textFaint,
    );

    // arrow into gate
    const col = on ? hexToRgba(tokens.cyan, 0.85) : hexToRgba(tokens.red, 0.7);
    drawArrow(ctx, leftX + boxW + 2, ys[i], gateX - 14, gateY, col, 1.4, 7);

    // loophole annotation when OFF
    if (!on) {
      ctx.font = FONT_HUD_SMALL;
      ctx.fillStyle = tokens.red;
      wrapText(ctx, "✗ " + h.loophole, leftX + 2, y + boxH + 12, boxW + 30, 12);
    }
  });

  // ── AND gate ──────────────────────────────────────────────────────────────
  const allOn = hyp.trappedSurface && hyp.energyCondition && hyp.globalHyperbolicity;
  const gColor = allOn ? tokens.mint : tokens.red;
  ctx.beginPath();
  ctx.arc(gateX, gateY, 18, 0, Math.PI * 2);
  ctx.strokeStyle = gColor;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = hexToRgba(gColor, 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = gColor;
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AND", gateX, gateY);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // gate → conclusion
  drawArrow(
    ctx,
    gateX + 20,
    gateY,
    concX - 4,
    concY,
    allOn ? hexToRgba(tokens.mint, 0.9) : hexToRgba(tokens.red, 0.5),
    1.6,
    8,
  );

  // ── conclusion box ────────────────────────────────────────────────────────
  drawBox(
    ctx,
    tokens,
    concX,
    concY - boxH / 2 - 6,
    concX2 - concX,
    boxH + 12,
    "GEODESIC\nINCOMPLETENESS",
    allOn,
    allOn ? tokens.mint : tokens.textFaint,
  );

  // caption under conclusion
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = allOn ? tokens.mint : tokens.textFaint;
  ctx.textAlign = "center";
  ctx.fillText(
    allOn ? "= a singularity (forced)" : "= not forced",
    (concX + concX2) / 2,
    concY + boxH / 2 + 22,
  );
  ctx.textAlign = "left";
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  on: boolean,
  color: string,
) {
  ctx.fillStyle = on ? hexToRgba(color, 0.1) : hexToRgba(tokens.textFaint, 0.05);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = on ? 1.5 : 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = color;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = label.split("\n");
  const lh = 13;
  const startY = y + h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, x + w / 2, startY + i * lh));
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Minimal word-wrap for annotation text. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
