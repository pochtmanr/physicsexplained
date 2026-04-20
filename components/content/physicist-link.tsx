import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { getContentEntry } from "@/lib/content/fetch";
import { HoverCard } from "./hover-card";

interface PhysicistLinkProps {
  slug: string;
  children?: ReactNode;
}

export async function PhysicistLink({ slug, children }: PhysicistLinkProps) {
  const locale = await getLocale();
  const entry = await getContentEntry("physicist", slug, locale);
  if (!entry) {
    throw new Error(`PhysicistLink: unknown slug "${slug}"`);
  }

  const name = entry.title;
  const oneLiner = entry.subtitle ?? "";
  const shortName =
    typeof entry.meta.shortName === "string" ? entry.meta.shortName : name;
  const born = typeof entry.meta.born === "string" ? entry.meta.born : "";
  const died = typeof entry.meta.died === "string" ? entry.meta.died : "";
  const nationality =
    typeof entry.meta.nationality === "string" ? entry.meta.nationality : "";

  const lifespan = [born, died].filter(Boolean).join(" – ");

  const preview = (
    <span className="block">
      <span className="block font-semibold text-[var(--color-fg-0)]">
        {name}
      </span>
      {(lifespan || nationality) && (
        <span className="block mt-0.5 text-[var(--color-fg-3)] text-xs">
          {[lifespan, nationality].filter(Boolean).join(" · ")}
        </span>
      )}
      {oneLiner && (
        <span className="block mt-1 text-[var(--color-fg-1)]">
          {oneLiner}
        </span>
      )}
    </span>
  );

  return (
    <HoverCard content={preview}>
      <Link
        href={`/physicists/${slug}`}
        className="underline decoration-[var(--color-fg-4)] underline-offset-[3px] transition-colors duration-[180ms] ease-out hover:text-[var(--color-cyan)] hover:decoration-[var(--color-cyan)]"
      >
        {children ?? shortName}
      </Link>
    </HoverCard>
  );
}
