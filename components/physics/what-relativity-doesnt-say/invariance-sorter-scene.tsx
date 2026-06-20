"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  INVARIANCE_TABLE,
  type QuantityVerdict,
} from "@/lib/physics/relativity/what-relativity-doesnt-say";
import { Button } from "@/components/ui/button";

/**
 * FIG.61b — "What's invariant?" myth-buster.
 *
 * Each row is a physical quantity. The reader guesses whether it is
 * frame-dependent (left column, magenta) or absolute (right column, cyan) by
 * clicking the row; the scene then reveals the true verdict and a one-line
 * reason. A running score makes the punchline land: relativity is named for the
 * things that change, but its content is the column that doesn't.
 */

type Guess = "frame" | "absolute" | null;

const PAD = 14;
const ROW_H = 34;

export function InvarianceSorterScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const rows = INVARIANCE_TABLE;
  const [guesses, setGuesses] = useState<Guess[]>(() => rows.map(() => null));
  const [hover, setHover] = useState<number>(-1);

  const headerH = 30;
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.66,
    maxHeight: SCENE_HEIGHT_DEFAULT + 60,
    minHeight: rows.length * ROW_H + headerH + PAD * 2 + 24,
  });

  const revealedAll = guesses.every((g) => g !== null);
  const correct = useMemo(
    () =>
      guesses.reduce(
        (acc, g, i) =>
          acc +
          (g !== null &&
          (g === "absolute") === rows[i].invariant
            ? 1
            : 0),
        0,
      ),
    [guesses, rows],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, rows, guesses, hover, headerH);
  }, [tokens, width, height, rows, guesses, hover]);

  const rowAt = (py: number): number => {
    const top = PAD + headerH;
    const idx = Math.floor((py - top) / ROW_H);
    return idx >= 0 && idx < rows.length ? idx : -1;
  };

  const handleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const idx = rowAt(py);
    if (idx < 0) return;
    // left half = frame-dependent guess, right half = absolute guess
    const guess: Guess = px < width / 2 ? "frame" : "absolute";
    setGuesses((g) => {
      const next = g.slice();
      next[idx] = guess;
      return next;
    });
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setHover(rowAt(e.clientY - rect.top));
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", touchAction: "none" }}
        className={SCENE_CANVAS_CLASS}
        onPointerDown={handleClick}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(-1)}
        aria-label="Interactive sorter. Each row is a physical quantity; click the left side to guess frame-dependent or the right side to guess absolute. The true verdict and reason are revealed after each choice."
      />
      <div className="mt-3 flex items-center justify-between font-mono text-xs text-[var(--color-fg-2)]">
        <span>
          score: {correct} / {rows.length}{" "}
          {revealedAll ? "— all revealed" : "(click a row)"}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setGuesses(rows.map(() => null))}
        >
          reset
        </Button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  rows: readonly QuantityVerdict[],
  guesses: Guess[],
  hover: number,
  headerH: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;

  // Column headers
  drawSectionTitle(ctx, PAD, 8, "FRAME-DEPENDENT", tokens.magenta);
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("ABSOLUTE / INVARIANT", W - PAD, 8);
  ctx.restore();

  // central divider
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(midX, PAD + headerH - 6);
  ctx.lineTo(midX, H - PAD);
  ctx.stroke();

  const top = PAD + headerH;
  for (let i = 0; i < rows.length; i++) {
    const q = rows[i];
    const g = guesses[i];
    const y = top + i * ROW_H;
    const revealed = g !== null;
    const truthIsAbsolute = q.invariant;
    const truthColor = truthIsAbsolute ? tokens.cyan : tokens.magenta;

    // hover highlight
    if (i === hover && !revealed) {
      ctx.fillStyle = hexToRgba(tokens.textFaint, 0.12);
      ctx.fillRect(PAD - 4, y, W - 2 * (PAD - 4), ROW_H);
    }

    // when revealed, shade the correct side
    if (revealed) {
      const correctGuess = (g === "absolute") === truthIsAbsolute;
      const sideX = truthIsAbsolute ? midX : PAD - 4;
      const sideW = truthIsAbsolute ? W - PAD - midX + 4 : midX - (PAD - 4);
      ctx.fillStyle = hexToRgba(truthColor, correctGuess ? 0.16 : 0.1);
      ctx.fillRect(sideX, y, sideW, ROW_H);
    }

    // quantity name
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = revealed ? tokens.textBright : tokens.textDim;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(truncate(ctx, q.name, midX - PAD - 10), PAD, y + ROW_H / 2 - 6);

    if (revealed) {
      // reason in muted, smaller, under the name within the truth column
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillStyle = tokens.textMute;
      const reasonX = truthIsAbsolute ? midX + 8 : PAD;
      const reasonMaxW = truthIsAbsolute ? W - PAD - midX - 12 : midX - PAD - 8;
      ctx.fillText(
        truncate(ctx, q.reason, reasonMaxW),
        reasonX,
        y + ROW_H / 2 + 8,
      );
      // verdict tick
      const correctGuess = (g === "absolute") === truthIsAbsolute;
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillStyle = correctGuess ? tokens.green : tokens.red;
      ctx.textAlign = "right";
      ctx.fillText(correctGuess ? "✓" : "✗", W - PAD, y + ROW_H / 2 - 4);
      ctx.textAlign = "left";
    } else {
      // hint chevrons
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillStyle = hexToRgba(tokens.magenta, 0.5);
      ctx.textAlign = "right";
      ctx.fillText("‹ frame", midX - 8, y + ROW_H / 2 - 5);
      ctx.fillStyle = hexToRgba(tokens.cyan, 0.5);
      ctx.textAlign = "left";
      ctx.fillText("absolute ›", midX + 8, y + ROW_H / 2 - 5);
      ctx.textAlign = "left";
    }

    // row divider
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD - 4, y + ROW_H);
    ctx.lineTo(W - PAD + 4, y + ROW_H);
    ctx.stroke();
  }
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) {
    t = t.slice(0, -1);
  }
  return t + "…";
}
