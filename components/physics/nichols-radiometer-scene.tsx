"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { radiationPressureReflecting } from "@/lib/physics/electromagnetism/radiation-pressure";

const RATIO = 0.58;
const MAX_HEIGHT = 420;

const AMBER = "rgba(255, 214, 107,";
const CYAN = "rgba(120, 220, 255,";
const MAGENTA = "rgba(255, 106, 222,";

type Apparatus = "nichols" | "crookes";

/**
 * FIG.40c — Nichols 1901 torsion balance vs Crookes radiometer.
 *
 * Two apparatuses, same arc-lamp beam. Readers toggle between them.
 *
 * NICHOLS (the real measurement): a fine quartz fibre suspends a horizontal
 * bar carrying a silvered mirror on one end and a blackened vane on the
 * other, sealed in a high-vacuum bulb. Light hits the mirror; the mirror
 * deflects in the direction the light is going (radiation pressure pushes
 * the mirror away from the source, fibre twists that way). Deflection is
 * tiny — microradians — but measurable with a reflected light pointer.
 *
 * CROOKES (the misconception): four vanes, black on one face, silvered on
 * the other, pinned on a low-friction axle in a soft-vacuum bulb (~10 Pa
 * of residual gas). Light hits; vanes spin with the BLACKENED face
 * trailing, not leading — which is the *opposite* of what radiation
 * pressure alone would give. The rotation is thermally driven: the warm
 * blackened face imparts more momentum to residual gas molecules than the
 * cool silvered face, and the reaction pushes the blackened side back.
 * Evacuate Crookes's bulb harder and the rotation stops; radiation
 * pressure is too weak to drive it against bearing friction.
 *
 * The scene side-by-sides these with live deflection/rotation indicators
 * and an "WHY" overlay that swaps between "pressure" and "thermal".
 */
export function NicholsRadiometerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 780, height: 420 });
  const [apparatus, setApparatus] = useState<Apparatus>("nichols");
  const [lightOn, setLightOn] = useState(true);

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

      const cx = width / 2;
      const cy = height * 0.42;

      // ─────── Light source (arc lamp) on the left ───────
      drawLamp(ctx, 46, cy, lightOn);

      // ─────── Beam from lamp toward bulb ───────
      const bulbCx = cx;
      const bulbCy = cy;
      const bulbR = Math.min(width * 0.22, 140);

      if (lightOn) {
        const beamAlpha = 0.55;
        ctx.strokeStyle = `${AMBER} ${beamAlpha.toFixed(2)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(70, cy);
        ctx.lineTo(bulbCx - bulbR, cy);
        ctx.stroke();
        // secondary beam-edge glow
        ctx.strokeStyle = `${AMBER} 0.2)`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(70, cy);
        ctx.lineTo(bulbCx - bulbR, cy);
        ctx.stroke();
      }

      // ─────── Glass bulb ───────
      ctx.strokeStyle = `${CYAN} 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "rgba(120, 220, 255, 0.03)";
      ctx.beginPath();
      ctx.arc(bulbCx, bulbCy, bulbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stem at top of bulb
      ctx.strokeStyle = `${CYAN} 0.4)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bulbCx, bulbCy - bulbR);
      ctx.lineTo(bulbCx, bulbCy - bulbR - 30);
      ctx.stroke();

      // Vacuum label
      ctx.font = "9px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.fillText(
        apparatus === "nichols" ? "high vacuum (<10⁻³ Pa)" : "soft vacuum (~10 Pa)",
        bulbCx,
        bulbCy - bulbR - 38,
      );

      // ─────── The actual apparatus inside the bulb ───────
      if (apparatus === "nichols") {
        drawNichols(ctx, bulbCx, bulbCy, bulbR, t, lightOn);
      } else {
        drawCrookes(ctx, bulbCx, bulbCy, bulbR, t, lightOn);
      }

      // ─────── Explanation box on the right ───────
      const boxX = bulbCx + bulbR + 20;
      const boxY = bulbCy - 90;
      const boxW = Math.min(width - boxX - 12, 220);
      if (boxW > 60) {
        ctx.fillStyle = "rgba(20, 24, 32, 0.6)";
        ctx.strokeStyle =
          apparatus === "nichols" ? `${MAGENTA} 0.6)` : `${CYAN} 0.4)`;
        ctx.lineWidth = 1;
        ctx.fillRect(boxX, boxY, boxW, 180);
        ctx.strokeRect(boxX, boxY, boxW, 180);

        ctx.textAlign = "left";
        ctx.font = "bold 11px monospace";
        ctx.fillStyle =
          apparatus === "nichols" ? `${MAGENTA} 1)` : `${CYAN} 0.9)`;
        ctx.fillText(
          apparatus === "nichols"
            ? "NICHOLS 1901 — radiation"
            : "CROOKES — thermal",
          boxX + 10,
          boxY + 18,
        );
        ctx.font = "9.5px monospace";
        ctx.fillStyle = colors.fg1;
        const lines =
          apparatus === "nichols"
            ? [
                "Silvered vane is pushed",
                "AWAY from source.",
                "",
                "P = 2I/c at the mirror,",
                "about 9 µPa at 1 AU.",
                "",
                "Quartz fibre twists by",
                "microradians. First direct",
                "measurement; matched",
                "Maxwell within a few %.",
                "",
                "High vacuum kills the",
                "thermal artefact.",
              ]
            : [
                "Vanes spin with BLACK",
                "side TRAILING — wrong",
                "way for radiation.",
                "",
                "Blackened face heats the",
                "residual gas; hotter gas",
                "imparts more momentum",
                "to the vane face than",
                "cool gas does.",
                "",
                "Evacuate the bulb hard",
                "and rotation STOPS.",
                "Radiation is too weak.",
              ];
        let yy = boxY + 34;
        for (const line of lines) {
          ctx.fillText(line, boxX + 10, yy);
          yy += 12;
        }
      }

      // ─────── HUD top-left ───────
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        apparatus === "nichols"
          ? "Nichols torsion balance — direct measurement of P"
          : "Crookes radiometer — DOES NOT measure radiation pressure",
        12,
        20,
      );
      // Reference pressure (for Nichols) at ~solar-constant scale
      const Iref = 1361;
      const Pref = radiationPressureReflecting(Iref);
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `reference: P = 2I/c = ${(Pref * 1e6).toFixed(2)} µPa @ I = 1361 W/m²`,
        12,
        36,
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
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setApparatus("nichols")}
          className={`rounded border px-3 py-1 transition-colors ${
            apparatus === "nichols"
              ? "border-[var(--color-magenta)] text-[var(--color-magenta)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-3)]"
          }`}
        >
          NICHOLS 1901
        </button>
        <button
          type="button"
          onClick={() => setApparatus("crookes")}
          className={`rounded border px-3 py-1 transition-colors ${
            apparatus === "crookes"
              ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-3)]"
          }`}
        >
          CROOKES (thermal)
        </button>
        <button
          type="button"
          onClick={() => setLightOn((v) => !v)}
          className={`ml-auto rounded border px-3 py-1 transition-colors ${
            lightOn
              ? "border-[var(--color-amber)] text-[var(--color-amber)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-3)]"
          }`}
        >
          LIGHT {lightOn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}

function drawLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  on: boolean,
) {
  // Reflector housing
  ctx.fillStyle = "#2a2f3a";
  ctx.strokeStyle = "#6b7488";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 18, -Math.PI * 0.4, Math.PI * 0.4, true);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Arc bead
  if (on) {
    const g = ctx.createRadialGradient(x + 4, y, 1, x + 4, y, 12);
    g.addColorStop(0, "rgba(255, 255, 230, 1)");
    g.addColorStop(0.4, "rgba(255, 214, 107, 0.8)");
    g.addColorStop(1, "rgba(255, 140, 40, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + 4, y, 12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.arc(x + 4, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNichols(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  t: number,
  lightOn: boolean,
) {
  // Vertical quartz fibre from stem to a suspension point
  ctx.strokeStyle = "rgba(230, 230, 250, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx, cy - 10);
  ctx.stroke();

  // Torsion deflection angle — small steady twist when light is on
  const maxTheta = 0.35; // rad (visually exaggerated)
  const targetTheta = lightOn ? maxTheta : 0;
  // Damped sinusoidal approach to target
  const theta =
    targetTheta + (lightOn ? 0.03 * Math.sin(t * 1.5) * Math.exp(-t * 0.05) : 0);
  const thetaNow = theta - Math.exp(-t * 0.5) * theta;

  // The horizontal bar carrying mirror (light side) and blackened vane (dark side)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(thetaNow);

  const barLen = R * 0.72;
  // Bar rod
  ctx.strokeStyle = "rgba(200, 210, 230, 0.8)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-barLen, 0);
  ctx.lineTo(barLen, 0);
  ctx.stroke();

  // Silvered mirror on the right (where light hits when un-deflected)
  const mirrorGrad = ctx.createLinearGradient(barLen - 20, -12, barLen, -12);
  mirrorGrad.addColorStop(0, "#E0E0F0");
  mirrorGrad.addColorStop(1, "#707080");
  ctx.fillStyle = mirrorGrad;
  ctx.fillRect(barLen - 20, -14, 20, 28);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barLen - 20, -14, 20, 28);

  // Blackened vane on the left
  ctx.fillStyle = "#15181e";
  ctx.fillRect(-barLen, -14, 20, 28);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.strokeRect(-barLen, -14, 20, 28);

  // Labels on the bar (in rotating frame)
  ctx.font = "9px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.textAlign = "center";
  ctx.fillText("mirror", barLen - 10, -20);
  ctx.fillStyle = "rgba(180, 180, 200, 0.8)";
  ctx.fillText("vane", -barLen + 10, -20);
  ctx.restore();

  // Deflection direction arrow (world frame, magenta)
  if (lightOn && Math.abs(thetaNow) > 0.01) {
    ctx.strokeStyle = `${MAGENTA} 0.85)`;
    ctx.fillStyle = `${MAGENTA} 0.85)`;
    ctx.lineWidth = 1.5;
    // Arc at the mirror tip
    const mirrorAngle = thetaNow;
    const rx = cx + Math.cos(mirrorAngle) * (R * 0.72);
    const ry = cy + Math.sin(mirrorAngle) * (R * 0.72);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 14, ry + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx + 14, ry + 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Δθ ≈ µrad", rx + 18, ry + 18);
  }

  // Deflection readout scale at top of bulb
  ctx.textAlign = "center";
  ctx.font = "9px monospace";
  ctx.fillStyle = "rgba(200, 200, 220, 0.6)";
  ctx.fillText("(quartz fibre)", cx, cy - R + 10);
}

function drawCrookes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  t: number,
  lightOn: boolean,
) {
  // Vertical axle (needle on glass pivot)
  ctx.strokeStyle = "rgba(200, 210, 230, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R * 0.7);
  ctx.lineTo(cx, cy + R * 0.7);
  ctx.stroke();

  // Rotation with the BLACK side trailing (the wrong-way-for-radiation rotation).
  // Speed picks up when light is on.
  const omega = lightOn ? 1.4 : 0;
  const angle = omega * t;

  // Four vanes around the axle, at 90° apart
  const vaneLen = R * 0.48;
  const vaneW = 22;
  for (let i = 0; i < 4; i++) {
    const phi = angle + (i * Math.PI) / 2;
    const vx = cx + Math.cos(phi) * vaneLen;
    const vy = cy + Math.sin(phi) * vaneLen;
    // Each vane is a flat rectangle perpendicular to its radial direction.
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(phi + Math.PI / 2);
    // "Leading" face (faces the direction of motion): black
    // "Trailing" face: silvered
    // For Crookes's thermal drive, the vane spins such that the BLACK face
    // trails — i.e., the black face is on the side opposite the direction
    // of motion. Direction of motion at this point: tangent = +phi_hat =
    // +sin(phi) dx, −cos(phi) dy (in local frame that's +x).
    // So black face = the side at local -x (trailing), silvered = +x (leading).
    ctx.fillStyle = "#E0E0F0";
    ctx.fillRect(0, -vaneW / 2, 2, vaneW); // silvered (leading)
    ctx.fillStyle = "#15181e";
    ctx.fillRect(-2, -vaneW / 2, 2, vaneW); // black (trailing)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-2, -vaneW / 2, 4, vaneW);
    ctx.restore();
  }

  // Rotation direction arrow (curved)
  if (lightOn) {
    ctx.strokeStyle = `${CYAN} 0.7)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.72, -Math.PI * 0.9, -Math.PI * 0.6);
    ctx.stroke();
    // arrowhead at end of arc
    const ax = cx + Math.cos(-Math.PI * 0.6) * R * 0.72;
    const ay = cy + Math.sin(-Math.PI * 0.6) * R * 0.72;
    ctx.fillStyle = `${CYAN} 0.85)`;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 4, ay - 6);
    ctx.lineTo(ax + 4, ay - 6);
    ctx.closePath();
    ctx.fill();

    ctx.font = "9px monospace";
    ctx.fillStyle = `${CYAN} 0.95)`;
    ctx.textAlign = "center";
    ctx.fillText("(black side trailing)", cx, cy - R * 0.85);
    ctx.fillStyle = "rgba(255, 180, 180, 0.9)";
    ctx.fillText("← wrong way for P!", cx, cy + R * 0.93);
  }

  // A few residual-gas dots bouncing around (to emphasize soft-vacuum)
  for (let i = 0; i < 14; i++) {
    const ax = cx + Math.cos(i * 1.7 + t * 0.6) * R * 0.85;
    const ay = cy + Math.sin(i * 1.7 + t * 0.6) * R * 0.85;
    ctx.fillStyle = "rgba(180, 200, 220, 0.35)";
    ctx.beginPath();
    ctx.arc(ax, ay, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
