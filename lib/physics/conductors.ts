import { EPSILON_0 } from "./constants";

/**
 * Electric field magnitude just outside a conductor's surface.
 *
 *   E = σ / ε₀
 *
 * The factor is 1, not 1/2 — this is the conductor case. For an isolated
 * sheet of charge floating in vacuum (no conductor backing it), Gauss's law
 * gives E = σ / (2 ε₀), with the field pointing both ways. A conductor
 * collapses one side of that pillbox: E = 0 inside the metal, so the entire
 * flux comes out of the outside face, and the magnitude doubles. The field
 * is perpendicular to the surface (E_tangential = 0 on a conductor in
 * equilibrium — otherwise free charges along the surface would drift).
 */
export function surfaceFieldFromSigma(sigma: number): number {
  return sigma / EPSILON_0;
}

/**
 * Total induced charge on a conducting plane immersed in a uniform external
 * field — a pedagogical helper for the Faraday-cage intuition.
 *
 * For the field inside the conductor to vanish, induced surface charges must
 * arrange themselves so their own field exactly cancels the applied E_ext
 * inside. On a flat conducting boundary that condition gives a uniform
 * surface density
 *
 *   σ = ε₀ · E_ext
 *
 * (matching the surface-field relation above, run in reverse: the induced
 * sheet must produce E = σ / ε₀ = E_ext to kill the applied field). Total
 * induced charge over an area A is then
 *
 *   Q_ind = σ · A = ε₀ · E_ext · A
 *
 * @param externalField Magnitude of the applied uniform field, V/m.
 * @param area Area of the conducting plane facing the field, m².
 * @returns Magnitude of the induced charge on that face, C.
 */
export function induceChargeOnPlane(
  externalField: number,
  area: number,
): number {
  return EPSILON_0 * externalField * area;
}
