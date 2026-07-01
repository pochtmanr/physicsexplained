import { describe, expect, it } from "vitest";
import { resolveCollisions, step, totalMomentum } from "@/lib/physics/n-body";
import { PRESETS, getPreset, type PresetId } from "./presets";

describe("orbital presets", () => {
  it("exposes 4 presets keyed by id", () => {
    const ids: PresetId[] = ["figure-8", "solar-mini", "pythagorean", "random-cluster"];
    for (const id of ids) expect(PRESETS[id]).toBeDefined();
  });

  it("figure-8 has zero net momentum", () => {
    const bodies = getPreset("figure-8");
    const p = totalMomentum(bodies);
    expect(Math.abs(p.px)).toBeLessThan(1e-9);
    expect(Math.abs(p.py)).toBeLessThan(1e-9);
  });

  it("pythagorean has 3 bodies at rest with masses 3, 4, 5", () => {
    const bodies = getPreset("pythagorean");
    expect(bodies).toHaveLength(3);
    const masses = bodies.map((b) => b.mass).sort((a, b) => a - b);
    expect(masses).toEqual([3, 4, 5]);
    for (const b of bodies) {
      expect(b.vx).toBe(0);
      expect(b.vy).toBe(0);
    }
  });

  it("random-cluster is deterministic across calls", () => {
    const a = getPreset("random-cluster");
    const b = getPreset("random-cluster");
    expect(a).toEqual(b);
  });
});

const REAL_PRESETS = [
  "sun-earth-moon",
  "inner-solar-system",
  "earth-moon",
  "binary-star",
] as const;

describe("real-life presets", () => {
  for (const id of REAL_PRESETS) {
    it(`${id}: no ejection, no merge over 60 sim-seconds`, () => {
      let bs = getPreset(id);
      const n = bs.length;
      for (let s = 0; s < 12000; s++) {
        bs = resolveCollisions(step(bs, 0.005));
        if (s % 200 === 0) {
          for (const b of bs) {
            expect(Math.hypot(b.x, b.y), `${b.id} at step ${s}`).toBeLessThan(15);
          }
        }
      }
      expect(bs).toHaveLength(n); // no absorb/merge happened
    });
  }

  it("sun-earth-moon: the moon stays bound to the earth", () => {
    let bs = getPreset("sun-earth-moon");
    for (let s = 0; s < 12000; s++) {
      bs = resolveCollisions(step(bs, 0.005));
      if (s % 200 === 0) {
        const earth = bs.find((b) => b.id === "earth")!;
        const moon = bs.find((b) => b.id === "moon")!;
        expect(Math.hypot(moon.x - earth.x, moon.y - earth.y)).toBeLessThan(1);
      }
    }
  });

  it("real presets have (near-)zero net momentum", () => {
    for (const id of REAL_PRESETS) {
      const p = totalMomentum(getPreset(id));
      expect(Math.hypot(p.px, p.py)).toBeLessThan(1e-9);
    }
  });
});
