"use client";

import { useEffect, useRef, useState } from "react";
import { redshiftZ } from "@/lib/physics/doppler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.42;
const MAX_HEIGHT = 260;

/**
 * A single emission line at a rest wavelength of 656.3 nm (H-alpha). Slider
 * controls the source velocity v/c. Positive v = receding = redshift.
 *
 * Spectrum strip covers 400–750 nm (the visible range). The line shifts and
 * the strip colour underneath it tells you where it landed.
 */
export function RedshiftScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [beta, setBeta] = useState(0); // v/c, dimensionless
  const [size, setSize] = useState({ width: 560, height: 240 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  // Rest line: H-alpha at 656.3 nm.
  const restLambda = 656.3;
  const lambdaMin = 400;
  const lambdaMax = 750;

  // Observed wavelength via relativistic Doppler: 1 + z = sqrt((1+β)/(1−β))
  const v = beta * 299_792_458; // for the redshiftZ API
  const z = Math.abs(beta) < 0.999 ? redshiftZ(v) : 0;
  const obsLambda = restLambda * (1 + z);
  const visible =
    obsLambda >= lambdaMin && obsLambda <= lambdaMax;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const marginL = 40;
      const marginR = 16;
      const stripTop = 44;
      const stripH = 52;
      const stripW = width - marginL - marginR;

      const lambdaToX = (lam: number) =>
        marginL + ((lam - lambdaMin) / (lambdaMax - lambdaMin)) * stripW;

      // Draw the spectrum strip (smooth gradient across visible wavelengths)
      const steps = Math.max(200, Math.floor(stripW));
      for (let i = 0; i < steps; i++) {
        const lam = lambdaMin + ((lambdaMax - lambdaMin) * i) / (steps - 1);
        const [r, g, b] = wavelengthToRGB(lam);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        const x = marginL + (stripW * i) / steps;
        ctx.fillRect(x, stripTop, stripW / steps + 0.5, stripH);
      }

      // Rest-frame line marker (dotted)
      const xRest = lambdaToX(restLambda);
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xRest, stripTop - 10);
      ctx.lineTo(xRest, stripTop + stripH + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `rest: ${restLambda.toFixed(1)} nm`,
        xRest,
        stripTop - 14,
      );

      // Observed absorption line — black notch in the strip
      if (visible) {
        const xObs = lambdaToX(obsLambda);
        ctx.fillStyle = "#000";
        ctx.fillRect(xObs - 1.5, stripTop, 3, stripH);

        ctx.strokeStyle =
          z > 0 ? "#FF6B6B" : z < 0 ? "#6FB8C6" : colors.fg1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xObs, stripTop + stripH + 2);
        ctx.lineTo(xObs, stripTop + stripH + 18);
        ctx.stroke();

        ctx.fillStyle = colors.fg1;
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillText(
          `${obsLambda.toFixed(1)} nm`,
          xObs,
          stripTop + stripH + 32,
        );
      } else {
        ctx.fillStyle = colors.fg2;
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillText(
          `${obsLambda.toFixed(1)} nm (${obsLambda < lambdaMin ? "UV" : "IR"})`,
          width / 2,
          stripTop + stripH + 32,
        );
      }

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${lambdaMin} nm`, marginL, stripTop + stripH + 14);
      ctx.textAlign = "right";
      ctx.fillText(
        `${lambdaMax} nm`,
        width - marginR,
        stripTop + stripH + 14,
      );

      // z value, β value
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`\u03B2 = v/c = ${beta.toFixed(2)}`, marginL, 20);
      ctx.textAlign = "right";
      const zColor = z > 0 ? "#FF6B6B" : z < 0 ? "#6FB8C6" : colors.fg1;
      ctx.fillStyle = zColor;
      ctx.fillText(
        `z = ${z >= 0 ? "+" : ""}${z.toFixed(3)}`,
        width - marginR,
        20,
      );

      // Regime label
      const label = z > 0.001 ? "REDSHIFT" : z < -0.001 ? "BLUESHIFT" : "AT REST";
      ctx.fillStyle = zColor;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, width / 2, 20);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          Source velocity (\u03B2)
        </label>
        <input
          type="range"
          min={-0.6}
          max={0.6}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta >= 0 ? "+" : ""}
          {beta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/**
 * Approximate RGB mapping for a visible wavelength in nm. Based on Bruton's
 * widely-used algorithm. Just for pedagogy — not colour-accurate.
 */
function wavelengthToRGB(lam: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;

  if (lam >= 380 && lam < 440) {
    r = -(lam - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (lam >= 440 && lam < 490) {
    r = 0;
    g = (lam - 440) / (490 - 440);
    b = 1;
  } else if (lam >= 490 && lam < 510) {
    r = 0;
    g = 1;
    b = -(lam - 510) / (510 - 490);
  } else if (lam >= 510 && lam < 580) {
    r = (lam - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (lam >= 580 && lam < 645) {
    r = 1;
    g = -(lam - 645) / (645 - 580);
    b = 0;
  } else if (lam >= 645 && lam <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  // Intensity fall-off near edges
  let factor = 1;
  if (lam >= 380 && lam < 420) factor = 0.3 + (0.7 * (lam - 380)) / (420 - 380);
  else if (lam >= 420 && lam < 700) factor = 1;
  else if (lam >= 700 && lam <= 780)
    factor = 0.3 + (0.7 * (780 - lam)) / (780 - 700);
  else factor = 0;

  const gamma = 0.8;
  const scale = (c: number) =>
    c === 0 ? 0 : Math.round(255 * Math.pow(c * factor, gamma));

  return [scale(r), scale(g), scale(b)];
}
