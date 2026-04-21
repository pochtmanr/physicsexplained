import { describe, it, expect } from "vitest";
import {
  RHO_AIR,
  RHO_WATER,
  P_ATM,
  bernoulliHead,
  pressureFromHead,
  bernoulliPressureDrop,
  continuityVelocity,
  venturiPressureDrop,
  venturiRadius,
  sampleVenturi,
  torricelliVelocity,
  dynamicPressure,
} from "@/lib/physics/bernoulli";
import { g_SI } from "@/lib/physics/constants";

describe("bernoulliHead", () => {
  it("recovers plain hydrostatic pressure when v = 0", () => {
    // At rest: p + ρgh is the usual hydrostatic head.
    const B = bernoulliHead(P_ATM, RHO_WATER, 0, 10);
    expect(B).toBeCloseTo(P_ATM + RHO_WATER * g_SI * 10, 6);
  });

  it("reduces to p + ½ρv² for a horizontal streamline", () => {
    const B = bernoulliHead(P_ATM, RHO_AIR, 30, 0);
    expect(B).toBeCloseTo(P_ATM + 0.5 * RHO_AIR * 900, 6);
  });
});

describe("pressureFromHead", () => {
  it("round-trips with bernoulliHead", () => {
    const head = bernoulliHead(P_ATM, RHO_WATER, 2, 5);
    const p = pressureFromHead(head, RHO_WATER, 2, 5);
    expect(p).toBeCloseTo(P_ATM, 8);
  });

  it("higher v at the same height => lower static p", () => {
    const head = bernoulliHead(P_ATM, RHO_AIR, 0, 0);
    const pFast = pressureFromHead(head, RHO_AIR, 30, 0);
    expect(pFast).toBeLessThan(P_ATM);
    expect(P_ATM - pFast).toBeCloseTo(0.5 * RHO_AIR * 900, 6);
  });
});

describe("bernoulliPressureDrop", () => {
  it("is zero when both points match", () => {
    expect(bernoulliPressureDrop(RHO_WATER, 2, 2, 0, 0)).toBe(0);
  });

  it("matches ½ρ(v₂² − v₁²) on a horizontal streamline", () => {
    const drop = bernoulliPressureDrop(RHO_AIR, 10, 20, 0, 0);
    expect(drop).toBeCloseTo(0.5 * RHO_AIR * (400 - 100), 6);
  });

  it("matches ρg·Δh when velocities are equal", () => {
    const drop = bernoulliPressureDrop(RHO_WATER, 1, 1, 0, 5);
    expect(drop).toBeCloseTo(RHO_WATER * g_SI * 5, 6);
  });
});

describe("continuityVelocity", () => {
  it("halving area doubles the flow speed", () => {
    expect(continuityVelocity(3, 2, 1)).toBeCloseTo(6, 12);
  });

  it("equal areas leave v unchanged", () => {
    expect(continuityVelocity(5, 1, 1)).toBe(5);
  });

  it("throws if downstream area is zero or negative", () => {
    expect(() => continuityVelocity(1, 1, 0)).toThrow();
    expect(() => continuityVelocity(1, 1, -0.1)).toThrow();
  });
});

describe("venturiPressureDrop", () => {
  it("is zero when the area does not change", () => {
    expect(venturiPressureDrop(RHO_WATER, 2, 1)).toBe(0);
  });

  it("is positive when the pipe narrows (A₁ > A₂ => ratio > 1)", () => {
    expect(venturiPressureDrop(RHO_WATER, 2, 2)).toBeGreaterThan(0);
  });

  it("matches the direct Bernoulli result via continuity", () => {
    const v1 = 2;
    const ratio = 3; // A₁ / A₂
    const v2 = v1 * ratio;
    const direct = 0.5 * RHO_WATER * (v2 * v2 - v1 * v1);
    expect(venturiPressureDrop(RHO_WATER, v1, ratio)).toBeCloseTo(direct, 6);
  });
});

describe("venturiRadius", () => {
  const profile = {
    length: 1,
    mouthRadius: 0.1,
    throatRadius: 0.04,
    throatFraction: 0.4,
  };

  it("returns mouthRadius at both ends", () => {
    expect(venturiRadius(0, profile)).toBeCloseTo(0.1, 10);
    expect(venturiRadius(1, profile)).toBeCloseTo(0.1, 10);
  });

  it("returns throatRadius at the centre", () => {
    expect(venturiRadius(0.5, profile)).toBeCloseTo(0.04, 10);
  });

  it("stays within [throat, mouth] everywhere", () => {
    for (let i = 0; i <= 40; i++) {
      const x = i / 40;
      const r = venturiRadius(x, profile);
      expect(r).toBeGreaterThanOrEqual(0.04 - 1e-9);
      expect(r).toBeLessThanOrEqual(0.1 + 1e-9);
    }
  });
});

describe("sampleVenturi", () => {
  const opts = {
    length: 1,
    mouthRadius: 0.1,
    throatRadius: 0.05,
    rho: RHO_WATER,
    inletVelocity: 1,
    samples: 101,
  };

  it("conserves the Bernoulli head at every sample", () => {
    const samples = sampleVenturi(opts);
    const headRef =
      samples[0]!.pressure + 0.5 * opts.rho * samples[0]!.velocity ** 2;
    for (const s of samples) {
      const head = s.pressure + 0.5 * opts.rho * s.velocity ** 2;
      expect(head).toBeCloseTo(headRef, 4);
    }
  });

  it("is fastest and lowest-pressure exactly at the throat", () => {
    const samples = sampleVenturi(opts);
    let vMaxIdx = 0;
    let pMinIdx = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i]!.velocity > samples[vMaxIdx]!.velocity) vMaxIdx = i;
      if (samples[i]!.pressure < samples[pMinIdx]!.pressure) pMinIdx = i;
    }
    expect(vMaxIdx).toBe(pMinIdx);
    // Throat sits at x = L/2, i.e. index (n-1)/2
    expect(samples[vMaxIdx]!.x).toBeCloseTo(opts.length / 2, 6);
  });

  it("narrower throat => larger pressure drop", () => {
    const wide = sampleVenturi({ ...opts, throatRadius: 0.08 });
    const narrow = sampleVenturi({ ...opts, throatRadius: 0.03 });
    const wideDrop = wide[0]!.pressure - Math.min(...wide.map((s) => s.pressure));
    const narrowDrop =
      narrow[0]!.pressure - Math.min(...narrow.map((s) => s.pressure));
    expect(narrowDrop).toBeGreaterThan(wideDrop);
  });
});

describe("torricelliVelocity", () => {
  it("v = √(2 g h) at h = 5 m", () => {
    expect(torricelliVelocity(5)).toBeCloseTo(Math.sqrt(2 * g_SI * 5), 10);
  });

  it("returns 0 for non-positive depth", () => {
    expect(torricelliVelocity(0)).toBe(0);
    expect(torricelliVelocity(-1)).toBe(0);
  });
});

describe("dynamicPressure", () => {
  it("matches ½ρv²", () => {
    expect(dynamicPressure(RHO_AIR, 30)).toBeCloseTo(0.5 * RHO_AIR * 900, 8);
  });

  it("is zero at rest", () => {
    expect(dynamicPressure(RHO_WATER, 0)).toBe(0);
  });
});
