import clsx from "clsx";
import type { ReactNode } from "react";
import frame from "@/components/layout/corner-frame.module.css";

export interface EquationBlockProps {
  /** Label shown on the left, e.g. "EQ.01" */
  id: string;
  /** KaTeX-rendered children (typically passed from MDX as `$$…$$` block) */
  children: ReactNode;
  className?: string;
}

/**
 * A display-mode equation block with a mono ID label, a cyan left rail,
 * and Start-here-style corner accents.
 */
export function EquationBlock({ id, children, className }: EquationBlockProps) {
  return (
    <div
      className={clsx(
        frame.frame,
        "my-8 border-l-2 border-l-[var(--color-cyan)] bg-[var(--color-bg-1)] px-3 py-4 sm:px-6 sm:py-5",
        className,
      )}
    >
      <span className={`${frame.corner} ${frame.tl}`} aria-hidden="true" />
      <span className={`${frame.corner} ${frame.tr}`} aria-hidden="true" />
      <span className={`${frame.corner} ${frame.bl}`} aria-hidden="true" />
      <span className={`${frame.corner} ${frame.br}`} aria-hidden="true" />
      <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
        {id}
      </div>
      <div className="overflow-x-auto text-[var(--color-fg-0)] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        {children}
      </div>
    </div>
  );
}
