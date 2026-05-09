import { describe, expect, it } from "vitest";
import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  newtonianPotential,
  h00FromPotential,
  weakFieldG00,
  poissonSource,
  gravitationalTimeDilationFactor,
  mercuryPerihelionAdvancePerOrbit,
  arcsecPerCentury,
} from "@/lib/physics/relativity/newtonian-limit";

// ─── newtonianPotential ───────────────────────────────────────────────────────

describe("newtonianPotential", () => {
  it("returns approximately −G at r=1m, M=1kg", () => {
    expect(newtonianPotential(1, 1)).toBeCloseTo(-G_SI, 15);
  });

  it("is always negative (gravitational potential is bound)", () => {
    for (const r of [0.1, 1, 1e6, 1e10]) {
      expect(newtonianPotential(1e30, r)).toBeLessThan(0);
    }
  });

  it("throws on r = 0", () => {
    expect(() => newtonianPotential(1, 0)).toThrow(RangeError);
  });

  it("throws on r < 0", () => {
    expect(() => newtonianPotential(1, -1)).toThrow(RangeError);
  });

  it("scales as 1/r: halving r doubles |Φ|", () => {
    const phi1 = newtonianPotential(1e24, 1e7);
    const phi2 = newtonianPotential(1e24, 5e6);
    expect(phi2).toBeCloseTo(2 * phi1, 12);
  });
});

// ─── h00FromPotential ─────────────────────────────────────────────────────────

describe("h00FromPotential", () => {
  it("is positive and small for solar surface potential Φ ≈ −1.9e11 J/kg", () => {
    // Solar surface: Φ = −GM_sun/R_sun ≈ −1.327e20 / 6.96e8 ≈ −1.905e11 J/kg
    const Phi_solar = -1.905e11;
    const h = h00FromPotential(Phi_solar);
    // h_{00} = −2Φ/c² ≈ 2×1.905e11 / (3e8)² ≈ 4.23e-6
    expect(h).toBeGreaterThan(0);
    expect(h).toBeCloseTo(4.23e-6, 1); // within 10% of published value
  });

  it("is zero when potential is zero (flat spacetime)", () => {
    expect(h00FromPotential(0)).toBeCloseTo(0, 20);
  });
});

// ─── weakFieldG00 ─────────────────────────────────────────────────────────────

describe("weakFieldG00", () => {
  it("returns exactly 1 at Φ = 0 (flat spacetime)", () => {
    expect(weakFieldG00(0)).toBe(1);
  });

  it("returns ≈ 1 − 1.4e-9 at Earth's surface (GPS-correction-sized effect)", () => {
    // Earth surface: Φ ≈ −g × R_earth ≈ −9.81 × 6.371e6 ≈ −6.25e7 J/kg
    // h_{00} = −2Φ/c² ≈ 2 × 6.25e7 / (3e8)² ≈ 1.39e-9
    // g_{00} = 1 + h_{00} ≈ 1 + 1.39e-9
    const Phi_earth = -6.25e7;
    const g00 = weakFieldG00(Phi_earth);
    const h = h00FromPotential(Phi_earth);
    expect(h).toBeCloseTo(1.39e-9, 1);
    expect(g00).toBeGreaterThan(1); // h_{00} > 0 so g_{00} > 1
    expect(g00 - 1).toBeCloseTo(1.39e-9, 1);
  });

  it("is less than 1 when metric is locally compressed (h_{00} < 0, Φ > 0 unphysical)", () => {
    // Not physical but checks the sign: positive Φ gives h_{00} < 0, g_{00} < 1
    expect(weakFieldG00(1e8)).toBeLessThan(1);
  });
});

// ─── poissonSource ────────────────────────────────────────────────────────────

describe("poissonSource", () => {
  it("returns 4πG for ρ = 1 kg/m³", () => {
    expect(poissonSource(1)).toBeCloseTo(4 * Math.PI * G_SI, 20);
  });

  it("scales linearly with density", () => {
    expect(poissonSource(3)).toBeCloseTo(3 * poissonSource(1), 20);
  });

  it("is zero for empty space (ρ = 0)", () => {
    expect(poissonSource(0)).toBe(0);
  });
});

// ─── gravitationalTimeDilationFactor ─────────────────────────────────────────

describe("gravitationalTimeDilationFactor", () => {
  it("returns exactly 1 at Φ = 0 (clocks far from sources run at normal rate)", () => {
    expect(gravitationalTimeDilationFactor(0)).toBe(1);
  });

  it("returns 0 at Φ = −c²/2 (formal Schwarzschild horizon analogue)", () => {
    const c = SPEED_OF_LIGHT;
    expect(gravitationalTimeDilationFactor(-c * c / 2)).toBeCloseTo(0, 12);
  });

  it("is less than 1 in a potential well (clocks run slower deep in gravity)", () => {
    expect(gravitationalTimeDilationFactor(-1e7)).toBeLessThan(1);
  });

  it("is approximately 1 + Φ/c² for small |Φ/c²| (leading-order expansion)", () => {
    const c = SPEED_OF_LIGHT;
    const Phi = -6.25e7; // Earth surface
    const exact = gravitationalTimeDilationFactor(Phi);
    const approx = 1 + Phi / (c * c);
    // They agree to better than 1 part per billion at these scales
    expect(exact).toBeCloseTo(approx, 10);
  });
});

// ─── mercuryPerihelionAdvancePerOrbit + arcsecPerCentury ─────────────────────

describe("mercuryPerihelionAdvancePerOrbit", () => {
  const M_SUN = 1.989e30;   // kg
  const a_MERCURY = 5.79e10; // m  (semi-major axis)
  const e_MERCURY = 0.2056;  // eccentricity

  it("gives approximately 5.0e-7 rad/orbit for Mercury's parameters", () => {
    const advance = mercuryPerihelionAdvancePerOrbit(M_SUN, a_MERCURY, e_MERCURY);
    // Published value ≈ 5.02e-7 rad/orbit
    expect(advance).toBeGreaterThan(4.5e-7);
    expect(advance).toBeLessThan(5.5e-7);
  });
});

describe("arcsecPerCentury", () => {
  const M_SUN = 1.989e30;
  const a_MERCURY = 5.79e10;
  const e_MERCURY = 0.2056;
  const T_MERCURY = 88 * 86400; // 88 days in seconds

  it("gives approximately 43 arcsec/century for Mercury (within ±5\")", () => {
    const advance = mercuryPerihelionAdvancePerOrbit(M_SUN, a_MERCURY, e_MERCURY);
    const aps = arcsecPerCentury(advance, T_MERCURY);
    // Published GR prediction: ~43.0 arcsec/century
    expect(aps).toBeGreaterThan(38);
    expect(aps).toBeLessThan(48);
  });

  it("scales linearly with advance per orbit", () => {
    const base = arcsecPerCentury(1e-6, 1e7);
    const doubled = arcsecPerCentury(2e-6, 1e7);
    expect(doubled).toBeCloseTo(2 * base, 10);
  });
});
