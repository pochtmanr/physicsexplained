"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import frame from "@/components/layout/corner-frame.module.css";

export interface FigurePopupProps {
  /** "FIG.01 — the pendulum" style caption, shown in the popup header */
  caption?: string;
  /** Close the popup */
  onClose: () => void;
  /**
   * Receives the element the figure should be moved into (null on unmount).
   * `<SceneCard>` appends its scene host here.
   */
  slotRef: (el: HTMLDivElement | null) => void;
  /** Reports the height in px available to the figure, and again on resize. */
  onAvailableHeight?: (height: number) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-view overlay for a single figure: nearly the whole window on desktop,
 * the whole screen on phones and tablets. Rendered through a portal to <body> so it
 * escapes the article column's overflow/stacking context. The figure itself
 * is not rendered here — its live DOM is moved into the slot by `<SceneCard>`,
 * so the scene keeps its state.
 */
export function FigurePopup({
  caption,
  onClose,
  slotRef,
  onAvailableHeight,
}: FigurePopupProps) {
  const t = useTranslations("scenes.card");
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
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

  // Tell the figure how much height it has. Measured on the scroll area (a
  // fixed-size box), not on the slot, whose height follows its content.
  useEffect(() => {
    const area = areaRef.current;
    if (!mounted || !area || !onAvailableHeight) return;
    const report = () => {
      const style = getComputedStyle(area);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      onAvailableHeight(Math.max(0, area.clientHeight - padding));
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(area);
    return () => ro.disconnect();
  }, [mounted, onAvailableHeight]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center lg:p-4 motion-safe:animate-[fadeIn_0.15s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? t("figure")}
    >
      <div
        className="absolute inset-0 bg-[var(--color-bg-0)]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`relative flex h-dvh w-screen flex-col lg:h-[92dvh] lg:w-[96vw] ${frame.frame} bg-[var(--color-bg-1)] shadow-2xl`}
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
            aria-label={t("close")}
            title={t("close")}
            className="-m-2 shrink-0 p-2 text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-0)]"
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div
          ref={areaRef}
          className="min-h-0 flex-1 overflow-auto p-3 sm:p-4 [scrollbar-width:thin]"
        >
          {/* `min-h-full` + the host's `m-auto`: a figure that fits is centred,
              one that does not scrolls from its top instead of being cut off. */}
          <div ref={slotRef} className="flex min-h-full w-full" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
