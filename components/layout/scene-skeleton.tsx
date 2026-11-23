"use client";
import { Skeleton } from "./skeleton";

/**
 * Placeholder shown while a scene's code loads. It sits inside `<SceneCard>`,
 * which already draws the frame, so it has no border of its own. The height
 * approximates a typical scene (canvas plus its controls) so the page moves
 * as little as possible when the real scene takes over.
 */
export function SceneSkeleton() {
  return (
    <div className="relative h-[clamp(360px,62vw,520px)] w-full">
      <Skeleton className="absolute inset-0 border-0" />
      <div className="absolute bottom-3 start-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
        loading simulation
      </div>
    </div>
  );
}
