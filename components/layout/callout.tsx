import clsx from "clsx";
import type { ReactNode } from "react";
import frame from "@/components/layout/corner-frame.module.css";

export type CalloutVariant = "intuition" | "math" | "warning";

export interface CalloutProps {
  variant: CalloutVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<
  CalloutVariant,
  { border: string; label: string; labelColor: string }
> = {
  intuition: {
    border: "border-l-[var(--color-amber)]",
    label: "INTUITION",
    labelColor: "text-[var(--color-amber)]",
  },
  math: {
    border: "border-l-[var(--color-cyan)]",
    label: "MATH",
    labelColor: "text-[var(--color-cyan)]",
  },
  warning: {
    border: "border-l-[var(--color-magenta)]",
    label: "CAUTION",
    labelColor: "text-[var(--color-magenta)]",
  },
};

export function Callout({ variant, children, className }: CalloutProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <aside
      className={clsx(
        frame.frame,
        "my-6 border-l-2 bg-[var(--color-bg-1)] px-6 py-5",
        style.border,
        className,
      )}
    >
      <span className={`${frame.corner} ${frame.tl}`} aria-hidden="true" />
      <span className={`${frame.corner} ${frame.tr}`} aria-hidden="true" />
      <span className={`${frame.corner} ${frame.bl}`} aria-hidden="true" />
      <span className={`${frame.corner} ${frame.br}`} aria-hidden="true" />
      <div
        className={clsx(
          "mb-2 font-mono text-xs uppercase tracking-wider",
          style.labelColor,
        )}
      >
        {style.label}
      </div>
      <div className="text-[var(--color-fg-1)]">{children}</div>
    </aside>
  );
}
