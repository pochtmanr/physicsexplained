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
}

function readColors(): ThemeColors {
  const s = getComputedStyle(document.documentElement);
  return {
    fg0: s.getPropertyValue("--color-fg-0").trim(),
    fg1: s.getPropertyValue("--color-fg-1").trim(),
    fg2: s.getPropertyValue("--color-fg-3").trim(),
    fg3: s.getPropertyValue("--color-fg-4").trim(),
    bg0: s.getPropertyValue("--color-bg-0").trim(),
    bg1: s.getPropertyValue("--color-bg-1").trim(),
    cyan: s.getPropertyValue("--color-cyan").trim(),
    magenta: s.getPropertyValue("--color-magenta").trim(),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>({
    fg0: "#EEF2F9",
    fg1: "#B6C4D8",
    fg2: "#56687F",
    fg3: "#2A3448",
    bg0: "#07090E",
    bg1: "#07090E",
    cyan: "#6FB8C6",
    magenta: "#FF6ADE",
  });

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
