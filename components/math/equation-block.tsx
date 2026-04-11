import clsx from "clsx";
import type { ReactNode } from "react";

export interface EquationBlockProps {
  /** Label shown on the left, e.g. "EQ.01" */
  id: string;
  /** KaTeX-rendered children (typically passed from MDX as `$$…$$` block) */
  children: ReactNode;
  className?: string;
}

/**
 * A display-mode equation block with a mono ID label and a cyan left border.
 * Children should already contain rendered KaTeX (MDX block math).
 */
export function EquationBlock({ id, children, className }: EquationBlockProps) {
  return (
    <div
      className={clsx(
        "my-8 flex items-center gap-6 border-l-2 border-[var(--color-cyan)] bg-[var(--color-bg-1)] px-6 py-5",
        className,
      )}
    >
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
        {id}
      </div>
      <div className="flex-1 text-[var(--color-fg-0)]">{children}</div>
    </div>
  );
}
