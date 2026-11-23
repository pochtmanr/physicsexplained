"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneStage,
  drawFocusRing,
  drawLabel,
  syncCanvas,
  useFigureLinkTarget,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

const RATIO = 0.4;
/** Inline height cap; the setups grow with the canvas beyond it. */
const MAX_HEIGHT = 280;

// Each setup in its reference size (object-scale 1), in pixels.
const PENDULUM_LENGTH = 90;
const PENDULUM_AMP = 60;
const PENDULUM_PERIOD = 1.2; // s
const TIME_OFFSET = 0.5; // s — the right pendulum started half a second later
const SPRING_PERIOD = 1.4; // s
const SPRING_AMP = 45;
const SPRING_WALL = 75; // wall to column centre
const MASS_HALF = 16;
const ROTATOR_R = 60;
const ROTATOR_OMEGA = 2; // rad/s
const ROTATION_OFFSET_DEG = 45;
/** Widest half-extent and tallest extent of any setup, for the fit. */
const HALF_WIDTH_MAX = SPRING_WALL + 5;
const HEIGHT_MAX = 2 * ROTATOR_R + 12;

const ORDER: Mode[] = ["time", "space", "rotation"];

export type Mode = "time" | "space" | "rotation";
export type SymmetryMode = Mode | "auto";

interface Props {
  /**
   * Controls which symmetry is displayed.
   *  - omitted: current interactive behavior (user starts on "time", can click tabs).
   *  - "time" | "space" | "rotation": tabs hidden, scene locked to that mode.
   *  - "auto": tabs hidden, cycle through the three modes every 5 s.
   */
  mode?: SymmetryMode;
}

/**
 * FIG.08a — three little vignettes that each illustrate one symmetry of
 * physics and the conserved quantity it implies:
 *   - time translation  → energy
 *   - space translation → momentum
 *   - rotation          → angular momentum
 *
 * Each vignette animates a pair of mechanical setups displaced from each
 * other in the relevant coordinate and shows that they behave identically.
 */
export function SymmetryTriptychScene({ mode: modeProp }: Props) {
  const t = useTranslations("scenes.symmetryTriptych");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: RATIO,
    maxHeight: MAX_HEIGHT,
    minHeight: 220,
    initialWidth: 640,
    // Two columns, each setup centred and fitted to its column: any shape works.
    fullView: "fill",
  });
  const initialMode: Mode = modeProp && modeProp !== "auto" ? modeProp : "time";
  const [mode, setMode] = useState<Mode>(initialMode);
  const tabsVisible = modeProp === undefined;
  const { props: symmetryLink } = useFigureLinkTarget(tabsVisible ? "symmetry" : undefined, "scene");

  useEffect(() => {
    if (modeProp !== "auto") return;
    const id = setInterval(() => {
      setMode((prev) => ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]);
    }, 5000);
    return () => clearInterval(id);
  }, [modeProp]);

  useEffect(() => {
    if (modeProp === undefined || modeProp === "auto") return;
    setMode(modeProp);
  }, [modeProp]);

  // Text and offsets use `u`; the setups use `o`, fitted to their column and
  // to the space above the labels. Inline `o` is at most 1.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const padX = u(30);
  const colW = (width - 2 * padX) / 2;
  const leftCx = padX + colW * 0.5;
  const rightCx = padX + colW * 1.5;
  const labelY = height - u(16);
  const regionTop = u(14);
  const regionBottom = labelY - u(18);
  const regionH = regionBottom - regionTop;
  const midY = regionTop + regionH / 2;
  const objectScale = Math.max(
    0.5,
    Math.min(
      2.6,
      Math.max(scale, height / MAX_HEIGHT),
      (colW / 2 - u(6)) / HALF_WIDTH_MAX,
      regionH / HEIGHT_MAX,
    ),
  );
  const o = (n: number) => n * objectScale;

  /** Bounding circle of each setup in a column: centre and radius. */
  const setupBox = (cx: number) => {
    if (mode === "time") return { x: cx, y: midY, r: o(PENDULUM_AMP + 14) };
    if (mode === "space") return { x: cx - o(5), y: midY, r: o(SPRING_WALL + 4) };
    return { x: cx, y: midY, r: o(ROTATOR_R + 8) };
  };

  // Either setup stands for the pair, and so for the shift between them.
  const hover = useSceneHover(canvasRef, (px, py) => {
    for (const cx of [leftCx, rightCx]) {
      const b = setupBox(cx);
      if (Math.hypot(px - b.x, py - b.y) <= b.r) return "shift";
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
      const shiftFocused = activeKey === "shift";
      const conservedFocused = activeKey === "conserved";
      const label = (text: string, x: number, color = tokens.textDim) =>
        drawLabel(ctx, text, x, labelY, {
          bounds,
          color,
          align: "center",
          font: tokens.fontLabel,
          direction: "inherit",
        });
      const note = (text: string, x: number, y: number, color: string) =>
        drawLabel(ctx, text, x, y, {
          bounds,
          color,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });

      if (mode === "time") {
        const pivotY = midY - o(PENDULUM_LENGTH + 10) / 2;
        const swing = (t0: number) =>
          Math.sin((2 * Math.PI * t0) / PENDULUM_PERIOD) * o(PENDULUM_AMP);
        // While the shift is pointed at, the right pendulum's ghost shows
        // where it would be without the delay: the left one's position.
        if (shiftFocused) {
          ctx.globalAlpha = 0.35;
          drawPendulum(ctx, rightCx, pivotY, o(PENDULUM_LENGTH), swing(time), tokens.textBright, tokens.cyan, objectScale);
          ctx.globalAlpha = 1;
        }
        drawPendulum(ctx, leftCx, pivotY, o(PENDULUM_LENGTH), swing(time), tokens.textBright, tokens.cyan, objectScale);
        drawPendulum(ctx, rightCx, pivotY, o(PENDULUM_LENGTH), swing(time - TIME_OFFSET), tokens.textBright, tokens.cyan, objectScale);
        label(t("timeLeft"), leftCx);
        label(t("timeRight"), rightCx, shiftFocused ? tokens.cyan : tokens.textDim);
        if (shiftFocused) note(`Δt = ${TIME_OFFSET} s`, rightCx, pivotY - u(4), tokens.cyan);
      } else if (mode === "space") {
        // Two identical mass-spring oscillators offset in x
        const x = Math.sin((2 * Math.PI * time) / SPRING_PERIOD) * o(SPRING_AMP);
        for (const cx of [leftCx, rightCx]) {
          const wallX = cx - o(SPRING_WALL);
          drawWall(ctx, wallX, midY, o(22), tokens.textDim, objectScale);
          const massX = cx + o(5) + x;
          drawSpring(ctx, wallX, midY, massX - o(MASS_HALF), midY, tokens.textMute, objectScale);
          drawMass(ctx, massX, midY, o(MASS_HALF), tokens.cyan, tokens.textBright, objectScale);
        }
        label(t("spaceLeft"), leftCx);
        label(t("spaceRight"), rightCx, shiftFocused ? tokens.cyan : tokens.textDim);
        if (shiftFocused) {
          // The displacement between the two walls.
          const y = midY - o(22) - u(14);
          const x0 = leftCx - o(SPRING_WALL);
          const x1 = rightCx - o(SPRING_WALL);
          ctx.strokeStyle = tokens.cyan;
          ctx.lineWidth = u(1.5);
          ctx.beginPath();
          ctx.moveTo(x0, y - u(5));
          ctx.lineTo(x0, y + u(5));
          ctx.moveTo(x0, y);
          ctx.lineTo(x1, y);
          ctx.moveTo(x1, y - u(5));
          ctx.lineTo(x1, y + u(5));
          ctx.stroke();
          note("Δx", (x0 + x1) / 2, y, tokens.cyan);
        }
      } else {
        // Two identical rotators oriented at different angles
        const theta = ROTATOR_OMEGA * time;
        const offset = (ROTATION_OFFSET_DEG * Math.PI) / 180;
        if (shiftFocused) {
          ctx.globalAlpha = 0.35;
          drawRotator(ctx, rightCx, midY, o(ROTATOR_R), theta, tokens.textBright, tokens.amber, tokens.cyan, objectScale);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = tokens.cyan;
          ctx.lineWidth = u(2);
          ctx.beginPath();
          ctx.arc(rightCx, midY, o(ROTATOR_R) * 0.55, theta, theta + offset);
          ctx.stroke();
        }
        drawRotator(ctx, leftCx, midY, o(ROTATOR_R), theta, tokens.textBright, tokens.amber, tokens.cyan, objectScale);
        drawRotator(ctx, rightCx, midY, o(ROTATOR_R), theta + offset, tokens.textBright, tokens.amber, tokens.cyan, objectScale);
        label(t("rotationLeft"), leftCx);
        label(t("rotationRight"), rightCx, shiftFocused ? tokens.cyan : tokens.textDim);
        if (shiftFocused) note(`Δθ = ${ROTATION_OFFSET_DEG}°`, rightCx, midY - o(ROTATOR_R) - u(2), tokens.cyan);
      }

      // The conserved quantity, named over both setups while it is pointed at.
      if (conservedFocused) {
        for (const cx of [leftCx, rightCx]) {
          const b = setupBox(cx);
          drawFocusRing(ctx, b.x, b.y, Math.min(b.r, regionH / 2 + u(6)), tokens.mint, scale);
        }
        note(`${SYMBOL[mode]} = const`, width / 2, midY, tokens.mint);
      }
    },
  });

  const shift =
    mode === "time"
      ? `Δt = ${TIME_OFFSET} s`
      : mode === "space"
        ? "Δx"
        : `Δθ = ${ROTATION_OFFSET_DEG}°`;

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
              {
                label: t(`${mode}.symmetry`),
                value: <span dir="ltr">{shift}</span>,
                color: "var(--color-cyan)",
                guideKey: "shift",
              },
              {
                label: t("conservedLabel"),
                value: t(`${mode}.conserved`),
                color: "var(--color-mint)",
                guideKey: "conserved",
              },
            ]}
          />
          <p className="mt-2 px-2 text-xs text-[var(--color-fg-2)]">{t(`${mode}.caption`)}</p>
        </ScenePanel>
        {tabsVisible && (
          <SceneControlGroup>
            <div className="figure-link flex flex-wrap items-center gap-2" {...symmetryLink}>
              {ORDER.map((m) => (
                <Button key={m} active={mode === m} onClick={() => setMode(m)}>
                  {t(`${m}.tab`)}
                </Button>
              ))}
            </div>
          </SceneControlGroup>
        )}
      </div>
    </div>
  );
}

const SYMBOL: Record<Mode, string> = { time: "E", space: "p", rotation: "L" };

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  length: number,
  xOffset: number,
  color: string,
  bob: string,
  o: number,
) {
  const ballX = pivotX + xOffset;
  const ballY = pivotY + length - Math.abs(xOffset) * 0.3;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * o;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(ballX, ballY);
  ctx.stroke();

  ctx.fillStyle = bob;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10 * o, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 3 * o, 0, Math.PI * 2);
  ctx.fill();
}

function drawWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  half: number,
  color: string,
  o: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * o;
  ctx.beginPath();
  ctx.moveTo(x, y - half);
  ctx.lineTo(x, y + half);
  ctx.stroke();
  // Hatching behind the wall
  ctx.lineWidth = Math.max(1, o);
  ctx.beginPath();
  for (let k = -half; k < half; k += 7 * o) {
    ctx.moveTo(x, y + k);
    ctx.lineTo(x - 5 * o, y + k + 5 * o);
  }
  ctx.stroke();
}

function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  o: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, o);
  const coils = 10;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const nx = -uy;
  const ny = ux;
  const amp = 5 * o;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 0; i < coils; i++) {
    const frac = (i + 0.5) / coils;
    const sx = x1 + ux * len * frac + nx * (i % 2 === 0 ? amp : -amp);
    const sy = y1 + uy * len * frac + ny * (i % 2 === 0 ? amp : -amp);
    ctx.lineTo(sx, sy);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke: string,
  o: number,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.rect(x - r, y - r, 2 * r, 2 * r);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, o);
  ctx.stroke();
}

function drawRotator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  theta: number,
  color: string,
  endA: string,
  endB: string,
  o: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * o;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
  ctx.fillStyle = endA;
  ctx.beginPath();
  ctx.arc(-r, 0, 6 * o, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = endB;
  ctx.beginPath();
  ctx.arc(r, 0, 6 * o, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
