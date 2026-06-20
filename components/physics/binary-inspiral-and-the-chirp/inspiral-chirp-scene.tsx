"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  chirpMass,
  frequencyAtTimeToMerger,
  iscoFrequency,
  orbitalSeparation,
  timeToCoalescence,
  M_SUN,
} from "@/lib/physics/relativity/binary-inspiral-and-the-chirp";

/**
 * FIG.52a — Inspiral orbit + live strain trace.
 *
 * TOP PANEL: two compact masses orbiting a common centre of mass. The orbital
 *   separation is set by the *physical* quadrupole frequency evolution
 *   (frequencyAtTimeToMerger → orbitalSeparation), so the orbit really does
 *   shrink and speed up the way GR predicts. A play/restart button drives a
 *   τ (time-before-merger) clock; masses m1, m2 are adjustable.
 *
 * BOTTOM PANEL: the strain h(t) scrolling left — frequency and amplitude rise
 *   together into the merger. The trace is built from the same f(τ), so the
 *   rising pitch and swelling envelope are honest, not a cartoon sine sweep.
 */

const PAD = 16;
const TAU_MIN = 0.0035; // s before merger where we stop the point-mass model
const SPEEDUP = 1; // playback runs in physical seconds-before-merger

function fmtSep(a_m: number): string {
  const km = a_m / 1000;
  if (km > 1e4) return `${(km / 1e3).toFixed(0)} ×10³ km`;
  return `${km.toFixed(0)} km`;
}

export function InspiralChirpScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [m1, setM1] = useState(36);
  const [m2, setM2] = useState(29);
  const [playing, setPlaying] = useState(true);

  // τ = time before merger (seconds). We sweep it down toward TAU_MIN.
  const tauRef = useRef(8);
  const orbitPhaseRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  // rolling history of (relative time, strain) for the scrolling trace
  const historyRef = useRef<{ x: number; h: number }[]>([]);
  const tElapsedRef = useRef(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT + 60,
    minHeight: 340,
  });

  // reset when masses change
  useEffect(() => {
    tauRef.current = 8;
    orbitPhaseRef.current = 0;
    historyRef.current = [];
    tElapsedRef.current = 0;
    lastTsRef.current = null;
  }, [m1, m2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mc = chirpMass(m1 * M_SUN, m2 * M_SUN);
    const Mtot = (m1 + m2) * M_SUN;
    const fIsco = iscoFrequency(Mtot);
    const tauEnd = Math.max(TAU_MIN, timeToCoalescence(fIsco, mc));

    let raf = 0;
    const loop = (ts: number) => {
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (lastTsRef.current == null) lastTsRef.current = ts;
      let dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      if (dt > 0.1) dt = 0.1;

      if (playing) {
        const tau = Math.max(tauEnd, tauRef.current);
        const f = frequencyAtTimeToMerger(tau, mc); // GW frequency
        const fOrb = f / 2;
        orbitPhaseRef.current += 2 * Math.PI * fOrb * dt * 0.06;
        // advance τ toward merger (physical clock, slowed for viewing late)
        const newTau = tauRef.current - dt * SPEEDUP;
        tauRef.current = newTau <= tauEnd ? 8 : newTau; // loop the inspiral
        if (newTau <= tauEnd) {
          historyRef.current = [];
          tElapsedRef.current = 0;
          orbitPhaseRef.current = 0;
        }
        // strain sample for trace
        tElapsedRef.current += dt;
        const amp = Math.pow(f, 2 / 3); // ∝ amplitude growth
        const hSample = amp * Math.cos(orbitPhaseRef.current * 2);
        historyRef.current.push({ x: tElapsedRef.current, h: hSample });
        if (historyRef.current.length > 1400) historyRef.current.shift();
      }

      draw(
        ctx,
        tokens,
        width,
        height,
        m1,
        m2,
        tauRef.current,
        tauEnd,
        mc,
        Mtot,
        orbitPhaseRef.current,
        historyRef.current,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height, m1, m2, playing]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two compact masses spiralling toward merger, with the gravitational-wave strain h(t) scrolling below. Frequency and amplitude rise together into the chirp. Sliders adjust the two masses."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0">m₁: {m1} M☉</span>
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={m1}
            onChange={(e) => setM1(parseInt(e.target.value, 10))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0">m₂: {m2} M☉</span>
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={m2}
            onChange={(e) => setM2(parseInt(e.target.value, 10))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="border px-3 py-1 border-[var(--color-cyan)] text-[var(--color-cyan)]"
          >
            {playing ? "pause" : "play"}
          </button>
          <button
            type="button"
            onClick={() => {
              tauRef.current = 8;
              orbitPhaseRef.current = 0;
              historyRef.current = [];
              tElapsedRef.current = 0;
              lastTsRef.current = null;
            }}
            className="border px-3 py-1 border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
          >
            restart inspiral
          </button>
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  m1: number,
  m2: number,
  tau: number,
  tauEnd: number,
  mc: number,
  Mtot: number,
  orbitPhase: number,
  history: { x: number; h: number }[],
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const orbitH = (H - PAD * 3) * 0.56;
  const traceH = H - PAD * 3 - orbitH;
  const orbitY0 = PAD;
  const traceY0 = orbitY0 + orbitH + PAD;

  // ── ORBIT PANEL ─────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, orbitY0, W - PAD * 2, orbitH);
  drawSectionTitle(ctx, PAD + 6, orbitY0 + 6, "INSPIRAL  (top-down view)", tokens.textMute);

  const cx = (W) / 2;
  const cy = orbitY0 + orbitH / 2 + 8;

  const f = frequencyAtTimeToMerger(Math.max(tauEnd, tau), mc);
  const sep = orbitalSeparation(f, Mtot);
  // map separation to pixels: start sep (at τ=8) defines the max radius
  const fStart = frequencyAtTimeToMerger(8, mc);
  const sepStart = orbitalSeparation(fStart, Mtot);
  const maxR = Math.min(orbitH, W - PAD * 2) * 0.34;
  const rPix = maxR * Math.cbrt(sep / sepStart); // visual scale of separation

  const total = m1 + m2;
  const r1 = rPix * (m2 / total);
  const r2 = rPix * (m1 / total);
  const x1 = cx + r1 * Math.cos(orbitPhase);
  const y1 = cy + r1 * Math.sin(orbitPhase) * 0.5;
  const x2 = cx - r2 * Math.cos(orbitPhase);
  const y2 = cy - r2 * Math.sin(orbitPhase) * 0.5;

  // faint orbit ellipses
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.4);
  ctx.lineWidth = 1;
  for (const r of [r1, r2]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // centre of mass
  ctx.fillStyle = tokens.textFaint;
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  // bodies, sized by mass
  const drawBody = (x: number, y: number, m: number, color: string) => {
    const rr = 4 + Math.sqrt(m) * 1.6;
    const g = ctx.createRadialGradient(x, y, 1, x, y, rr * 2.2);
    g.addColorStop(0, color);
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  };
  drawBody(x1, y1, m1, tokens.cyan);
  drawBody(x2, y2, m2, tokens.magenta);

  // HUD readouts
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText(`f_GW = ${f.toFixed(1)} Hz`, PAD + 6, orbitY0 + orbitH - 38);
  ctx.fillText(`separation = ${fmtSep(sep)}`, PAD + 6, orbitY0 + orbitH - 22);
  ctx.textAlign = "right";
  ctx.fillStyle = tokens.amber;
  ctx.fillText(
    `t to merger = ${Math.max(0, tau).toFixed(2)} s`,
    W - PAD - 6,
    orbitY0 + orbitH - 22,
  );
  ctx.textAlign = "left";

  // ── STRAIN TRACE PANEL ──────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, traceY0, W - PAD * 2, traceH);
  drawSectionTitle(ctx, PAD + 6, traceY0 + 6, "STRAIN  h(t)", tokens.textMute);

  const traceMidY = traceY0 + traceH / 2 + 6;
  // zero line
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.5);
  ctx.beginPath();
  ctx.moveTo(PAD + 4, traceMidY);
  ctx.lineTo(W - PAD - 4, traceMidY);
  ctx.stroke();

  if (history.length > 2) {
    const span = 4.0; // seconds of trace shown
    const tNow = history[history.length - 1].x;
    const x0 = PAD + 6;
    const x1px = W - PAD - 6;
    // normalize amplitude using running max
    let hMax = 1e-9;
    for (const p of history) hMax = Math.max(hMax, Math.abs(p.h));
    const ampPix = (traceH / 2 - 14) / hMax;

    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let started = false;
    for (const p of history) {
      const age = tNow - p.x;
      if (age > span) continue;
      const px = x1px - (age / span) * (x1px - x0);
      const py = traceMidY - p.h * ampPix;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // merger marker at right edge
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("now →", x1px, traceY0 + traceH - 4);
    ctx.textAlign = "left";
    ctx.fillText("← earlier", x0, traceY0 + traceH - 4);
  }
}
