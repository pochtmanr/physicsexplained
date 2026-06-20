import { describe, it, expect } from "vitest";
import {
  firstLaw,
  heatFrom,
  workFrom,
  modeAccount,
  violatesFirstLaw,
} from "@/lib/physics/thermodynamics/first-law";

describe("ΔU = Q − W", () => {
  it("engine: heat in, work out", () => {
    const a = firstLaw(1000, 600);
    expect(a.deltaU).toBe(400);
  });
  it("inverts to recover Q and W", () => {
    expect(heatFrom(400, 600)).toBe(1000); // Q = ΔU + W
    expect(workFrom(400, 1000)).toBe(600); // W = Q − ΔU
  });
});

describe("teaching modes", () => {
  it("engine spends part of the heat as work", () => {
    const a = modeAccount("engine", 1000, 600);
    expect(a.Q).toBe(1000);
    expect(a.W).toBe(600);
    expect(a.deltaU).toBe(400);
  });
  it("heating puts all heat into internal energy", () => {
    const a = modeAccount("heating", 1000, 999);
    expect(a.W).toBe(0);
    expect(a.deltaU).toBe(1000);
  });
  it("friction: work done on the system raises U with no heat", () => {
    const a = modeAccount("friction", 0, 750);
    expect(a.Q).toBe(0);
    expect(a.W).toBe(-750); // system's work output is negative
    expect(a.deltaU).toBe(750); // ΔU = 0 − (−750)
  });
  it("rejects negative magnitudes", () => {
    expect(() => modeAccount("engine", -1, 1)).toThrow();
  });
});

describe("perpetual motion of the first kind", () => {
  it("a cycle outputting more work than heat in is forbidden", () => {
    expect(violatesFirstLaw(500, 600)).toBe(true);
  });
  it("a cycle balancing work to heat is allowed", () => {
    expect(violatesFirstLaw(600, 600)).toBe(false);
    expect(violatesFirstLaw(600, 400)).toBe(false);
  });
});
