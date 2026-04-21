import { describe, it, expect } from "vitest";
import {
  angularFrequency,
  dAlembert,
  gaussianPulse,
  linearEnergyDensity,
  period,
  phaseVelocity,
  sineWave,
  stringWaveSpeed,
  waveEquationResidual,
  waveNumber,
  wavePower,
} from "@/lib/physics/waves";

describe("waves — kinematics", () => {
  it("wave number is 2π/λ", () => {
    expect(waveNumber(2 * Math.PI)).toBeCloseTo(1, 12);
    expect(waveNumber(1)).toBeCloseTo(2 * Math.PI, 12);
  });

  it("angular frequency is 2π f", () => {
    expect(angularFrequency(1)).toBeCloseTo(2 * Math.PI, 12);
    expect(angularFrequency(0)).toBe(0);
  });

  it("phase velocity satisfies v = fλ", () => {
    expect(phaseVelocity(5, 2)).toBe(10);
    expect(phaseVelocity(0.25, 4)).toBe(1);
  });

  it("period is 1/f", () => {
    expect(period(2)).toBe(0.5);
    expect(() => period(0)).toThrow();
  });

  it("string wave speed is √(T/μ)", () => {
    expect(stringWaveSpeed(100, 4)).toBe(5);
    expect(stringWaveSpeed(0, 1)).toBe(0);
    expect(() => stringWaveSpeed(1, 0)).toThrow();
  });
});

describe("waves — sinusoidal shape", () => {
  const params = { amplitude: 2, wavelength: 4, frequency: 1 };

  it("returns 0 at the origin at t = 0 (phase = 0)", () => {
    expect(sineWave(0, 0, params)).toBeCloseTo(0, 12);
  });

  it("reaches full amplitude one quarter-wavelength in at t = 0", () => {
    expect(sineWave(1, 0, params)).toBeCloseTo(2, 12);
  });

  it("is periodic in x with period λ", () => {
    const y0 = sineWave(0.7, 0.3, params);
    const y1 = sineWave(0.7 + params.wavelength, 0.3, params);
    expect(y1).toBeCloseTo(y0, 10);
  });

  it("is periodic in t with period 1/f", () => {
    const y0 = sineWave(0.7, 0.3, params);
    const y1 = sineWave(0.7, 0.3 + 1 / params.frequency, params);
    expect(y1).toBeCloseTo(y0, 10);
  });

  it("propagates in +x — crest at (x, t) is at (x + vΔt, t + Δt)", () => {
    const v = phaseVelocity(params.frequency, params.wavelength);
    const dt = 0.17;
    const yA = sineWave(1.3, 0.5, params);
    const yB = sineWave(1.3 + v * dt, 0.5 + dt, params);
    expect(yB).toBeCloseTo(yA, 10);
  });
});

describe("waves — Gaussian pulse", () => {
  it("peaks at x0 at t = 0", () => {
    expect(gaussianPulse(0, 0, 0, 3, 0.5, 1)).toBeCloseTo(1, 12);
  });

  it("is shape-preserving — pulse at (x0 + vt, t) equals pulse at (x0, 0)", () => {
    const v = 2;
    const t = 3;
    const x0 = -1;
    const y0 = gaussianPulse(x0, 0, x0, v, 0.4, 1.5);
    const yT = gaussianPulse(x0 + v * t, t, x0, v, 0.4, 1.5);
    expect(yT).toBeCloseTo(y0, 12);
  });

  it("decays symmetrically around the pulse centre", () => {
    const left = gaussianPulse(-0.6, 0, 0, 0, 0.3, 1);
    const right = gaussianPulse(0.6, 0, 0, 0, 0.3, 1);
    expect(left).toBeCloseTo(right, 12);
  });
});

describe("waves — d'Alembert solution satisfies the wave equation", () => {
  it("f(x − vt) with smooth f has zero PDE residual", () => {
    const v = 3;
    const f = (u: number) => Math.sin(u) * Math.exp(-u * u * 0.05);
    const g = () => 0;
    const y = (x: number, t: number) => dAlembert(x, t, v, f, g);
    expect(waveEquationResidual(y, 0.4, 0.3, v)).toBeLessThan(1e-4);
    expect(waveEquationResidual(y, -1.1, 0.7, v)).toBeLessThan(1e-4);
  });

  it("f + g (right-mover plus left-mover) also satisfies the PDE", () => {
    const v = 2;
    const f = (u: number) => Math.exp(-((u - 0.5) ** 2));
    const g = (u: number) => Math.exp(-((u + 0.5) ** 2));
    const y = (x: number, t: number) => dAlembert(x, t, v, f, g);
    expect(waveEquationResidual(y, 0.2, 0.25, v)).toBeLessThan(1e-4);
  });

  it("arbitrary non-solution (e.g. f(x + vt²)) has non-zero residual", () => {
    const v = 2;
    const y = (x: number, t: number) => Math.sin(x + v * t * t);
    expect(waveEquationResidual(y, 0.3, 0.4, v)).toBeGreaterThan(0.01);
  });
});

describe("waves — energy", () => {
  it("linear energy density scales as A² ω²", () => {
    const uA = linearEnergyDensity(0.01, 1, 10);
    const u2A = linearEnergyDensity(0.01, 2, 10);
    expect(u2A / uA).toBeCloseTo(4, 10);

    const u2w = linearEnergyDensity(0.01, 1, 20);
    expect(u2w / uA).toBeCloseTo(4, 10);
  });

  it("power is energy density times speed", () => {
    const mu = 0.02;
    const A = 0.3;
    const w = 15;
    const v = 50;
    expect(wavePower(mu, A, w, v)).toBeCloseTo(
      0.5 * mu * A * A * w * w * v,
      10,
    );
  });
});
