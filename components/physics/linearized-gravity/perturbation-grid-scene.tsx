"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  hexToRgba,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";
import { planeWave } from "@/lib/physics/relativity/linearized-gravity";

/**
 * FIG.50a — g = η + h: a ripple on flat spacetime.
 *
 * A flat coordinate grid (the Minkowski background η) is gently distorted
 * by a transverse plane wave h traveling left-to-right at the speed of
 * light. Sliders set the amplitude |h| (clamped to the small-perturbation
 * regime) and the wavelength λ. A toggle shows the undistorted background
 * for comparison and freezes the propagation.
 *
 * The vertical displacement of each grid node is the "+" component of the
 * TT perturbation evaluated at that node's x-position and the current
 * time; the wave visibly moves at constant speed because ω = c k.
 *
 * Palette (theme-aware):
 *   grid    — the flat background η
 *   cyan    — the perturbed grid η + h
 *   amber   — the propagation marker (wave crest, "moving at c")
 */

const PAD = 18;

export function PerturbationGridScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);

  // amplitude in "exaggerated" units (the on-screen pixels), label honestly
  const [amp, setAmp] = useState(0.18);
  const [waves, setWaves] = useState(1.6); // wavelengths across the grid
  const [showFlat, setShowFlat] = useState(true);
  const [running, setRunning] = useState(true);

  const ampRef = useRef(amp);
  const wavesRef = useRef(waves);
  const flatRef = useRef(showFlat);
  const runRef = useRef(running);
  useEffect(() => void (ampRef.current = amp), [amp]);
  useEffect(() => void (wavesRef.current = waves), [waves]);
  useEffect(() => void (flatRef.current = showFlat), [showFlat]);
  useEffect(() => void (runRef.current = running), [running]);

  const frozenT = useRef(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      if (runRef.current) frozenT.current = tickRef.current / 1000;
      draw(
        ctx,
        tokens,
        ampRef.current,
        wavesRef.current,
        flatRef.current,
        frozenT.current,
        width,
        height,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A flat coordinate grid representing Minkowski spacetime, gently rippled by a transverse plane-wave perturbation traveling across it at the speed of light. Sliders control the amplitude and wavelength of the perturbation."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <label className="flex items-center gap-2">
          <span className="w-28 shrink-0">|h| amplitude</span>
          <input
            type="range"
            min={0}
            max={0.32}
            step={0.005}
            value={amp}
            onChange={(e) => setAmp(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28 shrink-0">λ wavelength</span>
          <input
            type="range"
            min={0.6}
            max={3.2}
            step={0.05}
            value={waves}
            onChange={(e) => setWaves(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <Button active={showFlat} onClick={() => setShowFlat((v) => !v)}>
          background η {showFlat ? "on" : "off"}
        </Button>
        <Button active={running} onClick={() => setRunning((v) => !v)}>
          {running ? "propagating" : "frozen"}
        </Button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        Amplitude exaggerated by ~10²⁰ for visibility — a real wave has |h| ≈
        10⁻²¹.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  amp: number,
  waves: number,
  showFlat: boolean,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const x0 = PAD;
  const x1 = W - PAD;
  const y0 = PAD + 18;
  const y1 = H - PAD - 18;
  const gridW = x1 - x0;
  const gridH = y1 - y0;

  const cols = 22;
  const rows = 12;

  // Spatial wavenumber: `waves` wavelengths span the grid width.
  const k = (2 * Math.PI * waves) / gridW;
  const speed = 90; // px/sec — the crest speed (our stand-in for c)
  // Dispersion ω = c k makes the crest travel at `speed` for ANY wavelength.
  const omega = speed * k;
  const ampPx = amp * (gridH / 4);

  // Displacement field: vertical offset = "+"-polarized perturbation,
  // h = A cos(k z − ω t), so a crest sits at z = (ω/k) t = speed·t.
  const disp = (px: number, py: number) => {
    const h = planeWave(ampPx, k, omega, px - x0, t, 0);
    // Make the perturbation transverse and localized in y like a membrane:
    const envelope = Math.cos((Math.PI * (py - (y0 + y1) / 2)) / gridH);
    return h * envelope;
  };

  // ── flat background grid ────────────────────────────────────────────────
  if (showFlat) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.35);
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      const px = x0 + (gridW * c) / cols;
      ctx.beginPath();
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y1);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const py = y0 + (gridH * r) / rows;
      ctx.beginPath();
      ctx.moveTo(x0, py);
      ctx.lineTo(x1, py);
      ctx.stroke();
    }
  }

  // ── perturbed grid η + h (cyan) ─────────────────────────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.25;
  // vertical lines
  for (let c = 0; c <= cols; c++) {
    const px = x0 + (gridW * c) / cols;
    ctx.beginPath();
    for (let r = 0; r <= rows; r++) {
      const py = y0 + (gridH * r) / rows;
      const yy = py + disp(px, py);
      if (r === 0) ctx.moveTo(px, yy);
      else ctx.lineTo(px, yy);
    }
    ctx.stroke();
  }
  // horizontal lines
  for (let r = 0; r <= rows; r++) {
    const py = y0 + (gridH * r) / rows;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const px = x0 + (gridW * c) / cols;
      const yy = py + disp(px, py);
      if (c === 0) ctx.moveTo(px, yy);
      else ctx.lineTo(px, yy);
    }
    ctx.stroke();
  }

  // ── amber crest marker traveling at c ───────────────────────────────────
  // A crest (phase 0) sits where k·(x−x0) = ω·t, i.e. x−x0 = (ω/k)·t = speed·t,
  // wrapped into the visible window by the wavelength λ = 2π/k.
  const lambdaPx = (2 * Math.PI) / k;
  const crestX = x0 + ((speed * t) % lambdaPx);
  if (amp > 0.001) {
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.8);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(crestX, y0 - 6);
    ctx.lineTo(crestX, y1 + 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.amber;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("crest → c", crestX, y0 - 8);
    ctx.textAlign = "left";
  }

  // ── HUD ─────────────────────────────────────────────────────────────────
  drawHudReadout(
    ctx,
    x0,
    y1 + 4,
    "g_{μν} = ",
    "η_{μν} + h_{μν}",
    tokens.textDim,
    tokens.cyan,
  );
}
