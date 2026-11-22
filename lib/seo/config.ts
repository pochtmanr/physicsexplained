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
  // Public profiles of the project (emitted as schema.org sameAs).
  sameAs: [
    "https://github.com/pochtmanr/physicsexplained",
    "https://apps.apple.com/us/app/physics-exp/id6793272026",
  ] as readonly string[],
  // The company behind the site. Emitted as the Organization's
  // parentOrganization and linked from the footer and About page.
  company: {
    name: "Simnetiq Ltd",
    url: "https://simnetiq.com",
    email: "support@simnetiq.com",
    sameAs: ["https://x.com/simnetiq"] as readonly string[],
  },
  // The native app, promoted in the hero and described in JSON-LD.
  iosApp: {
    name: "Physics.explained",
    url: "https://apps.apple.com/us/app/physics-exp/id6793272026",
  },

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
