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
    <section className={clsx("mb-12", className)}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
          §&#8239;{indexStr}
        </span>
        <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
        {children}
      </div>
    </section>
  );
}
