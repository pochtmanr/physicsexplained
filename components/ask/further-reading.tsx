"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { GlossaryCard } from "@/lib/ask/glossary-card";

export function FurtherReading({ slugs, locale }: { slugs: string[]; locale: string }) {
  const [cards, setCards] = useState<GlossaryCard[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (slugs.length === 0) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ask/glossary-batch", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs, locale }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const body = (await res.json()) as { cards: GlossaryCard[] };
        setCards(body.cards);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setErr(true);
      }
    })();
    return () => ac.abort();
  }, [slugs.join("|"), locale]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err || !cards || cards.length === 0) return null;

  return (
    <section className="mt-6 pt-4 border-t border-[var(--color-fg-4)]/40">
      <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">
        Further reading
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {cards.map((c) => (
          <GlossaryCardView key={c.slug} card={c} locale={locale} />
        ))}
      </div>
    </section>
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
