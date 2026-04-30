import Link from "next/link";
import { getEquation } from "@/lib/content/equations";

interface Props {
  locale: string;
  equationSlugs: readonly string[];
}

export function EquationRail({ locale, equationSlugs }: Props) {
  if (equationSlugs.length === 0) return null;
  return (
    <div className="my-8 flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        Linked equations:
      </span>
      {equationSlugs.map((slug) => {
        const eq = getEquation(slug);
        if (!eq) return null;
        return (
          <Link
            key={slug}
            href={`/${locale}/equations/${slug}`}
            className="border border-[var(--color-fg-4)] px-2 py-1 font-mono text-xs text-[var(--color-fg-1)] transition-[border-color,color] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            {eq.latex}
          </Link>
        );
      })}
    </div>
  );
}
