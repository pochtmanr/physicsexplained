"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawArrow,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  kelvinViolatorImpliesClausius,
  clausiusViolatorImpliesKelvin,
} from "@/lib/physics/thermodynamics/second-law";

/**
 * FIG.09a — The Clausius and Kelvin–Planck statements are one law.
 *
 * On its own, each statement forbids a different impossible machine: Clausius
 * bans heat flowing cold → hot for free; Kelvin–Planck bans heat turned fully
 * into work. The buttons wire one violator into an ordinary reversible machine
 * and show that it manufactures a violation of the other — so to forbid one is
 * to forbid both. Drag the reservoir temperatures to watch the energy ledger
 * rebalance.
 */

const Q_HOT = 100; // arbitrary heat unit for the engine/violator

type Mode = "both" | "kToC" | "cToK";

export function ClausiusVsKelvinScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [mode, setMode] = useState<Mode>("both");
  const [tHot, setTHot] = useState(400);
  const [tCold, setTCold] = useState(300);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, { mode, tHot, tCold }, width, height);
  }, [mode, tHot, tCold, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two forbidden engines between a hot and a cold reservoir, and the hybrid machines that prove the Clausius and Kelvin–Planck statements equivalent."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        {(
          [
            ["both", "the two forbidden engines"],
            ["kToC", "wire Kelvin → Clausius"],
            ["cToK", "wire Clausius → Kelvin"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="cursor-pointer rounded-sm border px-2 py-0.5"
            style={
              mode === m
                ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
                : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0" style={{ color: "var(--color-red)" }}>
            T_h: {tHot} K
          </span>
          <input
            type="range"
            min={330}
            max={600}
            step={10}
            value={tHot}
            onChange={(e) => setTHot(Math.max(tCold + 20, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-red)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0" style={{ color: "var(--color-blue)" }}>
            T_c: {tCold} K
          </span>
          <input
            type="range"
            min={200}
            max={380}
            step={10}
            value={tCold}
            onChange={(e) => setTCold(Math.min(tHot - 20, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-blue)" }}
          />
        </div>
      </div>
    </div>
  );
}

interface DrawState {
  mode: Mode;
  tHot: number;
  tCold: number;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: DrawState,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = 16;
  const hotY = PAD + 22;
  const coldY = H - PAD - 30;
  const barH = 16;

  // reservoir bars
  ctx.fillStyle = hexToRgba(tokens.red, 0.22);
  ctx.fillRect(PAD, hotY, W - 2 * PAD, barH);
  ctx.fillStyle = hexToRgba(tokens.blue, 0.22);
  ctx.fillRect(PAD, coldY, W - 2 * PAD, barH);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.red;
  ctx.fillText(`HOT RESERVOIR  T_h = ${s.tHot} K`, PAD + 4, hotY - 4);
  ctx.fillStyle = tokens.blue;
  ctx.fillText(`COLD RESERVOIR  T_c = ${s.tCold} K`, PAD + 4, coldY + barH + 11);

  const topY = hotY + barH;
  const botY = coldY;

  if (s.mode === "both") {
    drawSectionTitle(ctx, PAD, 2, "TWO FORBIDDEN ENGINES", tokens.textMute);
    // left: Clausius violator (heat cold -> hot, no work)
    clausiusBox(ctx, tokens, W * 0.28, topY, botY, "CLAUSIUS VIOLATOR", [
      "heat flows cold → hot",
      "with no work in",
    ]);
    // right: Kelvin-Planck violator (heat fully -> work)
    kelvinBox(ctx, tokens, W * 0.72, topY, botY, "KELVIN–PLANCK VIOLATOR", [
      "all heat → work",
      "nothing rejected",
    ]);
    footer(
      ctx,
      tokens,
      "Each is independently impossible. The next two buttons show that one impossibility implies the other.",
      W,
      H,
    );
    return;
  }

  if (s.mode === "kToC") {
    drawSectionTitle(ctx, PAD, 2, "KELVIN–PLANCK VIOLATOR DRIVES A FRIDGE", tokens.textMute);
    const r = kelvinViolatorImpliesClausius(Q_HOT, s.tHot, s.tCold);
    // left engine: K-P violator turns Q_h fully into work
    machine(ctx, tokens, W * 0.3, topY, botY, {
      title: "engine",
      qUp: 0,
      qDownFromHot: Q_HOT,
      workOut: r.work,
      workDir: "out",
      forbidden: true,
    });
    // right fridge: uses work to pump heat cold -> hot
    machine(ctx, tokens, W * 0.7, topY, botY, {
      title: "Carnot fridge",
      qUp: r.hotDelivered,
      qFromCold: r.coldExtracted,
      workIn: r.work,
      workDir: "in",
      forbidden: false,
    });
    footer(
      ctx,
      tokens,
      `Net result: ${r.netColdToHot.toFixed(0)} units of heat moved cold → hot with no work consumed — a Clausius violation.`,
      W,
      H,
    );
    return;
  }

  // cToK
  drawSectionTitle(ctx, PAD, 2, "CLAUSIUS VIOLATOR FEEDS AN ENGINE", tokens.textMute);
  const r = clausiusViolatorImpliesKelvin(Q_HOT, s.tHot, s.tCold);
  // left: Clausius violator pumps heat cold -> hot for free
  machine(ctx, tokens, W * 0.3, topY, botY, {
    title: "Clausius pump",
    qUp: r.coldExtracted,
    qFromCold: r.coldExtracted,
    workIn: 0,
    workDir: "none",
    forbidden: true,
  });
  // right: ordinary Carnot engine
  machine(ctx, tokens, W * 0.7, topY, botY, {
    title: "Carnot engine",
    qDownFromHot: Q_HOT,
    qDownToCold: r.coldExtracted,
    workOut: r.netWorkFromHot,
    workDir: "out",
    forbidden: false,
  });
  footer(
    ctx,
    tokens,
    `Net result: the cold reservoir breaks even and ${r.netWorkFromHot.toFixed(
      0,
    )} units of work come from the hot reservoir alone — a Kelvin–Planck violation.`,
    W,
    H,
  );
}

function clausiusBox(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  topY: number,
  botY: number,
  title: string,
  lines: string[],
) {
  const midY = (topY + botY) / 2;
  // upward heat arrow cold -> hot
  drawArrow(ctx, cx, botY, cx, topY, tokens.red, 2.5, 9);
  box(ctx, tokens, cx, midY, title, lines, true);
}

function kelvinBox(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  topY: number,
  botY: number,
  title: string,
  lines: string[],
) {
  const midY = (topY + botY) / 2;
  // heat down from hot into box, then all to work (sideways)
  drawArrow(ctx, cx, topY, cx, midY - 26, tokens.amber, 2.5, 9);
  drawArrow(ctx, cx, midY, cx + 70, midY, tokens.mint, 2.5, 9);
  ctx.fillStyle = tokens.mint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("W", cx + 74, midY + 3);
  box(ctx, tokens, cx, midY, title, lines, true);
}

interface MachineSpec {
  title: string;
  qUp?: number;
  qDownFromHot?: number;
  qDownToCold?: number;
  qFromCold?: number;
  workOut?: number;
  workIn?: number;
  workDir: "in" | "out" | "none";
  forbidden: boolean;
}

function machine(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  topY: number,
  botY: number,
  m: MachineSpec,
) {
  const midY = (topY + botY) / 2;
  // heat arrows
  if (m.qDownFromHot) {
    drawArrow(ctx, cx, topY, cx, midY - 26, tokens.amber, 2.5, 9);
    label(ctx, tokens, `${m.qDownFromHot.toFixed(0)}`, cx + 6, (topY + midY) / 2 - 12, tokens.amber);
  }
  if (m.qUp) {
    drawArrow(ctx, cx, midY - 26, cx, topY, tokens.red, 2.5, 9);
    label(ctx, tokens, `${m.qUp.toFixed(0)}`, cx + 6, (topY + midY) / 2 - 12, tokens.red);
  }
  if (m.qFromCold) {
    drawArrow(ctx, cx, botY, cx, midY + 26, tokens.blue, 2.5, 9);
    label(ctx, tokens, `${m.qFromCold.toFixed(0)}`, cx + 6, (botY + midY) / 2 + 6, tokens.blue);
  }
  if (m.qDownToCold) {
    drawArrow(ctx, cx, midY + 26, cx, botY, tokens.blue, 2.5, 9);
    label(ctx, tokens, `${m.qDownToCold.toFixed(0)}`, cx + 6, (botY + midY) / 2 + 6, tokens.blue);
  }
  // work arrow
  if (m.workDir === "out" && m.workOut) {
    drawArrow(ctx, cx, midY, cx + 70, midY, tokens.mint, 2.5, 9);
    label(ctx, tokens, `W=${m.workOut.toFixed(0)}`, cx + 50, midY - 8, tokens.mint);
  } else if (m.workDir === "in" && m.workIn) {
    drawArrow(ctx, cx - 70, midY, cx, midY, tokens.mint, 2.5, 9);
    label(ctx, tokens, `W=${m.workIn.toFixed(0)}`, cx - 64, midY - 8, tokens.mint);
  }
  box(ctx, tokens, cx, midY, m.title, [], m.forbidden);
}

function box(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  title: string,
  lines: string[],
  forbidden: boolean,
) {
  const w = 96;
  const h = 50;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.fillStyle = forbidden ? hexToRgba(tokens.red, 0.12) : hexToRgba(tokens.cyan, 0.1);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = forbidden ? tokens.red : tokens.cyan;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  ctx.fillText(title, cx, y - 6);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, y + h + 12 + i * 11));
  if (forbidden) {
    ctx.fillStyle = tokens.red;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("✕ FORBIDDEN", cx, cy + 3);
  }
  ctx.textAlign = "left";
}

function label(
  ctx: CanvasRenderingContext2D,
  _tokens: SceneTokens,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
}

function footer(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  text: string,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.textDim;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  wrapText(ctx, text, W / 2, H - 12, W - 40, 12);
  ctx.textAlign = "left";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxW: number,
  lh: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const startY = y - (lines.length - 1) * lh;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, startY + i * lh));
}
