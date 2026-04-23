import { describe, expect, it } from "vitest";
import {
  voltageRatio,
  currentRatio,
  mutualInductance,
  lineLoss,
  lineLossScaleFactor,
  reflectedImpedance,
} from "@/lib/physics/electromagnetism/transformers";

describe("voltageRatio", () => {
  it("10:1 step-down delivers 12 V from 120 V mains", () => {
    // n = N_s / N_p = 1/10 = 0.1
    expect(voltageRatio(0.1, 120)).toBeCloseTo(12, 12);
  });

  it("step-up by n=100 turns 230 V into 23 kV", () => {
    expect(voltageRatio(100, 230)).toBeCloseTo(23000, 10);
  });

  it("unity turns ratio passes the voltage through", () => {
    expect(voltageRatio(1, 400000)).toBe(400000);
  });
});

describe("currentRatio", () => {
  it("current doubles when voltage halves (step-down by 2)", () => {
    // n = 0.5 → V halves, I doubles
    const Ip = 3;
    expect(currentRatio(0.5, Ip)).toBeCloseTo(6, 12);
  });

  it("current halves when voltage doubles (step-up by 2)", () => {
    expect(currentRatio(2, 10)).toBeCloseTo(5, 12);
  });

  it("throws on zero turns ratio", () => {
    expect(() => currentRatio(0, 1)).toThrow();
  });

  it("preserves power on both sides (V_s · I_s = V_p · I_p) for arbitrary n", () => {
    const Vp = 120;
    const Ip = 5;
    const n = 8;
    const Vs = voltageRatio(n, Vp);
    const Is = currentRatio(n, Ip);
    expect(Vs * Is).toBeCloseTo(Vp * Ip, 10);
  });
});

describe("mutualInductance", () => {
  it("k = 1 (ideal coupling) gives M = √(Lp·Ls)", () => {
    const Lp = 0.4;
    const Ls = 0.9;
    expect(mutualInductance(1, Lp, Ls)).toBeCloseTo(
      Math.sqrt(Lp * Ls),
      12,
    );
  });

  it("k = 0.5 halves the ideal mutual inductance", () => {
    const Lp = 2;
    const Ls = 2;
    // Ideal would be √4 = 2, so k=0.5 → 1
    expect(mutualInductance(0.5, Lp, Ls)).toBeCloseTo(1, 12);
  });

  it("k = 0 gives M = 0 (decoupled coils)", () => {
    expect(mutualInductance(0, 1, 1)).toBe(0);
  });

  it("throws when k is outside [0, 1]", () => {
    expect(() => mutualInductance(-0.1, 1, 1)).toThrow();
    expect(() => mutualInductance(1.01, 1, 1)).toThrow();
  });
});

describe("lineLoss", () => {
  it("matches (P_load/V)²·R for a textbook grid case", () => {
    // 1 MW delivered at 100 kV through a 10 Ω line
    const P = 1e6;
    const V = 1e5;
    const R = 10;
    const I = P / V; // 10 A
    const expected = I * I * R; // 1000 W
    expect(lineLoss(P, V, R)).toBeCloseTo(expected, 6);
  });

  it("loss falls by 4× when the transmission voltage is doubled", () => {
    const P = 1e6;
    const R = 10;
    const lossLow = lineLoss(P, 10000, R);
    const lossHigh = lineLoss(P, 20000, R);
    expect(lossLow / lossHigh).toBeCloseTo(4, 10);
  });

  it("throws on zero source voltage", () => {
    expect(() => lineLoss(1e6, 0, 10)).toThrow();
  });
});

describe("lineLossScaleFactor", () => {
  it("doubling V quarters the loss", () => {
    expect(lineLossScaleFactor(2)).toBeCloseTo(0.25, 12);
  });

  it("10× voltage → 1/100 loss", () => {
    expect(lineLossScaleFactor(10)).toBeCloseTo(0.01, 12);
  });

  it("halving V quadruples the loss", () => {
    expect(lineLossScaleFactor(0.5)).toBeCloseTo(4, 12);
  });

  it("throws on zero scale factor", () => {
    expect(() => lineLossScaleFactor(0)).toThrow();
  });
});

describe("reflectedImpedance", () => {
  it("10:1 step-down reflects an 8 Ω speaker as 800 Ω", () => {
    // n = 0.1 (step-down), 1/n² = 100
    expect(reflectedImpedance(0.1, 8)).toBeCloseTo(800, 10);
  });

  it("unity ratio passes impedance through", () => {
    expect(reflectedImpedance(1, 50)).toBeCloseTo(50, 12);
  });

  it("throws on zero turns ratio", () => {
    expect(() => reflectedImpedance(0, 1)).toThrow();
  });
});
