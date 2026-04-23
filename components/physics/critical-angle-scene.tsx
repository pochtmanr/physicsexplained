"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas";
import type { RayTraceScene } from "@/components/physics/ray-trace-canvas";
import { criticalAngleRad, isTIR } from "@/lib/physics/electromagnetism/tir";

/**
 * FIG.45a — Critical-angle scene.
 *
 * A single ray propagates inside a slab of glass (n₁ = 1.5, below the
 * interface) toward the glass-air boundary. The slider drives the incidence
 * angle from 0° up to 89°. Below the critical angle θ_c ≈ 41.81° you see both
 * a refracted ray (into the air side) and a weak Fresnel reflection back into
 * the glass. Cross θ_c and the refracted ray disappears — every photon gets
 * reflected. The transmitted-ray opacity fades to zero continuously as the
 * angle approaches θ_c, which is what the word "total" actually looks like.
 *
 * Implementation note: RayTraceCanvas's analytic tracer handles the
 * refraction-or-reflection branch automatically. We construct a *second*
 * overlay scene with a mirrored-amplitude ray for the transmitted beam so
 * the fade-out is visible, because the tracer itself is binary (either it
 * refracts or it TIRs). The analytic fade we paint on top is informational
 * — a reminder that Fresnel transmission does not drop discontinuously.
 */

const WIDTH = 680;
const HEIGHT = 360;
const N_GLASS = 1.5;
const N_AIR = 1.0;

export function CriticalAngleScene() {
  const [angleDeg, setAngleDeg] = useState(35);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const thetaC = criticalAngleRad(N_GLASS, N_AIR) as number; // always non-null for 1.5/1.0
  const thetaCdeg = (thetaC * 180) / Math.PI;
  const isTotal = isTIR((angleDeg * Math.PI) / 180, N_GLASS, N_AIR);

  const scene: RayTraceScene = useMemo(() => {
    // Horizontal interface at y = HEIGHT/2. Glass below (larger canvas y),
    // air above. Ray source sits in the glass, aimed at the interface with
    // the given incidence angle measured from the interface normal (= +y-hat
    // in canvas coords pointing down into glass).
    const interfaceY = HEIGHT / 2;
    const sourceX = WIDTH * 0.28;
    const sourceY = HEIGHT * 0.82;
    // Canvas-y is down-positive. To aim the ray upward (toward the interface)
    // we want direction.y < 0. The angle from the normal is measured off the
    // upward normal (0, -1). directionDeg is measured from +x axis: 270° is
    // straight up; 270° + θ sweeps to the right, 270° − θ to the left. We
    // sweep to the right for positive θ.
    const directionDeg = 270 + angleDeg;

    const elements: RayTraceScene["elements"] = [
      {
        kind: "ray-source",
        id: "src",
        position: { x: sourceX, y: sourceY },
        directionDeg,
        wavelengthNm: 550,
      },
      {
        kind: "interface",
        id: "glass-air",
        // With p1 on the LEFT and p2 on the RIGHT, the tracer's normal is
        // (−v_y, v_x) normalised → (0, +1) — pointing DOWN into the glass.
        // A ray originating below the interface (larger canvas-y) therefore
        // has dot(origin − p1, normal) > 0, giving fromSide = "p1" and
        // (n1, n2) = (el.n1, el.n2). We set el.n1 = GLASS, el.n2 = AIR.
        p1: { x: 0, y: interfaceY },
        p2: { x: WIDTH, y: interfaceY },
        n1: N_GLASS,
        n2: N_AIR,
      },
    ];

    return { width: WIDTH, height: HEIGHT, elements, maxBounces: 2 };
  }, [angleDeg]);

  // Paint region tints + labels on a top overlay. The RayTraceCanvas only
  // renders the interface as a single cyan line — we add the glass/air mood
  // and a dashed normal ourselves on a separate canvas positioned behind.
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

    const interfaceY = HEIGHT / 2;
    // Air (top) — very subtle.
    const airGrad = ctx.createLinearGradient(0, 0, 0, interfaceY);
    airGrad.addColorStop(0, "rgba(111, 184, 198, 0.02)");
    airGrad.addColorStop(1, "rgba(111, 184, 198, 0.06)");
    ctx.fillStyle = airGrad;
    ctx.fillRect(0, 0, WIDTH, interfaceY);

    // Glass (bottom) — denser tint.
    const glassGrad = ctx.createLinearGradient(0, interfaceY, 0, HEIGHT);
    glassGrad.addColorStop(0, "rgba(111, 184, 198, 0.22)");
    glassGrad.addColorStop(1, "rgba(111, 184, 198, 0.30)");
    ctx.fillStyle = glassGrad;
    ctx.fillRect(0, interfaceY, WIDTH, HEIGHT - interfaceY);

    // Region labels
    ctx.fillStyle = "rgba(230, 236, 244, 0.65)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`n₂ = ${N_AIR.toFixed(2)}  ·  air`, 12, 18);
    ctx.fillText(`n₁ = ${N_GLASS.toFixed(2)}  ·  glass`, 12, HEIGHT - 12);

    // Dashed normal at the incidence point.
    const sourceX = WIDTH * 0.28;
    const sourceY = HEIGHT * 0.82;
    const thetaRad = (angleDeg * Math.PI) / 180;
    // Ray is a line from source with direction 270° + angleDeg.
    const dirDeg = 270 + angleDeg;
    const dx = Math.cos((dirDeg * Math.PI) / 180);
    const dy = Math.sin((dirDeg * Math.PI) / 180);
    // Intersect with y = interfaceY: t = (interfaceY - sourceY)/dy (dy < 0).
    const t = (interfaceY - sourceY) / dy;
    const hitX = sourceX + t * dx;
    const hitY = interfaceY;

    ctx.strokeStyle = "rgba(180, 196, 216, 0.45)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(hitX, hitY - 40);
    ctx.lineTo(hitX, hitY + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ghost transmitted ray (Fresnel-faded) — show only when below critical.
    // Inside is TIR so no line; outside, we draw a pale extension upward at
    // the refracted angle derived from Snell.
    if (!isTotal) {
      const sinT = (N_GLASS / N_AIR) * Math.sin(thetaRad);
      if (Math.abs(sinT) <= 1) {
        const thetaT = Math.asin(sinT);
        // Fade factor: approaches 0 at θ_c. Use (cos θ_c_bound) as a proxy
        // for transmission — vanishes smoothly as sinT → 1.
        const fade = Math.sqrt(Math.max(0, 1 - sinT * sinT));
        const tLen = 220;
        const tdx = Math.sin(thetaT);
        const tdy = -Math.cos(thetaT); // going up into the air side
        ctx.strokeStyle = `rgba(255, 180, 80, ${0.85 * fade})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(hitX, hitY);
        ctx.lineTo(hitX + tdx * tLen, hitY + tdy * tLen);
        ctx.stroke();
      }
    }

    // Critical-angle guideline — paint a thin amber ray hugging the interface
    // from the opposite side, marking where refraction grazes 90°.
    const criticalHitX = hitX; // same hit point for visual reference
    ctx.strokeStyle = "rgba(228, 194, 122, 0.25)";
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(criticalHitX - 200, hitY);
    ctx.lineTo(criticalHitX + 200, hitY);
    ctx.stroke();
    ctx.setLineDash([]);

    // HUD
    ctx.fillStyle = isTotal
      ? "rgba(255, 106, 222, 0.92)"
      : "rgba(111, 184, 198, 0.92)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      `θ_i = ${angleDeg.toFixed(1)}°   θ_c = ${thetaCdeg.toFixed(2)}°`,
      WIDTH - 12,
      18,
    );
    ctx.fillText(
      isTotal ? "TOTAL INTERNAL REFLECTION" : "refracted + weak reflection",
      WIDTH - 12,
      34,
    );
  }, [angleDeg, isTotal, thetaCdeg]);

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
        <label className="text-sm text-[var(--color-fg-3)]">Incidence angle</label>
        <input
          type="range"
          min={0}
          max={89}
          step={0.1}
          value={angleDeg}
          onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
          className="flex-1 accent-[#E4C27A]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {angleDeg.toFixed(1)}°
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Below θ_c the ray refracts into the air and a sliver reflects back.
        Cross θ_c ≈ {thetaCdeg.toFixed(2)}° and the orange ray vanishes —
        100 % of the light is reflected.
      </p>
    </div>
  );
}
