"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

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

  const IconComponent = mounted ? (theme === "dark" ? Sun : Moon) : Sun;
  const ariaLabel =
    theme === "dark" ? t("switchToLight") : t("switchToDark");

  return (
    <Button
      variant="icon"
      size="icon"
      onClick={toggle}
      aria-label={ariaLabel}
    >
      <IconComponent aria-hidden="true" size={14} strokeWidth={1.5} />
    </Button>
  );
}
