import type { ThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Eight-color body palette. Four come from the theme tokens (cyan / amber /
 * magenta / mint) so bodies match the rest of the site. The other four are
 * playground-only hex literals chosen for contrast on both the dark and the
 * light canvas backgrounds — adding them to globals.css would bloat the
 * brand-color surface for a single scene.
 *
 * Order matters: ids hash into this array, so changing the order reshuffles
 * everyone's colors. Append-only.
 */
const EXTRA_DARK = ["#FF8A8A", "#B895F0", "#7BC8FF", "#FFB07A"];
const EXTRA_LIGHT = ["#C0464A", "#7E5DC4", "#3F90C9", "#C2773F"];

export function colorPalette(c: ThemeColors, isLight = false): string[] {
  const extras = isLight ? EXTRA_LIGHT : EXTRA_DARK;
  return [c.cyan, c.amber, c.magenta, c.mint, ...extras];
}

/** Stable hash → palette index. Same id always picks the same color. */
export function colorIndexForId(id: string, paletteLen: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % paletteLen;
}

/** Convenience: resolve a body id to a palette color. */
export function colorForId(
  id: string,
  c: ThemeColors,
  isLight = false,
): string {
  const palette = colorPalette(c, isLight);
  return palette[colorIndexForId(id, palette.length)] ?? c.cyan;
}
