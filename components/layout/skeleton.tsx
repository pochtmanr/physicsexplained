"use client";
import { type HTMLAttributes } from "react";
import clsx from "clsx";

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "relative overflow-hidden bg-[var(--color-bg-1)]",
        "border border-[var(--color-fg-4)]",
        // Shimmer: a subtle cyan sweep across the surface.
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-[color-mix(in_oklch,var(--color-cyan)_20%,transparent)] before:to-transparent",
        // Respect prefers-reduced-motion — no shimmer.
        "motion-reduce:before:animate-none",
        className,
      )}
      {...rest}
    />
  );
}
