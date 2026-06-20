"use client";
import clsx from "clsx";
import { useRef, useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import frame from "@/components/layout/corner-frame.module.css";
import { FigurePopup } from "@/components/layout/figure-popup";

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

export function SceneCard({
  caption,
  children,
  hud,
  className,
  expandable = true,
}: SceneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);

  // Scenes use fixed DOM ids, so the same instance can't render in two places
  // at once — while expanded, the children live in the popup, not inline.
  const close = () => {
    setExpanded(false);
    expandRef.current?.focus();
  };

  return (
    <figure className={clsx("my-16 mx-auto", className)}>
      {caption && (
        <figcaption className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
          {caption}
        </figcaption>
      )}
      <div className={`${frame.frame} bg-[var(--color-bg-1)]`}>
        <span className={`${frame.corner} ${frame.tl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.tr}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.bl}`} aria-hidden="true" />
        <span className={`${frame.corner} ${frame.br}`} aria-hidden="true" />
        {expandable && (
          <button
            ref={expandRef}
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand figure"
            className="absolute right-2 top-2 z-10 text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-0)]"
          >
            <Maximize2 size={16} strokeWidth={1.5} />
          </button>
        )}
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <div className="mx-auto">{expanded ? null : children}</div>
        </div>
        {hud && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10">
            {hud}
          </div>
        )}
      </div>
      {expanded && (
        <FigurePopup caption={caption} onClose={close}>
          {children}
        </FigurePopup>
      )}
    </figure>
  );
}
