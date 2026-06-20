import Link from "next/link";
import { User, BookOpen, Sparkles, Gamepad2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "./logo";
import { NavBranchMenu } from "./nav-branch-menu";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

import { SearchTrigger } from "@/components/search/search-trigger";
import { SearchCommand } from "@/components/search/search-command";
import { buttonVariants } from "@/components/ui/button";

export async function Nav() {
  const t = await getTranslations("common.nav");

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]">
      <div
        className="w-full px-6 md:px-8 flex h-12 items-center justify-between gap-4 md:h-14"
      >
        <div className="flex min-w-0 items-center">
          <Link
            href="/"
            aria-label={t("homeAriaLabel")}
            className="inline-flex items-center gap-1 font-display text-base leading-none tracking-tight whitespace-nowrap md:text-lg"
          >
            <Logo className="h-4 w-auto md:h-5" />
            <div>
              <span className="text-[var(--color-fg-0)]">Physics.</span>
              <span className="text-[var(--color-cyan)]">explained</span>
            </div>
          </Link>
        </div>
        <div className="hidden items-center gap-2 min-[1201px]:flex min-[1201px]:gap-3">
          <NavBranchMenu />
          <Link
            href="/physicists"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
          >
            <User aria-hidden="true" size={14} strokeWidth={1.5} />
            <span>{t("physicists")}</span>
          </Link>
          <Link
            href="/dictionary"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
          >
            <BookOpen aria-hidden="true" size={14} strokeWidth={1.5} />
            <span>{t("dictionary")}</span>
          </Link>
          <Link
            href="/play"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
          >
            <Gamepad2 aria-hidden="true" size={14} strokeWidth={1.5} />
            <span>{t("play")}</span>
          </Link>
          <SearchTrigger />
          <ThemeToggle />
          <Link
            href="/ask"
            className={buttonVariants({ variant: "primary", size: "sm", className: "nav-link" })}
          >
            <Sparkles aria-hidden="true" size={14} strokeWidth={1.5} className="text-white" />
            <span>Ask</span>
          </Link>
        </div>
        <MobileNav />
      </div>
      <SearchCommand />
    </nav>
  );
}
