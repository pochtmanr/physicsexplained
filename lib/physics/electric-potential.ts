import { K_COULOMB } from "./constants";
import type { Charge, Vec2 } from "./coulomb";

export type { Charge, Vec2 } from "./coulomb";

/**
 * Electric potential at a point due to a collection of source charges.
 *
 *   V(r) = k · Σ q_i / |r − r_i|
 *
 * V is a scalar — there's no vector to track, just a number per point. The
 * sum is over all sources; each contribution is the source's charge divided
 * by its distance to the field point, then multiplied by Coulomb's constant.
 *
 * Convention: the zero of potential is at infinity. A positive source charge
 * produces a positive potential everywhere finite; a negative source produces
 * a negative potential. The potential at the location of a source itself is
 * formally infinite — we return `Infinity` rather than NaN so callers can
 * test and skip.
 */
export function potentialAtPoint(
  sources: readonly Charge[],
  point: Vec2,
): number {
  let v = 0;
  for (const s of sources) {
    const dx = point.x - s.x;
    const dy = point.y - s.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r === 0) return s.q > 0 ? Infinity : -Infinity;
    v += (K_COULOMB * s.q) / r;
  }
  return v;
}

/**
 * Potential difference V(a) − V(b).
 *
 * Because V is a function of position alone, this difference is automatically
 * path-independent — the work done per unit charge to move a test charge from
 * b to a is exactly q · (V(a) − V(b)), regardless of the route taken. This is
 * the practical content of "the electrostatic field is conservative".
 */
export function potentialDifference(
  sources: readonly Charge[],
  a: Vec2,
  b: Vec2,
): number {
  return potentialAtPoint(sources, a) - potentialAtPoint(sources, b);
}
