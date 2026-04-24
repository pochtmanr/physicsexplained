import { describe, expect, it } from "vitest";
import {
  duaneHuntEnergy,
  duaneHuntWavelengthM,
  kramersSpectrum,
  thinTargetSpectrum,
  bremsstrahlungAngularDistribution,
} from "@/lib/physics/electromagnetism/bremsstrahlung";
import { ELEMENTARY_CHARGE } from "@/lib/physics/constants";

describe("Bremsstrahlung — Duane-Hunt cutoff", () => {
  it("50 kV tube produces a 50 keV photon ceiling (within 1 eV)", () => {
    // E_max = e · U. For U = 50 000 V, E_max / e should be exactly
    // 50 000 eV up to floating-point noise.
    const E = duaneHuntEnergy(50_000);
    const energyEv = E / ELEMENTARY_CHARGE;
    expect(Math.abs(energyEv - 50_000)).toBeLessThan(1);
  });

  it("minimum wavelength at 50 kV is ≈ 24.8 pm", () => {
    // λ_min = h c / (e U) = 6.626e-34 · 3e8 / (1.602e-19 · 5e4)
    //       ≈ 2.48e-11 m = 24.8 pm.
    const lambda = duaneHuntWavelengthM(50_000);
    expect(lambda).toBeGreaterThan(2.4e-11);
    expect(lambda).toBeLessThan(2.6e-11);
  });

  it("Duane-Hunt energy scales linearly with voltage", () => {
    expect(duaneHuntEnergy(100_000)).toBeCloseTo(
      2 * duaneHuntEnergy(50_000),
      20,
    );
  });

  it("rejects negative voltages", () => {
    expect(() => duaneHuntEnergy(-1)).toThrow();
    expect(() => duaneHuntWavelengthM(0)).toThrow();
  });
});

describe("Bremsstrahlung — Kramers thick-target spectrum", () => {
  it("returns zero for E above the Duane-Hunt cutoff", () => {
    expect(kramersSpectrum(60, 50)).toBe(0);
    expect(kramersSpectrum(50.01, 50)).toBe(0);
  });

  it("returns zero at E = E_max (linear fall-off to the edge)", () => {
    expect(kramersSpectrum(50, 50)).toBe(0);
  });

  it("integrates to a finite total via trapezoidal rule from ε to E_max", () => {
    // dN/dE = (E_max − E)/E = E_max/E − 1. This diverges as 1/E at
    // low E but integrates to E_max · ln(E_max/ε) − (E_max − ε) over
    // [ε, E_max], which is finite for any positive cutoff ε. Check
    // both the analytic closed form and the trapezoidal numerical
    // integral match to ~1 %.
    const E_max = 50;
    const eps = 1;
    const N = 4000;
    const dx = (E_max - eps) / N;
    let total = 0;
    for (let i = 0; i <= N; i++) {
      const E = eps + i * dx;
      const w = i === 0 || i === N ? 0.5 : 1;
      total += w * kramersSpectrum(E, E_max) * dx;
    }
    const analytic = E_max * Math.log(E_max / eps) - (E_max - eps);
    expect(total).toBeGreaterThan(0);
    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBeCloseTo(analytic, 1); // within 0.05 absolute
    expect(Math.abs((total - analytic) / analytic)).toBeLessThan(0.01);
  });
});

describe("Bremsstrahlung — thin-target (Bethe-Heitler) spectrum", () => {
  it("is positive and finite for 0 < E < E_max", () => {
    const v = thinTargetSpectrum(10, 50);
    expect(v).toBeGreaterThan(0);
    expect(Number.isFinite(v)).toBe(true);
  });

  it("is gentler than Kramers at low energies (logarithmic vs 1/E)", () => {
    // At E = 1 keV, E_max = 50 keV: Kramers → 49, Bethe-Heitler → ln(50) ≈ 3.91.
    const kr = kramersSpectrum(1, 50);
    const bh = thinTargetSpectrum(1, 50);
    expect(kr).toBeGreaterThan(bh);
    expect(bh).toBeCloseTo(Math.log(50), 10);
  });

  it("vanishes at and above the cutoff", () => {
    expect(thinTargetSpectrum(50, 50)).toBe(0);
    expect(thinTargetSpectrum(51, 50)).toBe(0);
  });
});

describe("Bremsstrahlung — angular distribution", () => {
  it("reduces to sin²θ at γ = 1 (non-relativistic limit) within 1e-12", () => {
    const thetas = [0, 0.1, 0.5, 1.0, Math.PI / 2, 2.0, Math.PI - 0.1];
    for (const th of thetas) {
      const got = bremsstrahlungAngularDistribution(th, 1);
      const want = Math.sin(th) * Math.sin(th);
      expect(Math.abs(got - want)).toBeLessThan(1e-12);
    }
  });

  it("peaks forward-of-broadside at γ ≫ 1 (relativistic beaming)", () => {
    // At γ = 10 the maximum of sin²θ / (1 − β cos θ)⁴ has shifted
    // from θ = π/2 toward small θ. Verify the peak is closer to the
    // forward axis than π/2.
    const gamma = 10;
    let bestTheta = 0;
    let bestVal = -1;
    for (let i = 1; i < 200; i++) {
      const th = (i / 200) * Math.PI;
      const v = bremsstrahlungAngularDistribution(th, gamma);
      if (v > bestVal) {
        bestVal = v;
        bestTheta = th;
      }
    }
    expect(bestTheta).toBeLessThan(Math.PI / 4);
    expect(bestTheta).toBeGreaterThan(0);
    // And at θ = 0 (straight forward) the sin²θ factor kills the lobe.
    expect(bremsstrahlungAngularDistribution(0, gamma)).toBe(0);
  });

  it("rejects γ < 1", () => {
    expect(() => bremsstrahlungAngularDistribution(1, 0.5)).toThrow();
  });
});
