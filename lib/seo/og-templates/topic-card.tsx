import { getContentEntry } from "@/lib/content/fetch";
import { getBranch } from "@/lib/content/branches";
import { renderCard } from "./shared";

export async function topicOgImage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const entry = await getContentEntry("topic", slug, locale);
  if (!entry) return renderCard({ locale, eyebrow: "physics", title: "physics" });

  const branchSlug = slug.split("/")[0];
  const branch = getBranch(branchSlug);
  const eyebrow = branch ? `§ ${branch.title}` : "physics";

  return renderCard({
    locale,
    eyebrow,
    title: entry.title,
    subtitle: entry.subtitle ?? undefined,
  });
}
