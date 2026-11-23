"use client";

import type { ReactNode } from "react";
import { useFigureLinkTarget } from "@/components/physics/_shared/figure-link";

/**
 * One readout or control entry of a figure guide, linked by `linkKey` to the
 * matching curve, readout or slider in the figure (docs/figure-full-view.md).
 * Pointing at either side highlights the other. Nothing scrolls: moving the
 * view would pull away what the reader is pointing at.
 */
export function FigureGuideItem({ linkKey, children }: { linkKey: string; children: ReactNode }) {
  const { props } = useFigureLinkTarget(linkKey, "guide");

  return (
    <div className="figure-link figure-link-row" {...props}>
      {children}
    </div>
  );
}
