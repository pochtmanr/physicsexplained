import type { Metadata } from "next";
import { SITE } from "./config";
import { buildAlternates } from "./alternates";

/** Map next-intl locales to Open Graph locale codes. */
export function ogLocale(locale: string): string {
  if (locale === "en") return "en_US";
  if (locale === "he") return "he_IL";
  if (locale === "ar") return "ar_SA";
  return locale;
}

export interface PageMetadataParams {
  /** Locale-less path, e.g. `/dictionary`. */
  path: string;
  locale: string;
  title: string;
  description: string;
  /** Use the title verbatim instead of appending the site name. */
  absoluteTitle?: boolean;
  /** Locales the page is really translated into; defaults to all of them. */
  realLocales?: Iterable<string>;
  /**
   * Set false for segments with a colocated `opengraph-image` file — Next
   * emits that image itself and an explicit one here would override it.
   */
  defaultImage?: boolean;
  ogType?: "website" | "article";
}

/**
 * Metadata for hub, legal and other non-content-entry pages: self-canonical,
 * full hreflang set, and Open Graph / Twitter tags that match the page instead
 * of inheriting the generic site-wide ones from the root layout.
 */
export function buildPageMetadata(p: PageMetadataParams): Metadata {
  const alternates = buildAlternates(p.path, p.locale, p.realLocales);
  const fullTitle = p.absoluteTitle ? p.title : `${p.title} — ${SITE.name}`;
  const withImage = p.defaultImage !== false;
  return {
    metadataBase: new URL(SITE.baseUrl),
    title: { absolute: fullTitle },
    description: p.description,
    alternates,
    openGraph: {
      type: p.ogType ?? "website",
      url: alternates.canonical,
      siteName: SITE.name,
      locale: ogLocale(p.locale),
      title: fullTitle,
      description: p.description,
      ...(withImage
        ? { images: [{ url: SITE.defaultOgImage, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: p.description,
      ...(withImage ? { images: [SITE.defaultOgImage] } : {}),
    },
  };
}
