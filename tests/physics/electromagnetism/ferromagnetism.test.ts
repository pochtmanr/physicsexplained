import { describe, expect, it } from "vitest";
import {
  ferromagneticM,
  remanentMagnetisation,
  sweepHysteresisLoop,
  curieWeiss,
  spontaneousMagnetisation,
  hysteresisLoopArea,
  type HysteresisParams,
} from "@/lib/physics/electromagnetism/ferromagnetism";

const softIron: HysteresisParams = {
  Msat: 1.7e6, // A/m, saturation magnetisation of iron
  Hc: 80, // A/m, soft iron coercive field
  remanence: 0.38, // the Session 2 soft-loop ratio
};

describe("ferromagneticM", () => {
  it("saturates near +Msat for large positive H on the ascending branch", () => {
    const M = ferromagneticM(
      10 * softIron.Hc,
      { H: 0, M: 0 },
      softIron,
    );
    expect(M).toBeGreaterThan(0.95 * softIron.Msat);
    expect(M).toBeLessThanOrEqual(softIron.Msat);
  });

  it("returns +Mr at H = 0 when coming down from saturation (descending branch)", () => {
    const Mr = remanentMagnetisation(softIron);
    // Descending: H was higher, now at 0.
    const M = ferromagneticM(0, { H: 1, M: softIron.Msat }, softIron);
    expect(M).toBeCloseTo(Mr, 0); // within ~1 A/m of the analytic remanence
  });

  it("returns −Mr at H = 0 when coming up from negative saturation (ascending branch)", () => {
    const Mr = remanentMagnetisation(softIron);
    // Ascending: H was lower, now at 0.
    const M = ferromagneticM(0, { H: -1, M: -softIron.Msat }, softIron);
    expect(M).toBeCloseTo(-Mr, 0);
  });

  it("crosses zero at H ≈ −Hc on the descending branch (coercive field)", () => {
    // Coming down from +saturation through H = −Hc, M should hit 0.
    const M = ferromagneticM(
      -softIron.Hc,
      { H: 0, M: softIron.Msat * 0.38 },
      softIron,
    );
    expect(Math.abs(M)).toBeLessThan(1);
  });

  it("rejects invalid params", () => {
    expect(() =>
      ferromagneticM(0, { H: 0, M: 0 }, { Msat: -1, Hc: 1, remanence: 0.5 }),
    ).toThrow();
    expect(() =>
      ferromagneticM(0, { H: 0, M: 0 }, { Msat: 1, Hc: 0, remanence: 0.5 }),
    ).toThrow();
    expect(() =>
      ferromagneticM(0, { H: 0, M: 0 }, { Msat: 1, Hc: 1, remanence: 1.5 }),
    ).toThrow();
  });
});

describe("sweepHysteresisLoop", () => {
  it("produces a closed loop: returning to Hmax recovers the starting M within tolerance", () => {
    const Hmax = 5 * softIron.Hc;
    const trace = sweepHysteresisLoop(softIron, Hmax, 512);
    const first = trace[0]!;
    const last = trace[trace.length - 1]!;
    expect(last.H).toBeCloseTo(first.H, 6);
    expect(Math.abs(last.M - first.M) / softIron.Msat).toBeLessThan(0.02);
  });

  it("encloses positive area (there's memory)", () => {
    const trace = sweepHysteresisLoop(softIron, 5 * softIron.Hc, 256);
    expect(hysteresisLoopArea(trace)).toBeGreaterThan(0);
  });

  it("rejects Hmax that doesn't exceed Hc", () => {
    expect(() => sweepHysteresisLoop(softIron, softIron.Hc * 0.5)).toThrow();
  });
});

describe("curieWeiss", () => {
  it("diverges as T approaches T_c from above", () => {
    const nearTc = curieWeiss(1.0, 1001, 1000);
    const farTc = curieWeiss(1.0, 2000, 1000);
    expect(nearTc).toBeGreaterThan(10 * farTc);
  });

  it("throws for T ≤ T_c (undefined in the ordered phase)", () => {
    expect(() => curieWeiss(1.0, 1000, 1000)).toThrow();
    expect(() => curieWeiss(1.0, 800, 1000)).toThrow();
  });

  it("positive for T > T_c with positive Curie constant", () => {
    expect(curieWeiss(1.5, 1200, 1000)).toBeGreaterThan(0);
  });
});

describe("spontaneousMagnetisation", () => {
  it("is 0 above T_c", () => {
    expect(spontaneousMagnetisation(1100, 1000, 1.7e6)).toBe(0);
  });

  it("equals Msat at T = 0", () => {
    expect(spontaneousMagnetisation(0, 1000, 1.7e6)).toBeCloseTo(1.7e6, 6);
  });

  it("follows √(1 − T/Tc) near T_c", () => {
    // At T = 0.99 Tc: M/Msat should be √0.01 = 0.1
    const ratio = spontaneousMagnetisation(990, 1000, 1.7e6) / 1.7e6;
    expect(ratio).toBeCloseTo(0.1, 6);
  });

  it("monotonically decreases with T in the ordered phase", () => {
    const a = spontaneousMagnetisation(100, 1000, 1.7e6);
    const b = spontaneousMagnetisation(500, 1000, 1.7e6);
    const c = spontaneousMagnetisation(900, 1000, 1.7e6);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });
});

describe("hysteresisLoopArea", () => {
  it("is zero for a degenerate line", () => {
    const flat = [
      { H: -1, M: 0 },
      { H: 0, M: 0 },
      { H: 1, M: 0 },
    ];
    expect(hysteresisLoopArea(flat)).toBeCloseTo(0, 10);
  });

  it("equals the expected area for a unit square", () => {
    const square = [
      { H: 0, M: 0 },
      { H: 1, M: 0 },
      { H: 1, M: 1 },
      { H: 0, M: 1 },
    ];
    expect(hysteresisLoopArea(square)).toBeCloseTo(1, 6);
  });
});
