import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { GLOSSARY, getTerm } from "@/lib/content/glossary";
import { getLocalizedPhysicist } from "@/lib/content/physicists";
import { getBranch, getTopic } from "@/lib/content/branches";
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { ArticleLayout } from "@/components/layout/article-layout";
import { AsideLinks } from "@/components/layout/aside-links";
import type { AsideLink } from "@/components/layout/aside-links";
import { SceneCard } from "@/components/layout/scene-card";
import { Visualization } from "@/components/physics/visualization-registry";
import { RichText } from "@/components/content/rich-text";

type GlossaryMessage = {
  term?: string;
  shortDefinition?: string;
  description?: string;
  history?: string;
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    GLOSSARY.map((t) => ({ locale, slug: t.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) return {};
  return {
    title: `${term.term} — physics`,
    description: term.shortDefinition,
  };
}

export default async function DictionaryTermPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const term = getTerm(slug);
  if (!term) notFound();

  const t = await getTranslations("common.pages.dictionary");
  const messages = await getMessages();
  const localized = ((messages.glossary ?? {}) as Record<string, GlossaryMessage>)[slug] ?? {};

  const displayTerm = localized.term ?? term.term;
  const displayShort = localized.shortDefinition ?? term.shortDefinition;
  const displayDescription = localized.description ?? term.description;
  const displayHistory = localized.history ?? term.history;

  const definitionParagraphs = displayDescription.split("\n\n");
  const historyParagraphs = displayHistory ? displayHistory.split("\n\n") : [];

  const relatedPhysicists = (
    await Promise.all((term.relatedPhysicists ?? []).map((s) => getLocalizedPhysicist(s)))
  ).filter((p): p is NonNullable<Awaited<ReturnType<typeof getLocalizedPhysicist>>> => p !== undefined);

  const relatedTopics = (term.relatedTopics ?? [])
    .map((ref) => {
      const branch = getBranch(ref.branchSlug);
      const topic = getTopic(ref.branchSlug, ref.topicSlug);
      if (!branch || !topic) return null;
      return { branch, topic };
    })
    .filter((x): x is { branch: NonNullable<ReturnType<typeof getBranch>>; topic: NonNullable<ReturnType<typeof getTopic>> } => x !== null);

  const asideLinks: AsideLink[] = [
    ...relatedPhysicists.map((p) => ({
      type: "physicist" as const,
      label: p.name,
      sublabel: `${p.born}–${p.died}`,
      href: `/physicists/${p.slug}`,
    })),
    ...relatedTopics.map(({ branch, topic }) => ({
      type: "topic" as const,
      label: topic.title,
      sublabel: branch.title,
      href: `/${branch.slug}/${topic.slug}`,
    })),
  ];

  const hasViz = !!term.visualization;
  const hasIllustration = !!term.illustration;

  let sectionIdx = 0;

  return (
    <ArticleLayout aside={asideLinks.length > 0 ? (
      <div className="rounded-lg border border-[var(--color-fg-3)] p-4">
        <AsideLinks links={asideLinks} />
      </div>
    ) : undefined}>
      <TopicHeader
        eyebrow={
          <>
            §{" "}
            <Link
              href="/dictionary"
              className="transition-colors hover:text-[var(--color-fg-0)]"
            >
              {t("linkLabel")}
            </Link>
            {" · "}
            {t(`categorySingular.${term.category}`)}
          </>
        }
        title={displayTerm}
        subtitle={displayShort}
      />

      <Section index={++sectionIdx} title={t("sectionDefinition")}>
        <p><RichText text={definitionParagraphs[0]} /></p>

        {hasViz && (
          <SceneCard caption={t("interactive", { term: displayTerm })} className="w-full">
            <Visualization vizKey={term.visualization!} />
          </SceneCard>
        )}

        {hasIllustration && (
          <SceneCard caption={displayTerm} className="w-full">
            <div className="flex justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={term.illustration!}
                alt={t("illustrationAlt", { term: displayTerm })}
                width={560}
                height={360}
                className="h-auto max-w-full dictionary-illustration"
              />
            </div>
          </SceneCard>
        )}

        {definitionParagraphs.length > 1 &&
          definitionParagraphs.slice(1).map((para, i) => (
            <p key={i}><RichText text={para} /></p>
          ))}
      </Section>

      {historyParagraphs.length > 0 && (
        <Section index={++sectionIdx} title={t("sectionHistory")}>
          {historyParagraphs.map((para, i) => (
            <p key={i}><RichText text={para} /></p>
          ))}
        </Section>
      )}

      <div className="mt-12 border-t border-[var(--color-fg-3)] pt-8">
        <Link
          href="/dictionary"
          className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-cyan)]"
        >
          {t("backLink")}
        </Link>
      </div>
    </ArticleLayout>
  );
}
