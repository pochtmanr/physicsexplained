/**
 * Waveguides and optical fibers — §09.10.
 *
 * A **step-index optical fiber** is a glass cylinder with two layers: an inner
 * **core** of index n₁ surrounded by a **cladding** of slightly lower index
 * n₂ < n₁. Any ray inside the core whose angle to the side-wall exceeds the
 * critical angle θ_c = arcsin(n₂/n₁) is totally internally reflected and
 * propagates down the length of the fiber forever — "forever" meaning a tenth
 * of a decibel per kilometre at the best telecom wavelengths.
 *
 * The widest off-axis angle the fiber can accept from outside air is
 * parameterised by the **numerical aperture**
 *
 *     NA = √(n₁² − n₂²),      acceptance half-angle θ_a = arcsin(NA)
 *
 * derived from Snell's law at the flat end-face + the TIR condition at the
 * wall. Any ray entering from air with angle ≤ θ_a to the fiber axis will be
 * captured and guided; any ray outside that cone leaks through the cladding
 * within a few bounces.
 *
 * **Rectangular metal waveguides** (microwave / mm-wave) are hollow metal
 * tubes of internal dimensions a × b (a > b, both in metres). Waves inside
 * propagate in discrete **TE_mn modes** — each mode has a sharp **cutoff
 * frequency** below which it cannot transmit at all:
 *
 *     f_c(m, n) = (c/2) · √((m/a)² + (n/b)²)
 *
 * where c ≈ 3·10⁸ m/s is the in-fill propagation speed (free-space c for an
 * air-filled guide; scale by 1/√ε_r for a dielectric-loaded guide). The TE₁₀
 * mode has the lowest cutoff — this is the standard "dominant-mode" operating
 * point of every radar and satellite-uplink feed. WR-90 (a = 22.86 mm,
 * b = 10.16 mm), the X-band workhorse, has f_c(TE₁₀) ≈ 6.56 GHz.
 *
 * **Telecom windows** — the wavelengths where silica fiber attenuation is
 * low enough to matter commercially:
 *
 *   - 850 nm:  short-reach datacenter (multimode VCSEL transceivers)
 *   - 1310 nm: zero-dispersion window of standard single-mode fiber
 *   - 1550 nm: absolute attenuation minimum, ~0.17 dB/km, EDFA gain band
 *
 * The loss curve between them is sculpted by Rayleigh scattering on the short
 * side (α ∝ 1/λ⁴) and IR vibrational absorption on the long side. We model
 * attenuation near each window with a crude Gaussian dip — sufficient for
 * visualisation, not for datasheet accuracy.
 *
 * Cross-link to §06.7 transmission-lines — Heaviside's lumped-LC-ladder model
 * of the telegraph cable is the distributed-circuit ancestor of every
 * waveguide. An undersea telegraph pair is a "two-wire line"; a rectangular
 * pipe is the same idea with perfect conductor boundary conditions forcing
 * transverse modes.
 *
 * Kernel contents:
 *   - numericalAperture(nCore, nClad)   — √(n₁² − n₂²).
 *   - acceptanceConeDeg(na)              — arcsin(NA) · 180/π.
 *   - rectangularCutoff(m, n, a, b, c?)  — TE_mn cutoff frequency in Hz.
 *   - fiberAttenuation(λ, λ₀, αmin, σ)   — Gaussian-dip attenuation model.
 */

/**
 * Numerical aperture of a step-index fiber.
 *
 *   NA = √(n_core² − n_cladding²)
 *
 * Returns 0 when n_core ≤ n_cladding — guiding by TIR is physically impossible
 * and any "acceptance cone" would collapse to a point. No negative NAs, no
 * NaN-producing square roots of negative numbers.
 */
export function numericalAperture(nCore: number, nClad: number): number {
  if (!Number.isFinite(nCore) || !Number.isFinite(nClad)) {
    throw new Error("numericalAperture: nCore and nClad must be finite");
  }
  const diff = nCore * nCore - nClad * nClad;
  if (diff <= 0) return 0;
  return Math.sqrt(diff);
}

/**
 * Acceptance cone half-angle in DEGREES for a fiber with numerical aperture
 * `na`, measured from the fiber axis in ambient air (n ≈ 1).
 *
 *   θ_a = arcsin(NA)
 *
 * Any ray entering the flat end-face at angle ≤ θ_a to the axis is guided;
 * rays outside the cone leak out through the cladding. If NA ≥ 1 (high-index-
 * contrast fibers such as liquid-core or some plastic optical fibers) the
 * cone reaches a full hemisphere and we cap at 90°. Negative NAs are clamped
 * to zero.
 */
export function acceptanceConeDeg(na: number): number {
  if (!Number.isFinite(na)) {
    throw new Error("acceptanceConeDeg: na must be finite");
  }
  if (na <= 0) return 0;
  if (na >= 1) return 90;
  return (Math.asin(na) * 180) / Math.PI;
}

/**
 * Cutoff frequency of the TE_mn mode in a rectangular metal waveguide with
 * internal dimensions `a` × `b` (metres, a > b by convention).
 *
 *   f_c(m, n) = (c / 2) · √((m/a)² + (n/b)²)
 *
 * The speed `c` defaults to the free-space value (2.998·10⁸ m/s). For a guide
 * filled with a dielectric of relative permittivity ε_r, pass
 * c = c₀ / √ε_r; the returned value is still a frequency in Hz.
 *
 * The dominant mode TE₁₀ (f_c = c/(2a)) is the most commonly quoted number
 * and is the lowest-cutoff propagating mode for a > b. Rejects non-positive
 * guide dimensions — there is no mode in a negative-sized box.
 */
export function rectangularCutoff(
  m: number,
  n: number,
  a: number,
  b: number,
  c: number = 2.99792458e8,
): number {
  if (!Number.isFinite(m) || !Number.isFinite(n)) {
    throw new Error("rectangularCutoff: m and n must be finite");
  }
  if (!(a > 0) || !(b > 0)) {
    throw new Error("rectangularCutoff: a and b must be > 0 (metres)");
  }
  if (!(c > 0)) {
    throw new Error("rectangularCutoff: c must be > 0 (propagation speed)");
  }
  const term_m = m / a;
  const term_n = n / b;
  return (c / 2) * Math.sqrt(term_m * term_m + term_n * term_n);
}

/**
 * Crude Gaussian-dip model of fiber attenuation near a telecom window.
 *
 *   α(λ) ≈ α_min · exp( ((λ − λ₀) / σ)² )
 *
 * where σ = `bandwidthNm`, λ₀ = `windowCenterNm`, and α_min = `minAttenuation`
 * (the floor of the curve at the centre of the window, in dB/km).
 *
 * Away from the window the predicted attenuation grows *exponentially*, which
 * is a deliberate overstatement — real fiber attenuation grows as 1/λ⁴
 * (Rayleigh) on one side and exp(−hν/kT)-like on the other. This function is
 * for the telecom-band scene's visual curve, not for link-budget engineering.
 * Returns dB/km as a positive number.
 *
 * Rejects non-positive inputs — cannot take the log of a zero-wavelength
 * photon, and a negative bandwidth makes no physical sense.
 */
export function fiberAttenuation(
  lambdaNm: number,
  windowCenterNm: number,
  minAttenuation: number,
  bandwidthNm: number,
): number {
  if (!(lambdaNm > 0)) {
    throw new Error("fiberAttenuation: lambdaNm must be > 0");
  }
  if (!(windowCenterNm > 0)) {
    throw new Error("fiberAttenuation: windowCenterNm must be > 0");
  }
  if (!(bandwidthNm > 0)) {
    throw new Error("fiberAttenuation: bandwidthNm must be > 0");
  }
  if (!(minAttenuation >= 0)) {
    throw new Error("fiberAttenuation: minAttenuation must be ≥ 0");
  }
  const z = (lambdaNm - windowCenterNm) / bandwidthNm;
  return minAttenuation * Math.exp(z * z);
}
