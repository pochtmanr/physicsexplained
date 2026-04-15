import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { PHYSICISTS, getLocalizedPhysicist } from "@/lib/content/physicists";
import { getBranch, getTopic } from "@/lib/content/branches";
import { TopicHeader } from "@/components/layout/topic-header";
import { ArticleLayout } from "@/components/layout/article-layout";
import { AsideLinks } from "@/components/layout/aside-links";
import type { AsideLink } from "@/components/layout/aside-links";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    PHYSICISTS.map((p) => ({ locale, slug: p.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const physicist = await getLocalizedPhysicist(slug);
  if (!physicist) return {};
  return {
    title: `${physicist.name} — physics`,
    description: physicist.oneLiner,
  };
}

export default async function PhysicistPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const physicist = await getLocalizedPhysicist(slug);
  if (!physicist) notFound();

  const t = await getTranslations("common.pages.physicists");
  const messages = (await getMessages()) as {
    common?: { pages?: { physicists?: { nationalities?: Record<string, string> } } };
  };
  const nationalityMap =
    messages.common?.pages?.physicists?.nationalities ?? {};
  const localizedNationality = nationalityMap[physicist.nationality] ?? physicist.nationality;

  const bioParagraphs = physicist.bio.split("\n\n");

  const relatedTopics = physicist.relatedTopics
    .map((ref) => {
      const branch = getBranch(ref.branchSlug);
      const topic = getTopic(ref.branchSlug, ref.topicSlug);
      if (!branch || !topic) return null;
      return { branch, topic };
    })
    .filter((x): x is { branch: NonNullable<ReturnType<typeof getBranch>>; topic: NonNullable<ReturnType<typeof getTopic>> } => x !== null);

  const asideLinks: AsideLink[] = relatedTopics.map(({ branch, topic }) => ({
    type: "topic" as const,
    label: topic.title,
    sublabel: branch.title,
    href: `/${branch.slug}/${topic.slug}`,
  }));

  return (
    <ArticleLayout aside={asideLinks.length > 0 ? <AsideLinks links={asideLinks} /> : undefined}>
      <TopicHeader
        eyebrow={`§ ${t("eyebrowSingular")} · ${physicist.born}–${physicist.died} · ${localizedNationality.toUpperCase()}`}
        title={physicist.name}
        subtitle={physicist.oneLiner}
      />

      {physicist.image && (
        <div className="mb-16 overflow-hidden rounded-lg border border-[var(--color-fg-3)]">
          <img
            src={physicist.image}
            alt={t("portraitAlt", { name: physicist.name })}
            className="w-full max-h-[400px] object-cover"
          />
        </div>
      )}

      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
            §&#8239;01
          </span>
          <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
            {t("sectionBiography")}
          </h2>
        </div>
        <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
          {bioParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
            §&#8239;02
          </span>
          <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
            {t("sectionContributions")}
          </h2>
        </div>
        <ol className="mt-6 space-y-3">
          {physicist.contributions.map((c, i) => (
            <li
              key={i}
              className="flex gap-4 border-l border-[var(--color-fg-3)] pl-4 text-[var(--color-fg-1)]"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)] tabular-nums pt-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      </section>

      {physicist.majorWorks && physicist.majorWorks.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
              §&#8239;03
            </span>
            <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
              {t("sectionMajorWorks")}
            </h2>
          </div>
          <div className="mt-6 space-y-6">
            {physicist.majorWorks.map((work, i) => (
              <div
                key={i}
                className="border-l border-[var(--color-fg-3)] pl-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)] tabular-nums">
                    {work.year}
                  </span>
                  <span className="text-lg font-semibold italic text-[var(--color-fg-0)]">
                    {work.title}
                  </span>
                </div>
                <p className="mt-1 text-[var(--color-fg-1)]">
                  {work.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedTopics.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
              §&#8239;{physicist.majorWorks && physicist.majorWorks.length > 0 ? "04" : "03"}
            </span>
            <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
              {t("sectionRelatedTopics")}
            </h2>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-0 [&>*]:-mt-px">
            {relatedTopics.map(({ branch, topic }) => (
              <Link
                key={`${branch.slug}/${topic.slug}`}
                href={`/${branch.slug}/${topic.slug}`}
                className="group flex items-center justify-between border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-6 transition-colors hover:z-10 hover:border-[var(--color-cyan)]"
              >
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
                    {branch.title}
                  </div>
                  <div className="mt-2 text-lg font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                    {topic.title}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-[var(--color-fg-3)] pt-8">
        <Link
          href="/physicists"
          className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-cyan)]"
        >
          {t("backLink")}
        </Link>
      </div>
    </ArticleLayout>
  );
}
