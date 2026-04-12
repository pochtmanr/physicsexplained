import Link from "next/link";
import { NavBranchMenu } from "./nav-branch-menu";
import { NavBreadcrumbs } from "./nav-breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
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
          <div className="hidden md:flex">
            <NavBreadcrumbs />
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <NavBranchMenu />
          <ThemeToggle />
          <div className="hidden font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)] md:block">
            v0.5
          </div>
        </div>
      </div>
    </nav>
  );
}
