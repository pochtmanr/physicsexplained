"use client";

import { useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";

/**
 * FIG.61c — The open-questions board.
 *
 * A row of tabs across the top, each a question general relativity cannot
 * answer on its own. Selecting a tab reveals a card with three fields: the
 * QUESTION, WHY GR CAN'T ANSWER it, and WHAT EVIDENCE would settle it. This is
 * the honest scoreboard the essay closes on — not a list of answers, a list of
 * the live frontier.
 */

interface OpenQuestion {
  tab: string;
  question: string;
  why: string;
  evidence: string;
}

const QUESTIONS: OpenQuestion[] = [
  {
    tab: "singularity",
    question: "What replaces the singularity at the centre of a black hole?",
    why: "GR's own equations give infinite curvature there — the theory predicts its own breakdown (Penrose 1965). A density of infinity is not a physical answer.",
    evidence:
      "A quantum-gravity theory that resolves r → 0 into something finite; indirectly, deviations in ringdown or near-horizon physics LISA might measure.",
  },
  {
    tab: "Planck scale",
    question: "What is spacetime at 10⁻³⁵ m?",
    why: "At the Planck length the Schwarzschild radius and Compton wavelength coincide; a measurement of position sharp enough to probe it makes a black hole. Smooth geometry stops being meaningful.",
    evidence:
      "Lorentz-violation searches with gamma-ray-burst timing; tabletop tests of gravity below a millimetre; any sign of spacetime 'graininess'.",
  },
  {
    tab: "information",
    question: "Does an evaporating black hole destroy information?",
    why: "Hawking radiation looks exactly thermal, which would erase the infalling state — but quantum mechanics is unitary and forbids that. Both cannot be exactly true.",
    evidence:
      "Theoretical: a controlled calculation of the Page curve (islands, 2019–) suggests information escapes. Experimental probes remain out of reach.",
  },
  {
    tab: "Big Bang",
    question: "What happened at t = 0?",
    why: "Run the FLRW solution backwards and the scale factor reaches zero with infinite density — another singularity. GR has no t < 0 and no mechanism to start expansion.",
    evidence:
      "Primordial gravitational waves (B-mode polarization) imprinting the inflationary or pre-Big-Bang era onto the CMB.",
  },
  {
    tab: "dark sector",
    question: "What are dark matter and dark energy?",
    why: "GR fits galaxy rotation and cosmic acceleration only if 95% of the universe is unseen. The theory is silent on what that substance is — or whether gravity itself needs modifying.",
    evidence:
      "Direct dark-matter detection; a measured equation of state w ≠ −1 for dark energy; or a modified-gravity signature that fits without it.",
  },
  {
    tab: "unification",
    question: "How does gravity become quantum?",
    why: "Quantizing the metric the way we quantize the other forces gives a non-renormalizable theory — infinities that cannot be absorbed. GR and quantum field theory are mutually incompatible at high energy.",
    evidence:
      "Strings, loops, and asymptotic safety make different predictions; the discriminating energy scale (~10¹⁹ GeV) is 15 decades above the LHC.",
  },
];

const PAD = 16;
const TAB_H = 30;

export function OpenQuestionsBoardScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [active, setActive] = useState(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, active);
  }, [tokens, width, height, active]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The open-questions board. Six tabs name questions general relativity cannot answer; selecting one reveals the question, why GR cannot answer it, and what evidence would settle it."
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {QUESTIONS.map((q, i) => (
          <Button
            key={q.tab}
            active={i === active}
            size="sm"
            onClick={() => setActive(i)}
          >
            {q.tab}
          </Button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  active: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const q = QUESTIONS[active];

  // ── Tab strip ────────────────────────────────────────────────────────────
  const tabY = PAD;
  const tabW = (W - PAD * 2) / QUESTIONS.length;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textBaseline = "middle";
  for (let i = 0; i < QUESTIONS.length; i++) {
    const x = PAD + i * tabW;
    const isActive = i === active;
    ctx.fillStyle = isActive ? hexToRgba(tokens.amber, 0.14) : "transparent";
    if (isActive) ctx.fillRect(x, tabY, tabW, TAB_H);
    ctx.strokeStyle = isActive ? tokens.amber : tokens.panelBorder;
    ctx.lineWidth = isActive ? 1.5 : 1;
    ctx.strokeRect(x, tabY, tabW, TAB_H);
    ctx.fillStyle = isActive ? tokens.amber : tokens.textMute;
    ctx.textAlign = "center";
    ctx.fillText(QUESTIONS[i].tab, x + tabW / 2, tabY + TAB_H / 2);
  }

  // ── Card ─────────────────────────────────────────────────────────────────
  const cardX = PAD;
  const cardY = tabY + TAB_H + 12;
  const cardW = W - PAD * 2;
  const cardH = H - cardY - PAD;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  const innerX = cardX + 16;
  const innerW = cardW - 32;
  let y = cardY + 18;

  // QUESTION
  drawSectionTitle(ctx, innerX, y, "QUESTION", tokens.amber);
  y += 16;
  y = wrapText(ctx, q.question, innerX, y, innerW, 18, tokens.textBright, "13px ui-monospace, monospace");
  y += 12;

  // WHY GR CAN'T
  drawSectionTitle(ctx, innerX, y, "WHY GR CAN'T ANSWER IT", tokens.red);
  y += 15;
  y = wrapText(ctx, q.why, innerX, y, innerW, 16, tokens.textDim, "11px ui-monospace, monospace");
  y += 12;

  // EVIDENCE
  drawSectionTitle(ctx, innerX, y, "WHAT WOULD SETTLE IT", tokens.green);
  y += 15;
  wrapText(ctx, q.evidence, innerX, y, innerW, 16, tokens.textDim, "11px ui-monospace, monospace");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  color: string,
  font: string,
): number {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineH;
  }
  ctx.restore();
  return cy;
}
