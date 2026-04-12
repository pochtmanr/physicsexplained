import Link from "next/link";
import { User, BookOpen } from "lucide-react";
import { NavBranchMenu } from "./nav-branch-menu";
import { ThemeToggle } from "./theme-toggle";
import { SearchTrigger } from "@/components/search/search-trigger";
import { SearchCommand } from "@/components/search/search-command";
import { WIDE_CONTAINER } from "@/lib/layout";

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--color-fg-3)]/40 bg-[var(--color-bg-0)]/80 backdrop-blur-sm">
      <div
        className={`${WIDE_CONTAINER} flex items-center justify-between gap-4 py-4 md:py-5`}
      >
        <div className="flex min-w-0 items-center">
          <Link
            href="/"
            aria-label="Physics.explained — home"
            className="font-display text-base leading-none tracking-tight whitespace-nowrap md:text-lg"
          >
            <span className="text-[var(--color-fg-0)] font-semibold">Physics.</span>
            <span className="text-[var(--color-cyan)] font-semibold">explained</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <NavBranchMenu />
          <Link
            href="/physicists"
            className="hidden items-center gap-2 border border-[var(--color-fg-3)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] md:inline-flex md:px-3"
          >
            <User aria-hidden="true" size={14} strokeWidth={1.5} />
            <span className="hidden md:inline">PHYSICISTS</span>
          </Link>
          <Link
            href="/dictionary"
            className="hidden items-center gap-2 border border-[var(--color-fg-3)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] md:inline-flex md:px-3"
          >
            <BookOpen aria-hidden="true" size={14} strokeWidth={1.5} />
            <span className="hidden md:inline">DICTIONARY</span>
          </Link>
          <SearchTrigger />
          <ThemeToggle />
        </div>
      </div>
      <SearchCommand />
    </nav>
  );
}
