import { getContentEntry } from "@/lib/content/fetch";
import { renderCard } from "./shared";

export async function glossaryOgImage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const entry = await getContentEntry("glossary", slug, locale);
  if (!entry) return renderCard({ locale, eyebrow: "physics", title: "physics" });

  return renderCard({
    locale,
    eyebrow: "§ Dictionary",
    title: entry.title,
    subtitle: entry.subtitle ?? undefined,
  });
}
