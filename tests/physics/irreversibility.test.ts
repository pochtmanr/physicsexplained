import { describe, it, expect } from "vitest";
import {
  stepParticles,
  reverse,
  perturb,
  leftCount,
  occupancyEntropy,
  binEntropy,
  landauerErasureCost,
  erasureCostInUnitsOfK,
  type Particle1D,
} from "@/lib/physics/thermodynamics/irreversibility";
import { BOLTZMANN_K } from "@/lib/physics/thermodynamics/boltzmann-entropy";
import { createRng } from "@/lib/physics/thermodynamics/random";

const SAMPLE: Particle1D[] = [
  { x: 0.1, v: 0.7 },
  { x: 0.45, v: -1.3 },
  { x: 0.8, v: 0.9 },
  { x: 0.62, v: -0.4 },
];

describe("time-reversible 1-D gas", () => {
  it("keeps every particle inside the box", () => {
    let p: Particle1D[] = SAMPLE.map((q) => ({ ...q }));
    for (let i = 0; i < 200; i++) {
      p = stepParticles(p, 0.05);
      for (const q of p) {
        expect(q.x).toBeGreaterThanOrEqual(0);
        expect(q.x).toBeLessThanOrEqual(1);
      }
    }
  });

  it("reversing twice is the identity", () => {
    const back = reverse(reverse(SAMPLE));
    back.forEach((q, i) => {
      expect(q.x).toBe(SAMPLE[i].x);
      expect(q.v).toBe(SAMPLE[i].v);
    });
  });

  it("Loschmidt: evolve, reverse, evolve returns to the start (eps = 0)", () => {
    const steps = 37;
    const dt = 0.03;
    let p: Particle1D[] = SAMPLE.map((q) => ({ ...q }));
    for (let i = 0; i < steps; i++) p = stepParticles(p, dt);
    p = reverse(p);
    for (let i = 0; i < steps; i++) p = stepParticles(p, dt);
    p.forEach((q, i) => {
      expect(q.x).toBeCloseTo(SAMPLE[i].x, 9);
      // velocity comes back reversed
      expect(q.v).toBeCloseTo(-SAMPLE[i].v, 9);
    });
  });

  it("a non-zero perturbation breaks the reversal", () => {
    const rng = createRng(7);
    const jolted = perturb(SAMPLE, 1e-3, rng);
    const moved = jolted.some((q, i) => q.v !== SAMPLE[i].v);
    expect(moved).toBe(true);
  });
});

describe("coarse-grained entropy", () => {
  it("counts the left half and peaks when well mixed", () => {
    const allLeft: Particle1D[] = [
      { x: 0.1, v: 0 },
      { x: 0.2, v: 0 },
      { x: 0.3, v: 0 },
      { x: 0.4, v: 0 },
    ];
    expect(leftCount(allLeft)).toBe(4);
    expect(occupancyEntropy(allLeft)).toBeCloseTo(0, 12); // ln C(4,4) = 0

    const mixed: Particle1D[] = [
      { x: 0.1, v: 0 },
      { x: 0.2, v: 0 },
      { x: 0.7, v: 0 },
      { x: 0.8, v: 0 },
    ];
    expect(occupancyEntropy(mixed)).toBeCloseTo(Math.log(6), 12); // ln C(4,2)
  });

  it("bin entropy of a uniform histogram is ln(bins)", () => {
    expect(binEntropy([5, 5, 5, 5])).toBeCloseTo(Math.log(4), 12);
    expect(binEntropy([10, 0, 0, 0])).toBeCloseTo(0, 12);
    expect(binEntropy([])).toBe(0);
  });
});

describe("Landauer erasure cost", () => {
  it("one bit costs k_B ln 2", () => {
    expect(landauerErasureCost(1)).toBeCloseTo(BOLTZMANN_K * Math.LN2, 30);
    expect(erasureCostInUnitsOfK(1)).toBeCloseTo(Math.LN2, 12);
  });

  it("scales linearly with bit count", () => {
    expect(landauerErasureCost(8)).toBeCloseTo(8 * landauerErasureCost(1), 30);
  });
});
