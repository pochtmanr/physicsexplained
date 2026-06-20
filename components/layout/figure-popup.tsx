"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import frame from "@/components/layout/corner-frame.module.css";

export interface FigurePopupProps {
  /** "FIG.01 — the pendulum" style caption, shown in the popup header */
  caption?: string;
  /** The figure content (a scene or image) — moved here while expanded */
  children: ReactNode;
  /** Close the popup */
  onClose: () => void;
}

/**
 * Fullscreen-ish (~80vw) overlay that hosts a single figure while it is
 * expanded. Rendered through a portal to <body> so it escapes the article
 * column's overflow/stacking context. The figure's scene is *moved* here (not
 * cloned) — scenes use fixed DOM ids, so two live copies would collide.
 */
export function FigurePopup({ caption, children, onClose }: FigurePopupProps) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock background scroll while open (with scrollbar-width compensation).
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  // Move focus to the close button on open.
  useEffect(() => {
    if (mounted) closeRef.current?.focus();
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-safe:animate-[fadeIn_0.15s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? "Figure"}
    >
      <div
        className="absolute inset-0 bg-[var(--color-bg-0)]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative flex max-h-[85vh] w-[80vw] max-w-[80vw] flex-col ${frame.frame} bg-[var(--color-bg-1)] shadow-2xl`}
      >
        <span className={`${frame.corner} ${frame.tl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.tr}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.bl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.br}`} aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-fg-4)] px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
            {caption}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-0)]"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4 [scrollbar-width:thin]">
          <div className="mx-auto flex w-full justify-center">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
