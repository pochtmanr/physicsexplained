import { locales, defaultLocale } from "@/i18n/config";
import { SITE } from "./config";

export interface PageAlternates {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * Canonical + hreflang set for one page.
 *
 * The hreflang map lists every locale the page really exists in — including
 * the current one, which search engines require for the set to be valid — plus
 * `x-default` pointing at the default-locale URL. Pass `realLocales` for pages
 * that are only translated into some locales; a locale missing from it gets no
 * hreflang entry and canonicalises to the default-locale URL.
 */
export function buildAlternates(
  path: string,
  locale: string,
  realLocales: Iterable<string> = locales,
): PageAlternates {
  const real = new Set(realLocales);
  real.add(defaultLocale);
  const languages: Record<string, string> = {};
  for (const l of locales) {
    if (real.has(l)) languages[l] = SITE.localizedUrl(path, l);
  }
  languages["x-default"] = SITE.localizedUrl(path, defaultLocale);
  return {
    canonical: SITE.localizedUrl(path, real.has(locale) ? locale : defaultLocale),
    languages,
  };
}
