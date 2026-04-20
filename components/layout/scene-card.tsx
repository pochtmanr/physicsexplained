import clsx from "clsx";
import type { ReactNode } from "react";
import frame from "@/components/layout/corner-frame.module.css";

export interface SceneCardProps {
  /** "FIG.01 — the pendulum" style caption */
  caption?: string;
  /** Scene content (usually a canvas or JSXGraph container) */
  children: ReactNode;
  /** Optional HUD slot rendered in the bottom-right corner */
  hud?: ReactNode;
  /** Additional className on the card wrapper */
  className?: string;
}

export function SceneCard({ caption, children, hud, className }: SceneCardProps) {
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
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <div className="mx-auto">{children}</div>
        </div>
        {hud && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10">
            {hud}
          </div>
        )}
      </div>
    </figure>
  );
}
