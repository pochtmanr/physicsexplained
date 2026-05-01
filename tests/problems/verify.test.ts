import { describe, it, expect } from "vitest";
import { verifyStep } from "@/lib/problems/verify";
import type { ProblemStep } from "@/lib/content/types";

const VX_STEP: ProblemStep = {
  id: "vx",
  varName: "v_x",
  canonicalExpr: "v_0 * cos(theta)",
  units: "m/s",
  inputDomain: { v_0: [10, 50], theta: [0.1, 1.4] },
  toleranceRel: 1e-6,
};

const RANGE_STEP: ProblemStep = {
  id: "range",
  varName: "R",
  canonicalExpr: "v_0^2 * sin(2*theta) / g",
  units: "m",
  inputDomain: { v_0: [10, 50], theta: [0.1, 1.4], g: [9, 10] },
  toleranceRel: 1e-6,
};

describe("verifyStep — algebraic equivalence acceptance", () => {
  it("accepts the canonical form verbatim", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_0 * cos(theta)" });
    expect(r.ok).toBe(true);
  });

  it("accepts commuted form: cos(theta) * v_0", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "cos(theta) * v_0" });
    expect(r.ok).toBe(true);
  });

  it("accepts implicit multiplication: v_0cos(theta)", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_0cos(theta)" });
    expect(r.ok).toBe(true);
  });

  it("accepts numerically equivalent: 2*v_0/2 * cos(theta)", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "2*v_0/2 * cos(theta)" });
    expect(r.ok).toBe(true);
  });

  it("accepts trig identity: v_0 * sin(pi/2 - theta)", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_0 * sin(PI/2 - theta)" });
    expect(r.ok).toBe(true);
  });
});

describe("verifyStep — algebraic equivalence rejection", () => {
  it("rejects sign flip", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "-v_0 * cos(theta)" });
    expect(r.ok).toBe(false);
  });

  it("rejects swapped trig: v_0 * sin(theta)", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_0 * sin(theta)" });
    expect(r.ok).toBe(false);
  });

  it("rejects missing factor: cos(theta)", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "cos(theta)" });
    expect(r.ok).toBe(false);
  });

  it("rejects extra factor: 2 * v_0 * cos(theta)", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "2 * v_0 * cos(theta)" });
    expect(r.ok).toBe(false);
  });

  it("rejects squared range: v_0^2 * sin(2*theta) / g^2", () => {
    const r = verifyStep({ step: RANGE_STEP, studentExpr: "v_0^2 * sin(2*theta) / g^2" });
    expect(r.ok).toBe(false);
  });
});

describe("verifyStep — graceful errors", () => {
  it("returns parseError on syntactic garbage", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_0 ** ** cos(" });
    expect(r.ok).toBe(false);
    expect(r.parseError).toBeTruthy();
  });

  it("returns parseError on empty input", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "" });
    expect(r.ok).toBe(false);
    expect(r.parseError).toBeTruthy();
  });
});

describe("verifyStep — numeric values populated on rejection", () => {
  it("returns canonicalValue and studentValue at default inputs", () => {
    // canonical inputs: middle of domain. v_0=30, theta=0.75
    // canonical = 30*cos(0.75) ≈ 21.93
    // student   = -30*cos(0.75) ≈ -21.93
    const r = verifyStep({ step: VX_STEP, studentExpr: "-v_0 * cos(theta)" });
    expect(r.ok).toBe(false);
    expect(r.canonicalValue).toBeCloseTo(21.93, 1);
    expect(r.studentValue).toBeCloseTo(-21.93, 1);
    expect(r.diff).toBeGreaterThan(0);
  });
});

describe("verifyStep — deterministic sampling", () => {
  it("repeated calls with same inputs produce same result", () => {
    const r1 = verifyStep({ step: VX_STEP, studentExpr: "cos(theta) * v_0" });
    const r2 = verifyStep({ step: VX_STEP, studentExpr: "cos(theta) * v_0" });
    expect(r1.ok).toBe(r2.ok);
    expect(r1.canonicalValue).toBe(r2.canonicalValue);
  });
});

describe("verifyStep — accepts numeric scalar answers", () => {
  it("accepts the canonical numeric answer at default inputs", () => {
    // canonical at v_0=30, theta=0.75 ≈ 21.93
    const r = verifyStep({ step: VX_STEP, studentExpr: "21.9302" });
    // Numeric scalar can't satisfy the multi-sample probe across the domain,
    // so this should fail — but the reject reason should not be a parse error.
    expect(r.ok).toBe(false);
    expect(r.parseError).toBeUndefined();
  });
});

describe("verifyStep — concrete-inputs path (numerical-answer UX)", () => {
  // Simple distance step: d = v * t. With v=25 m/s and t=8 s, d = 200.
  const D_STEP: ProblemStep = {
    id: "d",
    varName: "d",
    canonicalExpr: "v * t",
    units: "m",
    inputDomain: { v: [5, 50], t: [1, 30] },
    toleranceRel: 1e-6,
  };

  it("accepts the literal numerical answer at problem inputs", () => {
    const r = verifyStep({
      step: D_STEP,
      studentExpr: "200",
      concreteInputs: { v: 25, t: 8 },
    });
    expect(r.ok).toBe(true);
    expect(r.canonicalValue).toBe(200);
    expect(r.studentValue).toBe(200);
  });

  it("accepts a numeric expression that evaluates to the answer", () => {
    const r = verifyStep({
      step: D_STEP,
      studentExpr: "25 * 8",
      concreteInputs: { v: 25, t: 8 },
    });
    expect(r.ok).toBe(true);
  });

  it("still accepts the symbolic formula", () => {
    const r = verifyStep({
      step: D_STEP,
      studentExpr: "v * t",
      concreteInputs: { v: 25, t: 8 },
    });
    expect(r.ok).toBe(true);
    expect(r.canonicalValue).toBe(200);
  });

  it("rejects a numerical answer that's wrong", () => {
    const r = verifyStep({
      step: D_STEP,
      studentExpr: "199",
      concreteInputs: { v: 25, t: 8 },
    });
    expect(r.ok).toBe(false);
    expect(r.canonicalValue).toBe(200);
    expect(r.studentValue).toBe(199);
  });

  it("rejects a wrong formula at concrete inputs", () => {
    // v + t = 33, not 200
    const r = verifyStep({
      step: D_STEP,
      studentExpr: "v + t",
      concreteInputs: { v: 25, t: 8 },
    });
    expect(r.ok).toBe(false);
    expect(r.studentValue).toBe(33);
    expect(r.canonicalValue).toBe(200);
  });
});

describe("verifyStep — student-input normalization", () => {
  it("strips equals-tail before parsing", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_x = v_0 * cos(theta)" });
    expect(r.ok).toBe(true);
  });

  it("strips trailing units before parsing", () => {
    const r = verifyStep({ step: VX_STEP, studentExpr: "v_0 * cos(theta) m/s" });
    expect(r.ok).toBe(true);
  });
});
