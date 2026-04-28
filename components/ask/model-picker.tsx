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
      className="w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap border border-[var(--color-cyan-dim)] bg-transparent px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--color-cyan-dim)] hover:bg-[var(--color-cyan-dim)]/10 focus:outline-none disabled:opacity-60 transition-colors cursor-pointer"
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
