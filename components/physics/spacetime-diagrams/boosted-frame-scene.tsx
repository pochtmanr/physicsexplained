"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
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

  const worldlines = useMemo<Worldline[]>(() => {
    // Cyan stationary observer at x = 0
    const lab: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => ({
        t: T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]),
        x: 0,
        y: 0,
        z: 0,
      })),
      color: "#67E8F9",
      label: "lab observer",
    };
    // Magenta observer at rest in the boosted frame — its lab worldline is
    // the ct' axis itself (slope β in the (x, ct) lab diagram). We draw it
    // explicitly even though SpacetimeDiagramCanvas also strokes the ct'
    // axis: the worldline has the magenta label and reinforces the geometry.
    const boosted: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => {
        const tt = T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]);
        return { t: tt, x: beta * tt, y: 0, z: 0 };
      }),
      color: "#FF6ADE",
      label: "boosted observer",
    };
    return [lab, boosted];
  }, [beta]);

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
        width={520}
        height={420}
      />
      <div className="grid grid-cols-3 gap-3 font-mono text-[11px] text-white/70">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">LAB AXES (cyan)</div>
          <div className="mt-1 opacity-80">x ⊥ ct, vertical and horizontal</div>
        </div>
        <div className="rounded-md border border-pink-300/20 bg-pink-300/[0.04] p-3">
          <div className="text-pink-300/85">BOOSTED AXES (magenta)</div>
          <div className="mt-1 opacity-80">
            ct′ tilt = {tiltDeg.toFixed(1)}° toward light cone
          </div>
          <div className="opacity-80">x′ tilts symmetrically</div>
        </div>
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">SCISSOR · 45° limit</div>
          <div className="mt-1 opacity-80">
            β = {beta.toFixed(2)} · γ = {g.toFixed(3)}
          </div>
          <div className="opacity-80">as β→1 axes close on light line</div>
        </div>
      </div>
    </div>
  );
}
