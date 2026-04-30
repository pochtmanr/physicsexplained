import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  EARTH_MASS_KG,
  EARTH_RADIUS_M,
  GPS_ORBIT_RADIUS_M,
  SECONDS_PER_DAY,
  gpsOrbitalSpeed,
  grCorrectionSecondsPerDay,
  netCorrectionMicrosecondsPerDay,
  srCorrectionSecondsPerDay,
  uncorrectedDriftKmPerDay,
  uncorrectedDriftMeters,
} from "@/lib/physics/relativity/gps-corrections";

describe("gpsOrbitalSpeed", () => {
  it("at GPS orbit radius (~26,571 km from Earth's center) returns ≈ 3873 m/s", () => {
    const v = gpsOrbitalSpeed();
    expect(v).toBeGreaterThan(3870);
    expect(v).toBeLessThan(3876);
  });

  it("β = v/c at GPS orbit is ≈ 1.29 × 10⁻⁵ (deeply non-relativistic but kinematically nonzero)", () => {
    const beta = gpsOrbitalSpeed() / SPEED_OF_LIGHT;
    expect(beta).toBeGreaterThan(1.28e-5);
    expect(beta).toBeLessThan(1.3e-5);
  });

  it("scales as 1/√r (Kepler): doubling the orbit radius reduces speed by √2", () => {
    const v1 = gpsOrbitalSpeed(GPS_ORBIT_RADIUS_M);
    const v2 = gpsOrbitalSpeed(2 * GPS_ORBIT_RADIUS_M);
    expect(v2).toBeCloseTo(v1 / Math.sqrt(2), 3);
  });
});

describe("srCorrectionSecondsPerDay", () => {
  it("at GPS speed gives ≈ −7.2 μs/day (canonical SR clock-slowing)", () => {
    const v = gpsOrbitalSpeed();
    const sr = srCorrectionSecondsPerDay(v) * 1e6; // μs/day
    expect(sr).toBeGreaterThan(-7.5);
    expect(sr).toBeLessThan(-7.0);
  });

  it("is exactly zero at v = 0 (clock at rest in the same frame)", () => {
    expect(srCorrectionSecondsPerDay(0)).toBe(0);
  });

  it("is always negative for any v > 0 (moving clocks run slow)", () => {
    expect(srCorrectionSecondsPerDay(1000)).toBeLessThan(0);
    expect(srCorrectionSecondsPerDay(100_000)).toBeLessThan(0);
  });

  it("matches the Taylor expansion −β²/2 · 86400 s to relative 10⁻⁵ at GPS speed", () => {
    const v = gpsOrbitalSpeed();
    const beta = v / SPEED_OF_LIGHT;
    const exact = srCorrectionSecondsPerDay(v);
    const approx = (-beta * beta * 0.5) * SECONDS_PER_DAY;
    expect(Math.abs(exact - approx) / Math.abs(exact)).toBeLessThan(1e-5);
  });
});

describe("grCorrectionSecondsPerDay", () => {
  it("at GPS altitude gives ≈ +45.7 μs/day (canonical GR clock-speedup)", () => {
    const gr = grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M) * 1e6;
    expect(gr).toBeGreaterThan(45.0);
    expect(gr).toBeLessThan(46.5);
  });

  it("is positive when orbit radius > surface radius (orbit clock gains time)", () => {
    expect(grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M)).toBeGreaterThan(0);
  });

  it("is exactly zero when orbit radius equals surface radius", () => {
    const gr = grCorrectionSecondsPerDay(EARTH_RADIUS_M, EARTH_RADIUS_M);
    expect(gr).toBe(0);
  });

  it("is negative when orbit radius < surface radius (deep clock loses time vs surface)", () => {
    const gr = grCorrectionSecondsPerDay(EARTH_RADIUS_M * 0.9);
    expect(gr).toBeLessThan(0);
  });
});

describe("netCorrectionMicrosecondsPerDay", () => {
  it("at canonical GPS parameters is ≈ +38.5 μs/day (GR dominates by ~6×)", () => {
    const net = netCorrectionMicrosecondsPerDay();
    expect(net).toBeGreaterThan(37.5);
    expect(net).toBeLessThan(39.5);
  });

  it("equals srCorrection + grCorrection scaled to μs", () => {
    const v = gpsOrbitalSpeed();
    const sr = srCorrectionSecondsPerDay(v);
    const gr = grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M);
    const expected = (sr + gr) * 1e6;
    expect(netCorrectionMicrosecondsPerDay()).toBeCloseTo(expected, 8);
  });

  it("GR contribution is ~6× larger in magnitude than SR contribution", () => {
    const v = gpsOrbitalSpeed();
    const sr = Math.abs(srCorrectionSecondsPerDay(v));
    const gr = Math.abs(grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M));
    expect(gr / sr).toBeGreaterThan(5.5);
    expect(gr / sr).toBeLessThan(6.7);
  });
});

describe("uncorrectedDriftKmPerDay", () => {
  it("at canonical GPS parameters is ≈ 11.5 km/day", () => {
    const d = uncorrectedDriftKmPerDay();
    expect(d).toBeGreaterThan(11.0);
    expect(d).toBeLessThan(12.0);
  });

  it("equals c × |net_correction| in self-consistent units", () => {
    const net_seconds = Math.abs(netCorrectionMicrosecondsPerDay() * 1e-6);
    const expected_km = (SPEED_OF_LIGHT * net_seconds) / 1000;
    expect(uncorrectedDriftKmPerDay()).toBeCloseTo(expected_km, 6);
  });
});

describe("uncorrectedDriftMeters", () => {
  it("after 1 hour: ~480 m off", () => {
    const m = uncorrectedDriftMeters(3600);
    expect(m).toBeGreaterThan(450);
    expect(m).toBeLessThan(510);
  });

  it("after 1 day: ~11,500 m off (matches the per-day figure)", () => {
    const m = uncorrectedDriftMeters(SECONDS_PER_DAY);
    expect(m).toBeGreaterThan(11_000);
    expect(m).toBeLessThan(12_000);
  });

  it("after 1 week: ~80 km off (linear accumulation)", () => {
    const m = uncorrectedDriftMeters(7 * SECONDS_PER_DAY);
    expect(m).toBeGreaterThan(77_000);
    expect(m).toBeLessThan(83_000);
  });

  it("scales linearly in elapsed time (the rate is constant for a circular orbit)", () => {
    const t1 = uncorrectedDriftMeters(1000);
    const t2 = uncorrectedDriftMeters(2000);
    expect(t2).toBeCloseTo(2 * t1, 6);
  });

  it("is exactly zero at t = 0", () => {
    expect(uncorrectedDriftMeters(0)).toBe(0);
  });
});

describe("Earth + GPS constants (sanity)", () => {
  it("Earth mass and radius are CODATA-consistent (within textbook tolerance)", () => {
    expect(EARTH_MASS_KG).toBeGreaterThan(5.96e24);
    expect(EARTH_MASS_KG).toBeLessThan(5.98e24);
    expect(EARTH_RADIUS_M).toBeGreaterThan(6.36e6);
    expect(EARTH_RADIUS_M).toBeLessThan(6.38e6);
  });

  it("GPS orbit radius is ~26,571 km from Earth's center (4.16 R_⊕)", () => {
    expect(GPS_ORBIT_RADIUS_M).toBeGreaterThan(2.65e7);
    expect(GPS_ORBIT_RADIUS_M).toBeLessThan(2.66e7);
    expect(GPS_ORBIT_RADIUS_M / EARTH_RADIUS_M).toBeGreaterThan(4.15);
    expect(GPS_ORBIT_RADIUS_M / EARTH_RADIUS_M).toBeLessThan(4.18);
  });
});
