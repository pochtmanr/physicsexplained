"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  chirpWaveform,
  chirpMass,
  type ChirpWaveform,
} from "@/lib/physics/relativity/ligo-and-multi-messenger";

/**
 * FIG.53b — GW150914 replay.
 *
 * A best-fit inspiral *template* (computed from the leading-order quadrupole
 * chirp, not a cartoon sine sweep) is drawn as a smooth band. A noisier
 * "reconstructed data" trace — the template plus a little jitter — is revealed
 * left-to-right as a playhead sweeps through the 0.2 s before merger, the way
 * the real signal climbed from ~35 Hz to ~250 Hz in a fifth of a second. A
 * live frequency readout climbs with the playhead.
 *
 * Masses are adjustable (defaults: 36 + 29 M☉, the GW150914 fit). Heavier
 * binaries merge at lower frequency; lighter ones chirp higher.
 */

const PAD = 18;
const T_START = -0.2; // s before coalescence
const T_END = -0.003;
const SAMPLES = 480;

export function GW150914ReplayScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const [m1, setM1] = useState(36);
  const [m2, setM2] = useState(29);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // Recompute the waveform only when masses change.
  const wfRef = useRef<ChirpWaveform | null>(null);
  useEffect(() => {
    wfRef.current = chirpWaveform({
      m1Solar: m1,
      m2Solar: m2,
      tStart: T_START,
      tEnd: T_END,
      samples: SAMPLES,
      hPeak: 1,
    });
  }, [m1, m2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      const wf = wfRef.current;
      if (wf) draw(ctx, tokens, wf, m1, m2, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, m1, m2, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A replay of the GW150914 strain signal. A best-fit inspiral template is overlaid with a noisy reconstructed data trace that sweeps in from the left, while a frequency readout climbs from about 35 to 250 hertz as the two black holes spiral to merger. Sliders set the two black-hole masses."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">m₁ = {m1.toFixed(0)} M☉</span>
        <input
          type="range"
          min={10}
          max={60}
          step={1}
          value={m1}
          onChange={(e) => setM1(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">m₂ = {m2.toFixed(0)} M☉</span>
        <input
          type="range"
          min={10}
          max={60}
          step={1}
          value={m2}
          onChange={(e) => setM2(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  wf: ChirpWaveform,
  m1: number,
  m2: number,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 6, "STRAIN  h(t)  —  GW150914 REPLAY", tokens.textMute);

  const plotX0 = PAD;
  const plotX1 = W - PAD;
  const plotY0 = PAD + 18;
  const plotY1 = H - PAD - 6;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;
  const midY = plotY0 + plotH / 2;

  // Zero line + axes.
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, midY);
  ctx.lineTo(plotX1, midY);
  ctx.stroke();

  const ampPx = plotH * 0.42;
  const xAt = (i: number) => plotX0 + (i / (wf.t.length - 1)) * plotW;
  const yAt = (h: number) => midY - h * ampPx;

  // Playhead loops over a ~3 s period for replay.
  const period = 3.2;
  const prog = (t % period) / period; // 0 → 1
  const headIdx = Math.floor(prog * (wf.t.length - 1));

  // ── Template band (full, faint) ───────────────────────────────────────────
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.28);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < wf.h.length; i++) {
    const x = xAt(i);
    const y = yAt(wf.h[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── Reconstructed data trace (template + jitter), revealed up to playhead ──
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= headIdx; i++) {
    // Deterministic pseudo-noise so the trace is stable frame to frame.
    const noise = 0.06 * Math.sin(i * 12.9898) * Math.cos(i * 4.1414 + 2);
    const x = xAt(i);
    const y = yAt(wf.h[i] + noise);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Playhead marker.
  const headX = xAt(headIdx);
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.8);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(headX, plotY0);
  ctx.lineTo(headX, plotY1);
  ctx.stroke();

  // ── Live readouts ─────────────────────────────────────────────────────────
  const fNow = wf.f[headIdx];
  const tNow = wf.t[headIdx];
  const mc = chirpMass(m1, m2);

  let y = plotY0 + 4;
  const hx = plotX0 + 8;
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "f_gw = ",
    `${fNow.toFixed(0)} Hz`,
    tokens.textDim,
    tokens.magenta,
  );
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "t − t_c = ",
    `${(tNow * 1000).toFixed(0)} ms`,
    tokens.textDim,
    tokens.amber,
  );
  drawHudReadout(
    ctx,
    hx,
    y,
    "M_chirp = ",
    `${mc.toFixed(1)} M☉`,
    tokens.textDim,
    tokens.cyan,
  );

  // Legend bottom-right.
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = tokens.amber;
  ctx.fillText("— reconstructed data", plotX1 - 4, plotY1 - 16);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.6);
  ctx.fillText("— best-fit template", plotX1 - 4, plotY1 - 2);
}
