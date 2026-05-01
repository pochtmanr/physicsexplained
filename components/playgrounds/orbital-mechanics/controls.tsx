"use client";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrbitalState } from "./schema";
import type { PlaceMass } from "./schema";
import { PRESET_IDS, type PresetId } from "./presets";

interface Props {
  state: OrbitalState;
  isPlaying: boolean;
  bodyCount: number;
  onTogglePlay: () => void;
  onChangeSpeed: (s: 0.25 | 1 | 4) => void;
  onChangeTrails: (b: boolean) => void;
  onChangePreset: (p: PresetId) => void;
  onChangePlaceMass: (m: PlaceMass) => void;
  onReset: () => void;
}

const MASS_OPTIONS: ReadonlyArray<{ value: PlaceMass; label: string }> = [
  { value: 0.5, label: "S" },
  { value: 1, label: "M" },
  { value: 5, label: "L" },
  { value: 20, label: "XL" },
];

export function Controls({
  state,
  isPlaying,
  bodyCount,
  onTogglePlay,
  onChangeSpeed,
  onChangeTrails,
  onChangePreset,
  onChangePlaceMass,
  onReset,
}: Props) {
  const t = useTranslations("play.controls");
  const tPresets = useTranslations("play.orbital-mechanics.presets");

  return (
    <div className="absolute bottom-4 left-1/2 z-40 flex max-w-[96vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2 border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/85 px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] backdrop-blur-md">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? t("pause") : t("play")}
        className="inline-flex h-8 w-8 items-center justify-center hover:bg-[var(--color-fg-4)]/30"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label={t("reset")}
        className="inline-flex h-8 w-8 items-center justify-center hover:bg-[var(--color-fg-4)]/30"
      >
        <RotateCcw size={14} />
      </button>

      <div className="flex items-center gap-1 border-l border-[var(--color-fg-4)]/40 pl-2">
        <span className="opacity-60">{t("mass")}</span>
        {MASS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChangePlaceMass(opt.value)}
            aria-pressed={state.placeMass === opt.value}
            className={`px-1.5 py-0.5 ${
              state.placeMass === opt.value
                ? "bg-[var(--color-cyan)]/30 text-[var(--color-fg-0)]"
                : "hover:bg-[var(--color-fg-4)]/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-l border-[var(--color-fg-4)]/40 pl-2">
        <span className="opacity-60">{t("speed")}</span>
        {([0.25, 1, 4] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeSpeed(s)}
            className={`px-1.5 py-0.5 ${
              state.speed === s
                ? "bg-[var(--color-cyan)]/30 text-[var(--color-fg-0)]"
                : "hover:bg-[var(--color-fg-4)]/30"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      <label className="flex items-center gap-1 border-l border-[var(--color-fg-4)]/40 pl-2">
        <input
          type="checkbox"
          checked={state.trails}
          onChange={(e) => onChangeTrails(e.target.checked)}
          className="accent-[var(--color-cyan)]"
        />
        <span>{t("trails")}</span>
      </label>

      <select
        value={state.preset}
        onChange={(e) => onChangePreset(e.target.value as PresetId)}
        className="border-l border-[var(--color-fg-4)]/40 bg-transparent pl-2 pr-1 text-[var(--color-fg-0)] outline-none"
        aria-label={t("preset")}
      >
        {PRESET_IDS.map((p: PresetId) => (
          <option key={p} value={p}>
            {tPresets(p)}
          </option>
        ))}
        <option value="custom" disabled={state.preset !== "custom"}>
          custom
        </option>
      </select>

      <span className="border-l border-[var(--color-fg-4)]/40 pl-2 opacity-60">
        {t("bodies")}: {bodyCount}
      </span>
    </div>
  );
}
