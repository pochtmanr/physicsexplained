"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function SearchTrigger() {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  const open = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }),
    );
  };

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search (Cmd+K)"
      className="flex items-center gap-2 border border-[var(--color-fg-3)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] md:px-3"
    >
      <Search aria-hidden="true" size={14} strokeWidth={1.5} />
      <span className="hidden md:inline">SEARCH</span>
      <kbd className="hidden rounded border border-[var(--color-fg-3)] px-1 py-0.5 text-[10px] leading-none md:inline">
        {isMac ? "⌘" : "Ctrl+"}K
      </kbd>
    </button>
  );
}
