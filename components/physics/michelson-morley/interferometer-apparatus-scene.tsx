"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.66;
const MAX_HEIGHT = 460;

/**
 * FIG.03a — Michelson-Morley interferometer schematic.
 *
 *   monochromatic source ──► beam splitter ──► two perpendicular arms
 *                                              with end mirrors ──►
 *   recombiner / fringe-pattern viewer.
 *
 * The whole apparatus rotates slowly about its centre. In the 1887
 * protocol Michelson and Morley spun the optical bench on a granite
 * slab floating in a mercury bath — a single full rotation took about
 * six minutes. The animation here speeds that up. As θ changes, the
 * cosine-of-2θ aether prediction would carry the fringe pattern
 * through ±0.4 fringes; the lab observation never moved more than
 * ±0.01.
 */
export function InterferometerApparatusScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });

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

      // ── Layout: apparatus on left 70%, fringe viewer on right 30% ──
      const apparatusW = width * 0.7;
      const cx = apparatusW * 0.5;
      const cy = height * 0.5;

      // Slow rotation: 12 s per full spin (much faster than 1887's 6 min).
      const theta = (t * (Math.PI * 2)) / 12;

      // Arm length in pixels.
      const arm = Math.min(apparatusW, height) * 0.32;

      // Photon-pulse phase along each arm — amber pulse bouncing back and forth.
      const period = 1.6;
      const phase = (t % period) / period;
      const triPhase = phase < 0.5 ? phase * 2 : 2 - phase * 2; // 0..1..0

      // ── Static labels (frame-independent) ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("monochromatic source", 16, 18);
      ctx.fillText("(λ = 589 nm Na D-line)", 16, 32);
      ctx.textAlign = "right";
      ctx.fillText("fringe-pattern viewer", apparatusW - 8, 18);

      // ── Source (off the lower-left of the apparatus) ──
      const srcX = cx - arm * 1.7;
      const srcY = cy;
      ctx.save();
      ctx.shadowColor = "rgba(255, 200, 80, 0.8)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FFC852";
      ctx.beginPath();
      ctx.arc(srcX, srcY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = colors.fg2;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("source", srcX, srcY + 22);

      // Source-to-splitter beam (always horizontal in lab frame)
      ctx.strokeStyle = "rgba(255, 200, 80, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(srcX + 7, srcY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── The rotating apparatus: arms, mirrors, splitter ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(theta);

      // Beam splitter (45° plate at the centre, drawn as a diagonal line)
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -9);
      ctx.lineTo(9, 9);
      ctx.stroke();

      // Arm 1: along the apparatus +x axis (becomes "horizontal" at θ=0)
      ctx.strokeStyle = "rgba(140, 200, 255, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arm, 0);
      ctx.stroke();

      // Arm 2: along the apparatus +y axis (perpendicular)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -arm);
      ctx.stroke();

      // End mirrors
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(arm, -10);
      ctx.lineTo(arm, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, -arm);
      ctx.lineTo(10, -arm);
      ctx.stroke();

      // Photon pulses: amber dots travelling out to mirrors and back
      const pulseR = 4;
      ctx.shadowColor = "rgba(255, 200, 80, 0.85)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#FFC852";
      // Arm 1 pulse
      const x1 = triPhase * arm;
      ctx.beginPath();
      ctx.arc(x1, 0, pulseR, 0, Math.PI * 2);
      ctx.fill();
      // Arm 2 pulse
      const y2 = -triPhase * arm;
      ctx.beginPath();
      ctx.arc(0, y2, pulseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Splitter dot
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // ── Apparatus rotation θ readout ──
      const thetaDeg = ((theta * 180) / Math.PI) % 360;
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`θ = ${thetaDeg.toFixed(0)}°`, 16, height - 20);
      ctx.fillStyle = colors.fg2;
      ctx.font = "9px monospace";
      ctx.fillText("apparatus rotates on a mercury-floated granite slab", 16, height - 6);

      // Beam-splitter / mirror labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("beam splitter", cx, cy + 28);

      // ── Fringe-pattern viewer (right panel) ──
      const viewerX = apparatusW + 12;
      const viewerW = width - viewerX - 12;
      const viewerY = height * 0.18;
      const viewerH = height * 0.64;

      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(viewerX, viewerY, viewerW, viewerH);

      // Fringes: vertical bands. The 1887 OBSERVATION never moved more
      // than 0.01 of a fringe. Visualise this by holding the bands almost
      // perfectly still — a sub-pixel drift the eye can barely detect.
      const observedShiftFringes = 0.01 * Math.sin(t * 0.4);
      const fringeSpacing = viewerW / 8;
      const drift = observedShiftFringes * fringeSpacing;
      for (let i = 0; i < 9; i++) {
        const xc = viewerX + i * fringeSpacing + drift;
        const grad = ctx.createLinearGradient(xc - fringeSpacing * 0.5, 0, xc + fringeSpacing * 0.5, 0);
        grad.addColorStop(0, "rgba(255, 200, 80, 0.0)");
        grad.addColorStop(0.5, "rgba(255, 200, 80, 0.6)");
        grad.addColorStop(1, "rgba(255, 200, 80, 0.0)");
        ctx.fillStyle = grad;
        ctx.fillRect(
          Math.max(viewerX, xc - fringeSpacing * 0.5),
          viewerY,
          fringeSpacing,
          viewerH,
        );
      }

      // Viewer caption
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("fringes", viewerX + viewerW / 2, viewerY - 6);
      ctx.fillStyle = colors.fg2;
      ctx.font = "9px monospace";
      ctx.fillText(
        `observed shift: ${observedShiftFringes >= 0 ? "+" : ""}${observedShiftFringes.toFixed(3)} fringes`,
        viewerX + viewerW / 2,
        viewerY + viewerH + 14,
      );
      ctx.fillText(
        "(noise floor ≈ 0.01)",
        viewerX + viewerW / 2,
        viewerY + viewerH + 26,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
    </div>
  );
}
