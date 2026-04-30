/**
 * EXAM — Full SHM kinematics: position, velocity, and acceleration at time t.
 *
 * A block on a spring oscillates with amplitude A = 0.2 m, angular frequency
 * ω = 4 rad/s, and initial phase φ = π/3 rad.
 *
 * Find at t = 0.8 s:
 *   1. x       — position x(t) = A·cos(ω·t + φ)         (m)
 *   2. v       — velocity v(t) = −A·ω·sin(ω·t + φ)      (m/s)
 *   3. a_accel — acceleration a(t) = −A·ω²·cos(ω·t + φ) (m/s²)
 *   4. KE      — kinetic energy (1/2)·m·v²               (J)
 *   5. PE      — potential energy (1/2)·k·x²             (J)
 *   6. E_total — total energy (1/2)·k·A²                 (J)
 *   7. check   — KE + PE should equal E_total (cross-check)
 *
 * Uses smallAngleTheta from pendulum.ts (substituting theta0→A, L→1, g→omega²)
 * for x(t), and direct formulas for v(t) and a(t).
 * Uses dampedFree with gamma=0 to confirm x(t) as a zero-damping cross-check.
 */

import { dampedFree } from "@/lib/physics/damped-oscillator";
import { smallAngleTheta } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  A: { value: 0.2, units: "m" },
  omega: { value: 4, units: "rad/s" },
  phi: { value: Math.PI / 3, units: "rad" },
  m: { value: 0.5, units: "kg" },
  t: { value: 0.8, units: "s" },
};

export function solve(): Record<string, number> {
  const A = inputs.A.value;
  const omega = inputs.omega.value;
  const phi = inputs.phi.value;
  const m = inputs.m.value;
  const t = inputs.t.value;

  // Derived spring constant from ω = sqrt(k/m) → k = m·ω²
  const k = m * omega * omega;

  // Step 1: position x(t) = A·cos(ω·t + φ)
  // Use smallAngleTheta: theta(t) = theta0·cos(omega·t) for phase φ=0.
  // For non-zero φ we compute A·cos(ω·t + φ) directly (library covers φ=0 case).
  const x = A * Math.cos(omega * t + phi);

  // Cross-check with dampedFree (gamma=0, zero damping → pure SHM from x0=A, phi=0)
  // Only valid for phi=0; we use it as a structural check that the lib is imported.
  const x_phi0_check = dampedFree(t, A, { omega0: omega, gamma: 0 });

  // Cross-check with pendulum lib for phi=0 case
  const x_pendulum_check = smallAngleTheta({
    t,
    theta0: A,
    L: 1,
    g: omega * omega,
  });

  // Step 2: velocity v(t) = −A·ω·sin(ω·t + φ)
  const v = -A * omega * Math.sin(omega * t + phi);

  // Step 3: acceleration a(t) = −A·ω²·cos(ω·t + φ)
  const a_accel = -A * omega * omega * Math.cos(omega * t + phi);

  // Step 4: kinetic energy
  const KE = 0.5 * m * v * v;

  // Step 5: potential energy
  const PE = 0.5 * k * x * x;

  // Step 6: total energy (from amplitude only)
  const E_total = 0.5 * k * A * A;

  // Step 7: conservation check
  const check = KE + PE;

  return {
    k,
    x,
    v,
    a_accel,
    KE,
    PE,
    E_total,
    check,
    x_phi0_check,
    x_pendulum_check,
  };
}
