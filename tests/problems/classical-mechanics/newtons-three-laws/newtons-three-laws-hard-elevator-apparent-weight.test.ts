import { describe, it, expect } from "vitest";
import { solve } from "@/lib/problems/classical-mechanics/newtons-three-laws/newtons-three-laws-hard-elevator-apparent-weight";

describe("newtons-three-laws-hard-elevator-apparent-weight", () => {
  it("computes true weight correctly", () => {
    const result = solve();
    expect(result.W).toBeCloseTo(686.4655, 4);
  });

  it("computes net force correctly", () => {
    const result = solve();
    expect(result.F_net).toBeCloseTo(175.0000, 4);
  });

  it("computes apparent weight (normal force) correctly", () => {
    const result = solve();
    expect(result.N).toBeCloseTo(861.4655, 4);
  });
});
