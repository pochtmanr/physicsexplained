import clsx from "clsx";

export interface FigureLabelProps {
  section?: string;
  figure: string;
  className?: string;
}

export function FigureLabel({ section, figure, className }: FigureLabelProps) {
  return (
    <div
      className={clsx(
        "font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]",
        className,
      )}
    >
      {section ? `§ ${section} · ${figure}` : figure}
    </div>
  );
}
