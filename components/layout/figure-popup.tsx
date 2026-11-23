"use client";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { BookOpenText, X } from "lucide-react";
import frame from "@/components/layout/corner-frame.module.css";
import { figureTextScale } from "@/components/physics/_shared/scene-tokens";

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
  /**
   * Explanation shown with the figure: beside it when the window is wide (or
   * a phone is held sideways), under it otherwise. The reader can hide it.
   */
  guide?: ReactNode;
  /**
   * "open" when the reader asked for the guide itself. "auto" (default)
   * opens it only on a wide window, and remembers the reader's last choice
   * there; on smaller screens it starts closed, so the figure gets the
   * whole screen first.
   */
  initialGuide?: "auto" | "open";
  /**
   * Size multiplier for the figure (see `figureScale`); the popup's own text
   * and the guide follow the damped `figureTextScale`. Default 1.
   */
  scale?: number;
}

/**
 * Where the guide sits beside the figure instead of under it. Must match the
 * media query on `.figure-popup-body` in globals.css.
 */
export const GUIDE_BESIDE_QUERY =
  "(min-width: 1024px), (min-width: 900px) and (max-height: 760px), (orientation: landscape) and (min-width: 560px) and (max-height: 560px)";

/**
 * Where there is room to open the guide without being asked. In the short
 * side-by-side layouts (a phone held sideways) the figure needs the space
 * first, so the guide waits for the reader there, as it does when stacked.
 */
const GUIDE_ROOMY_QUERY = "(min-width: 1024px)";

const GUIDE_PREFERENCE_KEY = "figure-guide";

function guideHasRoom(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(GUIDE_ROOMY_QUERY).matches;
}

function readGuidePreference(): boolean {
  try {
    return window.localStorage.getItem(GUIDE_PREFERENCE_KEY) !== "closed";
  } catch {
    // Storage can be blocked (private mode, embedded views): default to open.
    return true;
  }
}

function writeGuidePreference(open: boolean) {
  try {
    window.localStorage.setItem(GUIDE_PREFERENCE_KEY, open ? "open" : "closed");
  } catch {
    // Not being able to remember the choice is harmless.
  }
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
  guide,
  initialGuide = "auto",
  scale = 1,
}: FigurePopupProps) {
  const t = useTranslations("scenes.card");
  const tGuide = useTranslations("scenes.guide");
  const guideId = useId();
  const [mounted, setMounted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // Beside the figure (its own column) or stacked (more cards under the
  // figure's, in the same scroll).
  const [guideBeside, setGuideBeside] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!guide) return;
    setGuideOpen(initialGuide === "open" || (guideHasRoom() && readGuidePreference()));
    // Decided once, when the popup opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(GUIDE_BESIDE_QUERY);
    const update = () => setGuideBeside(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  const toggleGuide = () => {
    const next = !guideOpen;
    setGuideOpen(next);
    // The preference is about the roomy layout only: closing the sheet on
    // a phone must not hide the panel on a desktop later.
    if (guideHasRoom()) writeGuidePreference(next);
  };

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

  // Rendered only while open, so Tab never lands on hidden links. The figure
  // re-fits by itself: it watches its own width, and the scroll area reports
  // its height.
  const guidePanel =
    guide && guideOpen ? (
      <aside
        id={guideId}
        aria-label={tGuide("title")}
        // Focusable so the keyboard can scroll it.
        tabIndex={0}
        data-flow={guideBeside ? "beside" : "stacked"}
        className="figure-popup-guide outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-cyan)]/50"
      >
        {guide}
      </aside>
    ) : null;

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
        // The width cap keeps figure and guide together on very wide screens.
        // Read by `.figure-popup-panel` in globals.css to size all text inside.
        style={
          {
            "--figure-scale": scale,
            "--figure-text-scale": figureTextScale(scale),
          } as CSSProperties
        }
        className={`figure-popup-panel popup-panel-enter relative flex h-dvh w-screen flex-col lg:h-[92dvh] lg:w-[96vw] lg:max-w-[1960px] ${frame.frame} bg-[var(--color-bg-1)] shadow-2xl`}
      >
        <span className={`${frame.corner} ${frame.tl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.tr}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.bl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.br}`} aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-fg-4)] px-4 py-3">
          {/* One line: a long caption must not take height from the figure. */}
          <span
            title={caption}
            className="min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]"
          >
            {caption}
          </span>
          {guide ? (
            <button
              type="button"
              onClick={toggleGuide}
              aria-expanded={guideOpen}
              aria-controls={guideOpen ? guideId : undefined}
              aria-label={tGuide("title")}
              title={guideOpen ? tGuide("hide") : tGuide("show")}
              // Pressed: accent border and tint, text in the text colour
              // (the accent alone is too faint for small text on white).
              className={`-my-1.5 inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-2 py-1.5 font-mono text-[length:var(--figure-fs-11,11px)] uppercase tracking-wider outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50 motion-reduce:transition-none ${
                guideOpen
                  ? "border-[var(--color-cyan)] bg-[color-mix(in_srgb,var(--color-cyan)_14%,transparent)] text-[var(--color-fg-0)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-1)] hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-fg-0)]"
              }`}
            >
              <BookOpenText size={14} strokeWidth={1.6} aria-hidden="true" />
              {/* The word gives way to the caption on narrow phones. */}
              <span className="hidden min-[480px]:inline">{tGuide("title")}</span>
            </button>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            title={t("close")}
            className="-m-2 shrink-0 rounded-[var(--radius-control)] p-2 text-[var(--color-fg-2)] outline-none transition-colors hover:text-[var(--color-fg-0)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-cyan)]/50"
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="figure-popup-body">
          <div
            ref={areaRef}
            // Same inset as the guide column, so the cards on both sides line up.
            className="min-h-0 min-w-0 flex-1 overflow-auto p-3 [scrollbar-width:thin]"
          >
            {/* `min-h-full` + the host's `m-auto`: a figure that fits is centred,
                one that does not scrolls from its top instead of being cut off. */}
            <div ref={slotRef} className="flex min-h-full w-full" />
            {/* Stacked: the guide's cards follow the figure's in one scroll,
                so the figure keeps the whole screen until the reader scrolls. */}
            {guideBeside ? null : guidePanel}
          </div>
          {guideBeside ? guidePanel : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
