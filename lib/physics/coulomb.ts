import { K_COULOMB } from "./constants";

export interface Charge {
  q: number; // coulombs
  x: number; // meters
  y: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Coulomb force on test charge from a source charge. */
export function coulombForce(source: Charge, test: Charge): Vec2 {
  const dx = test.x - source.x;
  const dy = test.y - source.y;
  const r2 = dx * dx + dy * dy;
  if (r2 === 0) return { x: 0, y: 0 };
  const r = Math.sqrt(r2);
  const magnitude = (K_COULOMB * source.q * test.q) / r2;
  return { x: (magnitude * dx) / r, y: (magnitude * dy) / r };
}

/** Superposition: total force on a test charge from many sources. */
export function superpose(sources: readonly Charge[], test: Charge): Vec2 {
  return sources.reduce<Vec2>(
    (acc, s) => {
      const f = coulombForce(s, test);
      return { x: acc.x + f.x, y: acc.y + f.y };
    },
    { x: 0, y: 0 },
  );
}
