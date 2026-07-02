"use client";
import { useRef, useState } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

type AttachKind = "image" | "pdf";
interface Attachment {
  file: File;
  kind: AttachKind;
  url: string | null; // object URL for images, null for PDFs
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,application/pdf";

function detectKind(f: File): AttachKind | null {
  if (f.type.startsWith("image/")) return "image";
  if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return null;
}

export function Composer({
  value, onChange, onSubmit, disabled = false,
}: ComposerProps) {
  const [attachment, setAttachment] = useState<Attachment | null>(null);
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
    const kind = detectKind(f);
    if (!kind) {
      e.target.value = "";
      return;
    }
    if (attachment?.url) URL.revokeObjectURL(attachment.url);
    setAttachment({
      file: f,
      kind,
      url: kind === "image" ? URL.createObjectURL(f) : null,
    });
    e.target.value = "";
  };

  const removeAttachment = () => {
    if (attachment?.url) URL.revokeObjectURL(attachment.url);
    setAttachment(null);
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="bg-[var(--color-fg-4)]/15 border border-[var(--color-fg-4)] flex flex-col">
      {attachment && (
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--color-fg-4)]">
          <div className="relative">
            {attachment.kind === "image" && attachment.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.url}
                alt={attachment.file.name}
                className="h-12 w-12 object-cover border border-[var(--color-fg-4)]"
              />
            ) : (
              <div className="h-12 w-12 flex items-center justify-center border border-[var(--color-fg-4)] bg-[var(--color-bg-1)]">
                <FileText size={20} strokeWidth={1.5} className="text-[var(--color-cyan-dim)]" aria-hidden="true" />
              </div>
            )}
            <Button
              variant="icon"
              size="icon"
              onClick={removeAttachment}
              aria-label="Remove attachment"
              className="absolute -top-1.5 -right-1.5 !h-4 !w-4"
            >
              <X size={10} strokeWidth={2.5} />
            </Button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-[var(--color-fg-1)] truncate">
              {attachment.file.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] mt-0.5">
              {attachment.kind === "pdf" ? "PDF · " : "Image · "}
              Preview only · backend wiring pending
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={disabled ? "Waiting for response…" : "Ask a physics question…"}
          rows={2}
          maxLength={4000}
          readOnly={disabled}
          autoFocus
          className="w-full bg-transparent border-0 px-4 pt-3 pb-12 text-base md:text-sm text-[var(--color-fg-0)] placeholder:text-[var(--color-fg-3)] focus:outline-none resize-y min-h-[88px] max-h-[240px]"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach image or PDF"
          aria-label="Attach image or PDF"
          className="absolute bottom-2 start-2"
        >
          <Paperclip size={14} strokeWidth={1.75} aria-hidden="true" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onPickFile}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[var(--color-fg-4)]">
        <span className="hidden md:inline-block font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
          Enter to send · Shift+Enter newline
        </span>

        <div className="ms-auto flex shrink-0 items-center gap-3">
          <Button
            variant="primary"
            size="icon"
            onClick={onSubmit}
            disabled={!canSend}
            aria-label={disabled ? "Sending" : "Send"}
            title={disabled ? "Sending…" : "Send"}
            className="!h-9 !w-9"
          >
            <span
              aria-hidden="true"
              className="inline-block text-base leading-none transition-transform duration-[180ms] ease-out group-hover:translate-x-0.5 group-disabled:translate-x-0 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            >
              →
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
