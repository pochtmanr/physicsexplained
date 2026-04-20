import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { GLOSSARY } from "@/lib/content/glossary";
import { getContentEntry } from "@/lib/content/fetch";
import { getPhysicist } from "@/lib/content/physicists";
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
    <figure className="not-prose my-8 flex flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)]">
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
        <figcaption className="border-t border-[var(--color-fg-4)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
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

interface GlossaryImage {
  src: string;
}

type TopicRefLike = { branchSlug: string; topicSlug: string };

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function readImages(value: unknown): GlossaryImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (v && typeof v === "object" && typeof (v as { src?: unknown }).src === "string") {
        return { src: (v as { src: string }).src };
      }
      return null;
    })
    .filter((x): x is GlossaryImage => x !== null);
}

function readTopicRefs(value: unknown): TopicRefLike[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (
        v &&
        typeof v === "object" &&
        typeof (v as { branchSlug?: unknown }).branchSlug === "string" &&
        typeof (v as { topicSlug?: unknown }).topicSlug === "string"
      ) {
        return {
          branchSlug: (v as { branchSlug: string }).branchSlug,
          topicSlug: (v as { topicSlug: string }).topicSlug,
        };
      }
      return null;
    })
    .filter((x): x is TopicRefLike => x !== null);
}

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
  const { locale, slug } = await params;
  const entry = await getContentEntry("glossary", slug, locale);
  if (!entry) return {};
  return {
    title: `${entry.title} — physics`,
    description: entry.subtitle ?? undefined,
  };
}

export default async function DictionaryTermPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const entry = await getContentEntry("glossary", slug, locale);
  if (!entry) notFound();

  const t = await getTranslations("common.pages.dictionary");

  const category = readString(entry.meta.category) ?? "concept";
  const history = readString(entry.meta.history);
  const visualization = readString(entry.meta.visualization);
  const illustration = readString(entry.meta.illustration);
  const images = readImages(entry.meta.images);
  const captions = readStringArray(entry.meta.imageCaptions);
  const relatedPhysicistSlugs = readStringArray(entry.meta.relatedPhysicists);
  const relatedTopicRefs = readTopicRefs(entry.meta.relatedTopics);

  const displayTerm = entry.title;
  const displayShort = entry.subtitle ?? "";

  const definitionParagraphs = entry.blocks
    .filter((b) => b.type === "paragraph")
    .map((b) => {
      if (b.type !== "paragraph") return "";
      const first = b.inlines[0];
      return typeof first === "string" ? first : "";
    })
    .filter((s) => s.length > 0);

  const historyParagraphs = history ? history.split("\n\n") : [];

  const relatedPhysicists = (
    await Promise.all(
      relatedPhysicistSlugs.map(async (s) => {
        const base = getPhysicist(s);
        if (!base) return null;
        const physEntry = await getContentEntry("physicist", s, locale);
        return {
          slug: s,
          name: physEntry?.title ?? s,
          born: base.born,
          died: base.died,
        };
      }),
    )
  ).filter((p): p is { slug: string; name: string; born: string; died: string } => p !== null);

  const relatedTopics = relatedTopicRefs
    .map((ref) => {
      const branch = getBranch(ref.branchSlug as never);
      const topic = getTopic(ref.branchSlug as never, ref.topicSlug);
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

  const hasViz = !!visualization;
  const hasIllustration = !!illustration;
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
      <div className="rounded-lg border border-[var(--color-fg-4)] p-4">
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
            {t(`categorySingular.${category}`)}
          </>
        }
        title={displayTerm}
        subtitle={displayShort}
      />

      {entry.localeFallback ? (
        <p className="mt-2 font-mono text-xs opacity-60">
          Translation pending. Showing English.
        </p>
      ) : null}

      {definitionParagraphs.length > 0 && (
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
              <Visualization vizKey={visualization!} />
            </SceneCard>
          )}

          {hasIllustration && (
            <SceneCard caption={displayTerm} className="w-full">
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={illustration!}
                  alt={t("illustrationAlt", { term: displayTerm })}
                  width={560}
                  height={360}
                  className={`h-auto max-w-full${illustration!.endsWith(".svg") ? " dictionary-illustration" : ""}`}
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
                    className="flex flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)]"
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
                      <figcaption className="border-t border-[var(--color-fg-4)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
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
      )}

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

      <div className="mt-12 border-t border-[var(--color-fg-4)] pt-8">
        <Link
          href="/dictionary"
          className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-cyan)]"
        >
          {t("backLink")}
        </Link>
      </div>
    </ArticleLayout>
  );
}
