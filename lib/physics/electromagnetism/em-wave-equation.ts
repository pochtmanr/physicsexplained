/**
 * Deriving the EM wave equation — §08.1.
 *
 * Maxwell's four equations in vacuum (ρ = 0, J = 0):
 *
 *   ∇·E = 0                         (Gauss)
 *   ∇·B = 0                         (Gauss, magnetic)
 *   ∇×E = -∂B/∂t                    (Faraday)
 *   ∇×B = μ₀ε₀ · ∂E/∂t              (Ampère–Maxwell)
 *
 * Take the curl of Faraday's law:
 *
 *   ∇×(∇×E) = -∂/∂t (∇×B) = -μ₀ε₀ · ∂²E/∂t²
 *
 * Use the BAC–CAB identity for the left side:
 *
 *   ∇×(∇×E) = ∇(∇·E) - ∇²E = -∇²E      (because ∇·E = 0 in vacuum)
 *
 * Equate the two:
 *
 *   ∇²E - μ₀ε₀ · ∂²E/∂t² = 0
 *
 * which is a wave equation with phase velocity c = 1/√(μ₀ε₀). The same
 * derivation, starting from the curl of Ampère–Maxwell, gives the twin
 * equation for B. Both fields ride the same ripple at the same speed.
 *
 * Plugging in the CODATA values of μ₀ and ε₀ — both measured in experiments
 * that had nothing to do with optics — gives 2.998 × 10⁸ m/s, which is
 * exactly the speed of light. Maxwell's 1862 inference: light IS an
 * electromagnetic wave.
 *
 * This module exports:
 *   - speedOfLight() — returns 1/√(μ₀ε₀) from first principles.
 *   - planeWaveE(x, t, k, ω, E₀) — scalar amplitude of a plane E-wave.
 *   - planeWaveB(x, t, k, ω, E₀) — scalar amplitude of the co-travelling
 *     B-wave, with B = E/c for a transverse plane wave in vacuum.
 *   - waveEquationResidual(E_fn, x, t, dx, dt) — numerical check that any
 *     scalar field E(x,t) satisfies ∂²E/∂x² - (1/c²)∂²E/∂t² = 0.
 */

import { EPSILON_0, MU_0 } from "@/lib/physics/constants";

/**
 * Speed of light from the vacuum permittivity and permeability.
 *
 *   c = 1 / √(μ₀ · ε₀)
 *
 * The entire derivation of §08.1 hangs on this identity: the wave equation's
 * propagation speed is 1/√(μ₀ε₀), and when you plug in the numbers — ε₀
 * from Coulomb's law, μ₀ from the ampere-force between wires — you get
 * 299,792,458 m/s. Fizeau had measured that number optically in 1849
 * using a spinning toothed wheel on a Paris-to-Montmartre light path.
 * Maxwell's 1862 match is the single greatest coincidence-that-wasn't in
 * all of physics: the speed of light was hiding inside the laws of
 * electricity and magnetism all along.
 */
export function speedOfLight(): number {
  return 1 / Math.sqrt(MU_0 * EPSILON_0);
}

/**
 * Scalar amplitude of a right-propagating plane E-wave:
 *
 *   E(x, t) = E₀ · cos(k·x - ω·t)
 *
 * For this to be a valid solution of the wave equation in vacuum, the
 * dispersion relation ω = c·k must hold — the caller is responsible for
 * choosing (k, ω) consistent with c = 1/√(μ₀ε₀). `planeWaveE` does not
 * enforce this; it just evaluates the ansatz.
 *
 * Units: x in m, t in s, k in rad/m, ω in rad/s, E₀ in V/m.
 */
export function planeWaveE(
  x: number,
  t: number,
  k: number,
  omega: number,
  E0: number,
): number {
  return E0 * Math.cos(k * x - omega * t);
}

/**
 * Scalar amplitude of the co-travelling plane B-wave.
 *
 * For a transverse plane EM wave in vacuum, B is perpendicular to both E
 * and the propagation direction k̂, in phase with E, and the amplitudes
 * are locked by
 *
 *   |B| = |E| / c
 *
 * This follows from Faraday's law applied to the plane-wave ansatz:
 * -∂B/∂t = ∇×E ⇒ ω·B₀ = k·E₀ ⇒ B₀ = E₀·(k/ω) = E₀/c.
 *
 * So the B-wave rides at the same phase as E, just scaled by 1/c:
 *
 *   B(x, t) = (E₀/c) · cos(k·x - ω·t)
 *
 * Units: same as `planeWaveE` except return is in tesla.
 */
export function planeWaveB(
  x: number,
  t: number,
  k: number,
  omega: number,
  E0: number,
): number {
  const c = speedOfLight();
  return (E0 / c) * Math.cos(k * x - omega * t);
}

/**
 * Finite-difference residual of the 1D wave equation at (x, t):
 *
 *   R = ∂²E/∂x² - (1/c²) · ∂²E/∂t²
 *
 * For a true solution (e.g. E = E₀ cos(k·x - ω·t) with ω = c·k) the
 * residual is identically zero. A central five-point stencil is used for
 * both partials, so the truncation error is O(dx²) + O(dt²).
 *
 * Callers pass a pure function E_fn(x, t) and small spacings dx, dt.
 * Typical usage in the test harness:
 *
 *   const residual = waveEquationResidual(
 *     (x, t) => planeWaveE(x, t, k, omega, E0),
 *     0.5, 1e-9, 1e-3, 1e-12
 *   );
 *   expect(Math.abs(residual / (k * k * E0))).toBeLessThan(1e-4);
 *
 * The residual is normalised by the caller; we do not scale here because
 * the "natural size" of each partial is problem-specific.
 */
export function waveEquationResidual(
  E_fn: (x: number, t: number) => number,
  x: number,
  t: number,
  dx: number,
  dt: number,
): number {
  if (dx <= 0) throw new Error("waveEquationResidual: dx must be > 0");
  if (dt <= 0) throw new Error("waveEquationResidual: dt must be > 0");
  const c = speedOfLight();

  // ∂²E/∂x² via central 2nd difference: (E(x+dx) - 2E(x) + E(x-dx))/dx²
  const d2Edx2 =
    (E_fn(x + dx, t) - 2 * E_fn(x, t) + E_fn(x - dx, t)) / (dx * dx);

  // ∂²E/∂t² via central 2nd difference: (E(t+dt) - 2E(t) + E(t-dt))/dt²
  const d2Edt2 =
    (E_fn(x, t + dt) - 2 * E_fn(x, t) + E_fn(x, t - dt)) / (dt * dt);

  return d2Edx2 - d2Edt2 / (c * c);
}
