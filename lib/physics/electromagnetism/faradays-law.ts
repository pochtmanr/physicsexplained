/**
 * Faraday's law of induction.
 *
 *   EMF = −dΦ_B / dt
 *
 * This is the first *dynamic* field equation in the branch: up to here
 * everything was a statement about the instantaneous configuration of
 * charges and steady currents (Gauss, Ampère, Biot–Savart). Faraday's
 * law says that if the magnetic flux through a loop changes in time,
 * an electromotive force appears around the loop — regardless of what
 * caused the flux change (a moving magnet, a changing neighbouring
 * current, a rotating or deforming loop in a static field). The minus
 * sign is Lenz: the induced EMF drives a current whose own field
 * opposes the change. Together with ∇×B = μ₀J (Ampère) this is two of
 * the four Maxwell equations, ready to meet the displacement-current
 * correction in §07.
 *
 * Historical hook: Faraday demonstrated the effect in 1831 with a
 * hand-cranked copper disk between the poles of a magnet — the first
 * DC generator, and the geometry of the `faradayDiskEmf` function
 * below.
 */

/**
 * Magnetic flux through a flat surface of area `area` in a uniform
 * field of magnitude `B`, with `theta` the angle (radians) between
 * the area normal and B:
 *
 *   Φ = B · A · cos θ
 *
 * At θ = 0 the loop is face-on to B and flux is maximal; at θ = π/2
 * the loop is edge-on and flux is zero. Units: B in tesla, area in
 * square metres, return in webers (Wb = T·m²).
 */
export function flux(B: number, area: number, theta: number): number {
  return B * area * Math.cos(theta);
}

/**
 * Finite-difference EMF from two successive flux samples separated by
 * time `dt`. Multiplies by the number of turns `turns` (each turn sees
 * the same flux, so EMFs add):
 *
 *   EMF = −N · (Φ_after − Φ_before) / dt
 *
 * The minus sign is Lenz's law: a rising flux produces a negative EMF
 * (a current that opposes the rise), a falling flux produces a
 * positive EMF. Units: flux in webers, dt in seconds, return in volts.
 */
export function inducedEmf(
  fluxBefore: number,
  fluxAfter: number,
  dt: number,
  turns = 1,
): number {
  if (dt <= 0) {
    throw new Error(`inducedEmf: dt must be positive (got ${dt}).`);
  }
  return (-turns * (fluxAfter - fluxBefore)) / dt;
}

/**
 * EMF across a Faraday homopolar disk — a conducting disk of radius
 * `R` rotating at angular speed `omega` in a uniform axial magnetic
 * field `B` (field perpendicular to the disk). A charge at radius `r`
 * moves at v = ω·r, and the motional contribution v×B integrated from
 * the centre to the rim gives:
 *
 *   EMF = ½ · B · ω · R²
 *
 * This is steady-state DC — the output EMF between the centre and rim
 * does not oscillate, because the geometry is rotationally symmetric.
 * Faraday built the first one in 1831; modern homopolar generators
 * still use the same geometry for very-high-current, low-voltage
 * applications (rail guns, ship drives). Units: B in tesla, omega in
 * rad/s, R in metres, return in volts.
 */
export function faradayDiskEmf(B: number, omega: number, R: number): number {
  return 0.5 * B * omega * R * R;
}
