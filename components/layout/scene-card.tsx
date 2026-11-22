"use client";
import clsx from "clsx";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { Maximize2 } from "lucide-react";
import frame from "@/components/layout/corner-frame.module.css";
import { FigurePopup } from "@/components/layout/figure-popup";
import {
  SceneViewContext,
  type SceneView,
} from "@/components/physics/_shared/scene-tokens";

export interface SceneCardProps {
  /** "FIG.01 — the pendulum" style caption */
  caption?: string;
  /** Scene content (usually a canvas or JSXGraph container) */
  children: ReactNode;
  /** Optional HUD slot rendered in the bottom-right corner */
  hud?: ReactNode;
  /** Additional className on the card wrapper */
  className?: string;
  /** Allow expanding the figure into a fullscreen popup (default: true) */
  expandable?: boolean;
}

// useLayoutEffect warns during server rendering; the effect is client-only.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Frame around a figure, with an expand-to-full-view button.
 *
 * The scene always stays at one place in the React tree, inside the host
 * `<div>` below. Opening the full view moves that DOM node into the popup;
 * closing moves it back. Nothing is unmounted, so slider values, playback
 * time and JSXGraph boards survive, and the scene mounts exactly once.
 * Scenes learn that they are expanded, and how much height they may use,
 * through `SceneViewContext` (read by `useSceneSize`).
 *
 * This relies on the popup being inside the React root's container, which
 * holds in this app (the App Router root is `document`, the popup is in
 * <body>): React delivers events by listening on the root container, so a
 * node moved outside it would stop responding.
 */
export function SceneCard({
  caption,
  children,
  hud,
  className,
  expandable = true,
}: SceneCardProps) {
  const t = useTranslations("scenes.card");
  const [expanded, setExpanded] = useState(false);
  const [popupSlot, setPopupSlot] = useState<HTMLDivElement | null>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);

  // While expanded, the host lives in the popup. The cleanup puts it back
  // home on close and on unmount — before React removes anything, so React
  // always finds the node where it rendered it.
  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    const home = homeRef.current;
    if (!expanded || !popupSlot || !host || !home) return;
    popupSlot.appendChild(host);
    return () => {
      home.appendChild(host);
    };
  }, [expanded, popupSlot]);

  const view = useMemo<SceneView>(
    () => ({ expanded, availableHeight: expanded ? availableHeight : null }),
    [expanded, availableHeight],
  );

  const close = () => {
    setExpanded(false);
    setAvailableHeight(null);
    expandRef.current?.focus();
  };

  return (
    <figure className={clsx("relative my-16 mx-auto", className)}>
      {/* The caption row also reserves room for the expand button, so the
          button never sits on top of the figure itself. */}
      {caption ? (
        <figcaption
          className={clsx(
            "mb-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]",
            expandable && "pe-8",
          )}
        >
          {caption}
        </figcaption>
      ) : (
        expandable && <div className="mb-3 h-4" aria-hidden="true" />
      )}
      {expandable && (
        <button
          ref={expandRef}
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={t("expand")}
          title={t("expand")}
          className="absolute end-0 top-0 -m-2 p-2 text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-0)]"
        >
          <Maximize2 size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
      <div className={`${frame.frame} bg-[var(--color-bg-1)]`}>
        <span className={`${frame.corner} ${frame.tl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.tr}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.bl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.br}`} aria-hidden="true" />
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <div ref={homeRef} className="mx-auto">
            {/* `m-auto` centres the host in the popup's flex slot; inline it
                is a plain full-width block. */}
            <div ref={hostRef} className="m-auto w-full max-w-7xl">
              <SceneViewContext.Provider value={view}>{children}</SceneViewContext.Provider>
            </div>
          </div>
        </div>
        {hud && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10">
            {hud}
          </div>
        )}
      </div>
      {expanded && (
        <FigurePopup
          caption={caption}
          onClose={close}
          slotRef={setPopupSlot}
          onAvailableHeight={setAvailableHeight}
        />
      )}
    </figure>
  );
}
