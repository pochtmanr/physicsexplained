import { describe, expect, it } from "vitest";
import type { ThemeColors } from "@/lib/hooks/use-theme-colors";
import { colorIndexForId, colorPalette, colorForId } from "./palette";

const COLORS: ThemeColors = {
  fg0: "#000",
  fg1: "#000",
  fg2: "#000",
  fg3: "#000",
  bg0: "#000",
  bg1: "#000",
  cyan: "#cyan",
  magenta: "#mage",
  amber: "#ambr",
  mint: "#mint",
};

describe("palette", () => {
  it("exposes 8 colors for body id hashing", () => {
    expect(colorPalette(COLORS)).toHaveLength(8);
    expect(colorPalette(COLORS, true)).toHaveLength(8);
  });

  it("includes the four brand tokens at the front", () => {
    const p = colorPalette(COLORS);
    expect(p.slice(0, 4)).toEqual([
      COLORS.cyan,
      COLORS.amber,
      COLORS.magenta,
      COLORS.mint,
    ]);
  });

  it("colorIndexForId is deterministic and within bounds", () => {
    const ids = ["a", "b", "c", "u123abc", "sun", "p1"];
    for (const id of ids) {
      const i = colorIndexForId(id, 8);
      expect(i).toBe(colorIndexForId(id, 8));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(8);
    }
  });

  it("colorForId never returns undefined", () => {
    for (const id of ["x", "y", "z", "verylongbodyidentifier"]) {
      const c = colorForId(id, COLORS);
      expect(typeof c).toBe("string");
      expect(c.length).toBeGreaterThan(0);
    }
  });
});
