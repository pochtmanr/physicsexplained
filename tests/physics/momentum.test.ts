import { describe, it, expect } from "vitest";
import {
  elasticCollision,
  inelasticCollision,
  restitutionCollision,
  pairKE,
  pairP,
  tsiolkovskyDeltaV,
  rocketMassRatio,
} from "@/lib/physics/momentum";

describe("elasticCollision", () => {
  it("equal masses, B at rest: A stops, B takes A's velocity (Newton's cradle)", () => {
    const { vA, vB } = elasticCollision(1, 3, 1, 0);
    expect(vA).toBeCloseTo(0, 12);
    expect(vB).toBeCloseTo(3, 12);
  });

  it("heavy A hits light B at rest: B flies off at ~2 v_A", () => {
    const vA0 = 2;
    const { vA, vB } = elasticCollision(1000, vA0, 1, 0);
    expect(vB).toBeCloseTo(2 * vA0, 2);
    expect(vA).toBeCloseTo(vA0, 2);
  });

  it("light A hits heavy B at rest: A bounces back at ~−v_A", () => {
    const vA0 = 2;
    const { vA, vB } = elasticCollision(1, vA0, 1000, 0);
    expect(vA).toBeCloseTo(-vA0, 2);
    expect(vB).toBeCloseTo(0, 2);
  });

  it("conserves momentum and kinetic energy for arbitrary inputs", () => {
    const cases = [
      { mA: 1, vA: 4, mB: 2, vB: -1 },
      { mA: 3, vA: 1.5, mB: 0.5, vB: 2 },
      { mA: 2.5, vA: -3, mB: 1, vB: 0 },
    ];
    for (const c of cases) {
      const p0 = pairP(c.mA, c.vA, c.mB, c.vB);
      const ke0 = pairKE(c.mA, c.vA, c.mB, c.vB);
      const { vA, vB } = elasticCollision(c.mA, c.vA, c.mB, c.vB);
      const p1 = pairP(c.mA, vA, c.mB, vB);
      const ke1 = pairKE(c.mA, vA, c.mB, vB);
      expect(p1).toBeCloseTo(p0, 10);
      expect(ke1).toBeCloseTo(ke0, 10);
    }
  });
});

describe("inelasticCollision", () => {
  it("stick-together velocity = weighted mean of initial velocities", () => {
    expect(inelasticCollision(1, 4, 3, 0)).toBeCloseTo(1, 12);
    expect(inelasticCollision(2, 3, 2, -1)).toBeCloseTo(1, 12);
  });

  it("conserves momentum", () => {
    const mA = 2, vA = 5, mB = 3, vB = -2;
    const v = inelasticCollision(mA, vA, mB, vB);
    expect((mA + mB) * v).toBeCloseTo(pairP(mA, vA, mB, vB), 10);
  });

  it("always dissipates kinetic energy (or leaves it unchanged if already moving together)", () => {
    const mA = 1, vA = 4, mB = 3, vB = 0;
    const ke0 = pairKE(mA, vA, mB, vB);
    const v = inelasticCollision(mA, vA, mB, vB);
    const ke1 = pairKE(mA, v, mB, v);
    expect(ke1).toBeLessThan(ke0);
  });
});

describe("restitutionCollision", () => {
  it("e=1 reproduces the elastic case", () => {
    const mA = 2, vA = 3, mB = 1, vB = -1;
    const elastic = elasticCollision(mA, vA, mB, vB);
    const partial = restitutionCollision(mA, vA, mB, vB, 1);
    expect(partial.vA).toBeCloseTo(elastic.vA, 10);
    expect(partial.vB).toBeCloseTo(elastic.vB, 10);
  });

  it("e=0 reproduces the perfectly inelastic case (both end at vCM)", () => {
    const mA = 2, vA = 3, mB = 1, vB = -1;
    const vCM = inelasticCollision(mA, vA, mB, vB);
    const { vA: vAf, vB: vBf } = restitutionCollision(mA, vA, mB, vB, 0);
    expect(vAf).toBeCloseTo(vCM, 10);
    expect(vBf).toBeCloseTo(vCM, 10);
  });

  it("conserves momentum for any e ∈ [0, 1]", () => {
    const mA = 1.5, vA = 4, mB = 2, vB = -1;
    const p0 = pairP(mA, vA, mB, vB);
    for (const e of [0, 0.25, 0.5, 0.75, 1]) {
      const { vA: vAf, vB: vBf } = restitutionCollision(mA, vA, mB, vB, e);
      expect(pairP(mA, vAf, mB, vBf)).toBeCloseTo(p0, 10);
    }
  });

  it("relative velocity after = −e × relative velocity before", () => {
    const mA = 1, vA = 5, mB = 3, vB = 0;
    for (const e of [0.2, 0.5, 0.8]) {
      const { vA: vAf, vB: vBf } = restitutionCollision(mA, vA, mB, vB, e);
      expect(vBf - vAf).toBeCloseTo(-e * (vB - vA), 10);
    }
  });
});

describe("tsiolkovskyDeltaV", () => {
  it("Δv is zero when no mass is expelled", () => {
    expect(tsiolkovskyDeltaV(4500, 1000, 1000)).toBeCloseTo(0, 12);
  });

  it("Δv = u · ln 2 when the rocket halves its mass", () => {
    const u = 4500;
    expect(tsiolkovskyDeltaV(u, 1000, 500)).toBeCloseTo(
      u * Math.log(2),
      10,
    );
  });

  it("Δv scales linearly with exhaust velocity at fixed mass ratio", () => {
    const ratio = 8;
    const m0 = 1000;
    const mf = m0 / ratio;
    const d1 = tsiolkovskyDeltaV(1000, m0, mf);
    const d2 = tsiolkovskyDeltaV(4000, m0, mf);
    expect(d2 / d1).toBeCloseTo(4, 10);
  });

  it("Saturn V order-of-magnitude sanity: u=4500 m/s, mass ratio 8 → ~9.35 km/s", () => {
    const dv = tsiolkovskyDeltaV(4500, 8, 1);
    expect(dv / 1000).toBeGreaterThan(9);
    expect(dv / 1000).toBeLessThan(10);
  });

  it("throws on non-physical inputs", () => {
    expect(() => tsiolkovskyDeltaV(4500, 1000, 0)).toThrow();
    expect(() => tsiolkovskyDeltaV(4500, 100, 200)).toThrow();
    expect(() => tsiolkovskyDeltaV(4500, -1, 1)).toThrow();
  });
});

describe("rocketMassRatio", () => {
  it("round-trips with tsiolkovskyDeltaV", () => {
    const u = 4500;
    const dv = 9400;
    const ratio = rocketMassRatio(dv, u);
    expect(tsiolkovskyDeltaV(u, ratio, 1)).toBeCloseTo(dv, 8);
  });

  it("Δv=0 → mass ratio 1", () => {
    expect(rocketMassRatio(0, 4500)).toBeCloseTo(1, 12);
  });

  it("throws on zero exhaust velocity", () => {
    expect(() => rocketMassRatio(9400, 0)).toThrow();
  });
});
