import { describe, expect, it } from "vitest";
import { totalMomentum } from "@/lib/physics/n-body";
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
