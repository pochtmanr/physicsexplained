import { describe, it, expect } from "vitest";
import { normalizeStudentExpr } from "@/lib/problems/normalize";

describe("normalizeStudentExpr — pre-parse cleanup", () => {
  it("inserts implicit multiplication between number and identifier", () => {
    expect(normalizeStudentExpr("30cos(45)")).toBe("30*cos(45)");
    expect(normalizeStudentExpr("2v_0")).toBe("2*v_0");
  });

  it("inserts implicit multiplication between identifier and parenthesis", () => {
    expect(normalizeStudentExpr("v_0(t)")).toBe("v_0*(t)");
  });

  it("converts ** to ^", () => {
    expect(normalizeStudentExpr("v_0**2")).toBe("v_0^2");
  });

  it("converts pi and π to PI", () => {
    expect(normalizeStudentExpr("2*pi*r")).toBe("2*PI*r");
    expect(normalizeStudentExpr("2*π*r")).toBe("2*PI*r");
  });

  it("lowercases trig function names", () => {
    expect(normalizeStudentExpr("SIN(x) + COS(x)")).toBe("sin(x) + cos(x)");
    expect(normalizeStudentExpr("Tan(theta)")).toBe("tan(theta)");
  });

  it("strips trailing units and equals-tail", () => {
    expect(normalizeStudentExpr("21.2 m/s")).toBe("21.2");
    expect(normalizeStudentExpr("vx = 21.2")).toBe("21.2");
    expect(normalizeStudentExpr("vx = 30*cos(45) = 21.2")).toBe("21.2");
  });

  it("collapses repeated whitespace", () => {
    expect(normalizeStudentExpr("  30  *  cos( 45 )  ")).toBe("30 * cos( 45 )");
  });

  it("preserves greek letters used as identifiers", () => {
    expect(normalizeStudentExpr("theta")).toBe("theta");
    expect(normalizeStudentExpr("omega_0")).toBe("omega_0");
  });

  it("converts degree symbol to *deg suffix", () => {
    expect(normalizeStudentExpr("cos(45°)")).toBe("cos(45*deg)");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeStudentExpr("")).toBe("");
    expect(normalizeStudentExpr("   ")).toBe("");
  });
});
