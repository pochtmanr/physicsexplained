"use client";

import { useId, type ReactNode } from "react";

export interface SceneSliderProps {
  /** Visible label, e.g. "Angle (θ)" or "v₀". */
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Text shown after the track, e.g. "18°" or "2.0 m/s". Defaults to the raw value. */
  display?: string;
  /** Accessible name when `label` is a bare symbol such as "a". */
  ariaLabel?: string;
}

/**
 * The one range slider for scene parameters: label tied to the input, theme
 * accent colour, fixed-width value so the track does not jitter as digits
 * change. Stack several in a `<SceneControlGroup>`.
 */
export function SceneSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  ariaLabel,
}: SceneSliderProps) {
  const id = useId();
  return (
    <div className="grid grid-cols-[minmax(3.5rem,auto)_1fr_minmax(4.5rem,auto)] items-center gap-3">
      <label htmlFor={id} className="text-sm text-[var(--color-fg-3)]">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={display}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-6 w-full min-w-0 accent-[var(--color-cyan)]"
      />
      <output
        htmlFor={id}
        dir="ltr"
        className="text-end font-mono text-sm tabular-nums text-[var(--color-fg-1)]"
      >
        {display ?? value}
      </output>
    </div>
  );
}

/** Vertical stack for a scene's sliders and control rows, below the canvas. */
export function SceneControlGroup({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-col gap-2 px-2">{children}</div>;
}
