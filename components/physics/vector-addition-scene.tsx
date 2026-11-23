"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { add, angleOf, mag, type Vec2 } from "@/lib/physics/projectile";
import { Button } from "@/components/ui/button";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  ScenePanel,
  SceneReadout,
  SceneStage,
  applyDpr,
  drawFocusRing,
  drawLabel,
  useFigureLinkTarget,
  useSceneHover,
  useSceneSize,
  useSceneTokens,
  useSceneView,
} from "@/components/physics/_shared";

/** Inline height cap; the handles grow with the canvas beyond it. */
const MAX_HEIGHT = 460;
/** The tips can be dragged anywhere in this square, in grid units. */
const WORLD = 6;
const A0: Vec2 = { x: 4, y: 2 };
const B0: Vec2 = { x: 2, y: 3 };
/** Handle radius and grab reach around it, at scale 1. */
const HANDLE_RADIUS = 7;
const GRAB_RADIUS = 16;

type VectorKey = "a" | "b" | "sum";

/**
 * FIG.02a — two vectors from a shared origin and their sum. The reader drags
 * the tips of a and b; the resultant and the parallelogram follow.
 */
export function VectorAdditionScene() {
  const t = useTranslations("scenes.vectorAddition");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { expanded } = useSceneView();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.7,
    maxHeight: MAX_HEIGHT,
    minHeight: 220,
    initialWidth: 640,
    // In full view the grid extends along the longer side, so any shape works.
    fullView: "fill",
  });

  // Two vectors, anchored at a shared origin, in grid units.
  const [a, setA] = useState<Vec2>(A0);
  const [b, setB] = useState<Vec2>(B0);
  const dragRef = useRef<"a" | "b" | null>(null);
  const sum = add(a, b);
  const direction = (angleOf(sum) * 180) / Math.PI;

  // Every pixel size goes through `u`, the handles through `o`, so text and
  // objects grow together in full view (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  // Layout. Inline the square −6…6 is stretched to the plot, as it always
  // was; in full view one grid unit is the same length both ways and the
  // longer side shows more of the grid.
  const padL = u(40);
  const padR = u(20);
  const padT = u(20);
  const padB = u(30);
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const unitX = expanded ? Math.min(plotW, plotH) / (2 * WORLD) : plotW / (2 * WORLD);
  const unitY = expanded ? unitX : plotH / (2 * WORLD);
  const originX = padL + plotW / 2;
  const originY = padT + plotH / 2;
  const spanX = plotW / 2 / unitX;
  const spanY = plotH / 2 / unitY;
  const toPx = (v: Vec2) => ({ px: originX + v.x * unitX, py: originY - v.y * unitY });
  const fromPx = (px: number, py: number): Vec2 => ({
    x: (px - originX) / unitX,
    y: (originY - py) / unitY,
  });
  const tipA = toPx(a);
  const tipB = toPx(b);
  const tipS = toPx(sum);
  const arcRadius = u(30);

  // What lies under the pointer: a tip or arrow (the vector), the arc at the
  // origin (the direction), or a dashed side of the parallelogram.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const grab = o(GRAB_RADIUS);
    if (Math.hypot(px - tipA.px, py - tipA.py) <= grab) return "a";
    if (Math.hypot(px - tipB.px, py - tipB.py) <= grab) return "b";
    const reach = u(9);
    const r = Math.hypot(px - originX, py - originY);
    if (r <= arcRadius + reach && r >= u(8)) {
      const ang = Math.atan2(originY - py, px - originX);
      const lo = Math.min(0, angleOf(sum));
      const hi = Math.max(0, angleOf(sum));
      if (ang >= lo - 0.15 && ang <= hi + 0.15 && Math.abs(r - arcRadius) <= reach) {
        return "direction";
      }
    }
    if (distToSegment(px, py, originX, originY, tipA.px, tipA.py) <= reach) return "a";
    if (distToSegment(px, py, originX, originY, tipB.px, tipB.py) <= reach) return "b";
    if (distToSegment(px, py, originX, originY, tipS.px, tipS.py) <= reach) return "sum";
    if (
      distToSegment(px, py, tipA.px, tipA.py, tipS.px, tipS.py) <= reach ||
      distToSegment(px, py, tipB.px, tipB.py, tipS.px, tipS.py) <= reach
    ) {
      return "parallelogram";
    }
    return null;
  });
  const { activeKey, pointer } = hover;
  const focusVector: VectorKey | null =
    activeKey === "a" || activeKey === "b" || activeKey === "sum" ? activeKey : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const bounds = { width, height };

    // Grid (faint), one line per unit across the visible range.
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 1;
    ctx.setLineDash([u(2), u(4)]);
    ctx.beginPath();
    for (let i = -Math.floor(spanX + 1e-9); i <= spanX + 1e-9; i++) {
      if (i === 0) continue;
      const gx = originX + i * unitX;
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
    }
    for (let i = -Math.floor(spanY + 1e-9); i <= spanY + 1e-9; i++) {
      if (i === 0) continue;
      const gy = originY - i * unitY;
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, originY);
    ctx.lineTo(padL + plotW, originY);
    ctx.moveTo(originX, padT);
    ctx.lineTo(originX, padT + plotH);
    ctx.stroke();

    // Parallelogram guide: dashed lines a → a+b and b → a+b.
    const sidesFocused = activeKey === "parallelogram";
    ctx.strokeStyle = sidesFocused ? tokens.cyan : tokens.axes;
    ctx.lineWidth = sidesFocused ? u(1.5) : 1;
    ctx.setLineDash([u(4), u(4)]);
    ctx.beginPath();
    ctx.moveTo(tipA.px, tipA.py);
    ctx.lineTo(tipS.px, tipS.py);
    ctx.moveTo(tipB.px, tipB.py);
    ctx.lineTo(tipS.px, tipS.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Direction of the sum: an arc from the x axis, shown while pointed at.
    if (activeKey === "direction") {
      const angle = angleOf(sum);
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = u(2);
      ctx.beginPath();
      ctx.arc(originX, originY, arcRadius, -Math.max(angle, 0), -Math.min(angle, 0));
      ctx.stroke();
      drawLabel(
        ctx,
        `θ = ${direction.toFixed(1)}°`,
        originX + (arcRadius + u(10)) * Math.cos(angle / 2),
        originY - (arcRadius + u(10)) * Math.sin(angle / 2),
        { bounds, color: tokens.cyan, font: tokens.fontLabel, plate: tokens.bg1, scale },
      );
    }

    // Arrows. While one vector is pointed at, it is drawn heavier and the
    // other two step back. The resultant goes first, so a and b stay on top.
    const arrow = (key: VectorKey, tip: { px: number; py: number }, color: string, w: number) => {
      const focused = focusVector === key;
      ctx.globalAlpha = focusVector !== null && !focused ? 0.35 : 1;
      drawVector(ctx, originX, originY, tip.px, tip.py, color, focused ? w + u(1) : w, scale);
      ctx.globalAlpha = 1;
    };
    arrow("sum", tipS, tokens.cyan, u(2.5));
    arrow("a", tipA, tokens.mint, u(2));
    arrow("b", tipB, tokens.purple, u(2));

    // Handles at the tips: these are what the reader drags.
    drawHandle(ctx, tipA.px, tipA.py, tokens.mint, o(HANDLE_RADIUS));
    drawHandle(ctx, tipB.px, tipB.py, tokens.purple, o(HANDLE_RADIUS));
    const ringR = o(HANDLE_RADIUS) + u(6);
    if (activeKey === "a" || activeKey === "drag") {
      drawFocusRing(ctx, tipA.px, tipA.py, ringR, tokens.mint, scale);
    }
    if (activeKey === "b" || activeKey === "drag") {
      drawFocusRing(ctx, tipB.px, tipB.py, ringR, tokens.purple, scale);
    }
    if (activeKey === "sum") drawFocusRing(ctx, tipS.px, tipS.py, u(10), tokens.cyan, scale);

    // Names beside the tips, after the arrows so nothing covers them.
    const nameDx = o(HANDLE_RADIUS) + u(3);
    const name = (text: string, tip: { px: number; py: number }, color: string) =>
      drawLabel(ctx, text, tip.px + nameDx, tip.py - u(12), {
        bounds,
        color,
        font: tokens.fontLabel,
      });
    name("a", tipA, tokens.mint);
    name("b", tipB, tokens.purple);
    name("a + b", tipS, tokens.cyan);

    // Measurement guidelines: the grid point under the pointer, read off
    // both axes.
    if (
      pointer &&
      pointer.x >= padL &&
      pointer.x <= padL + plotW &&
      pointer.y >= padT &&
      pointer.y <= padT + plotH
    ) {
      const w = fromPx(pointer.x, pointer.y);
      ctx.strokeStyle = tokens.textLabel;
      ctx.lineWidth = 1;
      ctx.setLineDash([u(4), u(3)]);
      ctx.beginPath();
      ctx.moveTo(pointer.x, originY);
      ctx.lineTo(pointer.x, pointer.y);
      ctx.lineTo(originX, pointer.y);
      ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, w.x.toFixed(1), pointer.x, originY + u(10), {
        bounds,
        color: tokens.textBright,
        align: "center",
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale,
      });
      drawLabel(ctx, w.y.toFixed(1), originX - u(4), pointer.y, {
        bounds,
        color: tokens.textBright,
        align: "right",
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale,
      });
    }
    // Layout values are recomputed from width/height/scale each render.
  }, [a, b, width, height, tokens, expanded, activeKey, pointer]);

  // Dragging: grab the nearer tip, then follow the pointer inside the square.
  const pointAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { px: e.clientX - rect.left, py: e.clientY - rect.top };
  };
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { px, py } = pointAt(e);
    const dA = Math.hypot(px - tipA.px, py - tipA.py);
    const dB = Math.hypot(px - tipB.px, py - tipB.py);
    const grab = o(GRAB_RADIUS);
    let target: "a" | "b" | null = null;
    if (dA < dB && dA < grab) target = "a";
    else if (dB <= dA && dB < grab) target = "b";
    if (target) {
      dragRef.current = target;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const { px, py } = pointAt(e);
    const world = fromPx(px, py);
    const clamped: Vec2 = {
      x: Math.max(-WORLD, Math.min(WORLD, world.x)),
      y: Math.max(-WORLD, Math.min(WORLD, world.y)),
    };
    if (dragRef.current === "a") setA(clamped);
    else setB(clamped);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleReset = () => {
    setA(A0);
    setB(B0);
  };

  const vec = (v: Vec2) => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`;

  return (
    <div ref={containerRef} className="scene-root w-full pb-4">
      <div className="mx-auto" style={{ width }}>
        <SceneStage>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t("aria")}
            className={`${SCENE_CANVAS_CLASS} cursor-grab`}
            style={{ width, height, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </SceneStage>
        <ScenePanel>
          <SceneReadout
            items={[
              {
                label: "a",
                value: `${vec(a)}  |a| = ${mag(a).toFixed(2)}`,
                color: "var(--color-mint)",
                guideKey: "a",
              },
              {
                label: "b",
                value: `${vec(b)}  |b| = ${mag(b).toFixed(2)}`,
                color: "var(--color-purple)",
                guideKey: "b",
              },
              {
                label: "a + b",
                value: `${vec(sum)}  |a + b| = ${mag(sum).toFixed(2)}`,
                color: "var(--color-cyan)",
                guideKey: "sum",
              },
              { label: t("direction"), value: `${direction.toFixed(1)}°`, guideKey: "direction" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <DragHint onReset={handleReset} reset={t("reset")} hint={t("hint")} />
        </SceneControlGroup>
      </div>
    </div>
  );
}

/** The reset button and the drag hint, linked to the guide's "drag" entry. */
function DragHint({ onReset, reset, hint }: { onReset: () => void; reset: string; hint: string }) {
  const { props } = useFigureLinkTarget("drag", "scene");
  return (
    <div className="figure-link flex flex-wrap items-center gap-3" {...props}>
      <Button variant="secondary" size="sm" onClick={onReset}>
        {reset}
      </Button>
      <span className="text-xs text-[var(--color-fg-3)]">{hint}</span>
    </div>
  );
}

function distToSegment(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const k = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2));
  return Math.hypot(px - (x0 + k * dx), py - (y0 + k * dy));
}

function drawVector(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
  scale: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(11 * scale, Math.max(5 * scale, len * 0.2));

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ux * head, y1 - uy * head);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.55, y1 - uy * head + ux * head * 0.55);
  ctx.lineTo(x1 - ux * head + uy * head * 0.55, y1 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}

function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
}
