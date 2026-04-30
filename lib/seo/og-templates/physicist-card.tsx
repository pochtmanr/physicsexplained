import { getContentEntry } from "@/lib/content/fetch";
import { renderCard } from "./shared";

export async function physicistOgImage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const entry = await getContentEntry("physicist", slug, locale);
  if (!entry) return renderCard({ locale, eyebrow: "physics", title: "physics" });

  const meta = entry.meta as { born?: string; died?: string; nationality?: string };
  const dates = meta.born && meta.died ? `${meta.born}–${meta.died}` : "";
  const eyebrow = `§ Physicist${dates ? ` · ${dates}` : ""}`;

  return renderCard({
    locale,
    eyebrow,
    title: entry.title,
    subtitle: entry.subtitle ?? meta.nationality ?? undefined,
  });
}
