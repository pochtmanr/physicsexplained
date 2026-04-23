"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { huygensSum, doubleSlitFringeSpacing } from "@/lib/physics/electromagnetism/diffraction";

const RATIO = 0.6;
const MAX_HEIGHT = 560;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const MAGENTA = "rgba(255, 100, 200,";

type Mode = "particle" | "wave";

/**
 * FIG.49 — THE MONEY SHOT.
 *
 * Young 1801, redone at 60 Hz. A single coherent source illuminates two
 * narrow slits separated by `d`; the light lands on a screen a distance
 * `L` away. The scene runs in two reveal modes:
 *
 *   - particle-view: a stream of photons is accumulated dot-by-dot at
 *     screen positions SAMPLED from the Huygens-Fresnel intensity pattern
 *     as a probability density. Every photon hits ONE spot. But the
 *     ensemble histogram builds up the wave-interference fringe pattern.
 *     This is the classical-to-quantum emotional apex of the topic.
 *
 *   - wave-view: the continuous intensity I(y) from huygensSum is drawn
 *     as a filled curve on the screen — the "classical" reveal.
 *
 * Sliders: slit separation d, wavelength λ, screen distance L, play speed.
 * The analytical fringe spacing Δy = λL/d is pinned to the readout so the
 * reader can check that fringe pitch matches the formula live.
 */
export function DoubleSlitBuildupScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 880, height: 520 });
  // Physical units throughout: mm for lengths, nm for wavelength
  const [slitSepMm, setSlitSepMm] = useState(0.25);     // d
  const [wavelengthNm, setWavelengthNm] = useState(550); // λ
  const [screenDistMm, setScreenDistMm] = useState(500); // L
  const [mode, setMode] = useState<Mode>("particle");
  const [playSpeed, setPlaySpeed] = useState(1.0);       // 0.1 – 8.0 ×
  const [paused, setPaused] = useState(false);

  // Resize observer — make the canvas fluid.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Recompute the intensity curve (and CDF for sampling) when physical
  // sliders change. 1024 bins is plenty for smooth sampling.
  const BINS = 1024;
  const SCREEN_HALF_WIDTH_MM = 10; // total visible screen 20 mm wide
  const { intensity, cdf } = useMemo(() => {
    const lambdaMm = wavelengthNm * 1e-6;
    const I = huygensSum({
      slitPositions: [-slitSepMm / 2, +slitSepMm / 2],
      // Narrow slits — the single-slit envelope is broad and flat across
      // the screen. Set slitWidth small compared to d.
      slitWidth: Math.max(0.005, slitSepMm * 0.08),
      wavelengthMm: lambdaMm,
      distanceToScreen: screenDistMm,
      screenHalfWidth: SCREEN_HALF_WIDTH_MM,
      bins: BINS,
    });
    // Build a CDF so we can sample photon landing positions by inverse
    // transform on [0, 1). Accumulate I into a non-normalised cdf then
    // normalise the tail.
    const c = new Float64Array(BINS);
    let running = 0;
    for (let i = 0; i < BINS; i += 1) {
      running += I[i];
      c[i] = running;
    }
    const total = c[BINS - 1] || 1;
    for (let i = 0; i < BINS; i += 1) c[i] /= total;
    return { intensity: I, cdf: c };
  }, [slitSepMm, wavelengthNm, screenDistMm]);

  // Photon histogram — SAMPLED from the intensity CDF. Reset whenever the
  // sliders change (so each reveal builds cleanly from zero).
  const HISTOGRAM_BINS = 240;
  const histogramRef = useRef<Uint32Array>(new Uint32Array(HISTOGRAM_BINS));
  const photonCountRef = useRef(0);
  const photonsRef = useRef<{ x: number; y: number; bornAt: number }[]>([]);
  const dotsCapRef = useRef(2400); // how many dots are drawn ghosted; older ones fade
  useEffect(() => {
    histogramRef.current = new Uint32Array(HISTOGRAM_BINS);
    photonCountRef.current = 0;
    photonsRef.current = [];
  }, [slitSepMm, wavelengthNm, screenDistMm, mode]);

  // Animation loop — at each frame, launch a batch of photons proportional
  // to playSpeed × dt. Each photon's screen position is sampled by
  // inverse-CDF lookup.
  const frameStateRef = useRef({
    slitSepMm,
    wavelengthNm,
    screenDistMm,
    mode,
    playSpeed,
    paused,
  });
  useEffect(() => {
    frameStateRef.current = {
      slitSepMm,
      wavelengthNm,
      screenDistMm,
      mode,
      playSpeed,
      paused,
    };
  }, [slitSepMm, wavelengthNm, screenDistMm, mode, playSpeed, paused]);

  const elapsedRef = useRef(0);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
      elapsedRef.current = t;
      const { mode: m, playSpeed: sp, paused: p } = frameStateRef.current;
      if (p || m !== "particle") return;
      // photons per second at speed = 1: ~120. Scale with playSpeed.
      const photonsPerSec = 120 * sp;
      const count = Math.floor(photonsPerSec * dt + Math.random()); // stochastic rounding
      for (let i = 0; i < count; i += 1) {
        const r = Math.random();
        // Binary search in CDF for inverse-transform sample
        let lo = 0;
        let hi = BINS - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cdf[mid] < r) lo = mid + 1;
          else hi = mid;
        }
        const binIdx = lo;
        const yMm =
          -SCREEN_HALF_WIDTH_MM +
          ((binIdx + Math.random()) / BINS) * 2 * SCREEN_HALF_WIDTH_MM;
        const histIdx = Math.min(
          HISTOGRAM_BINS - 1,
          Math.floor(((yMm + SCREEN_HALF_WIDTH_MM) / (2 * SCREEN_HALF_WIDTH_MM)) * HISTOGRAM_BINS),
        );
        histogramRef.current[histIdx] += 1;
        photonCountRef.current += 1;
        photonsRef.current.push({ x: 0, y: yMm, bornAt: t });
      }
      if (photonsRef.current.length > dotsCapRef.current) {
        photonsRef.current.splice(0, photonsRef.current.length - dotsCapRef.current);
      }
    },
  });

  // Render — painted every frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const render = () => {
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Layout — left 35% is the apparatus (source → slits), right 65% is
      // the screen column (fringe pattern / photon scatter).
      const apparatusW = width * 0.36;
      const gapW = width * 0.02;
      const screenW = width - apparatusW - gapW;
      const apparatusX = 0;
      const screenX = apparatusW + gapW;

      drawApparatus(ctx, colors, apparatusX, 0, apparatusW, height, {
        slitSepMm,
        wavelengthNm,
      });

      drawScreenColumn(ctx, colors, screenX, 0, screenW, height, {
        mode,
        intensity,
        histogram: histogramRef.current,
        photons: photonsRef.current,
        photonCount: photonCountRef.current,
        screenHalfWidthMm: SCREEN_HALF_WIDTH_MM,
        slitSepMm,
        wavelengthNm,
        screenDistMm,
        elapsed: elapsedRef.current,
      });

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size, mode, intensity, colors, slitSepMm, wavelengthNm, screenDistMm]);

  const fringeSpacingMm = doubleSlitFringeSpacing(
    wavelengthNm * 1e-6,
    screenDistMm,
    slitSepMm,
  );

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />

      {/* Controls row 1 — sliders */}
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Slit separation d</label>
        <input
          type="range"
          min={0.05}
          max={1.0}
          step={0.01}
          value={slitSepMm}
          onChange={(e) => setSlitSepMm(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,240)]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
          {slitSepMm.toFixed(2)} mm
        </span>

        <label className="text-[var(--color-fg-3)]">Wavelength λ</label>
        <input
          type="range"
          min={400}
          max={700}
          step={1}
          value={wavelengthNm}
          onChange={(e) => setWavelengthNm(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
          {wavelengthNm.toFixed(0)} nm
        </span>

        <label className="text-[var(--color-fg-3)]">Screen distance L</label>
        <input
          type="range"
          min={100}
          max={1200}
          step={10}
          value={screenDistMm}
          onChange={(e) => setScreenDistMm(parseFloat(e.target.value))}
          className="accent-[rgb(200,160,255)]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
          {(screenDistMm / 1000).toFixed(2)} m
        </span>

        <label className="text-[var(--color-fg-3)]">Play speed</label>
        <input
          type="range"
          min={0.1}
          max={8}
          step={0.1}
          value={playSpeed}
          onChange={(e) => setPlaySpeed(parseFloat(e.target.value))}
          className="accent-[rgb(255,100,200)]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
          {playSpeed.toFixed(1)}×
        </span>
      </div>

      {/* Controls row 2 — mode toggle, pause, readouts */}
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <div className="flex overflow-hidden border border-[var(--color-fg-4)]">
          <button
            type="button"
            className={`px-2 py-0.5 ${mode === "particle" ? "bg-[var(--color-fg-4)] text-[var(--color-fg-1)]" : "hover:text-[var(--color-fg-1)]"}`}
            onClick={() => setMode("particle")}
          >
            particle-view
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 ${mode === "wave" ? "bg-[var(--color-fg-4)] text-[var(--color-fg-1)]" : "hover:text-[var(--color-fg-1)]"}`}
            onClick={() => setMode("wave")}
          >
            wave-view
          </button>
        </div>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,220,240)] hover:text-[var(--color-fg-1)]"
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "resume" : "pause"}
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            histogramRef.current = new Uint32Array(HISTOGRAM_BINS);
            photonCountRef.current = 0;
            photonsRef.current = [];
          }}
        >
          reset
        </button>
        <span>
          Δy<sub>fringe</sub> = λL/d ={" "}
          <span style={{ color: "rgb(120,220,240)" }}>
            {fringeSpacingMm.toFixed(3)} mm
          </span>
        </span>
        {mode === "particle" ? (
          <span>
            photons{" "}
            <span style={{ color: "rgb(255,100,200)" }}>
              {photonCountRef.current.toLocaleString()}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Apparatus painter — source → two slits, with a few travelling-wave ticks
// sketched between them to suggest coherence.
// ──────────────────────────────────────────────────────────────────────────
function drawApparatus(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  p: { slitSepMm: number; wavelengthNm: number },
) {
  // Background tint
  ctx.fillStyle = `${CYAN} 0.04)`;
  ctx.fillRect(x, y, w, h);

  const cy = y + h / 2;
  const sourceX = x + w * 0.12;
  const slitsX = x + w * 0.78;
  // Slit Y offsets scale visually — slider range 0.05..1 mm → pixel 8..60
  const slitSepPx = 8 + 52 * ((p.slitSepMm - 0.05) / (1.0 - 0.05));
  const slit1Y = cy - slitSepPx / 2;
  const slit2Y = cy + slitSepPx / 2;

  // Amber laser body
  ctx.fillStyle = `${AMBER} 0.8)`;
  ctx.fillRect(sourceX - 26, cy - 8, 26, 16);
  ctx.fillStyle = `${colors.fg1}`;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "center";
  ctx.fillText("source", sourceX - 13, cy - 12);

  // Wavelength colour hint — map 400–700 nm to a reasonable visible RGB
  const rgb = wavelengthToRgb(p.wavelengthNm);
  const laserCol = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},`;

  // Plane wavefronts between source and slits — short vertical ticks
  const waveCount = 6;
  const wavelengthPx = Math.max(6, 28 * (p.wavelengthNm / 550));
  ctx.strokeStyle = `${laserCol} 0.55)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < waveCount; i += 1) {
    const wx = sourceX + 18 + i * wavelengthPx * 0.6;
    if (wx > slitsX - 12) break;
    ctx.beginPath();
    ctx.moveTo(wx, cy - 22);
    ctx.lineTo(wx, cy + 22);
    ctx.stroke();
  }

  // The wall: a vertical bar with two slits cut in it.
  ctx.fillStyle = `${colors.fg3}`;
  ctx.fillRect(slitsX - 3, y + 10, 6, slit1Y - y - 16);
  ctx.fillRect(slitsX - 3, slit1Y + 2, 6, slit2Y - slit1Y - 4);
  ctx.fillRect(slitsX - 3, slit2Y + 2, 6, y + h - 10 - (slit2Y + 2));

  // Slit labels + tiny dimension arrow
  ctx.strokeStyle = `${CYAN} 0.7)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(slitsX + 14, slit1Y);
  ctx.lineTo(slitsX + 14, slit2Y);
  ctx.stroke();
  ctx.fillStyle = `${CYAN} 0.95)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`d = ${p.slitSepMm.toFixed(2)} mm`, slitsX + 18, (slit1Y + slit2Y) / 2 + 3);
  ctx.textAlign = "center";
  ctx.fillStyle = colors.fg2;
  ctx.fillText("slit 1", slitsX, slit1Y - 6);
  ctx.fillText("slit 2", slitsX, slit2Y + 12);

  // Light rays from each slit, fanning forward — stops at the right edge
  const rayCount = 7;
  const fanHalfAngle = 0.55; // radians
  ctx.strokeStyle = `${laserCol} 0.16)`;
  ctx.lineWidth = 1;
  for (const sy of [slit1Y, slit2Y]) {
    for (let i = 0; i < rayCount; i += 1) {
      const t = (i / (rayCount - 1)) * 2 - 1;
      const ang = t * fanHalfAngle;
      ctx.beginPath();
      ctx.moveTo(slitsX + 3, sy);
      ctx.lineTo(x + w + 400, sy + 400 * Math.tan(ang));
      ctx.stroke();
    }
  }

  // Caption strip
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.font = "9.5px monospace";
  ctx.fillText("Young 1801", x + w / 2, y + h - 6);
}

// ──────────────────────────────────────────────────────────────────────────
// Screen column — fringe pattern painter. Draws:
//  - the pattern as a side-on intensity plot (always visible, subtle when
//    in particle mode)
//  - the photon dot scatter + histogram (particle mode only)
//  - the live huygensSum intensity curve (wave mode, bold)
// ──────────────────────────────────────────────────────────────────────────
function drawScreenColumn(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  p: {
    mode: Mode;
    intensity: number[];
    histogram: Uint32Array;
    photons: { x: number; y: number; bornAt: number }[];
    photonCount: number;
    screenHalfWidthMm: number;
    slitSepMm: number;
    wavelengthNm: number;
    screenDistMm: number;
    elapsed: number;
  },
) {
  // Vertical guides — screen is tall, light comes in from the LEFT side
  const padT = 18;
  const padB = 28;
  const top = y + padT;
  const bot = y + h - padB;
  const screenH = bot - top;

  // The "screen" — a vertical strip on the right. Scatter dots fall into
  // a 2D area to left of it; the histogram sits attached to its right.
  const scatterW = w * 0.58;
  const screenLineX = x + scatterW;
  const histogramW = w - scatterW - 6;
  const histX = screenLineX + 6;

  // Background columns
  ctx.fillStyle = `${MAGENTA} 0.03)`;
  ctx.fillRect(x, top, scatterW, screenH);
  ctx.fillStyle = `${LILAC} 0.05)`;
  ctx.fillRect(histX, top, histogramW, screenH);

  // Screen line
  ctx.strokeStyle = `${colors.fg3}`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(screenLineX, top - 4);
  ctx.lineTo(screenLineX, bot + 4);
  ctx.stroke();

  const yToPx = (yMm: number) =>
    top + ((yMm + p.screenHalfWidthMm) / (2 * p.screenHalfWidthMm)) * screenH;

  // Millimetre ticks on the screen axis (five labelled ticks)
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  for (let i = -2; i <= 2; i += 1) {
    const yMm = (i / 2) * p.screenHalfWidthMm;
    const py = yToPx(yMm);
    ctx.strokeStyle = `${colors.fg3}`;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(screenLineX, py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(`${yMm.toFixed(0)} mm`, x + 34, py + 3);
  }

  // ── Particle mode: draw photon dots + histogram bars ─────────────────
  if (p.mode === "particle") {
    // Faint guide: the target intensity curve, drawn very softly inside the
    // scatter region (so readers can see dots are sampling a distribution)
    ctx.strokeStyle = `${CYAN} 0.12)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < p.intensity.length; i += 1) {
      const yMm =
        -p.screenHalfWidthMm + (i / (p.intensity.length - 1)) * 2 * p.screenHalfWidthMm;
      const py = yToPx(yMm);
      const px = x + 38 + (scatterW - 54) * (1 - p.intensity[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Dot cloud — most-recent photons bright, older photons faded
    const now = p.elapsed;
    const dotFadeTime = 2.2; // seconds — how long a dot stays "bright"
    for (const ph of p.photons) {
      const age = now - ph.bornAt;
      const alpha = Math.max(0.12, 1 - age / dotFadeTime);
      const py = yToPx(ph.y);
      const px = x + 40 + Math.random() * (scatterW - 60);
      ctx.fillStyle = `${AMBER} ${alpha.toFixed(2)})`;
      ctx.fillRect(px, py, 2, 2);
    }

    // Accumulated histogram bars on the screen side — this is the reveal
    let maxH = 1;
    for (let i = 0; i < p.histogram.length; i += 1) {
      if (p.histogram[i] > maxH) maxH = p.histogram[i];
    }
    const binH = screenH / p.histogram.length;
    for (let i = 0; i < p.histogram.length; i += 1) {
      const yMm =
        -p.screenHalfWidthMm + (i / p.histogram.length) * 2 * p.screenHalfWidthMm;
      const py = yToPx(yMm);
      const frac = p.histogram[i] / maxH;
      ctx.fillStyle = `${MAGENTA} ${(0.35 + 0.55 * frac).toFixed(2)})`;
      ctx.fillRect(histX, py - binH / 2, histogramW * frac, binH + 0.5);
    }

    // Legend / caption
    ctx.fillStyle = colors.fg2;
    ctx.font = "9.5px monospace";
    ctx.textAlign = "left";
    ctx.fillText("one photon → one spot", x + 40, top - 4);
    ctx.textAlign = "right";
    ctx.fillStyle = `${MAGENTA} 0.95)`;
    ctx.fillText("histogram of landings", x + w - 6, top - 4);
  } else {
    // ── Wave mode: continuous intensity plot on the screen line ─────────
    const plotMaxX = x + 40;
    const plotWPx = scatterW - 60;
    ctx.fillStyle = `${CYAN} 0.18)`;
    ctx.beginPath();
    ctx.moveTo(plotMaxX + plotWPx, top);
    for (let i = 0; i < p.intensity.length; i += 1) {
      const yMm =
        -p.screenHalfWidthMm + (i / (p.intensity.length - 1)) * 2 * p.screenHalfWidthMm;
      const py = yToPx(yMm);
      const px = plotMaxX + plotWPx * (1 - p.intensity[i]);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(plotMaxX + plotWPx, bot);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `${CYAN} 0.95)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < p.intensity.length; i += 1) {
      const yMm =
        -p.screenHalfWidthMm + (i / (p.intensity.length - 1)) * 2 * p.screenHalfWidthMm;
      const py = yToPx(yMm);
      const px = plotMaxX + plotWPx * (1 - p.intensity[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Envelope fill on the screen side (histogram column gets a painted curve too)
    ctx.fillStyle = `${LILAC} 0.35)`;
    for (let i = 0; i < p.intensity.length; i += 1) {
      const yMm =
        -p.screenHalfWidthMm + (i / (p.intensity.length - 1)) * 2 * p.screenHalfWidthMm;
      const py = yToPx(yMm);
      ctx.fillRect(histX, py, histogramW * p.intensity[i], 1);
    }

    ctx.fillStyle = colors.fg2;
    ctx.font = "9.5px monospace";
    ctx.textAlign = "left";
    ctx.fillText("I(y) = |ψ₁ + ψ₂|²", x + 40, top - 4);
    ctx.textAlign = "right";
    ctx.fillStyle = `${LILAC} 0.95)`;
    ctx.fillText("intensity on screen", x + w - 6, top - 4);
  }

  // Overlay the expected fringe pitch — a thin horizontal tick set with
  // spacing λL/d so readers can eye-calibrate the pattern.
  const fringeMm = (p.wavelengthNm * 1e-6 * p.screenDistMm) / p.slitSepMm;
  if (fringeMm < p.screenHalfWidthMm * 0.8 && fringeMm > 0) {
    ctx.strokeStyle = `${AMBER} 0.55)`;
    ctx.setLineDash([1, 3]);
    ctx.lineWidth = 1;
    for (let k = -10; k <= 10; k += 1) {
      const yMm = k * fringeMm;
      if (Math.abs(yMm) > p.screenHalfWidthMm) continue;
      const py = yToPx(yMm);
      ctx.beginPath();
      ctx.moveTo(screenLineX - 8, py);
      ctx.lineTo(screenLineX + 4, py);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Bottom caption
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.font = "9.5px monospace";
  ctx.fillText(
    `amber ticks = predicted fringes at λL/d = ${fringeMm.toFixed(3)} mm`,
    x + w / 2,
    y + h - 6,
  );
}

// Rough visible-wavelength → RGB mapping (good enough for UI accents).
function wavelengthToRgb(nm: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60;
    g = 0;
    b = 1;
  } else if (nm < 490) {
    r = 0;
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    r = 0;
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
    b = 0;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
    b = 0;
  } else if (nm <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
