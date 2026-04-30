import { defaultLocale } from "@/i18n/config";

export const SITE = {
  baseUrl: "https://physics.it.com",
  name: "physics",
  tagline: "Visual-first physics explainers with live, accurate simulations.",
  defaultOgImage: "/og-image.png",

  buildUrl(path: string): string {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${clean}`;
  },

  localizedUrl(path: string, locale: string): string {
    const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
    if (locale === defaultLocale) return `${this.baseUrl}${clean || "/"}`;
    return `${this.baseUrl}/${locale}${clean}`;
  },
} as const;
