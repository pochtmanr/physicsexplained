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
import { classicalTests } from "@/lib/physics/relativity/the-classical-tests-summary";

/**
 * FIG.43a — The four-test dashboard.
 *
 * Four cards across the canvas, one per classical test. Click a card to
 * expand a detail panel below: the GR prediction, the canonical measurement,
 * the best fractional precision, and a one-line gloss of what the test
 * probes. The selected card glows in its accent color.
 *
 * All numbers come from `classicalTests()` in the topic physics module.
 */

const PAD = 16;

type ColorKey = "cyan" | "amber" | "mint" | "magenta";

const TEST_COLOR: Record<string, ColorKey> = {
  perihelion: "cyan",
  deflection: "amber",
  redshift: "mint",
  shapiro: "magenta",
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lineHeight;
}

export function FourTestDashboardScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tests = useMemo(() => classicalTests(), []);
  const [selected, setSelected] = useState<string>("deflection");
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // Card geometry, recomputed for hit-testing on click.
  const cardLayout = useMemo(() => {
    const n = tests.length;
    const gap = 10;
    const usable = width - PAD * 2 - gap * (n - 1);
    const cardW = usable / n;
    const cardY = PAD + 24;
    const cardH = 78;
    return tests.map((t, i) => ({
      id: t.id,
      x: PAD + i * (cardW + gap),
      y: cardY,
      w: cardW,
      h: cardH,
    }));
  }, [tests, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, tests, cardLayout, selected, width, height);
  }, [tokens, tests, cardLayout, selected, width, height]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const card of cardLayout) {
      if (
        mx >= card.x &&
        mx <= card.x + card.w &&
        my >= card.y &&
        my <= card.y + card.h
      ) {
        setSelected(card.id);
        return;
      }
    }
  }

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={`cursor-pointer ${SCENE_CANVAS_CLASS}`}
        style={{ width, height, display: "block" }}
        aria-label="Dashboard of the four classical tests of general relativity. Click a test card to read its GR prediction, measured value, and best precision."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-[var(--color-fg-3)]">
        {tests.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            className={
              selected === t.id
                ? "border-b border-[var(--color-cyan)] text-[var(--color-fg-1)]"
                : "hover:text-[var(--color-fg-1)]"
            }
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tests: ReturnType<typeof classicalTests>,
  cards: { id: string; x: number; y: number; w: number; h: number }[],
  selected: string,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = tokens.textDim;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("GENERAL RELATIVITY — FOUR TESTS, FOUR CONFIRMATIONS", PAD, PAD);

  // Cards
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const card = cards[i];
    const isSel = selected === t.id;
    const color = tokens[TEST_COLOR[t.id]];

    if (isSel) {
      ctx.fillStyle = hexToRgba(color, 0.1);
      ctx.fillRect(card.x, card.y, card.w, card.h);
    }
    ctx.strokeStyle = isSel ? color : tokens.panelBorder;
    ctx.lineWidth = isSel ? 1.5 : 1;
    ctx.strokeRect(card.x, card.y, card.w, card.h);

    // Year badge
    ctx.fillStyle = isSel ? color : tokens.textFaint;
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(t.firstYear), card.x + 8, card.y + 8);

    // Name (wrapped)
    ctx.fillStyle = isSel ? tokens.textBright : tokens.textDim;
    ctx.font = "10px ui-monospace, monospace";
    wrapText(ctx, t.name, card.x + 8, card.y + 24, card.w - 16, 13);

    // Best precision
    ctx.fillStyle = isSel ? color : tokens.textMute;
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText(
      `±${t.bestPrecision.toExponential(0)}`,
      card.x + 8,
      card.y + card.h - 16,
    );
  }

  // Detail panel
  const sel = tests.find((t) => t.id === selected);
  if (!sel) return;
  const color = tokens[TEST_COLOR[sel.id]];
  const detY = PAD + 24 + 78 + 16;
  const detH = H - detY - PAD;
  ctx.strokeStyle = hexToRgba(color, 0.4);
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, detY, W - PAD * 2, detH);

  const innerX = PAD + 14;
  const innerW = W - PAD * 2 - 28;
  let y = detY + 12;

  ctx.fillStyle = color;
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`${sel.name.toUpperCase()} · ${sel.firstYear}`, innerX, y);
  y += 22;

  // Prediction vs measurement row
  const colW = innerW / 2;
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("GR PREDICTION", innerX, y);
  ctx.fillText("MEASUREMENT", innerX + colW, y);
  y += 14;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText(sel.prediction, innerX, y);
  ctx.fillStyle = tokens.mint;
  ctx.fillText(sel.measurement, innerX + colW, y);
  y += 22;

  // Probes gloss
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("PROBES", innerX, y);
  y += 14;
  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  wrapText(ctx, sel.probes, innerX, y, innerW, 14);
}
