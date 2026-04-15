import Link from "next/link";
import { User, Layers, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

type AsideLinkType = "physicist" | "topic" | "term";

export interface AsideLink {
  type: AsideLinkType;
  label: string;
  sublabel?: string;
  href: string;
}

const SECTION_ICONS: Record<AsideLinkType, LucideIcon> = {
  physicist: User,
  topic: Layers,
  term: BookOpen,
};

const TYPE_ORDER: AsideLinkType[] = ["physicist", "topic", "term"];

export async function AsideLinks({ links }: { links: AsideLink[] }) {
  const t = await getTranslations("common.aside");
  const sectionTitles: Record<AsideLinkType, string> = {
    physicist: t("physicists"),
    topic: t("topics"),
    term: t("terms"),
  };

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: links.filter((l) => l.type === type),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.type}>
            <h3 className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              {(() => { const Icon = SECTION_ICONS[group.type]; return <Icon aria-hidden="true" size={12} strokeWidth={1.5} />; })()}
              {sectionTitles[group.type]}
            </h3>
            <ul className="space-y-1">
              {group.items.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group block border-s-2 border-transparent py-1.5 ps-3 transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
                  >
                    <span className="block text-sm leading-tight text-[var(--color-fg-1)] transition-colors group-hover:text-[var(--color-cyan)]">
                      {link.label}
                    </span>
                    {link.sublabel && (
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-2)]">
                        {link.sublabel}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
