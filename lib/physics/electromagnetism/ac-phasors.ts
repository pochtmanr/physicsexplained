/**
 * AC circuits, phasors, and complex impedance.
 *
 * The trick that makes alternating-current analysis tractable is to stop
 * thinking of v(t) = V·cos(ωt + φ) as a wiggling real number and start
 * thinking of it as the real projection of a rotating complex phasor
 *   V̂ = V · e^(j(ωt + φ))
 *
 * Once every voltage and current is a rotating phasor, differentiation and
 * integration collapse into multiplication by jω. Resistors, capacitors and
 * inductors become *complex resistances* — impedances — and every circuit
 * law we learned for DC works again, unchanged, provided we work with
 * complex numbers throughout.
 *
 * This module ships a deliberately small, **topic-local** Complex type.
 * It is NOT meant to be a general-purpose complex library; it exists only
 * so the ac-circuits-and-phasors topic can demonstrate impedance as a
 * complex number. Other §06 topics reuse the CircuitCanvas solver's
 * phasor mode instead of this helper.
 */

/**
 * Inline complex number — topic-local to ac-circuits-and-phasors.
 *
 * Electrical engineers write j for √−1 (i is already the symbol for
 * current), so the field convention is impedance Z = R + jX.
 */
export interface Complex {
  re: number;
  im: number;
}

/** Complex addition: (a + jb) + (c + jd) = (a + c) + j(b + d). */
export function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/** Complex multiplication: (a + jb)(c + jd) = (ac − bd) + j(ad + bc). */
export function cmul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * Complex division: (a + jb)/(c + jd) = ((ac + bd) + j(bc − ad)) / (c² + d²).
 * Throws on division by the complex zero.
 */
export function cdiv(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new Error("division by zero in complex");
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
}

/** Magnitude |z| = √(re² + im²). */
export function cabs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

/** Phase arg(z) = atan2(im, re), in radians, range (−π, π]. */
export function cphase(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

/**
 * Impedance of a pure resistor: Z = R + j·0.
 * Voltage and current are always in phase across a resistor.
 */
export function zResistor(R: number): Complex {
  return { re: R, im: 0 };
}

/**
 * Impedance of an ideal capacitor at angular frequency ω:
 *   Z_C = 1/(jωC) = −j/(ωC)
 *
 * Pure imaginary, negative sign: current leads voltage by π/2
 * ("ICE" — I leads E in a Capacitor).
 */
export function zCapacitor(omega: number, C: number): Complex {
  if (omega <= 0 || C <= 0) {
    throw new Error("omega and C must be positive for capacitor impedance");
  }
  return { re: 0, im: -1 / (omega * C) };
}

/**
 * Impedance of an ideal inductor at angular frequency ω:
 *   Z_L = jωL
 *
 * Pure imaginary, positive sign: voltage leads current by π/2
 * ("ELI" — E leads I in an Inductor).
 */
export function zInductor(omega: number, L: number): Complex {
  if (omega <= 0 || L <= 0) {
    throw new Error("omega and L must be positive for inductor impedance");
  }
  return { re: 0, im: omega * L };
}

/**
 * Series impedance sum — the same sum rule as resistors in DC, now with
 * complex arithmetic:
 *   Z_total = Σ Z_i
 *
 * At series resonance (Z_L + Z_C cancels), the imaginary part is zero and
 * |Z| = R — the circuit behaves resistively, current is maximum, and the
 * phase angle between applied voltage and current is zero.
 */
export function zSeries(zs: Complex[]): Complex {
  return zs.reduce(cadd, { re: 0, im: 0 });
}

/**
 * Power factor: cos(φ) = Re(Z) / |Z|.
 *
 *   = 1 for a pure resistor (φ = 0)
 *   = 0 for a pure inductor or capacitor (φ = ±π/2)
 *
 * Industrial consumers are billed on their power factor because a load
 * with cos(φ) = 0.8 draws 25% more current than one with cos(φ) = 1.0
 * for the same real power — and that excess current heats transmission
 * lines for no useful work at the customer end.
 */
export function powerFactor(Z: Complex): number {
  const mag = cabs(Z);
  if (mag === 0) throw new Error("power factor undefined for zero impedance");
  return Z.re / mag;
}

/**
 * Average real power delivered to an AC load:
 *   P_avg = V_rms · I_rms · cos(φ)
 *
 * The factor cos(φ) is why three 100 W lightbulbs in series with three
 * different loads (R, R+L, R+C) all driven by the same rms voltage light
 * up at three different brightnesses. Only the resistive component of the
 * impedance dissipates heat — the reactive component shuttles energy back
 * and forth between source and field twice per cycle and returns it.
 */
export function averagePower(Vrms: number, Irms: number, phi: number): number {
  return Vrms * Irms * Math.cos(phi);
}

/**
 * Resonant angular frequency of a series LC branch:
 *   ω₀ = 1 / √(LC)
 *
 * At ω = ω₀ the inductor and capacitor impedances are exact negatives of
 * each other, so the series combination is purely resistive. Radio
 * receivers use this to pick one station out of the ether: tune C until
 * ω₀ matches the carrier you want, and the rest of the spectrum is
 * invisible to the circuit.
 */
export function resonantOmega(L: number, C: number): number {
  if (L <= 0 || C <= 0) throw new Error("L and C must be positive");
  return 1 / Math.sqrt(L * C);
}
