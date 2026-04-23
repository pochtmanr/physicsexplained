"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ask.railCollapsed";

export function RailShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Show chat list"
        title="Show chat list"
        className="hidden md:flex shrink-0 w-8 items-start justify-center border-r border-[var(--color-fg-4)] bg-[var(--color-bg-0)] pt-3 text-[var(--color-fg-3)] hover:text-[var(--color-cyan-dim)] hover:bg-[var(--color-fg-4)]/10 transition-colors"
      >
        <ChevronRightIcon />
      </button>
    );
  }

  return (
    <div className="hidden md:flex shrink-0 relative">
      {children}
      <button
        type="button"
        onClick={toggle}
        aria-label="Hide chat list"
        title="Hide chat list"
        className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-7 h-7 text-[var(--color-fg-3)] hover:text-[var(--color-cyan-dim)] hover:bg-[var(--color-fg-4)]/20 transition-colors"
      >
        <ChevronLeftIcon />
      </button>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
