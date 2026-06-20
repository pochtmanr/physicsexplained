/**
 * §47 THE NO-HAIR THEOREM — pure-TS helpers.
 *
 * The no-hair theorem (Israel 1967, Carter 1971, Robinson 1975; the slogan is
 * Wheeler's) states that a stationary, asymptotically flat black hole in general
 * relativity is fixed completely by exactly three externally observable numbers:
 *
 *   • the mass M,
 *   • the angular momentum J  (equivalently the spin a = J / (M c)),
 *   • the electric charge Q.
 *
 * Everything else about the collapsing star — its chemical composition, its
 * lumps and mountains, its magnetic field, the shape of its multipole moments —
 * is radiated away as gravitational and electromagnetic waves during collapse.
 * What is left is a Kerr–Newman black hole, smooth and bald.
 *
 * A sharp consequence is that ALL the higher gravitational multipole moments of
 * the final hole are not free: they are locked to (M, J) by the Geroch–Hansen
 * relation. For a Kerr black hole the mass multipoles M_ℓ and current multipoles
 * S_ℓ obey
 *
 *   M_ℓ + i S_ℓ = M (i a)^ℓ ,        a = J / (M c).
 *
 * So M_0 = M, S_1 = J = M a, the mass quadrupole M_2 = −M a², and so on. A
 * generic relativistic star has an independent quadrupole; a black hole's is
 * pinned. Measuring M_2 and comparing it to −M a² is a clean experimental test
 * of the theorem ("testing the Kerr hypothesis").
 *
 * The non-trivial structure (the "hair") that a perturbed black hole sheds does
 * so as a superposition of damped sinusoids — the QUASINORMAL MODES of the final
 * hole. Each mode (ℓ, m, n) has a complex frequency ω = ω_R − i / τ: a ringing
 * frequency ω_R and a damping time τ. For the dominant (ℓ=m=2, n=0) mode of a
 * Kerr hole, fitting formulas (Berti–Cardoso–Will 2006) give good few-percent
 * approximations in terms of (M, a) alone — which is the whole point: the
 * ringdown spectrum is a fingerprint of just two numbers.
 *
 * This file is React-free and dependency-free. Frequencies are returned in
 * geometrized units (G = c = 1, lengths/times in units of M) unless a routine
 * explicitly converts to SI using a supplied mass.
 */

/** Clamp a dimensionless Kerr spin a* = a/M = cJ/(GM²) into the physical range
 *  [0, 1). Values ≥ 1 would describe a naked singularity (no horizon), which
 *  cosmic censorship forbids for astrophysical collapse; negatives flip the
 *  sense of rotation, so we fold them. We cap strictly below 1 (0.9999) because
 *  several fitting formulas have an (1 − a*) factor that must stay positive. */
export function clampSpin(aStar: number): number {
  if (!Number.isFinite(aStar)) return 0;
  const a = Math.abs(aStar);
  return a >= 1 ? 0.9999 : a;
}

/** Outer event-horizon radius r_+ = M + √(M² − a²), in units of M.
 *  2M for Schwarzschild (a* = 0), shrinking to M at extremality. */
export function outerHorizonRadius(aStar: number): number {
  const a = clampSpin(aStar);
  return 1 + Math.sqrt(1 - a * a);
}

/**
 * Kerr mass multipole moment M_ℓ in geometrized units (M = 1), from the
 * Geroch–Hansen relation M_ℓ + i S_ℓ = M (i a)^ℓ.
 *
 * Mass moments are the REAL part of M (i a)^ℓ → non-zero only for even ℓ:
 *   M_0 =  1            (the mass itself)
 *   M_2 = −a²           (the mass quadrupole — oblateness from spin)
 *   M_4 =  a⁴           ...
 * Odd-ℓ mass moments vanish (a Kerr hole is reflection-symmetric).
 */
export function kerrMassMultipole(aStar: number, ell: number): number {
  const a = clampSpin(aStar);
  if (ell < 0 || !Number.isInteger(ell)) return NaN;
  if (ell % 2 !== 0) return 0; // odd mass moments vanish
  // Re[(i a)^ℓ] for even ℓ = (−1)^{ℓ/2} a^ℓ
  return Math.pow(-1, ell / 2) * Math.pow(a, ell);
}

/**
 * Kerr current multipole moment S_ℓ in geometrized units (M = 1), the IMAGINARY
 * part of M (i a)^ℓ → non-zero only for odd ℓ:
 *   S_1 =  a            (the spin angular momentum J = M a)
 *   S_3 = −a³           ...
 * Even-ℓ current moments vanish.
 */
export function kerrCurrentMultipole(aStar: number, ell: number): number {
  const a = clampSpin(aStar);
  if (ell < 0 || !Number.isInteger(ell)) return NaN;
  if (ell % 2 === 0) return 0; // even current moments vanish
  // Im[(i a)^ℓ] for odd ℓ = (−1)^{(ℓ−1)/2} a^ℓ
  return Math.pow(-1, (ell - 1) / 2) * Math.pow(a, ell);
}

/**
 * The dimensionless quadrupole parameter that "testing the Kerr hypothesis"
 * targets: q = M_2 / M³ × (something). We expose the clean ratio
 *
 *   κ_Kerr(a*) = M_2 / (M a²) = −1  for a Kerr black hole.
 *
 * A generic compact star instead has M_2 = −q M a² with q ≠ 1 (q ≈ 2–14 for
 * realistic neutron-star equations of state). Returning the Kerr prediction
 * (always −1) lets a scene contrast "black hole" against a slider-controlled
 * stellar q. Spin a* enters only through clamping. */
export function kerrQuadrupoleRatio(aStar: number): number {
  clampSpin(aStar); // validate / fold; result is spin-independent for Kerr
  return -1;
}

/**
 * Real ringdown (quasinormal-mode) frequency of the dominant ℓ=m=2, n=0 mode
 * of a Kerr black hole, in geometrized units (M ω_R, with G = c = M = 1).
 *
 * Uses the Berti–Cardoso–Will (2006) fit  M ω_R = f1 + f2 (1 − a*)^f3  with the
 * tabulated 2,2,0 coefficients. Accurate to better than ~1% across 0 ≤ a* < 1.
 *   • Schwarzschild (a* = 0):  M ω_R ≈ 0.3737
 *   • extremal     (a* → 1):   M ω_R → 1/2  (the mode frequency approaches mΩ_H)
 */
export function ringdownFrequencyDimensionless(aStar: number): number {
  const a = clampSpin(aStar);
  const f1 = 1.5251;
  const f2 = -1.1568;
  const f3 = 0.1292;
  return f1 + f2 * Math.pow(1 - a, f3);
}

/**
 * Quality factor Q of the dominant ℓ=m=2, n=0 quasinormal mode, dimensionless.
 * Berti–Cardoso–Will fit  Q = q1 + q2 (1 − a*)^q3. Q = π ω_R τ relates the
 * ringing frequency to the damping time τ (more cycles before silence at high
 * spin). Schwarzschild Q ≈ 0.70 (~2 visible cycles); near-extremal Q ≫ 1. */
export function ringdownQualityFactor(aStar: number): number {
  const a = clampSpin(aStar);
  const q1 = 0.7;
  const q2 = 1.4187;
  const q3 = -0.499;
  return q1 + q2 * Math.pow(1 - a, q3);
}

/**
 * Damping time τ of the dominant ringdown mode, in units of M (geometrized).
 * From Q = π ω_R τ  ⇒  τ = Q / (π ω_R). The signal decays as e^{−t/τ}; after a
 * few τ the hole is silent and bald. */
export function ringdownDampingTimeDimensionless(aStar: number): number {
  const omegaR = ringdownFrequencyDimensionless(aStar);
  const Q = ringdownQualityFactor(aStar);
  return Q / (Math.PI * omegaR);
}

/** Geometric time unit  t_M = G M / c³  in seconds for a hole of mass M (solar
 *  masses). t_M ≈ 4.9255 µs per solar mass. Converts dimensionless ringdown
 *  quantities (in units of M) to SI. */
export function geometricTimeSeconds(massSolar: number): number {
  const T_SUN = 4.92549094e-6; // G M_sun / c³ in seconds
  return T_SUN * massSolar;
}

/**
 * Ringdown frequency in Hz for a Kerr hole of mass `massSolar` (in solar
 * masses) and spin a*. f = ω_R / (2π) = (M ω_R) / (2π t_M).
 *   • A 62 M_⊙ remnant (GW150914) at a* ≈ 0.67 rings near ~250 Hz — right in
 *     LIGO's band, which is why ringdown is observable. */
export function ringdownFrequencyHz(massSolar: number, aStar: number): number {
  const MomegaR = ringdownFrequencyDimensionless(aStar);
  const tM = geometricTimeSeconds(massSolar);
  return MomegaR / (2 * Math.PI * tM);
}

/** Ringdown damping time in seconds for a hole of mass `massSolar` and spin a*.
 *  τ_SI = τ(M) × t_M. For GW150914's remnant this is a few milliseconds. */
export function ringdownDampingTimeSeconds(
  massSolar: number,
  aStar: number,
): number {
  return ringdownDampingTimeDimensionless(aStar) * geometricTimeSeconds(massSolar);
}

/**
 * Amplitude envelope of a single ringdown mode at (dimensionless) time t (in
 * units of M):  A(t) = A₀ e^{−t/τ} cos(ω_R t + φ). Pure helper for the scene's
 * waveform. `t`, `tau`, `omegaR` are all in units of M (or all in SI — the
 * formula is unit-agnostic as long as they share units). */
export function ringdownWaveform(
  t: number,
  omegaR: number,
  tau: number,
  amplitude = 1,
  phase = 0,
): number {
  return amplitude * Math.exp(-t / tau) * Math.cos(omegaR * t + phase);
}
