/**
 * Maxwell and the speed of light — small physics helpers for the §01.2 topic.
 *
 * Two ideas live here:
 *
 *   1. `cFromMuEpsilon(mu0, eps0)` — Maxwell's 1862 derivation. The wave
 *      equation that falls out of the four field equations is
 *
 *          ∂²E/∂t² = (1 / μ₀ε₀) · ∇²E,
 *
 *      so the propagation speed of an electromagnetic wave in vacuum is
 *
 *          c = 1 / √(μ₀ε₀).
 *
 *      With the modern SI values μ₀ = 1.25663706212×10⁻⁶ N/A² and
 *      ε₀ = 8.8541878128×10⁻¹² F/m, this returns 299,792,458 m/s to within
 *      the rounding of the input constants.
 *
 *   2. `foucaultRotation(distance, rpm, c)` — the angular shift Léon
 *      Foucault read off the 1862 rotating-mirror apparatus. A pulse leaves
 *      a mirror spinning at ω rad/s, travels 2L in vacuum at speed c, and
 *      returns to find the mirror has rotated by Δθ = ω · (2L/c). Solve
 *      for c and you have a tabletop measurement to better than 1 percent.
 *
 *      Inputs:
 *        distance  — one-way length L from rotating mirror to fixed mirror (m)
 *        rpm       — rotations per minute of the rotating mirror
 *        c         — wave speed used for the prediction (m/s)
 *
 *      Returns Δθ in radians.
 *
 * Pure TypeScript. No React, no DOM.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Speed of light from the vacuum permeability and permittivity. */
export function cFromMuEpsilon(mu0: number, eps0: number): number {
  if (!Number.isFinite(mu0) || !Number.isFinite(eps0)) {
    throw new RangeError(`mu0 and eps0 must be finite (got mu0=${mu0}, eps0=${eps0})`);
  }
  if (mu0 <= 0 || eps0 <= 0) {
    throw new RangeError(`mu0 and eps0 must be strictly positive (got mu0=${mu0}, eps0=${eps0})`);
  }
  return 1 / Math.sqrt(mu0 * eps0);
}

/**
 * Foucault's 1862 rotating-mirror angular shift.
 *
 *   Δθ = (2π · rpm / 60) · (2 · distance / c)
 *
 * Returns the angular displacement in radians the rotating mirror sweeps
 * out during the round-trip light path.
 */
export function foucaultRotation(
  distance: number,
  rpm: number,
  c: number = SPEED_OF_LIGHT,
): number {
  if (!Number.isFinite(distance) || !Number.isFinite(rpm) || !Number.isFinite(c)) {
    throw new RangeError(
      `distance, rpm and c must be finite (got distance=${distance}, rpm=${rpm}, c=${c})`,
    );
  }
  if (distance < 0) {
    throw new RangeError(`distance must be non-negative (got ${distance})`);
  }
  if (c <= 0) {
    throw new RangeError(`c must be strictly positive (got ${c})`);
  }
  const omega = (2 * Math.PI * rpm) / 60; // rad/s
  const tRoundTrip = (2 * distance) / c;
  return omega * tRoundTrip;
}

/**
 * Inverse of `foucaultRotation`: solve for c given a measured angular
 * displacement. Useful when feeding lab observations into the lib.
 */
export function cFromFoucault(distance: number, rpm: number, deltaTheta: number): number {
  if (deltaTheta <= 0) {
    throw new RangeError(`deltaTheta must be strictly positive (got ${deltaTheta})`);
  }
  const omega = (2 * Math.PI * rpm) / 60;
  return (omega * 2 * distance) / deltaTheta;
}

/**
 * Hertz 1887 — wavelength of an electromagnetic wave at a given frequency,
 * propagating at speed c. Useful for the spark-gap scene's HUD readout.
 */
export function hertzWavelength(frequency: number, c: number = SPEED_OF_LIGHT): number {
  if (frequency <= 0) {
    throw new RangeError(`frequency must be strictly positive (got ${frequency})`);
  }
  return c / frequency;
}
