import { describe, expect, it } from "vitest";
import {
  appendTrails,
  clearTrails,
  createTrailBuffers,
  pruneOrphans,
  TRAIL_MAX_AGE_S,
} from "./trails";
import type { Body } from "@/lib/physics/n-body";

function body(id: string, x = 0, y = 0): Body {
  return { id, mass: 1, x, y, vx: 0, vy: 0 };
}

describe("trails", () => {
  it("appendTrails records a new point per body per call", () => {
    const t = createTrailBuffers();
    appendTrails(t, [body("a"), body("b")], 0.016);
    expect(t.get("a")).toHaveLength(1);
    expect(t.get("b")).toHaveLength(1);
    appendTrails(t, [body("a"), body("b")], 0.016);
    expect(t.get("a")).toHaveLength(2);
  });

  it("appendTrails ages prior points by dt", () => {
    const t = createTrailBuffers();
    appendTrails(t, [body("a")], 0.5);
    appendTrails(t, [body("a", 1, 0)], 0.3);
    const buf = t.get("a")!;
    expect(buf[0]!.age).toBeCloseTo(0.3, 9);
    expect(buf[1]!.age).toBe(0);
  });

  it("appendTrails drops points older than maxAge", () => {
    const t = createTrailBuffers();
    appendTrails(t, [body("a")], 0);
    appendTrails(t, [body("a", 1, 0)], TRAIL_MAX_AGE_S + 0.5);
    const buf = t.get("a")!;
    // Oldest entry should have aged past the limit and been shifted off.
    expect(buf.every((p) => p.age <= TRAIL_MAX_AGE_S)).toBe(true);
  });

  it("pruneOrphans drops trails for ids no longer alive", () => {
    const t = createTrailBuffers();
    appendTrails(t, [body("a"), body("b")], 0.016);
    pruneOrphans(t, new Set(["a"]));
    expect(t.has("a")).toBe(true);
    expect(t.has("b")).toBe(false);
  });

  it("clearTrails empties the buffer", () => {
    const t = createTrailBuffers();
    appendTrails(t, [body("a")], 0.016);
    clearTrails(t);
    expect(t.size).toBe(0);
  });
});
