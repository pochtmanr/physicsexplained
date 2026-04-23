import { describe, expect, it } from "vitest";
import {
  resonantFrequency,
  qualityFactor,
  bandwidth,
  dampingRegime,
  rlcStepResponse,
  driveAmplitude,
  capacitorTransferMag,
} from "@/lib/physics/electromagnetism/rlc-resonance";

describe("resonantFrequency", () => {
  it("returns ω₀ = 1/√(LC) for a known LC pair", () => {
    // L = 1 H, C = 1 F → ω₀ = 1 rad/s exactly.
    expect(resonantFrequency(1, 1)).toBeCloseTo(1, 12);
  });

  it("radio-band sanity: 100 pF & 2.53 µH → ~10 MHz", () => {
    // ω₀ = 1/√(2.53e-6 · 100e-12) ≈ 6.286e7 rad/s → f ≈ 10.00 MHz.
    const w0 = resonantFrequency(2.53e-6, 100e-12);
    const f = w0 / (2 * Math.PI);
    expect(f / 1e6).toBeCloseTo(10.0, 1);
  });

  it("scales as 1/√L and 1/√C (doubling L cuts ω₀ by √2)", () => {
    const a = resonantFrequency(1e-3, 1e-6);
    const b = resonantFrequency(2e-3, 1e-6);
    expect(a / b).toBeCloseTo(Math.sqrt(2), 12);
  });
});

describe("qualityFactor", () => {
  it("returns Q = (1/R)·√(L/C) for a canonical RLC", () => {
    // R = 10 Ω, L = 100 mH, C = 100 nF → Q = 0.1 · √(0.1/1e-7) = 0.1·1000 = 100.
    const Q = qualityFactor(0.1, 1e-7, 10);
    expect(Q).toBeCloseTo(100, 10);
  });

  it("equals ω₀ L / R (a second expression of the same thing)", () => {
    const R = 4;
    const L = 0.05;
    const C = 2e-6;
    const Q = qualityFactor(L, C, R);
    const Q2 = (resonantFrequency(L, C) * L) / R;
    expect(Q).toBeCloseTo(Q2, 10);
  });
});

describe("bandwidth", () => {
  it("Δω = R/L = ω₀/Q", () => {
    const R = 5;
    const L = 0.01;
    const C = 1e-6;
    const bw = bandwidth(L, C, R);
    const w0Q = resonantFrequency(L, C) / qualityFactor(L, C, R);
    expect(bw).toBeCloseTo(R / L, 12);
    expect(bw).toBeCloseTo(w0Q, 10);
  });
});

describe("dampingRegime", () => {
  it("classifies undamped (R = 0)", () => {
    expect(dampingRegime(0, 1e-3, 1e-6)).toBe("undamped");
  });

  it("classifies underdamped below critical R", () => {
    // Critical R_c = 2·√(L/C). L = 1 mH, C = 1 µF → R_c = 2·√1000 ≈ 63.2 Ω.
    expect(dampingRegime(5, 1e-3, 1e-6)).toBe("under");
  });

  it("classifies overdamped above critical R", () => {
    expect(dampingRegime(200, 1e-3, 1e-6)).toBe("over");
  });

  it("classifies exactly-critical damping", () => {
    const L = 1e-3;
    const C = 1e-6;
    const Rc = 2 * Math.sqrt(L / C);
    expect(dampingRegime(Rc, L, C)).toBe("critical");
  });
});

describe("rlcStepResponse", () => {
  it("is zero at t = 0 (inductor blocks instantaneous current)", () => {
    expect(rlcStepResponse(5, 10, 1e-3, 1e-6, 0)).toBe(0);
  });

  it("peaks at the analytical time t* = atan(ω_d / α) / ω_d", () => {
    // I(t) = (V₀ / (L ω_d)) · e^{−α t} · sin(ω_d t)
    // dI/dt = 0  ⇒  tan(ω_d t) = ω_d / α
    const V0 = 10;
    const R = 5;
    const L = 1e-3;
    const C = 1e-6;
    const alpha = R / (2 * L);
    const w0 = 1 / Math.sqrt(L * C);
    const wd = Math.sqrt(w0 * w0 - alpha * alpha);
    const tStar = Math.atan2(wd, alpha) / wd;

    const iPeak = rlcStepResponse(V0, R, L, C, tStar);
    const iBefore = rlcStepResponse(V0, R, L, C, tStar * 0.9);
    const iAfter = rlcStepResponse(V0, R, L, C, tStar * 1.1);

    expect(iPeak).toBeGreaterThan(iBefore);
    expect(iPeak).toBeGreaterThan(iAfter);
    expect(iPeak).toBeGreaterThan(0);
  });
});

describe("driveAmplitude", () => {
  it("peaks at ω₀ with amplitude V₀ / R", () => {
    const V0 = 1;
    const R = 10;
    const L = 1e-3;
    const C = 1e-6;
    const w0 = resonantFrequency(L, C);
    const iAt0 = driveAmplitude(V0, R, L, C, w0);
    const iBelow = driveAmplitude(V0, R, L, C, w0 * 0.5);
    const iAbove = driveAmplitude(V0, R, L, C, w0 * 2);

    expect(iAt0).toBeCloseTo(V0 / R, 10);
    expect(iAt0).toBeGreaterThan(iBelow);
    expect(iAt0).toBeGreaterThan(iAbove);
  });
});

describe("capacitorTransferMag", () => {
  it("equals Q at resonance (|V_C/V_in| = Q when ω = ω₀)", () => {
    const R = 2;
    const L = 1e-3;
    const C = 1e-6;
    const w0 = resonantFrequency(L, C);
    const Q = qualityFactor(L, C, R);
    const gain = capacitorTransferMag(R, L, C, w0);
    expect(gain).toBeCloseTo(Q, 6);
  });

  it("approaches 1 at DC and rolls off at high ω", () => {
    const R = 10;
    const L = 1e-3;
    const C = 1e-6;
    const w0 = resonantFrequency(L, C);
    const low = capacitorTransferMag(R, L, C, w0 * 1e-3);
    const high = capacitorTransferMag(R, L, C, w0 * 100);
    expect(low).toBeCloseTo(1, 2);
    expect(high).toBeLessThan(0.01);
  });
});
