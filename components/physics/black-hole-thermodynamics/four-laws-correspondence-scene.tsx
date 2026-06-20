"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";

/**
 * FIG.48c — The four-laws correspondence table.
 *
 * Interactive table mapping the four laws of black-hole mechanics
 * (Bardeen–Carter–Hawking 1973) onto the four laws of thermodynamics. Click a
 * row to expand the dictionary translation: surface gravity κ ↔ temperature T,
 * horizon area A ↔ entropy S, with the exact Hawking factors
 * T = ℏκ/2πk_Bc and S = k_B A/4ℓ_P². The toggle below switches the highlighted
 * column between "analogy" (1973: a formal resemblance) and "physics" (after
 * 1974: Hawking radiation makes the temperature real).
 */

const PAD = 18;

interface LawRow {
  law: string;
  bh: string; // black-hole mechanics statement
  thermo: string; // thermodynamics statement
  detail: string;
}

const LAWS: LawRow[] = [
  {
    law: "Zeroth",
    bh: "κ is constant over the horizon",
    thermo: "T is uniform at equilibrium",
    detail:
      "Surface gravity κ has the same value everywhere on a stationary horizon — exactly as temperature is uniform throughout a body in thermal equilibrium.",
  },
  {
    law: "First",
    bh: "dM = (κ/8πG) dA + Ω dJ + Φ dQ",
    thermo: "dE = T dS + work terms",
    detail:
      "Energy conservation. Comparing term by term identifies (κ/8πG) dA with T dS; the Ω dJ and Φ dQ pieces are the rotational and electrical work done on the hole.",
  },
  {
    law: "Second",
    bh: "dA ≥ 0  (area theorem)",
    thermo: "dS ≥ 0  (entropy never falls)",
    detail:
      "Hawking's 1971 area theorem: classical horizon area never decreases. Generalized second law: S_matter + A/4 never decreases, even when matter falls in.",
  },
  {
    law: "Third",
    bh: "κ → 0 (extremal) is unreachable",
    thermo: "T = 0 is unreachable",
    detail:
      "You cannot spin a hole up to extremality (a* = 1, κ = 0) in finitely many steps, just as you cannot cool a system to absolute zero in finitely many steps.",
  },
];

type Mode = "analogy" | "physics";

export function FourLawsCorrespondenceScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [selected, setSelected] = useState(2); // second law open by default
  const [mode, setMode] = useState<Mode>("physics");
  const rowRectsRef = useRef<{ y0: number; y1: number; i: number }[]>([]);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.66,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 360,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    rowRectsRef.current = draw(ctx, tokens, selected, mode, width, height);
  }, [tokens, selected, mode, width, height]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    for (const r of rowRectsRef.current) {
      if (y >= r.y0 && y <= r.y1) {
        setSelected(r.i);
        return;
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width, height, display: "block", cursor: "pointer" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Interactive table mapping the four laws of black-hole mechanics onto the four laws of thermodynamics. Click a row to expand its explanation; a toggle switches the framing between a 1973 formal analogy and post-1974 physics."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">framing:</span>
        {(["analogy", "physics"] as Mode[]).map((m) => (
          <Button key={m} size="sm" active={mode === m} onClick={() => setMode(m)}>
            {m === "analogy" ? "1973 analogy" : "post-1974 physics"}
          </Button>
        ))}
        <span className="ml-2 text-[var(--color-fg-3)]">— click a row to expand</span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  selected: number,
  mode: Mode,
  W: number,
  H: number,
): { y0: number; y1: number; i: number }[] {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const colMid = W * 0.5;
  const lawX = PAD;
  const bhX = W * 0.16;
  const thermoX = colMid + W * 0.04;

  // headers
  drawSectionTitle(ctx, lawX, PAD, "LAW", tokens.textMute);
  drawSectionTitle(ctx, bhX, PAD, "BLACK-HOLE MECHANICS (κ, A)", tokens.cyan);
  drawSectionTitle(ctx, thermoX, PAD, "THERMODYNAMICS (T, S)", tokens.magenta);

  // central divider
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(colMid, PAD + 4);
  ctx.lineTo(colMid, H - PAD);
  ctx.stroke();

  const top = PAD + 26;
  const detailH = 56;
  const baseRowH = (H - top - PAD - detailH) / LAWS.length;

  const rects: { y0: number; y1: number; i: number }[] = [];
  let y = top;

  for (let i = 0; i < LAWS.length; i++) {
    const row = LAWS[i];
    const isSel = i === selected;
    const rowH = baseRowH;
    const y0 = y;
    const y1 = y + rowH;

    if (isSel) {
      ctx.fillStyle = hexToRgba(tokens.amber, 0.1);
      ctx.fillRect(PAD - 6, y0, W - 2 * PAD + 12, rowH);
    }

    // row separator
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(PAD, y1);
    ctx.lineTo(W - PAD, y1);
    ctx.stroke();

    const textY = y0 + rowH / 2;
    ctx.textBaseline = "middle";

    ctx.font = isSel ? "bold 12px ui-monospace, monospace" : FONT_HUD;
    ctx.fillStyle = isSel ? tokens.amber : tokens.textDim;
    ctx.textAlign = "left";
    ctx.fillText(row.law, lawX, textY);

    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = isSel ? tokens.cyan : hexToRgba(tokens.cyan, 0.78);
    fitText(ctx, row.bh, bhX, textY, colMid - bhX - 8);

    ctx.fillStyle = isSel ? tokens.magenta : hexToRgba(tokens.magenta, 0.78);
    fitText(ctx, row.thermo, thermoX, textY, W - PAD - thermoX);

    // arrow linking the two sides for the selected row
    if (isSel) {
      ctx.strokeStyle = hexToRgba(tokens.amber, 0.7);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(colMid - 26, textY);
      ctx.lineTo(colMid + 26, textY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = tokens.amber;
      ctx.font = FONT_HUD;
      ctx.textAlign = "center";
      ctx.fillText("↔", colMid, textY - 1);
    }

    rects.push({ y0, y1, i });
    y = y1;
  }

  // ── detail panel for the selected row ──────────────────────────────────────
  const dY = y + 8;
  ctx.fillStyle = hexToRgba(tokens.amber, 0.06);
  ctx.fillRect(PAD - 6, dY, W - 2 * PAD + 12, detailH - 8);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.4);
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD - 6, dY, W - 2 * PAD + 12, detailH - 8);

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const dictLine =
    mode === "physics"
      ? "DICTIONARY (Hawking 1974):  T = ℏκ / 2π k_B c     S = k_B A / 4ℓ_P²"
      : "ANALOGY (1973):  κ behaves like T, A behaves like S — formally, with an unknown constant.";
  ctx.fillStyle = mode === "physics" ? tokens.mint : tokens.textMute;
  ctx.fillText(dictLine, PAD, dY + 8);
  ctx.fillStyle = tokens.textDim;
  wrapText(ctx, LAWS[selected].detail, PAD, dY + 26, W - 2 * PAD, 14);

  ctx.textBaseline = "alphabetic";
  return rects;
}

/** Draw text left-aligned, shrinking the font if it would overflow `maxW`. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
) {
  ctx.textAlign = "left";
  let size = 11;
  ctx.font = `${size}px ui-monospace, monospace`;
  while (ctx.measureText(text).width > maxW && size > 8) {
    size -= 0.5;
    ctx.font = `${size}px ui-monospace, monospace`;
  }
  ctx.fillText(text, x, y);
}

/** Word-wrap helper for the detail paragraph. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  ctx.font = FONT_HUD_SMALL;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
