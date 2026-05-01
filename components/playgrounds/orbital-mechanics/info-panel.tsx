"use client";
import { Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PresetId } from "./presets";
import { PRESET_IDS } from "./presets";

interface Props {
  open: boolean;
  activePreset: PresetId | "custom";
  onOpenChange: (open: boolean) => void;
}

export function InfoPanel({ open, activePreset, onOpenChange }: Props) {
  const t = useTranslations("play.orbital-mechanics.info");
  const tPresets = useTranslations("play.orbital-mechanics.presets");
  const tPresetsInfo = useTranslations("play.orbital-mechanics.presetsInfo");
  const tControls = useTranslations("play.controls");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label={tControls("info")}
        className="absolute top-16 left-3 z-40 inline-flex h-8 items-center gap-1.5 border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/80 px-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] backdrop-blur-md hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
      >
        <Info size={14} />
        <span>{tControls("info")}</span>
      </button>
    );
  }

  const interactions = t.raw("interactions") as string[];

  return (
    <aside className="absolute top-16 bottom-20 left-3 z-40 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/85 backdrop-blur-md">
      <header className="flex items-center justify-between border-b border-[var(--color-fg-4)]/40 px-3 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
          {t("title")}
        </span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label={tControls("closeInfo")}
          className="inline-flex h-7 w-7 items-center justify-center text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
        >
          <X size={14} />
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3 text-sm leading-relaxed text-[var(--color-fg-1)]">
        <p>{t("intro")}</p>
        <p>{t("chaos")}</p>

        <div>
          <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-2)]">
            {t("interactionsTitle")}
          </h3>
          <ul className="space-y-1 text-xs">
            {interactions.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--color-cyan-dim)]">›</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-2)]">
            {t("scenariosTitle")}
          </h3>
          <ul className="space-y-2.5 text-xs">
            {PRESET_IDS.map((id) => (
              <li
                key={id}
                className={
                  activePreset === id
                    ? "border-l-2 border-[var(--color-cyan)] bg-[var(--color-cyan)]/5 pl-2"
                    : "pl-2 opacity-80"
                }
              >
                <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-0)]">
                  {tPresets(id)}
                </div>
                <div className="mt-0.5 text-[var(--color-fg-1)]">
                  {tPresetsInfo(id)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
