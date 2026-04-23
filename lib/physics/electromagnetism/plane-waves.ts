/**
 * Plane electromagnetic waves in vacuum — and their polarization.
 *
 * Maxwell's equations in source-free vacuum admit a family of solutions in
 * which the fields take the form
 *
 *   E(r, t) = E₀ · cos(k · r − ω t + φ)
 *   B(r, t) = B₀ · cos(k · r − ω t + φ)
 *
 * where the spatial dependence is a single plane with wavevector k and the
 * time dependence is a single sinusoid at angular frequency ω. The divergence
 * equations (∇·E = 0, ∇·B = 0 in vacuum) force E and B to be perpendicular
 * to k — plane EM waves are **transverse**. The curl equations then lock
 * the two fields into a rigid triad:
 *
 *   B = (1/c) · k̂ × E        (so E, B, k̂ is a right-handed triple)
 *   |B| = |E| / c
 *   E and B oscillate in phase in vacuum.
 *
 * The Poynting vector S = E × B / μ₀ points along k̂ — the energy flows the
 * way the wave is moving, which is how we know it is really a wave and not
 * just a standing oscillation.
 *
 * Inside the "direction of E" there are still two real degrees of freedom —
 * any vector perpendicular to k can be decomposed into two orthogonal
 * components. The relative amplitude and phase of those two components is
 * the **polarization state** of the wave:
 *
 *   linear      — phase delay 0 or π; the tip of E traces a line.
 *   circular    — phase delay ±π/2 with equal amplitudes; the tip traces
 *                 a circle. Handedness set by the sign of the phase delay.
 *   elliptical  — everything else: the tip traces an ellipse.
 *
 * This module provides the numerical kernel:
 *   - planeWaveAtPoint — evaluate E at (r, t) for a chosen mode.
 *   - isTransverse — verify E ⊥ k to within a tolerance.
 *   - poyntingVector — S = E × B / μ₀, the direction of energy flow.
 *   - polarizationState — classify {|Ex|, |Ey|, Δφ} as linear/elliptical/
 *     circular.
 *   - jonesVector — build the canonical (Ex, Ey, phaseDelta) triple from
 *     an ellipticity ∈ [0, 1] and an orientation angle.
 */

import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { cross } from "@/lib/physics/electromagnetism/lorentz";

/**
 * Evaluate a plane wave's E-field at position r and time t.
 *
 *   E(r, t) = E₀ · cos(k · r − ω t + φ)
 *
 *   r      — observation point (m)
 *   t      — time (s)
 *   k_vec  — wavevector (rad/m). Its direction is the propagation direction
 *            and its magnitude is 2π/λ.
 *   omega  — angular frequency (rad/s). For vacuum modes ω = c·|k|.
 *   E0_vec — polarization vector / peak amplitude (V/m). For a physical
 *            plane wave in vacuum, E0_vec must be perpendicular to k_vec.
 *   phase  — absolute phase offset φ (rad).
 *
 * Returns the vector E at (r, t). Does NOT enforce E0 ⊥ k — callers use
 * `isTransverse` for that check. Providing a non-transverse E0 still gives
 * a well-defined number back; it just won't be a Maxwell-vacuum solution.
 */
export function planeWaveAtPoint(
  r: Vec3,
  t: number,
  k_vec: Vec3,
  omega: number,
  E0_vec: Vec3,
  phase: number,
): Vec3 {
  const kDotR = k_vec.x * r.x + k_vec.y * r.y + k_vec.z * r.z;
  const carrier = Math.cos(kDotR - omega * t + phase);
  return {
    x: E0_vec.x * carrier,
    y: E0_vec.y * carrier,
    z: E0_vec.z * carrier,
  };
}

/**
 * True if E is perpendicular to k to within a numerical tolerance.
 *
 *   transverse ⇔ |E · k| ≤ tol · |E| · |k|
 *
 * Uses a *relative* tolerance so the check works at any amplitude. A
 * physically valid plane EM wave in vacuum satisfies this exactly — any
 * longitudinal component would violate ∇·E = 0.
 */
export function isTransverse(
  k_vec: Vec3,
  E_vec: Vec3,
  tol = 1e-12,
): boolean {
  const dot = k_vec.x * E_vec.x + k_vec.y * E_vec.y + k_vec.z * E_vec.z;
  const kMag = Math.hypot(k_vec.x, k_vec.y, k_vec.z);
  const eMag = Math.hypot(E_vec.x, E_vec.y, E_vec.z);
  if (kMag === 0 || eMag === 0) return dot === 0;
  return Math.abs(dot) <= tol * kMag * eMag;
}

/**
 * Poynting vector S = (E × B) / μ₀ — the local direction and magnitude of
 * electromagnetic energy flow (W/m²). Takes the full vacuum permeability
 * μ₀ explicitly so the caller can pass a material's effective μ instead if
 * they want to.
 *
 * In a plane EM wave in vacuum, S is parallel to k̂ at every instant — the
 * wave carries energy exactly along its direction of propagation.
 */
export function poyntingVector(E: Vec3, B: Vec3, mu0: number): Vec3 {
  const c = cross(E, B);
  return { x: c.x / mu0, y: c.y / mu0, z: c.z / mu0 };
}

/**
 * Polarization-state classifier.
 *
 * Given the two orthogonal real amplitudes |Ex| and |Ey| and the phase delay
 * δ = φ_y − φ_x, classify the trajectory of the electric-field tip in the
 * transverse plane:
 *
 *   linear     — δ ≡ 0 or π (mod 2π), OR one amplitude is zero.
 *   circular   — |Ex| = |Ey|  AND  δ ≡ ±π/2 (mod 2π).
 *   elliptical — everything else.
 *
 * Tolerances are relative: amplitudes are compared using the larger of the
 * two as the reference, and phases are compared to multiples of π/2 with an
 * absolute tolerance `tol`.
 */
export function polarizationState(opts: {
  Ex_amplitude: number;
  Ey_amplitude: number;
  phaseDelta: number;
  tol?: number;
}): "linear" | "elliptical" | "circular" {
  const tol = opts.tol ?? 1e-9;
  const ax = Math.abs(opts.Ex_amplitude);
  const ay = Math.abs(opts.Ey_amplitude);

  // Degenerate axis-aligned linear: one component is zero.
  const ampRef = Math.max(ax, ay);
  if (ampRef === 0) return "linear";
  if (ax <= tol * ampRef || ay <= tol * ampRef) return "linear";

  // Reduce phaseDelta to (−π, π].
  const TWO_PI = 2 * Math.PI;
  let d = opts.phaseDelta % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d <= -Math.PI) d += TWO_PI;

  const nearZero = Math.abs(d) <= tol;
  const nearPi = Math.abs(Math.abs(d) - Math.PI) <= tol;
  if (nearZero || nearPi) return "linear";

  const nearQuarter = Math.abs(Math.abs(d) - Math.PI / 2) <= tol;
  const equalAmps = Math.abs(ax - ay) <= tol * ampRef;
  if (nearQuarter && equalAmps) return "circular";

  return "elliptical";
}

/**
 * Canonical Jones vector for a polarisation state parameterised by an
 * ellipticity χ ∈ [0, 1] and an orientation angle θ (rad) of the major axis.
 *
 *   χ = 0 → linear polarisation along θ.
 *   χ = 1 → circular polarisation (right-handed for positive sign).
 *
 * The returned triple is (Ex_amplitude, Ey_amplitude, phaseDelta) — the
 * three real numbers that `polarizationState` consumes:
 *
 *   Ex = cos(θ) · cos(α) − sin(θ) · 0    (in-phase part of axis 1)
 *   Ey = sin(θ) · cos(α) + cos(θ) · 0
 *
 * where α = arctan(χ) is the ellipticity angle. In the reduced form returned
 * here, we project the general 2D elliptical Jones vector onto the (|Ex|,
 * |Ey|, δ) representation:
 *
 *   |Ex|² = cos²(θ)·cos²(α) + sin²(θ)·sin²(α)
 *   |Ey|² = sin²(θ)·cos²(α) + cos²(θ)·sin²(α)
 *   δ     = π/2 if χ ≠ 0; arbitrary (set to 0) when χ = 0 (linear case).
 *
 * For χ = 1 (circular) and θ = 0 this returns |Ex| = |Ey| = 1/√2 and
 * δ = π/2, which `polarizationState` classifies as "circular".
 */
export function jonesVector(
  ellipticity: number,
  orientationRad: number,
): { Ex: number; Ey: number; phase: number } {
  const chi = Math.max(0, Math.min(1, ellipticity));
  const alpha = Math.atan(chi);
  const c = Math.cos(orientationRad);
  const s = Math.sin(orientationRad);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  const Ex2 = c * c * ca * ca + s * s * sa * sa;
  const Ey2 = s * s * ca * ca + c * c * sa * sa;
  const Ex = Math.sqrt(Ex2);
  const Ey = Math.sqrt(Ey2);

  // For linear (χ = 0) the phase delay is irrelevant, but we pick 0 so
  // downstream `polarizationState` calls classify it as linear cleanly.
  const phase = chi === 0 ? 0 : Math.PI / 2;
  return { Ex, Ey, phase };
}
