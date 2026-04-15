import clsx from "clsx";
import type { ReactNode } from "react";

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
        <figcaption className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {caption}
        </figcaption>
      )}
      <div className="relative overflow-hidden rounded-md border border-[var(--color-fg-3)] bg-[var(--color-bg-1)]">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <div className="mx-auto">{children}</div>
        </div>
        {hud && (
          <div className="pointer-events-none absolute bottom-3 right-3">
            {hud}
          </div>
        )}
      </div>
    </figure>
  );
}
