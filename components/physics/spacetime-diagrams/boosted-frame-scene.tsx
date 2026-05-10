"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { useSceneTokens } from "@/components/physics/_shared/scene-tokens";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";

/**
 * §03.1 BOOSTED FRAME — the scissor reveal.
 *
 * The lab frame's axes are vertical (ct) and horizontal (x). A boosted frame
 * moving at βc has axes that tilt SYMMETRICALLY about the 45° light line:
 *   • ct' axis tilts toward the light cone, slope 1/β (drawn as x = β·ct)
 *   • x' axis tilts away from the x-axis by the same angle, slope β
 *
 * As β → 1 the two boosted axes squeeze together onto the 45° light line
 * — a coordinate "scissor" closing on the universal speed limit. The
 * shared SpacetimeDiagramCanvas draws magenta boosted axes whenever its
 * `boostBeta` is non-zero; the slider exposes that prop directly.
 *
 * One stationary worldline (cyan, vertical) and one observer riding the
 * boosted frame (magenta, slope = β = same as ct' axis) anchor the picture.
 */

const T_RANGE: [number, number] = [0, 4];
const X_RANGE: [number, number] = [-2.5, 2.5];

export function BoostedFrameScene() {
  const [beta, setBeta] = useState(0.5);
  const tokens = useSceneTokens();

  const worldlines = useMemo<Worldline[]>(() => {
    const lab: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => ({
        t: T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]),
        x: 0,
        y: 0,
        z: 0,
      })),
      color: tokens.cyan,
      label: "lab observer",
    };
    const boosted: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => {
        const tt = T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]);
        return { t: tt, x: beta * tt, y: 0, z: 0 };
      }),
      color: tokens.magenta,
      label: "boosted observer",
    };
    return [lab, boosted];
  }, [beta, tokens.cyan, tokens.magenta]);

  const g = gamma(beta);
  const tiltDeg = (Math.atan(Math.abs(beta)) * 180) / Math.PI;

  return (
    <div className="flex flex-col gap-3">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={true}
        boostBeta={beta}
        onBoostChange={setBeta}
        boostMin={-0.95}
        boostMax={0.95}
        xRange={X_RANGE}
        tRange={T_RANGE}
      />
      <div className="grid grid-cols-3 gap-3 font-mono text-[11px] text-[var(--color-fg-2)]">
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-cyan) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-cyan) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-cyan)" }}>LAB AXES (cyan)</div>
          <div className="mt-1 opacity-80">x ⊥ ct, vertical and horizontal</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-magenta) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-magenta) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-magenta)" }}>BOOSTED AXES (magenta)</div>
          <div className="mt-1 opacity-80">
            ct′ tilt = {tiltDeg.toFixed(1)}° toward light cone
          </div>
          <div className="opacity-80">x′ tilts symmetrically</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-amber) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-amber) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-amber)" }}>SCISSOR · 45° limit</div>
          <div className="mt-1 opacity-80">
            β = {beta.toFixed(2)} · γ = {g.toFixed(3)}
          </div>
          <div className="opacity-80">as β→1 axes close on light line</div>
        </div>
      </div>
    </div>
  );
}
