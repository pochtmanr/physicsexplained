"use client";

import type { ReactNode } from "react";

export interface SceneReadoutItem {
  /** Short name of the quantity, e.g. "θ" or "feather lands". */
  label: ReactNode;
  /** Formatted value, e.g. "3.03 m/s²". */
  value: ReactNode;
  /** CSS colour for the value, to match a curve or object in the canvas. */
  color?: string;
}

/**
 * Numeric readouts for a scene, as HTML below the canvas instead of text
 * painted on it. Values here cannot collide with the drawing, wrap on narrow
 * screens, are translatable, and are readable by assistive technology.
 */
export function SceneReadout({ items }: { items: SceneReadoutItem[] }) {
  return (
    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 px-2 font-mono text-xs">
      {items.map((item, i) => (
        <div key={i} className="flex items-baseline gap-1.5">
          <dt className="text-[var(--color-fg-2)]">{item.label}</dt>
          <dd
            dir="ltr"
            className="tabular-nums text-[var(--color-fg-1)]"
            style={item.color ? { color: item.color } : undefined}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
