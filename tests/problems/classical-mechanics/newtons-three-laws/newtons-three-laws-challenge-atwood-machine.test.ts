import { describe, it, expect } from "vitest";
import { solve } from "@/lib/problems/classical-mechanics/newtons-three-laws/newtons-three-laws-challenge-atwood-machine";

describe("newtons-three-laws-challenge-atwood-machine", () => {
  it("computes net system force correctly", () => {
    const result = solve();
    expect(result.F_net_system).toBeCloseTo(19.6133, 4);
  });

  it("computes total mass correctly", () => {
    const result = solve();
    expect(result.m_total).toBeCloseTo(10.0000, 4);
  });

  it("computes system acceleration correctly", () => {
    const result = solve();
    expect(result.a).toBeCloseTo(1.9613, 4);
  });

  it("computes string tension correctly", () => {
    const result = solve();
    expect(result.T).toBeCloseTo(47.0719, 4);
  });
});
