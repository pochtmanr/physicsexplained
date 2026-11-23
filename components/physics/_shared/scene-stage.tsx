"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Wrapper for a scene's canvas. Inline it is a plain block; in full view it
 * is the figure's first card (see `.scene-stage` in globals.css and
 * docs/figure-full-view.md). The card edge is a ring, not a border, so the
 * canvas keeps exactly the width `useSceneSize` gave it.
 */
export function SceneStage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("scene-stage", className)}>{children}</div>;
}

/**
 * Groups controls that belong together — usually `<SceneControls>` and
 * `<SceneReadout>`. Inline it changes nothing; in full view it is a card.
 * (`<SceneControlGroup>` is a panel by itself.)
 */
export function ScenePanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("scene-panel", className)}>{children}</div>;
}
