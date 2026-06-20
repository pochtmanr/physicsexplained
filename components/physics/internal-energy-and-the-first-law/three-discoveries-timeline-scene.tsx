"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_HUD_LARGE,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_SHORT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.05b — three discoveries of one law.
 *
 * Energy conservation was found three times in a decade by men who never
 * collaborated: Mayer reasoned it from the colour of tropical blood (1842),
 * Joule measured it with a paddle wheel (1843), and Helmholtz proved it
 * mathematically (1847). The timeline pins all three; click a pin to read the
 * account. Beneath it, the law they converged on glows: ΔU = Q − W.
 */

interface Discovery {
  year: number;
  name: string;
  who: string;
  blurb: string;
  color: (t: SceneTokens) => string;
}

const DISCOVERIES: Discovery[] = [
  {
    year: 1842,
    name: "Mayer",
    who: "Julius von Mayer — philosophical",
    blurb:
      "A ship's doctor, Mayer noticed that venous blood ran brighter red in the tropics: the body burned less fuel to stay warm, so less oxygen was spent. From this clinical hint he argued that heat and mechanical work are interconvertible and that their sum is conserved — and even estimated the mechanical equivalent of heat. He published in 1842, before Joule's paddle-wheel paper, but as an outsider was ignored for years.",
    color: (t) => t.amber,
  },
  {
    year: 1843,
    name: "Joule",
    who: "James Joule — experimental",
    blurb:
      "A brewer's son with a private laboratory, Joule churned water with a falling-weight paddle wheel and measured the tiny temperature rise, pinning down how much work produces how much heat. His relentless precision turned Mayer's claim into a number the scientific establishment could not dismiss, and fixed the mechanical equivalent of heat by experiment.",
    color: (t) => t.cyan,
  },
  {
    year: 1847,
    name: "Helmholtz",
    who: "Hermann von Helmholtz — mathematical",
    blurb:
      "A physician turned physicist, Helmholtz gave conservation of energy its first rigorous mathematical statement in his 1847 memoir Über die Erhaltung der Kraft (On the Conservation of Force), deriving it as a universal principle spanning mechanics, heat, electricity, and physiology. What Mayer intuited and Joule measured, Helmholtz proved.",
    color: (t) => t.mint,
  },
];

const Y_MIN = 1840;
const Y_MAX = 1850;

export function ThreeDiscoveriesTimelineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [selected, setSelected] = useState(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.42,
    maxHeight: SCENE_HEIGHT_SHORT,
    minHeight: 220,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, selected, width, height);
  }, [selected, tokens, width, height]);

  const axis = axisGeom(width, height);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    // nearest pin
    let best = 0;
    let bestD = Infinity;
    DISCOVERIES.forEach((d, i) => {
      const px = axis.x0 + ((d.year - Y_MIN) / (Y_MAX - Y_MIN)) * axis.w;
      const dist = Math.abs(px - x);
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    });
    setSelected(best);
  };

  const sel = DISCOVERIES[selected];

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", cursor: "pointer" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A timeline from 1840 to 1850 with three pins: Mayer 1842, Joule 1843, Helmholtz 1847. Click a pin to read how each independently discovered the conservation of energy."
        onPointerDown={onPointer}
      />
      <div className="mt-2 font-mono text-xs">
        <p className="text-[var(--color-fg-1)]">
          <span style={{ color: sel.color(tokens) }}>{sel.year} · {sel.who}</span>
        </p>
        <p className="mt-1 leading-relaxed text-[var(--color-fg-3)]">{sel.blurb}</p>
      </div>
    </div>
  );
}

function axisGeom(W: number, H: number) {
  const x0 = 44;
  const x1 = W - 28;
  const y = H * 0.46;
  return { x0, x1, w: x1 - x0, y };
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  selected: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, 16, 10, "ONE LAW, THREE TIMES — 1840s", tokens.textMute);

  const { x0, w, y } = axisGeom(W, H);

  // axis line
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + w, y);
  ctx.stroke();

  // year ticks
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  for (let yr = Y_MIN; yr <= Y_MAX; yr++) {
    const px = x0 + ((yr - Y_MIN) / (Y_MAX - Y_MIN)) * w;
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(px, y - 4);
    ctx.lineTo(px, y + 4);
    ctx.stroke();
    if (yr % 2 === 0) {
      ctx.fillStyle = tokens.textFaint;
      ctx.fillText(String(yr), px, y + 18);
    }
  }

  // pins
  DISCOVERIES.forEach((d, i) => {
    const px = x0 + ((d.year - Y_MIN) / (Y_MAX - Y_MIN)) * w;
    const isSel = i === selected;
    const col = d.color(tokens);
    const pinTop = y - (isSel ? 46 : 30);

    ctx.strokeStyle = isSel ? col : hexToRgba(col, 0.6);
    ctx.lineWidth = isSel ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, pinTop);
    ctx.stroke();

    if (isSel) {
      ctx.fillStyle = hexToRgba(col, 0.25);
      ctx.beginPath();
      ctx.arc(px, pinTop, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, pinTop, isSel ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isSel ? tokens.textBright : tokens.textMute;
    ctx.font = isSel ? FONT_HUD : FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(d.name, px, pinTop - 14);
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText(String(d.year), px, pinTop - 28);
  });

  // glowing law
  const sel = DISCOVERIES[selected];
  const gcol = sel.color(tokens);
  ctx.textAlign = "center";
  ctx.font = FONT_HUD_LARGE;
  ctx.shadowColor = gcol;
  ctx.shadowBlur = 12;
  ctx.fillStyle = gcol;
  ctx.fillText("ΔU = Q − W", W / 2, H - 14);
  ctx.shadowBlur = 0;
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("energy is conserved", W / 2, H - 2);
  ctx.textAlign = "left";
}
