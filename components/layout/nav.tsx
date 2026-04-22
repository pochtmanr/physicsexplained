import Link from "next/link";
import { User, BookOpen, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "./logo";
import { NavBranchMenu } from "./nav-branch-menu";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";

import { SearchTrigger } from "@/components/search/search-trigger";
import { SearchCommand } from "@/components/search/search-command";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function Nav() {
  const t = await getTranslations("common.nav");

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]">
      <div
        className={`${WIDE_CONTAINER} flex h-12 items-center justify-between gap-4 md:h-14`}
      >
        <div className="flex min-w-0 items-center">
          <Link
            href="/"
            aria-label={t("homeAriaLabel")}
            className="inline-flex items-center gap-2.5 font-display text-base leading-none tracking-tight whitespace-nowrap md:text-lg"
          >
            <Logo className="h-5 w-auto md:h-6" />
            <div>
              <span className="text-[var(--color-fg-0)] font-semibold">Physics.</span>
              <span className="text-[var(--color-cyan)] font-semibold">explained</span>
            </div>
          </Link>
        </div>
        <div className="hidden items-center gap-2 md:flex md:gap-3">
          <NavBranchMenu />
          <Link
            href="/physicists"
            className="nav-link inline-flex items-center gap-2 border border-[var(--color-fg-4)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
          >
            <User aria-hidden="true" size={14} strokeWidth={1.5} />
            <span>{t("physicists")}</span>
          </Link>
          <Link
            href="/dictionary"
            className="nav-link inline-flex items-center gap-2 border border-[var(--color-fg-4)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
          >
            <BookOpen aria-hidden="true" size={14} strokeWidth={1.5} />
            <span>{t("dictionary")}</span>
          </Link>
          <Link
            href="/ask"
            className="nav-link inline-flex items-center gap-2 border border-[var(--color-cyan-dim)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10"
          >
            <Sparkles aria-hidden="true" size={14} strokeWidth={1.5} />
            <span>Ask</span>
          </Link>
          <SearchTrigger />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <MobileNav />
      </div>
      <SearchCommand />
    </nav>
  );
}
