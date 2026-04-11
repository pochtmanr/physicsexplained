import clsx from "clsx";
import type { ReactNode } from "react";

export interface HUDProps {
  children: ReactNode;
  className?: string;
}

/**
 * Mono corner readout for live scene values.
 * Use inside SceneCard via the `hud` prop.
 */
export function HUD({ children, className }: HUDProps) {
  return (
    <div
      className={clsx(
        "rounded-sm border border-[var(--color-fg-3)] bg-[var(--color-bg-0)]/70 px-2 py-1",
        "font-mono text-xs text-[var(--color-fg-1)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
