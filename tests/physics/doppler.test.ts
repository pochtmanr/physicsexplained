import { describe, it, expect } from "vitest";
import {
  C_LIGHT_SI,
  C_SOUND_SI,
  dopplerLight,
  dopplerSound,
  generateWavefronts,
  machConeAngle,
  machNumber,
  redshiftZ,
} from "@/lib/physics/doppler";

describe("dopplerSound — classical Doppler in a medium", () => {
  it("returns f_source when both source and observer are at rest", () => {
    expect(
      dopplerSound({ fSource: 440, vSource: 0, vObserver: 0 }),
    ).toBeCloseTo(440, 10);
  });

  it("raises pitch when source moves toward observer", () => {
    const f = dopplerSound({ fSource: 440, vSource: 30, vObserver: 0 });
    expect(f).toBeGreaterThan(440);
    // f = 440 * 343 / (343 - 30) = 440 * 343 / 313
    expect(f).toBeCloseTo((440 * C_SOUND_SI) / (C_SOUND_SI - 30), 6);
  });

  it("lowers pitch when source moves away (negative vSource)", () => {
    const f = dopplerSound({ fSource: 440, vSource: -30, vObserver: 0 });
    expect(f).toBeLessThan(440);
  });

  it("asymmetry: moving source and moving observer give different shifts", () => {
    // Same relative speed v = 30 m/s, once as the source moving toward a
    // stationary observer, once as the observer moving toward a stationary
    // source. Classical Doppler gives different answers because the medium
    // fixes the frame.
    const v = 30;
    const fMovingSource = dopplerSound({
      fSource: 440,
      vSource: v,
      vObserver: 0,
    });
    const fMovingObserver = dopplerSound({
      fSource: 440,
      vSource: 0,
      vObserver: v,
    });
    expect(fMovingSource).not.toBeCloseTo(fMovingObserver, 3);
    expect(fMovingSource).toBeGreaterThan(fMovingObserver);
  });

  it("throws when source is supersonic", () => {
    expect(() =>
      dopplerSound({ fSource: 440, vSource: C_SOUND_SI, vObserver: 0 }),
    ).toThrow();
  });
});

describe("dopplerLight — relativistic Doppler", () => {
  it("returns f_source at v = 0", () => {
    expect(dopplerLight(500e12, 0)).toBeCloseTo(500e12, 3);
  });

  it("symmetric in sign: same |v| whether source or observer is the mover", () => {
    // Unlike sound, only the relative velocity matters.
    const v = 0.1 * C_LIGHT_SI;
    const fSrc = 500e12;
    const fAway = dopplerLight(fSrc, v);
    const fToward = dopplerLight(fSrc, -v);
    expect(fAway).toBeLessThan(fSrc);
    expect(fToward).toBeGreaterThan(fSrc);
    // Reciprocity: f(v) · f(−v) = f_src^2. Check as a ratio to avoid
    // floating-point noise at absolute scales of 1e29.
    const ratio = (fAway * fToward) / (fSrc * fSrc);
    expect(ratio).toBeCloseTo(1, 10);
  });

  it("non-relativistic limit matches v/c", () => {
    const fSrc = 1e9;
    const v = 100; // m/s, tiny compared to c
    const fObs = dopplerLight(fSrc, v);
    const expected = fSrc * (1 - v / C_LIGHT_SI);
    // Agreement to first order in v/c
    expect(fObs / fSrc).toBeCloseTo(expected / fSrc, 12);
  });
});

describe("redshiftZ", () => {
  it("is zero at v = 0", () => {
    expect(redshiftZ(0)).toBeCloseTo(0, 12);
  });

  it("is positive for recession, negative for approach", () => {
    expect(redshiftZ(1e7)).toBeGreaterThan(0);
    expect(redshiftZ(-1e7)).toBeLessThan(0);
  });

  it("matches v/c at small velocities", () => {
    const v = 3e4; // 30 km/s — Earth's orbital speed, β ≈ 1e-4
    const beta = v / C_LIGHT_SI;
    // Relativistic z agrees with β to second order: error ≈ β²/2.
    // β² ≈ 1e-8, so 7 decimal places is the comfortable bound here.
    expect(redshiftZ(v)).toBeCloseTo(beta, 7);
  });
});

describe("mach geometry", () => {
  it("machNumber is v/c", () => {
    expect(machNumber(686)).toBeCloseTo(2, 3); // ≈ Mach 2
  });

  it("cone angle at M = 2 is 30°", () => {
    const theta = machConeAngle(2 * C_SOUND_SI);
    expect((theta * 180) / Math.PI).toBeCloseTo(30, 4);
  });

  it("cone angle at M = √2 is 45°", () => {
    const theta = machConeAngle(Math.SQRT2 * C_SOUND_SI);
    expect((theta * 180) / Math.PI).toBeCloseTo(45, 4);
  });

  it("cone angle undefined below the speed of sound", () => {
    expect(() => machConeAngle(0.5 * C_SOUND_SI)).toThrow();
  });
});

describe("generateWavefronts", () => {
  it("returns the expected number of fronts", () => {
    const fronts = generateWavefronts({
      vSource: 0,
      c: 1,
      period: 1,
      tNow: 5.5,
      nWavefronts: 10,
    });
    // Emissions at t = 0, 1, 2, 3, 4, 5 — six fronts
    expect(fronts.length).toBe(6);
  });

  it("caps output at nWavefronts", () => {
    const fronts = generateWavefronts({
      vSource: 0,
      c: 1,
      period: 1,
      tNow: 100,
      nWavefronts: 5,
    });
    expect(fronts.length).toBe(5);
  });

  it("front radius grows as c · (tNow − tEmit)", () => {
    const fronts = generateWavefronts({
      vSource: 0,
      c: 10,
      period: 1,
      tNow: 3,
      nWavefronts: 10,
    });
    // Oldest front emitted at t=0 has age 3, radius 30
    expect(fronts[0]!.radius).toBeCloseTo(30, 10);
    // Most recent at t=3 has age 0, radius 0
    expect(fronts[fronts.length - 1]!.radius).toBeCloseTo(0, 10);
  });

  it("front emission positions track a moving source", () => {
    const fronts = generateWavefronts({
      vSource: 2,
      c: 10,
      period: 1,
      tNow: 3,
      nWavefronts: 10,
    });
    // Source moves at v = 2 m/s, emits at t = 0, 1, 2, 3
    expect(fronts[0]!.xEmit).toBeCloseTo(0, 10);
    expect(fronts[1]!.xEmit).toBeCloseTo(2, 10);
    expect(fronts[2]!.xEmit).toBeCloseTo(4, 10);
    expect(fronts[3]!.xEmit).toBeCloseTo(6, 10);
  });
});
