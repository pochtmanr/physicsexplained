"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";

interface Conv {
  id: string;
  title: string | null;
  updated_at: string;
  starred: boolean;
}

interface Props {
  conv: Conv;
  locale: string;
  active: boolean;
}

export function ConversationRow({ conv, locale, active }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(conv.title ?? "");
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (renaming) {
      setDraft(conv.title ?? "");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [renaming, conv.title]);

  const patch = async (body: { title?: string; starred?: boolean }) => {
    const res = await fetch(`/api/ask/conversations/${conv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("PATCH conversation failed", await res.text());
      return;
    }
    startTransition(() => router.refresh());
  };

  const remove = async () => {
    const res = await fetch(`/api/ask/conversations/${conv.id}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("DELETE conversation failed", await res.text());
      return;
    }
    setConfirmDelete(false);
    setMenuOpen(false);
    startTransition(() => {
      if (active) router.push(`/${locale}/ask`);
      else router.refresh();
    });
  };

  const submitRename = () => {
    const next = draft.trim();
    setRenaming(false);
    setMenuOpen(false);
    if (!next || next === conv.title) return;
    void patch({ title: next });
  };

  const toggleStar = () => {
    setMenuOpen(false);
    void patch({ starred: !conv.starred });
  };

  return (
    <div
      ref={containerRef}
      className={`group relative border-l-2 transition-colors ${
        active
          ? "border-[var(--color-cyan)] bg-[var(--color-fg-4)]/15"
          : "border-transparent hover:border-[var(--color-fg-4)] hover:bg-[var(--color-fg-4)]/10"
      }`}
    >
      {renaming ? (
        <div className="px-4 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            {formatRelative(conv.updated_at)}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); submitRename(); }
              else if (e.key === "Escape") { e.preventDefault(); setRenaming(false); }
            }}
            maxLength={120}
            className="mt-1 w-full bg-transparent text-sm text-[var(--color-fg-0)] border border-[var(--color-cyan-dim)] px-1.5 py-0.5 outline-none"
          />
        </div>
      ) : (
        <Link
          href={`/${locale}/ask/${conv.id}`}
          className="block px-4 py-2.5 pr-9"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            {formatRelative(conv.updated_at)}
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-sm truncate ${active ? "text-[var(--color-fg-0)]" : "text-[var(--color-fg-1)]"}`}>
            {conv.starred && (
              <Star size={11} strokeWidth={1.5} className="shrink-0 fill-[var(--color-cyan)] text-[var(--color-cyan)]" />
            )}
            <span className="truncate">{conv.title ?? "Untitled"}</span>
          </div>
        </Link>
      )}

      {!renaming && (
        <button
          type="button"
          aria-label="Conversation actions"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
          className={`absolute right-2 top-2 p-1 rounded-sm text-[var(--color-fg-3)] hover:text-[var(--color-fg-0)] hover:bg-[var(--color-fg-4)]/30 transition-opacity ${
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
        >
          <MoreHorizontal size={14} strokeWidth={1.5} />
        </button>
      )}

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-2 top-8 z-20 w-40 border border-[var(--color-fg-4)] bg-[var(--color-bg-0)] shadow-lg py-1 font-mono text-xs uppercase tracking-wider"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setMenuOpen(false); setRenaming(true); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-start text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/20"
          >
            <Pencil size={12} strokeWidth={1.5} /> Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={toggleStar}
            className="flex items-center gap-2 w-full px-3 py-2 text-start text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/20"
          >
            <Star
              size={12}
              strokeWidth={1.5}
              className={conv.starred ? "fill-[var(--color-cyan)] text-[var(--color-cyan)]" : ""}
            />
            {conv.starred ? "Unstar" : "Star"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-start text-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/10"
          >
            <Trash2 size={12} strokeWidth={1.5} /> Delete
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-[var(--color-bg-0)]/70 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-5">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">Delete chat</div>
            <p className="mt-3 text-sm text-[var(--color-fg-1)]">
              Permanently delete “{conv.title ?? "Untitled"}”? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="border border-[var(--color-fg-4)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                className="bg-[var(--color-magenta)] text-[var(--color-bg-0)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
