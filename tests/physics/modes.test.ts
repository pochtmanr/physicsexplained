import { describe, it, expect } from "vitest";
import {
  stringMode,
  stringModeFrequency,
  stringNodes,
  pluckedStringCoefficient,
  pluckedStringShape,
  triangularPluck,
  squareMembraneMode,
  chladniSquareMode,
  squareMembraneOmega,
  pipeHarmonics,
  pipeFundamental,
} from "@/lib/physics/modes";

describe("string eigenmodes", () => {
  it("mode n vanishes at both endpoints", () => {
    for (let n = 1; n <= 8; n++) {
      expect(stringMode(0, n, 1)).toBeCloseTo(0, 12);
      expect(stringMode(1, n, 1)).toBeCloseTo(0, 12);
    }
  });

  it("mode n has n + 1 nodes on [0, L] (endpoints plus n − 1 interior)", () => {
    for (let n = 1; n <= 6; n++) {
      const xs = stringNodes(n, 1);
      expect(xs.length).toBe(n + 1);
      for (const x of xs) {
        expect(stringMode(x, n, 1)).toBeCloseTo(0, 12);
      }
    }
  });

  it("mode frequencies scale linearly with mode number (harmonic series)", () => {
    const f1 = stringModeFrequency(1, 1, 100);
    for (let n = 1; n <= 8; n++) {
      expect(stringModeFrequency(n, 1, 100)).toBeCloseTo(n * f1, 10);
    }
  });

  it("eigenmodes are orthogonal on [0, L] (numerical integration)", () => {
    // ∫₀¹ sin(m π x) sin(n π x) dx = δ_{mn} / 2.
    const N = 1000;
    const dx = 1 / N;
    for (let m = 1; m <= 4; m++) {
      for (let n = 1; n <= 4; n++) {
        let sum = 0;
        for (let i = 0; i < N; i++) {
          const x = (i + 0.5) * dx;
          sum += stringMode(x, m, 1) * stringMode(x, n, 1);
        }
        sum *= dx;
        const expected = m === n ? 0.5 : 0;
        expect(sum).toBeCloseTo(expected, 4);
      }
    }
  });
});

describe("plucked-string Fourier series", () => {
  it("a pluck at the midpoint kills every even harmonic", () => {
    for (let n = 2; n <= 10; n += 2) {
      expect(pluckedStringCoefficient(n, 0.5)).toBeCloseTo(0, 12);
    }
  });

  it("fundamental coefficient is positive for a centre pluck", () => {
    expect(pluckedStringCoefficient(1, 0.5)).toBeGreaterThan(0);
  });

  it("partial Fourier sum converges to the triangular pluck shape", () => {
    const p = 0.3;
    const probe = [0.1, 0.25, 0.4, 0.6, 0.8];
    for (const s of probe) {
      const truth = triangularPluck(s, p);
      const approx = pluckedStringShape(s, p, 80);
      // 80 modes is enough for < 2% error everywhere away from the cusp.
      expect(Math.abs(approx - truth)).toBeLessThan(0.02);
    }
  });

  it("Fourier sum vanishes at the endpoints by construction", () => {
    expect(pluckedStringShape(0, 0.4, 40)).toBeCloseTo(0, 10);
    expect(pluckedStringShape(1, 0.4, 40)).toBeCloseTo(0, 10);
  });
});

describe("square membrane modes", () => {
  it("clamped-membrane mode vanishes on all four edges", () => {
    for (let m = 1; m <= 4; m++) {
      for (let n = 1; n <= 4; n++) {
        expect(squareMembraneMode(0, 0.4, m, n)).toBeCloseTo(0, 12);
        expect(squareMembraneMode(1, 0.4, m, n)).toBeCloseTo(0, 12);
        expect(squareMembraneMode(0.4, 0, m, n)).toBeCloseTo(0, 12);
        expect(squareMembraneMode(0.4, 1, m, n)).toBeCloseTo(0, 12);
      }
    }
  });

  it("modes (m, n) and (n, m) are degenerate in frequency", () => {
    const L = 1;
    const c = 100;
    expect(squareMembraneOmega(2, 3, L, c)).toBeCloseTo(
      squareMembraneOmega(3, 2, L, c),
      12,
    );
  });

  it("Chladni symmetric mode is antisymmetric under (x, y) ↔ (y, x)", () => {
    // φ(x, y) = −φ(y, x), so nodal set contains the diagonal.
    const samples = [
      [0.2, 0.5],
      [0.33, 0.71],
      [0.8, 0.15],
    ];
    for (const [x, y] of samples) {
      const f1 = chladniSquareMode(x!, y!, 2, 3);
      const f2 = chladniSquareMode(y!, x!, 2, 3);
      expect(f1).toBeCloseTo(-f2, 12);
    }
  });

  it("Chladni symmetric mode vanishes on the diagonal x = y", () => {
    for (const s of [0.1, 0.3, 0.5, 0.7]) {
      expect(chladniSquareMode(s, s, 2, 3)).toBeCloseTo(0, 12);
    }
  });
});

describe("organ-pipe harmonics", () => {
  it("open–open pipe has all integer harmonics", () => {
    const hs = pipeHarmonics("open-open", 1, 343, 5);
    const f1 = hs[0]!;
    for (let i = 0; i < hs.length; i++) {
      expect(hs[i]!).toBeCloseTo((i + 1) * f1, 8);
    }
  });

  it("closed–open pipe's fundamental is half the open–open fundamental", () => {
    const L = 1;
    const c = 343;
    expect(pipeFundamental("closed-open", L, c)).toBeCloseTo(
      pipeFundamental("open-open", L, c) / 2,
      10,
    );
  });

  it("closed–open pipe has only odd multiples of its fundamental", () => {
    const hs = pipeHarmonics("closed-open", 1, 343, 5);
    const f1 = hs[0]!;
    for (let i = 0; i < hs.length; i++) {
      expect(hs[i]!).toBeCloseTo((2 * i + 1) * f1, 8);
    }
  });
});
