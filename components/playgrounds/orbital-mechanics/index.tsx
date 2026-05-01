"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePlaygroundState } from "@/app/[locale]/play/_components/use-playground-state";
import { encodeState } from "@/app/[locale]/play/_components/encode-state";
import { orbitalSchema, type OrbitalState, type PlaceMass } from "./schema";
import { getPreset, type PresetId } from "./presets";
import { NBodyCanvas } from "./n-body-canvas";
import { Controls } from "./controls";
import { InfoPanel } from "./info-panel";
import type { Body } from "@/lib/physics/n-body";

const INFO_OPEN_KEY = "play.orbital-mechanics.infoOpen";

function bodiesFor(state: OrbitalState): Body[] {
  if (state.preset !== "custom" && state.bodies.length === 0) {
    return getPreset(state.preset as PresetId);
  }
  return state.bodies;
}

export function OrbitalMechanicsPlayground() {
  const [state, setState, resetUrlState] = usePlaygroundState(orbitalSchema, "blob");
  const [isPlaying, setIsPlaying] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const t = useTranslations("play.controls");

  // Info panel: open by default the first time the user lands here, persist after.
  const [infoOpen, setInfoOpen] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(INFO_OPEN_KEY);
    if (stored !== null) setInfoOpen(stored === "1");
  }, []);
  function changeInfoOpen(next: boolean) {
    setInfoOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INFO_OPEN_KEY, next ? "1" : "0");
    }
  }

  const bodies = useMemo(() => bodiesFor(state), [state]);

  function setBodies(next: Body[]) {
    // setBodies is the SINGLE source of truth for user-driven body changes.
    // It atomically promotes any preset to "custom" so we never get a second
    // setState (e.g. an "onUserEdit") racing with this one and snapping the
    // bodies back to the preset's initial frame.
    setState({ ...state, bodies: next, preset: "custom" });
  }

  return (
    <div className="absolute inset-0">
      <NBodyCanvas
        bodies={bodies}
        onBodiesChange={setBodies}
        trails={state.trails}
        speed={state.speed}
        isPlaying={isPlaying}
        placeMass={state.placeMass}
        resetKey={resetKey}
      />
      <InfoPanel
        open={infoOpen}
        activePreset={state.preset}
        onOpenChange={changeInfoOpen}
      />
      {/* Floating discoverability hint */}
      <div className="pointer-events-none absolute top-16 right-3 z-30 hidden max-w-[16rem] flex-col gap-1 border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-2)] backdrop-blur-md md:flex">
        <span>› {t("placeHint")}</span>
        <span>› {t("removeHint")}</span>
      </div>
      <Controls
        state={state}
        isPlaying={isPlaying}
        bodyCount={bodies.length}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onChangeSpeed={(s) => setState({ ...state, speed: s })}
        onChangeTrails={(b) => setState({ ...state, trails: b })}
        onChangePreset={(p) => {
          setState({ ...state, preset: p, bodies: [] });
          setResetKey((k) => k + 1);
        }}
        onChangePlaceMass={(m: PlaceMass) => setState({ ...state, placeMass: m })}
        onReset={() => {
          // Full reset: wipe URL state (back to default figure-8 preset, default
          // mass / speed / trails) and force the canvas to drop trails, frozen
          // state, drag state, and recenter the camera.
          setIsPlaying(true);
          resetUrlState();
          setResetKey((k) => k + 1);
        }}
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
