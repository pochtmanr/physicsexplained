"use client";
import { useState, useTransition } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  expected: string;
  action: (confirm: string) => Promise<{ ok: boolean; error?: string } | void>;
}

export function DeleteConfirm({ open, onClose, title, description, expected, action }: Props) {
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) return null;
  const matches = input.trim().toLowerCase() === expected.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-0)]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-[var(--color-magenta)] bg-[var(--color-bg-1)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">{title}</div>
        <p className="mt-3 text-sm text-[var(--color-fg-1)]">{description}</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
          Type <span className="text-[var(--color-fg-0)]">{expected}</span> to confirm
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mt-2 w-full bg-[var(--color-bg-0)] border border-[var(--color-fg-4)] px-3 py-2 text-sm text-[var(--color-fg-0)] focus:outline-none focus:border-[var(--color-magenta)]"
        />
        {err && <p className="mt-2 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--color-fg-4)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:bg-[var(--color-fg-4)]/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || pending}
            onClick={() => start(async () => {
              setErr(null);
              const res = (await action(input)) as { ok: boolean; error?: string } | undefined;
              if (res && res.ok === false) setErr(res.error ?? "Failed"); else onClose();
            })}
            className="bg-[var(--color-magenta)] text-[var(--color-bg-0)] px-4 py-2 font-mono text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          >
            {pending ? "Working…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
