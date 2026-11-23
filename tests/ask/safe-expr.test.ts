import { describe, it, expect } from "vitest";
import { parse } from "mathjs";
import { checkSafeExpr } from "@/lib/math/safe-expr";

describe("checkSafeExpr", () => {
  it("allows scalar arithmetic and listed functions", () => {
    expect(checkSafeExpr(parse("A*exp(-gamma*t)*cos(omega*t) + 2^3")).ok).toBe(true);
  });

  it("rejects ranges, matrices, assignments and unlisted functions", () => {
    for (const e of ["1:5", "[1,2]", "zeros(2,2)", "x = 2", "f(x) = x", "import(1)", "a.b(1)"]) {
      expect(checkSafeExpr(parse(e)).ok, e).toBe(false);
    }
  });

  it("allows conditionals only when asked", () => {
    const node = parse("x > 0 ? 1 : 0");
    expect(checkSafeExpr(node).ok).toBe(false);
    expect(checkSafeExpr(node, { extraNodeTypes: ["ConditionalNode", "RelationalNode"] }).ok).toBe(true);
  });
});
