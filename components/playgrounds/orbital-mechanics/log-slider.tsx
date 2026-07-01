"use client";
import { useId } from "react";

interface LogSliderProps {
  label: string;
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  detents?: number[];
  format?: (v: number) => string;
  onChange: (v: number) => void;
  /** When set, the value chip is a tap-to-reset button (e.g. back to 1×). */
  resetTo?: number;
  resetAriaLabel?: string;
}

const STEPS = 1000;
/** Snap radius in slider steps (1.2% of track) around each detent. */
const SNAP_STEPS = 12;

/**
 * Log-scale range input with detent snapping. Log scale makes 0.25→0.5 as
 * much travel as 2→4, which is how speed/mass perception actually works.
 */
export function LogSlider({
  label,
  ariaLabel,
  value,
  min,
  max,
  detents = [],
  format = String,
  onChange,
  resetTo,
  resetAriaLabel,
}: LogSliderProps) {
  const id = useId();
  const lmin = Math.log10(min);
  const lmax = Math.log10(max);
  const toSlider = (v: number) =>
    Math.round(((Math.log10(v) - lmin) / (lmax - lmin)) * STEPS);
  const fromSlider = (s: number) => 10 ** (lmin + (s / STEPS) * (lmax - lmin));

  function handleChange(raw: number) {
    for (const d of detents) {
      if (Math.abs(toSlider(d) - raw) <= SNAP_STEPS) {
        onChange(d);
        return;
      }
    }
    // Two decimals is plenty of resolution and keeps the URL blob short.
    onChange(Math.round(fromSlider(raw) * 100) / 100);
  }

  const display = format(value);
  const clamped = Math.min(Math.max(value, min), max);
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="opacity-60">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={toSlider(clamped)}
        onChange={(e) => handleChange(Number(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={display}
        className="w-20 accent-[var(--color-cyan)] md:w-24"
      />
      {resetTo !== undefined ? (
        <button
          type="button"
          onClick={() => onChange(resetTo)}
          aria-label={resetAriaLabel}
          className="min-w-9 text-start tabular-nums text-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)]"
        >
          {display}
        </button>
      ) : (
        <span className="min-w-9 tabular-nums opacity-80">{display}</span>
      )}
    </div>
  );
}
