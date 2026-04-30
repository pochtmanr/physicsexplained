import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getContentEntry } from "@/lib/content/fetch";
import { ContentBlocks } from "@/components/content/content-blocks";
import { TopicHeader } from "@/components/layout/topic-header";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import type { AsideLink } from "@/components/layout/aside-links";
import { makeTopicMetadata } from "@/lib/seo/topic-metadata";
import { TopicPageSeo } from "@/components/seo/topic-page-seo";

const SLUG = "electromagnetism/magnetization-and-the-h-field";

export const generateMetadata = makeTopicMetadata("topic", SLUG);

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const entry = await getContentEntry("topic", SLUG, locale);
  if (!entry) notFound();

  const aside = Array.isArray(entry.meta.aside)
    ? (entry.meta.aside as AsideLink[])
    : [];
  const eyebrow =
    typeof entry.meta.eyebrow === "string" ? entry.meta.eyebrow : "";

  return (
    <TopicPageLayout aside={aside}>
      <TopicPageSeo kind="topic" slug={SLUG} />
      <TopicHeader
        eyebrow={eyebrow}
        title={entry.title}
        subtitle={entry.subtitle ?? ""}
      />
      {entry.localeFallback ? (
        <p className="mt-2 font-mono text-xs opacity-60">
          Translation pending. Showing English.
        </p>
      ) : null}
      <ContentBlocks blocks={entry.blocks} />
    </TopicPageLayout>
  );
}
