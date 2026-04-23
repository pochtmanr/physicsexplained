"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { criticalAngleRad } from "@/lib/physics/electromagnetism/tir";
import type { RayTraceScene } from "@/components/physics/ray-trace-canvas";
import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas";

/**
 * FIG.45b — Fiber-optic TIR scene.
 *
 * A horizontal glass rod (core n₁ = 1.5) sits in air (cladding n₂ = 1.0).
 * Rays enter from the left face at a fan of incidence angles. Rays whose
 * internal angle of incidence at the side wall exceeds the critical angle
 * (θ_c ≈ 41.81°) bounce down the fiber indefinitely via TIR; rays outside
 * that acceptance cone refract out through the walls within a short distance
 * and are lost.
 *
 * The acceptance half-angle at the entrance face is sin⁻¹(NA), where the
 * numerical aperture NA = √(n₁² − n₂²) ≈ 1.118 (so NA ≥ 1 → the fiber
 * accepts every angle in air; we still visualise the *internal* angle gate).
 * This topic's NA formula is computed in-scene for display.
 *
 * Implementation: RayTraceCanvas's tracer handles the full geometry, so we
 * only have to construct the scene — a ray-source fan, two horizontal
 * interfaces, and enough bounce budget (maxBounces) to trace the guided rays
 * to the end of the rod.
 */

const WIDTH = 680;
const HEIGHT = 300;
const N_CORE = 1.5;
const N_CLAD = 1.0;

// Half-angle of the input ray fan, measured in degrees from the fiber axis.
// A wider fan shows both guided and leaking rays clearly.
const FAN_HALF_ANGLE_DEG_MAX = 50;

export function FiberOpticTIRScene() {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [fanHalfAngleDeg, setFanHalfAngleDeg] = useState(38);

  const thetaC = criticalAngleRad(N_CORE, N_CLAD) as number;
  const thetaCdeg = (thetaC * 180) / Math.PI;
  // Internal-angle acceptance: a ray coming off axis by φ makes angle
  // (90° − φ) with the side-wall normal. TIR at the wall requires
  // (90° − φ) ≥ θ_c, i.e. φ ≤ 90° − θ_c ≈ 48.19°.
  const acceptInternalDeg = 90 - thetaCdeg;

  const scene: RayTraceScene = useMemo(() => {
    const topY = HEIGHT * 0.32;
    const botY = HEIGHT * 0.68;
    const srcX = WIDTH * 0.06;
    const srcY = (topY + botY) / 2;

    const elements: RayTraceScene["elements"] = [
      // Top wall: p1 on LEFT, p2 on RIGHT → normal (0, +1) points DOWN into
      // the core (since canvas-y grows downward). A ray inside the core
      // approaching the top wall has origin.y > p1.y, so fromSide = "p1" and
      // (n1, n2) = (el.n1, el.n2) = (CORE, CLAD). Good.
      {
        kind: "interface",
        id: "wall-top",
        p1: { x: 0, y: topY },
        p2: { x: WIDTH, y: topY },
        n1: N_CORE,
        n2: N_CLAD,
      },
      // Bottom wall: reversed p1/p2 so the normal (−v_y, v_x) points UP into
      // the core. Then an internal ray (origin.y < p1.y relative to p1 on the
      // right at lower y — wait, canvas y is down-positive, so "bottom wall"
      // is at larger y. Using p1 on the RIGHT and p2 on the LEFT: v = (-W, 0),
      // normal = (0, -W)/W = (0, -1), which points UPWARD in canvas (toward
      // smaller y, i.e. toward the core centre). An internal ray has
      // origin.y < p1.y, so (origin − p1).y < 0; dot with (0,-1) > 0 →
      // fromSide = "p1" → (n1, n2) = (CORE, CLAD). Good.
      {
        kind: "interface",
        id: "wall-bot",
        p1: { x: WIDTH, y: botY },
        p2: { x: 0, y: botY },
        n1: N_CORE,
        n2: N_CLAD,
      },
      // Fan of rays from the left — the entrance face. The tracer's rays
      // originate in air, not glass, but the *wall* interfaces are where the
      // TIR vs escape decision happens. Once the ray enters the core volume
      // (no front-face interface, so no refraction at entry; we're already
      // treating the source as inside the guided medium for didactic clarity)
      // it hits a wall and either TIRs or refracts out.
      {
        kind: "ray-source",
        id: "fan",
        position: { x: srcX, y: srcY },
        directionDeg: 0, // along +x
        fanHalfAngleDeg,
        fanCount: 11,
        wavelengthNm: 550,
      },
    ];

    return { width: WIDTH, height: HEIGHT, elements, maxBounces: 40 };
  }, [fanHalfAngleDeg]);

  useEffect(() => {
    const cv = overlayRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== WIDTH * dpr || cv.height !== HEIGHT * dpr) {
      cv.width = WIDTH * dpr;
      cv.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const topY = HEIGHT * 0.32;
    const botY = HEIGHT * 0.68;

    // Cladding (outside the core) — faint air tint.
    ctx.fillStyle = "rgba(111, 184, 198, 0.04)";
    ctx.fillRect(0, 0, WIDTH, topY);
    ctx.fillRect(0, botY, WIDTH, HEIGHT - botY);

    // Core — denser glass tint.
    const coreGrad = ctx.createLinearGradient(0, topY, 0, botY);
    coreGrad.addColorStop(0, "rgba(111, 184, 198, 0.22)");
    coreGrad.addColorStop(0.5, "rgba(111, 184, 198, 0.28)");
    coreGrad.addColorStop(1, "rgba(111, 184, 198, 0.22)");
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, topY, WIDTH, botY - topY);

    // Labels
    ctx.fillStyle = "rgba(230, 236, 244, 0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`cladding — n = ${N_CLAD.toFixed(2)}`, 12, 16);
    ctx.fillText(`core — n = ${N_CORE.toFixed(2)}`, 12, (topY + botY) / 2 + 4);
    ctx.fillText(`cladding — n = ${N_CLAD.toFixed(2)}`, 12, HEIGHT - 10);

    // HUD
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(228, 194, 122, 0.9)";
    ctx.fillText(`θ_c = ${thetaCdeg.toFixed(2)}°`, WIDTH - 12, 16);
    ctx.fillText(
      `internal-accept ≤ ${acceptInternalDeg.toFixed(2)}°`,
      WIDTH - 12,
      32,
    );
    ctx.fillStyle =
      fanHalfAngleDeg <= acceptInternalDeg
        ? "rgba(111, 184, 198, 0.9)"
        : "rgba(255, 106, 222, 0.9)";
    ctx.fillText(
      fanHalfAngleDeg <= acceptInternalDeg
        ? "all rays guided"
        : "outer rays leak",
      WIDTH - 12,
      48,
    );
  }, [fanHalfAngleDeg, thetaCdeg, acceptInternalDeg]);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <div className="relative mx-auto" style={{ width: WIDTH, height: HEIGHT }}>
        <canvas
          ref={overlayRef}
          style={{ width: WIDTH, height: HEIGHT, position: "absolute", inset: 0, zIndex: 0 }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <RayTraceCanvas scene={scene} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Fan half-angle</label>
        <input
          type="range"
          min={0}
          max={FAN_HALF_ANGLE_DEG_MAX}
          step={0.5}
          value={fanHalfAngleDeg}
          onChange={(e) => setFanHalfAngleDeg(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {fanHalfAngleDeg.toFixed(1)}°
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Rays inside the internal acceptance cone ({acceptInternalDeg.toFixed(1)}
        °) bounce by TIR forever; crank the fan and the outer rays refract
        through the walls. This is the entire physics of an optical fiber — a
        preview of §09.10.
      </p>
    </div>
  );
}
