"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneSlider,
  SceneStage,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import {
  G,
  positionLinearDrag,
  terminalVelocityLinear,
  velocityLinearDrag,
} from "@/lib/physics/friction";

/** Inline height cap; the sphere and arrows grow past it in full view. */
const MAX_HEIGHT = 380;
/**
 * Fixed sphere mass; the slider sets the drag coefficient b, which in Stokes'
 * law is proportional to viscosity × radius (a dust mote in air vs a
 * ball-bearing in honey).
 */
const SPHERE_MASS = 0.02; // kg
/** Keys whose guide entry is about the falling sphere. */
const SPHERE_KEYS = ["speed"];

/** Length of the run for drag coefficient b: four time constants, at least 1.5 s. */
function runTime(b: number): number {
  return Math.max(4 * (SPHERE_MASS / b), 1.5);
}

/**
 * FIG.04b — a sphere sinking through a fluid with linear drag, beside its
 * v(t) trace, which rises along v_t(1 − e^(−t/τ)) towards terminal velocity.
 * The motion is a function of time, so it can be scrubbed.
 */
export function TerminalVelocityScene() {
  const t = useTranslations("scenes.terminalVelocity");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: MAX_HEIGHT,
    initialWidth: 640,
    // The column and the trace stretch to any shape.
    fullView: "fill",
  });
  const [dragB, setDragB] = useState(0.08);

  const vt = terminalVelocityLinear(SPHERE_MASS, dragB, G);
  const tau = SPHERE_MASS / dragB;
  const tMax = runTime(dragB);
  const vAt = (time: number) => velocityLinearDrag(time, SPHERE_MASS, dragB, G);
  const fallAt = (time: number) =>
    positionLinearDrag(time, SPHERE_MASS, dragB, G) / positionLinearDrag(tMax, SPHERE_MASS, dragB, G);

  // Every pixel size goes through `u`, so text and objects grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  // The column, sphere and arrows also grow with a tall canvas. Inline this is 1.
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  // Left: the fluid column.
  const colPad = u(24);
  const colW = Math.min(width * 0.32, o(200));
  const columnTop = u(36);
  const columnBottom = height - u(36);
  const columnH = columnBottom - columnTop;
  const sphereX = colPad + colW / 2;
  const sphereR = o(10);
  const maxArrow = o(44);
  /** The sphere's centre at scene time `time`: distance fallen, to scale. */
  const sphereYAt = (time: number) => columnTop + o(20) + fallAt(time) * (columnH - o(40));
  const dragLenAt = (time: number) => Math.min(maxArrow, ((dragB * vAt(time)) / (SPHERE_MASS * G)) * maxArrow);

  // Right: the v(t) trace.
  const plotL = colPad + colW + u(48);
  const plotR = width - u(20);
  const plotT = columnTop;
  const plotB = columnBottom;
  const plotW = plotR - plotL;
  const vtY = plotT + u(16);
  const toPx = (time: number, v: number) => ({
    px: plotL + (time / tMax) * plotW,
    py: plotB - (v / vt) * (plotB - vtY),
  });

  const timeRef = useRef(0);
  const hover = useSceneHover(canvasRef, (px, py) => {
    const time = timeRef.current;
    const sy = sphereYAt(time);
    if (Math.hypot(px - sphereX, py - sy) <= sphereR + u(8)) return "speed";
    if (
      Math.abs(px - sphereX) <= u(12) &&
      py >= sy - dragLenAt(time) - u(6) &&
      py <= sy + maxArrow + u(6)
    ) {
      return "forces";
    }
    if (px >= colPad && px <= colPad + colW && py >= columnTop && py <= columnBottom) return "drag";
    if (px >= plotL && px <= plotR) {
      if (Math.abs(py - vtY) <= u(9)) return "terminal";
      if (py >= plotT && py <= plotB) return "speed";
    }
    return null;
  });
  const { activeKey, pointer } = hover;
  const sphereFocused = activeKey !== null && SPHERE_KEYS.includes(activeKey);

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: tMax,
    draw: (time) => {
      timeRef.current = time;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const v = vAt(time);

      // ---- Fluid column ----
      ctx.fillStyle = hexToRgba(tokens.gridHeavy, 0.13);
      ctx.fillRect(colPad, columnTop, colW, columnH);
      const fluidFocused = activeKey === "drag";
      ctx.strokeStyle = fluidFocused ? tokens.blue : tokens.gridHeavy;
      ctx.lineWidth = fluidFocused ? u(1.5) : 1;
      if (fluidFocused) ctx.setLineDash([u(4), u(3)]);
      ctx.strokeRect(colPad, columnTop, colW, columnH);
      ctx.setLineDash([]);

      // Sphere
      const sphereY = sphereYAt(time);
      ctx.fillStyle = tokens.cyan;
      ctx.shadowColor = hexToRgba(tokens.cyan, 0.5);
      ctx.shadowBlur = u(10);
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (sphereFocused) drawFocusRing(ctx, sphereX, sphereY, sphereR + u(6), tokens.cyan, scale);

      // Drag (up, grows with speed) and weight (down, fixed), to one scale.
      const forcesFocused = activeKey === "forces";
      const arrow = (toY: number, color: string) => {
        const dir = toY < sphereY ? -1 : 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = o(forcesFocused ? 2.5 : 1.5);
        ctx.beginPath();
        ctx.moveTo(sphereX, sphereY);
        ctx.lineTo(sphereX, toY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sphereX - o(3), toY - dir * o(4));
        ctx.lineTo(sphereX, toY);
        ctx.lineTo(sphereX + o(3), toY - dir * o(4));
        ctx.stroke();
      };
      const dragLen = dragLenAt(time);
      if (dragLen > o(4)) arrow(sphereY - dragLen, tokens.amber);
      arrow(sphereY + maxArrow, tokens.axes);
      const arrowText = forcesFocused ? tokens.textBright : tokens.textLabel;
      if (dragLen > o(4)) {
        drawLabel(ctx, t("dragArrow"), sphereX + u(8), sphereY - dragLen + u(4), {
          bounds,
          color: forcesFocused ? tokens.amber : arrowText,
          direction: "inherit",
          font: tokens.fontHudSmall,
        });
      }
      drawLabel(ctx, "mg", sphereX + u(8), sphereY + maxArrow - u(4), {
        bounds,
        color: arrowText,
        font: tokens.fontHudSmall,
      });

      // ---- v(t) trace ----
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, plotT);
      ctx.lineTo(plotL, plotB);
      ctx.lineTo(plotR, plotB);
      ctx.stroke();

      // Terminal-velocity asymptote
      const terminalFocused = activeKey === "terminal";
      ctx.strokeStyle = terminalFocused ? tokens.textBright : tokens.gridHeavy;
      ctx.lineWidth = terminalFocused ? u(1.5) : 1;
      ctx.setLineDash([u(3), u(3)]);
      ctx.beginPath();
      ctx.moveTo(plotL, vtY);
      ctx.lineTo(plotR, vtY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Time constant: shown while its readout or guide entry is pointed at.
      if (activeKey === "tau" && tau <= tMax) {
        const at = toPx(tau, vAt(tau));
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(at.px, plotB);
        ctx.lineTo(at.px, at.py);
        ctx.lineTo(plotL, at.py);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, "τ", at.px, plotB - u(10), {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
        drawLabel(ctx, "0.63 vₜ", plotL + u(6), at.py - u(10), {
          bounds,
          color: tokens.cyan,
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale,
        });
      }

      // The trace so far
      const speedFocused = activeKey === "speed";
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = u(speedFocused ? 3 : 2);
      ctx.beginPath();
      const samples = 200;
      for (let i = 0; i <= samples; i++) {
        const tt = (i / samples) * tMax;
        if (tt > time) break;
        const { px, py } = toPx(tt, vAt(tt));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const head = toPx(time, v);
      ctx.lineTo(head.px, head.py);
      ctx.stroke();

      // Cursor: picked out while the scrubber's guide entry is pointed at.
      if (activeKey === "scrub") {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(2), u(3)]);
        ctx.beginPath();
        ctx.moveTo(head.px, plotT);
        ctx.lineTo(head.px, plotB);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Moving dot on the trace
      if (time > 0 && time < tMax) {
        ctx.fillStyle = tokens.cyan;
        ctx.beginPath();
        ctx.arc(head.px, head.py, u(4), 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels after the curves.
      drawLabel(ctx, "vₜ", plotL + u(6), vtY - u(9), {
        bounds,
        color: terminalFocused ? tokens.textBright : tokens.textLabel,
        font: tokens.fontHudSmall,
      });
      drawLabel(ctx, "t", (plotL + plotR) / 2, plotB + u(14), {
        bounds,
        color: tokens.textLabel,
        align: "center",
        font: tokens.fontHudSmall,
      });
      ctx.save();
      ctx.translate(plotL - u(14), (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = tokens.fontHudSmall;
      ctx.fillStyle = speedFocused ? tokens.textBright : tokens.textLabel;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = "ltr";
      ctx.fillText("v(t)", 0, 0);
      ctx.restore();

      // Measurement guidelines: read the trace at the pointer's time off both
      // axes (only where it has been drawn).
      const p = pointer;
      if (p && p.x >= plotL && p.x <= plotR && p.y >= plotT - u(9) && p.y <= plotB) {
        const tt = Math.min(((p.x - plotL) / plotW) * tMax, time);
        if (tt > 0) {
          const value = vAt(tt);
          const at = toPx(tt, value);
          ctx.strokeStyle = tokens.cyan;
          ctx.lineWidth = 1;
          ctx.setLineDash([u(4), u(3)]);
          ctx.beginPath();
          ctx.moveTo(plotL, at.py);
          ctx.lineTo(at.px, at.py);
          ctx.lineTo(at.px, plotB);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = tokens.bg1;
          ctx.beginPath();
          ctx.arc(at.px, at.py, u(5), 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = u(2);
          ctx.stroke();
          drawLabel(ctx, `${value.toFixed(2)} m/s`, plotL - u(4), at.py, {
            bounds,
            color: tokens.cyan,
            align: "right",
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale,
          });
          drawLabel(ctx, `${tt.toFixed(2)} s`, at.px, plotB - u(3), {
            bounds,
            color: tokens.textBright,
            align: "center",
            baseline: "bottom",
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale,
          });
        }
      }
    },
  });

  // Keep the sphere at the same point of its run (the same number of time
  // constants) while b is dragged; the run length changes with b.
  const changeDrag = (next: number) => {
    playback.seek((playback.getTime() / tMax) * runTime(next));
    setDragB(next);
  };

  const now = playback.time;

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
          <SceneControls playback={playback} scrub scrubKey="scrub" />
          <SceneReadout
            items={[
              {
                label: "v",
                value: `${vAt(now).toFixed(3)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "speed",
              },
              {
                label: (
                  <>
                    v<sub>t</sub>
                  </>
                ),
                value: `${vt.toFixed(2)} m/s`,
                guideKey: "terminal",
              },
              { label: "τ", value: `${tau.toFixed(2)} s`, guideKey: "tau" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("drag")}
            guideKey="drag"
            value={dragB}
            min={0.01}
            max={0.5}
            step={0.005}
            onChange={changeDrag}
            display={`${dragB.toFixed(3)} N·s/m`}
          />
          <p className="text-xs text-[var(--color-fg-2)]">{t("note")}</p>
        </SceneControlGroup>
      </div>
    </div>
  );
}
