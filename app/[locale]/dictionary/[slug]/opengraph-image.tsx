import { glossaryOgImage } from "@/lib/seo/og-templates/glossary-card";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  return glossaryOgImage({ slug, locale });
}
