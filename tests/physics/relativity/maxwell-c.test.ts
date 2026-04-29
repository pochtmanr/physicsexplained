import { describe, expect, it } from "vitest";
import {
  cFromMuEpsilon,
  cFromFoucault,
  foucaultRotation,
  hertzWavelength,
} from "@/lib/physics/relativity/maxwell-c";
import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("cFromMuEpsilon", () => {
  it("recovers c = 299,792,458 m/s from modern μ₀ and ε₀", () => {
    const c = cFromMuEpsilon(MU_0, EPSILON_0);
    // The 2019 SI redefinition makes c exact, but rounding of μ₀ and ε₀
    // here lets us land within ~10 m/s of the defined constant.
    expect(c).toBeCloseTo(SPEED_OF_LIGHT, -3);
    expect(Math.abs(c - SPEED_OF_LIGHT)).toBeLessThan(20);
  });

  it("scales as 1/√(μ₀ε₀)", () => {
    const baseline = cFromMuEpsilon(MU_0, EPSILON_0);
    const doubled = cFromMuEpsilon(4 * MU_0, EPSILON_0);
    expect(doubled).toBeCloseTo(baseline / 2, 6);
  });

  it("agrees with Weber-Kohlrausch's 1856 result to within a few percent", () => {
    // Weber & Kohlrausch measured the ratio of electrostatic to electromagnetic
    // units in 1856 and got ≈3.107×10⁸ m/s — the first numeric hint that c was
    // hiding in the EM constants. Stand-in here: synthesize the inputs that
    // reproduce a result in their ballpark and confirm the formula tolerates it.
    const wkC = 3.107e8;
    const synthMu = MU_0;
    const synthEps = 1 / (synthMu * wkC * wkC);
    expect(cFromMuEpsilon(synthMu, synthEps)).toBeCloseTo(wkC, -1);
  });

  it("throws on non-positive inputs", () => {
    expect(() => cFromMuEpsilon(0, EPSILON_0)).toThrow(RangeError);
    expect(() => cFromMuEpsilon(MU_0, 0)).toThrow(RangeError);
    expect(() => cFromMuEpsilon(-MU_0, EPSILON_0)).toThrow(RangeError);
  });

  it("throws on non-finite inputs", () => {
    expect(() => cFromMuEpsilon(Number.NaN, EPSILON_0)).toThrow(RangeError);
    expect(() => cFromMuEpsilon(MU_0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("foucaultRotation", () => {
  it("Foucault 1862 setup: 20 m round-trip arm, 800 rev/s mirror gives a small but visible shift", () => {
    // Foucault's actual 1862 figure: distance ≈ 20 m, mirror at ≈ 800 rev/s
    // (= 48,000 rpm). Δθ = ω · 2L/c with L = 20, c ≈ 3×10⁸ ⇒ Δθ ≈ 6.7×10⁻⁴ rad.
    const dtheta = foucaultRotation(20, 48000, SPEED_OF_LIGHT);
    expect(dtheta).toBeCloseTo((2 * Math.PI * 800 * 40) / SPEED_OF_LIGHT, 8);
    expect(dtheta).toBeGreaterThan(6e-4);
    expect(dtheta).toBeLessThan(7e-4);
  });

  it("is zero at zero rpm or zero distance", () => {
    expect(foucaultRotation(20, 0, SPEED_OF_LIGHT)).toBe(0);
    expect(foucaultRotation(0, 48000, SPEED_OF_LIGHT)).toBe(0);
  });

  it("uses SPEED_OF_LIGHT as the default c", () => {
    const explicit = foucaultRotation(20, 48000, SPEED_OF_LIGHT);
    const implicit = foucaultRotation(20, 48000);
    expect(implicit).toBe(explicit);
  });

  it("throws on negative distance or non-positive c", () => {
    expect(() => foucaultRotation(-1, 100)).toThrow(RangeError);
    expect(() => foucaultRotation(20, 100, 0)).toThrow(RangeError);
    expect(() => foucaultRotation(20, 100, -SPEED_OF_LIGHT)).toThrow(RangeError);
  });
});

describe("cFromFoucault", () => {
  it("inverts foucaultRotation exactly", () => {
    const distance = 20;
    const rpm = 48000;
    const dtheta = foucaultRotation(distance, rpm, SPEED_OF_LIGHT);
    const recovered = cFromFoucault(distance, rpm, dtheta);
    expect(recovered).toBeCloseTo(SPEED_OF_LIGHT, 0);
  });
});

describe("hertzWavelength", () => {
  it("Hertz 1887 — a 50 MHz oscillator radiates at 6 m wavelength", () => {
    expect(hertzWavelength(50e6)).toBeCloseTo(SPEED_OF_LIGHT / 50e6, 6);
    expect(hertzWavelength(50e6)).toBeCloseTo(5.99584916, 6);
  });

  it("agrees with c = f · λ", () => {
    const f = 1e9; // 1 GHz
    const lambda = hertzWavelength(f);
    expect(f * lambda).toBeCloseTo(SPEED_OF_LIGHT, 0);
  });
});
