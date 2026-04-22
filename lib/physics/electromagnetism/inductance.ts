/**
 * Self- and mutual-inductance (FIG.23, §05).
 *
 * Self-inductance `L` is the proportionality constant between the magnetic
 * flux a coil threads through itself and the current it carries:
 *
 *   Φ_self = L · I            (definition of L)
 *   EMF    = −L · dI/dt       (Faraday's law applied to the self-flux)
 *
 * The minus sign is Lenz's law: the induced EMF opposes the *change* in
 * current. A rising current in a coil is met by a back-EMF that pushes
 * against it — that is why a coil "resists its own changing current."
 * The SI unit is the henry (V·s/A), named after Joseph Henry, who
 * discovered induction around the same time as Faraday and published late.
 *
 * Mutual inductance `M` applies when a current in coil 1 threads flux
 * through coil 2:
 *
 *   Φ_21 = M · I_1            (definition of M)
 *   EMF_2 = −M · dI_1/dt
 *
 * Every transformer, NFC chip, and induction-motor primary uses M.
 *
 * For geometry this module exposes the closed-form solenoid and toroid
 * self-inductances, the mutual inductance of concentric solenoids, and
 * the RL time constant τ = L/R with the current-rise expression
 * I(t) = (V/R)·(1 − e^(−t/τ)).
 */

import { MU_0 } from "@/lib/physics/constants";

/**
 * Self-inductance of a long solenoid:
 *
 *   L = μ₀ · N² · A / ℓ
 *
 * Derivation: a current `I` through `N` turns produces an interior field
 * `B = μ₀ · (N/ℓ) · I` (the §03 solenoid formula). The flux through one
 * turn is `B · A`; the total flux linkage through all `N` turns is
 * `N · B · A = μ₀·N²·A·I/ℓ`. Dividing by `I` gives `L`.
 *
 * Units: `area` in m², `length` in m, returned `L` in henrys (V·s/A).
 */
export function solenoidSelfInductance(
  N: number,
  area: number,
  length: number,
): number {
  if (length <= 0) {
    throw new Error(
      `solenoidSelfInductance: length must be positive (got ${length}).`,
    );
  }
  if (area < 0) {
    throw new Error(
      `solenoidSelfInductance: area must be non-negative (got ${area}).`,
    );
  }
  return (MU_0 * N * N * area) / length;
}

/**
 * Self-inductance of a toroid of rectangular cross-section:
 *
 *   L = μ₀ · N² · h · ln(b/a) / (2π)
 *
 * where `a` is the inner radius, `b` is the outer radius, and `h` is the
 * height of the rectangular cross-section. Derived by integrating the
 * 1/r toroidal field (§03) over the cross-section.
 *
 * Units: `h`, `a`, `b` in m, returned `L` in henrys.
 */
export function toroidSelfInductance(
  N: number,
  h: number,
  a: number,
  b: number,
): number {
  if (a <= 0 || b <= a) {
    throw new Error(
      `toroidSelfInductance: require 0 < a < b (got a=${a}, b=${b}).`,
    );
  }
  if (h <= 0) {
    throw new Error(`toroidSelfInductance: h must be positive (got ${h}).`);
  }
  return (MU_0 * N * N * h * Math.log(b / a)) / (2 * Math.PI);
}

/**
 * Self-induced EMF across an inductor whose current is changing at rate
 * `dI/dt`:
 *
 *   EMF = −L · dI/dt
 *
 * The sign is the essential physics: if the current is rising (dI/dt > 0)
 * the EMF is negative — it pushes *against* the rise. If the current is
 * falling, the EMF is positive — it pushes to keep the current going. A
 * coil is an electrical flywheel.
 *
 * Units: `L` in henrys, `dIdt` in A/s, return in volts.
 */
export function selfInducedEmf(L: number, dIdt: number): number {
  return -L * dIdt;
}

/**
 * Mutual inductance of two concentric (coaxial) solenoids, primary with
 * `n1` turns per metre carrying current `I_1`, secondary of `N2` total
 * turns wound inside (so it sees only the interior field of the primary):
 *
 *   M = μ₀ · n1 · N2 · A_inner
 *
 * where `A_inner` is the cross-sectional area of the inner (secondary)
 * coil. Derivation: the primary's interior field is `B = μ₀·n1·I_1`; the
 * flux through one secondary turn is `B · A_inner`; the linkage through
 * all `N2` turns is `N2 · B · A_inner`, and `M = Φ_21 / I_1`.
 *
 * Units: `n1` in turns/m, `areaInner` in m², return in henrys.
 */
export function concentricSolenoidMutual(
  n1: number,
  N2: number,
  areaInner: number,
): number {
  if (areaInner < 0) {
    throw new Error(
      `concentricSolenoidMutual: areaInner must be non-negative (got ${areaInner}).`,
    );
  }
  return MU_0 * n1 * N2 * areaInner;
}

/**
 * RL time constant:
 *
 *   τ = L / R
 *
 * The characteristic timescale over which current in a series RL circuit
 * rises to its steady-state value (or decays to zero after the source is
 * disconnected). Bigger L or smaller R → slower response.
 *
 * Units: `L` in henrys, `R` in ohms, return in seconds.
 */
export function rlTimeConstant(L: number, R: number): number {
  if (R <= 0) {
    throw new Error(`rlTimeConstant: R must be positive (got ${R}).`);
  }
  return L / R;
}

/**
 * Current in an RL circuit switched onto a constant EMF `V` at `t = 0`
 * with zero initial current:
 *
 *   I(t) = (V/R) · (1 − e^(−t/τ)),   τ = L/R
 *
 * At `t = 0` the current is zero; at `t = τ` it has reached 63.2 % of its
 * asymptotic value `V/R`; at `t = 3τ` it is within 5 % of the asymptote;
 * it never quite reaches `V/R` in finite time. The "never quite" is the
 * phenomenological fingerprint of self-inductance.
 *
 * Units: `V` in volts, `R` in ohms, `L` in henrys, `t` in seconds, return
 * in amperes.
 */
export function rlCurrent(
  V: number,
  R: number,
  L: number,
  t: number,
): number {
  const tau = rlTimeConstant(L, R);
  return (V / R) * (1 - Math.exp(-t / tau));
}
