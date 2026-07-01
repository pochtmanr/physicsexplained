import { DEFAULT_SOFTENING, type Body } from "@/lib/physics/n-body";

export type PresetId =
  | "figure-8"
  | "solar-mini"
  | "pythagorean"
  | "random-cluster"
  | "sun-earth-moon"
  | "inner-solar-system"
  | "earth-moon"
  | "binary-star";

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

// ── Real-life presets ────────────────────────────────────────────────────
// The sim is dimensionless (G = 1). True solar ratios are unusable directly:
// Sun:Earth = 333,000:1 renders planets sub-pixel (radius ∝ √mass) and the
// Moon at 1/389 of Earth's solar distance is invisible. Each preset instead
// compresses masses and radii to order-unity display values, then computes
// EXACT circular-orbit velocities from the chosen masses/radii under the
// sim's softened gravity — every preset is a genuinely stable orbit by
// construction, not a lookup of real numbers.

const EPS2 = DEFAULT_SOFTENING * DEFAULT_SOFTENING;

/** Circular-orbit speed about central mass M at radius r (G = 1, softened). */
function vCirc(M: number, r: number): number {
  return Math.sqrt((M * r * r) / Math.pow(r * r + EPS2, 1.5));
}

/** Remove net momentum so the system doesn't drift off-screen. */
function zeroMomentum(bodies: Body[]): Body[] {
  const M = bodies.reduce((s, b) => s + b.mass, 0);
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return bodies.map((b) => ({ ...b, vx: b.vx - px / M, vy: b.vy - py / M }));
}

/** Two bodies in mutual circular orbit about their barycenter, separation d. */
function twoBodyCircular(
  idA: string,
  mA: number,
  idB: string,
  mB: number,
  d: number,
): Body[] {
  const omega = Math.sqrt((mA + mB) / Math.pow(d * d + EPS2, 1.5));
  const rA = (d * mB) / (mA + mB);
  const rB = (d * mA) / (mA + mB);
  return [
    { id: idA, mass: mA, x: -rA, y: 0, vx: 0, vy: -omega * rA },
    { id: idB, mass: mB, x: rB, y: 0, vx: 0, vy: omega * rB },
  ];
}

// Compression: Sun 100 / Earth 1 / Moon 0.05 (real 333k / 1 / 0.0123).
// Earth at r=4 (Earth "year" ≈ 5 s at 1×); Moon 0.3 from Earth — inside the
// Hill radius 4·(1/300)^⅓ ≈ 0.6, and Earth:Moon = 20 < ABSORB_MASS_RATIO so
// a grazing contact bounces instead of deleting the Moon.
const SUN_EARTH_MOON: Body[] = zeroMomentum(
  (() => {
    const rE = 4;
    const rM = 0.3;
    const vE = vCirc(100, rE);
    return [
      { id: "sun", mass: 100, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "earth", mass: 1, x: rE, y: 0, vx: 0, vy: vE },
      { id: "moon", mass: 0.05, x: rE + rM, y: 0, vx: 0, vy: vE + vCirc(1, rM) },
    ];
  })(),
);

// Compression: radii 1.5 / 2.4 / 3.6 / 5.0 (real 0.39 / 0.72 / 1 / 1.52 AU —
// ordering and rough spacing kept). Planet masses are kept well under the
// sun's 1% so orbit gaps exceed ~3.5 mutual Hill radii — heavier planets at
// this packing perturb each other into ejections within a few orbits (the
// 0.04 world-unit radius floor keeps the dots visible anyway).
// Kepler III at a glance: periods ≈ 1.2 / 2.3 / 4.3 / 7.0 s.
const INNER_SOLAR_SYSTEM: Body[] = zeroMomentum(
  (() => {
    const planets: Array<[string, number, number, number]> = [
      // [id, mass, orbit radius, start angle]
      ["mercury", 0.05, 1.5, 0],
      ["venus", 0.1, 2.4, Math.PI / 2],
      ["earth", 0.12, 3.6, Math.PI],
      ["mars", 0.08, 5, -Math.PI / 2],
    ];
    const sun: Body = { id: "sun", mass: 100, x: 0, y: 0, vx: 0, vy: 0 };
    return [
      sun,
      ...planets.map(([id, mass, r, th]): Body => {
        const v = vCirc(100, r);
        return {
          id,
          mass,
          x: r * Math.cos(th),
          y: r * Math.sin(th),
          vx: -v * Math.sin(th),
          vy: v * Math.cos(th),
        };
      }),
    ];
  })(),
);

// Compression: 50:1 mass ratio (real 81:1), separation 4, period ≈ 7 s.
// Both orbit the barycenter — watch the heavy body's wobble.
const EARTH_MOON: Body[] = twoBodyCircular("earth", 50, "moon", 1, 4);

// Two equal stars (separation 2.5) + circumbinary planet at r=6 — beyond the
// ≈2.3× separation stability bound for equal-mass binaries ("Tatooine").
// Binary period ≈ 2.8 s, planet ≈ 10 s.
const BINARY_STAR: Body[] = zeroMomentum(
  (() => {
    const stars = twoBodyCircular("star-a", 40, "star-b", 40, 2.5);
    const rP = 6;
    const vP = vCirc(80, rP); // from out here the binary acts as one mass-80 point
    return [...stars, { id: "planet", mass: 0.5, x: 0, y: rP, vx: -vP, vy: 0 }];
  })(),
);

export interface BodyMeta {
  /** Key under play.orbital-mechanics.bodies.* for the on-canvas label. */
  labelKey: string;
  /** Overrides the palette-by-id default color. */
  color?: string;
}

export interface PresetDef {
  bodies: Body[];
  /** Initial px-per-world-unit override applied on preset switch / load. */
  camera?: { scale: number };
  /** Per-body-id display metadata. */
  bodyMeta?: Record<string, BodyMeta>;
}

export const PRESETS: Record<PresetId, PresetDef> = {
  "figure-8": { bodies: FIGURE_8 },
  "solar-mini": { bodies: SOLAR_MINI },
  "pythagorean": { bodies: PYTHAGOREAN },
  "random-cluster": { bodies: makeRandomCluster() },
  "sun-earth-moon": {
    bodies: SUN_EARTH_MOON,
    camera: { scale: 60 },
    bodyMeta: {
      sun: { labelKey: "sun", color: "#FFC857" },
      earth: { labelKey: "earth", color: "#5B8DEF" },
      moon: { labelKey: "moon", color: "#B8C0CC" },
    },
  },
  "inner-solar-system": {
    bodies: INNER_SOLAR_SYSTEM,
    camera: { scale: 50 },
    bodyMeta: {
      sun: { labelKey: "sun", color: "#FFC857" },
      mercury: { labelKey: "mercury", color: "#B0A08F" },
      venus: { labelKey: "venus", color: "#E4C590" },
      earth: { labelKey: "earth", color: "#5B8DEF" },
      mars: { labelKey: "mars", color: "#E2603F" },
    },
  },
  "earth-moon": {
    bodies: EARTH_MOON,
    camera: { scale: 70 },
    bodyMeta: {
      earth: { labelKey: "earth", color: "#5B8DEF" },
      moon: { labelKey: "moon", color: "#B8C0CC" },
    },
  },
  "binary-star": {
    bodies: BINARY_STAR,
    camera: { scale: 45 },
    bodyMeta: {
      "star-a": { labelKey: "star-a", color: "#FFC857" },
      "star-b": { labelKey: "star-b", color: "#FF9F5A" },
      planet: { labelKey: "planet" },
    },
  },
};

export function getPreset(id: PresetId): Body[] {
  return PRESETS[id].bodies.map((b) => ({ ...b }));
}

export function getPresetDef(id: PresetId): PresetDef {
  return PRESETS[id];
}

/**
 * id → display meta across every preset. Body ids are stable and mean the
 * same thing wherever they appear ("sun" is the sun in every preset), so a
 * flat merge is safe — and labels survive promotion to "custom".
 */
export const BODY_META: Record<string, BodyMeta> = Object.assign(
  {},
  ...Object.values(PRESETS).map((p) => p.bodyMeta ?? {}),
);

export const PRESET_IDS: PresetId[] = [
  "figure-8",
  "solar-mini",
  "pythagorean",
  "random-cluster",
  "sun-earth-moon",
  "inner-solar-system",
  "earth-moon",
  "binary-star",
];
