"use client";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { ModelPicker } from "./model-picker";

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  modelId: string;
  onModelChange: (id: string) => void;
  disabled?: boolean;
}

export function Composer({
  value, onChange, onSubmit, modelId, onModelChange, disabled = false,
}: ComposerProps) {
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage({ file: f, url: URL.createObjectURL(f) });
    e.target.value = "";
  };

  const removeImage = () => {
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage(null);
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="bg-[var(--color-fg-4)]/15 border border-[var(--color-fg-4)] flex flex-col">
      {image && (
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--color-fg-4)]">
          <div className="relative">
            <img
              src={image.url}
              alt={image.file.name}
              className="h-12 w-12 object-cover border border-[var(--color-fg-4)]"
            />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 bg-[var(--color-bg-0)] border border-[var(--color-fg-3)] text-[var(--color-fg-1)] hover:text-[var(--color-magenta)] hover:border-[var(--color-magenta)] transition-colors"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-[var(--color-fg-1)] truncate">
              {image.file.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] mt-0.5">
              Preview only · backend wiring pending
            </div>
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        placeholder={disabled ? "Waiting for response…" : "Ask a physics question…"}
        rows={2}
        maxLength={4000}
        readOnly={disabled}
        autoFocus
        className="w-full bg-transparent border-0 px-4 py-3 text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] focus:outline-none resize-y min-h-[60px] max-h-[240px]"
      />

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[var(--color-fg-4)]">
        <div className="flex items-center gap-2">
          <ModelPicker value={modelId} onChange={onModelChange} disabled={disabled} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach image (preview only)"
            aria-label="Attach image"
            className="inline-flex items-center justify-center w-8 h-8 border border-[var(--color-fg-4)] text-[var(--color-fg-1)] hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ImagePlus size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-block font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            Enter to send · Shift+Enter newline
          </span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSend}
            className="inline-flex items-center gap-2 border border-[var(--color-cyan-dim)] px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {disabled ? "Sending…" : "Send →"}
          </button>
        </div>
      </div>
    </div>
  );
}
