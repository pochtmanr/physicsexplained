"use client";

import { useId, type ReactNode } from "react";
import { useFigureLinkTarget } from "./figure-link";
import { SceneRange } from "./scene-range";

export interface SceneSliderProps {
  /** Visible label, e.g. "Angle (θ)" or "v₀". */
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /**
   * Called when the reader lets go of the slider (pointer or key released,
   * touch taken over by scrolling, or focus moved away), after any
   * `onChange` calls. It can fire without a change, and more than once. Use it for work that should happen once per
   * adjustment rather than on every step of a drag.
   */
  onCommit?: () => void;
  /** Text shown after the track, e.g. "18°" or "2.0 m/s". Defaults to the raw value. */
  display?: string;
  /** Accessible name when `label` is a bare symbol such as "a". */
  ariaLabel?: string;
  /**
   * Key of the guide entry that explains this control (see
   * `lib/content/figure-guides.ts`). Links the two on hover in full view.
   */
  guideKey?: string;
}

/**
 * The one range slider for scene parameters: label tied to the input,
 * fixed-width value so the track does not jitter as digits change. Neutral
 * at rest; track, thumb and value take the accent while it is being
 * adjusted. Stack several in a `<SceneControlGroup>`.
 */
export function SceneSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit,
  display,
  ariaLabel,
  guideKey,
}: SceneSliderProps) {
  const id = useId();
  const { props: linkProps } = useFigureLinkTarget(guideKey, "scene");
  // Phone: label and value share a row, the track gets the full width below.
  // From `sm` up: label, track, value in one row.
  return (
    <div
      className="figure-link grid grid-cols-[1fr_auto] items-center gap-x-3 sm:grid-cols-[minmax(3.5rem,auto)_1fr_minmax(4.5rem,auto)]"
      {...linkProps}
    >
      <label htmlFor={id} className="text-sm text-[var(--color-fg-2)]">
        {label}
      </label>
      <SceneRange
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={display}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={onCommit}
        onPointerCancel={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="peer order-last col-span-2 w-full min-w-0 sm:order-none sm:col-span-1"
      />
      <output
        htmlFor={id}
        dir="ltr"
        className="text-end font-mono text-sm tabular-nums text-[var(--color-fg-1)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] peer-focus-visible:text-[var(--color-cyan)] peer-active:text-[var(--color-cyan)] motion-reduce:transition-none"
      >
        {display ?? value}
      </output>
    </div>
  );
}

/** Vertical stack for a scene's sliders and control rows, below the canvas. */
export function SceneControlGroup({ children }: { children: ReactNode }) {
  // `scene-panel`: a card in full view (globals.css), nothing inline.
  return <div className="scene-panel mt-3 flex flex-col gap-2 px-2">{children}</div>;
}
