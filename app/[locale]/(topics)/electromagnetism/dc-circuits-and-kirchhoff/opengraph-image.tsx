import { topicOgImage } from "@/lib/seo/og-templates/topic-card";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return topicOgImage({ slug: "electromagnetism/dc-circuits-and-kirchhoff", locale });
}
