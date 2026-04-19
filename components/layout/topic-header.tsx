import clsx from "clsx";
import type { ReactNode } from "react";

export interface TopicHeaderProps {
  /** Section number label, e.g. "§ 01 · CLASSICAL MECHANICS" */
  eyebrow: ReactNode;
  /** Big title, e.g. "THE PENDULUM" */
  title: string;
  /** Optional italic/plain subtitle below the title */
  subtitle?: string;
  className?: string;
}

export function TopicHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: TopicHeaderProps) {
  return (
    <header className={clsx("mt-16 mb-12", className)}>
      <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
        {eyebrow}
      </div>
      <h1 className="mb-6 text-4xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] break-words md:text-6xl">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xl italic text-[var(--color-fg-1)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
