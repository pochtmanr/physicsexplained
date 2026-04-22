/**
 * Diamagnetism and paramagnetism — the two "quiet" regimes of §04.
 *
 * Every ordinary material lives on one side of this split:
 *   • diamagnetism   — a Lenz-induced orbital response that *opposes* the
 *                      applied B; universal, small, negative χ_m.
 *   • paramagnetism  — partial alignment of unpaired spins with B, fought by
 *                      thermal motion; small positive χ_m that follows
 *                      Curie's 1/T law.
 *
 * All helpers are scalar (co-linear with the applied B). SI units throughout.
 */

/**
 * Curie's law: χ = C / T for a paramagnet.
 *
 * Plain words: the susceptibility falls off as 1/T — thermal jitter fights
 * alignment, and at higher T the fight is harder to win. C is the Curie
 * constant, a material-specific number with units of kelvin.
 *
 * Throws if T ≤ 0 (Curie's law is undefined at or below 0 K).
 */
export function curieSusceptibility(
  curieConstant: number,
  temperature: number,
): number {
  if (temperature <= 0) {
    throw new Error("temperature must be positive (kelvin)");
  }
  return curieConstant / temperature;
}

/**
 * Langevin function L(x) = coth(x) − 1/x.
 *
 * The thermal average of cosθ for a classical magnetic moment in a B field at
 * dimensionless x = μB/(kT). L(x) runs from ~x/3 at small x (linear Curie-law
 * regime) to 1 at large x (full saturation). The 1/x term is removable at
 * x = 0 by series expansion, which we handle explicitly to avoid 0/0.
 */
export function langevin(x: number): number {
  if (Math.abs(x) < 1e-6) {
    // L(x) = x/3 − x³/45 + ... — the cubic correction is ≪ 1e-19 for |x| < 1e-6
    return x / 3;
  }
  return 1 / Math.tanh(x) - 1 / x;
}

/**
 * Paramagnetic magnetisation from the classical Langevin model.
 *
 *   M = n · μ · L(μ B / kT)
 *
 * where n is the number density of atomic moments (m⁻³), μ is the per-atom
 * magnetic moment (A·m²), B is the applied field (T), and kT is the thermal
 * energy (J). Returns M in A/m.
 *
 * At low B or high T the argument is small and L(x) ≈ x/3, giving the Curie
 * law M = n μ² B / (3 kT). At very high B or low T, L(x) → 1 and the
 * magnetisation saturates at n·μ.
 *
 * Throws if kT ≤ 0.
 */
export function paramagneticM(
  n: number,
  moment: number,
  B: number,
  kT: number,
): number {
  if (kT <= 0) {
    throw new Error("kT must be positive");
  }
  const x = (moment * B) / kT;
  return n * moment * langevin(x);
}

/**
 * Rough diamagnetic susceptibility (classical Langevin-style estimate):
 *
 *   χ_dia ≈ −μ₀ · n · (e² / m_e) · ⟨r²⟩ / 6
 *
 * Every bound electron "tries" to set up a Lenz-style current loop opposing
 * the applied B; summed over all electrons per atom and all atoms per volume,
 * this gives a small *negative* χ_m. We take (e² / m_e) as a single argument
 * so the caller controls units explicitly.
 *
 * Returns a dimensionless number (always negative for n, ⟨r²⟩, e²/m_e, μ₀ > 0).
 */
export function diamagneticSusceptibility(
  n: number,
  rSquared: number,
  electronChargeSquaredOverMass: number,
  mu0: number,
): number {
  return (-mu0 * n * electronChargeSquaredOverMass * rSquared) / 6;
}
