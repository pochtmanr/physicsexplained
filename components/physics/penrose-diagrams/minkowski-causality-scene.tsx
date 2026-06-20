"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  causalRelation,
  conformalInfinities,
  type DiagramPoint,
} from "@/lib/physics/relativity/penrose-diagrams";

/**
 * FIG.46b — The Minkowski diamond, hands-on.
 *
 * The compactified flat-spacetime diamond with its labeled infinities. A
 * draggable event "B" can be moved anywhere inside the diamond; the scene
 * shades B's relationship to the fixed observer "A" at the centre: green when
 * B is reachable (inside A's future light cone), amber on the cone, red when
 * spacelike-separated (no signal can connect them). A's 45° light cone is
 * always drawn so the reader can read causality straight off the slope.
 */

const PAD = 20;

// A sits at the diagram centre-ish (a real worldpoint).
const A: DiagramPoint = { X: 0.25, T: 0 };

function project(p: DiagramPoint, cx: number, cy: number, unit: number): [number, number] {
  return [cx + p.X * unit, cy - p.T * unit];
}
function unproject(sx: number, sy: number, cx: number, cy: number, unit: number): DiagramPoint {
  return { X: (sx - cx) / unit, T: (cy - sy) / unit };
}

// Clamp an (X, T) point into the right half-diamond 0 ≤ X, |T| + X ≤ π.
function clampToDiamond(p: DiagramPoint): DiagramPoint {
  let X = Math.max(0.001, p.X);
  let T = p.T;
  const budget = Math.PI - 0.02;
  if (Math.abs(T) + X > budget) {
    const over = Math.abs(T) + X - budget;
    // shrink whichever is larger, keeping inside
    if (X > Math.abs(T)) X -= over;
    else T -= Math.sign(T) * over;
    X = Math.max(0.001, X);
  }
  return { X, T };
}

export function MinkowskiCausalityScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [bPoint, setBPoint] = useState<DiagramPoint>({ X: 0.5, T: 1.5 });
  const dragging = useRef(false);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.78,
    maxHeight: SCENE_HEIGHT_DEFAULT + 60,
    minHeight: 360,
  });

  // Geometry shared between draw and pointer handlers.
  const geomRef = useRef({ cx: 0, cy: 0, unit: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    geomRef.current = computeGeom(width, height);
    draw(ctx, tokens, bPoint, geomRef.current, width, height);
  }, [tokens, bPoint, width, height]);

  const pointerToDiagram = (e: React.PointerEvent<HTMLCanvasElement>): DiagramPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { cx, cy, unit } = geomRef.current;
    return clampToDiamond(unproject(sx, sy, cx, cy, unit));
  };

  const rel = causalRelation(A, bPoint);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", touchAction: "none", cursor: "grab" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Interactive Penrose diagram of Minkowski space. Drag event B to compare its causal relationship to the fixed observer A: green inside A's future light cone, amber on it, red when spacelike separated."
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setBPoint(pointerToDiagram(e));
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setBPoint(pointerToDiagram(e));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span>
          A→B:{" "}
          <span
            style={{
              color:
                rel === "timelike"
                  ? "var(--color-mint)"
                  : rel === "null"
                    ? "var(--color-amber)"
                    : "var(--color-red)",
            }}
          >
            {rel === "timelike"
              ? bPoint.T > A.T
                ? "TIMELIKE — A can reach B"
                : "TIMELIKE — B is in A's past"
              : rel === "null"
                ? "NULL — only light connects A and B"
                : "SPACELIKE — no signal connects A and B"}
          </span>
        </span>
        <span className="text-[var(--color-fg-4)]">drag B anywhere in the diamond</span>
      </div>
    </div>
  );
}

function computeGeom(W: number, H: number) {
  const availW = W - PAD * 2;
  const availH = H - PAD * 2 - 24;
  const unit = Math.min(availW / (Math.PI * 1.08), availH / (Math.PI * 2.1));
  const cx = PAD + 16;
  const cy = PAD + 24 + availH / 2;
  return { cx, cy, unit };
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  B: DiagramPoint,
  geom: { cx: number; cy: number; unit: number },
  W: number,
  H: number,
) {
  const { cx, cy, unit } = geom;
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 6, "COMPACTIFIED MINKOWSKI SPACE", tokens.textMute);

  const inf = conformalInfinities();
  const ip = project(inf.iPlus, cx, cy, unit);
  const im = project(inf.iMinus, cx, cy, unit);
  const i0 = project(inf.iZero, cx, cy, unit);
  const origin = project({ X: 0, T: 0 }, cx, cy, unit);

  // ── diamond boundary (r = 0 axis on the left, ℐ± on the right) ───────────
  // left edge (r = 0): vertical line from i⁻ to i⁺
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ip[0], ip[1]);
  ctx.lineTo(im[0], im[1]);
  ctx.stroke();

  // ℐ⁺ (amber) and ℐ⁻ (blue) null edges
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ip[0], ip[1]);
  ctx.lineTo(i0[0], i0[1]);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(tokens.blue, 0.85);
  ctx.beginPath();
  ctx.moveTo(im[0], im[1]);
  ctx.lineTo(i0[0], i0[1]);
  ctx.stroke();

  // ── A's future + past light cone (45° lines through A) ───────────────────
  const a = project(A, cx, cy, unit);
  const coneLen = unit * Math.PI;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  // future cone: up-left and up-right at slope ±1
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(a[0] + coneLen, a[1] - coneLen);
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(a[0] - coneLen, a[1] - coneLen);
  // past cone
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(a[0] + coneLen, a[1] + coneLen);
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(a[0] - coneLen, a[1] + coneLen);
  ctx.stroke();
  ctx.setLineDash([]);

  // Shade A's future cone faintly so "reachable" reads visually.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(a[0] + coneLen, a[1] - coneLen);
  ctx.lineTo(a[0] - coneLen, a[1] - coneLen);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(tokens.mint, 0.08);
  ctx.fill();
  ctx.restore();

  // ── B with causal coloring + connector to A ──────────────────────────────
  const rel = causalRelation(A, B);
  const relColor =
    rel === "timelike" ? tokens.mint : rel === "null" ? tokens.amber : tokens.red;
  const b = project(B, cx, cy, unit);

  ctx.strokeStyle = hexToRgba(relColor, 0.7);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();

  // points
  drawDot(ctx, a[0], a[1], tokens.cyan, "A");
  drawDot(ctx, b[0], b[1], relColor, "B", tokens);

  // ── infinity labels ──────────────────────────────────────────────────────
  ctx.fillStyle = tokens.textDim;
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("i⁺", ip[0] + 6, ip[1]);
  ctx.fillText("i⁻", im[0] + 6, im[1]);
  ctx.textAlign = "right";
  ctx.fillText("i⁰", i0[0] - 6, i0[1]);
  ctx.fillStyle = hexToRgba(tokens.amber, 0.95);
  ctx.fillText("ℐ⁺", (ip[0] + i0[0]) / 2 - 6, (ip[1] + i0[1]) / 2 - 12);
  ctx.fillStyle = hexToRgba(tokens.blue, 0.9);
  ctx.fillText("ℐ⁻", (im[0] + i0[0]) / 2 - 6, (im[1] + i0[1]) / 2 + 12);
  ctx.textAlign = "left";

  // r = 0 axis label
  ctx.fillStyle = tokens.textFaint;
  ctx.save();
  ctx.translate(origin[0] - 12, origin[1]);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("r = 0", 0, 0);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  tokens?: SceneTokens,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens?.textBright ?? color;
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 8, y - 4);
  ctx.textBaseline = "alphabetic";
}
