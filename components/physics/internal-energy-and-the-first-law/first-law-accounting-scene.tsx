"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_HUD_LARGE,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawArrow,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  modeAccount,
  MODE_LABELS,
  type ProcessMode,
  type FirstLawAccount,
} from "@/lib/physics/thermodynamics/first-law";

/**
 * FIG.05a — the first law as live bookkeeping.
 *
 * A box stands for the system. Heat Q flows in from below (amber); work W is
 * done out to the right (cyan). The tall bar is the internal energy U, and it
 * rises or falls by exactly ΔU = Q − W as the sliders move. Three modes wire the
 * two flows differently: an engine takes heat in and pushes work out; pure
 * heating sends every joule into U; friction does work *on* the box with no heat
 * at all, and U still climbs. The running equation underneath always balances —
 * that is the whole content of the first law.
 */

const MODES: ProcessMode[] = ["engine", "heating", "friction"];
const U0 = 1200; // J baseline internal energy, for the bar

export function FirstLawAccountingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const [mode, setMode] = useState<ProcessMode>("engine");
  const [qIn, setQIn] = useState(1000); // J
  const [wOut, setWOut] = useState(600); // J

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const account = modeAccount(mode, qIn, wOut);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, { mode, account }, width, height);
  }, [mode, account, tokens, width, height]);

  // which sliders are live in this mode
  const qLive = mode !== "friction";
  const wLive = mode !== "heating";

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A box represents a thermodynamic system. Heat flows in, work flows out, and the internal-energy bar changes by ΔU = Q − W. Sliders set the heat and work; buttons switch between engine, heating, and friction modes."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-3" style={{ opacity: qLive ? 1 : 0.4 }}>
          <span className="w-36 shrink-0">heat in Q: {qIn} J</span>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={qIn}
            disabled={!qLive}
            onChange={(e) => setQIn(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
          />
        </span>
        <span className="flex items-center gap-3" style={{ opacity: wLive ? 1 : 0.4 }}>
          <span className="w-36 shrink-0">work out W: {wOut} J</span>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={wOut}
            disabled={!wLive}
            onChange={(e) => setWOut(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {MODES.map((m) => (
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
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}

interface DrawState {
  mode: ProcessMode;
  account: FirstLawAccount;
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

  const { Q, W: work, deltaU } = s.account;

  drawSectionTitle(ctx, 16, 10, "THE SYSTEM — ΔU = Q − W", tokens.textMute);

  // ── system box (left-centre) ──
  const boxX = W * 0.26;
  const boxY = H * 0.28;
  const boxW = W * 0.24;
  const boxH = H * 0.4;

  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = hexToRgba(tokens.mint, 0.1 + Math.max(0, Math.min(0.35, deltaU / 3000)));
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  ctx.fillText("system", boxX + boxW / 2, boxY + boxH / 2 - 6);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("internal energy U", boxX + boxW / 2, boxY + boxH / 2 + 10);
  ctx.textAlign = "left";

  // ── heat-in arrow (from below) ──
  if (Q > 0) {
    drawArrow(
      ctx,
      boxX + boxW / 2,
      boxY + boxH + 46,
      boxX + boxW / 2,
      boxY + boxH + 6,
      tokens.amber,
      2 + Math.min(4, Q / 400),
      9,
    );
    ctx.fillStyle = tokens.amber;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(`Q = ${Q} J`, boxX + boxW / 2, boxY + boxH + 60);
    ctx.textAlign = "left";
  }

  // ── work arrow (out to the right, or in from the right if negative) ──
  const wy = boxY + boxH / 2;
  if (work > 0) {
    drawArrow(ctx, boxX + boxW + 4, wy, boxX + boxW + 56, wy, tokens.cyan, 2 + Math.min(4, work / 400), 9);
    ctx.fillStyle = tokens.cyan;
  } else if (work < 0) {
    // work done ON the system (friction): arrow points inward
    drawArrow(ctx, boxX + boxW + 56, wy, boxX + boxW + 4, wy, tokens.cyan, 2 + Math.min(4, -work / 400), 9);
    ctx.fillStyle = tokens.cyan;
  }
  if (work !== 0) {
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(`W = ${work} J`, boxX + boxW + 30, wy - 10);
    ctx.textAlign = "left";
  }

  // ── internal-energy bar (right side) ──
  const barX = W * 0.74;
  const barW = 34;
  const barBase = H * 0.78;
  const barFullH = H * 0.5;
  const uMax = U0 + 2000;
  const uNow = U0 + deltaU;
  const baseFrac = U0 / uMax;
  const nowFrac = Math.max(0, Math.min(1, uNow / uMax));

  // track
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barBase - barFullH, barW, barFullH);
  // baseline U
  ctx.fillStyle = hexToRgba(tokens.textFaint, 0.5);
  ctx.fillRect(barX, barBase - barFullH * baseFrac, barW, barFullH * baseFrac);
  // delta region
  const deltaColor = deltaU >= 0 ? tokens.mint : tokens.red;
  const top = barBase - barFullH * nowFrac;
  const baseTop = barBase - barFullH * baseFrac;
  ctx.fillStyle = hexToRgba(deltaColor, 0.7);
  ctx.fillRect(barX, Math.min(top, baseTop), barW, Math.abs(top - baseTop));

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText("U", barX + barW / 2, barBase + 14);
  ctx.fillStyle = deltaColor;
  ctx.fillText(`${deltaU >= 0 ? "+" : ""}${deltaU} J`, barX + barW / 2, barBase - barFullH - 8);
  ctx.textAlign = "left";

  // ── running equation ──
  ctx.font = FONT_HUD_LARGE;
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.textBright;
  const eq = `ΔU = Q − W  =  ${Q} − (${work})  =  ${deltaU} J`;
  ctx.fillText(eq, W / 2, H - 10);
  ctx.textAlign = "left";
}
