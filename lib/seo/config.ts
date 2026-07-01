import { defaultLocale } from "@/i18n/config";

export const SITE = {
  // Overridable per environment so preview deploys don't emit production
  // canonicals; production falls back to the canonical domain.
  baseUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://physics.it.com",
  name: "Physics.explained",
  tagline: "Visual-first physics explainers with live, accurate simulations.",
  defaultOgImage: "/og-image.png",
  // Public profiles of the studio (populate to strengthen the Organization
  // knowledge-graph entity; emitted as schema.org sameAs when non-empty).
  sameAs: [] as readonly string[],

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
