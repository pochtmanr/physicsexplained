import "server-only";
import type { Metadata } from "next";
import { getContentEntry, type ContentKind } from "@/lib/content/fetch";
import { getBranch } from "@/lib/content/branches";
import { locales, defaultLocale, isRtlLocale } from "@/i18n/config";
import { SITE } from "./config";
import { buildTitle } from "./title";
import { extractDescription } from "./description";
import { getRealLocaleSet } from "./locale-alternates";

function pathFor(kind: ContentKind, slug: string): string {
  if (kind === "topic") return `/${slug}`;
  if (kind === "glossary") return `/dictionary/${slug}`;
  return `/physicists/${slug}`;
}

function ogLocale(locale: string): string {
  // Map next-intl locales to OG locale codes
  if (locale === "en") return "en_US";
  if (locale === "he") return "he_IL";
  if (locale === "ar") return "ar_SA";
  return locale;
}

export function makeTopicMetadata(kind: ContentKind, slug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const entry = await getContentEntry(kind, slug, locale);
    if (!entry) return {};

    const path = pathFor(kind, slug);
    const enUrl = SITE.localizedUrl(path, defaultLocale);
    const localeUrl = SITE.localizedUrl(path, locale);
    const canonicalUrl = entry.localeFallback ? enUrl : localeUrl;

    const branchTitle =
      kind === "topic"
        ? (() => {
            const branchSlug = slug.split("/")[0];
            return getBranch(branchSlug)?.title ?? null;
          })()
        : null;

    const title = buildTitle(
      { title: entry.title, meta: entry.meta },
      branchTitle ? { title: branchTitle } : null,
    );

    const description = extractDescription({
      subtitle: entry.subtitle,
      blocks: entry.blocks as never,
      meta: entry.meta,
    });

    const realLocales = await getRealLocaleSet(kind, slug);
    const languages: Record<string, string> = {};
    for (const l of locales) {
      if (l === locale) continue;
      if (realLocales.has(l)) {
        languages[l] = SITE.localizedUrl(path, l);
      }
    }

    // Next.js auto-discovers og:image from the colocated `opengraph-image.tsx`
    // file in each segment and emits the (hash-suffixed) URL itself. Setting
    // `openGraph.images` / `twitter.images` here would override that with an
    // unhashed URL that 404s for static topic routes.
    const isProfile = kind === "physicist";

    const meta: Metadata = {
      metadataBase: new URL(SITE.baseUrl),
      title: { absolute: title },
      description,
      alternates: {
        canonical: canonicalUrl,
        ...(Object.keys(languages).length > 0 ? { languages } : {}),
      },
      openGraph: {
        type: isProfile ? "profile" : "article",
        url: localeUrl,
        siteName: SITE.name,
        locale: ogLocale(locale),
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };

    if (entry.localeFallback) {
      meta.robots = { index: false, follow: true };
    }

    return meta;
  };
}

// Convenience for branch index pages — they don't have a content_entries row.
export function makeBranchMetadata(branchSlug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const branch = getBranch(branchSlug);
    if (!branch) return {};

    const path = `/${branchSlug}`;
    const localeUrl = SITE.localizedUrl(path, locale);
    const enUrl = SITE.localizedUrl(path, defaultLocale);
    const title = buildTitle({ title: branch.title, meta: {} }, null);
    const description = branch.subtitle;

    // Branch index pages don't have a colocated opengraph-image.tsx — fall
    // back to the site's default OG image (root layout's openGraph would
    // otherwise be replaced wholesale by Next's metadata override semantics).
    const fallbackImage = { url: SITE.defaultOgImage, width: 1200, height: 630 };
    return {
      metadataBase: new URL(SITE.baseUrl),
      title: { absolute: title },
      description,
      alternates: { canonical: locale === defaultLocale ? localeUrl : enUrl },
      openGraph: {
        type: "website",
        url: localeUrl,
        siteName: SITE.name,
        locale: ogLocale(locale),
        title,
        description,
        images: [fallbackImage],
      },
      twitter: { card: "summary_large_image", title, description, images: [SITE.defaultOgImage] },
    };
  };
}

export { ogLocale, isRtlLocale };
