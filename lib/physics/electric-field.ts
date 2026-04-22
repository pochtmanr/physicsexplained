import { K_COULOMB } from "./constants";
import type { Charge, Vec2 } from "./coulomb";

export type { Charge, Vec2 } from "./coulomb";

/**
 * Electric field at a point due to a single source charge.
 *
 *   E = k · q_source / r²   (radial, away from positive sources)
 *
 * This is `coulombForce / q_test`, which makes the field independent of the
 * test charge — that's the whole point of moving from forces to fields.
 */
export function electricFieldFromSource(source: Charge, point: Vec2): Vec2 {
  const dx = point.x - source.x;
  const dy = point.y - source.y;
  const r2 = dx * dx + dy * dy;
  if (r2 === 0) return { x: 0, y: 0 };
  const r = Math.sqrt(r2);
  const magnitude = (K_COULOMB * source.q) / r2;
  return { x: (magnitude * dx) / r, y: (magnitude * dy) / r };
}

/**
 * Total electric field at a point from many sources — superposition.
 *
 *   E_total(r) = Σ k · q_i / |r − r_i|²   along the radial direction
 */
export function electricFieldAtPoint(
  sources: readonly Charge[],
  point: Vec2,
): Vec2 {
  return sources.reduce<Vec2>(
    (acc, s) => {
      const e = electricFieldFromSource(s, point);
      return { x: acc.x + e.x, y: acc.y + e.y };
    },
    { x: 0, y: 0 },
  );
}

export interface SampleFieldOptions {
  /** Lower-left corner of the sampled rectangle, in metres. */
  xMin: number;
  yMin: number;
  /** Upper-right corner of the sampled rectangle, in metres. */
  xMax: number;
  yMax: number;
  /** Grid resolution along each axis (cells, not nodes). */
  gridSize: number;
}

/**
 * Sample E on a uniform grid covering [xMin, xMax] × [yMin, yMax].
 * Returns a 2D array indexed as result[row][col] where row 0 is the bottom.
 *
 * Useful for vector-arrow plots and for picking start points for field-line
 * traces.
 */
export function sampleField(
  sources: readonly Charge[],
  opts: SampleFieldOptions,
): Vec2[][] {
  const { xMin, yMin, xMax, yMax, gridSize } = opts;
  if (gridSize < 1) return [];
  const dx = (xMax - xMin) / gridSize;
  const dy = (yMax - yMin) / gridSize;
  const rows: Vec2[][] = [];
  for (let i = 0; i <= gridSize; i++) {
    const row: Vec2[] = [];
    for (let j = 0; j <= gridSize; j++) {
      const x = xMin + j * dx;
      const y = yMin + i * dy;
      row.push(electricFieldAtPoint(sources, { x, y }));
    }
    rows.push(row);
  }
  return rows;
}
