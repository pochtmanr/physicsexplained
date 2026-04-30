import "server-only";
import { getLocale } from "next-intl/server";
import { getContentEntry, type ContentKind } from "@/lib/content/fetch";
import { getBranch } from "@/lib/content/branches";
import { SITE } from "@/lib/seo/config";
import { extractDescription } from "@/lib/seo/description";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
  buildDefinedTermJsonLd,
} from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/jsonld";

interface Props {
  kind: ContentKind;
  slug: string;
}

function pathFor(kind: ContentKind, slug: string): string {
  if (kind === "topic") return `/${slug}`;
  if (kind === "glossary") return `/dictionary/${slug}`;
  return `/physicists/${slug}`;
}

export async function TopicPageSeo({ kind, slug }: Props) {
  const locale = await getLocale();
  const entry = await getContentEntry(kind, slug, locale);
  if (!entry) return null;
  if (entry.localeFallback) return null; // do not emit JSON-LD for noindex pages

  const url = SITE.localizedUrl(pathFor(kind, slug), locale);
  const ogImage = `${url}/opengraph-image`;
  const description = extractDescription({
    subtitle: entry.subtitle,
    blocks: entry.blocks as never,
    meta: entry.meta,
  });

  const breadcrumb: { name: string; url?: string }[] = [
    { name: "physics", url: SITE.baseUrl },
  ];

  let primary: unknown;

  if (kind === "topic") {
    const [branchSlug] = slug.split("/");
    const branch = getBranch(branchSlug);
    if (branch) {
      breadcrumb.push({ name: branch.title, url: SITE.localizedUrl(`/${branch.slug}`, locale) });
    }
    breadcrumb.push({ name: entry.title });

    const meta = entry.meta as { relatedTopics?: { topicSlug: string }[]; relatedGlossary?: { slug: string }[] };
    const about = [
      ...(branch ? [branch.title] : []),
      ...(meta.relatedGlossary?.map((g) => g.slug.replace(/-/g, " ")) ?? []),
    ];

    primary = buildArticleJsonLd({
      url,
      headline: entry.title,
      description,
      datePublished: typeof entry.meta.createdAt === "string" ? entry.meta.createdAt : undefined,
      dateModified: typeof entry.meta.updatedAt === "string" ? entry.meta.updatedAt : undefined,
      locale,
      image: ogImage,
      about: about.length > 0 ? about : undefined,
    });
  } else if (kind === "glossary") {
    breadcrumb.push({ name: "Dictionary", url: SITE.localizedUrl("/dictionary", locale) });
    breadcrumb.push({ name: entry.title });
    primary = buildDefinedTermJsonLd({
      url,
      name: entry.title,
      description,
      slug,
    });
  } else {
    breadcrumb.push({ name: "Physicists", url: SITE.localizedUrl("/physicists", locale) });
    breadcrumb.push({ name: entry.title });
    const meta = entry.meta as {
      born?: string;
      died?: string;
      nationality?: string;
      sameAs?: string[];
      contributions?: string[];
    };
    primary = buildPersonJsonLd({
      url,
      name: entry.title,
      birthDate: meta.born,
      deathDate: meta.died,
      nationality: meta.nationality,
      description,
      image: ogImage,
      sameAs: meta.sameAs,
      knowsAbout: meta.contributions,
    });
  }

  return (
    <>
      <JsonLd data={primary} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />
    </>
  );
}
