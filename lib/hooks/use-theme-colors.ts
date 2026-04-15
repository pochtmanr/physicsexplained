"use client";

import { useEffect, useState } from "react";

export interface ThemeColors {
  fg0: string;
  fg1: string;
  fg2: string;
  fg3: string;
  bg0: string;
  bg1: string;
}

function readColors(): ThemeColors {
  const s = getComputedStyle(document.documentElement);
  return {
    fg0: s.getPropertyValue("--color-fg-0").trim(),
    fg1: s.getPropertyValue("--color-fg-1").trim(),
    fg2: s.getPropertyValue("--color-fg-2").trim(),
    fg3: s.getPropertyValue("--color-fg-3").trim(),
    bg0: s.getPropertyValue("--color-bg-0").trim(),
    bg1: s.getPropertyValue("--color-bg-1").trim(),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>({
    fg0: "#E6EDF7",
    fg1: "#9FB0C8",
    fg2: "#5B6B86",
    fg3: "#2A3448",
    bg0: "#05070A",
    bg1: "#0B0F16",
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
