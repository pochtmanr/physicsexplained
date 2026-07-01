import { describe, expect, it } from "vitest";
import { orbitalSchema } from "./schema";

describe("orbitalSchema migration", () => {
  it("accepts old discrete speed values (0.25 / 1 / 4)", () => {
    for (const speed of [0.25, 1, 4]) {
      const r = orbitalSchema.safeParse({ speed });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.speed).toBe(speed);
    }
  });

  it("accepts the new continuous range 0.1–10", () => {
    for (const speed of [0.1, 0.33, 7.5, 10]) {
      expect(orbitalSchema.safeParse({ speed }).success).toBe(true);
    }
  });

  it("rejects out-of-range speed (whole blob falls back to defaults upstream)", () => {
    expect(orbitalSchema.safeParse({ speed: 50 }).success).toBe(false);
    expect(orbitalSchema.safeParse({ speed: 0 }).success).toBe(false);
  });

  it("defaults speed to 1", () => {
    expect(orbitalSchema.parse({}).speed).toBe(1);
  });
});
