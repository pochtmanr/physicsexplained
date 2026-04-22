"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  slidingRodDynamics,
  motionalEmf,
  terminalVelocity,
} from "@/lib/physics/electromagnetism/lenz-motional-emf";

const RATIO = 0.6;
const MAX_HEIGHT = 460;
const MAX_TRACE = 240;

/**
 * FIG.22b — the canonical rod-on-rails. A straight conducting rod slides at
 * velocity v along two parallel rails lying in a uniform B field (into the
 * page). The loop's area changes, Φ changes, an EMF = BLv appears across
 * the rod. A resistor closes the loop; a current I = BLv/R flows. That
 * current, sitting in the same external B, feels a retarding force
 * F_mag = −B·I·L that opposes v.
 *
 * The user either nudges the rod with a hand-force slider (rod accelerates
 * toward terminal velocity v_term = F_ext·R/(B²L²)) or pauses and drags.
 * HUD + trace: v(t), I(t), EMF(t), F_mag(t).
 */
export function SlidingRodEmfScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 420 });

  // Scene parameters (SI-ish, scene units).
  const [B, setB] = useState(0.8);
  const [L, setL] = useState(0.5);
  const [R, setR] = useState(0.4);
  const [F_ext, setFext] = useState(0.3);

  // Rod state.
  const vRef = useRef(0);
  const xRef = useRef(0.3); // rod position along rails (metres in scene units)
  const massRef = useRef(0.2); // kg, small so dynamics are brisk

  // Traces: {t, v, I, emf}.
  const traceRef = useRef<
    { t: number; v: number; I: number; emf: number }[]
  >([]);
  const lastT = useRef(0);

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

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
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

      // ── Physics step ──
      const v = vRef.current;
      const { I, F_mag } = slidingRodDynamics(B, L, v, R);
      const emf = motionalEmf(B, L, v);
      const F_net = F_ext + F_mag;
      const a = F_net / massRef.current;
      vRef.current = v + a * dt;
      xRef.current += vRef.current * dt;

      // Clamp rod within scene box.
      if (xRef.current < 0.05) {
        xRef.current = 0.05;
        if (vRef.current < 0) vRef.current = 0;
      }
      const X_MAX = 2.6;
      if (xRef.current > X_MAX) {
        xRef.current = X_MAX;
        if (vRef.current > 0) vRef.current = 0;
      }

      // Trace sample (throttled).
      if (t - lastT.current > 0.04) {
        traceRef.current.push({ t, v: vRef.current, I, emf });
        if (traceRef.current.length > MAX_TRACE) traceRef.current.shift();
        lastT.current = t;
      }

      // ── Render ──
      ctx.clearRect(0, 0, width, height);

      // Layout: upper 2/3 for the rail scene, lower 1/3 for trace.
      const sceneH = Math.floor(height * 0.62);
      const traceH = height - sceneH - 8;
      drawRailScene(ctx, width, sceneH, xRef.current, L, B);
      drawTracePanel(ctx, width, traceH, sceneH + 8, traceRef.current, colors);

      // Right-hand-rule badge.
      drawRHRBadge(ctx, width, sceneH, colors);

      // HUD overlay on rail scene.
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("rod on rails: EMF = B L v", 12, 18);
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.fillText("⊗ B into page", 12, 36);
      ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
      ctx.fillText("→ induced current I = BLv/R", 12, 54);
      ctx.fillStyle = "#FFD66B";
      ctx.fillText("→ retarding force F = −B²L²v/R", 12, 72);

      const v_term = terminalVelocity(F_ext, B, L, R);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`v = ${vRef.current.toFixed(3)} m/s`, width - 12, 18);
      ctx.fillText(`EMF = ${emf.toFixed(3)} V`, width - 12, 36);
      ctx.fillText(`I = ${I.toFixed(3)} A`, width - 12, 54);
      ctx.fillText(`F_mag = ${F_mag.toFixed(3)} N`, width - 12, 72);
      ctx.fillStyle = "rgba(255, 214, 107, 0.8)";
      ctx.fillText(`v_term → ${v_term.toFixed(3)} m/s`, width - 12, 90);
    },
  });

  function drawRailScene(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    rodX: number,
    rodL: number,
    bMag: number,
  ) {
    const pad = 40;
    const railY1 = pad + 30;
    const railY2 = h - pad;
    const xLeft = pad + 20;
    const xRight = w - pad;
    const PX = (xRight - xLeft) / 3.0; // 3 m of scene = full canvas width

    // B field background (⊗ symbols for into-page).
    const bInt = Math.min(1, bMag / 1.2);
    ctx.strokeStyle = `rgba(120, 220, 255, ${0.18 + 0.18 * bInt})`;
    ctx.fillStyle = `rgba(120, 220, 255, ${0.25 + 0.35 * bInt})`;
    ctx.lineWidth = 1;
    const stepX = 56;
    const stepY = 54;
    for (let x = xLeft + stepX * 0.5; x < xRight - stepX * 0.2; x += stepX) {
      for (let y = railY1 + stepY * 0.5; y < railY2 - stepY * 0.3; y += stepY) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        // × inside
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 3);
        ctx.lineTo(x + 3, y + 3);
        ctx.moveTo(x + 3, y - 3);
        ctx.lineTo(x - 3, y + 3);
        ctx.stroke();
      }
    }

    // Rails.
    ctx.strokeStyle = "#D0D4E0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xLeft, railY1);
    ctx.lineTo(xRight, railY1);
    ctx.moveTo(xLeft, railY2);
    ctx.lineTo(xRight, railY2);
    ctx.stroke();

    // Resistor at the left end.
    drawResistor(ctx, xLeft, railY1, railY2);

    // Rod at xLeft + rodX*PX.
    const rx = xLeft + rodX * PX;
    const railGap = railY2 - railY1;
    // Use L to scale visual rail-gap minus a small margin; keep rod always
    // spanning the rails but colour the "effective length" bar.
    const effFrac = Math.min(1, Math.max(0.1, rodL / 0.8));
    ctx.strokeStyle = "#FFD66B";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rx, railY1 + railGap * (1 - effFrac) * 0.5);
    ctx.lineTo(rx, railY2 - railGap * (1 - effFrac) * 0.5);
    ctx.stroke();

    // Arrow for hand-force F_ext.
    const fDir = Math.sign(F_ext) || 1;
    ctx.strokeStyle = "rgba(255, 214, 107, 0.9)";
    ctx.fillStyle = "rgba(255, 214, 107, 0.9)";
    ctx.lineWidth = 2.2;
    const fArrLen = 28 * fDir;
    const fy = (railY1 + railY2) / 2;
    ctx.beginPath();
    ctx.moveTo(rx, fy);
    ctx.lineTo(rx + fArrLen, fy);
    ctx.stroke();
    const back = fDir > 0 ? -6 : 6;
    ctx.beginPath();
    ctx.moveTo(rx + fArrLen, fy);
    ctx.lineTo(rx + fArrLen + back, fy - 4);
    ctx.lineTo(rx + fArrLen + back, fy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("F_ext", rx + fArrLen * 1.4, fy - 8);

    // Induced-current arrows (green-cyan) around the loop: rod goes up
    // when I > 0 (by our sign convention: v > 0 → EMF > 0 → I > 0 → current
    // up through the rod). Current then returns through the resistor and
    // top/bottom rails.
    const I_val = (B * L * vRef.current) / R;
    if (Math.abs(I_val) > 1e-4) {
      const currentUp = I_val > 0;
      drawLoopCurrent(ctx, xLeft, rx, railY1, railY2, currentUp);
    }

    // Labels.
    ctx.fillStyle = "rgba(255, 214, 107, 0.9)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("rod (length L)", rx, railY1 - 10);
    ctx.fillStyle = "#B6C4D8";
    ctx.fillText("R", xLeft - 22, (railY1 + railY2) / 2 + 4);
  }

  function drawResistor(
    ctx: CanvasRenderingContext2D,
    xLeft: number,
    yTop: number,
    yBot: number,
  ) {
    // Zig-zag between the two rail ends.
    ctx.strokeStyle = "#B6C4D8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const zigX = xLeft - 12;
    ctx.moveTo(xLeft, yTop);
    ctx.lineTo(zigX, yTop);
    const segs = 5;
    const dy = (yBot - yTop) / segs;
    for (let i = 0; i < segs; i++) {
      const x = i % 2 === 0 ? zigX - 8 : zigX + 8;
      ctx.lineTo(x, yTop + dy * (i + 0.5));
    }
    ctx.lineTo(zigX, yBot);
    ctx.lineTo(xLeft, yBot);
    ctx.stroke();
  }

  function drawLoopCurrent(
    ctx: CanvasRenderingContext2D,
    xLeft: number,
    xRod: number,
    yTop: number,
    yBot: number,
    rodCurrentUp: boolean,
  ) {
    ctx.strokeStyle = "rgba(120, 255, 170, 0.95)";
    ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(120, 255, 170, 0.35)";
    ctx.shadowBlur = 4;

    // Top rail arrow (direction depends on loop sense).
    const topArrX = (xLeft + xRod) / 2;
    const topGoesLeft = rodCurrentUp; // KCL: if up through rod (on the right)
    // then left along the top rail (toward resistor).
    drawFlatArrow(ctx, topArrX, yTop - 10, topGoesLeft);

    const botArrX = (xLeft + xRod) / 2;
    const botGoesLeft = !topGoesLeft;
    drawFlatArrow(ctx, botArrX, yBot + 10, botGoesLeft);

    // Rod arrow (vertical, inside the rod position). Draw slightly offset.
    const midY = (yTop + yBot) / 2;
    drawVerticalArrow(ctx, xRod + 18, midY, rodCurrentUp);

    ctx.shadowBlur = 0;
  }

  function drawFlatArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    goesLeft: boolean,
  ) {
    const len = 24 * (goesLeft ? -1 : 1);
    ctx.beginPath();
    ctx.moveTo(x - len * 0.5, y);
    ctx.lineTo(x + len * 0.5, y);
    ctx.stroke();
    const tipX = x + len * 0.5;
    const back = goesLeft ? 6 : -6;
    ctx.beginPath();
    ctx.moveTo(tipX, y);
    ctx.lineTo(tipX + back, y - 4);
    ctx.lineTo(tipX + back, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  function drawVerticalArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    goesUp: boolean,
  ) {
    const len = 22 * (goesUp ? -1 : 1);
    ctx.beginPath();
    ctx.moveTo(x, y - len * 0.5);
    ctx.lineTo(x, y + len * 0.5);
    ctx.stroke();
    const tipY = y + len * 0.5;
    const back = goesUp ? 6 : -6;
    ctx.beginPath();
    ctx.moveTo(x, tipY);
    ctx.lineTo(x - 4, tipY + back);
    ctx.lineTo(x + 4, tipY + back);
    ctx.closePath();
    ctx.fill();
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("I", x + 6, y);
  }

  function drawTracePanel(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    y0: number,
    trace: { t: number; v: number; I: number; emf: number }[],
    colors: { fg1: string; fg2: string; fg3: string },
  ) {
    // Border + label.
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, y0, w - 16, h);
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = colors.fg2;
    ctx.fillText("v(t)  —  I(t)  —  EMF(t)", 14, y0 + 12);

    if (trace.length < 2) return;

    const tMin = trace[0]!.t;
    const tMax = trace[trace.length - 1]!.t;
    const tSpan = Math.max(tMax - tMin, 0.1);

    // Find range across all three series for shared axis.
    let vMax = 0;
    for (const s of trace) {
      vMax = Math.max(vMax, Math.abs(s.v), Math.abs(s.I), Math.abs(s.emf));
    }
    vMax = Math.max(vMax, 0.1);

    const xOf = (t: number) =>
      14 + ((t - tMin) / tSpan) * (w - 28);
    const yOf = (val: number) =>
      y0 + h / 2 - (val / vMax) * (h / 2 - 6);

    // Zero line.
    ctx.strokeStyle = colors.fg3;
    ctx.beginPath();
    ctx.moveTo(14, y0 + h / 2);
    ctx.lineTo(w - 14, y0 + h / 2);
    ctx.stroke();

    // v (amber).
    drawSeries(ctx, trace, xOf, yOf, (s) => s.v, "rgba(255, 214, 107, 0.95)");
    // I (green-cyan).
    drawSeries(ctx, trace, xOf, yOf, (s) => s.I, "rgba(120, 255, 170, 0.95)");
    // EMF (magenta).
    drawSeries(ctx, trace, xOf, yOf, (s) => s.emf, "rgba(255, 106, 222, 0.95)");

    // Legend.
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 214, 107, 0.95)";
    ctx.fillText("v", w - 14, y0 + 12);
    ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
    ctx.fillText("I", w - 30, y0 + 12);
    ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
    ctx.fillText("EMF", w - 46, y0 + 12);
  }

  function drawSeries(
    ctx: CanvasRenderingContext2D,
    trace: { t: number; v: number; I: number; emf: number }[],
    xOf: (t: number) => number,
    yOf: (val: number) => number,
    sel: (s: { t: number; v: number; I: number; emf: number }) => number,
    color: string,
  ) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xOf(trace[0]!.t), yOf(sel(trace[0]!)));
    for (let i = 1; i < trace.length; i++) {
      ctx.lineTo(xOf(trace[i]!.t), yOf(sel(trace[i]!)));
    }
    ctx.stroke();
  }

  function drawRHRBadge(
    ctx: CanvasRenderingContext2D,
    width: number,
    sceneH: number,
    colors: { fg2: string; fg3: string },
  ) {
    const ox = width - 56;
    const oy = sceneH - 22;
    const len = 16;
    ctx.strokeStyle = colors.fg2;
    ctx.fillStyle = colors.fg2;
    ctx.lineWidth = 1.2;
    // x̂ right
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + len, oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox + len, oy);
    ctx.lineTo(ox + len - 3, oy - 3);
    ctx.lineTo(ox + len - 3, oy + 3);
    ctx.closePath();
    ctx.fill();
    // ŷ up
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy - len);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, oy - len);
    ctx.lineTo(ox - 3, oy - len + 3);
    ctx.lineTo(ox + 3, oy - len + 3);
    ctx.closePath();
    ctx.fill();
    // ẑ into page (circle with ×)
    ctx.strokeStyle = "rgba(120, 220, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(ox + 10, oy - 10, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox + 7, oy - 13);
    ctx.lineTo(ox + 13, oy - 7);
    ctx.moveTo(ox + 13, oy - 13);
    ctx.lineTo(ox + 7, oy - 7);
    ctx.stroke();
    ctx.fillStyle = colors.fg3;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("x̂", ox + len + 2, oy + 3);
    ctx.fillText("ŷ", ox - 3, oy - len - 2);
    ctx.fillText("B⊗", ox + 16, oy - 7);
  }

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <Slider
          label="|B|"
          value={B}
          min={0.2}
          max={1.5}
          step={0.01}
          onChange={setB}
          unit="T"
          accent="#78DCFF"
        />
        <Slider
          label="L"
          value={L}
          min={0.2}
          max={1.0}
          step={0.01}
          onChange={setL}
          unit="m"
          accent="#FFD66B"
        />
        <Slider
          label="R"
          value={R}
          min={0.1}
          max={2.0}
          step={0.01}
          onChange={setR}
          unit="Ω"
          accent="#B6C4D8"
        />
        <Slider
          label="F_ext"
          value={F_ext}
          min={-1.0}
          max={1.0}
          step={0.01}
          onChange={setFext}
          unit="N"
          accent="#FF6ADE"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        right-hand rule: F = qv × B pushes + charges up the rod; current in
        rod × B gives retarding force F_mag opposing v
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
      <span className="w-12 text-[var(--color-fg-1)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: accent }}
      />
      <span className="w-20 text-right text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
