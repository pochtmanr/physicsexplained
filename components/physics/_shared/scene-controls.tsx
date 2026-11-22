"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, Repeat, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScenePlayback } from "./use-scene-playback";

export interface SceneControlsProps {
  playback: ScenePlayback;
  /** Show a time scrubber (needs a finite `duration`). Default false. */
  scrub?: boolean;
  /** Short note after the time, e.g. "½× speed". */
  note?: ReactNode;
  /** Extra scene-specific buttons, placed after the standard ones. */
  children?: ReactNode;
}

/**
 * The standard transport bar for an animated scene: Play/Pause, Replay, loop
 * toggle and elapsed time, with an optional scrubber. Every animated scene
 * uses this bar so the controls look and behave the same across the site.
 */
export function SceneControls({ playback, scrub = false, note, children }: SceneControlsProps) {
  const t = useTranslations("scenes.controls");
  const scrubId = useId();
  const { status, time, duration, loop } = playback;
  const playing = status === "playing";
  const canScrub = scrub && duration !== undefined && duration > 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 px-2">
      <Button
        size="icon-lg"
        variant="icon"
        onClick={playback.toggle}
        aria-label={playing ? t("pause") : t("play")}
        title={playing ? t("pause") : t("play")}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      </Button>
      <Button
        size="icon-lg"
        variant="icon"
        onClick={playback.replay}
        aria-label={t("replay")}
        title={t("replay")}
      >
        <RotateCcw size={16} aria-hidden="true" />
      </Button>
      <Button
        size="icon-lg"
        active={loop}
        onClick={() => playback.setLoop(!loop)}
        aria-label={t("loop")}
        title={t("loop")}
      >
        <Repeat size={16} aria-hidden="true" />
      </Button>
      {children}
      {canScrub && (
        <input
          id={scrubId}
          type="range"
          min={0}
          max={duration}
          step={duration / 200}
          value={Math.min(time, duration)}
          onChange={(e) => playback.seek(parseFloat(e.target.value))}
          aria-label={t("scrub")}
          aria-valuetext={`${time.toFixed(1)} s`}
          className="h-6 min-w-24 flex-1 accent-[var(--color-cyan)]"
        />
      )}
      <span className="ms-auto flex items-baseline gap-2 font-mono text-xs text-[var(--color-fg-3)]">
        <span dir="ltr" className="tabular-nums">
          t = {time.toFixed(2)} s
        </span>
        {note ? <span dir="auto">{note}</span> : null}
      </span>
    </div>
  );
}
