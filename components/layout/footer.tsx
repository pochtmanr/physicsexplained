import Link from "next/link";
import { GitBranch, User, BookOpen } from "lucide-react";
import { WIDE_CONTAINER } from "@/lib/layout";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const NAV_LINKS = [
  { href: "/#branches", label: "Branches", icon: GitBranch },
  { href: "/physicists", label: "Physicists", icon: User },
  { href: "/dictionary", label: "Dictionary", icon: BookOpen },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
] as const;

const navLinkClass =
  "nav-link inline-flex items-center gap-2 border border-[var(--color-fg-3)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-fg-3)]/40 mt-32">
      <div className={`${WIDE_CONTAINER} py-16`}>
        {/* Logo */}
        <Link href="/" className="inline-block font-display text-xl">
          <span className="text-[var(--color-fg-0)] font-semibold">
            Physics.
          </span>
          <span className="text-[var(--color-cyan)] font-semibold">
            explained
          </span>
        </Link>

        {/* Nav + Newsletter row */}
        <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Navigation links */}
          <nav className="flex flex-wrap gap-3" aria-label="Footer navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={navLinkClass}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Newsletter */}
          <NewsletterForm />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--color-fg-3)]/40 mt-12 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Legal links */}
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-mono text-xs text-[var(--color-fg-2)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-fg-1)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="font-mono text-xs text-[var(--color-fg-2)]">
            &copy; 2026 Simnetiq Ltd
          </div>
        </div>
      </div>
    </footer>
  );
}
