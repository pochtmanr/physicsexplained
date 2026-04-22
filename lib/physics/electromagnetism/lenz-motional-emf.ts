/**
 * Lenz's law + motional EMF.
 *
 * The minus sign in Faraday's law, spelled out. Induced currents always
 * flow in the sense that opposes the change in flux that created them.
 * For a straight conductor of length L moving at speed v perpendicular
 * to a uniform magnetic field B, the charges inside feel a Lorentz force
 * F = qv × B that pushes them along the rod. The resulting EMF between
 * the rod's ends is BLv — the cleanest, lowest-calculus derivation of
 * induction in the book.
 *
 * All functions are pure and stateless. SI units throughout.
 */

/**
 * Motional EMF across a straight rod of length L moving at speed v
 * perpendicular to a uniform magnetic field of magnitude B.
 *
 *   EMF = B · L · v
 *
 * Derived directly from F = qv × B: each charge in the rod feels a force
 * of magnitude qvB along the rod, so the work per unit charge over the
 * rod's length is vBL. Matches Faraday's EMF = −dΦ/dt when the only thing
 * changing is the loop area.
 */
export function motionalEmf(B: number, L: number, v: number): number {
  return B * L * v;
}

/**
 * Rod-on-rails dynamics. A conducting rod of length L slides at speed v
 * along two parallel rails in a uniform field B. The circuit closes through
 * a resistance R. Returns the instantaneous induced current and the
 * magnetic force on the rod.
 *
 *   I     = B · L · v / R
 *   F_mag = −B · I · L   = −B²L²v / R
 *
 * F_mag is the force the external field exerts on the current-carrying
 * rod (F = IL × B). The sign is negative: it always opposes v. This is
 * Lenz's law in its most physical form — the induced current is set up
 * precisely so that the field it lives in pushes the rod backwards.
 */
export function slidingRodDynamics(
  B: number,
  L: number,
  v: number,
  R: number,
): { I: number; F_mag: number } {
  if (R <= 0) throw new Error("R must be positive");
  const I = (B * L * v) / R;
  const F_mag = -B * I * L;
  return { I, F_mag };
}

/**
 * Terminal velocity of a rod-on-rails dragged by a constant external force
 * F_ext. At terminal velocity, the magnetic retarding force exactly cancels
 * the applied force:  F_ext = B²L²v / R  →  v_term = F_ext · R / (B²L²).
 *
 * This is the principle behind every eddy-current brake: the faster the
 * rotor spins, the bigger the Lenz-induced current, the stronger the
 * retarding force. The system is self-limiting.
 */
export function terminalVelocity(
  F_ext: number,
  B: number,
  L: number,
  R: number,
): number {
  const denom = B * B * L * L;
  if (denom === 0) throw new Error("B·L must be nonzero");
  return (F_ext * R) / denom;
}

/**
 * Induced EMF in a circular loop of area A sitting in a uniform B(t),
 * with B varying at rate dB/dt. Useful for the jumping-ring demo where
 * an AC primary produces a sinusoidal dB/dt through the ring.
 *
 *   EMF = −A · dB/dt
 *
 * Single-turn. For N turns the reader should scale by N.
 */
export function loopEmfFromDbDt(area: number, dBdt: number): number {
  return -area * dBdt;
}
