/**
 * Transmission lines — distributed-parameter (LC) telegrapher model.
 *
 * A wire pair short enough to be "a wire" is completely described by its
 * endpoint currents and voltages. A wire pair long enough that a signal
 * rise time is comparable to the propagation time across it is NOT — the
 * voltage and current now depend on *where* on the line you measure.
 *
 * Oliver Heaviside reduced this to four parameters per unit length of
 * line:
 *
 *   L  — series inductance per metre  (H/m)
 *   C  — shunt capacitance per metre  (F/m)
 *   R  — series resistance per metre  (Ω/m, ≈ 0 for a good line)
 *   G  — shunt conductance per metre  (S/m, ≈ 0 for a good dielectric)
 *
 * In the lossless limit (R = G = 0) the voltage V(x,t) and current I(x,t)
 * satisfy the telegrapher's equations
 *
 *   ∂V/∂x = −L · ∂I/∂t
 *   ∂I/∂x = −C · ∂V/∂t
 *
 * Differentiate, substitute, and both V and I obey the 1-D wave equation
 * with propagation velocity v = 1/√(LC) and characteristic impedance
 * Z₀ = √(L/C). This file exports the closed-form helpers; the LC-ladder
 * visualisation lives in the scene component.
 */

/**
 * Characteristic impedance of a lossless line.
 *
 *   Z₀ = √(L/C)
 *
 * Units: Ω. For 50 Ω coax, L ≈ 250 nH/m and C ≈ 100 pF/m give
 * √(2.5e-7 / 1e-10) = √2500 = 50 Ω exactly.
 *
 * A line terminated in Z₀ absorbs the incident wave completely — no
 * reflection. Any other termination reflects a fraction Γ back toward
 * the source.
 */
export function characteristicImpedance(
  lPerMeter: number,
  cPerMeter: number,
): number {
  if (lPerMeter <= 0 || cPerMeter <= 0) {
    throw new Error("L and C per metre must be positive");
  }
  return Math.sqrt(lPerMeter / cPerMeter);
}

/**
 * Phase velocity of a signal on a lossless line.
 *
 *   v = 1 / √(L · C)
 *
 * Units: m/s. For an air-dielectric line this approaches c; typical
 * polyethylene coax comes out near 0.66·c because the dielectric slows
 * the wave relative to vacuum.
 */
export function propagationVelocity(
  lPerMeter: number,
  cPerMeter: number,
): number {
  if (lPerMeter <= 0 || cPerMeter <= 0) {
    throw new Error("L and C per metre must be positive");
  }
  return 1 / Math.sqrt(lPerMeter * cPerMeter);
}

/**
 * Propagation delay along a line of given length.
 *
 *   τ = length / v = length · √(LC)
 *
 * Units: seconds. The number that decides whether a line is "long" — if
 * τ is comparable to the rise time of the signal you're pushing, you
 * are in transmission-line territory.
 */
export function propagationDelay(
  lPerMeter: number,
  cPerMeter: number,
  length: number,
): number {
  if (length < 0) throw new Error("length must be non-negative");
  return length / propagationVelocity(lPerMeter, cPerMeter);
}

/**
 * Voltage reflection coefficient at a termination of impedance Z_L on a
 * line of characteristic impedance Z₀.
 *
 *   Γ = (Z_L − Z₀) / (Z_L + Z₀)
 *
 * Dimensionless, ∈ [−1, +1] for passive real loads.
 *   Γ = 0   — matched load (Z_L = Z₀), no reflection.
 *   Γ = +1  — open circuit (Z_L → ∞), full reflection, voltage doubles.
 *   Γ = −1  — short circuit (Z_L = 0), full reflection, voltage inverts.
 *
 * The current reflection coefficient is −Γ (same magnitude, opposite
 * sign) because current reverses when voltage reflects.
 */
export function reflectionCoefficient(zLoad: number, z0: number): number {
  if (z0 <= 0) throw new Error("Z₀ must be positive");
  if (zLoad + z0 === 0) {
    throw new Error("sum of impedances cannot be zero");
  }
  if (!Number.isFinite(zLoad)) {
    // Open-circuit limit.
    return 1;
  }
  return (zLoad - z0) / (zLoad + z0);
}

/**
 * Standing-wave ratio (voltage SWR) from the reflection coefficient.
 *
 *   SWR = (1 + |Γ|) / (1 − |Γ|)
 *
 * Dimensionless, SWR ≥ 1.
 *   SWR = 1    — matched line, flat envelope, no standing wave.
 *   SWR = ∞    — open or short, a pure standing wave, nodes at
 *                fixed positions along the line.
 *
 * Antenna riggers read SWR off a meter in the shack. A 50 Ω rig feeding
 * a 75 Ω cable sees Γ = 0.2 and SWR = 1.5 — borderline acceptable.
 */
export function swr(gamma: number): number {
  const mag = Math.abs(gamma);
  if (mag >= 1) return Infinity;
  return (1 + mag) / (1 - mag);
}

/**
 * Standing-wave voltage envelope |V(x)| on a lossless line driven by a
 * sinusoid of amplitude V₊ at the source, terminated with reflection
 * coefficient Γ.
 *
 * With forward wave V₊·e^{−jβx} and reflected wave Γ·V₊·e^{+jβx}, the
 * magnitude envelope is
 *
 *   |V(x)| = V₊ · √(1 + Γ² + 2Γ·cos(2βx + φ))
 *
 * Here x is measured from the load toward the source. For real Γ (resistive
 * load) φ = 0 if Γ > 0 (open-like) and φ = π if Γ < 0 (short-like).
 *
 *   β = ω / v = 2π / λ  (rad/m)
 *
 * Returns the envelope magnitude at position x metres from the load.
 * Useful for the SWR scene.
 */
export function standingWaveEnvelope(
  forwardAmplitude: number,
  gamma: number,
  beta: number,
  xFromLoad: number,
): number {
  const phi = gamma >= 0 ? 0 : Math.PI;
  const absGamma = Math.abs(gamma);
  const cosTerm = Math.cos(2 * beta * xFromLoad + phi);
  const magSquared =
    1 + absGamma * absGamma + 2 * absGamma * cosTerm;
  // Guard against tiny negative values from floating-point round-off.
  return forwardAmplitude * Math.sqrt(Math.max(0, magSquared));
}

/**
 * Position of the first voltage maximum on a lossless line, measured
 * from the load, given reflection coefficient Γ and wavelength λ.
 *
 * For Γ ≥ 0 (open-like), max is at the load: x = 0.
 * For Γ < 0 (short-like), max is a quarter wavelength in: x = λ/4.
 *
 * Useful as a sanity-check anchor for the standing-wave scene.
 */
export function firstVoltageMaximum(gamma: number, wavelength: number): number {
  if (wavelength <= 0) throw new Error("wavelength must be positive");
  return gamma >= 0 ? 0 : wavelength / 4;
}
