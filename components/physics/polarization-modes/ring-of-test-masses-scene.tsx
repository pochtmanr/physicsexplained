"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  deformedRing,
  strainAmplitudes,
  type PolarizationMode,
} from "@/lib/physics/relativity/polarization-modes";
import { Button } from "@/components/ui/button";

/**
 * FIG.51a — THE classic figure: a ring of free test masses in the
 * transverse plane, deformed by a passing gravitational wave.
 *
 * Toggle the polarization (+ / × / circular). The + mode stretches along
 * the x-axis while squeezing y, then reverses; × does the same at 45°;
 * circular rotates the ellipse. Amplitude and frequency sliders drive the
 * strain. The rest ring is drawn faintly behind the deformed ring so the
 * deformation reads clearly. Strain is hugely exaggerated here — real
 * strains are ~10⁻²¹, a million-millionth of what you see.
 */

const PAD = 18;
const N_MASSES = 16;

const MODES: { id: PolarizationMode; label: string }[] = [
  { id: "plus", label: "+ plus" },
  { id: "cross", label: "× cross" },
  { id: "circular", label: "○ circular" },
];

export function RingOfTestMassesScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const [mode, setMode] = useState<PolarizationMode>("plus");
  const [amp, setAmp] = useState(0.35);
  const [freq, setFreq] = useState(0.6);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      const phase = 2 * Math.PI * freq * t;
      draw(ctx, tokens, mode, amp, phase, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, amp, freq, tokens, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A ring of free test masses deformed by a passing gravitational wave. Toggle plus, cross, or circular polarization; sliders set the exaggerated strain amplitude and frequency."
      />
      <div className="mt-3 flex flex-wrap gap-1 font-mono text-xs">
        {MODES.map((m) => (
          <Button
            key={m.id}
            active={m.id === mode}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32 shrink-0">amplitude h</span>
        <input
          type="range"
          min={0}
          max={0.6}
          step={0.01}
          value={amp}
          onChange={(e) => setAmp(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32 shrink-0">frequency f</span>
        <input
          type="range"
          min={0.1}
          max={1.5}
          step={0.05}
          value={freq}
          onChange={(e) => setFreq(parseFloat(e.target.value))}
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
  mode: PolarizationMode,
  amp: number,
  phase: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 4, "RING OF FREE TEST MASSES", tokens.textMute);

  const cx = W / 2;
  const cy = H / 2 + 6;
  const baseR = Math.min(W, H) * 0.32;

  const { hPlus, hCross } = strainAmplitudes(mode, amp, phase);

  // Faint rest ring
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.5);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Principal axes of the strain ellipse (faint cross)
  ctx.strokeStyle = hexToRgba(tokens.axes, 0.45);
  ctx.beginPath();
  ctx.moveTo(cx - baseR * 1.18, cy);
  ctx.lineTo(cx + baseR * 1.18, cy);
  ctx.moveTo(cx, cy - baseR * 1.18);
  ctx.lineTo(cx, cy + baseR * 1.18);
  ctx.stroke();

  // Deformed ring outline
  const ring = deformedRing(120, baseR, hPlus, hCross);
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.55);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ring.forEach((p, i) => {
    const px = cx + p.x;
    const py = cy - p.y;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();

  // Test masses
  const masses = deformedRing(N_MASSES, baseR, hPlus, hCross);
  masses.forEach((p) => {
    const px = cx + p.x;
    const py = cy - p.y;
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(tokens.amber, 0.18);
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Centre marker
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.6);
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Propagation note (wave travels into the page, +z)
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.fillText("wave travels into the page (+z)", cx, H - PAD);
  ctx.textAlign = "left";

  // HUD
  const hudX = PAD;
  let hudY = PAD + 16;
  hudY = drawHudReadout(
    ctx,
    hudX,
    hudY,
    "h₊ = ",
    hPlus.toFixed(3),
    tokens.textDim,
    tokens.cyan,
  );
  hudY = drawHudReadout(
    ctx,
    hudX,
    hudY,
    "h× = ",
    hCross.toFixed(3),
    tokens.textDim,
    tokens.magenta,
  );
}
