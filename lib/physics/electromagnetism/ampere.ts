/**
 * Ampère's law in symmetry-reduced form.
 *
 * The integral statement is
 *   ∮ B · dℓ = μ₀ · I_enclosed
 * which is what we mean when we say "the line integral of B around any
 * closed loop equals μ₀ times the current threading the loop."
 *
 * For three high-symmetry geometries the line integral collapses to
 * algebra, and the field magnitude follows in one line. Those three
 * closed-form solutions are what this module exposes — the rest of
 * Ampère's law is the choice of the right Amperian loop.
 *
 * Compare with `lib/physics/gauss.ts`: this is the magnetic Gauss.
 */

import { MU_0 } from "@/lib/physics/constants";

/**
 * Magnitude of B at perpendicular distance `r` from an infinite straight
 * wire carrying current `I`, derived from Ampère's law.
 *
 * Choose a circular Amperian loop of radius `r` coaxial with the wire.
 * By the cylindrical symmetry, B has the same magnitude everywhere on
 * that loop and runs tangent to it. The line integral becomes B · 2π·r.
 * Setting this equal to μ₀ · I gives:
 *
 *   B(r) = μ₀ · I / (2π · r)
 *
 * This is the same answer the Biot–Savart integral grinds out for the
 * straight wire — Ampère's law gets there in two lines instead of half
 * a page. The agreement is the pedagogical point.
 *
 * Units: I in amperes, r in metres, return in tesla.
 */
export function wireFieldByAmpere(I: number, r: number): number {
  if (r <= 0) {
    throw new Error(`wireFieldByAmpere: r must be positive (got ${r}).`);
  }
  return (MU_0 * I) / (2 * Math.PI * r);
}

/**
 * Magnitude of B inside a long ideal solenoid with `n` turns per metre
 * carrying current `I` per turn.
 *
 *   B = μ₀ · n · I
 *
 * Derivation: an Amperian rectangle straddling the solenoid wall, with
 * one long side inside (length L, contributes B·L) and the other long
 * side far outside (where B ≈ 0, contributes 0); the two short sides
 * are perpendicular to B (contribute 0). The enclosed current is the
 * current per turn `I` times the number of turns inside the rectangle,
 * `n·L`. So B · L = μ₀ · n · L · I, and L cancels.
 *
 * Note the absence of position from the right-hand side: inside an
 * ideal solenoid the field is uniform. Outside it is zero. This is why
 * solenoids are the workhorses of electromagnets, MRI main coils, and
 * particle-physics beam steering.
 *
 * Units: n in turns per metre (1/m), I in amperes, return in tesla.
 */
export function solenoidField(n: number, I: number): number {
  return MU_0 * n * I;
}

/**
 * Magnitude of B inside a toroid — a solenoid bent into a doughnut —
 * with `N` total turns carrying current `I`, measured at radial
 * distance `r` from the toroid's central axis.
 *
 *   B(r) = μ₀ · N · I / (2π · r)
 *
 * Derivation: by the toroidal symmetry, B runs in circles concentric
 * with the central axis. Choose a circular Amperian loop of radius `r`
 * lying inside the toroid. The line integral becomes B · 2π·r, and the
 * current threading the loop is exactly `N · I` (every one of the N
 * turns punches through). So B · 2π·r = μ₀ · N · I.
 *
 * The 1/r dependence means the field is *not* uniform inside the
 * toroid — it is stronger near the inner edge and weaker near the outer
 * edge. Outside the toroid the enclosed current is zero (each turn goes
 * in once and comes out once), so B = 0 there. This is what makes
 * toroidal coils the natural geometry for plasma confinement —
 * tokamaks are big toroids.
 *
 * Units: N is dimensionless (a count), I in amperes, r in metres,
 * return in tesla.
 */
export function toroidField(N: number, I: number, r: number): number {
  if (r <= 0) {
    throw new Error(`toroidField: r must be positive (got ${r}).`);
  }
  return (MU_0 * N * I) / (2 * Math.PI * r);
}
