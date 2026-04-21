import { describe, it, expect } from "vitest";
import {
  C_SI,
  phaseVelocity,
  groupVelocity,
  nonDispersive,
  schrodingerFreeParticle,
  deepWaterGravityWave,
  gaussianPacket,
  gaussianWidth,
  refractiveIndex,
  rainbowDeviationAngle,
} from "@/lib/physics/dispersion";

describe("phase velocity", () => {
  it("returns omega / k", () => {
    expect(phaseVelocity(10, 2)).toBe(5);
  });

  it("returns +Infinity at k = 0", () => {
    expect(phaseVelocity(1, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("group velocity", () => {
  it("matches c for light in vacuum", () => {
    const omega = nonDispersive(1);
    expect(groupVelocity(omega, 1)).toBeCloseTo(C_SI, -2);
  });

  it("matches c/n for a non-dispersive medium with n = 1.5", () => {
    const n = 1.5;
    const omega = nonDispersive(n);
    expect(groupVelocity(omega, 2)).toBeCloseTo(C_SI / n, -2);
  });

  it("equals v_p for a linear dispersion relation", () => {
    const omega = nonDispersive(1.33);
    const k = 3.3;
    expect(groupVelocity(omega, k)).toBeCloseTo(
      phaseVelocity(omega(k), k),
      -1,
    );
  });
});

describe("quantum free particle", () => {
  it("v_g equals 2 * v_p at every k (hbar = m = 1)", () => {
    const omega = schrodingerFreeParticle(1, 1);
    for (const k of [0.5, 1, 2, 3]) {
      const vp = phaseVelocity(omega(k), k);
      const vg = groupVelocity(omega, k);
      expect(vg).toBeCloseTo(2 * vp, 6);
    }
  });
});

describe("deep-water gravity waves", () => {
  it("v_g equals v_p / 2 (Stokes, 1847)", () => {
    const g = 9.80665;
    const omega = deepWaterGravityWave(g);
    for (const k of [0.5, 1, 2, 4]) {
      const vp = phaseVelocity(omega(k), k);
      const vg = groupVelocity(omega, k);
      expect(vg).toBeCloseTo(vp / 2, 4);
    }
  });
});

describe("Gaussian packet construction", () => {
  it("at t = 0 peak envelope sits at x = 0", () => {
    const xs = Array.from({ length: 61 }, (_, i) => (i - 30) * 0.5);
    const samples = gaussianPacket(xs, 0, {
      k0: 5,
      sigma: 2,
      omega: nonDispersive(1),
      nModes: 129,
    });
    let peak = samples[0]!;
    for (const s of samples) if (s.envelope > peak.envelope) peak = s;
    expect(Math.abs(peak.x)).toBeLessThan(0.5);
    expect(peak.envelope).toBeGreaterThan(0.9);
  });

  it("non-dispersive medium translates packet without spreading", () => {
    const xs = Array.from({ length: 201 }, (_, i) => (i - 100) * 0.2);
    const v = C_SI; // n = 1
    const omega = nonDispersive(1);

    const initial = gaussianPacket(xs, 0, {
      k0: 5,
      sigma: 2,
      omega,
      nModes: 129,
    });
    // Pick a very small t so numerics don't care about large phases.
    const t = 1e-9;
    const shifted = gaussianPacket(xs, t, {
      k0: 5,
      sigma: 2,
      omega,
      nModes: 129,
    });

    // Envelope widths should agree to high precision.
    const width = (samples: { x: number; envelope: number }[]) => {
      let xBar = 0;
      let total = 0;
      for (const s of samples) {
        const w = s.envelope * s.envelope;
        xBar += s.x * w;
        total += w;
      }
      const mean = xBar / total;
      let var_ = 0;
      for (const s of samples) {
        const w = s.envelope * s.envelope;
        var_ += w * (s.x - mean) ** 2;
      }
      return Math.sqrt(var_ / total);
    };

    expect(width(shifted)).toBeCloseTo(width(initial), 3);
  });
});

describe("Gaussian width formula", () => {
  it("recovers sigma0 at t = 0", () => {
    expect(gaussianWidth(2, 5, 0)).toBeCloseTo(2, 10);
  });

  it("grows monotonically for beta != 0", () => {
    const w0 = gaussianWidth(1, 1, 0);
    const w1 = gaussianWidth(1, 1, 1);
    const w2 = gaussianWidth(1, 1, 2);
    expect(w1).toBeGreaterThan(w0);
    expect(w2).toBeGreaterThan(w1);
  });

  it("returns sigma0 unchanged when beta = 0", () => {
    expect(gaussianWidth(3, 0, 10)).toBeCloseTo(3, 10);
  });
});

describe("refractive index utilities", () => {
  it("n = c / v_p inverts phaseVelocity", () => {
    const vp = C_SI / 1.5;
    expect(refractiveIndex(vp)).toBeCloseTo(1.5, 10);
  });

  it("primary rainbow sits at about 42 degrees for water (n=1.333)", () => {
    const { rainbowAngleDeg } = rainbowDeviationAngle(1.333);
    expect(rainbowAngleDeg).toBeGreaterThan(41);
    expect(rainbowAngleDeg).toBeLessThan(43);
  });

  it("red (n=1.331) sits outside violet (n=1.343) on the bow", () => {
    const red = rainbowDeviationAngle(1.331).rainbowAngleDeg;
    const violet = rainbowDeviationAngle(1.343).rainbowAngleDeg;
    expect(red).toBeGreaterThan(violet);
  });
});
