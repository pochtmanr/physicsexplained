import { describe, expect, it } from "vitest";
import {
  metricFactor,
  staticTimeDilation,
  redshiftFactor,
  outgoingLightConeSlope,
  riverSpeedOverC,
  infallProperTime,
  tidalStretchPerLength,
  schwarzschildRadiusMeters,
  M_SUN_KG,
} from "@/lib/physics/relativity/the-event-horizon";

describe("metricFactor", () => {
  it("is exactly 0 at the horizon (x = 1)", () => {
    expect(metricFactor(1)).toBe(0);
  });

  it("→ 1 far from the hole (x → ∞)", () => {
    expect(metricFactor(1e6)).toBeCloseTo(1, 5);
  });

  it("is negative inside the horizon (r/t roles swap)", () => {
    expect(metricFactor(0.5)).toBeLessThan(0);
  });

  it("returns NaN for non-physical x ≤ 0", () => {
    expect(Number.isNaN(metricFactor(0))).toBe(true);
    expect(Number.isNaN(metricFactor(-2))).toBe(true);
  });
});

describe("staticTimeDilation", () => {
  it("a clock at the horizon appears frozen (rate 0)", () => {
    expect(staticTimeDilation(1)).toBe(0);
  });

  it("at x = 2 a static clock ticks at √(1/2) ≈ 0.707 of the distant rate", () => {
    expect(staticTimeDilation(2)).toBeCloseTo(Math.SQRT1_2, 10);
  });

  it("approaches 1 far away (no dilation at infinity)", () => {
    expect(staticTimeDilation(1e8)).toBeCloseTo(1, 6);
  });

  it("returns 0 inside the horizon (no static observer exists there)", () => {
    expect(staticTimeDilation(0.6)).toBe(0);
  });
});

describe("redshiftFactor", () => {
  it("light from the horizon redshifts to zero frequency (1+z → ∞)", () => {
    expect(redshiftFactor(1)).toBe(Infinity);
  });

  it("for x_emit = 2 seen from infinity, 1+z = 1/√(1/2) = √2", () => {
    expect(redshiftFactor(2)).toBeCloseTo(Math.SQRT2, 10);
  });

  it("is symmetric-consistent: emit=obs gives no shift (1+z = 1)", () => {
    expect(redshiftFactor(3, 3)).toBeCloseTo(1, 12);
  });

  it("rises monotonically as the source nears the horizon", () => {
    const far = redshiftFactor(10);
    const near = redshiftFactor(1.01);
    expect(near).toBeGreaterThan(far);
  });
});

describe("outgoingLightConeSlope", () => {
  it("is 45° (slope 1) far from the hole", () => {
    expect(outgoingLightConeSlope(1e9)).toBeCloseTo(1, 6);
  });

  it("goes vertical (→ ∞) at the horizon — outgoing light is frozen in t", () => {
    expect(outgoingLightConeSlope(1)).toBe(Infinity);
  });

  it("at x = 2 the slope is 1/(1 − 1/2) = 2", () => {
    expect(outgoingLightConeSlope(2)).toBeCloseTo(2, 12);
  });

  it("steepens monotonically as the horizon is approached from outside", () => {
    expect(outgoingLightConeSlope(1.1)).toBeGreaterThan(
      outgoingLightConeSlope(3),
    );
  });
});

describe("riverSpeedOverC", () => {
  it("equals exactly c at the horizon (v/c = 1)", () => {
    expect(riverSpeedOverC(1)).toBe(1);
  });

  it("is sub-luminal outside the horizon (x > 1)", () => {
    expect(riverSpeedOverC(4)).toBeCloseTo(0.5, 12);
    expect(riverSpeedOverC(4)).toBeLessThan(1);
  });

  it("is super-luminal inside the horizon (x < 1)", () => {
    expect(riverSpeedOverC(0.25)).toBeCloseTo(2, 12);
    expect(riverSpeedOverC(0.25)).toBeGreaterThan(1);
  });
});

describe("infallProperTime", () => {
  it("is finite for a fall from rest at the horizon: cτ/r_s = 2/3", () => {
    expect(infallProperTime(1)).toBeCloseTo(2 / 3, 12);
  });

  it("scales as x^{3/2} — falling from 4 r_s takes 8× longer than from 1 r_s", () => {
    expect(infallProperTime(4) / infallProperTime(1)).toBeCloseTo(8, 10);
  });

  it("is zero at the singularity itself (x = 0)", () => {
    expect(infallProperTime(0)).toBe(0);
  });
});

describe("tidalStretchPerLength", () => {
  it("scales as 1/M² when evaluated at each hole's own horizon", () => {
    const M1 = M_SUN_KG;
    const M2 = 1e6 * M_SUN_KG;
    const rsAtM1 = schwarzschildRadiusMeters(M1);
    const rsAtM2 = schwarzschildRadiusMeters(M2);
    const t1 = tidalStretchPerLength(rsAtM1, M1);
    const t2 = tidalStretchPerLength(rsAtM2, M2);
    // a_tidal ∝ M / r_s³ ∝ M / M³ = 1/M². Ratio t1/t2 ≈ (M2/M1)².
    // The numbers span 12 orders of magnitude, so compare as a ratio.
    const ratio = t1 / t2 / (M2 / M1) ** 2;
    expect(ratio).toBeGreaterThan(0.999);
    expect(ratio).toBeLessThan(1.001);
  });

  it("a stellar-mass hole has a brutal tidal field at its horizon", () => {
    const M = 10 * M_SUN_KG;
    const rs = schwarzschildRadiusMeters(M);
    // per meter of body length, acceleration difference is enormous (> 10⁶ s⁻²)
    expect(tidalStretchPerLength(rs, M)).toBeGreaterThan(1e6);
  });
});

describe("schwarzschildRadiusMeters", () => {
  it("the Sun's horizon would sit at ≈ 2954 m", () => {
    expect(schwarzschildRadiusMeters(M_SUN_KG)).toBeGreaterThan(2900);
    expect(schwarzschildRadiusMeters(M_SUN_KG)).toBeLessThan(3000);
  });
});
