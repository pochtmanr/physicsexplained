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
      className="border border-[var(--color-fg-4)] rounded px-2 py-1 text-xs bg-[var(--color-bg-0)] text-[var(--color-fg-1)] disabled:opacity-60"
      title="Answerer model"
    >
      {AVAILABLE_MODELS.map((m) => (
        <option key={m.id} value={m.id}>{m.label}</option>
      ))}
    </select>
  );
}
