import { describe, it, expect } from "vitest";
import { solve } from "@/lib/problems/classical-mechanics/newtons-three-laws/newtons-three-laws-easy-acceleration-from-net-force";

describe("newtons-three-laws-easy-acceleration-from-net-force", () => {
  it("computes acceleration correctly", () => {
    const result = solve();
    expect(result.a).toBeCloseTo(6.0000, 4);
  });
});
