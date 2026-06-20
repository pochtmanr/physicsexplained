import { describe, it, expect } from "vitest";
import {
  chirpMass,
  totalMass,
  symmetricMassRatio,
  chirpTimeScale,
  frequencyDot,
  timeToCoalescence,
  frequencyAtTimeToMerger,
  orbitalSeparation,
  strainAmplitude,
  iscoFrequency,
  inspiralWaveform,
  cumulativePeriastronShift,
  audibleFraction,
  M_SUN,
  MPC_M,
  HULSE_TAYLOR,
} from "@/lib/physics/relativity/binary-inspiral-and-the-chirp";

describe("chirp mass", () => {
  it("equal masses: M_c = m / 2^{1/5}", () => {
    const m = 30 * M_SUN;
    const mc = chirpMass(m, m);
    expect(mc).toBeCloseTo(m / Math.pow(2, 0.2), 6);
  });

  it("is symmetric in its arguments", () => {
    expect(chirpMass(10 * M_SUN, 40 * M_SUN)).toBeCloseTo(
      chirpMass(40 * M_SUN, 10 * M_SUN),
      6,
    );
  });

  it("GW150914-like (36 + 29 M_sun) gives ≈ 28 M_sun", () => {
    const mc = chirpMass(36 * M_SUN, 29 * M_SUN) / M_SUN;
    expect(mc).toBeGreaterThan(27);
    expect(mc).toBeLessThan(29);
  });

  it("lies between the geometric mean and the smaller mass for unequal pairs", () => {
    const m1 = 10 * M_SUN;
    const m2 = 50 * M_SUN;
    const mc = chirpMass(m1, m2);
    expect(mc).toBeLessThan(Math.sqrt(m1 * m2));
    expect(mc).toBeGreaterThan(m1);
  });

  it("rejects non-positive masses", () => {
    expect(() => chirpMass(0, 10)).toThrow();
    expect(() => chirpMass(10, -1)).toThrow();
  });
});

describe("mass combinations", () => {
  it("totalMass adds", () => {
    expect(totalMass(3, 4)).toBe(7);
  });

  it("symmetric mass ratio is 1/4 for equal masses and < 1/4 otherwise", () => {
    expect(symmetricMassRatio(5, 5)).toBeCloseTo(0.25, 12);
    expect(symmetricMassRatio(1, 9)).toBeLessThan(0.25);
  });
});

describe("frequency evolution", () => {
  it("frequencyDot is positive — binaries always spin up", () => {
    const mc = chirpMass(30 * M_SUN, 30 * M_SUN);
    expect(frequencyDot(50, mc)).toBeGreaterThan(0);
  });

  it("frequencyDot scales as f^{11/3}", () => {
    const mc = chirpMass(30 * M_SUN, 30 * M_SUN);
    const a = frequencyDot(50, mc);
    const b = frequencyDot(100, mc);
    expect(b / a).toBeCloseTo(Math.pow(2, 11 / 3), 4);
  });

  it("timeToCoalescence and frequencyDot are mutually consistent (df/dt = f / ((8/3) t))", () => {
    const mc = chirpMass(1.4 * M_SUN, 1.4 * M_SUN);
    const f = 50;
    const t = timeToCoalescence(f, mc);
    const fdot = frequencyDot(f, mc);
    // From f ∝ τ^{-3/8}: df/dτ = (3/8) f / τ, and dτ = -dt so df/dt = (3/8) f / t.
    expect(fdot).toBeCloseTo((3 / 8) * (f / t), 6);
  });

  it("frequencyAtTimeToMerger inverts timeToCoalescence", () => {
    const mc = chirpMass(20 * M_SUN, 25 * M_SUN);
    const f0 = 40;
    const tau = timeToCoalescence(f0, mc);
    expect(frequencyAtTimeToMerger(tau, mc)).toBeCloseTo(f0, 4);
  });

  it("frequencyAtTimeToMerger rejects tau <= 0", () => {
    expect(() => frequencyAtTimeToMerger(0, M_SUN)).toThrow();
  });

  it("a 1.4+1.4 neutron-star binary entering LIGO band at 10 Hz merges in ~17 minutes", () => {
    const mc = chirpMass(1.4 * M_SUN, 1.4 * M_SUN);
    const t = timeToCoalescence(10, mc);
    // ~17 minutes ≈ 1000 s, order of magnitude.
    expect(t).toBeGreaterThan(600);
    expect(t).toBeLessThan(1500);
  });
});

describe("orbital geometry", () => {
  it("orbital separation shrinks as frequency rises", () => {
    const M = 60 * M_SUN;
    expect(orbitalSeparation(100, M)).toBeLessThan(orbitalSeparation(30, M));
  });

  it("ISCO frequency falls with increasing total mass", () => {
    expect(iscoFrequency(10 * M_SUN)).toBeGreaterThan(iscoFrequency(100 * M_SUN));
  });

  it("ISCO frequency for ~65 M_sun GW150914 lands in the hundreds of Hz", () => {
    const f = iscoFrequency(65 * M_SUN);
    expect(f).toBeGreaterThan(50);
    expect(f).toBeLessThan(600);
  });
});

describe("strain", () => {
  it("strain falls off as 1/distance", () => {
    const mc = chirpMass(30 * M_SUN, 30 * M_SUN);
    const near = strainAmplitude(100, mc, 100 * MPC_M);
    const far = strainAmplitude(100, mc, 400 * MPC_M);
    expect(near / far).toBeCloseTo(4, 6);
  });

  it("GW150914-scale strain is of order 1e-21", () => {
    const mc = chirpMass(36 * M_SUN, 29 * M_SUN);
    const h = strainAmplitude(150, mc, 410 * MPC_M);
    expect(h).toBeGreaterThan(1e-22);
    expect(h).toBeLessThan(1e-20);
  });

  it("strain rises with frequency at fixed distance", () => {
    const mc = chirpMass(30 * M_SUN, 30 * M_SUN);
    expect(strainAmplitude(200, mc, 100 * MPC_M)).toBeGreaterThan(
      strainAmplitude(50, mc, 100 * MPC_M),
    );
  });
});

describe("waveform sampling", () => {
  it("produces monotonically rising frequency (a true chirp)", () => {
    const mc = chirpMass(30 * M_SUN, 30 * M_SUN);
    const M = 60 * M_SUN;
    const { f } = inspiralWaveform(mc, M, 410 * MPC_M, 200);
    for (let i = 1; i < f.length; i++) {
      expect(f[i]).toBeGreaterThanOrEqual(f[i - 1]);
    }
  });

  it("returns parallel arrays of the requested length with bounded strain", () => {
    const mc = chirpMass(30 * M_SUN, 30 * M_SUN);
    const M = 60 * M_SUN;
    const n = 128;
    const { t, f, h, fMax } = inspiralWaveform(mc, M, 410 * MPC_M, n);
    expect(t).toHaveLength(n);
    expect(f).toHaveLength(n);
    expect(h).toHaveLength(n);
    expect(fMax).toBeGreaterThan(0);
    for (const hv of h) expect(Number.isFinite(hv)).toBe(true);
  });

  it("time axis is negative (before merger) and increasing toward zero", () => {
    const mc = chirpMass(1.4 * M_SUN, 1.4 * M_SUN);
    const M = 2.8 * M_SUN;
    const { t } = inspiralWaveform(mc, M, 40 * MPC_M, 64);
    expect(t[0]).toBeLessThan(0);
    expect(t[t.length - 1]).toBeGreaterThan(t[0]);
    expect(t[t.length - 1]).toBeLessThanOrEqual(0);
  });
});

describe("Hulse–Taylor periastron parabola", () => {
  it("cumulative shift is a downward parabola for negative Pdot", () => {
    const { period_s, PdotGR } = HULSE_TAYLOR;
    const oneYear = 365.25 * 86400;
    const s10 = cumulativePeriastronShift(10 * oneYear, period_s, PdotGR);
    const s20 = cumulativePeriastronShift(20 * oneYear, period_s, PdotGR);
    expect(s10).toBeLessThan(0);
    expect(s20).toBeLessThan(s10);
    // Parabola: quadrupling time quadruples the shift.
    const s5 = cumulativePeriastronShift(5 * oneYear, period_s, PdotGR);
    expect(s10 / s5).toBeCloseTo(4, 6);
  });

  it("the famous ~40 s cumulative shift accumulates over ~30 years", () => {
    const { period_s, PdotGR } = HULSE_TAYLOR;
    const t = 30 * 365.25 * 86400;
    const shift = Math.abs(cumulativePeriastronShift(t, period_s, PdotGR));
    expect(shift).toBeGreaterThan(20);
    expect(shift).toBeLessThan(70);
  });
});

describe("audible fraction", () => {
  it("clamps below 20 Hz and above 2000 Hz", () => {
    expect(audibleFraction(10)).toBe(0);
    expect(audibleFraction(5000)).toBe(1);
  });
  it("is monotonic in band", () => {
    expect(audibleFraction(500)).toBeLessThan(audibleFraction(1000));
  });

  it("chirpTimeScale is positive and tiny for stellar masses", () => {
    const ts = chirpTimeScale(28 * M_SUN);
    expect(ts).toBeGreaterThan(0);
    expect(ts).toBeLessThan(1e-3);
  });
});
