"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
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
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { bowlState } from "@/lib/physics/energy";

const RATIO = 0.55;
/** Inline height cap; the ball grows past it in full view. */
const MAX_HEIGHT = 360;
/** Inline width at which the canvas reaches MAX_HEIGHT. */
const BASE_WIDTH = MAX_HEIGHT / RATIO;
const G = 9.80665;
/** Bowl half-width and rim height, metres. */
const HALF_WIDTH = 1.2;
const RIM_HEIGHT = 0.6;
const MASS = 1; // kg
/** Where the ball is released, metres from the centre. */
const AMPLITUDE = 1.0;
/** Energy at release, E0 = m·g·y at the release point. */
const E0 = MASS * G * RIM_HEIGHT * (AMPLITUDE / HALF_WIDTH) ** 2;
/** Length of one run, seconds. */
const RUN_SECONDS = 15;
/** Space under the bowl for the energy bar and its legend (at scale 1). */
const BAR_BLOCK = 80;

interface Run {
  /** Scene seconds since release. */
  t: number;
  /** ∫ friction dt so far: the energy already lost cannot come back. */
  frictionTime: number;
}

const atRelease = (): Run => ({ t: 0, frictionTime: 0 });

/** The ball's state for a run so far. */
function stateOf(run: Run, friction: number) {
  // bowlState fades the swing by exp(−friction·t·…); passing the mean
  // friction so far makes a mid-run change bend the fade from where it is.
  const meanFriction = run.t > 0 ? run.frictionTime / run.t : friction;
  return bowlState(run.t, AMPLITUDE, HALF_WIDTH, RIM_HEIGHT, MASS, meanFriction);
}

type Segment = "ke" | "pe" | "heat";

/**
 * FIG.05b — a ball released from inside a parabolic bowl, with its energy
 * budget as a stacked bar: kinetic, potential, and the heat friction makes.
 *
 * Friction can be changed while the ball swings, so the run is stepped
 * (`simulation`) and the heat already made stays made.
 */
export function EnergyBowlScene() {
  const t = useTranslations("scenes.energyBowl");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: RATIO,
    maxHeight: MAX_HEIGHT,
    minHeight: 150,
    initialWidth: 640,
    // The bowl's width and depth are drawn to separate scales, so it fills
    // any shape.
    fullView: "fill",
  });
  const [friction, setFriction] = useState(0);
  const reducedMotion = useReducedMotion();
  const runRef = useRef<Run>(atRelease());
  /** Friction was changed after the run ended and it has not been replayed. */
  const staleRunRef = useRef(false);

  // Text, bars and hairlines use `u`; the ball uses `o`.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(
    2.6,
    Math.max(scale, Math.min(height / MAX_HEIGHT, width / BASE_WIDTH)),
  );
  const o = (n: number) => n * objectScale;

  const padX = u(40);
  const padY = u(30);
  const bowlW = width - 2 * padX;
  const bowlH = Math.max(u(20), height - 2 * padY - u(BAR_BLOCK));
  const bowlCx = width / 2;
  const bowlTop = padY;
  const bowlBottom = bowlTop + bowlH;
  const mToPxX = bowlW / (2 * HALF_WIDTH);
  const mToPxY = bowlH / RIM_HEIGHT;
  const ballR = o(10);
  const barY = bowlBottom + u(30);
  const barW = width - 2 * padX;
  const barH = u(18);
  const legendY = barY + barH + u(10);
  const legendStep = u(110);

  /** Ball centre and energy split for the run so far. */
  const layout = () => {
    const s = stateOf(runRef.current, friction);
    const ke = E0 > 0 ? s.ke / E0 : 0;
    const pe = E0 > 0 ? s.pe / E0 : 0;
    const heat = Math.max(0, 1 - s.total / E0);
    return {
      s,
      ball: { x: bowlCx + s.x * mToPxX, y: bowlBottom - s.y * mToPxY - ballR },
      fractions: { ke, pe, heat } as Record<Segment, number>,
    };
  };
  /** Left edge and width of each bar segment, in stacking order. */
  const segments = (f: Record<Segment, number>) => {
    const keW = barW * f.ke;
    const peW = barW * f.pe;
    return {
      ke: { x: padX, w: keW },
      pe: { x: padX + keW, w: peW },
      heat: { x: padX + keW + peW, w: barW * f.heat },
    } as Record<Segment, { x: number; w: number }>;
  };
  const SEGMENT_ORDER: Segment[] = ["ke", "pe", "heat"];

  // The ball (its speed), a bar segment or its legend entry.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const { ball, fractions } = layout();
    const reach = u(9);
    if (Math.hypot(px - ball.x, py - ball.y) <= ballR + reach) return "ke";
    if (py >= barY - u(4) && py <= barY + barH + u(4)) {
      const segs = segments(fractions);
      for (const key of SEGMENT_ORDER) {
        const seg = segs[key];
        if (seg.w > 0 && px >= seg.x && px <= seg.x + seg.w) return key;
      }
    }
    if (py >= legendY - u(4) && py <= legendY + u(14)) {
      for (let i = 0; i < SEGMENT_ORDER.length; i++) {
        const x0 = padX + i * legendStep;
        if (px >= x0 - u(4) && px <= x0 + legendStep - u(16)) return SEGMENT_ORDER[i];
      }
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    simulation: {
      step: (dt) => {
        const run = runRef.current;
        const step = Math.min(dt, RUN_SECONDS - run.t);
        runRef.current = { t: run.t + step, frictionTime: run.frictionTime + friction * step };
      },
      reset: () => {
        runRef.current = atRelease();
      },
      isDone: () => runRef.current.t >= RUN_SECONDS,
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const { s, ball, fractions } = layout();
      const colors: Record<Segment, string> = { ke: tokens.cyan, pe: tokens.amber, heat: tokens.red };

      // Bowl curve
      ctx.strokeStyle = tokens.textMute;
      ctx.lineWidth = u(2);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const xM = (i / 60 - 0.5) * 2 * HALF_WIDTH;
        const yM = RIM_HEIGHT * (xM / HALF_WIDTH) ** 2;
        const px = bowlCx + xM * mToPxX;
        const py = bowlBottom - yM * mToPxY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Rim level
      ctx.strokeStyle = tokens.textFaint;
      ctx.lineWidth = 1;
      ctx.setLineDash([u(2), u(4)]);
      ctx.beginPath();
      ctx.moveTo(padX, bowlTop);
      ctx.lineTo(width - padX, bowlTop);
      ctx.stroke();
      ctx.setLineDash([]);

      // Height above the bottom, while the potential energy is pointed at.
      if (activeKey === "pe") {
        const contactY = ball.y + ballR;
        ctx.strokeStyle = tokens.amber;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(ball.x, contactY);
        ctx.lineTo(ball.x, bowlBottom);
        ctx.moveTo(Math.min(bowlCx, ball.x) - u(10), bowlBottom);
        ctx.lineTo(Math.max(bowlCx, ball.x) + u(10), bowlBottom);
        ctx.stroke();
        ctx.setLineDash([]);
        const side = ball.x >= bowlCx ? 1 : -1;
        drawLabel(ctx, `y = ${s.y.toFixed(2)} m`, ball.x + side * u(8), (contactY + bowlBottom) / 2, {
          bounds,
          color: tokens.amber,
          align: side > 0 ? "left" : "right",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale,
        });
      }

      // Ball
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tokens.textBright;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (activeKey === "ke") {
        drawFocusRing(ctx, ball.x, ball.y, ballR + u(6), tokens.textBright, scale);
      }

      // Energy bar, stacked: kinetic, potential, heat.
      drawLabel(ctx, t("budget"), padX, barY - u(10), {
        bounds,
        color: tokens.textDim,
        font: tokens.fontHud,
        direction: "inherit",
      });
      const segs = segments(fractions);
      for (const key of SEGMENT_ORDER) {
        ctx.fillStyle = colors[key];
        ctx.fillRect(segs[key].x, barY, segs[key].w, barH);
      }
      ctx.strokeStyle = tokens.textMute;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, barY, barW, barH);
      // The friction slider points at what it feeds: the heat.
      const focusedSegment: Segment | null =
        activeKey === "friction" ? "heat" : SEGMENT_ORDER.find((k) => k === activeKey) ?? null;
      if (focusedSegment && segs[focusedSegment].w > 0) {
        ctx.strokeStyle = tokens.textBright;
        ctx.lineWidth = u(2);
        ctx.strokeRect(segs[focusedSegment].x, barY, segs[focusedSegment].w, barH);
      }

      // Legend
      const names: Record<Segment, string> = { ke: "KE", pe: "PE", heat: t("heatShort") };
      SEGMENT_ORDER.forEach((key, i) => {
        const x0 = padX + i * legendStep;
        ctx.fillStyle = colors[key];
        ctx.fillRect(x0, legendY, u(10), u(10));
        drawLabel(ctx, names[key], x0 + u(16), legendY + u(5), {
          bounds,
          color: focusedSegment === key ? tokens.textBright : tokens.textDim,
          font: tokens.fontHud,
          direction: "inherit",
        });
      });

      // Header equation; the remark after it only where it fits.
      ctx.font = tokens.fontHudLarge;
      const formula = friction > 0 ? t("formulaFriction") : t("formulaConserved");
      const full = `${formula} ${friction > 0 ? t("noteFriction") : t("noteConserved")}`;
      const header = ctx.measureText(full).width <= width - u(16) ? full : formula;
      drawLabel(ctx, header, width / 2, u(18), {
        bounds,
        color: tokens.textDim,
        align: "center",
        font: tokens.fontHudLarge,
        // Inherit: in Hebrew the remark reads after the formula, from the right.
        direction: "inherit",
      });
    },
  });

  // A new friction never restarts a run in progress. A finished run starts
  // again once the reader lets go of the slider.
  const changeFriction = (next: number) => {
    if (next === friction) return;
    setFriction(next);
    if (playback.status === "ended") staleRunRef.current = true;
  };
  const commit = () => {
    if (!staleRunRef.current) return;
    staleRunRef.current = false;
    if (playback.status !== "ended") return;
    if (reducedMotion) playback.seek(0);
    else playback.replay();
  };

  const { fractions } = layout();
  const pct = (f: number) => `${(f * 100).toFixed(0)}%`;

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
              { label: t("ke"), value: pct(fractions.ke), color: "var(--color-cyan)", guideKey: "ke" },
              { label: t("pe"), value: pct(fractions.pe), color: "var(--color-amber)", guideKey: "pe" },
              { label: t("heat"), value: pct(fractions.heat), color: "var(--color-red)", guideKey: "heat" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("friction")}
            guideKey="friction"
            value={friction}
            min={0}
            max={0.4}
            step={0.005}
            onChange={changeFriction}
            onCommit={commit}
            display={friction.toFixed(3)}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
