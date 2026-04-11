import clsx from "clsx";
import type { ReactNode } from "react";

export interface SectionProps {
  /** Numeric section index, e.g. 1, 2, 3 */
  index: number;
  /** Section heading */
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ index, title, children, className }: SectionProps) {
  const indexStr = String(index).padStart(2, "0");
  return (
    <section className={clsx("mb-24", className)}>
      <div className="mb-4 flex items-baseline gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
          § {indexStr}
        </span>
        <h2 className="text-3xl font-semibold text-[var(--color-fg-0)]">
          {title}
        </h2>
      </div>
      <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
        {children}
      </div>
    </section>
  );
}
