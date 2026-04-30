"use client";
import { useState, useMemo } from "react";
import { usePlaygroundState } from "@/app/[locale]/play/_components/use-playground-state";
import { encodeState } from "@/app/[locale]/play/_components/encode-state";
import { orbitalSchema, type OrbitalState } from "./schema";
import { getPreset, type PresetId } from "./presets";
import { NBodyCanvas } from "./n-body-canvas";
import { Controls } from "./controls";
import type { Body } from "@/lib/physics/n-body";

function bodiesFor(state: OrbitalState): Body[] {
  if (state.preset !== "custom" && state.bodies.length === 0) {
    return getPreset(state.preset as PresetId);
  }
  return state.bodies;
}

export function OrbitalMechanicsPlayground() {
  const [state, setState, reset] = usePlaygroundState(orbitalSchema, "blob");
  const [isPlaying, setIsPlaying] = useState(true);

  const bodies = useMemo(() => bodiesFor(state), [state]);

  function setBodies(next: Body[]) {
    setState({ ...state, bodies: next, preset: "custom" });
  }

  function onUserEdit() {
    if (state.preset !== "custom") {
      setState({ ...state, preset: "custom", bodies });
    }
  }

  function addBody() {
    // Place near origin with a small jitter so successive adds don't stack
    // exactly on top of each other (Plummer softening would still handle it,
    // but visual separation is friendlier).
    const i = bodies.length;
    const jitter = 0.4 * (i + 1);
    const angle = (i * 137.5 * Math.PI) / 180; // golden-angle spread
    const next: Body[] = [
      ...bodies,
      {
        id: `u${Date.now().toString(36)}${i}`,
        mass: 1,
        x: Math.cos(angle) * jitter,
        y: Math.sin(angle) * jitter,
        vx: 0,
        vy: 0,
      },
    ];
    const trimmed = next.length > 8 ? next.slice(next.length - 8) : next;
    setBodies(trimmed);
  }

  return (
    <div className="absolute inset-0">
      <NBodyCanvas
        bodies={bodies}
        onBodiesChange={setBodies}
        trails={state.trails}
        speed={state.speed}
        isPlaying={isPlaying}
        onUserEdit={onUserEdit}
      />
      <Controls
        state={state}
        isPlaying={isPlaying}
        bodyCount={bodies.length}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onChangeSpeed={(s) => setState({ ...state, speed: s })}
        onChangeTrails={(b) => setState({ ...state, trails: b })}
        onChangePreset={(p) => setState({ ...state, preset: p, bodies: [] })}
        onReset={() => {
          setIsPlaying(true);
          reset();
        }}
        onAddBody={addBody}
      />
    </div>
  );
}

/**
 * Helper used by the page to pre-encode current URL state for the share buttons.
 */
export function encodeCurrentState(state: OrbitalState): URLSearchParams {
  return encodeState(state, orbitalSchema, "blob");
}
