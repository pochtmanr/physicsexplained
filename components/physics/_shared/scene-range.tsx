"use client";

import clsx from "clsx";
import type { CSSProperties, InputHTMLAttributes } from "react";

export interface SceneRangeProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max"> {
  value: number;
  min: number;
  max: number;
}

/** Position of `value` between `min` and `max`, as a fraction from 0 to 1. */
export function rangeFraction(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The styled `<input type="range">` behind every scene slider and scrubber.
 * Colours and states live in `.scene-range` (globals.css): neutral at rest,
 * accent on hover, focus and drag. This component only tells the stylesheet
 * how much of the track is filled.
 */
export function SceneRange({ value, min, max, className, style, ...rest }: SceneRangeProps) {
  return (
    <input
      {...rest}
      type="range"
      // Always left-to-right, like the numeric axes it controls: on a
      // right-to-left page a mirrored slider would move against its graph.
      dir="ltr"
      min={min}
      max={max}
      value={value}
      className={clsx("scene-range", className)}
      style={{ ...style, "--range-frac": rangeFraction(value, min, max) } as CSSProperties}
    />
  );
}
