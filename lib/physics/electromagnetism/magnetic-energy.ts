import { MU_0 } from "@/lib/physics/constants";

/**
 * Energy stored in an inductor carrying current I.
 *
 *   U = ½ L I²
 *
 * Mirror of the capacitor's U = ½CV². The factor of ½ is the give-away
 * that assembling the current was work done against the self-induced EMF.
 * Returns joules (J).
 */
export function inductorEnergy(L: number, I: number): number {
  return 0.5 * L * I * I;
}

/**
 * Magnetic-field energy density at a point where the field magnitude is B.
 *
 *   u = B² / (2 μ₀)
 *
 * Returns J/m³. At B = 1 T, u ≈ 397.9 kJ/m³ — a cubic metre of one-tesla
 * field carries roughly the same energy as a lit 100-W bulb for 17 minutes.
 * This is the magnetic twin of the electric ½ε₀E².
 */
export function magneticEnergyDensity(B: number): number {
  return (B * B) / (2 * MU_0);
}

/**
 * Linear-material energy density.
 *
 *   u = ½ H · B
 *
 * In the linear regime where B = μH, this reduces to B² / (2μ).
 * H and B are taken to be collinear scalars; pass both as magnitudes.
 */
export function magneticEnergyDensityMatter(H: number, B: number): number {
  return 0.5 * H * B;
}

/**
 * Total energy stored in a volume V filled with a uniform magnetic field B.
 *
 *   U = u · V = B² V / (2 μ₀)
 *
 * Returns joules. For a non-uniform field, integrate `magneticEnergyDensity`
 * over space instead.
 */
export function totalFieldEnergy(B: number, volume: number): number {
  return magneticEnergyDensity(B) * volume;
}

/**
 * Back-EMF driven inductor power.
 *
 *   P = L · I · dI/dt = dU/dt
 *
 * The rate at which the source delivers energy into the magnetic field as
 * the current ramps. Integrate P over time to recover ½LI².
 */
export function inductorPower(L: number, I: number, dIdt: number): number {
  return L * I * dIdt;
}
