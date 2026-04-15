"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";

type Theme = "dark" | "light";

const STORAGE_KEY = "physics-theme";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const t = useTranslations("common.theme");
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked — theme still applies for this session
    }
  };

  const label = mounted
    ? theme === "dark"
      ? t("light")
      : t("dark")
    : t("initial");
  const IconComponent = mounted ? (theme === "dark" ? Sun : Moon) : Sun;
  const ariaLabel =
    theme === "dark" ? t("switchToLight") : t("switchToDark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      className="flex items-center gap-2 border border-[var(--color-fg-3)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] md:px-3"
    >
      <IconComponent aria-hidden="true" size={14} strokeWidth={1.5} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
