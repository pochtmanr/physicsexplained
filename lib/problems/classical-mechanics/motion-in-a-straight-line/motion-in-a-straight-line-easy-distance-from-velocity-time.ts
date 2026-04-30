/**
 * EASY — Distance from constant velocity and time.
 *
 * A car travels at constant velocity v for time t.
 * Find the distance covered.
 *
 * Steps:
 *   1. d = v * t
 */

// No acceleration needed from the lib — this is pure d = v*t.
// We reference the conceptual basis from newton.ts (constant-force motion
// reduces to d = v*t when a = 0).

export const inputs: Record<string, { value: number; units: string }> = {
  v: { value: 25, units: "m/s" },
  t: { value: 8, units: "s" },
};

export function solve(): Record<string, number> {
  const { v, t } = { v: inputs.v.value, t: inputs.t.value };

  const d = v * t;

  return { d };
}
