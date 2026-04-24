/**
 * Synchrotron radiation — §10.4.
 *
 * A relativistic charged particle forced onto a circular orbit by a transverse
 * magnetic field radiates. The relativistic Larmor formula for circular motion
 * (velocity ⟂ acceleration) is
 *
 *     P  =  q² c · β⁴ γ⁴ / (6π ε₀ R²)
 *
 * where β = v/c, γ = 1/√(1−β²), and R is the instantaneous radius of
 * curvature. For electrons on a storage-ring dipole bend, R is the bend radius
 * of the magnet.
 *
 * Relativistic beaming collapses the emission pattern from the non-relativistic
 * sin²θ "doughnut" into a narrow forward cone of half-angle
 *
 *     Δθ  ≈  1/γ
 *
 * measured from the instantaneous velocity direction. At γ = 10⁴ (typical
 * 3rd-generation light source), Δθ ≈ 100 μrad — narrower than a laser pointer.
 *
 * The emitted spectrum is broadband, extending up to a sharp exponential cutoff
 * at the critical frequency
 *
 *     ω_c  =  (3/2) · γ³ · c / R
 *
 * and is described by a universal spectral function F(x) with x = ω/ω_c. The
 * two asymptotic regimes are:
 *
 *     F(x) ≈ 2.15 · x^(1/3)           for x ≪ 1  (soft tail, ω^(1/3) law)
 *     F(x) ≈ 1.25 · √x · exp(−x)      for x ≫ 1  (exponential cutoff)
 *
 * smoothly interpolated in between. The accurate closed form uses the modified
 * Bessel function K_(5/3); the two asymptotic pieces above are adequate for
 * visualisation and for the tests and plots in this topic.
 *
 * Forward-direction intensity is boosted by roughly γ² on-axis, and the boost
 * falls off once the viewing angle θ exceeds the 1/γ cone half-angle. As a
 * rotating relativistic charge sweeps its cone past a distant observer, the
 * steady orbit is seen as a train of short pulses — the same mechanism that
 * produces pulsar lighthouse-flashes. Full Lorentz-boost geometry belongs to
 * §11; the minimal inline here is enough to carry this topic.
 *
 * Kernel contents:
 *   - synchrotronPower(q, v, R)            — relativistic Larmor for circular motion.
 *   - emissionConeHalfAngleRad(gamma)      — Δθ = 1/γ.
 *   - criticalFrequency(gamma, R)          — ω_c = (3/2) γ³ c / R.
 *   - syncSpectrumShape(x)                 — universal F(ω/ω_c) with asymptotic fits.
 *   - relativisticDopplerBoost(gamma, θ)   — forward intensity boost factor.
 */

import { EPSILON_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Total power radiated by a charge `q` (coulombs) moving in a circle at speed
 * `v` (m/s) with radius `radius` (m), in the relativistic regime:
 *
 *     P  =  q² c · β⁴ γ⁴ / (6π ε₀ R²)
 *
 * where β = v/c and γ = 1/√(1−β²). Equivalent to the non-relativistic Larmor
 * formula q²a²/(6πε₀c³) with a = v²/R times the relativistic enhancement γ⁴
 * that applies for velocity perpendicular to acceleration.
 *
 * Rejects speeds ≥ c (unphysical for a massive charge) and non-positive radii.
 */
export function synchrotronPower(
  q: number,
  v: number,
  radius: number,
): number {
  if (!Number.isFinite(q)) {
    throw new Error("synchrotronPower: q must be finite");
  }
  if (!Number.isFinite(v)) {
    throw new Error("synchrotronPower: v must be finite");
  }
  if (!(radius > 0)) {
    throw new Error("synchrotronPower: radius must be > 0");
  }
  const beta = v / SPEED_OF_LIGHT;
  if (!(Math.abs(beta) < 1)) {
    throw new Error("synchrotronPower: |v| must be < c");
  }
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const beta4 = beta * beta * beta * beta;
  const gamma4 = gamma * gamma * gamma * gamma;
  return (
    (q * q * SPEED_OF_LIGHT * beta4 * gamma4) /
    (6 * Math.PI * EPSILON_0 * radius * radius)
  );
}

/**
 * Half-angle of the forward emission cone of synchrotron radiation, in radians:
 *
 *     Δθ  ≈  1/γ
 *
 * Measured from the instantaneous velocity direction of the emitting charge.
 * This is the headline collimation result — at γ = 10⁴ the cone is ~100 μrad.
 *
 * Rejects γ < 1 (a Lorentz factor below unity is unphysical for a massive
 * particle) and non-finite inputs.
 */
export function emissionConeHalfAngleRad(gamma: number): number {
  if (!Number.isFinite(gamma)) {
    throw new Error("emissionConeHalfAngleRad: gamma must be finite");
  }
  if (!(gamma >= 1)) {
    throw new Error("emissionConeHalfAngleRad: gamma must be ≥ 1");
  }
  return 1 / gamma;
}

/**
 * Critical (synchrotron) frequency in rad/s:
 *
 *     ω_c  =  (3/2) · γ³ · c / R
 *
 * The spectrum is essentially flat in shape up to ω_c (with a slow ω^(1/3)
 * rise at the soft end) and falls off exponentially above it. At γ = 10⁴ and
 * R = 10 m, ω_c ≈ 4.5 × 10¹⁹ rad/s — the hard-X-ray / gamma regime.
 */
export function criticalFrequency(gamma: number, radius: number): number {
  if (!Number.isFinite(gamma)) {
    throw new Error("criticalFrequency: gamma must be finite");
  }
  if (!(gamma >= 1)) {
    throw new Error("criticalFrequency: gamma must be ≥ 1");
  }
  if (!(radius > 0)) {
    throw new Error("criticalFrequency: radius must be > 0");
  }
  return (1.5 * gamma * gamma * gamma * SPEED_OF_LIGHT) / radius;
}

/**
 * Universal synchrotron spectral function F(x) at x = ω / ω_c. Dimensionless.
 *
 * Uses the two asymptotic forms
 *
 *     F_low(x)   = 2.15 · x^(1/3)           (x ≪ 1)
 *     F_high(x)  = 1.25 · √x · exp(−x)      (x ≫ 1)
 *
 * smoothly interpolated by a weighted average in log-space so the transition
 * near x ~ 1 is continuous and monotone after the peak. Peak is near x ≈ 0.29,
 * consistent with the full Bessel-integral form. Accurate enough for plotting
 * and for the tests in this topic, which check the asymptotic regimes to 5%.
 */
export function syncSpectrumShape(xNormalized: number): number {
  if (!Number.isFinite(xNormalized)) {
    throw new Error("syncSpectrumShape: xNormalized must be finite");
  }
  if (xNormalized <= 0) return 0;
  // Both forms carry the exponential cutoff so the low-form tail dies off
  // correctly for x ≫ 1. For x ≪ 1 the cutoff is ≈ 1 and the x^(1/3) law is
  // exact. For x ≫ 1 the low form decays at the same rate as the high form
  // but with the wrong prefactor, so we weight them by a steep logistic in
  // log(x) that selects the high form once x crosses unity.
  const cutoff = Math.exp(-xNormalized);
  const lowForm = 2.15 * Math.cbrt(xNormalized) * cutoff;
  const highForm = 1.25 * Math.sqrt(xNormalized) * cutoff;
  const logx = Math.log(xNormalized);
  const wHigh = 1 / (1 + Math.exp(-5 * logx));
  return lowForm * (1 - wHigh) + highForm * wHigh;
}

/**
 * Forward-direction relativistic intensity boost factor as a function of
 * viewing angle θ (radians) measured from the instantaneous velocity:
 *
 *     D(θ)  ≈  γ² / (1 + (γθ)²)²
 *
 * A compact Doppler-beaming approximation. On-axis (θ = 0) it returns exactly
 * γ², which is the well-known forward-boost factor for radiation pattern
 * intensity of a relativistic charge. Falls off as a Lorentzian in γθ, with
 * the characteristic angular width Δθ ≈ 1/γ recovered as the half-maximum
 * half-width. Full Lorentz-boost treatment belongs to §11.
 */
export function relativisticDopplerBoost(
  gamma: number,
  thetaRad: number,
): number {
  if (!Number.isFinite(gamma)) {
    throw new Error("relativisticDopplerBoost: gamma must be finite");
  }
  if (!(gamma >= 1)) {
    throw new Error("relativisticDopplerBoost: gamma must be ≥ 1");
  }
  if (!Number.isFinite(thetaRad)) {
    throw new Error("relativisticDopplerBoost: thetaRad must be finite");
  }
  const u = gamma * thetaRad;
  const denom = 1 + u * u;
  return (gamma * gamma) / (denom * denom);
}
