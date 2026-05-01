import { describe, expect, it } from "vitest";
import { hitTest, visibleRadiusPx } from "./hit-test";
import { defaultCamera } from "./camera";
import type { Body } from "@/lib/physics/n-body";

function body(id: string, x: number, y: number, mass = 1): Body {
  return { id, mass, x, y, vx: 0, vy: 0 };
}

describe("hit-test", () => {
  const W = 800;
  const H = 600;
  const cam = defaultCamera();

  it("returns -1 for empty space", () => {
    expect(hitTest([], cam, W, H, 100, 100)).toBe(-1);
    expect(
      hitTest([body("a", 5, 5)], cam, W, H, 100, 100),
    ).toBe(-1);
  });

  it("returns the index of the body under the cursor", () => {
    // Body at world (0, 0) maps to screen (W/2, H/2).
    const bs = [body("a", 0, 0)];
    expect(hitTest(bs, cam, W, H, W / 2, H / 2)).toBe(0);
  });

  it("respects the click-target slop", () => {
    // A small mass-1 body should still register a few pixels off-center.
    const bs = [body("a", 0, 0)];
    expect(hitTest(bs, cam, W, H, W / 2 + 10, H / 2)).toBe(0);
  });

  it("visibleRadiusPx never falls below the floor", () => {
    expect(visibleRadiusPx(0.1, 1)).toBeGreaterThanOrEqual(2);
    expect(visibleRadiusPx(1, 80)).toBeGreaterThan(2);
  });
});
