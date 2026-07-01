import { describe, expect, it } from "vitest";
import { normalizeWheelDelta } from "./wheel";

describe("normalizeWheelDelta", () => {
  it("passes pixel-mode (deltaMode 0) deltas through", () => {
    expect(normalizeWheelDelta(100, 0, 600)).toBe(100);
    expect(normalizeWheelDelta(-53, 0, 600)).toBe(-53);
  });

  it("converts Firefox line-mode (deltaMode 1) notches to pixels", () => {
    expect(normalizeWheelDelta(3, 1, 600)).toBe(48); // 3 lines × 16px
    expect(normalizeWheelDelta(-3, 1, 600)).toBe(-48);
  });

  it("converts page-mode (deltaMode 2) via viewport height, then clamps", () => {
    expect(normalizeWheelDelta(1, 2, 600)).toBe(120); // 600px clamped
  });

  it("clamps any single event to one notch (±120px)", () => {
    expect(normalizeWheelDelta(2000, 0, 600)).toBe(120); // momentum fling
    expect(normalizeWheelDelta(-2000, 0, 600)).toBe(-120);
  });
});
