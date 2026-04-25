import { ELEMENTARY_CHARGE, H_BAR, PLANCK_CONSTANT } from "@/lib/physics/constants";

/**
 * Aharonov-Bohm phase for a charge q traversing a closed loop enclosing magnetic flux Φ_B.
 *   Φ_AB = (q/ℏ) ∮ A·dℓ = (q/ℏ) Φ_B
 * The phase is gauge-invariant in detail (the loop integral of a pure-gauge ∂_μΛ
 * vanishes). Returns the phase in radians.
 */
export function aharonovBohmPhase(charge: number, fluxEnclosed: number): number {
  return (charge * fluxEnclosed) / H_BAR;
}

/**
 * Magnetic flux quantum Φ_0 = h / |q|. For an electron (q = e) this is the
 * superconducting flux quantum Φ_0 = h/e ≈ 4.14×10^{−15} Wb (Cooper-pair version
 * uses 2e in the denominator, halving it). Adding Φ_0 to the enclosed flux
 * shifts the AB phase by 2π — the fringe pattern returns to the original position.
 */
export function fluxQuantum(charge: number): number {
  return PLANCK_CONSTANT / Math.abs(charge);
}

/**
 * Two-slit interference pattern intensity I(x) on a screen at distance L,
 * with slit spacing d, electron de Broglie wavelength λ, and an additional
 * relative phase shift φ between the two paths (the AB phase).
 *
 *   I(x) = I_0 · 4 cos²(π d x / (λ L) + φ/2)
 *
 * Up to overall normalization. Returns a callable I(x) for ergonomic use in scenes.
 */
export function interferencePattern(
  slitSpacing: number,
  screenDistance: number,
  wavelength: number,
  phaseShift: number,
): (x: number) => number {
  const k = (Math.PI * slitSpacing) / (wavelength * screenDistance);
  return (x: number) => {
    const arg = k * x + phaseShift / 2;
    const c = Math.cos(arg);
    return 4 * c * c;
  };
}

/**
 * Convenience: AB phase shift expressed in units of the flux quantum Φ_0,
 * so callers can drive a slider in Φ_0 units and feed the result into
 * interferencePattern's phaseShift argument.
 */
export function abPhaseFromFluxRatio(fluxRatio: number, charge: number): number {
  // Φ_AB = (q/ℏ)·(fluxRatio·Φ_0) = (q/ℏ)·fluxRatio·(h/q) = fluxRatio·2π
  void charge;
  return fluxRatio * 2 * Math.PI;
}

export { ELEMENTARY_CHARGE };
