"use client";
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "@/lib/ask/types";

export function ModelPicker({
  value, onChange, disabled,
}: { value: string; onChange: (id: string) => void; disabled?: boolean }) {
  return (
    <select
      value={value ?? DEFAULT_MODEL_ID}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer disabled:opacity-60 font-mono uppercase tracking-wider rounded-[var(--radius-control)] border border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[color-mix(in_srgb,var(--color-cyan)_7%,transparent)] shadow-[var(--shadow-control)] h-6 px-3 text-xs md:h-8 transition-[box-shadow,border-color,color] duration-[var(--duration-fast)] ease-out hover:bg-[color-mix(in_srgb,var(--color-cyan)_14%,transparent)] hover:shadow-[var(--shadow-control-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50"
      title="Answerer model"
    >
      {AVAILABLE_MODELS.map((m) => (
        <option key={m.id} value={m.id} className="bg-[var(--color-bg-0)] text-[var(--color-fg-0)] normal-case font-sans">
          {m.label}
        </option>
      ))}
    </select>
  );
}
