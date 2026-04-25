/**
 * §11.4 — Magnetism as relativistic electrostatics.
 *
 * Purcell's two-wire derivation, packaged as three closed-form helpers and a
 * grand equivalence check. The point of this module: in the lab frame, two
 * parallel current-carrying wires attract via a magnetic force. Boost into
 * the rest frame of the drift electrons and the magnetic story disappears —
 * the lattice is now moving, length contraction shifts the line densities by
 * γ on the lattice and 1/γ on the (now-stationary) electrons, the wires pick
 * up a net + line charge density, and the SAME force reappears as a Coulomb
 * attraction. Same number, different name.
 *
 * Reference: Purcell, *Electricity and Magnetism* (Berkeley Physics Course
 * Vol. II, 1965), §5.9 "The field of a moving charge". The exact equivalence
 * holds at all β.
 */

import {
  EPSILON_0,
  ELEMENTARY_CHARGE,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/electromagnetism/relativity";

/**
 * Numerically stable evaluation of (γ − 1/γ) = β² γ. Direct subtraction
 * (which the shared lorentz-boost helper netChargeDensityTwoWire performs)
 * loses precision catastrophically for tiny β — at copper drift velocity
 * (β ≈ 10⁻¹²) γ is within 10⁻²⁵ of 1 and γ − 1/γ underflows to zero in
 * double precision. The algebraic identity (γ − 1/γ) = β²γ is exact across
 * the full sub-luminal range and is what the equivalenceCheck below uses.
 */
function gammaMinusInv(beta: number): number {
  return beta * beta * gamma(beta);
}

/**
 * Magnetic force per unit length between two parallel infinite wires
 * carrying currents I1 and I2 separated by distance d (m).
 *
 * F/L = μ₀ I₁ I₂ / (2π d). Attractive when the currents flow the same way;
 * the helper returns the magnitude (sign of the relative direction is the
 * caller's responsibility).
 */
export function magneticForcePerLength(
  I1: number,
  I2: number,
  d: number,
): number {
  if (d <= 0) throw new Error("separation d must be positive");
  return (MU_0 * I1 * I2) / (2 * Math.PI * d);
}

/**
 * Electric force per unit length between two parallel infinite lines of
 * charge with line density rhoLine (C/m), separated by distance d (m).
 *
 * E-field of one infinite line at distance d: E = ρ/(2π ε₀ d). The force per
 * length on the second line (also density ρ) is F/L = ρ·E = ρ²/(2π ε₀ d).
 *
 * The helper returns the magnitude, treating both lines as having the same
 * line density. The sign of the force is determined by the sign of the
 * product of the two line densities at the call site, not here.
 */
export function electricForcePerLength(rhoLine: number, d: number): number {
  if (d <= 0) throw new Error("separation d must be positive");
  return (rhoLine * rhoLine) / (2 * Math.PI * EPSILON_0 * d);
}

/**
 * Purcell's two-wire equivalence check. Given:
 *   • I       — current in each wire (A), driven by drift velocity vDrift on
 *               a lattice of line density n0 (charges per metre)
 *   • n0      — lattice line density (charges per metre, e.g. ~10²⁹/m for Cu)
 *   • vDrift  — electron drift velocity (m/s)
 *   • d       — wire separation (m)
 *
 * Compute:
 *   1. fMag — the magnetic force per length in the LAB frame, from the closed
 *      form μ₀ I² / (2π d).
 *   2. The net + line charge density that appears on each wire when boosted
 *      into the rest frame of the drift electrons, ρ_net = e n0 (γ − 1/γ).
 *   3. fElecRestFrame — the Coulomb force per length on the (now-static) test
 *      electrons of the second wire, evaluated in the electron rest frame.
 *      Test charge per length: n0·e (electrons at rest with their rest-frame
 *      density). Field from the source line: E = ρ_net/(2π ε₀ d). Force per
 *      length: (n0·e)·ρ_net/(2π ε₀ d).
 *   4. fElec — that force transformed back to the lab. Transverse forces in
 *      special relativity transform as F_lab = F_rest / γ, so
 *      fElec = fElecRestFrame / γ.
 *   5. ratio = fElec / fMag — should be exactly 1 at every β.
 *
 * The exact algebra:
 *   ρ_net = e n0 (γ − 1/γ)
 *   fElecRestFrame = (n0 e) · ρ_net / (2π ε₀ d) = e² n0² (γ − 1/γ) / (2π ε₀ d)
 *   fElec = fElecRestFrame / γ = e² n0² (γ − 1/γ) / (γ · 2π ε₀ d)
 *         = e² n0² (1 − 1/γ²) / (2π ε₀ d)
 *         = e² n0² β² / (2π ε₀ d)              (since 1 − 1/γ² = β²)
 *
 *   I = n0 e vDrift, so I² = n0² e² vDrift² = n0² e² β² c²
 *   fMag = μ₀ I² / (2π d) = μ₀ n0² e² β² c² / (2π d)
 *        = n0² e² β² / (2π ε₀ d)               (since μ₀ c² = 1/ε₀)
 *
 * The two are identical. ratio = 1 at every β, not just to leading order.
 *
 * Returns { fMag, fElec, ratio } — fMag and fElec in N/m, ratio dimensionless.
 */
export function equivalenceCheck(
  I: number,
  n0: number,
  vDrift: number,
  d: number,
): { fMag: number; fElec: number; ratio: number } {
  if (d <= 0) throw new Error("separation d must be positive");
  if (n0 <= 0) throw new Error("lattice density n0 must be positive");
  if (vDrift < 0) throw new Error("drift velocity must be non-negative");
  if (vDrift >= SPEED_OF_LIGHT)
    throw new Error("drift velocity must be sub-luminal");

  const fMag = magneticForcePerLength(I, I, d);

  const beta = vDrift / SPEED_OF_LIGHT;
  const g = gamma(beta);

  // Net + line density in the electron rest frame: e · n0 · (γ − 1/γ).
  // Use the β²γ form, exact at every β and stable down to denormal beta.
  const rhoNet = ELEMENTARY_CHARGE * n0 * gammaMinusInv(beta);

  // In the electron rest frame the second wire's electrons sit still with
  // line density n0·e and feel the Coulomb force from the net + density on
  // the first wire. Force per length:
  const fElecRestFrame =
    (n0 * ELEMENTARY_CHARGE * rhoNet) / (2 * Math.PI * EPSILON_0 * d);

  // Boost back to the lab: transverse forces transform as F_lab = F_rest / γ.
  const fElec = fElecRestFrame / g;

  // At β = 0 both are exactly zero; define the ratio as 1 by Purcell's
  // identity (the limit of fElec/fMag is 1 from above; both numerator and
  // denominator vanish as β² → 0).
  const ratio = fMag === 0 ? 1 : fElec / fMag;

  return { fMag, fElec, ratio };
}
