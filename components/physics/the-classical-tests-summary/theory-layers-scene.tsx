"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  classicalTests,
  type TheoryLayer,
} from "@/lib/physics/relativity/the-classical-tests-summary";
import { Button } from "@/components/ui/button";

/**
 * FIG.43c — Which layer of the theory each test probes.
 *
 * Three stacked horizontal bands, from the weakest assumption at the bottom
 * to the strongest at the top:
 *
 *   equivalence principle  →  the metric  →  the field equations
 *
 * Each band lists which tests bite at that layer. Click a test chip (or use
 * the buttons) to highlight its layer and draw a connector. The point: a
 * redshift measurement only needs the equivalence principle, deflection and
 * Shapiro need the full metric (the PPN parameter γ), and only the perihelion
 * precession reaches into the nonlinear field equations themselves.
 */

const PAD = 18;

interface LayerSpec {
  id: TheoryLayer;
  title: string;
  blurb: string;
  colorKey: "mint" | "cyan" | "magenta";
}

const LAYERS: LayerSpec[] = [
  {
    id: "field-equations",
    title: "FIELD EQUATIONS  ·  Gμν = κ Tμν",
    blurb: "Nonlinear, higher-order curvature. The deepest layer.",
    colorKey: "magenta",
  },
  {
    id: "metric",
    title: "THE METRIC  ·  gμν (PPN γ)",
    blurb: "Space curvature on top of time curvature.",
    colorKey: "cyan",
  },
  {
    id: "equivalence-principle",
    title: "EQUIVALENCE PRINCIPLE  ·  clocks & free fall",
    blurb: "Gravity is local geometry. The shallowest assumption.",
    colorKey: "mint",
  },
];

type ColorKey = "cyan" | "amber" | "mint" | "magenta";
const TEST_COLOR: Record<string, ColorKey> = {
  perihelion: "magenta",
  deflection: "cyan",
  redshift: "mint",
  shapiro: "cyan",
};

export function TheoryLayersScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tests = useMemo(() => classicalTests(), []);
  const [selected, setSelected] = useState<string | null>("perihelion");
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, tests, selected, width, height);
  }, [tokens, tests, selected, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Diagram mapping each classical test of general relativity to the structural layer of the theory it probes: equivalence principle, the metric, or the full field equations."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-[var(--color-fg-3)]">
        {tests.map((t) => {
          const on = selected === t.id;
          return (
            <Button
              key={t.id}
              size="sm"
              active={on}
              onClick={() => setSelected(on ? null : t.id)}
            >
              {t.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tests: ReturnType<typeof classicalTests>,
  selected: string | null,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = tokens.textDim;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("WHAT EACH TEST PROBES — LAYERS OF THE THEORY", PAD, PAD);

  const selTest = selected ? tests.find((t) => t.id === selected) : null;
  const selLayer = selTest?.layer ?? null;

  const bandTop = PAD + 26;
  const bandGap = 12;
  const bandH = (H - bandTop - PAD - bandGap * (LAYERS.length - 1)) / LAYERS.length;

  // Chip column on the right
  const chipW = Math.min(150, W * 0.28);
  const bandRight = W - PAD - chipW - 16;

  // Draw the three layer bands
  LAYERS.forEach((layer, i) => {
    const y = bandTop + i * (bandH + bandGap);
    const color = tokens[layer.colorKey];
    const isSel = selLayer === layer.id;

    if (isSel) {
      ctx.fillStyle = hexToRgba(color, 0.12);
      ctx.fillRect(PAD, y, bandRight - PAD, bandH);
    }
    ctx.strokeStyle = isSel ? color : tokens.panelBorder;
    ctx.lineWidth = isSel ? 1.5 : 1;
    ctx.strokeRect(PAD, y, bandRight - PAD, bandH);

    ctx.fillStyle = isSel ? color : tokens.textDim;
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(layer.title, PAD + 12, y + 10);

    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText(layer.blurb, PAD + 12, y + 26);

    // "requires" ladder arrows between bands (each layer assumes the one below)
    if (i < LAYERS.length - 1) {
      const arrowX = PAD + 20;
      const ay0 = y + bandH;
      const ay1 = ay0 + bandGap;
      ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(arrowX, ay1);
      ctx.lineTo(arrowX, ay0);
      ctx.stroke();
      // little upward arrowhead
      ctx.beginPath();
      ctx.moveTo(arrowX - 3, ay0 + 4);
      ctx.lineTo(arrowX, ay0);
      ctx.lineTo(arrowX + 3, ay0 + 4);
      ctx.stroke();
    }
  });

  // Test chips on the right, vertically spaced; connector to its layer band
  const chipX = bandRight + 16;
  const chipH = 30;
  const chipGap = (H - bandTop - PAD - chipH * tests.length) / (tests.length - 1);

  tests.forEach((t, i) => {
    const cy = bandTop + i * (chipH + chipGap);
    const color = tokens[TEST_COLOR[t.id]];
    const isSel = selected === t.id;

    if (isSel) {
      ctx.fillStyle = hexToRgba(color, 0.14);
      ctx.fillRect(chipX, cy, chipW, chipH);
    }
    ctx.strokeStyle = isSel ? color : tokens.panelBorder;
    ctx.lineWidth = isSel ? 1.5 : 1;
    ctx.strokeRect(chipX, cy, chipW, chipH);

    ctx.fillStyle = isSel ? color : tokens.textMute;
    ctx.font = `${isSel ? "bold " : ""}9px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(t.name, chipX + 8, cy + chipH / 2);

    // Connector from selected chip to its layer band
    if (isSel) {
      const layerIdx = LAYERS.findIndex((l) => l.id === t.layer);
      const ly = bandTop + layerIdx * (bandH + bandGap) + bandH / 2;
      ctx.strokeStyle = hexToRgba(color, 0.7);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chipX, cy + chipH / 2);
      ctx.lineTo(bandRight, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}
