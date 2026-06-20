/**
 * §53 LIGO AND MULTI-MESSENGER ASTRONOMY — unit tests.
 *
 * Covers interferometer arm response, the chirp-mass / inspiral relations,
 * the GW150914-scale waveform, and sky-localization timing geometry.
 */

import { describe, expect, it } from "vitest";
import {
  C_LIGHT,
  differentialArmChange,
  singleArmStrain,
  armPhaseShift,
  darkPortPower,
  chirpMass,
  chirpFrequency,
  iscoFrequency,
  strainAmplitude,
  chirpWaveform,
  arrivalTimeDelay,
  timingRingAngle,
  ringThickness,
  localizationAreaDeg2,
  SOLAR_MASS,
  G_NEWTON,
} from "@/lib/physics/relativity/ligo-and-multi-messenger";

// ─── interferometer ──────────────────────────────────────────────────────────

describe("differentialArmChange", () => {
  it("GW150914 strain over a 4 km arm is a fraction of a proton width", () => {
    // h ~ 1e-21, L = 4000 m → ΔL ~ 4e-18 m (proton diameter ~ 1.7e-15 m).
    const dL = differentialArmChange(1e-21, 4000);
    expect(dL).toBeCloseTo(4e-18, 24);
    expect(dL).toBeLessThan(1.7e-15); // smaller than a proton
  });

  it("scales linearly in both h and L", () => {
    expect(differentialArmChange(2e-21, 4000)).toBeCloseTo(
      2 * differentialArmChange(1e-21, 4000),
      30,
    );
  });
});

describe("singleArmStrain", () => {
  it("stretches one arm and squeezes the other by ±½h", () => {
    expect(singleArmStrain(1e-21, 1)).toBeCloseTo(0.5e-21, 30);
    expect(singleArmStrain(1e-21, -1)).toBeCloseTo(-0.5e-21, 30);
  });
});

describe("armPhaseShift", () => {
  it("is zero for no length change", () => {
    expect(armPhaseShift(0, 1064e-9, 280)).toBe(0);
  });

  it("grows linearly with effective bounce count", () => {
    const p1 = armPhaseShift(1e-18, 1064e-9, 1);
    const p280 = armPhaseShift(1e-18, 1064e-9, 280);
    expect(p280 / p1).toBeCloseTo(280, 6);
  });
});

describe("darkPortPower", () => {
  it("is dark on the fringe and bright at π", () => {
    expect(darkPortPower(0)).toBeCloseTo(0, 12);
    expect(darkPortPower(Math.PI)).toBeCloseTo(1, 12);
  });

  it("stays within [0,1]", () => {
    for (let phi = -10; phi <= 10; phi += 0.3) {
      const p = darkPortPower(phi);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

// ─── chirp mass + inspiral ───────────────────────────────────────────────────

describe("chirpMass", () => {
  it("equals m/2^{1/5} for an equal-mass binary", () => {
    // m1 = m2 = m → Mc = m^{6/5}/(2m)^{1/5} = m / 2^{1/5}.
    const m = 30;
    expect(chirpMass(m, m)).toBeCloseTo(m / Math.pow(2, 1 / 5), 9);
  });

  it("matches the GW150914 value ~28 M☉ for (36, 29)", () => {
    expect(chirpMass(36, 29)).toBeCloseTo(28.1, 1);
  });

  it("is symmetric in its arguments", () => {
    expect(chirpMass(36, 29)).toBeCloseTo(chirpMass(29, 36), 12);
  });
});

describe("chirpFrequency", () => {
  it("increases as coalescence approaches (smaller tau)", () => {
    const mcKg = chirpMass(36, 29) * SOLAR_MASS;
    const fEarly = chirpFrequency(1.0, mcKg);
    const fLate = chirpFrequency(0.05, mcKg);
    expect(fLate).toBeGreaterThan(fEarly);
  });

  it("is in the tens-of-Hz band ~0.2 s before a GW150914-like merger", () => {
    const mcKg = chirpMass(36, 29) * SOLAR_MASS;
    const f = chirpFrequency(0.2, mcKg);
    expect(f).toBeGreaterThan(20);
    expect(f).toBeLessThan(120);
  });

  it("diverges at coalescence", () => {
    expect(chirpFrequency(0, 1)).toBe(Infinity);
  });
});

describe("iscoFrequency", () => {
  it("is a couple hundred Hz for a ~65 M☉ total mass", () => {
    const f = iscoFrequency(65);
    expect(f).toBeGreaterThan(100);
    expect(f).toBeLessThan(400);
  });

  it("scales as 1/M", () => {
    expect(iscoFrequency(130)).toBeCloseTo(iscoFrequency(65) / 2, 6);
  });

  it("matches c³/(6^{3/2} π G M) directly", () => {
    const M = 65 * SOLAR_MASS;
    const expected =
      (C_LIGHT ** 3) / (Math.pow(6, 1.5) * Math.PI * G_NEWTON * M);
    expect(iscoFrequency(65)).toBeCloseTo(expected, 6);
  });
});

describe("strainAmplitude", () => {
  it("falls off as 1/distance", () => {
    const near = strainAmplitude(100, 28, 100);
    const far = strainAmplitude(100, 28, 200);
    expect(near / far).toBeCloseTo(2, 6);
  });

  it("grows with frequency (∝ f^{2/3})", () => {
    const lo = strainAmplitude(50, 28, 410);
    const hi = strainAmplitude(200, 28, 410);
    expect(hi).toBeGreaterThan(lo);
    expect(hi / lo).toBeCloseTo(Math.pow(4, 2 / 3), 6);
  });

  it("is of order 1e-21 at GW150914 distance and band", () => {
    // ~410 Mpc, Mc ~ 28 M☉, f ~ 150 Hz.
    const h = strainAmplitude(150, 28, 410);
    expect(h).toBeGreaterThan(1e-22);
    expect(h).toBeLessThan(1e-20);
  });
});

describe("chirpWaveform", () => {
  it("produces monotonically rising frequency", () => {
    const wf = chirpWaveform({
      m1Solar: 36,
      m2Solar: 29,
      tStart: -0.2,
      tEnd: -0.002,
      samples: 200,
    });
    for (let i = 1; i < wf.f.length; i++) {
      expect(wf.f[i]).toBeGreaterThanOrEqual(wf.f[i - 1] - 1e-6);
    }
  });

  it("normalises peak strain to hPeak", () => {
    const wf = chirpWaveform({
      m1Solar: 36,
      m2Solar: 29,
      tStart: -0.2,
      tEnd: -0.002,
      samples: 200,
      hPeak: 1,
    });
    const peak = Math.max(...wf.h.map(Math.abs));
    expect(peak).toBeCloseTo(1, 6);
  });

  it("returns parallel arrays of equal length", () => {
    const wf = chirpWaveform({
      m1Solar: 30,
      m2Solar: 30,
      tStart: -0.3,
      tEnd: -0.001,
      samples: 128,
    });
    expect(wf.t.length).toBe(128);
    expect(wf.f.length).toBe(128);
    expect(wf.h.length).toBe(128);
  });
});

// ─── sky localization ────────────────────────────────────────────────────────

describe("arrivalTimeDelay", () => {
  it("is the full baseline crossing time for a head-on source", () => {
    // 3000 km between Hanford and Livingston → ~10 ms.
    const dt = arrivalTimeDelay(3000, 0);
    expect(dt).toBeCloseTo((3000e3) / C_LIGHT, 9);
    expect(dt).toBeGreaterThan(0.009);
    expect(dt).toBeLessThan(0.011);
  });

  it("vanishes for a source broadside to the baseline", () => {
    expect(arrivalTimeDelay(3000, Math.PI / 2)).toBeCloseTo(0, 12);
  });
});

describe("timingRingAngle", () => {
  it("inverts arrivalTimeDelay", () => {
    const theta = 1.1;
    const dt = arrivalTimeDelay(3000, theta);
    expect(timingRingAngle(dt, 3000)).toBeCloseTo(theta, 9);
  });

  it("returns NaN when the delay exceeds the baseline", () => {
    const tooBig = (3000e3) / C_LIGHT * 1.5;
    expect(Number.isNaN(timingRingAngle(tooBig, 3000))).toBe(true);
  });
});

describe("ringThickness", () => {
  it("shrinks with better timing precision", () => {
    const coarse = ringThickness(1e-3, 3000);
    const fine = ringThickness(1e-4, 3000);
    expect(fine).toBeLessThan(coarse);
    expect(coarse / fine).toBeCloseTo(10, 6);
  });
});

describe("localizationAreaDeg2", () => {
  it("covers the whole sky with one detector", () => {
    expect(localizationAreaDeg2(1, 1e-4, 3000)).toBeCloseTo(41253, 0);
  });

  it("a third detector shrinks a ring to a patch", () => {
    const two = localizationAreaDeg2(2, 1e-4, 3000);
    const three = localizationAreaDeg2(3, 1e-4, 3000);
    expect(three).toBeLessThan(two);
  });
});
