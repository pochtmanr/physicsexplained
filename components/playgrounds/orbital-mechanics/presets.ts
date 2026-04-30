import type { Body } from "@/lib/physics/n-body";

export type PresetId = "figure-8" | "solar-mini" | "pythagorean" | "random-cluster";

// Chenciner-Montgomery (2000) figure-8: three equal masses chase each other
// along a single ∞-shape. Zero total momentum, zero angular momentum.
const FIGURE_8: Body[] = [
  { id: "a", mass: 1, x: 0.97000436, y: -0.24308753, vx: 0.466203685, vy: 0.43236573 },
  { id: "b", mass: 1, x: -0.97000436, y: 0.24308753, vx: 0.466203685, vy: 0.43236573 },
  { id: "c", mass: 1, x: 0, y: 0, vx: -0.93240737, vy: -0.86473146 },
];

const SOLAR_MINI: Body[] = [
  { id: "sun", mass: 100, x: 0, y: 0, vx: 0, vy: 0 },
  { id: "p1", mass: 1, x: 1.5, y: 0, vx: 0, vy: 8.165 },
  { id: "p2", mass: 0.7, x: -2.5, y: 0, vx: 0, vy: -6.32 },
  { id: "p3", mass: 0.4, x: 0, y: 4, vx: -5, vy: 0 },
];

// Burrau's (1913) pythagorean problem: masses 3, 4, 5 at rest at the corners
// of a 3-4-5 right triangle. Notoriously chaotic.
const PYTHAGOREAN: Body[] = [
  { id: "m3", mass: 3, x: 1, y: 3, vx: 0, vy: 0 },
  { id: "m4", mass: 4, x: -2, y: -1, vx: 0, vy: 0 },
  { id: "m5", mass: 5, x: 1, y: -1, vx: 0, vy: 0 },
];

// Mulberry32 — tiny deterministic PRNG for the random-cluster preset.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRandomCluster(): Body[] {
  const rand = mulberry32(0x510B7);
  const bodies: Body[] = [];
  for (let i = 0; i < 5; i++) {
    bodies.push({
      id: `r${i}`,
      mass: 0.5 + rand() * 4.5,
      x: (rand() - 0.5) * 6,
      y: (rand() - 0.5) * 6,
      vx: (rand() - 0.5) * 1.5,
      vy: (rand() - 0.5) * 1.5,
    });
  }
  return bodies;
}

export const PRESETS: Record<PresetId, Body[]> = {
  "figure-8": FIGURE_8,
  "solar-mini": SOLAR_MINI,
  "pythagorean": PYTHAGOREAN,
  "random-cluster": makeRandomCluster(),
};

export function getPreset(id: PresetId): Body[] {
  return PRESETS[id].map((b) => ({ ...b }));
}

export const PRESET_IDS: PresetId[] = ["figure-8", "solar-mini", "pythagorean", "random-cluster"];
