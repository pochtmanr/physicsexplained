/**
 * Series RLC — the two-reservoir oscillator.
 *
 * A capacitor stores energy in its electric field (½ C V²); an inductor
 * stores energy in its magnetic field (½ L I²). Connect them with a wire and
 * the energy sloshes back and forth at a natural angular frequency
 *
 *     ω₀ = 1 / √(LC)
 *
 * Add a resistor and that oscillation bleeds energy into heat. How fast it
 * bleeds — and whether it oscillates at all — is captured by the damping
 * ratio ζ = (R/2)·√(C/L). Three regimes:
 *
 *     ζ > 1   overdamped      — two real exponential decays, no ringing
 *     ζ = 1   critical         — fastest non-oscillatory return to rest
 *     0 < ζ < 1 underdamped   — ringing exponential, damped frequency ω_d
 *     ζ = 0   undamped        — the pure LC tank, rings forever
 *
 * The **quality factor** Q = (1/R)·√(L/C) counts how many radians (≈ Q)
 * or cycles (≈ Q/2π) an underdamped circuit rings before its amplitude drops
 * to 1/e of the initial value. A high-Q tank is a sharp, narrow resonance.
 *
 * The resonance curve's full-width-at-half-power **bandwidth** for a series
 * RLC driven through its response is Δω ≈ R/L = ω₀/Q.
 *
 * All functions are pure TS, SI units throughout (H, F, Ω, rad/s, s, A, V).
 */

/**
 * Resonant (natural) angular frequency of an ideal LC tank.
 *
 *     ω₀ = 1 / √(L·C)     [rad/s]
 *
 * Interpretation: the rate at which energy naturally sloshes between the
 * inductor's B-field and the capacitor's E-field. Radio tuners pick a
 * station by matching their ω₀ to the carrier.
 */
export function resonantFrequency(L: number, C: number): number {
  return 1 / Math.sqrt(L * C);
}

/**
 * Quality factor of a series RLC.
 *
 *     Q = (1/R) · √(L/C) = ω₀ L / R = 1 / (ω₀ R C)
 *
 * Dimensionless. For the driven resonance curve, Q equals the resonant
 * frequency divided by the full-width-at-half-maximum: Q = ω₀ / Δω. In the
 * free (unforced) decay, the amplitude envelope ∝ e^{−α t} with α = R/(2L);
 * the number of radians of oscillation before the envelope drops to 1/e is
 * ω_d / α ≈ Q (for high Q where ω_d ≈ ω₀).
 */
export function qualityFactor(L: number, C: number, R: number): number {
  return (1 / R) * Math.sqrt(L / C);
}

/**
 * −3 dB bandwidth (half-power width) of the series-RLC resonance.
 *
 *     Δω ≈ R / L = ω₀ / Q     [rad/s]
 *
 * The resonance peak is twice this wide (full width at half power). Small R
 * → narrow, sharp peak (high Q). Large R → broad, shallow peak (low Q).
 */
export function bandwidth(L: number, _C: number, R: number): number {
  return R / L;
}

/**
 * Classify a series RLC by its damping regime.
 *
 *   ζ = (R/2) · √(C/L)
 *
 *   R = 0              → "undamped"   — pure LC tank, rings forever
 *   0 < ζ < 1          → "under"      — rings with exponential decay
 *   ζ = 1 (exactly)    → "critical"   — fastest non-oscillatory return
 *   ζ > 1              → "over"       — two real decays, no ringing
 *
 * The critical case is the engineer's target for recoil damping: a door
 * closer, an automotive shock absorber, a meter needle that stops cleanly.
 */
export function dampingRegime(
  R: number,
  L: number,
  C: number,
): "over" | "critical" | "under" | "undamped" {
  if (R === 0) return "undamped";
  const zeta = (R / 2) * Math.sqrt(C / L);
  if (zeta > 1) return "over";
  if (Math.abs(zeta - 1) < 1e-12) return "critical";
  return "under";
}

/**
 * Underdamped series-RLC step response: current I(t) when a voltage V₀ is
 * applied at t = 0 with zero initial conditions.
 *
 *     I(t) = (V₀ / (L ω_d)) · e^{−α t} · sin(ω_d t)
 *
 * with α = R / (2L) and ω_d = √(ω₀² − α²).
 *
 * The response starts at zero (the inductor blocks the instantaneous current
 * step), rises, rings around the steady-state value, and decays into it on
 * the 1/α timescale. If ω₀² ≤ α² the circuit is critically or overdamped
 * and this formula is not physically meaningful; we clamp ω_d's radicand to
 * zero and return a finite value (the critical/overdamped case has a
 * different closed form; callers should branch on `dampingRegime` first).
 */
export function rlcStepResponse(
  V0: number,
  R: number,
  L: number,
  C: number,
  t: number,
): number {
  const alpha = R / (2 * L);
  const w0 = 1 / Math.sqrt(L * C);
  const wd = Math.sqrt(Math.max(0, w0 * w0 - alpha * alpha));
  if (wd === 0) return 0;
  return (V0 / (L * wd)) * Math.exp(-alpha * t) * Math.sin(wd * t);
}

/**
 * Magnitude of the driven-current amplitude in a series RLC excited by
 * V(t) = V₀ sin(ω t).
 *
 *     |I(ω)| = V₀ / |Z(ω)|
 *     Z(ω) = R + j(ωL − 1/(ωC))
 *     |Z(ω)| = √(R² + (ωL − 1/(ωC))²)
 *
 * Peak at ω = ω₀ where the reactive part vanishes and |I| = V₀/R. Returned
 * value has units of amperes if V₀ is in volts and R in ohms.
 */
export function driveAmplitude(
  V0: number,
  R: number,
  L: number,
  C: number,
  omega: number,
): number {
  const reactance = omega * L - 1 / (omega * C);
  const zMag = Math.hypot(R, reactance);
  return V0 / zMag;
}

/**
 * Magnitude of the capacitor-voltage transfer function |V_C / V_in| for a
 * series RLC driven by V_in = V₀ sin(ω t). This is the "bandpass around the
 * capacitor" shape — zero at DC (actually rises from V₀ at ω=0 because the
 * capacitor passes the whole source across itself, so the low-ω limit is 1),
 * peaks slightly above ω₀ for small ζ due to the 1/(ωC) factor, then rolls
 * off as 1/ω² at high ω.
 *
 *     V_C(ω) = V_in · (1/(jωC)) / (R + jωL + 1/(jωC))
 *     |V_C / V_in| = 1 / |1 − ω² LC + j ω R C|
 *
 * At ω = ω₀, |V_C/V_in| = Q. This is the classic "resonant voltage
 * amplification" — the capacitor sees Q times the driving amplitude at
 * resonance. It is why high-Q tanks need low-loss components.
 */
export function capacitorTransferMag(
  R: number,
  L: number,
  C: number,
  omega: number,
): number {
  const re = 1 - omega * omega * L * C;
  const im = omega * R * C;
  return 1 / Math.hypot(re, im);
}
