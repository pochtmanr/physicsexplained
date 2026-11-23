"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFigureLinkTarget } from "@/components/physics/_shared/figure-link";

/**
 * One readout or control entry of a figure guide, linked by `linkKey` to the
 * matching curve, readout or slider in the figure (docs/figure-full-view.md).
 * Pointing at the entry marks the figure's side; pointing at the figure marks
 * the entry and brings it into view.
 */
export function FigureGuideItem({ linkKey, children }: { linkKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { fromOtherSide, props } = useFigureLinkTarget(linkKey, "guide");

  useEffect(() => {
    if (!fromOtherSide) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [fromOtherSide]);

  return (
    <div ref={ref} className="figure-link figure-link-row" {...props}>
      {children}
    </div>
  );
}
