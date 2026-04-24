/**
 * §10.1 — The Larmor formula.
 *
 * In 1897 Joseph Larmor computed the total power radiated by a point
 * charge q accelerated by a (non-relativistic) acceleration of magnitude
 * a:
 *
 *   P = q² a² / (6π ε₀ c³)                                     (Larmor)
 *
 * The formula has a few features worth absorbing before any variation:
 *
 *   (i)   It scales as a² — double the acceleration, quadruple the
 *         radiated power. The *speed* of the charge does not appear at
 *         leading order; an unaccelerated charge radiates nothing.
 *   (ii)  It is sourced by the *second derivative* of position. No jerk,
 *         no radiation (at lowest order in β = v/c).
 *   (iii) It has an angular pattern. The differential radiated power per
 *         solid angle is
 *             dP/dΩ = (q² a² / 16 π² ε₀ c³) · sin²θ
 *         where θ is measured from the instantaneous acceleration axis.
 *         Integrating sin²θ · dΩ over the sphere gives 8π/3, which
 *         reproduces the total P above (good check and used in the
 *         vitest below).
 *
 * Relativistic extensions (Liénard, 1898):
 *
 *   P_perp     = γ⁴ · P_Larmor    (acceleration perpendicular to v)
 *   P_parallel = γ⁶ · P_Larmor    (acceleration parallel to v)
 *
 * where γ = 1/√(1 − β²). The perpendicular case is synchrotron-style
 * (circular motion); the parallel case is linac-style (straight-line
 * boost). The γ⁴ vs γ⁶ gap is why modern particle accelerators bend
 * electrons gently to make light (§10.4 synchrotron radiation) and
 * accelerate protons hard in straight lines (heavier particles, lower
 * γ at the same energy, radiation loss tolerable).
 *
 * Thomson scattering (§10.1 postscript): a free electron illuminated by
 * a low-energy electromagnetic wave oscillates at the driving frequency
 * and re-radiates at that frequency. The total cross-section is
 *
 *   σ_T = (8π/3) · r_e²,   r_e = e² / (4π ε₀ m_e c²) ≈ 2.818 × 10⁻¹⁵ m
 *
 * ≈ 6.6524587 × 10⁻²⁹ m² for an electron — the "classical electron
 * radius" squared, times 8π/3. It is the opacity of a plasma of free
 * electrons to low-frequency light and is one of the handful of cross-
 * sections in physics that is exactly computable without quantum theory.
 *
 * Cross-refs: §07.4 (Poynting vector — what Larmor integrates over a
 * sphere), §08.1 (wave equation — where radiation "lives"), §10.2
 * (electric-dipole radiation — Larmor specialised to an oscillating
 * dipole moment), §10.4 (synchrotron — the γ⁴ case in action), §10.6
 * (radiation reaction — what P = q²a²/(6πε₀c³) does to the charge
 * itself).
 */

import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

/** Electron rest mass, kg (CODATA 2018). Needed for the classical
 *  electron radius that feeds the Thomson cross-section. */
const ELECTRON_MASS = 9.1093837015e-31;

/**
 * Larmor's non-relativistic total radiated power.
 *
 *   P = q² a² / (6π ε₀ c³)
 *
 * Accepts charge magnitude (absolute value is used, since the sign of
 * the charge drops out in the squared form), and acceleration magnitude.
 * Throws on negative acceleration (callers should pass |a|).
 */
export function larmorPower(q: number, aMag: number): number {
  if (aMag < 0) {
    throw new Error("larmorPower: aMag must be ≥ 0");
  }
  const q2 = q * q;
  const a2 = aMag * aMag;
  return (q2 * a2) / (6 * Math.PI * EPSILON_0 * SPEED_OF_LIGHT ** 3);
}

/**
 * Liénard relativistic generalisation of Larmor.
 *
 *   perpendicular  (a ⊥ v):   P = γ⁴ · q² a² / (6π ε₀ c³)
 *   parallel       (a ∥ v):   P = γ⁶ · q² a² / (6π ε₀ c³)
 *
 * Here `v` is the instantaneous speed (0 ≤ v ≤ c) and `parallel` selects
 * which of the two geometries the acceleration refers to. For the
 * general case, the full Liénard expression is
 *     P = (q² γ⁶ / 6π ε₀ c³) · [ |a|² − (v × a)²/c² ]
 * which reduces to γ⁶·a² when v ∥ a and to γ⁴·a² when v ⊥ a. Most
 * physically-interesting cases are one or the other, so we expose the
 * two clean limits and leave the general tensor form for callers who
 * truly need it.
 */
export function larmorPowerRelativistic(
  q: number,
  aMag: number,
  v: number,
  parallel: boolean,
): number {
  if (aMag < 0) {
    throw new Error("larmorPowerRelativistic: aMag must be ≥ 0");
  }
  if (v < 0 || v >= SPEED_OF_LIGHT) {
    throw new Error(
      "larmorPowerRelativistic: v must be in [0, c); got " + v,
    );
  }
  const beta = v / SPEED_OF_LIGHT;
  const gamma2 = 1 / (1 - beta * beta);
  const boost = parallel ? gamma2 * gamma2 * gamma2 : gamma2 * gamma2;
  return boost * larmorPower(q, aMag);
}

/**
 * Angular distribution of radiated power — non-relativistic dipole
 * pattern.
 *
 *   dP/dΩ = (q² a² / 16 π² ε₀ c³) · sin²θ
 *
 * θ is measured from the instantaneous acceleration axis (NOT the
 * velocity axis — at leading order in β they coincide only for linear
 * motion, and the acceleration axis is the physically correct one for
 * the sin²θ lobe).
 *
 * Integrating this over the full sphere returns the total Larmor power:
 *     ∫ sin²θ · sin θ · dθ · dφ = 2π · (4/3) = 8π/3,
 * and (q² a²/16π² ε₀ c³) · (8π/3) = q² a²/(6π ε₀ c³) = P_Larmor. The
 * vitest below exercises this identity numerically.
 */
export function larmorAngularIntensity(
  q: number,
  aMag: number,
  thetaRad: number,
): number {
  if (aMag < 0) {
    throw new Error("larmorAngularIntensity: aMag must be ≥ 0");
  }
  const q2 = q * q;
  const a2 = aMag * aMag;
  const s = Math.sin(thetaRad);
  return (
    (q2 * a2 * s * s) /
    (16 * Math.PI * Math.PI * EPSILON_0 * SPEED_OF_LIGHT ** 3)
  );
}

/**
 * Thomson total scattering cross-section for a free electron.
 *
 *   σ_T = (8π / 3) · r_e²,  r_e = e² / (4π ε₀ m_e c²)
 *
 * Returns σ_T in m². The accepted value is 6.6524587 × 10⁻²⁹ m²
 * (CODATA 2018); the formula here reproduces that to the precision of
 * EPSILON_0, ELEMENTARY_CHARGE, SPEED_OF_LIGHT, and ELECTRON_MASS.
 */
export function thomsonCrossSection(): number {
  const re =
    (ELEMENTARY_CHARGE * ELEMENTARY_CHARGE) /
    (4 * Math.PI * EPSILON_0 * ELECTRON_MASS * SPEED_OF_LIGHT ** 2);
  return (8 * Math.PI / 3) * re * re;
}
