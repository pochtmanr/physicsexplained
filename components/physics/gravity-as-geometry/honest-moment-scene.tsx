"use client";

import { useEffect, useRef } from "react";

/**
 * FIG.28c — The §06.4 closer. A text-and-equation panel that lands the
 * honest moment plainly:
 *
 *     There is no force called gravity. There is curvature.
 *
 * Below the headline, a teaser-equation: the Einstein field equations,
 *
 *     R_{μν} − (1/2) g_{μν} R = (8π G/c⁴) T_{μν}
 *
 * — labeled "Session 4 will derive this." The reader sees the geometry
 * that gravity IS, before the math arrives in §07–§08.
 *
 * No interactivity. The scene is a static, deliberately flat canvas — the
 * intent is that the reader pause on it. Interactive cleverness would
 * undermine the moment.
 */

const W = 700;
const H = 360;

export function HonestMomentScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Background tint — slightly violet to distinguish from the prose page.
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "rgba(167,139,250,0.06)");
    bgGrad.addColorStop(1, "rgba(0,0,0,0.30)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── HEADLINE ─────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("There is no force called gravity.", W / 2, 84);

    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("There is curvature.", W / 2, 116);

    // ── DIVIDER ──────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, 142);
    ctx.lineTo(W / 2 + 100, 142);
    ctx.stroke();

    // ── EFE TEASER ────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "Session 4 derives the geometry. The equation is —",
      W / 2,
      168,
    );

    // Render the EFE in plain monospace text — KaTeX is overkill for a canvas
    // and the readability is fine for a teaser line.
    ctx.fillStyle = "#FFD66B";
    ctx.font = "bold 20px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "R_μν − ½ g_μν R = (8π G / c⁴) T_μν",
      W / 2,
      210,
    );

    // Equation gloss
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(
      "left side: how spacetime curves   ·   right side: where the matter and energy are",
      W / 2,
      236,
    );

    // ── FOOTER: the bridge to §07 ────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Free-falling along curvature looks like falling.",
      W / 2,
      284,
    );

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(
      "The next module formalizes the geometry.",
      W / 2,
      306,
    );

    ctx.fillStyle = "#A78BFA";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      "→  §07: manifolds, tangent spaces, metrics, Christoffels, geodesics.",
      W / 2,
      334,
    );
  }, []);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
    </div>
  );
}
