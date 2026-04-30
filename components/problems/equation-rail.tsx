import Link from "next/link";
import { getEquation } from "@/lib/content/equations";

interface Props {
  locale: string;
  equationSlugs: readonly string[];
}

export function EquationRail({ locale, equationSlugs }: Props) {
  if (equationSlugs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 my-4">
      <span className="text-xs text-neutral-500 self-center">Linked equations:</span>
      {equationSlugs.map((slug) => {
        const eq = getEquation(slug);
        if (!eq) return null;
        return (
          <Link
            key={slug}
            href={`/${locale}/equations/${slug}`}
            className="text-xs px-2 py-1 rounded border border-neutral-700 hover:border-cyan-700 font-mono"
          >
            {eq.latex}
          </Link>
        );
      })}
    </div>
  );
}
