import clsx from "clsx";

export interface TopicHeaderProps {
  /** Section number label, e.g. "§ 01 · CLASSICAL MECHANICS" */
  eyebrow: string;
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
    <header className={clsx("mt-16 mb-24", className)}>
      <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
        {eyebrow}
      </div>
      <h1 className="mb-6 text-4xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] break-words md:text-6xl">
        {title}
      </h1>
      {subtitle && (
        <p className="max-w-[36ch] text-xl italic text-[var(--color-fg-1)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
