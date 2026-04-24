"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

const RATIO = 0.7;
const MAX_HEIGHT = 520;

const LILAC = "rgba(200, 160, 255,"; // near-field / stored energy
const AMBER = "rgba(255, 180, 80,"; // radiated light / outgoing wavefront
const PALE_BLUE = "rgba(140, 200, 255,"; // outgoing wavefronts
const MAGENTA = "rgba(255, 106, 222,"; // dipole body

/**
 * FIG.53 — THE MONEY SHOT.
 *
 * An oscillating vertical electric dipole sitting at the origin, rendered as
 * a side-view cross-section of its field. Two things happen simultaneously:
 *
 *   · NEAR-FIELD LOOPS (lilac): field lines closing back onto the dipole,
 *     breathing in place as p(t) reverses sign every half-period. They live
 *     at r < r_t and carry no energy outward — everything they gain on the
 *     first quarter-cycle they give back on the next.
 *
 *   · FAR-FIELD WAVEFRONTS (amber turning pale-blue): loops that escape the
 *     inner zone pinch off at the transition radius r_t = c/ω and propagate
 *     outward as spherical wavefronts. The moment a loop crosses r_t is the
 *     moment the field LEAVES THE SOURCE. That crossing is drawn.
 *
 * The scene renders a compressed, stylised analogue rather than a true
 * numerical streamline integration of (E_near + E_far) — the point is to
 * make the topological event visible. The transition radius r_t is drawn
 * as a dashed ring in `fg3`, and the slider for ω shifts it live. Lower ω
 * ⇒ larger λ ⇒ larger r_t (fields have room to wrap before they escape);
 * higher ω ⇒ small r_t, loops break off almost immediately.
 *
 * Palette note — per the Session-5 legacy and the §10 plan, outgoing
 * wavefronts are drawn in pale-blue; the near-field loops in lilac.
 */
export function DipoleFieldLinesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 820, height: 520 });
  // User-controlled frequency slider.
  // Mapped into a DIMENSIONLESS "scene units" ω — the drawing is in pixel
  // space with c ≡ 1 (scene units), so a slider value of 1.0 gives a
  // transition radius of one scene-unit, i.e. ~one quarter of the canvas.
  const [omegaSlider, setOmegaSlider] = useState(1.0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Convert slider to a physics-like SI frequency for the HUD readout only
  // (e.g. 1.0 on the slider ≈ 300 MHz — a hand-held-radio-scale number so
  // the reader can feel the scale).
  const omegaHzReadout = useMemo(() => {
    // slider 0.3..3.0 mapped to 100 MHz..3 GHz (log scale).
    const t = (omegaSlider - 0.3) / (3.0 - 0.3);
    const log10 = 8 + 1.5 * t; // 10⁸..10⁹·⁵ Hz
    return Math.pow(10, log10);
  }, [omegaSlider]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.52;
      const maxR = Math.min(width * 0.48, height * 0.46);

      // Transition radius in pixels: we scale so that the max useful radius
      // (the canvas edge) corresponds to ~5 transition radii at slider = 1.
      // Smaller ω ⇒ larger transition-radius-in-pixels.
      const rTransitionPx = maxR / (1.5 * omegaSlider + 0.35);
      // Wavelength λ = 2π · r_t (since r_t = λ/2π).
      const lambdaPx = 2 * Math.PI * rTransitionPx;

      // Dipole oscillation phase. A factor of 2.4 slows the visible action
      // enough that the eye can track single loops breaking off.
      const omegaAnim = 2.4 * omegaSlider;
      const omegaT = t * omegaAnim;

      // ─── (1) Transition-radius ring ─────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, rTransitionPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label the ring
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "r = c/ω  ·  transition radius",
        cx + rTransitionPx + 6,
        cy - 4,
      );
      ctx.fillText(
        "(fields LEAVE the source here)",
        cx + rTransitionPx + 6,
        cy + 8,
      );

      // ─── (2) Near-field loops ───────────────────────────────────────
      // Draw ~6 figure-eight-like loop pairs within r < r_t. They breathe
      // with the dipole phase. As r approaches r_t, the colour shifts
      // from lilac (near) toward amber (the loop is about to pinch off).
      const nearLoops = 4;
      const dipolePhase = Math.cos(omegaT);
      for (let i = 0; i < nearLoops; i++) {
        const frac = (i + 1) / (nearLoops + 0.5);
        const loopR = frac * rTransitionPx;
        // "Breathe": each loop's size gently modulates with the dipole phase.
        const breathe = 1 + 0.15 * dipolePhase * (1 - frac * 0.6);
        const rr = loopR * breathe;
        // Colour blend from lilac (center) to amber-ish (edge).
        const nearness = frac; // 0..1
        const alpha = 0.4 + 0.35 * (1 - nearness);
        // Stroke
        if (nearness < 0.75) {
          ctx.strokeStyle = `${LILAC} ${alpha.toFixed(3)})`;
        } else {
          // Already pinching — warm tone.
          ctx.strokeStyle = `${AMBER} ${alpha.toFixed(3)})`;
        }
        ctx.lineWidth = 1.3;

        // Right-side loop
        drawDipoleLoop(ctx, cx, cy, rr, dipolePhase >= 0, "right");
        // Left-side loop (mirror)
        drawDipoleLoop(ctx, cx, cy, rr, dipolePhase >= 0, "left");
      }

      // ─── (3) Pinch-off loops and outgoing wavefronts ─────────────────
      // Emit one pinched-off loop every half-period. Track several at once
      // at different "ages" (how far past r_t they've travelled).
      //
      // age = t·ω/π  (increments by 1 every half-period)
      // A loop with age A was born at time t_A = t − Aπ/ω, so right now
      // its leading edge has travelled distance ~ c·(A·π/ω) in scene units.
      // In our pixel scale, c·Δt maps to (ω·Δt) · r_t, so the leading
      // radius is approximately A·π·r_t.
      const numWavefronts = 7;
      for (let i = 0; i < numWavefronts; i++) {
        const age = ((omegaT / Math.PI) + i * 0.5) % numWavefronts;
        // Radius of the wavefront in pixels.
        const wfR = rTransitionPx + age * (lambdaPx / 2);
        if (wfR < rTransitionPx - 2) continue;
        if (wfR > maxR * 1.08) continue;
        // Fade with distance.
        const fade = Math.max(
          0,
          1 - (wfR - rTransitionPx) / (maxR - rTransitionPx + 1e-6),
        );
        // Just past pinch-off: amber (the moment of escape). Far out: pale-blue
        // (a bona-fide outgoing wavefront, indistinguishable from any other
        // far-field EM wave).
        const distFromR = wfR - rTransitionPx;
        const pinch = Math.min(1, distFromR / (lambdaPx * 0.35));
        const amberA = (1 - pinch) * 0.85 * fade;
        const blueA = pinch * 0.85 * fade;

        // Draw two expanding lobes left/right (sin θ pattern — null along axis).
        ctx.lineWidth = 1.6;

        // Right-side lobe
        if (amberA > 0.01) {
          ctx.strokeStyle = `${AMBER} ${amberA.toFixed(3)})`;
          drawLobeArc(ctx, cx, cy, wfR, "right");
        }
        if (blueA > 0.01) {
          ctx.strokeStyle = `${PALE_BLUE} ${blueA.toFixed(3)})`;
          drawLobeArc(ctx, cx, cy, wfR, "right");
        }
        // Left-side lobe
        if (amberA > 0.01) {
          ctx.strokeStyle = `${AMBER} ${amberA.toFixed(3)})`;
          drawLobeArc(ctx, cx, cy, wfR, "left");
        }
        if (blueA > 0.01) {
          ctx.strokeStyle = `${PALE_BLUE} ${blueA.toFixed(3)})`;
          drawLobeArc(ctx, cx, cy, wfR, "left");
        }
      }

      // ─── (4) Dipole body and current ────────────────────────────────
      const dipoleLen = rTransitionPx * 0.3;
      ctx.strokeStyle = `${MAGENTA} 0.95)`;
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy - dipoleLen);
      ctx.lineTo(cx, cy + dipoleLen);
      ctx.stroke();
      ctx.lineCap = "butt";

      // Charge labels — flip every half-period.
      const topPlus = Math.cos(omegaT) >= 0;
      const topLabel = topPlus ? "+" : "−";
      const botLabel = topPlus ? "−" : "+";
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(topLabel, cx, cy - dipoleLen - 6);
      ctx.fillText(botLabel, cx, cy + dipoleLen + 14);

      // Feed dot: green-cyan current bead at centre.
      ctx.fillStyle = "rgba(140,240,200,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // ─── (5) HUD ─────────────────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("FIG.53 · oscillating electric dipole", 14, 20);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("p(t) = p₀ cos(ωt) ẑ", 14, 36);
      ctx.fillText(
        `near-field  E ∝ 1/r³   (stored, returns)`,
        14,
        height - 44,
      );
      ctx.fillText(
        `far-field   E ∝ 1/r    (radiated, escapes)`,
        14,
        height - 28,
      );

      // Right-hand swatches
      ctx.textAlign = "right";
      const hudX = width - 14;
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.fillText("lilac  ·  near-field loops", hudX, height - 44);
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.fillText("amber  ·  pinching off", hudX, height - 28);
      ctx.fillStyle = `${PALE_BLUE} 0.95)`;
      ctx.fillText("pale-blue  ·  outgoing wavefront", hudX, height - 12);

      // Centre bottom readout
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg1;
      ctx.font = "bold 12px monospace";
      ctx.fillText(
        `ω ≈ ${formatHz(omegaHzReadout)}   ·   r_transition = c/ω`,
        width / 2,
        24,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Frequency ω</label>
        <input
          type="range"
          min={0.3}
          max={3.0}
          step={0.01}
          value={omegaSlider}
          onChange={(e) => setOmegaSlider(parseFloat(e.target.value))}
          className="accent-[rgb(200,160,255)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {formatHz(omegaHzReadout)}
        </span>
      </div>
      <p className="mt-2 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        Higher ω ⇒ smaller transition radius ⇒ loops break off sooner.
        At every ω, the same topological story: near-field loops pinch off at
        r = c/ω and propagate outward as light.
      </p>
    </div>
  );
}

/**
 * Draw one half (left or right) of a near-field "dipole loop" at radius R.
 * These are lemniscate-ish closed curves that hug the source.
 */
function drawDipoleLoop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  positivePhase: boolean,
  side: "left" | "right",
) {
  const sign = side === "right" ? 1 : -1;
  const _ = positivePhase;
  void _;
  ctx.beginPath();
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps; // 0..1
    // Parametric dipole-ish loop: x = sign · R·sin²θ; y = R·sin θ cos θ·2
    // (roughly the shape of a static dipole's field line).
    const theta = u * Math.PI;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const rx = sign * R * s * s;
    const ry = -R * 2 * s * c * 0.55;
    const px = cx + rx;
    const py = cy + ry;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/**
 * Draw the outgoing wavefront: a sin²θ-weighted arc (max broadside, null on
 * axis). Rendered as a varying-width chunk of a circle.
 */
function drawLobeArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  side: "left" | "right",
) {
  const sign = side === "right" ? 1 : -1;
  const steps = 40;
  ctx.beginPath();
  // θ from ~0 to π around the dipole axis (vertical). We sample from
  // π·0.18 to π·0.82 so the arc has a clear null near the poles.
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const theta = Math.PI * (0.18 + 0.64 * u);
    const s = Math.sin(theta);
    // Radial radius is R (a circle). The sin-weighting is used as an
    // alpha mask by the caller's chosen alpha; here we just draw the
    // visible segment.
    const x = cx + sign * R * s;
    const y = cy - R * Math.cos(theta);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function formatHz(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(0)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(0)} kHz`;
  return `${hz.toFixed(0)} Hz`;
}

// Kept for future extension (physics readout comparing to SI c).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _C_SI = SPEED_OF_LIGHT;
