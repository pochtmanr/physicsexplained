"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const SHOW_DELAY_MS = 120;
const SAFETY_TIMEOUT_MS = 15_000;

/**
 * Global navigation progress pill. Renders a small spinning logo + label in the
 * bottom-right corner while a client navigation is in flight. Click-capture
 * detects same-origin anchor navigations; pathname change clears the state.
 * Query-only changes on the same pathname are ignored (and fall through to the
 * safety timeout) to avoid pulling useSearchParams into the layout — that would
 * opt the whole locale subtree out of static rendering.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef(false);
  const showTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    clearTimers();
    pendingRef.current = false;
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      const rel = anchor.getAttribute("rel") ?? "";
      if (rel.includes("external")) return;
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const samePath =
        url.pathname === window.location.pathname &&
        url.search === window.location.search;
      if (samePath) return;

      pendingRef.current = true;
      clearTimers();
      showTimerRef.current = window.setTimeout(() => {
        if (pendingRef.current) setVisible(true);
      }, SHOW_DELAY_MS);
      safetyTimerRef.current = window.setTimeout(() => {
        pendingRef.current = false;
        setVisible(false);
      }, SAFETY_TIMEOUT_MS);
    };

    const onPopState = () => {
      clearTimers();
      pendingRef.current = false;
      setVisible(false);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, []);

  function clearTimers() {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/95 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-2)] shadow-[0_8px_24px_-12px_var(--color-glow)] backdrop-blur rtl:right-auto rtl:left-4"
    >
      <Logo className="h-3.5 w-3.5 motion-safe:animate-[page-loader-spin_1.2s_linear_infinite]" />
      <span>Loading…</span>
    </div>
  );
}
