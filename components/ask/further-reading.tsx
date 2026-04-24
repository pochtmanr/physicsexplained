"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  GlossaryCard,
  PhysicistCard,
  SourcesPayload,
  TopicCard,
} from "@/lib/ask/glossary-card";

interface SourcesInput {
  topicSlugs: string[];
  physicistSlugs: string[];
  glossarySlugs: string[];
}

export function FurtherReading({
  topicSlugs,
  physicistSlugs,
  glossarySlugs,
  locale,
}: SourcesInput & { locale: string }) {
  const [sources, setSources] = useState<SourcesPayload | null>(null);
  const [err, setErr] = useState(false);

  const total = topicSlugs.length + physicistSlugs.length + glossarySlugs.length;

  useEffect(() => {
    if (total === 0) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ask/glossary-batch", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topics: topicSlugs,
            physicists: physicistSlugs,
            glossary: glossarySlugs,
            locale,
          }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const body = (await res.json()) as { sources?: SourcesPayload };
        if (!body.sources) throw new Error("missing sources");
        setSources(body.sources);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setErr(true);
      }
    })();
    return () => ac.abort();
  }, [topicSlugs.join("|"), physicistSlugs.join("|"), glossarySlugs.join("|"), locale, total]);

  if (err || !sources) return null;
  const rendered =
    sources.topics.length + sources.physicists.length + sources.glossary.length;
  if (rendered === 0) return null;

  return (
    <section className="mt-6 pt-4 border-t border-[var(--color-fg-4)]/40">
      <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">
        Sources
      </h4>
      {sources.topics.length > 0 && (
        <SourceGroup label="Topics">
          {sources.topics.map((t) => (
            <TopicOrPhysicistCardView
              key={`t-${t.slug}`}
              card={t}
              href={`/${locale}/${t.slug}`}
              kindLabel="topic"
            />
          ))}
        </SourceGroup>
      )}
      {sources.physicists.length > 0 && (
        <SourceGroup label="Physicists">
          {sources.physicists.map((p) => (
            <TopicOrPhysicistCardView
              key={`p-${p.slug}`}
              card={p}
              href={`/${locale}/physicists/${p.slug}`}
              kindLabel="physicist"
            />
          ))}
        </SourceGroup>
      )}
      {sources.glossary.length > 0 && (
        <SourceGroup label="Glossary">
          {sources.glossary.map((c) => (
            <GlossaryCardView key={`g-${c.slug}`} card={c} locale={locale} />
          ))}
        </SourceGroup>
      )}
    </section>
  );
}

function SourceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-3)] mb-2">
        {label}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function TopicOrPhysicistCardView({
  card, href, kindLabel,
}: {
  card: TopicCard | PhysicistCard;
  href: string;
  kindLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group block border border-[var(--color-fg-4)]/40 bg-[var(--color-fg-4)]/5 hover:bg-[var(--color-fg-4)]/15 hover:border-[var(--color-cyan-dim)]/60 transition-colors px-3.5 py-3 no-underline"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-[14px] leading-snug text-[var(--color-fg-0)] group-hover:text-[var(--color-cyan)]">
          {card.title}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] pt-1 shrink-0">
          {kindLabel}
        </span>
      </div>
      {card.subtitle && (
        <p className="text-[13px] leading-relaxed text-[var(--color-fg-1)] line-clamp-3">
          {card.subtitle}
        </p>
      )}
    </Link>
  );
}

function GlossaryCardView({ card, locale }: { card: GlossaryCard; locale: string }) {
  const href = `/${locale}/dictionary/${card.slug}`;
  return (
    <Link
      href={href}
      className="group block border border-[var(--color-fg-4)]/40 bg-[var(--color-fg-4)]/5 hover:bg-[var(--color-fg-4)]/15 hover:border-[var(--color-cyan-dim)]/60 transition-colors px-3.5 py-3 no-underline"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-[14px] leading-snug text-[var(--color-fg-0)] group-hover:text-[var(--color-cyan)]">
          {card.term}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] pt-1 shrink-0">
          {card.category}
        </span>
      </div>
      {card.shortDefinition && (
        <p className="text-[13px] leading-relaxed text-[var(--color-fg-1)] line-clamp-3">
          {card.shortDefinition}
        </p>
      )}
      {(card.relatedTopics.length > 0 || card.relatedPhysicists.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--color-fg-3)]">
          {card.relatedTopics.slice(0, 3).map((rt) => (
            <span key={rt.topicSlug} className="whitespace-nowrap">
              ↳ {rt.title ?? rt.topicSlug}
            </span>
          ))}
          {card.relatedPhysicists.slice(0, 2).map((rp) => (
            <span key={rp.slug} className="whitespace-nowrap italic">
              · {rp.title ?? rp.slug}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
