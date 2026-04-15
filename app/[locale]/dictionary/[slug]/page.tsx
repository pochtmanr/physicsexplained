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

const IMAGE_MARKER_RE = /^\[\[image:(\d+)\]\]$/;

function ProseImage({
  src,
  caption,
  fallbackAlt,
}: {
  src: string;
  caption?: string;
  fallbackAlt: string;
}) {
  return (
    <figure className="not-prose my-8 flex flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)]">
      <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--color-bg-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption ?? fallbackAlt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      {caption && (
        <figcaption className="border-t border-[var(--color-fg-3)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ProseBlock({
  block,
  idx,
  images,
  captions,
  fallbackAlt,
}: {
  block: string;
  idx: number;
  images: readonly { src: string }[];
  captions: string[];
  fallbackAlt: string;
}) {
  const imgMatch = block.match(IMAGE_MARKER_RE);
  if (imgMatch) {
    const i = parseInt(imgMatch[1], 10);
    const img = images[i];
    if (!img) return null;
    return (
      <ProseImage
        key={idx}
        src={img.src}
        caption={captions[i]}
        fallbackAlt={fallbackAlt}
      />
    );
  }
  if (block.startsWith("### ")) {
    return (
      <h4
        key={idx}
        className="mt-8 mb-3 text-lg font-semibold uppercase tracking-tight text-[var(--color-fg-0)]"
      >
        <RichText text={block.slice(4)} />
      </h4>
    );
  }
  if (block.startsWith("## ")) {
    return (
      <h3
        key={idx}
        className="mt-12 mb-4 text-xl md:text-2xl font-semibold tracking-tight text-[var(--color-fg-0)]"
      >
        <RichText text={block.slice(3)} />
      </h3>
    );
  }
  return (
    <p key={idx}>
      <RichText text={block} />
    </p>
  );
}

type GlossaryMessage = {
  term?: string;
  shortDefinition?: string;
  description?: string;
  history?: string;
  imageCaptions?: string[];
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
  const images = term.images ?? [];
  const captions = localized.imageCaptions ?? [];
  const fallbackAlt = t("illustrationAlt", { term: displayTerm });

  const allBlocks = [...definitionParagraphs, ...historyParagraphs];
  const inlineImageIndices = new Set<number>();
  for (const b of allBlocks) {
    const m = b.match(IMAGE_MARKER_RE);
    if (m) inlineImageIndices.add(parseInt(m[1], 10));
  }
  const ungalleriedImages = images
    .map((img, i) => ({ img, i }))
    .filter(({ i }) => !inlineImageIndices.has(i));
  const showGallery = inlineImageIndices.size === 0 && images.length > 0;

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
        <ProseBlock
          block={definitionParagraphs[0]}
          idx={0}
          images={images}
          captions={captions}
          fallbackAlt={fallbackAlt}
        />

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

        {showGallery && (
          <div className="not-prose grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ungalleriedImages.map(({ img, i }) => {
              const caption = captions[i];
              return (
                <figure
                  key={img.src}
                  className="flex flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)]"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--color-bg-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={caption ?? fallbackAlt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {caption && (
                    <figcaption className="border-t border-[var(--color-fg-3)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}

        {definitionParagraphs.length > 1 &&
          definitionParagraphs.slice(1).map((para, i) => (
            <ProseBlock
              key={i + 1}
              block={para}
              idx={i + 1}
              images={images}
              captions={captions}
              fallbackAlt={fallbackAlt}
            />
          ))}
      </Section>

      {historyParagraphs.length > 0 && (
        <Section index={++sectionIdx} title={t("sectionHistory")}>
          {historyParagraphs.map((para, i) => (
            <ProseBlock
              key={i}
              block={para}
              idx={i}
              images={images}
              captions={captions}
              fallbackAlt={fallbackAlt}
            />
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
