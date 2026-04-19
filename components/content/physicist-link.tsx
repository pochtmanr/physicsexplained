import Link from "next/link";
import type { ReactNode } from "react";
import { getLocalizedPhysicist } from "@/lib/content/physicists";
import { HoverCard } from "./hover-card";

interface PhysicistLinkProps {
  slug: string;
  children?: ReactNode;
}

export async function PhysicistLink({ slug, children }: PhysicistLinkProps) {
  const physicist = await getLocalizedPhysicist(slug);
  if (!physicist) {
    throw new Error(`PhysicistLink: unknown slug "${slug}"`);
  }

  const lifespan = [physicist.born, physicist.died].filter(Boolean).join(" – ");

  const preview = (
    <span className="block">
      <span className="block font-semibold text-[var(--color-fg-0)]">
        {physicist.name}
      </span>
      {(lifespan || physicist.nationality) && (
        <span className="block mt-0.5 text-[var(--color-fg-3)] text-xs">
          {[lifespan, physicist.nationality].filter(Boolean).join(" · ")}
        </span>
      )}
      {physicist.oneLiner && (
        <span className="block mt-1 text-[var(--color-fg-1)]">
          {physicist.oneLiner}
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
        {children ?? physicist.shortName}
      </Link>
    </HoverCard>
  );
}
