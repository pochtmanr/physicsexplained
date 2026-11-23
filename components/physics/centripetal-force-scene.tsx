"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneStage,
  drawArrow,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  type SceneTokens,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
  useSceneView,
} from "@/components/physics/_shared";
import { centripetalAccel } from "@/lib/physics/circular-motion";

/** Drawing size at which the three rows have their reference proportions. */
const REF_W = 480;
const REF_H = 360;
/** Path radius (px) at the reference size, shared by all rows. */
const PIVOT_R = 80;

// Shared physical parameters: the three sources differ only in name.
const M = 1.0; // kg
const V = 2.5; // m/s
const R = 1.0; // m
/** Animation seconds per lap. */
const PERIOD = 3.0;
/** The force arrow runs from the body to this fraction of the way out from the centre. */
const ARROW_END = 0.15;

type Kind = "ball" | "earth" | "car";

interface Row {
  key: "string" | "gravity" | "friction";
  kind: Kind;
  /** Name of the centre (translated). */
  center: string;
  /** Symbol of the force. */
  force: string;
  /** Title of the row (translated). */
  title: string;
}

/** One cell of the layout: a row inline, a column in a wide full view. */
interface Cell {
  /** Region the cell covers, for the hit test. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  titleX: number;
  titleY: number;
}

/** Distance from point (px, py) to the segment (x0, y0)–(x1, y1). */
function segmentDistance(px: number, py: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const s = len2 > 0 ? Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / len2)) : 0;
  return Math.hypot(px - (x0 + s * dx), py - (y0 + s * dy));
}

/**
 * FIG.04b — three sources of the same role: string tension, gravity and
 * static friction each supply the same inward force m·v²/r.
 */
export function CentripetalForceScene() {
  const t = useTranslations("scenes.centripetalForce");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { expanded } = useSceneView();
  const { width, height } = useSceneSize(containerRef, {
    ratio: REF_H / REF_W,
    maxHeight: REF_H,
    minHeight: 240,
    initialWidth: REF_W,
    // Rows inline; side by side when the full view is wide enough.
    fullView: "fill",
  });
  const playbackRef = useRef<ScenePlayback | null>(null);
  const F = centripetalAccel(V, R) * M;

  const scale = tokens.scale;
  const u = (n: number) => n * scale;

  const rows: Row[] = [
    { key: "string", kind: "ball", center: t("pivot"), force: "T", title: t("ballString") },
    { key: "gravity", kind: "earth", center: t("sun"), force: "F_g", title: t("earthSun") },
    { key: "friction", kind: "car", center: t("axis"), force: "f_s", title: t("carRoad") },
  ];

  // Layout. Inline (and in a narrow full view) the three rows are stacked in
  // a 480 × 360 frame, as the figure was drawn; a wide full view puts them
  // side by side so the circles can grow.
  const columns = expanded && width >= height * 1.5;
  let pathR: number;
  let objectScale: number;
  const cells: Cell[] = [];
  if (columns) {
    const colW = width / 3;
    pathR = Math.min(colW * 0.36, (height - u(48)) * 0.42);
    objectScale = Math.min(2.6, pathR / PIVOT_R);
    for (let i = 0; i < 3; i++) {
      cells.push({
        x0: colW * i,
        y0: 0,
        x1: colW * (i + 1),
        y1: height,
        cx: colW * (i + 0.5),
        cy: height / 2 + u(12),
        titleX: colW * i + u(12),
        titleY: u(16),
      });
    }
  } else {
    // Inline this is at most 1: the frame never grows past 480 × 360.
    objectScale = Math.min(2.6, width / REF_W, height / REF_H);
    pathR = PIVOT_R * objectScale;
    const frameW = REF_W * objectScale;
    const frameX = (width - frameW) / 2;
    const rowH = height / 3;
    for (let i = 0; i < 3; i++) {
      cells.push({
        x0: frameX,
        y0: rowH * i,
        x1: frameX + frameW,
        y1: rowH * (i + 1),
        cx: width / 2,
        cy: rowH * (i + 0.5),
        titleX: frameX + u(12),
        titleY: rowH * i + u(16),
      });
    }
  }
  const o = (n: number) => n * objectScale;

  const bodyAt = (cell: Cell, theta: number) => ({
    x: cell.cx + pathR * Math.cos(theta),
    y: cell.cy + pathR * Math.sin(theta),
  });
  const thetaAt = (time: number) => ((time % PERIOD) / PERIOD) * 2 * Math.PI;

  // A force arrow (the shared F) first, then a body (its row), the path
  // circles (the shared m, v, r), then anywhere else in a row.
  const hover = useSceneHover(canvasRef, (x, y) => {
    const theta = thetaAt(playbackRef.current?.getTime() ?? 0);
    const reach = u(9);
    for (const cell of cells) {
      const b = bodyAt(cell, theta);
      const ex = cell.cx + (b.x - cell.cx) * ARROW_END;
      const ey = cell.cy + (b.y - cell.cy) * ARROW_END;
      if (Math.hypot(x - b.x, y - b.y) > o(12) + reach && segmentDistance(x, y, b.x, b.y, ex, ey) <= reach) {
        return "force";
      }
    }
    for (let i = 0; i < 3; i++) {
      const cell = cells[i];
      const b = bodyAt(cell, theta);
      if (Math.hypot(x - b.x, y - b.y) <= o(12) + reach) return rows[i].key;
    }
    for (const cell of cells) {
      if (Math.abs(Math.hypot(x - cell.cx, y - cell.cy) - pathR) <= u(6)) return "params";
    }
    for (let i = 0; i < 3; i++) {
      const c = cells[i];
      if (x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1) return rows[i].key;
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const theta = thetaAt(time);

      for (let i = 0; i < 3; i++) {
        drawCell(ctx, tokens, cells[i], rows[i], bodyAt(cells[i], theta), {
          bounds,
          pathR,
          u,
          o,
          forceFocused: activeKey === "force",
          rowFocused: activeKey === rows[i].key,
          pathFocused: activeKey === "params",
        });
      }

      // Separators between the cells
      ctx.strokeStyle = tokens.textFaint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 3; i++) {
        if (columns) {
          ctx.moveTo(cells[i].x0, u(8));
          ctx.lineTo(cells[i].x0, height - u(8));
        } else {
          ctx.moveTo(cells[i].x0 + u(8), cells[i].y0);
          ctx.lineTo(cells[i].x1 - u(8), cells[i].y0);
        }
      }
      ctx.stroke();

      // Titles, bright while their row is pointed at
      for (let i = 0; i < 3; i++) {
        drawLabel(ctx, rows[i].title, cells[i].titleX, cells[i].titleY, {
          bounds,
          color: activeKey === rows[i].key ? tokens.textBright : tokens.textDim,
          direction: "inherit",
          font: tokens.fontHudSmall,
        });
      }
    },
  });
  // The hit test runs between renders and needs the live clock.
  playbackRef.current = playback;

  return (
    <div ref={containerRef} className="scene-root w-full pb-4">
      <div className="mx-auto" style={{ width }}>
        <SceneStage>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t("aria")}
            className={SCENE_CANVAS_CLASS}
            style={{ width, height }}
          />
        </SceneStage>
        <ScenePanel>
          <SceneControls playback={playback} />
          <SceneReadout
            items={[
              { label: "m", value: `${M.toFixed(1)} kg`, guideKey: "params" },
              { label: "v", value: `${V.toFixed(1)} m/s`, guideKey: "params" },
              { label: "r", value: `${R.toFixed(1)} m`, guideKey: "params" },
              {
                label: "F = m·v²/r",
                value: `${F.toFixed(2)} N`,
                color: "var(--color-magenta)",
                guideKey: "force",
              },
            ]}
          />
          <p className="mt-1 px-2 text-xs text-[var(--color-fg-2)]">{t("sameForce")}</p>
        </ScenePanel>
      </div>
    </div>
  );
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cell: Cell,
  row: Row,
  body: { x: number; y: number },
  opts: {
    bounds: { width: number; height: number };
    pathR: number;
    u: (n: number) => number;
    o: (n: number) => number;
    forceFocused: boolean;
    rowFocused: boolean;
    pathFocused: boolean;
  },
) {
  const { bounds, pathR, u, o } = opts;
  const { cx, cy } = cell;
  const scale = tokens.scale;

  // Path circle
  ctx.strokeStyle = opts.pathFocused ? tokens.cyan : tokens.textFaint;
  ctx.lineWidth = opts.pathFocused ? u(1.5) : 1;
  ctx.setLineDash(opts.pathFocused ? [] : [u(2), u(3)]);
  ctx.beginPath();
  ctx.arc(cx, cy, pathR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1;

  // Centre point
  ctx.fillStyle = tokens.textMute;
  ctx.beginPath();
  ctx.arc(cx, cy, o(3), 0, Math.PI * 2);
  ctx.fill();
  if (row.kind === "earth") {
    // The Sun at the centre
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(cx, cy, o(5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Force arrow, from the body toward the centre
  const ex = cx + (body.x - cx) * ARROW_END;
  const ey = cy + (body.y - cy) * ARROW_END;
  const arrowWidth = opts.forceFocused ? u(3) : opts.rowFocused ? u(2.5) : u(1.8);
  drawArrow(ctx, body.x, body.y, ex, ey, tokens.magenta, arrowWidth, o(6));

  // Body
  const glow = () => {
    ctx.shadowColor = hexToRgba(tokens.cyan, 0.5);
    ctx.shadowBlur = u(8);
  };
  ctx.fillStyle = tokens.cyan;
  if (row.kind === "ball") {
    glow();
    ctx.beginPath();
    ctx.arc(body.x, body.y, o(8), 0, Math.PI * 2);
    ctx.fill();
  } else if (row.kind === "earth") {
    glow();
    ctx.beginPath();
    ctx.arc(body.x, body.y, o(6), 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Car: a small rectangle whose long side is tangent to the path
    const tanAng = Math.atan2(body.y - cy, body.x - cx) + Math.PI / 2;
    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(tanAng);
    glow();
    ctx.fillRect(-o(12), -o(5), o(24), o(10));
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  if (opts.rowFocused) drawFocusRing(ctx, body.x, body.y, o(14), tokens.cyan, scale);

  // Labels: the centre's name and the force's symbol
  drawLabel(ctx, row.center, cx + u(6) + o(3), cy, {
    bounds,
    color: tokens.textLabel,
    direction: "inherit",
    font: tokens.fontHudSmall,
  });
  const focused = opts.forceFocused || opts.rowFocused;
  drawLabel(ctx, row.force, (body.x + cx) / 2 + u(6), (body.y + cy) / 2 - u(4), {
    bounds,
    color: tokens.magenta,
    font: focused ? tokens.fontHudLarge : tokens.fontHudSmall,
    plate: focused ? tokens.bg1 : undefined,
    scale,
  });
}
