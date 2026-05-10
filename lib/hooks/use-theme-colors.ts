"use client";

import { useEffect, useState } from "react";

export interface ThemeColors {
  fg0: string;
  fg1: string;
  fg2: string; // meta/muted (canvas labels, axis text) — backed by --color-fg-3
  fg3: string; // border/rule (gridlines, hairlines) — backed by --color-fg-4
  bg0: string;
  bg1: string;
  cyan: string;
  magenta: string;
  amber: string;
  mint: string;
  red: string;
  blue: string;
  purple: string;
  orange: string;
  green: string;
}

const DARK_FALLBACK: ThemeColors = {
  fg0: "#EEF2F9",
  fg1: "#B6C4D8",
  fg2: "#56687F",
  fg3: "#2A3448",
  bg0: "#1A1D24",
  bg1: "#1A1D24",
  cyan: "#6FB8C6",
  magenta: "#FF6ADE",
  amber: "#F5C451",
  mint: "#5BFFAE",
  red: "#F87171",
  blue: "#7DD3FC",
  purple: "#A78BFA",
  orange: "#FB923C",
  green: "#86EFAC",
};

function readColors(): ThemeColors {
  const s = getComputedStyle(document.documentElement);
  const read = (k: string, fallback: string): string => {
    const v = s.getPropertyValue(k).trim();
    return v || fallback;
  };
  return {
    fg0: read("--color-fg-0", DARK_FALLBACK.fg0),
    fg1: read("--color-fg-1", DARK_FALLBACK.fg1),
    fg2: read("--color-fg-3", DARK_FALLBACK.fg2),
    fg3: read("--color-fg-4", DARK_FALLBACK.fg3),
    bg0: read("--color-bg-0", DARK_FALLBACK.bg0),
    bg1: read("--color-bg-1", DARK_FALLBACK.bg1),
    cyan: read("--color-cyan", DARK_FALLBACK.cyan),
    magenta: read("--color-magenta", DARK_FALLBACK.magenta),
    amber: read("--color-amber", DARK_FALLBACK.amber),
    mint: read("--color-mint", DARK_FALLBACK.mint),
    red: read("--color-red", DARK_FALLBACK.red),
    blue: read("--color-blue", DARK_FALLBACK.blue),
    purple: read("--color-purple", DARK_FALLBACK.purple),
    orange: read("--color-orange", DARK_FALLBACK.orange),
    green: read("--color-green", DARK_FALLBACK.green),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(DARK_FALLBACK);

  useEffect(() => {
    setColors(readColors());

    const observer = new MutationObserver(() => {
      setColors(readColors());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
