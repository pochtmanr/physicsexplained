import { describe, it, expect } from "vitest";
import { G_SI, AU_M, YEAR_S, GM_SUN_SI } from "@/lib/physics/constants";

describe("physics constants", () => {
  it("G has the correct SI value", () => {
    expect(G_SI).toBeCloseTo(6.6743e-11, 15);
  });

  it("one AU is roughly 1.496e11 m", () => {
    expect(AU_M).toBeCloseTo(1.495978707e11, 3);
  });

  it("one sidereal year is roughly 3.156e7 s", () => {
    expect(YEAR_S).toBeCloseTo(3.15576e7, 0);
  });

  it("GM of the sun is roughly 1.327e20 m^3/s^2", () => {
    expect(GM_SUN_SI).toBeCloseTo(1.32712440018e20, 3);
  });
});
