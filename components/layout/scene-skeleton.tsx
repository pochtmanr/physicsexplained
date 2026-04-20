"use client";
import { Skeleton } from "./skeleton";

export function SceneSkeleton() {
  return (
    <div className="relative aspect-[4/3] w-full">
      <Skeleton className="absolute inset-0" />
      <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
        loading simulation
      </div>
    </div>
  );
}
